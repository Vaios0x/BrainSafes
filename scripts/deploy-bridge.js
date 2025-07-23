const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
    console.log("Iniciando despliegue del Bridge...");

    // Obtener cuentas
    const [deployer] = await ethers.getSigners();
    console.log("Desplegando con la cuenta:", deployer.address);

    // Verificar red
    const network = await ethers.provider.getNetwork();
    console.log("Red:", network.name);

    // Cargar direcciones existentes
    const deploymentPath = `./deployments/${network.name}.json`;
    let deployment;
    try {
        deployment = require(deploymentPath);
    } catch (error) {
        console.error("No se encontró información de despliegue previa");
        process.exit(1);
    }

    // Desplegar BrainSafesBridge
    console.log("\nDesplegando BrainSafesBridge...");
    const BrainSafesBridge = await ethers.getContractFactory("BrainSafesBridge");
    const bridge = await BrainSafesBridge.deploy(
        deployment.contracts.BrainSafes, // L1 BrainSafes
        deployment.contracts.BrainSafes, // L2 BrainSafes (actualizar después)
        deployment.contracts.EDUToken,
        deployment.contracts.CertificateNFT
    );
    await bridge.deployed();
    console.log("BrainSafesBridge desplegado en:", bridge.address);

    // Configurar roles
    console.log("\nConfigurando roles...");
    const BRIDGE_OPERATOR = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("BRIDGE_OPERATOR"));
    await bridge.grantOperator(deployer.address);
    console.log("Rol BRIDGE_OPERATOR otorgado a:", deployer.address);

    // Verificar contrato
    if (process.env.ETHERSCAN_VERIFICATION === "true") {
        console.log("\nVerificando contrato...");
        await hre.run("verify:verify", {
            address: bridge.address,
            constructorArguments: [
                deployment.contracts.BrainSafes,
                deployment.contracts.BrainSafes,
                deployment.contracts.EDUToken,
                deployment.contracts.CertificateNFT
            ]
        });
    }

    // Guardar dirección del bridge
    deployment.contracts.BrainSafesBridge = bridge.address;
    const fs = require("fs");
    fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));
    console.log("\nDirección del bridge guardada en:", deploymentPath);

    // Instrucciones post-despliegue
    console.log("\nPróximos pasos:");
    console.log("1. Actualizar dirección del contrato L2 BrainSafes:");
    console.log(`   await bridge.updateL2Contract("DIRECCIÓN_L2_BRAINSAFES")`);
    console.log("2. Configurar permisos en EDUToken:");
    console.log(`   await eduToken.grantRole(MINTER_ROLE, "${bridge.address}")`);
    console.log("3. Configurar permisos en CertificateNFT:");
    console.log(`   await certificateNFT.grantRole(MINTER_ROLE, "${bridge.address}")`);
    console.log("4. Verificar configuración:");
    console.log(`   - L1 BrainSafes: ${await bridge.l1BrainSafes()}`);
    console.log(`   - L2 BrainSafes: ${await bridge.l2BrainSafes()}`);
    console.log(`   - EDU Token: ${await bridge.eduToken()}`);
    console.log(`   - Certificate NFT: ${await bridge.certificateNFT()}`);

    console.log("\n¡Despliegue completado exitosamente!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 