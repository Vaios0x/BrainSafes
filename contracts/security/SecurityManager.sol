// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@arbitrum/nitro-contracts/src/precompiles/ArbSys.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract SecurityManager is AccessControl, ReentrancyGuard, Pausable {
    ArbSys constant arbsys = ArbSys(address(0x64));
    
    bytes32 public constant SECURITY_ADMIN_ROLE = keccak256("SECURITY_ADMIN_ROLE");
    bytes32 public constant MONITOR_ROLE = keccak256("MONITOR_ROLE");
    
    struct SecurityConfig {
        uint256 maxGasPrice;
        uint256 maxTransactionSize;
        uint256 crossChainTimeout;
        uint256 recoveryDelay;
        uint256 minSecurityScore;
        bool requireAudit;
    }
    
    struct SecurityIncident {
        address target;
        string incidentType;
        uint256 severity;
        uint256 timestamp;
        string description;
        bool resolved;
        uint256 resolvedAt;
    }

    SecurityConfig public config;
    mapping(bytes32 => bool) public processedMessages;
    mapping(address => uint256) public securityScores;
    mapping(uint256 => SecurityIncident) public incidents;
    uint256 public incidentCount;
    uint256 public lastPauseTime;
    
    // Timeouts y delays
    uint256 public constant MIN_TIMEOUT = 1 hours;
    uint256 public constant MAX_TIMEOUT = 7 days;
    uint256 public constant MIN_DELAY = 5 minutes;
    
    event SecurityAlert(address indexed target, string alertType, uint256 severity);
    event SecurityConfigUpdated(address indexed admin, uint256 timestamp);
    event IncidentReported(uint256 indexed incidentId, address indexed target, string incidentType);
    event IncidentResolved(uint256 indexed incidentId, uint256 timestamp);
    
    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(SECURITY_ADMIN_ROLE, msg.sender);
        
        config = SecurityConfig({
            maxGasPrice: 1000 gwei,
            maxTransactionSize: 500000,
            crossChainTimeout: 1 days,
            recoveryDelay: 12 hours,
            minSecurityScore: 70,
            requireAudit: true
        });
    }
    
    modifier onlySecureGasPrice() {
        require(tx.gasprice <= config.maxGasPrice, "Gas price too high");
        _;
    }
    
    modifier onlySecureSize() {
        require(msg.data.length <= config.maxTransactionSize, "Transaction too large");
        _;
    }
    
    function verifyMessage(
        bytes32 messageHash,
        bytes memory signature,
        uint256 timestamp
    ) public view returns (bool) {
        require(timestamp + config.crossChainTimeout > block.timestamp, "Message expired");
        require(!processedMessages[messageHash], "Message already processed");
        
        // Aquí iría la verificación de firma
        return true;
    }
    
    function updateSecurityConfig(SecurityConfig memory newConfig) external onlyRole(SECURITY_ADMIN_ROLE) {
        require(newConfig.crossChainTimeout >= MIN_TIMEOUT, "Timeout too short");
        require(newConfig.crossChainTimeout <= MAX_TIMEOUT, "Timeout too long");
        require(newConfig.recoveryDelay >= MIN_DELAY, "Delay too short");
        
        config = newConfig;
        emit SecurityConfigUpdated(msg.sender, block.timestamp);
    }
    
    function reportSecurityIncident(
        address target,
        string memory incidentType,
        uint256 severity,
        string memory description
    ) external onlyRole(MONITOR_ROLE) {
        require(severity <= 100, "Invalid severity");
        
        incidentCount++;
        incidents[incidentCount] = SecurityIncident({
            target: target,
            incidentType: incidentType,
            severity: severity,
            timestamp: block.timestamp,
            description: description,
            resolved: false,
            resolvedAt: 0
        });
        
        if (severity >= 80) {
            _pause();
            lastPauseTime = block.timestamp;
        }
        
        emit IncidentReported(incidentCount, target, incidentType);
        emit SecurityAlert(target, incidentType, severity);
    }
    
    function resolveIncident(uint256 incidentId) external onlyRole(SECURITY_ADMIN_ROLE) {
        require(incidentId <= incidentCount, "Invalid incident ID");
        require(!incidents[incidentId].resolved, "Incident already resolved");
        
        SecurityIncident storage incident = incidents[incidentId];
        incident.resolved = true;
        incident.resolvedAt = block.timestamp;
        
        emit IncidentResolved(incidentId, block.timestamp);
    }
    
    function updateSecurityScore(address target, uint256 score) external onlyRole(SECURITY_ADMIN_ROLE) {
        require(score <= 100, "Invalid score");
        securityScores[target] = score;
    }
    
    function isSecure(address target) public view returns (bool) {
        return securityScores[target] >= config.minSecurityScore;
    }
    
    function getIncidentDetails(uint256 incidentId) external view returns (SecurityIncident memory) {
        require(incidentId <= incidentCount, "Invalid incident ID");
        return incidents[incidentId];
    }
    
    function getActiveIncidents() external view returns (uint256[] memory) {
        uint256[] memory activeIncidents = new uint256[](incidentCount);
        uint256 count = 0;
        
        for (uint256 i = 1; i <= incidentCount; i++) {
            if (!incidents[i].resolved) {
                activeIncidents[count] = i;
                count++;
            }
        }
        
        // Resize array
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = activeIncidents[i];
        }
        
        return result;
    }
    
    function emergencyShutdown() external onlyRole(SECURITY_ADMIN_ROLE) {
        _pause();
        lastPauseTime = block.timestamp;
        emit SecurityAlert(address(0), "EMERGENCY_SHUTDOWN", 100);
    }
    
    function resumeOperations() external onlyRole(SECURITY_ADMIN_ROLE) {
        require(block.timestamp >= lastPauseTime + config.recoveryDelay, "Recovery delay not met");
        _unpause();
    }
} 