const winston = require('winston');
const crypto = require('crypto');
const { ethers } = require('ethers');

class AnalyticsManager {
  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/analytics.log' })
      ],
    });

    // Almacenamiento de métricas
    this.metrics = new Map();
    this.events = [];
    this.realTimeData = new Map();
    this.aggregations = new Map();
    
    // Configuración de alertas
    this.alerts = new Map();
    this.alertThresholds = new Map();
    
    // Configuración de dashboards
    this.dashboards = new Map();
    
    // Inicializar métricas base
    this.initializeBaseMetrics();
    
    // Configurar limpieza automática
    this.setupCleanup();
  }

  /**
   * Inicializar métricas base del sistema
   */
  initializeBaseMetrics() {
    // Métricas de usuarios
    this.metrics.set('users.total', { value: 0, timestamp: Date.now() });
    this.metrics.set('users.active', { value: 0, timestamp: Date.now() });
    this.metrics.set('users.new_today', { value: 0, timestamp: Date.now() });
    this.metrics.set('users.new_week', { value: 0, timestamp: Date.now() });
    this.metrics.set('users.new_month', { value: 0, timestamp: Date.now() });

    // Métricas de cursos
    this.metrics.set('courses.total', { value: 0, timestamp: Date.now() });
    this.metrics.set('courses.active', { value: 0, timestamp: Date.now() });
    this.metrics.set('courses.completed_today', { value: 0, timestamp: Date.now() });
    this.metrics.set('courses.completed_week', { value: 0, timestamp: Date.now() });
    this.metrics.set('courses.completed_month', { value: 0, timestamp: Date.now() });

    // Métricas de certificados
    this.metrics.set('certificates.total', { value: 0, timestamp: Date.now() });
    this.metrics.set('certificates.issued_today', { value: 0, timestamp: Date.now() });
    this.metrics.set('certificates.issued_week', { value: 0, timestamp: Date.now() });
    this.metrics.set('certificates.issued_month', { value: 0, timestamp: Date.now() });

    // Métricas financieras
    this.metrics.set('revenue.total', { value: 0, timestamp: Date.now() });
    this.metrics.set('revenue.today', { value: 0, timestamp: Date.now() });
    this.metrics.set('revenue.week', { value: 0, timestamp: Date.now() });
    this.metrics.set('revenue.month', { value: 0, timestamp: Date.now() });
    this.metrics.set('revenue.platform_fees', { value: 0, timestamp: Date.now() });

    // Métricas de blockchain
    this.metrics.set('blockchain.transactions', { value: 0, timestamp: Date.now() });
    this.metrics.set('blockchain.gas_used', { value: 0, timestamp: Date.now() });
    this.metrics.set('blockchain.gas_price_avg', { value: 0, timestamp: Date.now() });
    this.metrics.set('blockchain.contract_calls', { value: 0, timestamp: Date.now() });

    // Métricas de performance
    this.metrics.set('performance.response_time_avg', { value: 0, timestamp: Date.now() });
    this.metrics.set('performance.response_time_p95', { value: 0, timestamp: Date.now() });
    this.metrics.set('performance.response_time_p99', { value: 0, timestamp: Date.now() });
    this.metrics.set('performance.error_rate', { value: 0, timestamp: Date.now() });
    this.metrics.set('performance.uptime', { value: 100, timestamp: Date.now() });

    // Métricas de engagement
    this.metrics.set('engagement.daily_active_users', { value: 0, timestamp: Date.now() });
    this.metrics.set('engagement.weekly_active_users', { value: 0, timestamp: Date.now() });
    this.metrics.set('engagement.monthly_active_users', { value: 0, timestamp: Date.now() });
    this.metrics.set('engagement.session_duration_avg', { value: 0, timestamp: Date.now() });
    this.metrics.set('engagement.bounce_rate', { value: 0, timestamp: Date.now() });

    this.logger.info('Métricas base inicializadas');
  }

  /**
   * Registrar evento
   * @param {string} eventType - Tipo de evento
   * @param {Object} eventData - Datos del evento
   * @param {Object} metadata - Metadatos adicionales
   */
  trackEvent(eventType, eventData, metadata = {}) {
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
          ...metadata
        }
      };

      this.events.push(event);
      
      // Actualizar métricas en tiempo real
      this.updateRealTimeMetrics(event);
      
      // Verificar alertas
      this.checkAlerts(event);
      
      // Limitar tamaño del array de eventos
      if (this.events.length > 10000) {
        this.events = this.events.slice(-5000);
      }

      this.logger.debug(`Evento registrado: ${eventType}`, { eventId: event.id });

    } catch (error) {
      this.logger.error('Error registrando evento:', error.message);
    }
  }

  /**
   * Actualizar métricas en tiempo real
   * @param {Object} event - Evento registrado
   */
  updateRealTimeMetrics(event) {
    const now = Date.now();
    const eventType = event.type;

    switch (eventType) {
      case 'user.registered':
        this.incrementMetric('users.total');
        this.incrementMetric('users.new_today');
        this.incrementMetric('users.new_week');
        this.incrementMetric('users.new_month');
        break;

      case 'user.login':
        this.incrementMetric('users.active');
        this.incrementMetric('engagement.daily_active_users');
        break;

      case 'course.created':
        this.incrementMetric('courses.total');
        this.incrementMetric('courses.active');
        break;

      case 'course.enrolled':
        this.incrementMetric('courses.enrollments');
        break;

      case 'course.completed':
        this.incrementMetric('courses.completed_today');
        this.incrementMetric('courses.completed_week');
        this.incrementMetric('courses.completed_month');
        break;

      case 'certificate.issued':
        this.incrementMetric('certificates.total');
        this.incrementMetric('certificates.issued_today');
        this.incrementMetric('certificates.issued_week');
        this.incrementMetric('certificates.issued_month');
        break;

      case 'payment.processed':
        const amount = event.data.amount || 0;
        this.incrementMetric('revenue.total', amount);
        this.incrementMetric('revenue.today', amount);
        this.incrementMetric('revenue.week', amount);
        this.incrementMetric('revenue.month', amount);
        break;

      case 'blockchain.transaction':
        this.incrementMetric('blockchain.transactions');
        this.incrementMetric('blockchain.gas_used', event.data.gasUsed || 0);
        this.updateAverageMetric('blockchain.gas_price_avg', event.data.gasPrice || 0);
        break;

      case 'api.request':
        this.updateAverageMetric('performance.response_time_avg', event.data.responseTime || 0);
        this.updatePercentileMetric('performance.response_time_p95', event.data.responseTime || 0, 95);
        this.updatePercentileMetric('performance.response_time_p99', event.data.responseTime || 0, 99);
        break;

      case 'api.error':
        this.incrementMetric('performance.errors');
        this.updateErrorRate();
        break;
    }

    // Actualizar timestamp
    this.metrics.forEach(metric => {
      metric.timestamp = now;
    });
  }

  /**
   * Incrementar métrica
   * @param {string} metricKey - Clave de la métrica
   * @param {number} value - Valor a incrementar
   */
  incrementMetric(metricKey, value = 1) {
    if (!this.metrics.has(metricKey)) {
      this.metrics.set(metricKey, { value: 0, timestamp: Date.now() });
    }
    this.metrics.get(metricKey).value += value;
  }

  /**
   * Actualizar métrica promedio
   * @param {string} metricKey - Clave de la métrica
   * @param {number} value - Nuevo valor
   */
  updateAverageMetric(metricKey, value) {
    if (!this.metrics.has(metricKey)) {
      this.metrics.set(metricKey, { value: 0, count: 0, timestamp: Date.now() });
    }
    
    const metric = this.metrics.get(metricKey);
    metric.count = (metric.count || 0) + 1;
    metric.value = ((metric.value * (metric.count - 1)) + value) / metric.count;
  }

  /**
   * Actualizar métrica de percentil
   * @param {string} metricKey - Clave de la métrica
   * @param {number} value - Nuevo valor
   * @param {number} percentile - Percentil (95, 99, etc.)
   */
  updatePercentileMetric(metricKey, value, percentile) {
    if (!this.aggregations.has(metricKey)) {
      this.aggregations.set(metricKey, []);
    }
    
    const values = this.aggregations.get(metricKey);
    values.push(value);
    
    // Mantener solo los últimos 1000 valores
    if (values.length > 1000) {
      values.splice(0, values.length - 1000);
    }
    
    // Calcular percentil
    values.sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * values.length) - 1;
    const percentileValue = values[index] || 0;
    
    this.metrics.set(metricKey, { value: percentileValue, timestamp: Date.now() });
  }

  /**
   * Actualizar tasa de errores
   */
  updateErrorRate() {
    const totalRequests = this.metrics.get('performance.total_requests')?.value || 0;
    const errors = this.metrics.get('performance.errors')?.value || 0;
    
    if (totalRequests > 0) {
      const errorRate = (errors / totalRequests) * 100;
      this.metrics.set('performance.error_rate', { value: errorRate, timestamp: Date.now() });
    }
  }

  /**
   * Configurar alerta
   * @param {string} alertId - ID de la alerta
   * @param {Object} config - Configuración de la alerta
   */
  configureAlert(alertId, config) {
    this.alerts.set(alertId, {
      id: alertId,
      metric: config.metric,
      condition: config.condition, // 'gt', 'lt', 'eq', 'gte', 'lte'
      threshold: config.threshold,
      message: config.message,
      channels: config.channels || ['email'],
      enabled: config.enabled !== false,
      lastTriggered: null,
      cooldown: config.cooldown || 300000 // 5 minutos por defecto
    });

    this.logger.info(`Alerta configurada: ${alertId}`);
  }

  /**
   * Verificar alertas
   * @param {Object} event - Evento que puede disparar alertas
   */
  checkAlerts(event) {
    for (const [alertId, alert] of this.alerts) {
      if (!alert.enabled) continue;

      const metric = this.metrics.get(alert.metric);
      if (!metric) continue;

      const shouldTrigger = this.evaluateAlertCondition(alert, metric.value);
      
      if (shouldTrigger && this.canTriggerAlert(alert)) {
        this.triggerAlert(alert, metric.value);
      }
    }
  }

  /**
   * Evaluar condición de alerta
   * @param {Object} alert - Configuración de la alerta
   * @param {number} value - Valor actual de la métrica
   * @returns {boolean} True si debe dispararse la alerta
   */
  evaluateAlertCondition(alert, value) {
    switch (alert.condition) {
      case 'gt':
        return value > alert.threshold;
      case 'gte':
        return value >= alert.threshold;
      case 'lt':
        return value < alert.threshold;
      case 'lte':
        return value <= alert.threshold;
      case 'eq':
        return value === alert.threshold;
      default:
        return false;
    }
  }

  /**
   * Verificar si se puede disparar la alerta (cooldown)
   * @param {Object} alert - Configuración de la alerta
   * @returns {boolean} True si se puede disparar
   */
  canTriggerAlert(alert) {
    if (!alert.lastTriggered) return true;
    
    const now = Date.now();
    return (now - alert.lastTriggered) >= alert.cooldown;
  }

  /**
   * Disparar alerta
   * @param {Object} alert - Configuración de la alerta
   * @param {number} value - Valor que disparó la alerta
   */
  async triggerAlert(alert, value) {
    try {
      alert.lastTriggered = Date.now();
      
      const alertData = {
        id: alert.id,
        metric: alert.metric,
        value: value,
        threshold: alert.threshold,
        condition: alert.condition,
        message: alert.message,
        timestamp: Date.now()
      };

      // Aquí enviarías la alerta a través de los canales configurados
      // Por ejemplo, usando el NotificationManager
      
      this.logger.warn(`Alerta disparada: ${alert.id}`, alertData);

    } catch (error) {
      this.logger.error('Error disparando alerta:', error.message);
    }
  }

  /**
   * Obtener métricas
   * @param {Array} metricKeys - Claves de métricas a obtener
   * @param {Object} options - Opciones adicionales
   * @returns {Object} Métricas solicitadas
   */
  getMetrics(metricKeys = null, options = {}) {
    const result = {};
    
    if (metricKeys) {
      // Obtener métricas específicas
      for (const key of metricKeys) {
        if (this.metrics.has(key)) {
          result[key] = this.metrics.get(key);
        }
      }
    } else {
      // Obtener todas las métricas
      for (const [key, value] of this.metrics) {
        result[key] = value;
      }
    }

    // Aplicar filtros de tiempo si se especifican
    if (options.since) {
      const since = new Date(options.since).getTime();
      Object.keys(result).forEach(key => {
        if (result[key].timestamp < since) {
          delete result[key];
        }
      });
    }

    return result;
  }

  /**
   * Obtener eventos
   * @param {Object} filters - Filtros para los eventos
   * @param {Object} options - Opciones adicionales
   * @returns {Array} Eventos filtrados
   */
  getEvents(filters = {}, options = {}) {
    let filteredEvents = [...this.events];

    // Filtrar por tipo
    if (filters.type) {
      filteredEvents = filteredEvents.filter(e => e.type === filters.type);
    }

    // Filtrar por usuario
    if (filters.userId) {
      filteredEvents = filteredEvents.filter(e => e.metadata.userId === filters.userId);
    }

    // Filtrar por rango de tiempo
    if (filters.since) {
      const since = new Date(filters.since).getTime();
      filteredEvents = filteredEvents.filter(e => e.metadata.timestamp >= since);
    }

    if (filters.until) {
      const until = new Date(filters.until).getTime();
      filteredEvents = filteredEvents.filter(e => e.metadata.timestamp <= until);
    }

    // Ordenar por timestamp
    filteredEvents.sort((a, b) => b.metadata.timestamp - a.metadata.timestamp);

    // Aplicar paginación
    if (options.limit) {
      filteredEvents = filteredEvents.slice(0, options.limit);
    }

    if (options.offset) {
      filteredEvents = filteredEvents.slice(options.offset);
    }

    return filteredEvents;
  }

  /**
   * Generar reporte
   * @param {string} reportType - Tipo de reporte
   * @param {Object} options - Opciones del reporte
   * @returns {Object} Reporte generado
   */
  generateReport(reportType, options = {}) {
    const now = Date.now();
    const report = {
      id: crypto.randomUUID(),
      type: reportType,
      generatedAt: now,
      period: options.period || '24h',
      data: {}
    };

    switch (reportType) {
      case 'user_activity':
        report.data = this.generateUserActivityReport(options);
        break;
      case 'course_performance':
        report.data = this.generateCoursePerformanceReport(options);
        break;
      case 'financial_summary':
        report.data = this.generateFinancialSummaryReport(options);
        break;
      case 'blockchain_metrics':
        report.data = this.generateBlockchainMetricsReport(options);
        break;
      case 'system_health':
        report.data = this.generateSystemHealthReport(options);
        break;
      default:
        throw new Error(`Tipo de reporte no soportado: ${reportType}`);
    }

    this.logger.info(`Reporte generado: ${reportType}`, { reportId: report.id });
    return report;
  }

  /**
   * Generar reporte de actividad de usuarios
   * @param {Object} options - Opciones del reporte
   * @returns {Object} Datos del reporte
   */
  generateUserActivityReport(options) {
    const since = options.since || (Date.now() - 24 * 60 * 60 * 1000); // Últimas 24h
    const events = this.getEvents({ since });

    const userEvents = events.filter(e => e.type.startsWith('user.'));
    const uniqueUsers = new Set(userEvents.map(e => e.metadata.userId).filter(Boolean));

    return {
      totalEvents: userEvents.length,
      uniqueUsers: uniqueUsers.size,
      eventBreakdown: this.countEventsByType(userEvents),
      topUsers: this.getTopUsers(userEvents, 10),
      userRetention: this.calculateUserRetention(userEvents)
    };
  }

  /**
   * Generar reporte de performance de cursos
   * @param {Object} options - Opciones del reporte
   * @returns {Object} Datos del reporte
   */
  generateCoursePerformanceReport(options) {
    const since = options.since || (Date.now() - 7 * 24 * 60 * 60 * 1000); // Última semana
    const events = this.getEvents({ since });

    const courseEvents = events.filter(e => e.type.startsWith('course.'));
    
    return {
      totalCourses: this.metrics.get('courses.total')?.value || 0,
      activeCourses: this.metrics.get('courses.active')?.value || 0,
      enrollments: courseEvents.filter(e => e.type === 'course.enrolled').length,
      completions: courseEvents.filter(e => e.type === 'course.completed').length,
      completionRate: this.calculateCompletionRate(courseEvents),
      topCourses: this.getTopCourses(courseEvents, 10)
    };
  }

  /**
   * Generar reporte financiero
   * @param {Object} options - Opciones del reporte
   * @returns {Object} Datos del reporte
   */
  generateFinancialSummaryReport(options) {
    return {
      totalRevenue: this.metrics.get('revenue.total')?.value || 0,
      todayRevenue: this.metrics.get('revenue.today')?.value || 0,
      weekRevenue: this.metrics.get('revenue.week')?.value || 0,
      monthRevenue: this.metrics.get('revenue.month')?.value || 0,
      platformFees: this.metrics.get('revenue.platform_fees')?.value || 0,
      revenueGrowth: this.calculateRevenueGrowth()
    };
  }

  /**
   * Generar reporte de métricas blockchain
   * @param {Object} options - Opciones del reporte
   * @returns {Object} Datos del reporte
   */
  generateBlockchainMetricsReport(options) {
    return {
      totalTransactions: this.metrics.get('blockchain.transactions')?.value || 0,
      totalGasUsed: this.metrics.get('blockchain.gas_used')?.value || 0,
      averageGasPrice: this.metrics.get('blockchain.gas_price_avg')?.value || 0,
      contractCalls: this.metrics.get('blockchain.contract_calls')?.value || 0,
      gasEfficiency: this.calculateGasEfficiency()
    };
  }

  /**
   * Generar reporte de salud del sistema
   * @param {Object} options - Opciones del reporte
   * @returns {Object} Datos del reporte
   */
  generateSystemHealthReport(options) {
    return {
      uptime: this.metrics.get('performance.uptime')?.value || 100,
      averageResponseTime: this.metrics.get('performance.response_time_avg')?.value || 0,
      p95ResponseTime: this.metrics.get('performance.response_time_p95')?.value || 0,
      p99ResponseTime: this.metrics.get('performance.response_time_p99')?.value || 0,
      errorRate: this.metrics.get('performance.error_rate')?.value || 0,
      systemStatus: this.getSystemStatus()
    };
  }

  /**
   * Contar eventos por tipo
   * @param {Array} events - Array de eventos
   * @returns {Object} Conteo por tipo
   */
  countEventsByType(events) {
    const counts = {};
    events.forEach(event => {
      counts[event.type] = (counts[event.type] || 0) + 1;
    });
    return counts;
  }

  /**
   * Obtener usuarios más activos
   * @param {Array} events - Array de eventos
   * @param {number} limit - Límite de resultados
   * @returns {Array} Usuarios más activos
   */
  getTopUsers(events, limit = 10) {
    const userCounts = {};
    events.forEach(event => {
      if (event.metadata.userId) {
        userCounts[event.metadata.userId] = (userCounts[event.metadata.userId] || 0) + 1;
      }
    });

    return Object.entries(userCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([userId, count]) => ({ userId, eventCount: count }));
  }

  /**
   * Calcular retención de usuarios
   * @param {Array} events - Array de eventos
   * @returns {Object} Métricas de retención
   */
  calculateUserRetention(events) {
    // Implementación simplificada de retención
    const uniqueUsers = new Set(events.map(e => e.metadata.userId).filter(Boolean));
    const totalUsers = this.metrics.get('users.total')?.value || 0;
    
    return {
      activeUsers: uniqueUsers.size,
      totalUsers: totalUsers,
      retentionRate: totalUsers > 0 ? (uniqueUsers.size / totalUsers) * 100 : 0
    };
  }

  /**
   * Calcular tasa de completación
   * @param {Array} events - Array de eventos
   * @returns {number} Tasa de completación
   */
  calculateCompletionRate(events) {
    const enrollments = events.filter(e => e.type === 'course.enrolled').length;
    const completions = events.filter(e => e.type === 'course.completed').length;
    
    return enrollments > 0 ? (completions / enrollments) * 100 : 0;
  }

  /**
   * Obtener cursos más populares
   * @param {Array} events - Array de eventos
   * @param {number} limit - Límite de resultados
   * @returns {Array} Cursos más populares
   */
  getTopCourses(events, limit = 10) {
    const courseCounts = {};
    events.forEach(event => {
      if (event.data.courseId) {
        courseCounts[event.data.courseId] = (courseCounts[event.data.courseId] || 0) + 1;
      }
    });

    return Object.entries(courseCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([courseId, count]) => ({ courseId, eventCount: count }));
  }

  /**
   * Calcular crecimiento de ingresos
   * @returns {Object} Métricas de crecimiento
   */
  calculateRevenueGrowth() {
    const today = this.metrics.get('revenue.today')?.value || 0;
    const week = this.metrics.get('revenue.week')?.value || 0;
    const month = this.metrics.get('revenue.month')?.value || 0;
    
    return {
      daily: today,
      weekly: week,
      monthly: month,
      weeklyGrowth: week > 0 ? ((week - today * 7) / (today * 7)) * 100 : 0,
      monthlyGrowth: month > 0 ? ((month - today * 30) / (today * 30)) * 100 : 0
    };
  }

  /**
   * Calcular eficiencia de gas
   * @returns {Object} Métricas de eficiencia
   */
  calculateGasEfficiency() {
    const totalGas = this.metrics.get('blockchain.gas_used')?.value || 0;
    const totalTransactions = this.metrics.get('blockchain.transactions')?.value || 0;
    
    return {
      averageGasPerTransaction: totalTransactions > 0 ? totalGas / totalTransactions : 0,
      totalGasUsed: totalGas,
      totalTransactions: totalTransactions
    };
  }

  /**
   * Obtener estado del sistema
   * @returns {string} Estado del sistema
   */
  getSystemStatus() {
    const errorRate = this.metrics.get('performance.error_rate')?.value || 0;
    const uptime = this.metrics.get('performance.uptime')?.value || 100;
    
    if (errorRate > 5 || uptime < 95) return 'critical';
    if (errorRate > 2 || uptime < 98) return 'warning';
    return 'healthy';
  }

  /**
   * Configurar limpieza automática
   */
  setupCleanup() {
    // Limpiar eventos antiguos cada hora
    setInterval(() => {
      const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 días
      this.events = this.events.filter(e => e.metadata.timestamp > cutoff);
      
      // Limpiar agregaciones antiguas
      for (const [key, values] of this.aggregations) {
        if (values.length > 1000) {
          this.aggregations.set(key, values.slice(-500));
        }
      }
    }, 60 * 60 * 1000); // Cada hora
  }

  /**
   * Obtener estadísticas del sistema de analytics
   * @returns {Object} Estadísticas
   */
  getStats() {
    return {
      totalMetrics: this.metrics.size,
      totalEvents: this.events.length,
      totalAlerts: this.alerts.size,
      activeAlerts: Array.from(this.alerts.values()).filter(a => a.enabled).length,
      realTimeDataPoints: this.realTimeData.size,
      aggregations: this.aggregations.size
    };
  }
}

// Instancia singleton
const analyticsManager = new AnalyticsManager();

module.exports = analyticsManager;
