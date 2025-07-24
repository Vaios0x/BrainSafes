const { expect } = require("chai");

describe("CourseCatalog", function () {
  let catalog, owner, instructor, student;

  beforeEach(async function () {
    [owner, instructor, student] = await ethers.getSigners();
    const CourseCatalog = await ethers.getContractFactory("CourseCatalog");
    catalog = await CourseCatalog.deploy();
    await catalog.deployed();
    await catalog.grantInstructor(instructor.address);
  });

  it("solo instructores pueden crear cursos", async function () {
    await expect(
      catalog.connect(student).createCourse("Curso", "Desc", "ipfs://meta", [])
    ).to.be.revertedWith("AccessControl");
    await expect(
      catalog.connect(instructor).createCourse("Curso", "Desc", "ipfs://meta", [])
    ).to.emit(catalog, "CourseCreated");
  });

  it("admin puede otorgar rol de instructor", async function () {
    await catalog.grantInstructor(student.address);
    await expect(
      catalog.connect(student).createCourse("Nuevo", "Desc", "ipfs://meta", [])
    ).to.emit(catalog, "CourseCreated");
  });

  it("puede establecer prerrequisitos", async function () {
    await catalog.connect(instructor).createCourse("A", "", "", []);
    await catalog.connect(instructor).createCourse("B", "", "", [1]);
    const course = await catalog.courses(2);
    expect(course.prerequisites.length).to.equal(1);
    expect(course.prerequisites[0]).to.equal(1);
  });
}); 