const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const User = require('../src/models/User');
const { setPremium } = require('../src/services/user');
const userRoutes = require('../src/routes/user');

describe('User Premium Logic', function () {
  let mongod, app, server;

  before(async function () {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    app = express();
    app.use(bodyParser.json());
    app.use('/api/user', userRoutes);
    server = app.listen(0); // Puerto aleatorio
  });

  after(async function () {
    await mongoose.disconnect();
    await mongod.stop();
    server.close();
  });

  beforeEach(async function () {
    await User.deleteMany({});
  });

  it('setPremium debe crear y marcar usuario como premium', async function () {
    const wallet = '0x1234567890abcdef1234567890abcdef12345678';
    const user = await setPremium(wallet, 'onramp', 'txHash1');
    expect(user.wallet).to.equal(wallet.toLowerCase());
    expect(user.isPremium).to.be.true;
    expect(user.premiumSource).to.equal('onramp');
    expect(user.lastPaymentId).to.equal('txHash1');
    expect(user.premiumSince).to.be.a('date');
  });

  it('setPremium debe actualizar usuario existente', async function () {
    const wallet = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd';
    await setPremium(wallet, 'onramp', 'txHash1');
    const user = await setPremium(wallet, 'fiat', 'pi_123');
    expect(user.premiumSource).to.equal('fiat');
    expect(user.lastPaymentId).to.equal('pi_123');
  });

  it('GET /api/user/:wallet debe devolver info premium', async function () {
    const wallet = '0x1111111111111111111111111111111111111111';
    await setPremium(wallet, 'fiat', 'pi_999');
    const res = await request(app).get(`/api/user/${wallet}`);
    expect(res.status).to.equal(200);
    expect(res.body.wallet).to.equal(wallet.toLowerCase());
    expect(res.body.isPremium).to.be.true;
    expect(res.body.premiumSource).to.equal('fiat');
    expect(res.body.lastPaymentId).to.equal('pi_999');
  });

  it('GET /api/user/:wallet debe devolver 404 si no existe', async function () {
    const wallet = '0x2222222222222222222222222222222222222222';
    const res = await request(app).get(`/api/user/${wallet}`);
    expect(res.status).to.equal(404);
    expect(res.body.isPremium).to.be.false;
  });
}); 