// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@arbitrum/nitro-contracts/src/precompiles/ArbSys.sol";
import "@arbitrum/nitro-contracts/src/precompiles/ArbRetryableTx.sol";
import "@arbitrum/nitro-contracts/src/libraries/AddressAliasHelper.sol";

/**
 * @title BrainSafesBridge
 * @notice Bridge contract for cross-chain asset and message transfer in BrainSafes
 * @dev Handles L1-L2 communication and asset bridging
 * @author BrainSafes Team
 */
contract BrainSafesBridge is AccessControl, ReentrancyGuard, Pausable {
    // Precompilados de Arbitrum
    ArbSys constant arbsys = ArbSys(address(0x64));
    ArbRetryableTx constant arbRetryableTx = ArbRetryableTx(address(0x6e));

    // Roles
    bytes32 public constant BRIDGE_OPERATOR = keccak256("BRIDGE_OPERATOR");
    bytes32 public constant VALIDATOR_ROLE = keccak256("VALIDATOR_ROLE");

    // Direcciones de contratos
    address public l1BrainSafes;
    address public l2BrainSafes;
    address public eduToken;
    address public certificateNFT;

    // Configuración
    uint256 public constant MIN_WITHDRAWAL_DELAY = 7 days;
    uint256 public constant MAX_BATCH_SIZE = 100;
    uint256 public constant GAS_RESERVE_FOR_L1 = 100000;

    // Estructuras
    struct BridgeOperation {
        uint256 id;
        address sender;
        address recipient;
        uint256 amount;
        uint256 timestamp;
        OperationType operationType;
        OperationStatus status;
        bytes data;
    }

    enum OperationType {
        TOKEN_DEPOSIT,
        TOKEN_WITHDRAWAL,
        CERTIFICATE_BRIDGE,
        DATA_BRIDGE
    }

    enum OperationStatus {
        PENDING,
        PROCESSING,
        COMPLETED,
        FAILED
    }

    // Mappings
    mapping(uint256 => BridgeOperation) public operations;
    mapping(address => uint256[]) public userOperations;
    mapping(bytes32 => bool) public processedMessages;
    mapping(address => uint256) public lastWithdrawalTime;

    // Eventos
    event OperationInitiated(
        uint256 indexed operationId,
        address indexed sender,
        OperationType operationType
    );
    event OperationCompleted(
        uint256 indexed operationId,
        address indexed recipient,
        OperationType operationType
    );
    event MessageReceived(
        bytes32 indexed messageId,
        address indexed sender,
        bytes data
    );
    event WithdrawalInitiated(
        address indexed user,
        uint256 amount,
        uint256 withdrawalTime
    );

    // Contador
    uint256 private operationCounter;

    constructor(
        address _l1BrainSafes,
        address _l2BrainSafes,
        address _eduToken,
        address _certificateNFT
    ) {
        require(_l1BrainSafes != address(0), "Invalid L1 address");
        require(_l2BrainSafes != address(0), "Invalid L2 address");
        require(_eduToken != address(0), "Invalid token address");
        require(_certificateNFT != address(0), "Invalid NFT address");

        l1BrainSafes = _l1BrainSafes;
        l2BrainSafes = _l2BrainSafes;
        eduToken = _eduToken;
        certificateNFT = _certificateNFT;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(BRIDGE_OPERATOR, msg.sender);
    }

    /**
     * @notice Initiates a token deposit from L1 to L2.
     * @param recipient The address to receive the tokens on L2.
     * @param amount The amount of tokens to deposit.
     * @param data Additional data for the deposit.
     */
    function depositTokens(
        address recipient,
        uint256 amount,
        bytes calldata data
    ) external nonReentrant whenNotPaused {
        require(amount > 0, "Amount must be greater than 0");
        require(recipient != address(0), "Invalid recipient");

        // Transferir tokens al contrato
        require(
            IERC20(eduToken).transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );

        // Crear operación
        uint256 operationId = ++operationCounter;
        operations[operationId] = BridgeOperation({
            id: operationId,
            sender: msg.sender,
            recipient: recipient,
            amount: amount,
            timestamp: block.timestamp,
            operationType: OperationType.TOKEN_DEPOSIT,
            status: OperationStatus.PENDING,
            data: data
        });

        userOperations[msg.sender].push(operationId);

        // Emitir evento
        emit OperationInitiated(operationId, msg.sender, OperationType.TOKEN_DEPOSIT);

        // Iniciar proceso de bridge
        _bridgeToL2(operationId);
    }

    /**
     * @notice Initiates a token withdrawal from L2 to L1.
     * @param recipient The address to receive the tokens on L1.
     * @param amount The amount of tokens to withdraw.
     */
    function initiateWithdrawal(
        address recipient,
        uint256 amount
    ) external nonReentrant whenNotPaused {
        require(amount > 0, "Amount must be greater than 0");
        require(recipient != address(0), "Invalid recipient");

        // Verificar tiempo mínimo entre retiros
        require(
            block.timestamp >= lastWithdrawalTime[msg.sender] + MIN_WITHDRAWAL_DELAY,
            "Withdrawal delay not met"
        );

        // Crear operación
        uint256 operationId = ++operationCounter;
        operations[operationId] = BridgeOperation({
            id: operationId,
            sender: msg.sender,
            recipient: recipient,
            amount: amount,
            timestamp: block.timestamp,
            operationType: OperationType.TOKEN_WITHDRAWAL,
            status: OperationStatus.PENDING,
            data: ""
        });

        userOperations[msg.sender].push(operationId);
        lastWithdrawalTime[msg.sender] = block.timestamp;

        emit WithdrawalInitiated(msg.sender, amount, block.timestamp);
        emit OperationInitiated(operationId, msg.sender, OperationType.TOKEN_WITHDRAWAL);

        // Iniciar proceso de retiro
        _initiateL2ToL1Transfer(operationId);
    }

    /**
     * @notice Bridges a certificate NFT from L1 to L2.
     * @param tokenId The ID of the NFT to bridge.
     * @param recipient The address to receive the NFT on L2.
     * @param metadata Additional metadata for the NFT.
     */
    function bridgeCertificate(
        uint256 tokenId,
        address recipient,
        bytes calldata metadata
    ) external nonReentrant whenNotPaused {
        require(recipient != address(0), "Invalid recipient");

        // Transferir NFT al contrato
        IERC721(certificateNFT).transferFrom(msg.sender, address(this), tokenId);

        // Crear operación
        uint256 operationId = ++operationCounter;
        operations[operationId] = BridgeOperation({
            id: operationId,
            sender: msg.sender,
            recipient: recipient,
            amount: tokenId,
            timestamp: block.timestamp,
            operationType: OperationType.CERTIFICATE_BRIDGE,
            status: OperationStatus.PENDING,
            data: metadata
        });

        userOperations[msg.sender].push(operationId);

        emit OperationInitiated(operationId, msg.sender, OperationType.CERTIFICATE_BRIDGE);

        // Iniciar bridge de NFT
        _bridgeNFTToL2(operationId);
    }

    /**
     * @notice Processes a message received from L1.
     * @param messageId The ID of the message.
     * @param sender The address from which the message originated.
     * @param data The encoded data of the message.
     */
    function processL1Message(
        bytes32 messageId,
        address sender,
        bytes calldata data
    ) external onlyRole(BRIDGE_OPERATOR) {
        require(!processedMessages[messageId], "Message already processed");
        require(sender == l1BrainSafes, "Invalid sender");

        processedMessages[messageId] = true;
        emit MessageReceived(messageId, sender, data);

        // Procesar mensaje según tipo
        (OperationType opType, uint256 operationId) = abi.decode(data, (OperationType, uint256));
        BridgeOperation storage operation = operations[operationId];

        if (opType == OperationType.TOKEN_DEPOSIT) {
            _processTokenDeposit(operation);
        } else if (opType == OperationType.CERTIFICATE_BRIDGE) {
            _processCertificateBridge(operation);
        }

        operation.status = OperationStatus.COMPLETED;
        emit OperationCompleted(operationId, operation.recipient, operation.operationType);
    }

    /**
     * @notice Processes a message received from L2.
     * @param messageId The ID of the message.
     * @param sender The address from which the message originated.
     * @param data The encoded data of the message.
     */
    function processL2Message(
        bytes32 messageId,
        address sender,
        bytes calldata data
    ) external onlyRole(BRIDGE_OPERATOR) {
        require(!processedMessages[messageId], "Message already processed");
        require(sender == l2BrainSafes, "Invalid sender");

        processedMessages[messageId] = true;
        emit MessageReceived(messageId, sender, data);

        // Procesar mensaje según tipo
        (OperationType opType, uint256 operationId) = abi.decode(data, (OperationType, uint256));
        BridgeOperation storage operation = operations[operationId];

        if (opType == OperationType.TOKEN_WITHDRAWAL) {
            _processTokenWithdrawal(operation);
        }

        operation.status = OperationStatus.COMPLETED;
        emit OperationCompleted(operationId, operation.recipient, operation.operationType);
    }

    // ========== FUNCIONES INTERNAS ==========

    function _bridgeToL2(uint256 operationId) internal {
        BridgeOperation storage operation = operations[operationId];
        operation.status = OperationStatus.PROCESSING;

        // Crear mensaje retryable
        bytes memory data = abi.encodeWithSelector(
            IBrainSafesL2.receiveFromL1.selector,
            operation.sender,
            operation.recipient,
            operation.amount,
            operation.data
        );

        // Estimar gas
        uint256 maxGas = arbRetryableTx.getMaxGas();
        uint256 l2CallValue = 0;
        uint256 maxSubmissionCost = arbRetryableTx.getSubmissionPrice(data.length);

        // Crear ticket retryable
        bytes32 ticketId = arbRetryableTx.createRetryableTicket{value: msg.value}(
            l2BrainSafes,
            l2CallValue,
            maxSubmissionCost,
            msg.sender,
            msg.sender,
            maxGas,
            arbsys.getL1BaseFeeEstimate(),
            data
        );

        // Almacenar ID del ticket
        operation.data = abi.encode(ticketId);
    }

    function _initiateL2ToL1Transfer(uint256 operationId) internal {
        BridgeOperation storage operation = operations[operationId];
        operation.status = OperationStatus.PROCESSING;

        // Iniciar retiro en L2
        bytes memory data = abi.encodeWithSelector(
            IBrainSafesL2.initiateWithdrawal.selector,
            operation.sender,
            operation.recipient,
            operation.amount
        );

        // Crear mensaje L2 a L1
        arbsys.sendTxToL1(
            l1BrainSafes,
            data
        );
    }

    function _bridgeNFTToL2(uint256 operationId) internal {
        BridgeOperation storage operation = operations[operationId];
        operation.status = OperationStatus.PROCESSING;

        // Crear mensaje para L2
        bytes memory data = abi.encodeWithSelector(
            IBrainSafesL2.receiveCertificateFromL1.selector,
            operation.sender,
            operation.recipient,
            operation.amount,
            operation.data
        );

        // Estimar gas
        uint256 maxGas = arbRetryableTx.getMaxGas();
        uint256 l2CallValue = 0;
        uint256 maxSubmissionCost = arbRetryableTx.getSubmissionPrice(data.length);

        // Crear ticket retryable
        bytes32 ticketId = arbRetryableTx.createRetryableTicket{value: msg.value}(
            l2BrainSafes,
            l2CallValue,
            maxSubmissionCost,
            msg.sender,
            msg.sender,
            maxGas,
            arbsys.getL1BaseFeeEstimate(),
            data
        );

        // Almacenar ID del ticket
        operation.data = abi.encode(ticketId);
    }

    function _processTokenDeposit(BridgeOperation storage operation) internal {
        // Mintear tokens en L2
        IERC20(eduToken).approve(l2BrainSafes, operation.amount);
        IBrainSafesL2(l2BrainSafes).mintFromL1(
            operation.recipient,
            operation.amount
        );
    }

    function _processTokenWithdrawal(BridgeOperation storage operation) internal {
        // Transferir tokens al destinatario
        require(
            IERC20(eduToken).transfer(operation.recipient, operation.amount),
            "Transfer failed"
        );
    }

    function _processCertificateBridge(BridgeOperation storage operation) internal {
        // Mintear NFT en L2
        IBrainSafesL2(l2BrainSafes).mintCertificateFromL1(
            operation.recipient,
            operation.amount,
            operation.data
        );
    }

    // ========== FUNCIONES DE VISTA ==========

    function getUserOperations(address user) external view returns (uint256[] memory) {
        return userOperations[user];
    }

    function getOperation(uint256 operationId) external view returns (BridgeOperation memory) {
        return operations[operationId];
    }

    function isMessageProcessed(bytes32 messageId) external view returns (bool) {
        return processedMessages[messageId];
    }

    function getWithdrawalDelay(address user) external view returns (uint256) {
        if (lastWithdrawalTime[user] == 0) return 0;
        uint256 timeElapsed = block.timestamp - lastWithdrawalTime[user];
        if (timeElapsed >= MIN_WITHDRAWAL_DELAY) return 0;
        return MIN_WITHDRAWAL_DELAY - timeElapsed;
    }

    // ========== FUNCIONES ADMIN ==========

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    function updateL1Contract(address newL1Contract) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newL1Contract != address(0), "Invalid address");
        l1BrainSafes = newL1Contract;
    }

    function updateL2Contract(address newL2Contract) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newL2Contract != address(0), "Invalid address");
        l2BrainSafes = newL2Contract;
    }

    function grantOperator(address operator) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(BRIDGE_OPERATOR, operator);
    }

    function revokeOperator(address operator) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _revokeRole(BRIDGE_OPERATOR, operator);
    }

    // ========== FUNCIONES DE EMERGENCIA ==========

    function emergencyWithdraw(
        address token,
        address recipient,
        uint256 amount
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(recipient != address(0), "Invalid recipient");
        if (token == address(0)) {
            payable(recipient).transfer(amount);
        } else {
            require(
                IERC20(token).transfer(recipient, amount),
                "Transfer failed"
            );
        }
    }

    function emergencyWithdrawNFT(
        address nft,
        address recipient,
        uint256 tokenId
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(recipient != address(0), "Invalid recipient");
        IERC721(nft).transferFrom(address(this), recipient, tokenId);
    }

    // ========== RECIBIR ETH ==========
    receive() external payable {}
    fallback() external payable {}
} 