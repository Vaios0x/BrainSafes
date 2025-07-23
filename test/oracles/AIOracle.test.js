const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AIOracle", function () {
  let contract, owner;
  beforeEach(async () => {
    [owner] = await ethers.getSigners();
    const AIOracle = await ethers.getContractFactory("AIOracle");
    contract = await AIOracle.deploy();
    await contract.deployed();
  });

  it("should return a prediction", async () => {
    const prediction = await contract.getPrediction("student123");
    expect(prediction).to.be.a("string");
  });
}); 