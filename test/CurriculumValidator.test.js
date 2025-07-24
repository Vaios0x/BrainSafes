const { expect } = require("chai");

describe("CurriculumValidator", function () {
  let body, validator, owner, accreditor, user;

  beforeEach(async function () {
    [owner, accreditor, user] = await ethers.getSigners();
    const AccreditationBody = await ethers.getContractFactory("AccreditationBody");
    body = await AccreditationBody.deploy();
    await body.deployed();
    await body.registerAccreditor(accreditor.address, "Org", "ipfs://meta");
    const CurriculumValidator = await ethers.getContractFactory("CurriculumValidator");
    validator = await CurriculumValidator.deploy(body.address);
    await validator.deployed();
  });

  it("permite submit y validate solo por acreditador activo", async function () {
    await validator.connect(user).submitCurriculum("Curso", "ipfs://meta");
    await expect(
      validator.connect(user).validateCurriculum(1)
    ).to.be.revertedWith("Solo acreditadores activos pueden validar");
    await expect(
      validator.connect(accreditor).validateCurriculum(1)
    ).to.emit(validator, "CurriculumValidated");
  });
}); 