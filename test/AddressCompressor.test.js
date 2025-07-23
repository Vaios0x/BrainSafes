const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AddressCompressor", function () {
  let AddressCompressor, addressCompressor, owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    AddressCompressor = await ethers.getContractFactory("AddressCompressor");
    addressCompressor = await AddressCompressor.deploy();
    await addressCompressor.deployed();
  });

  it("Debe registrar una dirección y devolver un índice válido", async function () {
    const tx = await addressCompressor.registerAddress(addr1.address);
    const receipt = await tx.wait();
    const event = receipt.events.find(e => e.event === "AddressRegistered");
    expect(event.args.addr).to.equal(addr1.address);
    expect(event.args.index).to.be.a("BigNumber");
    expect(event.args.index).to.be.gte(0);
  });

  it("Debe comprimir una dirección registrada", async function () {
    await addressCompressor.registerAddress(addr1.address);
    const index = await addressCompressor.compressAddress(addr1.address);
    expect(index).to.be.a("BigNumber");
    expect(index).to.be.gte(0);
  });

  it("Debe descomprimir un índice a la dirección original", async function () {
    await addressCompressor.registerAddress(addr1.address);
    const index = await addressCompressor.compressAddress(addr1.address);
    const addr = await addressCompressor.decompressAddress(index);
    expect(addr).to.equal(addr1.address);
  });

  it("Debe fallar al comprimir una dirección no registrada", async function () {
    await expect(addressCompressor.compressAddress(addr2.address)).to.be.revertedWith("Dirección no registrada");
  });

  it("Debe fallar al descomprimir un índice inválido", async function () {
    await expect(addressCompressor.decompressAddress(999999)).to.be.revertedWith("Índice no válido");
  });

  it("Debe fallar al registrar la dirección cero", async function () {
    await expect(addressCompressor.registerAddress(ethers.constants.AddressZero)).to.be.revertedWith("Dirección inválida");
  });
}); 