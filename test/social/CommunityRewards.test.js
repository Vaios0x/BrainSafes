const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CommunityRewards", function () {
  let CommunityRewards, rewards, MockERC20, token, MockBadge, badge;
  let admin, oracle, user, other;

  beforeEach(async function () {
    [admin, oracle, user, other] = await ethers.getSigners();
    MockERC20 = await ethers.getContractFactory("MockERC20");
    token = await MockERC20.deploy("Reward", "RWD", 18, ethers.parseEther("1000000"));
    await token.deployed();
    MockBadge = await ethers.getContractFactory("MockBadge");
    badge = await MockBadge.deploy();
    await badge.deployed();
    CommunityRewards = await ethers.getContractFactory("CommunityRewards");
    rewards = await CommunityRewards.deploy(token.target, badge.target);
    await rewards.deployed();
    await rewards.connect(admin).grantRole(await rewards.ORACLE_ROLE(), oracle.address);
    await token.transfer(rewards.target, ethers.parseEther("10000"));
  });

  it("permite asignar puntos y reclamar tokens", async function () {
    await expect(rewards.connect(admin).assignPoints(user.address, 500)).to.emit(rewards, "PointsAssigned");
    await expect(rewards.connect(user).claimTokenReward(200)).to.emit(rewards, "RewardClaimed");
    expect(await rewards.getPoints(user.address)).to.equal(300);
  });

  it("permite asignar puntos por oráculo y reclamar badge", async function () {
    await expect(rewards.connect(oracle).assignPointsOracle(user.address, 1000)).to.emit(rewards, "PointsAssigned");
    await expect(rewards.connect(user).claimBadge("ipfs://badge")).to.emit(rewards, "BadgeClaimed");
    expect(await rewards.hasBadge(user.address)).to.be.true;
  });

  it("no permite reclamar sin puntos suficientes o doble badge", async function () {
    await expect(rewards.connect(user).claimTokenReward(100)).to.be.reverted;
    await rewards.connect(admin).assignPoints(user.address, 1000);
    await rewards.connect(user).claimBadge("ipfs://badge");
    await expect(rewards.connect(user).claimBadge("ipfs://badge")).to.be.reverted;
  });
}); 