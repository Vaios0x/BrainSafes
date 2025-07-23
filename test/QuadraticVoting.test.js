const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("QuadraticVoting", function () {
    let quadraticVoting;
    let owner;
    let admin;
    let voter1;
    let voter2;
    let creditManager;
    let other;

    const ADMIN_ROLE = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes("ADMIN_ROLE")
    );
    const GOVERNANCE_ROLE = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes("GOVERNANCE_ROLE")
    );
    const CREDIT_MANAGER_ROLE = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes("CREDIT_MANAGER_ROLE")
    );

    beforeEach(async function () {
        [owner, admin, voter1, voter2, creditManager, other] = await ethers.getSigners();

        const QuadraticVoting = await ethers.getContractFactory("QuadraticVoting");
        quadraticVoting = await QuadraticVoting.deploy();
        await quadraticVoting.deployed();

        // Configurar roles
        await quadraticVoting.grantRole(ADMIN_ROLE, admin.address);
        await quadraticVoting.grantRole(GOVERNANCE_ROLE, admin.address);
        await quadraticVoting.grantRole(CREDIT_MANAGER_ROLE, creditManager.address);

        // Registrar votantes
        await quadraticVoting.connect(admin).registerVoter(voter1.address);
        await quadraticVoting.connect(admin).registerVoter(voter2.address);
    });

    describe("Registro de votantes", function () {
        it("Debería registrar un nuevo votante", async function () {
            await quadraticVoting.connect(admin).registerVoter(other.address);

            const voterInfo = await quadraticVoting.getVoterInfo(other.address);
            expect(voterInfo.baseCredits).to.equal(100); // BASE_CREDITS
            expect(voterInfo.isVerified).to.be.false;
        });

        it("Debería rechazar registro duplicado", async function () {
            await expect(
                quadraticVoting.connect(admin).registerVoter(voter1.address)
            ).to.be.revertedWith("Voter already registered");
        });

        it("Debería verificar votante", async function () {
            await quadraticVoting.connect(admin).verifyVoter(
                voter1.address,
                "KYC completed"
            );

            const voterInfo = await quadraticVoting.getVoterInfo(voter1.address);
            expect(voterInfo.isVerified).to.be.true;
            expect(voterInfo.votingPower).to.equal(200); // 2x bonus
        });
    });

    describe("Gestión de créditos", function () {
        beforeEach(async function () {
            await quadraticVoting.connect(admin).verifyVoter(
                voter1.address,
                "KYC completed"
            );
        });

        it("Debería permitir refrescar créditos", async function () {
            // Avanzar tiempo
            await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60]); // 7 días
            await ethers.provider.send("evm_mine", []);

            await quadraticVoting.connect(voter1).refreshCredits(voter1.address);

            const voterInfo = await quadraticVoting.getVoterInfo(voter1.address);
            expect(voterInfo.availableCredits).to.equal(100); // BASE_CREDITS
        });

        it("Debería rechazar refresco temprano", async function () {
            await expect(
                quadraticVoting.connect(voter1).refreshCredits(voter1.address)
            ).to.be.revertedWith("Too soon to refresh");
        });

        it("Debería rechazar refresco para votante no verificado", async function () {
            await expect(
                quadraticVoting.connect(voter2).refreshCredits(voter2.address)
            ).to.be.revertedWith("Voter not verified");
        });
    });

    describe("Votación cuadrática", function () {
        beforeEach(async function () {
            await quadraticVoting.connect(admin).verifyVoter(
                voter1.address,
                "KYC completed"
            );

            // Crear período de votación
            await quadraticVoting.connect(admin).createVotingPeriod(
                1000, // duración
                100 // créditos base
            );
        });

        it("Debería emitir voto cuadrático", async function () {
            const credits = 25; // 5 votos efectivos (sqrt(25) = 5)
            const proposalId = 1;

            await quadraticVoting.connect(voter1).castVote(
                proposalId,
                credits,
                true // voto positivo
            );

            const voteDetails = await quadraticVoting.getProposalVotes(
                proposalId,
                voter1.address
            );
            expect(voteDetails.credits).to.equal(credits);
            expect(voteDetails.votingPower).to.equal(500); // sqrt(25) * 100
            expect(voteDetails.isPositive).to.be.true;

            const voterInfo = await quadraticVoting.getVoterInfo(voter1.address);
            expect(voterInfo.availableCredits).to.equal(75); // 100 - 25
        });

        it("Debería rechazar voto con créditos insuficientes", async function () {
            await expect(
                quadraticVoting.connect(voter1).castVote(
                    1,
                    101, // más que BASE_CREDITS
                    true
                )
            ).to.be.revertedWith("Not enough credits");
        });

        it("Debería rechazar voto duplicado", async function () {
            await quadraticVoting.connect(voter1).castVote(1, 25, true);

            await expect(
                quadraticVoting.connect(voter1).castVote(1, 25, true)
            ).to.be.revertedWith("Already voted");
        });

        it("Debería calcular poder de voto correctamente", async function () {
            const credits = 36; // 6 votos efectivos (sqrt(36) = 6)
            await quadraticVoting.connect(voter1).castVote(1, credits, true);

            const voteDetails = await quadraticVoting.getProposalVotes(1, voter1.address);
            expect(voteDetails.votingPower).to.equal(600); // sqrt(36) * 100
        });
    });

    describe("Períodos de votación", function () {
        it("Debería crear período de votación", async function () {
            const tx = await quadraticVoting.connect(admin).createVotingPeriod(
                1000,
                100
            );

            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === "VotingPeriodCreated");
            expect(event.args.duration).to.equal(1000);
            expect(event.args.baseCredits).to.equal(100);

            const period = await quadraticVoting.votingPeriods(1);
            expect(period.isActive).to.be.true;
        });

        it("Debería finalizar período de votación", async function () {
            await quadraticVoting.connect(admin).createVotingPeriod(100, 100);

            // Avanzar bloques
            for (let i = 0; i < 101; i++) {
                await ethers.provider.send("evm_mine", []);
            }

            await quadraticVoting.connect(admin).endVotingPeriod(1);

            const period = await quadraticVoting.votingPeriods(1);
            expect(period.isActive).to.be.false;
        });

        it("Debería rechazar finalización temprana", async function () {
            await quadraticVoting.connect(admin).createVotingPeriod(1000, 100);

            await expect(
                quadraticVoting.connect(admin).endVotingPeriod(1)
            ).to.be.revertedWith("Period not ended");
        });
    });

    describe("Estadísticas y métricas", function () {
        beforeEach(async function () {
            await quadraticVoting.connect(admin).verifyVoter(
                voter1.address,
                "KYC completed"
            );

            await quadraticVoting.connect(admin).createVotingPeriod(1000, 100);
            await quadraticVoting.connect(voter1).castVote(1, 25, true);
        });

        it("Debería actualizar estadísticas del votante", async function () {
            const stats = await quadraticVoting.getVotingStats(voter1.address);
            expect(stats.totalVotesCast).to.equal(1);
            expect(stats.totalCreditsSpent).to.equal(25);
            expect(stats.participationRate).to.be.gt(0);
        });

        it("Debería mantener historial de votos", async function () {
            const history = await quadraticVoting.getVoterHistory(voter1.address);
            expect(history.length).to.equal(1);
            expect(history[0]).to.equal(1);
        });

        it("Debería contar votantes totales y verificados", async function () {
            const totalVoters = await quadraticVoting.getTotalVoters();
            const verifiedVoters = await quadraticVoting.getVerifiedVoters();

            expect(totalVoters).to.equal(2);
            expect(verifiedVoters).to.equal(1);
        });
    });

    describe("Administración", function () {
        it("Debería permitir pausar/despausar", async function () {
            await quadraticVoting.connect(admin).pause();
            expect(await quadraticVoting.paused()).to.be.true;

            await expect(
                quadraticVoting.connect(voter1).refreshCredits(voter1.address)
            ).to.be.revertedWith("Pausable: paused");

            await quadraticVoting.connect(admin).unpause();
            expect(await quadraticVoting.paused()).to.be.false;
        });

        it("Debería restringir funciones administrativas", async function () {
            await expect(
                quadraticVoting.connect(other).createVotingPeriod(1000, 100)
            ).to.be.revertedWith("AccessControl:");

            await expect(
                quadraticVoting.connect(other).verifyVoter(voter1.address, "Unauthorized")
            ).to.be.revertedWith("AccessControl:");
        });
    });
}); 