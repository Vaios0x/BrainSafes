const { ethers } = require("hardhat");

async function main() {
  const BRIDGE_ADDRESS = process.env.BRIDGE_ADDRESS;
  const BRIDGE_OPERATOR = process.env.BRIDGE_OPERATOR;
  const Bridge = await ethers.getContractAt("GenericNFTBridge", BRIDGE_ADDRESS);
  const role = await Bridge.BRIDGE_ROLE();
  const tx = await Bridge.grantRole(role, BRIDGE_OPERATOR);
  await tx.wait();
  console.log(`BRIDGE_ROLE asignado a ${BRIDGE_OPERATOR} en ${BRIDGE_ADDRESS}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 