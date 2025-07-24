// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@arbitrum/nitro-contracts/src/precompiles/ArbGasInfo.sol";

/**
 * @title BrainSafes Analytics Manager
 * @dev Manages platform analytics, metrics, and reporting with Arbitrum optimizations
 * @custom:security-contact security@brainsafes.com
 */
contract AnalyticsManager is UUPSUpgradeable, AccessControlUpgradeable, PausableUpgradeable {
    // Roles
    bytes32 public constant ANALYTICS_ADMIN = keccak256("ANALYTICS_ADMIN");
    bytes32 public constant METRICS_REPORTER = keccak256("METRICS_REPORTER");

    // Arbitrum gas info precompile
    ArbGasInfo constant arbGasInfo = ArbGasInfo(0x000000000000000000000000000000000000006C);

    // Structs for different types of analytics
    struct UsageMetrics {
        uint256 totalUsers;
        uint256 activeUsers;
        uint256 coursesCreated;
        uint256 coursesCompleted;
        uint256 certificatesIssued;
        uint256 totalTransactions;
        mapping(address => uint256) userLastActivity;
    }

    struct PerformanceMetrics {
        uint256 avgGasUsed;
        uint256 peakGasUsed;
        uint256 totalGasUsed;
        uint256 avgResponseTime;
        uint256 successRate;
        uint256 failureRate;
        mapping(bytes32 => uint256) functionGasUsage;
    }

    struct GovernanceMetrics {
        uint256 totalProposals;
        uint256 acceptedProposals;
        uint256 rejectedProposals;
        uint256 totalVotes;
        uint256 uniqueVoters;
        uint256 avgVoterParticipation;
        mapping(address => uint256) voterActivity;
    }

    struct AdminMetrics {
        uint256 totalRevenue;
        uint256 activeScholarships;
        uint256 platformHealth;
        uint256 systemUptime;
        uint256 lastMaintenanceBlock;
        mapping(address => bool) adminActivity;
    }

    // Storage
    UsageMetrics private usageMetrics;
    PerformanceMetrics private performanceMetrics;
    GovernanceMetrics private governanceMetrics;
    AdminMetrics private adminMetrics;

    // Time windows for analytics
    uint256 public constant DAILY_WINDOW = 1 days;
    uint256 public constant WEEKLY_WINDOW = 7 days;
    uint256 public constant MONTHLY_WINDOW = 30 days;

    // Events
    event MetricsUpdated(bytes32 indexed metricType, uint256 timestamp);
    event AnalyticsReport(bytes32 indexed reportType, bytes32 reportHash);
    event PerformanceAlert(bytes32 indexed alertType, uint256 value, uint256 threshold);
    event AdminDashboardUpdated(address indexed admin, uint256 timestamp);

    /**
     * @dev Initialize the contract
     */
    function initialize() public initializer {
        __UUPSUpgradeable_init();
        __AccessControl_init();
        __Pausable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ANALYTICS_ADMIN, msg.sender);
    }

    /**
     * @dev Update usage metrics
     * @param userCount New total user count
     * @param activeCount New active user count
     * @param coursesCreated New courses created count
     * @param coursesCompleted New courses completed count
     */
    function updateUsageMetrics(
        uint256 userCount,
        uint256 activeCount,
        uint256 coursesCreated,
        uint256 coursesCompleted
    ) external onlyRole(METRICS_REPORTER) {
        usageMetrics.totalUsers = userCount;
        usageMetrics.activeUsers = activeCount;
        usageMetrics.coursesCreated = coursesCreated;
        usageMetrics.coursesCompleted = coursesCompleted;
        usageMetrics.userLastActivity[msg.sender] = block.timestamp;

        emit MetricsUpdated(keccak256("USAGE"), block.timestamp);
    }

    /**
     * @dev Update performance metrics with gas optimization
     * @param functionSelector Function being measured
     * @param gasUsed Gas used in the operation
     * @param responseTime Response time in milliseconds
     * @param success Whether the operation was successful
     */
    function updatePerformanceMetrics(
        bytes4 functionSelector,
        uint256 gasUsed,
        uint256 responseTime,
        bool success
    ) external onlyRole(METRICS_REPORTER) {
        bytes32 functionHash = keccak256(abi.encodePacked(functionSelector));
        
        // Update gas usage metrics
        performanceMetrics.totalGasUsed += gasUsed;
        performanceMetrics.functionGasUsage[functionHash] += gasUsed;
        
        if (gasUsed > performanceMetrics.peakGasUsed) {
            performanceMetrics.peakGasUsed = gasUsed;
        }

        // Update success/failure rates
        if (success) {
            performanceMetrics.successRate++;
        } else {
            performanceMetrics.failureRate++;
            emit PerformanceAlert(keccak256("FAILURE"), gasUsed, arbGasInfo.getL1BaseFeeEstimate());
        }

        // Update average response time
        uint256 totalOps = performanceMetrics.successRate + performanceMetrics.failureRate;
        performanceMetrics.avgResponseTime = (performanceMetrics.avgResponseTime * (totalOps - 1) + responseTime) / totalOps;

        emit MetricsUpdated(keccak256("PERFORMANCE"), block.timestamp);
    }

    /**
     * @dev Update governance metrics
     * @param proposalId Proposal being updated
     * @param accepted Whether the proposal was accepted
     * @param voterCount Number of voters
     */
    function updateGovernanceMetrics(
        uint256 proposalId,
        bool accepted,
        uint256 voterCount
    ) external onlyRole(METRICS_REPORTER) {
        governanceMetrics.totalProposals++;
        
        if (accepted) {
            governanceMetrics.acceptedProposals++;
        } else {
            governanceMetrics.rejectedProposals++;
        }

        governanceMetrics.totalVotes += voterCount;
        governanceMetrics.uniqueVoters = voterCount;
        governanceMetrics.voterActivity[msg.sender] = block.timestamp;

        // Calculate average participation
        governanceMetrics.avgVoterParticipation = (governanceMetrics.totalVotes * 100) / governanceMetrics.totalProposals;

        emit MetricsUpdated(keccak256("GOVERNANCE"), block.timestamp);
    }

    /**
     * @dev Update admin dashboard metrics
     * @param revenue Current total revenue
     * @param scholarships Active scholarships count
     * @param healthScore Platform health score
     */
    function updateAdminMetrics(
        uint256 revenue,
        uint256 scholarships,
        uint256 healthScore
    ) external onlyRole(ANALYTICS_ADMIN) {
        adminMetrics.totalRevenue = revenue;
        adminMetrics.activeScholarships = scholarships;
        adminMetrics.platformHealth = healthScore;
        adminMetrics.systemUptime = block.timestamp - adminMetrics.lastMaintenanceBlock;
        adminMetrics.lastMaintenanceBlock = block.timestamp;
        adminMetrics.adminActivity[msg.sender] = true;

        emit AdminDashboardUpdated(msg.sender, block.timestamp);
    }

    /**
     * @dev Generate analytics report
     * @param reportType Type of report to generate
     * @param timeWindow Time window for the report
     * @return reportHash Hash of the generated report
     */
    function generateReport(
        bytes32 reportType,
        uint256 timeWindow
    ) external view returns (bytes32 reportHash) {
        require(
            timeWindow == DAILY_WINDOW || 
            timeWindow == WEEKLY_WINDOW || 
            timeWindow == MONTHLY_WINDOW,
            "Invalid time window"
        );

        bytes memory reportData;

        if (reportType == keccak256("USAGE")) {
            reportData = abi.encode(
                usageMetrics.totalUsers,
                usageMetrics.activeUsers,
                usageMetrics.coursesCreated,
                usageMetrics.coursesCompleted,
                usageMetrics.certificatesIssued
            );
        } else if (reportType == keccak256("PERFORMANCE")) {
            reportData = abi.encode(
                performanceMetrics.avgGasUsed,
                performanceMetrics.peakGasUsed,
                performanceMetrics.successRate,
                performanceMetrics.failureRate
            );
        } else if (reportType == keccak256("GOVERNANCE")) {
            reportData = abi.encode(
                governanceMetrics.totalProposals,
                governanceMetrics.acceptedProposals,
                governanceMetrics.rejectedProposals,
                governanceMetrics.avgVoterParticipation
            );
        } else if (reportType == keccak256("ADMIN")) {
            reportData = abi.encode(
                adminMetrics.totalRevenue,
                adminMetrics.activeScholarships,
                adminMetrics.platformHealth,
                adminMetrics.systemUptime
            );
        }

        reportHash = keccak256(abi.encodePacked(reportType, timeWindow, reportData));
        return reportHash;
    }

    /**
     * @dev Get current platform health metrics
     * @return health Struct containing key health indicators
     */
    function getPlatformHealth() external view returns (
        uint256 userGrowth,
        uint256 courseCompletion,
        uint256 systemHealth,
        uint256 gasEfficiency
    ) {
        userGrowth = (usageMetrics.totalUsers * 100) / (block.timestamp - adminMetrics.lastMaintenanceBlock);
        courseCompletion = (usageMetrics.coursesCompleted * 100) / usageMetrics.coursesCreated;
        systemHealth = adminMetrics.platformHealth;
        gasEfficiency = (performanceMetrics.successRate * 100) / (performanceMetrics.successRate + performanceMetrics.failureRate);

        return (userGrowth, courseCompletion, systemHealth, gasEfficiency);
    }

    /**
     * @dev Required by UUPS
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}
} 