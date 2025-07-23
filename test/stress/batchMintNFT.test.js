const { ethers } = require("hardhat");
describe("Stress: Batch mint de NFTs", function () {
  let nft, owner;
  beforeEach(async () => {
    [owner] = await ethers.getSigners();
    const CertificateNFT = await ethers.getContractFactory("CertificateNFT");
    nft = await CertificateNFT.deploy();
    await nft.deployed();
  });
  it("debería mintear 1000 NFTs en batch", async function () {
    const txs = [];
    for (let i = 0; i < 1000; i++) {
      txs.push(nft.mint(owner.address, `ipfs://metadata${i}`));
    }
    await Promise.all(txs);
    expect(await nft.ownerOf(1000)).to.equal(owner.address);
  });
}); 