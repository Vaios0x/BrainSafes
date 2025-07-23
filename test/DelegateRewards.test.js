const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DelegateRewards", function () {
    let delegateRewards;
    let owner;
    let admin;
    let delegate1;
    let delegate2;
    let distributor;
    let other;

    const ADMIN_ROLE = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes("ADMIN_ROLE")
    );
    const GOVERNANCE_ROLE = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes("GOVERNANCE_ROLE")
    );
    const REWARDS_DISTRIBUTOR_ROLE = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes("REWARDS_DISTRIBUTOR_ROLE")
    );

    // Configuración inicial
    const BASE_REWARD = ethers.utils.parseEther("0.1");
    const PROPOSAL_REWARD = ethers.utils.parseEther("0.5");
    const STREAK_BONUS = ethers.utils.parseEther("0.2");
    const REPUTATION_MULTIPLIER = 10;
    const MAX_MULTIPLIER = 300;
    const MIN_VOTES = 5;
    const STREAK_THRESHOLD = 7;
    const BONUS_DURATION = 1000;
    const COOLDOWN_PERIOD = 100;

    beforeEach(async function () {
        [owner, admin, delegate1, delegate2, distributor, other] = await ethers.getSigners();

        const DelegateRewards = await ethers.getContractFactory("DelegateRewards");
        delegateRewards = await DelegateRewards.deploy(
            BASE_REWARD,
            PROPOSAL_REWARD,
            STREAK_BONUS,
            REPUTATION_MULTIPLIER,
            MAX_MULTIPLIER,
            MIN_VOTES,
            STREAK_THRESHOLD,
            BONUS_DURATION,
            COOLDOWN_PERIOD
        );
        await delegateRewards.deployed();

        // Configurar roles
        await delegateRewards.grantRole(ADMIN_ROLE, admin.address);
        await delegateRewards.grantRole(GOVERNANCE_ROLE, admin.address);
        await delegateRewards.grantRole(REWARDS_DISTRIBUTOR_ROLE, distributor.address);

        // Fondear contrato
        await owner.sendTransaction({
            to: delegateRewards.address,
            value: ethers.utils.parseEther("10.0")
        });
    });

    describe("Inicialización", function () {
        it("Debería configurar parámetros correctamente", async function () {
            const config = await delegateRewards.rewardConfig();
            expect(config.baseReward).to.equal(BASE_REWARD);
            expect(config.proposalCreationReward).to.equal(PROPOSAL_REWARD);
            expect(config.votingStreakBonus).to.equal(STREAK_BONUS);
            expect(config.reputationMultiplier).to.equal(REPUTATION_MULTIPLIER);
            expect(config.maxMultiplier).to.equal(MAX_MULTIPLIER);
        });

        it("Debería configurar roles correctamente", async function () {
            expect(await delegateRewards.hasRole(ADMIN_ROLE, admin.address)).to.be.true;
            expect(await delegateRewards.hasRole(GOVERNANCE_ROLE, admin.address)).to.be.true;
            expect(await delegateRewards.hasRole(REWARDS_DISTRIBUTOR_ROLE, distributor.address)).to.be.true;
        });
    });

    describe("Registro de participación", function () {
        it("Debería registrar voto y asignar recompensa base", async function () {
            await delegateRewards.connect(admin).recordVoteParticipation(
                delegate1.address,
                1 // proposalId
            );

            const stats = await delegateRewards.getDelegateStats(delegate1.address);
            expect(stats.totalVotes).to.equal(1);
            expect(stats.lastVoteBlock).to.equal(await ethers.provider.getBlockNumber());
        });

        it("Debería registrar creación de propuesta", async function () {
            await delegateRewards.connect(admin).recordProposalCreation(delegate1.address);

            const stats = await delegateRewards.getDelegateStats(delegate1.address);
            expect(stats.proposalsCreated).to.equal(1);
            expect(stats.availableRewards).to.equal(PROPOSAL_REWARD);
        });

        it("Debería actualizar racha de votación", async function () {
            // Simular votos consecutivos
            for (let i = 0; i < 5; i++) {
                await delegateRewards.connect(admin).recordVoteParticipation(
                    delegate1.address,
                    i + 1
                );
            }

            const stats = await delegateRewards.getDelegateStats(delegate1.address);
            expect(stats.votingStreak).to.be.gt(1);
        });
    });

    describe("Bonificaciones y multiplicadores", function () {
        it("Debería activar bonus por racha", async function () {
            // Alcanzar umbral de racha
            for (let i = 0; i < STREAK_THRESHOLD; i++) {
                await delegateRewards.connect(admin).recordVoteParticipation(
                    delegate1.address,
                    i + 1
                );
            }

            const stats = await delegateRewards.getDelegateStats(delegate1.address);
            expect(stats.hasActiveBonus).to.be.true;
            expect(stats.multiplier).to.be.gt(100); // > 1x
        });

        it("Debería aplicar multiplicador por reputación", async function () {
            await delegateRewards.connect(admin).updateDelegateReputation(
                delegate1.address,
                200 // Alta reputación
            );

            const multiplier = await delegateRewards.getCurrentMultiplier(delegate1.address);
            expect(multiplier).to.be.gt(100); // > 1x
        });

        it("Debería respetar multiplicador máximo", async function () {
            // Configurar alta reputación y racha
            await delegateRewards.connect(admin).updateDelegateReputation(
                delegate1.address,
                1000
            );

            for (let i = 0; i < STREAK_THRESHOLD * 2; i++) {
                await delegateRewards.connect(admin).recordVoteParticipation(
                    delegate1.address,
                    i + 1
                );
            }

            const multiplier = await delegateRewards.getCurrentMultiplier(delegate1.address);
            expect(multiplier).to.lte(MAX_MULTIPLIER);
        });
    });

    describe("Reclamación de recompensas", function () {
        beforeEach(async function () {
            // Generar algunas recompensas
            await delegateRewards.connect(admin).recordProposalCreation(delegate1.address);
            for (let i = 0; i < 5; i++) {
                await delegateRewards.connect(admin).recordVoteParticipation(
                    delegate1.address,
                    i + 1
                );
            }
        });

        it("Debería permitir reclamar recompensas", async function () {
            const stats = await delegateRewards.getDelegateStats(delegate1.address);
            const balanceBefore = await ethers.provider.getBalance(delegate1.address);

            await delegateRewards.connect(delegate1).claimRewards();

            const balanceAfter = await ethers.provider.getBalance(delegate1.address);
            expect(balanceAfter).to.be.gt(balanceBefore);

            const statsAfter = await delegateRewards.getDelegateStats(delegate1.address);
            expect(statsAfter.availableRewards).to.equal(0);
            expect(statsAfter.totalRewardsEarned).to.equal(stats.availableRewards);
        });

        it("Debería respetar período de enfriamiento", async function () {
            await delegateRewards.connect(delegate1).claimRewards();

            await expect(
                delegateRewards.connect(delegate1).claimRewards()
            ).to.be.revertedWith("Cooldown period active");
        });

        it("Debería rechazar si no hay recompensas", async function () {
            await expect(
                delegateRewards.connect(delegate2).claimRewards()
            ).to.be.revertedWith("No rewards available");
        });
    });

    describe("Períodos de recompensa", function () {
        it("Debería crear nuevo período", async function () {
            const duration = 1000;
            const totalRewards = ethers.utils.parseEther("1.0");

            await delegateRewards.connect(admin).createRewardPeriod(
                duration,
                totalRewards
            );

            const period = await delegateRewards.getRewardPeriod(1);
            expect(period.startBlock).to.equal(await ethers.provider.getBlockNumber());
            expect(period.totalRewards).to.equal(totalRewards);
            expect(period.isFinalized).to.be.false;
        });

        it("Debería finalizar período", async function () {
            await delegateRewards.connect(admin).createRewardPeriod(
                100,
                ethers.utils.parseEther("1.0")
            );

            // Avanzar bloques
            for (let i = 0; i < 101; i++) {
                await ethers.provider.send("evm_mine", []);
            }

            await delegateRewards.connect(admin).finalizeRewardPeriod(1);

            const period = await delegateRewards.getRewardPeriod(1);
            expect(period.isFinalized).to.be.true;
        });

        it("Debería rechazar finalización temprana", async function () {
            await delegateRewards.connect(admin).createRewardPeriod(
                1000,
                ethers.utils.parseEther("1.0")
            );

            await expect(
                delegateRewards.connect(admin).finalizeRewardPeriod(1)
            ).to.be.revertedWith("Period not ended");
        });
    });

    describe("Administración", function () {
        it("Debería actualizar configuración", async function () {
            const newBaseReward = ethers.utils.parseEther("0.2");
            
            await delegateRewards.connect(admin).updateRewardConfig(
                newBaseReward,
                PROPOSAL_REWARD,
                STREAK_BONUS,
                REPUTATION_MULTIPLIER,
                MAX_MULTIPLIER,
                MIN_VOTES,
                STREAK_THRESHOLD,
                BONUS_DURATION,
                COOLDOWN_PERIOD
            );

            const config = await delegateRewards.rewardConfig();
            expect(config.baseReward).to.equal(newBaseReward);
        });

        it("Debería permitir pausar/despausar", async function () {
            await delegateRewards.connect(admin).pause();
            expect(await delegateRewards.paused()).to.be.true;

            await expect(
                delegateRewards.connect(admin).recordVoteParticipation(
                    delegate1.address,
                    1
                )
            ).to.be.revertedWith("Pausable: paused");

            await delegateRewards.connect(admin).unpause();
            expect(await delegateRewards.paused()).to.be.false;
        });

        it("Debería restringir funciones administrativas", async function () {
            await expect(
                delegateRewards.connect(other).updateRewardConfig(
                    BASE_REWARD,
                    PROPOSAL_REWARD,
                    STREAK_BONUS,
                    REPUTATION_MULTIPLIER,
                    MAX_MULTIPLIER,
                    MIN_VOTES,
                    STREAK_THRESHOLD,
                    BONUS_DURATION,
                    COOLDOWN_PERIOD
                )
            ).to.be.revertedWith("AccessControl:");

            await expect(
                delegateRewards.connect(other).pause()
            ).to.be.revertedWith("AccessControl:");
        });
    });

    describe("Consultas", function () {
        beforeEach(async function () {
            // Generar algunos datos
            await delegateRewards.connect(admin).recordProposalCreation(delegate1.address);
            for (let i = 0; i < 5; i++) {
                await delegateRewards.connect(admin).recordVoteParticipation(
                    delegate1.address,
                    i + 1
                );
            }
        });

        it("Debería obtener estadísticas del delegado", async function () {
            const stats = await delegateRewards.getDelegateStats(delegate1.address);
            expect(stats.totalVotes).to.equal(5);
            expect(stats.proposalsCreated).to.equal(1);
            expect(stats.availableRewards).to.be.gt(0);
        });

        it("Debería obtener historial de recompensas", async function () {
            const history = await delegateRewards.getRewardHistory(delegate1.address);
            expect(history.length).to.be.gt(0);
            expect(history[0].rewardType).to.equal("Proposal creation");
        });

        it("Debería calcular multiplicador actual", async function () {
            const multiplier = await delegateRewards.getCurrentMultiplier(delegate1.address);
            expect(multiplier).to.be.gte(100); // >= 1x
        });
    });
}); 