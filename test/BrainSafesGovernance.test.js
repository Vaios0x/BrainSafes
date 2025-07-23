const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BrainSafesGovernance", function () {
    let governance;
    let mockToken;
    let owner;
    let admin;
    let councilMember;
    let delegate;
    let user;

    const ADMIN_ROLE = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes("ADMIN_ROLE")
    );
    const SECURITY_COUNCIL_ROLE = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes("SECURITY_COUNCIL_ROLE")
    );
    const DELEGATE_ROLE = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes("DELEGATE_ROLE")
    );

    beforeEach(async function () {
        [owner, admin, councilMember, delegate, user] = await ethers.getSigners();

        // Desplegar token mock para votación
        const MockToken = await ethers.getContractFactory("MockERC20");
        mockToken = await MockToken.deploy("Governance Token", "GOV", 18);
        await mockToken.deployed();

        // Desplegar gobernanza
        const BrainSafesGovernance = await ethers.getContractFactory("BrainSafesGovernance");
        governance = await BrainSafesGovernance.deploy();
        await governance.deployed();

        // Configurar roles
        await governance.grantRole(ADMIN_ROLE, admin.address);
        await governance.connect(admin).addSecurityCouncilMember(councilMember.address);

        // Dar tokens para votación
        await mockToken.mint(owner.address, ethers.utils.parseEther("1000000"));
        await mockToken.mint(delegate.address, ethers.utils.parseEther("500000"));
        await mockToken.mint(user.address, ethers.utils.parseEther("100000"));
    });

    describe("Inicialización", function () {
        it("Debería configurar roles correctamente", async function () {
            expect(await governance.hasRole(ADMIN_ROLE, admin.address)).to.be.true;
            expect(await governance.hasRole(SECURITY_COUNCIL_ROLE, councilMember.address)).to.be.true;
        });

        it("Debería tener las constantes correctas", async function () {
            expect(await governance.VOTING_DELAY()).to.equal(24 * 60 * 60); // 1 day
            expect(await governance.VOTING_PERIOD()).to.equal(7 * 24 * 60 * 60); // 7 days
            expect(await governance.MINIMUM_QUORUM()).to.equal(ethers.utils.parseEther("4000000"));
            expect(await governance.PROPOSAL_THRESHOLD()).to.equal(ethers.utils.parseEther("100000"));
        });
    });

    describe("Registro de delegados", function () {
        it("Debería registrar un delegado correctamente", async function () {
            await governance.connect(delegate).registerAsDelegate(
                "Test Delegate",
                "Test Description",
                "ipfs://test"
            );

            const delegateInfo = await governance.getDelegate(delegate.address);
            expect(delegateInfo.name).to.equal("Test Delegate");
            expect(delegateInfo.isActive).to.be.true;
            expect(await governance.hasRole(DELEGATE_ROLE, delegate.address)).to.be.true;
        });

        it("Debería rechazar registro duplicado", async function () {
            await governance.connect(delegate).registerAsDelegate(
                "Test Delegate",
                "Test Description",
                "ipfs://test"
            );

            await expect(
                governance.connect(delegate).registerAsDelegate(
                    "Test Delegate",
                    "Test Description",
                    "ipfs://test"
                )
            ).to.be.revertedWith("Already registered");
        });
    });

    describe("Propuestas", function () {
        beforeEach(async function () {
            // Dar poder de voto suficiente
            await governance.connect(owner).delegate(delegate.address, ethers.utils.parseEther("100000"));
        });

        it("Debería crear una propuesta normal", async function () {
            const tx = await governance.connect(delegate).createProposal(
                "Test Proposal",
                "Test Description",
                "0x",
                governance.address,
                false
            );

            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === "ProposalCreated");
            expect(event.args.title).to.equal("Test Proposal");
            expect(event.args.emergency).to.be.false;

            const proposal = await governance.getProposal(1);
            expect(proposal.proposer).to.equal(delegate.address);
            expect(proposal.status).to.equal(0); // PENDING
        });

        it("Debería crear una propuesta de emergencia", async function () {
            const tx = await governance.connect(councilMember).createProposal(
                "Emergency Proposal",
                "Emergency Description",
                "0x",
                governance.address,
                true
            );

            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === "ProposalCreated");
            expect(event.args.emergency).to.be.true;

            const proposal = await governance.getProposal(1);
            expect(proposal.emergency).to.be.true;
        });

        it("Debería rechazar propuesta sin poder suficiente", async function () {
            await expect(
                governance.connect(user).createProposal(
                    "Test Proposal",
                    "Test Description",
                    "0x",
                    governance.address,
                    false
                )
            ).to.be.revertedWith("Insufficient voting power");
        });
    });

    describe("Votación", function () {
        let proposalId;

        beforeEach(async function () {
            // Crear propuesta
            await governance.connect(delegate).registerAsDelegate(
                "Test Delegate",
                "Test Description",
                "ipfs://test"
            );
            await governance.connect(owner).delegate(delegate.address, ethers.utils.parseEther("100000"));
            
            const tx = await governance.connect(delegate).createProposal(
                "Test Proposal",
                "Test Description",
                "0x",
                governance.address,
                false
            );
            const receipt = await tx.wait();
            proposalId = receipt.events.find(e => e.event === "ProposalCreated").args.proposalId;

            // Avanzar tiempo para activar votación
            await ethers.provider.send("evm_increaseTime", [24 * 60 * 60 + 1]);
            await ethers.provider.send("evm_mine");
        });

        it("Debería permitir votar", async function () {
            await governance.connect(delegate).castVote(
                proposalId,
                1, // FOR
                "Support reason"
            );

            const proposal = await governance.getProposal(proposalId);
            expect(proposal.forVotes).to.be.gt(0);
        });

        it("Debería rechazar voto duplicado", async function () {
            await governance.connect(delegate).castVote(
                proposalId,
                1,
                "Support reason"
            );

            await expect(
                governance.connect(delegate).castVote(
                    proposalId,
                    1,
                    "Support reason"
                )
            ).to.be.revertedWith("Already voted");
        });

        it("Debería actualizar estadísticas del delegado", async function () {
            await governance.connect(delegate).castVote(
                proposalId,
                1,
                "Support reason"
            );

            const delegateInfo = await governance.getDelegate(delegate.address);
            expect(delegateInfo.proposalsParticipated).to.equal(1);
        });
    });

    describe("Consejo de seguridad", function () {
        it("Debería añadir miembro correctamente", async function () {
            await governance.connect(admin).addSecurityCouncilMember(user.address);
            
            expect(await governance.hasRole(SECURITY_COUNCIL_ROLE, user.address)).to.be.true;
            const members = await governance.getSecurityCouncilMembers();
            expect(members).to.include(user.address);
        });

        it("Debería remover miembro correctamente", async function () {
            await governance.connect(admin).removeSecurityCouncilMember(councilMember.address);
            
            expect(await governance.hasRole(SECURITY_COUNCIL_ROLE, councilMember.address)).to.be.false;
            const members = await governance.getSecurityCouncilMembers();
            expect(members).to.not.include(councilMember.address);
        });

        it("Debería activar modo emergencia", async function () {
            await governance.connect(councilMember).activateEmergencyMode("Test emergency");
            expect(await governance.emergencyMode()).to.be.true;
        });

        it("Debería desactivar modo emergencia", async function () {
            await governance.connect(councilMember).activateEmergencyMode("Test emergency");
            await governance.connect(councilMember).deactivateEmergencyMode();
            expect(await governance.emergencyMode()).to.be.false;
        });
    });

    describe("Ejecución de propuestas", function () {
        let proposalId;

        beforeEach(async function () {
            // Crear y votar propuesta
            await governance.connect(delegate).registerAsDelegate(
                "Test Delegate",
                "Test Description",
                "ipfs://test"
            );
            await governance.connect(owner).delegate(delegate.address, ethers.utils.parseEther("4000000"));
            
            const tx = await governance.connect(delegate).createProposal(
                "Test Proposal",
                "Test Description",
                "0x",
                governance.address,
                false
            );
            const receipt = await tx.wait();
            proposalId = receipt.events.find(e => e.event === "ProposalCreated").args.proposalId;

            // Avanzar tiempo y votar
            await ethers.provider.send("evm_increaseTime", [24 * 60 * 60 + 1]);
            await ethers.provider.send("evm_mine");
            
            await governance.connect(delegate).castVote(
                proposalId,
                1, // FOR
                "Support reason"
            );

            // Avanzar tiempo para finalizar votación
            await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60 + 1]);
            await ethers.provider.send("evm_mine");
        });

        it("Debería ejecutar propuesta exitosa", async function () {
            // Avanzar tiempo para delay de ejecución
            await ethers.provider.send("evm_increaseTime", [2 * 24 * 60 * 60 + 1]);
            await ethers.provider.send("evm_mine");

            await governance.executeProposal(proposalId);
            
            const proposal = await governance.getProposal(proposalId);
            expect(proposal.status).to.equal(6); // EXECUTED
        });

        it("Debería permitir cancelar propuesta", async function () {
            await governance.connect(delegate).cancelProposal(proposalId);
            
            const proposal = await governance.getProposal(proposalId);
            expect(proposal.status).to.equal(2); // CANCELED
        });
    });

    describe("Consultas", function () {
        beforeEach(async function () {
            // Crear algunas propuestas y votos
            await governance.connect(delegate).registerAsDelegate(
                "Test Delegate",
                "Test Description",
                "ipfs://test"
            );
            await governance.connect(owner).delegate(delegate.address, ethers.utils.parseEther("100000"));
            
            await governance.connect(delegate).createProposal(
                "Proposal 1",
                "Description 1",
                "0x",
                governance.address,
                false
            );

            await governance.connect(delegate).createProposal(
                "Proposal 2",
                "Description 2",
                "0x",
                governance.address,
                false
            );
        });

        it("Debería obtener propuestas de usuario", async function () {
            const proposals = await governance.getUserProposals(delegate.address);
            expect(proposals.length).to.equal(2);
        });

        it("Debería obtener votos de usuario", async function () {
            // Avanzar tiempo para votar
            await ethers.provider.send("evm_increaseTime", [24 * 60 * 60 + 1]);
            await ethers.provider.send("evm_mine");

            await governance.connect(delegate).castVote(1, 1, "Support 1");
            await governance.connect(delegate).castVote(2, 1, "Support 2");

            const votes = await governance.getUserVotes(delegate.address);
            expect(votes.length).to.equal(2);
        });
    });
}); 