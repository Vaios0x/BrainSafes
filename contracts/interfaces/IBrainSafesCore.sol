// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;


interface IBrainSafesCore {
    // ========== USER MANAGEMENT FUNCTIONS ==========
    
    function registerUser(
        string memory _name,
        string memory _email,
        string memory _ipfsProfile
    ) external;
    
    
    function registerInstructor(address instructor) external;
    
    
    function registerOrganization(address organization) external;
    
    
    function getUserProfile(address user) external view returns (UserProfile memory);
    
    
    function getUserCourses(address user) external view returns (uint256[] memory);
    
    
    function getCourseStudents(uint256 courseId) external view returns (address[] memory);
    
    // ========== COURSE FUNCTIONS ==========
    
    function createCourse(
        string memory _title,
        string memory _description,
        string memory _ipfsContent,
        uint256 _price,
        uint256 _duration,
        uint256 _maxStudents,
        string[] memory _skills,
        uint256 _difficulty
    ) external returns (uint256);
    
    
    function enrollInCourse(uint256 courseId) external payable;
    
    
    function completeCourse(
        uint256 courseId,
        uint256 score,
        bytes32 proofOfCompletion
    ) external;
    
    
    function getCourse(uint256 courseId) external view returns (Course memory);
    
    // ========== AI FUNCTIONS ==========
    
    function predictStudentPerformance(address student, uint256 courseId) external view returns (uint256);
    
    
    function getPersonalizedLearningPath(address student) external view returns (uint256[] memory);
    
    
    function detectFraudulentActivity(address user, bytes32 activityHash) external view returns (bool);
    
    
    function batchPredictPerformance(
        address[] calldata students,
        uint256[] calldata courseIds
    ) external view returns (uint256[] memory);
    
    
    function getAIInsights(address user) external view returns (AIInsight memory);
    
    // ========== SCHOLARSHIP FUNCTIONS ==========
    
    function applyForScholarship(uint256 amount, string memory reason) external;
    
    
    function evaluateScholarshipEligibility(address student) external view returns (uint256 score, bool eligible);
    
    // ========== ACHIEVEMENT FUNCTIONS ==========
    
    function createAchievement(
        string memory _name,
        string memory _description,
        string memory _ipfsMetadata,
        uint256 _requiredPoints,
        uint256 _reward
    ) external;
    
    
    function getAchievement(uint256 achievementId) external view returns (Achievement memory);
    
    // ========== PLATFORM STATISTICS ==========
    
    function getPlatformStats() external view returns (
        uint256 totalCourses,
        uint256 totalEnrollments,
        uint256 totalAchievements,
        uint256 totalUsers
    );
    
    // ========== ADMIN FUNCTIONS ==========
    
    function updatePlatformConfig(
        uint256 _platformFeePercentage,
        uint256 _instructorRewardPercentage,
        uint256 _studentRewardPercentage,
        uint256 _minimumStakeAmount,
        uint256 _maxCoursesPerInstructor
    ) external;
    
    
    function emergencyPause(string memory reason) external;
    
    
    function emergencyUnpause() external;
    
    
    function toggleAIIntegration() external;
    
    
    function updateContractAddress(string memory contractName, address newAddress) external;
    
    // ========== ROLE FUNCTIONS ==========
    
    function isAdmin(address account) external view returns (bool);
    
    
    function isInstructor(address account) external view returns (bool);
    
    
    function isStudent(address account) external view returns (bool);
    
    
    function grantAdmin(address account) external;
    
    
    function revokeAdmin(address account) external;
    
    // ========== STRUCTURES ==========
    struct UserProfile {
        string name;
        string email;
        string ipfsProfile;
        uint256 reputation;
        uint256 totalEarned;
        uint256 totalSpent;
        uint256 joinTimestamp;
        bool isActive;
        uint256[] achievements;
    }
    
    struct Course {
        uint256 id;
        address instructor;
        string title;
        string description;
        string ipfsContent;
        uint256 price;
        uint256 duration; // in days
        uint256 maxStudents;
        uint256 currentStudents;
        uint256 totalEarnings;
        bool isActive;
        string[] skills;
        uint256 difficulty; // 1-5
        uint256 createdAt;
    }
    
    struct Enrollment {
        uint256 courseId;
        address student;
        uint256 enrolledAt;
        uint256 progress; // 0-100
        uint256 score;
        bool completed;
        bool certificateIssued;
    }
    
    struct Achievement {
        uint256 id;
        string name;
        string description;
        string ipfsMetadata;
        uint256 requiredPoints;
        uint256 reward;
        bool isActive;
    }
    
    struct AIInsight {
        address user;
        uint256 performancePrediction;
        uint256[] recommendedCourses;
        string learningStyle;
        uint256 riskScore;
        uint256 lastUpdated;
    }
    
    // ========== EVENTS ==========
    event UserRegistered(address indexed user, string name, uint256 timestamp);
    event CourseCreated(uint256 indexed courseId, address indexed instructor, string title, uint256 price);
    event StudentEnrolled(uint256 indexed courseId, address indexed student, uint256 timestamp);
    event CourseCompleted(uint256 indexed courseId, address indexed student, uint256 score, bool certificateIssued);
    event RewardDistributed(address indexed recipient, uint256 amount, string reason);
    event AchievementUnlocked(address indexed user, uint256 indexed achievementId, uint256 reward);
    event AIInsightUpdated(address indexed user, uint256 performancePrediction);
    event EmergencyPaused(address indexed admin, string reason);
    event PlatformConfigUpdated(string parameter, uint256 newValue);
}
