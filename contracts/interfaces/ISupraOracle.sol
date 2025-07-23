// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface ISupraOracle {
    struct Round {
        uint256 roundId;
        uint256 timestamp;
        uint256 value;
    }

    function getData(bytes32 key) external view returns (uint256);
    function getRoundData(bytes32 key, uint256 roundId) external view returns (Round memory);
    function getLatestRoundData(bytes32 key) external view returns (Round memory);
    function getHistoricalData(bytes32 key, uint256 timestamp) external view returns (uint256);
    function getSupportedPairs() external view returns (bytes32[] memory);
    function verifyOracleSignature(bytes32 key, bytes memory signature) external view returns (bool);
} 