// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";

interface ICourseCatalog {
    function courses(uint256 id) external view returns (
        uint256, string memory, string memory, address, string memory, uint256, bool, uint256[] memory
    );
}

interface IBadgeNFT {
    function mintBadge(address to, string memory tokenURI) external returns (uint256);
}

contract LearningPathManager is AccessControl {
    bytes32 public constant IA_ROLE = keccak256("IA_ROLE");
    ICourseCatalog public courseCatalog;
    mapping(address => uint256[]) public studentPaths;
    IBadgeNFT public badgeNFT;
    mapping(address => bool) public routeBadgeMinted;
    address public progressTracker;

    event LearningPathSet(address indexed student, uint256[] courseIds);

    constructor(address _courseCatalog, address _badgeNFT, address _progressTracker) {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        courseCatalog = ICourseCatalog(_courseCatalog);
        badgeNFT = IBadgeNFT(_badgeNFT);
        progressTracker = _progressTracker;
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
            (bool finished,,,,,,) = ProgressTracker(progressTracker).getProgress(student, path[i]);
            require(finished, "Ruta incompleta");
        }
        badgeNFT.mintBadge(student, badgeURI);
        routeBadgeMinted[student] = true;
    }
}

interface ProgressTracker {
    function getProgress(address student, uint256 courseId) external view returns (
        uint256, address, uint256, uint256, bool, uint256
    );
} 