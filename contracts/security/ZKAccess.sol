// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./Groth16Verifier.sol";

contract ZKAccess {
    Groth16Verifier public verifier;

    event ProofVerified(address indexed user);

    constructor(address _verifier) {
        verifier = Groth16Verifier(_verifier);
    }

    function accessWithProof(
        uint256[2] calldata a,
        uint256[2][2] calldata b,
        uint256[2] calldata c,
        uint256[] calldata publicInputs
    ) external {
        require(verifier.verifyProof(a, b, c, publicInputs), "Prueba ZK inválida");
        emit ProofVerified(msg.sender);
        // Aquí puedes permitir mint, acceso, etc.
    }
} 