const express = require('express');
const router = express.Router();
const User = require('../models/User');

// GET /api/user/:wallet
router.get('/:wallet', async (req, res) => {
  try {
    const wallet = req.params.wallet.toLowerCase();
    const user = await User.findOne({ wallet });
    if (!user) return res.status(404).json({ isPremium: false });
    res.json({
      wallet: user.wallet,
      isPremium: user.isPremium,
      premiumSince: user.premiumSince,
      premiumSource: user.premiumSource,
      lastPaymentId: user.lastPaymentId,
      kycStatus: user.kycStatus,
      kycProvider: user.kycProvider,
      kycId: user.kycId,
      kycUpdatedAt: user.kycUpdatedAt,
    });
  } catch (err) {
    res.status(500).json({ error: 'Error consultando usuario' });
  }
});

module.exports = router; 