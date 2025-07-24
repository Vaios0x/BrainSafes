const express = require('express');
const router = express.Router();
const { setKYC } = require('../services/user');

router.post('/sumsub/webhook', async (req, res) => {
  try {
    const event = req.body;
    // Extrae wallet y status del evento (ajustar según proveedor)
    const wallet = event.externalUserId;
    const status = event.reviewResult && event.reviewResult.reviewAnswer === 'GREEN' ? 'approved' : 'rejected';
    const kycId = event.applicantId;
    await setKYC(wallet, status, 'sumsub', kycId);
    res.status(200).json({ received: true });
  } catch (err) {
    res.status(500).json({ error: 'Error procesando webhook KYC' });
  }
});

module.exports = router; 