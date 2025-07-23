const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ParticipationIncentives", function () {
    let incentives;
    let mockToken;
    let owner;
    let admin;
    let governance;
    let participant1;
    let participant2;
    let other;

    const INCENTIVES_ADMIN_ROLE = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes("INCENTIVES_ADMIN_ROLE")
    );
    const GOVERNANCE_ROLE = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes("GOVERNANCE_ROLE")
    );

    const EPOCH_DURATION = 30 * 24 * 60 * 60; // 30 days
    const BASE_PROPOSAL_REWARD = ethers.utils.parseEther("100");
    const BASE_VOTE_REWARD = ethers.utils.parseEther("10");

    beforeEach(async function () {
        [owner, admin, governance, participant1, participant2, other] = await ethers.getSigners();

        // Desplegar token mock
        const MockToken = await ethers.getContractFactory("MockERC20");
        mockToken = await MockToken.deploy("Rewards Token", "RWD", 18);
        await mockToken.deployed();

        // Desplegar sistema de incentivos
        const ParticipationIncentives = await ethers.getContractFactory("ParticipationIncentives");
        incentives = await ParticipationIncentives.deploy(
            mockToken.address,
            EPOCH_DURATION,
            BASE_PROPOSAL_REWARD,
            BASE_VOTE_REWARD
        );
        await incentives.deployed();

        // Configurar roles
        await incentives.grantRole(INCENTIVES_ADMIN_ROLE, admin.address);
        await incentives.grantRole(GOVERNANCE_ROLE, governance.address);

        // Dar tokens para recompensas
        await mockToken.mint(incentives.address, ethers.utils.parseEther("1000000"));
        await incentives.connect(admin).addRewardsToPool(ethers.utils.parseEther("1000000"));

        // Registrar participantes
        await incentives.connect(governance).registerParticipant(participant1.address);
        await incentives.connect(governance).registerParticipant(participant2.address);
    });

    describe("Inicialización", function () {
        it("Debería configurar token y parámetros correctamente", async function () {
            expect(await incentives.rewardsToken()).to.equal(mockToken.address);
            expect(await incentives.epochDuration()).to.equal(EPOCH_DURATION);

            const config = await incentives.incentiveConfig();
            expect(config.baseProposalReward).to.equal(BASE_PROPOSAL_REWARD);
            expect(config.baseVoteReward).to.equal(BASE_VOTE_REWARD);
        });

        it("Debería configurar roles correctamente", async function () {
            expect(await incentives.hasRole(INCENTIVES_ADMIN_ROLE, admin.address)).to.be.true;
            expect(await incentives.hasRole(GOVERNANCE_ROLE, governance.address)).to.be.true;
        });
    });

    describe("Registro de participación", function () {
        it("Debería registrar participación en propuesta", async function () {
            await incentives.connect(governance).recordProposalParticipation(
                participant1.address,
                true // successful
            );

            const metrics = await incentives.getParticipantMetrics(participant1.address);
            expect(metrics.proposalsCreated).to.equal(1);
            expect(metrics.successfulProposals).to.equal(1);
            expect(metrics.votingStreak).to.equal(1);
        });

        it("Debería registrar participación en votación", async function () {
            await incentives.connect(governance).recordVoteParticipation(
                participant1.address,
                true // with majority
            );

            const metrics = await incentives.getParticipantMetrics(participant1.address);
            expect(metrics.votesSubmitted).to.equal(1);
            expect(metrics.votingStreak).to.equal(1);
        });

        it("Debería actualizar streak correctamente", async function () {
            // Primera participación
            await incentives.connect(governance).recordVoteParticipation(
                participant1.address,
                true
            );

            // Segunda participación dentro de 24h
            await ethers.provider.send("evm_increaseTime", [23 * 60 * 60]);
            await ethers.provider.send("evm_mine");

            await incentives.connect(governance).recordVoteParticipation(
                participant1.address,
                true
            );

            const metrics = await incentives.getParticipantMetrics(participant1.address);
            expect(metrics.votingStreak).to.equal(2);
        });

        it("Debería reiniciar streak después de 24h", async function () {
            // Primera participación
            await incentives.connect(governance).recordVoteParticipation(
                participant1.address,
                true
            );

            // Segunda participación después de 24h
            await ethers.provider.send("evm_increaseTime", [25 * 60 * 60]);
            await ethers.provider.send("evm_mine");

            await incentives.connect(governance).recordVoteParticipation(
                participant1.address,
                true
            );

            const metrics = await incentives.getParticipantMetrics(participant1.address);
            expect(metrics.votingStreak).to.equal(1);
        });
    });

    describe("Reclamo de recompensas", function () {
        beforeEach(async function () {
            // Generar actividad
            await incentives.connect(governance).recordProposalParticipation(
                participant1.address,
                true
            );
            await incentives.connect(governance).recordVoteParticipation(
                participant1.address,
                true
            );
        });

        it("Debería calcular recompensas correctamente", async function () {
            const [proposalRewards, voteRewards, streakBonus, reputationBonus, total] = 
                await incentives.getEstimatedRewards(participant1.address);

            expect(proposalRewards).to.be.gt(0);
            expect(voteRewards).to.be.gt(0);
            expect(total).to.be.gt(0);
        });

        it("Debería permitir reclamar recompensas", async function () {
            const balanceBefore = await mockToken.balanceOf(participant1.address);
            
            await incentives.connect(participant1).claimRewards();
            
            const balanceAfter = await mockToken.balanceOf(participant1.address);
            expect(balanceAfter).to.be.gt(balanceBefore);

            const metrics = await incentives.getParticipantMetrics(participant1.address);
            expect(metrics.totalRewardsEarned).to.be.gt(0);
            expect(metrics.lastRewardClaim).to.equal(await ethers.provider.getBlock("latest").then(b => b.timestamp));
        });

        it("Debería respetar cooldown", async function () {
            await incentives.connect(participant1).claimRewards();

            await expect(
                incentives.connect(participant1).claimRewards()
            ).to.be.revertedWith("Cooldown not met");
        });

        it("Debería respetar límite diario", async function () {
            // Generar mucha actividad
            for (let i = 0; i < 100; i++) {
                await incentives.connect(governance).recordProposalParticipation(
                    participant1.address,
                    true
                );
                await incentives.connect(governance).recordVoteParticipation(
                    participant1.address,
                    true
                );
            }

            await incentives.connect(participant1).claimRewards();
            
            const metrics = await incentives.getParticipantMetrics(participant1.address);
            const config = await incentives.incentiveConfig();
            expect(metrics.totalRewardsEarned).to.equal(config.maxDailyReward);
        });
    });

    describe("Gestión de épocas", function () {
        it("Debería inicializar primera época correctamente", async function () {
            const stats = await incentives.getEpochStats(1);
            expect(stats.totalParticipants).to.equal(2); // participant1 y participant2
            expect(stats.startTime).to.be.gt(0);
            expect(stats.endTime).to.equal(stats.startTime.add(EPOCH_DURATION));
        });

        it("Debería actualizar estadísticas de época", async function () {
            await incentives.connect(governance).recordProposalParticipation(
                participant1.address,
                true
            );

            const stats = await incentives.getEpochStats(1);
            expect(stats.totalProposals).to.equal(1);
            expect(stats.totalRewardsDistributed).to.be.gt(0);
        });
    });

    describe("Administración", function () {
        it("Debería actualizar configuración de incentivos", async function () {
            const newBaseProposalReward = BASE_PROPOSAL_REWARD.mul(2);
            await incentives.connect(admin).updateIncentiveConfig(
                newBaseProposalReward,
                BASE_VOTE_REWARD,
                200, // 2x
                110, // 1.1x
                120, // 1.2x
                100,
                ethers.utils.parseEther("2000"),
                2 * 24 * 60 * 60 // 2 days
            );

            const config = await incentives.incentiveConfig();
            expect(config.baseProposalReward).to.equal(newBaseProposalReward);
        });

        it("Debería permitir añadir recompensas al pool", async function () {
            const amount = ethers.utils.parseEther("1000");
            await mockToken.mint(owner.address, amount);
            await mockToken.approve(incentives.address, amount);
            
            await incentives.addRewardsToPool(amount);
            
            const poolBefore = await incentives.rewardsPool();
            expect(poolBefore).to.be.gt(0);
        });

        it("Debería permitir pausar/despausar", async function () {
            await incentives.connect(admin).pause();
            expect(await incentives.paused()).to.be.true;

            await expect(
                incentives.connect(participant1).claimRewards()
            ).to.be.revertedWith("Pausable: paused");

            await incentives.connect(admin).unpause();
            expect(await incentives.paused()).to.be.false;
        });
    });

    describe("Reputación", function () {
        it("Debería actualizar reputación", async function () {
            const newScore = 150;
            await incentives.connect(governance).updateReputation(
                participant1.address,
                newScore,
                "Good participation"
            );

            const metrics = await incentives.getParticipantMetrics(participant1.address);
            expect(metrics.reputationScore).to.equal(newScore);
        });

        it("Debería aplicar bonus por reputación", async function () {
            // Dar alta reputación
            await incentives.connect(governance).updateReputation(
                participant1.address,
                200,
                "Excellent participation"
            );

            // Generar actividad
            await incentives.connect(governance).recordProposalParticipation(
                participant1.address,
                true
            );

            const [,,, reputationBonus,] = await incentives.getEstimatedRewards(participant1.address);
            expect(reputationBonus).to.be.gt(0);
        });
    });
}); 