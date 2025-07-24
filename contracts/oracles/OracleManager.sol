// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@chainlink/contracts/src/v0.8/ChainlinkClient.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@api3/contracts/v0.8/interfaces/IApi3ServerV1.sol";

/**
 * @title BrainSafes Oracle Manager
 * @dev Manages multiple oracle integrations and data sources
 * @custom:security-contact security@brainsafes.com
 */
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
    
    // Events
    event OracleRegistered(bytes32 indexed oracleId, string name, OracleType oracleType);
    event DataSourceAdded(bytes32 indexed sourceId, string name, DataSourceType sourceType);
    event DataUpdated(bytes32 indexed sourceId, bytes32 indexed dataType, bytes data);
    event CredentialVerified(bytes32 indexed credentialHash, address issuer, bool isValid);
    event EndorsementAdded(bytes32 indexed credentialHash, address endorser);

    /**
     * @dev Initialize the contract
     */
    function initialize(address _api3ServerAddress) public initializer {
        __UUPSUpgradeable_init();
        __AccessControl_init();
        __Pausable_init();
        __Chainlink_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ORACLE_ADMIN, msg.sender);

        api3Server = IApi3ServerV1(_api3ServerAddress);
    }

    /**
     * @dev Register a new oracle
     */
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

    /**
     * @dev Add a new data source
     */
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

    /**
     * @dev Request educational data from Chainlink oracle
     */
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
        req.add("get", endpoint);
        req.add("path", path);
        
        return sendChainlinkRequestTo(config.oracleAddress, req, config.fee);
    }

    /**
     * @dev Callback for education data
     */
    function fulfillEducationData(bytes32 _requestId, bytes memory _data)
        public
        recordChainlinkFulfillment(_requestId)
    {
        bytes32 dataType = keccak256("EDUCATION_DATA");
        historicalData[dataType][block.timestamp] = _data;
        emit DataUpdated(_requestId, dataType, _data);
    }

    /**
     * @dev Get job market data from API3
     */
    function getJobMarketData(bytes32 dataFeedId) external view returns (uint256, uint256) {
        (uint256 value, uint256 timestamp) = api3Server.readDataFeedWithId(dataFeedId);
        return (value, timestamp);
    }

    /**
     * @dev Verify credential
     */
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

    /**
     * @dev Add endorsement to credential
     */
    function addEndorsement(bytes32 credentialHash) external {
        require(credentials[credentialHash].isValid, "Invalid credential");
        require(!credentials[credentialHash].endorsements[msg.sender], "Already endorsed");

        credentials[credentialHash].endorsements[msg.sender] = true;
        emit EndorsementAdded(credentialHash, msg.sender);
    }

    /**
     * @dev Get latest data from a source
     */
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

    /**
     * @dev Check credential validity
     */
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

    /**
     * @dev Required by UUPS
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}
} 