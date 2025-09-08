// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IApi3ServerV1 {
    function readDataFeed(bytes32 dataFeedId) external view returns (uint256 value, uint256 timestamp);
    function readDataFeedWithDapiName(bytes32 dapiName) external view returns (uint256 value, uint256 timestamp);
}