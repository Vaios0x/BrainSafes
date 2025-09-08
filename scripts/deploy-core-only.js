const { ethers, network } = require("hardhat");

async function main() {
    console.log("🚀 Deploying BrainSafes CORE contracts only to", network.name);
    
    const [deployer] = await ethers.getSigners();
    console.log("📋 Deploying contracts with account:", deployer.address);
    
    const balance = await deployer.getBalance();
    console.log("💰 Account balance:", ethers.utils.formatEther(balance), "ETH");
    
    // Deploy only the most essential contracts that compile cleanly
    const deployments = {};
    
    try {
        // 1. Deploy Certificate NFT (standalone)
        console.log("\n1️⃣ Deploying Certificate NFT...");
        const CertificateNFT = await ethers.getContractFactory("contracts/tokens/CertificateNFT.sol:CertificateNFT");
        const certificateNFT = await CertificateNFT.deploy();
        await certificateNFT.deployed();
        deployments.CertificateNFT = certificateNFT.address;
        console.log("✅ Certificate NFT deployed to:", certificateNFT.address);
        
    } catch (error) {
        console.error("❌ Deployment failed:", error.message);
        
        // Try alternative deployments
        console.log("\n🔄 Trying individual contract compilations...");
        
        // Check what contracts can actually compile
        const contractsToTry = [
            "CertificateNFT",
            "BadgeNFT", 
            "AchievementNFT"
        ];
        
        for (const contractName of contractsToTry) {
            try {
                console.log(`\n🧪 Testing ${contractName}...`);
                const ContractFactory = await ethers.getContractFactory(contractName);
                console.log(`✅ ${contractName} compiles successfully`);
            } catch (err) {
                console.log(`❌ ${contractName} compilation failed: ${err.message.split('\n')[0]}`);
            }
        }
        
        process.exit(1);
    }
    
    // Save deployment addresses
    const fs = require('fs');
    const deploymentData = {
        network: network.name,
        chainId: network.config.chainId,
        deployer: deployer.address,
        timestamp: new Date().toISOString(),
        contracts: deployments
    };
    
    fs.writeFileSync(
        `deployments-core-${network.name}.json`,
        JSON.stringify(deploymentData, null, 2)
    );
    
    console.log("\n🎉 Core contracts deployed successfully!");
    console.log("📄 Deployment data saved to:", `deployments-core-${network.name}.json`);
    
    // Contract addresses summary
    console.log("\n📋 Contract Addresses Summary:");
    Object.entries(deployments).forEach(([name, address]) => {
        console.log(`   ${name}: ${address}`);
    });
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });