// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title MockApi3Oracle
 * @dev Mock para pruebas de integración con API3
 */
contract MockApi3Oracle {
    mapping(bytes32 => uint256) private prices;
    mapping(bytes32 => uint256) private timestamps;

    function setData(bytes32 dataFeedId, uint256 value) external {
        prices[dataFeedId] = value;
        timestamps[dataFeedId] = block.timestamp;
    }

    function getData(bytes32 dataFeedId) external view returns (uint256 value, uint256 timestamp) {
        return (prices[dataFeedId], timestamps[dataFeedId]);
    }
} 