// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@api3/contracts/v0.8/interfaces/IApi3Oracle.sol";
import "./interfaces/ISupraOracle.sol";
import "./interfaces/IChronicleOracle.sol";

/**
 * @title MultiOracle
 * @notice Aggregates multiple oracles for redundancy and reliability in BrainSafes
 * @dev Supports fallback and consensus mechanisms for data feeds
 * @author BrainSafes Team
 */
contract MultiOracle is AccessControl, ReentrancyGuard, Pausable {
    bytes32 public constant ORACLE_MANAGER_ROLE = keccak256("ORACLE_MANAGER_ROLE");
    
    // Interfaces de oráculos
    AggregatorV3Interface public chainlinkOracle;
    IApi3Oracle public api3Oracle;
    ISupraOracle public supraOracle;
    IChronicleOracle public chronicleOracle;

    // Configuración
    uint256 public constant MIN_RESPONSES = 2;
    uint256 public constant MAX_DEVIATION = 5; // 5% máximo de desviación
    uint256 public constant RESPONSE_TIMEOUT = 30 minutes;

    // Estructuras
    struct OracleResponse {
        uint256 value;
        uint256 timestamp;
        bool valid;
    }

    struct AggregatedData {
        uint256 value;
        uint256 numResponses;
        uint256 timestamp;
    }

    // Mappings
    mapping(bytes32 => AggregatedData) public aggregatedData;
    mapping(address => bool) public authorizedOracles;
    mapping(bytes32 => mapping(address => OracleResponse)) public oracleResponses;

    // Eventos
    event OracleResponseReceived(address oracle, bytes32 dataKey, uint256 value);
    event DataAggregated(bytes32 dataKey, uint256 value, uint256 numResponses);
    event OracleAuthorized(address oracle, bool authorized);

    constructor(
        address _chainlinkOracle,
        address _api3Oracle,
        address _supraOracle,
        address _chronicleOracle
    ) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ORACLE_MANAGER_ROLE, msg.sender);

        chainlinkOracle = AggregatorV3Interface(_chainlinkOracle);
        api3Oracle = IApi3Oracle(_api3Oracle);
        supraOracle = ISupraOracle(_supraOracle);
        chronicleOracle = IChronicleOracle(_chronicleOracle);

        authorizedOracles[_chainlinkOracle] = true;
        authorizedOracles[_api3Oracle] = true;
        authorizedOracles[_supraOracle] = true;
        authorizedOracles[_chronicleOracle] = true;

        emit OracleAuthorized(_chainlinkOracle, true);
        emit OracleAuthorized(_api3Oracle, true);
        emit OracleAuthorized(_supraOracle, true);
        emit OracleAuthorized(_chronicleOracle, true);
    }

    /**
     * @notice Retrieves aggregated data from multiple oracles
     * @param dataKey The key identifying the data to be aggregated
     * @return value The aggregated value
     * @return numResponses The number of valid responses received
     * @return timestamp The timestamp of the aggregation
     */
    function getAggregatedData(bytes32 dataKey) external view returns (
        uint256 value,
        uint256 numResponses,
        uint256 timestamp
    ) {
        AggregatedData memory data = aggregatedData[dataKey];
        require(data.numResponses >= MIN_RESPONSES, "Insufficient oracle responses");
        require(block.timestamp - data.timestamp <= RESPONSE_TIMEOUT, "Data too old");
        
        return (data.value, data.numResponses, data.timestamp);
    }

    /**
     * @notice Retrieves the price of a token using Chainlink
     * @param token The address of the token
     * @return price The current price of the token
     */
    function getTokenPrice(address token) external view returns (uint256) {
        (, int256 price,,,) = chainlinkOracle.latestRoundData();
        require(price > 0, "Invalid price");
        return uint256(price);
    }

    /**
     * @notice Retrieves educational data using API3
     * @param dataKey The key identifying the educational data
     * @return data The educational data in bytes
     */
    function getEducationalData(bytes32 dataKey) external view returns (bytes memory) {
        return api3Oracle.getData(dataKey);
    }

    /**
     * @notice Retrieves historical data using Chronicle
     * @param dataKey The key identifying the historical data
     * @param timestamp The timestamp for which historical data is requested
     * @return data The historical data value
     */
    function getHistoricalData(bytes32 dataKey, uint256 timestamp) external view returns (uint256) {
        return chronicleOracle.getHistoricalData(dataKey, timestamp);
    }

    /**
     * @notice Receives and processes an oracle response
     * @param oracle The address of the oracle sending the response
     * @param dataKey The key identifying the data being responded to
     * @param value The value provided by the oracle
     */
    function receiveOracleResponse(
        address oracle,
        bytes32 dataKey,
        uint256 value
    ) external onlyRole(ORACLE_MANAGER_ROLE) {
        require(authorizedOracles[oracle], "Unauthorized oracle");
        
        oracleResponses[dataKey][oracle] = OracleResponse({
            value: value,
            timestamp: block.timestamp,
            valid: true
        });

        emit OracleResponseReceived(oracle, dataKey, value);
        
        _aggregateData(dataKey);
    }

    /**
     * @dev Agrega datos de múltiples oráculos
     */
    function _aggregateData(bytes32 dataKey) internal {
        uint256 totalValue = 0;
        uint256 numValid = 0;
        uint256[] memory values = new uint256[](4); // Para los 4 oráculos
        
        // Recolectar valores válidos
        if (oracleResponses[dataKey][address(chainlinkOracle)].valid) {
            values[numValid] = oracleResponses[dataKey][address(chainlinkOracle)].value;
            numValid++;
        }
        if (oracleResponses[dataKey][address(api3Oracle)].valid) {
            values[numValid] = oracleResponses[dataKey][address(api3Oracle)].value;
            numValid++;
        }
        if (oracleResponses[dataKey][address(supraOracle)].valid) {
            values[numValid] = oracleResponses[dataKey][address(supraOracle)].value;
            numValid++;
        }
        if (oracleResponses[dataKey][address(chronicleOracle)].valid) {
            values[numValid] = oracleResponses[dataKey][address(chronicleOracle)].value;
            numValid++;
        }

        require(numValid >= MIN_RESPONSES, "Insufficient valid responses");

        // Verificar desviación
        for (uint256 i = 0; i < numValid; i++) {
            for (uint256 j = i + 1; j < numValid; j++) {
                uint256 deviation = _calculateDeviation(values[i], values[j]);
                require(deviation <= MAX_DEVIATION, "Excessive deviation between oracles");
            }
            totalValue += values[i];
        }

        // Actualizar datos agregados
        uint256 aggregatedValue = totalValue / numValid;
        aggregatedData[dataKey] = AggregatedData({
            value: aggregatedValue,
            numResponses: numValid,
            timestamp: block.timestamp
        });

        emit DataAggregated(dataKey, aggregatedValue, numValid);
    }

    /**
     * @dev Calcula la desviación porcentual entre dos valores
     */
    function _calculateDeviation(uint256 a, uint256 b) internal pure returns (uint256) {
        if (a > b) {
            return ((a - b) * 100) / b;
        }
        return ((b - a) * 100) / a;
    }

    /**
     * @notice Authorizes or deauthorizes an oracle
     * @param oracle The address of the oracle to authorize/deauthorize
     * @param authorized True to authorize, false to deauthorize
     */
    function setOracleAuthorization(
        address oracle,
        bool authorized
    ) external onlyRole(ORACLE_MANAGER_ROLE) {
        authorizedOracles[oracle] = authorized;
        emit OracleAuthorized(oracle, authorized);
    }

    /**
     * @notice Updates the address of an oracle
     * @param oracleType The type of oracle (e.g., "chainlink", "api3", "supra", "chronicle")
     * @param newAddress The new address for the oracle
     */
    function updateOracleAddress(
        string memory oracleType,
        address newAddress
    ) external onlyRole(ORACLE_MANAGER_ROLE) {
        require(newAddress != address(0), "Invalid address");

        bytes32 oracleHash = keccak256(bytes(oracleType));
        
        if (oracleHash == keccak256("chainlink")) {
            chainlinkOracle = AggregatorV3Interface(newAddress);
        } else if (oracleHash == keccak256("api3")) {
            api3Oracle = IApi3Oracle(newAddress);
        } else if (oracleHash == keccak256("supra")) {
            supraOracle = ISupraOracle(newAddress);
        } else if (oracleHash == keccak256("chronicle")) {
            chronicleOracle = IChronicleOracle(newAddress);
        } else {
            revert("Invalid oracle type");
        }

        authorizedOracles[newAddress] = true;
        emit OracleAuthorized(newAddress, true);
    }

    /**
     * @notice Pauses the contract
     */
    function pause() external onlyRole(ORACLE_MANAGER_ROLE) {
        _pause();
    }

    /**
     * @notice Unpauses the contract
     */
    function unpause() external onlyRole(ORACLE_MANAGER_ROLE) {
        _unpause();
    }
} 