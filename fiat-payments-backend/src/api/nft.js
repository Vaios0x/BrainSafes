const express = require('express');
const { ethers } = require('ethers');
const router = express.Router();

const contract = new ethers.Contract(
  process.env.NFT_CONTRACT_ADDRESS,
  ['function mintWithURI(address to, string memory tokenURI) public returns (uint256)'],
  new ethers.Wallet(process.env.PRIVATE_KEY, new ethers.JsonRpcProvider(process.env.RPC_URL))
);

// POST /api/nft/mint
router.post('/mint', async (req, res) => {
  try {
    const { address, tokenURI } = req.body;
    if (!ethers.isAddress(address) || !tokenURI) return res.status(400).json({ error: 'Parámetros inválidos' });
    const tx = await contract.mintWithURI(address, tokenURI);
    await tx.wait();
    res.json({ txHash: tx.hash });
  } catch (err) {
    console.error('Error minteando NFT:', err);
    res.status(500).json({ error: 'Error minteando NFT' });
  }
});

module.exports = router; 