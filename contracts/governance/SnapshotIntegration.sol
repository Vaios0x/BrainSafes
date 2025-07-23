// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title SnapshotIntegration
 * @dev Integración con Snapshot para votación off-chain con verificación on-chain
 * @author BrainSafes Team
 */
contract SnapshotIntegration is AccessControl, ReentrancyGuard, Pausable, EIP712 {
    using ECDSA for bytes32;
    using Counters for Counters.Counter;

    // Roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant SNAPSHOT_ROLE = keccak256("SNAPSHOT_ROLE");
    bytes32 public constant VALIDATOR_ROLE = keccak256("VALIDATOR_ROLE");

    // Estructuras
    struct SnapshotVote {
        uint256 proposalId;
        address voter;
        uint256 votingPower;
        uint256 choice;
        string reason;
        uint256 timestamp;
        bytes signature;
    }

    struct ProposalSnapshot {
        uint256 proposalId;
        string snapshotId;
        uint256 startBlock;
        uint256 endBlock;
        uint256 totalVotingPower;
        uint256 quorum;
        bool isFinalized;
        mapping(uint256 => uint256) choiceTotals;
        mapping(address => bool) hasVoted;
    }

    struct ValidationResult {
        bool isValid;
        string reason;
        uint256 timestamp;
        address validator;
    }

    struct BatchVote {
        address voter;
        uint256[] proposalIds;
        uint256[] choices;
        uint256[] votingPowers;
        bytes[] signatures;
    }

    // Eventos
    event VoteSubmitted(
        uint256 indexed proposalId,
        address indexed voter,
        uint256 choice,
        uint256 votingPower,
        bytes signature
    );

    event VoteBatchSubmitted(
        address indexed voter,
        uint256[] proposalIds,
        uint256[] choices,
        uint256[] votingPowers
    );

    event ProposalSnapshotCreated(
        uint256 indexed proposalId,
        string snapshotId,
        uint256 startBlock,
        uint256 endBlock,
        uint256 quorum
    );

    event ProposalSnapshotFinalized(
        uint256 indexed proposalId,
        uint256 totalVotes,
        uint256 winningChoice
    );

    event VoteValidated(
        uint256 indexed proposalId,
        address indexed voter,
        bool isValid,
        string reason
    );

    event SignatureVerified(
        address indexed signer,
        bytes32 hash,
        bytes signature,
        bool isValid
    );

    // Variables de estado
    mapping(uint256 => ProposalSnapshot) public proposals;
    mapping(bytes32 => ValidationResult) public validations;
    mapping(address => uint256) public nonces;
    mapping(address => uint256) public lastVoteTimestamp;

    // Configuración
    uint256 public constant MIN_VOTE_DELAY = 1 hours;
    uint256 public constant MAX_VOTE_DURATION = 14 days;
    uint256 public constant MIN_QUORUM_PERCENTAGE = 400; // 4%
    uint256 public constant BATCH_VOTE_LIMIT = 50;
    bytes32 private constant VOTE_TYPEHASH = keccak256(
        "Vote(uint256 proposalId,address voter,uint256 votingPower,uint256 choice,string reason,uint256 nonce,uint256 deadline)"
    );

    // Contadores
    Counters.Counter private _proposalCounter;

    constructor() EIP712("BrainSafes Snapshot", "1") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(SNAPSHOT_ROLE, msg.sender);
        _grantRole(VALIDATOR_ROLE, msg.sender);
    }

    /**
     * @dev Crea nuevo snapshot de propuesta
     */
    function createProposalSnapshot(
        string memory snapshotId,
        uint256 startDelay,
        uint256 duration,
        uint256 quorumPercentage
    ) external onlyRole(SNAPSHOT_ROLE) returns (uint256) {
        require(bytes(snapshotId).length > 0, "Empty snapshot ID");
        require(startDelay >= MIN_VOTE_DELAY, "Start delay too short");
        require(duration <= MAX_VOTE_DURATION, "Duration too long");
        require(quorumPercentage >= MIN_QUORUM_PERCENTAGE, "Quorum too low");

        _proposalCounter.increment();
        uint256 proposalId = _proposalCounter.current();

        ProposalSnapshot storage proposal = proposals[proposalId];
        proposal.proposalId = proposalId;
        proposal.snapshotId = snapshotId;
        proposal.startBlock = block.number + (startDelay / 12); // ~12 seg por bloque
        proposal.endBlock = proposal.startBlock + (duration / 12);
        proposal.quorum = quorumPercentage;
        proposal.isFinalized = false;

        emit ProposalSnapshotCreated(
            proposalId,
            snapshotId,
            proposal.startBlock,
            proposal.endBlock,
            quorumPercentage
        );

        return proposalId;
    }

    /**
     * @dev Envía voto off-chain
     */
    function submitVote(
        uint256 proposalId,
        uint256 choice,
        uint256 votingPower,
        string memory reason,
        uint256 deadline,
        bytes memory signature
    ) external nonReentrant whenNotPaused {
        ProposalSnapshot storage proposal = proposals[proposalId];
        require(proposal.proposalId != 0, "Invalid proposal");
        require(block.number >= proposal.startBlock, "Voting not started");
        require(block.number <= proposal.endBlock, "Voting ended");
        require(!proposal.hasVoted[msg.sender], "Already voted");
        require(block.timestamp <= deadline, "Vote expired");

        // Verificar firma
        bytes32 structHash = keccak256(abi.encode(
            VOTE_TYPEHASH,
            proposalId,
            msg.sender,
            votingPower,
            choice,
            keccak256(bytes(reason)),
            nonces[msg.sender],
            deadline
        ));

        bytes32 hash = _hashTypedDataV4(structHash);
        address signer = hash.recover(signature);
        require(signer == msg.sender, "Invalid signature");

        // Actualizar estado
        proposal.hasVoted[msg.sender] = true;
        proposal.choiceTotals[choice] = proposal.choiceTotals[choice] + votingPower;
        proposal.totalVotingPower = proposal.totalVotingPower + votingPower;
        nonces[msg.sender]++;
        lastVoteTimestamp[msg.sender] = block.timestamp;

        emit VoteSubmitted(
            proposalId,
            msg.sender,
            choice,
            votingPower,
            signature
        );

        emit SignatureVerified(
            msg.sender,
            hash,
            signature,
            true
        );
    }

    /**
     * @dev Envía votos en lote
     */
    function submitBatchVotes(BatchVote calldata batchVote) external nonReentrant whenNotPaused {
        require(
            batchVote.proposalIds.length == batchVote.choices.length &&
            batchVote.choices.length == batchVote.votingPowers.length &&
            batchVote.votingPowers.length == batchVote.signatures.length,
            "Array length mismatch"
        );
        require(batchVote.proposalIds.length <= BATCH_VOTE_LIMIT, "Batch too large");

        for (uint256 i = 0; i < batchVote.proposalIds.length; i++) {
            ProposalSnapshot storage proposal = proposals[batchVote.proposalIds[i]];
            require(proposal.proposalId != 0, "Invalid proposal");
            require(block.number >= proposal.startBlock, "Voting not started");
            require(block.number <= proposal.endBlock, "Voting ended");
            require(!proposal.hasVoted[batchVote.voter], "Already voted");

            // Verificar firma
            bytes32 structHash = keccak256(abi.encode(
                VOTE_TYPEHASH,
                batchVote.proposalIds[i],
                batchVote.voter,
                batchVote.votingPowers[i],
                batchVote.choices[i],
                "",
                nonces[batchVote.voter],
                block.timestamp + 1 hours
            ));

            bytes32 hash = _hashTypedDataV4(structHash);
            address signer = hash.recover(batchVote.signatures[i]);
            require(signer == batchVote.voter, "Invalid signature");

            // Actualizar estado
            proposal.hasVoted[batchVote.voter] = true;
            proposal.choiceTotals[batchVote.choices[i]] += batchVote.votingPowers[i];
            proposal.totalVotingPower += batchVote.votingPowers[i];
            nonces[batchVote.voter]++;
        }

        lastVoteTimestamp[batchVote.voter] = block.timestamp;

        emit VoteBatchSubmitted(
            batchVote.voter,
            batchVote.proposalIds,
            batchVote.choices,
            batchVote.votingPowers
        );
    }

    /**
     * @dev Valida voto off-chain
     */
    function validateVote(
        uint256 proposalId,
        address voter,
        uint256 choice,
        uint256 votingPower,
        bytes memory signature
    ) external onlyRole(VALIDATOR_ROLE) returns (bool) {
        bytes32 voteHash = keccak256(abi.encodePacked(
            proposalId,
            voter,
            choice,
            votingPower,
            signature
        ));

        // Verificar firma
        bytes32 structHash = keccak256(abi.encode(
            VOTE_TYPEHASH,
            proposalId,
            voter,
            votingPower,
            choice,
            "",
            nonces[voter],
            block.timestamp + 1 hours
        ));

        bytes32 hash = _hashTypedDataV4(structHash);
        address signer = hash.recover(signature);
        bool isValid = signer == voter;

        validations[voteHash] = ValidationResult({
            isValid: isValid,
            reason: isValid ? "Valid signature" : "Invalid signature",
            timestamp: block.timestamp,
            validator: msg.sender
        });

        emit VoteValidated(
            proposalId,
            voter,
            isValid,
            isValid ? "Valid signature" : "Invalid signature"
        );

        return isValid;
    }

    /**
     * @dev Finaliza snapshot de propuesta
     */
    function finalizeProposalSnapshot(
        uint256 proposalId
    ) external onlyRole(SNAPSHOT_ROLE) {
        ProposalSnapshot storage proposal = proposals[proposalId];
        require(!proposal.isFinalized, "Already finalized");
        require(block.number > proposal.endBlock, "Voting not ended");

        uint256 winningChoice = _calculateWinningChoice(proposalId);
        proposal.isFinalized = true;

        emit ProposalSnapshotFinalized(
            proposalId,
            proposal.totalVotingPower,
            winningChoice
        );
    }

    /**
     * @dev Calcula opción ganadora
     */
    function _calculateWinningChoice(
        uint256 proposalId
    ) internal view returns (uint256) {
        ProposalSnapshot storage proposal = proposals[proposalId];
        uint256 highestVotes = 0;
        uint256 winningChoice = 0;

        // Iterar sobre opciones (simplificado)
        for (uint256 i = 1; i <= 10; i++) {
            if (proposal.choiceTotals[i] > highestVotes) {
                highestVotes = proposal.choiceTotals[i];
                winningChoice = i;
            }
        }

        return winningChoice;
    }

    /**
     * @dev Verifica firma EIP-712
     */
    function verifySignature(
        address signer,
        uint256 proposalId,
        uint256 choice,
        uint256 votingPower,
        uint256 deadline,
        bytes memory signature
    ) external view returns (bool) {
        bytes32 structHash = keccak256(abi.encode(
            VOTE_TYPEHASH,
            proposalId,
            signer,
            votingPower,
            choice,
            "",
            nonces[signer],
            deadline
        ));

        bytes32 hash = _hashTypedDataV4(structHash);
        address recoveredSigner = hash.recover(signature);
        return recoveredSigner == signer;
    }

    // Getters
    function getProposalSnapshot(
        uint256 proposalId
    ) external view returns (
        string memory snapshotId,
        uint256 startBlock,
        uint256 endBlock,
        uint256 totalVotingPower,
        uint256 quorum,
        bool isFinalized
    ) {
        ProposalSnapshot storage proposal = proposals[proposalId];
        return (
            proposal.snapshotId,
            proposal.startBlock,
            proposal.endBlock,
            proposal.totalVotingPower,
            proposal.quorum,
            proposal.isFinalized
        );
    }

    function getChoiceVotes(
        uint256 proposalId,
        uint256 choice
    ) external view returns (uint256) {
        return proposals[proposalId].choiceTotals[choice];
    }

    function hasVoted(
        uint256 proposalId,
        address voter
    ) external view returns (bool) {
        return proposals[proposalId].hasVoted[voter];
    }

    function getValidationResult(
        uint256 proposalId,
        address voter,
        uint256 choice,
        uint256 votingPower,
        bytes memory signature
    ) external view returns (ValidationResult memory) {
        bytes32 voteHash = keccak256(abi.encodePacked(
            proposalId,
            voter,
            choice,
            votingPower,
            signature
        ));
        return validations[voteHash];
    }

    function getNonce(address voter) external view returns (uint256) {
        return nonces[voter];
    }

    function getLastVoteTimestamp(address voter) external view returns (uint256) {
        return lastVoteTimestamp[voter];
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