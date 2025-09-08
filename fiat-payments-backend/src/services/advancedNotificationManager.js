const notificationManager = require('./notificationManager');
const webhookManager = require('./webhookManager');
const contractAPIs = require('./contractAPIs');
const winston = require('winston');
const crypto = require('crypto');

class AdvancedNotificationManager {
  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/advanced-notifications.log' })
      ],
    });

    // Configuración de notificaciones blockchain
    this.blockchainNotifications = new Map();
    this.notificationTemplates = new Map();
    this.notificationQueue = [];
    this.isProcessing = false;

    // Configurar templates avanzados
    this.setupAdvancedTemplates();
    
    // Configurar listeners de eventos blockchain
    this.setupBlockchainListeners();

    this.logger.info('Advanced Notification Manager inicializado');
  }

  /**
   * Configurar templates avanzados de notificación
   */
  setupAdvancedTemplates() {
    // Templates para eventos de contratos
    this.notificationTemplates.set('contract.user_profile_created', {
      title: 'Perfil Creado Exitosamente',
      message: 'Tu perfil de usuario ha sido creado en la blockchain',
      type: 'success',
      channels: ['email', 'in-app', 'push'],
      priority: 'medium',
      category: 'profile'
    });

    this.notificationTemplates.set('contract.certificate_issued', {
      title: '¡Certificado Emitido!',
      message: 'Has recibido un nuevo certificado NFT por completar el curso',
      type: 'success',
      channels: ['email', 'in-app', 'push', 'sms'],
      priority: 'high',
      category: 'achievement'
    });

    this.notificationTemplates.set('contract.course_enrolled', {
      title: 'Inscripción Exitosa',
      message: 'Te has inscrito exitosamente en el curso',
      type: 'info',
      channels: ['email', 'in-app'],
      priority: 'medium',
      category: 'course'
    });

    this.notificationTemplates.set('contract.job_applied', {
      title: 'Postulación Enviada',
      message: 'Tu postulación ha sido enviada exitosamente',
      type: 'info',
      channels: ['email', 'in-app'],
      priority: 'medium',
      category: 'job'
    });

    this.notificationTemplates.set('contract.scholarship_awarded', {
      title: '¡Beca Otorgada!',
      message: 'Has sido seleccionado para recibir una beca',
      type: 'success',
      channels: ['email', 'in-app', 'push', 'sms'],
      priority: 'high',
      category: 'scholarship'
    });

    this.notificationTemplates.set('contract.governance_proposal', {
      title: 'Nueva Propuesta de Gobernanza',
      message: 'Se ha creado una nueva propuesta de gobernanza',
      type: 'info',
      channels: ['email', 'in-app', 'push'],
      priority: 'medium',
      category: 'governance'
    });

    this.notificationTemplates.set('contract.token_transfer', {
      title: 'Transferencia de Tokens',
      message: 'Se ha realizado una transferencia de tokens EDU',
      type: 'info',
      channels: ['email', 'in-app'],
      priority: 'low',
      category: 'finance'
    });

    this.notificationTemplates.set('contract.nft_minted', {
      title: 'NFT Creado',
      message: 'Se ha creado un nuevo NFT en tu wallet',
      type: 'success',
      channels: ['email', 'in-app', 'push'],
      priority: 'medium',
      category: 'nft'
    });

    // Templates para eventos de sistema
    this.notificationTemplates.set('system.maintenance', {
      title: 'Mantenimiento Programado',
      message: 'El sistema estará en mantenimiento',
      type: 'warning',
      channels: ['email', 'in-app', 'push'],
      priority: 'high',
      category: 'system'
    });

    this.notificationTemplates.set('system.security_alert', {
      title: 'Alerta de Seguridad',
      message: 'Se ha detectado actividad sospechosa',
      type: 'error',
      channels: ['email', 'in-app', 'push', 'sms'],
      priority: 'critical',
      category: 'security'
    });

    this.logger.info(`Templates avanzados configurados: ${this.notificationTemplates.size}`);
  }

  /**
   * Configurar listeners de eventos blockchain
   */
  setupBlockchainListeners() {
    // Registrar eventos blockchain para notificaciones
    const blockchainEvents = [
      'user.profile_created',
      'certificate.issued',
      'course.enrolled',
      'job.applied',
      'scholarship.awarded',
      'governance.proposal_created',
      'token.transfer',
      'nft.minted',
      'metadata.updated'
    ];

    blockchainEvents.forEach(eventType => {
      this.blockchainNotifications.set(eventType, {
        enabled: true,
        template: this.notificationTemplates.get(`contract.${eventType.split('.')[1]}`),
        webhook: true
      });
    });

    this.logger.info(`Listeners blockchain configurados: ${blockchainEvents.length}`);
  }

  /**
   * Procesar evento blockchain y enviar notificaciones
   * @param {string} eventType - Tipo de evento
   * @param {Object} eventData - Datos del evento
   * @param {Object} metadata - Metadata adicional
   */
  async processBlockchainEvent(eventType, eventData, metadata = {}) {
    try {
      this.logger.info(`Procesando evento blockchain: ${eventType}`);

      const notificationConfig = this.blockchainNotifications.get(eventType);
      if (!notificationConfig || !notificationConfig.enabled) {
        this.logger.info(`Notificaciones deshabilitadas para evento: ${eventType}`);
        return;
      }

      // Determinar destinatarios
      const recipients = await this.determineRecipients(eventType, eventData);
      
      // Crear notificaciones para cada destinatario
      const notifications = [];
      
      for (const recipient of recipients) {
        const notification = await this.createNotificationFromEvent(
          eventType,
          eventData,
          recipient,
          metadata
        );
        
        if (notification) {
          notifications.push(notification);
        }
      }

      // Enviar notificaciones
      const results = await this.sendNotifications(notifications);

      // Enviar webhook si está habilitado
      if (notificationConfig.webhook) {
        await webhookManager.sendEvent(`notification.${eventType}`, {
          eventType,
          eventData,
          notifications: results,
          timestamp: Date.now()
        });
      }

      this.logger.info(`Evento blockchain procesado: ${eventType}, ${results.length} notificaciones enviadas`);
      return results;

    } catch (error) {
      this.logger.error(`Error procesando evento blockchain ${eventType}:`, error.message);
      throw error;
    }
  }

  /**
   * Determinar destinatarios para un evento
   * @param {string} eventType - Tipo de evento
   * @param {Object} eventData - Datos del evento
   * @returns {Array} Lista de destinatarios
   */
  async determineRecipients(eventType, eventData) {
    const recipients = [];

    switch (eventType) {
      case 'user.profile_created':
        recipients.push({
          type: 'wallet',
          address: eventData.userAddress,
          channels: ['email', 'in-app']
        });
        break;

      case 'certificate.issued':
        recipients.push({
          type: 'wallet',
          address: eventData.recipient,
          channels: ['email', 'in-app', 'push']
        });
        break;

      case 'course.enrolled':
        recipients.push({
          type: 'wallet',
          address: eventData.student,
          channels: ['email', 'in-app']
        });
        break;

      case 'job.applied':
        // Notificar al empleador
        recipients.push({
          type: 'wallet',
          address: eventData.employer,
          channels: ['email', 'in-app']
        });
        // Notificar al aplicante
        recipients.push({
          type: 'wallet',
          address: eventData.applicant,
          channels: ['email', 'in-app']
        });
        break;

      case 'scholarship.awarded':
        recipients.push({
          type: 'wallet',
          address: eventData.recipient,
          channels: ['email', 'in-app', 'push', 'sms']
        });
        break;

      case 'governance.proposal_created':
        // Notificar a todos los holders de tokens de gobernanza
        const governanceHolders = await this.getGovernanceTokenHolders();
        governanceHolders.forEach(holder => {
          recipients.push({
            type: 'wallet',
            address: holder,
            channels: ['email', 'in-app']
          });
        });
        break;

      case 'token.transfer':
        // Notificar al remitente y destinatario
        recipients.push({
          type: 'wallet',
          address: eventData.from,
          channels: ['email', 'in-app']
        });
        recipients.push({
          type: 'wallet',
          address: eventData.to,
          channels: ['email', 'in-app']
        });
        break;

      case 'nft.minted':
        recipients.push({
          type: 'wallet',
          address: eventData.owner,
          channels: ['email', 'in-app', 'push']
        });
        break;

      default:
        this.logger.warn(`Tipo de evento no reconocido: ${eventType}`);
    }

    return recipients;
  }

  /**
   * Crear notificación desde evento blockchain
   * @param {string} eventType - Tipo de evento
   * @param {Object} eventData - Datos del evento
   * @param {Object} recipient - Destinatario
   * @param {Object} metadata - Metadata adicional
   * @returns {Object} Notificación
   */
  async createNotificationFromEvent(eventType, eventData, recipient, metadata) {
    try {
      const template = this.notificationTemplates.get(`contract.${eventType.split('.')[1]}`);
      if (!template) {
        this.logger.warn(`Template no encontrado para evento: ${eventType}`);
        return null;
      }

      // Personalizar mensaje según el evento
      const personalizedMessage = this.personalizeMessage(template.message, eventData);
      
      const notification = {
        id: crypto.randomUUID(),
        type: eventType,
        recipient: recipient.address,
        channels: recipient.channels,
        title: template.title,
        message: personalizedMessage,
        priority: template.priority,
        category: template.category,
        data: {
          eventType,
          eventData,
          metadata,
          timestamp: Date.now()
        },
        status: 'pending',
        createdAt: new Date()
      };

      return notification;

    } catch (error) {
      this.logger.error(`Error creando notificación para evento ${eventType}:`, error.message);
      return null;
    }
  }

  /**
   * Personalizar mensaje según datos del evento
   * @param {string} message - Mensaje base
   * @param {Object} eventData - Datos del evento
   * @returns {string} Mensaje personalizado
   */
  personalizeMessage(message, eventData) {
    let personalized = message;

    // Reemplazar placeholders con datos reales
    const placeholders = {
      '{{courseTitle}}': eventData.courseTitle || eventData.title,
      '{{certificateTitle}}': eventData.title,
      '{{jobTitle}}': eventData.jobTitle || eventData.title,
      '{{scholarshipTitle}}': eventData.title,
      '{{amount}}': eventData.amount,
      '{{tokenId}}': eventData.tokenId,
      '{{txHash}}': eventData.txHash,
      '{{score}}': eventData.score,
      '{{instructor}}': eventData.instructor,
      '{{company}}': eventData.company,
      '{{proposalTitle}}': eventData.title
    };

    Object.entries(placeholders).forEach(([placeholder, value]) => {
      if (value) {
        personalized = personalized.replace(placeholder, value);
      }
    });

    return personalized;
  }

  /**
   * Enviar múltiples notificaciones
   * @param {Array} notifications - Lista de notificaciones
   * @returns {Array} Resultados
   */
  async sendNotifications(notifications) {
    const results = [];

    for (const notification of notifications) {
      try {
        const result = await notificationManager.sendNotification(
          {
            type: notification.type,
            recipient: notification.recipient,
            channels: notification.channels
          },
          notification.channels,
          {
            title: notification.title,
            message: notification.message,
            priority: notification.priority,
            category: notification.category,
            ...notification.data
          }
        );

        results.push({
          notificationId: notification.id,
          recipient: notification.recipient,
          success: result.success,
          results: result.results
        });

        notification.status = result.success ? 'sent' : 'failed';

      } catch (error) {
        this.logger.error(`Error enviando notificación ${notification.id}:`, error.message);
        results.push({
          notificationId: notification.id,
          recipient: notification.recipient,
          success: false,
          error: error.message
        });
        notification.status = 'failed';
      }
    }

    return results;
  }

  /**
   * Obtener holders de tokens de gobernanza
   * @returns {Array} Lista de direcciones
   */
  async getGovernanceTokenHolders() {
    try {
      // Implementar lógica para obtener holders de tokens de gobernanza
      // Por ahora, retornar una lista vacía
      return [];
    } catch (error) {
      this.logger.error('Error obteniendo holders de gobernanza:', error.message);
      return [];
    }
  }

  /**
   * Configurar notificación para evento blockchain
   * @param {string} eventType - Tipo de evento
   * @param {Object} config - Configuración
   */
  configureBlockchainNotification(eventType, config) {
    this.blockchainNotifications.set(eventType, {
      ...this.blockchainNotifications.get(eventType),
      ...config
    });

    this.logger.info(`Notificación blockchain configurada: ${eventType}`);
  }

  /**
   * Deshabilitar notificaciones para evento
   * @param {string} eventType - Tipo de evento
   */
  disableBlockchainNotification(eventType) {
    const config = this.blockchainNotifications.get(eventType);
    if (config) {
      config.enabled = false;
      this.logger.info(`Notificaciones deshabilitadas para: ${eventType}`);
    }
  }

  /**
   * Habilitar notificaciones para evento
   * @param {string} eventType - Tipo de evento
   */
  enableBlockchainNotification(eventType) {
    const config = this.blockchainNotifications.get(eventType);
    if (config) {
      config.enabled = true;
      this.logger.info(`Notificaciones habilitadas para: ${eventType}`);
    }
  }

  /**
   * Obtener estadísticas de notificaciones avanzadas
   * @returns {Object} Estadísticas
   */
  getStats() {
    const stats = {
      totalTemplates: this.notificationTemplates.size,
      blockchainEvents: this.blockchainNotifications.size,
      enabledEvents: Array.from(this.blockchainNotifications.values()).filter(c => c.enabled).length,
      queueSize: this.notificationQueue.length,
      isProcessing: this.isProcessing
    };

    // Contar por categoría
    const categoryCounts = {};
    for (const template of this.notificationTemplates.values()) {
      categoryCounts[template.category] = (categoryCounts[template.category] || 0) + 1;
    }
    stats.categoryCounts = categoryCounts;

    return stats;
  }

  /**
   * Limpiar notificaciones antiguas
   * @param {number} maxAge - Edad máxima en milisegundos
   */
  cleanupOldNotifications(maxAge = 30 * 24 * 60 * 60 * 1000) { // 30 días
    const now = Date.now();
    let cleaned = 0;

    // Limpiar cola de notificaciones
    this.notificationQueue = this.notificationQueue.filter(notification => {
      if ((now - notification.createdAt.getTime()) > maxAge) {
        cleaned++;
        return false;
      }
      return true;
    });

    if (cleaned > 0) {
      this.logger.info(`Notificaciones antiguas limpiadas: ${cleaned}`);
    }

    return cleaned;
  }
}

// Instancia singleton
const advancedNotificationManager = new AdvancedNotificationManager();

module.exports = advancedNotificationManager;
