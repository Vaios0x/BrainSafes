const express = require('express');
const router = express.Router();
const { mintOnRampNFT } = require('../services/nft');
const { setPremium } = require('../services/user');

router.post('/moonpay/webhook', async (req, res) => {
  try {
    const event = req.body;
    if (event.type === 'transaction_updated' && event.data.status === 'completed') {
      const wallet = event.data.walletAddress;
      const txHash = event.data.cryptoTransactionId;
      // 1. Registrar la compra (simulado con log)
      console.log(`Compra on-ramp registrada: wallet=${wallet}, txHash=${txHash}`);
      // 2. Emitir NFT/certificado
      try {
        await mintOnRampNFT(wallet, txHash, 'moonpay');
        await setPremium(wallet, 'onramp', txHash);
      } catch (err) {
        console.error('Error emitiendo NFT o marcando premium tras on-ramp:', err);
      }
      // 3. (Opcional) Marcar usuario como premium en tu DB
      // 4. (Opcional) Notificar al usuario
    }
    res.status(200).json({ received: true });
  } catch (err) {
    console.error('Error en webhook MoonPay:', err);
    res.status(500).json({ error: 'Error procesando webhook' });
  }
});

module.exports = router; 