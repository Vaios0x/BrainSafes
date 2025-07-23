const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ScholarshipManager", function () {
  let contract, owner, user;
  beforeEach(async () => {
    [owner, user] = await ethers.getSigners();
    const ScholarshipManager = await ethers.getContractFactory("ScholarshipManager");
    contract = await ScholarshipManager.deploy();
    await contract.deployed();
  });

  it("should deploy and allow application", async () => {
    await contract.connect(user).applyForScholarship("Data Science");
    const status = await contract.getApplicationStatus(user.address);
    expect(status).to.equal(1); // 1 = Pending
  });
}); 