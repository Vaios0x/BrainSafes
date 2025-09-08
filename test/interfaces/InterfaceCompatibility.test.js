const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Interface Compatibility Tests", function () {
    let brainSafes;
    let eduToken;
    let courseNFT;
    let certificateNFT;
    let scholarshipManager;
    let aiOracle;
    let owner;
    let instructor;
    let student;

    beforeEach(async function () {
        [owner, instructor, student] = await ethers.getSigners();

        // Deploy mock contracts that implement the interfaces
        const MockEDUToken = await ethers.getContractFactory("MockEDUToken");
        const MockCourseNFT = await ethers.getContractFactory("MockCourseNFT");
        const MockCertificateNFT = await ethers.getContractFactory("MockCertificateNFT");
        const MockScholarshipManager = await ethers.getContractFactory("MockScholarshipManager");
        const MockAIOracle = await ethers.getContractFactory("MockAIOracle");

        eduToken = await MockEDUToken.deploy();
        courseNFT = await MockCourseNFT.deploy();
        certificateNFT = await MockCertificateNFT.deploy();
        scholarshipManager = await MockScholarshipManager.deploy();
        aiOracle = await MockAIOracle.deploy();

        // Deploy BrainSafes with the mock contracts
        const BrainSafes = await ethers.getContractFactory("BrainSafes");
        brainSafes = await BrainSafes.deploy(
            eduToken.address,
            courseNFT.address,
            certificateNFT.address,
            scholarshipManager.address,
            aiOracle.address
        );
    });

    describe("IEDUToken Interface", function () {
        it("Should have all required ERC20 functions", async function () {
            // Test basic ERC20 functions
            await expect(eduToken.totalSupply()).to.not.be.reverted;
            await expect(eduToken.balanceOf(owner.address)).to.not.be.reverted;
            await expect(eduToken.transfer(student.address, 100)).to.not.be.reverted;
            await expect(eduToken.approve(student.address, 100)).to.not.be.reverted;
            await expect(eduToken.allowance(owner.address, student.address)).to.not.be.reverted;
            await expect(eduToken.transferFrom(owner.address, student.address, 50)).to.not.be.reverted;
        });

        it("Should have minting functions", async function () {
            await expect(eduToken.mint(student.address, 100)).to.not.be.reverted;
            await expect(eduToken.batchMint([student.address], [100])).to.not.be.reverted;
            await expect(eduToken.mintCourseCompletionReward(student.address, 1, 85)).to.not.be.reverted;
            await expect(eduToken.mintAchievementReward(student.address, 1, 50)).to.not.be.reverted;
            await expect(eduToken.mintScholarshipReward(student.address, 1, 200)).to.not.be.reverted;
        });

        it("Should have burning functions", async function () {
            await expect(eduToken.burn(100)).to.not.be.reverted;
            await expect(eduToken.burnFrom(owner.address, 100)).to.not.be.reverted;
            await expect(eduToken.batchBurn([owner.address], [100])).to.not.be.reverted;
        });

        it("Should have staking functions", async function () {
            await expect(eduToken.stake(100)).to.not.be.reverted;
            await expect(eduToken.unstake(50)).to.not.be.reverted;
            await expect(eduToken.stakedBalance(owner.address)).to.not.be.reverted;
            await expect(eduToken.claimStakingRewards()).to.not.be.reverted;
        });

        it("Should have governance functions", async function () {
            await expect(eduToken.getVotingPower(owner.address)).to.not.be.reverted;
            await expect(eduToken.delegate(student.address)).to.not.be.reverted;
            await expect(eduToken.delegates(owner.address)).to.not.be.reverted;
        });

        it("Should have utility functions", async function () {
            await expect(eduToken.circulatingSupply()).to.not.be.reverted;
            await expect(eduToken.totalBurned()).to.not.be.reverted;
            await expect(eduToken.totalStaked()).to.not.be.reverted;
            await expect(eduToken.hasMinimumStake(owner.address)).to.not.be.reverted;
        });
    });

    describe("ICourseNFT Interface", function () {
        it("Should have course creation functions", async function () {
            await expect(courseNFT.createCourse(
                "Test Course",
                "Test Description",
                "ipfs://test",
                100,
                30,
                50,
                ["JavaScript", "React"],
                3
            )).to.not.be.reverted;

            await expect(courseNFT.batchCreateCourses(
                ["Course 1", "Course 2"],
                ["Desc 1", "Desc 2"],
                ["ipfs://1", "ipfs://2"],
                [100, 200],
                [30, 60],
                [50, 100],
                [["JS"], ["React"]],
                [3, 4]
            )).to.not.be.reverted;
        });

        it("Should have enrollment functions", async function () {
            await expect(courseNFT.enrollInCourse(1)).to.not.be.reverted;
            await expect(courseNFT.batchEnrollStudents([1], [student.address])).to.not.be.reverted;
            await expect(courseNFT.enrollWithScholarship(1, student.address, 50)).to.not.be.reverted;
            await expect(courseNFT.isEnrolled(1, student.address)).to.not.be.reverted;
        });

        it("Should have mintCourse function", async function () {
            await expect(courseNFT.mintCourse(
                instructor.address,
                "ipfs://course-content",
                100
            )).to.not.be.reverted;
        });
    });

    describe("ICertificateNFT Interface", function () {
        it("Should have certificate minting functions", async function () {
            await expect(certificateNFT.mintCertificate(
                student.address,
                1,
                "Test Course",
                85,
                instructor.address,
                ["JavaScript", "React"],
                "ipfs://metadata"
            )).to.not.be.reverted;

            await expect(certificateNFT.mintCertificate(
                student.address,
                1,
                "ipfs://content",
                85
            )).to.not.be.reverted;
        });

        it("Should have verification functions", async function () {
            await expect(certificateNFT.verifyCertificate(
                1,
                instructor.address,
                "manual",
                "Verified"
            )).to.not.be.reverted;

            await expect(certificateNFT.isCertificateVerified(1)).to.not.be.reverted;
        });
    });

    describe("IScholarshipManager Interface", function () {
        it("Should have scholarship program functions", async function () {
            await expect(scholarshipManager.createScholarshipProgram(
                "Test Program",
                "Test Description",
                1000,
                10,
                ["Requirement 1"],
                Math.floor(Date.now() / 1000) + 86400,
                "ipfs://metadata"
            )).to.not.be.reverted;

            await expect(scholarshipManager.getActivePrograms()).to.not.be.reverted;
        });

        it("Should have application functions", async function () {
            await expect(scholarshipManager.applyForScholarship(
                1,
                100,
                "Need financial aid",
                "ipfs://application"
            )).to.not.be.reverted;

            await expect(scholarshipManager.applyForScholarship(
                student.address,
                100,
                "Need financial aid"
            )).to.not.be.reverted;
        });

        it("Should have AI evaluation functions", async function () {
            await expect(scholarshipManager.evaluateScholarshipAI(student.address)).to.not.be.reverted;
        });
    });

    describe("IAIOracle Interface", function () {
        it("Should have prediction functions", async function () {
            await expect(aiOracle.predictStudentPerformance(student.address, 1)).to.not.be.reverted;
            await expect(aiOracle.generateLearningPath(student.address)).to.not.be.reverted;
            await expect(aiOracle.detectFraud(student.address, ethers.utils.keccak256("test"))).to.not.be.reverted;
            await expect(aiOracle.batchPredictPerformance([student.address], [1])).to.not.be.reverted;
        });

        it("Should have scholarship functions", async function () {
            await expect(aiOracle.evaluateScholarshipCandidate(
                student.address,
                1,
                "0x"
            )).to.not.be.reverted;

            await expect(aiOracle.getScholarshipEligibilityScore(student.address)).to.not.be.reverted;
            await expect(aiOracle.recommendScholarships(student.address)).to.not.be.reverted;
        });

        it("Should have job marketplace functions", async function () {
            await expect(aiOracle.calculateJobMatch(
                student.address,
                1,
                "0x"
            )).to.not.be.reverted;
        });
    });

    describe("BrainSafes Integration", function () {
        it("Should be able to register a user", async function () {
            await expect(brainSafes.registerUser(
                "Test User",
                "test@example.com",
                "ipfs://profile"
            )).to.not.be.reverted;
        });

        it("Should be able to create a course", async function () {
            await brainSafes.registerUser("Test Instructor", "instructor@example.com", "ipfs://profile");
            await brainSafes.registerInstructor(instructor.address);

            await expect(brainSafes.createCourse(
                "Test Course",
                "Test Description",
                "ipfs://content",
                100,
                30,
                50,
                ["JavaScript", "React"],
                3
            )).to.not.be.reverted;
        });

        it("Should be able to use AI functions", async function () {
            await expect(brainSafes.predictStudentPerformance(student.address, 1)).to.not.be.reverted;
            await expect(brainSafes.getPersonalizedLearningPath(student.address)).to.not.be.reverted;
            await expect(brainSafes.detectFraudulentActivity(student.address, ethers.utils.keccak256("test"))).to.not.be.reverted;
        });

        it("Should be able to use scholarship functions", async function () {
            await expect(brainSafes.applyForScholarship(100, "Need financial aid")).to.not.be.reverted;
        });
    });
});
