// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./SecurityMonitor.sol";
import "./PenetrationTester.sol";
import "../optimizations/AdvancedBatchProcessor.sol";
import "../cache/DistributedCacheV2.sol";


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

    
    function setBatchProcessor(address _processor) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_processor != address(0), "Invalid address");
        batchProcessor = AdvancedBatchProcessor(_processor);
        emit BatchProcessorSet(_processor);
    }
    
    function setDistributedCache(address _cache) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_cache != address(0), "Invalid address");
        distributedCache = DistributedCacheV2(_cache);
        emit DistributedCacheSet(_cache);
    }
    
    function batchLogAudits(bytes[] calldata auditDatas) external returns (bool[] memory results) {
        require(address(batchProcessor) != address(0), "BatchProcessor not set");
        
        // Mock implementation - process audits individually
        results = new bool[](auditDatas.length);
        for (uint256 i = 0; i < auditDatas.length; i++) {
            results[i] = true; // Mock success
        }
    }
    
    function cacheAuditReport(bytes32 key, bytes memory report, uint256 expiresAt) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(address(distributedCache) != address(0), "Cache not set");
        distributedCache.setCache(key, report, expiresAt);
    }
} 