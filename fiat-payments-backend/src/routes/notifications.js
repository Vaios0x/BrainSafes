const express = require('express');
const router = express.Router();
const notificationManager = require('../services/notificationManager');
const Notification = require('../models/Notification');

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Obtener notificaciones de un usuario
 *     description: Obtiene todas las notificaciones de un usuario específico
 *     tags: [Notifications]
 *     parameters:
 *       - in: query
 *         name: wallet
 *         required: true
 *         schema:
 *           type: string
 *         description: Dirección de wallet del usuario
 *       - in: query
 *         name: unreadOnly
 *         schema:
 *           type: boolean
 *         description: Solo notificaciones no leídas
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filtrar por tipo de notificación
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Límite de notificaciones a retornar
 *     responses:
 *       200:
 *         description: Notificaciones obtenidas exitosamente
 */
router.get('/', async (req, res) => {
  try {
    const { wallet, unreadOnly, type, limit = 50 } = req.query;
    
    if (!wallet) {
      return res.status(400).json({ 
        success: false, 
        error: 'Wallet requerida' 
      });
    }

    let query = { wallet: wallet.toLowerCase() };
    
    if (unreadOnly === 'true') {
      query.read = false;
    }
    
    if (type) {
      query.type = type;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: notifications
    });

  } catch (error) {
    console.error('Error obteniendo notificaciones:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error consultando notificaciones' 
    });
  }
});

/**
 * @swagger
 * /api/notifications/send:
 *   post:
 *     summary: Enviar notificación
 *     description: Envía una notificación a través de múltiples canales
 *     tags: [Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - recipient
 *             properties:
 *               type:
 *                 type: string
 *                 description: Tipo de notificación (welcome, course_enrolled, certificate_issued, etc.)
 *               recipient:
 *                 type: string
 *                 description: Destinatario (email, wallet, phone)
 *               channels:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [email, push, sms, in-app]
 *                 default: [email]
 *                 description: Canales a usar
 *               data:
 *                 type: object
 *                 description: Datos para el template
 *     responses:
 *       200:
 *         description: Notificación enviada exitosamente
 */
router.post('/send', async (req, res) => {
  try {
    const { type, recipient, channels = ['email'], data = {} } = req.body;
    
    if (!type || !recipient) {
      return res.status(400).json({ 
        success: false, 
        error: 'Tipo y destinatario requeridos' 
      });
    }

    const notification = {
      type,
      recipient,
      channels,
      data
    };

    const result = await notificationManager.sendNotification(notification, channels, data);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error enviando notificación:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/notifications/in-app:
 *   get:
 *     summary: Obtener notificaciones in-app
 *     description: Obtiene notificaciones in-app de un usuario
 *     tags: [Notifications]
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario
 *       - in: query
 *         name: unreadOnly
 *         schema:
 *           type: boolean
 *         description: Solo notificaciones no leídas
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filtrar por tipo
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Límite de notificaciones
 *     responses:
 *       200:
 *         description: Notificaciones in-app obtenidas exitosamente
 */
router.get('/in-app', async (req, res) => {
  try {
    const { userId, unreadOnly, type, limit = 20 } = req.query;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        error: 'ID de usuario requerido' 
      });
    }

    const options = {};
    if (unreadOnly === 'true') options.unreadOnly = true;
    if (type) options.type = type;
    if (limit) options.limit = parseInt(limit);

    const notifications = notificationManager.getInAppNotifications(userId, options);

    res.json({
      success: true,
      data: notifications
    });

  } catch (error) {
    console.error('Error obteniendo notificaciones in-app:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/notifications/mark-read:
 *   post:
 *     summary: Marcar notificación como leída
 *     description: Marca una notificación específica como leída
 *     tags: [Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - notificationId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID del usuario
 *               notificationId:
 *                 type: string
 *                 description: ID de la notificación
 *     responses:
 *       200:
 *         description: Notificación marcada como leída exitosamente
 */
router.post('/mark-read', async (req, res) => {
  try {
    const { userId, notificationId } = req.body;
    
    if (!userId || !notificationId) {
      return res.status(400).json({ 
        success: false, 
        error: 'ID de usuario y notificación requeridos' 
      });
    }

    // Marcar como leída en el sistema in-app
    notificationManager.markAsRead(userId, notificationId);

    // Marcar como leída en la base de datos
    await Notification.findOneAndUpdate(
      { _id: notificationId, wallet: userId.toLowerCase() },
      { read: true }
    );

    res.json({
      success: true,
      message: 'Notificación marcada como leída'
    });

  } catch (error) {
    console.error('Error marcando notificación como leída:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/notifications/mark-all-read:
 *   post:
 *     summary: Marcar todas las notificaciones como leídas
 *     description: Marca todas las notificaciones de un usuario como leídas
 *     tags: [Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID del usuario
 *     responses:
 *       200:
 *         description: Todas las notificaciones marcadas como leídas
 */
router.post('/mark-all-read', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        error: 'ID de usuario requerido' 
      });
    }

    // Marcar todas como leídas en el sistema in-app
    notificationManager.markAllAsRead(userId);

    // Marcar todas como leídas en la base de datos
    await Notification.updateMany(
      { wallet: userId.toLowerCase() },
      { read: true }
    );

    res.json({
      success: true,
      message: 'Todas las notificaciones marcadas como leídas'
    });

  } catch (error) {
    console.error('Error marcando todas las notificaciones como leídas:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/notifications/{notificationId}:
 *   delete:
 *     summary: Eliminar notificación
 *     description: Elimina una notificación específica
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la notificación
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID del usuario
 *     responses:
 *       200:
 *         description: Notificación eliminada exitosamente
 */
router.delete('/:notificationId', async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        error: 'ID de usuario requerido' 
      });
    }

    // Eliminar del sistema in-app
    notificationManager.deleteNotification(userId, notificationId);

    // Eliminar de la base de datos
    await Notification.findOneAndDelete({
      _id: notificationId,
      wallet: userId.toLowerCase()
    });

    res.json({
      success: true,
      message: 'Notificación eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error eliminando notificación:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/notifications/subscribe-push:
 *   post:
 *     summary: Suscribirse a notificaciones push
 *     description: Registra una suscripción para notificaciones push
 *     tags: [Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - subscription
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID del usuario
 *               subscription:
 *                 type: object
 *                 description: Objeto de suscripción push
 *     responses:
 *       200:
 *         description: Suscripción registrada exitosamente
 */
router.post('/subscribe-push', async (req, res) => {
  try {
    const { userId, subscription } = req.body;
    
    if (!userId || !subscription) {
      return res.status(400).json({ 
        success: false, 
        error: 'ID de usuario y suscripción requeridos' 
      });
    }

    // Aquí podrías guardar la suscripción en la base de datos
    // Por ahora, solo validamos que la suscripción sea válida
    
    if (!subscription.endpoint || !subscription.keys) {
      return res.status(400).json({ 
        success: false, 
        error: 'Suscripción push inválida' 
      });
    }

    res.json({
      success: true,
      message: 'Suscripción push registrada exitosamente'
    });

  } catch (error) {
    console.error('Error registrando suscripción push:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/notifications/templates:
 *   get:
 *     summary: Obtener templates disponibles
 *     description: Obtiene la lista de templates de notificación disponibles
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: Templates obtenidos exitosamente
 */
router.get('/templates', async (req, res) => {
  try {
    const templates = Array.from(notificationManager.templates.keys());
    
    res.json({
      success: true,
      data: templates
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
 * /api/notifications/stats:
 *   get:
 *     summary: Obtener estadísticas de notificaciones
 *     description: Obtiene estadísticas del sistema de notificaciones
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: Estadísticas obtenidas exitosamente
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = notificationManager.getStats();
    
    // Agregar estadísticas de la base de datos
    const totalNotifications = await Notification.countDocuments();
    const unreadNotifications = await Notification.countDocuments({ read: false });
    
    stats.database = {
      totalNotifications,
      unreadNotifications
    };

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
 * /api/notifications/bulk:
 *   post:
 *     summary: Enviar notificaciones en lote
 *     description: Envía múltiples notificaciones en una sola operación
 *     tags: [Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - notifications
 *             properties:
 *               notifications:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                     recipient:
 *                       type: string
 *                     channels:
 *                       type: array
 *                       items:
 *                         type: string
 *                     data:
 *                       type: object
 *     responses:
 *       200:
 *         description: Notificaciones enviadas exitosamente
 */
router.post('/bulk', async (req, res) => {
  try {
    const { notifications } = req.body;
    
    if (!notifications || !Array.isArray(notifications)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Array de notificaciones requerido' 
      });
    }

    const results = [];
    
    for (const notification of notifications) {
      try {
        const { type, recipient, channels = ['email'], data = {} } = notification;
        
        if (!type || !recipient) {
          results.push({
            recipient,
            success: false,
            error: 'Tipo y destinatario requeridos'
          });
          continue;
        }

        const result = await notificationManager.sendNotification(
          { type, recipient, channels, data },
          channels,
          data
        );

        results.push({
          recipient,
          success: result.success,
          results: result.results
        });

      } catch (error) {
        results.push({
          recipient: notification.recipient,
          success: false,
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    res.json({
      success: true,
      data: {
        total: notifications.length,
        success: successCount,
        failure: failureCount,
        results
      }
    });

  } catch (error) {
    console.error('Error enviando notificaciones en lote:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/notifications/cleanup:
 *   post:
 *     summary: Limpiar notificaciones antiguas
 *     description: Elimina notificaciones antiguas del sistema
 *     tags: [Notifications]
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
    
    // Limpiar del sistema in-app
    const inAppCleaned = notificationManager.cleanupOldNotifications(maxAge);
    
    // Limpiar de la base de datos
    const cutoffDate = new Date(Date.now() - maxAge);
    const dbResult = await Notification.deleteMany({
      createdAt: { $lt: cutoffDate }
    });

    res.json({
      success: true,
      data: {
        inAppCleaned,
        databaseCleaned: dbResult.deletedCount,
        totalCleaned: inAppCleaned + dbResult.deletedCount
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

module.exports = router; 