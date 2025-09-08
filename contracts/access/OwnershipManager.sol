// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";


contract OwnershipManager is AccessControl, ReentrancyGuard {
    using EnumerableSet for EnumerableSet.AddressSet;

    bytes32 public constant OWNERSHIP_ADMIN_ROLE = keccak256("OWNERSHIP_ADMIN_ROLE");
    bytes32 public constant VALIDATOR_ROLE = keccak256("VALIDATOR_ROLE");
    bytes32 public constant PROPOSER_ROLE = keccak256("PROPOSER_ROLE");

    struct Proposal {
        uint256 id;
        address proposer;
        ProposalType proposalType;
        address target;
        bytes32 role;
        uint256 createdAt;
        uint256 expiresAt;
        uint256 approvals;
        uint256 rejections;
        bool executed;
        string description;
    }

    struct ValidatorInfo {
        address addr;
        uint256 stake;
        uint256 validationCount;
        uint256 successRate;
        bool isActive;
        uint256 lastActive;
    }

    enum ProposalType {
        GRANT_ROLE,
        REVOKE_ROLE,
        UPDATE_THRESHOLD,
        UPDATE_TIMELOCK,
        UPDATE_VALIDATOR_REQUIREMENTS
    }

    // Estado del contrato
    mapping(uint256 => Proposal) public proposals;
    mapping(address => ValidatorInfo) public validators;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(bytes32 => uint256) public roleThresholds;
    
    uint256 public proposalCount;
    uint256 public minValidatorStake;
    uint256 public proposalTimelock;
    uint256 public executionDelay;
    
    EnumerableSet.AddressSet private activeValidators;

    // Eventos
    event ProposalCreated(uint256 indexed proposalId, address indexed proposer, ProposalType proposalType);
    event ProposalVoted(uint256 indexed proposalId, address indexed validator, bool approved);
    event ProposalExecuted(uint256 indexed proposalId);
    event ValidatorAdded(address indexed validator, uint256 stake);
    event ValidatorRemoved(address indexed validator);
    event ThresholdUpdated(bytes32 indexed role, uint256 newThreshold);
    event TimelockUpdated(uint256 newTimelock, uint256 newDelay);

    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(OWNERSHIP_ADMIN_ROLE, msg.sender);

        // Configuración inicial
        minValidatorStake = 100 ether;
        proposalTimelock = 2 days;
        executionDelay = 1 days;

        // Umbrales por defecto
        roleThresholds[VALIDATOR_ROLE] = 75; // 75% de aprobación requerida
        roleThresholds[PROPOSER_ROLE] = 60;  // 60% de aprobación requerida
    }

    
    function createProposal(
        ProposalType proposalType,
        address target,
        bytes32 role,
        string calldata description
    ) external onlyRole(PROPOSER_ROLE) returns (uint256) {
        require(target != address(0) || proposalType == ProposalType.UPDATE_THRESHOLD, "Invalid target");
        
        proposalCount++;
        
        proposals[proposalCount] = Proposal({
            id: proposalCount,
            proposer: msg.sender,
            proposalType: proposalType,
            target: target,
            role: role,
            createdAt: block.timestamp,
            expiresAt: block.timestamp + proposalTimelock,
            approvals: 0,
            rejections: 0,
            executed: false,
            description: description
        });

        emit ProposalCreated(proposalCount, msg.sender, proposalType);
        return proposalCount;
    }

    
    function voteOnProposal(
        uint256 proposalId,
        bool approve
    ) external onlyRole(VALIDATOR_ROLE) {
        require(validators[msg.sender].isActive, "Not an active validator");
        require(!hasVoted[proposalId][msg.sender], "Already voted");
        
        Proposal storage proposal = proposals[proposalId];
        require(!proposal.executed, "Proposal already executed");
        require(block.timestamp < proposal.expiresAt, "Proposal expired");

        hasVoted[proposalId][msg.sender] = true;

        if (approve) {
            proposal.approvals++;
        } else {
            proposal.rejections++;
        }

        // Actualizar estadísticas del validador
        validators[msg.sender].validationCount++;
        validators[msg.sender].lastActive = block.timestamp;

        emit ProposalVoted(proposalId, msg.sender, approve);

        // Verificar si la propuesta puede ser ejecutada
        if (_canExecuteProposal(proposal)) {
            _scheduleExecution(proposalId);
        }
    }

    
    function executeProposal(uint256 proposalId) external nonReentrant {
        Proposal storage proposal = proposals[proposalId];
        require(!proposal.executed, "Already executed");
        require(_canExecuteProposal(proposal), "Cannot execute");
        require(
            block.timestamp >= proposal.createdAt + executionDelay,
            "Execution delay not met"
        );

        proposal.executed = true;

        // Ejecutar acción basada en tipo de propuesta
        if (proposal.proposalType == ProposalType.GRANT_ROLE) {
            _grantRole(proposal.role, proposal.target);
        } else if (proposal.proposalType == ProposalType.REVOKE_ROLE) {
            _revokeRole(proposal.role, proposal.target);
        } else if (proposal.proposalType == ProposalType.UPDATE_THRESHOLD) {
            roleThresholds[proposal.role] = uint256(uint160(proposal.target));
            emit ThresholdUpdated(proposal.role, uint256(uint160(proposal.target)));
        } else if (proposal.proposalType == ProposalType.UPDATE_TIMELOCK) {
            proposalTimelock = uint256(uint160(proposal.target));
            emit TimelockUpdated(proposalTimelock, executionDelay);
        }

        emit ProposalExecuted(proposalId);
    }

    
    function registerValidator() external payable {
        require(msg.value >= minValidatorStake, "Insufficient stake");
        require(!validators[msg.sender].isActive, "Already registered");

        validators[msg.sender] = ValidatorInfo({
            addr: msg.sender,
            stake: msg.value,
            validationCount: 0,
            successRate: 100,
            isActive: true,
            lastActive: block.timestamp
        });

        activeValidators.add(msg.sender);
        _grantRole(VALIDATOR_ROLE, msg.sender);

        emit ValidatorAdded(msg.sender, msg.value);
    }

    
    function removeValidator(address validator) external {
        require(
            msg.sender == validator || hasRole(OWNERSHIP_ADMIN_ROLE, msg.sender),
            "Not authorized"
        );
        require(validators[validator].isActive, "Not active");

        ValidatorInfo storage info = validators[validator];
        info.isActive = false;
        
        activeValidators.remove(validator);
        _revokeRole(VALIDATOR_ROLE, validator);

        // Devolver stake
        payable(validator).transfer(info.stake);

        emit ValidatorRemoved(validator);
    }

    
    function _canExecuteProposal(Proposal storage proposal) internal view returns (bool) {
        if (proposal.executed || block.timestamp >= proposal.expiresAt) {
            return false;
        }

        uint256 totalVotes = proposal.approvals + proposal.rejections;
        if (totalVotes == 0) return false;

        uint256 threshold = roleThresholds[proposal.role];
        return (proposal.approvals * 100) / totalVotes >= threshold;
    }

    
    function _scheduleExecution(uint256 proposalId) internal {
        // Implementar lógica de programación
        // Este es un placeholder - la implementación real dependería del contexto
    }

    
    function getActiveValidators() external view returns (address[] memory) {
        return activeValidators.values();
    }

    
    function getProposalInfo(
        uint256 proposalId
    ) external view returns (Proposal memory) {
        return proposals[proposalId];
    }

    
    function getValidatorInfo(
        address validator
    ) external view returns (ValidatorInfo memory) {
        return validators[validator];
    }

    
    function hasQuorum(uint256 proposalId) external view returns (bool) {
        Proposal storage proposal = proposals[proposalId];
        return _canExecuteProposal(proposal);
    }
} 