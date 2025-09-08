const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("BrainSafes - Performance y Gas Optimization Testing", function () {
  let brainSafes, eduToken, courseNFT, certificateNFT, enhancedMulticall;
  let userExperience, distributedCache, addressCompressor;
  let owner, instructor, student, user1, user2;
  let addrs;

  beforeEach(async function () {
    [owner, instructor, student, user1, user2, ...addrs] = await ethers.getSigners();

    // Deploy core contracts
    const BrainSafes = await ethers.getContractFactory("BrainSafes");
    brainSafes = await BrainSafes.deploy();
    await brainSafes.deployed();

    const EDUToken = await ethers.getContractFactory("EDUToken");
    eduToken = await EDUToken.deploy(brainSafes.address);
    await eduToken.deployed();

    const CourseNFT = await ethers.getContractFactory("CourseNFT");
    courseNFT = await CourseNFT.deploy(brainSafes.address);
    await courseNFT.deployed();

    const CertificateNFT = await ethers.getContractFactory("CertificateNFT");
    certificateNFT = await CertificateNFT.deploy(brainSafes.address);
    await certificateNFT.deployed();

    const EnhancedMulticall = await ethers.getContractFactory("EnhancedMulticall");
    enhancedMulticall = await EnhancedMulticall.deploy();
    await enhancedMulticall.deployed();

    const UserExperience = await ethers.getContractFactory("UserExperience");
    userExperience = await UserExperience.deploy();
    await userExperience.deployed();

    const DistributedCache = await ethers.getContractFactory("DistributedCache");
    distributedCache = await DistributedCache.deploy();
    await distributedCache.deployed();

    const AddressCompressor = await ethers.getContractFactory("AddressCompressor");
    addressCompressor = await AddressCompressor.deploy();
    await addressCompressor.deployed();

    // Setup roles and initial state
    await brainSafes.grantRole(await brainSafes.INSTRUCTOR_ROLE(), instructor.address);
    await brainSafes.grantRole(await brainSafes.STUDENT_ROLE(), student.address);
    await eduToken.mint(student.address, ethers.utils.parseEther("1000"));
    await eduToken.mint(instructor.address, ethers.utils.parseEther("500"));
  });

  describe("Gas Optimization - Core Operations", function () {
    it("debería optimizar gas en operaciones básicas de tokens", async function () {
      const operations = [
        { name: "Transfer", gas: 0 },
        { name: "Approve", gas: 0 },
        { name: "Mint", gas: 0 },
        { name: "Burn", gas: 0 }
      ];

      // Measure transfer gas
      const transferGas = await eduToken.connect(student).estimateGas.transfer(
        user1.address,
        ethers.utils.parseEther("10")
      );
      operations[0].gas = transferGas.toNumber();

      // Measure approve gas
      const approveGas = await eduToken.connect(student).estimateGas.approve(
        courseNFT.address,
        ethers.utils.parseEther("100")
      );
      operations[1].gas = approveGas.toNumber();

      // Measure mint gas
      const mintGas = await eduToken.connect(owner).estimateGas.mint(
        user2.address,
        ethers.utils.parseEther("50")
      );
      operations[2].gas = mintGas.toNumber();

      // Measure burn gas
      const burnGas = await eduToken.connect(student).estimateGas.burn(
        ethers.utils.parseEther("5")
      );
      operations[3].gas = burnGas.toNumber();

      console.log("📊 Gas Usage - Core Token Operations:");
      operations.forEach(op => {
        console.log(`- ${op.name}: ${op.gas} gas`);
        expect(op.gas).to.be.lt(100000); // Max 100k gas per operation
      });
    });

    it("debería optimizar gas en operaciones de NFTs", async function () {
      const nftOperations = [
        { name: "Mint Certificate", gas: 0 },
        { name: "Transfer NFT", gas: 0 },
        { name: "Approve NFT", gas: 0 },
        { name: "Revoke Certificate", gas: 0 }
      ];

      // Measure mint certificate gas
      const mintGas = await certificateNFT.connect(instructor).estimateGas.mintCertificate(
        student.address,
        0,
        "ipfs://certificate-metadata",
        90
      );
      nftOperations[0].gas = mintGas.toNumber();

      // Mint first for transfer test
      await certificateNFT.connect(instructor).mintCertificate(
        student.address,
        0,
        "ipfs://certificate-metadata",
        90
      );

      // Measure transfer gas
      const transferGas = await certificateNFT.connect(student).estimateGas.transferFrom(
        student.address,
        user1.address,
        0
      );
      nftOperations[1].gas = transferGas.toNumber();

      // Measure approve gas
      const approveGas = await certificateNFT.connect(user1).estimateGas.approve(
        user2.address,
        0
      );
      nftOperations[2].gas = approveGas.toNumber();

      // Measure revoke gas
      const revokeGas = await certificateNFT.connect(instructor).estimateGas.revokeCertificate(0);
      nftOperations[3].gas = revokeGas.toNumber();

      console.log("📊 Gas Usage - NFT Operations:");
      nftOperations.forEach(op => {
        console.log(`- ${op.name}: ${op.gas} gas`);
        expect(op.gas).to.be.lt(200000); // Max 200k gas per operation
      });
    });

    it("debería optimizar gas en operaciones de cursos", async function () {
      const courseOperations = [
        { name: "Create Course", gas: 0 },
        { name: "Enroll in Course", gas: 0 },
        { name: "Update Progress", gas: 0 },
        { name: "Complete Course", gas: 0 }
      ];

      // Measure create course gas
      const createGas = await courseNFT.connect(instructor).estimateGas.createCourse(
        "Optimization Course",
        "Course for gas optimization",
        "ipfs://course-content",
        ethers.utils.parseEther("50"),
        30,
        100,
        ["Optimization"],
        2
      );
      courseOperations[0].gas = createGas.toNumber();

      // Create course for enrollment test
      await courseNFT.connect(instructor).createCourse(
        "Test Course",
        "Test course content",
        "ipfs://test-content",
        ethers.utils.parseEther("50"),
        30,
        100,
        ["Test"],
        2
      );

      // Approve tokens
      await eduToken.connect(student).approve(courseNFT.address, ethers.utils.parseEther("50"));

      // Measure enrollment gas
      const enrollGas = await courseNFT.connect(student).estimateGas.enrollInCourse(0);
      courseOperations[1].gas = enrollGas.toNumber();

      // Measure update progress gas
      const progressGas = await brainSafes.connect(instructor).estimateGas.updateStudentProgress(
        0,
        student.address,
        50,
        85
      );
      courseOperations[2].gas = progressGas.toNumber();

      // Measure complete course gas
      const completeGas = await brainSafes.connect(instructor).estimateGas.updateStudentProgress(
        0,
        student.address,
        100,
        95
      );
      courseOperations[3].gas = completeGas.toNumber();

      console.log("📊 Gas Usage - Course Operations:");
      courseOperations.forEach(op => {
        console.log(`- ${op.name}: ${op.gas} gas`);
        expect(op.gas).to.be.lt(300000); // Max 300k gas per operation
      });
    });
  });

  describe("Multicall Optimization", function () {
    it("debería optimizar gas usando multicall", async function () {
      const batchSize = 10;
      const operations = [];

      // Prepare batch operations
      for (let i = 0; i < batchSize; i++) {
        const data = eduToken.interface.encodeFunctionData("balanceOf", [addrs[i].address]);
        operations.push({
          target: eduToken.address,
          data: data
        });
      }

      // Measure individual calls gas
      let individualGas = 0;
      for (let i = 0; i < batchSize; i++) {
        const gas = await ethers.provider.estimateGas({
          to: eduToken.address,
          data: operations[i].data
        });
        individualGas += gas.toNumber();
      }

      // Measure multicall gas
      const multicallGas = await enhancedMulticall.connect(owner).estimateGas.multicall(operations);

      console.log("📊 Multicall Gas Optimization:");
      console.log(`- Individual calls: ${individualGas} gas`);
      console.log(`- Multicall: ${multicallGas.toNumber()} gas`);
      console.log(`- Gas saved: ${individualGas - multicallGas.toNumber()} gas`);
      console.log(`- Savings: ${((individualGas - multicallGas.toNumber()) / individualGas * 100).toFixed(2)}%`);

      expect(multicallGas.toNumber()).to.be.lt(individualGas);
      expect(multicallGas.toNumber()).to.be.lt(500000); // Max 500k gas for multicall
    });

    it("debería optimizar operaciones mixtas con multicall", async function () {
      const mixedOperations = [];

      // Balance check
      mixedOperations.push({
        target: eduToken.address,
        data: eduToken.interface.encodeFunctionData("balanceOf", [student.address])
      });

      // Approve
      mixedOperations.push({
        target: eduToken.interface.encodeFunctionData("approve", [
          courseNFT.address,
          ethers.utils.parseEther("100")
        ])
      });

      // Get user profile
      mixedOperations.push({
        target: brainSafes.interface.encodeFunctionData("getUserProfile", [student.address])
      });

      // Measure individual gas
      let individualGas = 0;
      for (const op of mixedOperations) {
        const gas = await ethers.provider.estimateGas({
          to: op.target,
          data: op.data
        });
        individualGas += gas.toNumber();
      }

      // Measure multicall gas
      const multicallGas = await enhancedMulticall.connect(owner).estimateGas.multicall(mixedOperations);

      console.log("📊 Mixed Operations Multicall:");
      console.log(`- Individual: ${individualGas} gas`);
      console.log(`- Multicall: ${multicallGas.toNumber()} gas`);
      console.log(`- Savings: ${individualGas - multicallGas.toNumber()} gas`);

      expect(multicallGas.toNumber()).to.be.lt(individualGas);
    });
  });

  describe("Cache Optimization", function () {
    it("debería optimizar gas usando cache", async function () {
      const cacheKey = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test-data"));
      const cacheData = ethers.utils.toUtf8Bytes("cached-result");
      const ttl = Math.floor(Date.now() / 1000) + 3600;

      // Measure set cache gas
      const setGas = await distributedCache.connect(owner).estimateGas.set(
        cacheKey,
        cacheData,
        ttl
      );

      // Measure get cache gas (cache hit)
      const getGas = await distributedCache.connect(owner).estimateGas.get(cacheKey);

      // Measure expensive operation gas (cache miss)
      const expensiveGas = await userExperience.connect(student).estimateGas.submitFeedback(
        "Test feedback for gas optimization",
        5,
        "Performance"
      );

      console.log("📊 Cache Gas Optimization:");
      console.log(`- Set cache: ${setGas.toNumber()} gas`);
      console.log(`- Get cache (hit): ${getGas.toNumber()} gas`);
      console.log(`- Expensive operation: ${expensiveGas.toNumber()} gas`);
      console.log(`- Cache savings: ${expensiveGas.toNumber() - getGas.toNumber()} gas`);

      expect(getGas.toNumber()).to.be.lt(expensiveGas.toNumber());
      expect(getGas.toNumber()).to.be.lt(50000); // Max 50k gas for cache hit
    });

    it("debería manejar cache invalidation eficientemente", async function () {
      const cacheKey = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("expiring-data"));
      const cacheData = ethers.utils.toUtf8Bytes("expiring-result");
      const shortTtl = Math.floor(Date.now() / 1000) + 60; // 1 minute

      // Set cache with short TTL
      await distributedCache.connect(owner).set(cacheKey, cacheData, shortTtl);

      // Get cache immediately (should be cached)
      const immediateGas = await distributedCache.connect(owner).estimateGas.get(cacheKey);

      // Advance time beyond TTL
      await time.increase(61);

      // Get cache after expiration (should not be cached)
      const expiredGas = await distributedCache.connect(owner).estimateGas.get(cacheKey);

      console.log("📊 Cache Expiration Gas:");
      console.log(`- Immediate (cached): ${immediateGas.toNumber()} gas`);
      console.log(`- After expiration: ${expiredGas.toNumber()} gas`);

      expect(immediateGas.toNumber()).to.be.lt(expiredGas.toNumber());
    });
  });

  describe("Address Compression Optimization", function () {
    it("debería optimizar gas comprimiendo direcciones", async function () {
      const addresses = [
        "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
        "0x1234567890123456789012345678901234567890",
        "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd"
      ];

      const compressionResults = [];

      for (const address of addresses) {
        // Measure compression gas
        const compressGas = await addressCompressor.connect(owner).estimateGas.compressAddress(address);
        
        // Compress address
        const compressed = await addressCompressor.connect(owner).compressAddress(address);
        
        // Measure decompression gas
        const decompressGas = await addressCompressor.connect(owner).estimateGas.decompressAddress(compressed);

        compressionResults.push({
          original: address,
          compressed: compressed,
          compressGas: compressGas.toNumber(),
          decompressGas: decompressGas.toNumber(),
          savings: address.length - compressed.length
        });
      }

      console.log("📊 Address Compression Results:");
      compressionResults.forEach(result => {
        console.log(`- Original: ${result.original} (${result.original.length} chars)`);
        console.log(`- Compressed: ${result.compressed} (${result.compressed.length} chars)`);
        console.log(`- Compress gas: ${result.compressGas}`);
        console.log(`- Decompress gas: ${result.decompressGas}`);
        console.log(`- Storage savings: ${result.savings} characters`);
        console.log("---");
      });

      // Verify compression efficiency
      compressionResults.forEach(result => {
        expect(result.compressed.length).to.be.lt(result.original.length);
        expect(result.compressGas).to.be.lt(100000); // Max 100k gas
        expect(result.decompressGas).to.be.lt(50000); // Max 50k gas
      });
    });
  });

  describe("Batch Operations Optimization", function () {
    it("debería optimizar gas en operaciones batch de NFTs", async function () {
      const batchSize = 5;
      const batchGas = [];

      // Measure individual mint gas
      for (let i = 0; i < batchSize; i++) {
        const gas = await certificateNFT.connect(instructor).estimateGas.mintCertificate(
          addrs[i].address,
          i,
          `ipfs://certificate-${i}`,
          85 + i
        );
        batchGas.push(gas.toNumber());
      }

      // Calculate total individual gas
      const totalIndividualGas = batchGas.reduce((sum, gas) => sum + gas, 0);

      console.log("📊 NFT Batch Gas Analysis:");
      console.log(`- Individual mints: ${batchGas.join(', ')} gas`);
      console.log(`- Total individual: ${totalIndividualGas} gas`);
      console.log(`- Average per mint: ${totalIndividualGas / batchSize} gas`);

      // Verify gas limits
      batchGas.forEach(gas => {
        expect(gas).to.be.lt(200000); // Max 200k gas per mint
      });

      expect(totalIndividualGas / batchSize).to.be.lt(150000); // Max 150k average
    });

    it("debería optimizar gas en operaciones batch de cursos", async function () {
      const batchSize = 3;
      const courseGas = [];

      // Measure individual course creation gas
      for (let i = 0; i < batchSize; i++) {
        const gas = await courseNFT.connect(instructor).estimateGas.createCourse(
          `Course ${i}`,
          `Description ${i}`,
          `ipfs://content-${i}`,
          ethers.utils.parseEther("50"),
          30,
          100,
          ["Test"],
          2
        );
        courseGas.push(gas.toNumber());
      }

      const totalCourseGas = courseGas.reduce((sum, gas) => sum + gas, 0);

      console.log("📊 Course Batch Gas Analysis:");
      console.log(`- Individual courses: ${courseGas.join(', ')} gas`);
      console.log(`- Total: ${totalCourseGas} gas`);
      console.log(`- Average per course: ${totalCourseGas / batchSize} gas`);

      courseGas.forEach(gas => {
        expect(gas).to.be.lt(300000); // Max 300k gas per course
      });
    });
  });

  describe("Storage Optimization", function () {
    it("debería optimizar gas en operaciones de storage", async function () {
      const storageOperations = [
        { name: "Set small data", size: 32, gas: 0 },
        { name: "Set medium data", size: 256, gas: 0 },
        { name: "Set large data", size: 1024, gas: 0 }
      ];

      // Measure gas for different data sizes
      for (let i = 0; i < storageOperations.length; i++) {
        const dataSize = storageOperations[i].size;
        const data = ethers.utils.randomBytes(dataSize);
        const key = ethers.utils.keccak256(data);

        const gas = await distributedCache.connect(owner).estimateGas.set(
          key,
          data,
          Math.floor(Date.now() / 1000) + 3600
        );
        storageOperations[i].gas = gas.toNumber();
      }

      console.log("📊 Storage Gas Optimization:");
      storageOperations.forEach(op => {
        console.log(`- ${op.name} (${op.size} bytes): ${op.gas} gas`);
        console.log(`  Gas per byte: ${(op.gas / op.size).toFixed(2)}`);
      });

      // Verify gas efficiency
      storageOperations.forEach(op => {
        expect(op.gas).to.be.lt(500000); // Max 500k gas
        expect(op.gas / op.size).to.be.lt(1000); // Max 1000 gas per byte
      });
    });

    it("debería optimizar gas en operaciones de lectura", async function () {
      // Set up test data
      const testData = ethers.utils.randomBytes(512);
      const testKey = ethers.utils.keccak256(testData);
      await distributedCache.connect(owner).set(
        testKey,
        testData,
        Math.floor(Date.now() / 1000) + 3600
      );

      // Measure read gas
      const readGas = await distributedCache.connect(owner).estimateGas.get(testKey);

      console.log("📊 Read Operation Gas:");
      console.log(`- Read ${testData.length} bytes: ${readGas.toNumber()} gas`);
      console.log(`- Gas per byte: ${(readGas.toNumber() / testData.length).toFixed(2)}`);

      expect(readGas.toNumber()).to.be.lt(100000); // Max 100k gas for read
      expect(readGas.toNumber() / testData.length).to.be.lt(200); // Max 200 gas per byte
    });
  });

  describe("Performance Benchmarking", function () {
    it("debería establecer benchmarks de performance", async function () {
      const benchmarks = {
        tokenTransfer: { gas: 0, time: 0 },
        nftMint: { gas: 0, time: 0 },
        courseCreation: { gas: 0, time: 0 },
        multicall: { gas: 0, time: 0 }
      };

      // Benchmark token transfer
      const transferStart = Date.now();
      const transferGas = await eduToken.connect(student).estimateGas.transfer(
        user1.address,
        ethers.utils.parseEther("10")
      );
      benchmarks.tokenTransfer.gas = transferGas.toNumber();
      benchmarks.tokenTransfer.time = Date.now() - transferStart;

      // Benchmark NFT mint
      const mintStart = Date.now();
      const mintGas = await certificateNFT.connect(instructor).estimateGas.mintCertificate(
        student.address,
        0,
        "ipfs://benchmark-certificate",
        90
      );
      benchmarks.nftMint.gas = mintGas.toNumber();
      benchmarks.nftMint.time = Date.now() - mintStart;

      // Benchmark course creation
      const courseStart = Date.now();
      const courseGas = await courseNFT.connect(instructor).estimateGas.createCourse(
        "Benchmark Course",
        "Course for benchmarking",
        "ipfs://benchmark-content",
        ethers.utils.parseEther("50"),
        30,
        100,
        ["Benchmark"],
        2
      );
      benchmarks.courseCreation.gas = courseGas.toNumber();
      benchmarks.courseCreation.time = Date.now() - courseStart;

      // Benchmark multicall
      const multicallOps = [
        {
          target: eduToken.address,
          data: eduToken.interface.encodeFunctionData("balanceOf", [student.address])
        },
        {
          target: eduToken.address,
          data: eduToken.interface.encodeFunctionData("balanceOf", [user1.address])
        }
      ];

      const multicallStart = Date.now();
      const multicallGas = await enhancedMulticall.connect(owner).estimateGas.multicall(multicallOps);
      benchmarks.multicall.gas = multicallGas.toNumber();
      benchmarks.multicall.time = Date.now() - multicallStart;

      console.log("🚀 Performance Benchmarks:");
      Object.entries(benchmarks).forEach(([operation, metrics]) => {
        console.log(`${operation}:`);
        console.log(`  - Gas: ${metrics.gas}`);
        console.log(`  - Time: ${metrics.time}ms`);
      });

      // Verify performance targets
      expect(benchmarks.tokenTransfer.gas).to.be.lt(100000);
      expect(benchmarks.nftMint.gas).to.be.lt(200000);
      expect(benchmarks.courseCreation.gas).to.be.lt(300000);
      expect(benchmarks.multicall.gas).to.be.lt(150000);
    });

    it("debería medir escalabilidad del sistema", async function () {
      const scalabilityMetrics = {
        users: [10, 50, 100],
        gasPerUser: [],
        totalGas: []
      };

      for (const userCount of scalabilityMetrics.users) {
        const users = addrs.slice(0, userCount);
        let totalGas = 0;

        // Simulate user operations
        for (let i = 0; i < userCount; i++) {
          const user = users[i];
          
          // Mint tokens
          await eduToken.mint(user.address, ethers.utils.parseEther("100"));
          
          // Approve tokens
          const approveGas = await eduToken.connect(user).estimateGas.approve(
            courseNFT.address,
            ethers.utils.parseEther("50")
          );
          totalGas += approveGas.toNumber();
        }

        scalabilityMetrics.gasPerUser.push(totalGas / userCount);
        scalabilityMetrics.totalGas.push(totalGas);
      }

      console.log("📈 Scalability Analysis:");
      scalabilityMetrics.users.forEach((userCount, index) => {
        console.log(`${userCount} users:`);
        console.log(`  - Total gas: ${scalabilityMetrics.totalGas[index]}`);
        console.log(`  - Gas per user: ${scalabilityMetrics.gasPerUser[index]}`);
      });

      // Verify scalability
      scalabilityMetrics.gasPerUser.forEach(gasPerUser => {
        expect(gasPerUser).to.be.lt(100000); // Max 100k gas per user
      });
    });
  });

  describe("Gas Limit Testing", function () {
    it("debería detectar límites de gas en operaciones masivas", async function () {
      const largeBatchSize = 1000;
      let gasExceeded = false;

      try {
        // Try to process very large batch
        for (let i = 0; i < largeBatchSize; i++) {
          const user = addrs[i % addrs.length];
          await eduToken.mint(user.address, ethers.utils.parseEther("10"));
          await eduToken.connect(user).approve(courseNFT.address, ethers.utils.parseEther("10"));
        }
      } catch (error) {
        if (error.message.includes("out of gas") || error.message.includes("gas limit")) {
          gasExceeded = true;
        }
      }

      expect(gasExceeded).to.be.true;
      console.log("✅ Gas limit detection working correctly");
    });

    it("debería optimizar operaciones para evitar límites de gas", async function () {
      const optimizedBatchSize = 50;
      const operations = [];

      // Prepare optimized batch
      for (let i = 0; i < optimizedBatchSize; i++) {
        const user = addrs[i];
        operations.push(
          eduToken.connect(user).approve(courseNFT.address, ethers.utils.parseEther("10"))
        );
      }

      // Execute optimized batch
      const startTime = Date.now();
      await Promise.all(operations);
      const endTime = Date.now();

      console.log("⚡ Optimized Batch Performance:");
      console.log(`- Batch size: ${optimizedBatchSize}`);
      console.log(`- Execution time: ${endTime - startTime}ms`);
      console.log(`- Operations per second: ${optimizedBatchSize / ((endTime - startTime) / 1000)}`);

      expect(endTime - startTime).to.be.lt(30000); // Max 30 seconds
    });
  });
});
