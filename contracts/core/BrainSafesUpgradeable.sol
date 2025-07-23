// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../proxy/BrainSafesUpgradeable.sol";
import "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title BrainSafes Core Implementation
 * @dev Main upgradeable implementation of the BrainSafes system
 */
contract BrainSafesCore is BrainSafesUpgradeable, UUPSUpgradeable {
    // Keep original state variables
    using Counters for Counters.Counter;
    
    // External contract interfaces remain the same
    IEDUToken public eduToken;
    ICourseNFT public courseNFT;
    ICertificateNFT public certificateNFT;
    IScholarshipManager public scholarshipManager;
    IAIOracle public aiOracle;

    // Add storage gap for future upgrades
    uint256[50] private __gap;

    /**
     * @dev Initialize function to replace constructor
     */
    function initialize(
        address admin,
        address _eduToken,
        address _courseNFT,
        address _certificateNFT,
        address _scholarshipManager,
        address _aiOracle
    ) public initializer {
        __BrainSafes_init(admin);
        __UUPSUpgradeable_init();

        eduToken = IEDUToken(_eduToken);
        courseNFT = ICourseNFT(_courseNFT);
        certificateNFT = ICertificateNFT(_certificateNFT);
        scholarshipManager = IScholarshipManager(_scholarshipManager);
        aiOracle = IAIOracle(_aiOracle);
    }

    /**
     * @dev Function that should revert when msg.sender is not authorized to upgrade the contract
     */
    function _authorizeUpgrade(address) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}

    // Original functions remain but add whenNotPausedUpgradeable modifier where needed
    function registerUser(
        string memory _name,
        string memory _email,
        string memory _ipfsProfile
    ) external whenNotPausedUpgradeable {
        require(!userProfiles[msg.sender].isActive, "User already registered");
        require(bytes(_name).length > 0, "Name required");
        require(bytes(_email).length > 0, "Email required");

        userProfiles[msg.sender] = UserProfile({
            name: _name,
            email: _email,
            ipfsProfile: _ipfsProfile,
            reputation: 100,
            totalEarned: 0,
            totalSpent: 0,
            joinTimestamp: block.timestamp,
            isActive: true,
            achievements: new uint256[](0)
        });

        eduToken.mint(msg.sender, 50 * 10**18);

        emit UserRegistered(msg.sender, _name, block.timestamp);
    }

    // Add remaining functions with appropriate modifiers...
} 