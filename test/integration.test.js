const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BrainSafes Integration Tests", function () {
    let aiProcessor;
    let aiOracle;
    let brainSafes;
    let eduToken;
    let courseNFT;
    let certificateNFT;
    let scholarshipManager;
    let owner;
    let student;
    let instructor;

    beforeEach(async function () {
        [owner, student, instructor] = await ethers.getSigners();

        // Desplegar contratos
        const AIProcessor = await ethers.getContractFactory("AIProcessor");
        aiProcessor = await AIProcessor.deploy();
        await aiProcessor.deployed();

        const AIOracle = await ethers.getContractFactory("AIOracle");
        aiOracle = await AIOracle.deploy(aiProcessor.address);
        await aiOracle.deployed();

        const EDUToken = await ethers.getContractFactory("EDUToken");
        eduToken = await EDUToken.deploy();
        await eduToken.deployed();

        const CourseNFT = await ethers.getContractFactory("CourseNFT");
        courseNFT = await CourseNFT.deploy();
        await courseNFT.deployed();

        const CertificateNFT = await ethers.getContractFactory("CertificateNFT");
        certificateNFT = await CertificateNFT.deploy();
        await certificateNFT.deployed();

        const ScholarshipManager = await ethers.getContractFactory("ScholarshipManager");
        scholarshipManager = await ScholarshipManager.deploy(
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

        // Configurar roles
        const MINTER_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("MINTER_ROLE"));
        await eduToken.grantRole(MINTER_ROLE, brainSafes.address);
        await eduToken.grantRole(MINTER_ROLE, scholarshipManager.address);
        await courseNFT.grantRole(MINTER_ROLE, brainSafes.address);
        await certificateNFT.grantRole(MINTER_ROLE, brainSafes.address);
    });

    describe("Flujo de usuario completo", function () {
        it("Debería permitir registro y participación en el ecosistema", async function () {
            // 1. Registro de usuario
            await brainSafes.connect(student).registerUser(
                "Test Student",
                "student@test.com",
                "ipfs://profile"
            );

            const profile = await brainSafes.getUserProfile(student.address);
            expect(profile.isActive).to.be.true;

            // 2. Registro de instructor
            await brainSafes.connect(owner).registerInstructor(instructor.address);
            expect(await brainSafes.hasRole(
                ethers.utils.keccak256(ethers.utils.toUtf8Bytes("INSTRUCTOR_ROLE")),
                instructor.address
            )).to.be.true;

            // 3. Creación de curso
            await brainSafes.connect(instructor).createCourse(
                "Blockchain 101",
                "Introducción a Blockchain",
                "ipfs://content",
                ethers.utils.parseEther("100"),
                30, // duración
                100, // maxStudents
                ["blockchain", "crypto"],
                3 // difficulty
            );

            // 4. Predicción de rendimiento con IA
            const prediction = await brainSafes.predictStudentPerformance(
                student.address,
                1 // courseId
            );
            expect(prediction).to.be.gt(0);

            // 5. Ruta de aprendizaje personalizada
            const learningPath = await brainSafes.getPersonalizedLearningPath(
                student.address
            );
            expect(learningPath).to.be.an("array");

            // 6. Inscripción en curso
            await eduToken.mint(student.address, ethers.utils.parseEther("1000"));
            await eduToken.connect(student).approve(
                brainSafes.address,
                ethers.utils.parseEther("100")
            );
            await brainSafes.connect(student).enrollInCourse(1);

            // 7. Completar curso
            const proofOfCompletion = ethers.utils.keccak256(
                ethers.utils.defaultAbiCoder.encode(
                    ["address", "uint256", "uint256"],
                    [student.address, 1, 85]
                )
            );

            await brainSafes.connect(student).completeCourse(
                1, // courseId
                85, // score
                proofOfCompletion
            );

            // 8. Verificar certificado
            const certificates = await certificateNFT.getCertificatesByRecipient(student.address);
            expect(certificates.length).to.be.gt(0);

            // 9. Aplicar a beca
            await scholarshipManager.connect(student).applyForScholarship(
                ethers.utils.parseEther("500"),
                "Necesito apoyo para continuar mis estudios"
            );

            // 10. Verificar elegibilidad
            const [score, eligible] = await scholarshipManager.evaluateScholarshipEligibility(
                student.address
            );
            expect(score).to.be.gt(0);

            // 11. Detección de fraude
            const activityHash = ethers.utils.keccak256(
                ethers.utils.defaultAbiCoder.encode(
                    ["address", "uint256", "string"],
                    [student.address, 1, "course_completion"]
                )
            );

            const isFraud = await brainSafes.detectFraudulentActivity(
                student.address,
                activityHash
            );
            expect(typeof isFraud).to.equal("boolean");
        });
    });

    describe("Procesamiento por lotes", function () {
        it("Debería procesar múltiples predicciones eficientemente", async function () {
            // Registrar estudiantes
            for (let i = 0; i < 3; i++) {
                const wallet = ethers.Wallet.createRandom().connect(ethers.provider);
                await brainSafes.connect(wallet).registerUser(
                    `Student ${i}`,
                    `student${i}@test.com`,
                    `ipfs://profile${i}`
                );
            }

            // Crear curso
            await brainSafes.connect(instructor).createCourse(
                "Batch Test Course",
                "Description",
                "ipfs://content",
                ethers.utils.parseEther("100"),
                30,
                100,
                ["test"],
                3
            );

            // Procesar predicciones en lote
            const students = await brainSafes.getCourseStudents(1);
            const courseIds = Array(students.length).fill(1);

            const predictions = await brainSafes.batchPredictPerformance(
                students,
                courseIds
            );

            expect(predictions.length).to.equal(students.length);
            predictions.forEach(prediction => {
                expect(prediction).to.be.gt(0);
            });
        });
    });

    describe("Optimizaciones de gas", function () {
        it("Debería mostrar mejoras en costos de gas con Stylus", async function () {
            // Registrar estudiante
            await brainSafes.connect(student).registerUser(
                "Gas Test Student",
                "gas@test.com",
                "ipfs://profile"
            );

            // Medir gas para procesamiento individual
            const singleTx = await aiOracle.predictStudentPerformance(
                student.address,
                1
            );
            const singleReceipt = await singleTx.wait();
            const singleGasUsed = singleReceipt.gasUsed;

            // Medir gas para procesamiento por lotes
            const batchTx = await aiOracle.batchPredictPerformance(
                [student.address, student.address],
                [1, 1]
            );
            const batchReceipt = await batchTx.wait();
            const batchGasUsed = batchReceipt.gasUsed;

            // El gas por operación en lote debería ser menor
            const gasPerOpBatch = batchGasUsed.div(2);
            expect(gasPerOpBatch).to.be.lt(singleGasUsed);
        });
    });

    describe("Manejo de errores", function () {
        it("Debería manejar errores graciosamente", async function () {
            // Intentar procesar sin modelo registrado
            await expect(
                aiOracle.predictStudentPerformance(
                    ethers.constants.AddressZero,
                    999
                )
            ).to.be.revertedWith("Model not found");

            // Intentar procesar input demasiado grande
            const largeInput = ethers.utils.randomBytes(2048);
            await expect(
                aiProcessor.processInference(
                    1,
                    largeInput
                )
            ).to.be.revertedWith("Input too large");

            // Intentar procesar batch demasiado grande
            const largeInputs = Array(100).fill(ethers.utils.randomBytes(32));
            await expect(
                aiProcessor.batchProcess(
                    1,
                    largeInputs
                )
            ).to.be.revertedWith("Batch too large");
        });
    });
}); 