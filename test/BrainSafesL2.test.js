const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BrainSafesL2", function () {
    let brainSafesL2;
    let eduToken;
    let courseNFT;
    let certificateNFT;
    let aiProcessor;
    let aiOracle;
    let scholarshipManager;
    let owner;
    let user;
    let bridge;

    beforeEach(async function () {
        [owner, user, bridge] = await ethers.getSigners();

        // Desplegar contratos
        const EDUToken = await ethers.getContractFactory("EDUToken");
        eduToken = await EDUToken.deploy();
        await eduToken.deployed();

        const CourseNFT = await ethers.getContractFactory("CourseNFT");
        courseNFT = await CourseNFT.deploy();
        await courseNFT.deployed();

        const CertificateNFT = await ethers.getContractFactory("CertificateNFT");
        certificateNFT = await CertificateNFT.deploy();
        await certificateNFT.deployed();

        const AIProcessor = await ethers.getContractFactory("AIProcessor");
        aiProcessor = await AIProcessor.deploy();
        await aiProcessor.deployed();

        const AIOracle = await ethers.getContractFactory("AIOracle");
        aiOracle = await AIOracle.deploy(aiProcessor.address);
        await aiOracle.deployed();

        const ScholarshipManager = await ethers.getContractFactory("ScholarshipManager");
        scholarshipManager = await ScholarshipManager.deploy(
            eduToken.address,
            aiOracle.address,
            owner.address
        );
        await scholarshipManager.deployed();

        const BrainSafesL2 = await ethers.getContractFactory("BrainSafesL2");
        brainSafesL2 = await BrainSafesL2.deploy(
            owner.address, // L1 BrainSafes (mock)
            bridge.address, // L1 Bridge
            eduToken.address,
            courseNFT.address,
            certificateNFT.address,
            scholarshipManager.address,
            aiOracle.address
        );
        await brainSafesL2.deployed();

        // Configurar roles
        const MINTER_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("MINTER_ROLE"));
        await eduToken.grantRole(MINTER_ROLE, brainSafesL2.address);
        await courseNFT.grantRole(MINTER_ROLE, brainSafesL2.address);
        await certificateNFT.grantRole(MINTER_ROLE, brainSafesL2.address);
    });

    describe("Recepción desde L1", function () {
        it("Debería recibir tokens desde L1", async function () {
            const amount = ethers.utils.parseEther("100");
            await brainSafesL2.connect(bridge).receiveFromL1(
                owner.address,
                user.address,
                amount,
                "0x"
            );

            expect(await eduToken.balanceOf(user.address)).to.equal(amount);
        });

        it("Debería procesar datos adicionales de L1", async function () {
            const amount = ethers.utils.parseEther("100");
            const data = ethers.utils.defaultAbiCoder.encode(
                ["string", "uint256"],
                ["profile_update", 123]
            );

            await brainSafesL2.connect(bridge).receiveFromL1(
                owner.address,
                user.address,
                amount,
                data
            );

            expect(await eduToken.balanceOf(user.address)).to.equal(amount);
        });

        it("Debería revertir si no es llamado por el bridge", async function () {
            await expect(
                brainSafesL2.connect(user).receiveFromL1(
                    owner.address,
                    user.address,
                    100,
                    "0x"
                )
            ).to.be.revertedWith("Only bridge can call");
        });
    });

    describe("Retiros a L1", function () {
        beforeEach(async function () {
            // Dar tokens al usuario
            await eduToken.mint(user.address, ethers.utils.parseEther("1000"));
            await eduToken.connect(user).approve(brainSafesL2.address, ethers.utils.parseEther("1000"));
        });

        it("Debería iniciar retiro correctamente", async function () {
            const amount = ethers.utils.parseEther("100");
            await brainSafesL2.connect(bridge).initiateWithdrawal(
                user.address,
                owner.address,
                amount
            );

            const withdrawal = await brainSafesL2.getWithdrawalStatus(1);
            expect(withdrawal.sender).to.equal(user.address);
            expect(withdrawal.recipient).to.equal(owner.address);
            expect(withdrawal.amount).to.equal(amount);
            expect(withdrawal.completed).to.be.false;
        });

        it("Debería quemar tokens al retirar", async function () {
            const amount = ethers.utils.parseEther("100");
            const initialSupply = await eduToken.totalSupply();

            await brainSafesL2.connect(bridge).initiateWithdrawal(
                user.address,
                owner.address,
                amount
            );

            expect(await eduToken.totalSupply()).to.equal(initialSupply.sub(amount));
        });
    });

    describe("Bridge de certificados", function () {
        it("Debería recibir certificado desde L1", async function () {
            await brainSafesL2.connect(bridge).receiveCertificateFromL1(
                user.address,
                1,
                ethers.utils.defaultAbiCoder.encode(
                    ["string", "uint256"],
                    ["Certificate Metadata", 100]
                )
            );

            expect(await certificateNFT.ownerOf(1)).to.equal(user.address);
        });

        it("Debería mintear certificado desde L1", async function () {
            await brainSafesL2.connect(bridge).mintCertificateFromL1(
                user.address,
                1,
                ethers.utils.defaultAbiCoder.encode(
                    ["string", "uint256"],
                    ["Certificate Metadata", 100]
                )
            );

            expect(await certificateNFT.ownerOf(1)).to.equal(user.address);
        });
    });

    describe("Mensajería L1-L2", function () {
        it("Debería procesar mensajes de L1", async function () {
            const messageId = ethers.utils.keccak256(
                ethers.utils.defaultAbiCoder.encode(
                    ["uint256", "address"],
                    [1, user.address]
                )
            );

            const data = ethers.utils.defaultAbiCoder.encode(
                ["bytes4", "bytes"],
                [
                    ethers.utils.id("updateUserProfile(address,string)").slice(0, 10),
                    ethers.utils.defaultAbiCoder.encode(
                        ["address", "string"],
                        [user.address, "New Profile"]
                    )
                ]
            );

            await brainSafesL2.connect(bridge).processL1Message(
                messageId,
                owner.address,
                data
            );

            expect(await brainSafesL2.isMessageProcessed(messageId)).to.be.true;
        });

        it("Debería enviar mensajes a L1", async function () {
            const data = ethers.utils.defaultAbiCoder.encode(
                ["string", "uint256"],
                ["test_message", 123]
            );

            await brainSafesL2.connect(owner).sendMessageToL1(
                owner.address,
                data
            );
        });

        it("Debería revertir mensajes duplicados", async function () {
            const messageId = ethers.utils.keccak256("test");
            const data = "0x";

            await brainSafesL2.connect(bridge).processL1Message(
                messageId,
                owner.address,
                data
            );

            await expect(
                brainSafesL2.connect(bridge).processL1Message(
                    messageId,
                    owner.address,
                    data
                )
            ).to.be.revertedWith("Message already processed");
        });
    });

    describe("Administración", function () {
        it("Debería permitir actualizar contrato L1", async function () {
            const newL1Contract = ethers.Wallet.createRandom().address;
            await brainSafesL2.connect(owner).updateL1Contract(newL1Contract);
            expect(await brainSafesL2.l1BrainSafes()).to.equal(newL1Contract);
        });

        it("Debería permitir actualizar bridge", async function () {
            const newBridge = ethers.Wallet.createRandom().address;
            await brainSafesL2.connect(owner).updateBridge(newBridge);
            expect(await brainSafesL2.l1Bridge()).to.equal(newBridge);
        });

        it("Debería revertir actualizaciones no autorizadas", async function () {
            await expect(
                brainSafesL2.connect(user).updateL1Contract(ethers.constants.AddressZero)
            ).to.be.revertedWith("AccessControl");

            await expect(
                brainSafesL2.connect(user).updateBridge(ethers.constants.AddressZero)
            ).to.be.revertedWith("AccessControl");
        });
    });

    describe("Integración con AIProcessor", function () {
        it("Debería usar AIProcessor para predicciones", async function () {
            // Registrar usuario
            await brainSafesL2.connect(user).registerUser(
                "Test User",
                "user@test.com",
                "ipfs://profile"
            );

            // Predecir rendimiento
            const prediction = await brainSafesL2.predictStudentPerformance(
                user.address,
                1 // courseId
            );
            expect(prediction).to.be.gt(0);
        });

        it("Debería procesar predicciones en lote", async function () {
            // Registrar usuarios
            await brainSafesL2.connect(user).registerUser(
                "Test User 1",
                "user1@test.com",
                "ipfs://profile1"
            );

            const user2 = ethers.Wallet.createRandom().connect(ethers.provider);
            await brainSafesL2.connect(user2).registerUser(
                "Test User 2",
                "user2@test.com",
                "ipfs://profile2"
            );

            // Predecir en lote
            const predictions = await brainSafesL2.batchPredictPerformance(
                [user.address, user2.address],
                [1, 1]
            );

            expect(predictions.length).to.equal(2);
            predictions.forEach(prediction => {
                expect(prediction).to.be.gt(0);
            });
        });
    });
}); 