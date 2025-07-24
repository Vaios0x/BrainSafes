// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./SecurityMonitor.sol";
import "./PenetrationTester.sol";
import "./AdvancedBatchProcessor.sol";
import "./DistributedCacheV2.sol";

/**
 * @title AutoAuditSystem
 * @dev Sistema de auditoría automática y continua para BrainSafes
 * @notice Monitorea eventos críticos, patrones anómalos, upgrades y cambios de roles, generando reportes automáticos
 * @custom:security-contact security@brainsafes.com
 */
contract AutoAuditSystem is AccessControl, Pausable, ReentrancyGuard {
    bytes32 public constant AUDIT_ADMIN = keccak256("AUDIT_ADMIN");
    bytes32 public constant AUDIT_BOT = keccak256("AUDIT_BOT");
    bytes32 public constant SECURITY_MONITOR = keccak256("SECURITY_MONITOR");
    bytes32 public constant PENTESTER = keccak256("PENTESTER");

    SecurityMonitor public securityMonitor;
    PenetrationTester public penetrationTester;

    // Nuevos módulos de optimización
    AdvancedBatchProcessor public batchProcessor;
    DistributedCacheV2 public distributedCache;

    event BatchProcessorSet(address indexed processor);
    event DistributedCacheSet(address indexed cache);

    struct AuditEvent {
        uint256 id;
        string eventType;
        address source;
        string details;
        uint256 timestamp;
        bool isCritical;
    }

    struct AuditReport {
        uint256 id;
        string summary;
        string[] findings;
        uint256 createdAt;
        address auditor;
        bool isAutomated;
    }

    mapping(uint256 => AuditEvent) public auditEvents;
    mapping(uint256 => AuditReport) public auditReports;
    uint256 public eventCount;
    uint256 public reportCount;

    event AuditEventLogged(uint256 indexed eventId, string eventType, address indexed source, bool isCritical);
    event AuditReportGenerated(uint256 indexed reportId, string summary, address indexed auditor, bool isAutomated);

    constructor(address _securityMonitor, address _penetrationTester) {
        require(_securityMonitor != address(0), "Invalid SecurityMonitor");
        require(_penetrationTester != address(0), "Invalid PenetrationTester");
        securityMonitor = SecurityMonitor(_securityMonitor);
        penetrationTester = PenetrationTester(_penetrationTester);
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(AUDIT_ADMIN, msg.sender);
    }

    function logEvent(string memory eventType, address source, string memory details, bool isCritical) external onlyRole(AUDIT_BOT) {
        eventCount++;
        auditEvents[eventCount] = AuditEvent({
            id: eventCount,
            eventType: eventType,
            source: source,
            details: details,
            timestamp: block.timestamp,
            isCritical: isCritical
        });
        emit AuditEventLogged(eventCount, eventType, source, isCritical);
    }

    function generateReport(string memory summary, string[] memory findings, bool isAutomated) external onlyRole(AUDIT_BOT) {
        reportCount++;
        auditReports[reportCount] = AuditReport({
            id: reportCount,
            summary: summary,
            findings: findings,
            createdAt: block.timestamp,
            auditor: msg.sender,
            isAutomated: isAutomated
        });
        emit AuditReportGenerated(reportCount, summary, msg.sender, isAutomated);
    }

    function getEvents(uint256 from, uint256 to) external view returns (AuditEvent[] memory) {
        require(from > 0 && to >= from && to <= eventCount, "Invalid range");
        AuditEvent[] memory events = new AuditEvent[](to - from + 1);
        for (uint256 i = from; i <= to; i++) {
            events[i - from] = auditEvents[i];
        }
        return events;
    }

    function getReports(uint256 from, uint256 to) external view returns (AuditReport[] memory) {
        require(from > 0 && to >= from && to <= reportCount, "Invalid range");
        AuditReport[] memory reports = new AuditReport[](to - from + 1);
        for (uint256 i = from; i <= to; i++) {
            reports[i - from] = auditReports[i];
        }
        return reports;
    }

    function pause() external onlyRole(AUDIT_ADMIN) {
        _pause();
    }

    function unpause() external onlyRole(AUDIT_ADMIN) {
        _unpause();
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
     * @dev Ejemplo: Batch de logs de auditoría
     */
    function batchLogAudits(bytes[] calldata auditDatas) external returns (bool[] memory results) {
        require(address(batchProcessor) != address(0), "BatchProcessor not set");
        AdvancedBatchProcessor.Call[] memory calls = new AdvancedBatchProcessor.Call[](auditDatas.length);
        for (uint256 i = 0; i < auditDatas.length; i++) {
            calls[i] = AdvancedBatchProcessor.Call({
                target: address(this),
                value: 0,
                data: abi.encodeWithSignature("logAudit(bytes)", auditDatas[i])
            });
        }
        AdvancedBatchProcessor.CallResult[] memory callResults = batchProcessor.executeBatch(calls, false);
        results = new bool[](auditDatas.length);
        for (uint256 i = 0; i < callResults.length; i++) {
            results[i] = callResults[i].success;
        }
    }
    /**
     * @dev Ejemplo: Guardar reportes de auditoría en cache distribuido
     */
    function cacheAuditReport(bytes32 key, bytes memory report, uint256 expiresAt) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(address(distributedCache) != address(0), "Cache not set");
        distributedCache.set(key, report, expiresAt);
    }
} 