const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MentorshipProgram", function () {
  let MentorshipProgram, mentorSys, admin, mentor, student, other;

  beforeEach(async function () {
    [admin, mentor, student, other] = await ethers.getSigners();
    MentorshipProgram = await ethers.getContractFactory("MentorshipProgram");
    mentorSys = await MentorshipProgram.deploy();
    await mentorSys.deployed();
    await mentorSys.connect(admin).grantRole(await mentorSys.STUDENT_ROLE(), student.address);
  });

  it("permite registro de mentor y solicitud de mentoría", async function () {
    await expect(mentorSys.connect(mentor).registerMentor()).to.emit(mentorSys, "MentorRegistered");
    await expect(mentorSys.connect(student).requestMentorship(mentor.address)).to.emit(mentorSys, "MentorshipRequested");
  });

  it("permite aceptar, rechazar, finalizar y feedback", async function () {
    await mentorSys.connect(mentor).registerMentor();
    await mentorSys.connect(student).requestMentorship(mentor.address);
    await expect(mentorSys.connect(mentor).acceptMentorship(1)).to.emit(mentorSys, "MentorshipAccepted");
    await expect(mentorSys.connect(student).endMentorship(1)).to.emit(mentorSys, "MentorshipEnded");
    await expect(mentorSys.connect(student).submitFeedback(1, 5, "Excelente")).to.emit(mentorSys, "FeedbackSubmitted");
  });

  it("solo mentor puede aceptar/rechazar, solo estudiante feedback", async function () {
    await mentorSys.connect(mentor).registerMentor();
    await mentorSys.connect(student).requestMentorship(mentor.address);
    await expect(mentorSys.connect(other).acceptMentorship(1)).to.be.reverted;
    await expect(mentorSys.connect(mentor).rejectMentorship(1)).to.emit(mentorSys, "MentorshipRejected");
    await mentorSys.connect(student).requestMentorship(mentor.address);
    await mentorSys.connect(mentor).acceptMentorship(2);
    await mentorSys.connect(student).endMentorship(2);
    await expect(mentorSys.connect(other).submitFeedback(2, 4, "Bien")).to.be.reverted;
  });
}); 