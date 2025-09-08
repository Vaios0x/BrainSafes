// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "../core/BrainSafesArbitrum.sol";
import "../utils/SecurityManager.sol";


contract AchievementNFT is ERC1155, AccessControl, Pausable, ReentrancyGuard {
    // Roles
    bytes32 public constant ACHIEVEMENT_MANAGER = keccak256("ACHIEVEMENT_MANAGER");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    // Estructuras
    struct Achievement {
        uint256 id;
        string name;
        string description;
        string category;
        uint256 points;
        uint256 maxSupply;
        uint256 currentSupply;
        AchievementRarity rarity;
        string[] requirements;
        string[] rewards;
        string metadataURI;
        bool isActive;
        mapping(address => bool) earned;
    }

    struct UserAchievements {
        uint256[] achievementIds;
        uint256 totalPoints;
        uint256 lastEarned;
        uint256[] rarityCount; // Count by rarity level
        string[] badges;
        uint256 rank;
    }

    struct Collection {
        uint256 id;
        string name;
        string description;
        uint256[] achievementIds;
        uint256 requiredCount;
        string specialReward;
        bool isActive;
        mapping(address => bool) completed;
    }

    // Enums
    enum AchievementRarity {
        Common,
        Uncommon,
        Rare,
        Epic,
        Legendary
    }

    // Mappings
    mapping(uint256 => Achievement) public achievements;
    mapping(address => UserAchievements) public userAchievements;
    mapping(uint256 => Collection) public collections;
    mapping(string => uint256) public categoryPoints;
    mapping(address => mapping(string => uint256)) public userCategoryProgress;

    // Contadores
    uint256 private achievementCounter;
    uint256 private collectionCounter;

    // Referencias a otros contratos
    BrainSafesArbitrum public brainSafes;
    SecurityManager public securityManager;

    // Constantes
    uint256 public constant MAX_ACHIEVEMENTS = 1000;
    uint256 public constant MAX_COLLECTIONS = 100;
    uint256[] public RARITY_MULTIPLIERS = [100, 200, 400, 800, 1600]; // 1x-16x

    // Eventos
    event AchievementCreated(uint256 indexed id, string name, AchievementRarity rarity);
    event AchievementEarned(address indexed user, uint256 indexed achievementId);
    event CollectionCreated(uint256 indexed id, string name);
    event CollectionCompleted(address indexed user, uint256 indexed collectionId);
    event RankUpdated(address indexed user, uint256 newRank);
    event BadgeAwarded(address indexed user, string badge);
    event CategoryProgressUpdated(address indexed user, string category, uint256 progress);

    
    constructor(
        string memory tokenUri,
        address _brainSafes,
        address _securityManager
    ) ERC1155("https://api.brainsafes.com/metadata/{id}") {
        require(_brainSafes != address(0), "Invalid BrainSafes address");
        require(_securityManager != address(0), "Invalid SecurityManager address");

        brainSafes = BrainSafesArbitrum(_brainSafes);
        securityManager = SecurityManager(_securityManager);

        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(ACHIEVEMENT_MANAGER, msg.sender);
    }

    
    function createAchievement(
        string memory name,
        string memory description,
        string memory category,
        uint256 points,
        uint256 maxSupply,
        AchievementRarity rarity,
        string[] memory requirements,
        string[] memory rewards,
        string memory metadataURI
    ) external onlyRole(ACHIEVEMENT_MANAGER) whenNotPaused {
        require(bytes(name).length > 0, "Invalid name");
        require(points > 0, "Invalid points");
        require(maxSupply > 0, "Invalid supply");
        require(achievementCounter < MAX_ACHIEVEMENTS, "Max achievements reached");

        achievementCounter++;
        
        Achievement storage achievement = achievements[achievementCounter];
        achievement.id = achievementCounter;
        achievement.name = name;
        achievement.description = description;
        achievement.category = category;
        achievement.points = points;
        achievement.maxSupply = maxSupply;
        achievement.rarity = rarity;
        achievement.requirements = requirements;
        achievement.rewards = rewards;
        achievement.metadataURI = metadataURI;
        achievement.isActive = true;

        emit AchievementCreated(achievementCounter, name, rarity);
    }

    
    function awardAchievement(
        address user,
        uint256 achievementId
    ) external onlyRole(MINTER_ROLE) whenNotPaused nonReentrant {
        Achievement storage achievement = achievements[achievementId];
        require(achievement.isActive, "Achievement not active");
        require(!achievement.earned[user], "Already earned");
        require(achievement.currentSupply < achievement.maxSupply, "Supply exceeded");

        achievement.earned[user] = true;
        achievement.currentSupply++;

        // Mintear NFT
        _mint(user, achievementId, 1, "");

        // Actualizar estadísticas de usuario
        UserAchievements storage userStats = userAchievements[user];
        userStats.achievementIds.push(achievementId);
        userStats.totalPoints += achievement.points * RARITY_MULTIPLIERS[uint256(achievement.rarity)] / 100;
        userStats.lastEarned = block.timestamp;
        userStats.rarityCount[uint256(achievement.rarity)]++;

        // Actualizar progreso por categoría
        userCategoryProgress[user][achievement.category] += achievement.points;
        categoryPoints[achievement.category] += achievement.points;

        // Verificar colecciones
        _checkCollections(user);

        // Actualizar rango
        _updateRank(user);

        emit AchievementEarned(user, achievementId);
    }

    
    function createCollection(
        string memory name,
        string memory description,
        uint256[] memory achievementIds,
        uint256 requiredCount,
        string memory specialReward
    ) external onlyRole(ACHIEVEMENT_MANAGER) whenNotPaused {
        require(bytes(name).length > 0, "Invalid name");
        require(achievementIds.length > 0, "No achievements");
        require(requiredCount > 0 && requiredCount <= achievementIds.length, "Invalid count");
        require(collectionCounter < MAX_COLLECTIONS, "Max collections reached");

        collectionCounter++;
        
        Collection storage collection = collections[collectionCounter];
        collection.id = collectionCounter;
        collection.name = name;
        collection.description = description;
        collection.achievementIds = achievementIds;
        collection.requiredCount = requiredCount;
        collection.specialReward = specialReward;
        collection.isActive = true;

        emit CollectionCreated(collectionCounter, name);
    }

    
    function _checkCollections(address user) internal {
        UserAchievements storage userStats = userAchievements[user];

        for (uint256 i = 1; i <= collectionCounter; i++) {
            Collection storage collection = collections[i];
            if (!collection.isActive || collection.completed[user]) continue;

            uint256 completedCount = 0;
            for (uint256 j = 0; j < collection.achievementIds.length; j++) {
                if (achievements[collection.achievementIds[j]].earned[user]) {
                    completedCount++;
                }
            }

            if (completedCount >= collection.requiredCount) {
                collection.completed[user] = true;
                userStats.badges.push(collection.specialReward);
                emit CollectionCompleted(user, i);
                emit BadgeAwarded(user, collection.specialReward);
            }
        }
    }

    
    function _updateRank(address user) internal {
        UserAchievements storage userStats = userAchievements[user];
        
        // Calcular nuevo rango basado en puntos y logros raros
        uint256 baseRank = userStats.totalPoints / 1000;
        uint256 rarityBonus = 0;
        
        for (uint256 i = 0; i < userStats.rarityCount.length; i++) {
            rarityBonus += userStats.rarityCount[i] * (2 ** i);
        }

        uint256 newRank = baseRank + rarityBonus;
        if (newRank != userStats.rank) {
            userStats.rank = newRank;
            emit RankUpdated(user, newRank);
        }
    }

    
    function getUserAchievements(
        address user
    ) external view returns (
        uint256[] memory achievementIds,
        uint256 totalPoints,
        uint256 lastEarned,
        uint256[] memory rarityCount,
        string[] memory badges,
        uint256 rank
    ) {
        UserAchievements storage userStats = userAchievements[user];
        return (
            userStats.achievementIds,
            userStats.totalPoints,
            userStats.lastEarned,
            userStats.rarityCount,
            userStats.badges,
            userStats.rank
        );
    }

    
    function getCategoryProgress(
        address user,
        string memory category
    ) external view returns (uint256 progress, uint256 totalPoints) {
        return (
            userCategoryProgress[user][category],
            categoryPoints[category]
        );
    }

    
    function checkAchievementEligibility(
        address user,
        uint256 achievementId
    ) external view returns (bool eligible, string memory reason) {
        Achievement storage achievement = achievements[achievementId];
        
        if (!achievement.isActive) {
            return (false, "Achievement not active");
        }
        if (achievement.earned[user]) {
            return (false, "Already earned");
        }
        if (achievement.currentSupply >= achievement.maxSupply) {
            return (false, "Supply exceeded");
        }
        
        return (true, "Eligible");
    }

    
    function uri(
        uint256 tokenId
    ) public view override returns (string memory) {
        return achievements[tokenId].metadataURI;
    }

    
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    
    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC1155, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
} 