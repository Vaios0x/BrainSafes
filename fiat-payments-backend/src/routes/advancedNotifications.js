const express = require('express');
const Joi = require('joi');
const advancedNotificationManager = require('../services/advancedNotificationManager');
const router = express.Router();

// Esquemas de validación
const blockchainEventSchema = Joi.object({
  eventType: Joi.string().required(),
  eventData: Joi.object().required(),
  metadata: Joi.object().optional()
});

const configureNotificationSchema = Joi.object({
  eventType: Joi.string().required(),
  config: Joi.object({
    enabled: Joi.boolean().optional(),
    template: Joi.object().optional(),
    webhook: Joi.boolean().optional()
  }).required()
});

/**
 * @swagger
 * /api/advanced-notifications/blockchain-event:
 *   post:
 *     summary: Procesar evento blockchain para notificaciones
 *     description: Procesa un evento blockchain y envía notificaciones automáticas
 *     tags: [Advanced Notifications]
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
 *                 description: Tipo de evento blockchain
 *               eventData:
 *                 type: object
 *                 description: Datos del evento
 *               metadata:
 *                 type: object
 *                 description: Metadata adicional
 *     responses:
 *       200:
 *         description: Evento procesado exitosamente
 */
router.post('/blockchain-event', async (req, res) => {
  try {
    const { eventType, eventData, metadata = {} } = req.body;

    const { error } = blockchainEventSchema.validate({ eventType, eventData, metadata });
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        details: error.details.map(d => d.message)
      });
    }

    const results = await advancedNotificationManager.processBlockchainEvent(
      eventType,
      eventData,
      metadata
    );

    res.json({
      success: true,
      data: {
        eventType,
        notificationsSent: results.length,
        results
      }
    });

  } catch (error) {
    console.error('Error procesando evento blockchain:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/advanced-notifications/configure:
 *   post:
 *     summary: Configurar notificación blockchain
 *     description: Configura las notificaciones para un tipo de evento blockchain
 *     tags: [Advanced Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - eventType
 *               - config
 *             properties:
 *               eventType:
 *                 type: string
 *                 description: Tipo de evento
 *               config:
 *                 type: object
 *                 description: Configuración de notificación
 *     responses:
 *       200:
 *         description: Configuración aplicada exitosamente
 */
router.post('/configure', async (req, res) => {
  try {
    const { eventType, config } = req.body;

    const { error } = configureNotificationSchema.validate({ eventType, config });
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        details: error.details.map(d => d.message)
      });
    }

    advancedNotificationManager.configureBlockchainNotification(eventType, config);

    res.json({
      success: true,
      message: `Configuración aplicada para evento: ${eventType}`
    });

  } catch (error) {
    console.error('Error configurando notificación:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/advanced-notifications/disable/{eventType}:
 *   post:
 *     summary: Deshabilitar notificaciones para evento
 *     description: Deshabilita las notificaciones para un tipo de evento específico
 *     tags: [Advanced Notifications]
 *     parameters:
 *       - in: path
 *         name: eventType
 *         required: true
 *         schema:
 *           type: string
 *         description: Tipo de evento
 *     responses:
 *       200:
 *         description: Notificaciones deshabilitadas exitosamente
 */
router.post('/disable/:eventType', async (req, res) => {
  try {
    const { eventType } = req.params;

    if (!eventType) {
      return res.status(400).json({
        success: false,
        error: 'Tipo de evento requerido'
      });
    }

    advancedNotificationManager.disableBlockchainNotification(eventType);

    res.json({
      success: true,
      message: `Notificaciones deshabilitadas para: ${eventType}`
    });

  } catch (error) {
    console.error('Error deshabilitando notificaciones:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/advanced-notifications/enable/{eventType}:
 *   post:
 *     summary: Habilitar notificaciones para evento
 *     description: Habilita las notificaciones para un tipo de evento específico
 *     tags: [Advanced Notifications]
 *     parameters:
 *       - in: path
 *         name: eventType
 *         required: true
 *         schema:
 *           type: string
 *         description: Tipo de evento
 *     responses:
 *       200:
 *         description: Notificaciones habilitadas exitosamente
 */
router.post('/enable/:eventType', async (req, res) => {
  try {
    const { eventType } = req.params;

    if (!eventType) {
      return res.status(400).json({
        success: false,
        error: 'Tipo de evento requerido'
      });
    }

    advancedNotificationManager.enableBlockchainNotification(eventType);

    res.json({
      success: true,
      message: `Notificaciones habilitadas para: ${eventType}`
    });

  } catch (error) {
    console.error('Error habilitando notificaciones:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/advanced-notifications/templates:
 *   get:
 *     summary: Obtener templates de notificación
 *     description: Obtiene todos los templates de notificación disponibles
 *     tags: [Advanced Notifications]
 *     responses:
 *       200:
 *         description: Templates obtenidos exitosamente
 */
router.get('/templates', async (req, res) => {
  try {
    const templates = Array.from(advancedNotificationManager.notificationTemplates.entries());

    res.json({
      success: true,
      data: templates.map(([key, template]) => ({
        key,
        ...template
      }))
    });

  } catch (error) {
    console.error('Error obteniendo templates:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/advanced-notifications/blockchain-events:
 *   get:
 *     summary: Obtener eventos blockchain configurados
 *     description: Obtiene la lista de eventos blockchain configurados para notificaciones
 *     tags: [Advanced Notifications]
 *     responses:
 *       200:
 *         description: Eventos obtenidos exitosamente
 */
router.get('/blockchain-events', async (req, res) => {
  try {
    const events = Array.from(advancedNotificationManager.blockchainNotifications.entries());

    res.json({
      success: true,
      data: events.map(([eventType, config]) => ({
        eventType,
        enabled: config.enabled,
        webhook: config.webhook,
        template: config.template ? {
          title: config.template.title,
          type: config.template.type,
          priority: config.template.priority,
          category: config.template.category
        } : null
      }))
    });

  } catch (error) {
    console.error('Error obteniendo eventos blockchain:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/advanced-notifications/stats:
 *   get:
 *     summary: Obtener estadísticas de notificaciones avanzadas
 *     description: Obtiene estadísticas del sistema de notificaciones avanzado
 *     tags: [Advanced Notifications]
 *     responses:
 *       200:
 *         description: Estadísticas obtenidas exitosamente
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = advancedNotificationManager.getStats();

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
 * /api/advanced-notifications/cleanup:
 *   post:
 *     summary: Limpiar notificaciones antiguas
 *     description: Limpia notificaciones antiguas del sistema
 *     tags: [Advanced Notifications]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               maxAge:
 *                 type: number
 *                 default: 2592000000
 *                 description: Edad máxima en milisegundos (30 días por defecto)
 *     responses:
 *       200:
 *         description: Limpieza completada exitosamente
 */
router.post('/cleanup', async (req, res) => {
  try {
    const { maxAge = 30 * 24 * 60 * 60 * 1000 } = req.body; // 30 días por defecto

    const cleaned = advancedNotificationManager.cleanupOldNotifications(maxAge);

    res.json({
      success: true,
      data: {
        cleaned,
        maxAge
      }
    });

  } catch (error) {
    console.error('Error limpiando notificaciones:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/advanced-notifications/test:
 *   post:
 *     summary: Probar sistema de notificaciones
 *     description: Envía una notificación de prueba para verificar el sistema
 *     tags: [Advanced Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recipient
 *               - eventType
 *             properties:
 *               recipient:
 *                 type: string
 *                 description: Dirección del destinatario
 *               eventType:
 *                 type: string
 *                 description: Tipo de evento a simular
 *               eventData:
 *                 type: object
 *                 description: Datos del evento de prueba
 *     responses:
 *       200:
 *         description: Notificación de prueba enviada exitosamente
 */
router.post('/test', async (req, res) => {
  try {
    const { recipient, eventType, eventData = {} } = req.body;

    if (!recipient || !eventType) {
      return res.status(400).json({
        success: false,
        error: 'Destinatario y tipo de evento requeridos'
      });
    }

    // Simular evento blockchain
    const testEventData = {
      userAddress: recipient,
      ...eventData
    };

    const results = await advancedNotificationManager.processBlockchainEvent(
      eventType,
      testEventData,
      { isTest: true }
    );

    res.json({
      success: true,
      data: {
        eventType,
        recipient,
        notificationsSent: results.length,
        results
      }
    });

  } catch (error) {
    console.error('Error enviando notificación de prueba:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
