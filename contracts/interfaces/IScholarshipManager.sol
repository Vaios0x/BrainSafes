// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;


interface IScholarshipManager {
    // ========== SCHOLARSHIP PROGRAM FUNCTIONS ==========
    
    function createScholarshipProgram(
        string memory name,
        string memory description,
        uint256 amount,
        uint256 maxRecipients,
        string[] memory requirements,
        uint256 deadline,
        string memory ipfsMetadata
    ) external returns (uint256);
    
    
    function updateScholarshipProgram(
        uint256 programId,
        string memory name,
        string memory description,
        uint256 amount,
        uint256 maxRecipients,
        string[] memory requirements,
        uint256 deadline,
        bool isActive
    ) external;
    
    
    function getScholarshipProgram(uint256 programId) external view returns (ScholarshipProgram memory);
    
    
    function getActivePrograms() external view returns (uint256[] memory);
    
    
    function getProgramsByOrganization(address organization) external view returns (uint256[] memory);
    
    // ========== APPLICATION FUNCTIONS ==========
    
    function applyForScholarship(
        uint256 programId,
        uint256 amount,
        string memory reason,
        string memory ipfsApplication
    ) external;
    
    
    function applyForScholarship(
        address student,
        uint256 amount,
        string memory reason
    ) external;
    
    
    function batchApplyForScholarships(
        uint256[] calldata programIds,
        uint256[] calldata amounts,
        string[] calldata reasons,
        string[] calldata ipfsApplications
    ) external;
    
    
    function getApplication(uint256 applicationId) external view returns (ScholarshipApplication memory);
    
    
    function getApplicationsByStudent(address student) external view returns (uint256[] memory);
    
    
    function getApplicationsByProgram(uint256 programId) external view returns (uint256[] memory);
    
    
    function hasApplied(uint256 programId, address student) external view returns (bool);
    
    // ========== AI EVALUATION FUNCTIONS ==========
    
    function evaluateApplicationWithAI(uint256 applicationId) external view returns (
        uint256 score,
        bool recommendation,
        string memory insights
    );
    
    
    function batchEvaluateApplicationsWithAI(
        uint256[] calldata applicationIds
    ) external view returns (
        uint256[] memory scores,
        bool[] memory recommendations,
        string[] memory insightsArray
    );
    
    
    function getStudentEligibilityScore(
        address student,
        uint256 programId
    ) external view returns (uint256);
    
    
    function getAIRecommendations(
        address student
    ) external view returns (
        uint256[] memory recommendedPrograms,
        uint256[] memory confidenceScores
    );
    
    
    function evaluateScholarshipAI(
        address student
    ) external view returns (uint256 score, bool recommendation);
    
    // ========== REVIEW AND APPROVAL FUNCTIONS ==========
    
    function reviewApplication(
        uint256 applicationId,
        bool approved,
        uint256 amount,
        string memory comments
    ) external;
    
    
    function batchReviewApplications(
        uint256[] calldata applicationIds,
        bool[] calldata approvals,
        uint256[] calldata amounts,
        string[] calldata commentsArray
    ) external;
    
    
    function autoApproveApplications(
        uint256[] calldata applicationIds,
        uint256 threshold
    ) external;
    
    
    function getApplicationReview(uint256 applicationId) external view returns (ApplicationReview memory);
    
    // ========== DISBURSEMENT FUNCTIONS ==========
    
    function disburseScholarship(uint256 applicationId) external;
    
    
    function batchDisburseScholarships(uint256[] calldata applicationIds) external;
    
    
    function getDisbursement(uint256 applicationId) external view returns (Disbursement memory);
    
    
    function getDisbursementsByStudent(address student) external view returns (uint256[] memory);
    
    // ========== STATISTICS AND ANALYTICS FUNCTIONS ==========
    
    function getProgramStats(uint256 programId) external view returns (
        uint256 totalApplications,
        uint256 approvedApplications,
        uint256 totalAwarded,
        uint256 averageScore,
        uint256 completionRate
    );
    
    
    function getPlatformStats() external view returns (
        uint256 totalPrograms,
        uint256 totalApplications,
        uint256 totalAwarded,
        uint256 totalStudents,
        uint256 averageAwardAmount
    );
    
    
    function getStudentStats(address student) external view returns (
        uint256 totalApplications,
        uint256 approvedApplications,
        uint256 totalAwarded,
        uint256 averageScore
    );
    
    // ========== SEARCH AND FILTER FUNCTIONS ==========
    
    function searchPrograms(
        address organization,
        uint256 minAmount,
        uint256 maxAmount,
        bool isActive
    ) external view returns (uint256[] memory);
    
    
    function getProgramsByRequirement(string memory requirement) external view returns (uint256[] memory);
    
    
    function getPopularPrograms(uint256 limit) external view returns (uint256[] memory);
    
    // ========== ADMIN FUNCTIONS ==========
    
    function updateAIEvaluationParams(uint256 newThreshold, uint256 newWeight) external;
    
    
    function updateApplicationFee(uint256 newFee) external;
    
    
    function emergencyPause() external;
    
    
    function emergencyUnpause() external;
    
    
    function paused() external view returns (bool);
    
    // ========== STRUCTURES ==========
    struct ScholarshipProgram {
        uint256 id;
        address organization;
        string name;
        string description;
        uint256 amount;
        uint256 maxRecipients;
        string[] requirements;
        uint256 deadline;
        string ipfsMetadata;
        bool isActive;
        uint256 createdAt;
        uint256 totalApplications;
        uint256 totalAwarded;
    }
    
    struct ScholarshipApplication {
        uint256 id;
        uint256 programId;
        address student;
        uint256 amount;
        string reason;
        string ipfsApplication;
        uint256 submittedAt;
        ApplicationStatus status;
        uint256 aiScore;
        bool aiRecommendation;
        string aiInsights;
    }
    
    struct ApplicationReview {
        uint256 applicationId;
        address reviewer;
        bool approved;
        uint256 amount;
        string comments;
        uint256 reviewedAt;
    }
    
    struct Disbursement {
        uint256 applicationId;
        address student;
        uint256 amount;
        uint256 disbursedAt;
        bool completed;
        string transactionHash;
    }
    
    enum ApplicationStatus {
        PENDING,
        UNDER_REVIEW,
        APPROVED,
        REJECTED,
        DISBURSED,
        COMPLETED
    }
    
    // ========== EVENTS ==========
    event ScholarshipProgramCreated(
        uint256 indexed programId,
        address indexed organization,
        string name,
        uint256 amount,
        uint256 maxRecipients
    );
    
    event ApplicationSubmitted(
        uint256 indexed applicationId,
        uint256 indexed programId,
        address indexed student,
        uint256 amount
    );
    
    event ApplicationReviewed(
        uint256 indexed applicationId,
        address indexed reviewer,
        bool approved,
        uint256 amount
    );
    
    event ScholarshipDisbursed(
        uint256 indexed applicationId,
        address indexed student,
        uint256 amount
    );
    
    event AIEvaluationCompleted(
        uint256 indexed applicationId,
        uint256 score,
        bool recommendation
    );
    
    event ProgramUpdated(uint256 indexed programId, string name, bool isActive);
    event AIParamsUpdated(uint256 threshold, uint256 weight);
    event ApplicationFeeUpdated(uint256 newFee);
    event EmergencyPaused(address indexed admin);
    event EmergencyUnpaused(address indexed admin);
}
