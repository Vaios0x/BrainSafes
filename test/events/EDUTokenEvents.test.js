const { expect } = require("chai");
const { ethers } = require("hardhat");
describe("Eventos: EDUToken", function () {
  let token, owner, user;
  beforeEach(async () => {
    [owner, user] = await ethers.getSigners();
    const EDUToken = await ethers.getContractFactory("EDUToken");
    token = await EDUToken.deploy();
    await token.deployed();
  });
  it("debería emitir evento Transfer al mintear", async function () {
    await expect(token.mint(user.address, 1000)).to.emit(token, "Transfer").withArgs(ethers.constants.AddressZero, user.address, 1000);
  });
  it("debería emitir evento Transfer al transferir", async function () {
    await token.mint(owner.address, 1000);
    await expect(token.transfer(user.address, 500)).to.emit(token, "Transfer").withArgs(owner.address, user.address, 500);
  });
  it("debería emitir evento Transfer al quemar", async function () {
    await token.mint(owner.address, 1000);
    await expect(token.burn(500)).to.emit(token, "Transfer").withArgs(owner.address, ethers.constants.AddressZero, 500);
  });
}); 