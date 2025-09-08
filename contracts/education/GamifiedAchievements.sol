// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "../core/BrainSafesArbitrum.sol";
import "../utils/SecurityManager.sol";


contract GamifiedAchievements is AccessControl, Pausable, ReentrancyGuard, ERC1155 {
    // Roles
    bytes32 public constant ACHIEVEMENT_MANAGER = keccak256("ACHIEVEMENT_MANAGER");
    bytes32 public constant GAME_MASTER = keccak256("GAME_MASTER");

    // Estructuras
    struct Achievement {
        uint256 id;
        string name;
        string description;
        string category;
        uint256 points;
        uint256 requiredScore;
        string[] prerequisites;
        string badgeURI;
        bool isActive;
        uint256 rarity;      // 1: Common, 2: Uncommon, 3: Rare, 4: Epic, 5: Legendary
        uint256 maxSupply;
        uint256 currentSupply;
    }

    struct UserProgress {
        uint256 totalPoints;
        uint256 level;
        uint256 experience;
        uint256[] unlockedAchievements;
        uint256 lastActivity;
        uint256[] activeChallenges;
        mapping(string => uint256) categoryProgress;
        bool hasProfile;
    }

    struct Challenge {
        uint256 id;
        string name;
        string description;
        uint256 requiredProgress;
        uint256 reward;
        uint256 deadline;
        bool isActive;
        string[] requirements;
    }

    struct Leaderboard {
        address[] topUsers;
        uint256[] topScores;
        uint256 lastUpdated;
    }

    // Mappings
    mapping(uint256 => Achievement) public achievements;
    mapping(address => UserProgress) public userProgress;
    mapping(uint256 => Challenge) public challenges;
    mapping(string => Leaderboard) public leaderboards;
    mapping(uint256 => mapping(address => bool)) public achievementUnlocked;
    mapping(uint256 => mapping(address => uint256)) public challengeProgress;
    mapping(address => uint256) public userRank;

    // Contadores
    uint256 private achievementCounter;
    uint256 private challengeCounter;

    // Referencias a otros contratos
    BrainSafesArbitrum public brainSafes;
    SecurityManager public securityManager;

    // Constantes
    uint256 public constant POINTS_PER_LEVEL = 1000;
    uint256 public constant MAX_LEVEL = 100;
    uint256 public constant LEADERBOARD_SIZE = 100;

    // Eventos
    event AchievementCreated(uint256 indexed id, string name, uint256 points);
    event AchievementUnlocked(address indexed user, uint256 indexed achievementId, uint256 points);
    event ChallengeCreated(uint256 indexed id, string name, uint256 reward);
    event ChallengeCompleted(address indexed user, uint256 indexed challengeId, uint256 reward);
    event LevelUp(address indexed user, uint256 newLevel, uint256 totalPoints);
    event LeaderboardUpdated(string category, address[] topUsers);
    event BadgeAwarded(address indexed user, uint256 indexed achievementId, uint256 rarity);
    event ProgressUpdated(address indexed user, string category, uint256 progress);

    
    constructor(
        address _brainSafes,
        address _securityManager,
        string memory _uri
    ) ERC1155(_uri) {
        require(_brainSafes != address(0), "Invalid BrainSafes address");
        require(_securityManager != address(0), "Invalid SecurityManager address");

        brainSafes = BrainSafesArbitrum(_brainSafes);
        securityManager = SecurityManager(_securityManager);

        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(GAME_MASTER, msg.sender);
    }

    
    function createAchievement(
        string memory name,
        string memory description,
        string memory category,
        uint256 points,
        uint256 requiredScore,
        string[] memory prerequisites,
        string memory badgeURI,
        uint256 rarity,
        uint256 maxSupply
    ) external onlyRole(ACHIEVEMENT_MANAGER) whenNotPaused {
        require(points > 0, "Invalid points");
        require(rarity >= 1 && rarity <= 5, "Invalid rarity");
        require(maxSupply > 0, "Invalid supply");

        achievementCounter++;
        
        achievements[achievementCounter] = Achievement({
            id: achievementCounter,
            name: name,
            description: description,
            category: category,
            points: points,
            requiredScore: requiredScore,
            prerequisites: prerequisites,
            badgeURI: badgeURI,
            isActive: true,
            rarity: rarity,
            maxSupply: maxSupply,
            currentSupply: 0
        });

        emit AchievementCreated(achievementCounter, name, points);
    }

    
    function createChallenge(
        string memory name,
        string memory description,
        uint256 requiredProgress,
        uint256 reward,
        uint256 deadline,
        string[] memory requirements
    ) external onlyRole(GAME_MASTER) whenNotPaused {
        require(reward > 0, "Invalid reward");
        require(deadline > block.timestamp, "Invalid deadline");

        challengeCounter++;
        
        challenges[challengeCounter] = Challenge({
            id: challengeCounter,
            name: name,
            description: description,
            requiredProgress: requiredProgress,
            reward: reward,
            deadline: deadline,
            isActive: true,
            requirements: requirements
        });

        emit ChallengeCreated(challengeCounter, name, reward);
    }

    
    function unlockAchievement(
        address user,
        uint256 achievementId
    ) external onlyRole(GAME_MASTER) whenNotPaused nonReentrant {
        require(achievements[achievementId].isActive, "Achievement not active");
        require(!achievementUnlocked[achievementId][user], "Already unlocked");
        require(achievements[achievementId].currentSupply < achievements[achievementId].maxSupply, "Supply exceeded");

        Achievement storage achievement = achievements[achievementId];
        UserProgress storage progress = userProgress[user];

        // Verificar prerrequisitos
        for (uint256 i = 0; i < achievement.prerequisites.length; i++) {
            require(
                progress.categoryProgress[achievement.prerequisites[i]] >= achievement.requiredScore,
                "Prerequisites not met"
            );
        }

        // Actualizar progreso
        progress.totalPoints += achievement.points;
        progress.unlockedAchievements.push(achievementId);
        progress.lastActivity = block.timestamp;
        achievement.currentSupply++;

        // Mintear badge NFT
        _mint(user, achievementId, 1, "");

        // Actualizar nivel
        _updateLevel(user);

        // Actualizar leaderboard
        _updateLeaderboard(achievement.category, user, progress.totalPoints);

        emit AchievementUnlocked(user, achievementId, achievement.points);
        emit BadgeAwarded(user, achievementId, achievement.rarity);
    }

    
    function updateChallengeProgress(
        address user,
        uint256 challengeId,
        uint256 progress
    ) external onlyRole(GAME_MASTER) whenNotPaused {
        Challenge storage challenge = challenges[challengeId];
        require(challenge.isActive, "Challenge not active");
        require(block.timestamp < challenge.deadline, "Challenge expired");

        challengeProgress[challengeId][user] = progress;

        // Verificar completitud
        if (progress >= challenge.requiredProgress) {
            _completeChallenge(user, challengeId);
        }

        emit ProgressUpdated(user, challenge.name, progress);
    }

    
    function _completeChallenge(address user, uint256 challengeId) internal {
        Challenge storage challenge = challenges[challengeId];
        UserProgress storage progress = userProgress[user];

        // Otorgar recompensa
        progress.totalPoints += challenge.reward;
        progress.lastActivity = block.timestamp;

        // Actualizar nivel
        _updateLevel(user);

        emit ChallengeCompleted(user, challengeId, challenge.reward);
    }

    
    function _updateLevel(address user) internal {
        UserProgress storage progress = userProgress[user];
        uint256 newLevel = progress.totalPoints / POINTS_PER_LEVEL;
        
        if (newLevel > progress.level && newLevel <= MAX_LEVEL) {
            progress.level = newLevel;
            emit LevelUp(user, newLevel, progress.totalPoints);
        }
    }

    
    function _updateLeaderboard(
        string memory category,
        address user,
        uint256 score
    ) internal {
        Leaderboard storage board = leaderboards[category];
        
        // Inicializar si es necesario
        if (board.topUsers.length == 0) {
            board.topUsers = new address[](LEADERBOARD_SIZE);
            board.topScores = new uint256[](LEADERBOARD_SIZE);
        }

        // Encontrar posición
        uint256 position = LEADERBOARD_SIZE;
        for (uint256 i = 0; i < LEADERBOARD_SIZE; i++) {
            if (score > board.topScores[i]) {
                position = i;
                break;
            }
        }

        // Actualizar leaderboard
        if (position < LEADERBOARD_SIZE) {
            for (uint256 i = LEADERBOARD_SIZE - 1; i > position; i--) {
                board.topUsers[i] = board.topUsers[i - 1];
                board.topScores[i] = board.topScores[i - 1];
            }
            board.topUsers[position] = user;
            board.topScores[position] = score;
            board.lastUpdated = block.timestamp;

            emit LeaderboardUpdated(category, board.topUsers);
        }
    }

    
    function getUserAchievements(address user) external view returns (uint256[] memory) {
        return userProgress[user].unlockedAchievements;
    }

    
    function getUserProgress(address user) external view returns (
        uint256 totalPoints,
        uint256 level,
        uint256 experience,
        uint256 achievementCount,
        uint256 lastActivity
    ) {
        UserProgress storage progress = userProgress[user];
        return (
            progress.totalPoints,
            progress.level,
            progress.experience,
            progress.unlockedAchievements.length,
            progress.lastActivity
        );
    }

    
    function getLeaderboard(string memory category) external view returns (
        address[] memory users,
        uint256[] memory scores,
        uint256 lastUpdated
    ) {
        Leaderboard storage board = leaderboards[category];
        return (board.topUsers, board.topScores, board.lastUpdated);
    }

    
    function checkAchievementEligibility(
        address user,
        uint256 achievementId
    ) external view returns (bool eligible, string memory reason) {
        Achievement storage achievement = achievements[achievementId];
        UserProgress storage progress = userProgress[user];

        if (!achievement.isActive) {
            return (false, "Achievement not active");
        }
        if (achievementUnlocked[achievementId][user]) {
            return (false, "Already unlocked");
        }
        if (achievement.currentSupply >= achievement.maxSupply) {
            return (false, "Supply exceeded");
        }

        for (uint256 i = 0; i < achievement.prerequisites.length; i++) {
            if (progress.categoryProgress[achievement.prerequisites[i]] < achievement.requiredScore) {
                return (false, "Prerequisites not met");
            }
        }

        return (true, "Eligible");
    }

    
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    
    function supportsInterface(
        bytes4 interfaceId
    ) public view override(AccessControl, ERC1155) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
} 