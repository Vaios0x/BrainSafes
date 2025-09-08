// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;


import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract EnhancedMulticall is AccessControl, ReentrancyGuard, Pausable {
    // ========== CONSTANTS ==========
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    uint256 public constant MAX_BATCH_SIZE = 100;
    uint256 public constant MAX_GAS_LIMIT = 100000000;
    uint256 public constant MIN_GAS_LIMIT = 21000;
    uint256 public constant DEFAULT_GAS_LIMIT = 500000;

    // ========== STATE VARIABLES ==========
    mapping(address => bool) public whitelistedTargets;
    mapping(address => uint256) public targetUsageCount;
    mapping(bytes32 => bool) public executedBatches;
    
    uint256 public totalBatchesExecuted;
    uint256 public totalCallsExecuted;
    uint256 public totalGasUsed;
    uint256 public totalGasSaved;
    uint256 public lastExecutionTime;

    // ========== STRUCTURES ==========
    struct Call {
        address target;
        bytes callData;
        uint256 gasLimit;
        uint256 value;
        bool allowFailure;
    }

    struct Result {
        bool success;
        bytes returnData;
        uint256 gasUsed;
        string errorMessage;
    }

    struct BatchExecution {
        bytes32 batchId;
        Call[] calls;
        uint256 totalGasLimit;
        uint256 timestamp;
        address executor;
    }

    struct ExecutionStats {
        uint256 totalBatches;
        uint256 totalCalls;
        uint256 successfulCalls;
        uint256 failedCalls;
        uint256 totalGasUsed;
        uint256 totalGasSaved;
        uint256 averageGasPerCall;
    }

    // ========== EVENTS ==========
    event BatchExecuted(
        bytes32 indexed batchId,
        address indexed executor,
        uint256 totalCalls,
        uint256 successfulCalls,
        uint256 totalGasUsed
    );
    
    event CallExecuted(
        bytes32 indexed batchId,
        address indexed target,
        bool success,
        uint256 gasUsed,
        string errorMessage
    );
    
    event TargetWhitelisted(address indexed target, bool whitelisted);
    event GasOptimization(uint256 gasUsed, uint256 gasSaved, uint256 efficiency);
    event BatchFailed(bytes32 indexed batchId, string reason);
    event EmergencyPaused(address indexed admin);
    event EmergencyUnpaused(address indexed admin);

    // ========== CONSTRUCTOR ==========
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, msg.sender);
    }

    // ========== CORE MULTICALL FUNCTIONS ==========
    
    function aggregate(
        Call[] calldata calls
    ) external whenNotPaused nonReentrant returns (Result[] memory results) {
        require(calls.length > 0, "Empty batch");
        require(calls.length <= MAX_BATCH_SIZE, "Batch too large");
        
        bytes32 batchId = keccak256(abi.encodePacked(block.timestamp, msg.sender));
        require(!executedBatches[batchId], "Batch already executed");
        
        uint256 gasBefore = gasleft();
        results = new Result[](calls.length);
        uint256 successfulCalls = 0;
        uint256 batchTotalGasUsed = 0;
        
        for (uint256 i = 0; i < calls.length; i++) {
            Call memory call = calls[i];
            
            // Validate call
            require(call.target != address(0), "Invalid target");
            require(call.gasLimit >= MIN_GAS_LIMIT, "Gas limit too low");
            require(call.gasLimit <= MAX_GAS_LIMIT, "Gas limit too high");
            
            // Check whitelist if enabled
            if (whitelistedTargets[address(0)] == false) { // If whitelist is enabled
                require(whitelistedTargets[call.target], "Target not whitelisted");
            }
            
            uint256 callGasBefore = gasleft();
            
            // Execute call
            (bool success, bytes memory returnData) = call.target.call{
                gas: call.gasLimit,
                value: call.value
            }(call.callData);
            
            uint256 callGasUsed = callGasBefore - gasleft();
            batchTotalGasUsed += callGasUsed;
            
            // Update usage statistics
            targetUsageCount[call.target]++;
            
            // Create result
            string memory errorMessage = "";
            if (!success) {
                errorMessage = _extractErrorMessage(returnData);
            } else {
                successfulCalls++;
            }
            
            results[i] = Result({
                success: success,
                returnData: returnData,
                gasUsed: callGasUsed,
                errorMessage: errorMessage
            });
            
            emit CallExecuted(batchId, call.target, success, callGasUsed, errorMessage);
            
            // Revert if call failed and failure is not allowed
            if (!success && !call.allowFailure) {
                revert(string(abi.encodePacked("Call failed: ", errorMessage)));
            }
        }
        
        // Update statistics
        uint256 totalGas = gasBefore - gasleft();
        _updateStats(totalGas, successfulCalls, calls.length);
        
        // Mark batch as executed
        executedBatches[batchId] = true;
        totalBatchesExecuted++;
        
        emit BatchExecuted(batchId, msg.sender, calls.length, successfulCalls, totalGas);
    }

    
    function aggregateWithValue(
        Call[] calldata calls,
        uint256[] calldata values
    ) external payable whenNotPaused nonReentrant returns (Result[] memory results) {
        require(calls.length == values.length, "Array length mismatch");
        require(calls.length > 0, "Empty batch");
        require(calls.length <= MAX_BATCH_SIZE, "Batch too large");
        
        // Calculate total value
        uint256 totalValue = 0;
        for (uint256 i = 0; i < values.length; i++) {
            totalValue += values[i];
        }
        require(msg.value >= totalValue, "Insufficient value sent");
        
        // Create calls with values
        Call[] memory callsWithValue = new Call[](calls.length);
        for (uint256 i = 0; i < calls.length; i++) {
            callsWithValue[i] = Call({
                target: calls[i].target,
                callData: calls[i].callData,
                gasLimit: calls[i].gasLimit,
                value: values[i],
                allowFailure: calls[i].allowFailure
            });
        }
        
        results = this.aggregate(callsWithValue);
        
        // Refund excess value
        if (msg.value > totalValue) {
            payable(msg.sender).transfer(msg.value - totalValue);
        }
    }

    
    function aggregateOptimized(
        Call[] calldata calls,
        uint256 gasLimit
    ) external whenNotPaused nonReentrant returns (Result[] memory results) {
        require(calls.length > 0, "Empty batch");
        require(calls.length <= MAX_BATCH_SIZE, "Batch too large");
        require(gasLimit >= MIN_GAS_LIMIT, "Gas limit too low");
        require(gasLimit <= MAX_GAS_LIMIT, "Gas limit too high");
        
        uint256 gasBefore = gasleft();
        uint256 availableGas = gasLimit;
        uint256 gasPerCall = availableGas / calls.length;
        
        results = new Result[](calls.length);
        uint256 successfulCalls = 0;
        
        for (uint256 i = 0; i < calls.length; i++) {
            Call memory call = calls[i];
            call.gasLimit = gasPerCall; // Override individual gas limits
            
            uint256 callGasBefore = gasleft();
            
            (bool success, bytes memory returnData) = call.target.call{
                gas: call.gasLimit,
                value: call.value
            }(call.callData);
            
            uint256 callGasUsed = callGasBefore - gasleft();
            
            string memory errorMessage = "";
            if (!success) {
                errorMessage = _extractErrorMessage(returnData);
            } else {
                successfulCalls++;
            }
            
            results[i] = Result({
                success: success,
                returnData: returnData,
                gasUsed: callGasUsed,
                errorMessage: errorMessage
            });
        }
        
        uint256 optimizedTotalGasUsed = gasBefore - gasleft();
        uint256 gasSaved = gasLimit - optimizedTotalGasUsed;
        
        _updateStats(optimizedTotalGasUsed, successfulCalls, calls.length);
        totalGasSaved += gasSaved;
        
        emit GasOptimization(optimizedTotalGasUsed, gasSaved, (gasSaved * 100) / gasLimit);
    }

    // ========== ADVANCED FUNCTIONS ==========
    
    function aggregateWithRetry(
        Call[] calldata calls,
        uint256 maxRetries
    ) external whenNotPaused nonReentrant returns (Result[] memory results) {
        require(calls.length > 0, "Empty batch");
        require(calls.length <= MAX_BATCH_SIZE, "Batch too large");
        require(maxRetries <= 3, "Too many retries");
        
        results = new Result[](calls.length);
        
        for (uint256 i = 0; i < calls.length; i++) {
            Call memory call = calls[i];
            bool success = false;
            bytes memory returnData;
            uint256 gasUsed = 0;
            string memory errorMessage = "";
            
            // Try execution with retries
            for (uint256 retry = 0; retry <= maxRetries && !success; retry++) {
                uint256 callGasBefore = gasleft();
                
                (success, returnData) = call.target.call{
                    gas: call.gasLimit,
                    value: call.value
                }(call.callData);
                
                gasUsed = callGasBefore - gasleft();
                
                if (!success) {
                    errorMessage = _extractErrorMessage(returnData);
                    // Add small delay between retries (not implemented in this version)
                }
            }
            
            results[i] = Result({
                success: success,
                returnData: returnData,
                gasUsed: gasUsed,
                errorMessage: errorMessage
            });
        }
    }

    
    function aggregateConditional(
        Call[] calldata calls,
        bool[] calldata conditions
    ) external whenNotPaused nonReentrant returns (Result[] memory results) {
        require(calls.length == conditions.length, "Array length mismatch");
        require(calls.length > 0, "Empty batch");
        require(calls.length <= MAX_BATCH_SIZE, "Batch too large");
        
        results = new Result[](calls.length);
        
        for (uint256 i = 0; i < calls.length; i++) {
            if (conditions[i]) {
                Call memory call = calls[i];
                
                uint256 callGasBefore = gasleft();
                
                (bool success, bytes memory returnData) = call.target.call{
                    gas: call.gasLimit,
                    value: call.value
                }(call.callData);
                
                uint256 callGasUsed = callGasBefore - gasleft();
                
                string memory errorMessage = "";
                if (!success) {
                    errorMessage = _extractErrorMessage(returnData);
                }
                
                results[i] = Result({
                    success: success,
                    returnData: returnData,
                    gasUsed: callGasUsed,
                    errorMessage: errorMessage
                });
            } else {
                // Skip call
                results[i] = Result({
                    success: false,
                    returnData: "",
                    gasUsed: 0,
                    errorMessage: "Call skipped"
                });
            }
        }
    }

    // ========== UTILITY FUNCTIONS ==========
    
    function estimateBatchGas(Call[] calldata calls) external view returns (uint256 totalGas) {
        require(calls.length > 0, "Empty batch");
        require(calls.length <= MAX_BATCH_SIZE, "Batch too large");
        
        totalGas = 21000; // Base transaction cost
        
        for (uint256 i = 0; i < calls.length; i++) {
            Call memory call = calls[i];
            totalGas += call.gasLimit;
            totalGas += call.callData.length * 16; // Data cost
        }
        
        // Add overhead for batch processing
        totalGas += calls.length * 1000;
    }

    
    function getExecutionStats() external view returns (ExecutionStats memory stats) {
        stats.totalBatches = totalBatchesExecuted;
        stats.totalCalls = totalCallsExecuted;
        stats.totalGasUsed = totalGasUsed;
        stats.totalGasSaved = totalGasSaved;
        stats.averageGasPerCall = totalCallsExecuted > 0 ? totalGasUsed / totalCallsExecuted : 0;
        
        // Calculate success/failure rates (this would require additional tracking)
        stats.successfulCalls = totalCallsExecuted; // Simplified
        stats.failedCalls = 0; // Simplified
    }

    
    function isBatchExecuted(bytes32 batchId) external view returns (bool executed) {
        return executedBatches[batchId];
    }

    
    function getTargetStats(
        address target
    ) external view returns (uint256 usageCount, bool isWhitelisted) {
        return (targetUsageCount[target], whitelistedTargets[target]);
    }

    // ========== ADMIN FUNCTIONS ==========
    
    function setTargetWhitelist(
        address target,
        bool whitelisted
    ) external onlyRole(ADMIN_ROLE) {
        whitelistedTargets[target] = whitelisted;
        emit TargetWhitelisted(target, whitelisted);
    }

    
    function emergencyPause() external onlyRole(ADMIN_ROLE) {
        _pause();
        emit EmergencyPaused(msg.sender);
    }

    
    function emergencyUnpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
        emit EmergencyUnpaused(msg.sender);
    }

    
    function grantOperatorRole(address account) external onlyRole(ADMIN_ROLE) {
        _grantRole(OPERATOR_ROLE, account);
    }

    
    function revokeOperatorRole(address account) external onlyRole(ADMIN_ROLE) {
        _revokeRole(OPERATOR_ROLE, account);
    }

    // ========== INTERNAL FUNCTIONS ==========
    
    function _extractErrorMessage(
        bytes memory data
    ) internal pure returns (string memory errorMessage) {
        if (data.length == 0) {
            return "Unknown error";
        }
        
        // Try to decode as Error(string)
        if (data.length >= 4) {
            bytes4 selector;
            assembly {
                selector := mload(add(data, 4))
            }
            if (selector == bytes4(keccak256("Error(string)"))) {
                assembly {
                    errorMessage := add(data, 0x24)
                }
                return errorMessage;
            }
            
            // Try to decode as Panic(uint256)
            if (selector == bytes4(keccak256("Panic(uint256)"))) {
                return "Panic occurred";
            }
        }
        
        // Return raw data as hex
        return _bytesToHex(data);
    }

    
    function _bytesToHex(
        bytes memory data
    ) internal pure returns (string memory hexString) {
        hexString = new string(data.length * 2);
        bytes memory alphabet = "0123456789abcdef";
        
        for (uint256 i = 0; i < data.length; i++) {
            bytes1 b = data[i];
            bytes memory temp = new bytes(2);
            temp[0] = alphabet[uint8(b) >> 4];
            temp[1] = alphabet[uint8(b) & 0x0f];
            // Note: This is a simplified version that doesn't modify the string directly
        }
        
        // Return a simple hex representation
        return "0x";
    }

    
    function _updateStats(
        uint256 gasUsedAmount,
        uint256 successfulCalls,
        uint256 totalCalls
    ) internal {
        totalGasUsed += gasUsedAmount;
        totalCallsExecuted += totalCalls;
        lastExecutionTime = block.timestamp;
    }

    // ========== VIEW FUNCTIONS ==========
    
    function version() external pure returns (string memory) {
        return "2.0.0";
    }

    
    function getContractStats() external view returns (
        uint256 totalBatches,
        uint256 totalCalls,
        uint256 gasUsedTotal,
        uint256 lastExecution
    ) {
        return (totalBatchesExecuted, totalCallsExecuted, totalGasUsed, lastExecutionTime);
    }

    // ========== RECEIVE FUNCTION ==========
    
    receive() external payable {
        // Allow receiving ETH for value transfers
    }
} 