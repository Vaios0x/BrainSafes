// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract TargetMock {
    uint256 public value;

    function setValue(uint256 v) external {
        value = v;
    }

    function failAlways() external pure {
        require(false, "Always fails");
    }
} 