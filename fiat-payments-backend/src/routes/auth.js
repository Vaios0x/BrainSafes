const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User } = require('../models/User');
const { verifySignature } = require('../services/blockchain');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

// Registro tradicional
router.post('/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Faltan datos' });
  const hash = await bcrypt.hash(password, 10);
  const user = new User({ email, password: hash, roles: ['user'] });
  await user.save();
  res.json({ success: true });
});

// Login tradicional
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Credenciales inválidas' });
  const token = jwt.sign({ id: user._id, roles: user.roles }, JWT_SECRET, { expiresIn: '1d' });
  res.json({ token });
});

// Login con wallet (Web3)
router.post('/login-wallet', async (req, res) => {
  const { address, signature, message } = req.body;
  if (!address || !signature || !message) return res.status(400).json({ error: 'Faltan datos' });
  const valid = verifySignature(address, signature, message);
  if (!valid) return res.status(401).json({ error: 'Firma inválida' });
  let user = await User.findOne({ wallet: address });
  if (!user) user = await User.create({ wallet: address, roles: ['user'] });
  const token = jwt.sign({ id: user._id, roles: user.roles }, JWT_SECRET, { expiresIn: '1d' });
  res.json({ token });
});

// Perfil actual
router.get('/me', require('../middleware/auth'), async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  res.json(user);
});

module.exports = router; 