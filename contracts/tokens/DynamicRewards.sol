// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../core/BrainSafesArbitrum.sol";
import "../utils/SecurityManager.sol";

/**
 * @title DynamicRewards
 * @dev Sistema de recompensas dinámico para BrainSafes
 * @custom:security-contact security@brainsafes.com
 */
contract DynamicRewards is AccessControl, Pausable, ReentrancyGuard {
    // Roles
    bytes32 public constant REWARDS_MANAGER = keccak256("REWARDS_MANAGER");
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");

    // Estructuras
    struct RewardProgram {
        uint256 id;
        string name;
        string description;
        uint256 budget;
        uint256 distributed;
        uint256 participantCount;
        RewardType rewardType;
        DistributionStrategy strategy;
        uint256 startTime;
        uint256 endTime;
        bool isActive;
        mapping(address => UserParticipation) participants;
    }

    struct UserParticipation {
        uint256 points;
        uint256 rewards;
        uint256 lastAction;
        uint256 multiplier;
        uint256[] achievements;
        bool isActive;
    }

    struct RewardFormula {
        uint256 baseAmount;
        uint256 multiplier;
        uint256 bonusThreshold;
        uint256 maxBonus;
        string[] conditions;
        bool isActive;
    }

    struct ActivityLog {
        address user;
        string activity;
        uint256 points;
        uint256 timestamp;
        bool rewarded;
    }

    // Enums
    enum RewardType {
        Fixed,
        Progressive,
        Competitive,
        Milestone
    }

    enum DistributionStrategy {
        Immediate,
        Periodic,
        Threshold,
        RankBased
    }

    // Mappings
    mapping(uint256 => RewardProgram) public rewardPrograms;
    mapping(string => RewardFormula) public rewardFormulas;
    mapping(address => uint256[]) public userPrograms;
    mapping(uint256 => ActivityLog[]) public programActivities;

    // Contadores
    uint256 private programCounter;
    uint256 private activityCounter;

    // Referencias a otros contratos
    BrainSafesArbitrum public brainSafes;
    SecurityManager public securityManager;
    IERC20 public eduToken;

    // Constantes
    uint256 public constant MIN_PROGRAM_DURATION = 1 days;
    uint256 public constant MAX_PROGRAM_DURATION = 365 days;
    uint256 public constant MAX_MULTIPLIER = 500; // 5x
    uint256 public constant POINTS_DECAY_RATE = 5; // 5% por día

    // Eventos
    event ProgramCreated(uint256 indexed programId, string name, uint256 budget);
    event UserJoined(uint256 indexed programId, address indexed user);
    event PointsEarned(uint256 indexed programId, address indexed user, uint256 points);
    event RewardsDistributed(uint256 indexed programId, address indexed user, uint256 amount);
    event FormulaCreated(string indexed name, uint256 baseAmount);
    event ActivityLogged(uint256 indexed programId, address indexed user, string activity);
    event MultiplierUpdated(uint256 indexed programId, address indexed user, uint256 multiplier);

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
        _setupRole(REWARDS_MANAGER, msg.sender);
    }

    /**
     * @dev Crear nuevo programa de recompensas
     */
    function createRewardProgram(
        string memory name,
        string memory description,
        uint256 budget,
        RewardType rewardType,
        DistributionStrategy strategy,
        uint256 duration
    ) external onlyRole(REWARDS_MANAGER) whenNotPaused {
        require(bytes(name).length > 0, "Invalid name");
        require(budget > 0, "Invalid budget");
        require(duration >= MIN_PROGRAM_DURATION, "Duration too short");
        require(duration <= MAX_PROGRAM_DURATION, "Duration too long");

        programCounter++;
        
        RewardProgram storage program = rewardPrograms[programCounter];
        program.id = programCounter;
        program.name = name;
        program.description = description;
        program.budget = budget;
        program.rewardType = rewardType;
        program.strategy = strategy;
        program.startTime = block.timestamp;
        program.endTime = block.timestamp + duration;
        program.isActive = true;

        emit ProgramCreated(programCounter, name, budget);
    }

    /**
     * @dev Unirse a programa de recompensas
     */
    function joinProgram(uint256 programId) external whenNotPaused {
        RewardProgram storage program = rewardPrograms[programId];
        require(program.isActive, "Program not active");
        require(block.timestamp < program.endTime, "Program ended");
        require(!program.participants[msg.sender].isActive, "Already joined");

        program.participants[msg.sender] = UserParticipation({
            points: 0,
            rewards: 0,
            lastAction: block.timestamp,
            multiplier: 100, // 1x
            achievements: new uint256[](0),
            isActive: true
        });

        program.participantCount++;
        userPrograms[msg.sender].push(programId);

        emit UserJoined(programId, msg.sender);
    }

    /**
     * @dev Registrar actividad y otorgar puntos
     */
    function logActivity(
        uint256 programId,
        address user,
        string memory activity,
        uint256 points
    ) external onlyRole(ORACLE_ROLE) whenNotPaused {
        RewardProgram storage program = rewardPrograms[programId];
        require(program.isActive, "Program not active");
        require(program.participants[user].isActive, "User not in program");

        UserParticipation storage participation = program.participants[user];
        
        // Aplicar decay a puntos existentes
        uint256 daysPassed = (block.timestamp - participation.lastAction) / 1 days;
        if (daysPassed > 0) {
            participation.points = participation.points * 
                (100 - POINTS_DECAY_RATE * daysPassed) / 100;
        }

        // Añadir nuevos puntos con multiplicador
        uint256 adjustedPoints = (points * participation.multiplier) / 100;
        participation.points += adjustedPoints;
        participation.lastAction = block.timestamp;

        // Registrar actividad
        programActivities[programId].push(ActivityLog({
            user: user,
            activity: activity,
            points: adjustedPoints,
            timestamp: block.timestamp,
            rewarded: false
        }));

        emit PointsEarned(programId, user, adjustedPoints);
        emit ActivityLogged(programId, user, activity);

        // Distribuir recompensas si corresponde
        if (program.strategy == DistributionStrategy.Immediate) {
            _distributeRewards(programId, user);
        }
    }

    /**
     * @dev Distribuir recompensas
     */
    function _distributeRewards(
        uint256 programId,
        address user
    ) internal {
        RewardProgram storage program = rewardPrograms[programId];
        UserParticipation storage participation = program.participants[user];
        
        if (participation.points == 0 || program.distributed >= program.budget) {
            return;
        }

        uint256 reward = _calculateReward(program, participation);
        if (reward == 0) {
            return;
        }

        // Actualizar estado
        participation.rewards += reward;
        program.distributed += reward;
        participation.points = 0; // Reset points after reward

        // Transferir tokens
        require(
            eduToken.transfer(user, reward),
            "Reward transfer failed"
        );

        emit RewardsDistributed(programId, user, reward);
    }

    /**
     * @dev Calcular recompensa
     */
    function _calculateReward(
        RewardProgram storage program,
        UserParticipation storage participation
    ) internal view returns (uint256) {
        if (program.rewardType == RewardType.Fixed) {
            return participation.points;
        } else if (program.rewardType == RewardType.Progressive) {
            return (participation.points * participation.multiplier) / 100;
        } else if (program.rewardType == RewardType.Competitive) {
            return _calculateCompetitiveReward(program, participation);
        } else {
            return _calculateMilestoneReward(program, participation);
        }
    }

    /**
     * @dev Calcular recompensa competitiva
     */
    function _calculateCompetitiveReward(
        RewardProgram storage program,
        UserParticipation storage participation
    ) internal view returns (uint256) {
        if (program.participantCount == 0) return 0;
        
        uint256 averagePoints = program.distributed / program.participantCount;
        if (participation.points <= averagePoints) {
            return participation.points;
        } else {
            uint256 bonus = (participation.points - averagePoints) * 50 / 100; // 50% bonus
            return participation.points + bonus;
        }
    }

    /**
     * @dev Calcular recompensa por milestone
     */
    function _calculateMilestoneReward(
        RewardProgram storage program,
        UserParticipation storage participation
    ) internal view returns (uint256) {
        uint256 baseReward = participation.points;
        
        // Bonus por logros completados
        if (participation.achievements.length > 0) {
            baseReward += (baseReward * participation.achievements.length * 10) / 100;
        }
        
        return baseReward;
    }

    /**
     * @dev Crear fórmula de recompensa
     */
    function createRewardFormula(
        string memory name,
        uint256 baseAmount,
        uint256 multiplier,
        uint256 bonusThreshold,
        uint256 maxBonus,
        string[] memory conditions
    ) external onlyRole(REWARDS_MANAGER) whenNotPaused {
        require(bytes(name).length > 0, "Invalid name");
        require(baseAmount > 0, "Invalid base amount");
        require(multiplier <= MAX_MULTIPLIER, "Multiplier too high");
        require(!rewardFormulas[name].isActive, "Formula exists");

        rewardFormulas[name] = RewardFormula({
            baseAmount: baseAmount,
            multiplier: multiplier,
            bonusThreshold: bonusThreshold,
            maxBonus: maxBonus,
            conditions: conditions,
            isActive: true
        });

        emit FormulaCreated(name, baseAmount);
    }

    /**
     * @dev Actualizar multiplicador de usuario
     */
    function updateUserMultiplier(
        uint256 programId,
        address user,
        uint256 newMultiplier
    ) external onlyRole(REWARDS_MANAGER) whenNotPaused {
        require(newMultiplier <= MAX_MULTIPLIER, "Multiplier too high");
        
        RewardProgram storage program = rewardPrograms[programId];
        require(program.participants[user].isActive, "User not in program");

        program.participants[user].multiplier = newMultiplier;

        emit MultiplierUpdated(programId, user, newMultiplier);
    }

    /**
     * @dev Distribuir recompensas periódicas
     */
    function distributePeriodicRewards(uint256 programId) external whenNotPaused {
        RewardProgram storage program = rewardPrograms[programId];
        require(program.strategy == DistributionStrategy.Periodic, "Invalid strategy");
        require(program.isActive, "Program not active");

        uint256[] memory userList = _getActiveUsers(programId);
        for (uint256 i = 0; i < userList.length; i++) {
            _distributeRewards(programId, userList[i]);
        }
    }

    /**
     * @dev Obtener usuarios activos
     */
    function _getActiveUsers(uint256 programId) internal view returns (uint256[] memory) {
        return userPrograms[msg.sender];
    }

    /**
     * @dev Obtener información de participación
     */
    function getUserParticipation(
        uint256 programId,
        address user
    ) external view returns (
        uint256 points,
        uint256 rewards,
        uint256 lastAction,
        uint256 multiplier,
        uint256[] memory achievements,
        bool isActive
    ) {
        UserParticipation storage participation = rewardPrograms[programId].participants[user];
        return (
            participation.points,
            participation.rewards,
            participation.lastAction,
            participation.multiplier,
            participation.achievements,
            participation.isActive
        );
    }

    /**
     * @dev Obtener actividades de programa
     */
    function getProgramActivities(
        uint256 programId,
        uint256 limit
    ) external view returns (ActivityLog[] memory) {
        ActivityLog[] storage activities = programActivities[programId];
        uint256 count = activities.length < limit ? activities.length : limit;
        
        ActivityLog[] memory result = new ActivityLog[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = activities[activities.length - 1 - i];
        }
        
        return result;
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