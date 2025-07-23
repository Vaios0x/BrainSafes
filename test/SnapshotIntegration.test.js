const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SnapshotIntegration", function () {
    let snapshotIntegration;
    let owner;
    let admin;
    let voter1;
    let voter2;
    let validator;
    let other;

    const ADMIN_ROLE = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes("ADMIN_ROLE")
    );
    const SNAPSHOT_ROLE = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes("SNAPSHOT_ROLE")
    );
    const VALIDATOR_ROLE = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes("VALIDATOR_ROLE")
    );

    beforeEach(async function () {
        [owner, admin, voter1, voter2, validator, other] = await ethers.getSigners();

        const SnapshotIntegration = await ethers.getContractFactory("SnapshotIntegration");
        snapshotIntegration = await SnapshotIntegration.deploy();
        await snapshotIntegration.deployed();

        // Configurar roles
        await snapshotIntegration.grantRole(ADMIN_ROLE, admin.address);
        await snapshotIntegration.grantRole(SNAPSHOT_ROLE, admin.address);
        await snapshotIntegration.grantRole(VALIDATOR_ROLE, validator.address);
    });

    describe("Creación de snapshots", function () {
        it("Debería crear nuevo snapshot de propuesta", async function () {
            const tx = await snapshotIntegration.connect(admin).createProposalSnapshot(
                "snapshot-1",
                3600, // 1 hora de delay
                86400, // 1 día de duración
                500 // 5% quorum
            );

            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === "ProposalSnapshotCreated");
            expect(event.args.snapshotId).to.equal("snapshot-1");
            expect(event.args.quorum).to.equal(500);

            const proposal = await snapshotIntegration.getProposalSnapshot(1);
            expect(proposal.snapshotId).to.equal("snapshot-1");
            expect(proposal.isFinalized).to.be.false;
        });

        it("Debería rechazar delay muy corto", async function () {
            await expect(
                snapshotIntegration.connect(admin).createProposalSnapshot(
                    "snapshot-1",
                    1800, // 30 minutos
                    86400,
                    500
                )
            ).to.be.revertedWith("Start delay too short");
        });

        it("Debería rechazar duración muy larga", async function () {
            await expect(
                snapshotIntegration.connect(admin).createProposalSnapshot(
                    "snapshot-1",
                    3600,
                    15 * 86400, // 15 días
                    500
                )
            ).to.be.revertedWith("Duration too long");
        });
    });

    describe("Votación", function () {
        let proposalId;
        let deadline;

        beforeEach(async function () {
            const tx = await snapshotIntegration.connect(admin).createProposalSnapshot(
                "snapshot-1",
                3600,
                86400,
                500
            );
            const receipt = await tx.wait();
            proposalId = 1;

            // Avanzar bloques para iniciar votación
            await ethers.provider.send("evm_increaseTime", [3600]);
            await ethers.provider.send("evm_mine", []);

            deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hora
        });

        it("Debería emitir voto con firma válida", async function () {
            const domain = {
                name: "BrainSafes Snapshot",
                version: "1",
                chainId: (await ethers.provider.getNetwork()).chainId,
                verifyingContract: snapshotIntegration.address
            };

            const types = {
                Vote: [
                    { name: "proposalId", type: "uint256" },
                    { name: "voter", type: "address" },
                    { name: "votingPower", type: "uint256" },
                    { name: "choice", type: "uint256" },
                    { name: "reason", type: "string" },
                    { name: "nonce", type: "uint256" },
                    { name: "deadline", type: "uint256" }
                ]
            };

            const value = {
                proposalId: proposalId,
                voter: voter1.address,
                votingPower: 100,
                choice: 1,
                reason: "Support proposal",
                nonce: 0,
                deadline: deadline
            };

            const signature = await voter1._signTypedData(domain, types, value);

            await snapshotIntegration.connect(voter1).submitVote(
                proposalId,
                1, // choice
                100, // votingPower
                "Support proposal",
                deadline,
                signature
            );

            const hasVoted = await snapshotIntegration.hasVoted(proposalId, voter1.address);
            expect(hasVoted).to.be.true;

            const voteDetails = await snapshotIntegration.getProposalVotes(proposalId, voter1.address);
            expect(voteDetails.choice).to.equal(1);
            expect(voteDetails.votingPower).to.equal(100);
        });

        it("Debería rechazar firma inválida", async function () {
            const signature = ethers.utils.arrayify("0x1234");

            await expect(
                snapshotIntegration.connect(voter1).submitVote(
                    proposalId,
                    1,
                    100,
                    "Support proposal",
                    deadline,
                    signature
                )
            ).to.be.revertedWith("Invalid signature");
        });

        it("Debería rechazar voto duplicado", async function () {
            const domain = {
                name: "BrainSafes Snapshot",
                version: "1",
                chainId: (await ethers.provider.getNetwork()).chainId,
                verifyingContract: snapshotIntegration.address
            };

            const types = {
                Vote: [
                    { name: "proposalId", type: "uint256" },
                    { name: "voter", type: "address" },
                    { name: "votingPower", type: "uint256" },
                    { name: "choice", type: "uint256" },
                    { name: "reason", type: "string" },
                    { name: "nonce", type: "uint256" },
                    { name: "deadline", type: "uint256" }
                ]
            };

            const value = {
                proposalId: proposalId,
                voter: voter1.address,
                votingPower: 100,
                choice: 1,
                reason: "Support proposal",
                nonce: 0,
                deadline: deadline
            };

            const signature = await voter1._signTypedData(domain, types, value);

            await snapshotIntegration.connect(voter1).submitVote(
                proposalId,
                1,
                100,
                "Support proposal",
                deadline,
                signature
            );

            await expect(
                snapshotIntegration.connect(voter1).submitVote(
                    proposalId,
                    1,
                    100,
                    "Support proposal",
                    deadline,
                    signature
                )
            ).to.be.revertedWith("Already voted");
        });
    });

    describe("Votos en lote", function () {
        let proposalIds;
        let signatures;
        let deadline;

        beforeEach(async function () {
            proposalIds = [];
            signatures = [];

            // Crear múltiples propuestas
            for (let i = 0; i < 3; i++) {
                await snapshotIntegration.connect(admin).createProposalSnapshot(
                    `snapshot-${i + 1}`,
                    3600,
                    86400,
                    500
                );
                proposalIds.push(i + 1);
            }

            // Avanzar bloques
            await ethers.provider.send("evm_increaseTime", [3600]);
            await ethers.provider.send("evm_mine", []);

            deadline = Math.floor(Date.now() / 1000) + 3600;

            // Generar firmas
            const domain = {
                name: "BrainSafes Snapshot",
                version: "1",
                chainId: (await ethers.provider.getNetwork()).chainId,
                verifyingContract: snapshotIntegration.address
            };

            const types = {
                Vote: [
                    { name: "proposalId", type: "uint256" },
                    { name: "voter", type: "address" },
                    { name: "votingPower", type: "uint256" },
                    { name: "choice", type: "uint256" },
                    { name: "reason", type: "string" },
                    { name: "nonce", type: "uint256" },
                    { name: "deadline", type: "uint256" }
                ]
            };

            for (let i = 0; i < proposalIds.length; i++) {
                const value = {
                    proposalId: proposalIds[i],
                    voter: voter1.address,
                    votingPower: 100,
                    choice: 1,
                    reason: "",
                    nonce: i,
                    deadline: deadline
                };

                const signature = await voter1._signTypedData(domain, types, value);
                signatures.push(signature);
            }
        });

        it("Debería procesar votos en lote", async function () {
            const batchVote = {
                voter: voter1.address,
                proposalIds: proposalIds,
                choices: [1, 1, 1],
                votingPowers: [100, 100, 100],
                signatures: signatures
            };

            await snapshotIntegration.connect(voter1).submitBatchVotes(batchVote);

            // Verificar votos
            for (let i = 0; i < proposalIds.length; i++) {
                const hasVoted = await snapshotIntegration.hasVoted(proposalIds[i], voter1.address);
                expect(hasVoted).to.be.true;

                const voteDetails = await snapshotIntegration.getProposalVotes(proposalIds[i], voter1.address);
                expect(voteDetails.choice).to.equal(1);
                expect(voteDetails.votingPower).to.equal(100);
            }
        });

        it("Debería rechazar lote muy grande", async function () {
            const largeProposalIds = Array(51).fill(1);
            const largeChoices = Array(51).fill(1);
            const largeVotingPowers = Array(51).fill(100);
            const largeSignatures = Array(51).fill(signatures[0]);

            const batchVote = {
                voter: voter1.address,
                proposalIds: largeProposalIds,
                choices: largeChoices,
                votingPowers: largeVotingPowers,
                signatures: largeSignatures
            };

            await expect(
                snapshotIntegration.connect(voter1).submitBatchVotes(batchVote)
            ).to.be.revertedWith("Batch too large");
        });
    });

    describe("Validación", function () {
        let proposalId;
        let signature;
        let deadline;

        beforeEach(async function () {
            const tx = await snapshotIntegration.connect(admin).createProposalSnapshot(
                "snapshot-1",
                3600,
                86400,
                500
            );
            proposalId = 1;

            // Avanzar bloques
            await ethers.provider.send("evm_increaseTime", [3600]);
            await ethers.provider.send("evm_mine", []);

            deadline = Math.floor(Date.now() / 1000) + 3600;

            // Generar firma
            const domain = {
                name: "BrainSafes Snapshot",
                version: "1",
                chainId: (await ethers.provider.getNetwork()).chainId,
                verifyingContract: snapshotIntegration.address
            };

            const types = {
                Vote: [
                    { name: "proposalId", type: "uint256" },
                    { name: "voter", type: "address" },
                    { name: "votingPower", type: "uint256" },
                    { name: "choice", type: "uint256" },
                    { name: "reason", type: "string" },
                    { name: "nonce", type: "uint256" },
                    { name: "deadline", type: "uint256" }
                ]
            };

            const value = {
                proposalId: proposalId,
                voter: voter1.address,
                votingPower: 100,
                choice: 1,
                reason: "Support proposal",
                nonce: 0,
                deadline: deadline
            };

            signature = await voter1._signTypedData(domain, types, value);
        });

        it("Debería validar voto correctamente", async function () {
            const isValid = await snapshotIntegration.connect(validator).validateVote(
                proposalId,
                voter1.address,
                1,
                100,
                signature
            );

            expect(isValid).to.be.true;

            const result = await snapshotIntegration.getValidationResult(
                proposalId,
                voter1.address,
                1,
                100,
                signature
            );
            expect(result.isValid).to.be.true;
            expect(result.validator).to.equal(validator.address);
        });

        it("Debería identificar firma inválida", async function () {
            const invalidSignature = ethers.utils.arrayify("0x1234");

            const isValid = await snapshotIntegration.connect(validator).validateVote(
                proposalId,
                voter1.address,
                1,
                100,
                invalidSignature
            );

            expect(isValid).to.be.false;
        });
    });

    describe("Finalización", function () {
        let proposalId;

        beforeEach(async function () {
            const tx = await snapshotIntegration.connect(admin).createProposalSnapshot(
                "snapshot-1",
                3600,
                86400,
                500
            );
            proposalId = 1;

            // Avanzar bloques para finalizar votación
            await ethers.provider.send("evm_increaseTime", [90000]); // > 24 horas
            await ethers.provider.send("evm_mine", []);
        });

        it("Debería finalizar snapshot", async function () {
            await snapshotIntegration.connect(admin).finalizeProposalSnapshot(proposalId);

            const proposal = await snapshotIntegration.getProposalSnapshot(proposalId);
            expect(proposal.isFinalized).to.be.true;
        });

        it("Debería rechazar finalización temprana", async function () {
            // Crear nueva propuesta
            await snapshotIntegration.connect(admin).createProposalSnapshot(
                "snapshot-2",
                3600,
                86400,
                500
            );

            await expect(
                snapshotIntegration.connect(admin).finalizeProposalSnapshot(2)
            ).to.be.revertedWith("Voting not ended");
        });

        it("Debería rechazar finalización duplicada", async function () {
            await snapshotIntegration.connect(admin).finalizeProposalSnapshot(proposalId);

            await expect(
                snapshotIntegration.connect(admin).finalizeProposalSnapshot(proposalId)
            ).to.be.revertedWith("Already finalized");
        });
    });

    describe("Administración", function () {
        it("Debería permitir pausar/despausar", async function () {
            await snapshotIntegration.connect(admin).pause();
            expect(await snapshotIntegration.paused()).to.be.true;

            await expect(
                snapshotIntegration.connect(admin).createProposalSnapshot(
                    "snapshot-1",
                    3600,
                    86400,
                    500
                )
            ).to.be.revertedWith("Pausable: paused");

            await snapshotIntegration.connect(admin).unpause();
            expect(await snapshotIntegration.paused()).to.be.false;
        });

        it("Debería restringir funciones administrativas", async function () {
            await expect(
                snapshotIntegration.connect(other).createProposalSnapshot(
                    "snapshot-1",
                    3600,
                    86400,
                    500
                )
            ).to.be.revertedWith("AccessControl:");

            await expect(
                snapshotIntegration.connect(other).pause()
            ).to.be.revertedWith("AccessControl:");
        });
    });
}); 