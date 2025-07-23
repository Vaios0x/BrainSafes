// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

/**
 * @title DelegateRewards
 * @dev Sistema de recompensas para delegados con múltiples incentivos
 * @author BrainSafes Team
 */
contract DelegateRewards is AccessControl, ReentrancyGuard, Pausable {
    using Counters for Counters.Counter;
    using SafeMath for uint256;

    // Roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");
    bytes32 public constant REWARDS_DISTRIBUTOR_ROLE = keccak256("REWARDS_DISTRIBUTOR_ROLE");

    // Estructuras
    struct DelegateStats {
        uint256 totalVotes;
        uint256 proposalsCreated;
        uint256 votingStreak;
        uint256 lastVoteBlock;
        uint256 reputationScore;
        uint256 totalRewardsEarned;
        uint256 availableRewards;
        uint256 lastRewardsClaim;
        uint256 multiplier;
        bool hasActiveBonus;
    }

    struct RewardConfig {
        uint256 baseReward;
        uint256 proposalCreationReward;
        uint256 votingStreakBonus;
        uint256 reputationMultiplier;
        uint256 maxMultiplier;
        uint256 minVotesForReward;
        uint256 streakThreshold;
        uint256 bonusDuration;
        uint256 cooldownPeriod;
    }

    struct RewardPeriod {
        uint256 periodId;
        uint256 startBlock;
        uint256 endBlock;
        uint256 totalRewards;
        uint256 distributedRewards;
        bool isFinalized;
    }

    struct RewardEvent {
        uint256 eventId;
        address delegate;
        uint256 amount;
        string rewardType;
        uint256 timestamp;
        uint256 multiplier;
    }

    // Eventos
    event RewardsClaimed(
        address indexed delegate,
        uint256 amount,
        uint256 multiplier,
        string rewardType
    );

    event StreakBonusAchieved(
        address indexed delegate,
        uint256 streak,
        uint256 bonus
    );

    event MultiplierUpdated(
        address indexed delegate,
        uint256 oldMultiplier,
        uint256 newMultiplier,
        string reason
    );

    event RewardPeriodCreated(
        uint256 indexed periodId,
        uint256 startBlock,
        uint256 endBlock,
        uint256 totalRewards
    );

    event RewardPeriodFinalized(
        uint256 indexed periodId,
        uint256 distributedRewards
    );

    event RewardConfigUpdated(
        string parameter,
        uint256 oldValue,
        uint256 newValue
    );

    // Variables de estado
    mapping(address => DelegateStats) public delegateStats;
    mapping(uint256 => RewardPeriod) public rewardPeriods;
    mapping(address => RewardEvent[]) public rewardHistory;
    mapping(address => uint256) public lastParticipationBlock;
    mapping(address => uint256) public bonusExpiryBlock;

    RewardConfig public rewardConfig;
    Counters.Counter private _periodIdCounter;
    Counters.Counter private _eventIdCounter;

    uint256 public constant BLOCKS_PER_DAY = 7200; // ~12 segundos por bloque
    uint256 public constant MAX_STREAK_MULTIPLIER = 300; // 3x
    uint256 public constant BASE_MULTIPLIER = 100; // 1x
    uint256 public constant REPUTATION_DIVISOR = 100;

    constructor(
        uint256 _baseReward,
        uint256 _proposalCreationReward,
        uint256 _votingStreakBonus,
        uint256 _reputationMultiplier,
        uint256 _maxMultiplier,
        uint256 _minVotesForReward,
        uint256 _streakThreshold,
        uint256 _bonusDuration,
        uint256 _cooldownPeriod
    ) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(GOVERNANCE_ROLE, msg.sender);
        _grantRole(REWARDS_DISTRIBUTOR_ROLE, msg.sender);

        rewardConfig = RewardConfig({
            baseReward: _baseReward,
            proposalCreationReward: _proposalCreationReward,
            votingStreakBonus: _votingStreakBonus,
            reputationMultiplier: _reputationMultiplier,
            maxMultiplier: _maxMultiplier,
            minVotesForReward: _minVotesForReward,
            streakThreshold: _streakThreshold,
            bonusDuration: _bonusDuration,
            cooldownPeriod: _cooldownPeriod
        });
    }

    /**
     * @dev Registra participación en votación
     */
    function recordVoteParticipation(
        address delegate,
        uint256 proposalId
    ) external onlyRole(GOVERNANCE_ROLE) whenNotPaused {
        DelegateStats storage stats = delegateStats[delegate];
        
        // Actualizar estadísticas
        stats.totalVotes++;
        stats.lastVoteBlock = block.number;

        // Verificar y actualizar racha
        if (block.number <= lastParticipationBlock[delegate] + BLOCKS_PER_DAY) {
            stats.votingStreak++;
            
            // Verificar bonus por racha
            if (stats.votingStreak >= rewardConfig.streakThreshold && !stats.hasActiveBonus) {
                _activateStreakBonus(delegate);
            }
        } else {
            stats.votingStreak = 1;
            stats.hasActiveBonus = false;
        }

        lastParticipationBlock[delegate] = block.number;

        // Calcular y añadir recompensa base
        uint256 reward = _calculateBaseReward(delegate);
        if (reward > 0) {
            stats.availableRewards = stats.availableRewards.add(reward);
            
            _recordRewardEvent(
                delegate,
                reward,
                "Vote participation",
                stats.multiplier
            );
        }
    }

    /**
     * @dev Registra creación de propuesta
     */
    function recordProposalCreation(
        address delegate
    ) external onlyRole(GOVERNANCE_ROLE) whenNotPaused {
        DelegateStats storage stats = delegateStats[delegate];
        stats.proposalsCreated++;

        uint256 reward = rewardConfig.proposalCreationReward;
        if (stats.hasActiveBonus) {
            reward = reward.mul(stats.multiplier).div(100);
        }

        stats.availableRewards = stats.availableRewards.add(reward);
        
        _recordRewardEvent(
            delegate,
            reward,
            "Proposal creation",
            stats.multiplier
        );
    }

    /**
     * @dev Activa bonus por racha
     */
    function _activateStreakBonus(address delegate) internal {
        DelegateStats storage stats = delegateStats[delegate];
        
        uint256 bonus = rewardConfig.votingStreakBonus;
        stats.hasActiveBonus = true;
        bonusExpiryBlock[delegate] = block.number + rewardConfig.bonusDuration;

        // Actualizar multiplicador
        uint256 oldMultiplier = stats.multiplier;
        stats.multiplier = _calculateMultiplier(delegate);

        emit StreakBonusAchieved(delegate, stats.votingStreak, bonus);
        emit MultiplierUpdated(
            delegate,
            oldMultiplier,
            stats.multiplier,
            "Streak bonus activated"
        );
    }

    /**
     * @dev Calcula recompensa base
     */
    function _calculateBaseReward(
        address delegate
    ) internal view returns (uint256) {
        DelegateStats storage stats = delegateStats[delegate];
        
        if (stats.totalVotes < rewardConfig.minVotesForReward) {
            return 0;
        }

        uint256 baseAmount = rewardConfig.baseReward;
        
        // Aplicar multiplicador
        if (stats.hasActiveBonus && block.number <= bonusExpiryBlock[delegate]) {
            baseAmount = baseAmount.mul(stats.multiplier).div(100);
        }

        return baseAmount;
    }

    /**
     * @dev Calcula multiplicador total
     */
    function _calculateMultiplier(
        address delegate
    ) internal view returns (uint256) {
        DelegateStats storage stats = delegateStats[delegate];
        
        // Base
        uint256 multiplier = BASE_MULTIPLIER;

        // Bonus por racha
        if (stats.votingStreak >= rewardConfig.streakThreshold) {
            uint256 streakBonus = stats.votingStreak.mul(10); // +10% por nivel
            multiplier = multiplier.add(streakBonus);
        }

        // Multiplicador por reputación
        multiplier = multiplier.add(
            stats.reputationScore.mul(rewardConfig.reputationMultiplier).div(REPUTATION_DIVISOR)
        );

        // Limitar al máximo
        return multiplier > rewardConfig.maxMultiplier ? 
            rewardConfig.maxMultiplier : multiplier;
    }

    /**
     * @dev Reclama recompensas disponibles
     */
    function claimRewards() external nonReentrant whenNotPaused {
        DelegateStats storage stats = delegateStats[msg.sender];
        require(stats.availableRewards > 0, "No rewards available");
        require(
            block.number >= stats.lastRewardsClaim + rewardConfig.cooldownPeriod,
            "Cooldown period active"
        );

        uint256 amount = stats.availableRewards;
        stats.availableRewards = 0;
        stats.totalRewardsEarned = stats.totalRewardsEarned.add(amount);
        stats.lastRewardsClaim = block.number;

        // Transferir recompensas
        (bool success,) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");

        emit RewardsClaimed(
            msg.sender,
            amount,
            stats.multiplier,
            "Rewards claim"
        );
    }

    /**
     * @dev Crea nuevo período de recompensas
     */
    function createRewardPeriod(
        uint256 duration,
        uint256 totalRewards
    ) external onlyRole(ADMIN_ROLE) {
        require(duration > 0, "Invalid duration");
        require(totalRewards > 0, "Invalid rewards");

        _periodIdCounter.increment();
        uint256 periodId = _periodIdCounter.current();

        rewardPeriods[periodId] = RewardPeriod({
            periodId: periodId,
            startBlock: block.number,
            endBlock: block.number + duration,
            totalRewards: totalRewards,
            distributedRewards: 0,
            isFinalized: false
        });

        emit RewardPeriodCreated(
            periodId,
            block.number,
            block.number + duration,
            totalRewards
        );
    }

    /**
     * @dev Finaliza período de recompensas
     */
    function finalizeRewardPeriod(
        uint256 periodId
    ) external onlyRole(ADMIN_ROLE) {
        RewardPeriod storage period = rewardPeriods[periodId];
        require(!period.isFinalized, "Period already finalized");
        require(block.number >= period.endBlock, "Period not ended");

        period.isFinalized = true;

        emit RewardPeriodFinalized(periodId, period.distributedRewards);
    }

    /**
     * @dev Registra evento de recompensa
     */
    function _recordRewardEvent(
        address delegate,
        uint256 amount,
        string memory rewardType,
        uint256 multiplier
    ) internal {
        _eventIdCounter.increment();
        uint256 eventId = _eventIdCounter.current();

        rewardHistory[delegate].push(RewardEvent({
            eventId: eventId,
            delegate: delegate,
            amount: amount,
            rewardType: rewardType,
            timestamp: block.timestamp,
            multiplier: multiplier
        }));
    }

    /**
     * @dev Actualiza configuración de recompensas
     */
    function updateRewardConfig(
        uint256 _baseReward,
        uint256 _proposalCreationReward,
        uint256 _votingStreakBonus,
        uint256 _reputationMultiplier,
        uint256 _maxMultiplier,
        uint256 _minVotesForReward,
        uint256 _streakThreshold,
        uint256 _bonusDuration,
        uint256 _cooldownPeriod
    ) external onlyRole(ADMIN_ROLE) {
        RewardConfig memory oldConfig = rewardConfig;

        rewardConfig.baseReward = _baseReward;
        rewardConfig.proposalCreationReward = _proposalCreationReward;
        rewardConfig.votingStreakBonus = _votingStreakBonus;
        rewardConfig.reputationMultiplier = _reputationMultiplier;
        rewardConfig.maxMultiplier = _maxMultiplier;
        rewardConfig.minVotesForReward = _minVotesForReward;
        rewardConfig.streakThreshold = _streakThreshold;
        rewardConfig.bonusDuration = _bonusDuration;
        rewardConfig.cooldownPeriod = _cooldownPeriod;

        emit RewardConfigUpdated("baseReward", oldConfig.baseReward, _baseReward);
        emit RewardConfigUpdated("proposalCreationReward", oldConfig.proposalCreationReward, _proposalCreationReward);
        emit RewardConfigUpdated("votingStreakBonus", oldConfig.votingStreakBonus, _votingStreakBonus);
        emit RewardConfigUpdated("reputationMultiplier", oldConfig.reputationMultiplier, _reputationMultiplier);
        emit RewardConfigUpdated("maxMultiplier", oldConfig.maxMultiplier, _maxMultiplier);
        emit RewardConfigUpdated("minVotesForReward", oldConfig.minVotesForReward, _minVotesForReward);
        emit RewardConfigUpdated("streakThreshold", oldConfig.streakThreshold, _streakThreshold);
        emit RewardConfigUpdated("bonusDuration", oldConfig.bonusDuration, _bonusDuration);
        emit RewardConfigUpdated("cooldownPeriod", oldConfig.cooldownPeriod, _cooldownPeriod);
    }

    /**
     * @dev Actualiza reputación del delegado
     */
    function updateDelegateReputation(
        address delegate,
        uint256 newReputation
    ) external onlyRole(GOVERNANCE_ROLE) {
        DelegateStats storage stats = delegateStats[delegate];
        uint256 oldMultiplier = stats.multiplier;
        
        stats.reputationScore = newReputation;
        stats.multiplier = _calculateMultiplier(delegate);

        emit MultiplierUpdated(
            delegate,
            oldMultiplier,
            stats.multiplier,
            "Reputation updated"
        );
    }

    // Getters
    function getDelegateStats(
        address delegate
    ) external view returns (DelegateStats memory) {
        return delegateStats[delegate];
    }

    function getRewardPeriod(
        uint256 periodId
    ) external view returns (RewardPeriod memory) {
        return rewardPeriods[periodId];
    }

    function getRewardHistory(
        address delegate
    ) external view returns (RewardEvent[] memory) {
        return rewardHistory[delegate];
    }

    function getCurrentMultiplier(
        address delegate
    ) external view returns (uint256) {
        return _calculateMultiplier(delegate);
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

    /**
     * @dev Recibe ETH
     */
    receive() external payable {}
} 