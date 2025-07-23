// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title EnhancedMulticall
 * @dev Permite ejecutar múltiples llamadas a contratos en una sola transacción, con soporte de gas y revert selectivo.
 * @author BrainSafes Team
 */
contract EnhancedMulticall {
    /// @notice Estructura de una llamada
    struct Call {
        address target;
        bytes callData;
        uint256 gasLimit;
    }

    /// @notice Estructura del resultado de una llamada
    struct Result {
        bool success;
        bytes returnData;
    }

    /// @notice Ejecuta múltiples llamadas en batch
    /// @param calls Array de llamadas a ejecutar
    /// @return results Array de resultados individuales
    function aggregate(Call[] calldata calls) external returns (Result[] memory results) {
        results = new Result[](calls.length);
        for (uint256 i = 0; i < calls.length; i++) {
            require(calls[i].target != address(0), "Target inválido");
            (bool success, bytes memory ret) = calls[i].target.call{gas: calls[i].gasLimit}(calls[i].callData);
            results[i] = Result(success, ret);
        }
    }
} 