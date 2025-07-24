const { expect } = require("chai");

describe("BadgeNFT", function () {
  let badge, owner, minter, user;

  beforeEach(async function () {
    [owner, minter, user] = await ethers.getSigners();
    const BadgeNFT = await ethers.getContractFactory("BadgeNFT");
    badge = await BadgeNFT.deploy();
    await badge.deployed();
    await badge.grantMinter(minter.address);
  });

  it("solo MINTER_ROLE puede mintear", async function () {
    await expect(
      badge.connect(user).mintBadge(user.address, "ipfs://badge")
    ).to.be.revertedWith("AccessControl");
    await expect(
      badge.connect(minter).mintBadge(user.address, "ipfs://badge")
    ).to.emit(badge, "Transfer");
  });

  it("tokenURI correcto", async function () {
    await badge.connect(minter).mintBadge(user.address, "ipfs://badge1");
    expect(await badge.tokenURI(1)).to.equal("ipfs://badge1");
  });

  it("admin puede otorgar rol de minter", async function () {
    await badge.grantMinter(user.address);
    await expect(
      badge.connect(user).mintBadge(user.address, "ipfs://badge2")
    ).to.emit(badge, "Transfer");
  });
}); 