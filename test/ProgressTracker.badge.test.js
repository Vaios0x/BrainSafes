const { expect } = require("chai");

describe("ProgressTracker + BadgeNFT", function () {
  let catalog, tracker, badge, owner, ia, student;

  beforeEach(async function () {
    [owner, ia, student] = await ethers.getSigners();
    const CourseCatalog = await ethers.getContractFactory("CourseCatalog");
    catalog = await CourseCatalog.deploy();
    await catalog.deployed();
    await catalog.grantInstructor(owner.address);
    await catalog.createCourse("A", "", "", []);
    const BadgeNFT = await ethers.getContractFactory("BadgeNFT");
    badge = await BadgeNFT.deploy();
    await badge.deployed();
    await badge.grantMinter(owner.address);
    const ProgressTracker = await ethers.getContractFactory("ProgressTracker");
    tracker = await ProgressTracker.deploy(catalog.address, badge.address);
    await tracker.deployed();
    await tracker.grantRole(await tracker.IA_ROLE(), ia.address);
  });

  it("mintea badge automático al completar curso", async function () {
    await tracker.startCourse(student.address, 1, 2);
    await expect(
      tracker.connect(student).updateProgress(student.address, 1, 2)
    ).to.emit(badge, "Transfer");
    expect(await badge.ownerOf(1)).to.equal(student.address);
  });

  it("solo mintea una vez por curso/estudiante", async function () {
    await tracker.startCourse(student.address, 1, 1);
    await tracker.connect(student).updateProgress(student.address, 1, 1);
    await tracker.connect(student).updateProgress(student.address, 1, 1);
    expect(await badge.balanceOf(student.address)).to.equal(1);
  });
}); 