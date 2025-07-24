// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../core/BrainSafesArbitrum.sol";
import "../utils/SecurityManager.sol";

/**
 * @title EnhancedStaking
 * @dev Sistema de staking mejorado para BrainSafes
 * @custom:security-contact security@brainsafes.com
 */
contract EnhancedStaking is AccessControl, Pausable, ReentrancyGuard {
    // Roles
    bytes32 public constant STAKING_MANAGER = keccak256("STAKING_MANAGER");
    bytes32 public constant REWARDS_MANAGER = keccak256("REWARDS_MANAGER");

    // Estructuras
    struct StakingPool {
        uint256 id;
        string name;
        uint256 minStakeAmount;
        uint256 maxStakeAmount;
        uint256 lockPeriod;
        uint256 baseAPR;
        uint256 bonusAPR;
        uint256 totalStaked;
        uint256 participantCount;
        bool isActive;
        mapping(address => StakeInfo) stakes;
        mapping(uint256 => Milestone) milestones;
        uint256 milestoneCount;
    }

    struct StakeInfo {
        uint256 amount;
        uint256 startTime;
        uint256 endTime;
        uint256 lastClaimTime;
        uint256 accumulatedRewards;
        bool isActive;
        uint256[] completedMilestones;
        uint256 bonusMultiplier;
        StakingTier tier;
    }

    struct Milestone {
        uint256 threshold;
        uint256 bonus;
        string description;
        bool isActive;
    }

    struct RewardBooster {
        string name;
        uint256 multiplier;
        uint256 duration;
        uint256 cost;
        bool isActive;
    }

    // Enums
    enum StakingTier { 
        Bronze,
        Silver,
        Gold,
        Platinum,
        Diamond
    }

    // Mappings
    mapping(uint256 => StakingPool) public stakingPools;
    mapping(address => uint256[]) public userPools;
    mapping(string => RewardBooster) public boosters;
    mapping(address => mapping(string => uint256)) public userBoosters;

    // Contadores
    uint256 private poolCounter;
    uint256 private boosterCounter;

    // Referencias a otros contratos
    BrainSafesArbitrum public brainSafes;
    SecurityManager public securityManager;
    IERC20 public eduToken;

    // Constantes
    uint256 public constant MIN_LOCK_PERIOD = 7 days;
    uint256 public constant MAX_LOCK_PERIOD = 365 days;
    uint256 public constant MAX_APR = 5000; // 50%
    uint256 public constant TIER_THRESHOLD_MULTIPLIER = 2;
    uint256 public constant CLAIM_COOLDOWN = 1 days;

    // Eventos
    event PoolCreated(uint256 indexed poolId, string name, uint256 baseAPR);
    event Staked(address indexed user, uint256 indexed poolId, uint256 amount);
    event Unstaked(address indexed user, uint256 indexed poolId, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 indexed poolId, uint256 amount);
    event MilestoneCompleted(address indexed user, uint256 indexed poolId, uint256 milestoneId);
    event TierUpgraded(address indexed user, uint256 indexed poolId, StakingTier newTier);
    event BoosterActivated(address indexed user, string boosterName, uint256 duration);
    event PoolUpdated(uint256 indexed poolId, uint256 newAPR);

    /**
     * @dev Constructor
     */
    constructor(
        address _brainSafes,
        address _securityManager,
        address _eduToken
    ) {
        require(_brainSafes != address(0), "Invalid BrainSafes address");
        require(_securityManager != address(0), "Invalid SecurityManager address");
        require(_eduToken != address(0), "Invalid EDU token address");

        brainSafes = BrainSafesArbitrum(_brainSafes);
        securityManager = SecurityManager(_securityManager);
        eduToken = IERC20(_eduToken);

        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(STAKING_MANAGER, msg.sender);
    }

    /**
     * @dev Crear nuevo pool de staking
     */
    function createStakingPool(
        string memory name,
        uint256 minStakeAmount,
        uint256 maxStakeAmount,
        uint256 lockPeriod,
        uint256 baseAPR,
        uint256 bonusAPR
    ) external onlyRole(STAKING_MANAGER) whenNotPaused {
        require(bytes(name).length > 0, "Invalid name");
        require(minStakeAmount > 0, "Invalid min stake");
        require(maxStakeAmount > minStakeAmount, "Invalid max stake");
        require(lockPeriod >= MIN_LOCK_PERIOD, "Lock period too short");
        require(lockPeriod <= MAX_LOCK_PERIOD, "Lock period too long");
        require(baseAPR + bonusAPR <= MAX_APR, "APR too high");

        poolCounter++;
        
        StakingPool storage pool = stakingPools[poolCounter];
        pool.id = poolCounter;
        pool.name = name;
        pool.minStakeAmount = minStakeAmount;
        pool.maxStakeAmount = maxStakeAmount;
        pool.lockPeriod = lockPeriod;
        pool.baseAPR = baseAPR;
        pool.bonusAPR = bonusAPR;
        pool.isActive = true;

        emit PoolCreated(poolCounter, name, baseAPR);
    }

    /**
     * @dev Hacer stake de tokens
     */
    function stake(
        uint256 poolId,
        uint256 amount
    ) external whenNotPaused nonReentrant {
        StakingPool storage pool = stakingPools[poolId];
        require(pool.isActive, "Pool not active");
        require(amount >= pool.minStakeAmount, "Amount below minimum");
        require(amount <= pool.maxStakeAmount, "Amount above maximum");

        // Transferir tokens
        require(
            eduToken.transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );

        StakeInfo storage userStake = pool.stakes[msg.sender];
        
        if (!userStake.isActive) {
            userStake.startTime = block.timestamp;
            userStake.lastClaimTime = block.timestamp;
            userStake.isActive = true;
            userStake.bonusMultiplier = 100; // 1x
            userStake.tier = StakingTier.Bronze;
            pool.participantCount++;
            userPools[msg.sender].push(poolId);
        }

        userStake.amount += amount;
        userStake.endTime = block.timestamp + pool.lockPeriod;
        pool.totalStaked += amount;

        // Actualizar tier si corresponde
        _checkAndUpdateTier(poolId, msg.sender);

        emit Staked(msg.sender, poolId, amount);
    }

    /**
     * @dev Retirar tokens en stake
     */
    function unstake(
        uint256 poolId,
        uint256 amount
    ) external whenNotPaused nonReentrant {
        StakingPool storage pool = stakingPools[poolId];
        StakeInfo storage userStake = pool.stakes[msg.sender];
        
        require(userStake.isActive, "No active stake");
        require(amount <= userStake.amount, "Insufficient stake");
        require(block.timestamp >= userStake.endTime, "Lock period active");

        // Reclamar recompensas pendientes
        _claimRewards(poolId, msg.sender);

        userStake.amount -= amount;
        pool.totalStaked -= amount;

        if (userStake.amount == 0) {
            userStake.isActive = false;
            pool.participantCount--;
        }

        // Transferir tokens
        require(
            eduToken.transfer(msg.sender, amount),
            "Transfer failed"
        );

        emit Unstaked(msg.sender, poolId, amount);
    }

    /**
     * @dev Reclamar recompensas
     */
    function claimRewards(uint256 poolId) external whenNotPaused nonReentrant {
        require(
            block.timestamp >= stakingPools[poolId].stakes[msg.sender].lastClaimTime + CLAIM_COOLDOWN,
            "Claim cooldown active"
        );

        uint256 rewards = _claimRewards(poolId, msg.sender);
        require(rewards > 0, "No rewards to claim");

        stakingPools[poolId].stakes[msg.sender].lastClaimTime = block.timestamp;

        // Transferir recompensas
        require(
            eduToken.transfer(msg.sender, rewards),
            "Reward transfer failed"
        );

        emit RewardsClaimed(msg.sender, poolId, rewards);
    }

    /**
     * @dev Calcular recompensas pendientes
     */
    function _claimRewards(
        uint256 poolId,
        address user
    ) internal returns (uint256) {
        StakingPool storage pool = stakingPools[poolId];
        StakeInfo storage stake = pool.stakes[user];
        
        if (!stake.isActive || stake.amount == 0) {
            return 0;
        }

        uint256 timeElapsed = block.timestamp - stake.lastClaimTime;
        uint256 baseReward = (stake.amount * pool.baseAPR * timeElapsed) / (365 days * 10000);
        
        // Aplicar multiplicadores
        uint256 tierMultiplier = _getTierMultiplier(stake.tier);
        uint256 totalReward = (baseReward * tierMultiplier * stake.bonusMultiplier) / 10000;

        stake.accumulatedRewards += totalReward;
        
        return totalReward;
    }

    /**
     * @dev Verificar y actualizar tier
     */
    function _checkAndUpdateTier(uint256 poolId, address user) internal {
        StakingPool storage pool = stakingPools[poolId];
        StakeInfo storage stake = pool.stakes[user];

        uint256 requiredAmount = pool.minStakeAmount;
        StakingTier newTier = StakingTier.Bronze;

        // Calcular tier basado en cantidad stakeada
        for (uint256 i = 0; i <= uint256(StakingTier.Diamond); i++) {
            if (stake.amount >= requiredAmount) {
                newTier = StakingTier(i);
            }
            requiredAmount *= TIER_THRESHOLD_MULTIPLIER;
        }

        if (newTier > stake.tier) {
            stake.tier = newTier;
            emit TierUpgraded(user, poolId, newTier);
        }
    }

    /**
     * @dev Obtener multiplicador de tier
     */
    function _getTierMultiplier(StakingTier tier) internal pure returns (uint256) {
        if (tier == StakingTier.Diamond) return 200; // 2x
        if (tier == StakingTier.Platinum) return 175; // 1.75x
        if (tier == StakingTier.Gold) return 150; // 1.5x
        if (tier == StakingTier.Silver) return 125; // 1.25x
        return 100; // 1x para Bronze
    }

    /**
     * @dev Crear booster de recompensas
     */
    function createRewardBooster(
        string memory name,
        uint256 multiplier,
        uint256 duration,
        uint256 cost
    ) external onlyRole(REWARDS_MANAGER) whenNotPaused {
        require(bytes(name).length > 0, "Invalid name");
        require(multiplier > 100, "Invalid multiplier");
        require(duration > 0, "Invalid duration");
        require(cost > 0, "Invalid cost");
        require(!boosters[name].isActive, "Booster exists");

        boosters[name] = RewardBooster({
            name: name,
            multiplier: multiplier,
            duration: duration,
            cost: cost,
            isActive: true
        });

        emit BoosterActivated(msg.sender, name, duration);
    }

    /**
     * @dev Activar booster
     */
    function activateBooster(string memory boosterName) external whenNotPaused nonReentrant {
        RewardBooster storage booster = boosters[boosterName];
        require(booster.isActive, "Booster not active");
        require(
            eduToken.transferFrom(msg.sender, address(this), booster.cost),
            "Booster payment failed"
        );

        userBoosters[msg.sender][boosterName] = block.timestamp + booster.duration;

        emit BoosterActivated(msg.sender, boosterName, booster.duration);
    }

    /**
     * @dev Añadir milestone a pool
     */
    function addPoolMilestone(
        uint256 poolId,
        uint256 threshold,
        uint256 bonus,
        string memory description
    ) external onlyRole(STAKING_MANAGER) whenNotPaused {
        StakingPool storage pool = stakingPools[poolId];
        require(pool.isActive, "Pool not active");

        pool.milestoneCount++;
        pool.milestones[pool.milestoneCount] = Milestone({
            threshold: threshold,
            bonus: bonus,
            description: description,
            isActive: true
        });
    }

    /**
     * @dev Actualizar APR de pool
     */
    function updatePoolAPR(
        uint256 poolId,
        uint256 newBaseAPR,
        uint256 newBonusAPR
    ) external onlyRole(STAKING_MANAGER) whenNotPaused {
        require(newBaseAPR + newBonusAPR <= MAX_APR, "APR too high");
        
        StakingPool storage pool = stakingPools[poolId];
        pool.baseAPR = newBaseAPR;
        pool.bonusAPR = newBonusAPR;

        emit PoolUpdated(poolId, newBaseAPR);
    }

    /**
     * @dev Obtener información de stake
     */
    function getStakeInfo(
        uint256 poolId,
        address user
    ) external view returns (
        uint256 amount,
        uint256 startTime,
        uint256 endTime,
        uint256 accumulatedRewards,
        StakingTier tier,
        uint256 bonusMultiplier,
        bool isActive
    ) {
        StakeInfo storage stake = stakingPools[poolId].stakes[user];
        return (
            stake.amount,
            stake.startTime,
            stake.endTime,
            stake.accumulatedRewards,
            stake.tier,
            stake.bonusMultiplier,
            stake.isActive
        );
    }

    /**
     * @dev Obtener pools de usuario
     */
    function getUserPools(address user) external view returns (uint256[] memory) {
        return userPools[user];
    }

    /**
     * @dev Calcular recompensas pendientes
     */
    function getPendingRewards(
        uint256 poolId,
        address user
    ) external view returns (uint256) {
        StakingPool storage pool = stakingPools[poolId];
        StakeInfo storage stake = pool.stakes[user];
        
        if (!stake.isActive || stake.amount == 0) {
            return 0;
        }

        uint256 timeElapsed = block.timestamp - stake.lastClaimTime;
        uint256 baseReward = (stake.amount * pool.baseAPR * timeElapsed) / (365 days * 10000);
        
        uint256 tierMultiplier = _getTierMultiplier(stake.tier);
        return (baseReward * tierMultiplier * stake.bonusMultiplier) / 10000;
    }

    /**
     * @dev Pausar el contrato
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /**
     * @dev Reanudar el contrato
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
} 