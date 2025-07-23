const { expect } = require("chai");
const { ethers } = require("hardhat");
describe("Integración: Multicall + Cache + Compresión", function () {
  let multicall, cache, compressor, owner;
  beforeEach(async () => {
    [owner] = await ethers.getSigners();
    const EnhancedMulticall = await ethers.getContractFactory("EnhancedMulticall");
    multicall = await EnhancedMulticall.deploy();
    await multicall.deployed();
    const DistributedCache = await ethers.getContractFactory("DistributedCache");
    cache = await DistributedCache.deploy();
    await cache.deployed();
    const AddressCompressor = await ethers.getContractFactory("AddressCompressor");
    compressor = await AddressCompressor.deploy();
    await compressor.deployed();
  });
  it("debería ejecutar multicall, cachear y comprimir direcciones", async function () {
    const compressed = await compressor.compressAddress(owner.address);
    const calls = [{ target: owner.address, callData: "0x", gasLimit: 100000 }];
    await multicall.aggregate(calls);
    const data = ethers.utils.defaultAbiCoder.encode(["uint256"], [compressed]);
    await cache.set(ethers.utils.keccak256(data), data, Math.floor(Date.now() / 1000) + 3600);
    const cached = await cache.get(ethers.utils.keccak256(data));
    expect(cached).to.not.equal("0x");
  });
}); 