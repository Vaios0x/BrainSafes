// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;


interface ICertificateNFT {
    // ========== MINTING FUNCTIONS ==========
    
    function mintCertificate(
        address to,
        uint256 courseId,
        string memory courseName,
        uint256 score,
        address instructor,
        string[] memory skills,
        string memory ipfsMetadata
    ) external returns (uint256);
    
    
    function mintCertificate(
        address to,
        uint256 courseId,
        string memory ipfsContent,
        uint256 score
    ) external returns (uint256);
    
    
    function batchMintCertificates(
        address[] calldata recipients,
        uint256[] calldata courseIds,
        string[] calldata courseNames,
        uint256[] calldata scores,
        address[] calldata instructors,
        string[][] calldata skillsArrays,
        string[] calldata ipfsMetadataArray
    ) external returns (uint256[] memory);
    
    
    function mintFiatCertificate(
        address to,
        uint256 courseId,
        string memory courseName,
        uint256 score,
        address instructor,
        string[] memory skills,
        string memory paymentId
    ) external returns (uint256);
    
    // ========== VERIFICATION FUNCTIONS ==========
    
    function verifyCertificate(
        uint256 tokenId,
        address verifier,
        string memory verificationMethod,
        string memory comments
    ) external;
    
    
    function batchVerifyCertificates(
        uint256[] calldata tokenIds,
        address verifier,
        string memory verificationMethod
    ) external;
    
    
    function isCertificateVerified(uint256 tokenId) external view returns (bool);
    
    
    function getVerificationRecords(uint256 tokenId) external view returns (VerificationRecord[] memory);
    
    // ========== ENDORSEMENT FUNCTIONS ==========
    
    function addSkillEndorsement(
        uint256 tokenId,
        string memory skillName,
        string memory endorserCredentials,
        uint8 proficiencyLevel,
        string memory comments
    ) external;
    
    
    function getSkillEndorsements(uint256 tokenId) external view returns (SkillEndorsement[] memory);
    
    
    function batchAddSkillEndorsements(
        uint256[] calldata tokenIds,
        string[] calldata skillNames,
        string[] calldata endorserCredentialsArray,
        uint8[] calldata proficiencyLevels,
        string[] calldata commentsArray
    ) external;
    
    // ========== CERTIFICATE MANAGEMENT FUNCTIONS ==========
    
    function updateCertificateMetadata(
        uint256 tokenId,
        string memory newIpfsMetadata
    ) external;
    
    
    function revokeCertificate(uint256 tokenId, string memory reason) external;
    
    
    function isCertificateRevoked(uint256 tokenId) external view returns (bool);
    
    
    function getCertificateData(uint256 tokenId) external view returns (CertificateData memory);
    
    
    function getCertificatesByRecipient(address recipient) external view returns (uint256[] memory);
    
    
    function getCertificatesByInstructor(address instructor) external view returns (uint256[] memory);
    
    
    function getCertificatesByCourse(uint256 courseId) external view returns (uint256[] memory);
    
    // ========== BRIDGE FUNCTIONS ==========
    
    function bridgeCertificateToL1(uint256 tokenId, address recipient) external;
    
    
    function bridgeCertificateFromL1(
        uint256 tokenId,
        address recipient,
        bytes memory certificateData
    ) external;
    
    // ========== QUERY FUNCTIONS ==========
    
    function getCertificateStats() external view returns (
        uint256 totalCertificates,
        uint256 totalVerified,
        uint256 totalRevoked,
        uint256 averageScore
    );
    
    
    function searchCertificates(
        address instructor,
        uint256 minScore,
        uint256 maxScore,
        bool isVerified
    ) external view returns (uint256[] memory);
    
    
    function getCertificateLevel(uint256 tokenId) external view returns (CertificateLevel);
    
    
    function calculateCredibilityScore(uint256 tokenId) external view returns (uint256);
    
    // ========== ADMIN FUNCTIONS ==========
    
    function setValidityPeriod(uint256 validityPeriod) external;
    
    
    function updateVerificationRequirements(
        uint256 minVerifications,
        uint256 verificationThreshold
    ) external;
    
    
    function emergencyPause() external;
    
    
    function emergencyUnpause() external;
    
    // ========== STRUCTURES ==========
    struct CertificateData {
        uint256 certificateId;
        address recipient;
        uint256 courseId;
        string courseName;
        string courseDescription;
        address instructor;
        string instructorName;
        uint256 score;
        uint256 completionDate;
        uint256 issuanceDate;
        string[] skills;
        string creditsEarned;
        uint256 courseDuration;
        CertificateLevel level;
        bool isValid;
        string ipfsMetadata;
        bytes32 certificateHash;
    }
    
    struct SkillEndorsement {
        string skillName;
        address endorser;
        string endorserCredentials;
        uint256 endorsementDate;
        uint8 proficiencyLevel;
        string comments;
    }
    
    struct VerificationRecord {
        address verifier;
        uint256 verificationDate;
        bool isValid;
        string verificationMethod;
        string comments;
    }
    
    enum CertificateLevel {
        BEGINNER,
        INTERMEDIATE,
        ADVANCED,
        EXPERT,
        MASTER
    }
    
    // ========== EVENTS ==========
    event CertificateMinted(
        uint256 indexed tokenId,
        address indexed recipient,
        uint256 indexed courseId,
        string courseName,
        uint256 score
    );
    
    event CertificateVerified(
        uint256 indexed tokenId,
        address indexed verifier,
        string verificationMethod
    );
    
    event SkillEndorsed(
        uint256 indexed tokenId,
        string skillName,
        address indexed endorser,
        uint8 proficiencyLevel
    );
    
    event CertificateRevoked(
        uint256 indexed tokenId,
        address indexed revoker,
        string reason
    );
    
    event CertificateBridged(
        uint256 indexed tokenId,
        address indexed recipient,
        bool toL1
    );
    
    event MetadataUpdated(uint256 indexed tokenId, string newIpfsMetadata);
    event ValidityPeriodUpdated(uint256 newValidityPeriod);
    event VerificationRequirementsUpdated(uint256 minVerifications, uint256 threshold);
}
