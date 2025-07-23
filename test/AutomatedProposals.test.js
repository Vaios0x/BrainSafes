const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AutomatedProposals", function () {
    let automatedProposals;
    let mockTarget;
    let owner;
    let admin;
    let automation;
    let templateManager;
    let other;

    const ADMIN_ROLE = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes("ADMIN_ROLE")
    );
    const AUTOMATION_ROLE = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes("AUTOMATION_ROLE")
    );
    const TEMPLATE_MANAGER_ROLE = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes("TEMPLATE_MANAGER_ROLE")
    );

    beforeEach(async function () {
        [owner, admin, automation, templateManager, other] = await ethers.getSigners();

        // Desplegar contrato mock para pruebas
        const MockTarget = await ethers.getContractFactory("MockTarget");
        mockTarget = await MockTarget.deploy();
        await mockTarget.deployed();

        const AutomatedProposals = await ethers.getContractFactory("AutomatedProposals");
        automatedProposals = await AutomatedProposals.deploy();
        await automatedProposals.deployed();

        // Configurar roles
        await automatedProposals.grantRole(ADMIN_ROLE, admin.address);
        await automatedProposals.grantRole(AUTOMATION_ROLE, automation.address);
        await automatedProposals.grantRole(TEMPLATE_MANAGER_ROLE, templateManager.address);
    });

    describe("Gestión de plantillas", function () {
        it("Debería crear nueva plantilla", async function () {
            const tx = await automatedProposals.connect(templateManager).createTemplate(
                "Test Template",
                "Test Description",
                mockTarget.address,
                mockTarget.interface.getSighash("setValue"),
                [0], // UINT256
                ["value"]
            );

            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === "TemplateCreated");
            expect(event.args.name).to.equal("Test Template");
            expect(event.args.target).to.equal(mockTarget.address);

            const template = await automatedProposals.getTemplate(1);
            expect(template.name).to.equal("Test Template");
            expect(template.isActive).to.be.true;
        });

        it("Debería rechazar plantilla con parámetros inválidos", async function () {
            await expect(
                automatedProposals.connect(templateManager).createTemplate(
                    "Test Template",
                    "Test Description",
                    ethers.constants.AddressZero,
                    mockTarget.interface.getSighash("setValue"),
                    [0],
                    ["value"]
                )
            ).to.be.revertedWith("Invalid target");
        });

        it("Debería rechazar plantilla con parámetros desalineados", async function () {
            await expect(
                automatedProposals.connect(templateManager).createTemplate(
                    "Test Template",
                    "Test Description",
                    mockTarget.address,
                    mockTarget.interface.getSighash("setValue"),
                    [0, 1], // Dos tipos
                    ["value"], // Un nombre
                )
            ).to.be.revertedWith("Parameter mismatch");
        });
    });

    describe("Gestión de reglas", function () {
        let templateId;

        beforeEach(async function () {
            const tx = await automatedProposals.connect(templateManager).createTemplate(
                "Test Template",
                "Test Description",
                mockTarget.address,
                mockTarget.interface.getSighash("setValue"),
                [0],
                ["value"]
            );
            const receipt = await tx.wait();
            templateId = 1;
        });

        it("Debería crear nueva regla", async function () {
            const tx = await automatedProposals.connect(admin).createRule(
                "Test Rule",
                "Test Description",
                0, // TVL
                ethers.utils.parseEther("1000000"), // 1M threshold
                0, // GREATER_THAN
                3600, // 1 hora cooldown
                templateId,
                ethers.utils.defaultAbiCoder.encode(["uint256"], [123])
            );

            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === "RuleCreated");
            expect(event.args.name).to.equal("Test Rule");
            expect(event.args.threshold).to.equal(ethers.utils.parseEther("1000000"));

            const rule = await automatedProposals.getRule(1);
            expect(rule.name).to.equal("Test Rule");
            expect(rule.isActive).to.be.true;
        });

        it("Debería rechazar regla con cooldown inválido", async function () {
            await expect(
                automatedProposals.connect(admin).createRule(
                    "Test Rule",
                    "Test Description",
                    0,
                    ethers.utils.parseEther("1000000"),
                    0,
                    1800, // 30 minutos
                    templateId,
                    ethers.utils.defaultAbiCoder.encode(["uint256"], [123])
                )
            ).to.be.revertedWith("Cooldown too short");
        });

        it("Debería actualizar regla existente", async function () {
            await automatedProposals.connect(admin).createRule(
                "Test Rule",
                "Test Description",
                0,
                ethers.utils.parseEther("1000000"),
                0,
                3600,
                templateId,
                ethers.utils.defaultAbiCoder.encode(["uint256"], [123])
            );

            await automatedProposals.connect(admin).updateRule(
                1,
                ethers.utils.parseEther("2000000"),
                7200,
                true
            );

            const rule = await automatedProposals.getRule(1);
            expect(rule.threshold).to.equal(ethers.utils.parseEther("2000000"));
            expect(rule.cooldownPeriod).to.equal(7200);
        });
    });

    describe("Gestión de métricas", function () {
        let ruleId;

        beforeEach(async function () {
            // Crear plantilla
            await automatedProposals.connect(templateManager).createTemplate(
                "Test Template",
                "Test Description",
                mockTarget.address,
                mockTarget.interface.getSighash("setValue"),
                [0],
                ["value"]
            );

            // Crear regla
            const tx = await automatedProposals.connect(admin).createRule(
                "Test Rule",
                "Test Description",
                0, // TVL
                ethers.utils.parseEther("1000000"),
                0, // GREATER_THAN
                3600,
                1,
                ethers.utils.defaultAbiCoder.encode(["uint256"], [123])
            );
            const receipt = await tx.wait();
            ruleId = 1;
        });

        it("Debería actualizar métrica y disparar regla", async function () {
            const tx = await automatedProposals.connect(automation).updateMetric(
                0, // TVL
                ethers.utils.parseEther("2000000"), // > threshold
                "Test Source"
            );

            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === "ProposalTriggered");
            expect(event.args.ruleId).to.equal(ruleId);
            expect(event.args.metricValue).to.equal(ethers.utils.parseEther("2000000"));

            const metric = await automatedProposals.getMetric(0);
            expect(metric.value).to.equal(ethers.utils.parseEther("2000000"));
            expect(metric.isValid).to.be.true;
        });

        it("Debería respetar período de enfriamiento", async function () {
            // Primera actualización
            await automatedProposals.connect(automation).updateMetric(
                0,
                ethers.utils.parseEther("2000000"),
                "Test Source"
            );

            // Segunda actualización inmediata
            await automatedProposals.connect(automation).updateMetric(
                0,
                ethers.utils.parseEther("3000000"),
                "Test Source"
            );

            const rule = await automatedProposals.getRule(ruleId);
            expect(rule.lastTriggered).to.be.gt(0);
        });

        it("Debería evaluar diferentes tipos de comparación", async function () {
            // GREATER_THAN
            await automatedProposals.connect(admin).createRule(
                "Greater Than",
                "Test",
                0,
                1000,
                0,
                3600,
                1,
                "0x"
            );

            // LESS_THAN
            await automatedProposals.connect(admin).createRule(
                "Less Than",
                "Test",
                0,
                3000,
                1,
                3600,
                1,
                "0x"
            );

            // Actualizar métrica
            await automatedProposals.connect(automation).updateMetric(
                0,
                2000,
                "Test Source"
            );

            // Verificar propuestas disparadas
            const proposal1 = await automatedProposals.getProposal(1);
            const proposal2 = await automatedProposals.getProposal(2);

            expect(proposal1.ruleId).to.equal(1); // GREATER_THAN disparada
            expect(proposal2.ruleId).to.equal(2); // LESS_THAN disparada
        });
    });

    describe("Ejecución de propuestas", function () {
        let proposalId;

        beforeEach(async function () {
            // Crear plantilla
            await automatedProposals.connect(templateManager).createTemplate(
                "Test Template",
                "Test Description",
                mockTarget.address,
                mockTarget.interface.getSighash("setValue"),
                [0],
                ["value"]
            );

            // Crear regla
            await automatedProposals.connect(admin).createRule(
                "Test Rule",
                "Test Description",
                0,
                ethers.utils.parseEther("1000000"),
                0,
                3600,
                1,
                ethers.utils.defaultAbiCoder.encode(["uint256"], [123])
            );

            // Disparar regla
            await automatedProposals.connect(automation).updateMetric(
                0,
                ethers.utils.parseEther("2000000"),
                "Test Source"
            );

            proposalId = 1;
        });

        it("Debería ejecutar propuesta aprobada", async function () {
            // Aprobar propuesta
            await automatedProposals.connect(admin).approveProposal(proposalId);

            // Ejecutar propuesta
            await automatedProposals.connect(automation).executeProposal(proposalId);

            const proposal = await automatedProposals.getProposal(proposalId);
            expect(proposal.executed).to.be.true;

            const result = await automatedProposals.getExecutionResult(proposalId);
            expect(result.success).to.be.true;
            expect(result.gasUsed).to.be.gt(0);

            // Verificar que el valor se actualizó en el contrato mock
            expect(await mockTarget.getValue()).to.equal(123);
        });

        it("Debería rechazar ejecución sin aprobación", async function () {
            await expect(
                automatedProposals.connect(automation).executeProposal(proposalId)
            ).to.be.revertedWith("Not approved");
        });

        it("Debería rechazar ejecución duplicada", async function () {
            await automatedProposals.connect(admin).approveProposal(proposalId);
            await automatedProposals.connect(automation).executeProposal(proposalId);

            await expect(
                automatedProposals.connect(automation).executeProposal(proposalId)
            ).to.be.revertedWith("Already executed");
        });

        it("Debería manejar errores de ejecución", async function () {
            // Crear plantilla con función inválida
            await automatedProposals.connect(templateManager).createTemplate(
                "Invalid Template",
                "Test",
                mockTarget.address,
                ethers.utils.id("invalidFunction()").slice(0, 10),
                [],
                []
            );

            // Crear regla con plantilla inválida
            await automatedProposals.connect(admin).createRule(
                "Invalid Rule",
                "Test",
                0,
                1000,
                0,
                3600,
                2,
                "0x"
            );

            // Disparar regla
            await automatedProposals.connect(automation).updateMetric(
                0,
                2000,
                "Test Source"
            );

            // Aprobar y ejecutar
            await automatedProposals.connect(admin).approveProposal(2);
            await automatedProposals.connect(automation).executeProposal(2);

            const result = await automatedProposals.getExecutionResult(2);
            expect(result.success).to.be.false;
            expect(result.error).to.not.equal("");
        });
    });

    describe("Administración", function () {
        it("Debería permitir pausar/despausar", async function () {
            await automatedProposals.connect(admin).pause();
            expect(await automatedProposals.paused()).to.be.true;

            await expect(
                automatedProposals.connect(automation).updateMetric(
                    0,
                    1000,
                    "Test Source"
                )
            ).to.be.revertedWith("Pausable: paused");

            await automatedProposals.connect(admin).unpause();
            expect(await automatedProposals.paused()).to.be.false;
        });

        it("Debería restringir funciones administrativas", async function () {
            await expect(
                automatedProposals.connect(other).createRule(
                    "Test Rule",
                    "Test Description",
                    0,
                    1000,
                    0,
                    3600,
                    1,
                    "0x"
                )
            ).to.be.revertedWith("AccessControl:");

            await expect(
                automatedProposals.connect(other).approveProposal(1)
            ).to.be.revertedWith("AccessControl:");
        });
    });
}); 