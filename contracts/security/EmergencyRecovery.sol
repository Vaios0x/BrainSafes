// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./SecurityManager.sol";


contract EmergencyRecovery is AccessControl, Pausable, ReentrancyGuard {
    bytes32 public constant RECOVERY_ADMIN = keccak256("RECOVERY_ADMIN");
    bytes32 public constant RECOVERY_APPROVER = keccak256("RECOVERY_APPROVER");
    bytes32 public constant SECURITY_MANAGER = keccak256("SECURITY_MANAGER");

    SecurityManager public securityManager;
    uint256 public minApprovals;
    uint256 public recoveryDelay;
    uint256 public lastRecoveryTime;

    struct RecoveryProposal {
        uint256 id;
        address proposer;
        string reason;
        uint256 createdAt;
        uint256 approvals;
        bool executed;
        mapping(address => bool) approvedBy;
        string[] actions;
    }

    mapping(uint256 => RecoveryProposal) public proposals;
    uint256 public proposalCount;

    event RecoveryProposed(uint256 indexed proposalId, address indexed proposer, string reason);
    event RecoveryApproved(uint256 indexed proposalId, address indexed approver);
    event RecoveryExecuted(uint256 indexed proposalId, string[] actions);
    event FundsRecovered(address indexed token, address indexed to, uint256 amount);
    event StateRestored(string description);

    constructor(address _securityManager, uint256 _minApprovals, uint256 _recoveryDelay) {
        require(_securityManager != address(0), "Invalid SecurityManager");
        require(_minApprovals > 0, "Min approvals required");
        require(_recoveryDelay >= 1 hours, "Delay too short");
        
        securityManager = SecurityManager(_securityManager);
        minApprovals = _minApprovals;
        recoveryDelay = _recoveryDelay;
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(RECOVERY_ADMIN, msg.sender);
    }

    modifier onlySecurityIncident() {
        require(securityManager.paused(), "System not in emergency");
        _;
    }

    function proposeRecovery(string memory reason, string[] memory actions) external onlyRole(RECOVERY_ADMIN) onlySecurityIncident returns (uint256) {
        proposalCount++;
        RecoveryProposal storage proposal = proposals[proposalCount];
        proposal.id = proposalCount;
        proposal.proposer = msg.sender;
        proposal.reason = reason;
        proposal.createdAt = block.timestamp;
        proposal.actions = actions;
        proposal.approvals = 0;
        proposal.executed = false;
        emit RecoveryProposed(proposalCount, msg.sender, reason);
        return proposalCount;
    }

    function approveRecovery(uint256 proposalId) external onlyRole(RECOVERY_APPROVER) onlySecurityIncident {
        RecoveryProposal storage proposal = proposals[proposalId];
        require(!proposal.executed, "Already executed");
        require(!proposal.approvedBy[msg.sender], "Already approved");
        proposal.approvedBy[msg.sender] = true;
        proposal.approvals++;
        emit RecoveryApproved(proposalId, msg.sender);
    }

    function executeRecovery(uint256 proposalId) external onlyRole(RECOVERY_ADMIN) onlySecurityIncident nonReentrant {
        RecoveryProposal storage proposal = proposals[proposalId];
        require(!proposal.executed, "Already executed");
        require(proposal.approvals >= minApprovals, "Not enough approvals");
        require(block.timestamp >= proposal.createdAt + recoveryDelay, "Delay not met");
        proposal.executed = true;
        lastRecoveryTime = block.timestamp;
        // Aquí se ejecutarían las acciones de recuperación (ej: restaurar estados, transferir fondos, etc.)
        emit RecoveryExecuted(proposalId, proposal.actions);
    }

    function recoverFunds(address token, address to, uint256 amount) external onlyRole(RECOVERY_ADMIN) onlySecurityIncident nonReentrant {
        require(to != address(0), "Invalid recipient");
        if (token == address(0)) {
            // Recuperar ETH
            (bool sent, ) = to.call{value: amount}("");
            require(sent, "ETH transfer failed");
        } else {
            // Recuperar tokens ERC20
            IERC20(token).transfer(to, amount);
        }
        emit FundsRecovered(token, to, amount);
    }

    function restoreState(string memory description) external onlyRole(RECOVERY_ADMIN) onlySecurityIncident {
        // Aquí se puede implementar lógica para restaurar variables críticas
        emit StateRestored(description);
    }

    function setMinApprovals(uint256 _minApprovals) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_minApprovals > 0, "Min approvals required");
        minApprovals = _minApprovals;
    }

    function setRecoveryDelay(uint256 _recoveryDelay) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_recoveryDelay >= 1 hours, "Delay too short");
        recoveryDelay = _recoveryDelay;
    }
} 