const { ethers, upgrades } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Deploy implementation contracts first
  const EDUToken = await ethers.getContractFactory("EDUToken");
  const eduToken = await EDUToken.deploy();
  await eduToken.deployed();
  console.log("EDUToken deployed to:", eduToken.address);

  const CourseNFT = await ethers.getContractFactory("CourseNFT");
  const courseNFT = await CourseNFT.deploy();
  await courseNFT.deployed();
  console.log("CourseNFT deployed to:", courseNFT.address);

  const CertificateNFT = await ethers.getContractFactory("CertificateNFT");
  const certificateNFT = await CertificateNFT.deploy();
  await certificateNFT.deployed();
  console.log("CertificateNFT deployed to:", certificateNFT.address);

  const ScholarshipManager = await ethers.getContractFactory("ScholarshipManager");
  const scholarshipManager = await ScholarshipManager.deploy();
  await scholarshipManager.deployed();
  console.log("ScholarshipManager deployed to:", scholarshipManager.address);

  const AIOracle = await ethers.getContractFactory("AIOracle");
  const aiOracle = await AIOracle.deploy();
  await aiOracle.deployed();
  console.log("AIOracle deployed to:", aiOracle.address);

  // Deploy proxy admin
  const BrainSafesProxy = await ethers.getContractFactory("BrainSafesProxy");
  const proxy = await upgrades.deployProxy(BrainSafesProxy);
  await proxy.deployed();
  console.log("BrainSafesProxy deployed to:", proxy.address);

  // Deploy core implementation through proxy
  const BrainSafesCore = await ethers.getContractFactory("BrainSafesCore");
  const brainSafes = await upgrades.deployProxy(BrainSafesCore, [
    deployer.address,
    eduToken.address,
    courseNFT.address, 
    certificateNFT.address,
    scholarshipManager.address,
    aiOracle.address
  ]);
  await brainSafes.deployed();
  console.log("BrainSafesCore deployed to:", brainSafes.address);

  // Verify contracts
  console.log("Verifying contracts...");
  
  await hre.run("verify:verify", {
    address: eduToken.address,
    constructorArguments: [],
  });

  await hre.run("verify:verify", {
    address: courseNFT.address,
    constructorArguments: [],
  });

  await hre.run("verify:verify", {
    address: certificateNFT.address,
    constructorArguments: [],
  });

  await hre.run("verify:verify", {
    address: scholarshipManager.address,
    constructorArguments: [],
  });

  await hre.run("verify:verify", {
    address: aiOracle.address,
    constructorArguments: [],
  });

  await hre.run("verify:verify", {
    address: proxy.address,
    constructorArguments: [],
  });

  console.log("Deployment and verification complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 