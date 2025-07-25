const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { User } = require('../src/models/User');
const authRoutes = require('../src/routes/auth');
const { ethers } = require('ethers');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth API - Wallet', () => {
  let wallet, address, message, signature;
  beforeAll(async () => {
    await mongoose.connect('mongodb://localhost:27017/brainsafes-test', { useNewUrlParser: true, useUnifiedTopology: true });
    await User.deleteMany({});
    wallet = ethers.Wallet.createRandom();
    address = await wallet.getAddress();
    message = 'Login to BrainSafes';
    signature = await wallet.signMessage(message);
  });
  afterAll(async () => {
    await mongoose.connection.close();
  });
  it('debe loguear con wallet y firma válida', async () => {
    const res = await request(app)
      .post('/api/auth/login-wallet')
      .send({ address, signature, message });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });
  it('rechaza login con firma inválida', async () => {
    const res = await request(app)
      .post('/api/auth/login-wallet')
      .send({ address, signature: '0x1234', message });
    expect(res.status).toBe(401);
  });
}); 