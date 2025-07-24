// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title DelegationManager
 * @dev Sistema avanzado de delegación para BrainSafes Governance
 * @notice Permite delegación flexible, multi-nivel, con historial, límites y revocación
 * @custom:security-contact security@brainsafes.com
 */
contract DelegationManager is AccessControl, Pausable, ReentrancyGuard {
    bytes32 public constant DELEGATION_ADMIN = keccak256("DELEGATION_ADMIN");
    bytes32 public constant DELEGATE_ROLE = keccak256("DELEGATE_ROLE");

    struct Delegation {
        address delegator;
        address delegatee;
        uint256 since;
        uint256 until;
        uint256 level;
        bool active;
    }

    // delegator => delegatee => Delegation
    mapping(address => mapping(address => Delegation)) public delegations;
    // delegator => historial
    mapping(address => Delegation[]) public delegationHistory;
    // delegatee => número de delegaciones activas
    mapping(address => uint256) public activeDelegations;
    // Límite de niveles de delegación
    uint256 public maxDelegationLevel = 3;
    // Límite de delegaciones por usuario
    uint256 public maxDelegationsPerUser = 5;

    event Delegated(address indexed delegator, address indexed delegatee, uint256 level, uint256 since, uint256 until);
    event Revoked(address indexed delegator, address indexed delegatee, uint256 level, uint256 revokedAt);
    event DelegationLevelChanged(uint256 newLevel);
    event DelegationLimitChanged(uint256 newLimit);

    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(DELEGATION_ADMIN, msg.sender);
    }

    function delegate(address delegatee, uint256 until, uint256 level) external whenNotPaused {
        require(delegatee != address(0), "Invalid delegatee");
        require(level > 0 && level <= maxDelegationLevel, "Invalid level");
        require(activeDelegations[msg.sender] < maxDelegationsPerUser, "Delegation limit reached");
        require(until > block.timestamp, "Invalid until");
        Delegation storage d = delegations[msg.sender][delegatee];
        require(!d.active, "Already delegated");
        d.delegator = msg.sender;
        d.delegatee = delegatee;
        d.since = block.timestamp;
        d.until = until;
        d.level = level;
        d.active = true;
        delegationHistory[msg.sender].push(d);
        activeDelegations[msg.sender]++;
        _grantRole(DELEGATE_ROLE, delegatee);
        emit Delegated(msg.sender, delegatee, level, block.timestamp, until);
    }

    function revoke(address delegatee) external whenNotPaused {
        Delegation storage d = delegations[msg.sender][delegatee];
        require(d.active, "No active delegation");
        d.active = false;
        activeDelegations[msg.sender]--;
        emit Revoked(msg.sender, delegatee, d.level, block.timestamp);
    }

    function getDelegation(address delegator, address delegatee) external view returns (Delegation memory) {
        return delegations[delegator][delegatee];
    }

    function getDelegationHistory(address delegator) external view returns (Delegation[] memory) {
        return delegationHistory[delegator];
    }

    function setMaxDelegationLevel(uint256 newLevel) external onlyRole(DELEGATION_ADMIN) {
        require(newLevel > 0, "Invalid level");
        maxDelegationLevel = newLevel;
        emit DelegationLevelChanged(newLevel);
    }

    function setMaxDelegationsPerUser(uint256 newLimit) external onlyRole(DELEGATION_ADMIN) {
        require(newLimit > 0, "Invalid limit");
        maxDelegationsPerUser = newLimit;
        emit DelegationLimitChanged(newLimit);
    }

    function pause() external onlyRole(DELEGATION_ADMIN) {
        _pause();
    }
    function unpause() external onlyRole(DELEGATION_ADMIN) {
        _unpause();
    }
} 