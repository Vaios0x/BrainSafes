// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@arbitrum/nitro-contracts/src/precompiles/ArbSys.sol";
import "@arbitrum/nitro-contracts/src/precompiles/ArbGasInfo.sol";
import "../cache/DistributedCache.sol";

/**
 * @title TransactionMonitor
 * @notice Transaction monitoring contract for BrainSafes
 * @dev Logs and analyzes transaction activity for security and analytics
 * @author BrainSafes Team
 */
contract TransactionMonitor is AccessControl, ReentrancyGuard {
    bytes32 public constant MONITOR_ROLE = keccak256("MONITOR_ROLE");
    bytes32 public constant RECOVERY_ROLE = keccak256("RECOVERY_ROLE");

    ArbSys constant arbsys = ArbSys(address(0x64));
    ArbGasInfo constant arbGasInfo = ArbGasInfo(address(0x6c));
    DistributedCache public cache;

    struct Transaction {
        bytes32 txHash;
        address sender;
        address target;
        uint256 value;
        bytes data;
        uint256 timestamp;
        uint256 blockNumber;
        TxStatus status;
        uint256 retryCount;
        uint256 gasUsed;
        string errorMessage;
    }

    struct MonitorConfig {
        uint256 maxRetries;
        uint256 minRetryDelay;
        uint256 maxRetryDelay;
        uint256 gasIncreasePercentage;
        bool autoRetryEnabled;
    }

    enum TxStatus {
        PENDING,
        CONFIRMED,
        FAILED,
        RECOVERED,
        UNRECOVERABLE
    }

    // Estado del contrato
    mapping(bytes32 => Transaction) public transactions;
    mapping(address => bytes32[]) public userTransactions;
    mapping(bytes32 => bytes32[]) public relatedTransactions;
    
    MonitorConfig public config;
    uint256 public totalTransactions;
    uint256 public failedTransactions;
    uint256 public recoveredTransactions;

    // Eventos
    event TransactionMonitored(bytes32 indexed txHash, address indexed sender, TxStatus status);
    event TransactionStatusUpdated(bytes32 indexed txHash, TxStatus oldStatus, TxStatus newStatus);
    event RecoveryAttempted(bytes32 indexed txHash, bool success, string reason);
    event MonitorConfigUpdated(MonitorConfig config);
    event ErrorLogged(bytes32 indexed txHash, string error, uint256 timestamp);

    constructor(address _cache) {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(MONITOR_ROLE, msg.sender);
        _setupRole(RECOVERY_ROLE, msg.sender);
        
        cache = DistributedCache(_cache);

        // Configuración inicial
        config = MonitorConfig({
            maxRetries: 3,
            minRetryDelay: 1 minutes,
            maxRetryDelay: 1 hours,
            gasIncreasePercentage: 110, // 10% más de gas en cada reintento
            autoRetryEnabled: true
        });
    }

    /**
     * @dev Monitorear nueva transacción
     */
    function monitorTransaction(
        bytes32 txHash,
        address sender,
        address target,
        uint256 value,
        bytes calldata data
    ) external onlyRole(MONITOR_ROLE) {
        require(transactions[txHash].timestamp == 0, "Transaction already monitored");

        transactions[txHash] = Transaction({
            txHash: txHash,
            sender: sender,
            target: target,
            value: value,
            data: data,
            timestamp: block.timestamp,
            blockNumber: block.number,
            status: TxStatus.PENDING,
            retryCount: 0,
            gasUsed: 0,
            errorMessage: ""
        });

        userTransactions[sender].push(txHash);
        totalTransactions++;

        emit TransactionMonitored(txHash, sender, TxStatus.PENDING);

        // Cachear datos de la transacción
        bytes32 cacheKey = keccak256(abi.encodePacked("tx", txHash));
        cache.set(cacheKey, abi.encode(data), block.timestamp + 1 days);
    }

    /**
     * @dev Actualizar estado de transacción
     */
    function updateTransactionStatus(
        bytes32 txHash,
        TxStatus newStatus,
        uint256 gasUsed,
        string calldata errorMessage
    ) external onlyRole(MONITOR_ROLE) {
        Transaction storage tx = transactions[txHash];
        require(tx.timestamp > 0, "Transaction not found");

        TxStatus oldStatus = tx.status;
        tx.status = newStatus;
        tx.gasUsed = gasUsed;

        if (bytes(errorMessage).length > 0) {
            tx.errorMessage = errorMessage;
            emit ErrorLogged(txHash, errorMessage, block.timestamp);
        }

        if (newStatus == TxStatus.FAILED) {
            failedTransactions++;
            if (config.autoRetryEnabled) {
                _attemptRecovery(txHash);
            }
        } else if (newStatus == TxStatus.RECOVERED) {
            recoveredTransactions++;
        }

        emit TransactionStatusUpdated(txHash, oldStatus, newStatus);
    }

    /**
     * @dev Intentar recuperar transacción fallida
     */
    function _attemptRecovery(bytes32 txHash) internal returns (bytes32) {
        Transaction storage tx = transactions[txHash];
        require(tx.status == TxStatus.FAILED, "Transaction not failed");
        require(tx.retryCount < config.maxRetries, "Max retries exceeded");

        // Calcular nuevo gas
        uint256 newGas = (tx.gasUsed * config.gasIncreasePercentage) / 100;

        // Crear nueva transacción
        bytes32 retryTxHash = keccak256(abi.encodePacked(txHash, tx.retryCount));
        
        transactions[retryTxHash] = Transaction({
            txHash: retryTxHash,
            sender: tx.sender,
            target: tx.target,
            value: tx.value,
            data: tx.data,
            timestamp: block.timestamp,
            blockNumber: block.number,
            status: TxStatus.PENDING,
            retryCount: tx.retryCount + 1,
            gasUsed: 0,
            errorMessage: ""
        });

        relatedTransactions[txHash].push(retryTxHash);
        tx.retryCount++;

        emit RecoveryAttempted(txHash, true, "Retry initiated");
        return retryTxHash;
    }

    /**
     * @dev Forzar intento de recuperación
     */
    function forceRecovery(
        bytes32 txHash
    ) external onlyRole(RECOVERY_ROLE) returns (bytes32) {
        Transaction storage tx = transactions[txHash];
        require(tx.timestamp > 0, "Transaction not found");
        require(tx.status == TxStatus.FAILED, "Transaction not failed");

        bytes32 retryTxHash = _attemptRecovery(txHash);
        return retryTxHash;
    }

    /**
     * @dev Actualizar configuración de monitoreo
     */
    function updateConfig(
        uint256 _maxRetries,
        uint256 _minRetryDelay,
        uint256 _maxRetryDelay,
        uint256 _gasIncreasePercentage,
        bool _autoRetryEnabled
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_minRetryDelay <= _maxRetryDelay, "Invalid delay range");
        require(_gasIncreasePercentage >= 100, "Invalid gas increase");

        config = MonitorConfig({
            maxRetries: _maxRetries,
            minRetryDelay: _minRetryDelay,
            maxRetryDelay: _maxRetryDelay,
            gasIncreasePercentage: _gasIncreasePercentage,
            autoRetryEnabled: _autoRetryEnabled
        });

        emit MonitorConfigUpdated(config);
    }

    /**
     * @dev Obtener información de transacción
     */
    function getTransactionInfo(
        bytes32 txHash
    ) external view returns (
        Transaction memory tx,
        bytes32[] memory retries
    ) {
        tx = transactions[txHash];
        retries = relatedTransactions[txHash];
        return (tx, retries);
    }

    /**
     * @dev Obtener transacciones de usuario
     */
    function getUserTransactions(
        address user
    ) external view returns (bytes32[] memory) {
        return userTransactions[user];
    }

    /**
     * @dev Obtener estadísticas de monitoreo
     */
    function getMonitoringStats() external view returns (
        uint256 total,
        uint256 failed,
        uint256 recovered,
        uint256 successRate
    ) {
        total = totalTransactions;
        failed = failedTransactions;
        recovered = recoveredTransactions;
        successRate = total > 0 ? 
            ((total - failed + recovered) * 100) / total : 
            0;
        return (total, failed, recovered, successRate);
    }

    /**
     * @dev Verificar si una transacción necesita recuperación
     */
    function needsRecovery(bytes32 txHash) external view returns (
        bool needed,
        bool possible,
        uint256 remainingRetries
    ) {
        Transaction storage tx = transactions[txHash];
        needed = tx.status == TxStatus.FAILED;
        possible = tx.retryCount < config.maxRetries;
        remainingRetries = config.maxRetries - tx.retryCount;
        return (needed, possible, remainingRetries);
    }

    /**
     * @dev Estimar gas para recuperación
     */
    function estimateRecoveryGas(
        bytes32 txHash
    ) external view returns (uint256) {
        Transaction storage tx = transactions[txHash];
        require(tx.timestamp > 0, "Transaction not found");
        
        return (tx.gasUsed * config.gasIncreasePercentage) / 100;
    }
} 