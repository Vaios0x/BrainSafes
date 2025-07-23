// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@arbitrum/nitro-contracts/src/precompiles/ArbSys.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../optimizations/AddressCompressor.sol";
import "../cache/DistributedCache.sol";

/**
 * @title EnhancedEducationSystem
 * @notice Enhanced education management contract for BrainSafes
 * @dev Provides advanced features for courses, tracking, and analytics
 * @author BrainSafes Team
 */
contract EnhancedEducationSystem {
    ArbSys constant arbsys = ArbSys(address(0x64));
    
    struct CrossChainCertificate {
        uint256 certificateId;
        address recipient;
        string uri;
        uint256 score;
        uint256 timestamp;
        bytes32 l1Hash;
        bytes32 l2Hash;
        bool verified;
    }

    struct EducationalData {
        address student;
        uint256[] certificateIds;
        uint256[] courseIds;
        uint256 totalScore;
        uint256 reputationScore;
        mapping(string => uint256) skillLevels;
        uint256 lastUpdated;
    }

    struct RewardConfig {
        uint256 baseReward;
        uint256 bonusMultiplier;
        uint256 minScore;
        uint256 maxBonus;
        uint256 cooldownPeriod;
    }

    // Contratos principales
    IERC20 public eduToken;
    AddressCompressor public addressCompressor;
    DistributedCache public cache;

    // Mappings optimizados
    mapping(uint256 => CrossChainCertificate) public certificates;
    mapping(address => EducationalData) public studentData;
    mapping(bytes32 => bool) public verifiedHashes;
    
    // Configuración de recompensas
    RewardConfig public rewardConfig;
    mapping(address => uint256) public lastRewardTime;
    mapping(address => uint256) public rewardMultiplier;

    // Eventos
    event CertificateVerified(uint256 indexed certificateId, address indexed recipient);
    event RewardDistributed(address indexed student, uint256 amount, string reason);
    event SkillLevelUpdated(address indexed student, string skill, uint256 newLevel);
    event DataOptimized(address indexed student, uint256 savedStorage);

    constructor(
        address _eduToken,
        address _addressCompressor,
        address _cache
    ) {
        eduToken = IERC20(_eduToken);
        addressCompressor = AddressCompressor(_addressCompressor);
        cache = DistributedCache(_cache);

        rewardConfig = RewardConfig({
            baseReward: 100 * 10**18, // 100 EDU
            bonusMultiplier: 150, // 1.5x
            minScore: 70,
            maxBonus: 300, // 3x
            cooldownPeriod: 1 days
        });
    }

    /**
     * @notice Verifies a cross-chain certificate by validating its proof.
     * @param certificateId The ID of the certificate to verify.
     * @param l1Hash The hash of the certificate on Layer 1.
     * @param l2Hash The hash of the certificate on Layer 2.
     * @param proof The cross-chain proof data.
     * @return bool True if the certificate is verified, false otherwise.
     */
    function verifyCrosschainCertificate(
        uint256 certificateId,
        bytes32 l1Hash,
        bytes32 l2Hash,
        bytes calldata proof
    ) external returns (bool) {
        require(!verifiedHashes[l1Hash], "Certificate already verified");
        
        // Verificar prueba cross-chain
        require(_verifyCrossChainProof(l1Hash, l2Hash, proof), "Invalid proof");

        CrossChainCertificate storage cert = certificates[certificateId];
        cert.l1Hash = l1Hash;
        cert.l2Hash = l2Hash;
        cert.verified = true;

        // Comprimir dirección del recipient
        uint256 compressedRecipient = addressCompressor.compressAddress(cert.recipient);
        
        // Actualizar datos del estudiante
        EducationalData storage data = studentData[cert.recipient];
        data.certificateIds.push(certificateId);
        data.totalScore += cert.score;
        data.lastUpdated = block.timestamp;

        // Cachear datos verificados
        bytes32 cacheKey = keccak256(abi.encodePacked(certificateId, cert.recipient));
        cache.set(cacheKey, abi.encode(cert), block.timestamp + 30 days);

        verifiedHashes[l1Hash] = true;
        emit CertificateVerified(certificateId, cert.recipient);
        
        // Distribuir recompensa si aplica
        if (cert.score >= rewardConfig.minScore) {
            _distributeReward(cert.recipient, cert.score);
        }

        return true;
    }

    /**
     * @notice Distributes a reward to a student based on their score.
     * @param student The address of the student receiving the reward.
     * @param score The total score of the student.
     */
    function _distributeReward(address student, uint256 score) internal {
        require(block.timestamp >= lastRewardTime[student] + rewardConfig.cooldownPeriod, "Cooldown active");

        uint256 multiplier = rewardMultiplier[student];
        if (multiplier == 0) multiplier = 100; // 1.0x base

        // Calcular recompensa con bonus
        uint256 baseAmount = rewardConfig.baseReward * score / 100;
        uint256 bonusAmount = baseAmount * multiplier / 100;
        
        // Aplicar límites
        uint256 finalAmount = bonusAmount;
        if (finalAmount > rewardConfig.baseReward * rewardConfig.maxBonus / 100) {
            finalAmount = rewardConfig.baseReward * rewardConfig.maxBonus / 100;
        }

        // Transferir tokens
        require(eduToken.transfer(student, finalAmount), "Reward transfer failed");
        
        // Actualizar estado
        lastRewardTime[student] = block.timestamp;
        rewardMultiplier[student] = multiplier + 10; // +0.1x por cada recompensa

        emit RewardDistributed(student, finalAmount, "Certificate completion");
    }

    /**
     * @notice Updates the skill level of a student for a specific skill.
     * @param student The address of the student.
     * @param skill The name of the skill.
     * @param newLevel The new skill level.
     * @param proof The proof data for the skill update.
     */
    function updateSkillLevel(
        address student,
        string memory skill,
        uint256 newLevel,
        bytes calldata proof
    ) external {
        require(newLevel <= 100, "Invalid level");
        require(_verifySkillProof(student, skill, newLevel, proof), "Invalid skill proof");

        EducationalData storage data = studentData[student];
        data.skillLevels[skill] = newLevel;
        data.lastUpdated = block.timestamp;

        // Cachear actualización
        bytes32 cacheKey = keccak256(abi.encodePacked(student, skill));
        cache.set(cacheKey, abi.encode(newLevel), block.timestamp + 7 days);

        emit SkillLevelUpdated(student, skill, newLevel);
    }

    /**
     * @notice Optimizes the storage of a student's certificate data by removing old, verified certificates.
     * @param student The address of the student.
     * @return uint256 The amount of storage saved.
     */
    function optimizeStorageData(address student) external returns (uint256) {
        EducationalData storage data = studentData[student];
        uint256 savedStorage = 0;

        // Comprimir certificados antiguos
        uint256[] memory oldCerts = data.certificateIds;
        uint256[] memory newCerts = new uint256[](oldCerts.length);
        uint256 newCount = 0;

        for (uint256 i = 0; i < oldCerts.length; i++) {
            if (block.timestamp - certificates[oldCerts[i]].timestamp <= 365 days) {
                newCerts[newCount] = oldCerts[i];
                newCount++;
            } else {
                savedStorage += 32; // Bytes ahorrados
            }
        }

        // Actualizar array optimizado
        uint256[] memory finalCerts = new uint256[](newCount);
        for (uint256 i = 0; i < newCount; i++) {
            finalCerts[i] = newCerts[i];
        }
        data.certificateIds = finalCerts;

        emit DataOptimized(student, savedStorage);
        return savedStorage;
    }

    function _verifyCrossChainProof(
        bytes32 l1Hash,
        bytes32 l2Hash,
        bytes calldata proof
    ) internal pure returns (bool) {
        // Implementar verificación de prueba cross-chain
        return true; // Placeholder
    }

    function _verifySkillProof(
        address student,
        string memory skill,
        uint256 level,
        bytes calldata proof
    ) internal pure returns (bool) {
        // Implementar verificación de prueba de habilidad
        return true; // Placeholder
    }

    // Getters optimizados
    /**
     * @notice Retrieves the list of certificate IDs for a specific student.
     * @param student The address of the student.
     * @return uint256[] The list of certificate IDs.
     */
    function getStudentCertificates(address student) external view returns (uint256[] memory) {
        bytes32 cacheKey = keccak256(abi.encodePacked("certs", student));
        bytes memory cached = cache.get(cacheKey);
        
        if (cached.length > 0) {
            return abi.decode(cached, (uint256[]));
        }
        
        return studentData[student].certificateIds;
    }

    /**
     * @notice Retrieves the skill level of a student for a specific skill.
     * @param student The address of the student.
     * @param skill The name of the skill.
     * @return uint256 The skill level.
     */
    function getSkillLevel(address student, string memory skill) external view returns (uint256) {
        bytes32 cacheKey = keccak256(abi.encodePacked(student, skill));
        bytes memory cached = cache.get(cacheKey);
        
        if (cached.length > 0) {
            return abi.decode(cached, (uint256));
        }
        
        return studentData[student].skillLevels[skill];
    }
} 