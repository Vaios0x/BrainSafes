// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";

/**
 * @title BrainSafesUpgradeable
 * @notice Upgradeable base contract for BrainSafes using UUPS
 * @dev Provides storage gap, initialization, and upgrade hooks
 * @author BrainSafes Team
 */
abstract contract BrainSafesUpgradeable is 
    Initializable, 
    AccessControlUpgradeable,
    ReentrancyGuardUpgradeable,
    PausableUpgradeable 
{
    // Storage gap to prevent storage collisions in upgrades
    uint256[50] private __gap;

    /**
     * @dev Initialize function to replace constructor
     * @param admin Address that will have admin role
     */
    function __BrainSafes_init(address admin) internal onlyInitializing {
        __AccessControl_init();
        __ReentrancyGuard_init();
        __Pausable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    /**
     * @dev Modifier to make a function callable only when not paused
     */
    modifier whenNotPausedUpgradeable() {
        require(!paused(), "Contract is paused");
        _;
    }

    /**
     * @dev Function to verify contract is properly initialized
     */
    function _checkInitialized() internal view {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Contract not initialized");
    }
} 