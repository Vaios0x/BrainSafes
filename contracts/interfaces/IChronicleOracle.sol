// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;


interface IChronicleOracle {
    function read(bytes32 key) external view returns (uint256 value, uint256 timestamp);
    function readWithAge(bytes32 key) external view returns (uint256 value, uint256 age);
    function isValidSource(bytes32 key, bytes32 source) external view returns (bool);
    function getSupportedPairs() external pure returns (bytes32[] memory);
} 