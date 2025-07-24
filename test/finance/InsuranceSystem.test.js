const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("InsuranceSystem", function () {
  let InsuranceSystem, insurance, MockERC20, token;
  let admin, insurer, student, claims, other;

  beforeEach(async function () {
    [admin, insurer, student, claims, other] = await ethers.getSigners();
    MockERC20 = await ethers.getContractFactory("MockERC20");
    token = await MockERC20.deploy("TestToken", "TTK", 18, ethers.parseEther("1000000"));
    await token.deployed();
    InsuranceSystem = await ethers.getContractFactory("InsuranceSystem");
    insurance = await InsuranceSystem.deploy(token.target);
    await insurance.deployed();
    // Roles
    await insurance.connect(admin).grantRole(await insurance.INSURER_ROLE(), insurer.address);
    await insurance.connect(admin).grantRole(await insurance.STUDENT_ROLE(), student.address);
    await insurance.connect(admin).grantRole(await insurance.CLAIMS_ROLE(), claims.address);
    // Fondos para student
    await token.transfer(student.address, ethers.parseEther("1000"));
  });

  it("permite comprar, reclamar y liquidar una póliza", async function () {
    // Student compra póliza
    await token.connect(student).approve(insurance.target, ethers.parseEther("100"));
    await expect(
      insurance.connect(student).purchasePolicy(ethers.parseEther("100"), ethers.parseEther("500"), 60 * 60 * 24 * 30)
    ).to.emit(insurance, "PolicyPurchased");
    const policyId = 1;
    // Reclama
    await expect(
      insurance.connect(student).claimPolicy(policyId)
    ).to.emit(insurance, "PolicyClaimed");
    // Liquidación
    await expect(
      insurance.connect(claims).settleClaim(policyId)
    ).to.emit(insurance, "PolicySettled");
    expect(await insurance.getPolicyStatus(policyId)).to.equal(2); // Settled
  });

  it("solo student puede reclamar, solo claims puede liquidar", async function () {
    await token.connect(student).approve(insurance.target, ethers.parseEther("100"));
    await insurance.connect(student).purchasePolicy(ethers.parseEther("100"), ethers.parseEther("500"), 1000);
    await expect(
      insurance.connect(other).claimPolicy(1)
    ).to.be.reverted;
    await insurance.connect(student).claimPolicy(1);
    await expect(
      insurance.connect(other).settleClaim(1)
    ).to.be.reverted;
  });

  it("permite cancelar solo si está activa", async function () {
    await token.connect(student).approve(insurance.target, ethers.parseEther("100"));
    await insurance.connect(student).purchasePolicy(ethers.parseEther("100"), ethers.parseEther("500"), 1000);
    await expect(
      insurance.connect(admin).cancelPolicy(1)
    ).to.emit(insurance, "PolicyCancelled");
    expect(await insurance.getPolicyStatus(1)).to.equal(3); // Cancelled
  });

  it("no permite reclamar ni liquidar en estados incorrectos", async function () {
    await token.connect(student).approve(insurance.target, ethers.parseEther("100"));
    await insurance.connect(student).purchasePolicy(ethers.parseEther("100"), ethers.parseEther("500"), 1000);
    await insurance.connect(admin).cancelPolicy(1);
    await expect(
      insurance.connect(student).claimPolicy(1)
    ).to.be.reverted;
    await expect(
      insurance.connect(claims).settleClaim(1)
    ).to.be.reverted;
  });
}); 