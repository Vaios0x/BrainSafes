const express = require('express');
const Joi = require('joi');
const webhookManager = require('../services/webhookManager');
const securityManager = require('../middleware/security');

const router = express.Router();

// Esquemas de validación
const webhookSchema = Joi.object({
  url: Joi.string().uri().required(),
  secret: Joi.string().min(16).required(),
  events: Joi.array().items(Joi.string()).min(1).required(),
  options: Joi.object({
    timeout: Joi.number().min(1000).max(30000),
    retries: Joi.number().min(1).max(10),
    headers: Joi.object()
  }).optional()
});

// Middleware de validación
const validateWebhook = (req, res, next) => {
  const { error } = webhookSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: 'Datos de webhook inválidos',
      details: error.details.map(d => d.message)
    });
  }
  next();
};

/**
 * @swagger
 * /api/webhooks:
 *   post:
 *     summary: Registrar nuevo webhook
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - url
 *               - secret
 *               - events
 *             properties:
 *               url:
 *                 type: string
 *               secret:
 *                 type: string
 *               events:
 *                 type: array
 *                 items:
 *                   type: string
 *               options:
 *                 type: object
 */
router.post('/', validateWebhook, async (req, res) => {
  try {
    const { url, secret, events, options = {} } = req.body;

    const webhookId = webhookManager.registerWebhook(url, secret, events, options);

    res.status(201).json({
      success: true,
      message: 'Webhook registrado exitosamente',
      data: {
        id: webhookId,
        url,
        events,
        options
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error registrando webhook',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/webhooks:
 *   get:
 *     summary: Listar webhooks
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', async (req, res) => {
  try {
    const stats = webhookManager.getStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error obteniendo webhooks',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/webhooks/{id}:
 *   get:
 *     summary: Obtener webhook específico
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const stats = webhookManager.getStats();
    
    const webhook = stats.webhooks.find(w => w.id === id);
    
    if (!webhook) {
      return res.status(404).json({
        error: 'Webhook no encontrado'
      });
    }

    res.json({
      success: true,
      data: webhook
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error obteniendo webhook',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/webhooks/{id}:
 *   delete:
 *     summary: Eliminar webhook
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const success = webhookManager.unregisterWebhook(id);
    
    if (!success) {
      return res.status(404).json({
        error: 'Webhook no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Webhook eliminado exitosamente'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error eliminando webhook',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/webhooks/test:
 *   post:
 *     summary: Probar webhook
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - webhookId
 *               - eventType
 *               - eventData
 */
router.post('/test', async (req, res) => {
  try {
    const { webhookId, eventType, eventData } = req.body;

    if (!webhookId || !eventType) {
      return res.status(400).json({
        error: 'webhookId y eventType son requeridos'
      });
    }

    // Enviar evento de prueba
    await webhookManager.sendEvent(eventType, eventData || {}, {
      webhookId,
      test: true
    });

    res.json({
      success: true,
      message: 'Evento de prueba enviado exitosamente'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error enviando evento de prueba',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/webhooks/events:
 *   get:
 *     summary: Listar eventos disponibles
 *     tags: [Webhooks]
 */
router.get('/events', async (req, res) => {
  try {
    const events = [
      // Eventos de usuarios
      'user.registered',
      'user.login',
      'user.profile_updated',
      'user.achievement_unlocked',
      'user.reward_distributed',
      
      // Eventos de cursos
      'course.created',
      'course.enrolled',
      'course.completed',
      'course.updated',
      
      // Eventos de certificados
      'certificate.issued',
      'certificate.revoked',
      'certificate.transferred',
      
      // Eventos de gobierno
      'governance.proposal_created',
      'governance.vote_cast',
      'governance.proposal_executed',
      'governance.proposal_canceled',
      
      // Eventos de marketplace
      'marketplace.job_posted',
      'marketplace.application_submitted',
      'marketplace.job_completed',
      'marketplace.payment_processed',
      
      // Eventos de bridge
      'bridge.transfer_initiated',
      'bridge.transfer_completed',
      'bridge.transfer_failed',
      'bridge.message_sent',
      
      // Eventos generales de blockchain
      'blockchain.event'
    ];

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

module.exports = router;
