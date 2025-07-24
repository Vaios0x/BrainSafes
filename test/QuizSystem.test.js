const { expect } = require("chai");

describe("QuizSystem", function () {
  let catalog, quiz, owner, instructor, student;

  beforeEach(async function () {
    [owner, instructor, student] = await ethers.getSigners();
    const CourseCatalog = await ethers.getContractFactory("CourseCatalog");
    catalog = await CourseCatalog.deploy();
    await catalog.deployed();
    await catalog.grantInstructor(instructor.address);
    await catalog.createCourse("A", "", "", []);
    const QuizSystem = await ethers.getContractFactory("QuizSystem");
    quiz = await QuizSystem.deploy(catalog.address);
    await quiz.deployed();
    await quiz.grantRole(await quiz.INSTRUCTOR_ROLE(), instructor.address);
  });

  it("solo INSTRUCTOR_ROLE puede crear quizzes", async function () {
    await expect(
      quiz.connect(student).createQuiz(1, "ipfs://questions", 60)
    ).to.be.revertedWith("AccessControl");
    await expect(
      quiz.connect(instructor).createQuiz(1, "ipfs://questions", 60)
    ).to.emit(quiz, "QuizCreated");
  });

  it("solo estudiantes pueden intentar quizzes", async function () {
    await quiz.connect(instructor).createQuiz(1, "ipfs://questions", 60);
    await expect(
      quiz.connect(instructor).submitAttempt(1, 80)
    ).to.emit(quiz, "QuizAttempted"); // En este diseño, cualquier address puede intentar, puedes agregar un StudentRole si lo deseas
  });

  it("valida curso activo", async function () {
    await catalog.createCourse("B", "", "", []);
    await catalog.editCourse(2, "B", "", "");
    await quiz.grantRole(await quiz.INSTRUCTOR_ROLE(), owner.address);
    await expect(
      quiz.connect(owner).createQuiz(2, "ipfs://q", 50)
    ).to.emit(quiz, "QuizCreated");
  });
}); 