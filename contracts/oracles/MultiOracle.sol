// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "../interfaces/IApi3Oracle.sol";
import "../interfaces/ISupraOracle.sol";
import "../interfaces/IChronicleOracle.sol";
import "../optimizations/AdvancedBatchProcessor.sol";
import "../cache/DistributedCacheV2.sol";


contract MultiOracle is AccessControl, ReentrancyGuard, Pausable {
    bytes32 public constant ORACLE_MANAGER_ROLE = keccak256("ORACLE_MANAGER_ROLE");
    
    // Interfaces de oráculos
    AggregatorV3Interface public chainlinkOracle;
    IApi3Oracle public api3Oracle;
    ISupraOracle public supraOracle;
    IChronicleOracle public chronicleOracle;

    // Nuevos módulos de optimización
    AdvancedBatchProcessor public batchProcessor;
    DistributedCacheV2 public distributedCache;

    // Configuración
    uint256 public constant MIN_RESPONSES = 2;
    uint256 public constant MAX_DEVIATION = 5; // 5% máximo de desviación
    uint256 public constant RESPONSE_TIMEOUT = 30 minutes;

    // Estructuras
    struct OracleResponse {
        uint256 value;
        uint256 timestamp;
        bool valid;
    }

    struct AggregatedData {
        uint256 value;
        uint256 numResponses;
        uint256 timestamp;
    }

    // Mappings
    mapping(bytes32 => AggregatedData) public aggregatedData;
    mapping(address => bool) public authorizedOracles;
    mapping(bytes32 => mapping(address => OracleResponse)) public oracleResponses;

    // Eventos
    event OracleResponseReceived(address oracle, bytes32 dataKey, uint256 value);
    event DataAggregated(bytes32 dataKey, uint256 value, uint256 numResponses);
    event OracleAuthorized(address oracle, bool authorized);
    event BatchProcessorSet(address indexed processor);
    event DistributedCacheSet(address indexed cache);

    constructor(
        address _chainlinkOracle,
        address _api3Oracle,
        address _supraOracle,
        address _chronicleOracle
    ) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ORACLE_MANAGER_ROLE, msg.sender);

        chainlinkOracle = AggregatorV3Interface(_chainlinkOracle);
        api3Oracle = IApi3Oracle(_api3Oracle);
        supraOracle = ISupraOracle(_supraOracle);
        chronicleOracle = IChronicleOracle(_chronicleOracle);

        authorizedOracles[_chainlinkOracle] = true;
        authorizedOracles[_api3Oracle] = true;
        authorizedOracles[_supraOracle] = true;
        authorizedOracles[_chronicleOracle] = true;

        emit OracleAuthorized(_chainlinkOracle, true);
        emit OracleAuthorized(_api3Oracle, true);
        emit OracleAuthorized(_supraOracle, true);
        emit OracleAuthorized(_chronicleOracle, true);
    }

    
    function getAggregatedData(bytes32 dataKey) external view returns (
        uint256 value,
        uint256 numResponses,
        uint256 timestamp
    ) {
        AggregatedData memory data = aggregatedData[dataKey];
        require(data.numResponses >= MIN_RESPONSES, "Insufficient oracle responses");
        require(block.timestamp - data.timestamp <= RESPONSE_TIMEOUT, "Data too old");
        
        return (data.value, data.numResponses, data.timestamp);
    }

    
    function getTokenPrice(address token) external view returns (uint256) {
        (, int256 price,,,) = chainlinkOracle.latestRoundData();
        require(price > 0, "Invalid price");
        return uint256(price);
    }

    
    function getEducationalData(bytes32 dataKey) external view returns (bytes memory) {
        uint256 data = api3Oracle.getData(dataKey);
        return abi.encode(data);
    }

    
    function getHistoricalData(bytes32 dataKey, uint256 timestamp) external view returns (uint256) {
        // Simplified historical data - in production would use proper Chronicle method
        uint256 value = 50; // Mock historical value
        return value;
    }

    
    function receiveOracleResponse(
        address oracle,
        bytes32 dataKey,
        uint256 value
    ) external onlyRole(ORACLE_MANAGER_ROLE) {
        require(authorizedOracles[oracle], "Unauthorized oracle");
        
        oracleResponses[dataKey][oracle] = OracleResponse({
            value: value,
            timestamp: block.timestamp,
            valid: true
        });

        emit OracleResponseReceived(oracle, dataKey, value);
        
        _aggregateData(dataKey);
    }

    
    function _aggregateData(bytes32 dataKey) internal {
        uint256 totalValue = 0;
        uint256 numValid = 0;
        uint256[] memory values = new uint256[](4); // Para los 4 oráculos
        
        // Recolectar valores válidos
        if (oracleResponses[dataKey][address(chainlinkOracle)].valid) {
            values[numValid] = oracleResponses[dataKey][address(chainlinkOracle)].value;
            numValid++;
        }
        if (oracleResponses[dataKey][address(api3Oracle)].valid) {
            values[numValid] = oracleResponses[dataKey][address(api3Oracle)].value;
            numValid++;
        }
        if (oracleResponses[dataKey][address(supraOracle)].valid) {
            values[numValid] = oracleResponses[dataKey][address(supraOracle)].value;
            numValid++;
        }
        if (oracleResponses[dataKey][address(chronicleOracle)].valid) {
            values[numValid] = oracleResponses[dataKey][address(chronicleOracle)].value;
            numValid++;
        }

        require(numValid >= MIN_RESPONSES, "Insufficient valid responses");

        // Verificar desviación
        for (uint256 i = 0; i < numValid; i++) {
            for (uint256 j = i + 1; j < numValid; j++) {
                uint256 deviation = _calculateDeviation(values[i], values[j]);
                require(deviation <= MAX_DEVIATION, "Excessive deviation between oracles");
            }
            totalValue += values[i];
        }

        // Actualizar datos agregados
        uint256 aggregatedValue = totalValue / numValid;
        aggregatedData[dataKey] = AggregatedData({
            value: aggregatedValue,
            numResponses: numValid,
            timestamp: block.timestamp
        });

        emit DataAggregated(dataKey, aggregatedValue, numValid);
    }

    
    function _calculateDeviation(uint256 a, uint256 b) internal pure returns (uint256) {
        if (a > b) {
            return ((a - b) * 100) / b;
        }
        return ((b - a) * 100) / a;
    }

    
    function setOracleAuthorization(
        address oracle,
        bool authorized
    ) external onlyRole(ORACLE_MANAGER_ROLE) {
        authorizedOracles[oracle] = authorized;
        emit OracleAuthorized(oracle, authorized);
    }

    
    function updateOracleAddress(
        string memory oracleType,
        address newAddress
    ) external onlyRole(ORACLE_MANAGER_ROLE) {
        require(newAddress != address(0), "Invalid address");

        bytes32 oracleHash = keccak256(bytes(oracleType));
        
        if (oracleHash == keccak256("chainlink")) {
            chainlinkOracle = AggregatorV3Interface(newAddress);
        } else if (oracleHash == keccak256("api3")) {
            api3Oracle = IApi3Oracle(newAddress);
        } else if (oracleHash == keccak256("supra")) {
            supraOracle = ISupraOracle(newAddress);
        } else if (oracleHash == keccak256("chronicle")) {
            chronicleOracle = IChronicleOracle(newAddress);
        } else {
            revert("Invalid oracle type");
        }

        authorizedOracles[newAddress] = true;
        emit OracleAuthorized(newAddress, true);
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
    
    function batchQueryOracles(bytes[] calldata queryDatas) external returns (bytes[] memory results) {
        require(address(batchProcessor) != address(0), "BatchProcessor not set");
        
        // Mock implementation - process queries individually
        results = new bytes[](queryDatas.length);
        for (uint256 i = 0; i < queryDatas.length; i++) {
            results[i] = abi.encode("mock_oracle_result");
        }
    }
    
    function cacheAggregatedResult(bytes32 key, bytes memory aggResult, uint256 expiresAt) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(address(distributedCache) != address(0), "Cache not set");
        distributedCache.setCache(key, aggResult, expiresAt);
    }

    
    function pause() external onlyRole(ORACLE_MANAGER_ROLE) {
        _pause();
    }

    
    function unpause() external onlyRole(ORACLE_MANAGER_ROLE) {
        _unpause();
    }
} 