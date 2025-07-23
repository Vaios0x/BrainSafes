const { ethers } = require("hardhat");
describe("Stress: Medición de gas", function () {
  let nft, multicall, owner;
  beforeEach(async () => {
    [owner] = await ethers.getSigners();
    const CertificateNFT = await ethers.getContractFactory("CertificateNFT");
    nft = await CertificateNFT.deploy();
    await nft.deployed();
    const EnhancedMulticall = await ethers.getContractFactory("EnhancedMulticall");
    multicall = await EnhancedMulticall.deploy();
    await multicall.deployed();
  });
  it("debería medir el gas de mint de NFT", async function () {
    const tx = await nft.mint(owner.address, "ipfs://metadata");
    const receipt = await tx.wait();
    console.log("Gas usado en mint NFT:", receipt.gasUsed.toString());
  });
  it("debería medir el gas de multicall batch", async function () {
    const calls = [];
    for (let i = 0; i < 100; i++) {
      calls.push({ target: owner.address, callData: "0x", gasLimit: 100000 });
    }
    const tx = await multicall.aggregate(calls);
    const receipt = await tx.wait();
    console.log("Gas usado en multicall batch:", receipt.gasUsed.toString());
  });
}); 