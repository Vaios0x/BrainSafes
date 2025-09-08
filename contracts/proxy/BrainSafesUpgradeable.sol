// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";


abstract contract BrainSafesUpgradeable is 
    Initializable, 
    AccessControlUpgradeable,
    ReentrancyGuardUpgradeable,
    PausableUpgradeable 
{
    // Storage gap to prevent storage collisions in upgrades
    uint256[50] private __gap;

    
    function __BrainSafes_init(address admin) internal onlyInitializing {
        __AccessControl_init();
        __ReentrancyGuard_init();
        __Pausable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    
    modifier whenNotPausedUpgradeable() {
        require(!paused(), "Contract is paused");
        _;
    }

    
    function _checkInitialized() internal view {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Contract not initialized");
    }
} 