// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "../core/BrainSafesArbitrum.sol";
import "../utils/SecurityManager.sol";


contract LaborDisputes is AccessControl, Pausable, ReentrancyGuard {
    // Roles
    bytes32 public constant ARBITRATOR_ROLE = keccak256("ARBITRATOR_ROLE");
    bytes32 public constant MEDIATOR_ROLE = keccak256("MEDIATOR_ROLE");

    // Estructuras
    struct Dispute {
        uint256 id;
        address initiator;
        address respondent;
        uint256 contractId;
        string description;
        string evidence;
        uint256 amount;
        uint256 createdAt;
        uint256 resolvedAt;
        address arbitrator;
        DisputeStatus status;
        Resolution resolution;
        string[] updates;
        address[] witnesses;
        mapping(address => bool) hasVoted;
        uint256 votesInFavor;
        uint256 votesAgainst;
    }

    struct Resolution {
        string decision;
        string rationale;
        uint256 compensation;
        address compensationTo;
        string[] conditions;
        uint256 deadline;
        bool accepted;
    }

    struct Evidence {
        string description;
        string ipfsHash;
        uint256 timestamp;
        address submitter;
        bool verified;
    }

    struct Appeal {
        uint256 disputeId;
        address appellant;
        string reason;
        uint256 timestamp;
        AppealStatus status;
    }

    struct ArbitratorStats {
        uint256 totalCases;
        uint256 resolvedCases;
        uint256 averageResolutionTime;
        uint256 successRate;
        bool isActive;
    }

    // Enums
    enum DisputeStatus { 
        Pending,
        UnderReview,
        Mediation,
        Resolved,
        Appealed,
        Closed
    }

    enum AppealStatus {
        Pending,
        Accepted,
        Rejected,
        Resolved
    }

    // Mappings
    mapping(uint256 => Dispute) public disputes;
    mapping(uint256 => Evidence[]) public disputeEvidence;
    mapping(uint256 => Appeal) public appeals;
    mapping(address => ArbitratorStats) public arbitratorStats;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(address => uint256[]) public userDisputes;

    // Contadores
    uint256 private disputeCounter;
    uint256 private appealCounter;

    // Referencias a otros contratos
    BrainSafesArbitrum public brainSafes;
    SecurityManager public securityManager;

    // Constantes
    uint256 public constant RESOLUTION_DEADLINE = 30 days;
    uint256 public constant MIN_VOTES_REQUIRED = 3;
    uint256 public constant APPEAL_WINDOW = 7 days;

    // Eventos
    event DisputeCreated(uint256 indexed disputeId, address indexed initiator, address indexed respondent);
    event EvidenceSubmitted(uint256 indexed disputeId, address indexed submitter, string ipfsHash);
    event DisputeStatusUpdated(uint256 indexed disputeId, DisputeStatus status);
    event ResolutionProposed(uint256 indexed disputeId, address indexed arbitrator);
    event ResolutionAccepted(uint256 indexed disputeId, uint256 compensation);
    event AppealFiled(uint256 indexed disputeId, address indexed appellant);
    event DisputeResolved(uint256 indexed disputeId, string decision);
    event ArbitratorAssigned(uint256 indexed disputeId, address indexed arbitrator);
    event VoteCast(uint256 indexed disputeId, address indexed voter, bool inFavor);

    
    constructor(address _brainSafes, address _securityManager) {
        require(_brainSafes != address(0), "Invalid BrainSafes address");
        require(_securityManager != address(0), "Invalid SecurityManager address");

        brainSafes = BrainSafesArbitrum(_brainSafes);
        securityManager = SecurityManager(_securityManager);

        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(ARBITRATOR_ROLE, msg.sender);
    }

    
    function createDispute(
        address respondent,
        uint256 contractId,
        string memory description,
        string memory evidence,
        uint256 amount
    ) external whenNotPaused nonReentrant {
        require(respondent != address(0), "Invalid respondent");
        require(respondent != msg.sender, "Cannot dispute with self");
        require(amount > 0, "Invalid amount");

        disputeCounter++;
        
        Dispute storage dispute = disputes[disputeCounter];
        dispute.id = disputeCounter;
        dispute.initiator = msg.sender;
        dispute.respondent = respondent;
        dispute.contractId = contractId;
        dispute.description = description;
        dispute.evidence = evidence;
        dispute.amount = amount;
        dispute.createdAt = block.timestamp;
        dispute.status = DisputeStatus.Pending;

        userDisputes[msg.sender].push(disputeCounter);
        userDisputes[respondent].push(disputeCounter);

        emit DisputeCreated(disputeCounter, msg.sender, respondent);
    }

    
    function assignArbitrator(
        uint256 disputeId,
        address arbitrator
    ) external onlyRole(DEFAULT_ADMIN_ROLE) whenNotPaused {
        require(hasRole(ARBITRATOR_ROLE, arbitrator), "Not an arbitrator");
        
        Dispute storage dispute = disputes[disputeId];
        require(dispute.status == DisputeStatus.Pending, "Invalid status");
        require(dispute.arbitrator == address(0), "Already assigned");

        dispute.arbitrator = arbitrator;
        dispute.status = DisputeStatus.UnderReview;

        ArbitratorStats storage stats = arbitratorStats[arbitrator];
        stats.totalCases++;

        emit ArbitratorAssigned(disputeId, arbitrator);
        emit DisputeStatusUpdated(disputeId, DisputeStatus.UnderReview);
    }

    
    function submitEvidence(
        uint256 disputeId,
        string memory description,
        string memory ipfsHash
    ) external whenNotPaused {
        Dispute storage dispute = disputes[disputeId];
        require(
            msg.sender == dispute.initiator || 
            msg.sender == dispute.respondent ||
            hasRole(ARBITRATOR_ROLE, msg.sender),
            "Not authorized"
        );
        require(dispute.status != DisputeStatus.Closed, "Dispute closed");

        Evidence memory evidence = Evidence({
            description: description,
            ipfsHash: ipfsHash,
            timestamp: block.timestamp,
            submitter: msg.sender,
            verified: false
        });

        disputeEvidence[disputeId].push(evidence);

        emit EvidenceSubmitted(disputeId, msg.sender, ipfsHash);
    }

    
    function proposeResolution(
        uint256 disputeId,
        string memory decision,
        string memory rationale,
        uint256 compensation,
        address compensationTo,
        string[] memory conditions
    ) external onlyRole(ARBITRATOR_ROLE) whenNotPaused {
        Dispute storage dispute = disputes[disputeId];
        require(msg.sender == dispute.arbitrator, "Not assigned arbitrator");
        require(dispute.status == DisputeStatus.UnderReview, "Invalid status");

        Resolution storage resolution = dispute.resolution;
        resolution.decision = decision;
        resolution.rationale = rationale;
        resolution.compensation = compensation;
        resolution.compensationTo = compensationTo;
        resolution.conditions = conditions;
        resolution.deadline = block.timestamp + RESOLUTION_DEADLINE;

        dispute.status = DisputeStatus.Mediation;

        emit ResolutionProposed(disputeId, msg.sender);
        emit DisputeStatusUpdated(disputeId, DisputeStatus.Mediation);
    }

    
    function acceptResolution(
        uint256 disputeId
    ) external whenNotPaused nonReentrant {
        Dispute storage dispute = disputes[disputeId];
        require(
            msg.sender == dispute.initiator || 
            msg.sender == dispute.respondent,
            "Not authorized"
        );
        require(dispute.status == DisputeStatus.Mediation, "Invalid status");
        require(!dispute.hasVoted[msg.sender], "Already voted");

        dispute.hasVoted[msg.sender] = true;
        dispute.votesInFavor++;

        // Si ambas partes aceptan
        if (dispute.votesInFavor == 2) {
            dispute.status = DisputeStatus.Resolved;
            dispute.resolvedAt = block.timestamp;
            dispute.resolution.accepted = true;

            // Actualizar estadísticas del árbitro
            ArbitratorStats storage stats = arbitratorStats[dispute.arbitrator];
            stats.resolvedCases++;
            stats.averageResolutionTime = (
                (stats.averageResolutionTime * (stats.resolvedCases - 1)) +
                (block.timestamp - dispute.createdAt)
            ) / stats.resolvedCases;
            stats.successRate = (stats.resolvedCases * 100) / stats.totalCases;

            emit ResolutionAccepted(disputeId, dispute.resolution.compensation);
            emit DisputeStatusUpdated(disputeId, DisputeStatus.Resolved);
        }
    }

    
    function fileAppeal(
        uint256 disputeId,
        string memory reason
    ) external whenNotPaused {
        Dispute storage dispute = disputes[disputeId];
        require(
            msg.sender == dispute.initiator || 
            msg.sender == dispute.respondent,
            "Not authorized"
        );
        require(dispute.status == DisputeStatus.Resolved, "Invalid status");
        require(
            block.timestamp <= dispute.resolvedAt + APPEAL_WINDOW,
            "Appeal window closed"
        );

        appealCounter++;
        appeals[appealCounter] = Appeal({
            disputeId: disputeId,
            appellant: msg.sender,
            reason: reason,
            timestamp: block.timestamp,
            status: AppealStatus.Pending
        });

        dispute.status = DisputeStatus.Appealed;

        emit AppealFiled(disputeId, msg.sender);
        emit DisputeStatusUpdated(disputeId, DisputeStatus.Appealed);
    }

    
    function voteOnDispute(
        uint256 disputeId,
        bool inFavor
    ) external onlyRole(MEDIATOR_ROLE) whenNotPaused {
        require(!hasVoted[disputeId][msg.sender], "Already voted");
        
        Dispute storage dispute = disputes[disputeId];
        require(dispute.status == DisputeStatus.Appealed, "Invalid status");

        hasVoted[disputeId][msg.sender] = true;
        if (inFavor) {
            dispute.votesInFavor++;
        } else {
            dispute.votesAgainst++;
        }

        emit VoteCast(disputeId, msg.sender, inFavor);

        // Finalizar votación si hay suficientes votos
        if (dispute.votesInFavor + dispute.votesAgainst >= MIN_VOTES_REQUIRED) {
            _finalizeVoting(disputeId);
        }
    }

    
    function _finalizeVoting(uint256 disputeId) internal {
        Dispute storage dispute = disputes[disputeId];
        
        if (dispute.votesInFavor > dispute.votesAgainst) {
            // Mantener resolución original
            dispute.status = DisputeStatus.Resolved;
        } else {
            // Revertir a mediación para nueva resolución
            dispute.status = DisputeStatus.Mediation;
            delete dispute.resolution;
        }

        emit DisputeStatusUpdated(disputeId, dispute.status);
    }

    
    function closeDispute(
        uint256 disputeId
    ) external onlyRole(ARBITRATOR_ROLE) whenNotPaused {
        Dispute storage dispute = disputes[disputeId];
        require(dispute.status == DisputeStatus.Resolved, "Not resolved");
        require(
            block.timestamp > dispute.resolvedAt + APPEAL_WINDOW,
            "Appeal window active"
        );

        dispute.status = DisputeStatus.Closed;
        emit DisputeStatusUpdated(disputeId, DisputeStatus.Closed);
    }

    
    function getDisputeDetails(uint256 disputeId) external view returns (
        address initiator,
        address respondent,
        uint256 contractId,
        string memory description,
        uint256 amount,
        uint256 createdAt,
        uint256 resolvedAt,
        address arbitrator,
        DisputeStatus status
    ) {
        Dispute storage dispute = disputes[disputeId];
        return (
            dispute.initiator,
            dispute.respondent,
            dispute.contractId,
            dispute.description,
            dispute.amount,
            dispute.createdAt,
            dispute.resolvedAt,
            dispute.arbitrator,
            dispute.status
        );
    }

    
    function getResolution(uint256 disputeId) external view returns (
        string memory decision,
        string memory rationale,
        uint256 compensation,
        address compensationTo,
        string[] memory conditions,
        uint256 deadline,
        bool accepted
    ) {
        Resolution storage resolution = disputes[disputeId].resolution;
        return (
            resolution.decision,
            resolution.rationale,
            resolution.compensation,
            resolution.compensationTo,
            resolution.conditions,
            resolution.deadline,
            resolution.accepted
        );
    }

    
    function getEvidence(uint256 disputeId) external view returns (Evidence[] memory) {
        return disputeEvidence[disputeId];
    }

    
    function getArbitratorStats(address arbitrator) external view returns (
        uint256 totalCases,
        uint256 resolvedCases,
        uint256 averageResolutionTime,
        uint256 successRate,
        bool isActive
    ) {
        ArbitratorStats storage stats = arbitratorStats[arbitrator];
        return (
            stats.totalCases,
            stats.resolvedCases,
            stats.averageResolutionTime,
            stats.successRate,
            stats.isActive
        );
    }

    
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
} 