// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;


interface ICourseNFT {
    // ========== COURSE CREATION FUNCTIONS ==========
    
    function createCourse(
        string memory title,
        string memory description,
        string memory ipfsContent,
        uint256 price,
        uint256 duration,
        uint256 maxStudents,
        string[] memory skills,
        uint256 difficulty
    ) external returns (uint256);
    
    
    function batchCreateCourses(
        string[] calldata titles,
        string[] calldata descriptions,
        string[] calldata ipfsContents,
        uint256[] calldata prices,
        uint256[] calldata durations,
        uint256[] calldata maxStudentsArray,
        string[][] calldata skillsArrays,
        uint256[] calldata difficulties
    ) external returns (uint256[] memory);
    
    // ========== ENROLLMENT FUNCTIONS ==========
    
    function enrollInCourse(uint256 courseId) external payable;
    
    
    function batchEnrollStudents(
        uint256[] calldata courseIds,
        address[] calldata students
    ) external;
    
    
    function enrollWithScholarship(
        uint256 courseId,
        address student,
        uint256 scholarshipAmount
    ) external;
    
    
    function isEnrolled(uint256 courseId, address student) external view returns (bool);
    
    
    function getEnrollment(uint256 courseId, address student) external view returns (Enrollment memory);
    
    // ========== COURSE COMPLETION FUNCTIONS ==========
    
    function completeCourse(
        uint256 courseId,
        address student,
        uint256 score,
        bool certificateIssued
    ) external;
    
    
    function batchCompleteCourses(
        uint256[] calldata courseIds,
        address[] calldata students,
        uint256[] calldata scores,
        bool[] calldata certificatesIssued
    ) external;
    
    
    function updateProgress(
        uint256 courseId,
        address student,
        uint256 progress
    ) external;
    
    // ========== COURSE MANAGEMENT FUNCTIONS ==========
    
    function updateCourse(
        uint256 courseId,
        string memory title,
        string memory description,
        uint256 price,
        bool isActive
    ) external;
    
    
    function setCourseActive(uint256 courseId, bool isActive) external;
    
    
    function getCourse(uint256 courseId) external view returns (Course memory);
    
    
    function getInstructorCourses(address instructor) external view returns (uint256[] memory);
    
    
    function getStudentCourses(address student) external view returns (uint256[] memory);

    
    function getCoursesByInstructor(address instructor) external view returns (uint256[] memory);

    
    function getEnrolledCourses(address student) external view returns (uint256[] memory);
    
    // ========== RATING AND REVIEW FUNCTIONS ==========
    
    function rateCourse(
        uint256 courseId,
        uint256 rating,
        string memory review
    ) external;
    
    
    function getCourseRating(uint256 courseId) external view returns (uint256 averageRating, uint256 totalRatings);
    
    
    function getCourseReviews(uint256 courseId) external view returns (
        address[] memory reviewers,
        uint256[] memory ratings,
        string[] memory reviews
    );
    
    // ========== FINANCIAL FUNCTIONS ==========
    
    function withdrawEarnings(uint256 courseId) external;
    
    
    function getCourseEarnings(uint256 courseId) external view returns (uint256);
    
    
    function getInstructorEarnings(address instructor) external view returns (uint256);
    
    
    function calculatePlatformFee(uint256 amount) external view returns (uint256);
    
    // ========== SEARCH AND FILTER FUNCTIONS ==========
    
    function searchCourses(
        address instructor,
        uint256 minPrice,
        uint256 maxPrice,
        uint256 difficulty,
        bool isActive
    ) external view returns (uint256[] memory);
    
    
    function getCoursesBySkill(string memory skill) external view returns (uint256[] memory);
    
    
    function getPopularCourses(uint256 limit) external view returns (uint256[] memory);
    
    // ========== STATISTICS FUNCTIONS ==========
    
    function getCourseStats(uint256 courseId) external view returns (
        uint256 totalEnrollments,
        uint256 totalCompletions,
        uint256 completionRate,
        uint256 averageScore,
        uint256 totalEarnings
    );
    
    
    function getPlatformStats() external view returns (
        uint256 totalCourses,
        uint256 totalEnrollments,
        uint256 totalInstructors,
        uint256 totalStudents,
        uint256 totalEarnings
    );
    
    // ========== ADMIN FUNCTIONS ==========
    
    function updatePlatformFee(uint256 newFeePercentage) external;
    
    
    function mintCourse(
        address instructor,
        string memory ipfsContent,
        uint256 price
    ) external returns (uint256);
    
    
    function emergencyPause() external;
    
    
    function emergencyUnpause() external;
    
    
    function paused() external view returns (bool);
    
    // ========== STRUCTURES ==========
    struct Course {
        uint256 tokenId;
        address instructor;
        string title;
        string description;
        string ipfsContent;
        uint256 price;
        uint256 duration;
        uint256 maxStudents;
        uint256 currentStudents;
        uint256 totalEarnings;
        bool isActive;
        string[] skills;
        uint256 difficulty;
        uint256 createdAt;
        uint256 completionRate;
        uint256 averageRating;
    }
    
    struct Enrollment {
        address student;
        uint256 enrolledAt;
        uint256 progress;
        uint256 score;
        bool completed;
        bool certificateIssued;
        uint256 lastActivity;
    }
    
    struct CourseReview {
        address reviewer;
        uint256 rating;
        string review;
        uint256 timestamp;
    }
    
    // ========== EVENTS ==========
    event CourseCreated(
        uint256 indexed tokenId,
        address indexed instructor,
        string title,
        uint256 price,
        uint256 maxStudents
    );
    
    event StudentEnrolled(
        uint256 indexed courseId,
        address indexed student,
        uint256 timestamp
    );
    
    event CourseCompleted(
        uint256 indexed courseId,
        address indexed student,
        uint256 score,
        bool certificateIssued
    );
    
    event CourseUpdated(
        uint256 indexed courseId,
        string title,
        uint256 price,
        bool isActive
    );
    
    event CourseRated(
        uint256 indexed courseId,
        address indexed reviewer,
        uint256 rating
    );
    
    event EarningsWithdrawn(
        uint256 indexed courseId,
        address indexed instructor,
        uint256 amount
    );
    
    event PlatformFeeUpdated(uint256 newFeePercentage);
    event EmergencyPaused(address indexed admin);
    event EmergencyUnpaused(address indexed admin);
}
