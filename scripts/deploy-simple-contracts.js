const { ethers, network } = require("hardhat");

async function main() {
    console.log("🚀 Deploying BrainSafes SIMPLE contracts to", network.name);
    
    const [deployer] = await ethers.getSigners();
    console.log("📋 Deploying contracts with account:", deployer.address);
    
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");
    
    const deployments = {};
    
    try {
        // 1. Deploy Simple EDU Token
        console.log("\n1️⃣ Deploying Simple EDU Token...");
        const SimpleEDUToken = await ethers.getContractFactory("SimpleEDUToken");
        const simpleEDUToken = await SimpleEDUToken.deploy();
        await simpleEDUToken.waitForDeployment();
        deployments.SimpleEDUToken = await simpleEDUToken.getAddress();
        console.log("✅ Simple EDU Token deployed to:", deployments.SimpleEDUToken);
        
        // 2. Deploy Simple Certificate NFT
        console.log("\n2️⃣ Deploying Simple Certificate NFT...");
        const SimpleCertificateNFT = await ethers.getContractFactory("SimpleCertificateNFT");
        const simpleCertificateNFT = await SimpleCertificateNFT.deploy();
        await simpleCertificateNFT.waitForDeployment();
        deployments.SimpleCertificateNFT = await simpleCertificateNFT.getAddress();
        console.log("✅ Simple Certificate NFT deployed to:", deployments.SimpleCertificateNFT);
        
        // 3. Deploy Simple Course NFT
        console.log("\n3️⃣ Deploying Simple Course NFT...");
        const SimpleCourseNFT = await ethers.getContractFactory("SimpleCourseNFT");
        const simpleCourseNFT = await SimpleCourseNFT.deploy();
        await simpleCourseNFT.waitForDeployment();
        deployments.SimpleCourseNFT = await simpleCourseNFT.getAddress();
        console.log("✅ Simple Course NFT deployed to:", deployments.SimpleCourseNFT);
        
        // 4. Deploy Simple AI Oracle
        console.log("\n4️⃣ Deploying Simple AI Oracle...");
        const SimpleAIOracle = await ethers.getContractFactory("SimpleAIOracle");
        const simpleAIOracle = await SimpleAIOracle.deploy();
        await simpleAIOracle.waitForDeployment();
        deployments.SimpleAIOracle = await simpleAIOracle.getAddress();
        console.log("✅ Simple AI Oracle deployed to:", deployments.SimpleAIOracle);

        // 5. Deploy Simple Job Marketplace
        console.log("\n5️⃣ Deploying Simple Job Marketplace...");
        const SimpleJobMarketplace = await ethers.getContractFactory("SimpleJobMarketplace");
        const simpleJobMarketplace = await SimpleJobMarketplace.deploy(deployments.SimpleEDUToken);
        await simpleJobMarketplace.waitForDeployment();
        deployments.SimpleJobMarketplace = await simpleJobMarketplace.getAddress();
        console.log("✅ Simple Job Marketplace deployed to:", deployments.SimpleJobMarketplace);
        
        // 6. Set up initial permissions
        console.log("\n6️⃣ Setting up initial permissions...");
        
        // Grant INSTRUCTOR role to deployer for Course NFT
        const INSTRUCTOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("INSTRUCTOR_ROLE"));
        await simpleCourseNFT.grantRole(INSTRUCTOR_ROLE, deployer.address);
        console.log("✅ Granted INSTRUCTOR role to deployer");
        
        // Grant MINTER role to Job Marketplace for EDU Token
        const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
        await simpleEDUToken.grantRole(MINTER_ROLE, deployments.SimpleJobMarketplace);
        console.log("✅ Granted MINTER role to Job Marketplace");
        
        // Grant AI_PROCESSOR role to deployer for AI Oracle
        const AI_PROCESSOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("AI_PROCESSOR_ROLE"));
        await simpleAIOracle.grantRole(AI_PROCESSOR_ROLE, deployer.address);
        console.log("✅ Granted AI_PROCESSOR role to deployer");
        
        // Save deployment addresses
        const fs = require('fs');
        const deploymentData = {
            network: network.name,
            chainId: network.config.chainId,
            deployer: deployer.address,
            timestamp: new Date().toISOString(),
            contracts: deployments,
            contractInterfaces: {
                SimpleEDUToken: "ERC20 token for BrainSafes platform",
                SimpleCertificateNFT: "NFT for course certificates",
                SimpleCourseNFT: "NFT representing courses",
                SimpleAIOracle: "AI Oracle for skill assessment and job matching",
                SimpleJobMarketplace: "Marketplace for freelance jobs"
            }
        };
        
        fs.writeFileSync(
            `deployments-simple-${network.name}.json`,
            JSON.stringify(deploymentData, null, 2)
        );
        
        console.log("\n🎉 All simple contracts deployed successfully!");
        console.log("📄 Deployment data saved to:", `deployments-simple-${network.name}.json`);
        
        // Contract addresses summary
        console.log("\n📋 Contract Addresses Summary:");
        console.log("================================================");
        Object.entries(deployments).forEach(([name, address]) => {
            console.log(`${name.padEnd(25)} : ${address}`);
        });
        
        console.log("\n🔧 Setup Summary:");
        console.log("- EDU Token initial supply: 1,000,000 EDU");
        console.log("- Job Marketplace can mint EDU tokens for rewards");
        console.log("- Deployer has INSTRUCTOR role for creating courses");
        console.log("- Deployer has VERIFIER role for issuing certificates");
        
        console.log("\n🌐 Network Info:");
        console.log(`- Network: ${network.name}`);
        console.log(`- Chain ID: ${network.config.chainId}`);
        console.log(`- Deployer: ${deployer.address}`);
        
        return deployments;
        
    } catch (error) {
        console.error("❌ Deployment failed:", error);
        throw error;
    }
}

if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = main;