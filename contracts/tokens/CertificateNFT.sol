// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol";

/**
 * @title CertificateNFT
 * @dev NFTs for verifiable educational certificates with comprehensive metadata
 * @dev Features: Rich metadata, blockchain verification, controlled transfers
 * @author BrainSafes Team
 */
contract CertificateNFT is 
    ERC721, 
    ERC721URIStorage, 
    ERC721Enumerable, 
    AccessControl, 
    Pausable,
    EIP712
{
    using Counters for Counters.Counter;
    using ECDSA for bytes32;

    // ========== ROLES ==========
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    // ========== CONSTANTS ==========
    string public constant CERTIFICATE_TYPE_HASH = "Certificate(address recipient,uint256 courseId,string courseName,uint256 score,uint256 completionDate,address instructor,string skills)";
    
    // ========== STRUCTURES ==========
    /**
     * @dev Structure for storing certificate data
     */
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
        uint256 courseDuration; // in hours
        CertificateLevel level;
        bool isValid;
        string ipfsMetadata;
        bytes32 certificateHash;
    }

    /**
     * @dev Structure for skill endorsements
     */
    struct SkillEndorsement {
        string skillName;
        address endorser;
        string endorserCredentials;
        uint256 endorsementDate;
        uint8 proficiencyLevel; // 1-5
        string comments;
    }

    /**
     * @dev Structure for verification records
     */
    struct VerificationRecord {
        address verifier;
        uint256 verificationDate;
        bool isValid;
        string verificationMethod;
        string comments;
    }

    // ========== ENUMS ==========
    /**
     * @dev Certificate proficiency levels
     */
    enum CertificateLevel {
        BEGINNER,
        INTERMEDIATE,
        ADVANCED,
        EXPERT,
        MASTER
    }

    /**
     * @dev Certificate validity states
     */
    enum CertificateStatus {
        ACTIVE,
        SUSPENDED,
        REVOKED,
        EXPIRED
    }

    // ========== STATE VARIABLES ==========
    Counters.Counter private _tokenIdCounter;
    
    mapping(uint256 => CertificateData) public certificates;
    mapping(uint256 => SkillEndorsement[]) public skillEndorsements;
    mapping(uint256 => VerificationRecord[]) public verificationHistory;
    mapping(uint256 => CertificateStatus) public certificateStatus;
    mapping(bytes32 => bool) public usedCertificateHashes;
    
    // Mappings for efficient lookups
    mapping(address => uint256[]) public recipientCertificates;
    mapping(uint256 => uint256[]) public courseCertificates;
    mapping(address => uint256[]) public instructorCertificates;
    mapping(string => uint256[]) public skillCertificates;

    // Contract configuration
    bool public transfersEnabled = false; // Certificates should not be transferable by default
    bool public publicVerificationEnabled = true;
    uint256 public certificateValidityPeriod = 365 days * 5; // 5 years by default
    string public institutionName;
    string public institutionLogo;
    
    // ========== EVENTS ==========
    event CertificateIssued(
        uint256 indexed tokenId,
        address indexed recipient,
        uint256 indexed courseId,
        string courseName,
        uint256 score
    );
    
    event CertificateVerified(
        uint256 indexed tokenId,
        address indexed verifier,
        bool isValid
    );
    
    event SkillEndorsed(
        uint256 indexed tokenId,
        string skillName,
        address indexed endorser,
        uint8 proficiencyLevel
    );
    
    event CertificateStatusChanged(
        uint256 indexed tokenId,
        CertificateStatus oldStatus,
        CertificateStatus newStatus,
        string reason
    );

    event CertificateMetadataUpdated(
        uint256 indexed tokenId,
        string newMetadataURI
    );

    // ========== MODIFIERS ==========
    /**
     * @dev Ensures the certificate exists and is active
     */
    modifier onlyValidCertificate(uint256 tokenId) {
        require(_exists(tokenId), "Certificate does not exist");
        require(certificateStatus[tokenId] == CertificateStatus.ACTIVE, "Certificate not active");
        _;
    }

    /**
     * @dev Ensures caller is the recipient or has proper authorization
     */
    modifier onlyRecipientOrAuthorized(uint256 tokenId) {
        require(
            ownerOf(tokenId) == msg.sender || 
            hasRole(ADMIN_ROLE, msg.sender) ||
            hasRole(VERIFIER_ROLE, msg.sender),
            "Not authorized"
        );
        _;
    }

    // ========== CONSTRUCTOR ==========
    /**
     * @dev Initializes the contract with institution details and sets up roles
     * @param _institutionName Name of the issuing institution
     * @param _institutionLogo IPFS hash of the institution logo
     */
    constructor(
        string memory _institutionName,
        string memory _institutionLogo
    ) ERC721("BrainSafes Certificate", "EDUCERT") EIP712("BrainSafesCertificate", "1") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(VERIFIER_ROLE, msg.sender);
        
        institutionName = _institutionName;
        institutionLogo = _institutionLogo;
    }

    // ========== EMITTING FUNCTIONS ==========
    /**
     * @dev Mint a new certificate
     * @param recipient Address of the certificate recipient
     * @param courseId ID of the completed course
     * @param courseName Name of the course
     * @param courseDescription Description of the course
     * @param instructor Address of the course instructor
     * @param instructorName Name of the instructor
     * @param score Achievement score (0-100)
     * @param completionDate Date when the course was completed
     * @param skills Array of acquired skills
     * @param creditsEarned Academic credits earned
     * @param courseDuration Duration of the course in hours
     * @param level Certificate proficiency level
     * @param ipfsMetadata IPFS hash containing additional metadata
     * @return tokenId The ID of the minted certificate
     */
    function mintCertificate(
        address recipient,
        uint256 courseId,
        string memory courseName,
        string memory courseDescription,
        address instructor,
        string memory instructorName,
        uint256 score,
        uint256 completionDate,
        string[] memory skills,
        string memory creditsEarned,
        uint256 courseDuration,
        CertificateLevel level,
        string memory ipfsMetadata
    ) external onlyRole(MINTER_ROLE) whenNotPaused returns (uint256) {
        require(recipient != address(0), "Invalid recipient");
        require(bytes(courseName).length > 0, "Course name required");
        require(score <= 100, "Score must be 0-100");
        require(completionDate <= block.timestamp, "Invalid completion date");

        _tokenIdCounter.increment();
        uint256 tokenId = _tokenIdCounter.current();

        // Generate unique certificate hash
        bytes32 certificateHash = _generateCertificateHash(
            recipient,
            courseId,
            courseName,
            score,
            completionDate,
            instructor,
            skills
        );

        require(!usedCertificateHashes[certificateHash], "Duplicate certificate");
        usedCertificateHashes[certificateHash] = true;

        // Mint the NFT
        _safeMint(recipient, tokenId);
        _setTokenURI(tokenId, ipfsMetadata);

        // Store certificate data
        certificates[tokenId] = CertificateData({
            certificateId: tokenId,
            recipient: recipient,
            courseId: courseId,
            courseName: courseName,
            courseDescription: courseDescription,
            instructor: instructor,
            instructorName: instructorName,
            score: score,
            completionDate: completionDate,
            issuanceDate: block.timestamp,
            skills: skills,
            creditsEarned: creditsEarned,
            courseDuration: courseDuration,
            level: level,
            isValid: true,
            ipfsMetadata: ipfsMetadata,
            certificateHash: certificateHash
        });

        certificateStatus[tokenId] = CertificateStatus.ACTIVE;

        // Update indices
        recipientCertificates[recipient].push(tokenId);
        courseCertificates[courseId].push(tokenId);
        instructorCertificates[instructor].push(tokenId);
        
        for (uint256 i = 0; i < skills.length; i++) {
            skillCertificates[skills[i]].push(tokenId);
        }

        emit CertificateIssued(tokenId, recipient, courseId, courseName, score);
        return tokenId;
    }

    /**
     * @dev Generate unique certificate hash
     */
    function _generateCertificateHash(
        address recipient,
        uint256 courseId,
        string memory courseName,
        uint256 score,
        uint256 completionDate,
        address instructor,
        string[] memory skills
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(
            recipient,
            courseId,
            courseName,
            score,
            completionDate,
            instructor,
            keccak256(abi.encodePacked(skills))
        ));
    }

    // ========== VERIFICATION FUNCTIONS ==========
    /**
     * @dev Verify certificate authenticity
     * @param tokenId ID of the certificate to verify
     * @return isValid Whether the certificate is valid
     * @return certificateData Complete certificate data
     * @return status Current status of the certificate
     */
    function verifyCertificate(uint256 tokenId) external view returns (
        bool isValid,
        CertificateData memory certificateData,
        CertificateStatus status
    ) {
        require(_exists(tokenId), "Certificate does not exist");
        
        CertificateData memory data = certificates[tokenId];
        CertificateStatus currentStatus = certificateStatus[tokenId];
        
        bool valid = data.isValid && 
                    currentStatus == CertificateStatus.ACTIVE &&
                    !_isCertificateExpired(tokenId);
        
        return (valid, data, currentStatus);
    }

    /**
     * @dev Verify certificate with digital signature
     */
    function verifyCertificateWithSignature(
        uint256 tokenId,
        bytes memory signature
    ) external view returns (bool) {
        require(_exists(tokenId), "Certificate does not exist");
        
        CertificateData memory data = certificates[tokenId];
        bytes32 structHash = keccak256(abi.encode(
            keccak256(CERTIFICATE_TYPE_HASH),
            data.recipient,
            data.courseId,
            keccak256(bytes(data.courseName)),
            data.score,
            data.completionDate,
            data.instructor,
            keccak256(abi.encodePacked(data.skills))
        ));
        
        bytes32 hash = _hashTypedDataV4(structHash);
        address signer = hash.recover(signature);
        
        return hasRole(MINTER_ROLE, signer);
    }

    /**
     * @dev Record external verification of a certificate
     * @param tokenId ID of the certificate
     * @param isValid Whether the verification was successful
     * @param verificationMethod Method used for verification
     * @param comments Additional verification notes
     */
    function recordVerification(
        uint256 tokenId,
        bool isValid,
        string memory verificationMethod,
        string memory comments
    ) external onlyRole(VERIFIER_ROLE) onlyValidCertificate(tokenId) {
        verificationHistory[tokenId].push(VerificationRecord({
            verifier: msg.sender,
            verificationDate: block.timestamp,
            isValid: isValid,
            verificationMethod: verificationMethod,
            comments: comments
        }));

        emit CertificateVerified(tokenId, msg.sender, isValid);
    }

    /**
     * @dev Check if certificate has expired
     */
    function _isCertificateExpired(uint256 tokenId) internal view returns (bool) {
        return block.timestamp > certificates[tokenId].issuanceDate + certificateValidityPeriod;
    }

    // ========== ENDORSEMENTS FUNCTIONS ==========
    /**
     * @dev Endorse a skill on a certificate
     * @param tokenId ID of the certificate
     * @param skillName Name of the skill to endorse
     * @param endorserCredentials Credentials of the endorser
     * @param proficiencyLevel Skill proficiency level (1-5)
     * @param comments Additional endorsement notes
     */
    function endorseSkill(
        uint256 tokenId,
        string memory skillName,
        string memory endorserCredentials,
        uint8 proficiencyLevel,
        string memory comments
    ) external onlyValidCertificate(tokenId) {
        require(proficiencyLevel >= 1 && proficiencyLevel <= 5, "Competency level must be 1-5");
        require(_skillExistsInCertificate(tokenId, skillName), "Skill not in certificate");

        skillEndorsements[tokenId].push(SkillEndorsement({
            skillName: skillName,
            endorser: msg.sender,
            endorserCredentials: endorserCredentials,
            endorsementDate: block.timestamp,
            proficiencyLevel: proficiencyLevel,
            comments: comments
        }));

        emit SkillEndorsed(tokenId, skillName, msg.sender, proficiencyLevel);
    }

    /**
     * @dev Check if a skill exists in the certificate
     */
    function _skillExistsInCertificate(uint256 tokenId, string memory skillName) internal view returns (bool) {
        string[] memory skills = certificates[tokenId].skills;
        for (uint256 i = 0; i < skills.length; i++) {
            if (keccak256(bytes(skills[i])) == keccak256(bytes(skillName))) {
                return true;
            }
        }
        return false;
    }

    // ========== ADMINISTRATION FUNCTIONS ==========
    /**
     * @dev Change certificate status
     * @param tokenId ID of the certificate
     * @param newStatus New status to set
     * @param reason Reason for the status change
     */
    function changeCertificateStatus(
        uint256 tokenId,
        CertificateStatus newStatus,
        string memory reason
    ) external onlyRole(ADMIN_ROLE) {
        require(_exists(tokenId), "Certificate does not exist");
        
        CertificateStatus oldStatus = certificateStatus[tokenId];
        certificateStatus[tokenId] = newStatus;

        if (newStatus == CertificateStatus.REVOKED || newStatus == CertificateStatus.SUSPENDED) {
            certificates[tokenId].isValid = false;
        } else if (newStatus == CertificateStatus.ACTIVE) {
            certificates[tokenId].isValid = true;
        }

        emit CertificateStatusChanged(tokenId, oldStatus, newStatus, reason);
    }

    /**
     * @dev Update certificate metadata
     */
    function updateCertificateMetadata(
        uint256 tokenId,
        string memory newMetadataURI
    ) external onlyRole(ADMIN_ROLE) {
        require(_exists(tokenId), "Certificate does not exist");
        
        _setTokenURI(tokenId, newMetadataURI);
        certificates[tokenId].ipfsMetadata = newMetadataURI;
        
        emit CertificateMetadataUpdated(tokenId, newMetadataURI);
    }

    /**
     * @dev Configure if transfers are enabled
     */
    function setTransfersEnabled(bool enabled) external onlyRole(ADMIN_ROLE) {
        transfersEnabled = enabled;
    }

    /**
     * @dev Set certificate validity period
     */
    function setCertificateValidityPeriod(uint256 newPeriod) external onlyRole(ADMIN_ROLE) {
        require(newPeriod > 0, "Period must be greater than 0");
        certificateValidityPeriod = newPeriod;
    }

    /**
     * @dev Update institution information
     */
    function updateInstitutionInfo(
        string memory newName,
        string memory newLogo
    ) external onlyRole(ADMIN_ROLE) {
        institutionName = newName;
        institutionLogo = newLogo;
    }

    /**
     * @dev Pause/unpause the contract
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    // ========== QUERY FUNCTIONS ==========
    /**
     * @dev Get certificates by recipient
     */
    function getCertificatesByRecipient(address recipient) external view returns (uint256[] memory) {
        return recipientCertificates[recipient];
    }

    /**
     * @dev Get certificates by course
     */
    function getCertificatesByCourse(uint256 courseId) external view returns (uint256[] memory) {
        return courseCertificates[courseId];
    }

    /**
     * @dev Get certificates by instructor
     */
    function getCertificatesByInstructor(address instructor) external view returns (uint256[] memory) {
        return instructorCertificates[instructor];
    }

    /**
     * @dev Get certificates by skill
     */
    function getCertificatesBySkill(string memory skill) external view returns (uint256[] memory) {
        return skillCertificates[skill];
    }

    /**
     * @dev Get endorsements for a certificate
     */
    function getSkillEndorsements(uint256 tokenId) external view returns (SkillEndorsement[] memory) {
        return skillEndorsements[tokenId];
    }

    /**
     * @dev Get verification history
     */
    function getVerificationHistory(uint256 tokenId) external view returns (VerificationRecord[] memory) {
        return verificationHistory[tokenId];
    }

    /**
     * @dev Get certificate statistics
     * @param tokenId ID of the certificate
     * @return endorsementCount Number of skill endorsements
     * @return verificationCount Number of verifications
     * @return daysSinceIssuance Days elapsed since issuance
     * @return isExpired Whether the certificate has expired
     */
    function getCertificateStats(uint256 tokenId) external view returns (
        uint256 endorsementCount,
        uint256 verificationCount,
        uint256 daysSinceIssuance,
        bool isExpired
    ) {
        require(_exists(tokenId), "Certificate does not exist");
        
        CertificateData memory data = certificates[tokenId];
        
        return (
            skillEndorsements[tokenId].length,
            verificationHistory[tokenId].length,
            (block.timestamp - data.issuanceDate) / 1 days,
            _isCertificateExpired(tokenId)
        );
    }

    /**
     * @dev Search certificates by multiple criteria
     * @param recipient Address of the certificate recipient
     * @param courseId ID of the course
     * @param skill Specific skill to search for
     * @param level Minimum certificate level required
     * @param minScore Minimum score required
     * @return Array of certificate IDs matching the criteria
     */
    function searchCertificates(
        address recipient,
        uint256 courseId,
        string memory skill,
        CertificateLevel level,
        uint256 minScore
    ) external view returns (uint256[] memory) {
        uint256[] memory candidateTokens;
        
        // Start with the most restrictive filter
        if (recipient != address(0)) {
            candidateTokens = recipientCertificates[recipient];
        } else if (courseId != 0) {
            candidateTokens = courseCertificates[courseId];
        } else if (bytes(skill).length > 0) {
            candidateTokens = skillCertificates[skill];
        } else {
            // If no specific filters, check all tokens
            candidateTokens = new uint256[](totalSupply());
            for (uint256 i = 0; i < totalSupply(); i++) {
                candidateTokens[i] = tokenByIndex(i);
            }
        }

        // Apply additional filters
        uint256[] memory results = new uint256[](candidateTokens.length);
        uint256 resultCount = 0;

        for (uint256 i = 0; i < candidateTokens.length; i++) {
            uint256 tokenId = candidateTokens[i];
            CertificateData memory data = certificates[tokenId];
            
            bool matches = true;
            
            if (recipient != address(0) && data.recipient != recipient) matches = false;
            if (courseId != 0 && data.courseId != courseId) matches = false;
            if (data.level != level && level != CertificateLevel.BEGINNER) matches = false; // BEGINNER as wildcard
            if (data.score < minScore) matches = false;
            if (bytes(skill).length > 0 && !_skillExistsInCertificate(tokenId, skill)) matches = false;
            
            if (matches) {
                results[resultCount] = tokenId;
                resultCount++;
            }
        }

        // Resize results array
        uint256[] memory finalResults = new uint256[](resultCount);
        for (uint256 i = 0; i < resultCount; i++) {
            finalResults[i] = results[i];
        }

        return finalResults;
    }

    // ========== REPORT GENERATION FUNCTIONS ==========
    /**
     * @dev Generate certificate report for employers
     * @param tokenId ID of the certificate
     * @return certificateJSON JSON string containing certificate details
     */
    function generateEmployerReport(uint256 tokenId) external view returns (
        string memory certificateJSON
    ) {
        require(_exists(tokenId), "Certificate does not exist");
        require(publicVerificationEnabled || hasRole(VERIFIER_ROLE, msg.sender), "Verification not public");
        
        CertificateData memory data = certificates[tokenId];
        SkillEndorsement[] memory endorsements = skillEndorsements[tokenId];
        VerificationRecord[] memory verifications = verificationHistory[tokenId];
        
        // In a real implementation, this would generate a structured JSON
        // For simplicity, we return a placeholder string
        return string(abi.encodePacked(
            "Certificate ID: ", _toString(tokenId),
            ", Recipient: ", _toAsciiString(data.recipient),
            ", Course: ", data.courseName,
            ", Score: ", _toString(data.score),
            ", Verified: ", data.isValid ? "true" : "false"
        ));
    }

    // ========== OVERRIDES REQUIRED ==========
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override(ERC721, ERC721Enumerable) whenNotPaused {
        if (from != address(0) && to != address(0)) {
            require(transfersEnabled, "Transfers disabled");
        }
        super._beforeTokenTransfer(from, to, tokenId);
    }

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId) 
        public 
        view 
        override(ERC721, ERC721URIStorage) 
        returns (string memory) 
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    // ========== UTILITY FUNCTIONS ==========
    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }

    /**
     * @dev Convert address to ASCII string representation
     * @param x Address to convert
     * @return ASCII string representation of the address
     */
    function _toAsciiString(address x) internal pure returns (string memory) {
        bytes memory s = new bytes(40);
        for (uint i = 0; i < 20; i++) {
            bytes1 b = bytes1(uint8(uint(uint160(x)) / (2**(8*(19 - i)))));
            bytes1 hi = bytes1(uint8(b) / 16);
            bytes1 lo = bytes1(uint8(b) - 16 * uint8(hi));
            s[2*i] = _char(hi);
            s[2*i+1] = _char(lo);            
        }
        return string(s);
    }

    /**
     * @dev Convert byte to ASCII character
     * @param b Byte to convert
     * @return ASCII character
     */
    function _char(bytes1 b) internal pure returns (bytes1 c) {
        if (uint8(b) < 10) return bytes1(uint8(b) + 0x30);
        else return bytes1(uint8(b) + 0x57);
    }

    /**
     * @dev Get contract version
     * @return Version string in semantic format
     */
    function version() external pure returns (string memory) {
        return "1.0.0";
    }
} 