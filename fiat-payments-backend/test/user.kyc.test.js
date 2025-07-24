const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const User = require('../src/models/User');
const { setKYC } = require('../src/services/user');
const userRoutes = require('../src/routes/user');

describe('User KYC Logic', function () {
  let mongod, app, server;

  before(async function () {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    app = express();
    app.use(bodyParser.json());
    app.use('/api/user', userRoutes);
    server = app.listen(0);
  });

  after(async function () {
    await mongoose.disconnect();
    await mongod.stop();
    server.close();
  });

  beforeEach(async function () {
    await User.deleteMany({});
  });

  it('setKYC debe crear y actualizar usuario con datos de KYC', async function () {
    const wallet = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd';
    const user = await setKYC(wallet, 'approved', 'sumsub', 'kyc123');
    expect(user.wallet).to.equal(wallet.toLowerCase());
    expect(user.kycStatus).to.equal('approved');
    expect(user.kycProvider).to.equal('sumsub');
    expect(user.kycId).to.equal('kyc123');
    expect(user.kycUpdatedAt).to.be.a('date');
  });

  it('setKYC debe actualizar usuario existente', async function () {
    const wallet = '0x1111111111111111111111111111111111111111';
    await setKYC(wallet, 'pending', 'sumsub', 'kycA');
    const user = await setKYC(wallet, 'rejected', 'sumsub', 'kycA');
    expect(user.kycStatus).to.equal('rejected');
  });

  it('GET /api/user/:wallet debe devolver info de KYC', async function () {
    const wallet = '0x2222222222222222222222222222222222222222';
    await setKYC(wallet, 'approved', 'sumsub', 'kyc999');
    const res = await request(app).get(`/api/user/${wallet}`);
    expect(res.status).to.equal(200);
    expect(res.body.wallet).to.equal(wallet.toLowerCase());
    expect(res.body.kycStatus).to.equal('approved');
    expect(res.body.kycProvider).to.equal('sumsub');
    expect(res.body.kycId).to.equal('kyc999');
    expect(res.body.kycUpdatedAt).to.be.a('string');
  });

  it('GET /api/user/:wallet debe devolver 404 si no existe', async function () {
    const wallet = '0x3333333333333333333333333333333333333333';
    const res = await request(app).get(`/api/user/${wallet}`);
    expect(res.status).to.equal(404);
    expect(res.body.isPremium).to.be.false;
  });
}); 