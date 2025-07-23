const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
    console.log("Iniciando despliegue de BrainSafes...");

    // Obtener cuentas
    const [deployer] = await ethers.getSigners();
    console.log("Desplegando con la cuenta:", deployer.address);

    // 1. Desplegar AIProcessor (Stylus)
    console.log("\nDesplegando AIProcessor...");
    const AIProcessor = await ethers.getContractFactory("AIProcessor");
    const aiProcessor = await AIProcessor.deploy();
    await aiProcessor.deployed();
    console.log("AIProcessor desplegado en:", aiProcessor.address);

    // 2. Desplegar AIOracle
    console.log("\nDesplegando AIOracle...");
    const AIOracle = await ethers.getContractFactory("AIOracle");
    const aiOracle = await AIOracle.deploy(aiProcessor.address);
    await aiOracle.deployed();
    console.log("AIOracle desplegado en:", aiOracle.address);

    // 3. Desplegar EDUToken
    console.log("\nDesplegando EDUToken...");
    const EDUToken = await ethers.getContractFactory("EDUToken");
    const eduToken = await EDUToken.deploy();
    await eduToken.deployed();
    console.log("EDUToken desplegado en:", eduToken.address);

    // 4. Desplegar CourseNFT
    console.log("\nDesplegando CourseNFT...");
    const CourseNFT = await ethers.getContractFactory("CourseNFT");
    const courseNFT = await CourseNFT.deploy();
    await courseNFT.deployed();
    console.log("CourseNFT desplegado en:", courseNFT.address);

    // 5. Desplegar CertificateNFT
    console.log("\nDesplegando CertificateNFT...");
    const CertificateNFT = await ethers.getContractFactory("CertificateNFT");
    const certificateNFT = await CertificateNFT.deploy();
    await certificateNFT.deployed();
    console.log("CertificateNFT desplegado en:", certificateNFT.address);

    // 6. Desplegar ScholarshipManager
    console.log("\nDesplegando ScholarshipManager...");
    const ScholarshipManager = await ethers.getContractFactory("ScholarshipManager");
    const scholarshipManager = await ScholarshipManager.deploy(
        eduToken.address,
        aiOracle.address,
        deployer.address
    );
    await scholarshipManager.deployed();
    console.log("ScholarshipManager desplegado en:", scholarshipManager.address);

    // 7. Desplegar BrainSafes
    console.log("\nDesplegando BrainSafes...");
    const BrainSafes = await ethers.getContractFactory("BrainSafes");
    const brainSafes = await BrainSafes.deploy(
        eduToken.address,
        courseNFT.address,
        certificateNFT.address,
        scholarshipManager.address,
        aiOracle.address
    );
    await brainSafes.deployed();
    console.log("BrainSafes desplegado en:", brainSafes.address);

    // 8. Configurar roles y permisos
    console.log("\nConfigurando roles y permisos...");
    
    // Otorgar roles en EDUToken
    const MINTER_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("MINTER_ROLE"));
    await eduToken.grantRole(MINTER_ROLE, brainSafes.address);
    await eduToken.grantRole(MINTER_ROLE, scholarshipManager.address);
    
    // Otorgar roles en CourseNFT
    await courseNFT.grantRole(MINTER_ROLE, brainSafes.address);
    
    // Otorgar roles en CertificateNFT
    await certificateNFT.grantRole(MINTER_ROLE, brainSafes.address);

    // 9. Verificar contratos
    if (process.env.ETHERSCAN_VERIFICATION === "true") {
        console.log("\nVerificando contratos...");
        
        await hre.run("verify:verify", {
            address: aiProcessor.address,
            constructorArguments: []
        });

        await hre.run("verify:verify", {
            address: aiOracle.address,
            constructorArguments: [aiProcessor.address]
        });

        await hre.run("verify:verify", {
            address: eduToken.address,
            constructorArguments: []
        });

        await hre.run("verify:verify", {
            address: courseNFT.address,
            constructorArguments: []
        });

        await hre.run("verify:verify", {
            address: certificateNFT.address,
            constructorArguments: []
        });

        await hre.run("verify:verify", {
            address: scholarshipManager.address,
            constructorArguments: [
                eduToken.address,
                aiOracle.address,
                deployer.address
            ]
        });

        await hre.run("verify:verify", {
            address: brainSafes.address,
            constructorArguments: [
                eduToken.address,
                courseNFT.address,
                certificateNFT.address,
                scholarshipManager.address,
                aiOracle.address
            ]
        });
    }

    // 10. Guardar direcciones desplegadas
    const deploymentInfo = {
        network: hre.network.name,
        contracts: {
            AIProcessor: aiProcessor.address,
            AIOracle: aiOracle.address,
            EDUToken: eduToken.address,
            CourseNFT: courseNFT.address,
            CertificateNFT: certificateNFT.address,
            ScholarshipManager: scholarshipManager.address,
            BrainSafes: brainSafes.address
        },
        timestamp: new Date().toISOString()
    };

    const fs = require("fs");
    const deploymentPath = `./deployments/${hre.network.name}.json`;
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
    console.log(`\nInformación del despliegue guardada en ${deploymentPath}`);

    console.log("\n¡Despliegue completado exitosamente!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 