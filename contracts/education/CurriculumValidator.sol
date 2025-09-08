// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";

// Note: IAccreditationBody interface is not defined
// This is a placeholder interface for the accreditation body
interface IAccreditationBody {
    function accreditors(address) external view returns (address, string memory, uint256, bool);
}



contract CurriculumValidator is AccessControl {
    IAccreditationBody public accreditationBody;

    struct Curriculum {
        uint256 id;
        string name;
        string metadata;
        address submitter;
        bool validated;
        address validator;
        uint256 validatedAt;
    }

    uint256 public nextCurriculumId;
    mapping(uint256 => Curriculum) public curriculums;

    event CurriculumSubmitted(uint256 indexed id, address indexed submitter, string name);
    event CurriculumValidated(uint256 indexed id, address indexed validator);

    constructor(address _accreditationBody) {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        accreditationBody = IAccreditationBody(_accreditationBody);
    }

    function submitCurriculum(string memory name, string memory metadata) external returns (uint256) {
        uint256 id = ++nextCurriculumId;
        curriculums[id] = Curriculum({
            id: id,
            name: name,
            metadata: metadata,
            submitter: msg.sender,
            validated: false,
            validator: address(0),
            validatedAt: 0
        });
        emit CurriculumSubmitted(id, msg.sender, name);
        return id;
    }

    function validateCurriculum(uint256 id) external {
        (, , , bool active) = accreditationBody.accreditors(msg.sender);
        require(active, "Solo acreditadores activos pueden validar");
        Curriculum storage c = curriculums[id];
        require(!c.validated, "Ya validado");
        c.validated = true;
        c.validator = msg.sender;
        c.validatedAt = block.timestamp;
        emit CurriculumValidated(id, msg.sender);
    }
} 