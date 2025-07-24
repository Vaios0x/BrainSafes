const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LoanManager", function () {
  let LoanManager, loanManager, MockERC20, token;
  let admin, lender, student, liquidator, other;

  beforeEach(async function () {
    [admin, lender, student, liquidator, other] = await ethers.getSigners();
    MockERC20 = await ethers.getContractFactory("MockERC20");
    token = await MockERC20.deploy("TestToken", "TTK", 18, ethers.parseEther("1000000"));
    await token.deployed();
    LoanManager = await ethers.getContractFactory("LoanManager");
    loanManager = await LoanManager.deploy(token.target);
    await loanManager.deployed();
    // Roles
    await loanManager.connect(admin).grantRole(await loanManager.LENDER_ROLE(), lender.address);
    await loanManager.connect(admin).grantRole(await loanManager.STUDENT_ROLE(), student.address);
    await loanManager.connect(admin).grantRole(await loanManager.LIQUIDATOR_ROLE(), liquidator.address);
    // Fondos para lender y student
    await token.transfer(lender.address, ethers.parseEther("10000"));
    await token.transfer(student.address, ethers.parseEther("1000"));
  });

  it("permite solicitar, fondear, repagar y liquidar un préstamo", async function () {
    // Student solicita préstamo
    await expect(
      loanManager.connect(student).requestLoan(ethers.parseEther("100"), ethers.parseEther("10"), 60 * 60 * 24 * 30)
    ).to.emit(loanManager, "LoanRequested");
    const loanId = 1;
    // Lender aprueba allowance y fondea
    await token.connect(lender).approve(loanManager.target, ethers.parseEther("100"));
    await expect(
      loanManager.connect(lender).fundLoan(loanId)
    ).to.emit(loanManager, "LoanFunded");
    // Student repaga
    await token.connect(student).approve(loanManager.target, ethers.parseEther("110"));
    await expect(
      loanManager.connect(student).repayLoan(loanId, ethers.parseEther("110"))
    ).to.emit(loanManager, "LoanRepaid");
    // Estado final
    expect(await loanManager.getLoanStatus(loanId)).to.equal(2); // Repaid
  });

  it("solo lender puede fondear, solo student puede repagar", async function () {
    await loanManager.connect(student).requestLoan(ethers.parseEther("100"), ethers.parseEther("10"), 1000);
    await token.connect(lender).approve(loanManager.target, ethers.parseEther("100"));
    await expect(
      loanManager.connect(other).fundLoan(1)
    ).to.be.reverted;
    await loanManager.connect(lender).fundLoan(1);
    await token.connect(student).approve(loanManager.target, ethers.parseEther("110"));
    await expect(
      loanManager.connect(lender).repayLoan(1, ethers.parseEther("110"))
    ).to.be.reverted;
  });

  it("marca default y permite liquidar solo en default", async function () {
    await loanManager.connect(student).requestLoan(ethers.parseEther("100"), ethers.parseEther("10"), 1);
    await token.connect(lender).approve(loanManager.target, ethers.parseEther("100"));
    await loanManager.connect(lender).fundLoan(1);
    // Avanza tiempo
    await ethers.provider.send("evm_increaseTime", [31 * 24 * 60 * 60]);
    await ethers.provider.send("evm_mine");
    await expect(
      loanManager.connect(admin).markDefault(1)
    ).to.emit(loanManager, "LoanDefaulted");
    await expect(
      loanManager.connect(liquidator).liquidateLoan(1)
    ).to.emit(loanManager, "LoanLiquidated");
    expect(await loanManager.getLoanStatus(1)).to.equal(4); // Liquidated
  });

  it("no permite repagar ni liquidar en estados incorrectos", async function () {
    await loanManager.connect(student).requestLoan(ethers.parseEther("100"), ethers.parseEther("10"), 1);
    await token.connect(lender).approve(loanManager.target, ethers.parseEther("100"));
    await loanManager.connect(lender).fundLoan(1);
    // Avanza tiempo y default
    await ethers.provider.send("evm_increaseTime", [31 * 24 * 60 * 60]);
    await ethers.provider.send("evm_mine");
    await loanManager.connect(admin).markDefault(1);
    await expect(
      loanManager.connect(student).repayLoan(1, ethers.parseEther("110"))
    ).to.be.reverted;
    await loanManager.connect(liquidator).liquidateLoan(1);
    await expect(
      loanManager.connect(liquidator).liquidateLoan(1)
    ).to.be.reverted;
  });
}); 