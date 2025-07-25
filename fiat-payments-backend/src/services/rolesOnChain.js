const { ethers } = require('ethers');
const ABI = [
  "function isAdmin(address) view returns (bool)",
  "function isIssuer(address) view returns (bool)",
  "function isValidator(address) view returns (bool)"
];

const CONTRACT_ADDRESS = process.env.BRAINSAFES_CONTRACT || "0xYourContractAddress";
const PROVIDER_URL = process.env.RPC_URL || "http://localhost:8545";

const provider = new ethers.JsonRpcProvider(PROVIDER_URL);
const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

async function getRolesOnChain(address) {
  try {
    const [isAdmin, isIssuer, isValidator] = await Promise.all([
      contract.isAdmin(address),
      contract.isIssuer(address),
      contract.isValidator(address)
    ]);
    return { isAdmin, isIssuer, isValidator };
  } catch (e) {
    return { isAdmin: false, isIssuer: false, isValidator: false, error: e.message };
  }
}

module.exports = { getRolesOnChain }; 