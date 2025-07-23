// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../interfaces/ISupraOracle.sol";

contract MockSupraOracle is ISupraOracle {
    mapping(bytes32 => uint256) private values;
    mapping(bytes32 => mapping(uint256 => Round)) private rounds;
    mapping(bytes32 => uint256) private latestRoundIds;
    mapping(bytes32 => mapping(uint256 => uint256)) private historicalData;

    event DataSet(bytes32 indexed key, uint256 value);
    event RoundCreated(bytes32 indexed key, uint256 roundId, uint256 value);

    function setData(bytes32 key, uint256 value) external {
        values[key] = value;
        
        // Crear nueva ronda
        latestRoundIds[key]++;
        rounds[key][latestRoundIds[key]] = Round({
            roundId: latestRoundIds[key],
            timestamp: block.timestamp,
            value: value
        });

        emit DataSet(key, value);
        emit RoundCreated(key, latestRoundIds[key], value);
    }

    function setHistoricalData(bytes32 key, uint256 timestamp, uint256 value) external {
        historicalData[key][timestamp] = value;
    }

    function getData(bytes32 key) external view override returns (uint256) {
        require(values[key] > 0, "No data present");
        return values[key];
    }

    function getRoundData(bytes32 key, uint256 roundId) external view override returns (Round memory) {
        require(rounds[key][roundId].timestamp > 0, "Round not found");
        return rounds[key][roundId];
    }

    function getLatestRoundData(bytes32 key) external view override returns (Round memory) {
        uint256 latestRoundId = latestRoundIds[key];
        require(latestRoundId > 0, "No rounds present");
        return rounds[key][latestRoundId];
    }

    function getHistoricalData(bytes32 key, uint256 timestamp) external view override returns (uint256) {
        require(historicalData[key][timestamp] > 0, "No historical data present");
        return historicalData[key][timestamp];
    }

    function getSupportedPairs() external pure override returns (bytes32[] memory) {
        bytes32[] memory pairs = new bytes32[](1);
        pairs[0] = bytes32("test");
        return pairs;
    }

    function verifyOracleSignature(bytes32 key, bytes memory signature) external pure override returns (bool) {
        // Mock verification - always returns true
        return true;
    }
} 