const { expect } = require("chai");

describe("CertificateNFT - Revocación", function () {
  let cert, owner, minter, revoker, user;

  beforeEach(async function () {
    [owner, minter, revoker, user] = await ethers.getSigners();
    const CertificateNFT = await ethers.getContractFactory("CertificateNFT");
    cert = await CertificateNFT.deploy();
    await cert.deployed();
    await cert.grantMinter(minter.address);
    await cert.grantRevoker(revoker.address);
    await cert.connect(minter).mintCertificate(user.address, "ipfs://cert");
  });

  it("solo REVOKER_ROLE puede revocar", async function () {
    await expect(
      cert.connect(user).revokeCertificate(1)
    ).to.be.revertedWith("AccessControl");
    await expect(
      cert.connect(revoker).revokeCertificate(1)
    ).to.emit(cert, "CertificateRevoked");
    await expect(cert.ownerOf(1)).to.be.revertedWith("ERC721: invalid token ID");
  });
}); 