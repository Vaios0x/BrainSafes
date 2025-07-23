const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EDUToken", function () {
  let token, owner, user;
  beforeEach(async () => {
    [owner, user] = await ethers.getSigners();
    const EDUToken = await ethers.getContractFactory("EDUToken");
    token = await EDUToken.deploy();
    await token.deployed();
  });

  it("should mint tokens", async () => {
    await token.mint(user.address, 1000);
    expect(await token.balanceOf(user.address)).to.equal(1000);
  });
}); 