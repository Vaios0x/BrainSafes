// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/governance/utils/IVotesUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/ECDSAUpgradeable.sol";
import "../bridge/CrossChainBridge.sol";
import "../governance/DelegationManager.sol";
import "../governance/AutomatedProposals.sol";


contract MultiChainGovernance is UUPSUpgradeable, AccessControlUpgradeable, PausableUpgradeable {
    using ECDSAUpgradeable for bytes32;

    // Roles
    bytes32 public constant GOVERNOR_ROLE = keccak256("GOVERNOR_ROLE");
    bytes32 public constant PROPOSER_ROLE = keccak256("PROPOSER_ROLE");
    bytes32 public constant EXECUTOR_ROLE = keccak256("EXECUTOR_ROLE");

    // Voting settings
    uint256 public constant MIN_VOTING_DELAY = 1 days;
    uint256 public constant MAX_VOTING_DELAY = 2 weeks;
    uint256 public constant MIN_VOTING_PERIOD = 3 days;
    uint256 public constant MAX_VOTING_PERIOD = 4 weeks;
    uint256 public constant MIN_PROPOSAL_THRESHOLD = 1000e18;
    uint256 public constant QUORUM_FRACTION = 4; // 4%

    // Structs
    struct ChainVoting {
        uint256 chainId;
        address votingToken;
        uint256 votingDelay;
        uint256 votingPeriod;
        uint256 proposalThreshold;
        uint256 quorumNumerator;
        bool isActive;
    }

    struct Proposal {
        bytes32 proposalId;
        address proposer;
        uint256 startBlock;
        uint256 endBlock;
        string description;
        bytes[] calldatas;
        address[] targets;
        uint256[] values;
        bool executed;
        bool canceled;
        mapping(uint256 => uint256) chainVotes;
        mapping(address => bool) hasVoted;
    }

    struct ProposalVote {
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
    }

    struct VoteReceipt {
        bool hasVoted;
        uint8 support;
        uint256 votes;
    }

    // State variables
    CrossChainBridge public bridge;
    mapping(uint256 => ChainVoting) public chainVotings;
    mapping(bytes32 => Proposal) public proposals;
    mapping(bytes32 => ProposalVote) public proposalVotes;
    mapping(bytes32 => mapping(address => VoteReceipt)) public voteReceipts;
    
    // Módulos de gobernanza avanzada
    DelegationManager public delegationManager;
    AutomatedProposals public automatedProposals;

    // Events
    event ChainVotingConfigured(uint256 indexed chainId, address votingToken);
    event ProposalCreated(
        bytes32 indexed proposalId,
        address proposer,
        address[] targets,
        uint256[] values,
        bytes[] calldatas,
        string description
    );
    event ProposalExecuted(bytes32 indexed proposalId);
    event ProposalCanceled(bytes32 indexed proposalId);
    event VoteCast(
        address indexed voter,
        bytes32 indexed proposalId,
        uint8 support,
        uint256 weight,
        string reason
    );
    event VotingDelaySet(uint256 oldVotingDelay, uint256 newVotingDelay);
    event VotingPeriodSet(uint256 oldVotingPeriod, uint256 newVotingPeriod);
    event ProposalThresholdSet(uint256 oldProposalThreshold, uint256 newProposalThreshold);
    event QuorumNumeratorUpdated(uint256 oldQuorumNumerator, uint256 newQuorumNumerator);
    event DelegationManagerSet(address indexed manager);
    event AutomatedProposalsSet(address indexed proposals);

    
    function initialize(address _bridge) public initializer {
        __UUPSUpgradeable_init();
        __AccessControl_init();
        __Pausable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(GOVERNOR_ROLE, msg.sender);

        bridge = CrossChainBridge(_bridge);
    }

    
    function configureChainVoting(
        uint256 chainId,
        address votingToken,
        uint256 votingDelay,
        uint256 votingPeriod,
        uint256 proposalThreshold,
        uint256 quorumNumerator
    ) external onlyRole(GOVERNOR_ROLE) {
        require(votingToken != address(0), "Invalid voting token");
        require(
            votingDelay >= MIN_VOTING_DELAY && votingDelay <= MAX_VOTING_DELAY,
            "Invalid voting delay"
        );
        require(
            votingPeriod >= MIN_VOTING_PERIOD && votingPeriod <= MAX_VOTING_PERIOD,
            "Invalid voting period"
        );
        require(proposalThreshold >= MIN_PROPOSAL_THRESHOLD, "Invalid proposal threshold");
        require(quorumNumerator > 0 && quorumNumerator <= 100, "Invalid quorum numerator");

        ChainVoting storage voting = chainVotings[chainId];
        voting.chainId = chainId;
        voting.votingToken = votingToken;
        voting.votingDelay = votingDelay;
        voting.votingPeriod = votingPeriod;
        voting.proposalThreshold = proposalThreshold;
        voting.quorumNumerator = quorumNumerator;
        voting.isActive = true;

        emit ChainVotingConfigured(chainId, votingToken);
    }

    
    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) external returns (bytes32) {
        require(
            targets.length == values.length && targets.length == calldatas.length,
            "Invalid proposal length"
        );
        require(targets.length > 0, "Empty proposal");

        uint256 proposerVotes = IVotesUpgradeable(
            chainVotings[block.chainid].votingToken
        ).getVotes(msg.sender);

        require(
            proposerVotes >= chainVotings[block.chainid].proposalThreshold,
            "Insufficient votes"
        );

        bytes32 proposalId = keccak256(abi.encode(
            block.chainid,
            block.number,
            targets,
            values,
            calldatas,
            description
        ));

        Proposal storage proposal = proposals[proposalId];
        require(proposal.proposer == address(0), "Proposal already exists");

        uint256 snapshot = block.number + chainVotings[block.chainid].votingDelay;
        uint256 deadline = snapshot + chainVotings[block.chainid].votingPeriod;

        proposal.proposalId = proposalId;
        proposal.proposer = msg.sender;
        proposal.startBlock = snapshot;
        proposal.endBlock = deadline;
        proposal.description = description;
        proposal.calldatas = calldatas;
        proposal.targets = targets;
        proposal.values = values;

        emit ProposalCreated(
            proposalId,
            msg.sender,
            targets,
            values,
            calldatas,
            description
        );

        return proposalId;
    }

    
    function castVote(
        bytes32 proposalId,
        uint8 support,
        string calldata reason
    ) external returns (uint256) {
        require(support <= 2, "Invalid vote type");
        require(state(proposalId) == ProposalState.Active, "Proposal not active");

        address voter = msg.sender;
        uint256 weight = IVotesUpgradeable(
            chainVotings[block.chainid].votingToken
        ).getVotes(voter);

        require(weight > 0, "No voting power");
        require(!proposals[proposalId].hasVoted[voter], "Already voted");

        proposals[proposalId].hasVoted[voter] = true;

        if (support == 0) {
            proposalVotes[proposalId].againstVotes += weight;
        } else if (support == 1) {
            proposalVotes[proposalId].forVotes += weight;
        } else {
            proposalVotes[proposalId].abstainVotes += weight;
        }

        voteReceipts[proposalId][voter] = VoteReceipt({
            hasVoted: true,
            support: support,
            votes: weight
        });

        emit VoteCast(voter, proposalId, support, weight, reason);
        return weight;
    }

    
    function execute(
        bytes32 proposalId
    ) external payable returns (bytes[] memory) {
        require(state(proposalId) == ProposalState.Succeeded, "Proposal not successful");

        Proposal storage proposal = proposals[proposalId];
        proposal.executed = true;

        bytes[] memory results = new bytes[](proposal.targets.length);

        for (uint256 i = 0; i < proposal.targets.length; i++) {
            (bool success, bytes memory result) = proposal.targets[i].call{
                value: proposal.values[i]
            }(proposal.calldatas[i]);
            require(success, "Proposal execution failed");
            results[i] = result;
        }

        emit ProposalExecuted(proposalId);
        return results;
    }

    
    function cancel(bytes32 proposalId) external {
        require(state(proposalId) != ProposalState.Executed, "Cannot cancel executed proposal");

        Proposal storage proposal = proposals[proposalId];
        require(
            msg.sender == proposal.proposer ||
            IVotesUpgradeable(chainVotings[block.chainid].votingToken).getVotes(proposal.proposer) <
            chainVotings[block.chainid].proposalThreshold,
            "Cannot cancel"
        );

        proposal.canceled = true;
        emit ProposalCanceled(proposalId);
    }

    
    function state(bytes32 proposalId) public view returns (ProposalState) {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.proposer != address(0), "Proposal doesn't exist");

        if (proposal.executed) {
            return ProposalState.Executed;
        }

        if (proposal.canceled) {
            return ProposalState.Canceled;
        }

        uint256 snapshot = proposal.startBlock;

        if (snapshot == 0) {
            return ProposalState.Pending;
        }

        if (block.number <= snapshot) {
            return ProposalState.Pending;
        }

        if (block.number <= proposal.endBlock) {
            return ProposalState.Active;
        }

        if (_quorumReached(proposalId) && _voteSucceeded(proposalId)) {
            return ProposalState.Succeeded;
        }

        return ProposalState.Defeated;
    }

    
    function proposalVotesCount(
        bytes32 proposalId
    ) public view returns (
        uint256 againstVotes,
        uint256 forVotes,
        uint256 abstainVotes
    ) {
        ProposalVote storage votes = proposalVotes[proposalId];
        return (votes.againstVotes, votes.forVotes, votes.abstainVotes);
    }

    
    function _quorumReached(bytes32 proposalId) internal view returns (bool) {
        ProposalVote storage votes = proposalVotes[proposalId];
        uint256 totalSupply = IVotesUpgradeable(
            chainVotings[block.chainid].votingToken
        ).getPastTotalSupply(proposals[proposalId].startBlock - 1);

        return (votes.forVotes + votes.abstainVotes) >=
            (totalSupply * chainVotings[block.chainid].quorumNumerator) / 100;
    }

    
    function _voteSucceeded(bytes32 proposalId) internal view returns (bool) {
        ProposalVote storage votes = proposalVotes[proposalId];
        return votes.forVotes > votes.againstVotes;
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

    
    function _authorizeUpgrade(address newImplementation) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}
}

enum ProposalState {
    Pending,
    Active,
    Canceled,
    Defeated,
    Succeeded,
    Executed
} 