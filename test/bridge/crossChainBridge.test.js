const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("BrainSafes - Cross-Chain Bridge Testing", function () {
  let l1BrainSafes, l2BrainSafes, l1Bridge, l2Bridge;
  let l1EduToken, l2EduToken, l1CertificateNFT, l2CertificateNFT;
  let owner, user1, user2, validator, bridgeOperator;
  let addrs;

  beforeEach(async function () {
    [owner, user1, user2, validator, bridgeOperator, ...addrs] = await ethers.getSigners();

    // Deploy L1 contracts
    const BrainSafes = await ethers.getContractFactory("BrainSafes");
    l1BrainSafes = await BrainSafes.deploy();
    await l1BrainSafes.deployed();

    const EDUToken = await ethers.getContractFactory("EDUToken");
    l1EduToken = await EDUToken.deploy(l1BrainSafes.address);
    await l1EduToken.deployed();

    const CertificateNFT = await ethers.getContractFactory("CertificateNFT");
    l1CertificateNFT = await CertificateNFT.deploy(l1BrainSafes.address);
    await l1CertificateNFT.deployed();

    const BrainSafesBridge = await ethers.getContractFactory("BrainSafesBridge");
    l1Bridge = await BrainSafesBridge.deploy(
      l1BrainSafes.address,
      ethers.constants.AddressZero, // L2 address placeholder
      l1EduToken.address,
      l1CertificateNFT.address
    );
    await l1Bridge.deployed();

    // Deploy L2 contracts (simulated)
    l2BrainSafes = await BrainSafes.deploy();
    await l2BrainSafes.deployed();

    l2EduToken = await EDUToken.deploy(l2BrainSafes.address);
    await l2EduToken.deployed();

    l2CertificateNFT = await CertificateNFT.deploy(l2BrainSafes.address);
    await l2CertificateNFT.deployed();

    l2Bridge = await BrainSafesBridge.deploy(
      l2BrainSafes.address,
      l1BrainSafes.address,
      l2EduToken.address,
      l2CertificateNFT.address
    );
    await l2Bridge.deployed();

    // Setup roles
    await l1Bridge.grantRole(await l1Bridge.BRIDGE_OPERATOR(), bridgeOperator.address);
    await l1Bridge.grantRole(await l1Bridge.VALIDATOR_ROLE(), validator.address);
    await l2Bridge.grantRole(await l2Bridge.BRIDGE_OPERATOR(), bridgeOperator.address);
    await l2Bridge.grantRole(await l2Bridge.VALIDATOR_ROLE(), validator.address);

    // Mint initial tokens
    await l1EduToken.mint(user1.address, ethers.utils.parseEther("1000"));
    await l1EduToken.mint(user2.address, ethers.utils.parseEther("1000"));
    await l2EduToken.mint(user1.address, ethers.utils.parseEther("500"));
    await l2EduToken.mint(user2.address, ethers.utils.parseEther("500"));
  });

  describe("Token Bridge Operations", function () {
    it("debería transferir tokens de L1 a L2 correctamente", async function () {
      const transferAmount = ethers.utils.parseEther("100");
      const user1InitialL1Balance = await l1EduToken.balanceOf(user1.address);
      const user1InitialL2Balance = await l2EduToken.balanceOf(user1.address);

      // Approve bridge
      await l1EduToken.connect(user1).approve(l1Bridge.address, transferAmount);

      // Initiate L1 to L2 transfer
      await l1Bridge.connect(user1).initiateTokenDeposit(
        user1.address,
        transferAmount
      );

      const operationId = 0;
      const operation = await l1Bridge.getOperation(operationId);
      expect(operation.operationType).to.equal(0); // TOKEN_DEPOSIT
      expect(operation.status).to.equal(0); // PENDING
      expect(operation.amount).to.equal(transferAmount);

      // Simulate L2 processing
      await l2Bridge.connect(bridgeOperator).processL1ToL2Transfer(
        operationId,
        user1.address,
        transferAmount,
        operation.data
      );

      // Verify balances
      const user1FinalL1Balance = await l1EduToken.balanceOf(user1.address);
      const user1FinalL2Balance = await l2EduToken.balanceOf(user1.address);

      expect(user1FinalL1Balance).to.equal(user1InitialL1Balance.sub(transferAmount));
      expect(user1FinalL2Balance).to.equal(user1InitialL2Balance.add(transferAmount));
    });

    it("debería transferir tokens de L2 a L1 con delay de seguridad", async function () {
      const transferAmount = ethers.utils.parseEther("50");
      const user2InitialL2Balance = await l2EduToken.balanceOf(user2.address);
      const user2InitialL1Balance = await l1EduToken.balanceOf(user2.address);

      // Approve bridge
      await l2EduToken.connect(user2).approve(l2Bridge.address, transferAmount);

      // Initiate L2 to L1 withdrawal
      await l2Bridge.connect(user2).initiateTokenWithdrawal(
        user2.address,
        transferAmount
      );

      const operationId = 0;
      const operation = await l2Bridge.getOperation(operationId);
      expect(operation.operationType).to.equal(1); // TOKEN_WITHDRAWAL
      expect(operation.status).to.equal(0); // PENDING

      // Verify withdrawal delay
      const lastWithdrawalTime = await l2Bridge.lastWithdrawalTime(user2.address);
      expect(lastWithdrawalTime).to.be.gt(0);

      // Try to withdraw before delay period
      await expect(
        l1Bridge.connect(bridgeOperator).processL2ToL1Withdrawal(
          operationId,
          user2.address,
          transferAmount,
          operation.data
        )
      ).to.be.revertedWith("Withdrawal delay not met");

      // Advance time
      await time.increase(7 * 24 * 3600 + 1); // 7 days + 1 second

      // Process withdrawal after delay
      await l1Bridge.connect(bridgeOperator).processL2ToL1Withdrawal(
        operationId,
        user2.address,
        transferAmount,
        operation.data
      );

      // Verify balances
      const user2FinalL2Balance = await l2EduToken.balanceOf(user2.address);
      const user2FinalL1Balance = await l1EduToken.balanceOf(user2.address);

      expect(user2FinalL2Balance).to.equal(user2InitialL2Balance.sub(transferAmount));
      expect(user2FinalL1Balance).to.equal(user2InitialL1Balance.add(transferAmount));
    });

    it("debería manejar batch token transfers", async function () {
      const batchSize = 10;
      const transferAmount = ethers.utils.parseEther("10");
      const users = addrs.slice(0, batchSize);

      // Setup users
      for (let i = 0; i < batchSize; i++) {
        await l1EduToken.mint(users[i].address, ethers.utils.parseEther("100"));
        await l1EduToken.connect(users[i]).approve(l1Bridge.address, transferAmount);
      }

      // Initiate batch transfers
      const batchPromises = users.map(user => 
        l1Bridge.connect(user).initiateTokenDeposit(user.address, transferAmount)
      );
      await Promise.all(batchPromises);

      // Verify all operations
      for (let i = 0; i < batchSize; i++) {
        const operation = await l1Bridge.getOperation(i);
        expect(operation.operationType).to.equal(0); // TOKEN_DEPOSIT
        expect(operation.status).to.equal(0); // PENDING
      }

      // Process batch on L2
      for (let i = 0; i < batchSize; i++) {
        const operation = await l1Bridge.getOperation(i);
        await l2Bridge.connect(bridgeOperator).processL1ToL2Transfer(
          i,
          users[i].address,
          transferAmount,
          operation.data
        );
      }

      // Verify all balances
      for (let i = 0; i < batchSize; i++) {
        const l2Balance = await l2EduToken.balanceOf(users[i].address);
        expect(l2Balance).to.equal(transferAmount);
      }
    });
  });

  describe("NFT Bridge Operations", function () {
    it("debería transferir certificados NFT entre L1 y L2", async function () {
      // Mint certificate on L1
      await l1CertificateNFT.connect(owner).mintCertificate(
        user1.address,
        0,
        "ipfs://certificate-l1",
        90
      );

      const certificateId = 0;
      expect(await l1CertificateNFT.ownerOf(certificateId)).to.equal(user1.address);

      // Approve bridge
      await l1CertificateNFT.connect(user1).approve(l1Bridge.address, certificateId);

      // Initiate certificate bridge
      await l1Bridge.connect(user1).initiateCertificateBridge(
        certificateId,
        user1.address
      );

      const operationId = 0;
      const operation = await l1Bridge.getOperation(operationId);
      expect(operation.operationType).to.equal(1); // CERTIFICATE_BRIDGE

      // Process on L2
      await l2Bridge.connect(bridgeOperator).processCertificateBridge(
        operationId,
        certificateId,
        user1.address,
        "ipfs://certificate-l2",
        operation.data
      );

      // Verify certificate on L2
      expect(await l2CertificateNFT.ownerOf(certificateId)).to.equal(user1.address);
    });

    it("debería manejar bridge de certificados con metadata personalizada", async function () {
      // Mint certificate with custom metadata
      const customMetadata = "ipfs://custom-metadata-l1";
      await l1CertificateNFT.connect(owner).mintCertificate(
        user2.address,
        1,
        customMetadata,
        95
      );

      const certificateId = 0;
      await l1CertificateNFT.connect(user2).approve(l1Bridge.address, certificateId);

      // Bridge with updated metadata
      await l1Bridge.connect(user2).initiateCertificateBridge(
        certificateId,
        user2.address
      );

      const operationId = 0;
      const operation = await l1Bridge.getOperation(operationId);

      // Process with new metadata
      const newMetadata = "ipfs://updated-metadata-l2";
      await l2Bridge.connect(bridgeOperator).processCertificateBridge(
        operationId,
        certificateId,
        user2.address,
        newMetadata,
        operation.data
      );

      // Verify metadata update
      const tokenURI = await l2CertificateNFT.tokenURI(certificateId);
      expect(tokenURI).to.equal(newMetadata);
    });
  });

  describe("Message Bridge Operations", function () {
    it("debería transferir mensajes entre L1 y L2", async function () {
      const messageData = ethers.utils.toUtf8Bytes("Hello from L1 to L2");
      const messageId = ethers.utils.keccak256(messageData);

      // Send message from L1 to L2
      await l1Bridge.connect(user1).sendMessage(
        user2.address,
        messageData
      );

      // Verify message received
      const isProcessed = await l1Bridge.isMessageProcessed(messageId);
      expect(isProcessed).to.be.true;

      // Process message on L2
      await l2Bridge.connect(bridgeOperator).processMessage(
        messageId,
        user1.address,
        user2.address,
        messageData
      );

      // Verify message on L2
      const l2MessageProcessed = await l2Bridge.isMessageProcessed(messageId);
      expect(l2MessageProcessed).to.be.true;
    });

    it("debería manejar mensajes complejos con datos estructurados", async function () {
      // Create structured data
      const structuredData = {
        action: "updateProfile",
        userId: user1.address,
        data: "ipfs://profile-update",
        timestamp: Math.floor(Date.now() / 1000)
      };

      const messageData = ethers.utils.toUtf8Bytes(JSON.stringify(structuredData));
      const messageId = ethers.utils.keccak256(messageData);

      // Send structured message
      await l1Bridge.connect(user1).sendMessage(
        l2BrainSafes.address,
        messageData
      );

      // Process on L2
      await l2Bridge.connect(bridgeOperator).processMessage(
        messageId,
        user1.address,
        l2BrainSafes.address,
        messageData
      );

      // Verify processing
      const isProcessed = await l2Bridge.isMessageProcessed(messageId);
      expect(isProcessed).to.be.true;
    });
  });

  describe("Bridge Security and Validation", function () {
    it("debería validar operaciones con múltiples validadores", async function () {
      const transferAmount = ethers.utils.parseEther("100");
      await l1EduToken.connect(user1).approve(l1Bridge.address, transferAmount);

      // Initiate transfer
      await l1Bridge.connect(user1).initiateTokenDeposit(
        user1.address,
        transferAmount
      );

      const operationId = 0;
      const operation = await l1Bridge.getOperation(operationId);

      // Multiple validators approve
      await l1Bridge.connect(validator).validateOperation(operationId, true);
      
      // Add another validator
      const validator2 = addrs[0];
      await l1Bridge.grantRole(await l1Bridge.VALIDATOR_ROLE(), validator2.address);
      await l1Bridge.connect(validator2).validateOperation(operationId, true);

      // Process after validation
      await l2Bridge.connect(bridgeOperator).processL1ToL2Transfer(
        operationId,
        user1.address,
        transferAmount,
        operation.data
      );

      // Verify successful transfer
      const l2Balance = await l2EduToken.balanceOf(user1.address);
      expect(l2Balance).to.be.gt(ethers.utils.parseEther("500")); // Initial + transferred
    });

    it("debería rechazar operaciones inválidas", async function () {
      const invalidAmount = ethers.utils.parseEther("1000000"); // Amount too large
      
      await l1EduToken.connect(user1).approve(l1Bridge.address, invalidAmount);

      // Try to initiate invalid transfer
      await expect(
        l1Bridge.connect(user1).initiateTokenDeposit(
          user1.address,
          invalidAmount
        )
      ).to.be.revertedWith("Insufficient balance");

      // Verify no operation was created
      const operationCount = await l1Bridge.operationCounter();
      expect(operationCount).to.equal(0);
    });

    it("debería manejar operaciones fallidas y recovery", async function () {
      const transferAmount = ethers.utils.parseEther("100");
      await l1EduToken.connect(user1).approve(l1Bridge.address, transferAmount);

      // Initiate transfer
      await l1Bridge.connect(user1).initiateTokenDeposit(
        user1.address,
        transferAmount
      );

      const operationId = 0;
      const operation = await l1Bridge.getOperation(operationId);

      // Simulate failed processing
      await l1Bridge.connect(bridgeOperator).markOperationFailed(operationId);

      // Verify operation status
      const failedOperation = await l1Bridge.getOperation(operationId);
      expect(failedOperation.status).to.equal(3); // FAILED

      // Allow retry
      await l1Bridge.connect(bridgeOperator).retryOperation(operationId);

      // Process successfully
      await l2Bridge.connect(bridgeOperator).processL1ToL2Transfer(
        operationId,
        user1.address,
        transferAmount,
        operation.data
      );

      // Verify final status
      const finalOperation = await l1Bridge.getOperation(operationId);
      expect(finalOperation.status).to.equal(2); // COMPLETED
    });
  });

  describe("Bridge Performance and Gas Optimization", function () {
    it("debería optimizar gas en operaciones batch de bridge", async function () {
      const batchSize = 50;
      const transferAmount = ethers.utils.parseEther("10");
      const users = addrs.slice(0, batchSize);

      // Setup batch
      for (let i = 0; i < batchSize; i++) {
        await l1EduToken.mint(users[i].address, ethers.utils.parseEther("100"));
        await l1EduToken.connect(users[i]).approve(l1Bridge.address, transferAmount);
      }

      // Measure gas for batch operations
      const gasBefore = await ethers.provider.getBalance(owner.address);
      const startTime = Date.now();

      // Execute batch
      const batchPromises = users.map(user => 
        l1Bridge.connect(user).initiateTokenDeposit(user.address, transferAmount)
      );
      await Promise.all(batchPromises);

      const endTime = Date.now();
      const gasAfter = await ethers.provider.getBalance(owner.address);
      const gasUsed = gasBefore.sub(gasAfter);

      console.log(`Batch bridge operations (${batchSize}):`);
      console.log(`- Time: ${endTime - startTime}ms`);
      console.log(`- Gas: ${ethers.utils.formatEther(gasUsed)} ETH`);
      console.log(`- Gas per operation: ${ethers.utils.formatEther(gasUsed.div(batchSize))} ETH`);

      // Verify all operations
      for (let i = 0; i < batchSize; i++) {
        const operation = await l1Bridge.getOperation(i);
        expect(operation.operationType).to.equal(0); // TOKEN_DEPOSIT
      }
    });

    it("debería manejar límites de gas en operaciones masivas", async function () {
      const largeBatchSize = 1000;
      const transferAmount = ethers.utils.parseEther("1");

      let gasExceeded = false;
      try {
        // Try to process very large batch
        for (let i = 0; i < largeBatchSize; i++) {
          const user = addrs[i % addrs.length];
          await l1EduToken.mint(user.address, ethers.utils.parseEther("10"));
          await l1EduToken.connect(user).approve(l1Bridge.address, transferAmount);
          await l1Bridge.connect(user).initiateTokenDeposit(user.address, transferAmount);
        }
      } catch (error) {
        if (error.message.includes("out of gas") || error.message.includes("gas limit")) {
          gasExceeded = true;
        }
      }

      expect(gasExceeded).to.be.true;
      console.log("✅ Gas limit detected correctly in massive bridge operations");
    });
  });

  describe("Bridge Error Handling and Recovery", function () {
    it("debería manejar errores de red y reconexión", async function () {
      const transferAmount = ethers.utils.parseEther("50");
      await l1EduToken.connect(user1).approve(l1Bridge.address, transferAmount);

      // Initiate transfer
      await l1Bridge.connect(user1).initiateTokenDeposit(
        user1.address,
        transferAmount
      );

      const operationId = 0;
      const operation = await l1Bridge.getOperation(operationId);

      // Simulate network error during processing
      await l1Bridge.connect(bridgeOperator).markOperationFailed(operationId);

      // Verify operation is marked as failed
      const failedOperation = await l1Bridge.getOperation(operationId);
      expect(failedOperation.status).to.equal(3); // FAILED

      // Retry after network recovery
      await l1Bridge.connect(bridgeOperator).retryOperation(operationId);
      await l2Bridge.connect(bridgeOperator).processL1ToL2Transfer(
        operationId,
        user1.address,
        transferAmount,
        operation.data
      );

      // Verify successful completion
      const finalOperation = await l1Bridge.getOperation(operationId);
      expect(finalOperation.status).to.equal(2); // COMPLETED
    });

    it("debería manejar operaciones duplicadas", async function () {
      const transferAmount = ethers.utils.parseEther("100");
      await l1EduToken.connect(user1).approve(l1Bridge.address, transferAmount);

      // Initiate transfer
      await l1Bridge.connect(user1).initiateTokenDeposit(
        user1.address,
        transferAmount
      );

      const operationId = 0;
      const operation = await l1Bridge.getOperation(operationId);

      // Process first time
      await l2Bridge.connect(bridgeOperator).processL1ToL2Transfer(
        operationId,
        user1.address,
        transferAmount,
        operation.data
      );

      // Try to process again (duplicate)
      await expect(
        l2Bridge.connect(bridgeOperator).processL1ToL2Transfer(
          operationId,
          user1.address,
          transferAmount,
          operation.data
        )
      ).to.be.revertedWith("Operation already processed");

      // Verify operation status remains completed
      const finalOperation = await l1Bridge.getOperation(operationId);
      expect(finalOperation.status).to.equal(2); // COMPLETED
    });
  });

  describe("Bridge Monitoring and Analytics", function () {
    it("debería trackear métricas de bridge", async function () {
      const operations = [];
      
      // Create multiple operations
      for (let i = 0; i < 10; i++) {
        const user = addrs[i];
        const amount = ethers.utils.parseEther("10");
        
        await l1EduToken.mint(user.address, ethers.utils.parseEther("100"));
        await l1EduToken.connect(user).approve(l1Bridge.address, amount);
        
        operations.push(
          l1Bridge.connect(user).initiateTokenDeposit(user.address, amount)
        );
      }

      await Promise.all(operations);

      // Get bridge statistics
      const totalOperations = await l1Bridge.operationCounter();
      expect(totalOperations).to.equal(10);

      // Verify operation types distribution
      let tokenDeposits = 0;
      let tokenWithdrawals = 0;
      let certificateBridges = 0;

      for (let i = 0; i < totalOperations; i++) {
        const operation = await l1Bridge.getOperation(i);
        if (operation.operationType === 0) tokenDeposits++;
        else if (operation.operationType === 1) tokenWithdrawals++;
        else if (operation.operationType === 2) certificateBridges++;
      }

      expect(tokenDeposits).to.equal(10);
      expect(tokenWithdrawals).to.equal(0);
      expect(certificateBridges).to.equal(0);

      console.log("📊 Bridge Analytics:");
      console.log(`- Total operations: ${totalOperations}`);
      console.log(`- Token deposits: ${tokenDeposits}`);
      console.log(`- Token withdrawals: ${tokenWithdrawals}`);
      console.log(`- Certificate bridges: ${certificateBridges}`);
    });

    it("debería monitorear performance del bridge", async function () {
      const performanceMetrics = {
        totalOperations: 0,
        successfulOperations: 0,
        failedOperations: 0,
        averageProcessingTime: 0
      };

      // Execute test operations
      const startTime = Date.now();
      
      for (let i = 0; i < 5; i++) {
        const user = addrs[i];
        const amount = ethers.utils.parseEther("10");
        
        await l1EduToken.mint(user.address, ethers.utils.parseEther("100"));
        await l1EduToken.connect(user).approve(l1Bridge.address, amount);
        await l1Bridge.connect(user).initiateTokenDeposit(user.address, amount);
        
        performanceMetrics.totalOperations++;
      }

      const endTime = Date.now();
      performanceMetrics.averageProcessingTime = (endTime - startTime) / 5;

      // Count successful operations
      for (let i = 0; i < 5; i++) {
        const operation = await l1Bridge.getOperation(i);
        if (operation.status === 2) { // COMPLETED
          performanceMetrics.successfulOperations++;
        } else if (operation.status === 3) { // FAILED
          performanceMetrics.failedOperations++;
        }
      }

      console.log("🚀 Bridge Performance Metrics:");
      console.log(`- Total operations: ${performanceMetrics.totalOperations}`);
      console.log(`- Successful: ${performanceMetrics.successfulOperations}`);
      console.log(`- Failed: ${performanceMetrics.failedOperations}`);
      console.log(`- Success rate: ${(performanceMetrics.successfulOperations / performanceMetrics.totalOperations * 100).toFixed(2)}%`);
      console.log(`- Avg processing time: ${performanceMetrics.averageProcessingTime.toFixed(2)}ms`);

      expect(performanceMetrics.successfulOperations).to.be.gt(0);
      expect(performanceMetrics.averageProcessingTime).to.be.lt(10000); // Max 10 seconds
    });
  });
});
