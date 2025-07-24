const express = require("express");
const router = express.Router();
const { ethers } = require("ethers");
const CommunityRewardsABI = require("../artifacts/CommunityRewards.json").abi;

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const adminSigner = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);
const oracleSigner = new ethers.Wallet(process.env.ORACLE_PRIVATE_KEY, provider);
const userSigner = new ethers.Wallet(process.env.USER_PRIVATE_KEY, provider);
const contract = new ethers.Contract(process.env.COMMUNITY_REWARDS_ADDRESS, CommunityRewardsABI, provider);

// Asignar puntos (admin)
router.post("/assign", async (req, res) => {
  const { user, pts } = req.body;
  try {
    const tx = await contract.connect(adminSigner).assignPoints(user, pts);
    await tx.wait();
    res.json({ success: true, txHash: tx.hash });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Asignar puntos (oráculo)
router.post("/assign-oracle", async (req, res) => {
  const { user, pts } = req.body;
  try {
    const tx = await contract.connect(oracleSigner).assignPointsOracle(user, pts);
    await tx.wait();
    res.json({ success: true, txHash: tx.hash });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reclamar tokens
router.post("/claim-token", async (req, res) => {
  const { amount } = req.body;
  try {
    const tx = await contract.connect(userSigner).claimTokenReward(amount);
    await tx.wait();
    res.json({ success: true, txHash: tx.hash });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reclamar badge
router.post("/claim-badge", async (req, res) => {
  const { badgeURI } = req.body;
  try {
    const tx = await contract.connect(userSigner).claimBadge(badgeURI);
    await tx.wait();
    res.json({ success: true, txHash: tx.hash });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Consultar puntos
router.get("/points/:user", async (req, res) => {
  try {
    const pts = await contract.getPoints(req.params.user);
    res.json({ points: pts.toString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 