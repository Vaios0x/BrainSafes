// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@arbitrum/nitro-contracts/src/precompiles/ArbSys.sol";
import "@arbitrum/nitro-contracts/src/precompiles/NodeInterface.sol";
import "../cache/DistributedCache.sol";

/**
 * @title ChainMonitor
 * @dev Sistema de monitoreo y mantenimiento para la cadena Arbitrum
 */
contract ChainMonitor is AccessControl {
    bytes32 public constant MONITOR_ROLE = keccak256("MONITOR_ROLE");
    bytes32 public constant MAINTAINER_ROLE = keccak256("MAINTAINER_ROLE");

    ArbSys constant arbsys = ArbSys(address(0x64));
    NodeInterface constant nodeInterface = NodeInterface(address(0xc8));
    DistributedCache public cache;

    struct ChainMetrics {
        uint256 blockNumber;
        uint256 timestamp;
        uint256 gasPrice;
        uint256 l1GasPrice;
        uint256 stateSize;
        uint256 txCount;
        uint256 avgBlockTime;
    }

    struct HealthCheck {
        bool isHealthy;
        uint256 lastCheck;
        string status;
        uint256 score;
        string[] warnings;
    }

    struct MaintenanceTask {
        uint256 taskId;
        string description;
        TaskType taskType;
        TaskStatus status;
        uint256 createdAt;
        uint256 completedAt;
        address assignedTo;
        string result;
    }

    enum TaskType {
        STATE_CLEANUP,
        PERFORMANCE_OPTIMIZATION,
        SECURITY_UPDATE,
        BUG_FIX,
        ROUTINE_MAINTENANCE
    }

    enum TaskStatus {
        PENDING,
        IN_PROGRESS,
        COMPLETED,
        FAILED
    }

    // Estado del contrato
    mapping(uint256 => ChainMetrics) public historicalMetrics;
    mapping(uint256 => HealthCheck) public healthChecks;
    mapping(uint256 => MaintenanceTask) public maintenanceTasks;
    
    uint256 public lastMetricId;
    uint256 public lastHealthCheckId;
    uint256 public lastTaskId;
    
    // Configuración
    uint256 public constant METRICS_INTERVAL = 1 hours;
    uint256 public constant HEALTH_CHECK_INTERVAL = 15 minutes;
    uint256 public constant MAX_STATE_SIZE = 1e12; // 1TB
    uint256 public constant WARN_STATE_SIZE = 8e11; // 800GB

    // Eventos
    event MetricsCollected(uint256 indexed metricId, ChainMetrics metrics);
    event HealthCheckPerformed(uint256 indexed checkId, bool isHealthy, string status);
    event MaintenanceTaskCreated(uint256 indexed taskId, TaskType taskType);
    event MaintenanceTaskCompleted(uint256 indexed taskId, bool success);
    event WarningIssued(string warning, uint256 severity);
    event StateCleanupRequired(uint256 currentSize, uint256 threshold);

    constructor(address _cache) {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(MONITOR_ROLE, msg.sender);
        _setupRole(MAINTAINER_ROLE, msg.sender);
        
        cache = DistributedCache(_cache);
    }

    /**
     * @dev Recolectar métricas de la cadena
     */
    function collectMetrics() external onlyRole(MONITOR_ROLE) {
        require(
            block.timestamp >= getLastMetricTimestamp() + METRICS_INTERVAL,
            "Too soon for new metrics"
        );

        // Obtener información del nodo
        NodeInterface.BlockInfo memory info = nodeInterface.blockInfo();
        
        lastMetricId++;
        ChainMetrics memory metrics = ChainMetrics({
            blockNumber: info.number,
            timestamp: block.timestamp,
            gasPrice: info.baseFee,
            l1GasPrice: info.l1BaseFee,
            stateSize: _getStateSize(),
            txCount: _getTxCount(),
            avgBlockTime: _calculateAvgBlockTime()
        });

        historicalMetrics[lastMetricId] = metrics;
        
        // Cachear métricas para acceso rápido
        bytes32 cacheKey = keccak256(abi.encodePacked("metrics", lastMetricId));
        cache.set(cacheKey, abi.encode(metrics), block.timestamp + 7 days);

        emit MetricsCollected(lastMetricId, metrics);

        // Verificar umbrales
        _checkThresholds(metrics);
    }

    /**
     * @dev Realizar health check
     */
    function performHealthCheck() external onlyRole(MONITOR_ROLE) {
        require(
            block.timestamp >= getLastHealthCheckTimestamp() + HEALTH_CHECK_INTERVAL,
            "Too soon for health check"
        );

        lastHealthCheckId++;
        string[] memory warnings = new string[](0);
        
        // Verificar estado de la cadena
        bool isHealthy = true;
        uint256 score = 100;
        string memory status = "healthy";

        // Verificar tamaño del estado
        uint256 stateSize = _getStateSize();
        if (stateSize >= MAX_STATE_SIZE) {
            isHealthy = false;
            status = "critical_state_size";
            score = 0;
        } else if (stateSize >= WARN_STATE_SIZE) {
            score = 50;
            status = "warning_state_size";
            warnings = _appendWarning(warnings, "State size approaching limit");
        }

        // Verificar rendimiento
        uint256 avgBlockTime = _calculateAvgBlockTime();
        if (avgBlockTime > 15 seconds) {
            score -= 20;
            warnings = _appendWarning(warnings, "High average block time");
        }

        HealthCheck memory healthCheck = HealthCheck({
            isHealthy: isHealthy,
            lastCheck: block.timestamp,
            status: status,
            score: score,
            warnings: warnings
        });

        healthChecks[lastHealthCheckId] = healthCheck;
        
        emit HealthCheckPerformed(lastHealthCheckId, isHealthy, status);

        // Crear tarea de mantenimiento si es necesario
        if (!isHealthy) {
            _createMaintenanceTask(
                "Critical state size cleanup required",
                TaskType.STATE_CLEANUP
            );
        }
    }

    /**
     * @dev Crear tarea de mantenimiento
     */
    function createMaintenanceTask(
        string calldata description,
        TaskType taskType
    ) external onlyRole(MAINTAINER_ROLE) returns (uint256) {
        return _createMaintenanceTask(description, taskType);
    }

    function _createMaintenanceTask(
        string memory description,
        TaskType taskType
    ) internal returns (uint256) {
        lastTaskId++;
        
        maintenanceTasks[lastTaskId] = MaintenanceTask({
            taskId: lastTaskId,
            description: description,
            taskType: taskType,
            status: TaskStatus.PENDING,
            createdAt: block.timestamp,
            completedAt: 0,
            assignedTo: address(0),
            result: ""
        });

        emit MaintenanceTaskCreated(lastTaskId, taskType);
        return lastTaskId;
    }

    /**
     * @dev Completar tarea de mantenimiento
     */
    function completeMaintenanceTask(
        uint256 taskId,
        bool success,
        string calldata result
    ) external onlyRole(MAINTAINER_ROLE) {
        MaintenanceTask storage task = maintenanceTasks[taskId];
        require(task.status == TaskStatus.IN_PROGRESS, "Task not in progress");
        require(task.assignedTo == msg.sender, "Not assigned to caller");

        task.status = success ? TaskStatus.COMPLETED : TaskStatus.FAILED;
        task.completedAt = block.timestamp;
        task.result = result;

        emit MaintenanceTaskCompleted(taskId, success);
    }

    /**
     * @dev Verificar umbrales
     */
    function _checkThresholds(ChainMetrics memory metrics) internal {
        if (metrics.stateSize >= WARN_STATE_SIZE) {
            emit StateCleanupRequired(metrics.stateSize, WARN_STATE_SIZE);
        }
        
        if (metrics.avgBlockTime > 15 seconds) {
            emit WarningIssued("High average block time", 1);
        }
    }

    /**
     * @dev Obtener tamaño del estado
     */
    function _getStateSize() internal view returns (uint256) {
        // Implementar obtención real del tamaño del estado
        return 0;
    }

    /**
     * @dev Obtener conteo de transacciones
     */
    function _getTxCount() internal view returns (uint256) {
        // Implementar conteo real de transacciones
        return 0;
    }

    /**
     * @dev Calcular tiempo promedio de bloque
     */
    function _calculateAvgBlockTime() internal view returns (uint256) {
        // Implementar cálculo real
        return 0;
    }

    /**
     * @dev Añadir advertencia al array
     */
    function _appendWarning(
        string[] memory warnings,
        string memory warning
    ) internal pure returns (string[] memory) {
        string[] memory newWarnings = new string[](warnings.length + 1);
        for (uint i = 0; i < warnings.length; i++) {
            newWarnings[i] = warnings[i];
        }
        newWarnings[warnings.length] = warning;
        return newWarnings;
    }

    /**
     * @dev Obtener última marca de tiempo de métricas
     */
    function getLastMetricTimestamp() public view returns (uint256) {
        if (lastMetricId == 0) return 0;
        return historicalMetrics[lastMetricId].timestamp;
    }

    /**
     * @dev Obtener última marca de tiempo de health check
     */
    function getLastHealthCheckTimestamp() public view returns (uint256) {
        if (lastHealthCheckId == 0) return 0;
        return healthChecks[lastHealthCheckId].lastCheck;
    }

    /**
     * @dev Obtener métricas históricas
     */
    function getHistoricalMetrics(
        uint256 fromId,
        uint256 toId
    ) external view returns (ChainMetrics[] memory) {
        require(fromId <= toId && toId <= lastMetricId, "Invalid range");
        
        ChainMetrics[] memory metrics = new ChainMetrics[](toId - fromId + 1);
        for (uint256 i = 0; i <= toId - fromId; i++) {
            metrics[i] = historicalMetrics[fromId + i];
        }
        
        return metrics;
    }

    /**
     * @dev Obtener tareas de mantenimiento pendientes
     */
    function getPendingTasks() external view returns (MaintenanceTask[] memory) {
        uint256 pendingCount = 0;
        for (uint256 i = 1; i <= lastTaskId; i++) {
            if (maintenanceTasks[i].status == TaskStatus.PENDING) {
                pendingCount++;
            }
        }

        MaintenanceTask[] memory tasks = new MaintenanceTask[](pendingCount);
        uint256 index = 0;
        for (uint256 i = 1; i <= lastTaskId; i++) {
            if (maintenanceTasks[i].status == TaskStatus.PENDING) {
                tasks[index] = maintenanceTasks[i];
                index++;
            }
        }

        return tasks;
    }
} 