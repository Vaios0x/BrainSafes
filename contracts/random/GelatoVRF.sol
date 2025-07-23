// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@gelatonetwork/relay-context/contracts/vendor/GelatoRelayContext.sol";

/**
 * @title GelatoVRF
 * @notice Randomness provider contract for BrainSafes using Gelato VRF
 * @dev Supplies verifiable random numbers for games, lotteries, and draws
 * @author BrainSafes Team
 */
contract GelatoVRF is AccessControl, ReentrancyGuard, Pausable, GelatoRelayContext {
    bytes32 public constant VRF_MANAGER_ROLE = keccak256("VRF_MANAGER_ROLE");
    bytes32 public constant CALLBACK_ROLE = keccak256("CALLBACK_ROLE");

    // Estructuras
    struct RandomRequest {
        uint256 id;
        address requester;
        uint256 numWords;
        uint256 minimumRequestConfirmations;
        uint256 callbackGasLimit;
        bytes32 requestType;
        uint256 timestamp;
        bool fulfilled;
        uint256[] randomWords;
    }

    struct RequestConfig {
        uint256 minimumRequestConfirmations;
        uint256 callbackGasLimit;
        uint256 requestConfirmationDelay;
        uint256 requestExpiryBlocks;
    }

    // Mappings
    mapping(uint256 => RandomRequest) public requests;
    mapping(bytes32 => RequestConfig) public requestConfigs;
    mapping(address => uint256[]) public userRequests;
    mapping(bytes32 => uint256) public requestTypeCount;

    // Contadores
    uint256 private requestCounter;

    // Configuración
    uint256 public constant MAX_REQUEST_CONFIRMATIONS = 200;
    uint256 public constant MAX_RANDOM_WORDS = 100;
    uint256 public constant MIN_GAS_LIMIT = 100000;
    uint256 public constant MAX_GAS_LIMIT = 2000000;

    // Eventos
    event RandomWordsRequested(
        uint256 indexed requestId,
        address indexed requester,
        uint256 numWords,
        bytes32 requestType
    );
    event RandomWordsFulfilled(
        uint256 indexed requestId,
        uint256[] randomWords
    );
    event RequestConfigSet(
        bytes32 indexed requestType,
        uint256 minimumRequestConfirmations,
        uint256 callbackGasLimit
    );
    event RequestExpired(uint256 indexed requestId);
    event RequestCancelled(uint256 indexed requestId, string reason);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(VRF_MANAGER_ROLE, msg.sender);
    }

    /**
     * @notice Requests random words from the VRF.
     * @dev This function is non-reentrant and requires the contract to be not paused.
     * @param numWords The number of random words to request.
     * @param requestType The type of request (e.g., "game_draw", "lottery_draw").
     * @return requestId The ID of the requested random words.
     */
    function requestRandomWords(
        uint256 numWords,
        bytes32 requestType
    ) external nonReentrant whenNotPaused returns (uint256) {
        require(numWords > 0 && numWords <= MAX_RANDOM_WORDS, "Invalid number of words");
        require(requestConfigs[requestType].minimumRequestConfirmations > 0, "Request type not configured");

        RequestConfig memory config = requestConfigs[requestType];
        require(
            config.callbackGasLimit >= MIN_GAS_LIMIT && 
            config.callbackGasLimit <= MAX_GAS_LIMIT,
            "Invalid gas limit"
        );

        requestCounter++;
        uint256 requestId = requestCounter;

        requests[requestId] = RandomRequest({
            id: requestId,
            requester: msg.sender,
            numWords: numWords,
            minimumRequestConfirmations: config.minimumRequestConfirmations,
            callbackGasLimit: config.callbackGasLimit,
            requestType: requestType,
            timestamp: block.timestamp,
            fulfilled: false,
            randomWords: new uint256[](0)
        });

        userRequests[msg.sender].push(requestId);
        requestTypeCount[requestType]++;

        emit RandomWordsRequested(
            requestId,
            msg.sender,
            numWords,
            requestType
        );

        return requestId;
    }

    /**
     * @notice Callback function to fulfill random words.
     * @dev This function is only callable by the CALLBACK_ROLE.
     * @param requestId The ID of the request.
     * @param randomWords The array of random words.
     */
    function fulfillRandomWords(
        uint256 requestId,
        uint256[] memory randomWords
    ) external onlyRole(CALLBACK_ROLE) nonReentrant {
        require(!requests[requestId].fulfilled, "Request already fulfilled");
        
        RandomRequest storage request = requests[requestId];
        require(request.id == requestId, "Request not found");
        require(randomWords.length == request.numWords, "Invalid number of words");
        require(
            block.timestamp >= request.timestamp + request.minimumRequestConfirmations,
            "Insufficient confirmations"
        );

        request.fulfilled = true;
        request.randomWords = randomWords;

        emit RandomWordsFulfilled(requestId, randomWords);

        // Llamar al contrato del solicitante si implementa la interfaz
        if (_isContract(request.requester)) {
            try IRandomnessConsumer(request.requester).rawFulfillRandomWords(
                requestId,
                randomWords
            ) {} catch {}
        }
    }

    /**
     * @notice Sets the configuration parameters for a request type.
     * @dev This function is only callable by the VRF_MANAGER_ROLE.
     * @param requestType The type of request.
     * @param minimumRequestConfirmations The minimum number of confirmations required.
     * @param callbackGasLimit The gas limit for the callback.
     * @param requestConfirmationDelay The delay in blocks before confirmations are counted.
     * @param requestExpiryBlocks The number of blocks after which a request expires.
     */
    function setRequestConfig(
        bytes32 requestType,
        uint256 minimumRequestConfirmations,
        uint256 callbackGasLimit,
        uint256 requestConfirmationDelay,
        uint256 requestExpiryBlocks
    ) external onlyRole(VRF_MANAGER_ROLE) {
        require(minimumRequestConfirmations <= MAX_REQUEST_CONFIRMATIONS, "Confirmations too high");
        require(
            callbackGasLimit >= MIN_GAS_LIMIT && callbackGasLimit <= MAX_GAS_LIMIT,
            "Invalid gas limit"
        );

        requestConfigs[requestType] = RequestConfig({
            minimumRequestConfirmations: minimumRequestConfirmations,
            callbackGasLimit: callbackGasLimit,
            requestConfirmationDelay: requestConfirmationDelay,
            requestExpiryBlocks: requestExpiryBlocks
        });

        emit RequestConfigSet(
            requestType,
            minimumRequestConfirmations,
            callbackGasLimit
        );
    }

    /**
     * @notice Cancels a request.
     * @dev This function is only callable by the VRF_MANAGER_ROLE.
     * @param requestId The ID of the request to cancel.
     * @param reason The reason for cancellation.
     */
    function cancelRequest(
        uint256 requestId,
        string memory reason
    ) external onlyRole(VRF_MANAGER_ROLE) {
        require(!requests[requestId].fulfilled, "Request already fulfilled");
        
        delete requests[requestId];
        emit RequestCancelled(requestId, reason);
    }

    /**
     * @notice Retrieves the random words for a specific request.
     * @dev Requires the request to be fulfilled.
     * @param requestId The ID of the request.
     * @return randomWords The array of random words.
     */
    function getRandomWords(
        uint256 requestId
    ) external view returns (uint256[] memory) {
        require(requests[requestId].fulfilled, "Request not fulfilled");
        return requests[requestId].randomWords;
    }

    /**
     * @notice Retrieves all requests made by a specific user.
     * @param user The address of the user.
     * @return requestIds The array of request IDs.
     */
    function getUserRequests(
        address user
    ) external view returns (uint256[] memory) {
        return userRequests[user];
    }

    /**
     * @notice Retrieves detailed information about a specific request.
     * @param requestId The ID of the request.
     * @return request The details of the request.
     */
    function getRequestDetails(
        uint256 requestId
    ) external view returns (RandomRequest memory) {
        return requests[requestId];
    }

    /**
     * @notice Retrieves the configuration parameters for a specific request type.
     * @param requestType The type of request.
     * @return config The configuration parameters.
     */
    function getRequestConfig(
        bytes32 requestType
    ) external view returns (RequestConfig memory) {
        return requestConfigs[requestType];
    }

    /**
     * @dev Verifica si una dirección es un contrato
     */
    function _isContract(address addr) internal view returns (bool) {
        uint256 size;
        assembly {
            size := extcodesize(addr)
        }
        return size > 0;
    }

    /**
     * @notice Pauses the contract.
     * @dev This function is only callable by the VRF_MANAGER_ROLE.
     */
    function pause() external onlyRole(VRF_MANAGER_ROLE) {
        _pause();
    }

    /**
     * @notice Unpauses the contract.
     * @dev This function is only callable by the VRF_MANAGER_ROLE.
     */
    function unpause() external onlyRole(VRF_MANAGER_ROLE) {
        _unpause();
    }
}

/**
 * @dev Interfaz para contratos que consumen aleatoriedad
 */
interface IRandomnessConsumer {
    function rawFulfillRandomWords(
        uint256 requestId,
        uint256[] memory randomWords
    ) external;
} 