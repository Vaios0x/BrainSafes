const express = require('express');
const Joi = require('joi');
const contractAPIs = require('../services/contractAPIs');
const securityManager = require('../middleware/security');

const router = express.Router();

// ========== VALIDATION SCHEMAS ==========

const networkSchema = Joi.object({
  network: Joi.string().valid('arbitrum', 'arbitrumTestnet', 'ethereum').required()
});

const userAddressSchema = Joi.object({
  userAddress: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required()
});

const createUserProfileSchema = Joi.object({
  userAddress: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required(),
  name: Joi.string().min(1).max(100).required(),
  email: Joi.string().email().required(),
  ipfsProfile: Joi.string().required()
});

const transferEDUSchema = Joi.object({
  fromAddress: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required(),
  toAddress: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required(),
  amount: Joi.number().positive().required()
});

const mintEDUSchema = Joi.object({
  toAddress: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required(),
  amount: Joi.number().positive().required()
});

const issueCertificateSchema = Joi.object({
  recipient: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required(),
  title: Joi.string().min(1).max(200).required(),
  description: Joi.string().min(1).max(1000).required(),
  ipfsMetadata: Joi.string().required(),
  expiresAt: Joi.number().positive().required()
});

const createCourseSchema = Joi.object({
  title: Joi.string().min(1).max(200).required(),
  description: Joi.string().min(1).max(1000).required(),
  price: Joi.number().positive().required(),
  duration: Joi.number().positive().required(),
  maxStudents: Joi.number().positive().required(),
  ipfsContent: Joi.string().required(),
  skills: Joi.array().items(Joi.string()).required(),
  difficulty: Joi.number().min(1).max(5).required()
});

const postJobSchema = Joi.object({
  title: Joi.string().min(1).max(200).required(),
  description: Joi.string().min(1).max(2000).required(),
  company: Joi.string().min(1).max(100).required(),
  location: Joi.string().min(1).max(100).required(),
  jobType: Joi.number().min(0).max(5).required(),
  experienceLevel: Joi.number().min(0).max(3).required(),
  salaryMin: Joi.number().positive().required(),
  salaryMax: Joi.number().positive().required(),
  requiredSkills: Joi.array().items(Joi.string()).required(),
  preferredCertifications: Joi.array().items(Joi.string()).required(),
  requiredExperience: Joi.number().positive().required(),
  deadlineDays: Joi.number().min(1).max(365).required(),
  maxApplicants: Joi.number().positive().required(),
  category: Joi.number().min(0).max(7).required(),
  ipfsJobDetails: Joi.string().required()
});

const applyToJobSchema = Joi.object({
  jobId: Joi.number().positive().required(),
  coverLetter: Joi.string().min(1).max(2000).required(),
  resumeIPFS: Joi.string().required(),
  certificateTokenIds: Joi.array().items(Joi.number().positive()).required()
});

const createScholarshipSchema = Joi.object({
  title: Joi.string().min(1).max(200).required(),
  description: Joi.string().min(1).max(1000).required(),
  amount: Joi.number().positive().required(),
  maxRecipients: Joi.number().positive().required(),
  deadline: Joi.number().positive().required(),
  requirements: Joi.array().items(Joi.string()).required()
});

const createProposalSchema = Joi.object({
  title: Joi.string().min(1).max(200).required(),
  description: Joi.string().min(1).max(1000).required(),
  targets: Joi.array().items(Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/)).required(),
  values: Joi.array().items(Joi.number()).required(),
  signatures: Joi.array().items(Joi.string()).required(),
  calldatas: Joi.array().items(Joi.string()).required()
});

const voteProposalSchema = Joi.object({
  proposalId: Joi.number().positive().required(),
  support: Joi.boolean().required(),
  reason: Joi.string().max(500).optional()
});

const bridgeTransferSchema = Joi.object({
  targetNetwork: Joi.string().valid('arbitrum', 'arbitrumTestnet', 'ethereum').required(),
  tokenAddress: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required(),
  amount: Joi.number().positive().required(),
  recipient: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required()
});

// ========== BRAINSAFES CORE ROUTES ==========

/**
 * @swagger
 * /api/contracts/brainSafes/profile/{network}/{userAddress}:
 *   get:
 *     summary: Obtener perfil de usuario
 *     tags: [BrainSafes Core]
 *     parameters:
 *       - in: path
 *         name: network
 *         required: true
 *         schema:
 *           type: string
 *         description: Red blockchain
 *       - in: path
 *         name: userAddress
 *         required: true
 *         schema:
 *           type: string
 *         description: Dirección del usuario
 */
router.get('/brainSafes/profile/:network/:userAddress', async (req, res) => {
  try {
    const { network, userAddress } = req.params;
    
    // Validar parámetros
    const { error } = Joi.object({
      network: networkSchema.extract('network'),
      userAddress: userAddressSchema.extract('userAddress')
    }).validate({ network, userAddress });
    
    if (error) {
      return res.status(400).json({
        error: 'Parámetros inválidos',
        details: error.details.map(d => d.message)
      });
    }

    const profile = await contractAPIs.getUserProfile(network, userAddress);
    
    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error obteniendo perfil de usuario',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/contracts/brainSafes/profile:
 *   post:
 *     summary: Crear perfil de usuario
 *     tags: [BrainSafes Core]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - network
 *               - userAddress
 *               - name
 *               - email
 *               - ipfsProfile
 */
router.post('/brainSafes/profile', async (req, res) => {
  try {
    const { network, ...profileData } = req.body;
    
    // Validar datos
    const { error } = Joi.object({
      network: networkSchema.extract('network'),
      ...createUserProfileSchema.describe().keys
    }).validate({ network, ...profileData });
    
    if (error) {
      return res.status(400).json({
        error: 'Datos inválidos',
        details: error.details.map(d => d.message)
      });
    }

    const result = await contractAPIs.createUserProfile(
      network,
      profileData.userAddress,
      profileData.name,
      profileData.email,
      profileData.ipfsProfile
    );
    
    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error creando perfil de usuario',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/contracts/brainSafes/role/{network}/{userAddress}/{role}:
 *   get:
 *     summary: Verificar rol de usuario
 *     tags: [BrainSafes Core]
 */
router.get('/brainSafes/role/:network/:userAddress/:role', async (req, res) => {
  try {
    const { network, userAddress, role } = req.params;
    
    const hasRole = await contractAPIs.hasRole(network, userAddress, role);
    
    res.json({
      success: true,
      data: {
        userAddress,
        role,
        hasRole
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error verificando rol',
      message: error.message
    });
  }
});

// ========== EDU TOKEN ROUTES ==========

/**
 * @swagger
 * /api/contracts/eduToken/balance/{network}/{userAddress}:
 *   get:
 *     summary: Obtener balance de EDU tokens
 *     tags: [EDU Token]
 */
router.get('/eduToken/balance/:network/:userAddress', async (req, res) => {
  try {
    const { network, userAddress } = req.params;
    
    const balance = await contractAPIs.getEDUBalance(network, userAddress);
    
    res.json({
      success: true,
      data: balance
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error obteniendo balance EDU',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/contracts/eduToken/transfer:
 *   post:
 *     summary: Transferir EDU tokens
 *     tags: [EDU Token]
 */
router.post('/eduToken/transfer', async (req, res) => {
  try {
    const { network, ...transferData } = req.body;
    
    const { error } = Joi.object({
      network: networkSchema.extract('network'),
      ...transferEDUSchema.describe().keys
    }).validate({ network, ...transferData });
    
    if (error) {
      return res.status(400).json({
        error: 'Datos inválidos',
        details: error.details.map(d => d.message)
      });
    }

    const result = await contractAPIs.transferEDU(
      network,
      transferData.fromAddress,
      transferData.toAddress,
      transferData.amount
    );
    
    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error transfiriendo EDU tokens',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/contracts/eduToken/mint:
 *   post:
 *     summary: Mint EDU tokens (solo admin)
 *     tags: [EDU Token]
 */
router.post('/eduToken/mint', async (req, res) => {
  try {
    const { network, ...mintData } = req.body;
    
    const { error } = Joi.object({
      network: networkSchema.extract('network'),
      ...mintEDUSchema.describe().keys
    }).validate({ network, ...mintData });
    
    if (error) {
      return res.status(400).json({
        error: 'Datos inválidos',
        details: error.details.map(d => d.message)
      });
    }

    const result = await contractAPIs.mintEDU(
      network,
      mintData.toAddress,
      mintData.amount
    );
    
    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error minting EDU tokens',
      message: error.message
    });
  }
});

// ========== CERTIFICATE NFT ROUTES ==========

/**
 * @swagger
 * /api/contracts/certificateNFT/user/{network}/{userAddress}:
 *   get:
 *     summary: Obtener certificados de un usuario
 *     tags: [Certificate NFT]
 */
router.get('/certificateNFT/user/:network/:userAddress', async (req, res) => {
  try {
    const { network, userAddress } = req.params;
    
    const certificates = await contractAPIs.getUserCertificates(network, userAddress);
    
    res.json({
      success: true,
      data: certificates
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error obteniendo certificados',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/contracts/certificateNFT/issue:
 *   post:
 *     summary: Emitir certificado NFT
 *     tags: [Certificate NFT]
 */
router.post('/certificateNFT/issue', async (req, res) => {
  try {
    const { network, ...certificateData } = req.body;
    
    const { error } = Joi.object({
      network: networkSchema.extract('network'),
      ...issueCertificateSchema.describe().keys
    }).validate({ network, ...certificateData });
    
    if (error) {
      return res.status(400).json({
        error: 'Datos inválidos',
        details: error.details.map(d => d.message)
      });
    }

    const result = await contractAPIs.issueCertificate(
      network,
      certificateData.recipient,
      certificateData.title,
      certificateData.description,
      certificateData.ipfsMetadata,
      certificateData.expiresAt
    );
    
    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error emitiendo certificado',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/contracts/certificateNFT/revoke:
 *   post:
 *     summary: Revocar certificado
 *     tags: [Certificate NFT]
 */
router.post('/certificateNFT/revoke', async (req, res) => {
  try {
    const { network, tokenId, reason } = req.body;
    
    const { error } = Joi.object({
      network: networkSchema.extract('network'),
      tokenId: Joi.number().positive().required(),
      reason: Joi.string().min(1).max(500).required()
    }).validate({ network, tokenId, reason });
    
    if (error) {
      return res.status(400).json({
        error: 'Datos inválidos',
        details: error.details.map(d => d.message)
      });
    }

    const result = await contractAPIs.revokeCertificate(network, tokenId, reason);
    
    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error revocando certificado',
      message: error.message
    });
  }
});

// ========== COURSE NFT ROUTES ==========

/**
 * @swagger
 * /api/contracts/courseNFT/instructor/{network}/{instructorAddress}:
 *   get:
 *     summary: Obtener cursos de un instructor
 *     tags: [Course NFT]
 */
router.get('/courseNFT/instructor/:network/:instructorAddress', async (req, res) => {
  try {
    const { network, instructorAddress } = req.params;
    
    const courses = await contractAPIs.getInstructorCourses(network, instructorAddress);
    
    res.json({
      success: true,
      data: courses
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error obteniendo cursos',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/contracts/courseNFT/create:
 *   post:
 *     summary: Crear curso
 *     tags: [Course NFT]
 */
router.post('/courseNFT/create', async (req, res) => {
  try {
    const { network, ...courseData } = req.body;
    
    const { error } = Joi.object({
      network: networkSchema.extract('network'),
      ...createCourseSchema.describe().keys
    }).validate({ network, ...courseData });
    
    if (error) {
      return res.status(400).json({
        error: 'Datos inválidos',
        details: error.details.map(d => d.message)
      });
    }

    const result = await contractAPIs.createCourse(
      network,
      courseData.title,
      courseData.description,
      courseData.price,
      courseData.duration,
      courseData.maxStudents,
      courseData.ipfsContent,
      courseData.skills,
      courseData.difficulty
    );
    
    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error creando curso',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/contracts/courseNFT/enroll:
 *   post:
 *     summary: Inscribirse en curso
 *     tags: [Course NFT]
 */
router.post('/courseNFT/enroll', async (req, res) => {
  try {
    const { network, courseId, studentAddress } = req.body;
    
    const { error } = Joi.object({
      network: networkSchema.extract('network'),
      courseId: Joi.number().positive().required(),
      studentAddress: userAddressSchema.extract('userAddress')
    }).validate({ network, courseId, studentAddress });
    
    if (error) {
      return res.status(400).json({
        error: 'Datos inválidos',
        details: error.details.map(d => d.message)
      });
    }

    const result = await contractAPIs.enrollInCourse(network, courseId, studentAddress);
    
    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error inscribiendo en curso',
      message: error.message
    });
  }
});

// ========== JOB MARKETPLACE ROUTES ==========

/**
 * @swagger
 * /api/contracts/jobMarketplace/jobs/{network}:
 *   get:
 *     summary: Obtener ofertas de trabajo
 *     tags: [Job Marketplace]
 */
router.get('/jobMarketplace/jobs/:network', async (req, res) => {
  try {
    const { network } = req.params;
    const filters = req.query;
    
    const { error } = networkSchema.validate({ network });
    if (error) {
      return res.status(400).json({
        error: 'Red inválida',
        details: error.details.map(d => d.message)
      });
    }

    const jobs = await contractAPIs.getJobPostings(network, filters);
    
    res.json({
      success: true,
      data: jobs
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error obteniendo ofertas de trabajo',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/contracts/jobMarketplace/post:
 *   post:
 *     summary: Publicar oferta de trabajo
 *     tags: [Job Marketplace]
 */
router.post('/jobMarketplace/post', async (req, res) => {
  try {
    const { network, ...jobData } = req.body;
    
    const { error } = Joi.object({
      network: networkSchema.extract('network'),
      ...postJobSchema.describe().keys
    }).validate({ network, ...jobData });
    
    if (error) {
      return res.status(400).json({
        error: 'Datos inválidos',
        details: error.details.map(d => d.message)
      });
    }

    const result = await contractAPIs.postJob(network, jobData);
    
    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error publicando oferta de trabajo',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/contracts/jobMarketplace/apply:
 *   post:
 *     summary: Aplicar a oferta de trabajo
 *     tags: [Job Marketplace]
 */
router.post('/jobMarketplace/apply', async (req, res) => {
  try {
    const { network, ...applicationData } = req.body;
    
    const { error } = Joi.object({
      network: networkSchema.extract('network'),
      ...applyToJobSchema.describe().keys
    }).validate({ network, ...applicationData });
    
    if (error) {
      return res.status(400).json({
        error: 'Datos inválidos',
        details: error.details.map(d => d.message)
      });
    }

    const result = await contractAPIs.applyToJob(network, applicationData.jobId, applicationData);
    
    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error aplicando a oferta de trabajo',
      message: error.message
    });
  }
});

// ========== SCHOLARSHIP MANAGER ROUTES ==========

/**
 * @swagger
 * /api/contracts/scholarshipManager/scholarships/{network}:
 *   get:
 *     summary: Obtener becas disponibles
 *     tags: [Scholarship Manager]
 */
router.get('/scholarshipManager/scholarships/:network', async (req, res) => {
  try {
    const { network } = req.params;
    
    const { error } = networkSchema.validate({ network });
    if (error) {
      return res.status(400).json({
        error: 'Red inválida',
        details: error.details.map(d => d.message)
      });
    }

    const scholarships = await contractAPIs.getScholarships(network);
    
    res.json({
      success: true,
      data: scholarships
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error obteniendo becas',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/contracts/scholarshipManager/create:
 *   post:
 *     summary: Crear beca
 *     tags: [Scholarship Manager]
 */
router.post('/scholarshipManager/create', async (req, res) => {
  try {
    const { network, ...scholarshipData } = req.body;
    
    const { error } = Joi.object({
      network: networkSchema.extract('network'),
      ...createScholarshipSchema.describe().keys
    }).validate({ network, ...scholarshipData });
    
    if (error) {
      return res.status(400).json({
        error: 'Datos inválidos',
        details: error.details.map(d => d.message)
      });
    }

    const result = await contractAPIs.createScholarship(network, scholarshipData);
    
    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error creando beca',
      message: error.message
    });
  }
});

// ========== GOVERNANCE ROUTES ==========

/**
 * @swagger
 * /api/contracts/governance/proposals/{network}:
 *   get:
 *     summary: Obtener propuestas de gobierno
 *     tags: [Governance]
 */
router.get('/governance/proposals/:network', async (req, res) => {
  try {
    const { network } = req.params;
    
    const { error } = networkSchema.validate({ network });
    if (error) {
      return res.status(400).json({
        error: 'Red inválida',
        details: error.details.map(d => d.message)
      });
    }

    const proposals = await contractAPIs.getProposals(network);
    
    res.json({
      success: true,
      data: proposals
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error obteniendo propuestas',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/contracts/governance/proposal:
 *   post:
 *     summary: Crear propuesta de gobierno
 *     tags: [Governance]
 */
router.post('/governance/proposal', async (req, res) => {
  try {
    const { network, ...proposalData } = req.body;
    
    const { error } = Joi.object({
      network: networkSchema.extract('network'),
      ...createProposalSchema.describe().keys
    }).validate({ network, ...proposalData });
    
    if (error) {
      return res.status(400).json({
        error: 'Datos inválidos',
        details: error.details.map(d => d.message)
      });
    }

    const result = await contractAPIs.createProposal(network, proposalData);
    
    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error creando propuesta',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/contracts/governance/vote:
 *   post:
 *     summary: Votar en propuesta
 *     tags: [Governance]
 */
router.post('/governance/vote', async (req, res) => {
  try {
    const { network, ...voteData } = req.body;
    
    const { error } = Joi.object({
      network: networkSchema.extract('network'),
      ...voteProposalSchema.describe().keys
    }).validate({ network, ...voteData });
    
    if (error) {
      return res.status(400).json({
        error: 'Datos inválidos',
        details: error.details.map(d => d.message)
      });
    }

    const result = await contractAPIs.voteOnProposal(
      network,
      voteData.proposalId,
      voteData.support,
      voteData.reason
    );
    
    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error votando en propuesta',
      message: error.message
    });
  }
});

// ========== BRIDGE ROUTES ==========

/**
 * @swagger
 * /api/contracts/bridge/transfer:
 *   post:
 *     summary: Iniciar transferencia cross-chain
 *     tags: [Bridge]
 */
router.post('/bridge/transfer', async (req, res) => {
  try {
    const { network, ...transferData } = req.body;
    
    const { error } = Joi.object({
      network: networkSchema.extract('network'),
      ...bridgeTransferSchema.describe().keys
    }).validate({ network, ...transferData });
    
    if (error) {
      return res.status(400).json({
        error: 'Datos inválidos',
        details: error.details.map(d => d.message)
      });
    }

    const result = await contractAPIs.initiateBridgeTransfer(
      network,
      transferData.targetNetwork,
      transferData.tokenAddress,
      transferData.amount,
      transferData.recipient
    );
    
    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error iniciando transferencia bridge',
      message: error.message
    });
  }
});

// ========== AI ORACLE ROUTES ==========

/**
 * @swagger
 * /api/contracts/aiOracle/prediction/{network}/{userAddress}/{predictionType}:
 *   get:
 *     summary: Obtener predicción de IA
 *     tags: [AI Oracle]
 */
router.get('/aiOracle/prediction/:network/:userAddress/:predictionType', async (req, res) => {
  try {
    const { network, userAddress, predictionType } = req.params;
    
    const prediction = await contractAPIs.getAIPrediction(network, userAddress, predictionType);
    
    res.json({
      success: true,
      data: prediction
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error obteniendo predicción de IA',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/contracts/aiOracle/jobMatch/{network}/{candidate}/{jobId}:
 *   get:
 *     summary: Calcular match de trabajo con IA
 *     tags: [AI Oracle]
 */
router.get('/aiOracle/jobMatch/:network/:candidate/:jobId', async (req, res) => {
  try {
    const { network, candidate, jobId } = req.params;
    
    const match = await contractAPIs.calculateJobMatch(network, candidate, jobId);
    
    res.json({
      success: true,
      data: match
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error calculando match de trabajo',
      message: error.message
    });
  }
});

// ========== UTILITY ROUTES ==========

/**
 * @swagger
 * /api/contracts/network/{network}:
 *   get:
 *     summary: Obtener información de red
 *     tags: [Utilities]
 */
router.get('/network/:network', async (req, res) => {
  try {
    const { network } = req.params;
    
    const { error } = networkSchema.validate({ network });
    if (error) {
      return res.status(400).json({
        error: 'Red inválida',
        details: error.details.map(d => d.message)
      });
    }

    const networkInfo = await contractAPIs.getNetworkInfo(network);
    
    res.json({
      success: true,
      data: networkInfo
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error obteniendo información de red',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/contracts/transaction/{network}/{txHash}:
 *   get:
 *     summary: Obtener información de transacción
 *     tags: [Utilities]
 */
router.get('/transaction/:network/:txHash', async (req, res) => {
  try {
    const { network, txHash } = req.params;
    
    const { error } = Joi.object({
      network: networkSchema.extract('network'),
      txHash: Joi.string().pattern(/^0x[a-fA-F0-9]{64}$/).required()
    }).validate({ network, txHash });
    
    if (error) {
      return res.status(400).json({
        error: 'Parámetros inválidos',
        details: error.details.map(d => d.message)
      });
    }

    const transaction = await contractAPIs.getTransaction(network, txHash);
    
    res.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error obteniendo transacción',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/contracts/events/{network}/{contractName}/{eventName}:
 *   get:
 *     summary: Obtener eventos de contrato
 *     tags: [Utilities]
 */
router.get('/events/:network/:contractName/:eventName', async (req, res) => {
  try {
    const { network, contractName, eventName } = req.params;
    const { fromBlock, toBlock } = req.query;
    
    const { error } = Joi.object({
      network: networkSchema.extract('network'),
      contractName: Joi.string().required(),
      eventName: Joi.string().required(),
      fromBlock: Joi.number().positive().optional(),
      toBlock: Joi.number().positive().optional()
    }).validate({ network, contractName, eventName, fromBlock, toBlock });
    
    if (error) {
      return res.status(400).json({
        error: 'Parámetros inválidos',
        details: error.details.map(d => d.message)
      });
    }

    const events = await contractAPIs.getContractEvents(
      network,
      contractName,
      eventName,
      fromBlock || 'latest',
      toBlock || 'latest'
    );
    
    res.json({
      success: true,
      data: events
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error obteniendo eventos',
      message: error.message
    });
  }
});

// ========== IPFS INTEGRATION ROUTES ==========

// Esquemas de validación para IPFS
const createUserProfileWithIPFSSchema = Joi.object({
  userAddress: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required(),
  name: Joi.string().min(1).max(100).required(),
  email: Joi.string().email().required(),
  profileData: Joi.object({
    bio: Joi.string().optional(),
    avatar: Joi.string().optional(),
    skills: Joi.array().items(Joi.string()).optional(),
    experience: Joi.array().optional(),
    education: Joi.array().optional(),
    socialLinks: Joi.object().optional(),
    reputationScore: Joi.number().optional()
  }).optional()
});

const issueCertificateWithIPFSSchema = Joi.object({
  recipient: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required(),
  title: Joi.string().min(1).max(200).required(),
  description: Joi.string().min(1).max(1000).required(),
  courseId: Joi.string().required(),
  score: Joi.number().min(0).max(100).required(),
  issuer: Joi.string().required()
});

const createCourseWithIPFSSchema = Joi.object({
  title: Joi.string().min(1).max(200).required(),
  description: Joi.string().min(1).max(1000).required(),
  instructor: Joi.string().required(),
  duration: Joi.number().positive().required(),
  difficulty: Joi.string().valid('beginner', 'intermediate', 'advanced').required(),
  courseData: Joi.object({
    topics: Joi.array().items(Joi.string()).optional(),
    requirements: Joi.array().items(Joi.string()).optional(),
    outcomes: Joi.array().items(Joi.string()).optional(),
    thumbnail: Joi.string().optional(),
    price: Joi.number().optional(),
    maxStudents: Joi.number().optional()
  }).optional()
});

const updateTokenMetadataSchema = Joi.object({
  updates: Joi.object().required()
});

/**
 * @swagger
 * /api/contracts/brainSafes/profile-with-ipfs:
 *   post:
 *     summary: Crear perfil de usuario con metadata en IPFS
 *     description: Crea un perfil de usuario y sube su metadata a IPFS
 *     tags: [BrainSafes Core - IPFS]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - network
 *               - userAddress
 *               - name
 *               - email
 *             properties:
 *               network:
 *                 type: string
 *                 enum: [arbitrum, arbitrumTestnet, ethereum]
 *               userAddress:
 *                 type: string
 *                 pattern: ^0x[a-fA-F0-9]{40}$
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               profileData:
 *                 type: object
 *     responses:
 *       201:
 *         description: Perfil creado exitosamente con metadata en IPFS
 */
router.post('/brainSafes/profile-with-ipfs', async (req, res) => {
  try {
    const { network, ...profileData } = req.body;
    
    const { error } = Joi.object({
      network: networkSchema.extract('network'),
      ...createUserProfileWithIPFSSchema.describe().keys
    }).validate({ network, ...profileData });
    
    if (error) {
      return res.status(400).json({
        error: 'Datos inválidos',
        details: error.details.map(d => d.message)
      });
    }

    const result = await contractAPIs.createUserProfileWithIPFS(
      network,
      profileData.userAddress,
      profileData.name,
      profileData.email,
      profileData.profileData || {}
    );
    
    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error creando perfil con IPFS',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/contracts/certificateNFT/issue-with-ipfs:
 *   post:
 *     summary: Emitir certificado con metadata en IPFS
 *     description: Emite un certificado NFT con metadata completa en IPFS
 *     tags: [Certificate NFT - IPFS]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - network
 *               - recipient
 *               - title
 *               - description
 *               - courseId
 *               - score
 *               - issuer
 *             properties:
 *               network:
 *                 type: string
 *                 enum: [arbitrum, arbitrumTestnet, ethereum]
 *               recipient:
 *                 type: string
 *                 pattern: ^0x[a-fA-F0-9]{40}$
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               courseId:
 *                 type: string
 *               score:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *               issuer:
 *                 type: string
 *     responses:
 *       201:
 *         description: Certificado emitido exitosamente con metadata en IPFS
 */
router.post('/certificateNFT/issue-with-ipfs', async (req, res) => {
  try {
    const { network, ...certificateData } = req.body;
    
    const { error } = Joi.object({
      network: networkSchema.extract('network'),
      ...issueCertificateWithIPFSSchema.describe().keys
    }).validate({ network, ...certificateData });
    
    if (error) {
      return res.status(400).json({
        error: 'Datos inválidos',
        details: error.details.map(d => d.message)
      });
    }

    const result = await contractAPIs.issueCertificateWithIPFS(
      network,
      certificateData.recipient,
      certificateData.title,
      certificateData.description,
      certificateData.courseId,
      certificateData.score,
      certificateData.issuer
    );
    
    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error emitiendo certificado con IPFS',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/contracts/course/create-with-ipfs:
 *   post:
 *     summary: Crear curso con metadata en IPFS
 *     description: Crea un curso con metadata completa en IPFS
 *     tags: [Course Management - IPFS]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - network
 *               - title
 *               - description
 *               - instructor
 *               - duration
 *               - difficulty
 *             properties:
 *               network:
 *                 type: string
 *                 enum: [arbitrum, arbitrumTestnet, ethereum]
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               instructor:
 *                 type: string
 *               duration:
 *                 type: number
 *               difficulty:
 *                 type: string
 *                 enum: [beginner, intermediate, advanced]
 *               courseData:
 *                 type: object
 *     responses:
 *       201:
 *         description: Curso creado exitosamente con metadata en IPFS
 */
router.post('/course/create-with-ipfs', async (req, res) => {
  try {
    const { network, ...courseData } = req.body;
    
    const { error } = Joi.object({
      network: networkSchema.extract('network'),
      ...createCourseWithIPFSSchema.describe().keys
    }).validate({ network, ...courseData });
    
    if (error) {
      return res.status(400).json({
        error: 'Datos inválidos',
        details: error.details.map(d => d.message)
      });
    }

    const result = await contractAPIs.createCourseWithIPFS(
      network,
      courseData.title,
      courseData.description,
      courseData.instructor,
      courseData.duration,
      courseData.difficulty,
      courseData.courseData || {}
    );
    
    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error creando curso con IPFS',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/contracts/metadata/{network}/{contractName}/{tokenId}:
 *   get:
 *     summary: Obtener metadata de token desde IPFS
 *     description: Obtiene la metadata completa de un token desde IPFS
 *     tags: [Metadata - IPFS]
 *     parameters:
 *       - in: path
 *         name: network
 *         required: true
 *         schema:
 *           type: string
 *           enum: [arbitrum, arbitrumTestnet, ethereum]
 *       - in: path
 *         name: contractName
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: tokenId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Metadata obtenida exitosamente
 */
router.get('/metadata/:network/:contractName/:tokenId', async (req, res) => {
  try {
    const { network, contractName, tokenId } = req.params;
    
    const { error } = Joi.object({
      network: networkSchema.extract('network'),
      contractName: Joi.string().required(),
      tokenId: Joi.string().required()
    }).validate({ network, contractName, tokenId });
    
    if (error) {
      return res.status(400).json({
        error: 'Parámetros inválidos',
        details: error.details.map(d => d.message)
      });
    }

    const metadata = await contractAPIs.getTokenMetadata(network, contractName, tokenId);
    
    res.json({
      success: true,
      data: metadata
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error obteniendo metadata de token',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/contracts/metadata/{network}/{contractName}/{tokenId}:
 *   put:
 *     summary: Actualizar metadata de token en IPFS
 *     description: Actualiza la metadata de un token en IPFS
 *     tags: [Metadata - IPFS]
 *     parameters:
 *       - in: path
 *         name: network
 *         required: true
 *         schema:
 *           type: string
 *           enum: [arbitrum, arbitrumTestnet, ethereum]
 *       - in: path
 *         name: contractName
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: tokenId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - updates
 *             properties:
 *               updates:
 *                 type: object
 *     responses:
 *       200:
 *         description: Metadata actualizada exitosamente
 */
router.put('/metadata/:network/:contractName/:tokenId', async (req, res) => {
  try {
    const { network, contractName, tokenId } = req.params;
    const { updates } = req.body;
    
    const { error } = Joi.object({
      network: networkSchema.extract('network'),
      contractName: Joi.string().required(),
      tokenId: Joi.string().required(),
      ...updateTokenMetadataSchema.describe().keys
    }).validate({ network, contractName, tokenId, updates });
    
    if (error) {
      return res.status(400).json({
        error: 'Datos inválidos',
        details: error.details.map(d => d.message)
      });
    }

    const result = await contractAPIs.updateTokenMetadata(network, contractName, tokenId, updates);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error actualizando metadata de token',
      message: error.message
    });
  }
});

module.exports = router;
