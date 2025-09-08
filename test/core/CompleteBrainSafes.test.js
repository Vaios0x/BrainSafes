const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BrainSafes - Implementación Completa", function () {
    let brainSafes, mockEDUToken, mockCourseNFT, mockCertificateNFT, mockScholarshipManager, mockAIOracle;
    let nitroUtils, addressCompressor, enhancedMulticall, distributedCache, securityManager, userExperience;
    let owner, user1, user2, instructor, admin;

    beforeEach(async function () {
        [owner, user1, user2, instructor, admin] = await ethers.getSigners();

        // Deploy mock contracts
        const MockEDUToken = await ethers.getContractFactory("MockEDUToken");
        const MockCourseNFT = await ethers.getContractFactory("MockCourseNFT");
        const MockCertificateNFT = await ethers.getContractFactory("MockCertificateNFT");
        const MockScholarshipManager = await ethers.getContractFactory("MockScholarshipManager");
        const MockAIOracle = await ethers.getContractFactory("MockAIOracle");

        mockEDUToken = await MockEDUToken.deploy();
        mockCourseNFT = await MockCourseNFT.deploy();
        mockCertificateNFT = await MockCertificateNFT.deploy();
        mockScholarshipManager = await MockScholarshipManager.deploy();
        mockAIOracle = await MockAIOracle.deploy();

        await mockEDUToken.deployed();
        await mockCourseNFT.deployed();
        await mockCertificateNFT.deployed();
        await mockScholarshipManager.deployed();
        await mockAIOracle.deployed();

        // Deploy utility contracts
        const NitroUtils = await ethers.getContractFactory("NitroUtils");
        const AddressCompressor = await ethers.getContractFactory("AddressCompressor");
        const EnhancedMulticall = await ethers.getContractFactory("EnhancedMulticall");
        const DistributedCache = await ethers.getContractFactory("DistributedCache");
        const SecurityManager = await ethers.getContractFactory("SecurityManager");
        const UserExperience = await ethers.getContractFactory("UserExperience");

        nitroUtils = await NitroUtils.deploy();
        addressCompressor = await AddressCompressor.deploy();
        enhancedMulticall = await EnhancedMulticall.deploy();
        distributedCache = await DistributedCache.deploy();
        securityManager = await SecurityManager.deploy();
        userExperience = await UserExperience.deploy();

        await nitroUtils.deployed();
        await addressCompressor.deployed();
        await enhancedMulticall.deployed();
        await distributedCache.deployed();
        await securityManager.deployed();
        await userExperience.deployed();

        // Deploy BrainSafes
        const BrainSafes = await ethers.getContractFactory("BrainSafes");
        brainSafes = await BrainSafes.deploy(
            mockEDUToken.address,
            mockCourseNFT.address,
            mockCertificateNFT.address,
            mockScholarshipManager.address,
            mockAIOracle.address
        );

        await brainSafes.deployed();

        // Set utility contracts
        await brainSafes.setUtilityContracts(
            nitroUtils.address,
            addressCompressor.address,
            enhancedMulticall.address,
            distributedCache.address,
            securityManager.address,
            userExperience.address
        );

        // Grant roles
        await brainSafes.grantRole(await brainSafes.ADMIN_ROLE(), admin.address);
        await brainSafes.grantRole(await brainSafes.INSTRUCTOR_ROLE(), instructor.address);
    });

    describe("Configuración Inicial", function () {
        it("Debería tener todas las interfaces configuradas correctamente", async function () {
            expect(await brainSafes.eduToken()).to.equal(mockEDUToken.address);
            expect(await brainSafes.courseNFT()).to.equal(mockCourseNFT.address);
            expect(await brainSafes.certificateNFT()).to.equal(mockCertificateNFT.address);
            expect(await brainSafes.scholarshipManager()).to.equal(mockScholarshipManager.address);
            expect(await brainSafes.aiOracle()).to.equal(mockAIOracle.address);
        });

        it("Debería tener todos los contratos de utilidades configurados", async function () {
            expect(await brainSafes.nitroUtils()).to.equal(nitroUtils.address);
            expect(await brainSafes.addressCompressor()).to.equal(addressCompressor.address);
            expect(await brainSafes.enhancedMulticall()).to.equal(enhancedMulticall.address);
            expect(await brainSafes.distributedCache()).to.equal(distributedCache.address);
            expect(await brainSafes.securityManager()).to.equal(securityManager.address);
            expect(await brainSafes.userExperience()).to.equal(userExperience.address);
        });

        it("Debería tener los roles correctos configurados", async function () {
            expect(await brainSafes.hasRole(await brainSafes.DEFAULT_ADMIN_ROLE(), owner.address)).to.be.true;
            expect(await brainSafes.hasRole(await brainSafes.ADMIN_ROLE(), admin.address)).to.be.true;
            expect(await brainSafes.hasRole(await brainSafes.INSTRUCTOR_ROLE(), instructor.address)).to.be.true;
        });
    });

    describe("Funciones de Registro", function () {
        it("Debería registrar un usuario correctamente", async function () {
            await brainSafes.connect(user1).registerUser("Test User", "test@example.com", "ipfs://profile");
            
            const profile = await brainSafes.getUserProfile(user1.address);
            expect(profile.name).to.equal("Test User");
            expect(profile.email).to.equal("test@example.com");
            expect(profile.ipfsProfile).to.equal("ipfs://profile");
            expect(profile.isActive).to.be.true;
        });

        it("Debería registrar un instructor correctamente", async function () {
            await brainSafes.connect(user2).registerUser("Instructor", "instructor@example.com", "ipfs://instructor");
            await brainSafes.connect(admin).registerInstructor(user2.address);
            
            expect(await brainSafes.hasRole(await brainSafes.INSTRUCTOR_ROLE(), user2.address)).to.be.true;
        });

        it("Debería registrar una organización correctamente", async function () {
            await brainSafes.connect(user1).registerUser("Organization", "org@example.com", "ipfs://org");
            await brainSafes.connect(admin).registerOrganization(user1.address);
            
            expect(await brainSafes.hasRole(await brainSafes.ORGANIZATION_ROLE(), user1.address)).to.be.true;
        });

        it("Debería realizar registro en lote correctamente", async function () {
            const names = ["User1", "User2", "User3"];
            const emails = ["user1@test.com", "user2@test.com", "user3@test.com"];
            const profiles = ["ipfs://1", "ipfs://2", "ipfs://3"];

            await brainSafes.connect(admin).batchRegisterUsers(names, emails, profiles);
            
            // Verificar que el batch se ejecutó sin errores
            expect(true).to.be.true; // Si no hay error, la función funcionó
        });
    });

    describe("Funciones de Cursos", function () {
        beforeEach(async function () {
            await brainSafes.connect(user1).registerUser("Student", "student@example.com", "ipfs://student");
            await brainSafes.connect(instructor).registerUser("Instructor", "instructor@example.com", "ipfs://instructor");
        });

        it("Debería crear un curso correctamente", async function () {
            const skills = ["Solidity", "Web3"];
            await brainSafes.connect(instructor).createCourse(
                "Smart Contract Development",
                "Learn Solidity and Web3",
                "ipfs://course-content",
                ethers.utils.parseEther("100"),
                30,
                50,
                skills,
                3
            );

            const course = await brainSafes.courses(1);
            expect(course.title).to.equal("Smart Contract Development");
            expect(course.instructor).to.equal(instructor.address);
            expect(course.price).to.equal(ethers.utils.parseEther("100"));
        });

        it("Debería inscribir a un estudiante en un curso", async function () {
            const skills = ["Solidity"];
            await brainSafes.connect(instructor).createCourse(
                "Solidity Basics",
                "Learn Solidity",
                "ipfs://content",
                ethers.utils.parseEther("50"),
                15,
                20,
                skills,
                2
            );

            // Aprobar tokens para el estudiante
            await mockEDUToken.mint(user1.address, ethers.utils.parseEther("100"));
            await mockEDUToken.connect(user1).approve(brainSafes.address, ethers.utils.parseEther("50"));

            await brainSafes.connect(user1).enrollInCourse(1);
            
            expect(await brainSafes.hasEnrolled(user1.address, 1)).to.be.true;
        });

        it("Debería completar un curso correctamente", async function () {
            // Crear y inscribir en curso
            const skills = ["Solidity"];
            await brainSafes.connect(instructor).createCourse(
                "Solidity Basics",
                "Learn Solidity",
                "ipfs://content",
                ethers.utils.parseEther("50"),
                15,
                20,
                skills,
                2
            );

            await mockEDUToken.mint(user1.address, ethers.utils.parseEther("100"));
            await mockEDUToken.connect(user1).approve(brainSafes.address, ethers.utils.parseEther("50"));
            await brainSafes.connect(user1).enrollInCourse(1);

            // Completar curso
            const proofOfCompletion = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("completion"));
            await brainSafes.connect(user1).completeCourse(1, 85, proofOfCompletion);

            const enrollment = await brainSafes.enrollments(1);
            expect(enrollment.completed).to.be.true;
            expect(enrollment.score).to.equal(85);
        });

        it("Debería crear cursos en lote correctamente", async function () {
            const titles = ["Course 1", "Course 2"];
            const descriptions = ["Description 1", "Description 2"];
            const ipfsContents = ["ipfs://1", "ipfs://2"];
            const prices = [ethers.utils.parseEther("50"), ethers.utils.parseEther("75")];
            const durations = [15, 20];
            const maxStudents = [20, 25];
            const skills = [["Solidity"], ["Web3"]];
            const difficulties = [2, 3];

            await brainSafes.connect(instructor).batchCreateCourses(
                titles,
                descriptions,
                ipfsContents,
                prices,
                durations,
                maxStudents,
                skills,
                difficulties
            );

            expect(await brainSafes.courses(1)).to.not.be.undefined;
            expect(await brainSafes.courses(2)).to.not.be.undefined;
        });
    });

    describe("Funciones de Utilidades", function () {
        it("Debería optimizar gas usando NitroUtils", async function () {
            const testData = ethers.utils.toUtf8Bytes("test data");
            const optimizedData = await brainSafes.optimizeGasUsage(testData);
            expect(optimizedData).to.not.be.undefined;
        });

        it("Debería comprimir datos usando NitroUtils", async function () {
            const testData = ethers.utils.toUtf8Bytes("test data for compression");
            const compressedData = await brainSafes.compressData(testData);
            expect(compressedData).to.not.be.undefined;
        });

        it("Debería comprimir y descomprimir direcciones correctamente", async function () {
            const compressedAddr = await brainSafes.compressAddress(user1.address);
            const decompressedAddr = await brainSafes.decompressAddress(compressedAddr);
            expect(decompressedAddr).to.equal(user1.address);
        });

        it("Debería almacenar y recuperar datos del cache", async function () {
            const cacheKey = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test"));
            const cacheData = ethers.utils.toUtf8Bytes("cache data");
            const expiresAt = Math.floor(Date.now() / 1000) + 3600;

            await brainSafes.storeInCache(cacheKey, cacheData, expiresAt);
            const retrievedData = await brainSafes.getFromCache(cacheKey);
            expect(retrievedData).to.deep.equal(cacheData);
        });

        it("Debería gestionar blacklist correctamente", async function () {
            expect(await brainSafes.isBlacklisted(user1.address)).to.be.false;
            
            await brainSafes.connect(admin).addToBlacklist(user1.address);
            expect(await brainSafes.isBlacklisted(user1.address)).to.be.true;
            
            await brainSafes.connect(admin).removeFromBlacklist(user1.address);
            expect(await brainSafes.isBlacklisted(user1.address)).to.be.false;
        });

        it("Debería obtener métricas de experiencia de usuario", async function () {
            const userMetrics = await brainSafes.getUserExperienceMetrics(user1.address);
            expect(userMetrics).to.not.be.undefined;
        });
    });

    describe("Funciones de IA", function () {
        it("Debería predecir rendimiento del estudiante", async function () {
            const prediction = await brainSafes.predictStudentPerformance(user1.address, 1);
            expect(prediction).to.be.a("bigint");
        });

        it("Debería generar ruta de aprendizaje personalizada", async function () {
            const learningPath = await brainSafes.getPersonalizedLearningPath(user1.address);
            expect(learningPath).to.be.an("array");
        });

        it("Debería detectar actividad fraudulenta", async function () {
            const activityHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("activity"));
            const isFraudulent = await brainSafes.detectFraudulentActivity(user1.address, activityHash);
            expect(typeof isFraudulent).to.equal("boolean");
        });

        it("Debería predecir rendimiento en lote", async function () {
            const students = [user1.address, user2.address];
            const courseIds = [1, 2];
            const predictions = await brainSafes.batchPredictPerformance(students, courseIds);
            expect(predictions).to.be.an("array");
        });
    });

    describe("Funciones de Becas", function () {
        beforeEach(async function () {
            await brainSafes.connect(user1).registerUser("Student", "student@example.com", "ipfs://student");
        });

        it("Debería aplicar para una beca", async function () {
            await brainSafes.connect(user1).applyForScholarship(
                ethers.utils.parseEther("1000"),
                "Financial need"
            );
            // Verificar que no hay error
            expect(true).to.be.true;
        });

        it("Debería evaluar elegibilidad de beca", async function () {
            const [score, eligible] = await brainSafes.evaluateScholarshipEligibility(user1.address);
            expect(score).to.be.a("bigint");
            expect(typeof eligible).to.equal("boolean");
        });
    });

    describe("Funciones de Logros", function () {
        it("Debería crear un logro", async function () {
            await brainSafes.connect(admin).createAchievement(
                "First Course",
                "Complete your first course",
                "ipfs://achievement",
                ethers.utils.parseEther("100"),
                ethers.utils.parseEther("50")
            );

            const achievement = await brainSafes.achievements(1);
            expect(achievement.name).to.equal("First Course");
            expect(achievement.isActive).to.be.true;
        });
    });

    describe("Funciones de Estadísticas", function () {
        beforeEach(async function () {
            await brainSafes.connect(user1).registerUser("Student", "student@example.com", "ipfs://student");
        });

        it("Debería obtener estadísticas de usuario", async function () {
            const stats = await brainSafes.getUserStatistics(user1.address);
            expect(stats.totalCourses).to.be.a("bigint");
            expect(stats.completedCourses).to.be.a("bigint");
            expect(stats.totalEarnings).to.be.a("bigint");
            expect(stats.reputation).to.be.a("bigint");
        });

        it("Debería obtener estadísticas de plataforma", async function () {
            const stats = await brainSafes.getPlatformStats();
            expect(stats.totalCourses).to.be.a("bigint");
            expect(stats.totalEnrollments).to.be.a("bigint");
            expect(stats.totalAchievements).to.be.a("bigint");
            expect(stats.totalUsers).to.be.a("bigint");
        });

        it("Debería obtener estadísticas de curso", async function () {
            // Crear un curso primero
            const skills = ["Solidity"];
            await brainSafes.connect(instructor).createCourse(
                "Test Course",
                "Test Description",
                "ipfs://content",
                ethers.utils.parseEther("50"),
                15,
                20,
                skills,
                2
            );

            const stats = await brainSafes.getCourseStatistics(1);
            expect(stats.totalStudents).to.be.a("bigint");
            expect(stats.completedStudents).to.be.a("bigint");
            expect(stats.totalEarnings).to.be.a("bigint");
            expect(stats.averageScore).to.be.a("bigint");
        });
    });

    describe("Funciones de Monitoreo", function () {
        it("Debería obtener métricas de salud del sistema", async function () {
            const health = await brainSafes.getSystemHealth();
            expect(health.gasUsage).to.be.a("bigint");
            expect(health.storageUsage).to.be.a("bigint");
            expect(health.activeUsers).to.be.a("bigint");
            expect(health.totalTransactions).to.be.a("bigint");
        });

        it("Debería monitorear rendimiento", async function () {
            const performance = await brainSafes.monitorPerformance();
            expect(performance).to.not.be.undefined;
        });

        it("Debería obtener rastro de auditoría", async function () {
            await brainSafes.connect(user1).registerUser("Student", "student@example.com", "ipfs://student");
            const auditTrail = await brainSafes.getAuditTrail(user1.address);
            expect(auditTrail).to.not.be.undefined;
        });
    });

    describe("Funciones de Administración", function () {
        it("Debería actualizar configuración de plataforma", async function () {
            await brainSafes.connect(admin).updatePlatformConfig(
                300, // platform fee
                8000, // instructor reward
                600, // student reward
                ethers.utils.parseEther("150"), // minimum stake
                60 // max courses
            );

            expect(await brainSafes.PLATFORM_FEE_PERCENTAGE()).to.equal(300);
            expect(await brainSafes.INSTRUCTOR_REWARD_PERCENTAGE()).to.equal(8000);
            expect(await brainSafes.STUDENT_REWARD_PERCENTAGE()).to.equal(600);
            expect(await brainSafes.MINIMUM_STAKE_AMOUNT()).to.equal(ethers.utils.parseEther("150"));
            expect(await brainSafes.MAX_COURSES_PER_INSTRUCTOR()).to.equal(60);
        });

        it("Debería pausar y despausar en emergencia", async function () {
            await brainSafes.connect(admin).emergencyPause("Emergency test");
            expect(await brainSafes.paused()).to.be.true;

            await brainSafes.connect(admin).emergencyUnpause();
            expect(await brainSafes.paused()).to.be.false;
        });

        it("Debería alternar integración de IA", async function () {
            const initialState = await brainSafes.aiIntegrationEnabled();
            await brainSafes.connect(admin).toggleAIIntegration();
            expect(await brainSafes.aiIntegrationEnabled()).to.equal(!initialState);
        });

        it("Debería actualizar reputación de usuario", async function () {
            await brainSafes.connect(user1).registerUser("Student", "student@example.com", "ipfs://student");
            await brainSafes.connect(admin).updateUserReputation(user1.address, 500);
            
            const profile = await brainSafes.getUserProfile(user1.address);
            expect(profile.reputation).to.equal(500);
        });
    });

    describe("Funciones de Optimización", function () {
        it("Debería optimizar almacenamiento", async function () {
            await brainSafes.connect(admin).optimizeStorage();
            // Verificar que no hay error
            expect(true).to.be.true;
        });

        it("Debería procesar operaciones en lote", async function () {
            const operations = [
                ethers.utils.toUtf8Bytes("operation1"),
                ethers.utils.toUtf8Bytes("operation2")
            ];
            await brainSafes.connect(admin).batchProcessOperations(operations);
            // Verificar que no hay error
            expect(true).to.be.true;
        });

        it("Debería comprimir datos de usuario", async function () {
            await brainSafes.connect(user1).registerUser("Student", "student@example.com", "ipfs://student");
            await brainSafes.connect(admin).compressUserData(user1.address);
            // Verificar que no hay error
            expect(true).to.be.true;
        });
    });

    describe("Funciones de Integración Externa", function () {
        it("Debería integrar con protocolos DeFi", async function () {
            const protocol = ethers.constants.AddressZero; // Mock address
            const action = "stake";
            const data = ethers.utils.toUtf8Bytes("stake data");
            
            await brainSafes.connect(admin).integrateWithDeFi(protocol, action, data);
            // Verificar que no hay error
            expect(true).to.be.true;
        });

        it("Debería hacer bridge de tokens", async function () {
            await mockEDUToken.mint(user1.address, ethers.utils.parseEther("100"));
            await mockEDUToken.connect(user1).approve(brainSafes.address, ethers.utils.parseEther("50"));
            
            await brainSafes.connect(user1).bridgeTokens(137, user2.address, ethers.utils.parseEther("50"));
            // Verificar que no hay error
            expect(true).to.be.true;
        });

        it("Debería ejecutar transacción cross-chain", async function () {
            const targetContract = ethers.constants.AddressZero; // Mock address
            const data = ethers.utils.toUtf8Bytes("cross-chain data");
            
            await brainSafes.connect(admin).executeCrossChainTx(137, targetContract, data);
            // Verificar que no hay error
            expect(true).to.be.true;
        });
    });

    describe("Funciones de Recuperación", function () {
        it("Debería ejecutar recuperación de emergencia", async function () {
            const target = ethers.constants.AddressZero; // Mock address
            const data = ethers.utils.toUtf8Bytes("recovery data");
            
            await brainSafes.connect(admin).emergencyRecovery(target, data);
            // Verificar que no hay error
            expect(true).to.be.true;
        });
    });

    describe("Verificación de Roles", function () {
        it("Debería verificar roles correctamente", async function () {
            expect(await brainSafes.isAdmin(admin.address)).to.be.true;
            expect(await brainSafes.isIssuer(instructor.address)).to.be.true;
            expect(await brainSafes.isValidator(user1.address)).to.be.false; // No tiene rol de estudiante aún
        });

        it("Debería otorgar y revocar roles admin", async function () {
            await brainSafes.grantAdmin(user1.address);
            expect(await brainSafes.isAdmin(user1.address)).to.be.true;

            await brainSafes.revokeAdmin(user1.address);
            expect(await brainSafes.isAdmin(user1.address)).to.be.false;
        });
    });
});
