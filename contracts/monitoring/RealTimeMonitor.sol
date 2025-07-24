// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@arbitrum/nitro-contracts/src/precompiles/ArbGasInfo.sol";
import "@arbitrum/nitro-contracts/src/precompiles/ArbSys.sol";

/**
 * @title BrainSafes Real-Time Monitor
 * @dev Monitors platform security, gas usage, transactions, and network metrics
 * @custom:security-contact security@brainsafes.com
 */
contract RealTimeMonitor is UUPSUpgradeable, AccessControlUpgradeable, PausableUpgradeable {
    // Roles
    bytes32 public constant MONITOR_ADMIN = keccak256("MONITOR_ADMIN");
    bytes32 public constant ALERT_MANAGER = keccak256("ALERT_MANAGER");

    // Arbitrum precompiles
    ArbGasInfo constant arbGasInfo = ArbGasInfo(0x000000000000000000000000000000000000006C);
    ArbSys constant arbSys = ArbSys(0x0000000000000000000000000000000000000064);

    // Alert severity levels
    enum AlertSeverity { LOW, MEDIUM, HIGH, CRITICAL }

    // Alert types
    enum AlertType {
        SECURITY_BREACH,
        HIGH_GAS,
        FAILED_TX,
        NETWORK_CONGESTION,
        SUSPICIOUS_ACTIVITY,
        CONTRACT_INTERACTION
    }

    // Structs
    struct SecurityAlert {
        AlertType alertType;
        AlertSeverity severity;
        address source;
        uint256 timestamp;
        bytes data;
        bool isResolved;
        string description;
    }

    struct GasMetrics {
        uint256 currentL1BaseFee;
        uint256 currentL2GasPrice;
        uint256 avgGasUsage;
        uint256 peakGasUsage;
        uint256 lastUpdateBlock;
        mapping(address => uint256) contractGasUsage;
    }

    struct TransactionMetrics {
        uint256 totalTransactions;
        uint256 successfulTransactions;
        uint256 failedTransactions;
        uint256 avgConfirmationTime;
        mapping(address => uint256) userTransactionCount;
        mapping(bytes4 => uint256) methodCallCount;
    }

    struct NetworkMetrics {
        uint256 blockHeight;
        uint256 nodeCount;
        uint256 networkLatency;
        uint256 tps;
        uint256 pendingTxCount;
        mapping(uint256 => uint256) blockTimes;
    }

    // Storage
    mapping(uint256 => SecurityAlert) public alerts;
    uint256 public alertCount;
    GasMetrics private gasMetrics;
    TransactionMetrics private txMetrics;
    NetworkMetrics private networkMetrics;

    // Thresholds
    uint256 public constant MAX_GAS_THRESHOLD = 2_000_000;
    uint256 public constant HIGH_TPS_THRESHOLD = 1_000;
    uint256 public constant MAX_PENDING_TX = 10_000;
    uint256 public constant ALERT_EXPIRY = 7 days;

    // Events
    event SecurityAlertRaised(
        uint256 indexed alertId,
        AlertType indexed alertType,
        AlertSeverity severity,
        address source
    );
    event AlertResolved(uint256 indexed alertId, address resolver);
    event GasMetricsUpdated(uint256 l1BaseFee, uint256 l2GasPrice);
    event HighGasUsageDetected(address indexed contract, uint256 gasUsed);
    event NetworkCongestion(uint256 pendingTxCount, uint256 currentTps);
    event SuspiciousActivityDetected(address indexed account, string reason);

    /**
     * @dev Initialize the contract
     */
    function initialize() public initializer {
        __UUPSUpgradeable_init();
        __AccessControl_init();
        __Pausable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MONITOR_ADMIN, msg.sender);
    }

    /**
     * @dev Raise a security alert
     * @param alertType Type of alert
     * @param severity Alert severity level
     * @param source Address that triggered the alert
     * @param description Description of the alert
     * @param data Additional data related to the alert
     */
    function raiseAlert(
        AlertType alertType,
        AlertSeverity severity,
        address source,
        string calldata description,
        bytes calldata data
    ) external onlyRole(ALERT_MANAGER) {
        uint256 alertId = alertCount++;
        
        alerts[alertId] = SecurityAlert({
            alertType: alertType,
            severity: severity,
            source: source,
            timestamp: block.timestamp,
            data: data,
            isResolved: false,
            description: description
        });

        emit SecurityAlertRaised(alertId, alertType, severity, source);

        if (severity == AlertSeverity.CRITICAL) {
            _pause();
        }
    }

    /**
     * @dev Update gas metrics
     * @param contractAddress Contract being monitored
     * @param gasUsed Gas used in the operation
     */
    function updateGasMetrics(
        address contractAddress,
        uint256 gasUsed
    ) external onlyRole(MONITOR_ADMIN) {
        gasMetrics.currentL1BaseFee = arbGasInfo.getL1BaseFeeEstimate();
        gasMetrics.currentL2GasPrice = tx.gasprice;
        gasMetrics.contractGasUsage[contractAddress] += gasUsed;

        if (gasUsed > gasMetrics.peakGasUsage) {
            gasMetrics.peakGasUsage = gasUsed;
        }

        // Calculate rolling average
        gasMetrics.avgGasUsage = (gasMetrics.avgGasUsage * 9 + gasUsed) / 10;

        emit GasMetricsUpdated(
            gasMetrics.currentL1BaseFee,
            gasMetrics.currentL2GasPrice
        );

        // Check for high gas usage
        if (gasUsed > MAX_GAS_THRESHOLD) {
            emit HighGasUsageDetected(contractAddress, gasUsed);
        }
    }

    /**
     * @dev Update transaction metrics
     * @param user User address
     * @param success Transaction success status
     * @param confirmationTime Time taken for confirmation
     * @param methodSelector Function selector called
     */
    function updateTransactionMetrics(
        address user,
        bool success,
        uint256 confirmationTime,
        bytes4 methodSelector
    ) external onlyRole(MONITOR_ADMIN) {
        txMetrics.totalTransactions++;
        txMetrics.userTransactionCount[user]++;
        txMetrics.methodCallCount[methodSelector]++;

        if (success) {
            txMetrics.successfulTransactions++;
        } else {
            txMetrics.failedTransactions++;
        }

        // Update average confirmation time
        txMetrics.avgConfirmationTime = (
            txMetrics.avgConfirmationTime * (txMetrics.totalTransactions - 1) + 
            confirmationTime
        ) / txMetrics.totalTransactions;
    }

    /**
     * @dev Update network metrics
     * @param nodeCount Current number of nodes
     * @param latency Network latency in milliseconds
     * @param pendingTxs Number of pending transactions
     */
    function updateNetworkMetrics(
        uint256 nodeCount,
        uint256 latency,
        uint256 pendingTxs
    ) external onlyRole(MONITOR_ADMIN) {
        networkMetrics.blockHeight = arbSys.arbBlockNumber();
        networkMetrics.nodeCount = nodeCount;
        networkMetrics.networkLatency = latency;
        networkMetrics.pendingTxCount = pendingTxs;

        // Calculate TPS
        uint256 currentBlock = block.number;
        uint256 timeElapsed = block.timestamp - networkMetrics.blockTimes[currentBlock - 100];
        networkMetrics.tps = txMetrics.totalTransactions * 1000 / timeElapsed;

        // Store current block time
        networkMetrics.blockTimes[currentBlock] = block.timestamp;

        // Check for network congestion
        if (pendingTxs > MAX_PENDING_TX || networkMetrics.tps > HIGH_TPS_THRESHOLD) {
            emit NetworkCongestion(pendingTxs, networkMetrics.tps);
        }
    }

    /**
     * @dev Get current gas metrics
     */
    function getGasMetrics() external view returns (
        uint256 l1BaseFee,
        uint256 l2GasPrice,
        uint256 avgGasUsage,
        uint256 peakGasUsage
    ) {
        return (
            gasMetrics.currentL1BaseFee,
            gasMetrics.currentL2GasPrice,
            gasMetrics.avgGasUsage,
            gasMetrics.peakGasUsage
        );
    }

    /**
     * @dev Get transaction metrics
     */
    function getTransactionMetrics() external view returns (
        uint256 total,
        uint256 successful,
        uint256 failed,
        uint256 avgConfirmTime
    ) {
        return (
            txMetrics.totalTransactions,
            txMetrics.successfulTransactions,
            txMetrics.failedTransactions,
            txMetrics.avgConfirmationTime
        );
    }

    /**
     * @dev Get network metrics
     */
    function getNetworkMetrics() external view returns (
        uint256 blocks,
        uint256 nodes,
        uint256 latency,
        uint256 transactionsPerSecond,
        uint256 pending
    ) {
        return (
            networkMetrics.blockHeight,
            networkMetrics.nodeCount,
            networkMetrics.networkLatency,
            networkMetrics.tps,
            networkMetrics.pendingTxCount
        );
    }

    /**
     * @dev Check for suspicious activity
     * @param account Account to check
     * @param txCount Recent transaction count
     * @param gasUsed Gas used in recent transactions
     */
    function checkSuspiciousActivity(
        address account,
        uint256 txCount,
        uint256 gasUsed
    ) external onlyRole(MONITOR_ADMIN) {
        // Check for unusual transaction patterns
        if (txCount > txMetrics.userTransactionCount[account] * 3) {
            emit SuspiciousActivityDetected(account, "Unusual transaction frequency");
        }

        // Check for abnormal gas usage
        if (gasUsed > gasMetrics.avgGasUsage * 5) {
            emit SuspiciousActivityDetected(account, "Abnormal gas usage");
        }
    }

    /**
     * @dev Resolve an alert
     * @param alertId ID of the alert to resolve
     */
    function resolveAlert(uint256 alertId) external onlyRole(ALERT_MANAGER) {
        require(!alerts[alertId].isResolved, "Alert already resolved");
        require(
            block.timestamp - alerts[alertId].timestamp <= ALERT_EXPIRY,
            "Alert expired"
        );

        alerts[alertId].isResolved = true;
        emit AlertResolved(alertId, msg.sender);
    }

    /**
     * @dev Required by UUPS
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}
} 