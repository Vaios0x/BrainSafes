require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./api/swagger.json');
const Sentry = require('@sentry/node');
const prometheusMiddleware = require('express-prometheus-middleware');
const winston = require('winston');
const expressWinston = require('express-winston');

// Importar managers
const securityManager = require('./middleware/security');
const advancedSecurityManager = require('./middleware/advancedSecurity');
const webhookManager = require('./services/webhookManager');
const blockchainEventListener = require('./services/blockchainEventListener');
const ipfsManager = require('./services/ipfsManager');
const notificationManager = require('./services/notificationManager');
const analyticsManager = require('./services/analyticsManager');
const advancedAnalyticsManager = require('./services/advancedAnalyticsManager');

const app = express();
const PORT = process.env.PORT || 4000;

// Seguridad básica
app.disable('x-powered-by');

// Aplicar middleware de seguridad avanzado
app.use(advancedSecurityManager.getAdvancedSecurityMiddleware());

// Middlewares adicionales
app.use(morgan('dev'));
// bodyParser.json solo para rutas que no sean /api/payments/webhook
app.use((req, res, next) => {
  if (req.originalUrl === '/api/payments/webhook') {
    next();
  } else {
    bodyParser.json()(req, res, next);
  }
});
app.use(bodyParser.urlencoded({ extended: true }));

// Rutas base (placeholder)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Fiat Payments Backend running' });
});

// Importar rutas de pagos y KYC (se crearán después)
const paymentRoutes = require('./routes/payments');
app.use('/api/payments', paymentRoutes);

const onrampRoutes = require('./routes/onramp');
app.use('/api/onramp', onrampRoutes);

const userRoutes = require('./routes/user');
app.use('/api/user', userRoutes);

const kycRoutes = require('./routes/kyc');
app.use('/api/kyc', kycRoutes);

// Importar rutas
const contractsRoutes = require('./routes/contracts');
const ipfsRoutes = require('./api/ipfs');
const ipfsMetadataRoutes = require('./routes/ipfsMetadata');
const nftRoutes = require('./api/nft');
const notificationsRoutes = require('./routes/notifications');
const advancedNotificationsRoutes = require('./routes/advancedNotifications');
const rolesRoutes = require('./routes/roles');
const webhooksRoutes = require('./routes/webhooks');
const blockchainWebhooksRoutes = require('./routes/blockchainWebhooks');
const analyticsRoutes = require('./routes/analytics');

// Aplicar rate limiting específico a rutas sensibles
app.use('/api/contracts', advancedSecurityManager.getRateLimiter('contracts'), contractsRoutes);
app.use('/api/ipfs', advancedSecurityManager.getRateLimiter('ipfs'), ipfsRoutes);
app.use('/api/ipfs-metadata', advancedSecurityManager.getRateLimiter('ipfs'), ipfsMetadataRoutes);
app.use('/api/nft', nftRoutes);
app.use('/api/notifications', advancedSecurityManager.getRateLimiter('notifications'), notificationsRoutes);
app.use('/api/advanced-notifications', advancedSecurityManager.getRateLimiter('notifications'), advancedNotificationsRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/webhooks', webhooksRoutes);
app.use('/api/blockchain-webhooks', blockchainWebhooksRoutes);
app.use('/api/analytics', analyticsRoutes);

// Rutas de analytics avanzado
const advancedAnalyticsRoutes = require('./routes/advancedAnalytics');
app.use('/api/advanced-analytics', advancedSecurityManager.getRateLimiter('global'), advancedAnalyticsRoutes);

app.use(Sentry.Handlers.requestHandler());
app.use(prometheusMiddleware({
  metricsPath: '/metrics',
  collectDefaultMetrics: true,
}));
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ],
});

app.use(expressWinston.logger({
  winstonInstance: logger,
  meta: true,
  msg: "HTTP {{req.method}} {{req.url}} {{res.statusCode}} {{res.responseTime}}ms",
  colorize: false,
}));

// Manejo de errores global
app.use(expressWinston.errorLogger({ winstonInstance: logger }));
app.use((err, req, res, next) => {
  logger.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Inicializar servicios
async function initializeServices() {
  try {
    // Inicializar blockchain event listener
    await blockchainEventListener.startListening();
    
    // Configurar alertas de analytics básico
    analyticsManager.configureAlert('high_error_rate', {
      metric: 'performance.error_rate',
      condition: 'gt',
      threshold: 5,
      message: 'Tasa de errores alta detectada',
      channels: ['email', 'in-app']
    });

    analyticsManager.configureAlert('low_uptime', {
      metric: 'performance.uptime',
      condition: 'lt',
      threshold: 95,
      message: 'Uptime del sistema bajo',
      channels: ['email', 'sms']
    });

    // Configurar alertas de analytics avanzado
    advancedAnalyticsManager.configureAlert('performance_anomaly', {
      metric: 'performance.response_time_p95',
      condition: 'gt',
      threshold: 2000,
      message: 'Anomalía de performance detectada',
      channels: ['email', 'in-app', 'slack']
    });

    advancedAnalyticsManager.configureAlert('blockchain_anomaly', {
      metric: 'blockchain.gas_usage.average',
      condition: 'gt',
      threshold: 500000,
      message: 'Uso de gas anormalmente alto',
      channels: ['email', 'telegram']
    });

    advancedAnalyticsManager.configureAlert('ai_anomaly', {
      metric: 'ai.prediction_accuracy.overall',
      condition: 'lt',
      threshold: 70,
      message: 'Precisión de IA por debajo del umbral',
      channels: ['email', 'in-app']
    });

    console.log('✅ Servicios inicializados correctamente');
  } catch (error) {
    console.error('❌ Error inicializando servicios:', error);
  }
}

// Inicializar y arrancar servidor
async function startServer() {
  await initializeServices();
  
  app.listen(PORT, () => {
    console.log(`🚀 BrainSafes Backend ejecutándose en puerto ${PORT}`);
    console.log(`📊 Analytics: http://localhost:${PORT}/api/analytics`);
    console.log(`🔗 Webhooks: http://localhost:${PORT}/api/webhooks`);
    console.log(`📚 Documentación: http://localhost:${PORT}/api/docs`);
  });
}

startServer(); 