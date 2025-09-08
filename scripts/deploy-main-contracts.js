const { ethers, network } = require("hardhat");

async function main() {
    console.log("🚀 Deploying BrainSafes main contracts to", network.name);
    
    const [deployer] = await ethers.getSigners();
    console.log("📋 Deploying contracts with account:", deployer.address);
    
    const balance = await deployer.getBalance();
    console.log("💰 Account balance:", ethers.utils.formatEther(balance), "ETH");
    
    // Deploy core contracts only (avoiding utility contracts with errors)
    const deployments = {};
    
    try {
        // 1. Deploy EDU Token
        console.log("\n1️⃣ Deploying EDU Token...");
        const EDUToken = await ethers.getContractFactory("EDUToken");
        const eduToken = await EDUToken.deploy();
        await eduToken.deployed();
        deployments.EDUToken = eduToken.address;
        console.log("✅ EDU Token deployed to:", eduToken.address);
        
        // 2. Deploy Certificate NFT
        console.log("\n2️⃣ Deploying Certificate NFT...");
        const CertificateNFT = await ethers.getContractFactory("CertificateNFT");
        const certificateNFT = await CertificateNFT.deploy();
        await certificateNFT.deployed();
        deployments.CertificateNFT = certificateNFT.address;
        console.log("✅ Certificate NFT deployed to:", certificateNFT.address);
        
        // 3. Deploy Course NFT
        console.log("\n3️⃣ Deploying Course NFT...");
        const CourseNFT = await ethers.getContractFactory("CourseNFT");
        const courseNFT = await CourseNFT.deploy();
        await courseNFT.deployed();
        deployments.CourseNFT = courseNFT.address;
        console.log("✅ Course NFT deployed to:", courseNFT.address);
        
        // 4. Deploy AI Oracle
        console.log("\n4️⃣ Deploying AI Oracle...");
        const AIOracle = await ethers.getContractFactory("AIOracle");
        const aiOracle = await AIOracle.deploy();
        await aiOracle.deployed();
        deployments.AIOracle = aiOracle.address;
        console.log("✅ AI Oracle deployed to:", aiOracle.address);
        
        // 5. Deploy Job Marketplace
        console.log("\n5️⃣ Deploying Job Marketplace...");
        const JobMarketplace = await ethers.getContractFactory("JobMarketplace");
        const jobMarketplace = await JobMarketplace.deploy(
            eduToken.address,
            aiOracle.address
        );
        await jobMarketplace.deployed();
        deployments.JobMarketplace = jobMarketplace.address;
        console.log("✅ Job Marketplace deployed to:", jobMarketplace.address);
        
        // 6. Deploy Scholarship Manager
        console.log("\n6️⃣ Deploying Scholarship Manager...");
        const ScholarshipManager = await ethers.getContractFactory("ScholarshipManager");
        const scholarshipManager = await ScholarshipManager.deploy(
            eduToken.address,
            certificateNFT.address
        );
        await scholarshipManager.deployed();
        deployments.ScholarshipManager = scholarshipManager.address;
        console.log("✅ Scholarship Manager deployed to:", scholarshipManager.address);
        
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
            `deployments-${network.name}.json`,
            JSON.stringify(deploymentData, null, 2)
        );
        
        console.log("\n🎉 All main contracts deployed successfully!");
        console.log("📄 Deployment data saved to:", `deployments-${network.name}.json`);
        
        // Contract addresses summary
        console.log("\n📋 Contract Addresses Summary:");
        Object.entries(deployments).forEach(([name, address]) => {
            console.log(`   ${name}: ${address}`);
        });
        
    } catch (error) {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });