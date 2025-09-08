// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";

// Note: These interfaces are placeholders for the actual implementations
interface IBadgeNFT {
    function mintBadge(address, string memory) external returns (uint256);
}

interface ICurriculumValidator {
    function curriculums(uint256) external view returns (uint256, string memory, string memory, address, bool, address, uint256);
}





contract SkillAssessment is AccessControl {
    bytes32 public constant ASSESSOR_ROLE = keccak256("ASSESSOR_ROLE");
    IBadgeNFT public badgeNFT;
    ICurriculumValidator public curriculumValidator;

    struct Assessment {
        uint256 id;
        address student;
        string skill;
        string evidence;
        uint256 score;
        bool passed;
        address assessor;
        uint256 assessedAt;
        string badgeURI;
    }

    uint256 public nextAssessmentId;
    mapping(uint256 => Assessment) public assessments;

    event SkillAssessed(uint256 indexed id, address indexed student, string skill, bool passed);

    constructor(address _badgeNFT, address _curriculumValidator) {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        badgeNFT = IBadgeNFT(_badgeNFT);
        curriculumValidator = ICurriculumValidator(_curriculumValidator);
    }

    function assessSkill(address student, string memory skill, string memory evidence, uint256 score, bool passed, string memory badgeURI, uint256 curriculumId) external onlyRole(ASSESSOR_ROLE) returns (uint256) {
        // Validar que el currículo esté validado
        (, , , , bool validated, , ) = curriculumValidator.curriculums(curriculumId);
        require(validated, unicode"Currículo no validado");
        uint256 id = ++nextAssessmentId;
        assessments[id] = Assessment({
            id: id,
            student: student,
            skill: skill,
            evidence: evidence,
            score: score,
            passed: passed,
            assessor: msg.sender,
            assessedAt: block.timestamp,
            badgeURI: badgeURI
        });
        if (passed) {
            badgeNFT.mintBadge(student, badgeURI);
        }
        emit SkillAssessed(id, student, skill, passed);
        return id;
    }

    function mintSpecialBadge(address student, string memory badgeURI, string memory reason) external onlyRole(DEFAULT_ADMIN_ROLE) returns (uint256) {
        // Puedes guardar un registro especial si lo deseas
        uint256 tokenId = badgeNFT.mintBadge(student, badgeURI);
        // Puedes emitir un evento especial
        emit SkillAssessed(0, student, reason, true);
        return tokenId;
    }

    function setCurriculumValidator(address _curriculumValidator) external onlyRole(DEFAULT_ADMIN_ROLE) {
        curriculumValidator = ICurriculumValidator(_curriculumValidator);
    }
} 