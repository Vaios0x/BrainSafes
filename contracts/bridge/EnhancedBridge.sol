// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@arbitrum/nitro-contracts/src/precompiles/ArbSys.sol";
import "@arbitrum/nitro-contracts/src/precompiles/ArbRetryableTx.sol";
import "@arbitrum/nitro-contracts/src/libraries/AddressAliasHelper.sol";

/**
 * @title EnhancedBridge
 * @dev Bridge optimizado con retryable tickets y compresión de datos
 */
contract EnhancedBridge is AccessControl, ReentrancyGuard, Pausable {
    bytes32 public constant BRIDGE_OPERATOR_ROLE = keccak256("BRIDGE_OPERATOR_ROLE");
    bytes32 public constant RELAYER_ROLE = keccak256("RELAYER_ROLE");

    // Precompilados de Arbitrum
    ArbSys constant arbsys = ArbSys(address(0x64));
    ArbRetryableTx constant arbRetryableTx = ArbRetryableTx(address(0x6e));

    // Estructuras
    struct BridgeOperation {
        uint256 id;
        address sender;
        address recipient;
        uint256 amount;
        OperationType operationType;
        uint256 timestamp;
        OperationStatus status;
        bytes data;
        uint256 gasLimit;
        uint256 maxSubmissionCost;
        bytes32 retryableTicketId;
    }

    struct RetryableConfig {
        uint256 baseSubmissionCost;
        uint256 baseGasLimit;
        uint256 gasLimitPerByte;
        uint256 maxRetryWindow;
        uint256 submissionFeeMultiplier;
    }

    struct BridgeStats {
        uint256 totalOperations;
        uint256 successfulOperations;
        uint256 failedOperations;
        uint256 totalVolume;
        uint256 uniqueUsers;
    }

    // Enums
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
    mapping(bytes32 => bool) public processedMessages;
    mapping(address => uint256[]) public userOperations;
    mapping(OperationType => RetryableConfig) public retryableConfigs;
    mapping(address => bool) public hasUsedBridge;

    // Contadores y estadísticas
    uint256 private operationCounter;
    BridgeStats public stats;

    // Direcciones de contratos
    address public l1Token;
    address public l2Token;
    address public l1Gateway;
    address public l2Gateway;

    // Eventos
    event OperationInitiated(
        uint256 indexed operationId,
        address indexed sender,
        OperationType operationType
    );
    event OperationCompleted(
        uint256 indexed operationId,
        bytes32 indexed retryableTicketId
    );
    event OperationFailed(
        uint256 indexed operationId,
        string reason
    );
    event RetryableTicketCreated(
        bytes32 indexed ticketId,
        address indexed sender,
        uint256 indexed operationId
    );
    event MessageProcessed(
        bytes32 indexed messageId,
        address indexed sender,
        bytes data
    );
    event ConfigUpdated(
        OperationType indexed operationType,
        string parameter,
        uint256 value
    );

    constructor(
        address _l1Token,
        address _l2Token,
        address _l1Gateway,
        address _l2Gateway
    ) {
        require(_l1Token != address(0), "Invalid L1 token");
        require(_l2Token != address(0), "Invalid L2 token");
        require(_l1Gateway != address(0), "Invalid L1 gateway");
        require(_l2Gateway != address(0), "Invalid L2 gateway");

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(BRIDGE_OPERATOR_ROLE, msg.sender);

        l1Token = _l1Token;
        l2Token = _l2Token;
        l1Gateway = _l1Gateway;
        l2Gateway = _l2Gateway;

        // Configuración inicial para retryables
        _initializeRetryableConfigs();
    }

    /**
     * @dev Inicializa configuración de retryables
     */
    function _initializeRetryableConfigs() internal {
        // Token deposits
        retryableConfigs[OperationType.TOKEN_DEPOSIT] = RetryableConfig({
            baseSubmissionCost: 0.01 ether,
            baseGasLimit: 100000,
            gasLimitPerByte: 100,
            maxRetryWindow: 7 days,
            submissionFeeMultiplier: 120 // 1.2x
        });

        // Token withdrawals
        retryableConfigs[OperationType.TOKEN_WITHDRAWAL] = RetryableConfig({
            baseSubmissionCost: 0.01 ether,
            baseGasLimit: 150000,
            gasLimitPerByte: 100,
            maxRetryWindow: 7 days,
            submissionFeeMultiplier: 120
        });

        // Certificate bridging
        retryableConfigs[OperationType.CERTIFICATE_BRIDGE] = RetryableConfig({
            baseSubmissionCost: 0.02 ether,
            baseGasLimit: 200000,
            gasLimitPerByte: 200,
            maxRetryWindow: 7 days,
            submissionFeeMultiplier: 130 // 1.3x
        });

        // Data bridging
        retryableConfigs[OperationType.DATA_BRIDGE] = RetryableConfig({
            baseSubmissionCost: 0.015 ether,
            baseGasLimit: 120000,
            gasLimitPerByte: 150,
            maxRetryWindow: 7 days,
            submissionFeeMultiplier: 125 // 1.25x
        });
    }

    /**
     * @dev Inicia operación de bridge
     */
    function initiateOperation(
        address recipient,
        uint256 amount,
        OperationType operationType,
        bytes calldata data
    ) external payable nonReentrant whenNotPaused returns (uint256) {
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Invalid amount");

        RetryableConfig memory config = retryableConfigs[operationType];
        require(config.baseSubmissionCost > 0, "Operation type not configured");

        // Calcular costos
        uint256 dataLength = data.length;
        uint256 gasLimit = config.baseGasLimit + (dataLength * config.gasLimitPerByte);
        uint256 maxSubmissionCost = _calculateSubmissionCost(
            config.baseSubmissionCost,
            dataLength,
            config.submissionFeeMultiplier
        );

        require(msg.value >= maxSubmissionCost, "Insufficient submission cost");

        // Crear operación
        operationCounter++;
        uint256 operationId = operationCounter;

        operations[operationId] = BridgeOperation({
            id: operationId,
            sender: msg.sender,
            recipient: recipient,
            amount: amount,
            operationType: operationType,
            timestamp: block.timestamp,
            status: OperationStatus.PENDING,
            data: data,
            gasLimit: gasLimit,
            maxSubmissionCost: maxSubmissionCost,
            retryableTicketId: bytes32(0)
        });

        // Actualizar estadísticas
        if (!hasUsedBridge[msg.sender]) {
            hasUsedBridge[msg.sender] = true;
            stats.uniqueUsers++;
        }
        stats.totalOperations++;
        stats.totalVolume += amount;
        userOperations[msg.sender].push(operationId);

        emit OperationInitiated(operationId, msg.sender, operationType);

        // Crear retryable ticket
        _createRetryableTicket(operationId);

        return operationId;
    }

    /**
     * @dev Crea retryable ticket
     */
    function _createRetryableTicket(uint256 operationId) internal {
        BridgeOperation storage operation = operations[operationId];
        
        // Preparar datos para el ticket
        bytes memory ticketData = _prepareTicketData(operation);

        // Crear ticket
        bytes32 ticketId = arbRetryableTx.createRetryableTicket{value: operation.maxSubmissionCost}(
            l2Gateway,
            0, // No ETH transfer
            operation.maxSubmissionCost,
            msg.sender,
            msg.sender,
            operation.gasLimit,
            arbRetryableTx.getSubmissionPrice(ticketData.length),
            ticketData
        );

        operation.retryableTicketId = ticketId;
        operation.status = OperationStatus.PROCESSING;

        emit RetryableTicketCreated(ticketId, msg.sender, operationId);
    }

    /**
     * @dev Prepara datos para retryable ticket
     */
    function _prepareTicketData(
        BridgeOperation memory operation
    ) internal pure returns (bytes memory) {
        if (operation.operationType == OperationType.TOKEN_DEPOSIT) {
            return abi.encodeWithSignature(
                "finalizeDeposit(address,address,uint256,bytes)",
                operation.sender,
                operation.recipient,
                operation.amount,
                operation.data
            );
        } else if (operation.operationType == OperationType.TOKEN_WITHDRAWAL) {
            return abi.encodeWithSignature(
                "finalizeWithdrawal(address,address,uint256,bytes)",
                operation.sender,
                operation.recipient,
                operation.amount,
                operation.data
            );
        } else if (operation.operationType == OperationType.CERTIFICATE_BRIDGE) {
            return abi.encodeWithSignature(
                "bridgeCertificate(address,bytes)",
                operation.recipient,
                operation.data
            );
        } else {
            return abi.encodeWithSignature(
                "bridgeData(address,bytes)",
                operation.recipient,
                operation.data
            );
        }
    }

    /**
     * @dev Calcula costo de submission
     */
    function _calculateSubmissionCost(
        uint256 baseCost,
        uint256 dataLength,
        uint256 multiplier
    ) internal pure returns (uint256) {
        uint256 dataCost = dataLength * 16; // 16 wei por byte
        uint256 totalCost = baseCost + dataCost;
        return (totalCost * multiplier) / 100;
    }

    /**
     * @dev Procesa mensaje desde L1/L2
     */
    function processMessage(
        bytes32 messageId,
        address sender,
        bytes calldata data
    ) external onlyRole(RELAYER_ROLE) nonReentrant {
        require(!processedMessages[messageId], "Message already processed");
        require(
            sender == l1Gateway || sender == l2Gateway,
            "Invalid message sender"
        );

        processedMessages[messageId] = true;
        emit MessageProcessed(messageId, sender, data);

        // Procesar mensaje según tipo
        (bytes4 selector, bytes memory payload) = abi.decode(data, (bytes4, bytes));
        if (selector == bytes4(keccak256("completeOperation(uint256)"))) {
            uint256 operationId = abi.decode(payload, (uint256));
            _completeOperation(operationId);
        } else if (selector == bytes4(keccak256("failOperation(uint256,string)"))) {
            (uint256 operationId, string memory reason) = abi.decode(payload, (uint256, string));
            _failOperation(operationId, reason);
        }
    }

    /**
     * @dev Completa una operación
     */
    function _completeOperation(uint256 operationId) internal {
        BridgeOperation storage operation = operations[operationId];
        require(operation.status == OperationStatus.PROCESSING, "Invalid operation status");

        operation.status = OperationStatus.COMPLETED;
        stats.successfulOperations++;

        emit OperationCompleted(operationId, operation.retryableTicketId);
    }

    /**
     * @dev Marca una operación como fallida
     */
    function _failOperation(uint256 operationId, string memory reason) internal {
        BridgeOperation storage operation = operations[operationId];
        require(operation.status != OperationStatus.COMPLETED, "Operation already completed");

        operation.status = OperationStatus.FAILED;
        stats.failedOperations++;

        emit OperationFailed(operationId, reason);
    }

    /**
     * @dev Actualiza configuración de retryables
     */
    function updateRetryableConfig(
        OperationType operationType,
        uint256 baseSubmissionCost,
        uint256 baseGasLimit,
        uint256 gasLimitPerByte,
        uint256 maxRetryWindow,
        uint256 submissionFeeMultiplier
    ) external onlyRole(BRIDGE_OPERATOR_ROLE) {
        require(submissionFeeMultiplier <= 200, "Multiplier too high"); // Max 2x
        require(maxRetryWindow <= 30 days, "Retry window too long");

        retryableConfigs[operationType] = RetryableConfig({
            baseSubmissionCost: baseSubmissionCost,
            baseGasLimit: baseGasLimit,
            gasLimitPerByte: gasLimitPerByte,
            maxRetryWindow: maxRetryWindow,
            submissionFeeMultiplier: submissionFeeMultiplier
        });

        emit ConfigUpdated(operationType, "baseSubmissionCost", baseSubmissionCost);
        emit ConfigUpdated(operationType, "baseGasLimit", baseGasLimit);
        emit ConfigUpdated(operationType, "gasLimitPerByte", gasLimitPerByte);
        emit ConfigUpdated(operationType, "maxRetryWindow", maxRetryWindow);
        emit ConfigUpdated(operationType, "submissionFeeMultiplier", submissionFeeMultiplier);
    }

    /**
     * @dev Obtiene operación
     */
    function getOperation(uint256 operationId) external view returns (BridgeOperation memory) {
        return operations[operationId];
    }

    /**
     * @dev Obtiene operaciones de usuario
     */
    function getUserOperations(address user) external view returns (uint256[] memory) {
        return userOperations[user];
    }

    /**
     * @dev Obtiene estadísticas
     */
    function getStats() external view returns (BridgeStats memory) {
        return stats;
    }

    /**
     * @dev Pausa el contrato
     */
    function pause() external onlyRole(BRIDGE_OPERATOR_ROLE) {
        _pause();
    }

    /**
     * @dev Despausa el contrato
     */
    function unpause() external onlyRole(BRIDGE_OPERATOR_ROLE) {
        _unpause();
    }
} 