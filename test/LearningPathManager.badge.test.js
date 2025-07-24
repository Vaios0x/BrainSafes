const { expect } = require("chai");

describe("LearningPathManager + BadgeNFT (ruta)", function () {
  let catalog, pathManager, tracker, badge, owner, ia, student;

  beforeEach(async function () {
    [owner, ia, student] = await ethers.getSigners();
    const CourseCatalog = await ethers.getContractFactory("CourseCatalog");
    catalog = await CourseCatalog.deploy();
    await catalog.deployed();
    await catalog.grantInstructor(owner.address);
    await catalog.createCourse("A", "", "", []);
    await catalog.createCourse("B", "", "", [1]);
    const BadgeNFT = await ethers.getContractFactory("BadgeNFT");
    badge = await BadgeNFT.deploy();
    await badge.deployed();
    await badge.grantMinter(owner.address);
    const ProgressTracker = await ethers.getContractFactory("ProgressTracker");
    tracker = await ProgressTracker.deploy(catalog.address, badge.address);
    await tracker.deployed();
    const LearningPathManager = await ethers.getContractFactory("LearningPathManager");
    pathManager = await LearningPathManager.deploy(catalog.address, badge.address, tracker.address);
    await pathManager.deployed();
    await pathManager.grantRole(await pathManager.IA_ROLE(), ia.address);
    // El estudiante completa ambos cursos
    await tracker.startCourse(student.address, 1, 1);
    await tracker.connect(student).updateProgress(student.address, 1, 1);
    await tracker.startCourse(student.address, 2, 1);
    await tracker.connect(student).updateProgress(student.address, 2, 1);
  });

  it("mintea badge de ruta al completar toda la ruta", async function () {
    await expect(
      pathManager.checkAndMintRouteBadge(student.address, [1, 2], "ipfs://route-badge")
    ).to.emit(badge, "Transfer");
    expect(await badge.ownerOf(1)).to.equal(student.address);
  });

  it("solo mintea una vez por estudiante", async function () {
    await pathManager.checkAndMintRouteBadge(student.address, [1, 2], "ipfs://route-badge");
    await expect(
      pathManager.checkAndMintRouteBadge(student.address, [1, 2], "ipfs://route-badge")
    ).to.be.revertedWith("Badge de ruta ya minteado");
  });

  it("falla si la ruta no está completa", async function () {
    // Nuevo estudiante, solo completa el primer curso
    const [owner, ia, , student2] = await ethers.getSigners();
    await tracker.startCourse(student2.address, 1, 1);
    await tracker.connect(student2).updateProgress(student2.address, 1, 1);
    await expect(
      pathManager.checkAndMintRouteBadge(student2.address, [1, 2], "ipfs://route-badge")
    ).to.be.revertedWith("Ruta incompleta");
  });
}); 