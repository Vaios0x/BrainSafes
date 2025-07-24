const express = require('express');
const multer = require('multer');
const { Web3Storage, File } = require('web3.storage');
const router = express.Router();

const client = new Web3Storage({ token: process.env.WEB3STORAGE_TOKEN });
const upload = multer();

// POST /api/ipfs/upload-nft
router.post('/upload-nft', upload.single('image'), async (req, res) => {
  try {
    const { name, description, attributes } = req.body;
    const imageFile = req.file;
    if (!imageFile) return res.status(400).json({ error: 'Imagen requerida' });

    // 1. Subir imagen a IPFS
    const imageCid = await client.put([new File([imageFile.buffer], imageFile.originalname)]);
    const imageURI = `ipfs://${imageCid}/${imageFile.originalname}`;

    // 2. Generar metadatos JSON
    const metadata = {
      name,
      description,
      image: imageURI,
      attributes: attributes ? JSON.parse(attributes) : [],
    };
    const metadataBlob = new Blob([JSON.stringify(metadata)], { type: 'application/json' });
    const metadataFile = new File([metadataBlob], 'metadata.json');

    // 3. Subir metadatos a IPFS
    const metadataCid = await client.put([metadataFile]);
    const tokenURI = `ipfs://${metadataCid}/metadata.json`;

    res.json({ tokenURI, imageURI, metadata });
  } catch (err) {
    console.error('Error subiendo NFT a IPFS:', err);
    res.status(500).json({ error: 'Error subiendo NFT a IPFS' });
  }
});

module.exports = router; 