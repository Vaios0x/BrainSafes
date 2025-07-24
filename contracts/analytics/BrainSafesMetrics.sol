// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@arbitrum/nitro-contracts/src/precompiles/ArbGasInfo.sol";
import "../interfaces/IBrainSafesL2.sol";

/**
 * @title BrainSafes Metrics System
 * @dev Comprehensive analytics and metrics tracking system for the BrainSafes platform
 * @custom:security-contact security@brainsafes.com
 */
contract BrainSafesMetrics is UUPSUpgradeable, AccessControlUpgradeable, PausableUpgradeable {
    // Roles
    bytes32 public constant METRICS_ADMIN_ROLE = keccak256("METRICS_ADMIN_ROLE");
    bytes32 public constant ANALYZER_ROLE = keccak256("ANALYZER_ROLE");

    // Arbitrum specific
    ArbGasInfo constant arbGasInfo = ArbGasInfo(0x000000000000000000000000000000000000006C);

    // Structs
    struct UserMetrics {
        uint256 coursesEnrolled;
        uint256 coursesCompleted;
        uint256 certificatesEarned;
        uint256 scholarshipsReceived;
        uint256 jobApplicationsSubmitted;
        uint256 jobsSecured;
        uint256 totalLearningHours;
        uint256 averageGrade;
        uint256 lastActivityTimestamp;
    }

    struct CourseMetrics {
        uint256 totalEnrollments;
        uint256 activeStudents;
        uint256 completionRate;
        uint256 averageGrade;
        uint256 totalRevenue;
        uint256 studentSatisfactionScore;
        uint256 lastUpdateTimestamp;
    }

    struct PlatformMetrics {
        uint256 totalUsers;
        uint256 activeUsers30Days;
        uint256 totalCourses;
        uint256 totalScholarships;
        uint256 totalJobPlacements;
        uint256 platformRevenue;
        uint256 gasUsageOptimization;
        uint256 lastUpdateTimestamp;
    }

    // Storage
    mapping(address => UserMetrics) private userMetrics;
    mapping(uint256 => CourseMetrics) private courseMetrics;
    PlatformMetrics private platformMetrics;

    // Events
    event MetricsUpdated(string metricType, address indexed entity, uint256 timestamp);
    event AnalyticsReport(string reportType, bytes32 reportHash, uint256 timestamp);
    event AnomalyDetected(string anomalyType, bytes32 dataHash, uint256 timestamp);

    /**
     * @dev Initializes the contract
     */
    function initialize(address admin) public initializer {
        __UUPSUpgradeable_init();
        __AccessControl_init();
        __Pausable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(METRICS_ADMIN_ROLE, admin);
    }

    /**
     * @dev Updates user metrics
     * @param user Address of the user
     * @param metricType Type of metric to update
     * @param value New value for the metric
     */
    function updateUserMetrics(
        address user,
        string memory metricType,
        uint256 value
    ) external onlyRole(METRICS_ADMIN_ROLE) {
        UserMetrics storage metrics = userMetrics[user];
        
        if (keccak256(bytes(metricType)) == keccak256(bytes("coursesEnrolled"))) {
            metrics.coursesEnrolled = value;
        } else if (keccak256(bytes(metricType)) == keccak256(bytes("coursesCompleted"))) {
            metrics.coursesCompleted = value;
        } else if (keccak256(bytes(metricType)) == keccak256(bytes("certificatesEarned"))) {
            metrics.certificatesEarned = value;
        }
        
        metrics.lastActivityTimestamp = block.timestamp;
        emit MetricsUpdated("user", user, block.timestamp);
    }

    /**
     * @dev Updates course metrics
     * @param courseId ID of the course
     * @param metricType Type of metric to update
     * @param value New value for the metric
     */
    function updateCourseMetrics(
        uint256 courseId,
        string memory metricType,
        uint256 value
    ) external onlyRole(METRICS_ADMIN_ROLE) {
        CourseMetrics storage metrics = courseMetrics[courseId];
        
        if (keccak256(bytes(metricType)) == keccak256(bytes("totalEnrollments"))) {
            metrics.totalEnrollments = value;
        } else if (keccak256(bytes(metricType)) == keccak256(bytes("completionRate"))) {
            metrics.completionRate = value;
        }
        
        metrics.lastUpdateTimestamp = block.timestamp;
        emit MetricsUpdated("course", address(0), block.timestamp);
    }

    /**
     * @dev Updates platform-wide metrics
     * @param metricType Type of metric to update
     * @param value New value for the metric
     */
    function updatePlatformMetrics(
        string memory metricType,
        uint256 value
    ) external onlyRole(METRICS_ADMIN_ROLE) {
        if (keccak256(bytes(metricType)) == keccak256(bytes("totalUsers"))) {
            platformMetrics.totalUsers = value;
        } else if (keccak256(bytes(metricType)) == keccak256(bytes("activeUsers30Days"))) {
            platformMetrics.activeUsers30Days = value;
        }
        
        platformMetrics.lastUpdateTimestamp = block.timestamp;
        emit MetricsUpdated("platform", address(0), block.timestamp);
    }

    /**
     * @dev Generates analytics report
     * @param reportType Type of report to generate
     * @return bytes32 Hash of the generated report
     */
    function generateAnalyticsReport(string memory reportType) 
        external 
        onlyRole(ANALYZER_ROLE) 
        returns (bytes32) 
    {
        bytes32 reportHash = keccak256(abi.encodePacked(reportType, block.timestamp));
        emit AnalyticsReport(reportType, reportHash, block.timestamp);
        return reportHash;
    }

    /**
     * @dev Gets user metrics
     * @param user Address of the user
     * @return UserMetrics struct containing user metrics
     */
    function getUserMetrics(address user) 
        external 
        view 
        returns (UserMetrics memory) 
    {
        return userMetrics[user];
    }

    /**
     * @dev Gets course metrics
     * @param courseId ID of the course
     * @return CourseMetrics struct containing course metrics
     */
    function getCourseMetrics(uint256 courseId) 
        external 
        view 
        returns (CourseMetrics memory) 
    {
        return courseMetrics[courseId];
    }

    /**
     * @dev Gets platform metrics
     * @return PlatformMetrics struct containing platform metrics
     */
    function getPlatformMetrics() 
        external 
        view 
        returns (PlatformMetrics memory) 
    {
        return platformMetrics;
    }

    /**
     * @dev Calculates gas optimization metrics
     * @return uint256 Gas optimization score
     */
    function calculateGasOptimization() 
        external 
        view 
        returns (uint256) 
    {
        uint256 currentL2GasPrice = uint256(arbGasInfo.getCurrentTxL2GasPrice());
        return currentL2GasPrice;
    }

    /**
     * @dev Required by the OZ UUPS module
     */
    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyRole(DEFAULT_ADMIN_ROLE)
    {}
} 