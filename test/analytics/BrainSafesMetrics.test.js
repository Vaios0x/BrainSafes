const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("BrainSafesMetrics", function () {
    let BrainSafesMetrics;
    let metrics;
    let owner;
    let admin;
    let analyst;
    let user;

    beforeEach(async function () {
        [owner, admin, analyst, user] = await ethers.getSigners();

        // Deploy metrics contract
        BrainSafesMetrics = await ethers.getContractFactory("BrainSafesMetrics");
        metrics = await upgrades.deployProxy(BrainSafesMetrics, [admin.address]);
        await metrics.deployed();
    });

    describe("Initialization", function () {
        it("Should set the correct admin", async function () {
            expect(await metrics.hasRole(await metrics.DEFAULT_ADMIN_ROLE(), admin.address)).to.be.true;
            expect(await metrics.hasRole(await metrics.METRICS_ADMIN_ROLE(), admin.address)).to.be.true;
        });
    });

    describe("User Metrics", function () {
        beforeEach(async function () {
            // Grant METRICS_ADMIN_ROLE to analyst
            await metrics.connect(admin).grantRole(await metrics.METRICS_ADMIN_ROLE(), analyst.address);
        });

        it("Should update user metrics correctly", async function () {
            await metrics.connect(analyst).updateUserMetrics(
                user.address,
                "coursesEnrolled",
                5
            );

            const userMetrics = await metrics.getUserMetrics(user.address);
            expect(userMetrics.coursesEnrolled).to.equal(5);
        });

        it("Should emit MetricsUpdated event", async function () {
            await expect(
                metrics.connect(analyst).updateUserMetrics(
                    user.address,
                    "coursesCompleted",
                    3
                )
            ).to.emit(metrics, "MetricsUpdated")
                .withArgs("user", user.address, await ethers.provider.getBlock("latest").then(b => b.timestamp));
        });

        it("Should revert when called by non-admin", async function () {
            await expect(
                metrics.connect(user).updateUserMetrics(
                    user.address,
                    "coursesEnrolled",
                    5
                )
            ).to.be.revertedWith("AccessControl:");
        });
    });

    describe("Course Metrics", function () {
        const courseId = 1;

        beforeEach(async function () {
            await metrics.connect(admin).grantRole(await metrics.METRICS_ADMIN_ROLE(), analyst.address);
        });

        it("Should update course metrics correctly", async function () {
            await metrics.connect(analyst).updateCourseMetrics(
                courseId,
                "totalEnrollments",
                100
            );

            const courseMetrics = await metrics.getCourseMetrics(courseId);
            expect(courseMetrics.totalEnrollments).to.equal(100);
        });

        it("Should emit MetricsUpdated event for course", async function () {
            await expect(
                metrics.connect(analyst).updateCourseMetrics(
                    courseId,
                    "completionRate",
                    85
                )
            ).to.emit(metrics, "MetricsUpdated")
                .withArgs("course", ethers.constants.AddressZero, await ethers.provider.getBlock("latest").then(b => b.timestamp));
        });
    });

    describe("Platform Metrics", function () {
        beforeEach(async function () {
            await metrics.connect(admin).grantRole(await metrics.METRICS_ADMIN_ROLE(), analyst.address);
        });

        it("Should update platform metrics correctly", async function () {
            await metrics.connect(analyst).updatePlatformMetrics(
                "totalUsers",
                1000
            );

            const platformMetrics = await metrics.getPlatformMetrics();
            expect(platformMetrics.totalUsers).to.equal(1000);
        });

        it("Should emit MetricsUpdated event for platform", async function () {
            await expect(
                metrics.connect(analyst).updatePlatformMetrics(
                    "activeUsers30Days",
                    500
                )
            ).to.emit(metrics, "MetricsUpdated")
                .withArgs("platform", ethers.constants.AddressZero, await ethers.provider.getBlock("latest").then(b => b.timestamp));
        });
    });

    describe("Gas Optimization", function () {
        it("Should return gas optimization metrics", async function () {
            const gasMetrics = await metrics.calculateGasOptimization();
            expect(gasMetrics).to.be.gt(0);
        });
    });

    describe("Access Control", function () {
        it("Should allow admin to grant roles", async function () {
            await metrics.connect(admin).grantRole(await metrics.METRICS_ADMIN_ROLE(), analyst.address);
            expect(await metrics.hasRole(await metrics.METRICS_ADMIN_ROLE(), analyst.address)).to.be.true;
        });

        it("Should allow admin to revoke roles", async function () {
            await metrics.connect(admin).grantRole(await metrics.METRICS_ADMIN_ROLE(), analyst.address);
            await metrics.connect(admin).revokeRole(await metrics.METRICS_ADMIN_ROLE(), analyst.address);
            expect(await metrics.hasRole(await metrics.METRICS_ADMIN_ROLE(), analyst.address)).to.be.false;
        });
    });

    describe("Upgradeability", function () {
        it("Should be upgradeable by admin", async function () {
            const BrainSafesMetricsV2 = await ethers.getContractFactory("BrainSafesMetrics");
            await expect(
                upgrades.upgradeProxy(metrics.address, BrainSafesMetricsV2)
            ).to.not.be.reverted;
        });

        it("Should maintain state after upgrade", async function () {
            // Set some initial state
            await metrics.connect(admin).grantRole(await metrics.METRICS_ADMIN_ROLE(), analyst.address);
            await metrics.connect(analyst).updateUserMetrics(user.address, "coursesEnrolled", 5);

            // Upgrade contract
            const BrainSafesMetricsV2 = await ethers.getContractFactory("BrainSafesMetrics");
            const metricsV2 = await upgrades.upgradeProxy(metrics.address, BrainSafesMetricsV2);

            // Check state is maintained
            expect(await metricsV2.hasRole(await metricsV2.METRICS_ADMIN_ROLE(), analyst.address)).to.be.true;
            const userMetrics = await metricsV2.getUserMetrics(user.address);
            expect(userMetrics.coursesEnrolled).to.equal(5);
        });
    });
}); 