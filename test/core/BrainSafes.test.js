const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BrainSafes", function () {
  let contract, owner, user;
  beforeEach(async () => {
    [owner, user] = await ethers.getSigners();
    const BrainSafes = await ethers.getContractFactory("BrainSafes");
    contract = await BrainSafes.deploy();
    await contract.deployed();
  });

  it("should deploy and have an owner", async () => {
    expect(await contract.owner()).to.equal(owner.address);
  });
}); 