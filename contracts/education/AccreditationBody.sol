// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract AccreditationBody is AccessControl {
    bytes32 public constant ACCREDITOR_ROLE = keccak256("ACCREDITOR_ROLE");

    struct Accreditor {
        address addr;
        string name;
        string metadata;
        bool active;
    }

    mapping(address => Accreditor) public accreditors;
    address[] public accreditorList;
    mapping(address => address[]) public endorsements; // accreditor => endorsedBy[]

    event AccreditorRegistered(address indexed addr, string name);
    event AccreditorStatusChanged(address indexed addr, bool active);
    event AccreditorRevoked(address indexed addr);
    event AccreditorEndorsed(address indexed accreditor, address indexed endorser);

    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function registerAccreditor(address addr, string memory name, string memory metadata) external onlyRole(DEFAULT_ADMIN_ROLE) {
        accreditors[addr] = Accreditor(addr, name, metadata, true);
        accreditorList.push(addr);
        _grantRole(ACCREDITOR_ROLE, addr);
        emit AccreditorRegistered(addr, name);
    }

    function setAccreditorStatus(address addr, bool active) external onlyRole(DEFAULT_ADMIN_ROLE) {
        accreditors[addr].active = active;
        emit AccreditorStatusChanged(addr, active);
    }

    function revokeAccreditor(address addr) external onlyRole(DEFAULT_ADMIN_ROLE) {
        accreditors[addr].active = false;
        _revokeRole(ACCREDITOR_ROLE, addr);
        emit AccreditorRevoked(addr);
    }
    function endorseAccreditor(address accreditor) external {
        require(accreditors[accreditor].active, "Acreditador inactivo");
        endorsements[accreditor].push(msg.sender);
        emit AccreditorEndorsed(accreditor, msg.sender);
    }

    function getAllAccreditors() external view returns (Accreditor[] memory) {
        Accreditor[] memory list = new Accreditor[](accreditorList.length);
        for (uint256 i = 0; i < accreditorList.length; i++) {
            list[i] = accreditors[accreditorList[i]];
        }
        return list;
    }
} 