// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@arbitrum/nitro-contracts/src/precompiles/ArbSys.sol";
import "@arbitrum/nitro-contracts/src/precompiles/ArbGasInfo.sol";
import "@arbitrum/nitro-contracts/src/precompiles/ArbStatistics.sol";
import "../utils/DistributedCache.sol";
import "../utils/EnhancedMulticall.sol";

/**
 * @title AnalyticsManager
 * @dev Sistema de métricas y análisis para BrainSafes en Arbitrum
 * @custom:security-contact security@brainsafes.com
 */
contract AnalyticsManager is AccessControl, Pausable {
    // Roles
    bytes32 public constant ANALYTICS_ADMIN = keccak256("ANALYTICS_ADMIN");
    bytes32 public constant DATA_PROVIDER = keccak256("DATA_PROVIDER");
    bytes32 public constant METRICS_VIEWER = keccak256("METRICS_VIEWER");

    // Precompilados Arbitrum
    ArbSys constant arbsys = ArbSys(address(0x64));
    ArbGasInfo constant arbGasInfo = ArbGasInfo(address(0x6c));
    ArbStatistics constant arbStats = ArbStatistics(address(0x72));

    // Contratos externos
    DistributedCache public cache;
    EnhancedMulticall public multicall;

    // Estructuras de datos
    struct SystemMetrics {
        uint256 totalUsers;
        uint256 activeUsers24h;
        uint256 totalCourses;
        uint256 activeCourses;
        uint256 totalEnrollments;
        uint256 completionRate;
        uint256 averageScore;
        uint256 totalCertificates;
        uint256 totalScholarships;
        uint256 platformRevenue;
        uint256 gasUsed;
        uint256 timestamp;
    }

    struct UserMetrics {
        uint256 coursesEnrolled;
        uint256 coursesCompleted;
        uint256 averageScore;
        uint256 certificatesEarned;
        uint256 scholarshipsReceived;
        uint256 totalSpent;
        uint256 totalEarned;
        uint256 reputationScore;
        uint256 lastActive;
    }

    struct CourseMetrics {
        uint256 totalStudents;
        uint256 activeStudents;
        uint256 completionRate;
        uint256 averageScore;
        uint256 totalRevenue;
        uint256 instructorEarnings;
        uint256 studentSatisfaction;
        uint256 lastUpdated;
    }

    struct AIMetrics {
        uint256 predictionsTotal;
        uint256 predictionsAccurate;
        uint256 fraudDetections;
        uint256 pathsGenerated;
        uint256 averageResponseTime;
        uint256 gasOptimizations;
        uint256 lastUpdated;
    }

    struct NetworkMetrics {
        uint256 l1GasPrice;
        uint256 l2GasPrice;
        uint256 batchSize;
        uint256 stateSize;
        uint256 challengePeriod;
        uint256 timesSinceLastL1Block;
        uint256 pendingL1Messages;
        uint256 timestamp;
    }

    // Mappings
    mapping(uint256 => SystemMetrics) public historicalMetrics;
    mapping(address => UserMetrics) public userMetrics;
    mapping(uint256 => CourseMetrics) public courseMetrics;
    mapping(uint256 => AIMetrics) public aiMetrics;
    mapping(uint256 => NetworkMetrics) public networkMetrics;
    
    // Contadores y acumuladores
    uint256 public metricsCounter;
    uint256 public totalGasUsed;
    uint256 public totalTransactions;
    
    // Eventos
    event MetricsUpdated(uint256 indexed timestamp, bytes32 metricType);
    event AnalyticsAlert(string alertType, string description);
    event GasOptimizationDetected(uint256 savings, string optimizationType);
    event UserActivityRecorded(address indexed user, string activityType);
    event NetworkStatsUpdated(uint256 indexed blockNumber, uint256 gasPrice);

    /**
     * @dev Constructor
     */
    constructor(address _cache, address _multicall) {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(ANALYTICS_ADMIN, msg.sender);
        
        cache = DistributedCache(_cache);
        multicall = EnhancedMulticall(_multicall);
        
        // Inicializar contadores
        metricsCounter = 0;
    }

    /**
     * @dev Actualiza métricas del sistema
     */
    function updateSystemMetrics(
        uint256 _totalUsers,
        uint256 _activeUsers,
        uint256 _totalCourses,
        uint256 _activeCourses,
        uint256 _totalEnrollments,
        uint256 _completionRate,
        uint256 _averageScore,
        uint256 _totalCertificates,
        uint256 _totalScholarships,
        uint256 _platformRevenue
    ) external onlyRole(DATA_PROVIDER) whenNotPaused {
        metricsCounter++;
        
        SystemMetrics storage metrics = historicalMetrics[metricsCounter];
        metrics.totalUsers = _totalUsers;
        metrics.activeUsers24h = _activeUsers;
        metrics.totalCourses = _totalCourses;
        metrics.activeCourses = _activeCourses;
        metrics.totalEnrollments = _totalEnrollments;
        metrics.completionRate = _completionRate;
        metrics.averageScore = _averageScore;
        metrics.totalCertificates = _totalCertificates;
        metrics.totalScholarships = _totalScholarships;
        metrics.platformRevenue = _platformRevenue;
        metrics.gasUsed = totalGasUsed;
        metrics.timestamp = block.timestamp;

        // Actualizar caché
        bytes memory encodedMetrics = abi.encode(metrics);
        cache.set(keccak256("latest_system_metrics"), encodedMetrics, block.timestamp + 1 hours);

        emit MetricsUpdated(block.timestamp, keccak256("SYSTEM"));
    }

    /**
     * @dev Actualiza métricas de usuario
     */
    function updateUserMetrics(
        address user,
        uint256 _coursesEnrolled,
        uint256 _coursesCompleted,
        uint256 _averageScore,
        uint256 _certificatesEarned,
        uint256 _scholarshipsReceived,
        uint256 _totalSpent,
        uint256 _totalEarned,
        uint256 _reputationScore
    ) external onlyRole(DATA_PROVIDER) whenNotPaused {
        UserMetrics storage metrics = userMetrics[user];
        metrics.coursesEnrolled = _coursesEnrolled;
        metrics.coursesCompleted = _coursesCompleted;
        metrics.averageScore = _averageScore;
        metrics.certificatesEarned = _certificatesEarned;
        metrics.scholarshipsReceived = _scholarshipsReceived;
        metrics.totalSpent = _totalSpent;
        metrics.totalEarned = _totalEarned;
        metrics.reputationScore = _reputationScore;
        metrics.lastActive = block.timestamp;

        emit UserActivityRecorded(user, "metrics_update");
    }

    /**
     * @dev Actualiza métricas de curso
     */
    function updateCourseMetrics(
        uint256 courseId,
        uint256 _totalStudents,
        uint256 _activeStudents,
        uint256 _completionRate,
        uint256 _averageScore,
        uint256 _totalRevenue,
        uint256 _instructorEarnings,
        uint256 _studentSatisfaction
    ) external onlyRole(DATA_PROVIDER) whenNotPaused {
        CourseMetrics storage metrics = courseMetrics[courseId];
        metrics.totalStudents = _totalStudents;
        metrics.activeStudents = _activeStudents;
        metrics.completionRate = _completionRate;
        metrics.averageScore = _averageScore;
        metrics.totalRevenue = _totalRevenue;
        metrics.instructorEarnings = _instructorEarnings;
        metrics.studentSatisfaction = _studentSatisfaction;
        metrics.lastUpdated = block.timestamp;

        emit MetricsUpdated(block.timestamp, keccak256("COURSE"));
    }

    /**
     * @dev Actualiza métricas de IA
     */
    function updateAIMetrics(
        uint256 _predictionsTotal,
        uint256 _predictionsAccurate,
        uint256 _fraudDetections,
        uint256 _pathsGenerated,
        uint256 _averageResponseTime,
        uint256 _gasOptimizations
    ) external onlyRole(DATA_PROVIDER) whenNotPaused {
        uint256 period = block.timestamp / 1 days;
        
        AIMetrics storage metrics = aiMetrics[period];
        metrics.predictionsTotal = _predictionsTotal;
        metrics.predictionsAccurate = _predictionsAccurate;
        metrics.fraudDetections = _fraudDetections;
        metrics.pathsGenerated = _pathsGenerated;
        metrics.averageResponseTime = _averageResponseTime;
        metrics.gasOptimizations = _gasOptimizations;
        metrics.lastUpdated = block.timestamp;

        emit MetricsUpdated(block.timestamp, keccak256("AI"));
    }

    /**
     * @dev Actualiza métricas de red
     */
    function updateNetworkMetrics() external onlyRole(DATA_PROVIDER) whenNotPaused {
        uint256 period = block.timestamp / 1 hours;
        
        // Obtener datos de Arbitrum
        uint256 l1GasPrice = arbGasInfo.getL1BaseFeeEstimate();
        uint256 l2GasPrice = tx.gasprice;
        uint256 timesSinceLastL1Block = arbStats.getTimesSinceLastL1Block();
        uint256 pendingL1Messages = arbStats.getPendingL1MessageCount();
        
        NetworkMetrics storage metrics = networkMetrics[period];
        metrics.l1GasPrice = l1GasPrice;
        metrics.l2GasPrice = l2GasPrice;
        metrics.timesSinceLastL1Block = timesSinceLastL1Block;
        metrics.pendingL1Messages = pendingL1Messages;
        metrics.timestamp = block.timestamp;

        emit NetworkStatsUpdated(block.number, l2GasPrice);
    }

    /**
     * @dev Obtiene métricas del sistema
     */
    function getLatestSystemMetrics() external view returns (SystemMetrics memory) {
        return historicalMetrics[metricsCounter];
    }

    /**
     * @dev Obtiene métricas de usuario
     */
    function getUserMetrics(address user) external view returns (UserMetrics memory) {
        return userMetrics[user];
    }

    /**
     * @dev Obtiene métricas de curso
     */
    function getCourseMetrics(uint256 courseId) external view returns (CourseMetrics memory) {
        return courseMetrics[courseId];
    }

    /**
     * @dev Obtiene métricas de IA
     */
    function getAIMetrics(uint256 period) external view returns (AIMetrics memory) {
        return aiMetrics[period];
    }

    /**
     * @dev Obtiene métricas de red
     */
    function getNetworkMetrics(uint256 period) external view returns (NetworkMetrics memory) {
        return networkMetrics[period];
    }

    /**
     * @dev Obtiene resumen de métricas
     */
    function getMetricsSummary() external view returns (
        uint256 totalUsers,
        uint256 totalCourses,
        uint256 totalRevenue,
        uint256 avgCompletionRate,
        uint256 avgUserSatisfaction
    ) {
        SystemMetrics storage latest = historicalMetrics[metricsCounter];
        return (
            latest.totalUsers,
            latest.totalCourses,
            latest.platformRevenue,
            latest.completionRate,
            0 // Calcular satisfacción promedio
        );
    }

    /**
     * @dev Registra optimización de gas
     */
    function recordGasOptimization(
        uint256 originalGas,
        uint256 optimizedGas,
        string calldata optimizationType
    ) external onlyRole(DATA_PROVIDER) {
        uint256 savings = originalGas - optimizedGas;
        totalGasUsed += optimizedGas;
        
        emit GasOptimizationDetected(savings, optimizationType);
    }

    /**
     * @dev Genera alerta de análisis
     */
    function generateAnalyticsAlert(
        string calldata alertType,
        string calldata description
    ) external onlyRole(ANALYTICS_ADMIN) {
        emit AnalyticsAlert(alertType, description);
    }

    /**
     * @dev Pausa el contrato
     */
    function pause() external onlyRole(ANALYTICS_ADMIN) {
        _pause();
    }

    /**
     * @dev Despausa el contrato
     */
    function unpause() external onlyRole(ANALYTICS_ADMIN) {
        _unpause();
    }
} 