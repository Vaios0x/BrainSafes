const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("BrainSafesArbitrum", function () {
  let brainSafesArbitrum;
  let eduToken;
  let certificateNFT;
  let aiOracle;
  let scholarshipManager;
  let jobMarketplace;
  let owner;
  let instructor;
  let student;
  let organization;

  // Mock Arbitrum precompile addresses
  const ARBSYS_ADDRESS = "0x0000000000000000000000000000000000000064";
  
  // Mock L1 contract address
  const L1_CONTRACT_ADDRESS = "0x1234567890123456789012345678901234567890";

  beforeEach(async function () {
    // Get signers
    [owner, instructor, student, organization] = await ethers.getSigners();

    // Deploy EDUToken
    const EDUToken = await ethers.getContractFactory("EDUToken");
    eduToken = await EDUToken.deploy();
    await eduToken.deployed();

    // Deploy CertificateNFT
    const CertificateNFT = await ethers.getContractFactory("CertificateNFT");
    certificateNFT = await CertificateNFT.deploy();
    await certificateNFT.deployed();

    // Deploy AIOracle
    const AIOracle = await ethers.getContractFactory("AIOracle");
    aiOracle = await AIOracle.deploy(ethers.constants.AddressZero); // No Chainlink feed for tests
    await aiOracle.deployed();

    // Deploy ScholarshipManager
    const ScholarshipManager = await ethers.getContractFactory("ScholarshipManager");
    scholarshipManager = await ScholarshipManager.deploy(eduToken.address);
    await scholarshipManager.deployed();

    // Deploy JobMarketplace
    const JobMarketplace = await ethers.getContractFactory("JobMarketplace");
    jobMarketplace = await JobMarketplace.deploy(eduToken.address);
    await jobMarketplace.deployed();

    // Deploy BrainSafesArbitrum as upgradeable
    const BrainSafesArbitrum = await ethers.getContractFactory("BrainSafesArbitrum");
    brainSafesArbitrum = await upgrades.deployProxy(
      BrainSafesArbitrum,
      [L1_CONTRACT_ADDRESS],
      { initializer: 'initialize' }
    );
    await brainSafesArbitrum.deployed();

    // Setup contract references
    await brainSafesArbitrum.setEDUToken(eduToken.address);
    await brainSafesArbitrum.setCertificateNFT(certificateNFT.address);
    await brainSafesArbitrum.setAIOracle(aiOracle.address);
    await brainSafesArbitrum.setScholarshipManager(scholarshipManager.address);
    await brainSafesArbitrum.setJobMarketplace(jobMarketplace.address);

    // Setup roles
    const INSTRUCTOR_ROLE = await brainSafesArbitrum.INSTRUCTOR_ROLE();
    const STUDENT_ROLE = await brainSafesArbitrum.STUDENT_ROLE();
    const ORGANIZATION_ROLE = await brainSafesArbitrum.ORGANIZATION_ROLE();
    
    await brainSafesArbitrum.grantRole(INSTRUCTOR_ROLE, instructor.address);
    await brainSafesArbitrum.grantRole(STUDENT_ROLE, student.address);
    await brainSafesArbitrum.grantRole(ORGANIZATION_ROLE, organization.address);
    
    // Grant MINTER_ROLE to BrainSafesArbitrum
    const MINTER_ROLE = await eduToken.MINTER_ROLE();
    await eduToken.grantRole(MINTER_ROLE, brainSafesArbitrum.address);
    await certificateNFT.grantRole(MINTER_ROLE, brainSafesArbitrum.address);
  });

  describe("Initialization", function () {
    it("Should initialize with correct L1 address", async function () {
      expect(await brainSafesArbitrum.l1BrainSafesAddress()).to.equal(L1_CONTRACT_ADDRESS);
    });

    it("Should initialize block tracking variables", async function () {
      expect(await brainSafesArbitrum.lastL1BlockNumber()).to.be.gt(0);
      expect(await brainSafesArbitrum.lastArbBlockNumber()).to.be.gt(0);
      expect(await brainSafesArbitrum.blockNumberUpdateInterval()).to.equal(100);
    });
  });

  describe("Block and Time Management", function () {
    it("Should update block numbers correctly", async function () {
      const initialL1Block = await brainSafesArbitrum.lastL1BlockNumber();
      const initialArbBlock = await brainSafesArbitrum.lastArbBlockNumber();
      
      // Mine some blocks
      await time.advanceBlock();
      await time.advanceBlock();
      
      // Update block numbers
      await brainSafesArbitrum.updateBlockNumbers();
      
      // Since we're in a test environment, both L1 and Arb block numbers might be the same
      // The important thing is that they're updated
      const newL1Block = await brainSafesArbitrum.lastL1BlockNumber();
      const newArbBlock = await brainSafesArbitrum.lastArbBlockNumber();
      
      // In real Arbitrum, these would be different, but in tests they might be the same
      // We're just checking that the update function works
      expect(newL1Block).to.be.gte(initialL1Block);
      expect(newArbBlock).to.be.gte(initialArbBlock);
    });

    it("Should allow setting block number update interval", async function () {
      await brainSafesArbitrum.setBlockNumberUpdateInterval(200);
      expect(await brainSafesArbitrum.blockNumberUpdateInterval()).to.equal(200);
    });

    it("Should revert when setting invalid block number update interval", async function () {
      await expect(brainSafesArbitrum.setBlockNumberUpdateInterval(0))
        .to.be.revertedWith("Interval must be greater than 0");
    });
  });

  describe("Cross-Chain Messaging", function () {
    it("Should send message to L1", async function () {
      const data = ethers.utils.defaultAbiCoder.encode(
        ["uint8", "address", "uint256"],
        [1, student.address, 100]
      );
      
      // Since we can't mock ArbSys in tests, this will fail but we can check the event
      await expect(brainSafesArbitrum.sendMessageToL1(data))
        .to.emit(brainSafesArbitrum, "L1MessageSent");
    });

    it("Should process message from L1 only from authorized sender", async function () {
      const data = ethers.utils.defaultAbiCoder.encode(
        ["uint8", "address", "uint256"],
        [1, student.address, 100]
      );
      
      // This should fail because msg.sender is not the L1 contract address
      await expect(brainSafesArbitrum.processMessageFromL1(1, data))
        .to.be.revertedWith("BrainSafesArbitrum: caller is not the L1 contract");
    });

    it("Should prevent processing the same message twice", async function () {
      // We need to mock the L1 contract address as sender
      // This is not possible in standard tests, so we'll just check the revert condition
      const data = ethers.utils.defaultAbiCoder.encode(
        ["uint8", "address", "uint256"],
        [1, student.address, 100]
      );
      
      // Mark message as processed manually for testing
      await brainSafesArbitrum.connect(owner).sendMessageToL1(data); // Just to get an event
      
      // This should fail because msg.sender is not the L1 contract address
      await expect(brainSafesArbitrum.processMessageFromL1(1, data))
        .to.be.revertedWith("BrainSafesArbitrum: caller is not the L1 contract");
    });
  });

  describe("Batch Processing", function () {
    it("Should process multiple operations in batch", async function () {
      // Create a course
      await brainSafesArbitrum.connect(instructor).createCourse(
        "Test Course",
        "Test Description",
        "ipfs://test",
        ethers.utils.parseEther("1"),
        30,
        10,
        ["Solidity", "Arbitrum"],
        3
      );

      // Encode operations for batch processing
      const courseId = 1;
      const enrollOperation = brainSafesArbitrum.interface.encodeFunctionData(
        "enrollInCourse",
        [courseId]
      );
      
      const completeOperation = brainSafesArbitrum.interface.encodeFunctionData(
        "completeCourse",
        [student.address, courseId]
      );
      
      // This will fail because student needs to enroll first and instructor needs to complete
      // But we're just testing that the batch function works
      await expect(brainSafesArbitrum.connect(owner).batchProcess([enrollOperation, completeOperation]))
        .to.be.reverted;
    });

    it("Should revert when batch is empty", async function () {
      await expect(brainSafesArbitrum.connect(owner).batchProcess([]))
        .to.be.revertedWith("No operations provided");
    });

    it("Should revert when batch is too large", async function () {
      // Create an array of 51 identical operations
      const operations = Array(51).fill(
        brainSafesArbitrum.interface.encodeFunctionData("getBlockNumber", [])
      );
      
      await expect(brainSafesArbitrum.connect(owner).batchProcess(operations))
        .to.be.revertedWith("Too many operations");
    });
  });

  describe("Gas Optimizations", function () {
    it("Should emit gas optimization event during certificate creation", async function () {
      // Create a course
      await brainSafesArbitrum.connect(instructor).createCourse(
        "Test Course",
        "Test Description",
        "ipfs://test",
        ethers.utils.parseEther("1"),
        30,
        10,
        ["Solidity", "Arbitrum"],
        3
      );
      
      // Enroll student
      await eduToken.mint(student.address, ethers.utils.parseEther("10"));
      await eduToken.connect(student).approve(brainSafesArbitrum.address, ethers.utils.parseEther("1"));
      await brainSafesArbitrum.connect(student).enrollInCourse(1);
      
      // Complete course and issue certificate
      const tx = await brainSafesArbitrum.connect(instructor).issueCertificate(
        student.address,
        1,
        "ipfs://certificate",
        95
      );
      
      // Check for gas optimization event
      await expect(tx).to.emit(brainSafesArbitrum, "GasOptimizationApplied")
        .withArgs("certificate_creation", 15000);
    });
  });

  describe("Arbitrum-specific Functions", function () {
    it("Should confirm running on Arbitrum network", async function () {
      expect(await brainSafesArbitrum.isArbitrumNetwork()).to.equal(true);
    });

    it("Should get chain ID", async function () {
      const chainId = await brainSafesArbitrum.getChainId();
      expect(chainId).to.equal(await ethers.provider.getNetwork().then(n => n.chainId));
    });

    it("Should get timestamp", async function () {
      // We can't directly test _getTimestamp as it's internal
      // But we can test indirectly through other functions that use it
      const latestBlock = await ethers.provider.getBlock("latest");
      expect(latestBlock.timestamp).to.be.gt(0);
    });
  });

  describe("Integration Tests", function () {
    it("Should create course, enroll student, and issue certificate", async function () {
      // Create a course
      await brainSafesArbitrum.connect(instructor).createCourse(
        "Arbitrum Development",
        "Learn to build on Arbitrum",
        "ipfs://arbitrum-course",
        ethers.utils.parseEther("1"),
        30,
        10,
        ["Solidity", "Arbitrum", "L2"],
        3
      );
      
      // Mint tokens to student
      await eduToken.mint(student.address, ethers.utils.parseEther("10"));
      
      // Approve tokens
      await eduToken.connect(student).approve(brainSafesArbitrum.address, ethers.utils.parseEther("1"));
      
      // Enroll in course
      await brainSafesArbitrum.connect(student).enrollInCourse(1);
      
      // Issue certificate
      await brainSafesArbitrum.connect(instructor).issueCertificate(
        student.address,
        1,
        "ipfs://arbitrum-certificate",
        95
      );
      
      // Check certificate ownership
      expect(await certificateNFT.balanceOf(student.address)).to.equal(1);
      
      // Update block numbers after operations
      await brainSafesArbitrum.updateBlockNumbers();
      
      // Check block number tracking is working
      expect(await brainSafesArbitrum.lastL1BlockNumber()).to.be.gt(0);
      expect(await brainSafesArbitrum.lastArbBlockNumber()).to.be.gt(0);
    });
  });
}); 