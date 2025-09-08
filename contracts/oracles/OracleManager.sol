// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@chainlink/contracts/src/v0.8/ChainlinkClient.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "../interfaces/IApi3ServerV1.sol";
import "../optimizations/AdvancedBatchProcessor.sol";
import "../cache/DistributedCacheV2.sol";


contract OracleManager is UUPSUpgradeable, AccessControlUpgradeable, PausableUpgradeable, ChainlinkClient {
    // Roles
    bytes32 public constant ORACLE_ADMIN = keccak256("ORACLE_ADMIN");
    bytes32 public constant DATA_PROVIDER = keccak256("DATA_PROVIDER");

    // Oracle types
    enum OracleType {
        CHAINLINK,
        API3,
        CUSTOM
    }

    // Data source types
    enum DataSourceType {
        EDUCATION_API,
        JOB_MARKET,
        CREDENTIALS,
        SKILLS_DATA
    }

    // Structs
    struct OracleConfig {
        string name;
        OracleType oracleType;
        address oracleAddress;
        bytes32 jobId;
        uint256 fee;
        bool isActive;
        mapping(bytes32 => uint256) lastUpdateTimes;
    }

    struct DataSource {
        string name;
        DataSourceType sourceType;
        address provider;
        uint256 updateInterval;
        uint256 lastUpdate;
        bytes32 dataFeedId;
        bool isActive;
    }

    struct CredentialVerification {
        address issuer;
        bytes32 credentialHash;
        uint256 issuanceDate;
        uint256 expiryDate;
        bool isValid;
        mapping(address => bool) endorsements;
    }

    // Storage
    mapping(bytes32 => OracleConfig) public oracles;
    mapping(bytes32 => DataSource) public dataSources;
    mapping(bytes32 => CredentialVerification) public credentials;
    mapping(bytes32 => mapping(uint256 => bytes)) public historicalData;
    
    // API3 integration
    IApi3ServerV1 public api3Server;
    mapping(bytes32 => bytes32) public dataFeedIds;
    
    // Nuevos módulos de optimización
    AdvancedBatchProcessor public batchProcessor;
    DistributedCacheV2 public distributedCache;

    // Events
    event OracleRegistered(bytes32 indexed oracleId, string name, OracleType oracleType);
    event DataSourceAdded(bytes32 indexed sourceId, string name, DataSourceType sourceType);
    event DataUpdated(bytes32 indexed sourceId, bytes32 indexed dataType, bytes data);
    event CredentialVerified(bytes32 indexed credentialHash, address issuer, bool isValid);
    event EndorsementAdded(bytes32 indexed credentialHash, address endorser);
    event BatchProcessorSet(address indexed processor);
    event DistributedCacheSet(address indexed cache);

    
    function initialize(address _api3ServerAddress) public initializer {
        __UUPSUpgradeable_init();
        __AccessControl_init();
        __Pausable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ORACLE_ADMIN, msg.sender);

        api3Server = IApi3ServerV1(_api3ServerAddress);
    }

    
    function registerOracle(
        string calldata name,
        OracleType oracleType,
        address oracleAddress,
        bytes32 jobId,
        uint256 fee
    ) external onlyRole(ORACLE_ADMIN) returns (bytes32) {
        bytes32 oracleId = keccak256(abi.encodePacked(name, oracleType, oracleAddress));
        
        require(!oracles[oracleId].isActive, "Oracle already exists");

        OracleConfig storage config = oracles[oracleId];
        config.name = name;
        config.oracleType = oracleType;
        config.oracleAddress = oracleAddress;
        config.jobId = jobId;
        config.fee = fee;
        config.isActive = true;

        emit OracleRegistered(oracleId, name, oracleType);
        return oracleId;
    }

    
    function addDataSource(
        string calldata name,
        DataSourceType sourceType,
        uint256 updateInterval,
        bytes32 dataFeedId
    ) external onlyRole(DATA_PROVIDER) returns (bytes32) {
        bytes32 sourceId = keccak256(abi.encodePacked(name, sourceType));
        
        require(!dataSources[sourceId].isActive, "Data source already exists");

        DataSource storage source = dataSources[sourceId];
        source.name = name;
        source.sourceType = sourceType;
        source.provider = msg.sender;
        source.updateInterval = updateInterval;
        source.lastUpdate = block.timestamp;
        source.dataFeedId = dataFeedId;
        source.isActive = true;

        emit DataSourceAdded(sourceId, name, sourceType);
        return sourceId;
    }

    
    function requestEducationData(
        bytes32 oracleId,
        string calldata endpoint,
        string calldata path
    ) external returns (bytes32) {
        OracleConfig storage config = oracles[oracleId];
        require(config.isActive, "Oracle not active");
        require(config.oracleType == OracleType.CHAINLINK, "Invalid oracle type");

        Chainlink.Request memory req = buildChainlinkRequest(
            config.jobId,
            address(this),
            this.fulfillEducationData.selector
        );
        // Simplified request - in production would use correct Chainlink methods
        // req.add("get", endpoint);
        // req.add("path", path);
        
        return sendChainlinkRequestTo(config.oracleAddress, req, config.fee);
    }

    
    function fulfillEducationData(bytes32 _requestId, bytes memory _data)
        public
        recordChainlinkFulfillment(_requestId)
    {
        bytes32 dataType = keccak256("EDUCATION_DATA");
        historicalData[dataType][block.timestamp] = _data;
        emit DataUpdated(_requestId, dataType, _data);
    }

    
    function getJobMarketData(bytes32 dataFeedId) external view returns (uint256, uint256) {
        // Simplified API3 data reading - in production would use correct method
        uint256 value = 100; // Mock value
        uint256 timestamp = block.timestamp; // Current timestamp
        return (value, timestamp);
    }

    
    function verifyCredential(
        bytes32 credentialHash,
        address issuer,
        uint256 issuanceDate,
        uint256 expiryDate
    ) external onlyRole(DATA_PROVIDER) {
        CredentialVerification storage credential = credentials[credentialHash];
        credential.issuer = issuer;
        credential.credentialHash = credentialHash;
        credential.issuanceDate = issuanceDate;
        credential.expiryDate = expiryDate;
        credential.isValid = true;

        emit CredentialVerified(credentialHash, issuer, true);
    }

    
    function addEndorsement(bytes32 credentialHash) external {
        require(credentials[credentialHash].isValid, "Invalid credential");
        require(!credentials[credentialHash].endorsements[msg.sender], "Already endorsed");

        credentials[credentialHash].endorsements[msg.sender] = true;
        emit EndorsementAdded(credentialHash, msg.sender);
    }

    
    function getLatestData(bytes32 sourceId) external view returns (
        bytes memory data,
        uint256 timestamp,
        bool isValid
    ) {
        DataSource storage source = dataSources[sourceId];
        require(source.isActive, "Data source not active");

        bytes32 dataType = keccak256(abi.encodePacked(source.sourceType));
        data = historicalData[dataType][source.lastUpdate];
        timestamp = source.lastUpdate;
        isValid = block.timestamp <= source.lastUpdate + source.updateInterval;
    }

    
    function checkCredential(bytes32 credentialHash) external view returns (
        bool isValid,
        address issuer,
        uint256 issuanceDate,
        uint256 expiryDate,
        uint256 endorsementCount
    ) {
        CredentialVerification storage credential = credentials[credentialHash];
        return (
            credential.isValid && block.timestamp <= credential.expiryDate,
            credential.issuer,
            credential.issuanceDate,
            credential.expiryDate,
            0 // Implement endorsement count tracking if needed
        );
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
    
    function batchRegisterOracles(bytes[] calldata oracleDatas) external returns (bool[] memory results) {
        require(address(batchProcessor) != address(0), "BatchProcessor not set");
        
        // Mock implementation - process registrations individually
        results = new bool[](oracleDatas.length);
        for (uint256 i = 0; i < oracleDatas.length; i++) {
            results[i] = true; // Mock success
        }
    }
    
    function cacheOracleConfig(bytes32 key, bytes memory config, uint256 expiresAt) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(address(distributedCache) != address(0), "Cache not set");
        distributedCache.setCache(key, config, expiresAt);
    }

    
    function _authorizeUpgrade(address newImplementation) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}
} 