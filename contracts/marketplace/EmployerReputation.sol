// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "../core/BrainSafesArbitrum.sol";
import "../utils/SecurityManager.sol";


contract EmployerReputation is AccessControl, Pausable, ReentrancyGuard {
    // Roles
    bytes32 public constant VALIDATOR_ROLE = keccak256("VALIDATOR_ROLE");
    bytes32 public constant EMPLOYER_ROLE = keccak256("EMPLOYER_ROLE");

    // Estructuras
    struct EmployerProfile {
        string name;
        string description;
        string industry;
        uint256 reputationScore;    // 0-1000
        uint256 totalHires;
        uint256 activeContracts;
        uint256 completedContracts;
        uint256 disputeResolutionRate;
        uint256 averageRating;
        bool isVerified;
        uint256 lastUpdated;
        string[] badges;
    }

    struct Review {
        uint256 id;
        address reviewer;
        address employer;
        uint256 rating;         // 1-5
        string comment;
        uint256 contractId;
        uint256 timestamp;
        bool isVerified;
    }

    struct VerificationRequest {
        address employer;
        string companyDocs;
        string legalDocs;
        uint256 timestamp;
        VerificationStatus status;
    }

    struct ComplianceRecord {
        uint256 totalViolations;
        uint256 resolvedViolations;
        uint256[] violations;
        uint256 lastViolation;
        bool isSuspended;
    }

    // Enums
    enum VerificationStatus { Pending, Approved, Rejected }

    // Mappings
    mapping(address => EmployerProfile) public employers;
    mapping(uint256 => Review) public reviews;
    mapping(address => VerificationRequest) public verificationRequests;
    mapping(address => ComplianceRecord) public complianceRecords;
    mapping(address => uint256[]) public employerReviews;
    mapping(address => mapping(address => bool)) public hasReviewed;

    // Contadores
    uint256 private reviewCounter;
    uint256 private verificationCounter;

    // Referencias a otros contratos
    BrainSafesArbitrum public brainSafes;
    SecurityManager public securityManager;

    // Eventos
    event EmployerRegistered(address indexed employer, string name);
    event ReviewSubmitted(uint256 indexed reviewId, address indexed reviewer, address indexed employer);
    event VerificationRequested(address indexed employer, uint256 timestamp);
    event VerificationStatusUpdated(address indexed employer, VerificationStatus status);
    event ComplianceViolationRecorded(address indexed employer, string violation);
    event ReputationUpdated(address indexed employer, uint256 newScore);
    event BadgeAwarded(address indexed employer, string badge);

    
    constructor(address _brainSafes, address _securityManager) {
        require(_brainSafes != address(0), "Invalid BrainSafes address");
        require(_securityManager != address(0), "Invalid SecurityManager address");

        brainSafes = BrainSafesArbitrum(_brainSafes);
        securityManager = SecurityManager(_securityManager);

        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(VALIDATOR_ROLE, msg.sender);
    }

    
    function registerEmployer(
        string memory name,
        string memory description,
        string memory industry
    ) external whenNotPaused nonReentrant {
        require(bytes(name).length > 0, "Name required");
        require(!employers[msg.sender].isVerified, "Already registered");
        require(securityManager.isSecure(msg.sender), "Security check failed");

        employers[msg.sender] = EmployerProfile({
            name: name,
            description: description,
            industry: industry,
            reputationScore: 500, // Puntuación inicial
            totalHires: 0,
            activeContracts: 0,
            completedContracts: 0,
            disputeResolutionRate: 100,
            averageRating: 0,
            isVerified: false,
            lastUpdated: block.timestamp,
            badges: new string[](0)
        });

        _grantRole(EMPLOYER_ROLE, msg.sender);
        emit EmployerRegistered(msg.sender, name);
    }

    
    function requestVerification(
        string memory companyDocs,
        string memory legalDocs
    ) external onlyRole(EMPLOYER_ROLE) whenNotPaused {
        require(!employers[msg.sender].isVerified, "Already verified");
        require(bytes(companyDocs).length > 0, "Company docs required");
        require(bytes(legalDocs).length > 0, "Legal docs required");

        verificationRequests[msg.sender] = VerificationRequest({
            employer: msg.sender,
            companyDocs: companyDocs,
            legalDocs: legalDocs,
            timestamp: block.timestamp,
            status: VerificationStatus.Pending
        });

        emit VerificationRequested(msg.sender, block.timestamp);
    }

    
    function updateVerificationStatus(
        address employer,
        VerificationStatus status
    ) external onlyRole(VALIDATOR_ROLE) whenNotPaused {
        require(verificationRequests[employer].timestamp > 0, "No request found");
        
        verificationRequests[employer].status = status;
        if (status == VerificationStatus.Approved) {
            employers[employer].isVerified = true;
            employers[employer].reputationScore = 700; // Bonus por verificación
        }

        emit VerificationStatusUpdated(employer, status);
    }

    
    function submitReview(
        address employer,
        uint256 rating,
        string memory comment,
        uint256 contractId
    ) external whenNotPaused nonReentrant {
        require(rating >= 1 && rating <= 5, "Invalid rating");
        require(employers[employer].isVerified, "Employer not verified");
        require(!hasReviewed[msg.sender][employer], "Already reviewed");

        reviewCounter++;
        
        reviews[reviewCounter] = Review({
            id: reviewCounter,
            reviewer: msg.sender,
            employer: employer,
            rating: rating,
            comment: comment,
            contractId: contractId,
            timestamp: block.timestamp,
            isVerified: false
        });

        employerReviews[employer].push(reviewCounter);
        hasReviewed[msg.sender][employer] = true;

        // Actualizar puntuación promedio
        _updateAverageRating(employer);

        emit ReviewSubmitted(reviewCounter, msg.sender, employer);
    }

    
    function recordComplianceViolation(
        address employer,
        string memory violation
    ) external onlyRole(VALIDATOR_ROLE) whenNotPaused {
        ComplianceRecord storage record = complianceRecords[employer];
        record.totalViolations++;
        record.violations.push(block.timestamp);
        record.lastViolation = block.timestamp;

        // Actualizar reputación
        _updateReputationScore(employer);

        emit ComplianceViolationRecorded(employer, violation);
    }

    
    function resolveComplianceViolation(
        address employer,
        uint256 violationIndex
    ) external onlyRole(VALIDATOR_ROLE) whenNotPaused {
        ComplianceRecord storage record = complianceRecords[employer];
        require(violationIndex < record.violations.length, "Invalid violation");

        record.resolvedViolations++;
        
        // Actualizar reputación
        _updateReputationScore(employer);
    }

    
    function updateContractStats(
        address employer,
        bool isCompleted
    ) external whenNotPaused {
        EmployerProfile storage profile = employers[employer];
        
        if (isCompleted) {
            profile.completedContracts++;
            profile.activeContracts--;
        } else {
            profile.activeContracts++;
            profile.totalHires++;
        }

        profile.lastUpdated = block.timestamp;
    }

    
    function awardBadge(
        address employer,
        string memory badge
    ) external onlyRole(VALIDATOR_ROLE) whenNotPaused {
        require(employers[employer].isVerified, "Employer not verified");
        
        employers[employer].badges.push(badge);
        emit BadgeAwarded(employer, badge);
    }

    
    function _updateAverageRating(address employer) internal {
        uint256[] storage employerReviewIds = employerReviews[employer];
        uint256 totalRating = 0;
        uint256 validReviews = 0;

        for (uint256 i = 0; i < employerReviewIds.length; i++) {
            Review storage review = reviews[employerReviewIds[i]];
            if (review.isVerified) {
                totalRating += review.rating;
                validReviews++;
            }
        }

        if (validReviews > 0) {
            employers[employer].averageRating = totalRating / validReviews;
            _updateReputationScore(employer);
        }
    }

    
    function _updateReputationScore(address employer) internal {
        EmployerProfile storage profile = employers[employer];
        ComplianceRecord storage compliance = complianceRecords[employer];

        // Base score (0-700)
        uint256 baseScore = 700;

        // Rating impact (-100 to +100)
        int256 ratingImpact = int256(profile.averageRating * 20) - 60;

        // Compliance impact (-200 to 0)
        uint256 complianceScore = 200;
        if (compliance.totalViolations > 0) {
            uint256 resolutionRate = (compliance.resolvedViolations * 100) / compliance.totalViolations;
            complianceScore = (complianceScore * resolutionRate) / 100;
        }

        // Contract completion impact (0 to +200)
        uint256 completionScore = 0;
        if (profile.totalHires > 0) {
            completionScore = (profile.completedContracts * 200) / profile.totalHires;
        }

        // Calculate final score
        int256 finalScore = int256(baseScore) + ratingImpact - int256(200 - complianceScore) + int256(completionScore);
        
        // Ensure score is within bounds
        if (finalScore < 0) finalScore = 0;
        if (finalScore > 1000) finalScore = 1000;

        profile.reputationScore = uint256(finalScore);
        emit ReputationUpdated(employer, uint256(finalScore));
    }

    
    function getEmployerProfile(address employer) external view returns (
        string memory name,
        string memory industry,
        uint256 reputationScore,
        uint256 totalHires,
        uint256 activeContracts,
        uint256 completedContracts,
        uint256 averageRating,
        bool isVerified,
        string[] memory badges
    ) {
        EmployerProfile storage profile = employers[employer];
        return (
            profile.name,
            profile.industry,
            profile.reputationScore,
            profile.totalHires,
            profile.activeContracts,
            profile.completedContracts,
            profile.averageRating,
            profile.isVerified,
            profile.badges
        );
    }

    
    function getEmployerReviews(address employer) external view returns (uint256[] memory) {
        return employerReviews[employer];
    }

    
    function getComplianceRecord(address employer) external view returns (
        uint256 totalViolations,
        uint256 resolvedViolations,
        uint256[] memory violations,
        uint256 lastViolation,
        bool isSuspended
    ) {
        ComplianceRecord storage record = complianceRecords[employer];
        return (
            record.totalViolations,
            record.resolvedViolations,
            record.violations,
            record.lastViolation,
            record.isSuspended
        );
    }

    
    function checkHiringEligibility(address employer) external view returns (
        bool eligible,
        string memory reason
    ) {
        EmployerProfile storage profile = employers[employer];
        ComplianceRecord storage compliance = complianceRecords[employer];

        if (!profile.isVerified) {
            return (false, "Employer not verified");
        }
        if (compliance.isSuspended) {
            return (false, "Account suspended");
        }
        if (profile.reputationScore < 300) {
            return (false, "Reputation too low");
        }
        return (true, "Eligible to hire");
    }

    
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
} 