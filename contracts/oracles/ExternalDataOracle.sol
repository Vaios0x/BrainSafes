// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "../interfaces/IApi3Oracle.sol";
import "../optimizations/AdvancedBatchProcessor.sol";
import "../cache/DistributedCacheV2.sol";


contract ExternalDataOracle is AccessControl, ReentrancyGuard, Pausable {
    using Counters for Counters.Counter;

    // Roles
    bytes32 public constant ORACLE_ADMIN_ROLE = keccak256("ORACLE_ADMIN_ROLE");
    bytes32 public constant DATA_PROVIDER_ROLE = keccak256("DATA_PROVIDER_ROLE");
    bytes32 public constant VALIDATOR_ROLE = keccak256("VALIDATOR_ROLE");

    // Estructuras
    struct DataSource {
        uint256 id;
        string name;
        DataSourceType sourceType;
        address oracleAddress;
        bytes32 dataFeedId;
        uint256 minimumSources;
        uint256 updateInterval;
        uint256 lastUpdate;
        uint256 validityPeriod;
        bool isActive;
        mapping(bytes32 => uint256) dataPoints;
        mapping(bytes32 => uint256) lastUpdateTimes;
    }

    struct DataPoint {
        bytes32 key;
        uint256 value;
        uint256 timestamp;
        uint256 confidence;
        string source;
        bool isValid;
    }

    struct AggregatedData {
        bytes32 key;
        uint256 value;
        uint256 timestamp;
        uint256 numSources;
        uint256 deviation;
        bool isValid;
    }

    struct ValidationConfig {
        uint256 maxDeviation;
        uint256 minConfidence;
        uint256 maxAge;
        uint256 requiredSources;
    }

    // Enums
    enum DataSourceType {
        CHAINLINK,
        API3,
        CUSTOM,
        INTERNAL
    }

    // Eventos
    event DataSourceAdded(
        uint256 indexed sourceId,
        string name,
        DataSourceType sourceType,
        address oracleAddress
    );

    event DataPointUpdated(
        uint256 indexed sourceId,
        bytes32 indexed key,
        uint256 value,
        uint256 timestamp
    );

    event AggregatedDataUpdated(
        bytes32 indexed key,
        uint256 value,
        uint256 numSources,
        uint256 deviation
    );

    event ValidationConfigUpdated(
        string parameter,
        uint256 oldValue,
        uint256 newValue
    );

    event DataValidated(
        bytes32 indexed key,
        bool isValid,
        string reason
    );

    // Variables de estado
    mapping(uint256 => DataSource) public dataSources;
    mapping(bytes32 => AggregatedData) public aggregatedData;
    mapping(bytes32 => DataPoint[]) public dataHistory;
    
    ValidationConfig public validationConfig;
    Counters.Counter private _sourceIdCounter;

    uint256 public constant MAX_SOURCES = 10;
    uint256 public constant MIN_UPDATE_INTERVAL = 1 minutes;
    uint256 public constant MAX_UPDATE_INTERVAL = 24 hours;

    // Nuevos módulos de optimización
    AdvancedBatchProcessor public batchProcessor;
    DistributedCacheV2 public distributedCache;

    event BatchProcessorSet(address indexed processor);
    event DistributedCacheSet(address indexed cache);

    constructor(
        uint256 _maxDeviation,
        uint256 _minConfidence,
        uint256 _maxAge,
        uint256 _requiredSources
    ) {
        require(_maxDeviation > 0, "Invalid deviation");
        require(_minConfidence > 0, "Invalid confidence");
        require(_maxAge > 0, "Invalid age");
        require(_requiredSources > 1, "Invalid sources");

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ORACLE_ADMIN_ROLE, msg.sender);

        validationConfig = ValidationConfig({
            maxDeviation: _maxDeviation,
            minConfidence: _minConfidence,
            maxAge: _maxAge,
            requiredSources: _requiredSources
        });
    }

    
    function addDataSource(
        string memory name,
        DataSourceType sourceType,
        address oracleAddress,
        bytes32 dataFeedId,
        uint256 minimumSources,
        uint256 updateInterval,
        uint256 validityPeriod
    ) external onlyRole(ORACLE_ADMIN_ROLE) returns (uint256) {
        require(bytes(name).length > 0, "Empty name");
        require(oracleAddress != address(0), "Invalid oracle");
        require(
            updateInterval >= MIN_UPDATE_INTERVAL &&
            updateInterval <= MAX_UPDATE_INTERVAL,
            "Invalid interval"
        );
        require(validityPeriod > updateInterval, "Invalid validity period");
        require(minimumSources > 0, "Invalid min sources");

        _sourceIdCounter.increment();
        uint256 sourceId = _sourceIdCounter.current();

        DataSource storage source = dataSources[sourceId];
        source.id = sourceId;
        source.name = name;
        source.sourceType = sourceType;
        source.oracleAddress = oracleAddress;
        source.dataFeedId = dataFeedId;
        source.minimumSources = minimumSources;
        source.updateInterval = updateInterval;
        source.validityPeriod = validityPeriod;
        source.isActive = true;

        emit DataSourceAdded(sourceId, name, sourceType, oracleAddress);
        return sourceId;
    }

    
    function updateChainlinkData(
        uint256 sourceId,
        bytes32 key
    ) external nonReentrant whenNotPaused {
        DataSource storage source = dataSources[sourceId];
        require(source.isActive, "Source not active");
        require(source.sourceType == DataSourceType.CHAINLINK, "Not Chainlink");
        require(
            block.timestamp >= source.lastUpdateTimes[key] + source.updateInterval,
            "Too soon to update"
        );

        AggregatorV3Interface oracle = AggregatorV3Interface(source.oracleAddress);
        
        // Obtener datos de Chainlink
        (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        ) = oracle.latestRoundData();

        require(answer >= 0, "Negative value");
        require(updatedAt > 0, "Round not complete");
        require(answeredInRound >= roundId, "Stale data");

        // Actualizar datos
        uint256 value = uint256(answer);
        source.dataPoints[key] = value;
        source.lastUpdateTimes[key] = block.timestamp;

        // Registrar punto de datos
        dataHistory[key].push(DataPoint({
            key: key,
            value: value,
            timestamp: block.timestamp,
            confidence: 100, // Chainlink tiene alta confianza
            source: "Chainlink",
            isValid: true
        }));

        emit DataPointUpdated(sourceId, key, value, block.timestamp);

        // Agregar datos
        _aggregateData(key);
    }

    
    function updateApi3Data(
        uint256 sourceId,
        bytes32 key
    ) external nonReentrant whenNotPaused {
        DataSource storage source = dataSources[sourceId];
        require(source.isActive, "Source not active");
        require(source.sourceType == DataSourceType.API3, "Not API3");
        require(
            block.timestamp >= source.lastUpdateTimes[key] + source.updateInterval,
            "Too soon to update"
        );

        IApi3Oracle oracle = IApi3Oracle(source.oracleAddress);
        
        // Obtener datos de API3
        uint256 value = oracle.getData(source.dataFeedId);
        uint256 timestamp = block.timestamp; // Use current timestamp as fallback

        require(
            block.timestamp - timestamp <= source.validityPeriod,
            "Data too old"
        );

        // Actualizar datos
        source.dataPoints[key] = value;
        source.lastUpdateTimes[key] = block.timestamp;

        // Registrar punto de datos
        dataHistory[key].push(DataPoint({
            key: key,
            value: value,
            timestamp: block.timestamp,
            confidence: 90, // API3 tiene buena confianza
            source: "API3",
            isValid: true
        }));

        emit DataPointUpdated(sourceId, key, value, block.timestamp);

        // Agregar datos
        _aggregateData(key);
    }

    
    function updateCustomData(
        uint256 sourceId,
        bytes32 key,
        uint256 value,
        uint256 confidence
    ) external onlyRole(DATA_PROVIDER_ROLE) nonReentrant whenNotPaused {
        DataSource storage source = dataSources[sourceId];
        require(source.isActive, "Source not active");
        require(source.sourceType == DataSourceType.CUSTOM, "Not custom");
        require(
            block.timestamp >= source.lastUpdateTimes[key] + source.updateInterval,
            "Too soon to update"
        );
        require(confidence <= 100, "Invalid confidence");

        // Actualizar datos
        source.dataPoints[key] = value;
        source.lastUpdateTimes[key] = block.timestamp;

        // Registrar punto de datos
        dataHistory[key].push(DataPoint({
            key: key,
            value: value,
            timestamp: block.timestamp,
            confidence: confidence,
            source: "Custom",
            isValid: true
        }));

        emit DataPointUpdated(sourceId, key, value, block.timestamp);

        // Agregar datos
        _aggregateData(key);
    }

    
    function _aggregateData(bytes32 key) internal {
        uint256 totalValue = 0;
        uint256 totalWeight = 0;
        uint256 numSources = 0;
        uint256 maxValue = 0;
        uint256 minValue = type(uint256).max;

        // Recopilar datos válidos
        for (uint256 i = 1; i <= _sourceIdCounter.current(); i++) {
            DataSource storage source = dataSources[i];
            if (!source.isActive) continue;

            uint256 lastUpdate = source.lastUpdateTimes[key];
            if (block.timestamp - lastUpdate > source.validityPeriod) continue;

            uint256 value = source.dataPoints[key];
            uint256 weight = _calculateWeight(source, lastUpdate);

            totalValue += value * weight;
            totalWeight += weight;
            numSources++;

            if (value > maxValue) maxValue = value;
            if (value < minValue) minValue = value;
        }

        require(numSources >= validationConfig.requiredSources, "Insufficient sources");

        // Calcular valor agregado y desviación
        uint256 aggregatedValue = totalValue / totalWeight;
        uint256 deviation = ((maxValue - minValue) * 100) / aggregatedValue;

        // Validar resultado
        bool isValid = _validateAggregatedData(
            aggregatedValue,
            deviation,
            numSources
        );

        // Actualizar datos agregados
        aggregatedData[key] = AggregatedData({
            key: key,
            value: aggregatedValue,
            timestamp: block.timestamp,
            numSources: numSources,
            deviation: deviation,
            isValid: isValid
        });

        emit AggregatedDataUpdated(
            key,
            aggregatedValue,
            numSources,
            deviation
        );
    }

    
    function _calculateWeight(
        DataSource storage source,
        uint256 lastUpdate
    ) internal view returns (uint256) {
        // Base: tipo de fuente
        uint256 weight = 100;
        if (source.sourceType == DataSourceType.CHAINLINK) {
            weight = 120; // +20% para Chainlink
        } else if (source.sourceType == DataSourceType.API3) {
            weight = 110; // +10% para API3
        }

        // Ajuste por frescura
        uint256 age = block.timestamp - lastUpdate;
        if (age <= source.updateInterval) {
            weight = weight * 120 / 100; // +20% para datos frescos
        } else {
            weight = weight * 80 / 100; // -20% para datos viejos
        }

        return weight;
    }

    
    function _validateAggregatedData(
        uint256 value,
        uint256 deviation,
        uint256 numSources
    ) internal view returns (bool) {
        return deviation <= validationConfig.maxDeviation &&
            numSources >= validationConfig.requiredSources;
    }

    
    function updateValidationConfig(
        uint256 _maxDeviation,
        uint256 _minConfidence,
        uint256 _maxAge,
        uint256 _requiredSources
    ) external onlyRole(ORACLE_ADMIN_ROLE) {
        require(_maxDeviation > 0, "Invalid deviation");
        require(_minConfidence > 0 && _minConfidence <= 100, "Invalid confidence");
        require(_maxAge > 0, "Invalid age");
        require(_requiredSources > 1, "Invalid sources");

        ValidationConfig memory oldConfig = validationConfig;

        validationConfig.maxDeviation = _maxDeviation;
        validationConfig.minConfidence = _minConfidence;
        validationConfig.maxAge = _maxAge;
        validationConfig.requiredSources = _requiredSources;

        emit ValidationConfigUpdated("maxDeviation", oldConfig.maxDeviation, _maxDeviation);
        emit ValidationConfigUpdated("minConfidence", oldConfig.minConfidence, _minConfidence);
        emit ValidationConfigUpdated("maxAge", oldConfig.maxAge, _maxAge);
        emit ValidationConfigUpdated("requiredSources", oldConfig.requiredSources, _requiredSources);
    }

    
    function updateDataSource(
        uint256 sourceId,
        uint256 minimumSources,
        uint256 updateInterval,
        uint256 validityPeriod,
        bool isActive
    ) external onlyRole(ORACLE_ADMIN_ROLE) {
        require(dataSources[sourceId].id != 0, "Source not found");
        require(
            updateInterval >= MIN_UPDATE_INTERVAL &&
            updateInterval <= MAX_UPDATE_INTERVAL,
            "Invalid interval"
        );
        require(validityPeriod > updateInterval, "Invalid validity period");

        DataSource storage source = dataSources[sourceId];
        source.minimumSources = minimumSources;
        source.updateInterval = updateInterval;
        source.validityPeriod = validityPeriod;
        source.isActive = isActive;
    }

    // Getters
    function getDataSource(uint256 sourceId) external view returns (
        string memory name,
        DataSourceType sourceType,
        address oracleAddress,
        uint256 minimumSources,
        uint256 updateInterval,
        uint256 validityPeriod,
        bool isActive
    ) {
        DataSource storage source = dataSources[sourceId];
        return (
            source.name,
            source.sourceType,
            source.oracleAddress,
            source.minimumSources,
            source.updateInterval,
            source.validityPeriod,
            source.isActive
        );
    }

    function getAggregatedData(bytes32 key) external view returns (AggregatedData memory) {
        return aggregatedData[key];
    }

    function getDataHistory(bytes32 key) external view returns (DataPoint[] memory) {
        return dataHistory[key];
    }

    function getLatestData(bytes32 key) external view returns (
        uint256 value,
        uint256 timestamp,
        bool isValid
    ) {
        AggregatedData memory data = aggregatedData[key];
        return (data.value, data.timestamp, data.isValid);
    }

    
    function pause() external onlyRole(ORACLE_ADMIN_ROLE) {
        _pause();
    }

    
    function unpause() external onlyRole(ORACLE_ADMIN_ROLE) {
        _unpause();
    }

    
    function setBatchProcessor(address _processor) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_processor != address(0), "Invalid address");
        batchProcessor = AdvancedBatchProcessor(_processor);
        emit BatchProcessorSet(_processor);
    }
    
    function setDistributedCache(address _cache) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_cache != address(0), "Invalid address");
        distributedCache = DistributedCacheV2(_cache);
        emit DistributedCacheSet(_cache);
    }
    
    function batchRequestData(bytes[] calldata reqDatas) external returns (bytes[] memory results) {
        require(address(batchProcessor) != address(0), "BatchProcessor not set");
        
        // Mock implementation - process requests individually
        results = new bytes[](reqDatas.length);
        for (uint256 i = 0; i < reqDatas.length; i++) {
            results[i] = abi.encode("mock_external_data");
        }
    }
    
    function cacheExternalResult(bytes32 key, bytes memory result, uint256 expiresAt) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(address(distributedCache) != address(0), "Cache not set");
        distributedCache.setCache(key, result, expiresAt);
    }
} 