// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title CrossChainValidation
 * @dev Validación avanzada de mensajes y operaciones cross-chain para BrainSafes
 * @notice Incluye Merkle proofs, firmas, anti-replay y doble validación
 * @custom:security-contact security@brainsafes.com
 */
contract CrossChainValidation is AccessControl, Pausable, ReentrancyGuard {
    bytes32 public constant VALIDATION_ADMIN = keccak256("VALIDATION_ADMIN");
    bytes32 public constant RELAYER_ROLE = keccak256("RELAYER_ROLE");

    struct ValidationRecord {
        bytes32 messageId;
        address relayer;
        bool merkleValid;
        bool signatureValid;
        bool doubleValidated;
        uint256 timestamp;
        string details;
    }

    mapping(bytes32 => ValidationRecord) public validations;
    mapping(bytes32 => bool) public usedNonces;
    uint256 public validationCount;

    event MessageValidated(bytes32 indexed messageId, address relayer, bool merkleValid, bool signatureValid, bool doubleValidated);
    event NonceUsed(bytes32 indexed nonce);

    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(VALIDATION_ADMIN, msg.sender);
    }

    function validateMessage(
        bytes32 messageId,
        bytes32[] calldata merkleProof,
        bytes calldata signature,
        bytes32 nonce,
        address expectedSigner
    ) external onlyRole(RELAYER_ROLE) whenNotPaused returns (bool) {
        require(!usedNonces[nonce], "Nonce already used");
        require(expectedSigner != address(0), "Invalid signer");
        // Validar Merkle proof (placeholder, implementar lógica real)
        bool merkleValid = _verifyMerkleProof(messageId, merkleProof);
        // Validar firma
        bool signatureValid = _verifySignature(messageId, signature, expectedSigner);
        // Doble validación: requiere ambas
        bool doubleValidated = merkleValid && signatureValid;
        // Registrar
        validationCount++;
        validations[messageId] = ValidationRecord({
            messageId: messageId,
            relayer: msg.sender,
            merkleValid: merkleValid,
            signatureValid: signatureValid,
            doubleValidated: doubleValidated,
            timestamp: block.timestamp,
            details: ""
        });
        usedNonces[nonce] = true;
        emit MessageValidated(messageId, msg.sender, merkleValid, signatureValid, doubleValidated);
        emit NonceUsed(nonce);
        return doubleValidated;
    }

    function _verifyMerkleProof(bytes32 messageId, bytes32[] memory proof) internal pure returns (bool) {
        // Implementar lógica real de Merkle proof
        return proof.length > 0; // Placeholder
    }

    function _verifySignature(bytes32 messageId, bytes memory signature, address expectedSigner) internal pure returns (bool) {
        // Implementar lógica real de verificación de firma ECDSA
        return signature.length == 65 && expectedSigner != address(0); // Placeholder
    }

    function pause() external onlyRole(VALIDATION_ADMIN) {
        _pause();
    }

    function unpause() external onlyRole(VALIDATION_ADMIN) {
        _unpause();
    }
} 