// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

/**
 * @title AutomatedProposals
 * @dev Sistema de propuestas automatizadas basado en métricas on-chain
 * @author BrainSafes Team
 */
contract AutomatedProposals is AccessControl, ReentrancyGuard, Pausable {
    using Counters for Counters.Counter;
    using SafeMath for uint256;

    // Roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant AUTOMATION_ROLE = keccak256("AUTOMATION_ROLE");
    bytes32 public constant TEMPLATE_MANAGER_ROLE = keccak256("TEMPLATE_MANAGER_ROLE");

    // Estructuras
    struct ProposalRule {
        uint256 ruleId;
        string name;
        string description;
        MetricType metricType;
        uint256 threshold;
        ComparisonType comparison;
        uint256 cooldownPeriod;
        uint256 lastTriggered;
        bool isActive;
        uint256 templateId;
        bytes executionData;
    }

    struct ProposalTemplate {
        uint256 templateId;
        string name;
        string description;
        address target;
        bytes4 functionSelector;
        ParameterType[] parameterTypes;
        string[] parameterNames;
        bool isActive;
    }

    struct AutomatedProposal {
        uint256 proposalId;
        uint256 ruleId;
        uint256 templateId;
        uint256 timestamp;
        bytes executionData;
        bool executed;
        bool approved;
        address approver;
        uint256 metricValue;
        string reason;
    }

    struct MetricData {
        uint256 value;
        uint256 timestamp;
        string source;
        bool isValid;
    }

    struct ExecutionResult {
        bool success;
        bytes returnData;
        uint256 gasUsed;
        string error;
    }

    // Enums
    enum MetricType {
        TVL,
        DAILY_VOLUME,
        UNIQUE_USERS,
        GAS_PRICE,
        TOKEN_PRICE,
        GOVERNANCE_PARTICIPATION,
        VALIDATOR_COUNT,
        CUSTOM
    }

    enum ComparisonType {
        GREATER_THAN,
        LESS_THAN,
        EQUAL_TO,
        NOT_EQUAL,
        PERCENTAGE_INCREASE,
        PERCENTAGE_DECREASE
    }

    enum ParameterType {
        UINT256,
        ADDRESS,
        BOOL,
        STRING,
        BYTES,
        BYTES32
    }

    // Eventos
    event RuleCreated(
        uint256 indexed ruleId,
        string name,
        MetricType metricType,
        uint256 threshold,
        uint256 templateId
    );

    event TemplateCreated(
        uint256 indexed templateId,
        string name,
        address target,
        bytes4 functionSelector
    );

    event ProposalTriggered(
        uint256 indexed proposalId,
        uint256 indexed ruleId,
        uint256 metricValue,
        string reason
    );

    event ProposalApproved(
        uint256 indexed proposalId,
        address indexed approver,
        uint256 timestamp
    );

    event ProposalExecuted(
        uint256 indexed proposalId,
        bool success,
        uint256 gasUsed,
        string error
    );

    event MetricUpdated(
        MetricType indexed metricType,
        uint256 oldValue,
        uint256 newValue,
        string source
    );

    event RuleUpdated(
        uint256 indexed ruleId,
        uint256 oldThreshold,
        uint256 newThreshold,
        bool isActive
    );

    // Variables de estado
    mapping(uint256 => ProposalRule) public rules;
    mapping(uint256 => ProposalTemplate) public templates;
    mapping(uint256 => AutomatedProposal) public proposals;
    mapping(MetricType => MetricData) public metrics;
    mapping(uint256 => ExecutionResult) public executionResults;
    mapping(bytes32 => bool) public executedHashes;

    // Configuración
    uint256 public constant MIN_COOLDOWN_PERIOD = 1 hours;
    uint256 public constant MAX_COOLDOWN_PERIOD = 30 days;
    uint256 public constant MAX_RULES_PER_METRIC = 10;
    uint256 public constant MAX_PARAMETERS = 10;
    uint256 public constant EXECUTION_TIMEOUT = 5 minutes;

    // Contadores
    Counters.Counter private _ruleIdCounter;
    Counters.Counter private _templateIdCounter;
    Counters.Counter private _proposalIdCounter;

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(AUTOMATION_ROLE, msg.sender);
        _grantRole(TEMPLATE_MANAGER_ROLE, msg.sender);
    }

    /**
     * @dev Crea nueva regla de propuesta
     */
    function createRule(
        string memory name,
        string memory description,
        MetricType metricType,
        uint256 threshold,
        ComparisonType comparison,
        uint256 cooldownPeriod,
        uint256 templateId,
        bytes memory executionData
    ) external onlyRole(ADMIN_ROLE) returns (uint256) {
        require(bytes(name).length > 0, "Empty name");
        require(cooldownPeriod >= MIN_COOLDOWN_PERIOD, "Cooldown too short");
        require(cooldownPeriod <= MAX_COOLDOWN_PERIOD, "Cooldown too long");
        require(templates[templateId].isActive, "Invalid template");
        require(
            _countRulesForMetric(metricType) < MAX_RULES_PER_METRIC,
            "Too many rules"
        );

        _ruleIdCounter.increment();
        uint256 ruleId = _ruleIdCounter.current();

        rules[ruleId] = ProposalRule({
            ruleId: ruleId,
            name: name,
            description: description,
            metricType: metricType,
            threshold: threshold,
            comparison: comparison,
            cooldownPeriod: cooldownPeriod,
            lastTriggered: 0,
            isActive: true,
            templateId: templateId,
            executionData: executionData
        });

        emit RuleCreated(
            ruleId,
            name,
            metricType,
            threshold,
            templateId
        );

        return ruleId;
    }

    /**
     * @dev Crea nueva plantilla de propuesta
     */
    function createTemplate(
        string memory name,
        string memory description,
        address target,
        bytes4 functionSelector,
        ParameterType[] memory parameterTypes,
        string[] memory parameterNames
    ) external onlyRole(TEMPLATE_MANAGER_ROLE) returns (uint256) {
        require(bytes(name).length > 0, "Empty name");
        require(target != address(0), "Invalid target");
        require(
            parameterTypes.length == parameterNames.length,
            "Parameter mismatch"
        );
        require(parameterTypes.length <= MAX_PARAMETERS, "Too many parameters");

        _templateIdCounter.increment();
        uint256 templateId = _templateIdCounter.current();

        templates[templateId] = ProposalTemplate({
            templateId: templateId,
            name: name,
            description: description,
            target: target,
            functionSelector: functionSelector,
            parameterTypes: parameterTypes,
            parameterNames: parameterNames,
            isActive: true
        });

        emit TemplateCreated(
            templateId,
            name,
            target,
            functionSelector
        );

        return templateId;
    }

    /**
     * @dev Actualiza métrica y verifica reglas
     */
    function updateMetric(
        MetricType metricType,
        uint256 value,
        string memory source
    ) external onlyRole(AUTOMATION_ROLE) whenNotPaused {
        MetricData storage metric = metrics[metricType];
        uint256 oldValue = metric.value;

        metric.value = value;
        metric.timestamp = block.timestamp;
        metric.source = source;
        metric.isValid = true;

        emit MetricUpdated(
            metricType,
            oldValue,
            value,
            source
        );

        // Verificar reglas
        _checkRules(metricType, value);
    }

    /**
     * @dev Verifica reglas para una métrica
     */
    function _checkRules(
        MetricType metricType,
        uint256 value
    ) internal {
        uint256 totalRules = _ruleIdCounter.current();

        for (uint256 i = 1; i <= totalRules; i++) {
            ProposalRule storage rule = rules[i];
            
            if (!rule.isActive || rule.metricType != metricType) continue;
            if (block.timestamp < rule.lastTriggered + rule.cooldownPeriod) continue;

            if (_evaluateCondition(rule.comparison, value, rule.threshold)) {
                _triggerProposal(rule.ruleId, value);
                rule.lastTriggered = block.timestamp;
            }
        }
    }

    /**
     * @dev Evalúa condición de regla
     */
    function _evaluateCondition(
        ComparisonType comparison,
        uint256 value,
        uint256 threshold
    ) internal pure returns (bool) {
        if (comparison == ComparisonType.GREATER_THAN) {
            return value > threshold;
        } else if (comparison == ComparisonType.LESS_THAN) {
            return value < threshold;
        } else if (comparison == ComparisonType.EQUAL_TO) {
            return value == threshold;
        } else if (comparison == ComparisonType.NOT_EQUAL) {
            return value != threshold;
        } else if (comparison == ComparisonType.PERCENTAGE_INCREASE) {
            return value >= threshold.add(threshold.mul(100).div(10000));
        } else if (comparison == ComparisonType.PERCENTAGE_DECREASE) {
            return value <= threshold.sub(threshold.mul(100).div(10000));
        }
        return false;
    }

    /**
     * @dev Dispara propuesta automática
     */
    function _triggerProposal(
        uint256 ruleId,
        uint256 metricValue
    ) internal returns (uint256) {
        ProposalRule storage rule = rules[ruleId];
        
        _proposalIdCounter.increment();
        uint256 proposalId = _proposalIdCounter.current();

        proposals[proposalId] = AutomatedProposal({
            proposalId: proposalId,
            ruleId: ruleId,
            templateId: rule.templateId,
            timestamp: block.timestamp,
            executionData: rule.executionData,
            executed: false,
            approved: false,
            approver: address(0),
            metricValue: metricValue,
            reason: string(abi.encodePacked(
                "Metric triggered: ",
                _metricTypeToString(rule.metricType)
            ))
        });

        emit ProposalTriggered(
            proposalId,
            ruleId,
            metricValue,
            proposals[proposalId].reason
        );

        return proposalId;
    }

    /**
     * @dev Aprueba propuesta automática
     */
    function approveProposal(
        uint256 proposalId
    ) external onlyRole(ADMIN_ROLE) {
        AutomatedProposal storage proposal = proposals[proposalId];
        require(!proposal.approved, "Already approved");
        require(!proposal.executed, "Already executed");

        proposal.approved = true;
        proposal.approver = msg.sender;

        emit ProposalApproved(
            proposalId,
            msg.sender,
            block.timestamp
        );
    }

    /**
     * @dev Ejecuta propuesta automática
     */
    function executeProposal(
        uint256 proposalId
    ) external nonReentrant whenNotPaused {
        AutomatedProposal storage proposal = proposals[proposalId];
        require(proposal.approved, "Not approved");
        require(!proposal.executed, "Already executed");

        ProposalTemplate storage template = templates[proposal.templateId];
        require(template.isActive, "Template not active");

        // Verificar hash único de ejecución
        bytes32 executionHash = keccak256(abi.encodePacked(
            proposal.proposalId,
            proposal.ruleId,
            proposal.executionData
        ));
        require(!executedHashes[executionHash], "Duplicate execution");
        executedHashes[executionHash] = true;

        // Ejecutar llamada
        uint256 startGas = gasleft();
        (bool success, bytes memory returnData) = template.target.call(
            abi.encodePacked(template.functionSelector, proposal.executionData)
        );
        uint256 gasUsed = startGas - gasleft();

        // Registrar resultado
        executionResults[proposalId] = ExecutionResult({
            success: success,
            returnData: returnData,
            gasUsed: gasUsed,
            error: success ? "" : _getRevertMsg(returnData)
        });

        proposal.executed = true;

        emit ProposalExecuted(
            proposalId,
            success,
            gasUsed,
            success ? "" : _getRevertMsg(returnData)
        );
    }

    /**
     * @dev Actualiza regla existente
     */
    function updateRule(
        uint256 ruleId,
        uint256 newThreshold,
        uint256 newCooldown,
        bool isActive
    ) external onlyRole(ADMIN_ROLE) {
        require(rules[ruleId].ruleId != 0, "Rule not found");
        require(
            newCooldown >= MIN_COOLDOWN_PERIOD &&
            newCooldown <= MAX_COOLDOWN_PERIOD,
            "Invalid cooldown"
        );

        ProposalRule storage rule = rules[ruleId];
        uint256 oldThreshold = rule.threshold;

        rule.threshold = newThreshold;
        rule.cooldownPeriod = newCooldown;
        rule.isActive = isActive;

        emit RuleUpdated(
            ruleId,
            oldThreshold,
            newThreshold,
            isActive
        );
    }

    /**
     * @dev Obtiene mensaje de error de reversión
     */
    function _getRevertMsg(
        bytes memory returnData
    ) internal pure returns (string memory) {
        if (returnData.length < 68) return "Transaction reverted silently";
        
        assembly {
            returnData := add(returnData, 0x04)
        }
        
        return abi.decode(returnData, (string));
    }

    /**
     * @dev Convierte tipo de métrica a string
     */
    function _metricTypeToString(
        MetricType metricType
    ) internal pure returns (string memory) {
        if (metricType == MetricType.TVL) return "TVL";
        if (metricType == MetricType.DAILY_VOLUME) return "Daily Volume";
        if (metricType == MetricType.UNIQUE_USERS) return "Unique Users";
        if (metricType == MetricType.GAS_PRICE) return "Gas Price";
        if (metricType == MetricType.TOKEN_PRICE) return "Token Price";
        if (metricType == MetricType.GOVERNANCE_PARTICIPATION) return "Governance Participation";
        if (metricType == MetricType.VALIDATOR_COUNT) return "Validator Count";
        return "Custom";
    }

    /**
     * @dev Cuenta reglas por tipo de métrica
     */
    function _countRulesForMetric(
        MetricType metricType
    ) internal view returns (uint256) {
        uint256 count = 0;
        uint256 totalRules = _ruleIdCounter.current();

        for (uint256 i = 1; i <= totalRules; i++) {
            if (rules[i].metricType == metricType && rules[i].isActive) {
                count++;
            }
        }

        return count;
    }

    // Getters
    function getRule(
        uint256 ruleId
    ) external view returns (ProposalRule memory) {
        return rules[ruleId];
    }

    function getTemplate(
        uint256 templateId
    ) external view returns (ProposalTemplate memory) {
        return templates[templateId];
    }

    function getProposal(
        uint256 proposalId
    ) external view returns (AutomatedProposal memory) {
        return proposals[proposalId];
    }

    function getMetric(
        MetricType metricType
    ) external view returns (MetricData memory) {
        return metrics[metricType];
    }

    function getExecutionResult(
        uint256 proposalId
    ) external view returns (ExecutionResult memory) {
        return executionResults[proposalId];
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