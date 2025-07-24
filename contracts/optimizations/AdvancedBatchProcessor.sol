// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title AdvancedBatchProcessor
 * @dev Procesamiento batch avanzado y genérico para BrainSafes
 * @notice Permite ejecutar múltiples llamadas a contratos en una sola transacción, con atomicidad opcional y manejo de errores parciales
 * @custom:security-contact security@brainsafes.com
 */
contract AdvancedBatchProcessor is AccessControl, Pausable, ReentrancyGuard {
    bytes32 public constant BATCH_ADMIN = keccak256("BATCH_ADMIN");
    bytes32 public constant BATCH_OPERATOR = keccak256("BATCH_OPERATOR");

    event BatchExecuted(address indexed sender, bool atomic, uint256 successCount, uint256 failCount);
    event BatchCallResult(uint256 indexed index, bool success, bytes result, string error);

    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(BATCH_ADMIN, msg.sender);
    }

    struct Call {
        address target;
        uint256 value;
        bytes data;
    }

    struct CallResult {
        bool success;
        bytes result;
        string error;
    }

    /**
     * @dev Ejecuta un batch de llamadas a contratos
     * @param calls Lista de llamadas (target, value, data)
     * @param atomic Si es true, todo el batch es atómico (revert en cualquier error)
     * @return results Resultados de cada llamada
     */
    function executeBatch(Call[] calldata calls, bool atomic) external payable whenNotPaused nonReentrant returns (CallResult[] memory results) {
        require(calls.length > 0, "No calls");
        results = new CallResult[](calls.length);
        uint256 successCount = 0;
        uint256 failCount = 0;
        uint256 valueUsed = 0;
        for (uint256 i = 0; i < calls.length; i++) {
            (bool success, bytes memory result) = calls[i].target.call{value: calls[i].value}(calls[i].data);
            if (success) {
                results[i] = CallResult(true, result, "");
                successCount++;
                valueUsed += calls[i].value;
            } else {
                // Obtener error revert reason
                string memory reason = _getRevertMsg(result);
                results[i] = CallResult(false, result, reason);
                failCount++;
                emit BatchCallResult(i, false, result, reason);
                if (atomic) {
                    revert(string(abi.encodePacked("Batch failed at call ", _uint2str(i), ": ", reason)));
                }
            }
        }
        require(msg.value >= valueUsed, "Insufficient ETH for batch");
        emit BatchExecuted(msg.sender, atomic, successCount, failCount);
        return results;
    }

    function _getRevertMsg(bytes memory returnData) internal pure returns (string memory) {
        if (returnData.length < 68) return "Unknown error";
        assembly {
            returnData := add(returnData, 0x04)
        }
        return abi.decode(returnData, (string));
    }

    function _uint2str(uint256 _i) internal pure returns (string memory str) {
        if (_i == 0) return "0";
        uint256 j = _i;
        uint256 length;
        while (j != 0) {
            length++;
            j /= 10;
        }
        bytes memory bstr = new bytes(length);
        uint256 k = length;
        j = _i;
        while (j != 0) {
            bstr[--k] = bytes1(uint8(48 + j % 10));
            j /= 10;
        }
        str = string(bstr);
    }

    function pause() external onlyRole(BATCH_ADMIN) {
        _pause();
    }
    function unpause() external onlyRole(BATCH_ADMIN) {
        _unpause();
    }
} 