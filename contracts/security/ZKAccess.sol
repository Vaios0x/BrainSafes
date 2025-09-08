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
        // Convert the calldata arrays to the proper Proof struct format
        Groth16Verifier.Proof memory proof = Groth16Verifier.Proof({
            a: Groth16Verifier.G1Point(a[0], a[1]),
            b: Groth16Verifier.G2Point([b[0][0], b[0][1]], [b[1][0], b[1][1]]),
            c: Groth16Verifier.G1Point(c[0], c[1])
        });
        
        require(verifier.verifyProof(proof, publicInputs), unicode"Prueba ZK inválida");
        emit ProofVerified(msg.sender);
        // Aquí puedes permitir mint, acceso, etc.
    }
} 