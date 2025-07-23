// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

/**
 * @title QuadraticVoting
 * @dev Sistema de votación cuadrática con distribución de créditos y protección anti-Sybil
 * @author BrainSafes Team
 */
contract QuadraticVoting is AccessControl, ReentrancyGuard, Pausable {
    using Counters for Counters.Counter;
    using SafeMath for uint256;

    // Roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");
    bytes32 public constant CREDIT_MANAGER_ROLE = keccak256("CREDIT_MANAGER_ROLE");

    // Estructuras
    struct Voter {
        uint256 baseCredits;
        uint256 availableCredits;
        uint256 lastCreditRefresh;
        uint256 totalVotesCast;
        uint256 votingPower;
        bool isVerified;
        mapping(uint256 => uint256) proposalVotes;
        mapping(uint256 => bool) hasVoted;
    }

    struct VotingPeriod {
        uint256 periodId;
        uint256 startBlock;
        uint256 endBlock;
        uint256 baseCredits;
        uint256 totalVotesCast;
        bool isActive;
        mapping(address => bool) hasParticipated;
    }

    struct ProposalVotes {
        uint256 proposalId;
        uint256 totalVotes;
        uint256 uniqueVoters;
        uint256 quadraticCost;
        ProposalType proposalType;
        mapping(address => VoteDetails) voterDetails;
    }

    struct VoteDetails {
        uint256 credits;
        uint256 votingPower;
        uint256 timestamp;
        bool isPositive;
    }

    struct VotingStats {
        uint256 totalVotesCast;
        uint256 totalCreditsSpent;
        uint256 averageVotingPower;
        uint256 participationRate;
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
    event VoterRegistered(
        address indexed voter,
        uint256 baseCredits,
        uint256 timestamp
    );

    event CreditsRefreshed(
        address indexed voter,
        uint256 oldCredits,
        uint256 newCredits,
        uint256 timestamp
    );

    event VoteCast(
        address indexed voter,
        uint256 indexed proposalId,
        uint256 credits,
        uint256 votingPower,
        bool isPositive
    );

    event VotingPeriodCreated(
        uint256 indexed periodId,
        uint256 startBlock,
        uint256 endBlock,
        uint256 baseCredits
    );

    event VotingPeriodEnded(
        uint256 indexed periodId,
        uint256 totalVotes,
        uint256 uniqueVoters
    );

    event VoterVerified(
        address indexed voter,
        uint256 timestamp,
        string verificationMethod
    );

    // Variables de estado
    mapping(address => Voter) public voters;
    mapping(uint256 => VotingPeriod) public votingPeriods;
    mapping(uint256 => ProposalVotes) public proposalVotes;
    mapping(address => VotingStats) public voterStats;
    mapping(address => uint256[]) public voterHistory;

    // Configuración
    uint256 public constant BASE_CREDITS = 100;
    uint256 public constant CREDIT_REFRESH_PERIOD = 7 days;
    uint256 public constant MIN_CREDITS_PER_VOTE = 1;
    uint256 public constant MAX_CREDITS_PER_VOTE = 100;
    uint256 public constant QUADRATIC_FACTOR = 100;
    uint256 public constant VERIFICATION_THRESHOLD = 50;

    // Contadores
    Counters.Counter private _periodIdCounter;
    Counters.Counter private _totalVoters;
    Counters.Counter private _verifiedVoters;

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(GOVERNANCE_ROLE, msg.sender);
        _grantRole(CREDIT_MANAGER_ROLE, msg.sender);
    }

    /**
     * @dev Registra un nuevo votante
     */
    function registerVoter(address voter) external onlyRole(GOVERNANCE_ROLE) {
        require(!voters[voter].isVerified, "Voter already registered");

        Voter storage newVoter = voters[voter];
        newVoter.baseCredits = BASE_CREDITS;
        newVoter.availableCredits = BASE_CREDITS;
        newVoter.lastCreditRefresh = block.timestamp;
        newVoter.isVerified = false;

        _totalVoters.increment();

        emit VoterRegistered(voter, BASE_CREDITS, block.timestamp);
    }

    /**
     * @dev Verifica un votante
     */
    function verifyVoter(
        address voter,
        string memory verificationMethod
    ) external onlyRole(GOVERNANCE_ROLE) {
        require(!voters[voter].isVerified, "Already verified");
        
        voters[voter].isVerified = true;
        voters[voter].votingPower = BASE_CREDITS.mul(2); // Bonus por verificación
        _verifiedVoters.increment();

        emit VoterVerified(voter, block.timestamp, verificationMethod);
    }

    /**
     * @dev Refresca créditos de votación
     */
    function refreshCredits(address voter) external nonReentrant whenNotPaused {
        Voter storage voterData = voters[voter];
        require(voterData.isVerified, "Voter not verified");
        require(
            block.timestamp >= voterData.lastCreditRefresh + CREDIT_REFRESH_PERIOD,
            "Too soon to refresh"
        );

        uint256 oldCredits = voterData.availableCredits;
        voterData.availableCredits = voterData.baseCredits;
        voterData.lastCreditRefresh = block.timestamp;

        emit CreditsRefreshed(
            voter,
            oldCredits,
            voterData.availableCredits,
            block.timestamp
        );
    }

    /**
     * @dev Emite voto cuadrático
     */
    function castVote(
        uint256 proposalId,
        uint256 credits,
        bool isPositive
    ) external nonReentrant whenNotPaused {
        require(credits >= MIN_CREDITS_PER_VOTE, "Insufficient credits");
        require(credits <= MAX_CREDITS_PER_VOTE, "Too many credits");
        
        Voter storage voter = voters[msg.sender];
        require(voter.isVerified, "Voter not verified");
        require(!voter.hasVoted[proposalId], "Already voted");
        require(voter.availableCredits >= credits, "Not enough credits");

        ProposalVotes storage proposal = proposalVotes[proposalId];
        require(proposal.proposalId != 0, "Invalid proposal");

        // Calcular poder de voto cuadrático
        uint256 votingPower = _calculateQuadraticPower(credits);
        
        // Actualizar votos
        if (isPositive) {
            proposal.totalVotes = proposal.totalVotes.add(votingPower);
        } else {
            proposal.totalVotes = proposal.totalVotes > votingPower ?
                proposal.totalVotes.sub(votingPower) : 0;
        }

        // Actualizar detalles del voto
        proposal.voterDetails[msg.sender] = VoteDetails({
            credits: credits,
            votingPower: votingPower,
            timestamp: block.timestamp,
            isPositive: isPositive
        });

        // Actualizar estadísticas
        voter.availableCredits = voter.availableCredits.sub(credits);
        voter.totalVotesCast = voter.totalVotesCast.add(1);
        voter.proposalVotes[proposalId] = credits;
        voter.hasVoted[proposalId] = true;
        proposal.uniqueVoters = proposal.uniqueVoters.add(1);
        proposal.quadraticCost = proposal.quadraticCost.add(credits);

        // Registrar en historial
        voterHistory[msg.sender].push(proposalId);

        emit VoteCast(
            msg.sender,
            proposalId,
            credits,
            votingPower,
            isPositive
        );

        // Actualizar estadísticas globales
        _updateVotingStats(msg.sender, credits, votingPower);
    }

    /**
     * @dev Calcula poder de voto cuadrático
     */
    function _calculateQuadraticPower(
        uint256 credits
    ) internal pure returns (uint256) {
        // Fórmula: sqrt(credits) * QUADRATIC_FACTOR
        return sqrt(credits.mul(QUADRATIC_FACTOR));
    }

    /**
     * @dev Calcula raíz cuadrada (implementación de Babylonian)
     */
    function sqrt(uint256 x) internal pure returns (uint256) {
        if (x == 0) return 0;
        
        uint256 z = (x + 1) / 2;
        uint256 y = x;
        
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
        
        return y;
    }

    /**
     * @dev Crea nuevo período de votación
     */
    function createVotingPeriod(
        uint256 duration,
        uint256 baseCredits
    ) external onlyRole(ADMIN_ROLE) {
        require(duration > 0, "Invalid duration");
        require(baseCredits >= BASE_CREDITS, "Invalid base credits");

        _periodIdCounter.increment();
        uint256 periodId = _periodIdCounter.current();

        votingPeriods[periodId].periodId = periodId;
        votingPeriods[periodId].startBlock = block.number;
        votingPeriods[periodId].endBlock = block.number + duration;
        votingPeriods[periodId].baseCredits = baseCredits;
        votingPeriods[periodId].isActive = true;

        emit VotingPeriodCreated(
            periodId,
            block.number,
            block.number + duration,
            baseCredits
        );
    }

    /**
     * @dev Finaliza período de votación
     */
    function endVotingPeriod(uint256 periodId) external onlyRole(ADMIN_ROLE) {
        VotingPeriod storage period = votingPeriods[periodId];
        require(period.isActive, "Period not active");
        require(block.number >= period.endBlock, "Period not ended");

        period.isActive = false;

        emit VotingPeriodEnded(
            periodId,
            period.totalVotesCast,
            _calculateUniqueVoters(periodId)
        );
    }

    /**
     * @dev Actualiza estadísticas de votación
     */
    function _updateVotingStats(
        address voter,
        uint256 credits,
        uint256 votingPower
    ) internal {
        VotingStats storage stats = voterStats[voter];
        
        stats.totalVotesCast = stats.totalVotesCast.add(1);
        stats.totalCreditsSpent = stats.totalCreditsSpent.add(credits);
        stats.averageVotingPower = stats.totalVotesCast > 0 ?
            stats.totalCreditsSpent.div(stats.totalVotesCast) : 0;
        stats.lastUpdateBlock = block.number;

        // Calcular tasa de participación
        uint256 totalPeriods = _periodIdCounter.current();
        uint256 participatedPeriods = 0;
        
        for (uint256 i = 1; i <= totalPeriods; i++) {
            if (votingPeriods[i].hasParticipated[voter]) {
                participatedPeriods = participatedPeriods.add(1);
            }
        }

        stats.participationRate = totalPeriods > 0 ?
            participatedPeriods.mul(100).div(totalPeriods) : 0;
    }

    /**
     * @dev Calcula votantes únicos en un período
     */
    function _calculateUniqueVoters(
        uint256 periodId
    ) internal view returns (uint256) {
        VotingPeriod storage period = votingPeriods[periodId];
        uint256 uniqueVoters = 0;
        uint256 totalVoters = _totalVoters.current();

        for (uint256 i = 1; i <= totalVoters; i++) {
            address voter = address(uint160(i)); // Simplificado
            if (period.hasParticipated[voter]) {
                uniqueVoters = uniqueVoters.add(1);
            }
        }

        return uniqueVoters;
    }

    // Getters
    function getVoterInfo(address voter) external view returns (
        uint256 baseCredits,
        uint256 availableCredits,
        uint256 totalVotesCast,
        uint256 votingPower,
        bool isVerified
    ) {
        Voter storage voterData = voters[voter];
        return (
            voterData.baseCredits,
            voterData.availableCredits,
            voterData.totalVotesCast,
            voterData.votingPower,
            voterData.isVerified
        );
    }

    function getProposalVotes(
        uint256 proposalId,
        address voter
    ) external view returns (
        uint256 credits,
        uint256 votingPower,
        uint256 timestamp,
        bool isPositive
    ) {
        VoteDetails storage details = proposalVotes[proposalId].voterDetails[voter];
        return (
            details.credits,
            details.votingPower,
            details.timestamp,
            details.isPositive
        );
    }

    function getVotingStats(address voter) external view returns (VotingStats memory) {
        return voterStats[voter];
    }

    function getVoterHistory(address voter) external view returns (uint256[] memory) {
        return voterHistory[voter];
    }

    function getTotalVoters() external view returns (uint256) {
        return _totalVoters.current();
    }

    function getVerifiedVoters() external view returns (uint256) {
        return _verifiedVoters.current();
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