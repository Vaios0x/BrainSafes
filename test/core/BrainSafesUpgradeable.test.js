const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("BrainSafesUpgradeable", function () {
  let contract, owner;
  beforeEach(async () => {
    [owner] = await ethers.getSigners();
    const BrainSafesUpgradeable = await ethers.getContractFactory("BrainSafesUpgradeable");
    contract = await upgrades.deployProxy(BrainSafesUpgradeable, [], { initializer: 'initialize' });
    await contract.deployed();
  });

  it("should deploy as upgradeable and have an owner", async () => {
    expect(await contract.owner()).to.equal(owner.address);
  });
}); 