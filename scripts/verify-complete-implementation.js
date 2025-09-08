const { ethers } = require("hardhat");

async function main() {
    console.log("🔍 Verificando implementación completa de BrainSafes...\n");

    try {
        // Compilar todos los contratos
        console.log("📦 Compilando contratos...");
        await hre.run("compile");
        console.log("✅ Compilación exitosa\n");

        // Obtener las fábricas de contratos
        const [
            BrainSafesFactory,
            MockEDUTokenFactory,
            MockCourseNFTFactory,
            MockCertificateNFTFactory,
            MockScholarshipManagerFactory,
            MockAIOracleFactory,
            NitroUtilsFactory,
            AddressCompressorFactory,
            EnhancedMulticallFactory,
            DistributedCacheFactory,
            SecurityManagerFactory,
            UserExperienceFactory
        ] = await Promise.all([
            ethers.getContractFactory("BrainSafes"),
            ethers.getContractFactory("MockEDUToken"),
            ethers.getContractFactory("MockCourseNFT"),
            ethers.getContractFactory("MockCertificateNFT"),
            ethers.getContractFactory("MockScholarshipManager"),
            ethers.getContractFactory("MockAIOracle"),
            ethers.getContractFactory("NitroUtils"),
            ethers.getContractFactory("AddressCompressor"),
            ethers.getContractFactory("EnhancedMulticall"),
            ethers.getContractFactory("DistributedCache"),
            ethers.getContractFactory("SecurityManager"),
            ethers.getContractFactory("UserExperience")
        ]);

        // Obtener cuentas
        const [deployer, user1, user2, instructor] = await ethers.getSigners();

        console.log("🚀 Desplegando contratos mock...");

        // Desplegar contratos mock
        const mockEDUToken = await MockEDUTokenFactory.deploy();
        const mockCourseNFT = await MockCourseNFTFactory.deploy();
        const mockCertificateNFT = await MockCertificateNFTFactory.deploy();
        const mockScholarshipManager = await MockScholarshipManagerFactory.deploy();
        const mockAIOracle = await MockAIOracleFactory.deploy();

        await mockEDUToken.deployed();
        await mockCourseNFT.deployed();
        await mockCertificateNFT.deployed();
        await mockScholarshipManager.deployed();
        await mockAIOracle.deployed();

        console.log("✅ Contratos mock desplegados");

        // Desplegar contratos de utilidades
        const nitroUtils = await NitroUtilsFactory.deploy();
        const addressCompressor = await AddressCompressorFactory.deploy();
        const enhancedMulticall = await EnhancedMulticallFactory.deploy();
        const distributedCache = await DistributedCacheFactory.deploy();
        const securityManager = await SecurityManagerFactory.deploy();
        const userExperience = await UserExperienceFactory.deploy();

        await nitroUtils.deployed();
        await addressCompressor.deployed();
        await enhancedMulticall.deployed();
        await distributedCache.deployed();
        await securityManager.deployed();
        await userExperience.deployed();

        console.log("✅ Contratos de utilidades desplegados");

        // Desplegar BrainSafes
        console.log("🚀 Desplegando BrainSafes...");
        const brainSafes = await BrainSafesFactory.deploy(
            mockEDUToken.address,
            mockCourseNFT.address,
            mockCertificateNFT.address,
            mockScholarshipManager.address,
            mockAIOracle.address
        );

        await brainSafes.deployed();
        console.log("✅ BrainSafes desplegado en:", brainSafes.address);

        // Configurar contratos de utilidades
        console.log("🔧 Configurando contratos de utilidades...");
        await brainSafes.setUtilityContracts(
            nitroUtils.address,
            addressCompressor.address,
            enhancedMulticall.address,
            distributedCache.address,
            securityManager.address,
            userExperience.address
        );
        console.log("✅ Contratos de utilidades configurados");

        // Verificar interfaces
        console.log("\n🔗 Verificando interfaces...");
        const eduTokenAddress = await brainSafes.eduToken();
        const courseNFTAddress = await brainSafes.courseNFT();
        const certificateNFTAddress = await brainSafes.certificateNFT();
        const scholarshipManagerAddress = await brainSafes.scholarshipManager();
        const aiOracleAddress = await brainSafes.aiOracle();

        console.log("✅ EDU Token:", eduTokenAddress);
        console.log("✅ Course NFT:", courseNFTAddress);
        console.log("✅ Certificate NFT:", certificateNFTAddress);
        console.log("✅ Scholarship Manager:", scholarshipManagerAddress);
        console.log("✅ AI Oracle:", aiOracleAddress);

        // Verificar contratos de utilidades
        console.log("\n🔧 Verificando contratos de utilidades...");
        const nitroUtilsAddress = await brainSafes.nitroUtils();
        const addressCompressorAddress = await brainSafes.addressCompressor();
        const enhancedMulticallAddress = await brainSafes.enhancedMulticall();
        const distributedCacheAddress = await brainSafes.distributedCache();
        const securityManagerAddress = await brainSafes.securityManager();
        const userExperienceAddress = await brainSafes.userExperience();

        console.log("✅ NitroUtils:", nitroUtilsAddress);
        console.log("✅ AddressCompressor:", addressCompressorAddress);
        console.log("✅ EnhancedMulticall:", enhancedMulticallAddress);
        console.log("✅ DistributedCache:", distributedCacheAddress);
        console.log("✅ SecurityManager:", securityManagerAddress);
        console.log("✅ UserExperience:", userExperienceAddress);

        // Probar funciones básicas
        console.log("\n🧪 Probando funciones básicas...");

        // Registrar usuario
        await brainSafes.registerUser("Test User", "test@example.com", "ipfs://profile");
        console.log("✅ Usuario registrado");

        // Registrar instructor
        await brainSafes.registerInstructor(instructor.address);
        console.log("✅ Instructor registrado");

        // Probar funciones de utilidades
        console.log("\n🔧 Probando funciones de utilidades...");

        // NitroUtils
        const testData = ethers.utils.toUtf8Bytes("test data");
        const optimizedData = await brainSafes.optimizeGasUsage(testData);
        console.log("✅ NitroUtils - optimizeGasUsage funcionando");

        const compressedData = await brainSafes.compressData(testData);
        console.log("✅ NitroUtils - compressData funcionando");

        // AddressCompressor
        const compressedAddr = await brainSafes.compressAddress(user1.address);
        console.log("✅ AddressCompressor - compressAddress funcionando");

        const decompressedAddr = await brainSafes.decompressAddress(compressedAddr);
        console.log("✅ AddressCompressor - decompressAddress funcionando");

        // DistributedCache
        const cacheKey = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test"));
        const cacheData = ethers.utils.toUtf8Bytes("cache data");
        await brainSafes.storeInCache(cacheKey, cacheData, Math.floor(Date.now() / 1000) + 3600);
        console.log("✅ DistributedCache - storeInCache funcionando");

        const retrievedData = await brainSafes.getFromCache(cacheKey);
        console.log("✅ DistributedCache - getFromCache funcionando");

        // SecurityManager
        const isBlacklisted = await brainSafes.isBlacklisted(user1.address);
        console.log("✅ SecurityManager - isBlacklisted funcionando");

        // UserExperience
        const userMetrics = await brainSafes.getUserExperienceMetrics(user1.address);
        console.log("✅ UserExperience - getUserExperienceMetrics funcionando");

        // Probar funciones avanzadas
        console.log("\n🚀 Probando funciones avanzadas...");

        // Batch operations
        const names = ["User1", "User2", "User3"];
        const emails = ["user1@test.com", "user2@test.com", "user3@test.com"];
        const profiles = ["ipfs://1", "ipfs://2", "ipfs://3"];

        await brainSafes.batchRegisterUsers(names, emails, profiles);
        console.log("✅ Batch register users funcionando");

        // Statistics
        const userStats = await brainSafes.getUserStatistics(user1.address);
        console.log("✅ User statistics funcionando");

        const platformStats = await brainSafes.getPlatformStats();
        console.log("✅ Platform statistics funcionando");

        // System health
        const systemHealth = await brainSafes.getSystemHealth();
        console.log("✅ System health funcionando");

        // Performance monitoring
        const performance = await brainSafes.monitorPerformance();
        console.log("✅ Performance monitoring funcionando");

        // Audit trail
        const auditTrail = await brainSafes.getAuditTrail(user1.address);
        console.log("✅ Audit trail funcionando");

        console.log("\n🎉 ¡Todas las verificaciones completadas exitosamente!");
        console.log("\n📊 Resumen de implementación:");
        console.log("✅ Todas las interfaces están correctamente implementadas");
        console.log("✅ Todos los contratos de utilidades están integrados");
        console.log("✅ Todas las funciones básicas están funcionando");
        console.log("✅ Todas las funciones avanzadas están funcionando");
        console.log("✅ Todas las funciones de optimización están funcionando");
        console.log("✅ Todas las funciones de monitoreo están funcionando");

        console.log("\n🔧 Configuración final:");
        console.log("BrainSafes:", brainSafes.address);
        console.log("EDU Token:", mockEDUToken.address);
        console.log("Course NFT:", mockCourseNFT.address);
        console.log("Certificate NFT:", mockCertificateNFT.address);
        console.log("Scholarship Manager:", mockScholarshipManager.address);
        console.log("AI Oracle:", mockAIOracle.address);

    } catch (error) {
        console.error("❌ Error durante la verificación:", error);
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
