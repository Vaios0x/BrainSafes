const crypto = require('crypto');
const axios = require('axios');
const winston = require('winston');
const { ethers } = require('ethers');

class WebhookManager {
  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/webhooks.log' })
      ],
    });

    // Configuración de webhooks
    this.webhooks = new Map();
    this.retryQueue = [];
    this.maxRetries = 5;
    this.retryDelay = 5000; // 5 segundos

    // Inicializar procesamiento de cola de retry
    this.processRetryQueue();
  }

  /**
   * Registrar un webhook para eventos específicos
   * @param {string} url - URL del webhook
   * @param {string} secret - Secreto para firma
   * @param {Array} events - Array de eventos a escuchar
   * @param {Object} options - Opciones adicionales
   */
  registerWebhook(url, secret, events, options = {}) {
    const webhookId = crypto.randomUUID();
    
    const webhook = {
      id: webhookId,
      url,
      secret,
      events,
      options: {
        timeout: options.timeout || 10000,
        retries: options.retries || this.maxRetries,
        headers: options.headers || {},
        ...options
      },
      createdAt: Date.now(),
      isActive: true,
      stats: {
        totalCalls: 0,
        successfulCalls: 0,
        failedCalls: 0,
        lastCall: null
      }
    };

    this.webhooks.set(webhookId, webhook);
    this.logger.info(`Webhook registrado: ${webhookId} para eventos: ${events.join(', ')}`);

    return webhookId;
  }

  /**
   * Desregistrar un webhook
   * @param {string} webhookId - ID del webhook
   */
  unregisterWebhook(webhookId) {
    if (this.webhooks.has(webhookId)) {
      this.webhooks.delete(webhookId);
      this.logger.info(`Webhook desregistrado: ${webhookId}`);
      return true;
    }
    return false;
  }

  /**
   * Obtener webhooks para un evento específico
   * @param {string} eventType - Tipo de evento
   * @returns {Array} Array de webhooks
   */
  getWebhooksForEvent(eventType) {
    const matchingWebhooks = [];
    
    for (const [id, webhook] of this.webhooks) {
      if (webhook.isActive && webhook.events.includes(eventType)) {
        matchingWebhooks.push(webhook);
      }
    }

    return matchingWebhooks;
  }

  /**
   * Enviar evento a todos los webhooks suscritos
   * @param {string} eventType - Tipo de evento
   * @param {Object} eventData - Datos del evento
   * @param {Object} metadata - Metadatos adicionales
   */
  async sendEvent(eventType, eventData, metadata = {}) {
    const webhooks = this.getWebhooksForEvent(eventType);
    
    if (webhooks.length === 0) {
      this.logger.debug(`No hay webhooks registrados para el evento: ${eventType}`);
      return;
    }

    this.logger.info(`Enviando evento ${eventType} a ${webhooks.length} webhooks`);

    const promises = webhooks.map(webhook => 
      this.sendToWebhook(webhook, eventType, eventData, metadata)
    );

    await Promise.allSettled(promises);
  }

  /**
   * Enviar evento a un webhook específico
   * @param {Object} webhook - Configuración del webhook
   * @param {string} eventType - Tipo de evento
   * @param {Object} eventData - Datos del evento
   * @param {Object} metadata - Metadatos adicionales
   */
  async sendToWebhook(webhook, eventType, eventData, metadata) {
    const payload = {
      id: crypto.randomUUID(),
      event: eventType,
      timestamp: Date.now(),
      data: eventData,
      metadata: {
        ...metadata,
        webhookId: webhook.id
      }
    };

    // Generar firma HMAC
    const signature = this.generateSignature(webhook.secret, JSON.stringify(payload));
    
    const headers = {
      'Content-Type': 'application/json',
      'X-Webhook-Signature': signature,
      'X-Webhook-Event': eventType,
      'X-Webhook-ID': webhook.id,
      'User-Agent': 'BrainSafes-Webhook/1.0',
      ...webhook.options.headers
    };

    try {
      webhook.stats.totalCalls++;
      webhook.stats.lastCall = Date.now();

      const response = await axios.post(webhook.url, payload, {
        headers,
        timeout: webhook.options.timeout,
        validateStatus: () => true // No lanzar error por códigos de estado HTTP
      });

      if (response.status >= 200 && response.status < 300) {
        webhook.stats.successfulCalls++;
        this.logger.info(`Webhook ${webhook.id} enviado exitosamente: ${response.status}`);
      } else {
        webhook.stats.failedCalls++;
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

    } catch (error) {
      webhook.stats.failedCalls++;
      this.logger.error(`Error enviando webhook ${webhook.id}:`, error.message);
      
      // Agregar a cola de retry si no se han agotado los intentos
      if (webhook.stats.failedCalls < webhook.options.retries) {
        this.addToRetryQueue(webhook, eventType, eventData, metadata);
      }
    }
  }

  /**
   * Generar firma HMAC para el payload
   * @param {string} secret - Secreto del webhook
   * @param {string} payload - Payload a firmar
   * @returns {string} Firma HMAC
   */
  generateSignature(secret, payload) {
    return crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
  }

  /**
   * Agregar webhook a la cola de retry
   * @param {Object} webhook - Configuración del webhook
   * @param {string} eventType - Tipo de evento
   * @param {Object} eventData - Datos del evento
   * @param {Object} metadata - Metadatos adicionales
   */
  addToRetryQueue(webhook, eventType, eventData, metadata) {
    const retryItem = {
      webhook,
      eventType,
      eventData,
      metadata,
      retryCount: 0,
      nextRetry: Date.now() + this.retryDelay,
      createdAt: Date.now()
    };

    this.retryQueue.push(retryItem);
    this.logger.info(`Webhook ${webhook.id} agregado a cola de retry`);
  }

  /**
   * Procesar cola de retry
   */
  async processRetryQueue() {
    setInterval(async () => {
      const now = Date.now();
      const itemsToRetry = this.retryQueue.filter(item => 
        item.nextRetry <= now && item.retryCount < item.webhook.options.retries
      );

      for (const item of itemsToRetry) {
        try {
          item.retryCount++;
          item.nextRetry = now + (this.retryDelay * Math.pow(2, item.retryCount)); // Exponential backoff
          
          await this.sendToWebhook(
            item.webhook, 
            item.eventType, 
            item.eventData, 
            item.metadata
          );

          // Remover de la cola si fue exitoso
          this.retryQueue = this.retryQueue.filter(i => i !== item);
          
        } catch (error) {
          this.logger.error(`Retry ${item.retryCount} falló para webhook ${item.webhook.id}:`, error.message);
          
          // Remover de la cola si se agotaron los intentos
          if (item.retryCount >= item.webhook.options.retries) {
            this.retryQueue = this.retryQueue.filter(i => i !== item);
            this.logger.error(`Webhook ${item.webhook.id} removido de cola de retry después de ${item.retryCount} intentos`);
          }
        }
      }
    }, 1000); // Revisar cada segundo
  }

  /**
   * Obtener estadísticas de webhooks
   * @returns {Object} Estadísticas
   */
  getStats() {
    const stats = {
      totalWebhooks: this.webhooks.size,
      activeWebhooks: 0,
      totalEvents: 0,
      retryQueueSize: this.retryQueue.length,
      webhooks: []
    };

    for (const [id, webhook] of this.webhooks) {
      if (webhook.isActive) stats.activeWebhooks++;
      stats.totalEvents += webhook.stats.totalCalls;
      
      stats.webhooks.push({
        id: webhook.id,
        url: webhook.url,
        events: webhook.events,
        isActive: webhook.isActive,
        stats: webhook.stats,
        createdAt: webhook.createdAt
      });
    }

    return stats;
  }

  /**
   * Limpiar webhooks inactivos
   * @param {number} maxAge - Edad máxima en milisegundos
   */
  cleanupInactiveWebhooks(maxAge = 30 * 24 * 60 * 60 * 1000) { // 30 días
    const now = Date.now();
    let cleaned = 0;

    for (const [id, webhook] of this.webhooks) {
      if (!webhook.isActive && (now - webhook.stats.lastCall) > maxAge) {
        this.webhooks.delete(id);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.info(`Limpiados ${cleaned} webhooks inactivos`);
    }

    return cleaned;
  }
}

// Instancia singleton
const webhookManager = new WebhookManager();

module.exports = webhookManager;
