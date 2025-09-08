// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "../governance/DelegationManager.sol";
import "../governance/AutomatedProposals.sol";


contract BrainSafesGovernance is AccessControl, ReentrancyGuard, Pausable {
    using Counters for Counters.Counter;
    using SafeMath for uint256;

    // Roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant SECURITY_COUNCIL_ROLE = keccak256("SECURITY_COUNCIL_ROLE");
    bytes32 public constant DELEGATE_ROLE = keccak256("DELEGATE_ROLE");

    // Estructuras
    struct Proposal {
        uint256 id;
        address proposer;
        string title;
        string description;
        bytes callData;
        address target;
        uint256 startTime;
        uint256 endTime;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        bool executed;
        bool canceled;
        bool emergency;
        ProposalStatus status;
        mapping(address => Vote) votes;
        uint256 requiredQuorum;
        uint256 minimumDelay;
    }

    struct Vote {
        bool hasVoted;
        VoteType voteType;
        uint256 votingPower;
        string reason;
    }

    struct Delegate {
        address delegateAddress;
        string name;
        string description;
        string profileIpfs;
        uint256 totalDelegatedPower;
        uint256 ownVotingPower;
        uint256 proposalsParticipated;
        uint256 reputationScore;
        bool isActive;
    }

    struct SecurityCouncilMember {
        address member;
        uint256 startTime;
        uint256 endTime;
        uint256 votingPower;
        bool isActive;
    }

    struct DelegationInfo {
        address delegate;
        uint256 amount;
        uint256 timestamp;
    }

    // Enums
    enum ProposalStatus {
        PENDING,
        ACTIVE,
        CANCELED,
        DEFEATED,
        SUCCEEDED,
        QUEUED,
        EXECUTED,
        EXPIRED
    }

    enum VoteType {
        AGAINST,
        FOR,
        ABSTAIN
    }

    // Contadores
    Counters.Counter private _proposalIdCounter;
    
    // Configuración
    uint256 public constant VOTING_DELAY = 1 days;
    uint256 public constant VOTING_PERIOD = 7 days;
    uint256 public constant EXECUTION_DELAY = 2 days;
    uint256 public constant EMERGENCY_VOTING_PERIOD = 1 days;
    uint256 public constant MINIMUM_QUORUM = 4_000_000 * 10**18; // 4M tokens
    uint256 public constant PROPOSAL_THRESHOLD = 100_000 * 10**18; // 100k tokens
    uint256 public constant SECURITY_COUNCIL_SIZE = 12;
    uint256 public constant SECURITY_COUNCIL_TERM = 180 days;
    uint256 public constant SECURITY_COUNCIL_QUORUM = 7; // 7 de 12 miembros

    // Mappings
    mapping(uint256 => Proposal) public proposals;
    mapping(address => Delegate) public delegates;
    mapping(address => DelegationInfo) public delegations;
    mapping(address => SecurityCouncilMember) public securityCouncil;
    mapping(address => uint256) public votingPower;
    mapping(address => uint256[]) public userProposals;
    mapping(address => uint256[]) public userVotes;

    // Estado del sistema
    uint256 public totalVotingPower;
    uint256 public activeProposalsCount;
    address[] public securityCouncilMembers;
    bool public emergencyMode;

    // Módulos de gobernanza avanzada
    DelegationManager public delegationManager;
    AutomatedProposals public automatedProposals;

    event DelegationManagerSet(address indexed manager);
    event AutomatedProposalsSet(address indexed proposals);

    // Eventos
    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        string title,
        bool emergency
    );

    event ProposalCanceled(uint256 indexed proposalId);
    event ProposalExecuted(uint256 indexed proposalId);
    event ProposalQueued(uint256 indexed proposalId);
    
    event VoteCast(
        address indexed voter,
        uint256 indexed proposalId,
        VoteType voteType,
        uint256 votingPower,
        string reason
    );

    event DelegateRegistered(address indexed delegate, string name);
    event DelegationUpdated(
        address indexed delegator,
        address indexed delegate,
        uint256 amount
    );

    event SecurityCouncilMemberAdded(
        address indexed member,
        uint256 startTime,
        uint256 endTime
    );

    event SecurityCouncilMemberRemoved(address indexed member);
    event EmergencyModeActivated(string reason);
    event EmergencyModeDeactivated();

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    
    function createProposal(
        string memory title,
        string memory description,
        bytes memory callData,
        address target,
        bool emergency
    ) external returns (uint256) {
        require(
            votingPower[msg.sender] >= PROPOSAL_THRESHOLD,
            "Insufficient voting power"
        );

        if (emergency) {
            require(
                hasRole(SECURITY_COUNCIL_ROLE, msg.sender),
                "Only security council"
            );
        }

        _proposalIdCounter.increment();
        uint256 proposalId = _proposalIdCounter.current();

        Proposal storage proposal = proposals[proposalId];
        proposal.id = proposalId;
        proposal.proposer = msg.sender;
        proposal.title = title;
        proposal.description = description;
        proposal.callData = callData;
        proposal.target = target;
        proposal.startTime = block.timestamp + (emergency ? 0 : VOTING_DELAY);
        proposal.endTime = proposal.startTime + (emergency ? EMERGENCY_VOTING_PERIOD : VOTING_PERIOD);
        proposal.emergency = emergency;
        proposal.status = ProposalStatus.PENDING;
        proposal.requiredQuorum = MINIMUM_QUORUM;
        proposal.minimumDelay = emergency ? 0 : EXECUTION_DELAY;

        userProposals[msg.sender].push(proposalId);
        activeProposalsCount++;

        emit ProposalCreated(proposalId, msg.sender, title, emergency);
        return proposalId;
    }

    
    function castVote(
        uint256 proposalId,
        VoteType voteType,
        string memory reason
    ) external {
        require(votingPower[msg.sender] > 0, "No voting power");
        
        Proposal storage proposal = proposals[proposalId];
        require(
            proposal.status == ProposalStatus.ACTIVE,
            "Proposal not active"
        );
        require(
            block.timestamp >= proposal.startTime &&
            block.timestamp <= proposal.endTime,
            "Voting period not active"
        );
        require(
            !proposal.votes[msg.sender].hasVoted,
            "Already voted"
        );

        uint256 power = votingPower[msg.sender];
        
        if (voteType == VoteType.FOR) {
            proposal.forVotes = proposal.forVotes.add(power);
        } else if (voteType == VoteType.AGAINST) {
            proposal.againstVotes = proposal.againstVotes.add(power);
        } else {
            proposal.abstainVotes = proposal.abstainVotes.add(power);
        }

        proposal.votes[msg.sender] = Vote({
            hasVoted: true,
            voteType: voteType,
            votingPower: power,
            reason: reason
        });

        userVotes[msg.sender].push(proposalId);

        // Actualizar estado del delegado si aplica
        if (hasRole(DELEGATE_ROLE, msg.sender)) {
            delegates[msg.sender].proposalsParticipated++;
        }

        emit VoteCast(msg.sender, proposalId, voteType, power, reason);
    }

    
    function registerAsDelegate(
        string memory name,
        string memory description,
        string memory profileIpfs
    ) external {
        require(!delegates[msg.sender].isActive, "Already registered");
        require(bytes(name).length > 0, "Name required");

        delegates[msg.sender] = Delegate({
            delegateAddress: msg.sender,
            name: name,
            description: description,
            profileIpfs: profileIpfs,
            totalDelegatedPower: 0,
            ownVotingPower: votingPower[msg.sender],
            proposalsParticipated: 0,
            reputationScore: 100,
            isActive: true
        });

        _grantRole(DELEGATE_ROLE, msg.sender);
        emit DelegateRegistered(msg.sender, name);
    }

    
    function delegate(address to, uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        require(
            votingPower[msg.sender] >= amount,
            "Insufficient voting power"
        );
        require(
            delegates[to].isActive || hasRole(SECURITY_COUNCIL_ROLE, to),
            "Invalid delegate"
        );

        // Remover delegación anterior si existe
        if (delegations[msg.sender].delegate != address(0)) {
            address currentDelegate = delegations[msg.sender].delegate;
            delegates[currentDelegate].totalDelegatedPower = delegates[currentDelegate]
                .totalDelegatedPower
                .sub(delegations[msg.sender].amount);
            votingPower[currentDelegate] = votingPower[currentDelegate]
                .sub(delegations[msg.sender].amount);
        }

        // Actualizar delegación
        delegations[msg.sender] = DelegationInfo({
            delegate: to,
            amount: amount,
            timestamp: block.timestamp
        });

        // Actualizar poder de voto
        votingPower[msg.sender] = votingPower[msg.sender].sub(amount);
        votingPower[to] = votingPower[to].add(amount);

        // Actualizar estadísticas del delegado
        if (delegates[to].isActive) {
            delegates[to].totalDelegatedPower = delegates[to]
                .totalDelegatedPower
                .add(amount);
        }

        emit DelegationUpdated(msg.sender, to, amount);
    }

    
    function addSecurityCouncilMember(address member) external onlyRole(ADMIN_ROLE) {
        require(
            securityCouncilMembers.length < SECURITY_COUNCIL_SIZE,
            "Council full"
        );
        require(
            !securityCouncil[member].isActive,
            "Already a member"
        );

        securityCouncil[member] = SecurityCouncilMember({
            member: member,
            startTime: block.timestamp,
            endTime: block.timestamp + SECURITY_COUNCIL_TERM,
            votingPower: 0,
            isActive: true
        });

        securityCouncilMembers.push(member);
        _grantRole(SECURITY_COUNCIL_ROLE, member);

        emit SecurityCouncilMemberAdded(
            member,
            block.timestamp,
            block.timestamp + SECURITY_COUNCIL_TERM
        );
    }

    
    function removeSecurityCouncilMember(address member) external onlyRole(ADMIN_ROLE) {
        require(
            securityCouncil[member].isActive,
            "Not a member"
        );

        securityCouncil[member].isActive = false;
        _revokeRole(SECURITY_COUNCIL_ROLE, member);

        // Remover de la lista
        for (uint256 i = 0; i < securityCouncilMembers.length; i++) {
            if (securityCouncilMembers[i] == member) {
                securityCouncilMembers[i] = securityCouncilMembers[securityCouncilMembers.length - 1];
                securityCouncilMembers.pop();
                break;
            }
        }

        emit SecurityCouncilMemberRemoved(member);
    }

    
    function activateEmergencyMode(string memory reason) external onlyRole(SECURITY_COUNCIL_ROLE) {
        require(!emergencyMode, "Already in emergency mode");
        
        uint256 supportCount = 0;
        for (uint256 i = 0; i < securityCouncilMembers.length; i++) {
            if (securityCouncil[securityCouncilMembers[i]].isActive) {
                supportCount++;
            }
        }

        require(
            supportCount >= SECURITY_COUNCIL_QUORUM,
            "Insufficient quorum"
        );

        emergencyMode = true;
        emit EmergencyModeActivated(reason);
    }

    
    function deactivateEmergencyMode() external onlyRole(SECURITY_COUNCIL_ROLE) {
        require(emergencyMode, "Not in emergency mode");
        
        uint256 supportCount = 0;
        for (uint256 i = 0; i < securityCouncilMembers.length; i++) {
            if (securityCouncil[securityCouncilMembers[i]].isActive) {
                supportCount++;
            }
        }

        require(
            supportCount >= SECURITY_COUNCIL_QUORUM,
            "Insufficient quorum"
        );

        emergencyMode = false;
        emit EmergencyModeDeactivated();
    }

    
    function executeProposal(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];
        require(
            proposal.status == ProposalStatus.SUCCEEDED,
            "Proposal not ready"
        );
        require(
            block.timestamp >= proposal.endTime + proposal.minimumDelay,
            "Execution delay not met"
        );

        proposal.status = ProposalStatus.EXECUTED;
        proposal.executed = true;
        activeProposalsCount--;

        // Ejecutar la llamada
        (bool success,) = proposal.target.call(proposal.callData);
        require(success, "Execution failed");

        emit ProposalExecuted(proposalId);
    }

    
    function cancelProposal(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];
        require(
            msg.sender == proposal.proposer ||
            hasRole(SECURITY_COUNCIL_ROLE, msg.sender),
            "Not authorized"
        );
        require(
            proposal.status == ProposalStatus.PENDING ||
            proposal.status == ProposalStatus.ACTIVE,
            "Cannot cancel"
        );

        proposal.status = ProposalStatus.CANCELED;
        proposal.canceled = true;
        activeProposalsCount--;

        emit ProposalCanceled(proposalId);
    }

    
    function _updateProposalStatus(uint256 proposalId) internal {
        Proposal storage proposal = proposals[proposalId];
        
        if (proposal.status == ProposalStatus.PENDING &&
            block.timestamp >= proposal.startTime) {
            proposal.status = ProposalStatus.ACTIVE;
        }
        
        if (proposal.status == ProposalStatus.ACTIVE &&
            block.timestamp > proposal.endTime) {
            if (proposal.forVotes + proposal.againstVotes + proposal.abstainVotes >= proposal.requiredQuorum) {
                if (proposal.forVotes > proposal.againstVotes) {
                    proposal.status = ProposalStatus.SUCCEEDED;
                } else {
                    proposal.status = ProposalStatus.DEFEATED;
                }
            } else {
                proposal.status = ProposalStatus.EXPIRED;
            }
            activeProposalsCount--;
        }
    }

    // Getters
    
    function getProposal(uint256 proposalId) external view returns (
        address proposer,
        string memory title,
        string memory description,
        uint256 startTime,
        uint256 endTime,
        uint256 forVotes,
        uint256 againstVotes,
        uint256 abstainVotes,
        ProposalStatus status,
        bool emergency
    ) {
        Proposal storage proposal = proposals[proposalId];
        return (
            proposal.proposer,
            proposal.title,
            proposal.description,
            proposal.startTime,
            proposal.endTime,
            proposal.forVotes,
            proposal.againstVotes,
            proposal.abstainVotes,
            proposal.status,
            proposal.emergency
        );
    }

    
    function getDelegate(address delegateAddress) external view returns (Delegate memory) {
        return delegates[delegateAddress];
    }

    
    function getSecurityCouncilMembers() external view returns (address[] memory) {
        return securityCouncilMembers;
    }

    
    function getUserProposals(address user) external view returns (uint256[] memory) {
        return userProposals[user];
    }

    
    function getUserVotes(address user) external view returns (uint256[] memory) {
        return userVotes[user];
    }

    
    function setDelegationManager(address _manager) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_manager != address(0), "Invalid address");
        delegationManager = DelegationManager(_manager);
        emit DelegationManagerSet(_manager);
    }
    
    function setAutomatedProposals(address _proposals) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_proposals != address(0), "Invalid address");
        automatedProposals = AutomatedProposals(_proposals);
        emit AutomatedProposalsSet(_proposals);
    }
    
    function delegateVote(address delegatee, uint256 until, uint256 level) external {
        require(address(delegationManager) != address(0), "DelegationManager not set");
        delegationManager.delegate(delegatee, until, level);
    }
    
    function executeAutomatedProposal(uint256 proposalId) external {
        require(address(automatedProposals) != address(0), "AutomatedProposals not set");
        automatedProposals.executeProposal(proposalId);
    }
} 