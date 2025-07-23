const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BrainSafesBridge", function () {
    let bridge;
    let brainSafes;
    let eduToken;
    let certificateNFT;
    let owner;
    let user;
    let operator;

    beforeEach(async function () {
        [owner, user, operator] = await ethers.getSigners();

        // Desplegar contratos
        const BrainSafes = await ethers.getContractFactory("BrainSafes");
        brainSafes = await BrainSafes.deploy();
        await brainSafes.deployed();

        const EDUToken = await ethers.getContractFactory("EDUToken");
        eduToken = await EDUToken.deploy();
        await eduToken.deployed();

        const CertificateNFT = await ethers.getContractFactory("CertificateNFT");
        certificateNFT = await CertificateNFT.deploy();
        await certificateNFT.deployed();

        const BrainSafesBridge = await ethers.getContractFactory("BrainSafesBridge");
        bridge = await BrainSafesBridge.deploy(
            brainSafes.address,
            brainSafes.address, // Mismo contrato para pruebas
            eduToken.address,
            certificateNFT.address
        );
        await bridge.deployed();

        // Configurar roles
        const BRIDGE_OPERATOR = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("BRIDGE_OPERATOR"));
        await bridge.grantOperator(operator.address);

        // Dar permisos al bridge
        const MINTER_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("MINTER_ROLE"));
        await eduToken.grantRole(MINTER_ROLE, bridge.address);
        await certificateNFT.grantRole(MINTER_ROLE, bridge.address);

        // Dar tokens al usuario
        await eduToken.mint(user.address, ethers.utils.parseEther("1000"));
        await eduToken.connect(user).approve(bridge.address, ethers.utils.parseEther("1000"));
    });

    describe("Depósito de tokens", function () {
        it("Debería permitir depositar tokens", async function () {
            const amount = ethers.utils.parseEther("100");
            const tx = await bridge.connect(user).depositTokens(
                user.address,
                amount,
                "0x"
            );
            await tx.wait();

            const operation = await bridge.getOperation(1);
            expect(operation.sender).to.equal(user.address);
            expect(operation.amount).to.equal(amount);
            expect(operation.status).to.equal(1); // PROCESSING
        });

        it("Debería procesar depósito correctamente", async function () {
            const amount = ethers.utils.parseEther("100");
            await bridge.connect(user).depositTokens(user.address, amount, "0x");

            const messageId = ethers.utils.keccak256(
                ethers.utils.defaultAbiCoder.encode(
                    ["uint256", "address"],
                    [1, user.address]
                )
            );

            await bridge.connect(operator).processL1Message(
                messageId,
                brainSafes.address,
                ethers.utils.defaultAbiCoder.encode(
                    ["uint8", "uint256"],
                    [0, 1] // TOKEN_DEPOSIT, operationId
                )
            );

            const operation = await bridge.getOperation(1);
            expect(operation.status).to.equal(2); // COMPLETED
        });
    });

    describe("Retiro de tokens", function () {
        it("Debería iniciar retiro correctamente", async function () {
            const amount = ethers.utils.parseEther("100");
            const tx = await bridge.connect(user).initiateWithdrawal(
                user.address,
                amount
            );
            await tx.wait();

            const operation = await bridge.getOperation(1);
            expect(operation.sender).to.equal(user.address);
            expect(operation.amount).to.equal(amount);
            expect(operation.status).to.equal(1); // PROCESSING
        });

        it("Debería respetar el período de espera", async function () {
            const amount = ethers.utils.parseEther("100");
            await bridge.connect(user).initiateWithdrawal(user.address, amount);

            await expect(
                bridge.connect(user).initiateWithdrawal(user.address, amount)
            ).to.be.revertedWith("Withdrawal delay not met");
        });

        it("Debería procesar retiro correctamente", async function () {
            const amount = ethers.utils.parseEther("100");
            await bridge.connect(user).initiateWithdrawal(user.address, amount);

            const messageId = ethers.utils.keccak256(
                ethers.utils.defaultAbiCoder.encode(
                    ["uint256", "address"],
                    [1, user.address]
                )
            );

            await bridge.connect(operator).processL2Message(
                messageId,
                brainSafes.address,
                ethers.utils.defaultAbiCoder.encode(
                    ["uint8", "uint256"],
                    [1, 1] // TOKEN_WITHDRAWAL, operationId
                )
            );

            const operation = await bridge.getOperation(1);
            expect(operation.status).to.equal(2); // COMPLETED
        });
    });

    describe("Bridge de certificados", function () {
        beforeEach(async function () {
            // Mintear certificado para pruebas
            await certificateNFT.mint(user.address, 1);
            await certificateNFT.connect(user).approve(bridge.address, 1);
        });

        it("Debería permitir bridge de certificados", async function () {
            const tx = await bridge.connect(user).bridgeCertificate(
                1, // tokenId
                user.address,
                "0x" // metadata
            );
            await tx.wait();

            const operation = await bridge.getOperation(1);
            expect(operation.sender).to.equal(user.address);
            expect(operation.amount).to.equal(1); // tokenId
            expect(operation.status).to.equal(1); // PROCESSING
        });

        it("Debería procesar bridge de certificado correctamente", async function () {
            await bridge.connect(user).bridgeCertificate(1, user.address, "0x");

            const messageId = ethers.utils.keccak256(
                ethers.utils.defaultAbiCoder.encode(
                    ["uint256", "address"],
                    [1, user.address]
                )
            );

            await bridge.connect(operator).processL1Message(
                messageId,
                brainSafes.address,
                ethers.utils.defaultAbiCoder.encode(
                    ["uint8", "uint256"],
                    [2, 1] // CERTIFICATE_BRIDGE, operationId
                )
            );

            const operation = await bridge.getOperation(1);
            expect(operation.status).to.equal(2); // COMPLETED
        });
    });

    describe("Administración", function () {
        it("Debería permitir pausar el contrato", async function () {
            await bridge.pause();
            expect(await bridge.paused()).to.be.true;

            await expect(
                bridge.connect(user).depositTokens(user.address, 100, "0x")
            ).to.be.revertedWith("Pausable: paused");
        });

        it("Debería permitir actualizar contratos", async function () {
            const newL2Contract = ethers.Wallet.createRandom().address;
            await bridge.updateL2Contract(newL2Contract);
            expect(await bridge.l2BrainSafes()).to.equal(newL2Contract);
        });

        it("Debería manejar retiros de emergencia", async function () {
            const amount = ethers.utils.parseEther("100");
            await eduToken.mint(bridge.address, amount);

            await bridge.emergencyWithdraw(
                eduToken.address,
                owner.address,
                amount
            );

            expect(await eduToken.balanceOf(owner.address)).to.equal(amount);
        });
    });

    describe("Integración con Arbitrum", function () {
        it("Debería manejar mensajes L1-L2 correctamente", async function () {
            const amount = ethers.utils.parseEther("100");
            await bridge.connect(user).depositTokens(user.address, amount, "0x");

            const messageId = ethers.utils.keccak256(
                ethers.utils.defaultAbiCoder.encode(
                    ["uint256", "address"],
                    [1, user.address]
                )
            );

            // Verificar que el mensaje no ha sido procesado
            expect(await bridge.isMessageProcessed(messageId)).to.be.false;

            // Procesar mensaje
            await bridge.connect(operator).processL1Message(
                messageId,
                brainSafes.address,
                ethers.utils.defaultAbiCoder.encode(
                    ["uint8", "uint256"],
                    [0, 1] // TOKEN_DEPOSIT, operationId
                )
            );

            // Verificar que el mensaje ha sido procesado
            expect(await bridge.isMessageProcessed(messageId)).to.be.true;
        });

        it("Debería manejar mensajes L2-L1 correctamente", async function () {
            const amount = ethers.utils.parseEther("100");
            await bridge.connect(user).initiateWithdrawal(user.address, amount);

            const messageId = ethers.utils.keccak256(
                ethers.utils.defaultAbiCoder.encode(
                    ["uint256", "address"],
                    [1, user.address]
                )
            );

            // Verificar que el mensaje no ha sido procesado
            expect(await bridge.isMessageProcessed(messageId)).to.be.false;

            // Procesar mensaje
            await bridge.connect(operator).processL2Message(
                messageId,
                brainSafes.address,
                ethers.utils.defaultAbiCoder.encode(
                    ["uint8", "uint256"],
                    [1, 1] // TOKEN_WITHDRAWAL, operationId
                )
            );

            // Verificar que el mensaje ha sido procesado
            expect(await bridge.isMessageProcessed(messageId)).to.be.true;
        });
    });

    describe("Manejo de errores", function () {
        it("Debería revertir con inputs inválidos", async function () {
            await expect(
                bridge.connect(user).depositTokens(
                    ethers.constants.AddressZero,
                    100,
                    "0x"
                )
            ).to.be.revertedWith("Invalid recipient");

            await expect(
                bridge.connect(user).depositTokens(
                    user.address,
                    0,
                    "0x"
                )
            ).to.be.revertedWith("Amount must be greater than 0");
        });

        it("Debería revertir mensajes duplicados", async function () {
            const messageId = ethers.utils.keccak256("test");
            await bridge.connect(operator).processL1Message(
                messageId,
                brainSafes.address,
                ethers.utils.defaultAbiCoder.encode(
                    ["uint8", "uint256"],
                    [0, 1]
                )
            );

            await expect(
                bridge.connect(operator).processL1Message(
                    messageId,
                    brainSafes.address,
                    "0x"
                )
            ).to.be.revertedWith("Message already processed");
        });

        it("Debería revertir operaciones no autorizadas", async function () {
            await expect(
                bridge.connect(user).processL1Message(
                    ethers.utils.keccak256("test"),
                    brainSafes.address,
                    "0x"
                )
            ).to.be.revertedWith("AccessControl");

            await expect(
                bridge.connect(user).updateL2Contract(
                    ethers.constants.AddressZero
                )
            ).to.be.revertedWith("AccessControl");
        });
    });
}); 