const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("UserExperience", function () {
  let UserExperience, userExperience, owner, addr1;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();
    UserExperience = await ethers.getContractFactory("UserExperience");
    userExperience = await UserExperience.deploy();
    await userExperience.deployed();
  });

  it("Debe permitir enviar y consultar feedback", async function () {
    await userExperience.submitFeedback("Mejorar la UX");
    expect(await userExperience.feedbackCount()).to.equal(1);
    const [user, message, timestamp] = await userExperience.getFeedback(0);
    expect(user).to.equal(owner.address);
    expect(message).to.equal("Mejorar la UX");
    expect(timestamp).to.be.a("BigNumber");
  });

  it("Debe estimar el gas de una transacción simple", async function () {
    const target = ethers.constants.AddressZero;
    const data = "0x";
    const value = 0;
    const gas = await userExperience.estimateTransactionCosts(target, data, value);
    expect(gas).to.equal(21000);
  });

  it("Debe estimar el gas de una transacción con datos y valor", async function () {
    const target = ethers.constants.AddressZero;
    const data = ethers.utils.hexlify(ethers.utils.toUtf8Bytes("test"));
    const value = 1;
    const gas = await userExperience.estimateTransactionCosts(target, data, value);
    expect(gas).to.be.gte(21000 + 4 * 16 + 9000);
  });

  it("Debe devolver sugerencias de optimización UX", async function () {
    const tips = await userExperience.getOptimizationTips();
    expect(tips.length).to.equal(3);
    expect(tips[0]).to.include("multicall");
    expect(tips[1]).to.include("batch");
    expect(tips[2]).to.include("gas");
  });
}); 