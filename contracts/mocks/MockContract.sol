// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract MockContract {
    event TestFunctionCalled(uint256 value);
    event NonSponsoredFunctionCalled();

    function testFunction(uint256 value) external {
        emit TestFunctionCalled(value);
    }

    function nonSponsoredFunction() external {
        emit NonSponsoredFunctionCalled();
    }

    // Función que consume mucho gas para pruebas
    function heavyFunction() external {
        uint256 result = 0;
        for (uint256 i = 0; i < 1000; i++) {
            result += i * i;
        }
    }

    // Función que revierte para pruebas
    function revertingFunction() external pure {
        revert("Function reverted");
    }

    // Función que recibe ETH para pruebas
    receive() external payable {}
} 