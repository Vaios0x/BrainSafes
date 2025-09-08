// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@arbitrum/nitro-contracts/src/precompiles/ArbGasInfo.sol";
import "../cache/DistributedCache.sol";


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

    
    function _estimateGas(
        address target,
        bytes memory data,
        uint256 value
    ) internal view returns (uint256) {
        try this.executeOperation(target, data, value) {
            return 0; // La operación se ejecutó, usar gas real
        } catch {
            // Simplified L1 gas estimation - in production would use correct ArbGasInfo method
            return data.length * 16; // Approximation: 16 gas per byte
        }
    }

    
    function executeOperation(
        address target,
        bytes memory data,
        uint256 value
    ) external payable {
        require(msg.sender == address(this), "Only internal calls");
        (bool success,) = target.call{value: value}(data);
        require(success, "Operation failed");
    }

    
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

    
    function getBatchInfo(
        bytes32 batchId
    ) external view returns (BatchOperation memory) {
        return batches[batchId];
    }

    
    function getOptimizationStats() external view returns (
        uint256 batchCount,
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

    
    function shouldOptimize(
        uint256 gasEstimate,
        uint256 operationCount
    ) external view returns (bool) {
        return gasEstimate >= config.minGasThreshold &&
               operationCount >= config.minBatchSize;
    }

    
    function getTargetGasPrice() external view returns (uint256) {
        return config.targetGasPrice;
    }
} 