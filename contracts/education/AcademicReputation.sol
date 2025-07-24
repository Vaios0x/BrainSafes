// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "../core/BrainSafesArbitrum.sol";
import "../utils/SecurityManager.sol";

/**
 * @title AcademicReputation
 * @dev Sistema de reputación académica para BrainSafes
 * @custom:security-contact security@brainsafes.com
 */
contract AcademicReputation is AccessControl, Pausable, ReentrancyGuard {
    // Roles
    bytes32 public constant VALIDATOR_ROLE = keccak256("VALIDATOR_ROLE");
    bytes32 public constant INSTITUTION_ROLE = keccak256("INSTITUTION_ROLE");

    // Estructuras
    struct ReputationProfile {
        uint256 academicScore;      // 0-1000
        uint256 peerScore;          // 0-1000
        uint256 contributionScore;   // 0-1000
        uint256 researchScore;      // 0-1000
        uint256[] endorsements;
        uint256[] certifications;
        string[] publications;
        bool isVerified;
        uint256 lastUpdated;
    }

    struct Institution {
        string name;
        uint256 weight;             // 1-100
        bool isActive;
        uint256 verifiedProfiles;
        uint256 totalEndorsements;
    }

    struct Endorsement {
        uint256 id;
        address endorser;
        address endorsed;
        string category;
        string details;
        uint256 weight;
        uint256 timestamp;
        bool isVerified;
    }

    struct Certification {
        uint256 id;
        string name;
        address institution;
        uint256 score;
        uint256 timestamp;
        bool isVerified;
    }

    // Mappings
    mapping(address => ReputationProfile) public profiles;
    mapping(address => Institution) public institutions;
    mapping(uint256 => Endorsement) public endorsements;
    mapping(uint256 => Certification) public certifications;
    mapping(address => mapping(string => uint256)) public skillScores;
    mapping(address => uint256[]) public userEndorsements;
    mapping(address => uint256[]) public userCertifications;

    // Contadores
    uint256 private endorsementCounter;
    uint256 private certificationCounter;

    // Referencias a otros contratos
    BrainSafesArbitrum public brainSafes;
    SecurityManager public securityManager;

    // Eventos
    event ProfileCreated(address indexed user, uint256 timestamp);
    event ProfileUpdated(address indexed user, uint256 newScore);
    event EndorsementAdded(uint256 indexed endorsementId, address indexed endorser, address indexed endorsed);
    event CertificationVerified(uint256 indexed certificationId, address indexed institution);
    event InstitutionRegistered(address indexed institution, string name);
    event SkillUpdated(address indexed user, string skill, uint256 newScore);
    event ReputationMilestoneAchieved(address indexed user, string milestone, uint256 score);

    /**
     * @dev Constructor
     */
    constructor(address _brainSafes, address _securityManager) {
        require(_brainSafes != address(0), "Invalid BrainSafes address");
        require(_securityManager != address(0), "Invalid SecurityManager address");

        brainSafes = BrainSafesArbitrum(_brainSafes);
        securityManager = SecurityManager(_securityManager);

        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /**
     * @dev Crear perfil de reputación
     */
    function createProfile() external whenNotPaused nonReentrant {
        require(!profiles[msg.sender].isVerified, "Profile already exists");
        require(securityManager.isSecure(msg.sender), "Security check failed");

        profiles[msg.sender] = ReputationProfile({
            academicScore: 100,
            peerScore: 100,
            contributionScore: 100,
            researchScore: 100,
            endorsements: new uint256[](0),
            certifications: new uint256[](0),
            publications: new string[](0),
            isVerified: true,
            lastUpdated: block.timestamp
        });

        emit ProfileCreated(msg.sender, block.timestamp);
    }

    /**
     * @dev Actualizar puntuación académica
     */
    function updateAcademicScore(
        address user,
        uint256 newScore,
        string memory reason
    ) external onlyRole(VALIDATOR_ROLE) whenNotPaused {
        require(newScore <= 1000, "Invalid score");
        require(profiles[user].isVerified, "Profile not found");

        ReputationProfile storage profile = profiles[user];
        uint256 oldScore = profile.academicScore;
        profile.academicScore = newScore;
        profile.lastUpdated = block.timestamp;

        // Verificar hitos
        if (newScore >= 800 && oldScore < 800) {
            emit ReputationMilestoneAchieved(user, "Academic Excellence", newScore);
        }

        emit ProfileUpdated(user, newScore);
    }

    /**
     * @dev Añadir endorsement
     */
    function addEndorsement(
        address endorsed,
        string memory category,
        string memory details,
        uint256 weight
    ) external onlyRole(VALIDATOR_ROLE) whenNotPaused nonReentrant {
        require(weight <= 100, "Invalid weight");
        require(profiles[endorsed].isVerified, "Profile not found");
        require(msg.sender != endorsed, "Cannot self-endorse");

        endorsementCounter++;
        
        endorsements[endorsementCounter] = Endorsement({
            id: endorsementCounter,
            endorser: msg.sender,
            endorsed: endorsed,
            category: category,
            details: details,
            weight: weight,
            timestamp: block.timestamp,
            isVerified: true
        });

        userEndorsements[endorsed].push(endorsementCounter);
        profiles[endorsed].endorsements.push(endorsementCounter);

        // Actualizar puntuación de pares
        _updatePeerScore(endorsed);

        emit EndorsementAdded(endorsementCounter, msg.sender, endorsed);
    }

    /**
     * @dev Verificar certificación
     */
    function verifyCertification(
        address user,
        string memory name,
        uint256 score
    ) external onlyRole(INSTITUTION_ROLE) whenNotPaused nonReentrant {
        require(score <= 100, "Invalid score");
        require(profiles[user].isVerified, "Profile not found");

        certificationCounter++;
        
        certifications[certificationCounter] = Certification({
            id: certificationCounter,
            name: name,
            institution: msg.sender,
            score: score,
            timestamp: block.timestamp,
            isVerified: true
        });

        userCertifications[user].push(certificationCounter);
        profiles[user].certifications.push(certificationCounter);

        // Actualizar puntuación académica
        _updateAcademicScore(user);

        emit CertificationVerified(certificationCounter, msg.sender);
    }

    /**
     * @dev Registrar institución
     */
    function registerInstitution(
        address institution,
        string memory name,
        uint256 weight
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(weight > 0 && weight <= 100, "Invalid weight");
        require(!institutions[institution].isActive, "Already registered");

        institutions[institution] = Institution({
            name: name,
            weight: weight,
            isActive: true,
            verifiedProfiles: 0,
            totalEndorsements: 0
        });

        _grantRole(INSTITUTION_ROLE, institution);

        emit InstitutionRegistered(institution, name);
    }

    /**
     * @dev Actualizar habilidad
     */
    function updateSkill(
        address user,
        string memory skill,
        uint256 score
    ) external onlyRole(VALIDATOR_ROLE) whenNotPaused {
        require(score <= 100, "Invalid score");
        require(profiles[user].isVerified, "Profile not found");

        skillScores[user][skill] = score;

        // Actualizar puntuación de contribución
        _updateContributionScore(user);

        emit SkillUpdated(user, skill, score);
    }

    /**
     * @dev Añadir publicación
     */
    function addPublication(
        string memory publicationHash
    ) external whenNotPaused nonReentrant {
        require(profiles[msg.sender].isVerified, "Profile not found");
        require(bytes(publicationHash).length > 0, "Invalid hash");

        profiles[msg.sender].publications.push(publicationHash);

        // Actualizar puntuación de investigación
        _updateResearchScore(msg.sender);
    }

    /**
     * @dev Actualizar puntuación de pares
     */
    function _updatePeerScore(address user) internal {
        ReputationProfile storage profile = profiles[user];
        uint256 totalWeight = 0;
        uint256 weightedScore = 0;

        for (uint256 i = 0; i < profile.endorsements.length; i++) {
            Endorsement storage endorsement = endorsements[profile.endorsements[i]];
            if (endorsement.isVerified) {
                totalWeight += endorsement.weight;
                weightedScore += endorsement.weight * 10;
            }
        }

        if (totalWeight > 0) {
            profile.peerScore = (weightedScore * 1000) / (totalWeight * 10);
        }
    }

    /**
     * @dev Actualizar puntuación académica
     */
    function _updateAcademicScore(address user) internal {
        ReputationProfile storage profile = profiles[user];
        uint256 totalScore = 0;
        uint256 count = 0;

        for (uint256 i = 0; i < profile.certifications.length; i++) {
            Certification storage cert = certifications[profile.certifications[i]];
            if (cert.isVerified) {
                totalScore += cert.score;
                count++;
            }
        }

        if (count > 0) {
            uint256 avgScore = totalScore / count;
            profile.academicScore = (profile.academicScore + avgScore * 10) / 2;
        }
    }

    /**
     * @dev Actualizar puntuación de contribución
     */
    function _updateContributionScore(address user) internal {
        ReputationProfile storage profile = profiles[user];
        uint256 totalSkillScore = 0;
        uint256 skillCount = 0;

        // Implementar lógica de cálculo de puntuación de contribución
        profile.contributionScore = (profile.contributionScore + totalSkillScore) / 2;
    }

    /**
     * @dev Actualizar puntuación de investigación
     */
    function _updateResearchScore(address user) internal {
        ReputationProfile storage profile = profiles[user];
        profile.researchScore = (profile.researchScore + profile.publications.length * 100) / 2;
        if (profile.researchScore > 1000) {
            profile.researchScore = 1000;
        }
    }

    /**
     * @dev Obtener perfil completo
     */
    function getProfile(address user) external view returns (
        uint256 academicScore,
        uint256 peerScore,
        uint256 contributionScore,
        uint256 researchScore,
        uint256 endorsementCount,
        uint256 certificationCount,
        uint256 publicationCount,
        bool isVerified,
        uint256 lastUpdated
    ) {
        ReputationProfile storage profile = profiles[user];
        return (
            profile.academicScore,
            profile.peerScore,
            profile.contributionScore,
            profile.researchScore,
            profile.endorsements.length,
            profile.certifications.length,
            profile.publications.length,
            profile.isVerified,
            profile.lastUpdated
        );
    }

    /**
     * @dev Obtener endorsements de usuario
     */
    function getUserEndorsements(address user) external view returns (uint256[] memory) {
        return userEndorsements[user];
    }

    /**
     * @dev Obtener certificaciones de usuario
     */
    function getUserCertifications(address user) external view returns (uint256[] memory) {
        return userCertifications[user];
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