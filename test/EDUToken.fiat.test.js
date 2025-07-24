const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EDUToken - mintFiatUser (pagos fiat)", function () {
  let EDUToken, eduToken, owner, backend, user, other;
  const paymentId = "pi_test_123456";
  const amount = ethers.utils.parseEther("100");

  beforeEach(async function () {
    [owner, backend, user, other] = await ethers.getSigners();
    EDUToken = await ethers.getContractFactory("EDUToken");
    eduToken = await EDUToken.deploy();
    await eduToken.deployed();
    // Otorgar rol de minter fiat al backend
    const FIAT_MINTER_ROLE = await eduToken.FIAT_MINTER_ROLE();
    await eduToken.connect(owner).grantRole(FIAT_MINTER_ROLE, backend.address);
  });

  it("debe permitir al backend emitir tokens tras pago fiat", async function () {
    await expect(
      eduToken.connect(backend).mintFiatUser(user.address, amount, paymentId)
    )
      .to.emit(eduToken, "FiatUserMinted")
      .withArgs(user.address, amount, paymentId);
    expect(await eduToken.balanceOf(user.address)).to.equal(amount);
    expect(await eduToken.processedFiatPayments(paymentId)).to.be.true;
  });

  it("no debe permitir doble emisión para el mismo paymentId", async function () {
    await eduToken.connect(backend).mintFiatUser(user.address, amount, paymentId);
    await expect(
      eduToken.connect(backend).mintFiatUser(user.address, amount, paymentId)
    ).to.be.revertedWith("Pago fiat ya procesado");
  });

  it("no debe permitir a otros sin rol FIAT_MINTER_ROLE", async function () {
    await expect(
      eduToken.connect(other).mintFiatUser(user.address, amount, paymentId + "x")
    ).to.be.revertedWith(/acceso denegado|missing role|not have/);
  });

  it("no debe permitir dirección cero ni cantidad cero", async function () {
    await expect(
      eduToken.connect(backend).mintFiatUser(ethers.constants.AddressZero, amount, paymentId + "1")
    ).to.be.revertedWith("Dirección inválida");
    await expect(
      eduToken.connect(backend).mintFiatUser(user.address, 0, paymentId + "2")
    ).to.be.revertedWith("Cantidad inválida");
  });
}); 