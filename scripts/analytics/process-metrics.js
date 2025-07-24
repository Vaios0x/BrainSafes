const { ethers } = require("hardhat");
const { getL2Network } = require("@arbitrum/sdk");

async function main() {
    console.log("Starting metrics processing...");

    // Get contracts
    const AnalyticsManager = await ethers.getContractFactory("AnalyticsManager");
    const BrainSafes = await ethers.getContractFactory("BrainSafes");
    const BrainSafesArbitrum = await ethers.getContractFactory("BrainSafesArbitrum");

    const [deployer] = await ethers.getSigners();
    console.log("Processing metrics with account:", deployer.address);

    // Get network info
    const l2Network = await getL2Network(ethers.provider);
    console.log("Connected to Arbitrum network:", l2Network.name);

    // Get contract instances
    const analyticsManager = await AnalyticsManager.attach("ANALYTICS_MANAGER_ADDRESS");
    const brainSafes = await BrainSafes.attach("BRAINSAFES_ADDRESS");
    const brainSafesArbitrum = await BrainSafesArbitrum.attach("BRAINSAFES_ARBITRUM_ADDRESS");

    try {
        // Get system metrics
        const stats = await brainSafes.getPlatformStats();
        const [totalCourses, totalEnrollments, totalAchievements, totalUsers] = stats;

        // Get active users in last 24h
        const activeUsers = await getActiveUsers24h(brainSafes);

        // Get completion metrics
        const completionMetrics = await getCompletionMetrics(brainSafes);
        const { completionRate, averageScore } = completionMetrics;

        // Get platform revenue
        const revenue = await getPlatformRevenue(brainSafes);

        // Update system metrics
        await analyticsManager.updateSystemMetrics(
            totalUsers,
            activeUsers,
            totalCourses,
            totalCourses, // Active courses (implement filter)
            totalEnrollments,
            completionRate,
            averageScore,
            totalAchievements, // Certificates
            0, // Scholarships (implement counter)
            revenue
        );
        console.log("System metrics updated");

        // Process user metrics
        await processUserMetrics(analyticsManager, brainSafes);
        console.log("User metrics processed");

        // Process course metrics
        await processCourseMetrics(analyticsManager, brainSafes);
        console.log("Course metrics processed");

        // Process AI metrics
        await processAIMetrics(analyticsManager, brainSafesArbitrum);
        console.log("AI metrics processed");

        // Update network metrics
        await analyticsManager.updateNetworkMetrics();
        console.log("Network metrics updated");

        console.log("All metrics processed successfully");
    } catch (error) {
        console.error("Error processing metrics:", error);
        process.exit(1);
    }
}

async function getActiveUsers24h(brainSafes) {
    const filter = brainSafes.filters.UserActivity();
    const events = await brainSafes.queryFilter(filter, -7200, "latest"); // ~24h in blocks
    const activeAddresses = new Set();
    
    events.forEach(event => {
        if (event.args.timestamp >= Date.now() - 86400000) {
            activeAddresses.add(event.args.user);
        }
    });
    
    return activeAddresses.size;
}

async function getCompletionMetrics(brainSafes) {
    const filter = brainSafes.filters.CourseCompleted();
    const events = await brainSafes.queryFilter(filter, -7200, "latest");
    
    let totalScore = 0;
    events.forEach(event => {
        totalScore += event.args.score.toNumber();
    });
    
    const averageScore = events.length > 0 ? totalScore / events.length : 0;
    const completionRate = 0; // Implement calculation
    
    return { completionRate, averageScore };
}

async function getPlatformRevenue(brainSafes) {
    const filter = brainSafes.filters.RewardDistributed();
    const events = await brainSafes.queryFilter(filter, -7200, "latest");
    
    let totalRevenue = ethers.BigNumber.from(0);
    events.forEach(event => {
        totalRevenue = totalRevenue.add(event.args.amount);
    });
    
    return totalRevenue;
}

async function processUserMetrics(analyticsManager, brainSafes) {
    const filter = brainSafes.filters.UserRegistered();
    const events = await brainSafes.queryFilter(filter, -7200, "latest");
    
    for (const event of events) {
        const user = event.args.user;
        const profile = await brainSafes.getUserProfile(user);
        
        await analyticsManager.updateUserMetrics(
            user,
            profile.coursesEnrolled || 0,
            profile.coursesCompleted || 0,
            profile.averageScore || 0,
            profile.certificatesEarned || 0,
            profile.scholarshipsReceived || 0,
            profile.totalSpent || 0,
            profile.totalEarned || 0,
            profile.reputation || 0
        );
    }
}

async function processCourseMetrics(analyticsManager, brainSafes) {
    const filter = brainSafes.filters.CourseCreated();
    const events = await brainSafes.queryFilter(filter, -7200, "latest");
    
    for (const event of events) {
        const courseId = event.args.courseId;
        const course = await brainSafes.courses(courseId);
        
        await analyticsManager.updateCourseMetrics(
            courseId,
            course.currentStudents,
            course.currentStudents, // Active students (implement filter)
            0, // Completion rate (implement calculation)
            0, // Average score (implement calculation)
            course.totalEarnings,
            course.totalEarnings.mul(75).div(100), // 75% instructor earnings
            0 // Student satisfaction (implement calculation)
        );
    }
}

async function processAIMetrics(analyticsManager, brainSafesArbitrum) {
    // Get AI metrics from events
    const predictions = await brainSafesArbitrum.aiMetrics();
    
    await analyticsManager.updateAIMetrics(
        predictions.total || 0,
        predictions.accurate || 0,
        predictions.fraudDetections || 0,
        predictions.pathsGenerated || 0,
        predictions.averageResponseTime || 0,
        predictions.gasOptimizations || 0
    );
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 