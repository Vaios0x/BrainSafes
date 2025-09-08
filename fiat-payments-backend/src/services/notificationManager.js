const nodemailer = require('nodemailer');
const webpush = require('web-push');
const twilio = require('twilio');
const winston = require('winston');
const crypto = require('crypto');

class NotificationManager {
  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/notifications.log' })
      ],
    });

    // Configuración de canales
    this.channels = new Map();
    this.templates = new Map();
    this.notificationQueue = [];
    this.isProcessing = false;

    // Inicializar canales
    this.initializeChannels();
    this.loadTemplates();
  }

  /**
   * Inicializar canales de notificación
   */
  initializeChannels() {
    // Canal de Email
    if (process.env.SMTP_HOST) {
      this.channels.set('email', {
        type: 'email',
        transporter: nodemailer.createTransporter({
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT || 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        }),
        from: process.env.SMTP_FROM || 'noreply@brainsafes.com',
        enabled: true
      });
    }

    // Canal de Push Notifications
    if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
      webpush.setVapidDetails(
        'mailto:' + (process.env.VAPID_EMAIL || 'noreply@brainsafes.com'),
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
      );

      this.channels.set('push', {
        type: 'push',
        webpush,
        enabled: true
      });
    }

    // Canal de SMS (Twilio)
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      this.channels.set('sms', {
        type: 'sms',
        client: twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN),
        from: process.env.TWILIO_PHONE_NUMBER,
        enabled: true
      });
    }

    // Canal de In-App
    this.channels.set('in-app', {
      type: 'in-app',
      enabled: true,
      storage: new Map() // Simulación de base de datos
    });

    this.logger.info(`Canales inicializados: ${Array.from(this.channels.keys()).join(', ')}`);
  }

  /**
   * Cargar templates de notificación
   */
  loadTemplates() {
    // Templates de Email
    this.templates.set('email.welcome', {
      subject: '¡Bienvenido a BrainSafes!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">¡Bienvenido a BrainSafes!</h2>
          <p>Hola {{name}},</p>
          <p>¡Gracias por unirte a nuestra plataforma de educación descentralizada!</p>
          <p>Tu cuenta ha sido creada exitosamente con la dirección: <strong>{{walletAddress}}</strong></p>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Próximos pasos:</h3>
            <ul>
              <li>Explora nuestros cursos disponibles</li>
              <li>Completa tu perfil</li>
              <li>Conecta tu wallet</li>
            </ul>
          </div>
          <p>¡Comienza tu viaje de aprendizaje!</p>
          <p>Saludos,<br>El equipo de BrainSafes</p>
        </div>
      `,
      text: `
        ¡Bienvenido a BrainSafes!
        
        Hola {{name}},
        
        ¡Gracias por unirte a nuestra plataforma de educación descentralizada!
        Tu cuenta ha sido creada exitosamente con la dirección: {{walletAddress}}
        
        Próximos pasos:
        - Explora nuestros cursos disponibles
        - Completa tu perfil
        - Conecta tu wallet
        
        ¡Comienza tu viaje de aprendizaje!
        
        Saludos,
        El equipo de BrainSafes
      `
    });

    this.templates.set('email.course_enrolled', {
      subject: 'Te has inscrito en un curso',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">¡Inscripción Exitosa!</h2>
          <p>Hola {{name}},</p>
          <p>Te has inscrito exitosamente en el curso: <strong>{{courseTitle}}</strong></p>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Detalles del curso:</h3>
            <p><strong>Instructor:</strong> {{instructor}}</p>
            <p><strong>Duración:</strong> {{duration}} días</p>
            <p><strong>Precio:</strong> {{price}} EDU</p>
          </div>
          <p>¡Comienza tu aprendizaje ahora!</p>
          <p>Saludos,<br>El equipo de BrainSafes</p>
        </div>
      `
    });

    this.templates.set('email.certificate_issued', {
      subject: '¡Tu certificado está listo!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10b981;">¡Felicidades!</h2>
          <p>Hola {{name}},</p>
          <p>Has completado exitosamente el curso: <strong>{{courseTitle}}</strong></p>
          <p>Tu certificado NFT ha sido emitido y está disponible en tu wallet.</p>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Detalles del certificado:</h3>
            <p><strong>Token ID:</strong> {{tokenId}}</p>
            <p><strong>Score:</strong> {{score}}/100</p>
            <p><strong>Fecha de emisión:</strong> {{issuedAt}}</p>
          </div>
          <p>¡Comparte tu logro en las redes sociales!</p>
          <p>Saludos,<br>El equipo de BrainSafes</p>
        </div>
      `
    });

    // Templates de Push
    this.templates.set('push.achievement', {
      title: '¡Nuevo Logro Desbloqueado!',
      body: 'Has desbloqueado el logro "{{achievementName}}" en BrainSafes',
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      data: {
        type: 'achievement',
        achievementId: '{{achievementId}}'
      }
    });

    this.templates.set('push.course_reminder', {
      title: 'Recordatorio de Curso',
      body: 'No olvides continuar con tu curso "{{courseTitle}}"',
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      data: {
        type: 'course_reminder',
        courseId: '{{courseId}}'
      }
    });

    // Templates de SMS
    this.templates.set('sms.verification', {
      body: 'Tu código de verificación de BrainSafes es: {{code}}. Válido por 10 minutos.'
    });

    this.templates.set('sms.achievement', {
      body: '¡Felicidades! Has desbloqueado el logro "{{achievementName}}" en BrainSafes.'
    });

    // Templates de In-App
    this.templates.set('in-app.welcome', {
      title: '¡Bienvenido a BrainSafes!',
      message: 'Tu cuenta ha sido creada exitosamente. ¡Comienza tu viaje de aprendizaje!',
      type: 'success',
      duration: 5000
    });

    this.templates.set('in-app.course_completed', {
      title: '¡Curso Completado!',
      message: 'Has completado exitosamente el curso "{{courseTitle}}". Tu certificado está listo.',
      type: 'success',
      duration: 8000
    });

    this.logger.info(`Templates cargados: ${this.templates.size}`);
  }

  /**
   * Enviar notificación
   * @param {Object} notification - Datos de la notificación
   * @param {Array} channels - Canales a usar
   * @param {Object} data - Datos para el template
   */
  async sendNotification(notification, channels = ['email'], data = {}) {
    try {
      this.logger.info(`Enviando notificación: ${notification.type} a ${channels.join(', ')}`);

      const promises = channels.map(channel => 
        this.sendToChannel(channel, notification, data)
      );

      const results = await Promise.allSettled(promises);
      
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const failureCount = results.filter(r => r.status === 'rejected').length;

      this.logger.info(`Notificación enviada: ${successCount} exitosas, ${failureCount} fallidas`);

      return {
        success: successCount > 0,
        results: results.map((result, index) => ({
          channel: channels[index],
          success: result.status === 'fulfilled',
          error: result.status === 'rejected' ? result.reason.message : null
        }))
      };

    } catch (error) {
      this.logger.error('Error enviando notificación:', error.message);
      throw error;
    }
  }

  /**
   * Enviar notificación a un canal específico
   * @param {string} channel - Canal a usar
   * @param {Object} notification - Datos de la notificación
   * @param {Object} data - Datos para el template
   */
  async sendToChannel(channel, notification, data) {
    const channelConfig = this.channels.get(channel);
    if (!channelConfig || !channelConfig.enabled) {
      throw new Error(`Canal ${channel} no disponible o deshabilitado`);
    }

    const template = this.templates.get(`${channel}.${notification.type}`);
    if (!template) {
      throw new Error(`Template no encontrado: ${channel}.${notification.type}`);
    }

    const processedTemplate = this.processTemplate(template, data);

    switch (channel) {
      case 'email':
        return await this.sendEmail(notification.recipient, processedTemplate);
      case 'push':
        return await this.sendPushNotification(notification.recipient, processedTemplate);
      case 'sms':
        return await this.sendSMS(notification.recipient, processedTemplate);
      case 'in-app':
        return await this.sendInAppNotification(notification.recipient, processedTemplate);
      default:
        throw new Error(`Canal no soportado: ${channel}`);
    }
  }

  /**
   * Procesar template con datos
   * @param {Object} template - Template a procesar
   * @param {Object} data - Datos para reemplazar
   * @returns {Object} Template procesado
   */
  processTemplate(template, data) {
    const processed = JSON.parse(JSON.stringify(template));
    
    const replacePlaceholders = (text) => {
      return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return data[key] || match;
      });
    };

    // Procesar campos de texto
    Object.keys(processed).forEach(key => {
      if (typeof processed[key] === 'string') {
        processed[key] = replacePlaceholders(processed[key]);
      } else if (typeof processed[key] === 'object' && processed[key] !== null) {
        // Procesar objetos anidados (como data en push notifications)
        Object.keys(processed[key]).forEach(subKey => {
          if (typeof processed[key][subKey] === 'string') {
            processed[key][subKey] = replacePlaceholders(processed[key][subKey]);
          }
        });
      }
    });

    return processed;
  }

  /**
   * Enviar email
   * @param {string} recipient - Destinatario
   * @param {Object} template - Template procesado
   */
  async sendEmail(recipient, template) {
    const channelConfig = this.channels.get('email');
    
    const mailOptions = {
      from: channelConfig.from,
      to: recipient,
      subject: template.subject,
      html: template.html,
      text: template.text
    };

    const result = await channelConfig.transporter.sendMail(mailOptions);
    this.logger.info(`Email enviado a ${recipient}: ${result.messageId}`);
    return result;
  }

  /**
   * Enviar push notification
   * @param {string} subscription - Suscripción push
   * @param {Object} template - Template procesado
   */
  async sendPushNotification(subscription, template) {
    const channelConfig = this.channels.get('push');
    
    const payload = JSON.stringify({
      title: template.title,
      body: template.body,
      icon: template.icon,
      badge: template.badge,
      data: template.data
    });

    const result = await channelConfig.webpush.sendNotification(subscription, payload);
    this.logger.info(`Push notification enviada: ${result.statusCode}`);
    return result;
  }

  /**
   * Enviar SMS
   * @param {string} phoneNumber - Número de teléfono
   * @param {Object} template - Template procesado
   */
  async sendSMS(phoneNumber, template) {
    const channelConfig = this.channels.get('sms');
    
    const result = await channelConfig.client.messages.create({
      body: template.body,
      from: channelConfig.from,
      to: phoneNumber
    });

    this.logger.info(`SMS enviado a ${phoneNumber}: ${result.sid}`);
    return result;
  }

  /**
   * Enviar notificación in-app
   * @param {string} userId - ID del usuario
   * @param {Object} template - Template procesado
   */
  async sendInAppNotification(userId, template) {
    const channelConfig = this.channels.get('in-app');
    
    const notification = {
      id: crypto.randomUUID(),
      userId,
      title: template.title,
      message: template.message,
      type: template.type,
      duration: template.duration,
      timestamp: Date.now(),
      read: false
    };

    // Simular almacenamiento en base de datos
    if (!channelConfig.storage.has(userId)) {
      channelConfig.storage.set(userId, []);
    }
    channelConfig.storage.get(userId).push(notification);

    this.logger.info(`Notificación in-app creada para ${userId}: ${notification.id}`);
    return notification;
  }

  /**
   * Obtener notificaciones in-app de un usuario
   * @param {string} userId - ID del usuario
   * @param {Object} options - Opciones de filtrado
   * @returns {Array} Notificaciones
   */
  getInAppNotifications(userId, options = {}) {
    const channelConfig = this.channels.get('in-app');
    const notifications = channelConfig.storage.get(userId) || [];

    let filtered = notifications;

    // Filtrar por leídas/no leídas
    if (options.unreadOnly) {
      filtered = filtered.filter(n => !n.read);
    }

    // Filtrar por tipo
    if (options.type) {
      filtered = filtered.filter(n => n.type === options.type);
    }

    // Ordenar por timestamp
    filtered.sort((a, b) => b.timestamp - a.timestamp);

    // Limitar resultados
    if (options.limit) {
      filtered = filtered.slice(0, options.limit);
    }

    return filtered;
  }

  /**
   * Marcar notificación como leída
   * @param {string} userId - ID del usuario
   * @param {string} notificationId - ID de la notificación
   */
  markAsRead(userId, notificationId) {
    const channelConfig = this.channels.get('in-app');
    const notifications = channelConfig.storage.get(userId) || [];
    
    const notification = notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.logger.info(`Notificación marcada como leída: ${notificationId}`);
    }
  }

  /**
   * Marcar todas las notificaciones como leídas
   * @param {string} userId - ID del usuario
   */
  markAllAsRead(userId) {
    const channelConfig = this.channels.get('in-app');
    const notifications = channelConfig.storage.get(userId) || [];
    
    notifications.forEach(n => n.read = true);
    this.logger.info(`Todas las notificaciones marcadas como leídas para ${userId}`);
  }

  /**
   * Eliminar notificación
   * @param {string} userId - ID del usuario
   * @param {string} notificationId - ID de la notificación
   */
  deleteNotification(userId, notificationId) {
    const channelConfig = this.channels.get('in-app');
    const notifications = channelConfig.storage.get(userId) || [];
    
    const index = notifications.findIndex(n => n.id === notificationId);
    if (index !== -1) {
      notifications.splice(index, 1);
      this.logger.info(`Notificación eliminada: ${notificationId}`);
    }
  }

  /**
   * Obtener estadísticas de notificaciones
   * @returns {Object} Estadísticas
   */
  getStats() {
    const stats = {
      channels: Array.from(this.channels.keys()),
      templates: this.templates.size,
      queueSize: this.notificationQueue.length,
      isProcessing: this.isProcessing
    };

    // Estadísticas de notificaciones in-app
    const inAppChannel = this.channels.get('in-app');
    if (inAppChannel) {
      let totalNotifications = 0;
      let unreadNotifications = 0;
      
      for (const notifications of inAppChannel.storage.values()) {
        totalNotifications += notifications.length;
        unreadNotifications += notifications.filter(n => !n.read).length;
      }
      
      stats.inApp = {
        totalNotifications,
        unreadNotifications,
        users: inAppChannel.storage.size
      };
    }

    return stats;
  }

  /**
   * Limpiar notificaciones antiguas
   * @param {number} maxAge - Edad máxima en milisegundos
   */
  cleanupOldNotifications(maxAge = 30 * 24 * 60 * 60 * 1000) { // 30 días
    const inAppChannel = this.channels.get('in-app');
    if (!inAppChannel) return 0;

    const now = Date.now();
    let cleaned = 0;

    for (const [userId, notifications] of inAppChannel.storage) {
      const originalLength = notifications.length;
      const filtered = notifications.filter(n => (now - n.timestamp) <= maxAge);
      
      if (filtered.length !== originalLength) {
        inAppChannel.storage.set(userId, filtered);
        cleaned += originalLength - filtered.length;
      }
    }

    if (cleaned > 0) {
      this.logger.info(`Notificaciones antiguas limpiadas: ${cleaned}`);
    }

    return cleaned;
  }
}

// Instancia singleton
const notificationManager = new NotificationManager();

module.exports = notificationManager;
