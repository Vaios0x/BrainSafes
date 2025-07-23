// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@arbitrum/nitro-contracts/src/precompiles/ArbSys.sol";
import "@arbitrum/nitro-contracts/src/precompiles/NodeInterface.sol";
import "../cache/DistributedCache.sol";

/**
 * @title ChainMonitor
 * @notice Blockchain monitoring contract for BrainSafes
 * @dev Tracks chain health, events, and anomalies
 * @author BrainSafes Team
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
     * @notice Collects metrics from the blockchain.
     * @dev Only roles with MONITOR_ROLE can call this function.
     *      Checks if metrics are collected within the METRICS_INTERVAL.
     *      Retrieves block information from NodeInterface.
     *      Calculates and caches metrics.
     *      Emits MetricsCollected event.
     *      Performs threshold checks.
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
     * @notice Performs a health check on the blockchain.
     * @dev Only roles with MONITOR_ROLE can call this function.
     *      Checks if health check is performed within the HEALTH_CHECK_INTERVAL.
     *      Evaluates chain health, state size, and average block time.
     *      Emits HealthCheckPerformed event.
     *      Creates maintenance tasks if health is compromised.
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
     * @notice Creates a new maintenance task.
     * @dev Only roles with MAINTAINER_ROLE can call this function.
     *      Assigns a task ID and initializes its status.
     *      Emits MaintenanceTaskCreated event.
     * @param description A description of the task.
     * @param taskType The type of maintenance task.
     * @return The ID of the created maintenance task.
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
     * @notice Completes a maintenance task.
     * @dev Only roles with MAINTAINER_ROLE can call this function.
     *      Updates the task's status, completion time, and result.
     *      Emits MaintenanceTaskCompleted event.
     * @param taskId The ID of the task to complete.
     * @param success A boolean indicating if the task completed successfully.
     * @param result A string containing the result of the task.
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
     * @notice Checks various thresholds and emits warnings if conditions are met.
     * @dev Internal function to evaluate metrics against predefined thresholds.
     * @param metrics The current chain metrics.
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
     * @notice Retrieves the current state size of the blockchain.
     * @dev Placeholder implementation.
     * @return The current state size in bytes.
     */
    function _getStateSize() internal view returns (uint256) {
        // Implementar obtención real del tamaño del estado
        return 0;
    }

    /**
     * @notice Retrieves the current transaction count of the blockchain.
     * @dev Placeholder implementation.
     * @return The current transaction count.
     */
    function _getTxCount() internal view returns (uint256) {
        // Implementar conteo real de transacciones
        return 0;
    }

    /**
     * @notice Calculates the average block time of the blockchain.
     * @dev Placeholder implementation.
     * @return The average block time in seconds.
     */
    function _calculateAvgBlockTime() internal view returns (uint256) {
        // Implementar cálculo real
        return 0;
    }

    /**
     * @notice Appends a warning message to the array of warnings.
     * @dev Internal helper function to concatenate warnings.
     * @param warnings The existing array of warnings.
     * @param warning The new warning message to add.
     * @return A new array containing all original warnings plus the new one.
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
     * @notice Retrieves the timestamp of the last collected metrics.
     * @dev Public view function.
     * @return The timestamp of the last collected metrics.
     */
    function getLastMetricTimestamp() public view returns (uint256) {
        if (lastMetricId == 0) return 0;
        return historicalMetrics[lastMetricId].timestamp;
    }

    /**
     * @notice Retrieves the timestamp of the last performed health check.
     * @dev Public view function.
     * @return The timestamp of the last health check.
     */
    function getLastHealthCheckTimestamp() public view returns (uint256) {
        if (lastHealthCheckId == 0) return 0;
        return healthChecks[lastHealthCheckId].lastCheck;
    }

    /**
     * @notice Retrieves historical metrics within a specified range.
     * @dev Public view function.
     * @param fromId The starting metric ID.
     * @param toId The ending metric ID.
     * @return An array of ChainMetrics.
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
     * @notice Retrieves pending maintenance tasks.
     * @dev Public view function.
     * @return An array of MaintenanceTask objects.
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