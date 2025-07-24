const { expect } = require("chai");

describe("LearningPathManager", function () {
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

  it("solo IA_ROLE o el propio estudiante pueden modificar la ruta", async function () {
    await expect(
      pathManager.connect(owner).setLearningPath(student.address, [1, 2])
    ).to.be.revertedWith("No autorizado");
    await expect(
      pathManager.connect(student).setLearningPath(student.address, [1, 2])
    ).to.emit(pathManager, "LearningPathSet");
    await expect(
      pathManager.connect(ia).setLearningPath(student.address, [1, 2])
    ).to.emit(pathManager, "LearningPathSet");
  });

  it("valida cursos activos y prerrequisitos", async function () {
    // Curso 2 requiere curso 1
    await expect(
      pathManager.connect(student).setLearningPath(student.address, [2])
    ).to.be.revertedWith("Faltan prerrequisitos en la ruta");
    // Si ambos están, funciona
    await expect(
      pathManager.connect(student).setLearningPath(student.address, [1, 2])
    ).to.emit(pathManager, "LearningPathSet");
  });
}); 