const express = require('express');
const Joi = require('joi');
const blockchainWebhookManager = require('../services/blockchainWebhookManager');
const securityManager = require('../middleware/security');

const router = express.Router();

// ========== VALIDATION SCHEMAS ==========

const blockchainEventSchema = Joi.object({
  eventType: Joi.string().required(),
  eventData: Joi.object().required(),
  metadata: Joi.object({
    txHash: Joi.string().pattern(/^0x[a-fA-F0-9]{64}$/).optional(),
    blockNumber: Joi.number().positive().optional(),
    network: Joi.string().valid('arbitrum', 'arbitrumTestnet', 'ethereum').optional(),
    contractAddress: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).optional()
  }).optional()
});

const eventFilterSchema = Joi.object({
  eventType: Joi.string().optional(),
  network: Joi.string().valid('arbitrum', 'arbitrumTestnet', 'ethereum').optional(),
  contractAddress: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).optional(),
  fromTimestamp: Joi.number().positive().optional(),
  toTimestamp: Joi.number().positive().optional(),
  limit: Joi.number().min(1).max(100).optional()
});

// ========== BLOCKCHAIN WEBHOOK ROUTES ==========

/**
 * @swagger
 * /api/blockchain-webhooks/event:
 *   post:
 *     summary: Registrar evento blockchain para procesamiento
 *     tags: [Blockchain Webhooks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - eventType
 *               - eventData
 *             properties:
 *               eventType:
 *                 type: string
 *               eventData:
 *                 type: object
 *               metadata:
 *                 type: object
 */
router.post('/event', async (req, res) => {
  try {
    const { eventType, eventData, metadata = {} } = req.body;

    // Validar datos
    const { error } = blockchainEventSchema.validate({ eventType, eventData, metadata });
    if (error) {
      return res.status(400).json({
        error: 'Datos de evento inválidos',
        details: error.details.map(d => d.message)
      });
    }

    // Registrar evento para procesamiento
    await blockchainWebhookManager.registerBlockchainEvent(eventType, eventData, metadata);

    res.status(201).json({
      success: true,
      message: 'Evento blockchain registrado para procesamiento'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error registrando evento blockchain',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/blockchain-webhooks/events:
 *   get:
 *     summary: Obtener eventos blockchain con filtros
 *     tags: [Blockchain Webhooks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: eventType
 *         schema:
 *           type: string
 *       - in: query
 *         name: network
 *         schema:
 *           type: string
 *       - in: query
 *         name: contractAddress
 *         schema:
 *           type: string
 *       - in: query
 *         name: fromTimestamp
 *         schema:
 *           type: number
 *       - in: query
 *         name: toTimestamp
 *         schema:
 *           type: number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 */
router.get('/events', async (req, res) => {
  try {
    const filters = req.query;

    // Validar filtros
    const { error } = eventFilterSchema.validate(filters);
    if (error) {
      return res.status(400).json({
        error: 'Filtros inválidos',
        details: error.details.map(d => d.message)
      });
    }

    // Obtener eventos filtrados
    const events = await getFilteredEvents(filters);

    res.json({
      success: true,
      data: {
        events,
        total: events.length,
        filters
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error obteniendo eventos blockchain',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/blockchain-webhooks/stats:
 *   get:
 *     summary: Obtener estadísticas de eventos blockchain
 *     tags: [Blockchain Webhooks]
 *     security:
 *       - bearerAuth: []
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = blockchainWebhookManager.getStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error obteniendo estadísticas',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/blockchain-webhooks/cleanup:
 *   post:
 *     summary: Limpiar eventos blockchain antiguos
 *     tags: [Blockchain Webhooks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               maxAge:
 *                 type: number
 *                 description: Edad máxima en milisegundos (por defecto 24 horas)
 */
router.post('/cleanup', async (req, res) => {
  try {
    const { maxAge = 24 * 60 * 60 * 1000 } = req.body; // 24 horas por defecto

    const cleaned = blockchainWebhookManager.cleanupOldEvents(maxAge);

    res.json({
      success: true,
      message: `Limpiados ${cleaned} eventos blockchain antiguos`,
      data: {
        cleaned,
        maxAge
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error limpiando eventos',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/blockchain-webhooks/event-types:
 *   get:
 *     summary: Obtener tipos de eventos blockchain disponibles
 *     tags: [Blockchain Webhooks]
 */
router.get('/event-types', async (req, res) => {
  try {
    const eventTypes = [
      // Eventos de BrainSafes Core
      'UserProfileCreated',
      'UserProfileUpdated',
      'RoleGranted',
      'RoleRevoked',

      // Eventos de EDU Token
      'Transfer',
      'Mint',
      'Burn',
      'Approval',

      // Eventos de Certificate NFT
      'CertificateIssued',
      'CertificateRevoked',
      'CertificateTransferred',

      // Eventos de Course NFT
      'CourseCreated',
      'StudentEnrolled',
      'CourseCompleted',

      // Eventos de Job Marketplace
      'JobPosted',
      'JobApplicationSubmitted',
      'ApplicationStatusUpdated',
      'HiringContractCreated',
      'SuccessfulHire',

      // Eventos de Scholarship Manager
      'ScholarshipCreated',
      'ScholarshipAwarded',
      'ScholarshipExpired',

      // Eventos de Governance
      'ProposalCreated',
      'VoteCast',
      'ProposalExecuted',
      'ProposalCanceled',

      // Eventos de Bridge
      'TransferInitiated',
      'TransferCompleted',
      'TransferFailed',
      'MessageSent',

      // Eventos de AI Oracle
      'PredictionUpdated',
      'JobMatchCalculated',
      'AIAnalysisCompleted'
    ];

    res.json({
      success: true,
      data: {
        eventTypes,
        total: eventTypes.length,
        categories: {
          'BrainSafes Core': ['UserProfileCreated', 'UserProfileUpdated', 'RoleGranted', 'RoleRevoked'],
          'EDU Token': ['Transfer', 'Mint', 'Burn', 'Approval'],
          'Certificate NFT': ['CertificateIssued', 'CertificateRevoked', 'CertificateTransferred'],
          'Course NFT': ['CourseCreated', 'StudentEnrolled', 'CourseCompleted'],
          'Job Marketplace': ['JobPosted', 'JobApplicationSubmitted', 'ApplicationStatusUpdated', 'HiringContractCreated', 'SuccessfulHire'],
          'Scholarship Manager': ['ScholarshipCreated', 'ScholarshipAwarded', 'ScholarshipExpired'],
          'Governance': ['ProposalCreated', 'VoteCast', 'ProposalExecuted', 'ProposalCanceled'],
          'Bridge': ['TransferInitiated', 'TransferCompleted', 'TransferFailed', 'MessageSent'],
          'AI Oracle': ['PredictionUpdated', 'JobMatchCalculated', 'AIAnalysisCompleted']
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error obteniendo tipos de eventos',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/blockchain-webhooks/test:
 *   post:
 *     summary: Probar procesamiento de evento blockchain
 *     tags: [Blockchain Webhooks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - eventType
 *               - eventData
 */
router.post('/test', async (req, res) => {
  try {
    const { eventType, eventData } = req.body;

    if (!eventType || !eventData) {
      return res.status(400).json({
        error: 'eventType y eventData son requeridos'
      });
    }

    // Simular evento de prueba
    const testMetadata = {
      txHash: '0x' + '0'.repeat(64),
      blockNumber: 12345678,
      network: 'arbitrumTestnet',
      contractAddress: '0x' + '0'.repeat(40),
      test: true
    };

    await blockchainWebhookManager.registerBlockchainEvent(eventType, eventData, testMetadata);

    res.json({
      success: true,
      message: 'Evento de prueba registrado para procesamiento',
      data: {
        eventType,
        eventData,
        metadata: testMetadata
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error procesando evento de prueba',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/blockchain-webhooks/health:
 *   get:
 *     summary: Verificar salud del sistema de webhooks blockchain
 *     tags: [Blockchain Webhooks]
 */
router.get('/health', async (req, res) => {
  try {
    const stats = blockchainWebhookManager.getStats();
    
    const health = {
      status: 'healthy',
      timestamp: Date.now(),
      uptime: process.uptime(),
      stats: {
        totalEvents: stats.totalEvents,
        pendingEvents: stats.pendingEvents,
        processedEvents: stats.processedEvents,
        failedEvents: stats.failedEvents,
        processingRate: stats.processedEvents / Math.max(process.uptime(), 1) * 3600 // eventos por hora
      },
      system: {
        memory: process.memoryUsage(),
        cpu: process.cpuUsage()
      }
    };

    // Marcar como no saludable si hay muchos eventos fallidos
    if (stats.failedEvents > stats.processedEvents * 0.1) { // Más del 10% de fallos
      health.status = 'degraded';
    }

    // Marcar como no saludable si hay muchos eventos pendientes
    if (stats.pendingEvents > 1000) {
      health.status = 'overloaded';
    }

    const statusCode = health.status === 'healthy' ? 200 : 503;

    res.status(statusCode).json({
      success: true,
      data: health
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: 'Error verificando salud del sistema',
      message: error.message
    });
  }
});

// ========== UTILITY FUNCTIONS ==========

/**
 * Obtener eventos filtrados
 * @param {Object} filters - Filtros a aplicar
 * @returns {Array} Eventos filtrados
 */
async function getFilteredEvents(filters) {
  const stats = blockchainWebhookManager.getStats();
  const allEvents = Array.from(blockchainWebhookManager.blockchainEvents.values());
  
  let filteredEvents = allEvents;

  // Filtrar por tipo de evento
  if (filters.eventType) {
    filteredEvents = filteredEvents.filter(event => 
      event.eventType === filters.eventType
    );
  }

  // Filtrar por red
  if (filters.network) {
    filteredEvents = filteredEvents.filter(event => 
      event.metadata.network === filters.network
    );
  }

  // Filtrar por dirección de contrato
  if (filters.contractAddress) {
    filteredEvents = filteredEvents.filter(event => 
      event.metadata.contractAddress === filters.contractAddress
    );
  }

  // Filtrar por rango de tiempo
  if (filters.fromTimestamp) {
    filteredEvents = filteredEvents.filter(event => 
      event.metadata.timestamp >= parseInt(filters.fromTimestamp)
    );
  }

  if (filters.toTimestamp) {
    filteredEvents = filteredEvents.filter(event => 
      event.metadata.timestamp <= parseInt(filters.toTimestamp)
    );
  }

  // Limitar resultados
  const limit = filters.limit ? parseInt(filters.limit) : 50;
  filteredEvents = filteredEvents.slice(0, limit);

  // Ordenar por timestamp (más reciente primero)
  filteredEvents.sort((a, b) => b.metadata.timestamp - a.metadata.timestamp);

  return filteredEvents.map(event => ({
    id: event.id,
    eventType: event.eventType,
    eventData: event.eventData,
    metadata: {
      ...event.metadata,
      processed: event.metadata.processed,
      retryCount: event.metadata.retryCount
    }
  }));
}

module.exports = router;
