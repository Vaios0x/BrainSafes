const { ethers } = require("hardhat");
describe("Stress: Multicall masivo", function () {
  let multicall, owner, user;
  beforeEach(async () => {
    [owner, user] = await ethers.getSigners();
    const EnhancedMulticall = await ethers.getContractFactory("EnhancedMulticall");
    multicall = await EnhancedMulticall.deploy();
    await multicall.deployed();
  });
  it("debería ejecutar 500 multicalls", async function () {
    const calls = [];
    for (let i = 0; i < 500; i++) {
      calls.push({ target: owner.address, callData: "0x", gasLimit: 100000 });
    }
    // Simula la llamada aggregate (ajusta según la interfaz real)
    await multicall.aggregate(calls);
    // Si no revierte, pasa el test
  });
}); 