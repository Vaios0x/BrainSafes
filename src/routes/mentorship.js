const express = require("express");
const router = express.Router();
const { ethers } = require("ethers");
const MentorshipABI = require("../artifacts/MentorshipProgram.json").abi;

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const mentorSigner = new ethers.Wallet(process.env.MENTOR_PRIVATE_KEY, provider);
const studentSigner = new ethers.Wallet(process.env.STUDENT_PRIVATE_KEY, provider);
const contract = new ethers.Contract(process.env.MENTORSHIP_ADDRESS, MentorshipABI, provider);

// Registrar mentor
router.post("/register", async (req, res) => {
  try {
    const tx = await contract.connect(mentorSigner).registerMentor();
    await tx.wait();
    res.json({ success: true, txHash: tx.hash });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Solicitar mentoría
router.post("/request", async (req, res) => {
  const { mentor } = req.body;
  try {
    const tx = await contract.connect(studentSigner).requestMentorship(mentor);
    await tx.wait();
    res.json({ success: true, txHash: tx.hash });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Aceptar mentoría
router.post("/accept", async (req, res) => {
  const { mentorshipId } = req.body;
  try {
    const tx = await contract.connect(mentorSigner).acceptMentorship(mentorshipId);
    await tx.wait();
    res.json({ success: true, txHash: tx.hash });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Finalizar mentoría
router.post("/end", async (req, res) => {
  const { mentorshipId } = req.body;
  try {
    const tx = await contract.connect(studentSigner).endMentorship(mentorshipId);
    await tx.wait();
    res.json({ success: true, txHash: tx.hash });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Enviar feedback
router.post("/feedback", async (req, res) => {
  const { mentorshipId, rating, feedback } = req.body;
  try {
    const tx = await contract.connect(studentSigner).submitFeedback(mentorshipId, rating, feedback);
    await tx.wait();
    res.json({ success: true, txHash: tx.hash });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 