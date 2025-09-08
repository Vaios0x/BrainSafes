const winston = require('winston');
const crypto = require('crypto');
const { ethers } = require('ethers');
const mongoose = require('mongoose');

/**
 * @title Advanced Analytics Manager
 * @dev Sistema avanzado de analytics con ML, métricas en tiempo real y dashboards interactivos
 * @custom:security-contact security@brainsafes.com
 */
class AdvancedAnalyticsManager {
  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/advanced-analytics.log' })
      ],
    });

    // Almacenamiento de métricas avanzadas
    this.realTimeMetrics = new Map();
    this.historicalData = new Map();
    this.mlPredictions = new Map();
    this.anomalyDetectors = new Map();
    this.performanceMetrics = new Map();
    
    // Configuración de ML
    this.mlConfig = {
      predictionWindow: 24 * 60 * 60 * 1000, // 24 horas
      anomalyThreshold: 2.5, // Desviación estándar
      trainingDataSize: 1000,
      updateInterval: 5 * 60 * 1000 // 5 minutos
    };

    // Métricas de blockchain específicas
    this.blockchainMetrics = {
      gasUsage: new Map(),
      transactionVolume: new Map(),
      contractInteractions: new Map(),
      networkHealth: new Map(),
      arbitrumMetrics: new Map()
    };

    // Métricas de IA
    this.aiMetrics = {
      predictionAccuracy: new Map(),
      responseTimes: new Map(),
      fraudDetections: new Map(),
      userEngagement: new Map(),
      learningPaths: new Map()
    };

    // Inicializar
    this.initializeAdvancedMetrics();
    this.setupMLModels();
    this.startRealTimeProcessing();
  }

  /**
   * Inicializar métricas avanzadas
   */
  initializeAdvancedMetrics() {
    // Métricas de performance avanzadas
    this.performanceMetrics.set('response_time_p50', { value: 0, samples: [] });
    this.performanceMetrics.set('response_time_p95', { value: 0, samples: [] });
    this.performanceMetrics.set('response_time_p99', { value: 0, samples: [] });
    this.performanceMetrics.set('throughput_rps', { value: 0, samples: [] });
    this.performanceMetrics.set('error_rate', { value: 0, samples: [] });
    this.performanceMetrics.set('availability', { value: 100, samples: [] });

    // Métricas de blockchain
    this.blockchainMetrics.gasUsage.set('average', { value: 0, samples: [] });
    this.blockchainMetrics.gasUsage.set('peak', { value: 0, samples: [] });
    this.blockchainMetrics.gasUsage.set('efficiency', { value: 0, samples: [] });
    
    this.blockchainMetrics.transactionVolume.set('hourly', { value: 0, samples: [] });
    this.blockchainMetrics.transactionVolume.set('daily', { value: 0, samples: [] });
    this.blockchainMetrics.transactionVolume.set('weekly', { value: 0, samples: [] });

    // Métricas de Arbitrum específicas
    this.blockchainMetrics.arbitrumMetrics.set('l1_gas_price', { value: 0, samples: [] });
    this.blockchainMetrics.arbitrumMetrics.set('l2_gas_price', { value: 0, samples: [] });
    this.blockchainMetrics.arbitrumMetrics.set('batch_size', { value: 0, samples: [] });
    this.blockchainMetrics.arbitrumMetrics.set('state_size', { value: 0, samples: [] });
    this.blockchainMetrics.arbitrumMetrics.set('challenge_period', { value: 0, samples: [] });

    // Métricas de IA
    this.aiMetrics.predictionAccuracy.set('overall', { value: 0, samples: [] });
    this.aiMetrics.predictionAccuracy.set('course_recommendations', { value: 0, samples: [] });
    this.aiMetrics.predictionAccuracy.set('fraud_detection', { value: 0, samples: [] });
    this.aiMetrics.predictionAccuracy.set('learning_paths', { value: 0, samples: [] });

    this.aiMetrics.responseTimes.set('average', { value: 0, samples: [] });
    this.aiMetrics.responseTimes.set('p95', { value: 0, samples: [] });
    this.aiMetrics.responseTimes.set('p99', { value: 0, samples: [] });

    this.logger.info('Métricas avanzadas inicializadas');
  }

  /**
   * Configurar modelos de ML
   */
  setupMLModels() {
    // Modelo de predicción de carga
    this.anomalyDetectors.set('load_prediction', {
      type: 'time_series',
      algorithm: 'exponential_smoothing',
      parameters: { alpha: 0.3, beta: 0.1 },
      lastUpdate: Date.now(),
      accuracy: 0.85
    });

    // Modelo de detección de anomalías
    this.anomalyDetectors.set('anomaly_detection', {
      type: 'statistical',
      algorithm: 'z_score',
      parameters: { threshold: 2.5, window: 100 },
      lastUpdate: Date.now(),
      accuracy: 0.92
    });

    // Modelo de predicción de gas
    this.anomalyDetectors.set('gas_prediction', {
      type: 'regression',
      algorithm: 'linear_regression',
      parameters: { features: ['time', 'volume', 'complexity'] },
      lastUpdate: Date.now(),
      accuracy: 0.78
    });

    this.logger.info('Modelos de ML configurados');
  }

  /**
   * Iniciar procesamiento en tiempo real
   */
  startRealTimeProcessing() {
    // Actualizar métricas cada 30 segundos
    setInterval(() => {
      this.updateRealTimeMetrics();
    }, 30000);

    // Entrenar modelos ML cada 5 minutos
    setInterval(() => {
      this.trainMLModels();
    }, this.mlConfig.updateInterval);

    // Detectar anomalías cada minuto
    setInterval(() => {
      this.detectAnomalies();
    }, 60000);

    // Limpiar datos antiguos cada hora
    setInterval(() => {
      this.cleanupOldData();
    }, 60 * 60 * 1000);

    this.logger.info('Procesamiento en tiempo real iniciado');
  }

  /**
   * Registrar evento avanzado
   * @param {string} eventType - Tipo de evento
   * @param {Object} eventData - Datos del evento
   * @param {Object} metadata - Metadatos adicionales
   */
  trackAdvancedEvent(eventType, eventData, metadata = {}) {
    try {
      const event = {
        id: crypto.randomUUID(),
        type: eventType,
        data: eventData,
        metadata: {
          timestamp: Date.now(),
          userAgent: metadata.userAgent,
          ip: metadata.ip,
          userId: metadata.userId,
          sessionId: metadata.sessionId,
          blockchain: metadata.blockchain,
          gasUsed: metadata.gasUsed,
          gasPrice: metadata.gasPrice,
          contractAddress: metadata.contractAddress,
          functionName: metadata.functionName,
          ...metadata
        }
      };

      // Procesar evento en tiempo real
      this.processRealTimeEvent(event);
      
      // Almacenar para análisis histórico
      this.storeHistoricalEvent(event);
      
      // Actualizar métricas específicas
      this.updateSpecificMetrics(event);

      this.logger.debug(`Evento avanzado registrado: ${eventType}`, { eventId: event.id });

    } catch (error) {
      this.logger.error('Error registrando evento avanzado:', error.message);
    }
  }

  /**
   * Procesar evento en tiempo real
   * @param {Object} event - Evento a procesar
   */
  processRealTimeEvent(event) {
    const now = Date.now();
    const eventType = event.type;

    // Actualizar métricas de performance
    if (eventType === 'api.request') {
      this.updatePerformanceMetrics(event.data.responseTime || 0);
    }

    // Actualizar métricas de blockchain
    if (eventType === 'blockchain.transaction') {
      this.updateBlockchainMetrics(event);
    }

    // Actualizar métricas de IA
    if (eventType.startsWith('ai.')) {
      this.updateAIMetrics(event);
    }

    // Detectar patrones en tiempo real
    this.detectRealTimePatterns(event);
  }

  /**
   * Actualizar métricas de performance
   * @param {number} responseTime - Tiempo de respuesta
   */
  updatePerformanceMetrics(responseTime) {
    // Actualizar percentiles
    ['response_time_p50', 'response_time_p95', 'response_time_p99'].forEach(metric => {
      const data = this.performanceMetrics.get(metric);
      data.samples.push(responseTime);
      
      // Mantener solo los últimos 1000 samples
      if (data.samples.length > 1000) {
        data.samples = data.samples.slice(-1000);
      }
      
      // Calcular percentil
      data.samples.sort((a, b) => a - b);
      const percentile = metric.includes('p50') ? 50 : metric.includes('p95') ? 95 : 99;
      const index = Math.ceil((percentile / 100) * data.samples.length) - 1;
      data.value = data.samples[index] || 0;
    });

    // Actualizar throughput
    const throughputData = this.performanceMetrics.get('throughput_rps');
    throughputData.samples.push(1); // Incrementar contador
    if (throughputData.samples.length > 60) { // Último minuto
      throughputData.samples = throughputData.samples.slice(-60);
    }
    throughputData.value = throughputData.samples.reduce((a, b) => a + b, 0) / 60;
  }

  /**
   * Actualizar métricas de blockchain
   * @param {Object} event - Evento de blockchain
   */
  updateBlockchainMetrics(event) {
    const gasUsed = event.metadata.gasUsed || 0;
    const gasPrice = event.metadata.gasPrice || 0;

    // Actualizar métricas de gas
    const avgGasData = this.blockchainMetrics.gasUsage.get('average');
    avgGasData.samples.push(gasUsed);
    if (avgGasData.samples.length > 1000) {
      avgGasData.samples = avgGasData.samples.slice(-1000);
    }
    avgGasData.value = avgGasData.samples.reduce((a, b) => a + b, 0) / avgGasData.samples.length;

    // Actualizar peak de gas
    const peakGasData = this.blockchainMetrics.gasUsage.get('peak');
    if (gasUsed > peakGasData.value) {
      peakGasData.value = gasUsed;
    }

    // Actualizar eficiencia de gas
    const efficiencyData = this.blockchainMetrics.gasUsage.get('efficiency');
    const expectedGas = this.calculateExpectedGas(event.metadata.functionName);
    if (expectedGas > 0) {
      const efficiency = (expectedGas - gasUsed) / expectedGas * 100;
      efficiencyData.samples.push(efficiency);
      if (efficiencyData.samples.length > 100) {
        efficiencyData.samples = efficiencyData.samples.slice(-100);
      }
      efficiencyData.value = efficiencyData.samples.reduce((a, b) => a + b, 0) / efficiencyData.samples.length;
    }

    // Actualizar volumen de transacciones
    const hourlyVolume = this.blockchainMetrics.transactionVolume.get('hourly');
    hourlyVolume.samples.push(1);
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    hourlyVolume.samples = hourlyVolume.samples.filter(timestamp => timestamp > oneHourAgo);
    hourlyVolume.value = hourlyVolume.samples.length;
  }

  /**
   * Actualizar métricas de IA
   * @param {Object} event - Evento de IA
   */
  updateAIMetrics(event) {
    const eventType = event.type;

    if (eventType === 'ai.prediction') {
      const accuracy = event.data.accuracy || 0;
      const predictionType = event.data.type || 'overall';
      
      const accuracyData = this.aiMetrics.predictionAccuracy.get(predictionType);
      accuracyData.samples.push(accuracy);
      if (accuracyData.samples.length > 100) {
        accuracyData.samples = accuracyData.samples.slice(-100);
      }
      accuracyData.value = accuracyData.samples.reduce((a, b) => a + b, 0) / accuracyData.samples.length;
    }

    if (eventType === 'ai.response') {
      const responseTime = event.data.responseTime || 0;
      
      ['average', 'p95', 'p99'].forEach(metric => {
        const data = this.aiMetrics.responseTimes.get(metric);
        data.samples.push(responseTime);
        
        if (data.samples.length > 100) {
          data.samples = data.samples.slice(-100);
        }
        
        data.samples.sort((a, b) => a - b);
        const percentile = metric === 'average' ? 50 : metric === 'p95' ? 95 : 99;
        const index = Math.ceil((percentile / 100) * data.samples.length) - 1;
        data.value = data.samples[index] || 0;
      });
    }
  }

  /**
   * Detectar patrones en tiempo real
   * @param {Object} event - Evento a analizar
   */
  detectRealTimePatterns(event) {
    // Detectar patrones de uso sospechoso
    this.detectSuspiciousPatterns(event);
    
    // Detectar patrones de performance
    this.detectPerformancePatterns(event);
    
    // Detectar patrones de blockchain
    this.detectBlockchainPatterns(event);
  }

  /**
   * Detectar patrones sospechosos
   * @param {Object} event - Evento a analizar
   */
  detectSuspiciousPatterns(event) {
    const userId = event.metadata.userId;
    const ip = event.metadata.ip;
    
    if (!userId || !ip) return;

    // Verificar frecuencia de eventos por usuario/IP
    const userKey = `user_${userId}`;
    const ipKey = `ip_${ip}`;
    
    const userEvents = this.realTimeMetrics.get(userKey) || [];
    const ipEvents = this.realTimeMetrics.get(ipKey) || [];
    
    userEvents.push(event);
    ipEvents.push(event);
    
    // Mantener solo eventos de la última hora
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const filteredUserEvents = userEvents.filter(e => e.metadata.timestamp > oneHourAgo);
    const filteredIpEvents = ipEvents.filter(e => e.metadata.timestamp > oneHourAgo);
    
    this.realTimeMetrics.set(userKey, filteredUserEvents);
    this.realTimeMetrics.set(ipKey, filteredIpEvents);
    
    // Detectar anomalías
    if (filteredUserEvents.length > 100) { // Más de 100 eventos por hora
      this.triggerAlert('high_user_activity', {
        userId,
        eventCount: filteredUserEvents.length,
        timeframe: '1h'
      });
    }
    
    if (filteredIpEvents.length > 500) { // Más de 500 eventos por IP por hora
      this.triggerAlert('high_ip_activity', {
        ip,
        eventCount: filteredIpEvents.length,
        timeframe: '1h'
      });
    }
  }

  /**
   * Detectar patrones de performance
   * @param {Object} event - Evento a analizar
   */
  detectPerformancePatterns(event) {
    if (event.type === 'api.request') {
      const responseTime = event.data.responseTime || 0;
      
      // Detectar latencia alta
      if (responseTime > 5000) { // Más de 5 segundos
        this.triggerAlert('high_latency', {
          endpoint: event.metadata.path,
          responseTime,
          threshold: 5000
        });
      }
      
      // Detectar errores
      if (event.data.statusCode >= 500) {
        this.triggerAlert('server_error', {
          endpoint: event.metadata.path,
          statusCode: event.data.statusCode,
          error: event.data.error
        });
      }
    }
  }

  /**
   * Detectar patrones de blockchain
   * @param {Object} event - Evento a analizar
   */
  detectBlockchainPatterns(event) {
    if (event.type === 'blockchain.transaction') {
      const gasUsed = event.metadata.gasUsed || 0;
      const gasPrice = event.metadata.gasPrice || 0;
      
      // Detectar uso de gas excesivo
      if (gasUsed > 1000000) { // Más de 1M gas
        this.triggerAlert('high_gas_usage', {
          contractAddress: event.metadata.contractAddress,
          functionName: event.metadata.functionName,
          gasUsed,
          threshold: 1000000
        });
      }
      
      // Detectar gas price alto
      if (gasPrice > 100000000000) { // Más de 100 gwei
        this.triggerAlert('high_gas_price', {
          gasPrice,
          threshold: 100000000000
        });
      }
    }
  }

  /**
   * Entrenar modelos de ML
   */
  trainMLModels() {
    try {
      // Entrenar modelo de predicción de carga
      this.trainLoadPredictionModel();
      
      // Entrenar modelo de detección de anomalías
      this.trainAnomalyDetectionModel();
      
      // Entrenar modelo de predicción de gas
      this.trainGasPredictionModel();
      
      this.logger.info('Modelos de ML entrenados');
    } catch (error) {
      this.logger.error('Error entrenando modelos ML:', error.message);
    }
  }

  /**
   * Entrenar modelo de predicción de carga
   */
  trainLoadPredictionModel() {
    const model = this.anomalyDetectors.get('load_prediction');
    const throughputData = this.performanceMetrics.get('throughput_rps');
    
    if (throughputData.samples.length < 10) return;
    
    // Algoritmo de suavizado exponencial
    const alpha = model.parameters.alpha;
    const beta = model.parameters.beta;
    
    let level = throughputData.samples[0];
    let trend = 0;
    
    for (let i = 1; i < throughputData.samples.length; i++) {
      const newLevel = alpha * throughputData.samples[i] + (1 - alpha) * (level + trend);
      trend = beta * (newLevel - level) + (1 - beta) * trend;
      level = newLevel;
    }
    
    // Hacer predicción
    const prediction = level + trend;
    this.mlPredictions.set('load_prediction', {
      value: prediction,
      confidence: 0.85,
      timestamp: Date.now()
    });
    
    model.lastUpdate = Date.now();
  }

  /**
   * Entrenar modelo de detección de anomalías
   */
  trainAnomalyDetectionModel() {
    const model = this.anomalyDetectors.get('anomaly_detection');
    const responseTimeData = this.performanceMetrics.get('response_time_p95');
    
    if (responseTimeData.samples.length < 20) return;
    
    // Calcular media y desviación estándar
    const mean = responseTimeData.samples.reduce((a, b) => a + b, 0) / responseTimeData.samples.length;
    const variance = responseTimeData.samples.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / responseTimeData.samples.length;
    const stdDev = Math.sqrt(variance);
    
    // Detectar anomalías usando Z-score
    const threshold = model.parameters.threshold;
    const anomalies = responseTimeData.samples.filter(val => Math.abs((val - mean) / stdDev) > threshold);
    
    if (anomalies.length > 0) {
      this.triggerAlert('performance_anomaly', {
        anomalies: anomalies.length,
        mean,
        stdDev,
        threshold
      });
    }
    
    model.lastUpdate = Date.now();
  }

  /**
   * Entrenar modelo de predicción de gas
   */
  trainGasPredictionModel() {
    const model = this.anomalyDetectors.get('gas_prediction');
    const gasData = this.blockchainMetrics.gasUsage.get('average');
    
    if (gasData.samples.length < 50) return;
    
    // Regresión lineal simple basada en tiempo
    const n = gasData.samples.length;
    const x = Array.from({length: n}, (_, i) => i);
    const y = gasData.samples;
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
    const sumXX = x.reduce((acc, xi) => acc + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Predicción para el próximo período
    const prediction = slope * n + intercept;
    
    this.mlPredictions.set('gas_prediction', {
      value: Math.max(0, prediction),
      confidence: 0.78,
      timestamp: Date.now()
    });
    
    model.lastUpdate = Date.now();
  }

  /**
   * Detectar anomalías
   */
  detectAnomalies() {
    // Detectar anomalías de performance
    this.detectPerformanceAnomalies();
    
    // Detectar anomalías de blockchain
    this.detectBlockchainAnomalies();
    
    // Detectar anomalías de IA
    this.detectAIAnomalies();
  }

  /**
   * Detectar anomalías de performance
   */
  detectPerformanceAnomalies() {
    const errorRate = this.performanceMetrics.get('error_rate');
    const availability = this.performanceMetrics.get('availability');
    
    if (errorRate.value > 5) { // Más del 5% de errores
      this.triggerAlert('high_error_rate', {
        errorRate: errorRate.value,
        threshold: 5
      });
    }
    
    if (availability.value < 95) { // Menos del 95% de disponibilidad
      this.triggerAlert('low_availability', {
        availability: availability.value,
        threshold: 95
      });
    }
  }

  /**
   * Detectar anomalías de blockchain
   */
  detectBlockchainAnomalies() {
    const gasEfficiency = this.blockchainMetrics.gasUsage.get('efficiency');
    const transactionVolume = this.blockchainMetrics.transactionVolume.get('hourly');
    
    if (gasEfficiency.value < -20) { // Eficiencia de gas muy baja
      this.triggerAlert('low_gas_efficiency', {
        efficiency: gasEfficiency.value,
        threshold: -20
      });
    }
    
    if (transactionVolume.value > 1000) { // Alto volumen de transacciones
      this.triggerAlert('high_transaction_volume', {
        volume: transactionVolume.value,
        threshold: 1000
      });
    }
  }

  /**
   * Detectar anomalías de IA
   */
  detectAIAnomalies() {
    const accuracy = this.aiMetrics.predictionAccuracy.get('overall');
    const responseTime = this.aiMetrics.responseTimes.get('average');
    
    if (accuracy.value < 70) { // Precisión baja
      this.triggerAlert('low_ai_accuracy', {
        accuracy: accuracy.value,
        threshold: 70
      });
    }
    
    if (responseTime.value > 3000) { // Tiempo de respuesta alto
      this.triggerAlert('high_ai_response_time', {
        responseTime: responseTime.value,
        threshold: 3000
      });
    }
  }

  /**
   * Disparar alerta
   * @param {string} alertType - Tipo de alerta
   * @param {Object} data - Datos de la alerta
   */
  triggerAlert(alertType, data) {
    const alert = {
      id: crypto.randomUUID(),
      type: alertType,
      data,
      timestamp: Date.now(),
      severity: this.getAlertSeverity(alertType)
    };
    
    this.logger.warn(`Alerta disparada: ${alertType}`, alert);
    
    // Aquí enviarías la alerta a través del NotificationManager
    // Por ahora solo loggeamos
  }

  /**
   * Obtener severidad de alerta
   * @param {string} alertType - Tipo de alerta
   * @returns {string} Severidad
   */
  getAlertSeverity(alertType) {
    const highSeverity = [
      'high_error_rate',
      'low_availability',
      'server_error',
      'high_gas_usage'
    ];
    
    const mediumSeverity = [
      'high_latency',
      'high_user_activity',
      'high_ip_activity',
      'performance_anomaly'
    ];
    
    if (highSeverity.includes(alertType)) return 'high';
    if (mediumSeverity.includes(alertType)) return 'medium';
    return 'low';
  }

  /**
   * Calcular gas esperado
   * @param {string} functionName - Nombre de la función
   * @returns {number} Gas esperado
   */
  calculateExpectedGas(functionName) {
    const gasEstimates = {
      'enrollCourse': 150000,
      'completeCourse': 200000,
      'mintCertificate': 300000,
      'transferTokens': 65000,
      'updateProfile': 100000
    };
    
    return gasEstimates[functionName] || 0;
  }

  /**
   * Obtener dashboard avanzado
   * @returns {Object} Datos del dashboard
   */
  getAdvancedDashboard() {
    return {
      timestamp: Date.now(),
      performance: {
        responseTime: {
          p50: this.performanceMetrics.get('response_time_p50').value,
          p95: this.performanceMetrics.get('response_time_p95').value,
          p99: this.performanceMetrics.get('response_time_p99').value
        },
        throughput: this.performanceMetrics.get('throughput_rps').value,
        errorRate: this.performanceMetrics.get('error_rate').value,
        availability: this.performanceMetrics.get('availability').value
      },
      blockchain: {
        gasUsage: {
          average: this.blockchainMetrics.gasUsage.get('average').value,
          peak: this.blockchainMetrics.gasUsage.get('peak').value,
          efficiency: this.blockchainMetrics.gasUsage.get('efficiency').value
        },
        transactionVolume: {
          hourly: this.blockchainMetrics.transactionVolume.get('hourly').value,
          daily: this.blockchainMetrics.transactionVolume.get('daily').value
        },
        arbitrum: {
          l1GasPrice: this.blockchainMetrics.arbitrumMetrics.get('l1_gas_price').value,
          l2GasPrice: this.blockchainMetrics.arbitrumMetrics.get('l2_gas_price').value,
          batchSize: this.blockchainMetrics.arbitrumMetrics.get('batch_size').value
        }
      },
      ai: {
        predictionAccuracy: {
          overall: this.aiMetrics.predictionAccuracy.get('overall').value,
          courseRecommendations: this.aiMetrics.predictionAccuracy.get('course_recommendations').value,
          fraudDetection: this.aiMetrics.predictionAccuracy.get('fraud_detection').value
        },
        responseTimes: {
          average: this.aiMetrics.responseTimes.get('average').value,
          p95: this.aiMetrics.responseTimes.get('p95').value,
          p99: this.aiMetrics.responseTimes.get('p99').value
        }
      },
      mlPredictions: Object.fromEntries(this.mlPredictions),
      alerts: this.getRecentAlerts()
    };
  }

  /**
   * Obtener alertas recientes
   * @returns {Array} Alertas recientes
   */
  getRecentAlerts() {
    // Implementar lógica para obtener alertas recientes
    return [];
  }

  /**
   * Limpiar datos antiguos
   */
  cleanupOldData() {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    
    // Limpiar métricas en tiempo real
    for (const [key, data] of this.realTimeMetrics) {
      if (Array.isArray(data)) {
        this.realTimeMetrics.set(key, data.filter(item => item.metadata.timestamp > oneDayAgo));
      }
    }
    
    // Limpiar datos históricos
    for (const [key, data] of this.historicalData) {
      if (Array.isArray(data)) {
        this.historicalData.set(key, data.filter(item => item.timestamp > oneDayAgo));
      }
    }
    
    this.logger.info('Limpieza de datos completada');
  }

  /**
   * Obtener estadísticas avanzadas
   * @returns {Object} Estadísticas
   */
  getAdvancedStats() {
    return {
      totalMetrics: this.performanceMetrics.size + this.blockchainMetrics.gasUsage.size + this.aiMetrics.predictionAccuracy.size,
      mlModels: this.anomalyDetectors.size,
      predictions: this.mlPredictions.size,
      realTimeData: this.realTimeMetrics.size,
      historicalData: this.historicalData.size
    };
  }
}

// Instancia singleton
const advancedAnalyticsManager = new AdvancedAnalyticsManager();

module.exports = advancedAnalyticsManager;
