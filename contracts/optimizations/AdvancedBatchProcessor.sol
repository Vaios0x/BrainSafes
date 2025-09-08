// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";


contract AdvancedBatchProcessor is AccessControl, ReentrancyGuard {
    using SafeMath for uint256;

    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    struct BatchOperation {
        address target;
        bytes data;
        uint256 value;
        bool success;
        bytes result;
    }

    struct BatchConfig {
        uint256 maxBatchSize;
        uint256 gasLimit;
        uint256 timeout;
        bool allowFailures;
    }

    mapping(bytes32 => BatchOperation[]) public batchOperations;
    mapping(bytes32 => BatchConfig) public batchConfigs;
    mapping(bytes32 => bool) public processedBatches;

    uint256 public totalBatchesProcessed;
    uint256 public totalOperationsProcessed;
    uint256 public gasUsedTotal;

    event BatchCreated(bytes32 indexed batchId, uint256 operationCount);
    event BatchProcessed(bytes32 indexed batchId, uint256 successCount, uint256 failureCount);
    event OperationExecuted(bytes32 indexed batchId, address indexed target, bool success);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, msg.sender);
    }

    
    function createBatch(
        bytes32 batchId,
        address[] calldata targets,
        bytes[] calldata dataArray,
        uint256[] calldata values,
        BatchConfig calldata config
    ) external onlyRole(OPERATOR_ROLE) {
        require(targets.length > 0, "Empty batch");
        require(targets.length <= config.maxBatchSize, "Batch too large");
        require(targets.length == dataArray.length, "Array length mismatch");
        require(targets.length == values.length, "Array length mismatch");
        require(!processedBatches[batchId], "Batch already exists");

        batchConfigs[batchId] = config;
        BatchOperation[] storage operations = batchOperations[batchId];

        for (uint256 i = 0; i < targets.length; i++) {
            operations.push(BatchOperation({
                target: targets[i],
                data: dataArray[i],
                value: values[i],
                success: false,
                result: ""
            }));
        }

        emit BatchCreated(batchId, targets.length);
    }

    
    function executeBatch(bytes32 batchId) external onlyRole(OPERATOR_ROLE) nonReentrant {
        require(!processedBatches[batchId], "Batch already processed");
        require(batchOperations[batchId].length > 0, "Batch not found");

        BatchOperation[] storage operations = batchOperations[batchId];
        BatchConfig storage config = batchConfigs[batchId];
        
        uint256 successCount = 0;
        uint256 failureCount = 0;
        uint256 gasUsed = 0;

        for (uint256 i = 0; i < operations.length; i++) {
            uint256 gasBefore = gasleft();
            
            try this.executeOperation(batchId, i) {
                operations[i].success = true;
                successCount++;
            } catch {
                operations[i].success = false;
                failureCount++;
                
                if (!config.allowFailures) {
                    revert("Batch operation failed");
                }
            }
            
            gasUsed = gasUsed.add(gasBefore.sub(gasleft()));
            
            if (gasUsed > config.gasLimit) {
                revert("Gas limit exceeded");
            }
        }

        processedBatches[batchId] = true;
        totalBatchesProcessed = totalBatchesProcessed.add(1);
        totalOperationsProcessed = totalOperationsProcessed.add(operations.length);
        gasUsedTotal = gasUsedTotal.add(gasUsed);

        emit BatchProcessed(batchId, successCount, failureCount);
    }

    
    function executeOperation(bytes32 batchId, uint256 operationIndex) external {
        require(msg.sender == address(this), "Internal call only");
        
        BatchOperation storage operation = batchOperations[batchId][operationIndex];
        
        (bool success, bytes memory result) = operation.target.call{value: operation.value}(operation.data);
        
        operation.success = success;
        operation.result = result;
        
        emit OperationExecuted(batchId, operation.target, success);
    }

    
    function getBatchInfo(bytes32 batchId) external view returns (
        BatchOperation[] memory operations,
        BatchConfig memory config,
        bool processed
    ) {
        return (
            batchOperations[batchId],
            batchConfigs[batchId],
            processedBatches[batchId]
        );
    }

    
    function getBatchStats() external view returns (
        uint256 _totalBatchesProcessed,
        uint256 _totalOperationsProcessed,
        uint256 _gasUsedTotal
    ) {
        return (totalBatchesProcessed, totalOperationsProcessed, gasUsedTotal);
    }

    
    function estimateBatchGas(bytes32 batchId) external view returns (uint256) {
        require(!processedBatches[batchId], "Batch already processed");
        
        BatchOperation[] storage operations = batchOperations[batchId];
        uint256 estimatedGas = 0;
        
        for (uint256 i = 0; i < operations.length; i++) {
            // Base gas for each operation
            estimatedGas = estimatedGas.add(21000);
            
            // Add gas for data
            estimatedGas = estimatedGas.add(operations[i].data.length.mul(16));
            
            // Add value transfer gas if applicable
            if (operations[i].value > 0) {
                estimatedGas = estimatedGas.add(9000);
            }
        }
        
        return estimatedGas;
    }

    
    function updateBatchConfig(bytes32 batchId, BatchConfig calldata newConfig) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(!processedBatches[batchId], "Batch already processed");
        batchConfigs[batchId] = newConfig;
    }

    
    function cancelBatch(bytes32 batchId) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(!processedBatches[batchId], "Batch already processed");
        delete batchOperations[batchId];
        delete batchConfigs[batchId];
    }

    
    function withdrawETH(uint256 amount, address payable recipient) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(recipient != address(0), "Invalid recipient");
        require(amount <= address(this).balance, "Insufficient balance");
        
        (bool success, ) = recipient.call{value: amount}("");
        require(success, "Transfer failed");
    }
} 