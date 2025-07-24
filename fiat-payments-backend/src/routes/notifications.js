const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');

router.get('/:wallet', async (req, res) => {
  try {
    const wallet = req.params.wallet.toLowerCase();
    const notifications = await Notification.find({ wallet }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: 'Error consultando notificaciones' });
  }
});

module.exports = router; 