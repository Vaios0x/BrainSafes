const { expect } = require("chai");

describe("LearningPathManager + IA", function () {
  let catalog, pathManager, owner, ia, student;

  beforeEach(async function () {
    [owner, ia, student] = await ethers.getSigners();
    const CourseCatalog = await ethers.getContractFactory("CourseCatalog");
    catalog = await CourseCatalog.deploy();
    await catalog.deployed();
    await catalog.grantInstructor(owner.address);
    await catalog.createCourse("A", "", "", []);
    await catalog.createCourse("B", "", "", [1]);
    const LearningPathManager = await ethers.getContractFactory("LearningPathManager");
    pathManager = await LearningPathManager.deploy(catalog.address);
    await pathManager.deployed();
    await pathManager.grantRole(await pathManager.IA_ROLE(), ia.address);
  });

  it("IA_ROLE puede sugerir rutas válidas", async function () {
    await expect(
      pathManager.connect(ia).setLearningPath(student.address, [1, 2])
    ).to.emit(pathManager, "LearningPathSet");
  });

  it("estudiante puede aceptar ruta sugerida", async function () {
    await pathManager.connect(ia).setLearningPath(student.address, [1, 2]);
    await expect(
      pathManager.connect(student).setLearningPath(student.address, [1, 2])
    ).to.emit(pathManager, "LearningPathSet");
  });

  it("IA_ROLE no puede sugerir rutas inválidas", async function () {
    await expect(
      pathManager.connect(ia).setLearningPath(student.address, [2])
    ).to.be.revertedWith("Faltan prerrequisitos en la ruta");
  });
}); 