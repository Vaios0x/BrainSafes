const { ethers } = require("hardhat");
describe("Stress: Oráculo AI", function () {
  let oracle, owner;
  beforeEach(async () => {
    [owner] = await ethers.getSigners();
    const AIOracle = await ethers.getContractFactory("AIOracle");
    oracle = await AIOracle.deploy();
    await oracle.deployed();
  });
  it("debería consultar el oráculo 500 veces", async function () {
    for (let i = 0; i < 500; i++) {
      await oracle.getPrediction(`student${i}`);
    }
  });
}); 