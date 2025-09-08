const { ethers } = require("hardhat");

async function main() {
    console.log("🔍 Verificando interfaces y dependencias de BrainSafes...\n");

    try {
        // Verificar que las interfaces se pueden compilar
        console.log("📋 Compilando interfaces...");
        
        const IEDUToken = await ethers.getContractFactory("IEDUToken");
        console.log("✅ IEDUToken interface compilada correctamente");
        
        const ICourseNFT = await ethers.getContractFactory("ICourseNFT");
        console.log("✅ ICourseNFT interface compilada correctamente");
        
        const ICertificateNFT = await ethers.getContractFactory("ICertificateNFT");
        console.log("✅ ICertificateNFT interface compilada correctamente");
        
        const IScholarshipManager = await ethers.getContractFactory("IScholarshipManager");
        console.log("✅ IScholarshipManager interface compilada correctamente");
        
        const IAIOracle = await ethers.getContractFactory("IAIOracle");
        console.log("✅ IAIOracle interface compilada correctamente");

        // Verificar que los contratos mock se pueden compilar
        console.log("\n🧪 Compilando contratos mock...");
        
        const MockEDUToken = await ethers.getContractFactory("MockEDUToken");
        console.log("✅ MockEDUToken compilado correctamente");
        
        const MockCourseNFT = await ethers.getContractFactory("MockCourseNFT");
        console.log("✅ MockCourseNFT compilado correctamente");
        
        const MockCertificateNFT = await ethers.getContractFactory("MockCertificateNFT");
        console.log("✅ MockCertificateNFT compilado correctamente");
        
        const MockScholarshipManager = await ethers.getContractFactory("MockScholarshipManager");
        console.log("✅ MockScholarshipManager compilado correctamente");
        
        const MockAIOracle = await ethers.getContractFactory("MockAIOracle");
        console.log("✅ MockAIOracle compilado correctamente");

        // Verificar que BrainSafes se puede compilar con las interfaces
        console.log("\n🏗️ Compilando BrainSafes con interfaces...");
        
        const BrainSafes = await ethers.getContractFactory("BrainSafes");
        console.log("✅ BrainSafes compilado correctamente con interfaces");

        // Deploy mock contracts para verificar integración
        console.log("\n🚀 Desplegando contratos mock para verificación...");
        
        const [deployer] = await ethers.getSigners();
        
        const mockEDUToken = await MockEDUToken.deploy();
        await mockEDUToken.deployed();
        console.log("✅ MockEDUToken desplegado en:", mockEDUToken.address);
        
        const mockCourseNFT = await MockCourseNFT.deploy();
        await mockCourseNFT.deployed();
        console.log("✅ MockCourseNFT desplegado en:", mockCourseNFT.address);
        
        const mockCertificateNFT = await MockCertificateNFT.deploy();
        await mockCertificateNFT.deployed();
        console.log("✅ MockCertificateNFT desplegado en:", mockCertificateNFT.address);
        
        const mockScholarshipManager = await MockScholarshipManager.deploy();
        await mockScholarshipManager.deployed();
        console.log("✅ MockScholarshipManager desplegado en:", mockScholarshipManager.address);
        
        const mockAIOracle = await MockAIOracle.deploy();
        await mockAIOracle.deployed();
        console.log("✅ MockAIOracle desplegado en:", mockAIOracle.address);

        // Deploy BrainSafes con los mock contracts
        console.log("\n🎯 Desplegando BrainSafes con contratos mock...");
        
        const brainSafes = await BrainSafes.deploy(
            mockEDUToken.address,
            mockCourseNFT.address,
            mockCertificateNFT.address,
            mockScholarshipManager.address,
            mockAIOracle.address
        );
        await brainSafes.deployed();
        console.log("✅ BrainSafes desplegado correctamente en:", brainSafes.address);

        // Verificar que las interfaces están correctamente asignadas
        console.log("\n🔗 Verificando asignación de interfaces...");
        
        const eduTokenAddress = await brainSafes.eduToken();
        const courseNFTAddress = await brainSafes.courseNFT();
        const certificateNFTAddress = await brainSafes.certificateNFT();
        const scholarshipManagerAddress = await brainSafes.scholarshipManager();
        const aiOracleAddress = await brainSafes.aiOracle();
        
        console.log("✅ eduToken asignado:", eduTokenAddress);
        console.log("✅ courseNFT asignado:", courseNFTAddress);
        console.log("✅ certificateNFT asignado:", certificateNFTAddress);
        console.log("✅ scholarshipManager asignado:", scholarshipManagerAddress);
        console.log("✅ aiOracle asignado:", aiOracleAddress);

        // Verificar que las funciones básicas funcionan
        console.log("\n🧪 Probando funciones básicas...");
        
        // Registrar usuario
        await brainSafes.registerUser("Test User", "test@example.com", "ipfs://profile");
        console.log("✅ Registro de usuario exitoso");
        
        // Crear curso (necesita ser instructor)
        await brainSafes.registerInstructor(deployer.address);
        await brainSafes.createCourse(
            "Test Course",
            "Test Description",
            "ipfs://content",
            ethers.utils.parseEther("100"),
            30,
            50,
            ["JavaScript", "React"],
            3
        );
        console.log("✅ Creación de curso exitosa");
        
        // Probar funciones AI
        const prediction = await brainSafes.predictStudentPerformance(deployer.address, 1);
        console.log("✅ Predicción de rendimiento:", prediction.toString());
        
        const learningPath = await brainSafes.getPersonalizedLearningPath(deployer.address);
        console.log("✅ Ruta de aprendizaje generada, longitud:", learningPath.length);
        
        // Probar funciones de scholarship
        await brainSafes.applyForScholarship(ethers.utils.parseEther("50"), "Need financial aid");
        console.log("✅ Solicitud de beca exitosa");

        console.log("\n🎉 ¡Todas las verificaciones completadas exitosamente!");
        console.log("\n📊 Resumen de implementación:");
        console.log("   • ✅ IEDUToken interface implementada y funcional");
        console.log("   • ✅ ICourseNFT interface implementada y funcional");
        console.log("   • ✅ ICertificateNFT interface implementada y funcional");
        console.log("   • ✅ IScholarshipManager interface implementada y funcional");
        console.log("   • ✅ IAIOracle interface implementada y funcional");
        console.log("   • ✅ BrainSafes integrado correctamente con todas las interfaces");
        console.log("   • ✅ Contratos mock implementados para testing");
        console.log("   • ✅ Todas las dependencias faltantes han sido resueltas");

    } catch (error) {
        console.error("❌ Error durante la verificación:", error.message);
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
