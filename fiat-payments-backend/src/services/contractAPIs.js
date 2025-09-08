const { ethers } = require('ethers');
const winston = require('winston');
const webhookManager = require('./webhookManager');
const ipfsMetadataManager = require('./ipfsMetadataManager');

/**
 * @title ContractAPIs - APIs completas para todos los contratos de BrainSafes
 * @description Servicio centralizado para interactuar con todos los contratos del ecosistema
 * @author BrainSafes Team
 */
class ContractAPIs {
  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/contract-apis.log' })
      ],
    });

    // Configuración de providers y contratos
    this.providers = new Map();
    this.contracts = new Map();
    this.wallets = new Map();
    
    // Configurar providers
    this.setupProviders();
    
    // Configurar contratos
    this.setupContracts();
  }

  /**
   * Configurar providers para diferentes redes
   */
  setupProviders() {
    const networks = {
      arbitrum: {
        rpc: process.env.ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc',
        chainId: 42161,
        name: 'Arbitrum One'
      },
      arbitrumTestnet: {
        rpc: process.env.ARBITRUM_TESTNET_RPC_URL || 'https://goerli-rollup.arbitrum.io/rpc',
        chainId: 421613,
        name: 'Arbitrum Goerli'
      },
      ethereum: {
        rpc: process.env.ETHEREUM_RPC_URL || 'https://mainnet.infura.io/v3/your-project-id',
        chainId: 1,
        name: 'Ethereum Mainnet'
      }
    };

    for (const [network, config] of Object.entries(networks)) {
      try {
        const provider = new ethers.JsonRpcProvider(config.rpc);
        this.providers.set(network, {
          provider,
          config,
          lastBlock: 0
        });
        this.logger.info(`Provider configurado para ${config.name}`);
      } catch (error) {
        this.logger.error(`Error configurando provider para ${network}:`, error.message);
      }
    }
  }

  /**
   * Configurar contratos del ecosistema
   */
  setupContracts() {
    // ABIs de los contratos principales
    const contractConfigs = {
      brainSafes: {
        address: process.env.BRAINSAFES_ADDRESS,
        abi: require('../../contracts/artifacts/BrainSafes.json').abi,
        networks: ['arbitrum', 'arbitrumTestnet']
      },
      eduToken: {
        address: process.env.EDUTOKEN_ADDRESS,
        abi: require('../../contracts/artifacts/EDUToken.json').abi,
        networks: ['arbitrum', 'arbitrumTestnet']
      },
      certificateNFT: {
        address: process.env.CERTIFICATE_NFT_ADDRESS,
        abi: require('../../contracts/artifacts/CertificateNFT.json').abi,
        networks: ['arbitrum', 'arbitrumTestnet']
      },
      courseNFT: {
        address: process.env.COURSE_NFT_ADDRESS,
        abi: require('../../contracts/artifacts/CourseNFT.json').abi,
        networks: ['arbitrum', 'arbitrumTestnet']
      },
      jobMarketplace: {
        address: process.env.JOB_MARKETPLACE_ADDRESS,
        abi: require('../../contracts/artifacts/JobMarketplace.json').abi,
        networks: ['arbitrum', 'arbitrumTestnet']
      },
      scholarshipManager: {
        address: process.env.SCHOLARSHIP_MANAGER_ADDRESS,
        abi: require('../../contracts/artifacts/ScholarshipManager.json').abi,
        networks: ['arbitrum', 'arbitrumTestnet']
      },
      governance: {
        address: process.env.GOVERNANCE_ADDRESS,
        abi: require('../../contracts/artifacts/BrainSafesGovernance.json').abi,
        networks: ['arbitrum', 'arbitrumTestnet']
      },
      bridge: {
        address: process.env.BRIDGE_ADDRESS,
        abi: require('../../contracts/artifacts/BrainSafesBridge.json').abi,
        networks: ['arbitrum', 'arbitrumTestnet', 'ethereum']
      },
      aiOracle: {
        address: process.env.AI_ORACLE_ADDRESS,
        abi: require('../../contracts/artifacts/AIOracle.json').abi,
        networks: ['arbitrum', 'arbitrumTestnet']
      }
    };

    // Configurar contratos para cada red
    for (const [contractName, config] of Object.entries(contractConfigs)) {
      for (const network of config.networks) {
        const providerData = this.providers.get(network);
        if (providerData && config.address) {
          const contract = new ethers.Contract(config.address, config.abi, providerData.provider);
          const contractId = `${network}:${contractName}`;
          
          this.contracts.set(contractId, {
            contract,
            network,
            name: contractName,
            address: config.address,
            abi: config.abi
          });
          
          this.logger.info(`Contrato ${contractName} configurado en ${network}`);
        }
      }
    }
  }

  /**
   * Obtener contrato por red y nombre
   */
  getContract(network, contractName) {
    const contractId = `${network}:${contractName}`;
    const contractData = this.contracts.get(contractId);
    
    if (!contractData) {
      throw new Error(`Contrato ${contractName} no encontrado en ${network}`);
    }
    
    return contractData;
  }

  /**
   * Obtener wallet para transacciones
   */
  getWallet(network) {
    if (this.wallets.has(network)) {
      return this.wallets.get(network);
    }

    const providerData = this.providers.get(network);
    if (!providerData) {
      throw new Error(`Provider no encontrado para ${network}`);
    }

    const privateKey = process.env[`${network.toUpperCase()}_PRIVATE_KEY`];
    if (!privateKey) {
      throw new Error(`Private key no configurada para ${network}`);
    }

    const wallet = new ethers.Wallet(privateKey, providerData.provider);
    this.wallets.set(network, wallet);
    
    return wallet;
  }

  // ========== BRAINSAFES CORE APIs ==========

  /**
   * Obtener perfil de usuario
   */
  async getUserProfile(network, userAddress) {
    try {
      const { contract } = this.getContract(network, 'brainSafes');
      const profile = await contract.getUserProfile(userAddress);
      
      return {
        name: profile.name,
        email: profile.email,
        ipfsProfile: profile.ipfsProfile,
        reputation: profile.reputation.toString(),
        totalEarned: profile.totalEarned.toString(),
        totalSpent: profile.totalSpent.toString(),
        joinTimestamp: profile.joinTimestamp.toString(),
        isActive: profile.isActive,
        achievements: profile.achievements.map(id => id.toString())
      };
    } catch (error) {
      this.logger.error(`Error obteniendo perfil de usuario: ${error.message}`);
      throw error;
    }
  }

  /**
   * Crear perfil de usuario
   */
  async createUserProfile(network, userAddress, name, email, ipfsProfile) {
    try {
      const { contract } = this.getContract(network, 'brainSafes');
      const wallet = this.getWallet(network);
      const contractWithSigner = contract.connect(wallet);
      
      const tx = await contractWithSigner.createUserProfile(userAddress, name, email, ipfsProfile);
      const receipt = await tx.wait();
      
      // Enviar webhook
      await webhookManager.sendEvent('user.profile_created', {
        userAddress,
        name,
        email,
        ipfsProfile,
        txHash: tx.hash,
        blockNumber: receipt.blockNumber
      });
      
      return {
        success: true,
        txHash: tx.hash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      this.logger.error(`Error creando perfil de usuario: ${error.message}`);
      throw error;
    }
  }

  /**
   * Verificar rol de usuario
   */
  async hasRole(network, userAddress, role) {
    try {
      const { contract } = this.getContract(network, 'brainSafes');
      const hasRole = await contract.hasRole(role, userAddress);
      return hasRole;
    } catch (error) {
      this.logger.error(`Error verificando rol: ${error.message}`);
      throw error;
    }
  }

  // ========== EDU TOKEN APIs ==========

  /**
   * Obtener balance de EDU tokens
   */
  async getEDUBalance(network, userAddress) {
    try {
      const { contract } = this.getContract(network, 'eduToken');
      const balance = await contract.balanceOf(userAddress);
      const decimals = await contract.decimals();
      
      return {
        balance: balance.toString(),
        formatted: ethers.formatUnits(balance, decimals)
      };
    } catch (error) {
      this.logger.error(`Error obteniendo balance EDU: ${error.message}`);
      throw error;
    }
  }

  /**
   * Transferir EDU tokens
   */
  async transferEDU(network, fromAddress, toAddress, amount) {
    try {
      const { contract } = this.getContract(network, 'eduToken');
      const wallet = this.getWallet(network);
      const contractWithSigner = contract.connect(wallet);
      
      const decimals = await contract.decimals();
      const amountWei = ethers.parseUnits(amount.toString(), decimals);
      
      const tx = await contractWithSigner.transferFrom(fromAddress, toAddress, amountWei);
      const receipt = await tx.wait();
      
      // Enviar webhook
      await webhookManager.sendEvent('token.transfer', {
        from: fromAddress,
        to: toAddress,
        amount: amount,
        amountWei: amountWei.toString(),
        txHash: tx.hash,
        blockNumber: receipt.blockNumber
      });
      
      return {
        success: true,
        txHash: tx.hash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      this.logger.error(`Error transfiriendo EDU tokens: ${error.message}`);
      throw error;
    }
  }

  /**
   * Mint EDU tokens (solo admin)
   */
  async mintEDU(network, toAddress, amount) {
    try {
      const { contract } = this.getContract(network, 'eduToken');
      const wallet = this.getWallet(network);
      const contractWithSigner = contract.connect(wallet);
      
      const decimals = await contract.decimals();
      const amountWei = ethers.parseUnits(amount.toString(), decimals);
      
      const tx = await contractWithSigner.mint(toAddress, amountWei);
      const receipt = await tx.wait();
      
      // Enviar webhook
      await webhookManager.sendEvent('token.minted', {
        to: toAddress,
        amount: amount,
        amountWei: amountWei.toString(),
        txHash: tx.hash,
        blockNumber: receipt.blockNumber
      });
      
      return {
        success: true,
        txHash: tx.hash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      this.logger.error(`Error minting EDU tokens: ${error.message}`);
      throw error;
    }
  }

  // ========== CERTIFICATE NFT APIs ==========

  /**
   * Obtener certificados de un usuario
   */
  async getUserCertificates(network, userAddress) {
    try {
      const { contract } = this.getContract(network, 'certificateNFT');
      const certificates = await contract.getCertificatesByRecipient(userAddress);
      
      const certificateDetails = [];
      for (const tokenId of certificates) {
        const certificate = await contract.getCertificate(tokenId);
        certificateDetails.push({
          tokenId: tokenId.toString(),
          title: certificate.title,
          description: certificate.description,
          issuer: certificate.issuer,
          recipient: certificate.recipient,
          issuedAt: certificate.issuedAt.toString(),
          expiresAt: certificate.expiresAt.toString(),
          ipfsMetadata: certificate.ipfsMetadata,
          isRevoked: certificate.isRevoked
        });
      }
      
      return certificateDetails;
    } catch (error) {
      this.logger.error(`Error obteniendo certificados: ${error.message}`);
      throw error;
    }
  }

  /**
   * Emitir certificado NFT
   */
  async issueCertificate(network, recipient, title, description, ipfsMetadata, expiresAt) {
    try {
      const { contract } = this.getContract(network, 'certificateNFT');
      const wallet = this.getWallet(network);
      const contractWithSigner = contract.connect(wallet);
      
      const tx = await contractWithSigner.issueCertificate(
        recipient,
        title,
        description,
        ipfsMetadata,
        expiresAt
      );
      const receipt = await tx.wait();
      
      // Obtener tokenId del evento
      const event = receipt.logs.find(log => 
        log.topics[0] === contract.interface.getEventTopic('CertificateIssued')
      );
      const tokenId = event ? contract.interface.parseLog(event).args.tokenId : null;
      
      // Enviar webhook
      await webhookManager.sendEvent('certificate.issued', {
        tokenId: tokenId?.toString(),
        recipient,
        title,
        description,
        ipfsMetadata,
        expiresAt: expiresAt.toString(),
        txHash: tx.hash,
        blockNumber: receipt.blockNumber
      });
      
      return {
        success: true,
        tokenId: tokenId?.toString(),
        txHash: tx.hash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      this.logger.error(`Error emitiendo certificado: ${error.message}`);
      throw error;
    }
  }

  /**
   * Revocar certificado
   */
  async revokeCertificate(network, tokenId, reason) {
    try {
      const { contract } = this.getContract(network, 'certificateNFT');
      const wallet = this.getWallet(network);
      const contractWithSigner = contract.connect(wallet);
      
      const tx = await contractWithSigner.revokeCertificate(tokenId, reason);
      const receipt = await tx.wait();
      
      // Enviar webhook
      await webhookManager.sendEvent('certificate.revoked', {
        tokenId: tokenId.toString(),
        reason,
        txHash: tx.hash,
        blockNumber: receipt.blockNumber
      });
      
      return {
        success: true,
        txHash: tx.hash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      this.logger.error(`Error revocando certificado: ${error.message}`);
      throw error;
    }
  }

  // ========== COURSE NFT APIs ==========

  /**
   * Obtener cursos de un instructor
   */
  async getInstructorCourses(network, instructorAddress) {
    try {
      const { contract } = this.getContract(network, 'courseNFT');
      const courses = await contract.getCoursesByInstructor(instructorAddress);
      
      const courseDetails = [];
      for (const courseId of courses) {
        const course = await contract.getCourse(courseId);
        courseDetails.push({
          courseId: courseId.toString(),
          title: course.title,
          description: course.description,
          instructor: course.instructor,
          price: course.price.toString(),
          duration: course.duration.toString(),
          maxStudents: course.maxStudents.toString(),
          currentStudents: course.currentStudents.toString(),
          ipfsContent: course.ipfsContent,
          isActive: course.isActive,
          skills: course.skills,
          difficulty: course.difficulty.toString(),
          createdAt: course.createdAt.toString()
        });
      }
      
      return courseDetails;
    } catch (error) {
      this.logger.error(`Error obteniendo cursos: ${error.message}`);
      throw error;
    }
  }

  /**
   * Crear curso
   */
  async createCourse(network, title, description, price, duration, maxStudents, ipfsContent, skills, difficulty) {
    try {
      const { contract } = this.getContract(network, 'courseNFT');
      const wallet = this.getWallet(network);
      const contractWithSigner = contract.connect(wallet);
      
      const tx = await contractWithSigner.createCourse(
        title,
        description,
        price,
        duration,
        maxStudents,
        ipfsContent,
        skills,
        difficulty
      );
      const receipt = await tx.wait();
      
      // Obtener courseId del evento
      const event = receipt.logs.find(log => 
        log.topics[0] === contract.interface.getEventTopic('CourseCreated')
      );
      const courseId = event ? contract.interface.parseLog(event).args.courseId : null;
      
      // Enviar webhook
      await webhookManager.sendEvent('course.created', {
        courseId: courseId?.toString(),
        title,
        description,
        price: price.toString(),
        duration: duration.toString(),
        maxStudents: maxStudents.toString(),
        ipfsContent,
        skills,
        difficulty: difficulty.toString(),
        txHash: tx.hash,
        blockNumber: receipt.blockNumber
      });
      
      return {
        success: true,
        courseId: courseId?.toString(),
        txHash: tx.hash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      this.logger.error(`Error creando curso: ${error.message}`);
      throw error;
    }
  }

  /**
   * Inscribirse en curso
   */
  async enrollInCourse(network, courseId, studentAddress) {
    try {
      const { contract } = this.getContract(network, 'courseNFT');
      const wallet = this.getWallet(network);
      const contractWithSigner = contract.connect(wallet);
      
      const tx = await contractWithSigner.enrollStudent(courseId, studentAddress);
      const receipt = await tx.wait();
      
      // Enviar webhook
      await webhookManager.sendEvent('course.enrolled', {
        courseId: courseId.toString(),
        student: studentAddress,
        txHash: tx.hash,
        blockNumber: receipt.blockNumber
      });
      
      return {
        success: true,
        txHash: tx.hash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      this.logger.error(`Error inscribiendo en curso: ${error.message}`);
      throw error;
    }
  }

  // ========== JOB MARKETPLACE APIs ==========

  /**
   * Obtener ofertas de trabajo
   */
  async getJobPostings(network, filters = {}) {
    try {
      const { contract } = this.getContract(network, 'jobMarketplace');
      
      // Obtener estadísticas del marketplace
      const stats = await contract.getMarketplaceStats();
      
      // Por simplicidad, obtenemos las primeras 50 ofertas activas
      const jobPostings = [];
      const totalJobs = stats[0].toNumber();
      
      for (let i = 1; i <= Math.min(totalJobs, 50); i++) {
        try {
          const job = await contract.jobPostings(i);
          if (job.isActive && job.deadline.toNumber() > Date.now() / 1000) {
            jobPostings.push({
              jobId: i,
              title: job.title,
              description: job.description,
              company: job.company,
              location: job.location,
              jobType: job.jobType,
              experienceLevel: job.experienceLevel,
              salaryMin: job.salaryMin.toString(),
              salaryMax: job.salaryMax.toString(),
              requiredSkills: job.requiredSkills,
              deadline: job.deadline.toString(),
              maxApplicants: job.maxApplicants.toString(),
              currentApplicants: job.currentApplicants.toString(),
              category: job.category,
              employer: job.employer
            });
          }
        } catch (error) {
          // Continuar con la siguiente oferta
          continue;
        }
      }
      
      return {
        totalJobs: totalJobs,
        activeJobs: jobPostings.length,
        jobs: jobPostings
      };
    } catch (error) {
      this.logger.error(`Error obteniendo ofertas de trabajo: ${error.message}`);
      throw error;
    }
  }

  /**
   * Publicar oferta de trabajo
   */
  async postJob(network, jobData) {
    try {
      const { contract } = this.getContract(network, 'jobMarketplace');
      const wallet = this.getWallet(network);
      const contractWithSigner = contract.connect(wallet);
      
      const tx = await contractWithSigner.postJob(
        jobData.title,
        jobData.description,
        jobData.company,
        jobData.location,
        jobData.jobType,
        jobData.experienceLevel,
        jobData.salaryMin,
        jobData.salaryMax,
        jobData.requiredSkills,
        jobData.preferredCertifications,
        jobData.requiredExperience,
        jobData.deadlineDays,
        jobData.maxApplicants,
        jobData.category,
        jobData.ipfsJobDetails
      );
      const receipt = await tx.wait();
      
      // Obtener jobId del evento
      const event = receipt.logs.find(log => 
        log.topics[0] === contract.interface.getEventTopic('JobPosted')
      );
      const jobId = event ? contract.interface.parseLog(event).args.jobId : null;
      
      // Enviar webhook
      await webhookManager.sendEvent('marketplace.job_posted', {
        jobId: jobId?.toString(),
        title: jobData.title,
        company: jobData.company,
        location: jobData.location,
        salaryMax: jobData.salaryMax.toString(),
        category: jobData.category,
        txHash: tx.hash,
        blockNumber: receipt.blockNumber
      });
      
      return {
        success: true,
        jobId: jobId?.toString(),
        txHash: tx.hash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      this.logger.error(`Error publicando oferta de trabajo: ${error.message}`);
      throw error;
    }
  }

  /**
   * Aplicar a oferta de trabajo
   */
  async applyToJob(network, jobId, applicationData) {
    try {
      const { contract } = this.getContract(network, 'jobMarketplace');
      const wallet = this.getWallet(network);
      const contractWithSigner = contract.connect(wallet);
      
      const tx = await contractWithSigner.applyToJob(
        jobId,
        applicationData.coverLetter,
        applicationData.resumeIPFS,
        applicationData.certificateTokenIds
      );
      const receipt = await tx.wait();
      
      // Obtener applicationId del evento
      const event = receipt.logs.find(log => 
        log.topics[0] === contract.interface.getEventTopic('JobApplicationSubmitted')
      );
      const applicationId = event ? contract.interface.parseLog(event).args.applicationId : null;
      
      // Enviar webhook
      await webhookManager.sendEvent('marketplace.application_submitted', {
        applicationId: applicationId?.toString(),
        jobId: jobId.toString(),
        applicant: applicationData.applicant,
        txHash: tx.hash,
        blockNumber: receipt.blockNumber
      });
      
      return {
        success: true,
        applicationId: applicationId?.toString(),
        txHash: tx.hash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      this.logger.error(`Error aplicando a oferta de trabajo: ${error.message}`);
      throw error;
    }
  }

  // ========== SCHOLARSHIP MANAGER APIs ==========

  /**
   * Obtener becas disponibles
   */
  async getScholarships(network) {
    try {
      const { contract } = this.getContract(network, 'scholarshipManager');
      const scholarships = await contract.getAllScholarships();
      
      const scholarshipDetails = [];
      for (const scholarshipId of scholarships) {
        const scholarship = await contract.getScholarship(scholarshipId);
        scholarshipDetails.push({
          scholarshipId: scholarshipId.toString(),
          title: scholarship.title,
          description: scholarship.description,
          amount: scholarship.amount.toString(),
          maxRecipients: scholarship.maxRecipients.toString(),
          currentRecipients: scholarship.currentRecipients.toString(),
          deadline: scholarship.deadline.toString(),
          requirements: scholarship.requirements,
          isActive: scholarship.isActive
        });
      }
      
      return scholarshipDetails;
    } catch (error) {
      this.logger.error(`Error obteniendo becas: ${error.message}`);
      throw error;
    }
  }

  /**
   * Crear beca
   */
  async createScholarship(network, scholarshipData) {
    try {
      const { contract } = this.getContract(network, 'scholarshipManager');
      const wallet = this.getWallet(network);
      const contractWithSigner = contract.connect(wallet);
      
      const tx = await contractWithSigner.createScholarship(
        scholarshipData.title,
        scholarshipData.description,
        scholarshipData.amount,
        scholarshipData.maxRecipients,
        scholarshipData.deadline,
        scholarshipData.requirements
      );
      const receipt = await tx.wait();
      
      // Enviar webhook
      await webhookManager.sendEvent('scholarship.created', {
        title: scholarshipData.title,
        amount: scholarshipData.amount.toString(),
        maxRecipients: scholarshipData.maxRecipients.toString(),
        deadline: scholarshipData.deadline.toString(),
        txHash: tx.hash,
        blockNumber: receipt.blockNumber
      });
      
      return {
        success: true,
        txHash: tx.hash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      this.logger.error(`Error creando beca: ${error.message}`);
      throw error;
    }
  }

  // ========== GOVERNANCE APIs ==========

  /**
   * Obtener propuestas de gobierno
   */
  async getProposals(network) {
    try {
      const { contract } = this.getContract(network, 'governance');
      const proposals = await contract.getAllProposals();
      
      const proposalDetails = [];
      for (const proposalId of proposals) {
        const proposal = await contract.getProposal(proposalId);
        proposalDetails.push({
          proposalId: proposalId.toString(),
          title: proposal.title,
          description: proposal.description,
          proposer: proposal.proposer,
          forVotes: proposal.forVotes.toString(),
          againstVotes: proposal.againstVotes.toString(),
          startTime: proposal.startTime.toString(),
          endTime: proposal.endTime.toString(),
          executed: proposal.executed,
          canceled: proposal.canceled
        });
      }
      
      return proposalDetails;
    } catch (error) {
      this.logger.error(`Error obteniendo propuestas: ${error.message}`);
      throw error;
    }
  }

  /**
   * Crear propuesta de gobierno
   */
  async createProposal(network, proposalData) {
    try {
      const { contract } = this.getContract(network, 'governance');
      const wallet = this.getWallet(network);
      const contractWithSigner = contract.connect(wallet);
      
      const tx = await contractWithSigner.createProposal(
        proposalData.title,
        proposalData.description,
        proposalData.targets,
        proposalData.values,
        proposalData.signatures,
        proposalData.calldatas
      );
      const receipt = await tx.wait();
      
      // Enviar webhook
      await webhookManager.sendEvent('governance.proposal_created', {
        title: proposalData.title,
        description: proposalData.description,
        proposer: wallet.address,
        txHash: tx.hash,
        blockNumber: receipt.blockNumber
      });
      
      return {
        success: true,
        txHash: tx.hash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      this.logger.error(`Error creando propuesta: ${error.message}`);
      throw error;
    }
  }

  /**
   * Votar en propuesta
   */
  async voteOnProposal(network, proposalId, support, reason) {
    try {
      const { contract } = this.getContract(network, 'governance');
      const wallet = this.getWallet(network);
      const contractWithSigner = contract.connect(wallet);
      
      const tx = await contractWithSigner.castVote(proposalId, support, reason);
      const receipt = await tx.wait();
      
      // Enviar webhook
      await webhookManager.sendEvent('governance.vote_cast', {
        proposalId: proposalId.toString(),
        voter: wallet.address,
        support,
        reason,
        txHash: tx.hash,
        blockNumber: receipt.blockNumber
      });
      
      return {
        success: true,
        txHash: tx.hash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      this.logger.error(`Error votando en propuesta: ${error.message}`);
      throw error;
    }
  }

  // ========== BRIDGE APIs ==========

  /**
   * Iniciar transferencia cross-chain
   */
  async initiateBridgeTransfer(network, targetNetwork, tokenAddress, amount, recipient) {
    try {
      const { contract } = this.getContract(network, 'bridge');
      const wallet = this.getWallet(network);
      const contractWithSigner = contract.connect(wallet);
      
      const tx = await contractWithSigner.initiateTransfer(
        targetNetwork,
        tokenAddress,
        amount,
        recipient
      );
      const receipt = await tx.wait();
      
      // Enviar webhook
      await webhookManager.sendEvent('bridge.transfer_initiated', {
        sourceNetwork: network,
        targetNetwork,
        tokenAddress,
        amount: amount.toString(),
        recipient,
        txHash: tx.hash,
        blockNumber: receipt.blockNumber
      });
      
      return {
        success: true,
        txHash: tx.hash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      this.logger.error(`Error iniciando transferencia bridge: ${error.message}`);
      throw error;
    }
  }

  // ========== AI ORACLE APIs ==========

  /**
   * Obtener predicción de IA
   */
  async getAIPrediction(network, userAddress, predictionType) {
    try {
      const { contract } = this.getContract(network, 'aiOracle');
      const prediction = await contract.getPrediction(userAddress, predictionType);
      
      return {
        userAddress,
        predictionType,
        prediction: prediction.toString(),
        timestamp: Date.now()
      };
    } catch (error) {
      this.logger.error(`Error obteniendo predicción de IA: ${error.message}`);
      throw error;
    }
  }

  /**
   * Calcular match de trabajo con IA
   */
  async calculateJobMatch(network, candidate, jobId) {
    try {
      const { contract } = this.getContract(network, 'aiOracle');
      const matchScore = await contract.calculateJobMatch(candidate, jobId);
      
      return {
        candidate,
        jobId: jobId.toString(),
        matchScore: matchScore.toString(),
        timestamp: Date.now()
      };
    } catch (error) {
      this.logger.error(`Error calculando match de trabajo: ${error.message}`);
      throw error;
    }
  }

  // ========== UTILITY FUNCTIONS ==========

  /**
   * Obtener información de red
   */
  async getNetworkInfo(network) {
    try {
      const providerData = this.providers.get(network);
      if (!providerData) {
        throw new Error(`Red ${network} no configurada`);
      }

      const blockNumber = await providerData.provider.getBlockNumber();
      const gasPrice = await providerData.provider.getFeeData();
      
      return {
        network: network,
        chainId: providerData.config.chainId,
        name: providerData.config.name,
        blockNumber: blockNumber.toString(),
        gasPrice: gasPrice.gasPrice?.toString(),
        maxFeePerGas: gasPrice.maxFeePerGas?.toString(),
        maxPriorityFeePerGas: gasPrice.maxPriorityFeePerGas?.toString()
      };
    } catch (error) {
      this.logger.error(`Error obteniendo información de red: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener transacción
   */
  async getTransaction(network, txHash) {
    try {
      const providerData = this.providers.get(network);
      const tx = await providerData.provider.getTransaction(txHash);
      const receipt = await providerData.provider.getTransactionReceipt(txHash);
      
      return {
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: tx.value.toString(),
        gasLimit: tx.gasLimit.toString(),
        gasPrice: tx.gasPrice?.toString(),
        maxFeePerGas: tx.maxFeePerGas?.toString(),
        maxPriorityFeePerGas: tx.maxPriorityFeePerGas?.toString(),
        nonce: tx.nonce,
        data: tx.data,
        blockNumber: tx.blockNumber?.toString(),
        blockHash: tx.blockHash,
        confirmations: receipt.confirmations,
        status: receipt.status,
        gasUsed: receipt.gasUsed.toString(),
        effectiveGasPrice: receipt.effectiveGasPrice?.toString()
      };
    } catch (error) {
      this.logger.error(`Error obteniendo transacción: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener eventos de contrato
   */
  async getContractEvents(network, contractName, eventName, fromBlock, toBlock) {
    try {
      const { contract } = this.getContract(network, contractName);
      const events = await contract.queryFilter(eventName, fromBlock, toBlock);
      
      return events.map(event => ({
        eventName: eventName,
        blockNumber: event.blockNumber,
        blockHash: event.blockHash,
        transactionHash: event.transactionHash,
        logIndex: event.logIndex,
        args: event.args
      }));
    } catch (error) {
      this.logger.error(`Error obteniendo eventos: ${error.message}`);
      throw error;
    }
  }

  // ========== IPFS INTEGRATION METHODS ==========

  /**
   * Crear perfil de usuario con metadata en IPFS
   */
  async createUserProfileWithIPFS(network, userAddress, name, email, profileData = {}) {
    try {
      // 1. Subir metadata a IPFS
      const ipfsData = {
        walletAddress: userAddress,
        name,
        email,
        bio: profileData.bio || '',
        avatar: profileData.avatar || '',
        skills: profileData.skills || [],
        experience: profileData.experience || [],
        education: profileData.education || [],
        socialLinks: profileData.socialLinks || {},
        reputationScore: profileData.reputationScore || 0
      };

      const ipfsResult = await ipfsMetadataManager.uploadProfileMetadata(ipfsData);
      
      // 2. Crear perfil en el contrato con URI de IPFS
      const result = await this.createUserProfile(network, userAddress, name, email, ipfsResult.profileURI);
      
      return {
        ...result,
        ipfsMetadata: ipfsResult
      };
    } catch (error) {
      this.logger.error(`Error creando perfil con IPFS: ${error.message}`);
      throw error;
    }
  }

  /**
   * Emitir certificado con metadata en IPFS
   */
  async issueCertificateWithIPFS(network, recipient, title, description, courseId, score, issuer) {
    try {
      // 1. Obtener información del contrato
      const { contract } = this.getContract(network, 'certificateNFT');
      const wallet = this.getWallet(network);
      const contractWithSigner = contract.connect(wallet);

      // 2. Preparar metadata para IPFS
      const certificateData = {
        title,
        description,
        issuer,
        recipient,
        courseId,
        score,
        issuedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 año
        signature: ethers.keccak256(ethers.toUtf8Bytes(`${recipient}-${courseId}-${Date.now()}`)),
        tokenId: '0', // Se asignará después del mint
        contractAddress: contract.target
      };

      // 3. Subir metadata a IPFS
      const ipfsResult = await ipfsMetadataManager.uploadCertificateMetadata(certificateData);
      
      // 4. Emitir certificado en el contrato
      const tx = await contractWithSigner.issueCertificate(
        recipient,
        ipfsResult.tokenURI,
        title,
        description,
        score
      );
      const receipt = await tx.wait();
      
      // 5. Obtener token ID del evento
      const event = receipt.logs.find(log => {
        try {
          const parsed = contract.interface.parseLog(log);
          return parsed.name === 'CertificateIssued';
        } catch {
          return false;
        }
      });

      let tokenId = '0';
      if (event) {
        const parsed = contract.interface.parseLog(event);
        tokenId = parsed.args.tokenId.toString();
      }

      // 6. Actualizar metadata con token ID real
      const updatedCertificateData = {
        ...certificateData,
        tokenId
      };
      const updatedIpfsResult = await ipfsMetadataManager.uploadCertificateMetadata(updatedCertificateData);

      // 7. Enviar webhook
      await webhookManager.sendEvent('certificate.issued_with_ipfs', {
        tokenId,
        recipient,
        issuer,
        title,
        description,
        ipfsMetadata: updatedIpfsResult,
        txHash: tx.hash,
        blockNumber: receipt.blockNumber
      });

      return {
        success: true,
        tokenId,
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
        ipfsMetadata: updatedIpfsResult
      };
    } catch (error) {
      this.logger.error(`Error emitiendo certificado con IPFS: ${error.message}`);
      throw error;
    }
  }

  /**
   * Crear curso con metadata en IPFS
   */
  async createCourseWithIPFS(network, title, description, instructor, duration, difficulty, courseData = {}) {
    try {
      // 1. Preparar metadata para IPFS
      const courseMetadata = {
        title,
        description,
        instructor,
        duration,
        difficulty,
        topics: courseData.topics || [],
        requirements: courseData.requirements || [],
        outcomes: courseData.outcomes || [],
        thumbnail: courseData.thumbnail || '',
        price: courseData.price || 0,
        maxStudents: courseData.maxStudents || 100,
        courseId: ethers.keccak256(ethers.toUtf8Bytes(`${title}-${instructor}-${Date.now()}`)).slice(0, 10)
      };

      // 2. Subir metadata a IPFS
      const ipfsResult = await ipfsMetadataManager.uploadCourseMetadata(courseMetadata);
      
      // 3. Crear curso en el contrato (si existe)
      // Nota: Esto dependerá de la implementación específica del contrato de cursos
      const result = {
        success: true,
        courseId: courseMetadata.courseId,
        ipfsMetadata: ipfsResult
      };

      // 4. Enviar webhook
      await webhookManager.sendEvent('course.created_with_ipfs', {
        courseId: courseMetadata.courseId,
        title,
        instructor,
        ipfsMetadata: ipfsResult,
        timestamp: Date.now()
      });

      return result;
    } catch (error) {
      this.logger.error(`Error creando curso con IPFS: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener metadata de IPFS para un token
   */
  async getTokenMetadata(network, contractName, tokenId) {
    try {
      const { contract } = this.getContract(network, contractName);
      const tokenURI = await contract.tokenURI(tokenId);
      
      // Extraer hash IPFS de la URI
      const ipfsHash = tokenURI.replace('ipfs://', '').split('/')[0];
      
      // Obtener metadata desde IPFS
      const metadata = await ipfsMetadataManager.getMetadata(ipfsHash);
      
      return {
        tokenId,
        tokenURI,
        ipfsHash,
        metadata
      };
    } catch (error) {
      this.logger.error(`Error obteniendo metadata de token: ${error.message}`);
      throw error;
    }
  }

  /**
   * Actualizar metadata de token en IPFS
   */
  async updateTokenMetadata(network, contractName, tokenId, updates) {
    try {
      // 1. Obtener metadata actual
      const currentMetadata = await this.getTokenMetadata(network, contractName, tokenId);
      
      // 2. Actualizar metadata en IPFS
      const updatedResult = await ipfsMetadataManager.updateMetadata(
        currentMetadata.ipfsHash,
        updates
      );
      
      // 3. Enviar webhook
      await webhookManager.sendEvent('metadata.updated', {
        tokenId,
        contractName,
        originalHash: currentMetadata.ipfsHash,
        newHash: updatedResult.hash,
        updates,
        timestamp: Date.now()
      });

      return {
        success: true,
        tokenId,
        originalHash: currentMetadata.ipfsHash,
        newHash: updatedResult.hash,
        updatedMetadata: updatedResult.metadata
      };
    } catch (error) {
      this.logger.error(`Error actualizando metadata de token: ${error.message}`);
      throw error;
    }
  }
}

// Instancia singleton
const contractAPIs = new ContractAPIs();

module.exports = contractAPIs;
