const express = require("express");
const { ethers } = require("ethers");
const app = express();
app.use(express.json());

const CONTRACT_ADDRESS = "0x..."; // Dirección del contrato protegido
const ABI = require("../artifacts/contracts/YourContract.json").abi;
const MPC_ADDRESS = "0x..."; // Dirección MPC autorizada
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

// Simulación: en producción, verifica la firma MPC real
function isValidMPC(req) {
  // Aquí deberías verificar la firma MPC (por ejemplo, usando Fireblocks API)
  return req.headers["x-mpc-auth"] === "true";
}

app.post("/critical-action", async (req, res) => {
  if (!isValidMPC(req)) return res.status(403).json({ error: "No autorizado (MPC)" });
  try {
    // Aquí deberías firmar y enviar la tx usando la clave MPC
    // Ejemplo: await contract.connect(mpcSigner).criticalAction();
    res.json({ success: true, message: "Acción crítica ejecutada (simulada)" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3001, () => console.log("MPC backend listening on 3001")); 