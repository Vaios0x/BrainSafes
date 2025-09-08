// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "../interfaces/IAIProcessor.sol";
import "../optimizations/AdvancedBatchProcessor.sol";
import "../cache/DistributedCacheV2.sol";


contract AIOracle is AccessControl, ReentrancyGuard, Pausable {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    IAIProcessor public aiProcessor;
    
    // Configuración de modelos
    uint256 public constant PERFORMANCE_MODEL_ID = 1;
    uint256 public constant LEARNING_PATH_MODEL_ID = 2;
    uint256 public constant FRAUD_DETECTION_MODEL_ID = 3;

    // Eventos
    event ModelRegistered(uint256 indexed modelId, string name);
    event PredictionProcessed(address indexed student, uint256 prediction);
    event FraudDetected(address indexed user, bytes32 activityHash, uint256 confidence);

    constructor(address _aiProcessor) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, msg.sender);
        
        aiProcessor = IAIProcessor(_aiProcessor);
        
        // Registrar modelos
        _registerModels();
    }

    
    function _registerModels() internal {
        // Modelo de predicción de rendimiento
        aiProcessor.registerModel(
            PERFORMANCE_MODEL_ID,
            1024, // inputSize
            128,  // outputSize
            32,   // batchSize
            100   // computeUnits
        );

        // Modelo de generación de rutas de aprendizaje
        aiProcessor.registerModel(
            LEARNING_PATH_MODEL_ID,
            2048, // inputSize
            512,  // outputSize
            16,   // batchSize
            200   // computeUnits
        );

        // Modelo de detección de fraude
        aiProcessor.registerModel(
            FRAUD_DETECTION_MODEL_ID,
            512,  // inputSize
            64,   // outputSize
            64,   // batchSize
            150   // computeUnits
        );
    }

    
    function predictStudentPerformance(
        address student,
        uint256 courseId
    ) external view returns (uint256) {
        bytes memory input = abi.encode(student, courseId);
        
        IAIProcessor.InferenceResult memory result = aiProcessor.processInference(
            PERFORMANCE_MODEL_ID,
            input
        );
        
        return result.confidence;
    }

    
    function generateLearningPath(
        address student
    ) external view returns (uint256[] memory) {
        bytes memory input = abi.encode(student);
        
        IAIProcessor.InferenceResult memory result = aiProcessor.processInference(
            LEARNING_PATH_MODEL_ID,
            input
        );
        
        return abi.decode(result.output, (uint256[]));
    }

    
    function detectFraud(
        address user,
        bytes32 activityHash
    ) external view returns (bool) {
        bytes memory input = abi.encode(user, activityHash);
        
        IAIProcessor.InferenceResult memory result = aiProcessor.processInference(
            FRAUD_DETECTION_MODEL_ID,
            input
        );
        
        uint256 fraudScore = result.confidence;
        bool isFraud = fraudScore >= 75; // Umbral de 75%
        
        if (isFraud) {
            emit FraudDetected(user, activityHash, fraudScore);
        }
        
        return isFraud;
    }

    
    function batchPredictPerformance(
        address[] calldata students,
        uint256[] calldata courseIds
    ) external view returns (uint256[] memory) {
        require(students.length == courseIds.length, "Length mismatch");
        
        bytes[] memory inputs = new bytes[](students.length);
        for (uint256 i = 0; i < students.length; i++) {
            inputs[i] = abi.encode(students[i], courseIds[i]);
        }
        
        IAIProcessor.InferenceResult[] memory results = aiProcessor.batchProcess(
            PERFORMANCE_MODEL_ID,
            inputs
        );
        
        uint256[] memory predictions = new uint256[](results.length);
        for (uint256 i = 0; i < results.length; i++) {
            predictions[i] = results[i].confidence;
        }
        
        return predictions;
    }

    
    function getModelStats(
        uint256 modelId
    ) external view returns (IAIProcessor.ProcessingStats memory) {
        return aiProcessor.getProcessingStats(modelId);
    }

    
    function updateAIProcessor(
        address newProcessor
    ) external onlyRole(ADMIN_ROLE) {
        require(newProcessor != address(0), "Invalid address");
        aiProcessor = IAIProcessor(newProcessor);
        _registerModels();
    }

    
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    // Nuevos módulos de optimización
    AdvancedBatchProcessor public batchProcessor;
    DistributedCacheV2 public distributedCache;

    event BatchProcessorSet(address indexed processor);
    event DistributedCacheSet(address indexed cache);

    
    function setBatchProcessor(address _processor) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_processor != address(0), "Invalid address");
        batchProcessor = AdvancedBatchProcessor(_processor);
        emit BatchProcessorSet(_processor);
    }
    
    function setDistributedCache(address _cache) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_cache != address(0), "Invalid address");
        distributedCache = DistributedCacheV2(_cache);
        emit DistributedCacheSet(_cache);
    }
    
    function batchInfer(bytes[] calldata inputs) external returns (bytes[] memory results) {
        require(address(batchProcessor) != address(0), "BatchProcessor not set");
        
        // Mock implementation - process inputs individually
        results = new bytes[](inputs.length);
        for (uint256 i = 0; i < inputs.length; i++) {
            results[i] = abi.encode("mock_result");
        }
    }
    
    function cacheInference(bytes32 key, bytes memory result, uint256 expiresAt) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(address(distributedCache) != address(0), "Cache not set");
        distributedCache.setCache(key, result, expiresAt);
    }

    // ========== SCHOLARSHIP FUNCTIONS ==========
    
    function evaluateScholarshipCandidate(
        address candidate,
        uint256 programId,
        bytes memory candidateData
    ) external view returns (uint256 score, bool recommendation) {
        bytes memory input = abi.encode(candidate, programId, candidateData);
        
        IAIProcessor.InferenceResult memory result = aiProcessor.processInference(
            PERFORMANCE_MODEL_ID, // Reuse performance model for scholarship evaluation
            input
        );
        
        score = result.confidence;
        recommendation = score >= 70; // 70% threshold for scholarship recommendation
    }
    
    function getScholarshipEligibilityScore(address student) external view returns (uint256) {
        bytes memory input = abi.encode(student);
        
        IAIProcessor.InferenceResult memory result = aiProcessor.processInference(
            PERFORMANCE_MODEL_ID,
            input
        );
        
        return result.confidence;
    }
    
    function recommendScholarships(address student) external view returns (uint256[] memory) {
        bytes memory input = abi.encode(student);
        
        IAIProcessor.InferenceResult memory result = aiProcessor.processInference(
            LEARNING_PATH_MODEL_ID,
            input
        );
        
        return abi.decode(result.output, (uint256[]));
    }

    // ========== JOB MARKETPLACE FUNCTIONS ==========
    
    function calculateJobMatch(
        address candidate,
        uint256 jobId,
        bytes memory candidateData
    ) external view returns (uint256) {
        bytes memory input = abi.encode(candidate, jobId, candidateData);
        
        IAIProcessor.InferenceResult memory result = aiProcessor.processInference(
            PERFORMANCE_MODEL_ID, // Reuse performance model for job matching
            input
        );
        
        return result.confidence;
    }
    
    function recommendJobs(address candidate) external view returns (uint256[] memory) {
        bytes memory input = abi.encode(candidate);
        
        IAIProcessor.InferenceResult memory result = aiProcessor.processInference(
            LEARNING_PATH_MODEL_ID, // Reuse learning path model for job recommendations
            input
        );
        
        return abi.decode(result.output, (uint256[]));
    }
    
    function analyzeCandidateProfile(
        address candidate
    ) external view returns (
        string[] memory skills,
        uint256 experienceYears,
        uint8[] memory skillLevels
    ) {
        bytes memory input = abi.encode(candidate);
        
        IAIProcessor.InferenceResult memory result = aiProcessor.processInference(
            PERFORMANCE_MODEL_ID,
            input
        );
        
        // Mock implementation - decode structured data
        skills = new string[](3);
        skills[0] = "Solidity";
        skills[1] = "JavaScript";
        skills[2] = "React";
        
        experienceYears = result.confidence / 10; // Convert confidence to years
        
        skillLevels = new uint8[](3);
        skillLevels[0] = uint8((result.confidence % 100) / 20); // 0-5 scale
        skillLevels[1] = uint8((result.confidence % 80) / 16);
        skillLevels[2] = uint8((result.confidence % 60) / 12);
    }

    // ========== COURSE RECOMMENDATION FUNCTIONS ==========
    
    function recommendCourses(address student) external view returns (uint256[] memory) {
        bytes memory input = abi.encode(student);
        
        IAIProcessor.InferenceResult memory result = aiProcessor.processInference(
            LEARNING_PATH_MODEL_ID,
            input
        );
        
        return abi.decode(result.output, (uint256[]));
    }
    
    function assessCourseDifficulty(
        address student,
        uint256 courseId
    ) external view returns (uint256) {
        bytes memory input = abi.encode(student, courseId);
        
        IAIProcessor.InferenceResult memory result = aiProcessor.processInference(
            PERFORMANCE_MODEL_ID,
            input
        );
        
        // Return difficulty score (higher = more difficult)
        return 100 - result.confidence; // Invert confidence to get difficulty
    }
    
    function predictCompletionTime(
        address student,
        uint256 courseId
    ) external view returns (uint256) {
        bytes memory input = abi.encode(student, courseId);
        
        IAIProcessor.InferenceResult memory result = aiProcessor.processInference(
            PERFORMANCE_MODEL_ID,
            input
        );
        
        // Convert confidence to estimated hours (40-200 hours based on difficulty)
        return 40 + ((100 - result.confidence) * 160 / 100);
    }

    // ========== CERTIFICATE VALIDATION FUNCTIONS ==========
    
    function validateCertificate(
        bytes32 certificateHash,
        address issuer,
        address recipient
    ) external view returns (bool) {
        bytes memory input = abi.encode(certificateHash, issuer, recipient);
        
        IAIProcessor.InferenceResult memory result = aiProcessor.processInference(
            FRAUD_DETECTION_MODEL_ID,
            input
        );
        
        return result.confidence >= 80; // 80% confidence threshold for validation
    }
    
    function detectCertificateFraud(bytes memory certificateData) external view returns (bool) {
        bytes32 dataHash = keccak256(certificateData);
        bytes memory input = abi.encode(msg.sender, dataHash);
        
        IAIProcessor.InferenceResult memory result = aiProcessor.processInference(
            FRAUD_DETECTION_MODEL_ID,
            input
        );
        
        uint256 fraudScore = result.confidence;
        bool isFraud = fraudScore >= 75; // Umbral de 75%
        
        if (isFraud) {
            emit FraudDetected(msg.sender, dataHash, fraudScore);
        }
        
        return isFraud;
    }

    // ========== REPUTATION FUNCTIONS ==========
    
    function calculateReputationScore(address user) external view returns (uint256) {
        bytes memory input = abi.encode(user);
        
        IAIProcessor.InferenceResult memory result = aiProcessor.processInference(
            PERFORMANCE_MODEL_ID,
            input
        );
        
        return result.confidence;
    }
    
    function predictUserBehavior(
        address user
    ) external view returns (uint256 riskScore, string memory behaviorType) {
        bytes memory input = abi.encode(user);
        
        IAIProcessor.InferenceResult memory result = aiProcessor.processInference(
            FRAUD_DETECTION_MODEL_ID,
            input
        );
        
        riskScore = 100 - result.confidence; // Lower confidence = higher risk
        
        if (riskScore < 20) {
            behaviorType = "LOW_RISK";
        } else if (riskScore < 50) {
            behaviorType = "MEDIUM_RISK";
        } else {
            behaviorType = "HIGH_RISK";
        }
    }

    // ========== CONTENT ANALYSIS FUNCTIONS ==========
    
    function analyzeContentQuality(
        uint256 courseId,
        bytes32 contentHash
    ) external view returns (uint256) {
        bytes memory input = abi.encode(courseId, contentHash);
        
        IAIProcessor.InferenceResult memory result = aiProcessor.processInference(
            PERFORMANCE_MODEL_ID,
            input
        );
        
        return result.confidence; // Quality score 0-100
    }
    
    function detectPlagiarism(
        bytes32 submissionHash,
        bytes memory referenceData
    ) external view returns (uint256) {
        bytes memory input = abi.encode(submissionHash, referenceData);
        
        IAIProcessor.InferenceResult memory result = aiProcessor.processInference(
            FRAUD_DETECTION_MODEL_ID,
            input
        );
        
        return result.confidence; // Plagiarism confidence score 0-100
    }

    // ========== BATCH PROCESSING FUNCTIONS ==========
    
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

    function batchProcessEvaluations(
        EvaluationRequest[] calldata requests
    ) external view returns (EvaluationResult[] memory) {
        EvaluationResult[] memory results = new EvaluationResult[](requests.length);
        
        for (uint256 i = 0; i < requests.length; i++) {
            IAIProcessor.InferenceResult memory aiResult = aiProcessor.processInference(
                requests[i].requestType == 1 ? PERFORMANCE_MODEL_ID :
                requests[i].requestType == 2 ? LEARNING_PATH_MODEL_ID :
                FRAUD_DETECTION_MODEL_ID,
                requests[i].data
            );
            
            results[i] = EvaluationResult({
                user: requests[i].user,
                requestType: requests[i].requestType,
                score: aiResult.confidence,
                recommendation: aiResult.confidence >= 70,
                insights: "AI-generated insights"
            });
        }
        
        return results;
    }
    
    function batchValidateCertificates(
        CertificateData[] calldata certificates
    ) external view returns (bool[] memory) {
        bool[] memory results = new bool[](certificates.length);
        
        for (uint256 i = 0; i < certificates.length; i++) {
            bytes memory input = abi.encode(
                certificates[i].certificateHash,
                certificates[i].issuer,
                certificates[i].recipient
            );
            
            IAIProcessor.InferenceResult memory result = aiProcessor.processInference(
                FRAUD_DETECTION_MODEL_ID,
                input
            );
            
            results[i] = result.confidence >= 80; // 80% confidence threshold for validation
        }
        
        return results;
    }

    // ========== MODEL MANAGEMENT FUNCTIONS ==========
    
    mapping(uint256 => ModelInfo) public models;
    
    struct ModelInfo {
        string modelType;
        bytes parameters;
        bool isActive;
    }
    
    function registerModel(
        uint256 modelId,
        string memory modelType,
        bytes memory parameters
    ) external onlyRole(ADMIN_ROLE) {
        models[modelId] = ModelInfo({
            modelType: modelType,
            parameters: parameters,
            isActive: true
        });
        
        emit ModelRegistered(modelId, modelType);
    }
    
    function updateModel(
        uint256 modelId,
        bytes memory parameters
    ) external onlyRole(ADMIN_ROLE) {
        require(models[modelId].isActive, "Model not found");
        models[modelId].parameters = parameters;
        emit ModelUpdated(modelId);
    }
    
    function getModelInfo(
        uint256 modelId
    ) external view returns (
        string memory modelType,
        bytes memory parameters,
        bool isActive
    ) {
        ModelInfo memory model = models[modelId];
        return (model.modelType, model.parameters, model.isActive);
    }

    // ========== ADMIN FUNCTIONS ==========
    
    function paused() public view override returns (bool) {
        return super.paused();
    }

    // ========== EVENTS ==========
    event ModelUpdated(uint256 indexed modelId);
} 