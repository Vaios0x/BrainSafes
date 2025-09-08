const express = require('express');
const advancedAnalyticsManager = require('../services/advancedAnalyticsManager');
const advancedSecurityManager = require('../middleware/advancedSecurity');

const router = express.Router();

/**
 * @swagger
 * /api/advanced-analytics/dashboard:
 *   get:
 *     summary: Obtener dashboard avanzado con métricas en tiempo real
 *     tags: [Advanced Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard avanzado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     timestamp:
 *                       type: number
 *                     performance:
 *                       type: object
 *                     blockchain:
 *                       type: object
 *                     ai:
 *                       type: object
 *                     mlPredictions:
 *                       type: object
 */
router.get('/dashboard', async (req, res) => {
  try {
    const dashboard = advancedAnalyticsManager.getAdvancedDashboard();
    
    res.json({
      success: true,
      data: dashboard
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error obteniendo dashboard avanzado',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/advanced-analytics/performance:
 *   get:
 *     summary: Obtener métricas de performance avanzadas
 *     tags: [Advanced Analytics]
 *     parameters:
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [1h, 24h, 7d, 30d]
 *         description: Período de tiempo para las métricas
 */
router.get('/performance', async (req, res) => {
  try {
    const { timeframe = '24h' } = req.query;
    
    const performanceMetrics = {
      responseTime: {
        p50: advancedAnalyticsManager.performanceMetrics.get('response_time_p50').value,
        p95: advancedAnalyticsManager.performanceMetrics.get('response_time_p95').value,
        p99: advancedAnalyticsManager.performanceMetrics.get('response_time_p99').value
      },
      throughput: advancedAnalyticsManager.performanceMetrics.get('throughput_rps').value,
      errorRate: advancedAnalyticsManager.performanceMetrics.get('error_rate').value,
      availability: advancedAnalyticsManager.performanceMetrics.get('availability').value,
      timeframe
    };
    
    res.json({
      success: true,
      data: performanceMetrics
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error obteniendo métricas de performance',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/advanced-analytics/blockchain:
 *   get:
 *     summary: Obtener métricas de blockchain avanzadas
 *     tags: [Advanced Analytics]
 */
router.get('/blockchain', async (req, res) => {
  try {
    const blockchainMetrics = {
      gasUsage: {
        average: advancedAnalyticsManager.blockchainMetrics.gasUsage.get('average').value,
        peak: advancedAnalyticsManager.blockchainMetrics.gasUsage.get('peak').value,
        efficiency: advancedAnalyticsManager.blockchainMetrics.gasUsage.get('efficiency').value
      },
      transactionVolume: {
        hourly: advancedAnalyticsManager.blockchainMetrics.transactionVolume.get('hourly').value,
        daily: advancedAnalyticsManager.blockchainMetrics.transactionVolume.get('daily').value,
        weekly: advancedAnalyticsManager.blockchainMetrics.transactionVolume.get('weekly').value
      },
      arbitrum: {
        l1GasPrice: advancedAnalyticsManager.blockchainMetrics.arbitrumMetrics.get('l1_gas_price').value,
        l2GasPrice: advancedAnalyticsManager.blockchainMetrics.arbitrumMetrics.get('l2_gas_price').value,
        batchSize: advancedAnalyticsManager.blockchainMetrics.arbitrumMetrics.get('batch_size').value,
        stateSize: advancedAnalyticsManager.blockchainMetrics.arbitrumMetrics.get('state_size').value,
        challengePeriod: advancedAnalyticsManager.blockchainMetrics.arbitrumMetrics.get('challenge_period').value
      }
    };
    
    res.json({
      success: true,
      data: blockchainMetrics
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error obteniendo métricas de blockchain',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/advanced-analytics/ai:
 *   get:
 *     summary: Obtener métricas de IA avanzadas
 *     tags: [Advanced Analytics]
 */
router.get('/ai', async (req, res) => {
  try {
    const aiMetrics = {
      predictionAccuracy: {
        overall: advancedAnalyticsManager.aiMetrics.predictionAccuracy.get('overall').value,
        courseRecommendations: advancedAnalyticsManager.aiMetrics.predictionAccuracy.get('course_recommendations').value,
        fraudDetection: advancedAnalyticsManager.aiMetrics.predictionAccuracy.get('fraud_detection').value,
        learningPaths: advancedAnalyticsManager.aiMetrics.predictionAccuracy.get('learning_paths').value
      },
      responseTimes: {
        average: advancedAnalyticsManager.aiMetrics.responseTimes.get('average').value,
        p95: advancedAnalyticsManager.aiMetrics.responseTimes.get('p95').value,
        p99: advancedAnalyticsManager.aiMetrics.responseTimes.get('p99').value
      },
      fraudDetections: advancedAnalyticsManager.aiMetrics.fraudDetections.size,
      userEngagement: advancedAnalyticsManager.aiMetrics.userEngagement.size,
      learningPaths: advancedAnalyticsManager.aiMetrics.learningPaths.size
    };
    
    res.json({
      success: true,
      data: aiMetrics
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error obteniendo métricas de IA',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/advanced-analytics/ml-predictions:
 *   get:
 *     summary: Obtener predicciones de machine learning
 *     tags: [Advanced Analytics]
 */
router.get('/ml-predictions', async (req, res) => {
  try {
    const predictions = Object.fromEntries(advancedAnalyticsManager.mlPredictions);
    
    res.json({
      success: true,
      data: predictions
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error obteniendo predicciones ML',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/advanced-analytics/anomalies:
 *   get:
 *     summary: Obtener anomalías detectadas
 *     tags: [Advanced Analytics]
 *     parameters:
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *           enum: [low, medium, high, critical]
 *         description: Filtrar por severidad
 */
router.get('/anomalies', async (req, res) => {
  try {
    const { severity } = req.query;
    
    // Obtener anomalías del sistema
    const anomalies = advancedAnalyticsManager.getRecentAlerts();
    
    // Filtrar por severidad si se especifica
    const filteredAnomalies = severity ? 
      anomalies.filter(a => a.severity === severity) : 
      anomalies;
    
    res.json({
      success: true,
      data: {
        anomalies: filteredAnomalies,
        total: anomalies.length,
        filtered: filteredAnomalies.length
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error obteniendo anomalías',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/advanced-analytics/real-time:
 *   get:
 *     summary: Obtener métricas en tiempo real
 *     tags: [Advanced Analytics]
 */
router.get('/real-time', async (req, res) => {
  try {
    const realTimeData = {
      timestamp: Date.now(),
      activeUsers: advancedAnalyticsManager.realTimeMetrics.size,
      performance: {
        currentResponseTime: advancedAnalyticsManager.performanceMetrics.get('response_time_p50').value,
        currentThroughput: advancedAnalyticsManager.performanceMetrics.get('throughput_rps').value,
        currentErrorRate: advancedAnalyticsManager.performanceMetrics.get('error_rate').value
      },
      blockchain: {
        currentGasPrice: advancedAnalyticsManager.blockchainMetrics.arbitrumMetrics.get('l2_gas_price').value,
        currentTransactions: advancedAnalyticsManager.blockchainMetrics.transactionVolume.get('hourly').value
      },
      ai: {
        currentAccuracy: advancedAnalyticsManager.aiMetrics.predictionAccuracy.get('overall').value,
        currentResponseTime: advancedAnalyticsManager.aiMetrics.responseTimes.get('average').value
      }
    };
    
    res.json({
      success: true,
      data: realTimeData
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error obteniendo métricas en tiempo real',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/advanced-analytics/events:
 *   post:
 *     summary: Registrar evento avanzado
 *     tags: [Advanced Analytics]
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
router.post('/events', async (req, res) => {
  try {
    const { eventType, eventData, metadata = {} } = req.body;
    
    if (!eventType || !eventData) {
      return res.status(400).json({
        error: 'eventType y eventData son requeridos'
      });
    }
    
    // Agregar información del cliente
    const clientInfo = req.securityInfo?.clientInfo;
    const enrichedMetadata = {
      ...metadata,
      ip: clientInfo?.ip,
      userAgent: clientInfo?.userAgent,
      userId: req.user?.id,
      sessionId: req.session?.id
    };
    
    // Registrar evento
    advancedAnalyticsManager.trackAdvancedEvent(eventType, eventData, enrichedMetadata);
    
    res.json({
      success: true,
      message: 'Evento registrado correctamente'
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
 * /api/advanced-analytics/alerts:
 *   get:
 *     summary: Obtener alertas del sistema
 *     tags: [Advanced Analytics]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, resolved]
 *         description: Estado de las alertas
 */
router.get('/alerts', async (req, res) => {
  try {
    const { status = 'active' } = req.query;
    
    // Obtener alertas del sistema
    const alerts = advancedAnalyticsManager.getRecentAlerts();
    
    // Filtrar por estado
    const filteredAlerts = status === 'active' ? 
      alerts.filter(a => a.status === 'active') : 
      alerts.filter(a => a.status === 'resolved');
    
    res.json({
      success: true,
      data: {
        alerts: filteredAlerts,
        total: alerts.length,
        active: alerts.filter(a => a.status === 'active').length,
        resolved: alerts.filter(a => a.status === 'resolved').length
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
 * /api/advanced-analytics/security:
 *   get:
 *     summary: Obtener métricas de seguridad
 *     tags: [Advanced Analytics]
 */
router.get('/security', async (req, res) => {
  try {
    const securityStats = advancedSecurityManager.getSecurityStats();
    
    res.json({
      success: true,
      data: securityStats
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error obteniendo métricas de seguridad',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/advanced-analytics/trends:
 *   get:
 *     summary: Obtener tendencias de métricas
 *     tags: [Advanced Analytics]
 *     parameters:
 *       - in: query
 *         name: metric
 *         schema:
 *           type: string
 *         description: Métrica específica para analizar
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [1h, 24h, 7d, 30d]
 *         description: Período de análisis
 */
router.get('/trends', async (req, res) => {
  try {
    const { metric, period = '24h' } = req.query;
    
    // Generar datos de tendencia simulados
    const trends = {
      performance: {
        responseTime: this.generateTrendData(100, 200, 24),
        throughput: this.generateTrendData(50, 150, 24),
        errorRate: this.generateTrendData(0, 5, 24)
      },
      blockchain: {
        gasUsage: this.generateTrendData(50000, 200000, 24),
        transactionVolume: this.generateTrendData(100, 1000, 24),
        gasPrice: this.generateTrendData(1000000000, 50000000000, 24)
      },
      ai: {
        accuracy: this.generateTrendData(70, 95, 24),
        responseTime: this.generateTrendData(100, 500, 24)
      }
    };
    
    const data = metric ? trends[metric.split('.')[0]]?.[metric.split('.')[1]] : trends;
    
    res.json({
      success: true,
      data: {
        trends: data,
        period,
        metric: metric || 'all'
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error obteniendo tendencias',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/advanced-analytics/export:
 *   post:
 *     summary: Exportar datos de analytics
 *     tags: [Advanced Analytics]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               metrics:
 *                 type: array
 *                 items:
 *                   type: string
 *               format:
 *                 type: string
 *                 enum: [json, csv, excel]
 *               timeframe:
 *                 type: string
 */
router.post('/export', async (req, res) => {
  try {
    const { metrics = [], format = 'json', timeframe = '24h' } = req.body;
    
    // Generar datos de exportación
    const exportData = {
      timestamp: Date.now(),
      timeframe,
      format,
      data: {}
    };
    
    // Incluir métricas solicitadas
    if (metrics.includes('performance') || metrics.length === 0) {
      exportData.data.performance = {
        responseTime: advancedAnalyticsManager.performanceMetrics.get('response_time_p50').value,
        throughput: advancedAnalyticsManager.performanceMetrics.get('throughput_rps').value,
        errorRate: advancedAnalyticsManager.performanceMetrics.get('error_rate').value
      };
    }
    
    if (metrics.includes('blockchain') || metrics.length === 0) {
      exportData.data.blockchain = {
        gasUsage: advancedAnalyticsManager.blockchainMetrics.gasUsage.get('average').value,
        transactionVolume: advancedAnalyticsManager.blockchainMetrics.transactionVolume.get('hourly').value
      };
    }
    
    if (metrics.includes('ai') || metrics.length === 0) {
      exportData.data.ai = {
        accuracy: advancedAnalyticsManager.aiMetrics.predictionAccuracy.get('overall').value,
        responseTime: advancedAnalyticsManager.aiMetrics.responseTimes.get('average').value
      };
    }
    
    // Generar archivo según formato
    let fileContent, contentType, filename;
    
    switch (format) {
      case 'csv':
        fileContent = this.convertToCSV(exportData.data);
        contentType = 'text/csv';
        filename = `analytics_${Date.now()}.csv`;
        break;
      case 'excel':
        fileContent = this.convertToExcel(exportData.data);
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        filename = `analytics_${Date.now()}.xlsx`;
        break;
      default:
        fileContent = JSON.stringify(exportData, null, 2);
        contentType = 'application/json';
        filename = `analytics_${Date.now()}.json`;
    }
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(fileContent);
    
  } catch (error) {
    res.status(500).json({
      error: 'Error exportando datos',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/advanced-analytics/stats:
 *   get:
 *     summary: Obtener estadísticas del sistema de analytics
 *     tags: [Advanced Analytics]
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = advancedAnalyticsManager.getAdvancedStats();
    
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
 * Generar datos de tendencia simulados
 */
generateTrendData(min, max, points) {
  const data = [];
  const now = Date.now();
  
  for (let i = points - 1; i >= 0; i--) {
    const timestamp = now - (i * 60 * 60 * 1000); // Cada hora
    const value = Math.random() * (max - min) + min;
    data.push({ timestamp, value: Math.round(value * 100) / 100 });
  }
  
  return data;
}

/**
 * Convertir datos a CSV
 */
convertToCSV(data) {
  const headers = [];
  const rows = [];
  
  // Extraer headers
  for (const [category, metrics] of Object.entries(data)) {
    for (const [metric, value] of Object.entries(metrics)) {
      headers.push(`${category}_${metric}`);
    }
  }
  
  // Extraer valores
  const values = [];
  for (const [category, metrics] of Object.entries(data)) {
    for (const [metric, value] of Object.entries(metrics)) {
      values.push(value);
    }
  }
  
  return [headers.join(','), values.join(',')].join('\n');
}

/**
 * Convertir datos a Excel (simulado)
 */
convertToExcel(data) {
  // En una implementación real, usarías una librería como xlsx
  // Por ahora, retornamos JSON como placeholder
  return JSON.stringify(data);
}

module.exports = router;
