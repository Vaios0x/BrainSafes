const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('BrainSafes - Roles', function () {
  let brainSafes, owner, admin, issuer, validator, user;

  beforeEach(async function () {
    [owner, admin, issuer, validator, user] = await ethers.getSigners();
    const BrainSafes = await ethers.getContractFactory('BrainSafes');
    brainSafes = await BrainSafes.deploy();
    await brainSafes.deployed();
    // Asignar roles (ajusta según la lógica real del contrato)
    await brainSafes.connect(owner).grantAdmin(admin.address);
    await brainSafes.connect(owner).grantIssuer(issuer.address);
    await brainSafes.connect(owner).grantValidator(validator.address);
  });

  it('reconoce correctamente a un admin', async function () {
    expect(await brainSafes.isAdmin(admin.address)).to.be.true;
    expect(await brainSafes.isAdmin(user.address)).to.be.false;
  });

  it('reconoce correctamente a un issuer', async function () {
    expect(await brainSafes.isIssuer(issuer.address)).to.be.true;
    expect(await brainSafes.isIssuer(user.address)).to.be.false;
  });

  it('reconoce correctamente a un validator', async function () {
    expect(await brainSafes.isValidator(validator.address)).to.be.true;
    expect(await brainSafes.isValidator(user.address)).to.be.false;
  });

  it('puede revocar roles y reflejarlo on-chain', async function () {
    await brainSafes.connect(owner).revokeAdmin(admin.address);
    expect(await brainSafes.isAdmin(admin.address)).to.be.false;
    await brainSafes.connect(owner).revokeIssuer(issuer.address);
    expect(await brainSafes.isIssuer(issuer.address)).to.be.false;
    await brainSafes.connect(owner).revokeValidator(validator.address);
    expect(await brainSafes.isValidator(validator.address)).to.be.false;
  });
}); 