const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DeFiIntegration", function () {
  let DeFiIntegration, defi, MockERC20, token;
  let admin, student, other;

  beforeEach(async function () {
    [admin, student, other] = await ethers.getSigners();
    MockERC20 = await ethers.getContractFactory("MockERC20");
    token = await MockERC20.deploy("TestToken", "TTK", 18, ethers.parseEther("1000000"));
    await token.deployed();
    DeFiIntegration = await ethers.getContractFactory("DeFiIntegration");
    defi = await DeFiIntegration.deploy(token.target);
    await defi.deployed();
    // Roles
    await defi.connect(admin).grantRole(await defi.STUDENT_ROLE(), student.address);
    // Fondos para student
    await token.transfer(student.address, ethers.parseEther("1000"));
    await token.connect(student).approve(defi.target, ethers.parseEther("1000"));
  });

  it("permite depositar, distribuir yield y retirar", async function () {
    await expect(
      defi.connect(student).deposit(ethers.parseEther("100"))
    ).to.emit(defi, "Deposited");
    // Admin distribuye yield
    await token.connect(admin).approve(defi.target, ethers.parseEther("10"));
    await token.transfer(defi.target, ethers.parseEther("10"));
    await expect(
      defi.connect(admin).distributeYield(ethers.parseEther("10"))
    ).to.emit(defi, "YieldDistributed");
    // Retiro
    await expect(
      defi.connect(student).withdraw()
    ).to.emit(defi, "Withdrawn");
    expect(await defi.getDeposit(student.address)).to.equal(0);
  });

  it("solo student puede depositar, solo admin puede distribuir yield", async function () {
    await expect(
      defi.connect(other).deposit(ethers.parseEther("100"))
    ).to.be.reverted;
    await defi.connect(student).deposit(ethers.parseEther("100"));
    await token.connect(admin).approve(defi.target, ethers.parseEther("10"));
    await token.transfer(defi.target, ethers.parseEther("10"));
    await expect(
      defi.connect(other).distributeYield(ethers.parseEther("10"))
    ).to.be.reverted;
  });

  it("no permite retirar si no hay depósito", async function () {
    await expect(
      defi.connect(student).withdraw()
    ).to.be.reverted;
  });
}); 