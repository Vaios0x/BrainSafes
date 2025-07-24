const { expect } = require("chai");

describe("SkillAssessment", function () {
  let badge, body, validator, assessment, owner, assessor, student;

  beforeEach(async function () {
    [owner, assessor, student] = await ethers.getSigners();
    const BadgeNFT = await ethers.getContractFactory("BadgeNFT");
    badge = await BadgeNFT.deploy();
    await badge.deployed();
    await badge.grantMinter(owner.address);
    const AccreditationBody = await ethers.getContractFactory("AccreditationBody");
    body = await AccreditationBody.deploy();
    await body.deployed();
    await body.registerAccreditor(assessor.address, "Org", "ipfs://meta");
    const CurriculumValidator = await ethers.getContractFactory("CurriculumValidator");
    validator = await CurriculumValidator.deploy(body.address);
    await validator.deployed();
    await validator.connect(student).submitCurriculum("Curso", "ipfs://meta");
    await validator.connect(assessor).validateCurriculum(1);
    const SkillAssessment = await ethers.getContractFactory("SkillAssessment");
    assessment = await SkillAssessment.deploy(badge.address, validator.address);
    await assessment.deployed();
    await assessment.grantRole(await assessment.ASSESSOR_ROLE(), assessor.address);
  });

  it("solo ASSESSOR_ROLE puede evaluar y solo currículos validados", async function () {
    await expect(
      assessment.connect(student).assessSkill(student.address, "Solidity", "ipfs://evidence", 90, true, "ipfs://badge", 1)
    ).to.be.revertedWith("AccessControl");
    await expect(
      assessment.connect(assessor).assessSkill(student.address, "Solidity", "ipfs://evidence", 90, true, "ipfs://badge", 1)
    ).to.emit(assessment, "SkillAssessed");
    // Si el currículo no está validado
    await validator.connect(student).submitCurriculum("Otro", "ipfs://meta");
    await expect(
      assessment.connect(assessor).assessSkill(student.address, "Solidity", "ipfs://evidence", 90, true, "ipfs://badge", 2)
    ).to.be.revertedWith("Currículo no validado");
  });

  it("puede mintear badges especiales", async function () {
    await expect(
      assessment.mintSpecialBadge(student.address, "ipfs://special", "Excelencia")
    ).to.emit(badge, "Transfer");
  });
}); 