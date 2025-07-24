const { ethers } = require('ethers');
require('dotenv').config();

const NFT_ABI = [
  "function mintOnRamp(address to, string memory txHash, string memory provider) public returns (uint256)"
];

const provider = new ethers.JsonRpcProvider(
  `https://${process.env.NETWORK}.infura.io/v3/${process.env.INFURA_API_KEY}`
);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const contract = new ethers.Contract(
  process.env.NFT_CONTRACT_ADDRESS,
  NFT_ABI,
  wallet
);

async function mintOnRampNFT(userAddress, txHash, providerName) {
  if (!ethers.isAddress(userAddress)) throw new Error('Dirección inválida');
  const tx = await contract.mintOnRamp(userAddress, txHash, providerName);
  await tx.wait();
  console.log(`NFT emitido a ${userAddress} por compra on-ramp. Tx: ${tx.hash}`);
  return tx.hash;
}

module.exports = { mintOnRampNFT }; 