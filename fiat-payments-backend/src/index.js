require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const bodyParser = require('body-parser');

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

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Fiat Payments Backend listening on port ${PORT}`);
}); 