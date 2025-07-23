const { expect } = require("chai");
const { ethers } = require("hardhat");
describe("Integración: Cache + NFT", function () {
  let cache, nft, owner;
  beforeEach(async () => {
    [owner] = await ethers.getSigners();
    const DistributedCache = await ethers.getContractFactory("DistributedCache");
    cache = await DistributedCache.deploy();
    await cache.deployed();
    const CertificateNFT = await ethers.getContractFactory("CertificateNFT");
    nft = await CertificateNFT.deploy();
    await nft.deployed();
  });
  it("debería cachear el resultado de un mint de NFT", async function () {
    await nft.mint(owner.address, "ipfs://metadata");
    const data = ethers.utils.defaultAbiCoder.encode(["address", "string"], [owner.address, "ipfs://metadata"]);
    await cache.set(ethers.utils.keccak256(data), data, Math.floor(Date.now() / 1000) + 3600);
    const cached = await cache.get(ethers.utils.keccak256(data));
    expect(cached).to.not.equal("0x");
  });
}); 