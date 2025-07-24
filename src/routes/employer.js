const express = require("express");
const router = express.Router();
const { ethers } = require("ethers");
const ABI = require("../artifacts/contracts/CertificateNFT.json").abi;
const CONTRACT_ADDRESS = process.env.CERTIFICATE_NFT_ADDRESS;
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
const axios = require("axios");

// Verificar certificado real en blockchain
router.post("/verify-certificate", async (req, res) => {
  const { certificateId } = req.body;
  try {
    const owner = await contract.ownerOf(certificateId);
    const uri = await contract.tokenURI(certificateId);
    let metadata = {};
    if (uri.startsWith("http")) {
      const metaRes = await axios.get(uri);
      metadata = metaRes.data;
    }
    res.json({
      valid: true,
      owner,
      certificateId,
      metadata
    });
  } catch {
    res.json({ valid: false, error: "Certificado no encontrado" });
  }
});

module.exports = router; 