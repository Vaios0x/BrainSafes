const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { User } = require('../src/models/User');
const { auth, requireRole } = require('../src/middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

const app = express();
app.use(express.json());
app.get('/admin-only', auth, requireRole('admin'), (req, res) => {
  res.json({ message: 'Acceso admin' });
});

describe('Roles y permisos', () => {
  let adminToken, userToken;
  beforeAll(async () => {
    await mongoose.connect('mongodb://localhost:27017/brainsafes-test', { useNewUrlParser: true, useUnifiedTopology: true });
    await User.deleteMany({});
    const admin = await User.create({ email: 'admin@admin.com', password: 'x', roles: ['admin'] });
    const user = await User.create({ email: 'user@user.com', password: 'x', roles: ['user'] });
    adminToken = jwt.sign({ id: admin._id, roles: admin.roles }, JWT_SECRET);
    userToken = jwt.sign({ id: user._id, roles: user.roles }, JWT_SECRET);
  });
  afterAll(async () => {
    await mongoose.connection.close();
  });
  it('permite acceso a admin', async () => {
    const res = await request(app)
      .get('/admin-only')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Acceso admin');
  });
  it('deniega acceso a user', async () => {
    const res = await request(app)
      .get('/admin-only')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });
}); 