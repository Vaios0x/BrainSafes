const express = require('express');
const multer = require('multer');
const { Web3Storage, File } = require('web3.storage');
const ipfsManager = require('../services/ipfsManager');
const router = express.Router();

const client = new Web3Storage({ token: process.env.WEB3STORAGE_TOKEN });
const upload = multer({ 
  limits: { 
    fileSize: 50 * 1024 * 1024, // 50MB max
    files: 10 // Máximo 10 archivos
  }
});

/**
 * @swagger
 * /api/ipfs/upload:
 *   post:
 *     summary: Subir archivo a IPFS
 *     description: Sube un archivo al sistema IPFS con pinning automático
 *     tags: [IPFS]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Archivo a subir
 *               pin:
 *                 type: boolean
 *                 default: true
 *                 description: Si se debe pinear el archivo
 *     responses:
 *       200:
 *         description: Archivo subido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     hash:
 *                       type: string
 *                     size:
 *                       type: number
 *                     filename:
 *                       type: string
 *                     url:
 *                       type: string
 *                     gateway:
 *                       type: string
 *                     timestamp:
 *                       type: number
 */
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const { pin = true } = req.body;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ 
        success: false, 
        error: 'Archivo requerido' 
      });
    }

    const result = await ipfsManager.uploadFile(
      file.buffer, 
      file.originalname, 
      { pin: pin === 'true' }
    );

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error subiendo archivo a IPFS:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/ipfs/upload-metadata:
 *   post:
 *     summary: Subir metadata JSON a IPFS
 *     description: Sube metadata JSON al sistema IPFS
 *     tags: [IPFS]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               metadata:
 *                 type: object
 *                 description: Metadata JSON a subir
 *               name:
 *                 type: string
 *                 default: metadata.json
 *                 description: Nombre del archivo
 *               pin:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       200:
 *         description: Metadata subida exitosamente
 */
router.post('/upload-metadata', async (req, res) => {
  try {
    const { metadata, name = 'metadata.json', pin = true } = req.body;
    
    if (!metadata || typeof metadata !== 'object') {
      return res.status(400).json({ 
        success: false, 
        error: 'Metadata inválida' 
      });
    }

    const result = await ipfsManager.uploadMetadata(
      metadata, 
      name, 
      { pin: pin === true }
    );

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error subiendo metadata a IPFS:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/ipfs/upload-nft:
 *   post:
 *     summary: Subir NFT completo a IPFS
 *     description: Sube imagen y metadata de NFT al sistema IPFS
 *     tags: [IPFS]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Imagen del NFT
 *               name:
 *                 type: string
 *                 description: Nombre del NFT
 *               description:
 *                 type: string
 *                 description: Descripción del NFT
 *               attributes:
 *                 type: string
 *                 description: Atributos JSON del NFT
 *     responses:
 *       200:
 *         description: NFT subido exitosamente
 */
router.post('/upload-nft', upload.single('image'), async (req, res) => {
  try {
    const { name, description, attributes } = req.body;
    const imageFile = req.file;
    
    if (!imageFile) {
      return res.status(400).json({ 
        success: false, 
        error: 'Imagen requerida' 
      });
    }

    if (!name || !description) {
      return res.status(400).json({ 
        success: false, 
        error: 'Nombre y descripción requeridos' 
      });
    }

    // 1. Subir imagen a IPFS
    const imageResult = await ipfsManager.uploadImage(
      imageFile.buffer, 
      imageFile.originalname
    );

    // 2. Generar metadata JSON
    const metadata = {
      name,
      description,
      image: `ipfs://${imageResult.hash}`,
      attributes: attributes ? JSON.parse(attributes) : [],
      external_url: `https://brainsafes.com/nft/${imageResult.hash}`,
      animation_url: null,
      background_color: null,
      created_at: new Date().toISOString()
    };

    // 3. Subir metadata a IPFS
    const metadataResult = await ipfsManager.uploadMetadata(
      metadata, 
      'metadata.json'
    );

    res.json({
      success: true,
      data: {
        tokenURI: `ipfs://${metadataResult.hash}/metadata.json`,
        imageURI: `ipfs://${imageResult.hash}`,
        metadata,
        imageHash: imageResult.hash,
        metadataHash: metadataResult.hash
      }
    });

  } catch (error) {
    console.error('Error subiendo NFT a IPFS:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/ipfs/upload-directory:
 *   post:
 *     summary: Subir directorio a IPFS
 *     description: Sube un directorio completo al sistema IPFS
 *     tags: [IPFS]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Archivos del directorio
 *               directoryName:
 *                 type: string
 *                 description: Nombre del directorio
 *     responses:
 *       200:
 *         description: Directorio subido exitosamente
 */
router.post('/upload-directory', upload.array('files', 50), async (req, res) => {
  try {
    const { directoryName = 'directory' } = req.body;
    const files = req.files;
    
    if (!files || files.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Archivos requeridos' 
      });
    }

    // Crear estructura de directorio temporal
    const tempDir = `/tmp/${directoryName}_${Date.now()}`;
    const fs = require('fs').promises;
    
    try {
      await fs.mkdir(tempDir, { recursive: true });
      
      // Escribir archivos al directorio temporal
      for (const file of files) {
        const filePath = `${tempDir}/${file.originalname}`;
        await fs.writeFile(filePath, file.buffer);
      }

      // Subir directorio a IPFS
      const result = await ipfsManager.uploadDirectory(tempDir);
      
      // Limpiar directorio temporal
      await fs.rm(tempDir, { recursive: true, force: true });

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      // Limpiar en caso de error
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch (cleanupError) {
        console.error('Error limpiando directorio temporal:', cleanupError);
      }
      throw error;
    }

  } catch (error) {
    console.error('Error subiendo directorio a IPFS:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/ipfs/get/{hash}:
 *   get:
 *     summary: Obtener archivo desde IPFS
 *     description: Obtiene un archivo desde IPFS por su hash
 *     tags: [IPFS]
 *     parameters:
 *       - in: path
 *         name: hash
 *         required: true
 *         schema:
 *           type: string
 *         description: Hash IPFS del archivo
 *     responses:
 *       200:
 *         description: Archivo obtenido exitosamente
 *       404:
 *         description: Archivo no encontrado
 */
router.get('/get/:hash', async (req, res) => {
  try {
    const { hash } = req.params;
    
    if (!ipfsManager.isValidHash(hash)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Hash IPFS inválido' 
      });
    }

    const content = await ipfsManager.getFile(hash);
    
    // Determinar tipo de contenido
    const contentType = req.query.metadata === 'true' ? 'application/json' : 'application/octet-stream';
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', content.length);
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache por 1 hora
    
    res.send(content);

  } catch (error) {
    console.error('Error obteniendo archivo desde IPFS:', error);
    res.status(404).json({ 
      success: false, 
      error: 'Archivo no encontrado' 
    });
  }
});

/**
 * @swagger
 * /api/ipfs/metadata/{hash}:
 *   get:
 *     summary: Obtener metadata desde IPFS
 *     description: Obtiene metadata JSON desde IPFS por su hash
 *     tags: [IPFS]
 *     parameters:
 *       - in: path
 *         name: hash
 *         required: true
 *         schema:
 *           type: string
 *         description: Hash IPFS de la metadata
 *     responses:
 *       200:
 *         description: Metadata obtenida exitosamente
 */
router.get('/metadata/:hash', async (req, res) => {
  try {
    const { hash } = req.params;
    
    if (!ipfsManager.isValidHash(hash)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Hash IPFS inválido' 
      });
    }

    const metadata = await ipfsManager.getMetadata(hash);

    res.json({
      success: true,
      data: metadata
    });

  } catch (error) {
    console.error('Error obteniendo metadata desde IPFS:', error);
    res.status(404).json({ 
      success: false, 
      error: 'Metadata no encontrada' 
    });
  }
});

/**
 * @swagger
 * /api/ipfs/pin/{hash}:
 *   post:
 *     summary: Pinear archivo en IPFS
 *     description: Pinea un archivo en IPFS para mantenerlo disponible
 *     tags: [IPFS]
 *     parameters:
 *       - in: path
 *         name: hash
 *         required: true
 *         schema:
 *           type: string
 *         description: Hash IPFS del archivo
 *     responses:
 *       200:
 *         description: Archivo pineado exitosamente
 */
router.post('/pin/:hash', async (req, res) => {
  try {
    const { hash } = req.params;
    
    if (!ipfsManager.isValidHash(hash)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Hash IPFS inválido' 
      });
    }

    await ipfsManager.pinFile(hash);

    res.json({
      success: true,
      message: 'Archivo pineado exitosamente'
    });

  } catch (error) {
    console.error('Error pineando archivo:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/ipfs/unpin/{hash}:
 *   delete:
 *     summary: Despinear archivo de IPFS
 *     description: Despinea un archivo de IPFS
 *     tags: [IPFS]
 *     parameters:
 *       - in: path
 *         name: hash
 *         required: true
 *         schema:
 *           type: string
 *         description: Hash IPFS del archivo
 *     responses:
 *       200:
 *         description: Archivo despineado exitosamente
 */
router.delete('/unpin/:hash', async (req, res) => {
  try {
    const { hash } = req.params;
    
    if (!ipfsManager.isValidHash(hash)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Hash IPFS inválido' 
      });
    }

    await ipfsManager.unpinFile(hash);

    res.json({
      success: true,
      message: 'Archivo despineado exitosamente'
    });

  } catch (error) {
    console.error('Error despineando archivo:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/ipfs/stats:
 *   get:
 *     summary: Obtener estadísticas de IPFS
 *     description: Obtiene estadísticas del sistema IPFS
 *     tags: [IPFS]
 *     responses:
 *       200:
 *         description: Estadísticas obtenidas exitosamente
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await ipfsManager.getStats();

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas de IPFS:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/ipfs/gateway/{hash}:
 *   get:
 *     summary: Obtener URL de gateway
 *     description: Obtiene URL de gateway para un hash IPFS
 *     tags: [IPFS]
 *     parameters:
 *       - in: path
 *         name: hash
 *         required: true
 *         schema:
 *           type: string
 *         description: Hash IPFS del archivo
 *       - in: query
 *         name: gateway
 *         schema:
 *           type: string
 *           enum: [ipfs.io, pinata, cloudflare, dweb]
 *           default: ipfs.io
 *         description: Gateway a usar
 *     responses:
 *       200:
 *         description: URL de gateway obtenida exitosamente
 */
router.get('/gateway/:hash', (req, res) => {
  try {
    const { hash } = req.params;
    const { gateway = 'ipfs.io' } = req.query;
    
    if (!ipfsManager.isValidHash(hash)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Hash IPFS inválido' 
      });
    }

    const url = ipfsManager.getGatewayUrl(hash, gateway);

    res.json({
      success: true,
      data: {
        hash,
        gateway,
        url
      }
    });

  } catch (error) {
    console.error('Error obteniendo URL de gateway:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router; 