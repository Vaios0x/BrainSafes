// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

/**
 * @title BrainSafes Security Monitor
 * @dev Advanced security monitoring and threat detection system
 * @custom:security-contact security@brainsafes.com
 */
contract SecurityMonitor is UUPSUpgradeable, AccessControlUpgradeable, PausableUpgradeable, ReentrancyGuardUpgradeable {
    // Roles
    bytes32 public constant SECURITY_ADMIN = keccak256("SECURITY_ADMIN");
    bytes32 public constant MONITOR = keccak256("MONITOR");
    bytes32 public constant AUDITOR = keccak256("AUDITOR");

    // Threat levels
    enum ThreatLevel {
        NONE,
        LOW,
        MEDIUM,
        HIGH,
        CRITICAL
    }

    // Alert types
    enum AlertType {
        SUSPICIOUS_TRANSACTION,
        UNUSUAL_PATTERN,
        RATE_LIMIT_EXCEEDED,
        FLASH_LOAN_DETECTED,
        PRICE_MANIPULATION,
        REENTRANCY_ATTEMPT,
        UNAUTHORIZED_ACCESS,
        CONTRACT_INTERACTION,
        LARGE_TRANSFER,
        BLACKLISTED_ADDRESS
    }

    // Structs
    struct SecurityAlert {
        bytes32 alertId;
        AlertType alertType;
        ThreatLevel threatLevel;
        address source;
        address target;
        uint256 timestamp;
        bytes data;
        bool isResolved;
        string resolution;
    }

    struct SecurityConfig {
        uint256 maxTransactionValue;
        uint256 rateLimit;
        uint256 flashLoanThreshold;
        uint256 priceDeviationThreshold;
        uint256 largeTransferThreshold;
        bool monitoringEnabled;
        mapping(address => bool) trustedContracts;
        mapping(address => bool) blacklistedAddresses;
    }

    struct AuditReport {
        bytes32 reportId;
        address auditor;
        uint256 timestamp;
        string reportUri;
        mapping(bytes32 => bool) vulnerabilities;
        mapping(bytes32 => bool) fixedVulnerabilities;
    }

    struct VulnerabilityReport {
        bytes32 vulnId;
        string title;
        string description;
        ThreatLevel severity;
        bool isFixed;
        string fixDescription;
        uint256 reportedAt;
        uint256 fixedAt;
    }

    // Storage
    mapping(bytes32 => SecurityAlert) public alerts;
    mapping(address => SecurityConfig) public securityConfigs;
    mapping(bytes32 => AuditReport) public auditReports;
    mapping(bytes32 => VulnerabilityReport) public vulnerabilities;
    mapping(address => uint256) public transactionCounts;
    mapping(address => uint256) public lastTransactionTime;
    mapping(address => mapping(bytes4 => bool)) public methodBlacklist;

    // Price feeds for manipulation detection
    mapping(address => AggregatorV3Interface) public priceFeeds;

    // Nuevos módulos de optimización
    AdvancedBatchProcessor public batchProcessor;
    DistributedCacheV2 public distributedCache;

    event BatchProcessorSet(address indexed processor);
    event DistributedCacheSet(address indexed cache);

    // Events
    event SecurityAlertRaised(
        bytes32 indexed alertId,
        AlertType alertType,
        ThreatLevel threatLevel,
        address source
    );
    event AlertResolved(bytes32 indexed alertId, string resolution);
    event VulnerabilityReported(bytes32 indexed vulnId, string title, ThreatLevel severity);
    event VulnerabilityFixed(bytes32 indexed vulnId, string fixDescription);
    event AuditReportSubmitted(bytes32 indexed reportId, address auditor, string reportUri);
    event ConfigurationUpdated(address indexed target, string parameter, uint256 value);
    event AddressBlacklisted(address indexed target, string reason);
    event ContractTrusted(address indexed contract_, bool trusted);

    /**
     * @dev Initialize the contract
     */
    function initialize() public initializer {
        __UUPSUpgradeable_init();
        __AccessControl_init();
        __Pausable_init();
        __ReentrancyGuard_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(SECURITY_ADMIN, msg.sender);
    }

    /**
     * @dev Configure security settings for a contract
     */
    function configureSecuritySettings(
        address target,
        uint256 maxValue,
        uint256 rateLimit,
        uint256 flashLoanThreshold,
        uint256 priceDeviation,
        uint256 largeTransfer
    ) external onlyRole(SECURITY_ADMIN) {
        SecurityConfig storage config = securityConfigs[target];
        config.maxTransactionValue = maxValue;
        config.rateLimit = rateLimit;
        config.flashLoanThreshold = flashLoanThreshold;
        config.priceDeviationThreshold = priceDeviation;
        config.largeTransferThreshold = largeTransfer;
        config.monitoringEnabled = true;

        emit ConfigurationUpdated(target, "security_settings", block.timestamp);
    }

    /**
     * @dev Monitor a transaction
     */
    function monitorTransaction(
        address source,
        address target,
        uint256 value,
        bytes calldata data
    ) external whenNotPaused returns (bool) {
        SecurityConfig storage config = securityConfigs[target];
        require(config.monitoringEnabled, "Monitoring not enabled");

        // Check transaction value
        if (value > config.maxTransactionValue) {
            _raiseAlert(
                AlertType.LARGE_TRANSFER,
                ThreatLevel.MEDIUM,
                source,
                target,
                data
            );
        }

        // Check rate limiting
        if (block.timestamp - lastTransactionTime[source] < config.rateLimit) {
            _raiseAlert(
                AlertType.RATE_LIMIT_EXCEEDED,
                ThreatLevel.LOW,
                source,
                target,
                data
            );
        }

        // Check blacklist
        if (config.blacklistedAddresses[source] || config.blacklistedAddresses[target]) {
            _raiseAlert(
                AlertType.BLACKLISTED_ADDRESS,
                ThreatLevel.HIGH,
                source,
                target,
                data
            );
            return false;
        }

        // Update transaction metrics
        transactionCounts[source]++;
        lastTransactionTime[source] = block.timestamp;

        return true;
    }

    /**
     * @dev Report a vulnerability
     */
    function reportVulnerability(
        string calldata title,
        string calldata description,
        ThreatLevel severity
    ) external onlyRole(AUDITOR) returns (bytes32) {
        bytes32 vulnId = keccak256(abi.encodePacked(
            title,
            description,
            severity,
            block.timestamp
        ));

        VulnerabilityReport storage report = vulnerabilities[vulnId];
        report.vulnId = vulnId;
        report.title = title;
        report.description = description;
        report.severity = severity;
        report.reportedAt = block.timestamp;

        emit VulnerabilityReported(vulnId, title, severity);
        return vulnId;
    }

    /**
     * @dev Submit audit report
     */
    function submitAuditReport(
        string calldata reportUri,
        bytes32[] calldata vulnIds
    ) external onlyRole(AUDITOR) returns (bytes32) {
        bytes32 reportId = keccak256(abi.encodePacked(
            msg.sender,
            reportUri,
            block.timestamp
        ));

        AuditReport storage report = auditReports[reportId];
        report.reportId = reportId;
        report.auditor = msg.sender;
        report.timestamp = block.timestamp;
        report.reportUri = reportUri;

        for (uint i = 0; i < vulnIds.length; i++) {
            report.vulnerabilities[vulnIds[i]] = true;
        }

        emit AuditReportSubmitted(reportId, msg.sender, reportUri);
        return reportId;
    }

    /**
     * @dev Mark vulnerability as fixed
     */
    function markVulnerabilityFixed(
        bytes32 vulnId,
        string calldata fixDescription
    ) external onlyRole(SECURITY_ADMIN) {
        VulnerabilityReport storage report = vulnerabilities[vulnId];
        require(!report.isFixed, "Already fixed");

        report.isFixed = true;
        report.fixDescription = fixDescription;
        report.fixedAt = block.timestamp;

        emit VulnerabilityFixed(vulnId, fixDescription);
    }

    /**
     * @dev Blacklist an address
     */
    function blacklistAddress(
        address target,
        string calldata reason
    ) external onlyRole(SECURITY_ADMIN) {
        SecurityConfig storage config = securityConfigs[address(this)];
        config.blacklistedAddresses[target] = true;
        emit AddressBlacklisted(target, reason);
    }

    /**
     * @dev Set trusted contract
     */
    function setTrustedContract(
        address contract_,
        bool trusted
    ) external onlyRole(SECURITY_ADMIN) {
        SecurityConfig storage config = securityConfigs[address(this)];
        config.trustedContracts[contract_] = trusted;
        emit ContractTrusted(contract_, trusted);
    }

    /**
     * @dev Configure price feed for manipulation detection
     */
    function configurePriceFeed(
        address asset,
        address feed
    ) external onlyRole(SECURITY_ADMIN) {
        priceFeeds[asset] = AggregatorV3Interface(feed);
    }

    /**
     * @dev Check for price manipulation
     */
    function checkPriceManipulation(
        address asset,
        uint256 price
    ) external view returns (bool) {
        AggregatorV3Interface feed = priceFeeds[asset];
        require(address(feed) != address(0), "Price feed not configured");

        (, int256 answer, , uint256 updatedAt, ) = feed.latestRoundData();
        require(updatedAt >= block.timestamp - 1 hours, "Stale price");

        uint256 oraclePrice = uint256(answer);
        uint256 deviation = price > oraclePrice ?
            ((price - oraclePrice) * 100) / oraclePrice :
            ((oraclePrice - price) * 100) / oraclePrice;

        SecurityConfig storage config = securityConfigs[asset];
        return deviation <= config.priceDeviationThreshold;
    }

    /**
     * @dev Resolve an alert
     */
    function resolveAlert(
        bytes32 alertId,
        string calldata resolution
    ) external onlyRole(SECURITY_ADMIN) {
        SecurityAlert storage alert = alerts[alertId];
        require(!alert.isResolved, "Already resolved");

        alert.isResolved = true;
        alert.resolution = resolution;

        emit AlertResolved(alertId, resolution);
    }

    /**
     * @dev Internal function to raise an alert
     */
    function _raiseAlert(
        AlertType alertType,
        ThreatLevel threatLevel,
        address source,
        address target,
        bytes memory data
    ) internal returns (bytes32) {
        bytes32 alertId = keccak256(abi.encodePacked(
            alertType,
            threatLevel,
            source,
            target,
            block.timestamp
        ));

        SecurityAlert storage alert = alerts[alertId];
        alert.alertId = alertId;
        alert.alertType = alertType;
        alert.threatLevel = threatLevel;
        alert.source = source;
        alert.target = target;
        alert.timestamp = block.timestamp;
        alert.data = data;

        emit SecurityAlertRaised(alertId, alertType, threatLevel, source);
        return alertId;
    }

    /**
     * @dev Setea el procesador batch
     */
    function setBatchProcessor(address _processor) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_processor != address(0), "Invalid address");
        batchProcessor = AdvancedBatchProcessor(_processor);
        emit BatchProcessorSet(_processor);
    }
    /**
     * @dev Setea el cache distribuido
     */
    function setDistributedCache(address _cache) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_cache != address(0), "Invalid address");
        distributedCache = DistributedCacheV2(_cache);
        emit DistributedCacheSet(_cache);
    }
    /**
     * @dev Ejemplo: Batch de reportes de incidentes
     */
    function batchReportIncidents(bytes[] calldata incidentDatas) external returns (bool[] memory results) {
        require(address(batchProcessor) != address(0), "BatchProcessor not set");
        AdvancedBatchProcessor.Call[] memory calls = new AdvancedBatchProcessor.Call[](incidentDatas.length);
        for (uint256 i = 0; i < incidentDatas.length; i++) {
            calls[i] = AdvancedBatchProcessor.Call({
                target: address(this),
                value: 0,
                data: abi.encodeWithSignature("reportIncident(bytes)", incidentDatas[i])
            });
        }
        AdvancedBatchProcessor.CallResult[] memory callResults = batchProcessor.executeBatch(calls, false);
        results = new bool[](incidentDatas.length);
        for (uint256 i = 0; i < callResults.length; i++) {
            results[i] = callResults[i].success;
        }
    }
    /**
     * @dev Ejemplo: Guardar incidentes en cache distribuido
     */
    function cacheIncident(bytes32 key, bytes memory incident, uint256 expiresAt) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(address(distributedCache) != address(0), "Cache not set");
        distributedCache.set(key, incident, expiresAt);
    }

    /**
     * @dev Required by UUPS
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}
} 