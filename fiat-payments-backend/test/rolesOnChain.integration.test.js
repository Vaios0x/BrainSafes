const request = require('supertest');
const express = require('express');
const rolesRoutes = require('../src/routes/roles');

const app = express();
app.use(express.json());
app.use('/api/roles', rolesRoutes);

describe('Roles on-chain API', () => {
  it('devuelve los roles on-chain para un address', async () => {
    // Mockear la función getRolesOnChain para no depender de la blockchain real
    jest.mock('../src/services/rolesOnChain', () => ({
      getRolesOnChain: async (address) => ({
        isAdmin: address === '0xAdmin',
        isIssuer: address === '0xIssuer',
        isValidator: address === '0xValidator',
      })
    }));
    const res = await request(app).get('/api/roles/onchain/0xAdmin');
    expect(res.status).toBe(200);
    expect(res.body.isAdmin).toBe(true);
    expect(res.body.isIssuer).toBe(false);
    expect(res.body.isValidator).toBe(false);
  });
}); 