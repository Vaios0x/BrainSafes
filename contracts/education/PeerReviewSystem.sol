// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "../core/BrainSafesArbitrum.sol";
import "../utils/SecurityManager.sol";

/**
 * @title PeerReviewSystem
 * @dev Sistema de evaluación por pares para BrainSafes
 * @custom:security-contact security@brainsafes.com
 */
contract PeerReviewSystem is AccessControl, Pausable, ReentrancyGuard {
    // Roles
    bytes32 public constant REVIEWER_ROLE = keccak256("REVIEWER_ROLE");
    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");

    // Estructuras
    struct Review {
        uint256 submissionId;
        address reviewer;
        uint256 score;
        string feedback;
        string rubricResults;
        bool isAnonymous;
        uint256 timestamp;
        bool isVerified;
        ReviewStatus status;
    }

    struct Submission {
        uint256 id;
        address student;
        uint256 courseId;
        string ipfsHash;
        uint256 requiredReviews;
        uint256 completedReviews;
        bool isFinalized;
        uint256 finalScore;
        uint256 deadline;
        SubmissionStatus status;
    }

    struct Rubric {
        uint256 id;
        string[] criteria;
        uint256[] weights;
        uint256 maxScore;
        bool isActive;
    }

    struct ReviewerStats {
        uint256 totalReviews;
        uint256 averageScore;
        uint256 reputationScore;
        uint256 responseTime;
        bool isActive;
    }

    // Enums
    enum ReviewStatus { Pending, Completed, Disputed, Resolved }
    enum SubmissionStatus { Pending, UnderReview, Completed, Expired }

    // Mappings
    mapping(uint256 => Submission) public submissions;
    mapping(uint256 => Review[]) public reviews;
    mapping(uint256 => Rubric) public rubrics;
    mapping(address => ReviewerStats) public reviewerStats;
    mapping(uint256 => mapping(address => bool)) public hasReviewed;
    mapping(address => uint256[]) public pendingReviews;
    
    // Contadores
    uint256 private submissionCounter;
    uint256 private rubricCounter;

    // Referencias a otros contratos
    BrainSafesArbitrum public brainSafes;
    SecurityManager public securityManager;

    // Eventos
    event SubmissionCreated(uint256 indexed submissionId, address indexed student, uint256 courseId);
    event ReviewSubmitted(uint256 indexed submissionId, address indexed reviewer, uint256 score);
    event ReviewDisputed(uint256 indexed submissionId, address indexed student, string reason);
    event ReviewResolved(uint256 indexed submissionId, uint256 newScore);
    event RubricCreated(uint256 indexed rubricId, uint256 maxScore);
    event ReviewerRegistered(address indexed reviewer, uint256 timestamp);
    event SubmissionFinalized(uint256 indexed submissionId, uint256 finalScore);

    /**
     * @dev Constructor
     */
    constructor(address _brainSafes, address _securityManager) {
        require(_brainSafes != address(0), "Invalid BrainSafes address");
        require(_securityManager != address(0), "Invalid SecurityManager address");

        brainSafes = BrainSafesArbitrum(_brainSafes);
        securityManager = SecurityManager(_securityManager);

        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(MODERATOR_ROLE, msg.sender);
    }

    /**
     * @dev Crear una nueva submission para revisión
     */
    function createSubmission(
        uint256 courseId,
        string memory ipfsHash,
        uint256 requiredReviews,
        uint256 deadline
    ) external whenNotPaused nonReentrant {
        require(bytes(ipfsHash).length > 0, "Invalid IPFS hash");
        require(requiredReviews > 0 && requiredReviews <= 5, "Invalid review count");
        require(deadline > block.timestamp, "Invalid deadline");

        submissionCounter++;
        
        submissions[submissionCounter] = Submission({
            id: submissionCounter,
            student: msg.sender,
            courseId: courseId,
            ipfsHash: ipfsHash,
            requiredReviews: requiredReviews,
            completedReviews: 0,
            isFinalized: false,
            finalScore: 0,
            deadline: deadline,
            status: SubmissionStatus.Pending
        });

        emit SubmissionCreated(submissionCounter, msg.sender, courseId);
    }

    /**
     * @dev Enviar una revisión
     */
    function submitReview(
        uint256 submissionId,
        uint256 score,
        string memory feedback,
        string memory rubricResults,
        bool isAnonymous
    ) external onlyRole(REVIEWER_ROLE) whenNotPaused nonReentrant {
        require(score <= 100, "Invalid score");
        require(!hasReviewed[submissionId][msg.sender], "Already reviewed");
        
        Submission storage submission = submissions[submissionId];
        require(submission.status == SubmissionStatus.Pending, "Invalid status");
        require(block.timestamp < submission.deadline, "Deadline passed");
        require(submission.student != msg.sender, "Cannot review own submission");

        Review memory review = Review({
            submissionId: submissionId,
            reviewer: msg.sender,
            score: score,
            feedback: feedback,
            rubricResults: rubricResults,
            isAnonymous: isAnonymous,
            timestamp: block.timestamp,
            isVerified: false,
            status: ReviewStatus.Pending
        });

        reviews[submissionId].push(review);
        hasReviewed[submissionId][msg.sender] = true;
        submission.completedReviews++;

        // Actualizar estadísticas del revisor
        ReviewerStats storage stats = reviewerStats[msg.sender];
        stats.totalReviews++;
        stats.averageScore = ((stats.averageScore * (stats.totalReviews - 1)) + score) / stats.totalReviews;
        stats.responseTime = (block.timestamp - submission.deadline) / 1 days;

        // Verificar si se completaron todas las revisiones
        if (submission.completedReviews >= submission.requiredReviews) {
            _finalizeSubmission(submissionId);
        }

        emit ReviewSubmitted(submissionId, msg.sender, score);
    }

    /**
     * @dev Disputar una revisión
     */
    function disputeReview(
        uint256 submissionId,
        uint256 reviewIndex,
        string memory reason
    ) external nonReentrant {
        Submission storage submission = submissions[submissionId];
        require(msg.sender == submission.student, "Not submission owner");
        require(reviewIndex < reviews[submissionId].length, "Invalid review index");

        Review storage review = reviews[submissionId][reviewIndex];
        require(review.status == ReviewStatus.Completed, "Invalid review status");

        review.status = ReviewStatus.Disputed;
        
        emit ReviewDisputed(submissionId, msg.sender, reason);
    }

    /**
     * @dev Resolver una disputa
     */
    function resolveDispute(
        uint256 submissionId,
        uint256 reviewIndex,
        uint256 newScore,
        string memory resolution
    ) external onlyRole(MODERATOR_ROLE) nonReentrant {
        require(newScore <= 100, "Invalid score");
        
        Review storage review = reviews[submissionId][reviewIndex];
        require(review.status == ReviewStatus.Disputed, "Not disputed");

        review.score = newScore;
        review.feedback = string(abi.encodePacked(review.feedback, "\n\nResolution: ", resolution));
        review.status = ReviewStatus.Resolved;

        // Recalcular puntuación final
        _recalculateFinalScore(submissionId);

        emit ReviewResolved(submissionId, newScore);
    }

    /**
     * @dev Crear una nueva rúbrica
     */
    function createRubric(
        string[] memory criteria,
        uint256[] memory weights,
        uint256 maxScore
    ) external onlyRole(MODERATOR_ROLE) {
        require(criteria.length == weights.length, "Mismatched arrays");
        require(maxScore > 0 && maxScore <= 100, "Invalid max score");

        uint256 totalWeight = 0;
        for (uint256 i = 0; i < weights.length; i++) {
            totalWeight += weights[i];
        }
        require(totalWeight == 100, "Weights must sum to 100");

        rubricCounter++;
        rubrics[rubricCounter] = Rubric({
            id: rubricCounter,
            criteria: criteria,
            weights: weights,
            maxScore: maxScore,
            isActive: true
        });

        emit RubricCreated(rubricCounter, maxScore);
    }

    /**
     * @dev Registrar un nuevo revisor
     */
    function registerReviewer(address reviewer) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(!hasRole(REVIEWER_ROLE, reviewer), "Already registered");
        require(securityManager.isSecure(reviewer), "Security check failed");

        _grantRole(REVIEWER_ROLE, reviewer);
        
        reviewerStats[reviewer] = ReviewerStats({
            totalReviews: 0,
            averageScore: 0,
            reputationScore: 100,
            responseTime: 0,
            isActive: true
        });

        emit ReviewerRegistered(reviewer, block.timestamp);
    }

    /**
     * @dev Finalizar una submission
     */
    function _finalizeSubmission(uint256 submissionId) internal {
        Submission storage submission = submissions[submissionId];
        require(!submission.isFinalized, "Already finalized");

        uint256 totalScore = 0;
        uint256 validReviews = 0;

        for (uint256 i = 0; i < reviews[submissionId].length; i++) {
            Review storage review = reviews[submissionId][i];
            if (review.status == ReviewStatus.Completed || review.status == ReviewStatus.Resolved) {
                totalScore += review.score;
                validReviews++;
            }
        }

        if (validReviews > 0) {
            submission.finalScore = totalScore / validReviews;
            submission.isFinalized = true;
            submission.status = SubmissionStatus.Completed;

            emit SubmissionFinalized(submissionId, submission.finalScore);
        }
    }

    /**
     * @dev Recalcular puntuación final después de resolver una disputa
     */
    function _recalculateFinalScore(uint256 submissionId) internal {
        Submission storage submission = submissions[submissionId];
        
        uint256 totalScore = 0;
        uint256 validReviews = 0;

        for (uint256 i = 0; i < reviews[submissionId].length; i++) {
            Review storage review = reviews[submissionId][i];
            if (review.status == ReviewStatus.Completed || review.status == ReviewStatus.Resolved) {
                totalScore += review.score;
                validReviews++;
            }
        }

        if (validReviews > 0) {
            submission.finalScore = totalScore / validReviews;
            emit SubmissionFinalized(submissionId, submission.finalScore);
        }
    }

    /**
     * @dev Obtener detalles de una submission
     */
    function getSubmissionDetails(uint256 submissionId) external view returns (
        address student,
        uint256 courseId,
        string memory ipfsHash,
        uint256 requiredReviews,
        uint256 completedReviews,
        bool isFinalized,
        uint256 finalScore,
        uint256 deadline,
        SubmissionStatus status
    ) {
        Submission storage submission = submissions[submissionId];
        return (
            submission.student,
            submission.courseId,
            submission.ipfsHash,
            submission.requiredReviews,
            submission.completedReviews,
            submission.isFinalized,
            submission.finalScore,
            submission.deadline,
            submission.status
        );
    }

    /**
     * @dev Obtener revisiones de una submission
     */
    function getSubmissionReviews(uint256 submissionId) external view returns (Review[] memory) {
        return reviews[submissionId];
    }

    /**
     * @dev Obtener estadísticas de un revisor
     */
    function getReviewerStats(address reviewer) external view returns (ReviewerStats memory) {
        return reviewerStats[reviewer];
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