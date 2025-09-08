const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("BrainSafes - Integración Completa del Ecosistema", function () {
  let brainSafes, eduToken, courseNFT, certificateNFT, scholarshipManager;
  let aiOracle, bridge, governance, marketplace, userExperience;
  let owner, instructor, student, organization, aiOperator;
  let addrs;

  beforeEach(async function () {
    [owner, instructor, student, organization, aiOperator, ...addrs] = await ethers.getSigners();

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

    const ScholarshipManager = await ethers.getContractFactory("ScholarshipManager");
    scholarshipManager = await ScholarshipManager.deploy(brainSafes.address);
    await scholarshipManager.deployed();

    const AIOracle = await ethers.getContractFactory("AIOracle");
    aiOracle = await AIOracle.deploy(brainSafes.address);
    await aiOracle.deployed();

    const BrainSafesBridge = await ethers.getContractFactory("BrainSafesBridge");
    bridge = await BrainSafesBridge.deploy(
      brainSafes.address,
      brainSafes.address, // L2 address placeholder
      eduToken.address,
      certificateNFT.address
    );
    await bridge.deployed();

    const BrainSafesGovernance = await ethers.getContractFactory("BrainSafesGovernance");
    governance = await BrainSafesGovernance.deploy(brainSafes.address);
    await governance.deployed();

    const JobMarketplace = await ethers.getContractFactory("JobMarketplace");
    marketplace = await JobMarketplace.deploy(brainSafes.address);
    await marketplace.deployed();

    const UserExperience = await ethers.getContractFactory("UserExperience");
    userExperience = await UserExperience.deploy();
    await userExperience.deployed();

    // Setup roles and permissions
    await brainSafes.grantRole(await brainSafes.INSTRUCTOR_ROLE(), instructor.address);
    await brainSafes.grantRole(await brainSafes.STUDENT_ROLE(), student.address);
    await brainSafes.grantRole(await brainSafes.ORGANIZATION_ROLE(), organization.address);
    await brainSafes.grantRole(await brainSafes.AI_ORACLE_ROLE(), aiOperator.address);

    // Mint initial tokens
    await eduToken.mint(student.address, ethers.utils.parseEther("1000"));
    await eduToken.mint(instructor.address, ethers.utils.parseEther("500"));
  });

  describe("Flujo Completo de Educación", function () {
    it("debería completar un ciclo completo de educación: curso → certificado → reputación", async function () {
      // 1. Instructor crea curso
      const courseData = {
        title: "Blockchain Development",
        description: "Curso completo de desarrollo blockchain",
        ipfsContent: "ipfs://course-content",
        price: ethers.utils.parseEther("100"),
        duration: 30,
        maxStudents: 50,
        skills: ["Solidity", "Web3", "DeFi"],
        difficulty: 3
      };

      await courseNFT.connect(instructor).createCourse(
        courseData.title,
        courseData.description,
        courseData.ipfsContent,
        courseData.price,
        courseData.duration,
        courseData.maxStudents,
        courseData.skills,
        courseData.difficulty
      );

      const courseId = 0;
      expect(await courseNFT.getCourse(courseId)).to.not.be.undefined;

      // 2. Estudiante se inscribe
      await eduToken.connect(student).approve(courseNFT.address, courseData.price);
      await courseNFT.connect(student).enrollInCourse(courseId);

      const enrollment = await brainSafes.getEnrollment(courseId, student.address);
      expect(enrollment.student).to.equal(student.address);
      expect(enrollment.progress).to.equal(0);

      // 3. Estudiante completa el curso
      await brainSafes.connect(instructor).updateStudentProgress(
        courseId,
        student.address,
        100,
        95
      );

      const updatedEnrollment = await brainSafes.getEnrollment(courseId, student.address);
      expect(updatedEnrollment.progress).to.equal(100);
      expect(updatedEnrollment.completed).to.be.true;

      // 4. Se emite certificado
      await certificateNFT.connect(instructor).mintCertificate(
        student.address,
        courseId,
        "ipfs://certificate-metadata",
        95
      );

      const certificateId = 0;
      expect(await certificateNFT.ownerOf(certificateId)).to.equal(student.address);

      // 5. Se actualiza reputación
      const studentProfile = await brainSafes.getUserProfile(student.address);
      expect(studentProfile.reputation).to.be.gt(0);
    });

    it("debería manejar becas y recompensas correctamente", async function () {
      // Crear beca
      await scholarshipManager.connect(organization).createScholarship(
        "Beca Blockchain",
        ethers.utils.parseEther("500"),
        10,
        "ipfs://scholarship-details"
      );

      const scholarshipId = 0;
      
      // Aplicar a beca
      await scholarshipManager.connect(student).applyForScholarship(
        scholarshipId,
        "ipfs://application"
      );

      // Aprobar beca
      await scholarshipManager.connect(organization).approveScholarship(
        scholarshipId,
        student.address
      );

      // Verificar fondos transferidos
      const balance = await eduToken.balanceOf(student.address);
      expect(balance).to.be.gt(ethers.utils.parseEther("1000"));
    });
  });

  describe("Integración AI y Oracle", function () {
    it("debería procesar insights de AI y actualizar perfiles", async function () {
      // Simular predicción de AI
      const prediction = {
        performancePrediction: 85,
        recommendedCourses: [0, 1, 2],
        learningStyle: "Visual",
        riskScore: 15
      };

      await aiOracle.connect(aiOperator).updateAIInsight(
        student.address,
        prediction.performancePrediction,
        prediction.recommendedCourses,
        prediction.learningStyle,
        prediction.riskScore
      );

      const insight = await brainSafes.getAIInsight(student.address);
      expect(insight.performancePrediction).to.equal(prediction.performancePrediction);
      expect(insight.learningStyle).to.equal(prediction.learningStyle);
    });

    it("debería validar datos externos a través de oracles", async function () {
      const externalData = "ipfs://external-validation-data";
      const validationHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(externalData));

      await aiOracle.connect(aiOperator).validateExternalData(
        validationHash,
        externalData,
        95 // confidence score
      );

      const isValid = await aiOracle.isDataValidated(validationHash);
      expect(isValid).to.be.true;
    });
  });

  describe("Integración de Marketplace", function () {
    it("debería conectar educación con empleo", async function () {
      // Crear oferta de trabajo
      await marketplace.connect(organization).createJobPosting(
        "Blockchain Developer",
        "Desarrollador Solidity Senior",
        ethers.utils.parseEther("5000"),
        ["Solidity", "Web3"],
        "ipfs://job-description"
      );

      const jobId = 0;

      // Estudiante aplica con certificado
      await marketplace.connect(student).applyForJob(
        jobId,
        [0], // certificate IDs
        "ipfs://resume"
      );

      // Verificar aplicación
      const application = await marketplace.getJobApplication(jobId, student.address);
      expect(application.applicant).to.equal(student.address);
    });
  });

  describe("Integración de Bridge y Cross-Chain", function () {
    it("debería transferir certificados entre L1 y L2", async function () {
      // Mint certificado en L1
      await certificateNFT.connect(instructor).mintCertificate(
        student.address,
        0,
        "ipfs://certificate-l1",
        90
      );

      const certificateId = 0;

      // Iniciar bridge operation
      await certificateNFT.connect(student).approve(bridge.address, certificateId);
      await bridge.connect(student).initiateCertificateBridge(
        certificateId,
        student.address
      );

      const operationId = 0;
      const operation = await bridge.getOperation(operationId);
      expect(operation.operationType).to.equal(1); // CERTIFICATE_BRIDGE
      expect(operation.status).to.equal(0); // PENDING
    });
  });

  describe("Integración de Gobernanza", function () {
    it("debería permitir votación y propuestas", async function () {
      // Crear propuesta
      await governance.connect(owner).createProposal(
        "Actualizar fee de plataforma",
        "Reducir fee de 2.5% a 2%",
        ethers.utils.parseEther("1000"), // quorum
        7 * 24 * 3600 // 7 días
      );

      const proposalId = 0;

      // Votar
      await governance.connect(student).vote(proposalId, true);

      // Verificar voto
      const hasVoted = await governance.hasVoted(proposalId, student.address);
      expect(hasVoted).to.be.true;
    });
  });

  describe("Integración de UX y Analytics", function () {
    it("debería trackear métricas de usuario y optimizaciones", async function () {
      // Submit feedback
      await userExperience.connect(student).submitFeedback(
        "Excelente plataforma",
        5,
        "General"
      );

      // Record gas optimization
      await userExperience.connect(owner).recordGasOptimization(
        student.address,
        50000,
        "Used multicall for batch operations"
      );

      // Get analytics
      const analytics = await userExperience.getUserAnalytics(student.address);
      expect(analytics.feedbackCount).to.equal(1);
      expect(analytics.gasSaved).to.equal(50000);
    });
  });

  describe("Stress Testing de Integración", function () {
    it("debería manejar múltiples usuarios simultáneos", async function () {
      const users = addrs.slice(0, 10);
      
      // Crear curso
      await courseNFT.connect(instructor).createCourse(
        "Stress Test Course",
        "Curso para testing",
        "ipfs://content",
        ethers.utils.parseEther("50"),
        7,
        100,
        ["Testing"],
        2
      );

      // Múltiples inscripciones simultáneas
      const enrollPromises = users.map(async (user) => {
        await eduToken.mint(user.address, ethers.utils.parseEther("100"));
        await eduToken.connect(user).approve(courseNFT.address, ethers.utils.parseEther("50"));
        return courseNFT.connect(user).enrollInCourse(0);
      });

      await Promise.all(enrollPromises);

      // Verificar todas las inscripciones
      for (let i = 0; i < users.length; i++) {
        const enrollment = await brainSafes.getEnrollment(0, users[i].address);
        expect(enrollment.student).to.equal(users[i].address);
      }
    });
  });

  describe("Recovery y Error Handling", function () {
    it("debería manejar errores y recuperarse correctamente", async function () {
      // Intentar operación inválida
      await expect(
        courseNFT.connect(student).enrollInCourse(999) // curso inexistente
      ).to.be.revertedWith("Course does not exist");

      // Verificar que el estado no se corrompió
      const studentBalance = await eduToken.balanceOf(student.address);
      expect(studentBalance).to.equal(ethers.utils.parseEther("1000"));
    });

    it("debería manejar pausas de emergencia", async function () {
      // Pausar sistema
      await brainSafes.pause();

      // Intentar operación durante pausa
      await expect(
        courseNFT.connect(instructor).createCourse(
          "Test Course",
          "Description",
          "ipfs://content",
          ethers.utils.parseEther("100"),
          30,
          50,
          ["Test"],
          1
        )
      ).to.be.revertedWith("Pausable: paused");

      // Despausar
      await brainSafes.unpause();

      // Verificar que funciona nuevamente
      await courseNFT.connect(instructor).createCourse(
        "Test Course",
        "Description",
        "ipfs://content",
        ethers.utils.parseEther("100"),
        30,
        50,
        ["Test"],
        1
      );
    });
  });

  describe("Gas Optimization Integration", function () {
    it("debería optimizar gas en operaciones batch", async function () {
      // Crear múltiples cursos en batch
      const courseData = [];
      for (let i = 0; i < 5; i++) {
        courseData.push({
          title: `Course ${i}`,
          description: `Description ${i}`,
          ipfsContent: `ipfs://content-${i}`,
          price: ethers.utils.parseEther("50"),
          duration: 30,
          maxStudents: 50,
          skills: ["Test"],
          difficulty: 2
        });
      }

      // Batch creation (simulado)
      for (const data of courseData) {
        await courseNFT.connect(instructor).createCourse(
          data.title,
          data.description,
          data.ipfsContent,
          data.price,
          data.duration,
          data.maxStudents,
          data.skills,
          data.difficulty
        );
      }

      // Verificar todos los cursos creados
      for (let i = 0; i < 5; i++) {
        const course = await courseNFT.getCourse(i);
        expect(course.title).to.equal(`Course ${i}`);
      }
    });
  });
});
