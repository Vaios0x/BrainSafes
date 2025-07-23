// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title MockChainlinkOracle
 * @dev Mock para pruebas de integración con Chainlink
 */
contract MockChainlinkOracle {
    int256 private price;
    uint8 private decimals = 18;

    function setPrice(int256 _price) external {
        price = _price;
    }

    function latestRoundData() external view returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    ) {
        return (
            1,
            price,
            block.timestamp - 1,
            block.timestamp,
            1
        );
    }

    function decimals() external view returns (uint8) {
        return decimals;
    }
} 