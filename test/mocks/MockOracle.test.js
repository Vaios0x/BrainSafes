const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Mock: Oráculo simulado", function () {
  let mockOracle, owner;
  beforeEach(async () => {
    [owner] = await ethers.getSigners();
    const MockOracle = await ethers.getContractFactory("MockChainlinkOracle");
    mockOracle = await MockOracle.deploy();
    await mockOracle.deployed();
  });
  it("debería devolver un valor simulado", async function () {
    const value = await mockOracle.getLatestAnswer();
    expect(value).to.be.a("number");
  });
}); 