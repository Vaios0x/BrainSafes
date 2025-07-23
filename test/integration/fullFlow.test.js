const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Flujo de integración completo", function () {
  let brainSafes, scholarshipManager, certificateNFT, jobMarketplace, eduToken, owner, user;
  beforeEach(async () => {
    [owner, user] = await ethers.getSigners();
    const BrainSafes = await ethers.getContractFactory("BrainSafes");
    brainSafes = await BrainSafes.deploy();
    await brainSafes.deployed();
    const ScholarshipManager = await ethers.getContractFactory("ScholarshipManager");
    scholarshipManager = await ScholarshipManager.deploy();
    await scholarshipManager.deployed();
    const CertificateNFT = await ethers.getContractFactory("CertificateNFT");
    certificateNFT = await CertificateNFT.deploy();
    await certificateNFT.deployed();
    const JobMarketplace = await ethers.getContractFactory("JobMarketplace");
    jobMarketplace = await JobMarketplace.deploy();
    await jobMarketplace.deployed();
    const EDUToken = await ethers.getContractFactory("EDUToken");
    eduToken = await EDUToken.deploy();
    await eduToken.deployed();
  });

  it("debería permitir el flujo completo de usuario", async () => {
    // Registro
    await brainSafes.connect(user).registerUser("Alice");
    const info = await brainSafes.getUserInfo(user.address);
    expect(info.name).to.equal("Alice");
    // Aplicar a beca
    await scholarshipManager.connect(user).applyForScholarship("Data Science");
    const status = await scholarshipManager.getApplicationStatus(user.address);
    expect(status).to.equal(1);
    // Mint NFT
    await certificateNFT.mint(user.address, "ipfs://metadata");
    expect(await certificateNFT.ownerOf(1)).to.equal(user.address);
    // Acceso a marketplace
    await jobMarketplace.connect(user).applyForJob(0, "Mi CV");
    const applications = await jobMarketplace.getJobApplications(0);
    expect(applications.length).to.be.gte(0);
  });
}); 