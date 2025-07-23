const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DelegationManager", function () {
    let delegationManager;
    let owner;
    let admin;
    let delegate1;
    let delegate2;
    let delegator1;
    let delegator2;
    let other;

    const ADMIN_ROLE = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes("ADMIN_ROLE")
    );
    const GOVERNANCE_ROLE = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes("GOVERNANCE_ROLE")
    );

    const ProposalType = {
        GENERAL: 0,
        TECHNICAL: 1,
        FINANCIAL: 2,
        SECURITY: 3,
        COMMUNITY: 4,
        EMERGENCY: 5
    };

    beforeEach(async function () {
        [owner, admin, delegate1, delegate2, delegator1, delegator2, other] = await ethers.getSigners();

        const DelegationManager = await ethers.getContractFactory("DelegationManager");
        delegationManager = await DelegationManager.deploy();
        await delegationManager.deployed();

        // Configurar roles
        await delegationManager.grantRole(ADMIN_ROLE, admin.address);
        await delegationManager.grantRole(GOVERNANCE_ROLE, admin.address);

        // Registrar delegados
        await delegationManager.connect(delegate1).registerDelegate(
            "Delegate 1",
            "Technical expert",
            [ProposalType.TECHNICAL, ProposalType.SECURITY]
        );

        await delegationManager.connect(delegate2).registerDelegate(
            "Delegate 2",
            "Financial expert",
            [ProposalType.FINANCIAL, ProposalType.GENERAL]
        );
    });

    describe("Registro de delegados", function () {
        it("Debería registrar un nuevo delegado", async function () {
            const tx = await delegationManager.connect(other).registerDelegate(
                "New Delegate",
                "Community expert",
                [ProposalType.COMMUNITY]
            );

            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === "DelegateRegistered");
            expect(event.args.delegate).to.equal(other.address);
            expect(event.args.name).to.equal("New Delegate");

            const delegateInfo = await delegationManager.getDelegateInfo(other.address);
            expect(delegateInfo.name).to.equal("New Delegate");
            expect(delegateInfo.isActive).to.be.true;
        });

        it("Debería rechazar registro duplicado", async function () {
            await expect(
                delegationManager.connect(delegate1).registerDelegate(
                    "Duplicate",
                    "Description",
                    [ProposalType.GENERAL]
                )
            ).to.be.revertedWith("Already registered");
        });

        it("Debería rechazar nombre vacío", async function () {
            await expect(
                delegationManager.connect(other).registerDelegate(
                    "",
                    "Description",
                    [ProposalType.GENERAL]
                )
            ).to.be.revertedWith("Name required");
        });
    });

    describe("Delegación", function () {
        it("Debería crear una nueva delegación", async function () {
            const weight = 5000; // 50%
            const duration = 30 * 24 * 60 * 60; // 30 días

            const tx = await delegationManager.connect(delegator1).delegate(
                delegate1.address,
                weight,
                duration,
                [ProposalType.TECHNICAL]
            );

            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === "DelegationCreated");
            expect(event.args.delegator).to.equal(delegator1.address);
            expect(event.args.delegate).to.equal(delegate1.address);
            expect(event.args.weight).to.equal(weight);

            const delegation = await delegationManager.getDelegation(
                delegator1.address,
                delegate1.address
            );
            expect(delegation.weight).to.equal(weight);
            expect(delegation.isActive).to.be.true;
        });

        it("Debería permitir múltiples delegaciones", async function () {
            await delegationManager.connect(delegator1).delegate(
                delegate1.address,
                3000, // 30%
                30 * 24 * 60 * 60,
                [ProposalType.TECHNICAL]
            );

            await delegationManager.connect(delegator1).delegate(
                delegate2.address,
                4000, // 40%
                30 * 24 * 60 * 60,
                [ProposalType.FINANCIAL]
            );

            const delegation1 = await delegationManager.getDelegation(
                delegator1.address,
                delegate1.address
            );
            const delegation2 = await delegationManager.getDelegation(
                delegator1.address,
                delegate2.address
            );

            expect(delegation1.isActive).to.be.true;
            expect(delegation2.isActive).to.be.true;
            expect(delegation1.weight).to.equal(3000);
            expect(delegation2.weight).to.equal(4000);
        });

        it("Debería rechazar peso total excesivo", async function () {
            await delegationManager.connect(delegator1).delegate(
                delegate1.address,
                6000, // 60%
                30 * 24 * 60 * 60,
                [ProposalType.TECHNICAL]
            );

            await expect(
                delegationManager.connect(delegator1).delegate(
                    delegate2.address,
                    5000, // 50%
                    30 * 24 * 60 * 60,
                    [ProposalType.FINANCIAL]
                )
            ).to.be.revertedWith("Exceeds max weight");
        });

        it("Debería rechazar auto-delegación", async function () {
            await expect(
                delegationManager.connect(delegate1).delegate(
                    delegate1.address,
                    5000,
                    30 * 24 * 60 * 60,
                    [ProposalType.TECHNICAL]
                )
            ).to.be.revertedWith("Cannot self delegate");
        });
    });

    describe("Modificación de delegación", function () {
        beforeEach(async function () {
            await delegationManager.connect(delegator1).delegate(
                delegate1.address,
                5000,
                30 * 24 * 60 * 60,
                [ProposalType.TECHNICAL]
            );
        });

        it("Debería modificar delegación existente", async function () {
            const tx = await delegationManager.connect(delegator1).modifyDelegation(
                delegate1.address,
                delegate2.address,
                4000,
                30 * 24 * 60 * 60,
                [ProposalType.FINANCIAL]
            );

            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === "DelegationModified");
            expect(event.args.oldDelegate).to.equal(delegate1.address);
            expect(event.args.newDelegate).to.equal(delegate2.address);

            const oldDelegation = await delegationManager.getDelegation(
                delegator1.address,
                delegate1.address
            );
            const newDelegation = await delegationManager.getDelegation(
                delegator1.address,
                delegate2.address
            );

            expect(oldDelegation.isActive).to.be.false;
            expect(newDelegation.isActive).to.be.true;
            expect(newDelegation.weight).to.equal(4000);
        });

        it("Debería rechazar modificación sin delegación activa", async function () {
            await expect(
                delegationManager.connect(delegator2).modifyDelegation(
                    delegate1.address,
                    delegate2.address,
                    4000,
                    30 * 24 * 60 * 60,
                    [ProposalType.FINANCIAL]
                )
            ).to.be.revertedWith("No active delegation");
        });
    });

    describe("Revocación de delegación", function () {
        beforeEach(async function () {
            await delegationManager.connect(delegator1).delegate(
                delegate1.address,
                5000,
                30 * 24 * 60 * 60,
                [ProposalType.TECHNICAL]
            );
        });

        it("Debería revocar delegación", async function () {
            const tx = await delegationManager.connect(delegator1).revokeDelegation(
                delegate1.address,
                "Lost confidence"
            );

            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === "DelegationRevoked");
            expect(event.args.delegator).to.equal(delegator1.address);
            expect(event.args.delegate).to.equal(delegate1.address);
            expect(event.args.reason).to.equal("Lost confidence");

            const delegation = await delegationManager.getDelegation(
                delegator1.address,
                delegate1.address
            );
            expect(delegation.isActive).to.be.false;
        });

        it("Debería actualizar historial de delegación", async function () {
            await delegationManager.connect(delegator1).revokeDelegation(
                delegate1.address,
                "Lost confidence"
            );

            const history = await delegationManager.getDelegationHistory(delegator1.address);
            expect(history.length).to.equal(2); // Creación + revocación
            expect(history[1].reason).to.equal("Lost confidence");
        });
    });

    describe("Reputación y poder de voto", function () {
        beforeEach(async function () {
            await delegationManager.connect(delegator1).delegate(
                delegate1.address,
                5000,
                30 * 24 * 60 * 60,
                [ProposalType.TECHNICAL]
            );
        });

        it("Debería actualizar reputación", async function () {
            const tx = await delegationManager.connect(admin).updateDelegateReputation(
                delegate1.address,
                50,
                true,
                "Good performance"
            );

            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === "DelegateReputationUpdated");
            expect(event.args.newReputation).to.be.gt(event.args.oldReputation);

            const delegateInfo = await delegationManager.getDelegateInfo(delegate1.address);
            expect(delegateInfo.reputation).to.equal(150); // 100 base + 50
        });

        it("Debería actualizar poder de voto", async function () {
            await delegationManager.connect(admin).updateDelegateReputation(
                delegate1.address,
                50,
                true,
                "Good performance"
            );

            const delegateInfo = await delegationManager.getDelegateInfo(delegate1.address);
            expect(delegateInfo.votingWeight).to.be.gt(5000); // Base weight + reputation
        });
    });

    describe("Consultas", function () {
        beforeEach(async function () {
            await delegationManager.connect(delegator1).delegate(
                delegate1.address,
                3000,
                30 * 24 * 60 * 60,
                [ProposalType.TECHNICAL]
            );

            await delegationManager.connect(delegator2).delegate(
                delegate1.address,
                4000,
                30 * 24 * 60 * 60,
                [ProposalType.SECURITY]
            );
        });

        it("Debería obtener delegadores activos", async function () {
            const delegators = await delegationManager.getActiveDelegators(delegate1.address);
            expect(delegators.length).to.equal(2);
            expect(delegators).to.include(delegator1.address);
            expect(delegators).to.include(delegator2.address);
        });

        it("Debería obtener métricas del delegado", async function () {
            const metrics = await delegationManager.getDelegateMetrics(delegate1.address);
            expect(metrics.delegatorCount).to.equal(2);
            expect(metrics.totalVotingPower).to.be.gt(0);
        });

        it("Debería obtener estadísticas globales", async function () {
            const totalDelegates = await delegationManager.getTotalDelegates();
            const activeDelegations = await delegationManager.getActiveDelegations();

            expect(totalDelegates).to.equal(2); // delegate1 y delegate2
            expect(activeDelegations).to.equal(2); // dos delegaciones activas
        });
    });

    describe("Administración", function () {
        it("Debería permitir pausar/despausar", async function () {
            await delegationManager.connect(admin).pause();
            expect(await delegationManager.paused()).to.be.true;

            await expect(
                delegationManager.connect(delegator1).delegate(
                    delegate1.address,
                    5000,
                    30 * 24 * 60 * 60,
                    [ProposalType.TECHNICAL]
                )
            ).to.be.revertedWith("Pausable: paused");

            await delegationManager.connect(admin).unpause();
            expect(await delegationManager.paused()).to.be.false;
        });

        it("Debería restringir funciones administrativas", async function () {
            await expect(
                delegationManager.connect(other).updateDelegateReputation(
                    delegate1.address,
                    50,
                    true,
                    "Unauthorized"
                )
            ).to.be.revertedWith("AccessControl:");

            await expect(
                delegationManager.connect(other).pause()
            ).to.be.revertedWith("AccessControl:");
        });
    });
}); 