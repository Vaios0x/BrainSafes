const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Guardianía avanzada", function () {
  let guardian, newGuardian, user, LoanManager, loan, InsuranceSystem, ins, DeFiIntegration, defi, StudyGroups, groups, MentorshipProgram, mentor, CommunityRewards, rewards, MockERC20, token, MockBadge, badge;

  beforeEach(async function () {
    [guardian, newGuardian, user] = await ethers.getSigners();
    MockERC20 = await ethers.getContractFactory("MockERC20");
    token = await MockERC20.deploy("TKN", "TKN", 18, ethers.parseEther("1000000"));
    await token.deployed();
    MockBadge = await ethers.getContractFactory("MockBadge");
    badge = await MockBadge.deploy();
    await badge.deployed();
    LoanManager = await ethers.getContractFactory("LoanManager");
    loan = await LoanManager.deploy(token.target);
    await loan.deployed();
    InsuranceSystem = await ethers.getContractFactory("InsuranceSystem");
    ins = await InsuranceSystem.deploy(token.target);
    await ins.deployed();
    DeFiIntegration = await ethers.getContractFactory("DeFiIntegration");
    defi = await DeFiIntegration.deploy(token.target);
    await defi.deployed();
    StudyGroups = await ethers.getContractFactory("StudyGroups");
    groups = await StudyGroups.deploy();
    await groups.deployed();
    MentorshipProgram = await ethers.getContractFactory("MentorshipProgram");
    mentor = await MentorshipProgram.deploy();
    await mentor.deployed();
    CommunityRewards = await ethers.getContractFactory("CommunityRewards");
    rewards = await CommunityRewards.deploy(token.target, badge.target);
    await rewards.deployed();
  });

  it("solo el guardian puede setGuardian y funciones críticas", async function () {
    // LoanManager
    await expect(loan.connect(user).setGuardian(newGuardian.address)).to.be.revertedWith("Solo guardian");
    await expect(loan.connect(guardian).setGuardian(newGuardian.address)).to.not.be.reverted;
    await expect(loan.connect(guardian).setRateOracle(user.address)).to.be.revertedWith("Solo guardian");
    await expect(loan.connect(newGuardian).setRateOracle(user.address)).to.not.be.reverted;
    // InsuranceSystem
    await expect(ins.connect(user).setGuardian(newGuardian.address)).to.be.revertedWith("Solo guardian");
    await expect(ins.connect(guardian).setGuardian(newGuardian.address)).to.not.be.reverted;
    // DeFiIntegration
    await expect(defi.connect(user).setGuardian(newGuardian.address)).to.be.revertedWith("Solo guardian");
    await expect(defi.connect(guardian).setGuardian(newGuardian.address)).to.not.be.reverted;
    await expect(defi.connect(guardian).setAave(user.address)).to.be.revertedWith("Solo guardian");
    await expect(defi.connect(newGuardian).setAave(user.address)).to.not.be.reverted;
    // StudyGroups
    await expect(groups.connect(user).setGuardian(newGuardian.address)).to.be.revertedWith("Solo guardian");
    await expect(groups.connect(guardian).setGuardian(newGuardian.address)).to.not.be.reverted;
    // MentorshipProgram
    await expect(mentor.connect(user).setGuardian(newGuardian.address)).to.be.revertedWith("Solo guardian");
    await expect(mentor.connect(guardian).setGuardian(newGuardian.address)).to.not.be.reverted;
    // CommunityRewards
    await expect(rewards.connect(user).setGuardian(newGuardian.address)).to.be.revertedWith("Solo guardian");
    await expect(rewards.connect(guardian).setGuardian(newGuardian.address)).to.not.be.reverted;
  });
}); 