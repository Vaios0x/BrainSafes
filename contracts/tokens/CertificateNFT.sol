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
    bytes32 public constant ONRAMP_MINTER_ROLE = keccak256("ONRAMP_MINTER_ROLE");

    // ========== CONSTANTS ==========
    string public constant CERTIFICATE_TYPE_HASH = "Certificate(address recipient,uint256 courseId,string courseName,uint256 score,uint256 completionDate,address instructor,string skills)";
    
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
        uint256 courseDuration; // in hours
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
        uint8 proficiencyLevel; // 1-5
        string comments;
    }

    
    struct VerificationRecord {
        address verifier;
        uint256 verificationDate;
        bool isValid;
        string verificationMethod;
        string comments;
    }

    // ========== ENUMS ==========
    
    enum CertificateLevel {
        BEGINNER,
        INTERMEDIATE,
        ADVANCED,
        EXPERT,
        MASTER
    }

    
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
    mapping(string => bool) public processedOnRampTx;
    mapping(string => uint256) public onRampTxToTokenId;

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

    event OnRampNFTMinted(address indexed to, uint256 tokenId, string txHash, string provider);

    // ========== MODIFIERS ==========
    
    modifier onlyValidCertificate(uint256 tokenId) {
        require(_exists(tokenId), "Certificate does not exist");
        require(certificateStatus[tokenId] == CertificateStatus.ACTIVE, "Certificate not active");
        _;
    }

    
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
    
    constructor(
        string memory _institutionName,
        string memory _institutionLogo
    ) ERC721("BrainSafes Certificate", "EDUCERT") EIP712("BrainSafesCertificate", "1") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(VERIFIER_ROLE, msg.sender);
        _grantRole(ONRAMP_MINTER_ROLE, msg.sender);
        
        institutionName = _institutionName;
        institutionLogo = _institutionLogo;
    }

    // ========== EMITTING FUNCTIONS ==========
    
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

    
    function _generateCertificateHash(
        address recipient,
        uint256 courseId,
        string memory courseName,
        uint256 score,
        uint256 completionDate,
        address instructor,
        string[] memory skills
    ) internal pure returns (bytes32) {
        bytes32 skillsHash = keccak256(abi.encode(skills));
        return keccak256(abi.encodePacked(
            recipient,
            courseId,
            courseName,
            score,
            completionDate,
            instructor,
            skillsHash
        ));
    }

    
    function mintOnRamp(address to, string memory txHash, string memory provider) public onlyRole(ONRAMP_MINTER_ROLE) returns (uint256) {
        require(!processedOnRampTx[txHash], "On-ramp ya procesado");
        require(to != address(0), unicode"Dirección inválida");
        processedOnRampTx[txHash] = true;
        uint256 tokenId = _mintNFT(to, provider, txHash);
        onRampTxToTokenId[txHash] = tokenId;
        emit OnRampNFTMinted(to, tokenId, txHash, provider);
        return tokenId;
    }

    
    function _mintNFT(address to, string memory provider, string memory txHash) internal returns (uint256) {
        _tokenIdCounter.increment();
        uint256 tokenId = _tokenIdCounter.current();
        
        certificates[tokenId] = CertificateData({
            certificateId: tokenId,
            recipient: to,
            courseId: 0,
            courseName: string(abi.encodePacked("On-Ramp Certificate - ", provider)),
            courseDescription: "Blockchain on-ramp certification",
            instructor: address(0),
            instructorName: "BrainSafes System",
            score: 100,
            completionDate: block.timestamp,
            issuanceDate: block.timestamp,
            skills: new string[](0),
            creditsEarned: "1.0",
            courseDuration: 1,
            level: CertificateLevel.BEGINNER,
            isValid: true,
            ipfsMetadata: txHash,
            certificateHash: keccak256(abi.encodePacked(to, tokenId, block.timestamp))
        });
        
        certificateStatus[tokenId] = CertificateStatus.ACTIVE;
        _mint(to, tokenId);
        
        return tokenId;
    }

    // ========== VERIFICATION FUNCTIONS ==========
    
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

    
    function verifyCertificateWithSignature(
        uint256 tokenId,
        bytes memory signature
    ) external view returns (bool) {
        require(_exists(tokenId), "Certificate does not exist");
        
        CertificateData memory data = certificates[tokenId];
        bytes32 structHash = keccak256(abi.encode(
            keccak256(abi.encodePacked(CERTIFICATE_TYPE_HASH)),
            data.recipient,
            data.courseId,
            keccak256(bytes(data.courseName)),
            data.score,
            data.completionDate,
            data.instructor,
            keccak256(abi.encode(data.skills))
        ));
        
        bytes32 hash = _hashTypedDataV4(structHash);
        address signer = hash.recover(signature);
        
        return hasRole(MINTER_ROLE, signer);
    }

    
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

    
    function _isCertificateExpired(uint256 tokenId) internal view returns (bool) {
        return block.timestamp > certificates[tokenId].issuanceDate + certificateValidityPeriod;
    }

    // ========== ENDORSEMENTS FUNCTIONS ==========
    
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

    
    function updateCertificateMetadata(
        uint256 tokenId,
        string memory newMetadataURI
    ) external onlyRole(ADMIN_ROLE) {
        require(_exists(tokenId), "Certificate does not exist");
        
        _setTokenURI(tokenId, newMetadataURI);
        certificates[tokenId].ipfsMetadata = newMetadataURI;
        
        emit CertificateMetadataUpdated(tokenId, newMetadataURI);
    }

    
    function setTransfersEnabled(bool enabled) external onlyRole(ADMIN_ROLE) {
        transfersEnabled = enabled;
    }

    
    function setCertificateValidityPeriod(uint256 newPeriod) external onlyRole(ADMIN_ROLE) {
        require(newPeriod > 0, "Period must be greater than 0");
        certificateValidityPeriod = newPeriod;
    }

    
    function updateInstitutionInfo(
        string memory newName,
        string memory newLogo
    ) external onlyRole(ADMIN_ROLE) {
        institutionName = newName;
        institutionLogo = newLogo;
    }

    
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    // ========== QUERY FUNCTIONS ==========
    
    function getCertificatesByRecipient(address recipient) external view returns (uint256[] memory) {
        return recipientCertificates[recipient];
    }

    
    function getCertificatesByCourse(uint256 courseId) external view returns (uint256[] memory) {
        return courseCertificates[courseId];
    }

    
    function getCertificatesByInstructor(address instructor) external view returns (uint256[] memory) {
        return instructorCertificates[instructor];
    }

    
    function getCertificatesBySkill(string memory skill) external view returns (uint256[] memory) {
        return skillCertificates[skill];
    }

    
    function getSkillEndorsements(uint256 tokenId) external view returns (SkillEndorsement[] memory) {
        return skillEndorsements[tokenId];
    }

    
    function getVerificationHistory(uint256 tokenId) external view returns (VerificationRecord[] memory) {
        return verificationHistory[tokenId];
    }

    
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
        uint256 firstTokenId,
        uint256 batchSize
    ) internal override(ERC721, ERC721Enumerable) whenNotPaused {
        if (from != address(0) && to != address(0)) {
            require(transfersEnabled, "Transfers disabled");
        }
        super._beforeTokenTransfer(from, to, firstTokenId, batchSize);
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
        override(ERC721, ERC721Enumerable, ERC721URIStorage, AccessControl)
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

    
    function _char(bytes1 b) internal pure returns (bytes1 c) {
        if (uint8(b) < 10) return bytes1(uint8(b) + 0x30);
        else return bytes1(uint8(b) + 0x57);
    }

    
    function version() external pure returns (string memory) {
        return "1.0.0";
    }
} 