const express = require('express');
const Joi = require('joi');
const ipfsMetadataManager = require('../services/ipfsMetadataManager');
const router = express.Router();

// Esquemas de validación
const nftMetadataSchema = Joi.object({
  type: Joi.string().valid('certificate', 'course', 'achievement', 'profile').required(),
  data: Joi.object({
    tokenId: Joi.string().optional(),
    id: Joi.string().optional(),
    name: Joi.string().required(),
    title: Joi.string().optional(),
    description: Joi.string().required(),
    image: Joi.string().optional(),
    imageHash: Joi.string().optional(),
    attributes: Joi.array().optional(),
    // Campos específicos para certificados
    issuer: Joi.string().optional(),
    recipient: Joi.string().optional(),
    courseId: Joi.string().optional(),
    score: Joi.number().optional(),
    issuedAt: Joi.string().optional(),
    expiresAt: Joi.string().optional(),
    signature: Joi.string().optional(),
    contractAddress: Joi.string().optional(),
    // Campos específicos para cursos
    instructor: Joi.string().optional(),
    duration: Joi.number().optional(),
    difficulty: Joi.string().optional(),
    topics: Joi.array().optional(),
    requirements: Joi.array().optional(),
    outcomes: Joi.array().optional(),
    thumbnail: Joi.string().optional(),
    price: Joi.number().optional(),
    maxStudents: Joi.number().optional(),
    // Campos específicos para perfiles
    email: Joi.string().email().optional(),
    bio: Joi.string().optional(),
    avatar: Joi.string().optional(),
    skills: Joi.array().optional(),
    experience: Joi.array().optional(),
    education: Joi.array().optional(),
    socialLinks: Joi.object().optional(),
    reputationScore: Joi.number().optional(),
    walletAddress: Joi.string().optional()
  }).required(),
  options: Joi.object().optional()
});

const profileMetadataSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  bio: Joi.string().optional(),
  avatar: Joi.string().optional(),
  skills: Joi.array().items(Joi.string()).optional(),
  experience: Joi.array().optional(),
  education: Joi.array().optional(),
  socialLinks: Joi.object().optional(),
  reputationScore: Joi.number().optional(),
  walletAddress: Joi.string().required(),
  options: Joi.object().optional()
});

const courseMetadataSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().required(),
  instructor: Joi.string().required(),
  duration: Joi.number().required(),
  difficulty: Joi.string().valid('beginner', 'intermediate', 'advanced').required(),
  topics: Joi.array().items(Joi.string()).optional(),
  requirements: Joi.array().items(Joi.string()).optional(),
  outcomes: Joi.array().items(Joi.string()).optional(),
  thumbnail: Joi.string().optional(),
  price: Joi.number().optional(),
  maxStudents: Joi.number().optional(),
  courseId: Joi.string().required(),
  options: Joi.object().optional()
});

const certificateMetadataSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().required(),
  issuer: Joi.string().required(),
  recipient: Joi.string().required(),
  courseId: Joi.string().required(),
  score: Joi.number().min(0).max(100).required(),
  issuedAt: Joi.string().required(),
  expiresAt: Joi.string().optional(),
  signature: Joi.string().optional(),
  tokenId: Joi.string().required(),
  contractAddress: Joi.string().required(),
  options: Joi.object().optional()
});

const updateMetadataSchema = Joi.object({
  hash: Joi.string().required(),
  updates: Joi.object().required(),
  options: Joi.object().optional()
});

/**
 * @swagger
 * /api/ipfs-metadata/nft:
 *   post:
 *     summary: Subir metadata de NFT a IPFS
 *     description: Sube metadata estándar de NFT (certificado, curso, logro, perfil) a IPFS
 *     tags: [IPFS Metadata]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - data
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [certificate, course, achievement, profile]
 *                 description: Tipo de NFT
 *               data:
 *                 type: object
 *                 description: Datos del NFT
 *               options:
 *                 type: object
 *                 description: Opciones adicionales
 *     responses:
 *       201:
 *         description: Metadata de NFT subida exitosamente
 */
router.post('/nft', async (req, res) => {
  try {
    const { type, data, options = {} } = req.body;

    const { error } = nftMetadataSchema.validate({ type, data, options });
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        details: error.details.map(d => d.message)
      });
    }

    const result = await ipfsMetadataManager.uploadNFTMetadata(type, data, options);

    res.status(201).json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error subiendo metadata de NFT:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/ipfs-metadata/profile:
 *   post:
 *     summary: Subir metadata de perfil a IPFS
 *     description: Sube metadata de perfil de usuario a IPFS
 *     tags: [IPFS Metadata]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - walletAddress
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               bio:
 *                 type: string
 *               avatar:
 *                 type: string
 *               skills:
 *                 type: array
 *                 items:
 *                   type: string
 *               experience:
 *                 type: array
 *               education:
 *                 type: array
 *               socialLinks:
 *                 type: object
 *               reputationScore:
 *                 type: number
 *               walletAddress:
 *                 type: string
 *     responses:
 *       201:
 *         description: Metadata de perfil subida exitosamente
 */
router.post('/profile', async (req, res) => {
  try {
    const { error } = profileMetadataSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        details: error.details.map(d => d.message)
      });
    }

    const result = await ipfsMetadataManager.uploadProfileMetadata(req.body);

    res.status(201).json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error subiendo metadata de perfil:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/ipfs-metadata/course:
 *   post:
 *     summary: Subir metadata de curso a IPFS
 *     description: Sube metadata de curso educativo a IPFS
 *     tags: [IPFS Metadata]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - instructor
 *               - duration
 *               - difficulty
 *               - courseId
 *             properties:
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
 *               topics:
 *                 type: array
 *                 items:
 *                   type: string
 *               requirements:
 *                 type: array
 *                 items:
 *                   type: string
 *               outcomes:
 *                 type: array
 *                 items:
 *                   type: string
 *               thumbnail:
 *                 type: string
 *               price:
 *                 type: number
 *               maxStudents:
 *                 type: number
 *               courseId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Metadata de curso subida exitosamente
 */
router.post('/course', async (req, res) => {
  try {
    const { error } = courseMetadataSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        details: error.details.map(d => d.message)
      });
    }

    const result = await ipfsMetadataManager.uploadCourseMetadata(req.body);

    res.status(201).json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error subiendo metadata de curso:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/ipfs-metadata/certificate:
 *   post:
 *     summary: Subir metadata de certificado a IPFS
 *     description: Sube metadata de certificado educativo a IPFS
 *     tags: [IPFS Metadata]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - issuer
 *               - recipient
 *               - courseId
 *               - score
 *               - issuedAt
 *               - tokenId
 *               - contractAddress
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               issuer:
 *                 type: string
 *               recipient:
 *                 type: string
 *               courseId:
 *                 type: string
 *               score:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *               issuedAt:
 *                 type: string
 *               expiresAt:
 *                 type: string
 *               signature:
 *                 type: string
 *               tokenId:
 *                 type: string
 *               contractAddress:
 *                 type: string
 *     responses:
 *       201:
 *         description: Metadata de certificado subida exitosamente
 */
router.post('/certificate', async (req, res) => {
  try {
    const { error } = certificateMetadataSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        details: error.details.map(d => d.message)
      });
    }

    const result = await ipfsMetadataManager.uploadCertificateMetadata(req.body);

    res.status(201).json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error subiendo metadata de certificado:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/ipfs-metadata/get/{hash}:
 *   get:
 *     summary: Obtener metadata desde IPFS
 *     description: Obtiene metadata desde IPFS por su hash
 *     tags: [IPFS Metadata]
 *     parameters:
 *       - in: path
 *         name: hash
 *         required: true
 *         schema:
 *           type: string
 *         description: Hash IPFS de la metadata
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Tipo de metadata (opcional)
 *     responses:
 *       200:
 *         description: Metadata obtenida exitosamente
 *       404:
 *         description: Metadata no encontrada
 */
router.get('/get/:hash', async (req, res) => {
  try {
    const { hash } = req.params;
    const { type } = req.query;

    if (!ipfsMetadataManager.isValidHash(hash)) {
      return res.status(400).json({
        success: false,
        error: 'Hash IPFS inválido'
      });
    }

    const metadata = await ipfsMetadataManager.getMetadata(hash, type);

    res.json({
      success: true,
      data: metadata
    });

  } catch (error) {
    console.error('Error obteniendo metadata:', error);
    res.status(404).json({
      success: false,
      error: 'Metadata no encontrada'
    });
  }
});

/**
 * @swagger
 * /api/ipfs-metadata/validate:
 *   post:
 *     summary: Validar metadata según estándar
 *     description: Valida metadata según el estándar especificado
 *     tags: [IPFS Metadata]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - metadata
 *               - type
 *             properties:
 *               metadata:
 *                 type: object
 *                 description: Metadata a validar
 *               type:
 *                 type: string
 *                 enum: [erc721, erc1155, profile, course, certificate]
 *                 description: Tipo de metadata
 *     responses:
 *       200:
 *         description: Validación completada
 */
router.post('/validate', async (req, res) => {
  try {
    const { metadata, type } = req.body;

    if (!metadata || !type) {
      return res.status(400).json({
        success: false,
        error: 'Metadata y tipo requeridos'
      });
    }

    const validation = ipfsMetadataManager.validateMetadata(metadata, type);

    res.json({
      success: true,
      data: validation
    });

  } catch (error) {
    console.error('Error validando metadata:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/ipfs-metadata/update:
 *   put:
 *     summary: Actualizar metadata existente
 *     description: Actualiza metadata existente en IPFS
 *     tags: [IPFS Metadata]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - hash
 *               - updates
 *             properties:
 *               hash:
 *                 type: string
 *                 description: Hash IPFS original
 *               updates:
 *                 type: object
 *                 description: Actualizaciones a aplicar
 *               options:
 *                 type: object
 *                 description: Opciones adicionales
 *     responses:
 *       200:
 *         description: Metadata actualizada exitosamente
 */
router.put('/update', async (req, res) => {
  try {
    const { error } = updateMetadataSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        details: error.details.map(d => d.message)
      });
    }

    const { hash, updates, options = {} } = req.body;

    const result = await ipfsMetadataManager.updateMetadata(hash, updates, options);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error actualizando metadata:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/ipfs-metadata/standards:
 *   get:
 *     summary: Obtener estándares de metadata
 *     description: Obtiene los estándares de metadata soportados
 *     tags: [IPFS Metadata]
 *     responses:
 *       200:
 *         description: Estándares obtenidos exitosamente
 */
router.get('/standards', async (req, res) => {
  try {
    const standards = ipfsMetadataManager.metadataStandards;

    res.json({
      success: true,
      data: standards
    });

  } catch (error) {
    console.error('Error obteniendo estándares:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/ipfs-metadata/stats:
 *   get:
 *     summary: Obtener estadísticas de metadata
 *     description: Obtiene estadísticas del sistema de metadata
 *     tags: [IPFS Metadata]
 *     responses:
 *       200:
 *         description: Estadísticas obtenidas exitosamente
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = ipfsMetadataManager.getStats();

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/ipfs-metadata/cleanup:
 *   post:
 *     summary: Limpiar cache de metadata
 *     description: Limpia el cache de metadata según la edad máxima
 *     tags: [IPFS Metadata]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               maxAge:
 *                 type: number
 *                 default: 86400000
 *                 description: Edad máxima en milisegundos (24 horas por defecto)
 *     responses:
 *       200:
 *         description: Cache limpiado exitosamente
 */
router.post('/cleanup', async (req, res) => {
  try {
    const { maxAge = 24 * 60 * 60 * 1000 } = req.body; // 24 horas por defecto

    const cleaned = ipfsMetadataManager.cleanupCache(maxAge);

    res.json({
      success: true,
      data: {
        cleaned,
        maxAge
      }
    });

  } catch (error) {
    console.error('Error limpiando cache:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
