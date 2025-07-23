const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EnhancedBridge", function () {
    let bridge;
    let mockL1Token;
    let mockL2Token;
    let mockL1Gateway;
    let mockL2Gateway;
    let owner;
    let operator;
    let relayer;
    let user;

    const BRIDGE_OPERATOR_ROLE = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes("BRIDGE_OPERATOR_ROLE")
    );
    const RELAYER_ROLE = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes("RELAYER_ROLE")
    );

    beforeEach(async function () {
        [owner, operator, relayer, user] = await ethers.getSigners();

        // Desplegar mocks
        const MockToken = await ethers.getContractFactory("MockERC20");
        mockL1Token = await MockToken.deploy("L1 Token", "L1T", 18);
        await mockL1Token.deployed();

        mockL2Token = await MockToken.deploy("L2 Token", "L2T", 18);
        await mockL2Token.deployed();

        const MockGateway = await ethers.getContractFactory("MockGateway");
        mockL1Gateway = await MockGateway.deploy();
        await mockL1Gateway.deployed();

        mockL2Gateway = await MockGateway.deploy();
        await mockL2Gateway.deployed();

        // Desplegar bridge
        const EnhancedBridge = await ethers.getContractFactory("EnhancedBridge");
        bridge = await EnhancedBridge.deploy(
            mockL1Token.address,
            mockL2Token.address,
            mockL1Gateway.address,
            mockL2Gateway.address
        );
        await bridge.deployed();

        // Configurar roles
        await bridge.grantRole(BRIDGE_OPERATOR_ROLE, operator.address);
        await bridge.grantRole(RELAYER_ROLE, relayer.address);
    });

    describe("Inicialización", function () {
        it("Debería configurar direcciones correctamente", async function () {
            expect(await bridge.l1Token()).to.equal(mockL1Token.address);
            expect(await bridge.l2Token()).to.equal(mockL2Token.address);
            expect(await bridge.l1Gateway()).to.equal(mockL1Gateway.address);
            expect(await bridge.l2Gateway()).to.equal(mockL2Gateway.address);
        });

        it("Debería configurar roles correctamente", async function () {
            expect(await bridge.hasRole(BRIDGE_OPERATOR_ROLE, operator.address)).to.be.true;
            expect(await bridge.hasRole(RELAYER_ROLE, relayer.address)).to.be.true;
        });

        it("Debería inicializar configuración de retryables", async function () {
            const config = await bridge.retryableConfigs(0); // TOKEN_DEPOSIT
            expect(config.baseSubmissionCost).to.equal(ethers.utils.parseEther("0.01"));
            expect(config.baseGasLimit).to.equal(100000);
            expect(config.gasLimitPerByte).to.equal(100);
            expect(config.maxRetryWindow).to.equal(7 * 24 * 60 * 60); // 7 days
            expect(config.submissionFeeMultiplier).to.equal(120);
        });
    });

    describe("Operaciones de bridge", function () {
        const amount = ethers.utils.parseEther("100");
        const data = ethers.utils.defaultAbiCoder.encode(["string"], ["test data"]);

        beforeEach(async function () {
            // Dar tokens al usuario
            await mockL1Token.mint(user.address, amount.mul(2));
            await mockL1Token.connect(user).approve(bridge.address, amount.mul(2));
        });

        it("Debería iniciar operación correctamente", async function () {
            const submissionCost = ethers.utils.parseEther("0.02");
            const tx = await bridge.connect(user).initiateOperation(
                user.address,
                amount,
                0, // TOKEN_DEPOSIT
                data,
                { value: submissionCost }
            );

            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === "OperationInitiated");
            expect(event.args.sender).to.equal(user.address);
            expect(event.args.operationType).to.equal(0);

            const operation = await bridge.getOperation(event.args.operationId);
            expect(operation.amount).to.equal(amount);
            expect(operation.status).to.equal(1); // PROCESSING
        });

        it("Debería rechazar operación sin costo suficiente", async function () {
            await expect(
                bridge.connect(user).initiateOperation(
                    user.address,
                    amount,
                    0,
                    data,
                    { value: ethers.utils.parseEther("0.001") }
                )
            ).to.be.revertedWith("Insufficient submission cost");
        });

        it("Debería actualizar estadísticas al iniciar operación", async function () {
            await bridge.connect(user).initiateOperation(
                user.address,
                amount,
                0,
                data,
                { value: ethers.utils.parseEther("0.02") }
            );

            const stats = await bridge.getStats();
            expect(stats.totalOperations).to.equal(1);
            expect(stats.totalVolume).to.equal(amount);
            expect(stats.uniqueUsers).to.equal(1);
        });
    });

    describe("Procesamiento de mensajes", function () {
        let operationId;

        beforeEach(async function () {
            const tx = await bridge.connect(user).initiateOperation(
                user.address,
                ethers.utils.parseEther("100"),
                0,
                "0x",
                { value: ethers.utils.parseEther("0.02") }
            );
            const receipt = await tx.wait();
            operationId = receipt.events.find(e => e.event === "OperationInitiated").args.operationId;
        });

        it("Debería procesar mensaje de completado", async function () {
            const messageId = ethers.utils.keccak256("0x123");
            const data = ethers.utils.defaultAbiCoder.encode(
                ["bytes4", "bytes"],
                [
                    ethers.utils.id("completeOperation(uint256)").slice(0, 10),
                    ethers.utils.defaultAbiCoder.encode(["uint256"], [operationId])
                ]
            );

            await bridge.connect(relayer).processMessage(
                messageId,
                mockL1Gateway.address,
                data
            );

            const operation = await bridge.getOperation(operationId);
            expect(operation.status).to.equal(2); // COMPLETED
        });

        it("Debería procesar mensaje de fallo", async function () {
            const messageId = ethers.utils.keccak256("0x123");
            const data = ethers.utils.defaultAbiCoder.encode(
                ["bytes4", "bytes"],
                [
                    ethers.utils.id("failOperation(uint256,string)").slice(0, 10),
                    ethers.utils.defaultAbiCoder.encode(
                        ["uint256", "string"],
                        [operationId, "Test failure"]
                    )
                ]
            );

            await bridge.connect(relayer).processMessage(
                messageId,
                mockL1Gateway.address,
                data
            );

            const operation = await bridge.getOperation(operationId);
            expect(operation.status).to.equal(3); // FAILED
        });

        it("Debería rechazar mensaje duplicado", async function () {
            const messageId = ethers.utils.keccak256("0x123");
            const data = ethers.utils.defaultAbiCoder.encode(
                ["bytes4", "bytes"],
                [
                    ethers.utils.id("completeOperation(uint256)").slice(0, 10),
                    ethers.utils.defaultAbiCoder.encode(["uint256"], [operationId])
                ]
            );

            await bridge.connect(relayer).processMessage(messageId, mockL1Gateway.address, data);

            await expect(
                bridge.connect(relayer).processMessage(messageId, mockL1Gateway.address, data)
            ).to.be.revertedWith("Message already processed");
        });

        it("Debería rechazar mensaje de gateway no autorizado", async function () {
            const messageId = ethers.utils.keccak256("0x123");
            const data = ethers.utils.defaultAbiCoder.encode(
                ["bytes4", "bytes"],
                [
                    ethers.utils.id("completeOperation(uint256)").slice(0, 10),
                    ethers.utils.defaultAbiCoder.encode(["uint256"], [operationId])
                ]
            );

            await expect(
                bridge.connect(relayer).processMessage(messageId, user.address, data)
            ).to.be.revertedWith("Invalid message sender");
        });
    });

    describe("Configuración", function () {
        it("Debería actualizar configuración de retryables", async function () {
            await bridge.connect(operator).updateRetryableConfig(
                0, // TOKEN_DEPOSIT
                ethers.utils.parseEther("0.02"),
                150000,
                150,
                14 * 24 * 60 * 60, // 14 days
                150
            );

            const config = await bridge.retryableConfigs(0);
            expect(config.baseSubmissionCost).to.equal(ethers.utils.parseEther("0.02"));
            expect(config.baseGasLimit).to.equal(150000);
            expect(config.gasLimitPerByte).to.equal(150);
            expect(config.maxRetryWindow).to.equal(14 * 24 * 60 * 60);
            expect(config.submissionFeeMultiplier).to.equal(150);
        });

        it("Debería rechazar multiplicador demasiado alto", async function () {
            await expect(
                bridge.connect(operator).updateRetryableConfig(
                    0,
                    ethers.utils.parseEther("0.02"),
                    150000,
                    150,
                    14 * 24 * 60 * 60,
                    201 // > 200%
                )
            ).to.be.revertedWith("Multiplier too high");
        });

        it("Debería rechazar ventana de reintento demasiado larga", async function () {
            await expect(
                bridge.connect(operator).updateRetryableConfig(
                    0,
                    ethers.utils.parseEther("0.02"),
                    150000,
                    150,
                    31 * 24 * 60 * 60, // 31 days
                    150
                )
            ).to.be.revertedWith("Retry window too long");
        });
    });

    describe("Control de acceso", function () {
        it("Debería permitir operaciones cuando no está pausado", async function () {
            await expect(
                bridge.connect(user).initiateOperation(
                    user.address,
                    ethers.utils.parseEther("100"),
                    0,
                    "0x",
                    { value: ethers.utils.parseEther("0.02") }
                )
            ).to.not.be.reverted;
        });

        it("Debería rechazar operaciones cuando está pausado", async function () {
            await bridge.connect(operator).pause();

            await expect(
                bridge.connect(user).initiateOperation(
                    user.address,
                    ethers.utils.parseEther("100"),
                    0,
                    "0x",
                    { value: ethers.utils.parseEther("0.02") }
                )
            ).to.be.revertedWith("Pausable: paused");
        });

        it("Debería rechazar actualización de configuración sin rol", async function () {
            await expect(
                bridge.connect(user).updateRetryableConfig(
                    0,
                    ethers.utils.parseEther("0.02"),
                    150000,
                    150,
                    14 * 24 * 60 * 60,
                    150
                )
            ).to.be.revertedWith("AccessControl");
        });

        it("Debería rechazar procesamiento de mensaje sin rol", async function () {
            const messageId = ethers.utils.keccak256("0x123");
            const data = "0x";

            await expect(
                bridge.connect(user).processMessage(messageId, mockL1Gateway.address, data)
            ).to.be.revertedWith("AccessControl");
        });
    });

    describe("Consultas", function () {
        beforeEach(async function () {
            // Crear algunas operaciones
            await bridge.connect(user).initiateOperation(
                user.address,
                ethers.utils.parseEther("100"),
                0,
                "0x",
                { value: ethers.utils.parseEther("0.02") }
            );

            await bridge.connect(user).initiateOperation(
                user.address,
                ethers.utils.parseEther("200"),
                1,
                "0x",
                { value: ethers.utils.parseEther("0.02") }
            );
        });

        it("Debería obtener operaciones de usuario", async function () {
            const operations = await bridge.getUserOperations(user.address);
            expect(operations.length).to.equal(2);
        });

        it("Debería obtener estadísticas actualizadas", async function () {
            const stats = await bridge.getStats();
            expect(stats.totalOperations).to.equal(2);
            expect(stats.totalVolume).to.equal(ethers.utils.parseEther("300"));
            expect(stats.uniqueUsers).to.equal(1);
        });

        it("Debería obtener detalles de operación", async function () {
            const operation = await bridge.getOperation(1);
            expect(operation.sender).to.equal(user.address);
            expect(operation.amount).to.equal(ethers.utils.parseEther("100"));
            expect(operation.operationType).to.equal(0);
        });
    });
}); 