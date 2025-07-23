const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("JobMarketplace", function () {
  let contract, employer, applicant;
  beforeEach(async () => {
    [employer, applicant] = await ethers.getSigners();
    const JobMarketplace = await ethers.getContractFactory("JobMarketplace");
    contract = await JobMarketplace.deploy();
    await contract.deployed();
  });

  it("should allow employer to post a job", async () => {
    await contract.connect(employer).postJob("Solidity Dev", 1000);
    const job = await contract.getJob(0);
    expect(job.title).to.equal("Solidity Dev");
  });
}); 