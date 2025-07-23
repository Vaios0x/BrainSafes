const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AIProcessor Integration", function () {
    let aiProcessor;
    let aiOracle;
    let brainSafes;
    let owner;
    let student;
    let instructor;

    beforeEach(async function () {
        // Obtener cuentas
        [owner, student, instructor] = await ethers.getSigners();

        // Desplegar AIProcessor (Stylus)
        const AIProcessor = await ethers.getContractFactory("AIProcessor");
        aiProcessor = await AIProcessor.deploy();
        await aiProcessor.deployed();

        // Desplegar AIOracle
        const AIOracle = await ethers.getContractFactory("AIOracle");
        aiOracle = await AIOracle.deploy(aiProcessor.address);
        await aiOracle.deployed();

        // Desplegar BrainSafes con dependencias
        const EDUToken = await ethers.getContractFactory("EDUToken");
        const eduToken = await EDUToken.deploy();
        await eduToken.deployed();

        const CourseNFT = await ethers.getContractFactory("CourseNFT");
        const courseNFT = await CourseNFT.deploy();
        await courseNFT.deployed();

        const CertificateNFT = await ethers.getContractFactory("CertificateNFT");
        const certificateNFT = await CertificateNFT.deploy();
        await certificateNFT.deployed();

        const ScholarshipManager = await ethers.getContractFactory("ScholarshipManager");
        const scholarshipManager = await ScholarshipManager.deploy(
            eduToken.address,
            aiOracle.address,
            owner.address
        );
        await scholarshipManager.deployed();

        const BrainSafes = await ethers.getContractFactory("BrainSafes");
        brainSafes = await BrainSafes.deploy(
            eduToken.address,
            courseNFT.address,
            certificateNFT.address,
            scholarshipManager.address,
            aiOracle.address
        );
        await brainSafes.deployed();
    });

    describe("Modelo de Predicción de Rendimiento", function () {
        it("Debería registrar un modelo correctamente", async function () {
            const tx = await aiProcessor.registerModel(
                1, // modelId
                1024, // inputSize
                128, // outputSize
                32, // batchSize
                100 // computeUnits
            );
            await tx.wait();

            const modelConfig = await aiProcessor.getModelConfig(1);
            expect(modelConfig.isActive).to.be.true;
        });

        it("Debería procesar una inferencia", async function () {
            // Registrar modelo
            await aiProcessor.registerModel(1, 1024, 128, 32, 100);

            // Crear datos de prueba
            const inputData = ethers.utils.defaultAbiCoder.encode(
                ["address", "uint256"],
                [student.address, 1] // student, courseId
            );

            const result = await aiProcessor.processInference(1, inputData);
            expect(result.confidence).to.be.gt(0);
        });

        it("Debería procesar inferencias en lote", async function () {
            // Registrar modelo
            await aiProcessor.registerModel(1, 1024, 128, 32, 100);

            // Crear datos de prueba
            const inputs = [
                ethers.utils.defaultAbiCoder.encode(
                    ["address", "uint256"],
                    [student.address, 1]
                ),
                ethers.utils.defaultAbiCoder.encode(
                    ["address", "uint256"],
                    [student.address, 2]
                )
            ];

            const results = await aiProcessor.batchProcess(1, inputs);
            expect(results.length).to.equal(2);
            results.forEach(result => {
                expect(result.confidence).to.be.gt(0);
            });
        });
    });

    describe("Integración con AIOracle", function () {
        beforeEach(async function () {
            // Registrar estudiante
            await brainSafes.connect(student).registerUser(
                "Test Student",
                "student@test.com",
                "ipfs://profile"
            );

            // Registrar instructor
            await brainSafes.connect(owner).registerInstructor(instructor.address);

            // Crear curso
            await brainSafes.connect(instructor).createCourse(
                "Test Course",
                "Description",
                "ipfs://content",
                ethers.utils.parseEther("100"), // price
                30, // duration
                100, // maxStudents
                ["Skill1", "Skill2"],
                3 // difficulty
            );
        });

        it("Debería predecir rendimiento del estudiante", async function () {
            const prediction = await brainSafes.predictStudentPerformance(
                student.address,
                1 // courseId
            );
            expect(prediction).to.be.gt(0);
        });

        it("Debería generar ruta de aprendizaje", async function () {
            const path = await brainSafes.getPersonalizedLearningPath(
                student.address
            );
            expect(path).to.be.an("array");
        });

        it("Debería detectar actividad fraudulenta", async function () {
            const activityHash = ethers.utils.keccak256(
                ethers.utils.defaultAbiCoder.encode(
                    ["address", "uint256", "string"],
                    [student.address, 1, "suspicious_activity"]
                )
            );

            const isFraud = await brainSafes.detectFraudulentActivity(
                student.address,
                activityHash
            );
            expect(typeof isFraud).to.equal("boolean");
        });

        it("Debería procesar predicciones en lote", async function () {
            const students = [student.address, instructor.address];
            const courseIds = [1, 1];

            const predictions = await brainSafes.batchPredictPerformance(
                students,
                courseIds
            );
            expect(predictions.length).to.equal(2);
            predictions.forEach(prediction => {
                expect(prediction).to.be.gt(0);
            });
        });
    });

    describe("Estadísticas y Monitoreo", function () {
        it("Debería rastrear estadísticas de procesamiento", async function () {
            // Registrar modelo
            await aiProcessor.registerModel(1, 1024, 128, 32, 100);

            // Realizar algunas inferencias
            const inputData = ethers.utils.defaultAbiCoder.encode(
                ["address", "uint256"],
                [student.address, 1]
            );

            await aiProcessor.processInference(1, inputData);
            await aiProcessor.processInference(1, inputData);

            const stats = await aiProcessor.getProcessingStats(1);
            expect(stats.totalRequests).to.equal(2);
            expect(stats.totalGasUsed).to.be.gt(0);
            expect(stats.avgProcessingTime).to.be.gt(0);
        });
    });
}); 