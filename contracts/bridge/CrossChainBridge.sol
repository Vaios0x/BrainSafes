// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@arbitrum/nitro-contracts/src/precompiles/ArbSys.sol";
import "@arbitrum/nitro-contracts/src/bridge/IBridge.sol";
import "@arbitrum/nitro-contracts/src/bridge/ISequencerInbox.sol";

/**
 * @title BrainSafes Cross-Chain Bridge
 * @dev Handles cross-chain operations between Arbitrum and other L2s
 * @custom:security-contact security@brainsafes.com
 */
contract CrossChainBridge is UUPSUpgradeable, AccessControlUpgradeable, PausableUpgradeable {
    // Roles
    bytes32 public constant BRIDGE_ADMIN = keccak256("BRIDGE_ADMIN");
    bytes32 public constant RELAYER = keccak256("RELAYER");

    // Chain IDs
    uint256 public constant ARBITRUM_ONE = 42161;
    uint256 public constant ARBITRUM_NOVA = 42170;
    uint256 public constant POLYGON = 137;
    uint256 public constant OPTIMISM = 10;

    // Bridge contracts
    IBridge public arbBridge;
    ISequencerInbox public sequencerInbox;

    // Structs
    struct ChainConfig {
        uint256 chainId;
        string name;
        address bridgeContract;
        address tokenContract;
        bool isActive;
        uint256 minDelay;
        uint256 maxAmount;
        mapping(bytes32 => bool) processedMessages;
    }

    struct BridgeOperation {
        bytes32 operationId;
        address sender;
        address recipient;
        uint256 amount;
        uint256 sourceChain;
        uint256 targetChain;
        uint256 timestamp;
        bool isProcessed;
        bytes payload;
    }

    struct MessageProof {
        bytes32 messageHash;
        bytes32[] proof;
        uint256 blockNumber;
        uint256 timestamp;
        address sender;
    }

    // Storage
    mapping(uint256 => ChainConfig) public chains;
    mapping(bytes32 => BridgeOperation) public operations;
    mapping(uint256 => mapping(address => uint256)) public chainNonces;
    mapping(bytes32 => MessageProof) public messageProofs;

    // Events
    event ChainConfigured(uint256 indexed chainId, string name, address bridgeContract);
    event BridgeOperationInitiated(bytes32 indexed operationId, uint256 sourceChain, uint256 targetChain);
    event BridgeOperationCompleted(bytes32 indexed operationId, address recipient, uint256 amount);
    event MessageSent(bytes32 indexed messageId, uint256 sourceChain, uint256 targetChain);
    event MessageReceived(bytes32 indexed messageId, uint256 sourceChain, bytes data);
    event ProofSubmitted(bytes32 indexed messageId, uint256 blockNumber);

    /**
     * @dev Initialize the contract
     */
    function initialize(
        address _arbBridge,
        address _sequencerInbox
    ) public initializer {
        __UUPSUpgradeable_init();
        __AccessControl_init();
        __Pausable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(BRIDGE_ADMIN, msg.sender);

        arbBridge = IBridge(_arbBridge);
        sequencerInbox = ISequencerInbox(_sequencerInbox);

        // Configure default chains
        _configureChain(ARBITRUM_ONE, "Arbitrum One", _arbBridge);
        _configureChain(ARBITRUM_NOVA, "Arbitrum Nova", _arbBridge);
    }

    /**
     * @dev Configure a new chain
     */
    function configureChain(
        uint256 chainId,
        string calldata name,
        address bridgeContract,
        address tokenContract,
        uint256 minDelay,
        uint256 maxAmount
    ) external onlyRole(BRIDGE_ADMIN) {
        require(chainId != 0, "Invalid chain ID");
        require(bridgeContract != address(0), "Invalid bridge contract");
        require(tokenContract != address(0), "Invalid token contract");

        ChainConfig storage config = chains[chainId];
        config.chainId = chainId;
        config.name = name;
        config.bridgeContract = bridgeContract;
        config.tokenContract = tokenContract;
        config.isActive = true;
        config.minDelay = minDelay;
        config.maxAmount = maxAmount;

        emit ChainConfigured(chainId, name, bridgeContract);
    }

    /**
     * @dev Initiate a bridge operation
     */
    function initiateBridge(
        uint256 targetChain,
        address recipient,
        uint256 amount,
        bytes calldata payload
    ) external whenNotPaused returns (bytes32) {
        require(chains[targetChain].isActive, "Target chain not supported");
        require(amount <= chains[targetChain].maxAmount, "Amount exceeds limit");

        bytes32 operationId = keccak256(abi.encodePacked(
            msg.sender,
            recipient,
            amount,
            block.chainid,
            targetChain,
            chainNonces[targetChain][msg.sender]++
        ));

        BridgeOperation storage operation = operations[operationId];
        operation.operationId = operationId;
        operation.sender = msg.sender;
        operation.recipient = recipient;
        operation.amount = amount;
        operation.sourceChain = block.chainid;
        operation.targetChain = targetChain;
        operation.timestamp = block.timestamp;
        operation.payload = payload;

        emit BridgeOperationInitiated(operationId, block.chainid, targetChain);
        return operationId;
    }

    /**
     * @dev Send message to another chain
     */
    function sendMessage(
        uint256 targetChain,
        bytes calldata message
    ) external whenNotPaused returns (bytes32) {
        require(chains[targetChain].isActive, "Target chain not supported");

        bytes32 messageId = keccak256(abi.encodePacked(
            block.chainid,
            targetChain,
            msg.sender,
            message,
            block.timestamp
        ));

        // Store message proof
        messageProofs[messageId] = MessageProof({
            messageHash: keccak256(message),
            proof: new bytes32[](0),
            blockNumber: block.number,
            timestamp: block.timestamp,
            sender: msg.sender
        });

        emit MessageSent(messageId, block.chainid, targetChain);
        return messageId;
    }

    /**
     * @dev Receive message from another chain
     */
    function receiveMessage(
        uint256 sourceChain,
        bytes32 messageId,
        bytes calldata message,
        bytes32[] calldata proof
    ) external whenNotPaused onlyRole(RELAYER) {
        require(chains[sourceChain].isActive, "Source chain not supported");
        require(
            block.timestamp >= messageProofs[messageId].timestamp + chains[sourceChain].minDelay,
            "Message delay not met"
        );

        // Verify message proof
        require(
            _verifyMessageProof(messageId, message, proof),
            "Invalid message proof"
        );

        // Mark message as processed
        chains[sourceChain].processedMessages[messageId] = true;

        emit MessageReceived(messageId, sourceChain, message);
    }

    /**
     * @dev Submit proof for a message
     */
    function submitProof(
        bytes32 messageId,
        bytes32[] calldata proof,
        uint256 blockNumber
    ) external onlyRole(RELAYER) {
        MessageProof storage messageProof = messageProofs[messageId];
        require(messageProof.timestamp != 0, "Message not found");
        require(messageProof.proof.length == 0, "Proof already submitted");

        messageProof.proof = proof;
        messageProof.blockNumber = blockNumber;

        emit ProofSubmitted(messageId, blockNumber);
    }

    /**
     * @dev Complete a bridge operation
     */
    function completeBridge(
        bytes32 operationId,
        bytes calldata proof
    ) external whenNotPaused onlyRole(RELAYER) {
        BridgeOperation storage operation = operations[operationId];
        require(!operation.isProcessed, "Operation already processed");
        require(
            block.timestamp >= operation.timestamp + chains[operation.targetChain].minDelay,
            "Operation delay not met"
        );

        // Verify operation proof
        require(_verifyOperationProof(operationId, proof), "Invalid operation proof");

        operation.isProcessed = true;

        emit BridgeOperationCompleted(operationId, operation.recipient, operation.amount);
    }

    /**
     * @dev Get chain configuration
     */
    function getChainConfig(
        uint256 chainId
    ) external view returns (
        string memory name,
        address bridgeContract,
        address tokenContract,
        bool isActive,
        uint256 minDelay,
        uint256 maxAmount
    ) {
        ChainConfig storage config = chains[chainId];
        return (
            config.name,
            config.bridgeContract,
            config.tokenContract,
            config.isActive,
            config.minDelay,
            config.maxAmount
        );
    }

    /**
     * @dev Get operation details
     */
    function getOperation(
        bytes32 operationId
    ) external view returns (
        address sender,
        address recipient,
        uint256 amount,
        uint256 sourceChain,
        uint256 targetChain,
        uint256 timestamp,
        bool isProcessed,
        bytes memory payload
    ) {
        BridgeOperation storage operation = operations[operationId];
        return (
            operation.sender,
            operation.recipient,
            operation.amount,
            operation.sourceChain,
            operation.targetChain,
            operation.timestamp,
            operation.isProcessed,
            operation.payload
        );
    }

    /**
     * @dev Internal function to configure a chain
     */
    function _configureChain(
        uint256 chainId,
        string memory name,
        address bridgeContract
    ) internal {
        ChainConfig storage config = chains[chainId];
        config.chainId = chainId;
        config.name = name;
        config.bridgeContract = bridgeContract;
        config.isActive = true;
        config.minDelay = 1 hours;
        config.maxAmount = 1000000 ether;

        emit ChainConfigured(chainId, name, bridgeContract);
    }

    /**
     * @dev Verify message proof
     */
    function _verifyMessageProof(
        bytes32 messageId,
        bytes memory message,
        bytes32[] memory proof
    ) internal view returns (bool) {
        // Implement merkle proof verification
        // This is a placeholder - implement actual verification logic
        return true;
    }

    /**
     * @dev Verify operation proof
     */
    function _verifyOperationProof(
        bytes32 operationId,
        bytes memory proof
    ) internal view returns (bool) {
        // Implement proof verification
        // This is a placeholder - implement actual verification logic
        return true;
    }

    /**
     * @dev Required by UUPS
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}
} 