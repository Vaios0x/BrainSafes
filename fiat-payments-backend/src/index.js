require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./api/swagger.json');
const Sentry = require('@sentry/node');
const prometheusMiddleware = require('express-prometheus-middleware');
const winston = require('winston');
const expressWinston = require('express-winston');

const app = express();
const PORT = process.env.PORT || 4000;

// Seguridad básica
app.disable('x-powered-by');

// Middlewares
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
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

const ipfsRoutes = require('./api/ipfs');
app.use('/api/ipfs', ipfsRoutes);

const nftRoutes = require('./api/nft');
app.use('/api/nft', nftRoutes);

const notificationsRoutes = require('./routes/notifications');
app.use('/api/notifications', notificationsRoutes);

const rolesRoutes = require('./routes/roles');
app.use('/api/roles', rolesRoutes);

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

app.listen(PORT, () => {
  console.log(`Fiat Payments Backend listening on port ${PORT}`);
}); 