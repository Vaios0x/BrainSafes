const { expect } = require("chai");

describe("BadgeNFT - Revocación", function () {
  let badge, owner, minter, revoker, user;

  beforeEach(async function () {
    [owner, minter, revoker, user] = await ethers.getSigners();
    const BadgeNFT = await ethers.getContractFactory("BadgeNFT");
    badge = await BadgeNFT.deploy();
    await badge.deployed();
    await badge.grantMinter(minter.address);
    await badge.grantRevoker(revoker.address);
    await badge.connect(minter).mintBadge(user.address, "ipfs://badge");
  });

  it("solo REVOKER_ROLE puede revocar", async function () {
    await expect(
      badge.connect(user).revokeBadge(1)
    ).to.be.revertedWith("AccessControl");
    await expect(
      badge.connect(revoker).revokeBadge(1)
    ).to.emit(badge, "BadgeRevoked");
    await expect(badge.ownerOf(1)).to.be.revertedWith("ERC721: invalid token ID");
  });
}); 