// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

/**
 * @title ParticipationIncentives
 * @notice Incentives contract for governance participation in BrainSafes
 * @dev Rewards users for voting and proposal engagement
 * @author BrainSafes Team
 */
contract ParticipationIncentives is AccessControl, ReentrancyGuard, Pausable {
    using SafeMath for uint256;

    // Roles
    bytes32 public constant INCENTIVES_ADMIN_ROLE = keccak256("INCENTIVES_ADMIN_ROLE");
    bytes32 public constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");

    // Estructuras
    struct ParticipationMetrics {
        uint256 proposalsCreated;
        uint256 votesSubmitted;
        uint256 successfulProposals;
        uint256 votingStreak;
        uint256 lastParticipation;
        uint256 reputationScore;
        uint256 totalRewardsEarned;
        uint256 lastRewardClaim;
        bool isActive;
    }

    struct IncentiveConfig {
        uint256 baseProposalReward;
        uint256 baseVoteReward;
        uint256 successfulProposalBonus;
        uint256 streakMultiplier;
        uint256 reputationMultiplier;
        uint256 minReputationForBonus;
        uint256 maxDailyReward;
        uint256 cooldownPeriod;
    }

    struct EpochStats {
        uint256 totalParticipants;
        uint256 totalProposals;
        uint256 totalVotes;
        uint256 totalRewardsDistributed;
        uint256 startTime;
        uint256 endTime;
    }

    // Eventos
    event RewardClaimed(
        address indexed participant,
        uint256 amount,
        uint256 proposalBonus,
        uint256 voteBonus,
        uint256 streakBonus,
        uint256 reputationBonus
    );

    event ParticipationRecorded(
        address indexed participant,
        string activityType,
        uint256 rewardAmount
    );

    event EpochCompleted(
        uint256 indexed epochNumber,
        uint256 totalParticipants,
        uint256 totalRewards
    );

    event ConfigUpdated(
        string parameter,
        uint256 oldValue,
        uint256 newValue
    );

    event ReputationUpdated(
        address indexed participant,
        uint256 oldScore,
        uint256 newScore,
        string reason
    );

    // Variables de estado
    IERC20 public rewardsToken;
    mapping(address => ParticipationMetrics) public participationMetrics;
    IncentiveConfig public incentiveConfig;
    mapping(uint256 => EpochStats) public epochStats;
    uint256 public currentEpoch;
    uint256 public epochDuration;
    uint256 public totalRewardsDistributed;
    uint256 public rewardsPool;

    // Constructor
    constructor(
        address _rewardsToken,
        uint256 _epochDuration,
        uint256 _baseProposalReward,
        uint256 _baseVoteReward
    ) {
        require(_rewardsToken != address(0), "Invalid token");
        require(_epochDuration > 0, "Invalid epoch duration");
        require(_baseProposalReward > 0, "Invalid proposal reward");
        require(_baseVoteReward > 0, "Invalid vote reward");

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(INCENTIVES_ADMIN_ROLE, msg.sender);

        rewardsToken = IERC20(_rewardsToken);
        epochDuration = _epochDuration;

        // Configuración inicial
        incentiveConfig = IncentiveConfig({
            baseProposalReward: _baseProposalReward,
            baseVoteReward: _baseVoteReward,
            successfulProposalBonus: 200, // 2x
            streakMultiplier: 110, // 1.1x
            reputationMultiplier: 120, // 1.2x
            minReputationForBonus: 100,
            maxDailyReward: 1000 * 10**18, // 1000 tokens
            cooldownPeriod: 1 days
        });

        // Iniciar primera época
        _startNewEpoch();
    }

    /**
     * @notice Records a proposal participation event.
     * @dev Only callable by governance roles.
     * @param participant The address of the participant.
     * @param successful Boolean indicating if the proposal was successful.
     */
    function recordProposalParticipation(
        address participant,
        bool successful
    ) external onlyRole(GOVERNANCE_ROLE) {
        ParticipationMetrics storage metrics = participationMetrics[participant];
        require(metrics.isActive, "Participant not active");

        // Actualizar métricas
        metrics.proposalsCreated++;
        if (successful) {
            metrics.successfulProposals++;
        }

        // Actualizar streak
        _updateParticipationStreak(metrics);

        // Calcular recompensa base
        uint256 reward = incentiveConfig.baseProposalReward;
        
        // Añadir bonus por propuesta exitosa
        if (successful) {
            reward = reward.mul(incentiveConfig.successfulProposalBonus).div(100);
        }

        // Aplicar multiplicadores
        reward = _applyMultipliers(reward, metrics);

        // Actualizar estadísticas
        EpochStats storage stats = epochStats[currentEpoch];
        stats.totalProposals++;
        stats.totalRewardsDistributed = stats.totalRewardsDistributed.add(reward);

        emit ParticipationRecorded(
            participant,
            "PROPOSAL",
            reward
        );
    }

    /**
     * @notice Records a vote participation event.
     * @dev Only callable by governance roles.
     * @param participant The address of the participant.
     * @param withMajority Boolean indicating if the vote had a majority.
     */
    function recordVoteParticipation(
        address participant,
        bool withMajority
    ) external onlyRole(GOVERNANCE_ROLE) {
        ParticipationMetrics storage metrics = participationMetrics[participant];
        require(metrics.isActive, "Participant not active");

        // Actualizar métricas
        metrics.votesSubmitted++;

        // Actualizar streak
        _updateParticipationStreak(metrics);

        // Calcular recompensa base
        uint256 reward = incentiveConfig.baseVoteReward;
        
        // Añadir bonus por votar con mayoría
        if (withMajority) {
            reward = reward.mul(110).div(100); // 10% bonus
        }

        // Aplicar multiplicadores
        reward = _applyMultipliers(reward, metrics);

        // Actualizar estadísticas
        EpochStats storage stats = epochStats[currentEpoch];
        stats.totalVotes++;
        stats.totalRewardsDistributed = stats.totalRewardsDistributed.add(reward);

        emit ParticipationRecorded(
            participant,
            "VOTE",
            reward
        );
    }

    /**
     * @notice Claims accumulated rewards.
     * @dev Only callable when not paused.
     */
    function claimRewards() external nonReentrant whenNotPaused {
        ParticipationMetrics storage metrics = participationMetrics[msg.sender];
        require(metrics.isActive, "Participant not active");
        require(
            block.timestamp >= metrics.lastRewardClaim + incentiveConfig.cooldownPeriod,
            "Cooldown not met"
        );

        // Calcular recompensas
        uint256 proposalRewards = _calculateProposalRewards(metrics);
        uint256 voteRewards = _calculateVoteRewards(metrics);
        uint256 streakBonus = _calculateStreakBonus(metrics);
        uint256 reputationBonus = _calculateReputationBonus(metrics);

        // Calcular total
        uint256 totalReward = proposalRewards
            .add(voteRewards)
            .add(streakBonus)
            .add(reputationBonus);

        // Aplicar límite diario
        if (totalReward > incentiveConfig.maxDailyReward) {
            totalReward = incentiveConfig.maxDailyReward;
        }

        require(totalReward <= rewardsPool, "Insufficient rewards pool");

        // Actualizar estado
        metrics.totalRewardsEarned = metrics.totalRewardsEarned.add(totalReward);
        metrics.lastRewardClaim = block.timestamp;
        rewardsPool = rewardsPool.sub(totalReward);
        totalRewardsDistributed = totalRewardsDistributed.add(totalReward);

        // Transferir recompensas
        require(
            rewardsToken.transfer(msg.sender, totalReward),
            "Transfer failed"
        );

        emit RewardClaimed(
            msg.sender,
            totalReward,
            proposalRewards,
            voteRewards,
            streakBonus,
            reputationBonus
        );
    }

    /**
     * @dev Updates the participation streak.
     * @param metrics The metrics of the participant.
     */
    function _updateParticipationStreak(
        ParticipationMetrics storage metrics
    ) internal {
        if (metrics.lastParticipation > 0 &&
            block.timestamp <= metrics.lastParticipation + 1 days) {
            metrics.votingStreak++;
        } else {
            metrics.votingStreak = 1;
        }
        metrics.lastParticipation = block.timestamp;
    }

    /**
     * @dev Applies multipliers to the reward.
     * @param baseReward The base reward amount.
     * @param metrics The metrics of the participant.
     * @return The final reward amount after multipliers.
     */
    function _applyMultipliers(
        uint256 baseReward,
        ParticipationMetrics memory metrics
    ) internal view returns (uint256) {
        uint256 reward = baseReward;

        // Multiplicador por streak
        if (metrics.votingStreak >= 7) { // 1 semana
            reward = reward.mul(incentiveConfig.streakMultiplier).div(100);
        }

        // Multiplicador por reputación
        if (metrics.reputationScore >= incentiveConfig.minReputationForBonus) {
            reward = reward.mul(incentiveConfig.reputationMultiplier).div(100);
        }

        return reward;
    }

    /**
     * @dev Calculates rewards for proposals.
     * @param metrics The metrics of the participant.
     * @return The total reward for proposals.
     */
    function _calculateProposalRewards(
        ParticipationMetrics memory metrics
    ) internal view returns (uint256) {
        uint256 baseReward = incentiveConfig.baseProposalReward
            .mul(metrics.proposalsCreated);

        uint256 successBonus = incentiveConfig.baseProposalReward
            .mul(metrics.successfulProposals)
            .mul(incentiveConfig.successfulProposalBonus)
            .div(100);

        return baseReward.add(successBonus);
    }

    /**
     * @dev Calculates rewards for votes.
     * @param metrics The metrics of the participant.
     * @return The total reward for votes.
     */
    function _calculateVoteRewards(
        ParticipationMetrics memory metrics
    ) internal view returns (uint256) {
        return incentiveConfig.baseVoteReward
            .mul(metrics.votesSubmitted);
    }

    /**
     * @dev Calculates streak bonus.
     * @param metrics The metrics of the participant.
     * @return The streak bonus amount.
     */
    function _calculateStreakBonus(
        ParticipationMetrics memory metrics
    ) internal view returns (uint256) {
        if (metrics.votingStreak < 7) return 0;

        return incentiveConfig.baseVoteReward
            .mul(metrics.votingStreak)
            .mul(incentiveConfig.streakMultiplier)
            .div(100);
    }

    /**
     * @dev Calculates reputation bonus.
     * @param metrics The metrics of the participant.
     * @return The reputation bonus amount.
     */
    function _calculateReputationBonus(
        ParticipationMetrics memory metrics
    ) internal view returns (uint256) {
        if (metrics.reputationScore < incentiveConfig.minReputationForBonus) {
            return 0;
        }

        return incentiveConfig.baseVoteReward
            .mul(metrics.reputationScore)
            .mul(incentiveConfig.reputationMultiplier)
            .div(100);
    }

    /**
     * @dev Starts a new epoch.
     */
    function _startNewEpoch() internal {
        currentEpoch++;
        
        epochStats[currentEpoch] = EpochStats({
            totalParticipants: 0,
            totalProposals: 0,
            totalVotes: 0,
            totalRewardsDistributed: 0,
            startTime: block.timestamp,
            endTime: block.timestamp + epochDuration
        });
    }

    /**
     * @notice Registers a new participant.
     * @dev Only callable by governance roles.
     * @param participant The address of the participant to register.
     */
    function registerParticipant(address participant) external onlyRole(GOVERNANCE_ROLE) {
        require(!participationMetrics[participant].isActive, "Already registered");

        participationMetrics[participant] = ParticipationMetrics({
            proposalsCreated: 0,
            votesSubmitted: 0,
            successfulProposals: 0,
            votingStreak: 0,
            lastParticipation: 0,
            reputationScore: 100,
            totalRewardsEarned: 0,
            lastRewardClaim: 0,
            isActive: true
        });

        EpochStats storage stats = epochStats[currentEpoch];
        stats.totalParticipants++;
    }

    /**
     * @notice Updates the reputation of a participant.
     * @dev Only callable by governance roles.
     * @param participant The address of the participant.
     * @param newScore The new reputation score.
     * @param reason The reason for the reputation update.
     */
    function updateReputation(
        address participant,
        uint256 newScore,
        string memory reason
    ) external onlyRole(GOVERNANCE_ROLE) {
        ParticipationMetrics storage metrics = participationMetrics[participant];
        require(metrics.isActive, "Participant not active");

        uint256 oldScore = metrics.reputationScore;
        metrics.reputationScore = newScore;

        emit ReputationUpdated(
            participant,
            oldScore,
            newScore,
            reason
        );
    }

    /**
     * @notice Adds funds to the rewards pool.
     * @dev Only callable by the contract owner.
     * @param amount The amount of tokens to add.
     */
    function addRewardsToPool(uint256 amount) external {
        require(
            rewardsToken.transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );
        rewardsPool = rewardsPool.add(amount);
    }

    /**
     * @notice Updates the incentive configuration.
     * @dev Only callable by incentives admin roles.
     * @param _baseProposalReward The new base proposal reward.
     * @param _baseVoteReward The new base vote reward.
     * @param _successfulProposalBonus The new successful proposal bonus.
     * @param _streakMultiplier The new streak multiplier.
     * @param _reputationMultiplier The new reputation multiplier.
     * @param _minReputationForBonus The new minimum reputation for bonus.
     * @param _maxDailyReward The new max daily reward.
     * @param _cooldownPeriod The new cooldown period.
     */
    function updateIncentiveConfig(
        uint256 _baseProposalReward,
        uint256 _baseVoteReward,
        uint256 _successfulProposalBonus,
        uint256 _streakMultiplier,
        uint256 _reputationMultiplier,
        uint256 _minReputationForBonus,
        uint256 _maxDailyReward,
        uint256 _cooldownPeriod
    ) external onlyRole(INCENTIVES_ADMIN_ROLE) {
        IncentiveConfig memory oldConfig = incentiveConfig;

        incentiveConfig.baseProposalReward = _baseProposalReward;
        incentiveConfig.baseVoteReward = _baseVoteReward;
        incentiveConfig.successfulProposalBonus = _successfulProposalBonus;
        incentiveConfig.streakMultiplier = _streakMultiplier;
        incentiveConfig.reputationMultiplier = _reputationMultiplier;
        incentiveConfig.minReputationForBonus = _minReputationForBonus;
        incentiveConfig.maxDailyReward = _maxDailyReward;
        incentiveConfig.cooldownPeriod = _cooldownPeriod;

        emit ConfigUpdated("baseProposalReward", oldConfig.baseProposalReward, _baseProposalReward);
        emit ConfigUpdated("baseVoteReward", oldConfig.baseVoteReward, _baseVoteReward);
        emit ConfigUpdated("successfulProposalBonus", oldConfig.successfulProposalBonus, _successfulProposalBonus);
        emit ConfigUpdated("streakMultiplier", oldConfig.streakMultiplier, _streakMultiplier);
        emit ConfigUpdated("reputationMultiplier", oldConfig.reputationMultiplier, _reputationMultiplier);
        emit ConfigUpdated("minReputationForBonus", oldConfig.minReputationForBonus, _minReputationForBonus);
        emit ConfigUpdated("maxDailyReward", oldConfig.maxDailyReward, _maxDailyReward);
        emit ConfigUpdated("cooldownPeriod", oldConfig.cooldownPeriod, _cooldownPeriod);
    }

    /**
     * @notice Gets the metrics of a participant.
     * @param participant The address of the participant.
     * @return The metrics of the participant.
     */
    function getParticipantMetrics(
        address participant
    ) external view returns (ParticipationMetrics memory) {
        return participationMetrics[participant];
    }

    /**
     * @notice Gets the statistics of an epoch.
     * @param epoch The number of the epoch.
     * @return The statistics of the epoch.
     */
    function getEpochStats(
        uint256 epoch
    ) external view returns (EpochStats memory) {
        return epochStats[epoch];
    }

    /**
     * @notice Gets estimated rewards for a participant.
     * @param participant The address of the participant.
     * @return proposalRewards The estimated reward for proposals.
     * @return voteRewards The estimated reward for votes.
     * @return streakBonus The estimated streak bonus.
     * @return reputationBonus The estimated reputation bonus.
     * @return total The total estimated reward.
     */
    function getEstimatedRewards(
        address participant
    ) external view returns (
        uint256 proposalRewards,
        uint256 voteRewards,
        uint256 streakBonus,
        uint256 reputationBonus,
        uint256 total
    ) {
        ParticipationMetrics memory metrics = participationMetrics[participant];
        
        proposalRewards = _calculateProposalRewards(metrics);
        voteRewards = _calculateVoteRewards(metrics);
        streakBonus = _calculateStreakBonus(metrics);
        reputationBonus = _calculateReputationBonus(metrics);
        
        total = proposalRewards
            .add(voteRewards)
            .add(streakBonus)
            .add(reputationBonus);

        if (total > incentiveConfig.maxDailyReward) {
            total = incentiveConfig.maxDailyReward;
        }

        return (proposalRewards, voteRewards, streakBonus, reputationBonus, total);
    }

    /**
     * @notice Pauses the contract.
     * @dev Only callable by incentives admin roles.
     */
    function pause() external onlyRole(INCENTIVES_ADMIN_ROLE) {
        _pause();
    }

    /**
     * @notice Unpauses the contract.
     * @dev Only callable by incentives admin roles.
     */
    function unpause() external onlyRole(INCENTIVES_ADMIN_ROLE) {
        _unpause();
    }
} 