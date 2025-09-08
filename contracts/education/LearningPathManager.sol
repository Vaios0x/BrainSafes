// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "../interfaces/IAIOracle.sol";

// Note: These interfaces are placeholders for the actual implementations
interface ICourseCatalog {
    function courses(uint256) external view returns (address, string memory, string memory, uint256, uint256, uint256, bool, uint256[] memory);
}

interface IBadgeNFT {
    function mintBadge(address, string memory) external;
}

interface ProgressTracker {
    function getProgress(address, uint256) external view returns (bool, uint256, uint256, uint256, uint256, uint256, uint256, uint256);
}





contract LearningPathManager is AccessControl {
    bytes32 public constant IA_ROLE = keccak256("IA_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    ICourseCatalog public courseCatalog;
    IAIOracle public aiOracle;
    mapping(address => uint256[]) public studentPaths;
    IBadgeNFT public badgeNFT;
    mapping(address => bool) public routeBadgeMinted;
    address public progressTracker;

    event LearningPathSet(address indexed student, uint256[] courseIds);

    constructor(address _courseCatalog, address _badgeNFT, address _progressTracker, address _aiOracle) {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(ADMIN_ROLE, msg.sender);
        courseCatalog = ICourseCatalog(_courseCatalog);
        badgeNFT = IBadgeNFT(_badgeNFT);
        progressTracker = _progressTracker;
        aiOracle = IAIOracle(_aiOracle);
    }

    function setLearningPath(address student, uint256[] memory courseIds) external {
        require(msg.sender == student || hasRole(IA_ROLE, msg.sender), "No autorizado");
        // Validar que todos los cursos estén activos y que los prerrequisitos estén en la ruta
        for (uint256 i = 0; i < courseIds.length; i++) {
            (, , , , , , bool active, uint256[] memory prereqs) = courseCatalog.courses(courseIds[i]);
            require(active, "Curso inactivo");
            for (uint256 j = 0; j < prereqs.length; j++) {
                bool found = false;
                for (uint256 k = 0; k < courseIds.length; k++) {
                    if (courseIds[k] == prereqs[j]) found = true;
                }
                require(found, "Faltan prerrequisitos en la ruta");
            }
        }
        studentPaths[student] = courseIds;
        emit LearningPathSet(student, courseIds);
    }

    function getLearningPath(address student) external view returns (uint256[] memory) {
        return studentPaths[student];
    }

    function checkAndMintRouteBadge(address student, uint256[] memory path, string memory badgeURI) public {
        require(!routeBadgeMinted[student], "Badge de ruta ya minteado");
        for (uint256 i = 0; i < path.length; i++) {
            (bool finished,,,,,,,) = ProgressTracker(progressTracker).getProgress(student, path[i]);
            require(finished, "Ruta incompleta");
        }
        badgeNFT.mintBadge(student, badgeURI);
        routeBadgeMinted[student] = true;
    }

    // ========== AI-POWERED FUNCTIONS ==========
    
    function generateAILearningPath(address student) external view returns (uint256[] memory) {
        return aiOracle.generateLearningPath(student);
    }
    
    function getAIRecommendedCourses(address student) external view returns (uint256[] memory) {
        return aiOracle.recommendCourses(student);
    }
    
    function predictCourseCompletion(address student, uint256 courseId) external view returns (uint256) {
        return aiOracle.predictCompletionTime(student, courseId);
    }
    
    function assessCourseDifficultyForStudent(address student, uint256 courseId) external view returns (uint256) {
        return aiOracle.assessCourseDifficulty(student, courseId);
    }
    
    function setAIGeneratedPath(address student) external {
        require(msg.sender == student || hasRole(IA_ROLE, msg.sender), "No autorizado");
        uint256[] memory aiPath = aiOracle.generateLearningPath(student);
        
        // Validate AI-generated path
        for (uint256 i = 0; i < aiPath.length; i++) {
            (, , , , , , bool active, uint256[] memory prereqs) = courseCatalog.courses(aiPath[i]);
            require(active, "Curso inactivo");
            for (uint256 j = 0; j < prereqs.length; j++) {
                bool found = false;
                for (uint256 k = 0; k < aiPath.length; k++) {
                    if (aiPath[k] == prereqs[j]) found = true;
                }
                require(found, "Prerrequisito no incluido en la ruta");
            }
        }
        
        studentPaths[student] = aiPath;
        emit LearningPathSet(student, aiPath);
    }
    
    function updateAIOracle(address newAIOracle) external onlyRole(ADMIN_ROLE) {
        require(newAIOracle != address(0), "Invalid address");
        aiOracle = IAIOracle(newAIOracle);
    }

    event AILearningPathGenerated(address indexed student, uint256[] courseIds);
    event CourseCompletionPredicted(address indexed student, uint256 indexed courseId, uint256 estimatedHours);
}

 