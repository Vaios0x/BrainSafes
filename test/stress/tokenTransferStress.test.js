const { ethers } = require("hardhat");
describe("Stress: Transferencias masivas de EDUToken", function () {
  let token, owner;
  beforeEach(async () => {
    [owner] = await ethers.getSigners();
    const EDUToken = await ethers.getContractFactory("EDUToken");
    token = await EDUToken.deploy();
    await token.deployed();
    await token.mint(owner.address, 1000000);
  });
  it("debería transferir tokens a 500 usuarios distintos", async function () {
    const wallets = [];
    for (let i = 0; i < 500; i++) {
      wallets.push(ethers.Wallet.createRandom().connect(ethers.provider));
    }
    for (let i = 0; i < 500; i++) {
      await token.transfer(wallets[i].address, 1000);
    }
    // Si no revierte, pasa el test
  });
}); 