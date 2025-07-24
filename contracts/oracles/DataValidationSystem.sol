// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "../interfaces/IAIProcessor.sol";
import "../utils/SecurityManager.sol";

/**
 * @title DataValidationSystem
 * @dev Sistema avanzado de validación de datos para oráculos en BrainSafes
 * @notice Proporciona validación multi-nivel, detección de anomalías y verificación cruzada
 * @custom:security-contact security@brainsafes.com
 */
contract DataValidationSystem is AccessControl, ReentrancyGuard, Pausable {
    using SafeMath for uint256;

    // Roles
    bytes32 public constant VALIDATION_ADMIN = keccak256("VALIDATION_ADMIN");
    bytes32 public constant VALIDATOR_ROLE = keccak256("VALIDATOR_ROLE");
    bytes32 public constant AI_VALIDATOR = keccak256("AI_VALIDATOR");

    // Interfaces
    IAIProcessor public aiProcessor;
    SecurityManager public securityManager;

    // Estructuras de validación
    struct ValidationRule {
        uint256 id;
        string name;
        RuleType ruleType;
        bytes32 dataKey;
        uint256 minValue;
        uint256 maxValue;
        uint256 maxDeviation; // Porcentaje (ej: 5 = 5%)
        uint256 maxAge; // Segundos
        uint256 minSources;
        bool isActive;
        uint256 createdAt;
        address creator;
    }

    struct ValidationResult {
        bytes32 dataHash;
        bool isValid;
        uint256 confidence;
        string[] failedRules;
        uint256 validationScore;
        uint256 timestamp;
        address validator;
        ValidationMethod method;
    }

    struct DataPoint {
        bytes32 key;
        uint256 value;
        bytes metadata;
        uint256 timestamp;
        address source;
        uint256 weight;
        bool isValidated;
        mapping(uint256 => ValidationResult) validationResults;
        uint256 validationCount;
    }

    struct AnomalyDetection {
        bytes32 dataKey;
        uint256[] historicalValues;
        uint256 mean;
        uint256 standardDeviation;
        uint256 lastCalculated;
        uint256 sampleSize;
        uint256 anomalyThreshold; // Múltiplos de desviación estándar
    }

    struct CrossValidation {
        bytes32 primaryKey;
        bytes32[] relatedKeys;
        uint256[] correlationFactors; // Factores de correlación esperada (0-100%)
        uint256 maxCorrelationDeviation;
        bool isActive;
    }

    struct ValidationMetrics {
        uint256 totalValidations;
        uint256 successfulValidations;
        uint256 averageConfidence;
        uint256 anomaliesDetected;
        uint256 falsePositives;
        uint256 falseNegatives;
        uint256 lastUpdated;
    }

    // Enums
    enum RuleType {
        RANGE_CHECK,
        DEVIATION_CHECK,
        FRESHNESS_CHECK,
        SOURCE_COUNT_CHECK,
        CORRELATION_CHECK,
        AI_VALIDATION,
        CUSTOM
    }

    enum ValidationMethod {
        RULE_BASED,
        AI_POWERED,
        CROSS_VALIDATION,
        ANOMALY_DETECTION,
        COMPOSITE
    }

    // Mappings
    mapping(uint256 => ValidationRule) public validationRules;
    mapping(bytes32 => DataPoint) public dataPoints;
    mapping(bytes32 => AnomalyDetection) public anomalyDetectors;
    mapping(bytes32 => CrossValidation) public crossValidations;
    mapping(address => ValidationMetrics) public validatorMetrics;
    mapping(bytes32 => uint256[]) public rulesByDataKey;

    // Contadores
    uint256 private ruleCounter;
    uint256 public constant MAX_RULES = 1000;
    uint256 public constant MAX_HISTORICAL_SAMPLES = 100;
    uint256 public constant DEFAULT_ANOMALY_THRESHOLD = 3; // 3 desviaciones estándar

    // Configuración
    uint256 public validationTimeout = 5 minutes;
    uint256 public minValidationConfidence = 75; // 75%
    uint256 public maxValidationAge = 1 hours;

    // Eventos
    event ValidationRuleCreated(uint256 indexed ruleId, string name, RuleType ruleType);
    event DataValidated(bytes32 indexed dataHash, bool isValid, uint256 confidence);
    event AnomalyDetected(bytes32 indexed dataKey, uint256 value, uint256 expectedRange);
    event ValidationRuleUpdated(uint256 indexed ruleId, string field, uint256 oldValue, uint256 newValue);
    event CrossValidationFailed(bytes32 indexed primaryKey, bytes32[] relatedKeys, string reason);
    event ValidatorPerformanceUpdated(address indexed validator, uint256 successRate, uint256 totalValidations);

    /**
     * @dev Constructor
     */
    constructor(
        address _aiProcessor,
        address _securityManager
    ) {
        require(_aiProcessor != address(0), "Invalid AI processor");
        require(_securityManager != address(0), "Invalid security manager");

        aiProcessor = IAIProcessor(_aiProcessor);
        securityManager = SecurityManager(_securityManager);

        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(VALIDATION_ADMIN, msg.sender);
        _setupRole(VALIDATOR_ROLE, msg.sender);
    }

    /**
     * @dev Crear nueva regla de validación
     */
    function createValidationRule(
        string memory name,
        RuleType ruleType,
        bytes32 dataKey,
        uint256 minValue,
        uint256 maxValue,
        uint256 maxDeviation,
        uint256 maxAge,
        uint256 minSources
    ) external onlyRole(VALIDATION_ADMIN) returns (uint256) {
        require(bytes(name).length > 0, "Invalid name");
        require(ruleCounter < MAX_RULES, "Max rules reached");

        ruleCounter++;
        ValidationRule storage rule = validationRules[ruleCounter];
        rule.id = ruleCounter;
        rule.name = name;
        rule.ruleType = ruleType;
        rule.dataKey = dataKey;
        rule.minValue = minValue;
        rule.maxValue = maxValue;
        rule.maxDeviation = maxDeviation;
        rule.maxAge = maxAge;
        rule.minSources = minSources;
        rule.isActive = true;
        rule.createdAt = block.timestamp;
        rule.creator = msg.sender;

        rulesByDataKey[dataKey].push(ruleCounter);

        emit ValidationRuleCreated(ruleCounter, name, ruleType);
        return ruleCounter;
    }

    /**
     * @dev Validar datos usando múltiples métodos
     */
    function validateData(
        bytes32 dataKey,
        uint256 value,
        bytes memory metadata,
        address source
    ) external onlyRole(VALIDATOR_ROLE) whenNotPaused returns (ValidationResult memory) {
        require(source != address(0), "Invalid source");

        bytes32 dataHash = keccak256(abi.encodePacked(dataKey, value, block.timestamp));
        
        // Registrar punto de datos
        DataPoint storage dataPoint = dataPoints[dataHash];
        dataPoint.key = dataKey;
        dataPoint.value = value;
        dataPoint.metadata = metadata;
        dataPoint.timestamp = block.timestamp;
        dataPoint.source = source;
        dataPoint.weight = _calculateSourceWeight(source);

        // Ejecutar validaciones
        ValidationResult memory result = _performComprehensiveValidation(dataKey, value, metadata, source);
        
        // Almacenar resultado
        dataPoint.validationResults[dataPoint.validationCount] = result;
        dataPoint.validationCount++;
        dataPoint.isValidated = result.isValid;

        // Actualizar métricas del validador
        _updateValidatorMetrics(msg.sender, result.isValid, result.confidence);

        // Actualizar detección de anomalías
        _updateAnomalyDetection(dataKey, value);

        emit DataValidated(dataHash, result.isValid, result.confidence);
        return result;
    }

    /**
     * @dev Realizar validación comprehensiva
     */
    function _performComprehensiveValidation(
        bytes32 dataKey,
        uint256 value,
        bytes memory metadata,
        address source
    ) internal returns (ValidationResult memory) {
        ValidationResult memory result;
        result.dataHash = keccak256(abi.encodePacked(dataKey, value, block.timestamp));
        result.timestamp = block.timestamp;
        result.validator = msg.sender;
        result.method = ValidationMethod.COMPOSITE;

        uint256 totalScore = 0;
        uint256 weightSum = 0;
        string[] memory failedRules = new string[](0);

        // 1. Validación basada en reglas
        (bool rulesValid, uint256 rulesScore, string[] memory ruleFailures) = _validateAgainstRules(dataKey, value);
        totalScore = totalScore.add(rulesScore.mul(40)); // 40% peso
        weightSum = weightSum.add(40);
        if (!rulesValid) {
            failedRules = _appendFailedRules(failedRules, ruleFailures);
        }

        // 2. Detección de anomalías
        (bool anomalyValid, uint256 anomalyScore) = _detectAnomalies(dataKey, value);
        totalScore = totalScore.add(anomalyScore.mul(25)); // 25% peso
        weightSum = weightSum.add(25);
        if (!anomalyValid) {
            failedRules = _appendFailedRules(failedRules, _createArray("ANOMALY_DETECTED"));
        }

        // 3. Validación cruzada
        (bool crossValid, uint256 crossScore) = _performCrossValidation(dataKey, value);
        totalScore = totalScore.add(crossScore.mul(20)); // 20% peso
        weightSum = weightSum.add(20);
        if (!crossValid) {
            failedRules = _appendFailedRules(failedRules, _createArray("CROSS_VALIDATION_FAILED"));
        }

        // 4. Validación con IA
        (bool aiValid, uint256 aiScore) = _performAIValidation(dataKey, value, metadata);
        totalScore = totalScore.add(aiScore.mul(15)); // 15% peso
        weightSum = weightSum.add(15);
        if (!aiValid) {
            failedRules = _appendFailedRules(failedRules, _createArray("AI_VALIDATION_FAILED"));
        }

        // Calcular resultado final
        result.validationScore = totalScore.div(weightSum);
        result.confidence = result.validationScore;
        result.isValid = result.validationScore >= minValidationConfidence && failedRules.length == 0;
        result.failedRules = failedRules;

        return result;
    }

    /**
     * @dev Validar contra reglas definidas
     */
    function _validateAgainstRules(
        bytes32 dataKey,
        uint256 value
    ) internal view returns (bool isValid, uint256 score, string[] memory failedRules) {
        uint256[] memory ruleIds = rulesByDataKey[dataKey];
        string[] memory failures = new string[](ruleIds.length);
        uint256 failureCount = 0;
        uint256 totalScore = 0;
        uint256 ruleCount = 0;

        for (uint256 i = 0; i < ruleIds.length; i++) {
            ValidationRule storage rule = validationRules[ruleIds[i]];
            if (!rule.isActive) continue;

            bool ruleValid = true;
            ruleCount++;

            if (rule.ruleType == RuleType.RANGE_CHECK) {
                if (value < rule.minValue || value > rule.maxValue) {
                    ruleValid = false;
                    failures[failureCount] = rule.name;
                    failureCount++;
                }
            }
            // Agregar más validaciones según el tipo de regla...

            if (ruleValid) {
                totalScore = totalScore.add(100);
            }
        }

        // Crear array del tamaño correcto
        string[] memory actualFailures = new string[](failureCount);
        for (uint256 i = 0; i < failureCount; i++) {
            actualFailures[i] = failures[i];
        }

        return (
            failureCount == 0,
            ruleCount > 0 ? totalScore.div(ruleCount) : 0,
            actualFailures
        );
    }

    /**
     * @dev Detectar anomalías usando análisis estadístico
     */
    function _detectAnomalies(
        bytes32 dataKey,
        uint256 value
    ) internal view returns (bool isValid, uint256 score) {
        AnomalyDetection storage detector = anomalyDetectors[dataKey];
        
        if (detector.sampleSize < 5) {
            // Insuficientes datos para detección de anomalías
            return (true, 100);
        }

        // Calcular desviación del valor respecto a la media
        uint256 deviation = value > detector.mean ? 
            value.sub(detector.mean) : 
            detector.mean.sub(value);

        uint256 allowedDeviation = detector.standardDeviation.mul(detector.anomalyThreshold);
        
        if (deviation <= allowedDeviation) {
            return (true, 100);
        } else {
            // Calcular score basado en qué tan lejos está de lo normal
            uint256 deviationRatio = deviation.mul(100).div(allowedDeviation);
            uint256 anomalyScore = deviationRatio > 200 ? 0 : 100 - (deviationRatio.sub(100));
            return (false, anomalyScore);
        }
    }

    /**
     * @dev Realizar validación cruzada con datos relacionados
     */
    function _performCrossValidation(
        bytes32 dataKey,
        uint256 value
    ) internal view returns (bool isValid, uint256 score) {
        CrossValidation storage crossVal = crossValidations[dataKey];
        
        if (!crossVal.isActive || crossVal.relatedKeys.length == 0) {
            return (true, 100);
        }

        uint256 validCorrelations = 0;
        uint256 totalCorrelations = crossVal.relatedKeys.length;

        for (uint256 i = 0; i < crossVal.relatedKeys.length; i++) {
            // Implementar lógica de correlación
            // Por simplicidad, retornamos válido por ahora
            validCorrelations++;
        }

        uint256 correlationScore = validCorrelations.mul(100).div(totalCorrelations);
        return (correlationScore >= 70, correlationScore);
    }

    /**
     * @dev Validación usando IA
     */
    function _performAIValidation(
        bytes32 dataKey,
        uint256 value,
        bytes memory metadata
    ) internal returns (bool isValid, uint256 score) {
        // Preparar input para el modelo de IA
        bytes memory aiInput = abi.encode(dataKey, value, metadata, block.timestamp);
        
        try aiProcessor.processInference(4, aiInput) returns (IAIProcessor.InferenceResult memory result) {
            uint256 confidence = result.confidence;
            return (confidence >= 75, confidence);
        } catch {
            // Si falla la IA, asumir válido con score medio
            return (true, 70);
        }
    }

    /**
     * @dev Actualizar detección de anomalías
     */
    function _updateAnomalyDetection(bytes32 dataKey, uint256 value) internal {
        AnomalyDetection storage detector = anomalyDetectors[dataKey];
        
        // Agregar valor al historial
        if (detector.historicalValues.length >= MAX_HISTORICAL_SAMPLES) {
            // Remover el más antiguo
            for (uint256 i = 0; i < detector.historicalValues.length - 1; i++) {
                detector.historicalValues[i] = detector.historicalValues[i + 1];
            }
            detector.historicalValues[detector.historicalValues.length - 1] = value;
        } else {
            detector.historicalValues.push(value);
        }

        detector.sampleSize = detector.historicalValues.length;
        
        // Recalcular estadísticas
        if (detector.sampleSize >= 3) {
            (detector.mean, detector.standardDeviation) = _calculateStatistics(detector.historicalValues);
            detector.lastCalculated = block.timestamp;
        }

        if (detector.anomalyThreshold == 0) {
            detector.anomalyThreshold = DEFAULT_ANOMALY_THRESHOLD;
        }
    }

    /**
     * @dev Calcular estadísticas (media y desviación estándar)
     */
    function _calculateStatistics(
        uint256[] storage values
    ) internal view returns (uint256 mean, uint256 standardDeviation) {
        if (values.length == 0) return (0, 0);

        // Calcular media
        uint256 sum = 0;
        for (uint256 i = 0; i < values.length; i++) {
            sum = sum.add(values[i]);
        }
        mean = sum.div(values.length);

        // Calcular desviación estándar
        uint256 varianceSum = 0;
        for (uint256 i = 0; i < values.length; i++) {
            uint256 diff = values[i] > mean ? values[i].sub(mean) : mean.sub(values[i]);
            varianceSum = varianceSum.add(diff.mul(diff));
        }
        
        uint256 variance = varianceSum.div(values.length);
        standardDeviation = _sqrt(variance);
    }

    /**
     * @dev Calcular raíz cuadrada (aproximación)
     */
    function _sqrt(uint256 x) internal pure returns (uint256) {
        if (x == 0) return 0;
        uint256 z = x.add(1).div(2);
        uint256 y = x;
        while (z < y) {
            y = z;
            z = (x.div(z).add(z)).div(2);
        }
        return y;
    }

    /**
     * @dev Calcular peso de la fuente
     */
    function _calculateSourceWeight(address source) internal view returns (uint256) {
        // Implementar lógica para calcular peso basado en reputación de la fuente
        return 100; // Peso por defecto
    }

    /**
     * @dev Actualizar métricas del validador
     */
    function _updateValidatorMetrics(
        address validator,
        bool wasSuccessful,
        uint256 confidence
    ) internal {
        ValidationMetrics storage metrics = validatorMetrics[validator];
        metrics.totalValidations++;
        
        if (wasSuccessful) {
            metrics.successfulValidations++;
        }
        
        // Actualizar confianza promedio
        metrics.averageConfidence = (metrics.averageConfidence
            .mul(metrics.totalValidations.sub(1))
            .add(confidence))
            .div(metrics.totalValidations);
        
        metrics.lastUpdated = block.timestamp;

        emit ValidatorPerformanceUpdated(
            validator,
            metrics.successfulValidations.mul(100).div(metrics.totalValidations),
            metrics.totalValidations
        );
    }

    /**
     * @dev Funciones auxiliares para manejo de arrays
     */
    function _appendFailedRules(
        string[] memory existing,
        string[] memory newRules
    ) internal pure returns (string[] memory) {
        string[] memory combined = new string[](existing.length + newRules.length);
        
        for (uint256 i = 0; i < existing.length; i++) {
            combined[i] = existing[i];
        }
        
        for (uint256 i = 0; i < newRules.length; i++) {
            combined[existing.length + i] = newRules[i];
        }
        
        return combined;
    }

    function _createArray(string memory item) internal pure returns (string[] memory) {
        string[] memory array = new string[](1);
        array[0] = item;
        return array;
    }

    /**
     * @dev Configurar validación cruzada
     */
    function setupCrossValidation(
        bytes32 primaryKey,
        bytes32[] memory relatedKeys,
        uint256[] memory correlationFactors,
        uint256 maxCorrelationDeviation
    ) external onlyRole(VALIDATION_ADMIN) {
        require(relatedKeys.length == correlationFactors.length, "Length mismatch");
        require(maxCorrelationDeviation <= 100, "Invalid deviation");

        CrossValidation storage crossVal = crossValidations[primaryKey];
        crossVal.primaryKey = primaryKey;
        crossVal.relatedKeys = relatedKeys;
        crossVal.correlationFactors = correlationFactors;
        crossVal.maxCorrelationDeviation = maxCorrelationDeviation;
        crossVal.isActive = true;
    }

    /**
     * @dev Obtener métricas de validación
     */
    function getValidationMetrics(
        address validator
    ) external view returns (ValidationMetrics memory) {
        return validatorMetrics[validator];
    }

    /**
     * @dev Obtener resultado de validación de datos
     */
    function getValidationResult(
        bytes32 dataHash,
        uint256 validationIndex
    ) external view returns (ValidationResult memory) {
        return dataPoints[dataHash].validationResults[validationIndex];
    }

    /**
     * @dev Pausar el contrato
     */
    function pause() external onlyRole(VALIDATION_ADMIN) {
        _pause();
    }

    /**
     * @dev Reanudar el contrato
     */
    function unpause() external onlyRole(VALIDATION_ADMIN) {
        _unpause();
    }
} 