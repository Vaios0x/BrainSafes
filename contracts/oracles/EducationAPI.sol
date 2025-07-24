// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@chainlink/contracts/src/v0.8/ChainlinkClient.sol";

/**
 * @title BrainSafes Education API Integration
 * @dev Handles integration with educational APIs and data sources
 * @custom:security-contact security@brainsafes.com
 */
contract EducationAPI is UUPSUpgradeable, AccessControlUpgradeable, PausableUpgradeable, ChainlinkClient {
    // Roles
    bytes32 public constant API_ADMIN = keccak256("API_ADMIN");
    bytes32 public constant DATA_PROVIDER = keccak256("DATA_PROVIDER");

    // API types
    enum APIType {
        COURSERA,
        EDX,
        UDACITY,
        LINKEDIN_LEARNING,
        CUSTOM
    }

    // Data types
    enum DataType {
        COURSE_CATALOG,
        LEARNING_PATH,
        SKILLS_FRAMEWORK,
        ASSESSMENT_RUBRIC,
        CREDENTIAL_STANDARD
    }

    // Structs
    struct APIConfig {
        string name;
        APIType apiType;
        string baseUrl;
        string apiKey;
        uint256 rateLimit;
        uint256 lastCall;
        bool isActive;
        mapping(bytes4 => bool) supportedMethods;
    }

    struct DataFeed {
        string name;
        DataType dataType;
        address provider;
        uint256 updateInterval;
        uint256 lastUpdate;
        bytes32 jobId;
        uint256 fee;
        bool isActive;
    }

    struct CourseData {
        string courseId;
        string title;
        string provider;
        string[] skills;
        uint256 duration;
        uint256 level;
        uint256 rating;
        uint256 enrollments;
        uint256 lastUpdate;
    }

    struct SkillsFramework {
        string frameworkId;
        string name;
        string version;
        string[] domains;
        string[] levels;
        mapping(string => string[]) skillsByDomain;
        uint256 lastUpdate;
    }

    // Storage
    mapping(bytes32 => APIConfig) public apis;
    mapping(bytes32 => DataFeed) public dataFeeds;
    mapping(string => CourseData) public courses;
    mapping(string => SkillsFramework) public frameworks;
    mapping(bytes32 => mapping(uint256 => bytes)) public historicalData;

    // Events
    event APIRegistered(bytes32 indexed apiId, string name, APIType apiType);
    event DataFeedAdded(bytes32 indexed feedId, string name, DataType dataType);
    event CourseUpdated(string indexed courseId, string title, uint256 timestamp);
    event FrameworkUpdated(string indexed frameworkId, string version, uint256 timestamp);
    event DataSynced(bytes32 indexed feedId, uint256 timestamp, uint256 recordCount);

    /**
     * @dev Initialize the contract
     */
    function initialize() public initializer {
        __UUPSUpgradeable_init();
        __AccessControl_init();
        __Pausable_init();
        __Chainlink_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(API_ADMIN, msg.sender);
    }

    /**
     * @dev Register a new API integration
     */
    function registerAPI(
        string calldata name,
        APIType apiType,
        string calldata baseUrl,
        string calldata apiKey,
        uint256 rateLimit,
        bytes4[] calldata methods
    ) external onlyRole(API_ADMIN) returns (bytes32) {
        bytes32 apiId = keccak256(abi.encodePacked(name, apiType));
        
        require(!apis[apiId].isActive, "API already registered");

        APIConfig storage config = apis[apiId];
        config.name = name;
        config.apiType = apiType;
        config.baseUrl = baseUrl;
        config.apiKey = apiKey;
        config.rateLimit = rateLimit;
        config.isActive = true;

        for (uint i = 0; i < methods.length; i++) {
            config.supportedMethods[methods[i]] = true;
        }

        emit APIRegistered(apiId, name, apiType);
        return apiId;
    }

    /**
     * @dev Add a new data feed
     */
    function addDataFeed(
        string calldata name,
        DataType dataType,
        uint256 updateInterval,
        bytes32 jobId,
        uint256 fee
    ) external onlyRole(DATA_PROVIDER) returns (bytes32) {
        bytes32 feedId = keccak256(abi.encodePacked(name, dataType));
        
        require(!dataFeeds[feedId].isActive, "Feed already exists");

        DataFeed storage feed = dataFeeds[feedId];
        feed.name = name;
        feed.dataType = dataType;
        feed.provider = msg.sender;
        feed.updateInterval = updateInterval;
        feed.lastUpdate = block.timestamp;
        feed.jobId = jobId;
        feed.fee = fee;
        feed.isActive = true;

        emit DataFeedAdded(feedId, name, dataType);
        return feedId;
    }

    /**
     * @dev Request course catalog update
     */
    function requestCourseCatalog(
        bytes32 feedId,
        string calldata provider,
        string calldata category
    ) external returns (bytes32) {
        DataFeed storage feed = dataFeeds[feedId];
        require(feed.isActive, "Feed not active");
        require(
            block.timestamp >= feed.lastUpdate + feed.updateInterval,
            "Update too frequent"
        );

        Chainlink.Request memory req = buildChainlinkRequest(
            feed.jobId,
            address(this),
            this.fulfillCourseCatalog.selector
        );
        req.add("provider", provider);
        req.add("category", category);
        
        return sendChainlinkRequestTo(feed.provider, req, feed.fee);
    }

    /**
     * @dev Callback for course catalog data
     */
    function fulfillCourseCatalog(bytes32 _requestId, bytes memory _courseData)
        public
        recordChainlinkFulfillment(_requestId)
    {
        // Parse and store course data
        (
            string memory courseId,
            string memory title,
            string memory provider,
            string[] memory skills,
            uint256 duration,
            uint256 level,
            uint256 rating,
            uint256 enrollments
        ) = abi.decode(_courseData, (string, string, string, string[], uint256, uint256, uint256, uint256));

        CourseData storage course = courses[courseId];
        course.courseId = courseId;
        course.title = title;
        course.provider = provider;
        course.skills = skills;
        course.duration = duration;
        course.level = level;
        course.rating = rating;
        course.enrollments = enrollments;
        course.lastUpdate = block.timestamp;

        emit CourseUpdated(courseId, title, block.timestamp);
    }

    /**
     * @dev Update skills framework
     */
    function updateSkillsFramework(
        string calldata frameworkId,
        string calldata name,
        string calldata version,
        string[] calldata domains,
        string[] calldata levels,
        string[][] calldata skills
    ) external onlyRole(DATA_PROVIDER) {
        require(domains.length == skills.length, "Invalid skills mapping");

        SkillsFramework storage framework = frameworks[frameworkId];
        framework.frameworkId = frameworkId;
        framework.name = name;
        framework.version = version;
        framework.domains = domains;
        framework.levels = levels;
        framework.lastUpdate = block.timestamp;

        for (uint i = 0; i < domains.length; i++) {
            framework.skillsByDomain[domains[i]] = skills[i];
        }

        emit FrameworkUpdated(frameworkId, version, block.timestamp);
    }

    /**
     * @dev Get course details
     */
    function getCourseDetails(string calldata courseId) external view returns (
        string memory title,
        string memory provider,
        string[] memory skills,
        uint256 duration,
        uint256 level,
        uint256 rating,
        uint256 enrollments,
        uint256 lastUpdate
    ) {
        CourseData storage course = courses[courseId];
        return (
            course.title,
            course.provider,
            course.skills,
            course.duration,
            course.level,
            course.rating,
            course.enrollments,
            course.lastUpdate
        );
    }

    /**
     * @dev Get framework details
     */
    function getFrameworkDetails(
        string calldata frameworkId,
        string calldata domain
    ) external view returns (
        string memory name,
        string memory version,
        string[] memory domains,
        string[] memory levels,
        string[] memory domainSkills,
        uint256 lastUpdate
    ) {
        SkillsFramework storage framework = frameworks[frameworkId];
        return (
            framework.name,
            framework.version,
            framework.domains,
            framework.levels,
            framework.skillsByDomain[domain],
            framework.lastUpdate
        );
    }

    /**
     * @dev Required by UUPS
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}
} 