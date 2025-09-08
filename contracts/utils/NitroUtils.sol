// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;


library NitroUtils {
    // ========== STRUCTURES ==========
    
    struct GasEstimate {
        uint256 l1GasUsed;
        uint256 l2GasUsed;
        uint256 l1GasPrice;
        uint256 l2GasPrice;
        uint256 totalCost;
        uint256 submissionCost;
        uint256 maxFeePerGas;
        uint256 priorityFee;
    }

    
    struct MessageData {
        address sender;
        address recipient;
        bytes data;
        uint256 gasLimit;
        uint256 maxSubmissionCost;
        uint256 maxFeePerGas;
        uint256 value;
        bool isL1ToL2;
    }

    
    struct BatchData {
        address[] targets;
        bytes[] callData;
        uint256[] values;
        uint256 totalGasLimit;
    }

    
    struct CompressionData {
        bytes originalData;
        bytes compressedData;
        uint256 compressionRatio;
        uint256 gasSaved;
    }

    // ========== CONSTANTS ==========
    uint256 public constant L1_BASE_GAS = 21000;
    uint256 public constant L2_BASE_GAS = 21000;
    uint256 public constant DATA_GAS_PER_BYTE = 16;
    uint256 public constant SUBMISSION_COST_MULTIPLIER = 1000; // 0.1%
    uint256 public constant MAX_GAS_LIMIT = 100000000;
    uint256 public constant MIN_GAS_LIMIT = 21000;

    // ========== GAS ESTIMATION FUNCTIONS ==========
    
    function estimateL1ToL2Gas(
        bytes calldata data,
        uint256 value
    ) internal pure returns (GasEstimate memory estimate) {
        estimate.l1GasUsed = L1_BASE_GAS + (data.length * DATA_GAS_PER_BYTE);
        estimate.l2GasUsed = L2_BASE_GAS + (data.length * DATA_GAS_PER_BYTE);
        estimate.l1GasPrice = 20000000000; // 20 gwei
        estimate.l2GasPrice = 1000000000; // 1 gwei
        estimate.maxFeePerGas = 25000000000; // 25 gwei
        estimate.priorityFee = 1500000000; // 1.5 gwei
        
        if (value > 0) {
            estimate.l1GasUsed += 9000; // Additional cost for value transfer
            estimate.l2GasUsed += 9000;
        }
        
        estimate.totalCost = (estimate.l1GasUsed * estimate.l1GasPrice) + 
                           (estimate.l2GasUsed * estimate.l2GasPrice);
        estimate.submissionCost = estimate.totalCost / SUBMISSION_COST_MULTIPLIER;
    }

    
    function estimateL2ToL1Gas(
        bytes calldata data
    ) internal pure returns (GasEstimate memory estimate) {
        estimate.l2GasUsed = L2_BASE_GAS + (data.length * DATA_GAS_PER_BYTE) + 50000; // Additional L2->L1 cost
        estimate.l2GasPrice = 1000000000; // 1 gwei
        estimate.maxFeePerGas = 1500000000; // 1.5 gwei
        estimate.priorityFee = 500000000; // 0.5 gwei
        estimate.totalCost = estimate.l2GasUsed * estimate.l2GasPrice;
    }

    
    function calculateOptimalGasLimit(
        uint256 baseGas,
        uint256 dataSize,
        uint256 value,
        bool isL1ToL2
    ) internal pure returns (uint256 optimalGas) {
        optimalGas = baseGas + (dataSize * DATA_GAS_PER_BYTE);
        
        if (value > 0) {
            optimalGas += 9000; // Value transfer cost
        }
        
        if (isL1ToL2) {
            optimalGas += 50000; // L1 to L2 overhead
        }
        
        // Add safety margin
        optimalGas = optimalGas + (optimalGas * 20 / 100); // 20% safety margin
        
        // Ensure within bounds
        if (optimalGas < MIN_GAS_LIMIT) optimalGas = MIN_GAS_LIMIT;
        if (optimalGas > MAX_GAS_LIMIT) optimalGas = MAX_GAS_LIMIT;
    }

    
    function calculateSubmissionCost(
        uint256 gasLimit,
        uint256 maxFeePerGas
    ) internal pure returns (uint256 submissionCost) {
        submissionCost = (gasLimit * maxFeePerGas) / SUBMISSION_COST_MULTIPLIER;
        if (submissionCost < 1000000000000000) { // 0.001 ETH minimum
            submissionCost = 1000000000000000;
        }
    }

    // ========== MESSAGE VALIDATION FUNCTIONS ==========
    
    function validateMessage(
        MessageData memory message
    ) internal pure returns (bool isValid, string memory errorMessage) {
        if (message.sender == address(0)) {
            return (false, "Invalid sender address");
        }
        if (message.recipient == address(0)) {
            return (false, "Invalid recipient address");
        }
        if (message.gasLimit < MIN_GAS_LIMIT) {
            return (false, "Gas limit too low");
        }
        if (message.gasLimit > MAX_GAS_LIMIT) {
            return (false, "Gas limit too high");
        }
        if (message.maxSubmissionCost == 0) {
            return (false, "Invalid submission cost");
        }
        if (message.data.length > 100000) { // 100KB limit
            return (false, "Data too large");
        }
        return (true, "");
    }

    
    function validateBatch(
        BatchData memory batch
    ) internal pure returns (bool isValid, string memory errorMessage) {
        if (batch.targets.length == 0) {
            return (false, "Empty batch");
        }
        if (batch.targets.length != batch.callData.length) {
            return (false, "Mismatched arrays");
        }
        if (batch.targets.length != batch.values.length) {
            return (false, "Mismatched values array");
        }
        if (batch.targets.length > 100) { // Max 100 calls per batch
            return (false, "Batch too large");
        }
        
        for (uint256 i = 0; i < batch.targets.length; i++) {
            if (batch.targets[i] == address(0)) {
                return (false, "Invalid target address");
            }
        }
        
        return (true, "");
    }

    // ========== COMPRESSION FUNCTIONS ==========
    
    function compressAddress(address addr) internal pure returns (bytes20 compressed) {
        return bytes20(addr);
    }

    
    function decompressAddress(bytes20 compressed) internal pure returns (address addr) {
        return address(compressed);
    }

    
    function compressData(bytes memory data) internal pure returns (bytes memory compressed) {
        if (data.length == 0) return data;
        
        // Simple compression: replace repeated bytes with count + byte
        compressed = new bytes(data.length * 2); // Worst case scenario
        uint256 compressedIndex = 0;
        uint256 i = 0;
        
        while (i < data.length) {
            uint8 currentByte = uint8(data[i]);
            uint256 count = 1;
            
            // Count consecutive identical bytes
            while (i + count < data.length && 
                   uint8(data[i + count]) == currentByte && 
                   count < 255) {
                count++;
            }
            
            // Write count and byte
            compressed[compressedIndex] = bytes1(uint8(count));
            compressed[compressedIndex + 1] = bytes1(currentByte);
            compressedIndex += 2;
            i += count;
        }
        
        // Resize to actual compressed size
        assembly {
            mstore(compressed, compressedIndex)
        }
    }

    
    function decompressData(bytes memory compressed) internal pure returns (bytes memory data) {
        if (compressed.length == 0) return data;
        
        // Calculate decompressed size
        uint256 decompressedSize = 0;
        for (uint256 i = 0; i < compressed.length; i += 2) {
            decompressedSize += uint8(compressed[i]);
        }
        
        data = new bytes(decompressedSize);
        uint256 dataIndex = 0;
        
        for (uint256 i = 0; i < compressed.length; i += 2) {
            uint8 count = uint8(compressed[i]);
            uint8 byteValue = uint8(compressed[i + 1]);
            
            for (uint8 j = 0; j < count; j++) {
                data[dataIndex] = bytes1(byteValue);
                dataIndex++;
            }
        }
    }

    // ========== BLOCKCHAIN STATE FUNCTIONS ==========
    
    function getCurrentBlockNumber() internal view returns (uint256 blockNumber) {
        return block.number;
    }

    
    function getCurrentTimestamp() internal view returns (uint256 timestamp) {
        return block.timestamp;
    }

    
    function getCurrentGasPrice() internal view returns (uint256 gasPrice) {
        return tx.gasprice;
    }

    
    function getCurrentGasLimit() internal view returns (uint256 gasLimit) {
        return block.gaslimit;
    }

    
    function getCurrentBaseFee() internal view returns (uint256 baseFee) {
        return block.basefee;
    }

    
    function getCurrentChainId() internal view returns (uint256 chainId) {
        return block.chainid;
    }

    
    function getCurrentCoinbase() internal view returns (address coinbase) {
        return block.coinbase;
    }

    // ========== UTILITY FUNCTIONS ==========
    
    function isContract(address addr) internal view returns (bool) {
        uint256 size;
        assembly {
            size := extcodesize(addr)
        }
        return size > 0;
    }

    
    function isContractStatic(address addr) internal pure returns (bool) {
        // This is a simplified check - in production, you'd want more sophisticated detection
        return addr.code.length > 0;
    }

    
    function calculateHash(bytes memory data) internal pure returns (bytes32 hash) {
        return keccak256(data);
    }

    
    function calculateCombinedHash(
        bytes memory data1,
        bytes memory data2
    ) internal pure returns (bytes32 hash) {
        return keccak256(abi.encodePacked(data1, data2));
    }

    
    function bytesToHex(bytes memory data) internal pure returns (string memory) {
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(data.length * 2);
        
        for (uint256 i = 0; i < data.length; i++) {
            str[i*2] = alphabet[uint8(data[i] >> 4)];
            str[i*2+1] = alphabet[uint8(data[i] & 0x0f)];
        }
        return string(str);
    }

    
    function addressToHex(address addr) internal pure returns (string memory hexString) {
        return bytesToHex(abi.encodePacked(addr));
    }

    // ========== MATH UTILITIES ==========
    
    function calculatePercentage(
        uint256 amount,
        uint256 percentage
    ) internal pure returns (uint256 result) {
        return (amount * percentage) / 10000;
    }

    
    function calculateGasCost(
        uint256 gasUsed,
        uint256 gasPrice
    ) internal pure returns (uint256 cost) {
        return gasUsed * gasPrice;
    }

    
    function calculateOptimalGasPrice(
        uint256 baseFee,
        uint256 priorityFee
    ) internal pure returns (uint256 optimalGasPrice) {
        return baseFee + priorityFee;
    }
}
