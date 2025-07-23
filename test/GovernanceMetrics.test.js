const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("GovernanceMetrics", function () {
    let governanceMetrics;
    let owner;
    let admin;
    let updater;
    let analyst;
    let voter1;
    let voter2;
    let delegate1;
    let other;

    const ADMIN_ROLE = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes("ADMIN_ROLE")
    );
    const METRICS_UPDATER_ROLE = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes("METRICS_UPDATER_ROLE")
    );
    const ANALYST_ROLE = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes("ANALYST_ROLE")
    );

    beforeEach(async function () {
        [owner, admin, updater, analyst, voter1, voter2, delegate1, other] = await ethers.getSigners();

        const GovernanceMetrics = await ethers.getContractFactory("GovernanceMetrics");
        governanceMetrics = await GovernanceMetrics.deploy();
        await governanceMetrics.deployed();

        // Configurar roles
        await governanceMetrics.grantRole(ADMIN_ROLE, admin.address);
        await governanceMetrics.grantRole(METRICS_UPDATER_ROLE, updater.address);
        await governanceMetrics.grantRole(ANALYST_ROLE, analyst.address);
    });

    describe("Métricas de propuestas", function () {
        it("Debería actualizar métricas de propuesta", async function () {
            const tx = await governanceMetrics.connect(updater).updateProposalMetrics(
                1, // proposalId
                ethers.utils.parseEther("100"), // votesFor
                ethers.utils.parseEther("50"), // votesAgainst
                ethers.utils.parseEther("10"), // votesAbstain
                ethers.utils.parseEther("200"), // quorum
                100000, // executionGas
                true, // executed
                true // successful
            );

            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === "ProposalMetricsUpdated");
            expect(event.args.proposalId).to.equal(1);
            expect(event.args.participation).to.equal(80); // (100+50+10)/200 * 100

            const metrics = await governanceMetrics.proposalMetrics(1);
            expect(metrics.votesFor).to.equal(ethers.utils.parseEther("100"));
            expect(metrics.executed).to.be.true;
            expect(metrics.successful).to.be.true;
        });

        it("Debería registrar voto", async function () {
            await governanceMetrics.connect(updater).recordVote(
                1, // proposalId
                voter1.address,
                ethers.utils.parseEther("10"), // votingPower
                false, // isDelegated
                "Support proposal"
            );

            const voterMetrics = await governanceMetrics.voterMetrics(voter1.address);
            expect(voterMetrics.totalVotes).to.equal(1);
            expect(voterMetrics.directVotes).to.equal(ethers.utils.parseEther("10"));

            const history = await governanceMetrics.getVoterHistory(voter1.address);
            expect(history.length).to.equal(1);
            expect(history[0]).to.equal(1);
        });

        it("Debería registrar voto delegado", async function () {
            await governanceMetrics.connect(updater).recordVote(
                1,
                voter1.address,
                ethers.utils.parseEther("20"),
                true, // isDelegated
                "Delegated vote"
            );

            const voterMetrics = await governanceMetrics.voterMetrics(voter1.address);
            expect(voterMetrics.delegatedVotes).to.equal(ethers.utils.parseEther("20"));
        });
    });

    describe("Métricas de delegados", function () {
        beforeEach(async function () {
            await governanceMetrics.connect(updater).updateDelegateMetrics(
                delegate1.address,
                ethers.utils.parseEther("1000"), // votingPower
                5, // delegatorCount
                100 // reputationScore
            );
        });

        it("Debería actualizar métricas de delegado", async function () {
            const metrics = await governanceMetrics.delegateMetrics(delegate1.address);
            expect(metrics.totalVotingPower).to.equal(ethers.utils.parseEther("1000"));
            expect(metrics.delegatorCount).to.equal(5);
            expect(metrics.reputationScore).to.equal(100);
        });

        it("Debería registrar voto de delegado", async function () {
            await governanceMetrics.connect(updater).recordDelegateVote(
                delegate1.address,
                1, // proposalId
                ethers.utils.parseEther("100"), // votingPower
                true, // support
                "Support as delegate"
            );

            const metrics = await governanceMetrics.delegateMetrics(delegate1.address);
            expect(metrics.proposalsVoted).to.equal(1);

            const history = await governanceMetrics.getDelegateHistory(delegate1.address);
            expect(history.length).to.equal(1);
            expect(history[0]).to.equal(1);

            const voteRecord = await governanceMetrics.getDelegateVoteHistory(
                delegate1.address,
                1
            );
            expect(voteRecord.votingPower).to.equal(ethers.utils.parseEther("100"));
            expect(voteRecord.support).to.be.true;
        });
    });

    describe("Métricas de época", function () {
        beforeEach(async function () {
            // Crear propuesta y votos
            await governanceMetrics.connect(updater).updateProposalMetrics(
                1,
                ethers.utils.parseEther("100"),
                ethers.utils.parseEther("50"),
                ethers.utils.parseEther("10"),
                ethers.utils.parseEther("200"),
                100000,
                true,
                true
            );

            // Avanzar tiempo
            await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60]); // 7 días
            await ethers.provider.send("evm_mine", []);
        });

        it("Debería actualizar métricas de época", async function () {
            const metrics = await governanceMetrics.getCurrentEpochMetrics();
            expect(metrics.totalProposals).to.equal(1);
            expect(metrics.successfulProposals).to.equal(1);
        });

        it("Debería registrar participación de delegado en época", async function () {
            const participation = await governanceMetrics.getEpochDelegateParticipation(1, delegate1.address);
            expect(participation).to.equal(0); // No ha participado aún

            await governanceMetrics.connect(updater).recordDelegateVote(
                delegate1.address,
                1,
                ethers.utils.parseEther("100"),
                true,
                "Epoch participation"
            );

            const newParticipation = await governanceMetrics.getEpochDelegateParticipation(1, delegate1.address);
            expect(newParticipation).to.be.gt(0);
        });
    });

    describe("Estadísticas diarias", function () {
        it("Debería actualizar estadísticas diarias", async function () {
            await governanceMetrics.connect(updater).updateDailyStats(
                5, // activeProposals
                10, // newVoters
                ethers.utils.parseEther("1000"), // totalVotingPower
                75, // participationRate
                3, // delegationChanges
                ethers.utils.parseEther("100") // rewardsDistributed
            );

            const today = Math.floor(Date.now() / 1000 / 86400);
            const stats = await governanceMetrics.dailyStats(today);
            
            expect(stats.activeProposals).to.equal(5);
            expect(stats.newVoters).to.equal(10);
            expect(stats.participationRate).to.equal(75);
        });
    });

    describe("Snapshots", function () {
        it("Debería crear snapshot de métricas", async function () {
            const tx = await governanceMetrics.connect(analyst).createMetricsSnapshot(
                ethers.utils.parseEther("10000"), // totalVotingPower
                100, // activeVoters
                20, // activeDelegates
                80, // averageParticipation
                ethers.utils.formatBytes32String("QmHash") // ipfsHash
            );

            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === "MetricsSnapshotCreated");
            expect(event.args.snapshotId).to.equal(1);

            const snapshot = await governanceMetrics.getLatestSnapshot();
            expect(snapshot.totalVotingPower).to.equal(ethers.utils.parseEther("10000"));
            expect(snapshot.activeVoters).to.equal(100);
            expect(snapshot.averageParticipation).to.equal(80);
        });
    });

    describe("Distribución de votos", function () {
        it("Debería obtener distribución de votos", async function () {
            const distribution = await governanceMetrics.getProposalVoteDistribution(1);
            expect(distribution.length).to.equal(100); // MAX_VOTE_DISTRIBUTION_POINTS
        });
    });

    describe("Administración", function () {
        it("Debería permitir pausar/despausar", async function () {
            await governanceMetrics.connect(admin).pause();
            expect(await governanceMetrics.paused()).to.be.true;

            await expect(
                governanceMetrics.connect(updater).updateProposalMetrics(
                    1,
                    ethers.utils.parseEther("100"),
                    ethers.utils.parseEther("50"),
                    ethers.utils.parseEther("10"),
                    ethers.utils.parseEther("200"),
                    100000,
                    true,
                    true
                )
            ).to.be.revertedWith("Pausable: paused");

            await governanceMetrics.connect(admin).unpause();
            expect(await governanceMetrics.paused()).to.be.false;
        });

        it("Debería restringir funciones administrativas", async function () {
            await expect(
                governanceMetrics.connect(other).updateProposalMetrics(
                    1,
                    ethers.utils.parseEther("100"),
                    ethers.utils.parseEther("50"),
                    ethers.utils.parseEther("10"),
                    ethers.utils.parseEther("200"),
                    100000,
                    true,
                    true
                )
            ).to.be.revertedWith("AccessControl:");

            await expect(
                governanceMetrics.connect(other).createMetricsSnapshot(
                    ethers.utils.parseEther("10000"),
                    100,
                    20,
                    80,
                    ethers.utils.formatBytes32String("QmHash")
                )
            ).to.be.revertedWith("AccessControl:");
        });
    });
}); 