// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

/**
 * @title GovernanceMetrics
 * @dev Dashboard de métricas y análisis de gobernanza
 * @author BrainSafes Team
 */
contract GovernanceMetrics is AccessControl, ReentrancyGuard, Pausable {
    using Counters for Counters.Counter;
    using SafeMath for uint256;

    // Roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant METRICS_UPDATER_ROLE = keccak256("METRICS_UPDATER_ROLE");
    bytes32 public constant ANALYST_ROLE = keccak256("ANALYST_ROLE");

    // Estructuras
    struct ProposalMetrics {
        uint256 proposalId;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 votesAbstain;
        uint256 quorum;
        uint256 participationRate;
        uint256 delegatedVotes;
        uint256 directVotes;
        uint256 voterCount;
        uint256 executionGas;
        uint256 discussionCount;
        mapping(address => VoteDetails) voterDetails;
        mapping(uint256 => uint256) voteDistribution;
        bool executed;
        bool successful;
    }

    struct DelegateMetrics {
        address delegate;
        uint256 totalVotingPower;
        uint256 proposalsVoted;
        uint256 proposalsCreated;
        uint256 averageParticipation;
        uint256 reputationScore;
        uint256 delegatorCount;
        uint256 totalRewardsEarned;
        uint256[] votedProposals;
        mapping(uint256 => VoteRecord) voteHistory;
    }

    struct VoterMetrics {
        address voter;
        uint256 totalVotes;
        uint256 directVotes;
        uint256 delegatedVotes;
        uint256 proposalsParticipated;
        uint256 averageVotingPower;
        uint256[] votedProposals;
        address currentDelegate;
        uint256 lastVoteTimestamp;
    }

    struct EpochMetrics {
        uint256 epochId;
        uint256 startBlock;
        uint256 endBlock;
        uint256 totalProposals;
        uint256 successfulProposals;
        uint256 totalVoters;
        uint256 totalVotingPower;
        uint256 averageParticipation;
        uint256 uniqueDelegates;
        mapping(address => uint256) delegateParticipation;
    }

    struct DailyStats {
        uint256 date;
        uint256 activeProposals;
        uint256 newVoters;
        uint256 totalVotingPower;
        uint256 participationRate;
        uint256 delegationChanges;
        uint256 rewardsDistributed;
    }

    struct VoteDetails {
        uint256 votingPower;
        uint256 timestamp;
        bool isDelegated;
        string reason;
    }

    struct VoteRecord {
        uint256 proposalId;
        uint256 votingPower;
        uint256 timestamp;
        bool support;
        string reason;
    }

    struct MetricsSnapshot {
        uint256 snapshotId;
        uint256 timestamp;
        uint256 totalVotingPower;
        uint256 activeVoters;
        uint256 activeDelegates;
        uint256 averageParticipation;
        bytes32 ipfsHash;
    }

    // Eventos
    event ProposalMetricsUpdated(
        uint256 indexed proposalId,
        uint256 participation,
        uint256 quorum,
        bool successful
    );

    event DelegateMetricsUpdated(
        address indexed delegate,
        uint256 votingPower,
        uint256 delegatorCount
    );

    event VoterMetricsUpdated(
        address indexed voter,
        uint256 totalVotes,
        uint256 votingPower
    );

    event EpochCompleted(
        uint256 indexed epochId,
        uint256 totalProposals,
        uint256 participation
    );

    event DailyStatsUpdated(
        uint256 indexed date,
        uint256 activeProposals,
        uint256 participation
    );

    event MetricsSnapshotCreated(
        uint256 indexed snapshotId,
        uint256 timestamp,
        bytes32 ipfsHash
    );

    // Variables de estado
    mapping(uint256 => ProposalMetrics) public proposalMetrics;
    mapping(address => DelegateMetrics) public delegateMetrics;
    mapping(address => VoterMetrics) public voterMetrics;
    mapping(uint256 => EpochMetrics) public epochMetrics;
    mapping(uint256 => DailyStats) public dailyStats;
    mapping(uint256 => MetricsSnapshot) public metricsSnapshots;

    // Configuración
    uint256 public constant EPOCH_DURATION = 7 days;
    uint256 public constant METRICS_DECIMALS = 18;
    uint256 public constant MAX_VOTE_DISTRIBUTION_POINTS = 100;
    uint256 public constant SNAPSHOT_INTERVAL = 1 days;

    // Contadores
    Counters.Counter private _epochIdCounter;
    Counters.Counter private _snapshotIdCounter;

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(METRICS_UPDATER_ROLE, msg.sender);
        _grantRole(ANALYST_ROLE, msg.sender);
    }

    /**
     * @dev Actualiza métricas de propuesta
     */
    function updateProposalMetrics(
        uint256 proposalId,
        uint256 votesFor,
        uint256 votesAgainst,
        uint256 votesAbstain,
        uint256 quorum,
        uint256 executionGas,
        bool executed,
        bool successful
    ) external onlyRole(METRICS_UPDATER_ROLE) {
        ProposalMetrics storage metrics = proposalMetrics[proposalId];
        
        metrics.proposalId = proposalId;
        metrics.votesFor = votesFor;
        metrics.votesAgainst = votesAgainst;
        metrics.votesAbstain = votesAbstain;
        metrics.quorum = quorum;
        metrics.executionGas = executionGas;
        metrics.executed = executed;
        metrics.successful = successful;

        // Calcular participación
        uint256 totalVotes = votesFor.add(votesAgainst).add(votesAbstain);
        metrics.participationRate = totalVotes.mul(100).div(quorum);

        emit ProposalMetricsUpdated(
            proposalId,
            metrics.participationRate,
            quorum,
            successful
        );

        // Actualizar métricas de época
        _updateEpochMetrics(proposalId, totalVotes);
    }

    /**
     * @dev Registra voto en métricas
     */
    function recordVote(
        uint256 proposalId,
        address voter,
        uint256 votingPower,
        bool isDelegated,
        string memory reason
    ) external onlyRole(METRICS_UPDATER_ROLE) {
        ProposalMetrics storage proposal = proposalMetrics[proposalId];
        VoterMetrics storage voterM = voterMetrics[voter];

        // Actualizar detalles del voto
        proposal.voterDetails[voter] = VoteDetails({
            votingPower: votingPower,
            timestamp: block.timestamp,
            isDelegated: isDelegated,
            reason: reason
        });

        // Actualizar contadores
        proposal.voterCount++;
        if (isDelegated) {
            proposal.delegatedVotes = proposal.delegatedVotes.add(votingPower);
        } else {
            proposal.directVotes = proposal.directVotes.add(votingPower);
        }

        // Actualizar métricas del votante
        voterM.totalVotes++;
        if (isDelegated) {
            voterM.delegatedVotes = voterM.delegatedVotes.add(votingPower);
        } else {
            voterM.directVotes = voterM.directVotes.add(votingPower);
        }
        voterM.proposalsParticipated++;
        voterM.votedProposals.push(proposalId);
        voterM.lastVoteTimestamp = block.timestamp;

        emit VoterMetricsUpdated(
            voter,
            voterM.totalVotes,
            votingPower
        );
    }

    /**
     * @dev Actualiza métricas de delegado
     */
    function updateDelegateMetrics(
        address delegate,
        uint256 votingPower,
        uint256 delegatorCount,
        uint256 reputationScore
    ) external onlyRole(METRICS_UPDATER_ROLE) {
        DelegateMetrics storage metrics = delegateMetrics[delegate];
        
        metrics.delegate = delegate;
        metrics.totalVotingPower = votingPower;
        metrics.delegatorCount = delegatorCount;
        metrics.reputationScore = reputationScore;

        // Calcular promedio de participación
        if (metrics.proposalsVoted > 0) {
            metrics.averageParticipation = metrics.totalVotingPower.div(metrics.proposalsVoted);
        }

        emit DelegateMetricsUpdated(
            delegate,
            votingPower,
            delegatorCount
        );
    }

    /**
     * @dev Registra voto de delegado
     */
    function recordDelegateVote(
        address delegate,
        uint256 proposalId,
        uint256 votingPower,
        bool support,
        string memory reason
    ) external onlyRole(METRICS_UPDATER_ROLE) {
        DelegateMetrics storage metrics = delegateMetrics[delegate];
        
        metrics.proposalsVoted++;
        metrics.votedProposals.push(proposalId);
        
        // Registrar en historial
        metrics.voteHistory[proposalId] = VoteRecord({
            proposalId: proposalId,
            votingPower: votingPower,
            timestamp: block.timestamp,
            support: support,
            reason: reason
        });
    }

    /**
     * @dev Actualiza métricas de época
     */
    function _updateEpochMetrics(
        uint256 proposalId,
        uint256 totalVotes
    ) internal {
        uint256 currentEpoch = block.timestamp.div(EPOCH_DURATION);
        
        if (epochMetrics[currentEpoch].startBlock == 0) {
            _epochIdCounter.increment();
            epochMetrics[currentEpoch].epochId = _epochIdCounter.current();
            epochMetrics[currentEpoch].startBlock = block.number;
        }

        EpochMetrics storage epoch = epochMetrics[currentEpoch];
        epoch.totalProposals++;
        epoch.totalVotingPower = epoch.totalVotingPower.add(totalVotes);

        if (proposalMetrics[proposalId].successful) {
            epoch.successfulProposals++;
        }

        // Actualizar participación promedio
        epoch.averageParticipation = epoch.totalVotingPower.div(epoch.totalProposals);

        // Verificar si la época ha terminado
        if (block.timestamp >= (currentEpoch + 1).mul(EPOCH_DURATION)) {
            epoch.endBlock = block.number;
            
            emit EpochCompleted(
                epoch.epochId,
                epoch.totalProposals,
                epoch.averageParticipation
            );
        }
    }

    /**
     * @dev Actualiza estadísticas diarias
     */
    function updateDailyStats(
        uint256 activeProposals,
        uint256 newVoters,
        uint256 totalVotingPower,
        uint256 participationRate,
        uint256 delegationChanges,
        uint256 rewardsDistributed
    ) external onlyRole(METRICS_UPDATER_ROLE) {
        uint256 today = block.timestamp.div(1 days);

        dailyStats[today] = DailyStats({
            date: today,
            activeProposals: activeProposals,
            newVoters: newVoters,
            totalVotingPower: totalVotingPower,
            participationRate: participationRate,
            delegationChanges: delegationChanges,
            rewardsDistributed: rewardsDistributed
        });

        emit DailyStatsUpdated(
            today,
            activeProposals,
            participationRate
        );
    }

    /**
     * @dev Crea snapshot de métricas
     */
    function createMetricsSnapshot(
        uint256 totalVotingPower,
        uint256 activeVoters,
        uint256 activeDelegates,
        uint256 averageParticipation,
        bytes32 ipfsHash
    ) external onlyRole(ANALYST_ROLE) {
        _snapshotIdCounter.increment();
        uint256 snapshotId = _snapshotIdCounter.current();

        metricsSnapshots[snapshotId] = MetricsSnapshot({
            snapshotId: snapshotId,
            timestamp: block.timestamp,
            totalVotingPower: totalVotingPower,
            activeVoters: activeVoters,
            activeDelegates: activeDelegates,
            averageParticipation: averageParticipation,
            ipfsHash: ipfsHash
        });

        emit MetricsSnapshotCreated(
            snapshotId,
            block.timestamp,
            ipfsHash
        );
    }

    // Getters
    function getProposalVoteDistribution(
        uint256 proposalId
    ) external view returns (uint256[] memory distribution) {
        distribution = new uint256[](MAX_VOTE_DISTRIBUTION_POINTS);
        for (uint256 i = 0; i < MAX_VOTE_DISTRIBUTION_POINTS; i++) {
            distribution[i] = proposalMetrics[proposalId].voteDistribution[i];
        }
        return distribution;
    }

    function getDelegateVoteHistory(
        address delegate,
        uint256 proposalId
    ) external view returns (VoteRecord memory) {
        return delegateMetrics[delegate].voteHistory[proposalId];
    }

    function getVoterHistory(
        address voter
    ) external view returns (uint256[] memory) {
        return voterMetrics[voter].votedProposals;
    }

    function getDelegateHistory(
        address delegate
    ) external view returns (uint256[] memory) {
        return delegateMetrics[delegate].votedProposals;
    }

    function getEpochDelegateParticipation(
        uint256 epochId,
        address delegate
    ) external view returns (uint256) {
        return epochMetrics[epochId].delegateParticipation[delegate];
    }

    function getCurrentEpochMetrics() external view returns (
        uint256 epochId,
        uint256 totalProposals,
        uint256 successfulProposals,
        uint256 averageParticipation
    ) {
        uint256 currentEpoch = block.timestamp.div(EPOCH_DURATION);
        EpochMetrics storage epoch = epochMetrics[currentEpoch];
        
        return (
            epoch.epochId,
            epoch.totalProposals,
            epoch.successfulProposals,
            epoch.averageParticipation
        );
    }

    function getLatestSnapshot() external view returns (MetricsSnapshot memory) {
        return metricsSnapshots[_snapshotIdCounter.current()];
    }

    /**
     * @dev Pausa el contrato
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    /**
     * @dev Despausa el contrato
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
} 