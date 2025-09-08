// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract SimpleCourseNFT is ERC721, AccessControl {
    using Counters for Counters.Counter;
    
    bytes32 public constant INSTRUCTOR_ROLE = keccak256("INSTRUCTOR_ROLE");
    
    Counters.Counter private _courseIds;
    
    struct Course {
        string title;
        string description;
        address instructor;
        uint256 price;
        uint256 duration;
        string ipfsHash;
        bool isActive;
        uint256 enrolledCount;
    }
    
    mapping(uint256 => Course) public courses;
    mapping(uint256 => mapping(address => bool)) public enrollments;
    
    event CourseCreated(uint256 indexed courseId, address indexed instructor, string title);
    event StudentEnrolled(uint256 indexed courseId, address indexed student);
    
    constructor() ERC721("BrainSafes Course", "COURSE") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(INSTRUCTOR_ROLE, msg.sender);
    }
    
    function createCourse(
        string memory title,
        string memory description,
        uint256 price,
        uint256 duration,
        string memory ipfsHash
    ) external onlyRole(INSTRUCTOR_ROLE) returns (uint256) {
        _courseIds.increment();
        uint256 courseId = _courseIds.current();
        
        courses[courseId] = Course({
            title: title,
            description: description,
            instructor: msg.sender,
            price: price,
            duration: duration,
            ipfsHash: ipfsHash,
            isActive: true,
            enrolledCount: 0
        });
        
        _mint(msg.sender, courseId);
        
        emit CourseCreated(courseId, msg.sender, title);
        return courseId;
    }
    
    function enrollInCourse(uint256 courseId) external payable {
        require(_exists(courseId), "Course does not exist");
        require(courses[courseId].isActive, "Course is not active");
        require(!enrollments[courseId][msg.sender], "Already enrolled");
        require(msg.value >= courses[courseId].price, "Insufficient payment");
        
        enrollments[courseId][msg.sender] = true;
        courses[courseId].enrolledCount++;
        
        // Transfer payment to instructor
        payable(courses[courseId].instructor).transfer(msg.value);
        
        emit StudentEnrolled(courseId, msg.sender);
    }
    
    function getCourse(uint256 courseId) external view returns (Course memory) {
        require(_exists(courseId), "Course does not exist");
        return courses[courseId];
    }
    
    function isEnrolled(uint256 courseId, address student) external view returns (bool) {
        return enrollments[courseId][student];
    }
    
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}