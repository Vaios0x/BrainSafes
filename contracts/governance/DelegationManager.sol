// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title DelegationManager
 * @dev Sistema avanzado de delegación con múltiples niveles y tipos
 * @author BrainSafes Team
 */
contract DelegationManager is AccessControl, ReentrancyGuard, Pausable {
    using Counters for Counters.Counter;

    // Roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");

    // Estructuras
    struct Delegate {
        address delegateAddress;
        string name;
        string description;
        uint256 reputation;
        uint256 totalDelegations;
        uint256 proposalsVoted;
        uint256 votingWeight;
        uint256 startTimestamp;
        bool isActive;
        mapping(ProposalType => bool) allowedTypes;
        mapping(address => uint256) delegatorWeights;
    }

    struct Delegation {
        address delegator;
        address delegate;
        uint256 weight;
        uint256 startTime;
        uint256 endTime;
        ProposalType[] allowedTypes;
        uint256 level;
        bool isActive;
    }

    struct DelegationHistory {
        address delegator;
        address oldDelegate;
        address newDelegate;
        uint256 timestamp;
        string reason;
    }

    struct DelegateMetrics {
        uint256 totalVotingPower;
        uint256 activeProposals;
        uint256 proposalsCreated;
        uint256 votingParticipation;
        uint256 delegatorCount;
        uint256 averageVotingWeight;
        uint256 reputationScore;
        uint256 lastUpdateBlock;
    }

    // Enums
    enum ProposalType {
        GENERAL,
        TECHNICAL,
        FINANCIAL,
        SECURITY,
        COMMUNITY,
        EMERGENCY
    }

    // Eventos
    event DelegateRegistered(
        address indexed delegate,
        string name,
        uint256 timestamp
    );

    event DelegationCreated(
        address indexed delegator,
        address indexed delegate,
        uint256 weight,
        uint256 startTime,
        uint256 endTime
    );

    event DelegationModified(
        address indexed delegator,
        address indexed oldDelegate,
        address indexed newDelegate,
        uint256 timestamp
    );

    event DelegationRevoked(
        address indexed delegator,
        address indexed delegate,
        uint256 timestamp,
        string reason
    );

    event DelegateReputationUpdated(
        address indexed delegate,
        uint256 oldReputation,
        uint256 newReputation,
        string reason
    );

    event VotingWeightUpdated(
        address indexed delegate,
        uint256 oldWeight,
        uint256 newWeight
    );

    // Variables de estado
    mapping(address => Delegate) public delegates;
    mapping(address => mapping(address => Delegation)) public delegations;
    mapping(address => DelegateMetrics) public delegateMetrics;
    mapping(address => DelegationHistory[]) public delegationHistory;
    mapping(address => address[]) public activeDelegators;
    mapping(address => address[]) public subdelegates;

    // Configuración
    uint256 public constant MAX_DELEGATION_LEVELS = 3;
    uint256 public constant MIN_REPUTATION_THRESHOLD = 100;
    uint256 public constant MAX_TOTAL_WEIGHT = 10000; // 100%
    uint256 public constant REPUTATION_MULTIPLIER = 100;
    uint256 public constant MIN_DELEGATION_PERIOD = 1 days;
    uint256 public constant MAX_DELEGATION_PERIOD = 365 days;

    // Contadores
    Counters.Counter private _totalDelegates;
    Counters.Counter private _activeDelegations;

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(GOVERNANCE_ROLE, msg.sender);
    }

    /**
     * @dev Registra un nuevo delegado
     */
    function registerDelegate(
        string memory name,
        string memory description,
        ProposalType[] memory allowedProposalTypes
    ) external whenNotPaused {
        require(bytes(name).length > 0, "Name required");
        require(delegates[msg.sender].delegateAddress == address(0), "Already registered");

        Delegate storage newDelegate = delegates[msg.sender];
        newDelegate.delegateAddress = msg.sender;
        newDelegate.name = name;
        newDelegate.description = description;
        newDelegate.reputation = MIN_REPUTATION_THRESHOLD;
        newDelegate.startTimestamp = block.timestamp;
        newDelegate.isActive = true;

        // Configurar tipos permitidos
        for (uint256 i = 0; i < allowedProposalTypes.length; i++) {
            newDelegate.allowedTypes[allowedProposalTypes[i]] = true;
        }

        // Inicializar métricas
        delegateMetrics[msg.sender] = DelegateMetrics({
            totalVotingPower: 0,
            activeProposals: 0,
            proposalsCreated: 0,
            votingParticipation: 0,
            delegatorCount: 0,
            averageVotingWeight: 0,
            reputationScore: MIN_REPUTATION_THRESHOLD,
            lastUpdateBlock: block.number
        });

        _totalDelegates.increment();

        emit DelegateRegistered(msg.sender, name, block.timestamp);
    }

    /**
     * @dev Crea una nueva delegación
     */
    function delegate(
        address delegateAddress,
        uint256 weight,
        uint256 duration,
        ProposalType[] memory allowedTypes
    ) external whenNotPaused nonReentrant {
        require(delegateAddress != address(0), "Invalid delegate");
        require(delegateAddress != msg.sender, "Cannot self delegate");
        require(weight > 0 && weight <= MAX_TOTAL_WEIGHT, "Invalid weight");
        require(duration >= MIN_DELEGATION_PERIOD, "Duration too short");
        require(duration <= MAX_DELEGATION_PERIOD, "Duration too long");
        require(delegates[delegateAddress].isActive, "Delegate not active");

        // Verificar delegación existente
        Delegation storage existingDelegation = delegations[msg.sender][delegateAddress];
        require(!existingDelegation.isActive, "Active delegation exists");

        // Verificar peso total
        uint256 totalWeight = _calculateTotalWeight(msg.sender);
        require(totalWeight + weight <= MAX_TOTAL_WEIGHT, "Exceeds max weight");

        // Verificar nivel de delegación
        uint256 delegationLevel = _getDelegationLevel(delegateAddress);
        require(delegationLevel < MAX_DELEGATION_LEVELS, "Max level reached");

        // Crear delegación
        delegations[msg.sender][delegateAddress] = Delegation({
            delegator: msg.sender,
            delegate: delegateAddress,
            weight: weight,
            startTime: block.timestamp,
            endTime: block.timestamp + duration,
            allowedTypes: allowedTypes,
            level: delegationLevel + 1,
            isActive: true
        });

        // Actualizar métricas
        delegates[delegateAddress].totalDelegations++;
        delegates[delegateAddress].delegatorWeights[msg.sender] = weight;
        activeDelegators[delegateAddress].push(msg.sender);
        _activeDelegations.increment();

        // Actualizar historial
        delegationHistory[msg.sender].push(DelegationHistory({
            delegator: msg.sender,
            oldDelegate: address(0),
            newDelegate: delegateAddress,
            timestamp: block.timestamp,
            reason: "New delegation"
        }));

        emit DelegationCreated(
            msg.sender,
            delegateAddress,
            weight,
            block.timestamp,
            block.timestamp + duration
        );

        // Actualizar poder de voto
        _updateVotingPower(delegateAddress);
    }

    /**
     * @dev Modifica una delegación existente
     */
    function modifyDelegation(
        address currentDelegate,
        address newDelegate,
        uint256 newWeight,
        uint256 duration,
        ProposalType[] memory allowedTypes
    ) external whenNotPaused nonReentrant {
        require(newDelegate != address(0), "Invalid delegate");
        require(delegates[newDelegate].isActive, "New delegate not active");
        
        Delegation storage currentDelegation = delegations[msg.sender][currentDelegate];
        require(currentDelegation.isActive, "No active delegation");

        // Revocar delegación actual
        _revokeDelegation(currentDelegate, "Modified to new delegate");

        // Crear nueva delegación
        delegate(newDelegate, newWeight, duration, allowedTypes);

        emit DelegationModified(
            msg.sender,
            currentDelegate,
            newDelegate,
            block.timestamp
        );
    }

    /**
     * @dev Revoca una delegación
     */
    function revokeDelegation(
        address delegateAddress,
        string memory reason
    ) external whenNotPaused {
        _revokeDelegation(delegateAddress, reason);
    }

    /**
     * @dev Revoca delegación (interna)
     */
    function _revokeDelegation(
        address delegateAddress,
        string memory reason
    ) internal {
        Delegation storage delegation = delegations[msg.sender][delegateAddress];
        require(delegation.isActive, "No active delegation");

        delegation.isActive = false;
        delegates[delegateAddress].totalDelegations--;
        delegates[delegateAddress].delegatorWeights[msg.sender] = 0;
        _activeDelegations.decrement();

        // Actualizar historial
        delegationHistory[msg.sender].push(DelegationHistory({
            delegator: msg.sender,
            oldDelegate: delegateAddress,
            newDelegate: address(0),
            timestamp: block.timestamp,
            reason: reason
        }));

        // Remover de delegadores activos
        _removeActiveDelegator(delegateAddress, msg.sender);

        emit DelegationRevoked(
            msg.sender,
            delegateAddress,
            block.timestamp,
            reason
        );

        // Actualizar poder de voto
        _updateVotingPower(delegateAddress);
    }

    /**
     * @dev Actualiza reputación del delegado
     */
    function updateDelegateReputation(
        address delegateAddress,
        uint256 reputationChange,
        bool isIncrease,
        string memory reason
    ) external onlyRole(GOVERNANCE_ROLE) {
        Delegate storage delegate = delegates[delegateAddress];
        require(delegate.isActive, "Delegate not active");

        uint256 oldReputation = delegate.reputation;
        
        if (isIncrease) {
            delegate.reputation = delegate.reputation + reputationChange;
        } else {
            delegate.reputation = delegate.reputation > reputationChange ?
                delegate.reputation - reputationChange : MIN_REPUTATION_THRESHOLD;
        }

        emit DelegateReputationUpdated(
            delegateAddress,
            oldReputation,
            delegate.reputation,
            reason
        );

        // Actualizar poder de voto
        _updateVotingPower(delegateAddress);
    }

    /**
     * @dev Actualiza poder de voto
     */
    function _updateVotingPower(address delegateAddress) internal {
        Delegate storage delegate = delegates[delegateAddress];
        uint256 oldWeight = delegate.votingWeight;

        // Base: reputación
        uint256 newWeight = delegate.reputation * REPUTATION_MULTIPLIER;

        // Añadir peso de delegadores
        address[] memory delegators = activeDelegators[delegateAddress];
        for (uint256 i = 0; i < delegators.length; i++) {
            newWeight += delegate.delegatorWeights[delegators[i]];
        }

        delegate.votingWeight = newWeight;

        emit VotingWeightUpdated(
            delegateAddress,
            oldWeight,
            newWeight
        );
    }

    /**
     * @dev Calcula nivel de delegación
     */
    function _getDelegationLevel(address delegateAddress) internal view returns (uint256) {
        uint256 level = 0;
        address current = delegateAddress;

        while (level < MAX_DELEGATION_LEVELS) {
            bool hasHigherDelegate = false;
            address[] memory delegators = activeDelegators[current];

            for (uint256 i = 0; i < delegators.length; i++) {
                if (delegates[delegators[i]].isActive) {
                    current = delegators[i];
                    hasHigherDelegate = true;
                    level++;
                    break;
                }
            }

            if (!hasHigherDelegate) break;
        }

        return level;
    }

    /**
     * @dev Calcula peso total de delegación
     */
    function _calculateTotalWeight(address delegator) internal view returns (uint256) {
        uint256 totalWeight = 0;
        address[] memory activeDels = _getActiveDelegatesForDelegator(delegator);

        for (uint256 i = 0; i < activeDels.length; i++) {
            Delegation storage delegation = delegations[delegator][activeDels[i]];
            if (delegation.isActive) {
                totalWeight += delegation.weight;
            }
        }

        return totalWeight;
    }

    /**
     * @dev Remueve delegador activo
     */
    function _removeActiveDelegator(address delegateAddress, address delegator) internal {
        address[] storage delegators = activeDelegators[delegateAddress];
        for (uint256 i = 0; i < delegators.length; i++) {
            if (delegators[i] == delegator) {
                delegators[i] = delegators[delegators.length - 1];
                delegators.pop();
                break;
            }
        }
    }

    // Getters
    function getDelegateInfo(address delegateAddress) external view returns (
        string memory name,
        string memory description,
        uint256 reputation,
        uint256 totalDelegations,
        uint256 votingWeight,
        bool isActive
    ) {
        Delegate storage delegate = delegates[delegateAddress];
        return (
            delegate.name,
            delegate.description,
            delegate.reputation,
            delegate.totalDelegations,
            delegate.votingWeight,
            delegate.isActive
        );
    }

    function getDelegation(address delegator, address delegateAddress) external view returns (
        uint256 weight,
        uint256 startTime,
        uint256 endTime,
        ProposalType[] memory allowedTypes,
        uint256 level,
        bool isActive
    ) {
        Delegation storage delegation = delegations[delegator][delegateAddress];
        return (
            delegation.weight,
            delegation.startTime,
            delegation.endTime,
            delegation.allowedTypes,
            delegation.level,
            delegation.isActive
        );
    }

    function getDelegateMetrics(address delegateAddress) external view returns (DelegateMetrics memory) {
        return delegateMetrics[delegateAddress];
    }

    function getDelegationHistory(address delegator) external view returns (DelegationHistory[] memory) {
        return delegationHistory[delegator];
    }

    function _getActiveDelegatesForDelegator(address delegator) internal view returns (address[] memory) {
        uint256 count = 0;
        address[] memory allDelegates = new address[](_totalDelegates.current());

        for (uint256 i = 0; i < _totalDelegates.current(); i++) {
            address delegateAddress = address(uint160(i + 1)); // Simplificado
            if (delegations[delegator][delegateAddress].isActive) {
                allDelegates[count] = delegateAddress;
                count++;
            }
        }

        address[] memory activeDelegates = new address[](count);
        for (uint256 i = 0; i < count; i++) {
            activeDelegates[i] = allDelegates[i];
        }

        return activeDelegates;
    }

    function getActiveDelegators(address delegateAddress) external view returns (address[] memory) {
        return activeDelegators[delegateAddress];
    }

    function getTotalDelegates() external view returns (uint256) {
        return _totalDelegates.current();
    }

    function getActiveDelegations() external view returns (uint256) {
        return _activeDelegations.current();
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