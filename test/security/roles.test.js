const { expect } = require("chai");
const { ethers } = require("hardhat");
describe("Seguridad: Roles y permisos", function () {
  let security, owner, user;
  beforeEach(async () => {
    [owner, user] = await ethers.getSigners();
    const SecurityManager = await ethers.getContractFactory("SecurityManager");
    security = await SecurityManager.deploy();
    await security.deployed();
  });
  it("debería permitir solo a roles autorizados", async function () {
    expect(await security.isSecure(owner.address)).to.equal(true);
    expect(await security.isSecure(user.address)).to.equal(false);
  });
}); 