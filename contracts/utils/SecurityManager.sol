// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;


import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract SecurityManager is AccessControl, ReentrancyGuard, Pausable {
    // ========== CONSTANTS ==========
    bytes32 public constant SECURITY_ADMIN_ROLE = keccak256("SECURITY_ADMIN_ROLE");
    bytes32 public constant THREAT_DETECTOR_ROLE = keccak256("THREAT_DETECTOR_ROLE");
    bytes32 public constant EMERGENCY_RESPONDER_ROLE = keccak256("EMERGENCY_RESPONDER_ROLE");
    
    uint256 public constant MAX_WHITELIST_SIZE = 10000;
    uint256 public constant MAX_BLACKLIST_SIZE = 10000;
    uint256 public constant THREAT_THRESHOLD = 5;
    uint256 public constant COOLDOWN_PERIOD = 3600; // 1 hour

    // ========== STATE VARIABLES ==========
    mapping(address => bool) public whitelist;
    mapping(address => bool) public blacklist;
    mapping(address => bool) public secureContracts;
    mapping(address => uint256) public threatLevel;
    mapping(address => uint256) public lastActivity;
    mapping(address => uint256) public violationCount;
    mapping(bytes32 => bool) public securityEvents;
    
    uint256 public totalWhitelisted;
    uint256 public totalBlacklisted;
    uint256 public totalSecureContracts;
    uint256 public totalThreatsDetected;
    uint256 public lastSecurityAudit;
    uint256 public emergencyLevel; // 0-5, where 5 is critical

    // ========== STRUCTURES ==========
    struct SecurityEvent {
        bytes32 eventId;
        address target;
        string eventType;
        uint256 timestamp;
        uint256 threatLevel;
        string description;
        bool resolved;
    }

    struct ThreatAssessment {
        address target;
        uint256 threatLevel;
        uint256 violationCount;
        uint256 lastActivity;
        bool isBlacklisted;
        bool isWhitelisted;
        string riskCategory;
    }

    struct SecurityStats {
        uint256 totalWhitelisted;
        uint256 totalBlacklisted;
        uint256 totalSecureContracts;
        uint256 totalThreatsDetected;
        uint256 emergencyLevel;
        uint256 lastAudit;
    }

    // ========== EVENTS ==========
    event AddressWhitelisted(address indexed account, address indexed admin, uint256 timestamp);
    event AddressBlacklisted(address indexed account, address indexed admin, string reason, uint256 timestamp);
    event RemovedFromWhitelist(address indexed account, address indexed admin);
    event RemovedFromBlacklist(address indexed account, address indexed admin);
    event SecureContractAdded(address indexed contractAddress, address indexed admin);
    event SecureContractRemoved(address indexed contractAddress, address indexed admin);
    event ThreatDetected(address indexed target, uint256 threatLevel, string description);
    event SecurityEventCreated(bytes32 indexed eventId, address indexed target, string eventType);
    event EmergencyLevelChanged(uint256 oldLevel, uint256 newLevel, string reason);
    event SecurityAuditCompleted(uint256 timestamp, uint256 findings);
    event EmergencyPaused(address indexed admin, string reason);
    event EmergencyUnpaused(address indexed admin);

    // ========== CONSTRUCTOR ==========
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(SECURITY_ADMIN_ROLE, msg.sender);
        _grantRole(THREAT_DETECTOR_ROLE, msg.sender);
        _grantRole(EMERGENCY_RESPONDER_ROLE, msg.sender);
        
        // Initialize emergency level
        emergencyLevel = 0;
    }

    // ========== CORE SECURITY FUNCTIONS ==========
    
    function addToWhitelist(address account) external onlyRole(SECURITY_ADMIN_ROLE) {
        require(account != address(0), "Invalid address");
        require(!whitelist[account], "Already whitelisted");
        require(totalWhitelisted < MAX_WHITELIST_SIZE, "Whitelist full");
        
        whitelist[account] = true;
        totalWhitelisted++;
        lastActivity[account] = block.timestamp;
        
        emit AddressWhitelisted(account, msg.sender, block.timestamp);
    }

    
    function removeFromWhitelist(address account) external onlyRole(SECURITY_ADMIN_ROLE) {
        require(whitelist[account], "Not whitelisted");
        
        whitelist[account] = false;
        totalWhitelisted--;
        
        emit RemovedFromWhitelist(account, msg.sender);
    }

    
    function addToBlacklist(
        address account,
        string calldata reason
    ) external onlyRole(SECURITY_ADMIN_ROLE) {
        require(account != address(0), "Invalid address");
        require(!blacklist[account], "Already blacklisted");
        require(totalBlacklisted < MAX_BLACKLIST_SIZE, "Blacklist full");
        
        blacklist[account] = true;
        totalBlacklisted++;
        threatLevel[account] = 5; // Maximum threat level
        lastActivity[account] = block.timestamp;
        
        emit AddressBlacklisted(account, msg.sender, reason, block.timestamp);
        _createSecurityEvent(account, "BLACKLISTED", 5, reason);
    }

    
    function _internalAddToBlacklist(
        address account,
        string memory reason
    ) internal {
        require(account != address(0), "Invalid address");
        require(!blacklist[account], "Already blacklisted");
        require(totalBlacklisted < MAX_BLACKLIST_SIZE, "Blacklist full");
        
        blacklist[account] = true;
        totalBlacklisted++;
        threatLevel[account] = 5; // Maximum threat level
        lastActivity[account] = block.timestamp;
        
        emit AddressBlacklisted(account, msg.sender, reason, block.timestamp);
        _createSecurityEvent(account, "BLACKLISTED", 5, reason);
    }

    
    function removeFromBlacklist(address account) external onlyRole(SECURITY_ADMIN_ROLE) {
        require(blacklist[account], "Not blacklisted");
        
        blacklist[account] = false;
        totalBlacklisted--;
        threatLevel[account] = 0; // Reset threat level
        
        emit RemovedFromBlacklist(account, msg.sender);
    }

    
    function addSecureContract(address contractAddr) external onlyRole(SECURITY_ADMIN_ROLE) {
        require(contractAddr != address(0), "Invalid address");
        require(!secureContracts[contractAddr], "Already secure");
        
        secureContracts[contractAddr] = true;
        totalSecureContracts++;
        
        emit SecureContractAdded(contractAddr, msg.sender);
    }

    
    function removeSecureContract(address contractAddr) external onlyRole(SECURITY_ADMIN_ROLE) {
        require(secureContracts[contractAddr], "Not secure");
        
        secureContracts[contractAddr] = false;
        totalSecureContracts--;
        
        emit SecureContractRemoved(contractAddr, msg.sender);
    }

    // ========== THREAT DETECTION FUNCTIONS ==========
    
    function isSecure(address account) public view returns (bool isSecureResult) {
        return !blacklist[account] && threatLevel[account] < THREAT_THRESHOLD;
    }

    
    function isContractSecure(address contractAddr) public view returns (bool isSecureResult) {
        return secureContracts[contractAddr] && !blacklist[contractAddr];
    }

    
    function reportThreat(
        address target,
        uint256 newThreatLevel,
        string calldata description
    ) external onlyRole(THREAT_DETECTOR_ROLE) {
        require(target != address(0), "Invalid target");
        require(newThreatLevel >= 1 && newThreatLevel <= 5, "Invalid threat level");
        
        // Update threat level
        if (newThreatLevel > threatLevel[target]) {
            threatLevel[target] = newThreatLevel;
        }
        
        violationCount[target]++;
        lastActivity[target] = block.timestamp;
        totalThreatsDetected++;
        
        // Auto-blacklist if threat level is maximum and caller has admin role
        if (newThreatLevel == 5 && !blacklist[target] && hasRole(SECURITY_ADMIN_ROLE, msg.sender)) {
            _internalAddToBlacklist(target, "Auto-blacklisted due to maximum threat level");
        }
        
        emit ThreatDetected(target, newThreatLevel, description);
        _createSecurityEvent(target, "THREAT_DETECTED", newThreatLevel, description);
        
        // Update emergency level if needed
        _updateEmergencyLevel();
    }

    
    function getThreatAssessment(
        address target
    ) external view returns (ThreatAssessment memory assessment) {
        assessment.target = target;
        assessment.threatLevel = threatLevel[target];
        assessment.violationCount = violationCount[target];
        assessment.lastActivity = lastActivity[target];
        assessment.isBlacklisted = blacklist[target];
        assessment.isWhitelisted = whitelist[target];
        assessment.riskCategory = _getRiskCategory(threatLevel[target]);
    }

    // ========== EMERGENCY FUNCTIONS ==========
    
    function emergencyPause(string calldata reason) external onlyRole(EMERGENCY_RESPONDER_ROLE) {
        _pause();
        emergencyLevel = 5; // Set to maximum
        
        emit EmergencyPaused(msg.sender, reason);
        emit EmergencyLevelChanged(emergencyLevel, 5, reason);
    }

    
    function emergencyUnpause() external onlyRole(EMERGENCY_RESPONDER_ROLE) {
        _unpause();
        emergencyLevel = 0; // Reset emergency level
        
        emit EmergencyUnpaused(msg.sender);
        emit EmergencyLevelChanged(emergencyLevel, 0, "Emergency resolved");
    }

    
    function setEmergencyLevel(
        uint256 level,
        string calldata reason
    ) external onlyRole(EMERGENCY_RESPONDER_ROLE) {
        require(level <= 5, "Invalid emergency level");
        
        uint256 oldLevel = emergencyLevel;
        emergencyLevel = level;
        
        emit EmergencyLevelChanged(oldLevel, level, reason);
    }

    // ========== SECURITY AUDIT FUNCTIONS ==========
    
    function performSecurityAudit() external onlyRole(SECURITY_ADMIN_ROLE) returns (uint256 findings) {
        findings = 0;
        
        // Check for high threat levels
        // This is a simplified audit - in production, you'd implement more comprehensive checks
        
        lastSecurityAudit = block.timestamp;
        
        emit SecurityAuditCompleted(block.timestamp, findings);
        return findings;
    }

    
    function createSecurityEvent(
        address target,
        string calldata eventType,
        uint256 severity,
        string calldata description
    ) external onlyRole(THREAT_DETECTOR_ROLE) {
        _createSecurityEvent(target, eventType, severity, description);
    }

    // ========== BATCH OPERATIONS ==========
    
    function batchAddToWhitelist(
        address[] calldata accounts
    ) external onlyRole(SECURITY_ADMIN_ROLE) {
        require(accounts.length <= 100, "Batch too large");
        require(totalWhitelisted + accounts.length <= MAX_WHITELIST_SIZE, "Would exceed whitelist size");
        
        for (uint256 i = 0; i < accounts.length; i++) {
            address account = accounts[i];
            if (!whitelist[account]) {
                whitelist[account] = true;
                totalWhitelisted++;
                lastActivity[account] = block.timestamp;
                
                emit AddressWhitelisted(account, msg.sender, block.timestamp);
            }
        }
    }

    
    function batchAddToBlacklist(
        address[] calldata accounts,
        string[] calldata reasons
    ) external onlyRole(SECURITY_ADMIN_ROLE) {
        require(accounts.length == reasons.length, "Array length mismatch");
        require(accounts.length <= 100, "Batch too large");
        require(totalBlacklisted + accounts.length <= MAX_BLACKLIST_SIZE, "Would exceed blacklist size");
        
        for (uint256 i = 0; i < accounts.length; i++) {
            address account = accounts[i];
            if (!blacklist[account]) {
                blacklist[account] = true;
                totalBlacklisted++;
                threatLevel[account] = 5;
                lastActivity[account] = block.timestamp;
                
                emit AddressBlacklisted(account, msg.sender, reasons[i], block.timestamp);
                _createSecurityEvent(account, "BLACKLISTED", 5, reasons[i]);
            }
        }
    }

    // ========== UTILITY FUNCTIONS ==========
    
    function isWhitelisted(address account) external view returns (bool whitelisted) {
        return whitelist[account];
    }

    
    function isBlacklisted(address account) external view returns (bool blacklisted) {
        return blacklist[account];
    }

    
    function getSecurityStats() external view returns (SecurityStats memory stats) {
        stats.totalWhitelisted = totalWhitelisted;
        stats.totalBlacklisted = totalBlacklisted;
        stats.totalSecureContracts = totalSecureContracts;
        stats.totalThreatsDetected = totalThreatsDetected;
        stats.emergencyLevel = emergencyLevel;
        stats.lastAudit = lastSecurityAudit;
    }

    
    function getEmergencyLevel() external view returns (uint256 level) {
        return emergencyLevel;
    }

    
    function isSecurityEvent(bytes32 eventId) external view returns (bool exists) {
        return securityEvents[eventId];
    }

    // ========== INTERNAL FUNCTIONS ==========
    
    function _createSecurityEvent(
        address target,
        string memory eventType,
        uint256 severity,
        string memory description
    ) internal {
        bytes32 eventId = keccak256(abi.encodePacked(target, eventType, block.timestamp, description));
        
        if (!securityEvents[eventId]) {
            securityEvents[eventId] = true;
            
            emit SecurityEventCreated(eventId, target, eventType);
        }
    }

    
    function _updateEmergencyLevel() internal {
        uint256 newLevel = 0;
        
        // Calculate new emergency level based on threats
        if (totalThreatsDetected > 100) {
            newLevel = 5;
        } else if (totalThreatsDetected > 50) {
            newLevel = 4;
        } else if (totalThreatsDetected > 20) {
            newLevel = 3;
        } else if (totalThreatsDetected > 10) {
            newLevel = 2;
        } else if (totalThreatsDetected > 0) {
            newLevel = 1;
        }
        
        if (newLevel != emergencyLevel) {
            uint256 oldLevel = emergencyLevel;
            emergencyLevel = newLevel;
            
            emit EmergencyLevelChanged(oldLevel, newLevel, "Automatic update based on threats");
        }
    }

    
    function _getRiskCategory(
        uint256 threatLevelValue
    ) internal pure returns (string memory riskCategory) {
        if (threatLevelValue == 0) return "LOW";
        if (threatLevelValue == 1) return "LOW";
        if (threatLevelValue == 2) return "MEDIUM";
        if (threatLevelValue == 3) return "HIGH";
        if (threatLevelValue == 4) return "CRITICAL";
        if (threatLevelValue == 5) return "EXTREME";
        return "UNKNOWN";
    }

    // ========== ADMIN FUNCTIONS ==========
    
    function grantSecurityAdminRole(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(SECURITY_ADMIN_ROLE, account);
    }

    
    function grantThreatDetectorRole(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(THREAT_DETECTOR_ROLE, account);
    }

    
    function grantEmergencyResponderRole(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(EMERGENCY_RESPONDER_ROLE, account);
    }

    // ========== VIEW FUNCTIONS ==========
    
    function version() external pure returns (string memory) {
        return "2.0.0";
    }

    
    function getContractStats() external view returns (
        uint256 whitelistedCount,
        uint256 blacklistedCount,
        uint256 threatsCount,
        uint256 currentEmergencyLevel
    ) {
        return (totalWhitelisted, totalBlacklisted, totalThreatsDetected, emergencyLevel);
    }
} 