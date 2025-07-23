// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@arbitrum/nitro-contracts/src/precompiles/ArbGasInfo.sol";
import "../cache/DistributedCache.sol";

/**
 * @title CostOptimizer
 * @notice Cost optimization contract for BrainSafes
 * @dev Reduces gas and storage costs for key operations
 * @author BrainSafes Team
 */
contract CostOptimizer is AccessControl, ReentrancyGuard {
    bytes32 public constant OPTIMIZER_ROLE = keccak256("OPTIMIZER_ROLE");
    bytes32 public constant BATCH_PROCESSOR_ROLE = keccak256("BATCH_PROCESSOR_ROLE");

    ArbGasInfo constant arbGasInfo = ArbGasInfo(address(0x6c));
    DistributedCache public cache;

    struct OptimizationConfig {
        uint256 minBatchSize;
        uint256 maxBatchSize;
        uint256 minGasThreshold;
        uint256 maxGasPerBatch;
        bool compressionEnabled;
        uint256 targetGasPrice;
    }

    struct BatchOperation {
        bytes32 batchId;
        address[] targets;
        bytes[] data;
        uint256[] values;
        uint256 timestamp;
        uint256 gasEstimate;
        BatchStatus status;
        uint256 actualGasUsed;
        string errorMessage;
    }

    struct OptimizationStats {
        uint256 totalBatches;
        uint256 totalOperations;
        uint256 totalGasSaved;
        uint256 avgGasSaving;
        uint256 lastOptimization;
    }

    enum BatchStatus {
        PENDING,
        PROCESSING,
        COMPLETED,
        FAILED
    }

    // Estado del contrato
    mapping(bytes32 => BatchOperation) public batches;
    mapping(address => bytes32[]) public userBatches;
    OptimizationConfig public config;
    OptimizationStats public stats;

    // Eventos
    event BatchCreated(bytes32 indexed batchId, uint256 operationCount);
    event BatchProcessed(bytes32 indexed batchId, uint256 gasUsed, uint256 gasSaved);
    event OptimizationConfigUpdated(OptimizationConfig config);
    event GasSavingsAchieved(bytes32 indexed batchId, uint256 saved);
    event BatchError(bytes32 indexed batchId, string error);

    constructor(address _cache) {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(OPTIMIZER_ROLE, msg.sender);
        _setupRole(BATCH_PROCESSOR_ROLE, msg.sender);
        
        cache = DistributedCache(_cache);

        // Configuración inicial
        config = OptimizationConfig({
            minBatchSize: 5,
            maxBatchSize: 50,
            minGasThreshold: 100000, // 100k gas
            maxGasPerBatch: 5000000, // 5M gas
            compressionEnabled: true,
            targetGasPrice: 0.1 gwei
        });

        // Inicializar estadísticas
        stats = OptimizationStats({
            totalBatches: 0,
            totalOperations: 0,
            totalGasSaved: 0,
            avgGasSaving: 0,
            lastOptimization: block.timestamp
        });
    }

    /**
     * @notice Creates a new batch of operations.
     * @dev Only roles with OPTIMIZER_ROLE can call this function.
     * @param targets Array of addresses to call.
     * @param data Array of bytes data for each operation.
     * @param values Array of uint256 values for each operation.
     * @return bytes32 The ID of the created batch.
     */
    function createBatch(
        address[] calldata targets,
        bytes[] calldata data,
        uint256[] calldata values
    ) external onlyRole(OPTIMIZER_ROLE) returns (bytes32) {
        require(
            targets.length >= config.minBatchSize &&
            targets.length <= config.maxBatchSize,
            "Invalid batch size"
        );
        require(
            targets.length == data.length && 
            targets.length == values.length,
            "Array length mismatch"
        );

        // Calcular ID del batch
        bytes32 batchId = keccak256(abi.encodePacked(
            block.timestamp,
            msg.sender,
            targets.length
        ));

        // Estimar gas total
        uint256 totalGas = 0;
        for (uint256 i = 0; i < targets.length; i++) {
            totalGas += _estimateGas(targets[i], data[i], values[i]);
        }
        require(totalGas <= config.maxGasPerBatch, "Batch gas too high");

        // Crear batch
        batches[batchId] = BatchOperation({
            batchId: batchId,
            targets: targets,
            data: data,
            values: values,
            timestamp: block.timestamp,
            gasEstimate: totalGas,
            status: BatchStatus.PENDING,
            actualGasUsed: 0,
            errorMessage: ""
        });

        // Actualizar estadísticas
        stats.totalBatches++;
        stats.totalOperations += targets.length;
        stats.lastOptimization = block.timestamp;

        // Cachear datos del batch
        bytes32 cacheKey = keccak256(abi.encodePacked("batch", batchId));
        cache.set(cacheKey, abi.encode(data), block.timestamp + 1 days);

        emit BatchCreated(batchId, targets.length);
        return batchId;
    }

    /**
     * @notice Processes a batch of operations.
     * @dev Only roles with BATCH_PROCESSOR_ROLE can call this function.
     * @param batchId The ID of the batch to process.
     * @return bool True if the batch was processed successfully, false otherwise.
     */
    function processBatch(
        bytes32 batchId
    ) external onlyRole(BATCH_PROCESSOR_ROLE) nonReentrant returns (bool) {
        BatchOperation storage batch = batches[batchId];
        require(batch.timestamp > 0, "Batch not found");
        require(batch.status == BatchStatus.PENDING, "Invalid batch status");

        batch.status = BatchStatus.PROCESSING;
        uint256 startGas = gasleft();

        try this.executeBatchOperations(batchId) {
            uint256 gasUsed = startGas - gasleft();
            uint256 gasSaved = batch.gasEstimate - gasUsed;
            
            batch.status = BatchStatus.COMPLETED;
            batch.actualGasUsed = gasUsed;

            // Actualizar estadísticas
            stats.totalGasSaved += gasSaved;
            stats.avgGasSaving = stats.totalGasSaved / stats.totalBatches;

            emit BatchProcessed(batchId, gasUsed, gasSaved);
            emit GasSavingsAchieved(batchId, gasSaved);
            return true;
        } catch Error(string memory error) {
            batch.status = BatchStatus.FAILED;
            batch.errorMessage = error;
            emit BatchError(batchId, error);
            return false;
        }
    }

    /**
     * @notice Executes operations within a batch.
     * @dev This function is called internally by processBatch.
     * @param batchId The ID of the batch to execute.
     * @return bool True if all operations were executed successfully, false otherwise.
     */
    function executeBatchOperations(
        bytes32 batchId
    ) external returns (bool) {
        require(msg.sender == address(this), "Only internal calls");
        
        BatchOperation storage batch = batches[batchId];
        
        for (uint256 i = 0; i < batch.targets.length; i++) {
            (bool success, bytes memory result) = batch.targets[i].call{value: batch.values[i]}(batch.data[i]);
            require(success, string(result));
        }
        
        return true;
    }

    /**
     * @notice Estimates gas for a single operation.
     * @dev This function is used to estimate gas for a single operation.
     * @param target The address to call.
     * @param data The bytes data for the operation.
     * @param value The uint256 value for the operation.
     * @return uint256 The estimated gas.
     */
    function _estimateGas(
        address target,
        bytes memory data,
        uint256 value
    ) internal view returns (uint256) {
        try this.executeOperation(target, data, value) {
            return 0; // La operación se ejecutó, usar gas real
        } catch {
            return arbGasInfo.getL1GasUsed(data);
        }
    }

    /**
     * @notice Executes a single operation individually (for estimation).
     * @dev This function is used to execute a single operation for gas estimation.
     * @param target The address to call.
     * @param data The bytes data for the operation.
     * @param value The uint256 value for the operation.
     */
    function executeOperation(
        address target,
        bytes memory data,
        uint256 value
    ) external payable {
        require(msg.sender == address(this), "Only internal calls");
        (bool success,) = target.call{value: value}(data);
        require(success, "Operation failed");
    }

    /**
     * @notice Updates the optimization configuration.
     * @dev Only roles with DEFAULT_ADMIN_ROLE can call this function.
     * @param _minBatchSize The minimum batch size.
     * @param _maxBatchSize The maximum batch size.
     * @param _minGasThreshold The minimum gas threshold.
     * @param _maxGasPerBatch The maximum gas per batch.
     * @param _compressionEnabled Whether compression is enabled.
     * @param _targetGasPrice The target gas price.
     */
    function updateConfig(
        uint256 _minBatchSize,
        uint256 _maxBatchSize,
        uint256 _minGasThreshold,
        uint256 _maxGasPerBatch,
        bool _compressionEnabled,
        uint256 _targetGasPrice
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_minBatchSize <= _maxBatchSize, "Invalid batch size range");
        require(_minGasThreshold <= _maxGasPerBatch, "Invalid gas range");

        config = OptimizationConfig({
            minBatchSize: _minBatchSize,
            maxBatchSize: _maxBatchSize,
            minGasThreshold: _minGasThreshold,
            maxGasPerBatch: _maxGasPerBatch,
            compressionEnabled: _compressionEnabled,
            targetGasPrice: _targetGasPrice
        });

        emit OptimizationConfigUpdated(config);
    }

    /**
     * @notice Retrieves information about a batch.
     * @param batchId The ID of the batch to retrieve.
     * @return BatchOperation The information about the batch.
     */
    function getBatchInfo(
        bytes32 batchId
    ) external view returns (BatchOperation memory) {
        return batches[batchId];
    }

    /**
     * @notice Retrieves optimization statistics.
     * @return uint256 The total number of batches.
     * @return uint256 The total number of operations.
     * @return uint256 The total gas saved.
     * @return uint256 The average gas saving.
     */
    function getOptimizationStats() external view returns (
        uint256 batches,
        uint256 operations,
        uint256 gasSaved,
        uint256 avgSaving
    ) {
        return (
            stats.totalBatches,
            stats.totalOperations,
            stats.totalGasSaved,
            stats.avgGasSaving
        );
    }

    /**
     * @notice Checks if an operation should be optimized.
     * @param gasEstimate The estimated gas for the operation.
     * @param operationCount The number of operations in the batch.
     * @return bool True if optimization should be applied, false otherwise.
     */
    function shouldOptimize(
        uint256 gasEstimate,
        uint256 operationCount
    ) external view returns (bool) {
        return gasEstimate >= config.minGasThreshold &&
               operationCount >= config.minBatchSize;
    }

    /**
     * @notice Gets the current target gas price.
     * @return uint256 The target gas price.
     */
    function getTargetGasPrice() external view returns (uint256) {
        return config.targetGasPrice;
    }
} 