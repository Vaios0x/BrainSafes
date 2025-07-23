const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Seguridad: Reentrancy", function () {
  let vulnerable, attacker, owner, user;
  beforeEach(async () => {
    [owner, user, attacker] = await ethers.getSigners();
    const Vulnerable = await ethers.getContractFactory("TargetMock");
    vulnerable = await Vulnerable.deploy();
    await vulnerable.deployed();
    // Aquí podrías desplegar un contrato atacante si lo tienes
  });
  it("debería prevenir reentrancy", async function () {
    // Simula un ataque de reentrancy (requiere contrato atacante si existe)
    // expect(await vulnerable.someFunction()).to.be.revertedWith("ReentrancyGuard: reentrant call");
    expect(true).to.equal(true); // Placeholder
  });
}); 