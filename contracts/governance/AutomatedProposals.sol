// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title AutomatedProposals
 * @dev Sistema de propuestas automáticas para BrainSafes Governance
 * @notice Genera, valida y ejecuta propuestas basadas en triggers, IA, métricas y eventos
 * @custom:security-contact security@brainsafes.com
 */
contract AutomatedProposals is AccessControl, Pausable, ReentrancyGuard {
    bytes32 public constant PROPOSAL_ADMIN = keccak256("PROPOSAL_ADMIN");
    bytes32 public constant PROPOSAL_BOT = keccak256("PROPOSAL_BOT");

    struct Proposal {
        uint256 id;
        address proposer;
        string description;
        bytes data;
        uint256 createdAt;
        bool executed;
        string trigger;
        uint256 confidence;
    }

    uint256 public proposalCount;
    mapping(uint256 => Proposal) public proposals;
    mapping(string => bool) public validTriggers;
    mapping(uint256 => bool) public executedProposals;

    event ProposalGenerated(uint256 indexed id, address indexed proposer, string trigger, uint256 confidence);
    event ProposalExecuted(uint256 indexed id, address indexed executor);
    event TriggerSet(string trigger, bool enabled);

    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(PROPOSAL_ADMIN, msg.sender);
    }

    function setTrigger(string memory trigger, bool enabled) external onlyRole(PROPOSAL_ADMIN) {
        validTriggers[trigger] = enabled;
        emit TriggerSet(trigger, enabled);
    }

    function generateProposal(string memory description, bytes memory data, string memory trigger, uint256 confidence) external whenNotPaused onlyRole(PROPOSAL_BOT) returns (uint256) {
        require(validTriggers[trigger], "Invalid trigger");
        require(confidence >= 50, "Low confidence");
        proposalCount++;
        proposals[proposalCount] = Proposal({
            id: proposalCount,
            proposer: msg.sender,
            description: description,
            data: data,
            createdAt: block.timestamp,
            executed: false,
            trigger: trigger,
            confidence: confidence
        });
        emit ProposalGenerated(proposalCount, msg.sender, trigger, confidence);
        return proposalCount;
    }

    function executeProposal(uint256 proposalId) external whenNotPaused onlyRole(PROPOSAL_ADMIN) {
        Proposal storage p = proposals[proposalId];
        require(!p.executed, "Already executed");
        // Aquí se ejecutaría la lógica de la propuesta (delegatecall, call, etc.)
        p.executed = true;
        executedProposals[proposalId] = true;
        emit ProposalExecuted(proposalId, msg.sender);
    }

    function getProposal(uint256 proposalId) external view returns (Proposal memory) {
        return proposals[proposalId];
    }

    function pause() external onlyRole(PROPOSAL_ADMIN) {
        _pause();
    }
    function unpause() external onlyRole(PROPOSAL_ADMIN) {
        _unpause();
    }
} 