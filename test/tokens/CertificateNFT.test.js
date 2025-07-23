const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CertificateNFT", function () {
  let nft, owner, user;
  beforeEach(async () => {
    [owner, user] = await ethers.getSigners();
    const CertificateNFT = await ethers.getContractFactory("CertificateNFT");
    nft = await CertificateNFT.deploy();
    await nft.deployed();
  });

  it("should mint a certificate NFT", async () => {
    await nft.mint(user.address, "ipfs://metadata");
    expect(await nft.ownerOf(1)).to.equal(user.address);
  });
}); 