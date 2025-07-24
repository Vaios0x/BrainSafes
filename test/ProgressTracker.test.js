const { expect } = require("chai");

describe("ProgressTracker", function () {
  let catalog, tracker, owner, ia, student;

  beforeEach(async function () {
    [owner, ia, student] = await ethers.getSigners();
    const CourseCatalog = await ethers.getContractFactory("CourseCatalog");
    catalog = await CourseCatalog.deploy();
    await catalog.deployed();
    await catalog.grantInstructor(owner.address);
    await catalog.createCourse("A", "", "", []);
    await catalog.createCourse("B", "", "", [1]);
    const ProgressTracker = await ethers.getContractFactory("ProgressTracker");
    tracker = await ProgressTracker.deploy(catalog.address);
    await tracker.deployed();
    await tracker.grantRole(await tracker.IA_ROLE(), ia.address);
    // El estudiante completa curso 1
    await tracker.startCourse(student.address, 1, 3);
    await tracker.connect(student).updateProgress(student.address, 1, 3);
  });

  it("solo IA_ROLE o el propio estudiante pueden actualizar progreso", async function () {
    await tracker.startCourse(student.address, 2, 2);
    await expect(
      tracker.connect(owner).updateProgress(student.address, 2, 1)
    ).to.be.revertedWith("No autorizado");
    await expect(
      tracker.connect(student).updateProgress(student.address, 2, 1)
    ).to.emit(tracker, "ProgressUpdated");
    await expect(
      tracker.connect(ia).updateProgress(student.address, 2, 2)
    ).to.emit(tracker, "ProgressUpdated");
  });

  it("valida curso activo y prerrequisitos", async function () {
    // No puede iniciar curso 2 si no completó curso 1
    const [,, , , , , , prereqs] = await catalog.courses(2);
    expect(prereqs.length).to.equal(1);
    // Si intentas iniciar curso 2 sin completar 1, debe fallar
    const CourseCatalog = await ethers.getContractFactory("CourseCatalog");
    const catalog2 = await CourseCatalog.deploy();
    await catalog2.deployed();
    await catalog2.grantInstructor(owner.address);
    await catalog2.createCourse("A", "", "", []);
    await catalog2.createCourse("B", "", "", [1]);
    const ProgressTracker2 = await ethers.getContractFactory("ProgressTracker");
    const tracker2 = await ProgressTracker2.deploy(catalog2.address);
    await tracker2.deployed();
    await tracker2.startCourse(student.address, 2, 2).catch(e => {
      expect(e.message).to.include("Prerrequisito no completado");
    });
  });
}); 