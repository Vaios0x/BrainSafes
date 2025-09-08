const express = require('express');
const analyticsManager = require('../services/analyticsManager');
const securityManager = require('../middleware/security');

const router = express.Router();

/**
 * @swagger
 * /api/analytics/metrics:
 *   get:
 *     summary: Obtener métricas del sistema
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: metricKeys
 *         schema:
 *           type: array
 *         description: Claves de métricas específicas a obtener
 *       - in: query
 *         name: since
 *         schema:
 *           type: string
 *         description: Fecha desde la cual obtener métricas (ISO string)
 */
router.get('/metrics', async (req, res) => {
  try {
    const { metricKeys, since } = req.query;
    
    const options = {};
    if (since) {
      options.since = new Date(since).getTime();
    }

    const metrics = analyticsManager.getMetrics(
      metricKeys ? metricKeys.split(',') : null,
      options
    );

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error obteniendo métricas',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/analytics/events:
 *   get:
 *     summary: Obtener eventos del sistema
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Tipo de evento a filtrar
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: ID de usuario para filtrar
 *       - in: query
 *         name: since
 *         schema:
 *           type: string
 *         description: Fecha desde la cual obtener eventos
 *       - in: query
 *         name: until
 *         schema:
 *           type: string
 *         description: Fecha hasta la cual obtener eventos
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Límite de eventos a retornar
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *         description: Offset para paginación
 */
router.get('/events', async (req, res) => {
  try {
    const { type, userId, since, until, limit, offset } = req.query;
    
    const filters = {};
    if (type) filters.type = type;
    if (userId) filters.userId = userId;
    if (since) filters.since = since;
    if (until) filters.until = until;

    const options = {};
    if (limit) options.limit = parseInt(limit);
    if (offset) options.offset = parseInt(offset);

    const events = analyticsManager.getEvents(filters, options);

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

/**
 * @swagger
 * /api/analytics/reports/{type}:
 *   post:
 *     summary: Generar reporte
 *     tags: [Analytics]
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *         description: Tipo de reporte
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               period:
 *                 type: string
 *               since:
 *                 type: string
 *               until:
 *                 type: string
 */
router.post('/reports/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { period, since, until } = req.body;

    const options = {};
    if (period) options.period = period;
    if (since) options.since = since;
    if (until) options.until = until;

    const report = analyticsManager.generateReport(type, options);

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error generando reporte',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/analytics/reports:
 *   get:
 *     summary: Listar tipos de reportes disponibles
 *     tags: [Analytics]
 */
router.get('/reports', async (req, res) => {
  try {
    const reportTypes = [
      {
        type: 'user_activity',
        name: 'Actividad de Usuarios',
        description: 'Reporte de actividad y engagement de usuarios',
        period: '24h'
      },
      {
        type: 'course_performance',
        name: 'Performance de Cursos',
        description: 'Reporte de rendimiento y completación de cursos',
        period: '7d'
      },
      {
        type: 'financial_summary',
        name: 'Resumen Financiero',
        description: 'Reporte de ingresos y métricas financieras',
        period: '30d'
      },
      {
        type: 'blockchain_metrics',
        name: 'Métricas Blockchain',
        description: 'Reporte de transacciones y gas usage',
        period: '24h'
      },
      {
        type: 'system_health',
        name: 'Salud del Sistema',
        description: 'Reporte de performance y uptime del sistema',
        period: '1h'
      }
    ];

    res.json({
      success: true,
      data: reportTypes
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error obteniendo tipos de reportes',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/analytics/track:
 *   post:
 *     summary: Registrar evento de analytics
 *     tags: [Analytics]
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
router.post('/track', async (req, res) => {
  try {
    const { eventType, eventData, metadata = {} } = req.body;

    if (!eventType || !eventData) {
      return res.status(400).json({
        error: 'eventType y eventData son requeridos'
      });
    }

    // Agregar metadatos del request
    const enrichedMetadata = {
      ...metadata,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: Date.now()
    };

    analyticsManager.trackEvent(eventType, eventData, enrichedMetadata);

    res.json({
      success: true,
      message: 'Evento registrado exitosamente'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error registrando evento',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/analytics/alerts:
 *   post:
 *     summary: Configurar alerta
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - alertId
 *               - metric
 *               - condition
 *               - threshold
 *               - message
 *             properties:
 *               alertId:
 *                 type: string
 *               metric:
 *                 type: string
 *               condition:
 *                 type: string
 *                 enum: [gt, gte, lt, lte, eq]
 *               threshold:
 *                 type: number
 *               message:
 *                 type: string
 *               channels:
 *                 type: array
 *                 items:
 *                   type: string
 *               enabled:
 *                 type: boolean
 *               cooldown:
 *                 type: number
 */
router.post('/alerts', async (req, res) => {
  try {
    const { alertId, ...config } = req.body;

    if (!alertId || !config.metric || !config.condition || !config.threshold || !config.message) {
      return res.status(400).json({
        error: 'alertId, metric, condition, threshold y message son requeridos'
      });
    }

    analyticsManager.configureAlert(alertId, config);

    res.json({
      success: true,
      message: 'Alerta configurada exitosamente'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error configurando alerta',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/analytics/alerts:
 *   get:
 *     summary: Listar alertas configuradas
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 */
router.get('/alerts', async (req, res) => {
  try {
    const stats = analyticsManager.getStats();
    
    res.json({
      success: true,
      data: {
        totalAlerts: stats.totalAlerts,
        activeAlerts: stats.activeAlerts
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error obteniendo alertas',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/analytics/dashboard:
 *   get:
 *     summary: Obtener dashboard principal
 *     tags: [Analytics]
 */
router.get('/dashboard', async (req, res) => {
  try {
    // Generar reportes para el dashboard
    const userActivity = analyticsManager.generateReport('user_activity', { period: '24h' });
    const coursePerformance = analyticsManager.generateReport('course_performance', { period: '7d' });
    const financialSummary = analyticsManager.generateReport('financial_summary', { period: '30d' });
    const systemHealth = analyticsManager.generateReport('system_health', { period: '1h' });

    const dashboard = {
      timestamp: Date.now(),
      userActivity: userActivity.data,
      coursePerformance: coursePerformance.data,
      financialSummary: financialSummary.data,
      systemHealth: systemHealth.data,
      stats: analyticsManager.getStats()
    };

    res.json({
      success: true,
      data: dashboard
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error generando dashboard',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/analytics/stats:
 *   get:
 *     summary: Obtener estadísticas del sistema de analytics
 *     tags: [Analytics]
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = analyticsManager.getStats();
    
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

module.exports = router;
