// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IChronicleOracle {
    struct DataPoint {
        uint256 timestamp;
        uint256 value;
        bytes32 source;
    }

    function getData(bytes32 key) external view returns (uint256);
    function getDataWithProof(bytes32 key) external view returns (uint256, bytes memory);
    function getHistoricalData(bytes32 key, uint256 timestamp) external view returns (uint256);
    function getDataPoints(bytes32 key, uint256 fromTimestamp, uint256 toTimestamp) external view returns (DataPoint[] memory);
    function getLatestDataPoint(bytes32 key) external view returns (DataPoint memory);
    function verifyProof(bytes32 key, uint256 value, bytes memory proof) external view returns (bool);
    function getSources(bytes32 key) external view returns (bytes32[] memory);
    function isValidSource(bytes32 key, bytes32 source) external view returns (bool);
} 