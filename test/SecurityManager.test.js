const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SecurityManager", function () {
  let SecurityManager, securityManager, owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    SecurityManager = await ethers.getContractFactory("SecurityManager");
    securityManager = await SecurityManager.deploy();
    await securityManager.deployed();
  });

  it("Debe agregar y quitar de la whitelist", async function () {
    await securityManager.addToWhitelist(addr1.address);
    expect(await securityManager.whitelist(addr1.address)).to.be.true;
    await securityManager.removeFromWhitelist(addr1.address);
    expect(await securityManager.whitelist(addr1.address)).to.be.false;
  });

  it("Debe agregar y quitar de la blacklist", async function () {
    await securityManager.addToBlacklist(addr2.address);
    expect(await securityManager.blacklist(addr2.address)).to.be.true;
    await securityManager.removeFromBlacklist(addr2.address);
    expect(await securityManager.blacklist(addr2.address)).to.be.false;
  });

  it("Debe verificar si una dirección es segura (no en blacklist)", async function () {
    expect(await securityManager.isSecure(addr1.address)).to.be.true;
    await securityManager.addToBlacklist(addr1.address);
    expect(await securityManager.isSecure(addr1.address)).to.be.false;
  });

  it("Debe agregar y quitar contratos seguros", async function () {
    await securityManager.addSecureContract(addr1.address);
    expect(await securityManager.isContractSecure(addr1.address)).to.be.true;
    await securityManager.removeSecureContract(addr1.address);
    expect(await securityManager.isContractSecure(addr1.address)).to.be.false;
  });

  it("Debe fallar al agregar un contrato seguro con address(0)", async function () {
    await expect(securityManager.addSecureContract(ethers.constants.AddressZero)).to.be.revertedWith("Dirección inválida");
  });
}); 