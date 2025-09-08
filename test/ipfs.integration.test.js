const { expect } = require('chai');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

describe('IPFS Integration Tests', () => {
  const BASE_URL = process.env.TEST_API_URL || 'http://localhost:4000';
  const apiClient = axios.create({ baseURL: BASE_URL });

  // Datos de prueba
  const testMetadata = {
    name: 'Test NFT',
    description: 'Test NFT Description',
    image: 'ipfs://QmTestImageHash',
    attributes: [
      { trait_type: 'Rarity', value: 'Common' },
      { trait_type: 'Level', value: 1 }
    ],
    external_url: 'https://brainsafes.com/nft/test',
    created_at: new Date().toISOString()
  };

  const testFileContent = 'This is a test file content for IPFS upload';
  const testImageBuffer = Buffer.from('fake image data');

  describe('POST /api/ipfs/upload', () => {
    it('should upload a file successfully', async () => {
      const formData = new FormData();
      formData.append('file', Buffer.from(testFileContent), 'test.txt');
      formData.append('pin', 'true');

      const response = await apiClient.post('/api/ipfs/upload', formData, {
        headers: formData.getHeaders()
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data).to.have.property('hash');
      expect(response.data.data).to.have.property('size');
      expect(response.data.data).to.have.property('filename', 'test.txt');
      expect(response.data.data).to.have.property('url');
      expect(response.data.data).to.have.property('gateway');
    });

    it('should reject upload without file', async () => {
      const formData = new FormData();
      formData.append('pin', 'true');

      try {
        await apiClient.post('/api/ipfs/upload', formData, {
          headers: formData.getHeaders()
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(400);
        expect(error.response.data.success).to.be.false;
        expect(error.response.data.error).to.include('Archivo requerido');
      }
    });
  });

  describe('POST /api/ipfs/upload-metadata', () => {
    it('should upload metadata successfully', async () => {
      const response = await apiClient.post('/api/ipfs/upload-metadata', {
        metadata: testMetadata,
        name: 'test-metadata.json',
        pin: true
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data).to.have.property('hash');
      expect(response.data.data).to.have.property('size');
      expect(response.data.data).to.have.property('filename', 'test-metadata.json');
    });

    it('should reject invalid metadata', async () => {
      try {
        await apiClient.post('/api/ipfs/upload-metadata', {
          metadata: 'invalid-json',
          name: 'test.json',
          pin: true
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(400);
        expect(error.response.data.success).to.be.false;
        expect(error.response.data.error).to.include('Metadata inválida');
      }
    });

    it('should reject missing metadata', async () => {
      try {
        await apiClient.post('/api/ipfs/upload-metadata', {
          name: 'test.json',
          pin: true
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(400);
        expect(error.response.data.success).to.be.false;
        expect(error.response.data.error).to.include('Metadata inválida');
      }
    });
  });

  describe('POST /api/ipfs/upload-nft', () => {
    it('should upload NFT successfully', async () => {
      const formData = new FormData();
      formData.append('image', testImageBuffer, 'test-image.png');
      formData.append('name', 'Test NFT');
      formData.append('description', 'Test NFT Description');
      formData.append('attributes', JSON.stringify(testMetadata.attributes));

      const response = await apiClient.post('/api/ipfs/upload-nft', formData, {
        headers: formData.getHeaders()
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data).to.have.property('tokenURI');
      expect(response.data.data).to.have.property('imageURI');
      expect(response.data.data).to.have.property('metadata');
      expect(response.data.data).to.have.property('imageHash');
      expect(response.data.data).to.have.property('metadataHash');
      expect(response.data.data.metadata.name).to.equal('Test NFT');
    });

    it('should reject NFT upload without image', async () => {
      const formData = new FormData();
      formData.append('name', 'Test NFT');
      formData.append('description', 'Test NFT Description');

      try {
        await apiClient.post('/api/ipfs/upload-nft', formData, {
          headers: formData.getHeaders()
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(400);
        expect(error.response.data.success).to.be.false;
        expect(error.response.data.error).to.include('Imagen requerida');
      }
    });

    it('should reject NFT upload without required fields', async () => {
      const formData = new FormData();
      formData.append('image', testImageBuffer, 'test-image.png');

      try {
        await apiClient.post('/api/ipfs/upload-nft', formData, {
          headers: formData.getHeaders()
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(400);
        expect(error.response.data.success).to.be.false;
        expect(error.response.data.error).to.include('campos requeridos');
      }
    });
  });

  describe('POST /api/ipfs/upload-directory', () => {
    it('should upload directory successfully', async () => {
      const formData = new FormData();
      formData.append('files', Buffer.from('file1 content'), 'file1.txt');
      formData.append('files', Buffer.from('file2 content'), 'file2.txt');
      formData.append('directoryName', 'test-directory');

      const response = await apiClient.post('/api/ipfs/upload-directory', formData, {
        headers: formData.getHeaders()
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data).to.have.property('hash');
      expect(response.data.data).to.have.property('size');
      expect(response.data.data).to.have.property('path');
    });

    it('should reject directory upload without files', async () => {
      const formData = new FormData();
      formData.append('directoryName', 'test-directory');

      try {
        await apiClient.post('/api/ipfs/upload-directory', formData, {
          headers: formData.getHeaders()
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(400);
        expect(error.response.data.success).to.be.false;
        expect(error.response.data.error).to.include('Archivos requeridos');
      }
    });
  });

  describe('GET /api/ipfs/get/{hash}', () => {
    let testHash;

    before(async () => {
      // Subir un archivo de prueba para obtener el hash
      const formData = new FormData();
      formData.append('file', Buffer.from(testFileContent), 'test.txt');
      
      const response = await apiClient.post('/api/ipfs/upload', formData, {
        headers: formData.getHeaders()
      });
      
      testHash = response.data.data.hash;
    });

    it('should retrieve file successfully', async () => {
      const response = await apiClient.get(`/api/ipfs/get/${testHash}`);

      expect(response.status).to.equal(200);
      expect(response.data).to.equal(testFileContent);
      expect(response.headers['content-type']).to.equal('application/octet-stream');
    });

    it('should reject invalid hash', async () => {
      try {
        await apiClient.get('/api/ipfs/get/invalid-hash');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(400);
        expect(error.response.data.success).to.be.false;
        expect(error.response.data.error).to.include('Hash IPFS inválido');
      }
    });

    it('should return 404 for non-existent hash', async () => {
      const fakeHash = 'QmFakeHashThatDoesNotExist123456789012345678901234567890123456789012';
      
      try {
        await apiClient.get(`/api/ipfs/get/${fakeHash}`);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(404);
        expect(error.response.data.success).to.be.false;
        expect(error.response.data.error).to.include('Archivo no encontrado');
      }
    });
  });

  describe('GET /api/ipfs/metadata/{hash}', () => {
    let testMetadataHash;

    before(async () => {
      // Subir metadata de prueba para obtener el hash
      const response = await apiClient.post('/api/ipfs/upload-metadata', {
        metadata: testMetadata,
        name: 'test-metadata.json',
        pin: true
      });
      
      testMetadataHash = response.data.data.hash;
    });

    it('should retrieve metadata successfully', async () => {
      const response = await apiClient.get(`/api/ipfs/metadata/${testMetadataHash}`);

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data).to.have.property('name', testMetadata.name);
      expect(response.data.data).to.have.property('description', testMetadata.description);
      expect(response.data.data).to.have.property('attributes');
    });

    it('should reject invalid metadata hash', async () => {
      try {
        await apiClient.get('/api/ipfs/metadata/invalid-hash');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(400);
        expect(error.response.data.success).to.be.false;
        expect(error.response.data.error).to.include('Hash IPFS inválido');
      }
    });
  });

  describe('POST /api/ipfs/pin/{hash}', () => {
    let testHash;

    before(async () => {
      // Subir un archivo de prueba para obtener el hash
      const formData = new FormData();
      formData.append('file', Buffer.from(testFileContent), 'test.txt');
      
      const response = await apiClient.post('/api/ipfs/upload', formData, {
        headers: formData.getHeaders()
      });
      
      testHash = response.data.data.hash;
    });

    it('should pin file successfully', async () => {
      const response = await apiClient.post(`/api/ipfs/pin/${testHash}`);

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.message).to.include('pineado exitosamente');
    });

    it('should reject pinning invalid hash', async () => {
      try {
        await apiClient.post('/api/ipfs/pin/invalid-hash');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(400);
        expect(error.response.data.success).to.be.false;
        expect(error.response.data.error).to.include('Hash IPFS inválido');
      }
    });
  });

  describe('DELETE /api/ipfs/unpin/{hash}', () => {
    let testHash;

    before(async () => {
      // Subir un archivo de prueba para obtener el hash
      const formData = new FormData();
      formData.append('file', Buffer.from(testFileContent), 'test.txt');
      
      const response = await apiClient.post('/api/ipfs/upload', formData, {
        headers: formData.getHeaders()
      });
      
      testHash = response.data.data.hash;
    });

    it('should unpin file successfully', async () => {
      const response = await apiClient.delete(`/api/ipfs/unpin/${testHash}`);

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.message).to.include('despineado exitosamente');
    });

    it('should reject unpinning invalid hash', async () => {
      try {
        await apiClient.delete('/api/ipfs/unpin/invalid-hash');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(400);
        expect(error.response.data.success).to.be.false;
        expect(error.response.data.error).to.include('Hash IPFS inválido');
      }
    });
  });

  describe('GET /api/ipfs/stats', () => {
    it('should return IPFS statistics', async () => {
      const response = await apiClient.get('/api/ipfs/stats');

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data).to.have.property('repoSize');
      expect(response.data.data).to.have.property('numObjects');
      expect(response.data.data).to.have.property('version');
      expect(response.data.data).to.have.property('pinnedFiles');
      expect(response.data.data).to.have.property('cacheSize');
    });
  });

  describe('GET /api/ipfs/gateway/{hash}', () => {
    let testHash;

    before(async () => {
      // Subir un archivo de prueba para obtener el hash
      const formData = new FormData();
      formData.append('file', Buffer.from(testFileContent), 'test.txt');
      
      const response = await apiClient.post('/api/ipfs/upload', formData, {
        headers: formData.getHeaders()
      });
      
      testHash = response.data.data.hash;
    });

    it('should return gateway URL for default gateway', async () => {
      const response = await apiClient.get(`/api/ipfs/gateway/${testHash}`);

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data).to.have.property('hash', testHash);
      expect(response.data.data).to.have.property('gateway', 'ipfs.io');
      expect(response.data.data).to.have.property('url');
      expect(response.data.data.url).to.include('ipfs.io/ipfs/');
    });

    it('should return gateway URL for specific gateway', async () => {
      const response = await apiClient.get(`/api/ipfs/gateway/${testHash}?gateway=pinata`);

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data).to.have.property('gateway', 'pinata');
      expect(response.data.data.url).to.include('gateway.pinata.cloud/ipfs/');
    });

    it('should reject invalid hash', async () => {
      try {
        await apiClient.get('/api/ipfs/gateway/invalid-hash');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(400);
        expect(error.response.data.success).to.be.false;
        expect(error.response.data.error).to.include('Hash IPFS inválido');
      }
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits on upload endpoints', async () => {
      const requests = [];
      
      // Hacer múltiples requests rápidamente
      for (let i = 0; i < 10; i++) {
        const formData = new FormData();
        formData.append('file', Buffer.from(`test content ${i}`), `test${i}.txt`);
        
        requests.push(
          apiClient.post('/api/ipfs/upload', formData, {
            headers: formData.getHeaders()
          }).catch(error => error)
        );
      }

      const results = await Promise.all(requests);
      const rateLimited = results.filter(result => 
        result.response && result.response.status === 429
      );

      // Al menos algunos requests deberían ser rate limited
      expect(rateLimited.length).to.be.greaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle IPFS service errors gracefully', async () => {
      // Simular un error de IPFS modificando la configuración
      const originalIPFSHost = process.env.IPFS_HOST;
      process.env.IPFS_HOST = 'invalid-host';

      try {
        const formData = new FormData();
        formData.append('file', Buffer.from(testFileContent), 'test.txt');

        await apiClient.post('/api/ipfs/upload', formData, {
          headers: formData.getHeaders()
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(500);
        expect(error.response.data.success).to.be.false;
        expect(error.response.data.error).to.be.a('string');
      } finally {
        // Restaurar configuración original
        if (originalIPFSHost) {
          process.env.IPFS_HOST = originalIPFSHost;
        }
      }
    });
  });
});
