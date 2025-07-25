const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { User } = require('../src/models/User');
const authRoutes = require('../src/routes/auth');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth API', () => {
  beforeAll(async () => {
    await mongoose.connect('mongodb://localhost:27017/brainsafes-test', { useNewUrlParser: true, useUnifiedTopology: true });
    await User.deleteMany({});
    await User.create({ email: 'test@example.com', password: await require('bcryptjs').hash('123456', 10), roles: ['user'] });
  });
  afterAll(async () => {
    await mongoose.connection.close();
  });
  it('debe loguear con email y password correctos', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: '123456' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });
  it('rechaza login con credenciales incorrectas', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'wrong' });
    expect(res.status).toBe(401);
  });
}); 