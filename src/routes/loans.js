const express = require("express");
const router = express.Router();
const { ethers } = require("ethers");
const LoanManagerABI = require("../artifacts/LoanManager.json").abi;

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const studentSigner = new ethers.Wallet(process.env.STUDENT_PRIVATE_KEY, provider);
const lenderSigner = new ethers.Wallet(process.env.LENDER_PRIVATE_KEY, provider);
const adminSigner = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);
const liquidatorSigner = new ethers.Wallet(process.env.LIQUIDATOR_PRIVATE_KEY, provider);
const contract = new ethers.Contract(process.env.LOAN_MANAGER_ADDRESS, LoanManagerABI, provider);

// Solicitar préstamo
router.post("/request", async (req, res) => {
  const { amount, interest, duration } = req.body;
  try {
    const tx = await contract.connect(studentSigner).requestLoan(amount, interest, duration);
    await tx.wait();
    res.json({ success: true, txHash: tx.hash });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fondear préstamo
router.post("/fund", async (req, res) => {
  const { loanId } = req.body;
  try {
    const tx = await contract.connect(lenderSigner).fundLoan(loanId);
    await tx.wait();
    res.json({ success: true, txHash: tx.hash });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Repagar préstamo
router.post("/repay", async (req, res) => {
  const { loanId, amount } = req.body;
  try {
    const tx = await contract.connect(studentSigner).repayLoan(loanId, amount);
    await tx.wait();
    res.json({ success: true, txHash: tx.hash });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Marcar default
router.post("/mark-default", async (req, res) => {
  const { loanId } = req.body;
  try {
    const tx = await contract.connect(adminSigner).markDefault(loanId);
    await tx.wait();
    res.json({ success: true, txHash: tx.hash });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Liquidar préstamo
router.post("/liquidate", async (req, res) => {
  const { loanId } = req.body;
  try {
    const tx = await contract.connect(liquidatorSigner).liquidateLoan(loanId);
    await tx.wait();
    res.json({ success: true, txHash: tx.hash });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Consultar estado
router.get("/:id", async (req, res) => {
  const loanId = req.params.id;
  try {
    const status = await contract.getLoanStatus(loanId);
    res.json({ loanId, status: Number(status) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 