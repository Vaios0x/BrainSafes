const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("GelatoVRF", function () {
    let gelatoVRF;
    let mockConsumer;
    let owner;
    let manager;
    let callback;
    let user;

    const VRF_MANAGER_ROLE = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes("VRF_MANAGER_ROLE")
    );
    const CALLBACK_ROLE = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes("CALLBACK_ROLE")
    );

    beforeEach(async function () {
        [owner, manager, callback, user] = await ethers.getSigners();

        // Desplegar contrato principal
        const GelatoVRF = await ethers.getContractFactory("GelatoVRF");
        gelatoVRF = await GelatoVRF.deploy();
        await gelatoVRF.deployed();

        // Desplegar contrato consumidor mock
        const MockConsumer = await ethers.getContractFactory("MockRandomnessConsumer");
        mockConsumer = await MockConsumer.deploy(gelatoVRF.address);
        await mockConsumer.deployed();

        // Configurar roles
        await gelatoVRF.grantRole(VRF_MANAGER_ROLE, manager.address);
        await gelatoVRF.grantRole(CALLBACK_ROLE, callback.address);

        // Configurar tipo de solicitud de prueba
        const TEST_REQUEST_TYPE = ethers.utils.formatBytes32String("TEST");
        await gelatoVRF.connect(manager).setRequestConfig(
            TEST_REQUEST_TYPE,
            10, // confirmations
            200000, // gas limit
            60, // delay
            100 // expiry blocks
        );
    });

    describe("Inicialización", function () {
        it("Debería configurar roles correctamente", async function () {
            expect(await gelatoVRF.hasRole(VRF_MANAGER_ROLE, manager.address)).to.be.true;
            expect(await gelatoVRF.hasRole(CALLBACK_ROLE, callback.address)).to.be.true;
        });

        it("Debería configurar constantes correctamente", async function () {
            expect(await gelatoVRF.MAX_REQUEST_CONFIRMATIONS()).to.equal(200);
            expect(await gelatoVRF.MAX_RANDOM_WORDS()).to.equal(100);
            expect(await gelatoVRF.MIN_GAS_LIMIT()).to.equal(100000);
            expect(await gelatoVRF.MAX_GAS_LIMIT()).to.equal(2000000);
        });
    });

    describe("Solicitud de aleatoriedad", function () {
        const TEST_REQUEST_TYPE = ethers.utils.formatBytes32String("TEST");

        it("Debería solicitar palabras aleatorias correctamente", async function () {
            const numWords = 5;
            const tx = await gelatoVRF.connect(user).requestRandomWords(
                numWords,
                TEST_REQUEST_TYPE
            );
            
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === "RandomWordsRequested");
            
            expect(event.args.requester).to.equal(user.address);
            expect(event.args.numWords).to.equal(numWords);
            expect(event.args.requestType).to.equal(TEST_REQUEST_TYPE);
        });

        it("Debería rechazar solicitud con palabras inválidas", async function () {
            await expect(
                gelatoVRF.connect(user).requestRandomWords(
                    0,
                    TEST_REQUEST_TYPE
                )
            ).to.be.revertedWith("Invalid number of words");

            await expect(
                gelatoVRF.connect(user).requestRandomWords(
                    101,
                    TEST_REQUEST_TYPE
                )
            ).to.be.revertedWith("Invalid number of words");
        });

        it("Debería rechazar tipo de solicitud no configurado", async function () {
            const INVALID_TYPE = ethers.utils.formatBytes32String("INVALID");
            await expect(
                gelatoVRF.connect(user).requestRandomWords(
                    1,
                    INVALID_TYPE
                )
            ).to.be.revertedWith("Request type not configured");
        });
    });

    describe("Cumplimiento de solicitudes", function () {
        const TEST_REQUEST_TYPE = ethers.utils.formatBytes32String("TEST");
        let requestId;

        beforeEach(async function () {
            const tx = await gelatoVRF.connect(user).requestRandomWords(
                3,
                TEST_REQUEST_TYPE
            );
            const receipt = await tx.wait();
            requestId = receipt.events.find(e => e.event === "RandomWordsRequested").args.requestId;
        });

        it("Debería cumplir solicitud correctamente", async function () {
            const randomWords = [123, 456, 789];
            
            // Avanzar tiempo para confirmaciones
            await ethers.provider.send("evm_increaseTime", [15]); // 15 segundos
            await ethers.provider.send("evm_mine");

            await gelatoVRF.connect(callback).fulfillRandomWords(requestId, randomWords);
            
            const request = await gelatoVRF.getRequestDetails(requestId);
            expect(request.fulfilled).to.be.true;
            expect(request.randomWords).to.deep.equal(randomWords);
        });

        it("Debería rechazar cumplimiento duplicado", async function () {
            const randomWords = [123, 456, 789];
            
            await ethers.provider.send("evm_increaseTime", [15]);
            await ethers.provider.send("evm_mine");

            await gelatoVRF.connect(callback).fulfillRandomWords(requestId, randomWords);
            
            await expect(
                gelatoVRF.connect(callback).fulfillRandomWords(requestId, randomWords)
            ).to.be.revertedWith("Request already fulfilled");
        });

        it("Debería rechazar número incorrecto de palabras", async function () {
            const randomWords = [123, 456]; // Solo 2 palabras cuando se pidieron 3
            
            await ethers.provider.send("evm_increaseTime", [15]);
            await ethers.provider.send("evm_mine");

            await expect(
                gelatoVRF.connect(callback).fulfillRandomWords(requestId, randomWords)
            ).to.be.revertedWith("Invalid number of words");
        });

        it("Debería rechazar cumplimiento prematuro", async function () {
            const randomWords = [123, 456, 789];
            
            await expect(
                gelatoVRF.connect(callback).fulfillRandomWords(requestId, randomWords)
            ).to.be.revertedWith("Insufficient confirmations");
        });
    });

    describe("Gestión de configuración", function () {
        const TEST_REQUEST_TYPE = ethers.utils.formatBytes32String("TEST");

        it("Debería actualizar configuración correctamente", async function () {
            await gelatoVRF.connect(manager).setRequestConfig(
                TEST_REQUEST_TYPE,
                20,
                300000,
                120,
                200
            );

            const config = await gelatoVRF.getRequestConfig(TEST_REQUEST_TYPE);
            expect(config.minimumRequestConfirmations).to.equal(20);
            expect(config.callbackGasLimit).to.equal(300000);
            expect(config.requestConfirmationDelay).to.equal(120);
            expect(config.requestExpiryBlocks).to.equal(200);
        });

        it("Debería rechazar confirmaciones excesivas", async function () {
            await expect(
                gelatoVRF.connect(manager).setRequestConfig(
                    TEST_REQUEST_TYPE,
                    201, // MAX_REQUEST_CONFIRMATIONS = 200
                    300000,
                    120,
                    200
                )
            ).to.be.revertedWith("Confirmations too high");
        });

        it("Debería rechazar límite de gas inválido", async function () {
            await expect(
                gelatoVRF.connect(manager).setRequestConfig(
                    TEST_REQUEST_TYPE,
                    20,
                    50000, // Menor que MIN_GAS_LIMIT
                    120,
                    200
                )
            ).to.be.revertedWith("Invalid gas limit");

            await expect(
                gelatoVRF.connect(manager).setRequestConfig(
                    TEST_REQUEST_TYPE,
                    20,
                    2100000, // Mayor que MAX_GAS_LIMIT
                    120,
                    200
                )
            ).to.be.revertedWith("Invalid gas limit");
        });
    });

    describe("Gestión de solicitudes", function () {
        const TEST_REQUEST_TYPE = ethers.utils.formatBytes32String("TEST");
        let requestId;

        beforeEach(async function () {
            const tx = await gelatoVRF.connect(user).requestRandomWords(
                3,
                TEST_REQUEST_TYPE
            );
            const receipt = await tx.wait();
            requestId = receipt.events.find(e => e.event === "RandomWordsRequested").args.requestId;
        });

        it("Debería cancelar solicitud correctamente", async function () {
            await gelatoVRF.connect(manager).cancelRequest(requestId, "Testing cancellation");
            
            const request = await gelatoVRF.getRequestDetails(requestId);
            expect(request.id).to.equal(0); // Solicitud eliminada
        });

        it("Debería rechazar cancelación de solicitud cumplida", async function () {
            const randomWords = [123, 456, 789];
            
            await ethers.provider.send("evm_increaseTime", [15]);
            await ethers.provider.send("evm_mine");

            await gelatoVRF.connect(callback).fulfillRandomWords(requestId, randomWords);
            
            await expect(
                gelatoVRF.connect(manager).cancelRequest(requestId, "Testing cancellation")
            ).to.be.revertedWith("Request already fulfilled");
        });
    });

    describe("Integración con consumidor", function () {
        const TEST_REQUEST_TYPE = ethers.utils.formatBytes32String("TEST");

        it("Debería llamar al callback del consumidor", async function () {
            // Solicitar a través del consumidor
            const tx = await mockConsumer.connect(user).requestRandomness(3);
            const receipt = await tx.wait();
            const requestId = receipt.events.find(e => e.event === "RandomnessRequested").args.requestId;

            // Avanzar tiempo y cumplir
            await ethers.provider.send("evm_increaseTime", [15]);
            await ethers.provider.send("evm_mine");

            const randomWords = [123, 456, 789];
            await gelatoVRF.connect(callback).fulfillRandomWords(requestId, randomWords);

            // Verificar que el consumidor recibió los números
            const receivedWords = await mockConsumer.getRandomWords(requestId);
            expect(receivedWords).to.deep.equal(randomWords);
        });
    });

    describe("Control de acceso", function () {
        const TEST_REQUEST_TYPE = ethers.utils.formatBytes32String("TEST");

        it("Debería permitir solicitudes cuando no está pausado", async function () {
            await expect(
                gelatoVRF.connect(user).requestRandomWords(3, TEST_REQUEST_TYPE)
            ).to.not.be.reverted;
        });

        it("Debería rechazar solicitudes cuando está pausado", async function () {
            await gelatoVRF.connect(manager).pause();
            
            await expect(
                gelatoVRF.connect(user).requestRandomWords(3, TEST_REQUEST_TYPE)
            ).to.be.revertedWith("Pausable: paused");
        });

        it("Debería rechazar cumplimiento sin rol", async function () {
            const tx = await gelatoVRF.connect(user).requestRandomWords(3, TEST_REQUEST_TYPE);
            const receipt = await tx.wait();
            const requestId = receipt.events.find(e => e.event === "RandomWordsRequested").args.requestId;

            await expect(
                gelatoVRF.connect(user).fulfillRandomWords(requestId, [123, 456, 789])
            ).to.be.revertedWith("AccessControl");
        });
    });
}); 