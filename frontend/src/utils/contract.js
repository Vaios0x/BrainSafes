import { ethers } from "ethers";
// Reemplaza por el ABI real de tu contrato
import ABI from "./ABI.json";

const CONTRACT_ADDRESS = "0x..."; // Dirección del contrato a usar
 
export function getContract(signerOrProvider) {
  return new ethers.Contract(CONTRACT_ADDRESS, ABI, signerOrProvider);
} 