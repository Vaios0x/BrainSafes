// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;


interface IAIOracle {
    // ========== PREDICTION FUNCTIONS ==========
    
    function predictStudentPerformance(
        address student,
        uint256 courseId
    ) external view returns (uint256);
    
    
    function generateLearningPath(
        address student
    ) external view returns (uint256[] memory);
    
    
    function detectFraud(
        address user,
        bytes32 activityHash
    ) external view returns (bool);
    
    
    function batchPredictPerformance(
        address[] calldata students,
        uint256[] calldata courseIds
    ) external view returns (uint256[] memory);
    
    // ========== SCHOLARSHIP FUNCTIONS ==========
    
    function evaluateScholarshipCandidate(
        address candidate,
        uint256 programId,
        bytes memory candidateData
    ) external view returns (uint256 score, bool recommendation);
    
    
    function getScholarshipEligibilityScore(
        address student
    ) external view returns (uint256);
    
    
    function recommendScholarships(
        address student
    ) external view returns (uint256[] memory);
    
    // ========== JOB MARKETPLACE FUNCTIONS ==========
    
    function calculateJobMatch(
        address candidate,
        uint256 jobId,
        bytes memory candidateData
    ) external view returns (uint256);
    
    
    function recommendJobs(
        address candidate
    ) external view returns (uint256[] memory);
    
    
    function analyzeCandidateProfile(
        address candidate
    ) external view returns (
        string[] memory skills,
        uint256 experienceYears,
        uint8[] memory skillLevels
    );
    
    // ========== COURSE RECOMMENDATION FUNCTIONS ==========
    
    function recommendCourses(
        address student
    ) external view returns (uint256[] memory);
    
    
    function assessCourseDifficulty(
        address student,
        uint256 courseId
    ) external view returns (uint256);
    
    
    function predictCompletionTime(
        address student,
        uint256 courseId
    ) external view returns (uint256);
    
    // ========== CERTIFICATE VALIDATION FUNCTIONS ==========
    
    function validateCertificate(
        bytes32 certificateHash,
        address issuer,
        address recipient
    ) external view returns (bool);
    
    
    function detectCertificateFraud(
        bytes memory certificateData
    ) external view returns (bool);
    
    // ========== REPUTATION FUNCTIONS ==========
    
    function calculateReputationScore(
        address user
    ) external view returns (uint256);
    
    
    function predictUserBehavior(
        address user
    ) external view returns (uint256 riskScore, string memory behaviorType);
    
    // ========== CONTENT ANALYSIS FUNCTIONS ==========
    
    function analyzeContentQuality(
        uint256 courseId,
        bytes32 contentHash
    ) external view returns (uint256);
    
    
    function detectPlagiarism(
        bytes32 submissionHash,
        bytes memory referenceData
    ) external view returns (uint256);
    
    // ========== BATCH PROCESSING FUNCTIONS ==========
    
    function batchProcessEvaluations(
        EvaluationRequest[] calldata requests
    ) external view returns (EvaluationResult[] memory);
    
    
    function batchValidateCertificates(
        CertificateData[] calldata certificates
    ) external view returns (bool[] memory);
    
    // ========== MODEL MANAGEMENT FUNCTIONS ==========
    
    function registerModel(
        uint256 modelId,
        string memory modelType,
        bytes memory parameters
    ) external;
    
    
    function updateModel(
        uint256 modelId,
        bytes memory parameters
    ) external;
    
    
    function getModelInfo(
        uint256 modelId
    ) external view returns (
        string memory modelType,
        bytes memory parameters,
        bool isActive
    );
    
    // ========== ADMIN FUNCTIONS ==========
    
    function updateAIProcessor(address newProcessor) external;
    
    
    function pause() external;
    
    
    function unpause() external;
    
    
    function paused() external view returns (bool);
    
    // ========== STRUCTURES ==========
    struct EvaluationRequest {
        address user;
        uint256 requestType; // 1: performance, 2: scholarship, 3: job match, etc.
        bytes data;
    }
    
    struct EvaluationResult {
        address user;
        uint256 requestType;
        uint256 score;
        bool recommendation;
        string insights;
    }
    
    struct CertificateData {
        bytes32 certificateHash;
        address issuer;
        address recipient;
        uint256 issuanceDate;
        bytes metadata;
    }
    
    // ========== EVENTS ==========
    event ModelRegistered(uint256 indexed modelId, string modelType);
    event ModelUpdated(uint256 indexed modelId);
    event PredictionProcessed(address indexed user, uint256 prediction);
    event FraudDetected(address indexed user, bytes32 activityHash, uint256 confidence);
    event EvaluationCompleted(address indexed user, uint256 requestType, uint256 score);
    event AIProcessorUpdated(address indexed oldProcessor, address indexed newProcessor);
}
