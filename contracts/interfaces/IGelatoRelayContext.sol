// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;


interface IGelatoRelayContext {
    // Mock functions for development
    function getFeeCollector() external view returns (address);
    function getFeeToken() external view returns (address);
    function getFee() external view returns (uint256);
}