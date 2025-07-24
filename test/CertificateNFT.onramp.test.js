const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CertificateNFT - mintOnRamp (on-ramp NFT)", function () {
  let CertificateNFT, nft, owner, backend, user, other;
  const txHash = "0xabc123onramp";
  const provider = "moonpay";

  beforeEach(async function () {
    [owner, backend, user, other] = await ethers.getSigners();
    CertificateNFT = await ethers.getContractFactory("CertificateNFT");
    nft = await CertificateNFT.deploy();
    await nft.deployed();
    // Otorgar rol de minter onramp al backend
    const ONRAMP_MINTER_ROLE = await nft.ONRAMP_MINTER_ROLE();
    await nft.connect(owner).grantRole(ONRAMP_MINTER_ROLE, backend.address);
  });

  it("debe permitir al backend emitir NFT tras compra on-ramp", async function () {
    const tx = await nft.connect(backend).mintOnRamp(user.address, txHash, provider);
    const receipt = await tx.wait();
    const event = receipt.events.find(e => e.event === "OnRampNFTMinted");
    expect(event.args.to).to.equal(user.address);
    expect(event.args.txHash).to.equal(txHash);
    expect(event.args.provider).to.equal(provider);
    // Verifica mapping
    expect(await nft.processedOnRampTx(txHash)).to.be.true;
    const tokenId = await nft.onRampTxToTokenId(txHash);
    expect(tokenId).to.be.a("BigNumber");
  });

  it("no debe permitir doble emisión para el mismo txHash", async function () {
    await nft.connect(backend).mintOnRamp(user.address, txHash, provider);
    await expect(
      nft.connect(backend).mintOnRamp(user.address, txHash, provider)
    ).to.be.revertedWith("On-ramp ya procesado");
  });

  it("no debe permitir a otros sin rol ONRAMP_MINTER_ROLE", async function () {
    await expect(
      nft.connect(other).mintOnRamp(user.address, txHash + "x", provider)
    ).to.be.revertedWith(/acceso denegado|missing role|not have/);
  });

  it("no debe permitir dirección cero", async function () {
    await expect(
      nft.connect(backend).mintOnRamp(ethers.constants.AddressZero, txHash + "1", provider)
    ).to.be.revertedWith("Dirección inválida");
  });
}); 