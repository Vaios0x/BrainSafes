// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "../interfaces/IAIOracle.sol";

contract CourseCatalog is AccessControl {
    bytes32 public constant INSTRUCTOR_ROLE = keccak256("INSTRUCTOR_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    struct Course {
        uint256 id;
        string title;
        string description;
        address instructor;
        string ipfsMetadata;
        uint256 createdAt;
        bool active;
        uint256[] prerequisites;
    }

    uint256 public nextCourseId;
    mapping(uint256 => Course) public courses;
    mapping(address => uint256[]) public instructorCourses;
    IAIOracle public aiOracle;

    event CourseCreated(uint256 indexed id, address indexed instructor, string title);
    event CourseEdited(uint256 indexed id, string newTitle);
    event PrerequisitesSet(uint256 indexed id, uint256[] prerequisites);

    constructor(address _aiOracle) {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(ADMIN_ROLE, msg.sender);
        aiOracle = IAIOracle(_aiOracle);
    }

    function createCourse(string memory title, string memory description, string memory ipfsMetadata, uint256[] memory prerequisites) external onlyRole(INSTRUCTOR_ROLE) returns (uint256) {
        uint256 id = ++nextCourseId;
        courses[id] = Course({
            id: id,
            title: title,
            description: description,
            instructor: msg.sender,
            ipfsMetadata: ipfsMetadata,
            createdAt: block.timestamp,
            active: true,
            prerequisites: prerequisites
        });
        instructorCourses[msg.sender].push(id);
        emit CourseCreated(id, msg.sender, title);
        if (prerequisites.length > 0) emit PrerequisitesSet(id, prerequisites);
        return id;
    }

    function editCourse(uint256 id, string memory newTitle, string memory newDescription, string memory newIpfsMetadata) external onlyRole(INSTRUCTOR_ROLE) {
        Course storage c = courses[id];
        require(msg.sender == c.instructor, "Solo el instructor puede editar");
        c.title = newTitle;
        c.description = newDescription;
        c.ipfsMetadata = newIpfsMetadata;
        emit CourseEdited(id, newTitle);
    }

    function setPrerequisites(uint256 id, uint256[] memory prerequisites) external onlyRole(INSTRUCTOR_ROLE) {
        Course storage c = courses[id];
        require(msg.sender == c.instructor, "Solo el instructor puede editar");
        c.prerequisites = prerequisites;
        emit PrerequisitesSet(id, prerequisites);
    }

    function getCoursesByInstructor(address instructor) external view returns (uint256[] memory) {
        return instructorCourses[instructor];
    }

    function grantInstructor(address instructor) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(INSTRUCTOR_ROLE, instructor);
    }

    // ========== AI-POWERED FUNCTIONS ==========
    
    function analyzeContentQuality(uint256 courseId) external view returns (uint256) {
        require(courses[courseId].id != 0, "Course not found");
        bytes32 contentHash = keccak256(abi.encodePacked(courses[courseId].ipfsMetadata));
        return aiOracle.analyzeContentQuality(courseId, contentHash);
    }
    
    function getCourseDifficultyForStudent(address student, uint256 courseId) external view returns (uint256) {
        require(courses[courseId].id != 0, "Course not found");
        return aiOracle.assessCourseDifficulty(student, courseId);
    }
    
    function predictCompletionTimeForStudent(address student, uint256 courseId) external view returns (uint256) {
        require(courses[courseId].id != 0, "Course not found");
        return aiOracle.predictCompletionTime(student, courseId);
    }
    
    function getRecommendedCoursesForStudent(address student) external view returns (uint256[] memory) {
        return aiOracle.recommendCourses(student);
    }
    
    function detectPlagiarismInSubmission(bytes32 submissionHash, bytes memory referenceData) external view returns (uint256) {
        return aiOracle.detectPlagiarism(submissionHash, referenceData);
    }
    
    function updateAIOracle(address newAIOracle) external onlyRole(ADMIN_ROLE) {
        require(newAIOracle != address(0), "Invalid address");
        aiOracle = IAIOracle(newAIOracle);
    }

    event ContentQualityAnalyzed(uint256 indexed courseId, uint256 qualityScore);
    event CourseDifficultyAssessed(address indexed student, uint256 indexed courseId, uint256 difficultyScore);
    event PlagiarismDetected(bytes32 indexed submissionHash, uint256 confidence);
} 