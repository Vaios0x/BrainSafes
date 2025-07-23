// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "../interfaces/IAIProcessor.sol";

/**
 * @title AIOracle
 * @notice AI-powered oracle for predictions, recommendations, and fraud detection in BrainSafes
 * @dev Provides AI evaluation for scholarships, courses, and certificates
 * @author BrainSafes Team
 */
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

    /**
     * @dev Registra los modelos iniciales
     */
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

    /**
     * @dev Predice el rendimiento del estudiante
     */
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

    /**
     * @dev Genera una ruta de aprendizaje personalizada
     */
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

    /**
     * @dev Detecta actividad fraudulenta
     */
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

    /**
     * @dev Procesa múltiples predicciones en lote
     */
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

    /**
     * @dev Obtiene estadísticas de procesamiento
     */
    function getModelStats(
        uint256 modelId
    ) external view returns (IAIProcessor.ProcessingStats memory) {
        return aiProcessor.getProcessingStats(modelId);
    }

    /**
     * @dev Actualiza la dirección del procesador de IA
     */
    function updateAIProcessor(
        address newProcessor
    ) external onlyRole(ADMIN_ROLE) {
        require(newProcessor != address(0), "Invalid address");
        aiProcessor = IAIProcessor(newProcessor);
        _registerModels();
    }

    /**
     * @dev Pausa el contrato
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    /**
     * @dev Despausa el contrato
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
} 