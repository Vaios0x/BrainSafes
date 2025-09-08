const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("BrainSafes - Stress Testing de Operaciones Batch", function () {
  let brainSafes, eduToken, courseNFT, certificateNFT, enhancedMulticall;
  let owner, instructor, students;
  let addrs;

  beforeEach(async function () {
    [owner, instructor, ...addrs] = await ethers.getSigners();
    students = addrs.slice(0, 100); // 100 estudiantes para testing

    // Deploy contracts
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

    // Setup roles
    await brainSafes.grantRole(await brainSafes.INSTRUCTOR_ROLE(), instructor.address);
    for (let i = 0; i < students.length; i++) {
      await brainSafes.grantRole(await brainSafes.STUDENT_ROLE(), students[i].address);
      await eduToken.mint(students[i].address, ethers.utils.parseEther("1000"));
    }
  });

  describe("Stress Testing de Mint Batch de NFTs", function () {
    it("debería manejar 1000 mints de certificados en batch", async function () {
      const batchSize = 1000;
      const batch = [];
      
      // Preparar datos para batch mint
      for (let i = 0; i < batchSize; i++) {
        batch.push({
          to: students[i % students.length].address,
          courseId: i % 10,
          metadata: `ipfs://certificate-${i}`,
          score: 85 + (i % 15)
        });
      }

      // Medir gas antes
      const gasBefore = await ethers.provider.getBalance(owner.address);
      const startTime = Date.now();

      // Ejecutar batch mint
      for (let i = 0; i < batch.length; i += 50) { // Procesar en chunks de 50
        const chunk = batch.slice(i, i + 50);
        const promises = chunk.map(item => 
          certificateNFT.connect(instructor).mintCertificate(
            item.to,
            item.courseId,
            item.metadata,
            item.score
          )
        );
        await Promise.all(promises);
      }

      const endTime = Date.now();
      const gasAfter = await ethers.provider.getBalance(owner.address);
      const gasUsed = gasBefore.sub(gasAfter);

      console.log(`Batch mint de ${batchSize} NFTs:`);
      console.log(`- Tiempo total: ${endTime - startTime}ms`);
      console.log(`- Gas usado: ${ethers.utils.formatEther(gasUsed)} ETH`);

      // Verificar todos los NFTs fueron minted
      for (let i = 0; i < batchSize; i++) {
        expect(await certificateNFT.ownerOf(i)).to.equal(batch[i].to);
      }

      // Verificar límites de gas
      expect(gasUsed).to.be.lt(ethers.utils.parseEther("10")); // Máximo 10 ETH en gas
    });

    it("debería manejar batch de inscripciones masivas", async function () {
      // Crear curso
      await courseNFT.connect(instructor).createCourse(
        "Stress Test Course",
        "Curso para testing masivo",
        "ipfs://content",
        ethers.utils.parseEther("50"),
        30,
        1000, // Máximo 1000 estudiantes
        ["Testing"],
        2
      );

      const courseId = 0;
      const batchSize = 500;

      // Preparar batch de inscripciones
      const enrollPromises = [];
      for (let i = 0; i < batchSize; i++) {
        const student = students[i % students.length];
        enrollPromises.push(
          eduToken.connect(student).approve(courseNFT.address, ethers.utils.parseEther("50"))
        );
        enrollPromises.push(
          courseNFT.connect(student).enrollInCourse(courseId)
        );
      }

      // Medir performance
      const startTime = Date.now();
      const gasBefore = await ethers.provider.getBalance(owner.address);

      // Ejecutar batch
      await Promise.all(enrollPromises);

      const endTime = Date.now();
      const gasAfter = await ethers.provider.getBalance(owner.address);
      const gasUsed = gasBefore.sub(gasAfter);

      console.log(`Batch enrollment de ${batchSize} estudiantes:`);
      console.log(`- Tiempo: ${endTime - startTime}ms`);
      console.log(`- Gas: ${ethers.utils.formatEther(gasUsed)} ETH`);

      // Verificar inscripciones
      for (let i = 0; i < batchSize; i++) {
        const student = students[i % students.length];
        const enrollment = await brainSafes.getEnrollment(courseId, student.address);
        expect(enrollment.student).to.equal(student.address);
      }
    });
  });

  describe("Stress Testing de Multicall", function () {
    it("debería procesar 1000 operaciones multicall simultáneas", async function () {
      const multicallSize = 1000;
      const calls = [];

      // Preparar llamadas multicall
      for (let i = 0; i < multicallSize; i++) {
        const student = students[i % students.length];
        const data = eduToken.interface.encodeFunctionData("balanceOf", [student.address]);
        calls.push({
          target: eduToken.address,
          data: data
        });
      }

      // Medir performance
      const startTime = Date.now();
      const gasBefore = await ethers.provider.getBalance(owner.address);

      // Ejecutar multicall
      const results = await enhancedMulticall.connect(owner).multicall(calls);

      const endTime = Date.now();
      const gasAfter = await ethers.provider.getBalance(owner.address);
      const gasUsed = gasBefore.sub(gasAfter);

      console.log(`Multicall de ${multicallSize} operaciones:`);
      console.log(`- Tiempo: ${endTime - startTime}ms`);
      console.log(`- Gas: ${ethers.utils.formatEther(gasUsed)} ETH`);
      console.log(`- Resultados: ${results.length}`);

      // Verificar resultados
      expect(results.length).to.equal(multicallSize);
      for (let i = 0; i < results.length; i++) {
        expect(results[i].success).to.be.true;
      }
    });

    it("debería manejar multicall con operaciones mixtas", async function () {
      const mixedCalls = [];
      
      // Mezclar diferentes tipos de operaciones
      for (let i = 0; i < 100; i++) {
        const student = students[i % students.length];
        
        // Balance check
        mixedCalls.push({
          target: eduToken.address,
          data: eduToken.interface.encodeFunctionData("balanceOf", [student.address])
        });

        // Approve
        mixedCalls.push({
          target: eduToken.address,
          data: eduToken.interface.encodeFunctionData("approve", [
            courseNFT.address,
            ethers.utils.parseEther("100")
          ])
        });

        // Get user profile
        mixedCalls.push({
          target: brainSafes.address,
          data: brainSafes.interface.encodeFunctionData("getUserProfile", [student.address])
        });
      }

      const startTime = Date.now();
      const results = await enhancedMulticall.connect(owner).multicall(mixedCalls);
      const endTime = Date.now();

      console.log(`Multicall mixto de ${mixedCalls.length} operaciones:`);
      console.log(`- Tiempo: ${endTime - startTime}ms`);
      console.log(`- Éxitos: ${results.filter(r => r.success).length}`);
      console.log(`- Fallos: ${results.filter(r => !r.success).length}`);

      expect(results.length).to.equal(mixedCalls.length);
    });
  });

  describe("Stress Testing de Bridge Operations", function () {
    it("debería procesar 500 operaciones de bridge simultáneas", async function () {
      const BrainSafesBridge = await ethers.getContractFactory("BrainSafesBridge");
      const bridge = await BrainSafesBridge.deploy(
        brainSafes.address,
        brainSafes.address,
        eduToken.address,
        certificateNFT.address
      );
      await bridge.deployed();

      // Mint certificados para bridge
      for (let i = 0; i < 100; i++) {
        await certificateNFT.connect(instructor).mintCertificate(
          students[i % students.length].address,
          i % 10,
          `ipfs://cert-${i}`,
          85
        );
      }

      const bridgeOperations = [];
      for (let i = 0; i < 500; i++) {
        const student = students[i % students.length];
        const certificateId = i % 100;
        
        // Approve bridge
        await certificateNFT.connect(student).approve(bridge.address, certificateId);
        
        bridgeOperations.push(
          bridge.connect(student).initiateCertificateBridge(certificateId, student.address)
        );
      }

      const startTime = Date.now();
      await Promise.all(bridgeOperations);
      const endTime = Date.now();

      console.log(`Bridge operations de ${bridgeOperations.length} certificados:`);
      console.log(`- Tiempo: ${endTime - startTime}ms`);

      // Verificar operaciones
      for (let i = 0; i < 500; i++) {
        const operation = await bridge.getOperation(i);
        expect(operation.operationType).to.equal(1); // CERTIFICATE_BRIDGE
      }
    });
  });

  describe("Stress Testing de Gas Limits", function () {
    it("debería detectar límites de gas en operaciones masivas", async function () {
      const largeBatch = [];
      
      // Crear batch que exceda límites de gas
      for (let i = 0; i < 10000; i++) {
        largeBatch.push({
          to: students[i % students.length].address,
          courseId: i % 100,
          metadata: `ipfs://large-batch-${i}`,
          score: 85
        });
      }

      let gasExceeded = false;
      try {
        // Intentar batch masivo
        for (let i = 0; i < largeBatch.length; i++) {
          await certificateNFT.connect(instructor).mintCertificate(
            largeBatch[i].to,
            largeBatch[i].courseId,
            largeBatch[i].metadata,
            largeBatch[i].score
          );
        }
      } catch (error) {
        if (error.message.includes("out of gas") || error.message.includes("gas limit")) {
          gasExceeded = true;
        }
      }

      expect(gasExceeded).to.be.true;
      console.log("✅ Límite de gas detectado correctamente en operación masiva");
    });

    it("debería optimizar gas en operaciones batch", async function () {
      const optimizedBatch = [];
      const batchSize = 100;

      // Preparar batch optimizado
      for (let i = 0; i < batchSize; i++) {
        optimizedBatch.push({
          to: students[i % students.length].address,
          courseId: 0, // Mismo curso para optimizar
          metadata: `ipfs://optimized-${i}`,
          score: 85
        });
      }

      // Medir gas con optimización
      const gasBefore = await ethers.provider.getBalance(owner.address);
      const startTime = Date.now();

      // Ejecutar batch optimizado
      for (const item of optimizedBatch) {
        await certificateNFT.connect(instructor).mintCertificate(
          item.to,
          item.courseId,
          item.metadata,
          item.score
        );
      }

      const endTime = Date.now();
      const gasAfter = await ethers.provider.getBalance(owner.address);
      const gasUsed = gasBefore.sub(gasAfter);

      console.log(`Batch optimizado de ${batchSize} NFTs:`);
      console.log(`- Tiempo: ${endTime - startTime}ms`);
      console.log(`- Gas por NFT: ${ethers.utils.formatEther(gasUsed.div(batchSize))} ETH`);

      // Verificar que el gas por operación es razonable
      const gasPerOperation = gasUsed.div(batchSize);
      expect(gasPerOperation).to.be.lt(ethers.utils.parseEther("0.01")); // Máximo 0.01 ETH por NFT
    });
  });

  describe("Stress Testing de Concurrencia", function () {
    it("debería manejar operaciones concurrentes sin conflictos", async function () {
      const concurrentOperations = 50;
      const promises = [];

      // Crear operaciones concurrentes
      for (let i = 0; i < concurrentOperations; i++) {
        const student = students[i % students.length];
        
        promises.push(
          eduToken.connect(student).approve(courseNFT.address, ethers.utils.parseEther("100"))
        );
        
        promises.push(
          brainSafes.connect(student).updateProfile(
            `Student ${i}`,
            `student${i}@test.com`,
            `ipfs://profile-${i}`
          )
        );
      }

      const startTime = Date.now();
      await Promise.all(promises);
      const endTime = Date.now();

      console.log(`Operaciones concurrentes: ${concurrentOperations * 2}`);
      console.log(`- Tiempo: ${endTime - startTime}ms`);

      // Verificar que no hay conflictos
      for (let i = 0; i < concurrentOperations; i++) {
        const student = students[i % students.length];
        const profile = await brainSafes.getUserProfile(student.address);
        expect(profile.name).to.equal(`Student ${i}`);
      }
    });

    it("debería manejar race conditions en operaciones críticas", async function () {
      // Crear situación de race condition
      const courseId = 0;
      await courseNFT.connect(instructor).createCourse(
        "Race Condition Course",
        "Testing race conditions",
        "ipfs://content",
        ethers.utils.parseEther("50"),
        30,
        10, // Solo 10 cupos
        ["Testing"],
        2
      );

      const racePromises = [];
      for (let i = 0; i < 20; i++) { // 20 estudiantes compitiendo por 10 cupos
        const student = students[i];
        racePromises.push(
          courseNFT.connect(student).enrollInCourse(courseId)
        );
      }

      // Ejecutar operaciones de carrera
      const results = await Promise.allSettled(racePromises);
      
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      console.log(`Race condition test:`);
      console.log(`- Exitosos: ${successful}`);
      console.log(`- Fallidos: ${failed}`);

      // Verificar que solo 10 estudiantes se inscribieron
      let enrolledCount = 0;
      for (let i = 0; i < 20; i++) {
        try {
          const enrollment = await brainSafes.getEnrollment(courseId, students[i].address);
          if (enrollment.student === students[i].address) {
            enrolledCount++;
          }
        } catch (error) {
          // Estudiante no inscrito
        }
      }

      expect(enrolledCount).to.equal(10);
    });
  });

  describe("Stress Testing de Memoria y Storage", function () {
    it("debería manejar grandes volúmenes de datos en storage", async function () {
      const largeDataSize = 1000;
      const largeMetadata = "a".repeat(1000); // 1KB de metadata

      const storagePromises = [];
      for (let i = 0; i < largeDataSize; i++) {
        storagePromises.push(
          certificateNFT.connect(instructor).mintCertificate(
            students[i % students.length].address,
            i % 10,
            `ipfs://${largeMetadata}-${i}`,
            85
          )
        );
      }

      const startTime = Date.now();
      await Promise.all(storagePromises);
      const endTime = Date.now();

      console.log(`Storage test con ${largeDataSize} NFTs de 1KB cada uno:`);
      console.log(`- Tiempo: ${endTime - startTime}ms`);
      console.log(`- Total data: ${largeDataSize}KB`);

      // Verificar que todos los NFTs fueron creados
      for (let i = 0; i < largeDataSize; i++) {
        expect(await certificateNFT.ownerOf(i)).to.equal(students[i % students.length].address);
      }
    });

    it("debería limpiar storage cuando sea necesario", async function () {
      // Crear muchos certificados
      for (let i = 0; i < 100; i++) {
        await certificateNFT.connect(instructor).mintCertificate(
          students[i % students.length].address,
          i % 10,
          `ipfs://temp-${i}`,
          85
        );
      }

      // Simular limpieza de storage (revocar certificados)
      for (let i = 0; i < 50; i++) {
        await certificateNFT.connect(instructor).revokeCertificate(i);
      }

      // Verificar que los certificados fueron revocados
      for (let i = 0; i < 50; i++) {
        await expect(certificateNFT.ownerOf(i)).to.be.revertedWith("Token does not exist");
      }

      console.log("✅ Limpieza de storage completada correctamente");
    });
  });

  describe("Performance Benchmarking", function () {
    it("debería establecer benchmarks de performance", async function () {
      const benchmarks = {
        singleMint: 0,
        batchMint: 0,
        multicall: 0,
        bridgeOperation: 0
      };

      // Benchmark: Single mint
      const singleStart = Date.now();
      await certificateNFT.connect(instructor).mintCertificate(
        students[0].address,
        0,
        "ipfs://benchmark-single",
        85
      );
      benchmarks.singleMint = Date.now() - singleStart;

      // Benchmark: Batch mint (10 NFTs)
      const batchStart = Date.now();
      for (let i = 0; i < 10; i++) {
        await certificateNFT.connect(instructor).mintCertificate(
          students[i % students.length].address,
          i,
          `ipfs://benchmark-batch-${i}`,
          85
        );
      }
      benchmarks.batchMint = Date.now() - batchStart;

      // Benchmark: Multicall (10 operations)
      const multicallCalls = [];
      for (let i = 0; i < 10; i++) {
        multicallCalls.push({
          target: eduToken.address,
          data: eduToken.interface.encodeFunctionData("balanceOf", [students[i].address])
        });
      }

      const multicallStart = Date.now();
      await enhancedMulticall.connect(owner).multicall(multicallCalls);
      benchmarks.multicall = Date.now() - multicallStart;

      console.log("📊 Performance Benchmarks:");
      console.log(`- Single mint: ${benchmarks.singleMint}ms`);
      console.log(`- Batch mint (10): ${benchmarks.batchMint}ms`);
      console.log(`- Multicall (10): ${benchmarks.multicall}ms`);

      // Verificar que los benchmarks son razonables
      expect(benchmarks.singleMint).to.be.lt(5000); // Máximo 5 segundos
      expect(benchmarks.batchMint).to.be.lt(30000); // Máximo 30 segundos
      expect(benchmarks.multicall).to.be.lt(10000); // Máximo 10 segundos
    });
  });
});
