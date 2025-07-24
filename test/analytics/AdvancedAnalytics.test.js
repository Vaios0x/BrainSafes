const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("AdvancedAnalytics", function () {
    let BrainSafesMetrics;
    let AdvancedAnalytics;
    let metrics;
    let analytics;
    let owner;
    let admin;
    let dataScientist;
    let user;

    beforeEach(async function () {
        [owner, admin, dataScientist, user] = await ethers.getSigners();

        // Deploy metrics contract first
        BrainSafesMetrics = await ethers.getContractFactory("BrainSafesMetrics");
        metrics = await upgrades.deployProxy(BrainSafesMetrics, [admin.address]);
        await metrics.deployed();

        // Deploy analytics contract
        AdvancedAnalytics = await ethers.getContractFactory("AdvancedAnalytics");
        analytics = await upgrades.deployProxy(AdvancedAnalytics, [admin.address, metrics.address]);
        await analytics.deployed();

        // Setup roles
        await analytics.connect(admin).grantRole(await analytics.DATA_SCIENTIST_ROLE(), dataScientist.address);
        await metrics.connect(admin).grantRole(await metrics.METRICS_ADMIN_ROLE(), admin.address);

        // Setup some initial metrics data
        await metrics.connect(admin).updateUserMetrics(user.address, "coursesEnrolled", 10);
        await metrics.connect(admin).updateUserMetrics(user.address, "coursesCompleted", 7);
        await metrics.connect(admin).updateUserMetrics(user.address, "averageGrade", 85);
        await metrics.connect(admin).updateUserMetrics(user.address, "totalLearningHours", 100);
    });

    describe("Initialization", function () {
        it("Should set the correct admin and metrics contract", async function () {
            expect(await analytics.hasRole(await analytics.DEFAULT_ADMIN_ROLE(), admin.address)).to.be.true;
            expect(await analytics.hasRole(await analytics.ANALYTICS_ADMIN_ROLE(), admin.address)).to.be.true;
            expect(await analytics.metricsContract()).to.equal(metrics.address);
        });
    });

    describe("Learning Path Analysis", function () {
        it("Should analyze learning path correctly", async function () {
            const analysis = await analytics.connect(dataScientist).analyzeLearningPath(user.address);
            
            expect(analysis.recommendationAccuracy).to.be.gt(0);
            expect(analysis.completionProbability).to.be.gt(0);
            expect(analysis.skillGapScore).to.be.gt(0);
            expect(analysis.timeToMasteryEstimate).to.be.gt(0);
            expect(analysis.customizedPathHash).to.not.equal(ethers.constants.HashZero);
        });

        it("Should emit AnalysisCompleted event", async function () {
            await expect(
                analytics.connect(dataScientist).analyzeLearningPath(user.address)
            ).to.emit(analytics, "AnalysisCompleted")
                .withArgs(
                    "learning_path",
                    ethers.utils.solidityKeccak256(
                        ["address", "string", "uint256"],
                        [user.address, "path", await ethers.provider.getBlock("latest").then(b => b.timestamp + 1)]
                    ),
                    await ethers.provider.getBlock("latest").then(b => b.timestamp + 1)
                );
        });

        it("Should revert when called by non-data scientist", async function () {
            await expect(
                analytics.connect(user).analyzeLearningPath(user.address)
            ).to.be.revertedWith("AccessControl:");
        });
    });

    describe("Market Trend Analysis", function () {
        const courseId = 1;

        beforeEach(async function () {
            await metrics.connect(admin).updateCourseMetrics(courseId, "totalEnrollments", 100);
            await metrics.connect(admin).updateCourseMetrics(courseId, "activeStudents", 80);
            await metrics.connect(admin).updateCourseMetrics(courseId, "completionRate", 75);
            await metrics.connect(admin).updateCourseMetrics(courseId, "totalRevenue", 1000);
        });

        it("Should analyze market trends correctly", async function () {
            const analysis = await analytics.connect(dataScientist).analyzeMarketTrends(courseId);
            
            expect(analysis.demandScore).to.be.gt(0);
            expect(analysis.supplyScore).to.be.gt(0);
            expect(analysis.growthRate).to.be.gt(0);
            expect(analysis.marketSaturation).to.be.gt(0);
            expect(analysis.trendHash).to.not.equal(ethers.constants.HashZero);
        });

        it("Should emit TrendIdentified event", async function () {
            await expect(
                analytics.connect(dataScientist).analyzeMarketTrends(courseId)
            ).to.emit(analytics, "TrendIdentified");
        });
    });

    describe("Performance Prediction", function () {
        it("Should predict performance correctly", async function () {
            const prediction = await analytics.connect(dataScientist).predictPerformance(user.address);
            
            expect(prediction.expectedGrade).to.be.gt(0);
            expect(prediction.completionLikelihood).to.be.gt(0);
            expect(prediction.dropoutRisk).to.be.gte(0);
            expect(prediction.engagementScore).to.be.gt(0);
            expect(prediction.predictionHash).to.not.equal(ethers.constants.HashZero);
        });

        it("Should emit PredictionGenerated event", async function () {
            await expect(
                analytics.connect(dataScientist).predictPerformance(user.address)
            ).to.emit(analytics, "PredictionGenerated")
                .withArgs(
                    user.address,
                    ethers.utils.solidityKeccak256(
                        ["address", "string", "uint256"],
                        [user.address, "prediction", await ethers.provider.getBlock("latest").then(b => b.timestamp + 1)]
                    ),
                    await ethers.provider.getBlock("latest").then(b => b.timestamp + 1)
                );
        });
    });

    describe("Access Control", function () {
        it("Should allow admin to grant data scientist role", async function () {
            const newDataScientist = owner;
            await analytics.connect(admin).grantRole(await analytics.DATA_SCIENTIST_ROLE(), newDataScientist.address);
            expect(await analytics.hasRole(await analytics.DATA_SCIENTIST_ROLE(), newDataScientist.address)).to.be.true;
        });

        it("Should allow admin to revoke data scientist role", async function () {
            await analytics.connect(admin).revokeRole(await analytics.DATA_SCIENTIST_ROLE(), dataScientist.address);
            expect(await analytics.hasRole(await analytics.DATA_SCIENTIST_ROLE(), dataScientist.address)).to.be.false;
        });
    });

    describe("Upgradeability", function () {
        it("Should be upgradeable by admin", async function () {
            const AdvancedAnalyticsV2 = await ethers.getContractFactory("AdvancedAnalytics");
            await expect(
                upgrades.upgradeProxy(analytics.address, AdvancedAnalyticsV2)
            ).to.not.be.reverted;
        });

        it("Should maintain state after upgrade", async function () {
            // Generate some initial analytics
            await analytics.connect(dataScientist).analyzeLearningPath(user.address);
            
            // Upgrade contract
            const AdvancedAnalyticsV2 = await ethers.getContractFactory("AdvancedAnalytics");
            const analyticsV2 = await upgrades.upgradeProxy(analytics.address, AdvancedAnalyticsV2);

            // Verify state is maintained
            expect(await analyticsV2.hasRole(await analyticsV2.DATA_SCIENTIST_ROLE(), dataScientist.address)).to.be.true;
            expect(await analyticsV2.metricsContract()).to.equal(metrics.address);
        });
    });
}); 