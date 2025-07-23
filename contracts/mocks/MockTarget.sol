// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title MockTarget
 * @dev Contrato mock para pruebas de propuestas automatizadas
 */
contract MockTarget {
    uint256 private value;
    
    event ValueSet(uint256 newValue);

    function setValue(uint256 newValue) external {
        value = newValue;
        emit ValueSet(newValue);
    }

    function getValue() external view returns (uint256) {
        return value;
    }
} 