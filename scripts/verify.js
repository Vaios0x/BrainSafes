const hre = require("hardhat");
const fs = require("fs");

async function main() {
    console.log("Iniciando verificación de contratos...");

    // Leer información del despliegue
    const network = hre.network.name;
    const deploymentPath = `./deployments/${network}.json`;
    
    if (!fs.existsSync(deploymentPath)) {
        throw new Error(`No se encontró información de despliegue para la red ${network}`);
    }

    const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
    const contracts = deployment.contracts;

    // Verificar AIProcessor (Stylus)
    console.log("\nVerificando AIProcessor...");
    try {
        await hre.run("stylus:verify", {
            address: contracts.AIProcessor,
            constructorArguments: []
        });
        console.log("✅ AIProcessor verificado");
    } catch (error) {
        console.error("❌ Error verificando AIProcessor:", error.message);
    }

    // Verificar AIOracle
    console.log("\nVerificando AIOracle...");
    try {
        await hre.run("verify:verify", {
            address: contracts.AIOracle,
            constructorArguments: [contracts.AIProcessor]
        });
        console.log("✅ AIOracle verificado");
    } catch (error) {
        console.error("❌ Error verificando AIOracle:", error.message);
    }

    // Verificar EDUToken
    console.log("\nVerificando EDUToken...");
    try {
        await hre.run("verify:verify", {
            address: contracts.EDUToken,
            constructorArguments: []
        });
        console.log("✅ EDUToken verificado");
    } catch (error) {
        console.error("❌ Error verificando EDUToken:", error.message);
    }

    // Verificar CourseNFT
    console.log("\nVerificando CourseNFT...");
    try {
        await hre.run("verify:verify", {
            address: contracts.CourseNFT,
            constructorArguments: []
        });
        console.log("✅ CourseNFT verificado");
    } catch (error) {
        console.error("❌ Error verificando CourseNFT:", error.message);
    }

    // Verificar CertificateNFT
    console.log("\nVerificando CertificateNFT...");
    try {
        await hre.run("verify:verify", {
            address: contracts.CertificateNFT,
            constructorArguments: []
        });
        console.log("✅ CertificateNFT verificado");
    } catch (error) {
        console.error("❌ Error verificando CertificateNFT:", error.message);
    }

    // Verificar ScholarshipManager
    console.log("\nVerificando ScholarshipManager...");
    try {
        await hre.run("verify:verify", {
            address: contracts.ScholarshipManager,
            constructorArguments: [
                contracts.EDUToken,
                contracts.AIOracle,
                deployment.deployer
            ]
        });
        console.log("✅ ScholarshipManager verificado");
    } catch (error) {
        console.error("❌ Error verificando ScholarshipManager:", error.message);
    }

    // Verificar BrainSafes
    console.log("\nVerificando BrainSafes...");
    try {
        await hre.run("verify:verify", {
            address: contracts.BrainSafes,
            constructorArguments: [
                contracts.EDUToken,
                contracts.CourseNFT,
                contracts.CertificateNFT,
                contracts.ScholarshipManager,
                contracts.AIOracle
            ]
        });
        console.log("✅ BrainSafes verificado");
    } catch (error) {
        console.error("❌ Error verificando BrainSafes:", error.message);
    }

    console.log("\n✅ Verificación completada");
    console.log("\nExplorer URLs:");
    const baseUrl = network === "arbitrumOne" 
        ? "https://arbiscan.io/address/" 
        : "https://sepolia.arbiscan.io/address/";

    Object.entries(contracts).forEach(([name, address]) => {
        console.log(`${name}: ${baseUrl}${address}`);
    });
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 