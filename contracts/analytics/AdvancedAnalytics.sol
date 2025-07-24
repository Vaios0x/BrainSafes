// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "./BrainSafesMetrics.sol";

/**
 * @title Advanced Analytics System for BrainSafes
 * @dev Provides advanced analytics and insights using platform metrics
 * @custom:security-contact security@brainsafes.com
 */
contract AdvancedAnalytics is UUPSUpgradeable, AccessControlUpgradeable, PausableUpgradeable {
    // Roles
    bytes32 public constant ANALYTICS_ADMIN_ROLE = keccak256("ANALYTICS_ADMIN_ROLE");
    bytes32 public constant DATA_SCIENTIST_ROLE = keccak256("DATA_SCIENTIST_ROLE");

    // State variables
    BrainSafesMetrics public metricsContract;
    
    // Structs for advanced analytics
    struct LearningPathAnalysis {
        uint256 recommendationAccuracy;
        uint256 completionProbability;
        uint256 skillGapScore;
        uint256 timeToMasteryEstimate;
        bytes32 customizedPathHash;
    }

    struct MarketTrendAnalysis {
        uint256 demandScore;
        uint256 supplyScore;
        uint256 growthRate;
        uint256 marketSaturation;
        bytes32 trendHash;
    }

    struct PerformancePrediction {
        uint256 expectedGrade;
        uint256 completionLikelihood;
        uint256 dropoutRisk;
        uint256 engagementScore;
        bytes32 predictionHash;
    }

    // Mappings
    mapping(address => LearningPathAnalysis) private learningPathAnalytics;
    mapping(uint256 => MarketTrendAnalysis) private marketTrendAnalytics;
    mapping(address => PerformancePrediction) private performancePredictions;

    // Events
    event AnalysisCompleted(string analysisType, bytes32 resultHash, uint256 timestamp);
    event PredictionGenerated(address indexed user, bytes32 predictionHash, uint256 timestamp);
    event TrendIdentified(string trendType, bytes32 trendHash, uint256 confidence);

    /**
     * @dev Initializes the contract
     */
    function initialize(address admin, address _metricsContract) public initializer {
        __UUPSUpgradeable_init();
        __AccessControl_init();
        __Pausable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ANALYTICS_ADMIN_ROLE, admin);
        
        metricsContract = BrainSafesMetrics(_metricsContract);
    }

    /**
     * @dev Analyzes learning path for a user
     * @param user Address of the user
     * @return LearningPathAnalysis containing personalized learning insights
     */
    function analyzeLearningPath(address user) 
        external 
        onlyRole(DATA_SCIENTIST_ROLE) 
        returns (LearningPathAnalysis memory) 
    {
        BrainSafesMetrics.UserMetrics memory userMetrics = metricsContract.getUserMetrics(user);
        
        LearningPathAnalysis storage analysis = learningPathAnalytics[user];
        analysis.recommendationAccuracy = calculateRecommendationAccuracy(userMetrics);
        analysis.completionProbability = calculateCompletionProbability(userMetrics);
        analysis.skillGapScore = identifySkillGaps(userMetrics);
        analysis.timeToMasteryEstimate = estimateTimeToMastery(userMetrics);
        analysis.customizedPathHash = generatePathHash(user, block.timestamp);

        emit AnalysisCompleted("learning_path", analysis.customizedPathHash, block.timestamp);
        return analysis;
    }

    /**
     * @dev Analyzes market trends for courses and skills
     * @param courseId ID of the course
     * @return MarketTrendAnalysis containing market insights
     */
    function analyzeMarketTrends(uint256 courseId) 
        external 
        onlyRole(DATA_SCIENTIST_ROLE) 
        returns (MarketTrendAnalysis memory) 
    {
        BrainSafesMetrics.CourseMetrics memory courseMetrics = metricsContract.getCourseMetrics(courseId);
        
        MarketTrendAnalysis storage analysis = marketTrendAnalytics[courseId];
        analysis.demandScore = calculateDemandScore(courseMetrics);
        analysis.supplyScore = calculateSupplyScore(courseMetrics);
        analysis.growthRate = calculateGrowthRate(courseMetrics);
        analysis.marketSaturation = calculateMarketSaturation(courseMetrics);
        analysis.trendHash = generateTrendHash(courseId, block.timestamp);

        emit TrendIdentified("market_trend", analysis.trendHash, analysis.demandScore);
        return analysis;
    }

    /**
     * @dev Predicts user performance
     * @param user Address of the user
     * @return PerformancePrediction containing performance predictions
     */
    function predictPerformance(address user) 
        external 
        onlyRole(DATA_SCIENTIST_ROLE) 
        returns (PerformancePrediction memory) 
    {
        BrainSafesMetrics.UserMetrics memory userMetrics = metricsContract.getUserMetrics(user);
        
        PerformancePrediction storage prediction = performancePredictions[user];
        prediction.expectedGrade = calculateExpectedGrade(userMetrics);
        prediction.completionLikelihood = calculateCompletionLikelihood(userMetrics);
        prediction.dropoutRisk = calculateDropoutRisk(userMetrics);
        prediction.engagementScore = calculateEngagementScore(userMetrics);
        prediction.predictionHash = generatePredictionHash(user, block.timestamp);

        emit PredictionGenerated(user, prediction.predictionHash, block.timestamp);
        return prediction;
    }

    // Internal calculation functions
    function calculateRecommendationAccuracy(BrainSafesMetrics.UserMetrics memory metrics) 
        internal 
        pure 
        returns (uint256) 
    {
        return (metrics.coursesCompleted * 100) / (metrics.coursesEnrolled > 0 ? metrics.coursesEnrolled : 1);
    }

    function calculateCompletionProbability(BrainSafesMetrics.UserMetrics memory metrics) 
        internal 
        pure 
        returns (uint256) 
    {
        return (metrics.coursesCompleted * 85) / (metrics.coursesEnrolled > 0 ? metrics.coursesEnrolled : 1);
    }

    function identifySkillGaps(BrainSafesMetrics.UserMetrics memory metrics) 
        internal 
        pure 
        returns (uint256) 
    {
        return 100 - ((metrics.averageGrade * 100) / 100);
    }

    function estimateTimeToMastery(BrainSafesMetrics.UserMetrics memory metrics) 
        internal 
        pure 
        returns (uint256) 
    {
        return (metrics.totalLearningHours * 150) / 100;
    }

    function calculateDemandScore(BrainSafesMetrics.CourseMetrics memory metrics) 
        internal 
        pure 
        returns (uint256) 
    {
        return (metrics.totalEnrollments * 100) / (metrics.activeStudents > 0 ? metrics.activeStudents : 1);
    }

    function calculateSupplyScore(BrainSafesMetrics.CourseMetrics memory metrics) 
        internal 
        pure 
        returns (uint256) 
    {
        return (metrics.totalRevenue * 100) / (metrics.totalEnrollments > 0 ? metrics.totalEnrollments : 1);
    }

    function calculateGrowthRate(BrainSafesMetrics.CourseMetrics memory metrics) 
        internal 
        pure 
        returns (uint256) 
    {
        return (metrics.activeStudents * 100) / (metrics.totalEnrollments > 0 ? metrics.totalEnrollments : 1);
    }

    function calculateMarketSaturation(BrainSafesMetrics.CourseMetrics memory metrics) 
        internal 
        pure 
        returns (uint256) 
    {
        return (metrics.completionRate * 100) / 100;
    }

    function calculateExpectedGrade(BrainSafesMetrics.UserMetrics memory metrics) 
        internal 
        pure 
        returns (uint256) 
    {
        return (metrics.averageGrade * 110) / 100;
    }

    function calculateCompletionLikelihood(BrainSafesMetrics.UserMetrics memory metrics) 
        internal 
        pure 
        returns (uint256) 
    {
        return (metrics.coursesCompleted * 90) / (metrics.coursesEnrolled > 0 ? metrics.coursesEnrolled : 1);
    }

    function calculateDropoutRisk(BrainSafesMetrics.UserMetrics memory metrics) 
        internal 
        pure 
        returns (uint256) 
    {
        return 100 - ((metrics.coursesCompleted * 100) / (metrics.coursesEnrolled > 0 ? metrics.coursesEnrolled : 1));
    }

    function calculateEngagementScore(BrainSafesMetrics.UserMetrics memory metrics) 
        internal 
        pure 
        returns (uint256) 
    {
        return (metrics.totalLearningHours * 100) / (metrics.coursesEnrolled > 0 ? metrics.coursesEnrolled : 1);
    }

    // Hash generation functions
    function generatePathHash(address user, uint256 timestamp) 
        internal 
        pure 
        returns (bytes32) 
    {
        return keccak256(abi.encodePacked(user, "path", timestamp));
    }

    function generateTrendHash(uint256 courseId, uint256 timestamp) 
        internal 
        pure 
        returns (bytes32) 
    {
        return keccak256(abi.encodePacked(courseId, "trend", timestamp));
    }

    function generatePredictionHash(address user, uint256 timestamp) 
        internal 
        pure 
        returns (bytes32) 
    {
        return keccak256(abi.encodePacked(user, "prediction", timestamp));
    }

    /**
     * @dev Required by the OZ UUPS module
     */
    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyRole(DEFAULT_ADMIN_ROLE)
    {}
} 