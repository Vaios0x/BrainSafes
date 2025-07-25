const { ethers } = require('ethers');
require('dotenv').config();

// ABI mínimo para la función de emisión (ajustar según contrato real)
const CONTRACT_ABI = [
  // Ejemplo: función para emitir token tras pago fiat
  "function mintFiatUser(address to, uint256 amount, string memory paymentId) public"
];

const provider = new ethers.JsonRpcProvider(
  `https://${process.env.NETWORK}.infura.io/v3/${process.env.INFURA_API_KEY}`
);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const contract = new ethers.Contract(
  process.env.CONTRACT_ADDRESS,
  CONTRACT_ABI,
  wallet
);

/**
 * Emite tokens/NFTs a un usuario tras pago fiat confirmado
 * @param {string} userAddress - Dirección del usuario (wallet)
 * @param {number} amount - Cantidad de tokens/NFTs a emitir
 * @param {string} paymentId - ID del pago Stripe
 * @returns {Promise<string>} - Hash de la transacción
 */
async function mintFiatUser(userAddress, amount, paymentId) {
  try {
    if (!ethers.isAddress(userAddress)) throw new Error('Dirección inválida');
    const tx = await contract.mintFiatUser(userAddress, amount, paymentId);
    await tx.wait();
    console.log(`Token emitido a ${userAddress} por pago ${paymentId}. Tx: ${tx.hash}`);
    return tx.hash;
  } catch (err) {
    console.error('Error emitiendo token tras pago fiat:', err);
    throw err;
  }
}

function verifySignature(address, signature, message) {
  try {
    const signer = ethers.utils.verifyMessage(message, signature);
    return signer.toLowerCase() === address.toLowerCase();
  } catch {
    return false;
  }
}

module.exports = { mintFiatUser, verifySignature }; 