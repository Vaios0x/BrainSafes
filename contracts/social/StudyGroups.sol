// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract StudyGroups is AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant GROUP_ADMIN_ROLE = keccak256("GROUP_ADMIN_ROLE");

    struct Group {
        address admin;
        uint32 createdAt;
        uint16 memberCount;
        bool open;
        bytes32 nameHash;
        bytes32 metaHash;
    }

    uint256 public groupCounter;
    mapping(uint256 => Group) public groups;
    mapping(uint256 => mapping(address => bool)) internal isMember;
    mapping(uint256 => address[]) internal groupMembers;
    mapping(uint256 => mapping(address => bool)) internal invited;

    address public guardian;
    modifier onlyGuardian() { require(msg.sender == guardian, "Solo guardian"); _; }

    event GroupCreated(uint256 indexed groupId, address indexed admin, bytes32 nameHash, bool open);
    event MemberJoined(uint256 indexed groupId, address indexed member);
    event MemberLeft(uint256 indexed groupId, address indexed member);
    event AdminTransferred(uint256 indexed groupId, address indexed oldAdmin, address indexed newAdmin);
    event MemberInvited(uint256 indexed groupId, address indexed invited);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        guardian = msg.sender;
    }

    function setGuardian(address _guardian) external onlyGuardian {
        guardian = _guardian;
    }

    function createGroup(string memory name, string memory metadataURI, bool open) external returns (uint256) {
        groupCounter++;
        bytes32 nameHash = keccak256(bytes(name));
        bytes32 metaHash = keccak256(bytes(metadataURI));
        groups[groupCounter] = Group({
            admin: msg.sender,
            createdAt: uint32(block.timestamp),
            memberCount: 1,
            open: open,
            nameHash: nameHash,
            metaHash: metaHash
        });
        isMember[groupCounter][msg.sender] = true;
        groupMembers[groupCounter].push(msg.sender);
        emit GroupCreated(groupCounter, msg.sender, nameHash, open);
        return groupCounter;
    }

    function joinGroup(uint256 groupId) external {
        Group storage group = groups[groupId];
        require(group.admin != address(0), "Grupo no existe");
        require(!isMember[groupId][msg.sender], "Ya es miembro");
        require(group.open || invited[groupId][msg.sender], unicode"Solo por invitación");
        isMember[groupId][msg.sender] = true;
        groupMembers[groupId].push(msg.sender);
        unchecked { group.memberCount++; }
        emit MemberJoined(groupId, msg.sender);
    }

    function inviteMember(uint256 groupId, address user) external {
        Group storage group = groups[groupId];
        require(msg.sender == group.admin, "Solo admin del grupo");
        invited[groupId][user] = true;
        emit MemberInvited(groupId, user);
    }

    function leaveGroup(uint256 groupId) external {
        require(isMember[groupId][msg.sender], "No es miembro");
        isMember[groupId][msg.sender] = false;
        unchecked { groups[groupId].memberCount--; }
        emit MemberLeft(groupId, msg.sender);
    }

    function transferAdmin(uint256 groupId, address newAdmin) external {
        Group storage group = groups[groupId];
        require(msg.sender == group.admin, "Solo admin del grupo");
        require(isMember[groupId][newAdmin], "Nuevo admin debe ser miembro");
        address oldAdmin = group.admin;
        group.admin = newAdmin;
        emit AdminTransferred(groupId, oldAdmin, newAdmin);
    }

    function getGroupMembers(uint256 groupId) external view returns (address[] memory) {
        return groupMembers[groupId];
    }

    function isGroupMember(uint256 groupId, address user) external view returns (bool) {
        return isMember[groupId][user];
    }
} 