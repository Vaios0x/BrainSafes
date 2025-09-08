// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";


contract CourseNFT is ERC721, ERC721URIStorage, AccessControl, Pausable {
    using Counters for Counters.Counter;
    using SafeMath for uint256;

    // ========== ROLES ==========
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant INSTRUCTOR_ROLE = keccak256("INSTRUCTOR_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    // ========== STRUCTURES ==========
    struct Course {
        uint256 tokenId;
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
        uint256 completionRate;
        uint256 averageRating;
    }

    struct Enrollment {
        address student;
        uint256 enrolledAt;
        uint256 progress; // 0-100
        uint256 score;
        bool completed;
        bool certificateIssued;
        uint256 lastActivity;
    }

    // ========== STATE VARIABLES ==========
    Counters.Counter private _tokenIds;
    
    mapping(uint256 => Course) public courses;
    mapping(uint256 => mapping(address => Enrollment)) public enrollments;
    mapping(address => uint256[]) public instructorCourses;
    mapping(address => uint256[]) public studentEnrollments;
    
    uint256 public totalCourses;
    uint256 public totalEnrollments;
    uint256 public platformFeePercentage = 250; // 2.5%

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

    // ========== CONSTRUCTOR ==========
    constructor() ERC721("BrainSafes Course NFT", "BSCOURSE") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
    }

    // ========== CORE FUNCTIONS ==========
    
    
    function mintCourse(
        address to,
        string memory title,
        string memory description,
        string memory ipfsContent,
        uint256 price,
        uint256 duration,
        uint256 maxStudents,
        string[] memory skills,
        uint256 difficulty,
        string memory uri
    ) external onlyRole(MINTER_ROLE) returns (uint256) {
        require(to != address(0), "Invalid recipient address");
        require(bytes(title).length > 0, "Title cannot be empty");
        require(price >= 0, "Price must be non-negative");
        require(duration > 0, "Duration must be positive");
        require(maxStudents > 0, "Max students must be positive");
        require(difficulty >= 1 && difficulty <= 5, "Difficulty must be 1-5");

        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        _safeMint(to, newTokenId);
        _setTokenURI(newTokenId, uri);

        courses[newTokenId] = Course({
            tokenId: newTokenId,
            instructor: to,
            title: title,
            description: description,
            ipfsContent: ipfsContent,
            price: price,
            duration: duration,
            maxStudents: maxStudents,
            currentStudents: 0,
            totalEarnings: 0,
            isActive: true,
            skills: skills,
            difficulty: difficulty,
            createdAt: block.timestamp,
            completionRate: 0,
            averageRating: 0
        });

        instructorCourses[to].push(newTokenId);
        totalCourses = totalCourses.add(1);

        emit CourseCreated(newTokenId, to, title, price, maxStudents);
        return newTokenId;
    }

    
    function enrollStudent(uint256 courseId, address student) external onlyRole(MINTER_ROLE) {
        require(_exists(courseId), "Course does not exist");
        require(courses[courseId].isActive, "Course is not active");
        require(courses[courseId].currentStudents < courses[courseId].maxStudents, "Course is full");
        require(enrollments[courseId][student].student == address(0), "Student already enrolled");

        enrollments[courseId][student] = Enrollment({
            student: student,
            enrolledAt: block.timestamp,
            progress: 0,
            score: 0,
            completed: false,
            certificateIssued: false,
            lastActivity: block.timestamp
        });

        studentEnrollments[student].push(courseId);
        courses[courseId].currentStudents = courses[courseId].currentStudents.add(1);
        totalEnrollments = totalEnrollments.add(1);

        emit StudentEnrolled(courseId, student, block.timestamp);
    }

    
    function updateProgress(
        uint256 courseId,
        address student,
        uint256 progress,
        uint256 score
    ) external onlyRole(MINTER_ROLE) {
        require(_exists(courseId), "Course does not exist");
        require(enrollments[courseId][student].student != address(0), "Student not enrolled");
        require(progress <= 100, "Progress cannot exceed 100%");

        Enrollment storage enrollment = enrollments[courseId][student];
        enrollment.progress = progress;
        enrollment.score = score;
        enrollment.lastActivity = block.timestamp;

        if (progress == 100 && !enrollment.completed) {
            enrollment.completed = true;
            emit CourseCompleted(courseId, student, score, false);
        }
    }

    
    function issueCertificate(uint256 courseId, address student) external onlyRole(MINTER_ROLE) {
        require(_exists(courseId), "Course does not exist");
        require(enrollments[courseId][student].student != address(0), "Student not enrolled");
        require(enrollments[courseId][student].completed, "Course not completed");
        require(!enrollments[courseId][student].certificateIssued, "Certificate already issued");

        enrollments[courseId][student].certificateIssued = true;
        emit CourseCompleted(courseId, student, enrollments[courseId][student].score, true);
    }

    // ========== VIEW FUNCTIONS ==========
    
    
    function getCourseInfo(uint256 tokenId) external view returns (
        address instructor,
        uint256 price,
        bool active,
        uint256 currentStudents,
        uint256 maxStudents,
        string memory title
    ) {
        require(_exists(tokenId), "Course does not exist");
        Course storage course = courses[tokenId];
        return (
            course.instructor,
            course.price,
            course.isActive,
            course.currentStudents,
            course.maxStudents,
            course.title
        );
    }

    
    function getEnrollmentInfo(uint256 courseId, address student) external view returns (
        uint256 enrolledAt,
        uint256 progress,
        uint256 score,
        bool completed,
        bool certificateIssued
    ) {
        require(_exists(courseId), "Course does not exist");
        Enrollment storage enrollment = enrollments[courseId][student];
        require(enrollment.student != address(0), "Student not enrolled");
        
        return (
            enrollment.enrolledAt,
            enrollment.progress,
            enrollment.score,
            enrollment.completed,
            enrollment.certificateIssued
        );
    }

    
    function getInstructorCourses(address instructor) external view returns (uint256[] memory) {
        return instructorCourses[instructor];
    }

    
    function getStudentEnrollments(address student) external view returns (uint256[] memory) {
        return studentEnrollments[student];
    }

    // ========== ADMIN FUNCTIONS ==========
    
    
    function updateCourseStatus(uint256 courseId, bool isActive) external onlyRole(ADMIN_ROLE) {
        require(_exists(courseId), "Course does not exist");
        courses[courseId].isActive = isActive;
        emit CourseUpdated(courseId, courses[courseId].title, courses[courseId].price, isActive);
    }

    
    function updatePlatformFee(uint256 newFeePercentage) external onlyRole(ADMIN_ROLE) {
        require(newFeePercentage <= 1000, "Fee cannot exceed 10%");
        platformFeePercentage = newFeePercentage;
    }

    // ========== OVERRIDE FUNCTIONS ==========
    
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override whenNotPaused {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }
}
