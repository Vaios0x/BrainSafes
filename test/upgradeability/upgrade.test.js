const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
describe("Upgradeabilidad: BrainSafesUpgradeable", function () {
  let contract, owner;
  beforeEach(async () => {
    [owner] = await ethers.getSigners();
    const BrainSafesUpgradeable = await ethers.getContractFactory("BrainSafesUpgradeable");
    contract = await upgrades.deployProxy(BrainSafesUpgradeable, [], { initializer: 'initialize' });
    await contract.deployed();
  });
  it("debería permitir upgrade a nueva implementación", async function () {
    const BrainSafesV2 = await ethers.getContractFactory("BrainSafesUpgradeable");
    const upgraded = await upgrades.upgradeProxy(contract.address, BrainSafesV2);
    expect(upgraded.address).to.equal(contract.address);
  });
}); 