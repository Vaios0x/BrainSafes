// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";

// Note: These interfaces are placeholders for the actual implementations
interface ICourseCatalog {
    function courses(uint256) external view returns (address, string memory, string memory, uint256, uint256, uint256, bool, uint256[] memory);
}

interface IBadgeNFT {
    function mintBadge(address, string memory) external;
}





contract ProgressTracker is AccessControl {
    bytes32 public constant IA_ROLE = keccak256("IA_ROLE");
    ICourseCatalog public courseCatalog;
    IBadgeNFT public badgeNFT;
    mapping(address => mapping(uint256 => bool)) public badgeMinted;
    struct Progress {
        uint256 courseId;
        address student;
        uint256 completedModules;
        uint256 totalModules;
        bool finished;
        uint256 lastUpdate;
    }

    mapping(address => mapping(uint256 => Progress)) public progress;

    event ProgressUpdated(address indexed student, uint256 indexed courseId, uint256 completedModules, bool finished);

    constructor(address _courseCatalog, address _badgeNFT) {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        courseCatalog = ICourseCatalog(_courseCatalog);
        badgeNFT = IBadgeNFT(_badgeNFT);
    }

    function startCourse(address student, uint256 courseId, uint256 totalModules) external {
        (, , , , , , bool active, uint256[] memory prereqs) = courseCatalog.courses(courseId);
        require(active, "Curso inactivo");
        // Validar que el estudiante haya completado los prerrequisitos
        for (uint256 i = 0; i < prereqs.length; i++) {
            require(progress[student][prereqs[i]].finished, "Prerrequisito no completado");
        }
        Progress storage p = progress[student][courseId];
        require(p.totalModules == 0, "Ya iniciado");
        p.courseId = courseId;
        p.student = student;
        p.totalModules = totalModules;
        p.completedModules = 0;
        p.finished = false;
        p.lastUpdate = block.timestamp;
    }

    function updateProgress(address student, uint256 courseId, uint256 completedModules) external {
        require(msg.sender == student || hasRole(IA_ROLE, msg.sender), "No autorizado");
        Progress storage p = progress[student][courseId];
        require(p.totalModules > 0, "No iniciado");
        require(completedModules <= p.totalModules, unicode"Excede módulos");
        p.completedModules = completedModules;
        p.finished = (completedModules == p.totalModules);
        p.lastUpdate = block.timestamp;
        emit ProgressUpdated(student, courseId, completedModules, p.finished);
        if (p.finished && !badgeMinted[student][courseId]) {
            string memory badgeURI = "ipfs://badge-metadata"; // Puedes parametrizar esto
            badgeNFT.mintBadge(student, badgeURI);
            badgeMinted[student][courseId] = true;
        }
    }

    function getProgress(address student, uint256 courseId) external view returns (Progress memory) {
        return progress[student][courseId];
    }
} 