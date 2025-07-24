const { expect } = require("chai");

describe("AccreditationBody", function () {
  let body, owner, accreditor, endorser;

  beforeEach(async function () {
    [owner, accreditor, endorser] = await ethers.getSigners();
    const AccreditationBody = await ethers.getContractFactory("AccreditationBody");
    body = await AccreditationBody.deploy();
    await body.deployed();
  });

  it("puede registrar y revocar acreditadores", async function () {
    await body.registerAccreditor(accreditor.address, "Org", "ipfs://meta");
    let acc = await body.accreditors(accreditor.address);
    expect(acc.active).to.be.true;
    await body.revokeAccreditor(accreditor.address);
    acc = await body.accreditors(accreditor.address);
    expect(acc.active).to.be.false;
  });

  it("puede hacer endorsements", async function () {
    await body.registerAccreditor(accreditor.address, "Org", "ipfs://meta");
    await body.connect(endorser).endorseAccreditor(accreditor.address);
    const list = await body.endorsements(accreditor.address);
    expect(list[0]).to.equal(endorser.address);
  });
}); 