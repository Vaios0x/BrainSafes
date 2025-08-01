// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@arbitrum/nitro-contracts/src/precompiles/ArbSys.sol";
import "@arbitrum/nitro-contracts/src/precompiles/NodeInterface.sol";
import "@arbitrum/nitro-contracts/src/libraries/AddressAliasHelper.sol";
import "../optimizations/AddressCompressor.sol";
import "../cache/DistributedCache.sol";
import "./MessageRecoverySystem.sol";

/**
 * @title L1L2MessageHandler
 * @notice Handles L1-L2 message passing for BrainSafes
 * @dev Provides utilities for secure and efficient cross-chain communication
 * @author BrainSafes Team
 */
contract L1L2MessageHandler {
    ArbSys constant arbsys = ArbSys(address(0x64));
    NodeInterface constant nodeInterface = NodeInterface(address(0xc8));

    AddressCompressor public addressCompressor;
    DistributedCache public cache;
    MessageRecoverySystem public messageRecovery;

    struct L1L2Message {
        bytes32 messageId;
        address sender;
        address recipient;
        bytes data;
        uint256 timestamp;
        uint256 gasLimit;
        uint256 maxSubmissionCost;
        bool isProcessed;
        bool isRetryable;
    }

    struct MessageStatus {
        bool exists;
        bool isProcessed;
        uint256 retryCount;
        uint256 lastRetryTime;
        bytes32 l1Hash;
        bytes32 l2Hash;
    }

    // Mappings
    mapping(bytes32 => L1L2Message) public messages;
    mapping(bytes32 => MessageStatus) public messageStatus;
    mapping(address => bytes32[]) public userMessages;
    mapping(bytes32 => bytes32) public l1ToL2Messages;

    // Eventos
    event MessageReceived(bytes32 indexed messageId, address indexed sender, address indexed recipient);
    event MessageProcessed(bytes32 indexed messageId, bool success);
    event MessageRetried(bytes32 indexed messageId, uint256 retryCount);
    event L2MessageSent(bytes32 indexed messageId, address indexed sender, bytes32 l1Hash);

    constructor(address _addressCompressor, address _cache) {
        addressCompressor = AddressCompressor(_addressCompressor);
        cache = DistributedCache(_cache);
    }

    /**
     * @notice Processes an L1 message for processing.
     * @dev Verifies the L1 origin, compresses addresses, and caches the message.
     * @param messageId The ID of the message to process.
     * @param data The data payload of the message.
     * @param l1Hash The hash of the L1 transaction.
     * @return bool True if processing was successful, false otherwise.
     */
    function processL1Message(
        bytes32 messageId,
        bytes calldata data,
        bytes32 l1Hash
    ) external returns (bool) {
        require(!messageStatus[messageId].exists, "Message already processed");

        // Verificar que el mensaje viene de L1
        require(_verifyL1Origin(), "Not from L1");

        // Comprimir direcciones para optimizar gas
        address sender = AddressAliasHelper.undoL1ToL2Alias(msg.sender);
        uint256 compressedSender = addressCompressor.compressAddress(sender);

        // Crear mensaje
        L1L2Message memory message = L1L2Message({
            messageId: messageId,
            sender: sender,
            recipient: address(this),
            data: data,
            timestamp: block.timestamp,
            gasLimit: gasleft(),
            maxSubmissionCost: 0,
            isProcessed: false,
            isRetryable: true
        });

        messages[messageId] = message;
        messageStatus[messageId] = MessageStatus({
            exists: true,
            isProcessed: false,
            retryCount: 0,
            lastRetryTime: block.timestamp,
            l1Hash: l1Hash,
            l2Hash: keccak256(data)
        });

        userMessages[sender].push(messageId);
        l1ToL2Messages[l1Hash] = messageId;

        // Cachear mensaje para acceso rápido
        bytes32 cacheKey = keccak256(abi.encodePacked(messageId, "l1message"));
        cache.set(cacheKey, abi.encode(message), block.timestamp + 1 days);

        emit MessageReceived(messageId, sender, address(this));

        // Procesar mensaje
        return _processMessage(messageId);
    }

    /**
     * @notice Sends a message from L1 to L2.
     * @dev Creates a retryable ticket and caches the message.
     * @param l1Target The target L2 address for the message.
     * @param data The data payload of the message.
     * @param maxGas The maximum gas limit for the L2 transaction.
     * @param gasPriceBid The gas price bid for the L2 transaction.
     * @param maxSubmissionCost The maximum submission cost for the L2 transaction.
     * @return bytes32 The ID of the created message.
     */
    function sendL2Message(
        address l1Target,
        bytes calldata data,
        uint256 maxGas,
        uint256 gasPriceBid,
        uint256 maxSubmissionCost
    ) external payable returns (bytes32) {
        require(l1Target != address(0), "Invalid L1 target");

        // Comprimir dirección del remitente
        uint256 compressedSender = addressCompressor.compressAddress(msg.sender);

        // Crear ID único para el mensaje
        bytes32 messageId = keccak256(abi.encodePacked(
            msg.sender,
            l1Target,
            data,
            block.timestamp,
            gasPriceBid
        ));

        // Crear retryable ticket
        bytes32 ticketId = arbsys.createRetryableTicket{value: msg.value}(
            l1Target,
            0, // Valor de la transacción
            maxSubmissionCost,
            msg.sender,
            msg.sender,
            maxGas,
            gasPriceBid,
            data
        );

        // Registrar mensaje
        L1L2Message memory message = L1L2Message({
            messageId: messageId,
            sender: msg.sender,
            recipient: l1Target,
            data: data,
            timestamp: block.timestamp,
            gasLimit: maxGas,
            maxSubmissionCost: maxSubmissionCost,
            isProcessed: false,
            isRetryable: true
        });

        messages[messageId] = message;
        messageStatus[messageId] = MessageStatus({
            exists: true,
            isProcessed: false,
            retryCount: 0,
            lastRetryTime: block.timestamp,
            l1Hash: bytes32(0),
            l2Hash: ticketId
        });

        userMessages[msg.sender].push(messageId);

        emit L2MessageSent(messageId, msg.sender, ticketId);
        return messageId;
    }

    /**
     * @notice Retries processing a message that failed.
     * @dev Increments retry count and attempts to process again.
     * @param messageId The ID of the message to retry.
     */
    function retryMessage(bytes32 messageId) external {
        require(messageStatus[messageId].exists, "Message does not exist");
        require(!messageStatus[messageId].isProcessed, "Message already processed");
        require(messages[messageId].isRetryable, "Message not retryable");
        MessageStatus storage status = messageStatus[messageId];
        require(
            block.timestamp >= status.lastRetryTime + _getRetryDelay(status.retryCount),
            "Retry too soon"
        );
        status.retryCount++;
        status.lastRetryTime = block.timestamp;
        bool success = _processMessage(messageId);
        emit MessageRetried(messageId, status.retryCount);
        if (success) {
            status.isProcessed = true;
            messages[messageId].isProcessed = true;
        } else {
            messageRecovery.initiateRecovery(messageId, "Retry failed");
        }
    }

    /**
     * @notice Processes the actual L2 message.
     * @dev Estimates gas, verifies sufficiency, and executes the message.
     * @param messageId The ID of the message to process.
     * @return bool True if processing was successful, false otherwise.
     */
    function _processMessage(bytes32 messageId) internal returns (bool) {
        L1L2Message storage message = messages[messageId];
        
        // Obtener gas estimado
        (uint256 gasEstimate,,, ) = nodeInterface.gasEstimateComponents(
            message.recipient,
            0,
            message.recipient,
            message.data
        );

        // Verificar gas suficiente
        require(gasleft() >= gasEstimate + 50000, "Insufficient gas for processing");

        // Ejecutar mensaje
        (bool success, ) = message.recipient.call{gas: gasEstimate}(message.data);

        emit MessageProcessed(messageId, success);
        return success;
    }

    /**
     * @notice Verifies if the message originates from L1.
     * @dev Checks if the sender is an L2 alias.
     * @return bool True if the sender is an L2 alias, false otherwise.
     */
    function _verifyL1Origin() internal view returns (bool) {
        return AddressAliasHelper.undoL1ToL2Alias(msg.sender) != msg.sender;
    }

    /**
     * @notice Calculates the retry delay based on the number of retries.
     * @dev Implements exponential backoff.
     * @param retryCount The number of times the message has been retried.
     * @return uint256 The delay in seconds.
     */
    function _getRetryDelay(uint256 retryCount) internal pure returns (uint256) {
        // Delay exponencial: 1 min, 5 min, 15 min, 30 min, 1 hora
        if (retryCount == 0) return 1 minutes;
        if (retryCount == 1) return 5 minutes;
        if (retryCount == 2) return 15 minutes;
        if (retryCount == 3) return 30 minutes;
        return 1 hours;
    }

    function setMessageRecovery(address _recovery) external {
        require(_recovery != address(0), "Invalid address");
        messageRecovery = MessageRecoverySystem(_recovery);
    }

    // Funciones de consulta
    /**
     * @notice Retrieves a full L1L2Message by its ID.
     * @param messageId The ID of the message.
     * @return L1L2Message The message details.
     */
    function getMessage(bytes32 messageId) external view returns (L1L2Message memory) {
        return messages[messageId];
    }

    /**
     * @notice Retrieves the status of a message by its ID.
     * @param messageId The ID of the message.
     * @return MessageStatus The message status details.
     */
    function getMessageStatus(bytes32 messageId) external view returns (MessageStatus memory) {
        return messageStatus[messageId];
    }

    /**
     * @notice Retrieves all messages sent by a specific user.
     * @param user The address of the user.
     * @return bytes32[] The array of message IDs.
     */
    function getUserMessages(address user) external view returns (bytes32[] memory) {
        return userMessages[user];
    }

    /**
     * @notice Retrieves the L2 message ID by its L1 transaction hash.
     * @param l1Hash The hash of the L1 transaction.
     * @return bytes32 The L2 message ID.
     */
    function getL2MessageByL1Hash(bytes32 l1Hash) external view returns (bytes32) {
        return l1ToL2Messages[l1Hash];
    }
} 