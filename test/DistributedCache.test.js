const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DistributedCache", function () {
  let DistributedCache, distributedCache, owner;

  beforeEach(async function () {
    [owner] = await ethers.getSigners();
    DistributedCache = await ethers.getContractFactory("DistributedCache");
    distributedCache = await DistributedCache.deploy();
    await distributedCache.deployed();
  });

  it("Debe guardar y obtener un valor antes de expirar", async function () {
    const key = ethers.utils.formatBytes32String("test1");
    const data = ethers.utils.toUtf8Bytes("valor-cache");
    const expiresAt = Math.floor(Date.now() / 1000) + 1000;
    await distributedCache.set(key, data, expiresAt);
    const result = await distributedCache.get(key);
    expect(ethers.utils.toUtf8String(result)).to.equal("valor-cache");
  });

  it("Debe devolver vacío si el valor ha expirado", async function () {
    const key = ethers.utils.formatBytes32String("test2");
    const data = ethers.utils.toUtf8Bytes("expirado");
    const expiresAt = Math.floor(Date.now() / 1000) - 10;
    await distributedCache.set(key, data, expiresAt);
    const result = await distributedCache.get(key);
    expect(result).to.equal("0x");
  });

  it("Debe limpiar una entrada del cache", async function () {
    const key = ethers.utils.formatBytes32String("test3");
    const data = ethers.utils.toUtf8Bytes("borrar");
    const expiresAt = Math.floor(Date.now() / 1000) + 1000;
    await distributedCache.set(key, data, expiresAt);
    await distributedCache.clear(key);
    const result = await distributedCache.get(key);
    expect(result).to.equal("0x");
  });

  it("Debe limpiar múltiples entradas expiradas", async function () {
    const key1 = ethers.utils.formatBytes32String("exp1");
    const key2 = ethers.utils.formatBytes32String("exp2");
    const data = ethers.utils.toUtf8Bytes("exp");
    const now = Math.floor(Date.now() / 1000);
    await distributedCache.set(key1, data, now - 10);
    await distributedCache.set(key2, data, now + 1000);
    await distributedCache.clearExpired([key1, key2]);
    const result1 = await distributedCache.get(key1);
    const result2 = await distributedCache.get(key2);
    expect(result1).to.equal("0x");
    expect(ethers.utils.toUtf8String(result2)).to.equal("exp");
  });

  it("Debe fallar si expiresAt es menor o igual a block.timestamp", async function () {
    const key = ethers.utils.formatBytes32String("fail");
    const data = ethers.utils.toUtf8Bytes("fail");
    const expiresAt = Math.floor(Date.now() / 1000) - 1;
    await expect(distributedCache.set(key, data, expiresAt)).to.be.revertedWith("Expiración inválida");
  });
}); 