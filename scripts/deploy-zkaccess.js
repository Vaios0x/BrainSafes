const { ethers } = require("hardhat");

async function main() {
  // Despliega el verificador generado por snarkjs
  const Groth16Verifier = await ethers.getContractFactory("Groth16Verifier");
  const verifier = await Groth16Verifier.deploy();
  await verifier.deployed();
  console.log("Groth16Verifier deployed to:", verifier.address);

  // Despliega ZKAccess con la dirección del verificador
  const ZKAccess = await ethers.getContractFactory("ZKAccess");
  const zkaccess = await ZKAccess.deploy(verifier.address);
  await zkaccess.deployed();
  console.log("ZKAccess deployed to:", zkaccess.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 