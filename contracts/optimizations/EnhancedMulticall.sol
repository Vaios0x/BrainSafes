// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@arbitrum/nitro-contracts/src/precompiles/ArbGasInfo.sol";
import "@openzeppelin/contracts/utils/Address.sol";


contract EnhancedMulticall {
    using Address for address;

    ArbGasInfo constant arbGasInfo = ArbGasInfo(address(0x6c));

    struct Call {
        address target;
        bytes callData;
        uint256 gasLimit;
    }

    struct Result {
        bool success;
        bytes returnData;
        uint256 gasUsed;
    }

    event MulticallExecuted(uint256 indexed batchId, uint256 successCount, uint256 totalGasUsed);
    event CallFailed(address indexed target, bytes callData, bytes reason);

    mapping(bytes32 => Result) public recentResults;
    mapping(address => uint256) public nonces;

    
    function aggregate(Call[] calldata calls) external returns (Result[] memory results) {
        results = new Result[](calls.length);
        uint256 successCount = 0;
        uint256 totalGasUsed = 0;
        uint256 batchId = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, nonces[msg.sender]++)));

        for (uint256 i = 0; i < calls.length; i++) {
            bytes32 callHash = keccak256(abi.encodePacked(calls[i].target, calls[i].callData));
            Result memory cachedResult = recentResults[callHash];

            if (cachedResult.success) {
                results[i] = cachedResult;
                successCount++;
                continue;
            }

            uint256 gasBeforeCall = gasleft();
            (bool success, bytes memory returnData) = calls[i].target.call{
                gas: calls[i].gasLimit
            }(calls[i].callData);
            uint256 gasUsed = gasBeforeCall - gasleft();

            results[i] = Result({
                success: success,
                returnData: returnData,
                gasUsed: gasUsed
            });

            if (success) {
                recentResults[callHash] = results[i];
                successCount++;
            } else {
                emit CallFailed(calls[i].target, calls[i].callData, returnData);
            }

            totalGasUsed += gasUsed;
        }

        emit MulticallExecuted(batchId, successCount, totalGasUsed);
    }

    
    function estimateGas(Call[] calldata calls) external returns (uint256[] memory gasEstimates) {
        gasEstimates = new uint256[](calls.length);
        
        for (uint256 i = 0; i < calls.length; i++) {
            try this.simulateCall(calls[i].target, calls[i].callData) returns (uint256 gasUsed) {
                gasEstimates[i] = gasUsed;
            } catch {
                gasEstimates[i] = 0;
            }
        }
    }

    
    function simulateCall(address target, bytes calldata data) external returns (uint256) {
        uint256 gasBeforeCall = gasleft();
        (bool success,) = target.call(data);
        require(success, "Call simulation failed");
        return gasBeforeCall - gasleft();
    }

    
    function clearCache(bytes32[] calldata hashes) external {
        for (uint256 i = 0; i < hashes.length; i++) {
            delete recentResults[hashes[i]];
        }
    }
} 