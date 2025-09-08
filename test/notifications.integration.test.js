const { expect } = require('chai');
const axios = require('axios');

describe('Notifications Integration Tests', () => {
  const BASE_URL = process.env.TEST_API_URL || 'http://localhost:4000';
  const apiClient = axios.create({ baseURL: BASE_URL });

  const testWallet = '0x1234567890123456789012345678901234567890';
  const testUserId = testWallet.toLowerCase();

  // Datos de prueba
  const testNotification = {
    type: 'welcome',
    recipient: 'test@example.com',
    channels: ['email', 'in-app'],
    data: {
      name: 'Test User',
      walletAddress: testWallet
    }
  };

  const testBulkNotifications = [
    {
      type: 'course_enrolled',
      recipient: 'user1@example.com',
      channels: ['email'],
      data: { courseTitle: 'Test Course 1' }
    },
    {
      type: 'certificate_issued',
      recipient: 'user2@example.com',
      channels: ['email', 'push'],
      data: { certificateTitle: 'Test Certificate' }
    }
  ];

  describe('GET /api/notifications', () => {
    it('should get notifications for a wallet', async () => {
      const response = await apiClient.get('/api/notifications', {
        params: { wallet: testWallet }
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data).to.be.an('array');
    });

    it('should get unread notifications only', async () => {
      const response = await apiClient.get('/api/notifications', {
        params: { 
          wallet: testWallet,
          unreadOnly: 'true'
        }
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data).to.be.an('array');
      
      // Verificar que todas las notificaciones son no leídas
      response.data.data.forEach(notification => {
        expect(notification.read).to.be.false;
      });
    });

    it('should filter notifications by type', async () => {
      const response = await apiClient.get('/api/notifications', {
        params: { 
          wallet: testWallet,
          type: 'welcome'
        }
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data).to.be.an('array');
      
      // Verificar que todas las notificaciones son del tipo especificado
      response.data.data.forEach(notification => {
        expect(notification.type).to.equal('welcome');
      });
    });

    it('should limit notifications', async () => {
      const limit = 5;
      const response = await apiClient.get('/api/notifications', {
        params: { 
          wallet: testWallet,
          limit: limit.toString()
        }
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data).to.be.an('array');
      expect(response.data.data.length).to.be.at.most(limit);
    });

    it('should reject request without wallet', async () => {
      try {
        await apiClient.get('/api/notifications');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(400);
        expect(error.response.data.success).to.be.false;
        expect(error.response.data.error).to.include('Wallet requerida');
      }
    });
  });

  describe('POST /api/notifications/send', () => {
    it('should send notification successfully', async () => {
      const response = await apiClient.post('/api/notifications/send', testNotification);

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data).to.have.property('success');
      expect(response.data.data).to.have.property('results');
      expect(response.data.data.results).to.be.an('array');
    });

    it('should send notification with multiple channels', async () => {
      const notification = {
        ...testNotification,
        channels: ['email', 'push', 'sms', 'in-app']
      };

      const response = await apiClient.post('/api/notifications/send', notification);

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data.results).to.have.length(4);
    });

    it('should reject notification without type', async () => {
      const invalidNotification = {
        recipient: 'test@example.com',
        channels: ['email']
      };

      try {
        await apiClient.post('/api/notifications/send', invalidNotification);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(400);
        expect(error.response.data.success).to.be.false;
        expect(error.response.data.error).to.include('Tipo y destinatario requeridos');
      }
    });

    it('should reject notification without recipient', async () => {
      const invalidNotification = {
        type: 'welcome',
        channels: ['email']
      };

      try {
        await apiClient.post('/api/notifications/send', invalidNotification);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(400);
        expect(error.response.data.success).to.be.false;
        expect(error.response.data.error).to.include('Tipo y destinatario requeridos');
      }
    });
  });

  describe('GET /api/notifications/in-app', () => {
    it('should get in-app notifications', async () => {
      const response = await apiClient.get('/api/notifications/in-app', {
        params: { userId: testUserId }
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data).to.be.an('array');
    });

    it('should filter in-app notifications by unread status', async () => {
      const response = await apiClient.get('/api/notifications/in-app', {
        params: { 
          userId: testUserId,
          unreadOnly: 'true'
        }
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data).to.be.an('array');
    });

    it('should filter in-app notifications by type', async () => {
      const response = await apiClient.get('/api/notifications/in-app', {
        params: { 
          userId: testUserId,
          type: 'welcome'
        }
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data).to.be.an('array');
    });

    it('should limit in-app notifications', async () => {
      const limit = 10;
      const response = await apiClient.get('/api/notifications/in-app', {
        params: { 
          userId: testUserId,
          limit: limit.toString()
        }
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data).to.be.an('array');
      expect(response.data.data.length).to.be.at.most(limit);
    });

    it('should reject request without userId', async () => {
      try {
        await apiClient.get('/api/notifications/in-app');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(400);
        expect(error.response.data.success).to.be.false;
        expect(error.response.data.error).to.include('ID de usuario requerido');
      }
    });
  });

  describe('POST /api/notifications/mark-read', () => {
    let testNotificationId;

    before(async () => {
      // Crear una notificación de prueba
      const response = await apiClient.post('/api/notifications/send', {
        ...testNotification,
        channels: ['in-app']
      });
      
      // Obtener las notificaciones in-app para obtener un ID
      const notificationsResponse = await apiClient.get('/api/notifications/in-app', {
        params: { userId: testUserId }
      });
      
      if (notificationsResponse.data.data.length > 0) {
        testNotificationId = notificationsResponse.data.data[0].id;
      }
    });

    it('should mark notification as read', async () => {
      if (!testNotificationId) {
        this.skip();
        return;
      }

      const response = await apiClient.post('/api/notifications/mark-read', {
        userId: testUserId,
        notificationId: testNotificationId
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.message).to.include('marcada como leída');
    });

    it('should reject marking read without userId', async () => {
      try {
        await apiClient.post('/api/notifications/mark-read', {
          notificationId: 'test-id'
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(400);
        expect(error.response.data.success).to.be.false;
        expect(error.response.data.error).to.include('ID de usuario y notificación requeridos');
      }
    });

    it('should reject marking read without notificationId', async () => {
      try {
        await apiClient.post('/api/notifications/mark-read', {
          userId: testUserId
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(400);
        expect(error.response.data.success).to.be.false;
        expect(error.response.data.error).to.include('ID de usuario y notificación requeridos');
      }
    });
  });

  describe('POST /api/notifications/mark-all-read', () => {
    it('should mark all notifications as read', async () => {
      const response = await apiClient.post('/api/notifications/mark-all-read', {
        userId: testUserId
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.message).to.include('marcadas como leídas');
    });

    it('should reject marking all read without userId', async () => {
      try {
        await apiClient.post('/api/notifications/mark-all-read', {});
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(400);
        expect(error.response.data.success).to.be.false;
        expect(error.response.data.error).to.include('ID de usuario requerido');
      }
    });
  });

  describe('DELETE /api/notifications/{notificationId}', () => {
    let testNotificationId;

    before(async () => {
      // Crear una notificación de prueba
      const response = await apiClient.post('/api/notifications/send', {
        ...testNotification,
        channels: ['in-app']
      });
      
      // Obtener las notificaciones in-app para obtener un ID
      const notificationsResponse = await apiClient.get('/api/notifications/in-app', {
        params: { userId: testUserId }
      });
      
      if (notificationsResponse.data.data.length > 0) {
        testNotificationId = notificationsResponse.data.data[0].id;
      }
    });

    it('should delete notification', async () => {
      if (!testNotificationId) {
        this.skip();
        return;
      }

      const response = await apiClient.delete(`/api/notifications/${testNotificationId}`, {
        data: { userId: testUserId }
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.message).to.include('eliminada exitosamente');
    });

    it('should reject deletion without userId', async () => {
      try {
        await apiClient.delete('/api/notifications/test-id');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(400);
        expect(error.response.data.success).to.be.false;
        expect(error.response.data.error).to.include('ID de usuario requerido');
      }
    });
  });

  describe('POST /api/notifications/subscribe-push', () => {
    it('should register push subscription', async () => {
      const subscription = {
        endpoint: 'https://fcm.googleapis.com/fcm/send/test-token',
        keys: {
          p256dh: 'test-p256dh-key',
          auth: 'test-auth-key'
        }
      };

      const response = await apiClient.post('/api/notifications/subscribe-push', {
        userId: testUserId,
        subscription
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.message).to.include('registrada exitosamente');
    });

    it('should reject invalid push subscription', async () => {
      const invalidSubscription = {
        endpoint: 'invalid-endpoint'
        // Missing keys
      };

      try {
        await apiClient.post('/api/notifications/subscribe-push', {
          userId: testUserId,
          subscription: invalidSubscription
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(400);
        expect(error.response.data.success).to.be.false;
        expect(error.response.data.error).to.include('Suscripción push inválida');
      }
    });

    it('should reject subscription without userId', async () => {
      try {
        await apiClient.post('/api/notifications/subscribe-push', {
          subscription: { endpoint: 'test', keys: {} }
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(400);
        expect(error.response.data.success).to.be.false;
        expect(error.response.data.error).to.include('ID de usuario y suscripción requeridos');
      }
    });
  });

  describe('GET /api/notifications/templates', () => {
    it('should get available templates', async () => {
      const response = await apiClient.get('/api/notifications/templates');

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data).to.be.an('array');
      expect(response.data.data.length).to.be.greaterThan(0);
      
      // Verificar que hay templates para diferentes canales
      const emailTemplates = response.data.data.filter(t => t.startsWith('email.'));
      const pushTemplates = response.data.data.filter(t => t.startsWith('push.'));
      const smsTemplates = response.data.data.filter(t => t.startsWith('sms.'));
      const inAppTemplates = response.data.data.filter(t => t.startsWith('in-app.'));

      expect(emailTemplates.length).to.be.greaterThan(0);
      expect(inAppTemplates.length).to.be.greaterThan(0);
    });
  });

  describe('GET /api/notifications/stats', () => {
    it('should get notification statistics', async () => {
      const response = await apiClient.get('/api/notifications/stats');

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data).to.have.property('channels');
      expect(response.data.data).to.have.property('templates');
      expect(response.data.data).to.have.property('queueSize');
      expect(response.data.data).to.have.property('isProcessing');
      expect(response.data.data).to.have.property('inApp');
      expect(response.data.data).to.have.property('database');
      
      expect(response.data.data.channels).to.be.an('array');
      expect(response.data.data.templates).to.be.a('number');
      expect(response.data.data.inApp).to.have.property('totalNotifications');
      expect(response.data.data.inApp).to.have.property('unreadNotifications');
      expect(response.data.data.inApp).to.have.property('users');
      expect(response.data.data.database).to.have.property('totalNotifications');
      expect(response.data.data.database).to.have.property('unreadNotifications');
    });
  });

  describe('POST /api/notifications/bulk', () => {
    it('should send bulk notifications', async () => {
      const response = await apiClient.post('/api/notifications/bulk', {
        notifications: testBulkNotifications
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data).to.have.property('total', 2);
      expect(response.data.data).to.have.property('success');
      expect(response.data.data).to.have.property('failure');
      expect(response.data.data).to.have.property('results');
      expect(response.data.data.results).to.have.length(2);
    });

    it('should handle partial failures in bulk send', async () => {
      const mixedNotifications = [
        {
          type: 'welcome',
          recipient: 'valid@example.com',
          channels: ['email']
        },
        {
          // Missing required fields
          recipient: 'invalid@example.com'
        }
      ];

      const response = await apiClient.post('/api/notifications/bulk', {
        notifications: mixedNotifications
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data.total).to.equal(2);
      expect(response.data.data.success).to.equal(1);
      expect(response.data.data.failure).to.equal(1);
    });

    it('should reject bulk send without notifications array', async () => {
      try {
        await apiClient.post('/api/notifications/bulk', {});
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(400);
        expect(error.response.data.success).to.be.false;
        expect(error.response.data.error).to.include('Array de notificaciones requerido');
      }
    });

    it('should reject bulk send with invalid notifications format', async () => {
      try {
        await apiClient.post('/api/notifications/bulk', {
          notifications: 'not-an-array'
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(400);
        expect(error.response.data.success).to.be.false;
        expect(error.response.data.error).to.include('Array de notificaciones requerido');
      }
    });
  });

  describe('POST /api/notifications/cleanup', () => {
    it('should cleanup old notifications', async () => {
      const response = await apiClient.post('/api/notifications/cleanup', {
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 días
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data).to.have.property('inAppCleaned');
      expect(response.data.data).to.have.property('databaseCleaned');
      expect(response.data.data).to.have.property('totalCleaned');
      expect(response.data.data.inAppCleaned).to.be.a('number');
      expect(response.data.data.databaseCleaned).to.be.a('number');
      expect(response.data.data.totalCleaned).to.be.a('number');
    });

    it('should use default maxAge if not provided', async () => {
      const response = await apiClient.post('/api/notifications/cleanup');

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data).to.have.property('totalCleaned');
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits on notification endpoints', async () => {
      const requests = [];
      
      // Hacer múltiples requests rápidamente
      for (let i = 0; i < 10; i++) {
        requests.push(
          apiClient.post('/api/notifications/send', {
            type: 'test',
            recipient: `test${i}@example.com`,
            channels: ['email']
          }).catch(error => error)
        );
      }

      const results = await Promise.all(requests);
      const rateLimited = results.filter(result => 
        result.response && result.response.status === 429
      );

      // Al menos algunos requests deberían ser rate limited
      expect(rateLimited.length).to.be.greaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle notification service errors gracefully', async () => {
      // Simular un error enviando una notificación con tipo inválido
      try {
        await apiClient.post('/api/notifications/send', {
          type: 'invalid_type_that_does_not_exist',
          recipient: 'test@example.com',
          channels: ['email']
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(500);
        expect(error.response.data.success).to.be.false;
        expect(error.response.data.error).to.be.a('string');
      }
    });

    it('should handle database connection errors', async () => {
      // Este test simula un error de base de datos
      // En un entorno real, podrías modificar la configuración de la BD
      try {
        await apiClient.get('/api/notifications', {
          params: { wallet: 'invalid-wallet-format' }
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.be.oneOf([400, 500]);
        expect(error.response.data.success).to.be.false;
      }
    });
  });

  describe('Template Processing', () => {
    it('should process templates with data correctly', async () => {
      const notificationWithData = {
        type: 'welcome',
        recipient: 'test@example.com',
        channels: ['email'],
        data: {
          name: 'John Doe',
          walletAddress: '0x1234567890123456789012345678901234567890'
        }
      };

      const response = await apiClient.post('/api/notifications/send', notificationWithData);

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data.results).to.be.an('array');
      
      // Verificar que al menos un canal fue exitoso
      const successfulChannels = response.data.data.results.filter(r => r.success);
      expect(successfulChannels.length).to.be.greaterThan(0);
    });

    it('should handle missing template data gracefully', async () => {
      const notificationWithoutData = {
        type: 'welcome',
        recipient: 'test@example.com',
        channels: ['email']
        // No data provided
      };

      const response = await apiClient.post('/api/notifications/send', notificationWithoutData);

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      // Debería manejar la falta de datos sin fallar
    });
  });
});
