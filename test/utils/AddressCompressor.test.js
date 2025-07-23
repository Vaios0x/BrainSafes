const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AddressCompressor", function () {
  let compressor, owner, user;
  beforeEach(async () => {
    [owner, user] = await ethers.getSigners();
    const AddressCompressor = await ethers.getContractFactory("AddressCompressor");
    compressor = await AddressCompressor.deploy();
    await compressor.deployed();
  });
  it("debería comprimir y descomprimir direcciones", async function () {
    const index = await compressor.compressAddress(user.address);
    const addr = await compressor.decompressAddress(index);
    expect(addr).to.equal(user.address);
  });
}); 