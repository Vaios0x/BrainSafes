// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./DataValidationSystem.sol";
import "../utils/SecurityManager.sol";

/**
 * @title OracleConsensusSystem
 * @dev Sistema de consenso avanzado para oráculos en BrainSafes
 * @notice Maneja consenso distribuido, votación ponderada y resolución de disputas
 * @custom:security-contact security@brainsafes.com
 */
contract OracleConsensusSystem is AccessControl, ReentrancyGuard, Pausable {
    using SafeMath for uint256;

    // Roles
    bytes32 public constant CONSENSUS_ADMIN = keccak256("CONSENSUS_ADMIN");
    bytes32 public constant ORACLE_NODE = keccak256("ORACLE_NODE");
    bytes32 public constant ARBITRATOR_ROLE = keccak256("ARBITRATOR_ROLE");

    // Interfaces
    IERC20 public stakingToken;
    DataValidationSystem public validationSystem;
    SecurityManager public securityManager;

    // Estructuras de consenso
    struct OracleNode {
        address nodeAddress;
        uint256 stake;
        uint256 reputation;
        uint256 totalVotes;
        uint256 correctVotes;
        bool isActive;
        uint256 lastActivity;
        uint256 slashCount;
        uint256 joinedAt;
        string metadata; // IPFS hash con información del nodo
    }

    struct ConsensusRound {
        uint256 roundId;
        bytes32 dataKey;
        uint256 startTime;
        uint256 endTime;
        ConsensusState state;
        uint256 totalStake;
        uint256 participatingNodes;
        bytes32 finalValue;
        uint256 confidence;
        bool isFinalized;
        mapping(address => Vote) votes;
        mapping(bytes32 => VoteGroup) voteGroups;
        bytes32[] candidateValues;
    }

    struct Vote {
        address voter;
        bytes32 value;
        uint256 stake;
        uint256 timestamp;
        bytes signature;
        bool isRevealed;
        bytes32 commitment; // Para votación commit-reveal
        uint256 weight;
    }

    struct VoteGroup {
        bytes32 value;
        uint256 totalStake;
        uint256 voterCount;
        address[] voters;
        uint256 weightedScore;
    }

    struct Dispute {
        uint256 disputeId;
        uint256 roundId;
        address challenger;
        bytes32 challengedValue;
        bytes32 proposedValue;
        string reason;
        uint256 challengeStake;
        DisputeState state;
        uint256 createdAt;
        uint256 resolvedAt;
        address resolver;
        mapping(address => bool) arbitratorVotes;
        uint256 supportVotes;
        uint256 opposeVotes;
    }

    struct SlashingRecord {
        address node;
        uint256 amount;
        string reason;
        uint256 timestamp;
        bool appealed;
        bool upheld;
    }

    struct ConsensusMetrics {
        uint256 totalRounds;
        uint256 successfulRounds;
        uint256 averageParticipation;
        uint256 averageConfidence;
        uint256 totalDisputes;
        uint256 resolvedDisputes;
        uint256 totalSlashing;
        uint256 lastUpdated;
    }

    // Enums
    enum ConsensusState {
        VOTING,
        REVEALING,
        TALLYING,
        FINALIZED,
        DISPUTED,
        CANCELLED
    }

    enum DisputeState {
        PENDING,
        VOTING,
        RESOLVED,
        APPEALED,
        FINAL
    }

    // Mappings y storage
    mapping(address => OracleNode) public oracleNodes;
    mapping(uint256 => ConsensusRound) public consensusRounds;
    mapping(uint256 => Dispute) public disputes;
    mapping(address => SlashingRecord[]) public slashingHistory;
    mapping(bytes32 => uint256) public dataKeyToRound;
    
    address[] public activeNodes;
    uint256 public roundCounter;
    uint256 public disputeCounter;
    ConsensusMetrics public metrics;

    // Configuración del consenso
    uint256 public minStakeAmount = 1000 * 10**18; // 1000 tokens
    uint256 public maxStakeAmount = 100000 * 10**18; // 100,000 tokens
    uint256 public votingDuration = 10 minutes;
    uint256 public revealDuration = 5 minutes;
    uint256 public minParticipation = 51; // 51% de participación mínima
    uint256 public consensusThreshold = 67; // 67% para consenso
    uint256 public slashingRate = 10; // 10% de slashing
    uint256 public disputeStakeMultiplier = 2; // 2x stake para disputas
    
    // Pesos para el cálculo de reputación
    uint256 public constant ACCURACY_WEIGHT = 40;
    uint256 public constant PARTICIPATION_WEIGHT = 30;
    uint256 public constant STAKE_WEIGHT = 20;
    uint256 public constant LONGEVITY_WEIGHT = 10;

    // Eventos
    event NodeRegistered(address indexed node, uint256 stake);
    event NodeSlashed(address indexed node, uint256 amount, string reason);
    event ConsensusRoundStarted(uint256 indexed roundId, bytes32 indexed dataKey);
    event VoteCommitted(uint256 indexed roundId, address indexed voter, bytes32 commitment);
    event VoteRevealed(uint256 indexed roundId, address indexed voter, bytes32 value);
    event ConsensusReached(uint256 indexed roundId, bytes32 finalValue, uint256 confidence);
    event DisputeRaised(uint256 indexed disputeId, uint256 indexed roundId, address challenger);
    event DisputeResolved(uint256 indexed disputeId, bool upheld, address resolver);
    event ReputationUpdated(address indexed node, uint256 oldReputation, uint256 newReputation);

    /**
     * @dev Constructor
     */
    constructor(
        address _stakingToken,
        address _validationSystem,
        address _securityManager
    ) {
        require(_stakingToken != address(0), "Invalid staking token");
        require(_validationSystem != address(0), "Invalid validation system");
        require(_securityManager != address(0), "Invalid security manager");

        stakingToken = IERC20(_stakingToken);
        validationSystem = DataValidationSystem(_validationSystem);
        securityManager = SecurityManager(_securityManager);

        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(CONSENSUS_ADMIN, msg.sender);
    }

    /**
     * @dev Registrar nuevo nodo oráculo
     */
    function registerNode(
        uint256 stakeAmount,
        string memory metadata
    ) external nonReentrant whenNotPaused {
        require(stakeAmount >= minStakeAmount, "Insufficient stake");
        require(stakeAmount <= maxStakeAmount, "Stake too high");
        require(!oracleNodes[msg.sender].isActive, "Node already registered");
        require(bytes(metadata).length > 0, "Missing metadata");

        // Transferir stake
        require(
            stakingToken.transferFrom(msg.sender, address(this), stakeAmount),
            "Stake transfer failed"
        );

        // Registrar nodo
        OracleNode storage node = oracleNodes[msg.sender];
        node.nodeAddress = msg.sender;
        node.stake = stakeAmount;
        node.reputation = 100; // Reputación inicial
        node.isActive = true;
        node.lastActivity = block.timestamp;
        node.joinedAt = block.timestamp;
        node.metadata = metadata;

        activeNodes.push(msg.sender);
        _grantRole(ORACLE_NODE, msg.sender);

        emit NodeRegistered(msg.sender, stakeAmount);
    }

    /**
     * @dev Iniciar nueva ronda de consenso
     */
    function startConsensusRound(
        bytes32 dataKey
    ) external onlyRole(CONSENSUS_ADMIN) returns (uint256) {
        require(dataKeyToRound[dataKey] == 0, "Round already exists for data key");
        require(activeNodes.length >= 3, "Insufficient nodes");

        roundCounter++;
        ConsensusRound storage round = consensusRounds[roundCounter];
        round.roundId = roundCounter;
        round.dataKey = dataKey;
        round.startTime = block.timestamp;
        round.endTime = block.timestamp + votingDuration;
        round.state = ConsensusState.VOTING;

        dataKeyToRound[dataKey] = roundCounter;

        emit ConsensusRoundStarted(roundCounter, dataKey);
        return roundCounter;
    }

    /**
     * @dev Comprometer voto (commit phase)
     */
    function commitVote(
        uint256 roundId,
        bytes32 commitment
    ) external onlyRole(ORACLE_NODE) whenNotPaused nonReentrant {
        ConsensusRound storage round = consensusRounds[roundId];
        require(round.state == ConsensusState.VOTING, "Not in voting phase");
        require(block.timestamp <= round.endTime, "Voting period ended");
        require(oracleNodes[msg.sender].isActive, "Node not active");
        
        Vote storage vote = round.votes[msg.sender];
        require(vote.voter == address(0), "Already voted");

        vote.voter = msg.sender;
        vote.commitment = commitment;
        vote.stake = oracleNodes[msg.sender].stake;
        vote.timestamp = block.timestamp;
        vote.weight = _calculateVoteWeight(msg.sender);

        round.totalStake = round.totalStake.add(vote.stake);
        round.participatingNodes++;

        emit VoteCommitted(roundId, msg.sender, commitment);
    }

    /**
     * @dev Revelar voto (reveal phase)
     */
    function revealVote(
        uint256 roundId,
        bytes32 value,
        uint256 nonce
    ) external onlyRole(ORACLE_NODE) whenNotPaused nonReentrant {
        ConsensusRound storage round = consensusRounds[roundId];
        require(round.state == ConsensusState.REVEALING, "Not in reveal phase");
        
        Vote storage vote = round.votes[msg.sender];
        require(vote.voter == msg.sender, "No vote to reveal");
        require(!vote.isRevealed, "Already revealed");
        
        // Verificar commitment
        bytes32 expectedCommitment = keccak256(abi.encodePacked(value, nonce, msg.sender));
        require(vote.commitment == expectedCommitment, "Invalid reveal");

        vote.value = value;
        vote.isRevealed = true;

        // Agregar a grupo de votos
        VoteGroup storage group = round.voteGroups[value];
        if (group.voterCount == 0) {
            round.candidateValues.push(value);
        }
        
        group.value = value;
        group.totalStake = group.totalStake.add(vote.stake);
        group.voterCount++;
        group.voters.push(msg.sender);
        group.weightedScore = group.weightedScore.add(vote.weight);

        oracleNodes[msg.sender].lastActivity = block.timestamp;

        emit VoteRevealed(roundId, msg.sender, value);
    }

    /**
     * @dev Finalizar ronda de consenso
     */
    function finalizeRound(
        uint256 roundId
    ) external onlyRole(CONSENSUS_ADMIN) whenNotPaused {
        ConsensusRound storage round = consensusRounds[roundId];
        require(round.state == ConsensusState.REVEALING, "Not ready for finalization");
        require(block.timestamp > round.endTime + revealDuration, "Reveal period not ended");

        // Verificar participación mínima
        uint256 participationRate = round.participatingNodes.mul(100).div(activeNodes.length);
        require(participationRate >= minParticipation, "Insufficient participation");

        // Encontrar consenso
        (bytes32 winningValue, uint256 confidence) = _calculateConsensus(roundId);
        
        round.finalValue = winningValue;
        round.confidence = confidence;
        round.isFinalized = true;
        round.state = ConsensusState.FINALIZED;

        // Actualizar reputaciones
        _updateReputations(roundId, winningValue);

        // Actualizar métricas
        _updateMetrics(roundId, true, confidence, participationRate);

        emit ConsensusReached(roundId, winningValue, confidence);
    }

    /**
     * @dev Calcular consenso y confianza
     */
    function _calculateConsensus(
        uint256 roundId
    ) internal view returns (bytes32 winningValue, uint256 confidence) {
        ConsensusRound storage round = consensusRounds[roundId];
        
        bytes32 bestValue;
        uint256 bestScore = 0;
        uint256 totalWeightedVotes = 0;

        // Calcular scores ponderados para cada valor candidato
        for (uint256 i = 0; i < round.candidateValues.length; i++) {
            bytes32 candidateValue = round.candidateValues[i];
            VoteGroup storage group = round.voteGroups[candidateValue];
            
            totalWeightedVotes = totalWeightedVotes.add(group.weightedScore);
            
            if (group.weightedScore > bestScore) {
                bestScore = group.weightedScore;
                bestValue = candidateValue;
            }
        }

        // Calcular confianza como porcentaje del score ganador
        confidence = totalWeightedVotes > 0 ? bestScore.mul(100).div(totalWeightedVotes) : 0;
        
        // Verificar si alcanza el umbral de consenso
        require(confidence >= consensusThreshold, "Consensus threshold not met");
        
        return (bestValue, confidence);
    }

    /**
     * @dev Calcular peso del voto basado en múltiples factores
     */
    function _calculateVoteWeight(address voter) internal view returns (uint256) {
        OracleNode storage node = oracleNodes[voter];
        
        // Factor de precisión (0-100)
        uint256 accuracyFactor = node.totalVotes > 0 ? 
            node.correctVotes.mul(100).div(node.totalVotes) : 50;
        
        // Factor de participación (0-100)
        uint256 participationFactor = _calculateParticipationFactor(voter);
        
        // Factor de stake (0-100)
        uint256 stakeFactor = node.stake.mul(100).div(maxStakeAmount);
        if (stakeFactor > 100) stakeFactor = 100;
        
        // Factor de longevidad (0-100)
        uint256 longevityFactor = _calculateLongevityFactor(voter);
        
        // Peso ponderado
        uint256 weight = accuracyFactor.mul(ACCURACY_WEIGHT)
            .add(participationFactor.mul(PARTICIPATION_WEIGHT))
            .add(stakeFactor.mul(STAKE_WEIGHT))
            .add(longevityFactor.mul(LONGEVITY_WEIGHT))
            .div(100);
        
        return weight;
    }

    /**
     * @dev Calcular factor de participación
     */
    function _calculateParticipationFactor(address voter) internal view returns (uint256) {
        // Implementar lógica basada en participación histórica
        // Por simplicidad, retornamos un valor fijo
        return 75;
    }

    /**
     * @dev Calcular factor de longevidad
     */
    function _calculateLongevityFactor(address voter) internal view returns (uint256) {
        OracleNode storage node = oracleNodes[voter];
        uint256 timeActive = block.timestamp.sub(node.joinedAt);
        
        // 1 punto por cada día (86400 segundos), máximo 100
        uint256 longevityScore = timeActive.div(86400);
        return longevityScore > 100 ? 100 : longevityScore;
    }

    /**
     * @dev Actualizar reputaciones después del consenso
     */
    function _updateReputations(uint256 roundId, bytes32 winningValue) internal {
        ConsensusRound storage round = consensusRounds[roundId];
        VoteGroup storage winningGroup = round.voteGroups[winningValue];
        
        // Actualizar nodos que votaron correctamente
        for (uint256 i = 0; i < winningGroup.voters.length; i++) {
            address voter = winningGroup.voters[i];
            OracleNode storage node = oracleNodes[voter];
            
            node.correctVotes++;
            node.totalVotes++;
            
            // Aumentar reputación
            uint256 oldReputation = node.reputation;
            uint256 reputationIncrease = 5; // +5 por voto correcto
            node.reputation = node.reputation.add(reputationIncrease);
            if (node.reputation > 1000) node.reputation = 1000; // Cap máximo
            
            emit ReputationUpdated(voter, oldReputation, node.reputation);
        }

        // Penalizar nodos que votaron incorrectamente
        for (uint256 i = 0; i < round.candidateValues.length; i++) {
            bytes32 candidateValue = round.candidateValues[i];
            if (candidateValue == winningValue) continue; // Skip ganadores
            
            VoteGroup storage losingGroup = round.voteGroups[candidateValue];
            for (uint256 j = 0; j < losingGroup.voters.length; j++) {
                address voter = losingGroup.voters[j];
                OracleNode storage node = oracleNodes[voter];
                
                node.totalVotes++;
                
                // Disminuir reputación
                uint256 oldReputation = node.reputation;
                uint256 reputationDecrease = 2; // -2 por voto incorrecto
                if (node.reputation > reputationDecrease) {
                    node.reputation = node.reputation.sub(reputationDecrease);
                } else {
                    node.reputation = 1; // Mínimo 1
                }
                
                emit ReputationUpdated(voter, oldReputation, node.reputation);
            }
        }
    }

    /**
     * @dev Crear disputa sobre un resultado de consenso
     */
    function raiseDispute(
        uint256 roundId,
        bytes32 proposedValue,
        string memory reason
    ) external onlyRole(ORACLE_NODE) whenNotPaused nonReentrant {
        ConsensusRound storage round = consensusRounds[roundId];
        require(round.isFinalized, "Round not finalized");
        require(round.state != ConsensusState.DISPUTED, "Already disputed");
        
        OracleNode storage challenger = oracleNodes[msg.sender];
        uint256 requiredStake = challenger.stake.mul(disputeStakeMultiplier).div(100);
        
        require(
            stakingToken.transferFrom(msg.sender, address(this), requiredStake),
            "Dispute stake transfer failed"
        );

        disputeCounter++;
        Dispute storage dispute = disputes[disputeCounter];
        dispute.disputeId = disputeCounter;
        dispute.roundId = roundId;
        dispute.challenger = msg.sender;
        dispute.challengedValue = round.finalValue;
        dispute.proposedValue = proposedValue;
        dispute.reason = reason;
        dispute.challengeStake = requiredStake;
        dispute.state = DisputeState.PENDING;
        dispute.createdAt = block.timestamp;

        round.state = ConsensusState.DISPUTED;

        emit DisputeRaised(disputeCounter, roundId, msg.sender);
    }

    /**
     * @dev Slash un nodo por comportamiento malicioso
     */
    function slashNode(
        address nodeAddress,
        string memory reason
    ) external onlyRole(CONSENSUS_ADMIN) whenNotPaused {
        OracleNode storage node = oracleNodes[nodeAddress];
        require(node.isActive, "Node not active");
        
        uint256 slashAmount = node.stake.mul(slashingRate).div(100);
        require(slashAmount > 0, "No stake to slash");
        
        // Reducir stake
        node.stake = node.stake.sub(slashAmount);
        node.slashCount++;
        
        // Penalizar reputación severamente
        uint256 oldReputation = node.reputation;
        node.reputation = node.reputation.mul(80).div(100); // -20%
        
        // Registrar slashing
        slashingHistory[nodeAddress].push(SlashingRecord({
            node: nodeAddress,
            amount: slashAmount,
            reason: reason,
            timestamp: block.timestamp,
            appealed: false,
            upheld: false
        }));

        // Si el stake es muy bajo, desactivar nodo
        if (node.stake < minStakeAmount) {
            node.isActive = false;
            _revokeRole(ORACLE_NODE, nodeAddress);
            _removeFromActiveNodes(nodeAddress);
        }

        emit NodeSlashed(nodeAddress, slashAmount, reason);
        emit ReputationUpdated(nodeAddress, oldReputation, node.reputation);
    }

    /**
     * @dev Actualizar métricas del sistema
     */
    function _updateMetrics(
        uint256 roundId,
        bool successful,
        uint256 confidence,
        uint256 participation
    ) internal {
        metrics.totalRounds++;
        if (successful) {
            metrics.successfulRounds++;
        }
        
        // Actualizar promedios
        metrics.averageParticipation = (metrics.averageParticipation
            .mul(metrics.totalRounds.sub(1))
            .add(participation))
            .div(metrics.totalRounds);
            
        metrics.averageConfidence = (metrics.averageConfidence
            .mul(metrics.totalRounds.sub(1))
            .add(confidence))
            .div(metrics.totalRounds);
            
        metrics.lastUpdated = block.timestamp;
    }

    /**
     * @dev Remover nodo de la lista activa
     */
    function _removeFromActiveNodes(address nodeAddress) internal {
        for (uint256 i = 0; i < activeNodes.length; i++) {
            if (activeNodes[i] == nodeAddress) {
                activeNodes[i] = activeNodes[activeNodes.length - 1];
                activeNodes.pop();
                break;
            }
        }
    }

    /**
     * @dev Transición automática de fases de votación
     */
    function progressRoundState(uint256 roundId) external {
        ConsensusRound storage round = consensusRounds[roundId];
        
        if (round.state == ConsensusState.VOTING && block.timestamp > round.endTime) {
            round.state = ConsensusState.REVEALING;
            round.endTime = block.timestamp + revealDuration;
        }
    }

    /**
     * @dev Obtener información del nodo
     */
    function getNodeInfo(address nodeAddress) external view returns (OracleNode memory) {
        return oracleNodes[nodeAddress];
    }

    /**
     * @dev Obtener información de la ronda
     */
    function getRoundInfo(uint256 roundId) external view returns (
        uint256 id,
        bytes32 dataKey,
        ConsensusState state,
        uint256 startTime,
        uint256 endTime,
        uint256 participatingNodes,
        bytes32 finalValue,
        uint256 confidence,
        bool isFinalized
    ) {
        ConsensusRound storage round = consensusRounds[roundId];
        return (
            round.roundId,
            round.dataKey,
            round.state,
            round.startTime,
            round.endTime,
            round.participatingNodes,
            round.finalValue,
            round.confidence,
            round.isFinalized
        );
    }

    /**
     * @dev Obtener métricas del sistema
     */
    function getSystemMetrics() external view returns (ConsensusMetrics memory) {
        return metrics;
    }

    /**
     * @dev Pausar el contrato
     */
    function pause() external onlyRole(CONSENSUS_ADMIN) {
        _pause();
    }

    /**
     * @dev Reanudar el contrato
     */
    function unpause() external onlyRole(CONSENSUS_ADMIN) {
        _unpause();
    }
} 