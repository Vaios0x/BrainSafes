// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../interfaces/IChronicleOracle.sol";

contract MockChronicleOracle is IChronicleOracle {
    mapping(bytes32 => uint256) private values;
    mapping(bytes32 => mapping(uint256 => DataPoint)) private dataPoints;
    mapping(bytes32 => uint256[]) private timestamps;
    mapping(bytes32 => bytes32[]) private dataSources;

    event DataSet(bytes32 indexed key, uint256 value);
    event DataPointAdded(bytes32 indexed key, uint256 timestamp, uint256 value);

    function setData(bytes32 key, uint256 value) external {
        values[key] = value;
        
        // Crear nuevo punto de datos
        DataPoint memory newPoint = DataPoint({
            timestamp: block.timestamp,
            value: value,
            source: bytes32("mock")
        });

        dataPoints[key][block.timestamp] = newPoint;
        timestamps[key].push(block.timestamp);

        emit DataSet(key, value);
        emit DataPointAdded(key, block.timestamp, value);
    }

    function setHistoricalDataPoint(
        bytes32 key,
        uint256 timestamp,
        uint256 value,
        bytes32 source
    ) external {
        DataPoint memory point = DataPoint({
            timestamp: timestamp,
            value: value,
            source: source
        });

        dataPoints[key][timestamp] = point;
        timestamps[key].push(timestamp);
        
        // Agregar fuente si es nueva
        bool sourceExists = false;
        for (uint256 i = 0; i < dataSources[key].length; i++) {
            if (dataSources[key][i] == source) {
                sourceExists = true;
                break;
            }
        }
        if (!sourceExists) {
            dataSources[key].push(source);
        }
    }

    function getData(bytes32 key) external view override returns (uint256) {
        require(values[key] > 0, "No data present");
        return values[key];
    }

    function getDataWithProof(bytes32 key) external view override returns (uint256, bytes memory) {
        require(values[key] > 0, "No data present");
        // Mock proof
        return (values[key], abi.encodePacked("mock_proof"));
    }

    function getHistoricalData(bytes32 key, uint256 timestamp) external view override returns (uint256) {
        require(dataPoints[key][timestamp].timestamp > 0, "No data point found");
        return dataPoints[key][timestamp].value;
    }

    function getDataPoints(
        bytes32 key,
        uint256 fromTimestamp,
        uint256 toTimestamp
    ) external view override returns (DataPoint[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < timestamps[key].length; i++) {
            if (timestamps[key][i] >= fromTimestamp && timestamps[key][i] <= toTimestamp) {
                count++;
            }
        }

        DataPoint[] memory points = new DataPoint[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < timestamps[key].length; i++) {
            if (timestamps[key][i] >= fromTimestamp && timestamps[key][i] <= toTimestamp) {
                points[index] = dataPoints[key][timestamps[key][i]];
                index++;
            }
        }

        return points;
    }

    function getLatestDataPoint(bytes32 key) external view override returns (DataPoint memory) {
        require(timestamps[key].length > 0, "No data points");
        uint256 latestTimestamp = timestamps[key][timestamps[key].length - 1];
        return dataPoints[key][latestTimestamp];
    }

    function verifyProof(
        bytes32 key,
        uint256 value,
        bytes memory proof
    ) external pure override returns (bool) {
        // Mock verification - always returns true
        return true;
    }

    function getSources(bytes32 key) external view override returns (bytes32[] memory) {
        return dataSources[key];
    }

    function isValidSource(bytes32 key, bytes32 source) external view override returns (bool) {
        for (uint256 i = 0; i < dataSources[key].length; i++) {
            if (dataSources[key][i] == source) {
                return true;
            }
        }
        return false;
    }
} 