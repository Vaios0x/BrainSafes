const { ethers } = require("ethers");
const axios = require("axios");
require("dotenv").config();

const ABI = require("../artifacts/contracts/YourContract.json").abi;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

contract.on("UserAction", async (user, action, value, details, event) => {
  try {
    await axios.post("http://localhost:4000/metrics", {
      type: action,
      user,
      value: value.toString(),
      details,
      timestamp: new Date()
    });
    console.log("Evento capturado:", { user, action, value: value.toString(), details });
  } catch (err) {
    console.error("Error enviando métrica:", err.message);
  }
});

console.log("Escuchando eventos UserAction en el contrato:", CONTRACT_ADDRESS); 