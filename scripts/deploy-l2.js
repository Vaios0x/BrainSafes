const hre = require("hardhat");
const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
    console.log("Iniciando despliegue en L2 (Arbitrum)...");

    // Obtener cuentas
    const [deployer] = await ethers.getSigners();
    console.log("Desplegando con la cuenta:", deployer.address);

    // Verificar red
    const network = await ethers.provider.getNetwork();
    console.log("Red:", network.name);

    // Cargar direcciones de L1
    const l1DeploymentPath = `./deployments/mainnet.json`;
    let l1Deployment;
    try {
        l1Deployment = require(l1DeploymentPath);
    } catch (error) {
        console.error("No se encontró información de despliegue de L1");
        process.exit(1);
    }

    // 1. Desplegar EDUToken en L2
    console.log("\nDesplegando EDUToken en L2...");
    const EDUToken = await ethers.getContractFactory("EDUToken");
    const eduToken = await EDUToken.deploy();
    await eduToken.deployed();
    console.log("EDUToken L2 desplegado en:", eduToken.address);

    // 2. Desplegar CourseNFT en L2
    console.log("\nDesplegando CourseNFT en L2...");
    const CourseNFT = await ethers.getContractFactory("CourseNFT");
    const courseNFT = await CourseNFT.deploy();
    await courseNFT.deployed();
    console.log("CourseNFT L2 desplegado en:", courseNFT.address);

    // 3. Desplegar CertificateNFT en L2
    console.log("\nDesplegando CertificateNFT en L2...");
    const CertificateNFT = await ethers.getContractFactory("CertificateNFT");
    const certificateNFT = await CertificateNFT.deploy();
    await certificateNFT.deployed();
    console.log("CertificateNFT L2 desplegado en:", certificateNFT.address);

    // 4. Desplegar AIProcessor (Stylus)
    console.log("\nDesplegando AIProcessor...");
    const AIProcessor = await ethers.getContractFactory("AIProcessor");
    const aiProcessor = await AIProcessor.deploy();
    await aiProcessor.deployed();
    console.log("AIProcessor desplegado en:", aiProcessor.address);

    // 5. Desplegar AIOracle
    console.log("\nDesplegando AIOracle...");
    const AIOracle = await ethers.getContractFactory("AIOracle");
    const aiOracle = await AIOracle.deploy(aiProcessor.address);
    await aiOracle.deployed();
    console.log("AIOracle desplegado en:", aiOracle.address);

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

    // 7. Desplegar BrainSafesL2
    console.log("\nDesplegando BrainSafesL2...");
    const BrainSafesL2 = await ethers.getContractFactory("BrainSafesL2");
    const brainSafesL2 = await BrainSafesL2.deploy(
        l1Deployment.contracts.BrainSafes,
        l1Deployment.contracts.BrainSafesBridge,
        eduToken.address,
        courseNFT.address,
        certificateNFT.address,
        scholarshipManager.address,
        aiOracle.address
    );
    await brainSafesL2.deployed();
    console.log("BrainSafesL2 desplegado en:", brainSafesL2.address);

    // 8. Configurar roles y permisos
    console.log("\nConfigurando roles y permisos...");

    // Roles para EDUToken
    const MINTER_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("MINTER_ROLE"));
    await eduToken.grantRole(MINTER_ROLE, brainSafesL2.address);
    await eduToken.grantRole(MINTER_ROLE, scholarshipManager.address);

    // Roles para NFTs
    await courseNFT.grantRole(MINTER_ROLE, brainSafesL2.address);
    await certificateNFT.grantRole(MINTER_ROLE, brainSafesL2.address);

    // 9. Verificar contratos
    if (process.env.ETHERSCAN_VERIFICATION === "true") {
        console.log("\nVerificando contratos...");

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
            address: aiProcessor.address,
            constructorArguments: []
        });

        await hre.run("verify:verify", {
            address: aiOracle.address,
            constructorArguments: [aiProcessor.address]
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
            address: brainSafesL2.address,
            constructorArguments: [
                l1Deployment.contracts.BrainSafes,
                l1Deployment.contracts.BrainSafesBridge,
                eduToken.address,
                courseNFT.address,
                certificateNFT.address,
                scholarshipManager.address,
                aiOracle.address
            ]
        });
    }

    // 10. Guardar direcciones
    const l2Deployment = {
        network: network.name,
        l1Contracts: l1Deployment.contracts,
        contracts: {
            EDUToken: eduToken.address,
            CourseNFT: courseNFT.address,
            CertificateNFT: certificateNFT.address,
            AIProcessor: aiProcessor.address,
            AIOracle: aiOracle.address,
            ScholarshipManager: scholarshipManager.address,
            BrainSafesL2: brainSafesL2.address
        },
        timestamp: new Date().toISOString()
    };

    const l2DeploymentPath = `./deployments/${network.name}.json`;
    fs.writeFileSync(l2DeploymentPath, JSON.stringify(l2Deployment, null, 2));
    console.log("\nDirecciones guardadas en:", l2DeploymentPath);

    // 11. Instrucciones post-despliegue
    console.log("\nPróximos pasos:");
    console.log("1. Actualizar dirección de L2 en el bridge:");
    console.log(`   await bridge.updateL2Contract("${brainSafesL2.address}")`);
    console.log("2. Verificar configuración del bridge");
    console.log("3. Inicializar AIProcessor con modelos");
    console.log("4. Configurar límites y parámetros del sistema");

    console.log("\n¡Despliegue en L2 completado exitosamente!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 