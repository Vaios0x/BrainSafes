const express = require('express');
const { getRolesOnChain } = require('../services/rolesOnChain');
const router = express.Router();

router.get('/onchain/:address', async (req, res) => {
  const { address } = req.params;
  try {
    const roles = await getRolesOnChain(address);
    res.json(roles);
  } catch (e) {
    res.status(500).json({ error: 'Error consultando roles on-chain' });
  }
});

module.exports = router; 