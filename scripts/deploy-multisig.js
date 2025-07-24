const { ethers } = require("hardhat");

async function main() {
  const owners = [
    "0xOwner1...", // Cambia por tus direcciones
    "0xOwner2...",
    "0xOwner3..."
  ];
  const required = 2; // Quorum

  const MultiSigWallet = await ethers.getContractFactory("MultiSigWallet");
  const multisig = await MultiSigWallet.deploy(owners, required);
  await multisig.deployed();

  console.log("MultiSigWallet deployed to:", multisig.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 