const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const { mintFiatUser } = require('../services/blockchain');
const { setPremium } = require('../services/user');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * @route POST /api/payments/create-payment-intent
 * @desc Crea un PaymentIntent de Stripe para pagos fiat
 * @body { amount: number, currency: string, metadata: object }
 * @returns { clientSecret }
 */
router.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency, metadata } = req.body;
    if (!amount || !currency) {
      return res.status(400).json({ error: 'amount y currency son requeridos' });
    }
    // Validación de amount y currency (seguridad básica)
    if (amount < 100) {
      return res.status(400).json({ error: 'El monto mínimo es 1.00 (en la moneda seleccionada)' });
    }
    // Crear PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.floor(amount), // Stripe espera el monto en la unidad más pequeña (ej: centavos)
      currency,
      metadata: metadata || {},
      // Puedes agregar receipt_email, description, etc.
      automatic_payment_methods: { enabled: true },
    });
    return res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error('Error creando PaymentIntent:', err);
    return res.status(500).json({ error: 'Error creando PaymentIntent' });
  }
});

/**
 * @route POST /api/payments/webhook
 * @desc Webhook de Stripe para eventos de pago
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = Stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Manejar eventos relevantes
  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object;
      // Extraer la wallet del usuario de los metadatos
      const userWallet = paymentIntent.metadata && paymentIntent.metadata.wallet;
      const amount = paymentIntent.amount;
      const paymentId = paymentIntent.id;
      if (userWallet) {
        try {
          await mintFiatUser(userWallet, amount, paymentId);
          await setPremium(userWallet, 'fiat', paymentId);
        } catch (err) {
          console.error('Error emitiendo token tras pago fiat o marcando premium:', err);
        }
      } else {
        console.warn('No se encontró wallet en metadata del PaymentIntent');
      }
      console.log('Pago FIAT confirmado:', paymentIntent.id, paymentIntent.amount);
      break;
    }
    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object;
      console.warn('Pago FIAT fallido:', paymentIntent.id);
      break;
    }
    // Puedes manejar más eventos según necesidad
    default:
      console.log(`Evento recibido: ${event.type}`);
  }

  res.status(200).json({ received: true });
});

module.exports = router; 