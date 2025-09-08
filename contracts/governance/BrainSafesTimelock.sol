// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";


contract BrainSafesTimelock is AccessControl, ReentrancyGuard, Pausable {
    using Counters for Counters.Counter;

    // Roles
    bytes32 public constant TIMELOCK_ADMIN_ROLE = keccak256("TIMELOCK_ADMIN_ROLE");
    bytes32 public constant PROPOSER_ROLE = keccak256("PROPOSER_ROLE");
    bytes32 public constant EXECUTOR_ROLE = keccak256("EXECUTOR_ROLE");
    bytes32 public constant CANCELLER_ROLE = keccak256("CANCELLER_ROLE");
    bytes32 public constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE");

    // Estructuras
    struct Operation {
        uint256 id;
        address target;
        uint256 value;
        bytes data;
        bytes32 predecessor;
        bytes32 salt;
        uint256 delay;
        bool executed;
        bool canceled;
        uint256 createdAt;
        uint256 scheduledAt;
        address proposer;
        bool isEmergency;
    }

    // Eventos
    event OperationScheduled(
        bytes32 indexed operationId,
        uint256 indexed id,
        address indexed target,
        uint256 value,
        bytes data,
        bytes32 predecessor,
        bytes32 salt,
        uint256 delay
    );

    event OperationExecuted(
        bytes32 indexed operationId,
        uint256 indexed id,
        address indexed target
    );

    event OperationCanceled(
        bytes32 indexed operationId,
        uint256 indexed id,
        address indexed canceler
    );

    event MinDelayChanged(uint256 oldDelay, uint256 newDelay);
    event EmergencyDelayChanged(uint256 oldDelay, uint256 newDelay);

    // Constantes
    uint256 public constant MIN_DELAY = 1 days;
    uint256 public constant MAX_DELAY = 30 days;
    uint256 public constant GRACE_PERIOD = 14 days;
    uint256 public constant MINIMUM_QUORUM = 7; // 7 de 12 para emergencias
    uint256 public constant EMERGENCY_THRESHOLD = 9; // 9 de 12 para bypass

    // Variables de estado
    uint256 public minDelay;
    uint256 public emergencyDelay;
    mapping(bytes32 => Operation) public operations;
    mapping(bytes32 => bool) public queuedOperations;
    Counters.Counter private _operationIdCounter;

    // Constructor
    constructor(uint256 initialMinDelay) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(TIMELOCK_ADMIN_ROLE, msg.sender);
        
        require(
            initialMinDelay >= MIN_DELAY && initialMinDelay <= MAX_DELAY,
            "Invalid delay"
        );
        
        minDelay = initialMinDelay;
        emergencyDelay = 1 hours; // 1 hora para emergencias
    }

    
    function schedule(
        address target,
        uint256 value,
        bytes calldata data,
        bytes32 predecessor,
        bytes32 salt,
        uint256 delay,
        bool isEmergency
    ) external onlyRole(PROPOSER_ROLE) returns (bytes32) {
        require(target != address(0), "Invalid target");
        require(
            delay >= (isEmergency ? emergencyDelay : minDelay),
            "Insufficient delay"
        );

        if (isEmergency) {
            require(hasRole(EMERGENCY_ROLE, msg.sender), "Not emergency role");
            require(_getEmergencyApprovals() >= MINIMUM_QUORUM, "Insufficient quorum");
        }

        _operationIdCounter.increment();
        uint256 id = _operationIdCounter.current();

        bytes32 operationId = hashOperation(
            target,
            value,
            data,
            predecessor,
            salt
        );

        require(!queuedOperations[operationId], "Operation already queued");

        operations[operationId] = Operation({
            id: id,
            target: target,
            value: value,
            data: data,
            predecessor: predecessor,
            salt: salt,
            delay: delay,
            executed: false,
            canceled: false,
            createdAt: block.timestamp,
            scheduledAt: block.timestamp,
            proposer: msg.sender,
            isEmergency: isEmergency
        });

        queuedOperations[operationId] = true;

        emit OperationScheduled(
            operationId,
            id,
            target,
            value,
            data,
            predecessor,
            salt,
            delay
        );

        return operationId;
    }

    
    function execute(
        address target,
        uint256 value,
        bytes calldata data,
        bytes32 predecessor,
        bytes32 salt
    ) external payable nonReentrant returns (bytes32) {
        bytes32 operationId = hashOperation(
            target,
            value,
            data,
            predecessor,
            salt
        );

        require(isOperationReady(operationId), "Operation not ready");
        require(hasRole(EXECUTOR_ROLE, msg.sender), "Not executor");

        Operation storage operation = operations[operationId];
        require(!operation.executed, "Operation already executed");
        require(!operation.canceled, "Operation canceled");

        operation.executed = true;

        if (operation.predecessor != bytes32(0)) {
            require(
                operations[operation.predecessor].executed,
                "Predecessor not executed"
            );
        }

        // Ejecutar la operación
        (bool success,) = operation.target.call{value: operation.value}(
            operation.data
        );
        require(success, "Operation execution failed");

        emit OperationExecuted(operationId, operation.id, target);
        return operationId;
    }

    
    function cancel(bytes32 operationId) external {
        Operation storage operation = operations[operationId];
        require(queuedOperations[operationId], "Operation not queued");
        require(!operation.executed, "Operation already executed");
        require(
            hasRole(CANCELLER_ROLE, msg.sender) ||
            operation.proposer == msg.sender,
            "Not authorized"
        );

        operation.canceled = true;
        queuedOperations[operationId] = false;

        emit OperationCanceled(operationId, operation.id, msg.sender);
    }

    
    function updateMinDelay(uint256 newDelay) external onlyRole(TIMELOCK_ADMIN_ROLE) {
        require(
            newDelay >= MIN_DELAY && newDelay <= MAX_DELAY,
            "Invalid delay"
        );
        uint256 oldDelay = minDelay;
        minDelay = newDelay;
        emit MinDelayChanged(oldDelay, newDelay);
    }

    
    function updateEmergencyDelay(uint256 newDelay) external onlyRole(TIMELOCK_ADMIN_ROLE) {
        require(newDelay <= minDelay, "Delay too long");
        uint256 oldDelay = emergencyDelay;
        emergencyDelay = newDelay;
        emit EmergencyDelayChanged(oldDelay, newDelay);
    }

    
    function isOperationReady(bytes32 operationId) public view returns (bool) {
        return queuedOperations[operationId] &&
            !operations[operationId].executed &&
            !operations[operationId].canceled &&
            block.timestamp >= operations[operationId].scheduledAt + operations[operationId].delay;
    }

    
    function isOperationPending(bytes32 operationId) public view returns (bool) {
        return queuedOperations[operationId] &&
            !operations[operationId].executed &&
            !operations[operationId].canceled;
    }

    
    function isOperationDone(bytes32 operationId) public view returns (bool) {
        return operations[operationId].executed || operations[operationId].canceled;
    }

    
    function getTimestamp(bytes32 operationId) public view returns (uint256) {
        Operation storage operation = operations[operationId];
        return operation.scheduledAt + operation.delay;
    }

    
    function hashOperation(
        address target,
        uint256 value,
        bytes calldata data,
        bytes32 predecessor,
        bytes32 salt
    ) public pure returns (bytes32) {
        return keccak256(
            abi.encode(target, value, data, predecessor, salt)
        );
    }

    
    function _getEmergencyApprovals() internal view returns (uint256) {
        // Note: Simplified implementation since getRoleMemberCount is not available
        // In a real implementation, you would track emergency role members separately
        return 1; // Placeholder return
    }

    
    receive() external payable {}
} 