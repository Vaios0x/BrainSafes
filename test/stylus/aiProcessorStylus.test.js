const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("BrainSafes - AI Processor Stylus Testing", function () {
  let aiProcessor, brainSafes, owner, user1, user2, aiOperator;
  let addrs;

  beforeEach(async function () {
    [owner, user1, user2, aiOperator, ...addrs] = await ethers.getSigners();

    // Deploy BrainSafes core
    const BrainSafes = await ethers.getContractFactory("BrainSafes");
    brainSafes = await BrainSafes.deploy();
    await brainSafes.deployed();

    // Deploy AI Processor Stylus (simulated interface)
    const AIProcessorMock = await ethers.getContractFactory("AIProcessorMock");
    aiProcessor = await AIProcessorMock.deploy();
    await aiProcessor.deployed();

    // Setup roles
    await brainSafes.grantRole(await brainSafes.AI_ORACLE_ROLE(), aiOperator.address);
  });

  describe("AI Model Configuration", function () {
    it("debería configurar modelos de AI correctamente", async function () {
      const modelConfig = {
        modelId: 1,
        inputSize: 256,
        outputSize: 128,
        batchSize: 32,
        computeUnits: 1000,
        isActive: true,
        offChainEnabled: true,
        cacheTtl: 3600,
        maxGasLimit: 500000
      };

      // Configure model
      await aiProcessor.connect(owner).configureModel(
        modelConfig.modelId,
        modelConfig.inputSize,
        modelConfig.outputSize,
        modelConfig.batchSize,
        modelConfig.computeUnits,
        modelConfig.isActive,
        modelConfig.offChainEnabled,
        modelConfig.cacheTtl,
        modelConfig.maxGasLimit
      );

      // Verify configuration
      const config = await aiProcessor.getModelConfig(modelConfig.modelId);
      expect(config.modelId).to.equal(modelConfig.modelId);
      expect(config.inputSize).to.equal(modelConfig.inputSize);
      expect(config.outputSize).to.equal(modelConfig.outputSize);
      expect(config.isActive).to.equal(modelConfig.isActive);
      expect(config.offChainEnabled).to.equal(modelConfig.offChainEnabled);
    });

    it("debería manejar múltiples modelos simultáneamente", async function () {
      const models = [
        { id: 1, inputSize: 256, outputSize: 128, name: "Text Analysis" },
        { id: 2, inputSize: 512, outputSize: 256, name: "Image Recognition" },
        { id: 3, inputSize: 1024, outputSize: 512, name: "Code Analysis" }
      ];

      // Configure multiple models
      for (const model of models) {
        await aiProcessor.connect(owner).configureModel(
          model.id,
          model.inputSize,
          model.outputSize,
          32,
          1000,
          true,
          true,
          3600,
          500000
        );
      }

      // Verify all models
      for (const model of models) {
        const config = await aiProcessor.getModelConfig(model.id);
        expect(config.modelId).to.equal(model.id);
        expect(config.inputSize).to.equal(model.inputSize);
        expect(config.outputSize).to.equal(model.outputSize);
        expect(config.isActive).to.be.true;
      }
    });

    it("debería validar límites de configuración", async function () {
      // Test invalid input size
      await expect(
        aiProcessor.connect(owner).configureModel(
          1,
          0, // Invalid input size
          128,
          32,
          1000,
          true,
          true,
          3600,
          500000
        )
      ).to.be.revertedWith("Invalid input size");

      // Test invalid gas limit
      await expect(
        aiProcessor.connect(owner).configureModel(
          1,
          256,
          128,
          32,
          1000,
          true,
          true,
          3600,
          0 // Invalid gas limit
        )
      ).to.be.revertedWith("Invalid gas limit");
    });
  });

  describe("AI Inference Operations", function () {
    it("debería ejecutar inferencia on-chain correctamente", async function () {
      // Configure model
      await aiProcessor.connect(owner).configureModel(
        1,
        256,
        128,
        32,
        1000,
        true,
        false, // On-chain only
        3600,
        500000
      );

      // Prepare input data
      const inputData = ethers.utils.randomBytes(256);
      const requestId = ethers.utils.keccak256(inputData);

      // Execute inference
      const result = await aiProcessor.connect(user1).executeInference(
        1, // modelId
        inputData,
        requestId
      );

      // Verify result
      expect(result.requestId).to.equal(requestId);
      expect(result.confidence).to.be.gt(0);
      expect(result.computationSource).to.equal(0); // OnChain
    });

    it("debería ejecutar inferencia off-chain cuando sea necesario", async function () {
      // Configure model for off-chain
      await aiProcessor.connect(owner).configureModel(
        2,
        1024,
        512,
        16,
        2000,
        true,
        true, // Off-chain enabled
        3600,
        300000
      );

      // Prepare large input data
      const largeInputData = ethers.utils.randomBytes(1024);
      const requestId = ethers.utils.keccak256(largeInputData);

      // Execute off-chain inference
      const result = await aiProcessor.connect(user1).executeInference(
        2,
        largeInputData,
        requestId
      );

      // Verify off-chain processing
      expect(result.computationSource).to.equal(1); // OffChain
      expect(result.gasUsed).to.be.lt(300000); // Within gas limit
    });

    it("debería manejar batch inference", async function () {
      // Configure model for batch processing
      await aiProcessor.connect(owner).configureModel(
        3,
        128,
        64,
        64, // Large batch size
        1500,
        true,
        true,
        3600,
        1000000
      );

      const batchSize = 10;
      const batchInputs = [];
      const batchRequestIds = [];

      // Prepare batch data
      for (let i = 0; i < batchSize; i++) {
        const inputData = ethers.utils.randomBytes(128);
        const requestId = ethers.utils.keccak256(inputData);
        batchInputs.push(inputData);
        batchRequestIds.push(requestId);
      }

      // Execute batch inference
      const batchResults = await aiProcessor.connect(user1).executeBatchInference(
        3,
        batchInputs,
        batchRequestIds
      );

      // Verify batch results
      expect(batchResults.length).to.equal(batchSize);
      for (let i = 0; i < batchSize; i++) {
        expect(batchResults[i].requestId).to.equal(batchRequestIds[i]);
        expect(batchResults[i].confidence).to.be.gt(0);
      }
    });

    it("debería manejar inferencia con cache", async function () {
      // Configure model with cache
      await aiProcessor.connect(owner).configureModel(
        4,
        256,
        128,
        32,
        1000,
        true,
        true,
        7200, // 2 hour cache TTL
        500000
      );

      const inputData = ethers.utils.randomBytes(256);
      const requestId = ethers.utils.keccak256(inputData);

      // First inference (cache miss)
      const firstResult = await aiProcessor.connect(user1).executeInference(
        4,
        inputData,
        requestId
      );
      expect(firstResult.computationSource).to.equal(0); // OnChain

      // Second inference with same input (cache hit)
      const secondResult = await aiProcessor.connect(user1).executeInference(
        4,
        inputData,
        requestId
      );
      expect(secondResult.computationSource).to.equal(2); // Cached

      // Verify cache performance
      expect(secondResult.gasUsed).to.be.lt(firstResult.gasUsed);
    });
  });

  describe("AI Cache Management", function () {
    it("debería gestionar cache eficientemente", async function () {
      // Configure model
      await aiProcessor.connect(owner).configureModel(
        5,
        256,
        128,
        32,
        1000,
        true,
        true,
        3600, // 1 hour TTL
        500000
      );

      const cacheEntries = [];
      const cacheSize = 20;

      // Fill cache
      for (let i = 0; i < cacheSize; i++) {
        const inputData = ethers.utils.randomBytes(256);
        const requestId = ethers.utils.keccak256(inputData);
        
        await aiProcessor.connect(user1).executeInference(5, inputData, requestId);
        cacheEntries.push({ inputData, requestId });
      }

      // Verify cache hit rate
      let cacheHits = 0;
      for (const entry of cacheEntries) {
        const result = await aiProcessor.connect(user1).executeInference(
          5,
          entry.inputData,
          entry.requestId
        );
        if (result.computationSource === 2) { // Cached
          cacheHits++;
        }
      }

      const hitRate = cacheHits / cacheSize;
      expect(hitRate).to.be.gt(0.8); // At least 80% hit rate

      console.log(`Cache hit rate: ${(hitRate * 100).toFixed(2)}%`);
    });

    it("debería expirar cache entries correctamente", async function () {
      // Configure model with short TTL
      await aiProcessor.connect(owner).configureModel(
        6,
        256,
        128,
        32,
        1000,
        true,
        true,
        60, // 1 minute TTL
        500000
      );

      const inputData = ethers.utils.randomBytes(256);
      const requestId = ethers.utils.keccak256(inputData);

      // First inference
      await aiProcessor.connect(user1).executeInference(6, inputData, requestId);

      // Second inference immediately (should be cached)
      const cachedResult = await aiProcessor.connect(user1).executeInference(
        6,
        inputData,
        requestId
      );
      expect(cachedResult.computationSource).to.equal(2); // Cached

      // Advance time beyond TTL
      await time.increase(61); // 61 seconds

      // Third inference after TTL (should not be cached)
      const expiredResult = await aiProcessor.connect(user1).executeInference(
        6,
        inputData,
        requestId
      );
      expect(expiredResult.computationSource).to.equal(0); // OnChain
    });

    it("debería limpiar cache cuando sea necesario", async function () {
      // Configure model
      await aiProcessor.connect(owner).configureModel(
        7,
        256,
        128,
        32,
        1000,
        true,
        true,
        3600,
        500000
      );

      // Fill cache
      for (let i = 0; i < 10; i++) {
        const inputData = ethers.utils.randomBytes(256);
        const requestId = ethers.utils.keccak256(inputData);
        await aiProcessor.connect(user1).executeInference(7, inputData, requestId);
      }

      // Clear cache
      await aiProcessor.connect(owner).clearCache();

      // Verify cache is cleared
      const cacheStats = await aiProcessor.getCacheStats();
      expect(cacheStats.totalEntries).to.equal(0);
    });
  });

  describe("AI Performance Optimization", function () {
    it("debería optimizar gas en inferencias", async function () {
      // Configure optimized model
      await aiProcessor.connect(owner).configureModel(
        8,
        128, // Smaller input
        64,  // Smaller output
        64,  // Larger batch
        800, // Fewer compute units
        true,
        true,
        1800, // Shorter cache TTL
        300000 // Lower gas limit
      );

      const inputData = ethers.utils.randomBytes(128);
      const requestId = ethers.utils.keccak256(inputData);

      // Measure gas usage
      const gasBefore = await ethers.provider.getBalance(owner.address);
      
      await aiProcessor.connect(user1).executeInference(8, inputData, requestId);
      
      const gasAfter = await ethers.provider.getBalance(owner.address);
      const gasUsed = gasBefore.sub(gasAfter);

      console.log(`Optimized inference gas usage: ${ethers.utils.formatEther(gasUsed)} ETH`);
      expect(gasUsed).to.be.lt(ethers.utils.parseEther("0.001")); // Max 0.001 ETH
    });

    it("debería manejar límites de gas correctamente", async function () {
      // Configure model with low gas limit
      await aiProcessor.connect(owner).configureModel(
        9,
        512,
        256,
        16,
        500,
        true,
        true,
        3600,
        100000 // Very low gas limit
      );

      const largeInputData = ethers.utils.randomBytes(512);
      const requestId = ethers.utils.keccak256(largeInputData);

      // Should fail due to gas limit
      await expect(
        aiProcessor.connect(user1).executeInference(9, largeInputData, requestId)
      ).to.be.revertedWith("Gas limit exceeded");
    });

    it("debería optimizar batch processing", async function () {
      // Configure model for batch optimization
      await aiProcessor.connect(owner).configureModel(
        10,
        64,
        32,
        128, // Very large batch
        2000,
        true,
        true,
        3600,
        2000000
      );

      const batchSize = 50;
      const batchInputs = [];
      const batchRequestIds = [];

      // Prepare optimized batch
      for (let i = 0; i < batchSize; i++) {
        const inputData = ethers.utils.randomBytes(64);
        const requestId = ethers.utils.keccak256(inputData);
        batchInputs.push(inputData);
        batchRequestIds.push(requestId);
      }

      // Measure batch performance
      const gasBefore = await ethers.provider.getBalance(owner.address);
      const startTime = Date.now();

      const batchResults = await aiProcessor.connect(user1).executeBatchInference(
        10,
        batchInputs,
        batchRequestIds
      );

      const endTime = Date.now();
      const gasAfter = await ethers.provider.getBalance(owner.address);
      const gasUsed = gasBefore.sub(gasAfter);

      console.log(`Batch optimization (${batchSize} items):`);
      console.log(`- Time: ${endTime - startTime}ms`);
      console.log(`- Gas: ${ethers.utils.formatEther(gasUsed)} ETH`);
      console.log(`- Gas per item: ${ethers.utils.formatEther(gasUsed.div(batchSize))} ETH`);

      expect(batchResults.length).to.equal(batchSize);
      expect(gasUsed.div(batchSize)).to.be.lt(ethers.utils.parseEther("0.0001")); // Max 0.0001 ETH per item
    });
  });

  describe("AI Off-Chain Integration", function () {
    it("debería manejar requests off-chain correctamente", async function () {
      // Configure model for off-chain
      await aiProcessor.connect(owner).configureModel(
        11,
        1024,
        512,
        8,
        3000,
        true,
        true,
        3600,
        500000
      );

      const inputData = ethers.utils.randomBytes(1024);
      const requestId = ethers.utils.keccak256(inputData);

      // Create off-chain request
      await aiProcessor.connect(user1).createOffChainRequest(
        11,
        inputData,
        user1.address,
        ethers.utils.toUtf8Bytes("callback"),
        3600 // 1 hour deadline
      );

      // Verify request created
      const request = await aiProcessor.getOffChainRequest(requestId);
      expect(request.modelId).to.equal(11);
      expect(request.status).to.equal(0); // Pending

      // Simulate off-chain processing
      await aiProcessor.connect(aiOperator).processOffChainResult(
        requestId,
        ethers.utils.randomBytes(512),
        95 // confidence
      );

      // Verify request completed
      const completedRequest = await aiProcessor.getOffChainRequest(requestId);
      expect(completedRequest.status).to.equal(1); // Completed
    });

    it("debería manejar timeouts de requests off-chain", async function () {
      // Configure model
      await aiProcessor.connect(owner).configureModel(
        12,
        512,
        256,
        16,
        2000,
        true,
        true,
        3600,
        400000
      );

      const inputData = ethers.utils.randomBytes(512);
      const requestId = ethers.utils.keccak256(inputData);

      // Create request with short deadline
      await aiProcessor.connect(user1).createOffChainRequest(
        12,
        inputData,
        user1.address,
        ethers.utils.toUtf8Bytes("callback"),
        60 // 1 minute deadline
      );

      // Advance time beyond deadline
      await time.increase(61);

      // Request should be timed out
      const request = await aiProcessor.getOffChainRequest(requestId);
      expect(request.status).to.equal(3); // TimedOut
    });
  });

  describe("AI Analytics and Monitoring", function () {
    it("debería trackear métricas de AI", async function () {
      // Configure model
      await aiProcessor.connect(owner).configureModel(
        13,
        256,
        128,
        32,
        1000,
        true,
        true,
        3600,
        500000
      );

      // Execute multiple inferences
      for (let i = 0; i < 10; i++) {
        const inputData = ethers.utils.randomBytes(256);
        const requestId = ethers.utils.keccak256(inputData);
        await aiProcessor.connect(user1).executeInference(13, inputData, requestId);
      }

      // Get AI statistics
      const stats = await aiProcessor.getProcessingStats(13);
      
      console.log("🤖 AI Processing Statistics:");
      console.log(`- Total requests: ${stats.totalRequests}`);
      console.log(`- Total gas used: ${stats.totalGasUsed}`);
      console.log(`- Average processing time: ${stats.avgProcessingTime}`);
      console.log(`- Success rate: ${stats.successRate}`);
      console.log(`- Cache hit rate: ${stats.cacheHitRate}`);
      console.log(`- Off-chain ratio: ${stats.offChainRatio}`);

      expect(stats.totalRequests).to.equal(10);
      expect(stats.successRate).to.be.gt(0);
    });

    it("debería monitorear performance de modelos", async function () {
      const models = [
        { id: 14, name: "Fast Model", inputSize: 64, outputSize: 32 },
        { id: 15, name: "Accurate Model", inputSize: 1024, outputSize: 512 }
      ];

      // Configure models
      for (const model of models) {
        await aiProcessor.connect(owner).configureModel(
          model.id,
          model.inputSize,
          model.outputSize,
          32,
          1000,
          true,
          true,
          3600,
          500000
        );
      }

      // Test performance of each model
      const performanceMetrics = {};

      for (const model of models) {
        const inputData = ethers.utils.randomBytes(model.inputSize);
        const requestId = ethers.utils.keccak256(inputData);

        const gasBefore = await ethers.provider.getBalance(owner.address);
        const startTime = Date.now();

        const result = await aiProcessor.connect(user1).executeInference(
          model.id,
          inputData,
          requestId
        );

        const endTime = Date.now();
        const gasAfter = await ethers.provider.getBalance(owner.address);
        const gasUsed = gasBefore.sub(gasAfter);

        performanceMetrics[model.name] = {
          processingTime: endTime - startTime,
          gasUsed: gasUsed,
          confidence: result.confidence
        };
      }

      console.log("📊 Model Performance Comparison:");
      for (const [modelName, metrics] of Object.entries(performanceMetrics)) {
        console.log(`${modelName}:`);
        console.log(`  - Processing time: ${metrics.processingTime}ms`);
        console.log(`  - Gas used: ${ethers.utils.formatEther(metrics.gasUsed)} ETH`);
        console.log(`  - Confidence: ${metrics.confidence}%`);
      }

      // Verify performance characteristics
      expect(performanceMetrics["Fast Model"].processingTime)
        .to.be.lt(performanceMetrics["Accurate Model"].processingTime);
      expect(performanceMetrics["Fast Model"].gasUsed)
        .to.be.lt(performanceMetrics["Accurate Model"].gasUsed);
    });
  });

  describe("AI Error Handling and Recovery", function () {
    it("debería manejar errores de inferencia", async function () {
      // Configure model
      await aiProcessor.connect(owner).configureModel(
        16,
        256,
        128,
        32,
        1000,
        true,
        true,
        3600,
        500000
      );

      // Test with invalid input
      const invalidInput = ethers.utils.randomBytes(128); // Wrong size
      const requestId = ethers.utils.keccak256(invalidInput);

      await expect(
        aiProcessor.connect(user1).executeInference(16, invalidInput, requestId)
      ).to.be.revertedWith("Invalid input size");

      // Test with inactive model
      await aiProcessor.connect(owner).deactivateModel(16);

      const validInput = ethers.utils.randomBytes(256);
      const validRequestId = ethers.utils.keccak256(validInput);

      await expect(
        aiProcessor.connect(user1).executeInference(16, validInput, validRequestId)
      ).to.be.revertedWith("Model not active");
    });

    it("debería recuperarse de fallos de cache", async function () {
      // Configure model
      await aiProcessor.connect(owner).configureModel(
        17,
        256,
        128,
        32,
        1000,
        true,
        true,
        3600,
        500000
      );

      const inputData = ethers.utils.randomBytes(256);
      const requestId = ethers.utils.keccak256(inputData);

      // First inference (cache miss)
      const firstResult = await aiProcessor.connect(user1).executeInference(
        17,
        inputData,
        requestId
      );

      // Simulate cache corruption
      await aiProcessor.connect(owner).clearCache();

      // Second inference should still work (fallback to on-chain)
      const secondResult = await aiProcessor.connect(user1).executeInference(
        17,
        inputData,
        requestId
      );

      expect(secondResult.computationSource).to.equal(0); // OnChain
      expect(secondResult.confidence).to.be.gt(0);
    });
  });
});
