const express = require("express");
const router = express.Router();
const { ethers } = require("ethers");
const ABI = require("../artifacts/contracts/CertificateNFT.json").abi;
const CONTRACT_ADDRESS = process.env.CERTIFICATE_NFT_ADDRESS;
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const signer = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);
const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

// Validar estudiante
router.post("/validate-student", async (req, res) => {
  const { universityId, studentId } = req.body;
  // Simulación: integración real con API de universidad
  if (universityId && studentId) {
    res.json({ valid: true, name: "Juan Pérez", degree: "Ingeniería", university: "Universidad X" });
  } else {
    res.status(400).json({ valid: false, error: "Datos incompletos" });
  }
});

// Consultar historial académico
router.get("/academic-history/:studentId", async (req, res) => {
  const { studentId } = req.params;
  // Simulación: integración real con API de universidad
  res.json({
    studentId,
    records: [
      { year: 2020, course: "Matemáticas", grade: 9 },
      { year: 2021, course: "Física", grade: 8 }
    ]
  });
});

// Registrar logro/certificado en blockchain
router.post("/register-certificate", async (req, res) => {
  const { studentId, degree, university } = req.body;
  // Simulación: aquí llamarías a un smart contract
  res.json({ success: true, txHash: "0xabc123...", studentId, degree, university });
});

// Emitir certificado NFT
router.post("/issue-certificate", async (req, res) => {
  const { to, degree, university, issuedAt, uri } = req.body;
  try {
    const tx = await contract.issueCertificate(to, degree, university, issuedAt, uri);
    await tx.wait();
    res.json({ success: true, txHash: tx.hash, to, degree, university, issuedAt, uri });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router; 