// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../proxy/BrainSafesUpgradeable.sol";
import "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "../interfaces/IEDUToken.sol";
import "../interfaces/ICourseNFT.sol";
import "../interfaces/ICertificateNFT.sol";
import "../interfaces/IScholarshipManager.sol";
import "../interfaces/IAIOracle.sol";


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

    
    function initialize(
        address admin,
        address _eduToken,
        address _courseNFT,
        address _certificateNFT,
        address _scholarshipManager,
        address _aiOracle
    ) public initializer {
        __BrainSafes_init(admin);
        // Note: __UUPSUpgradeable_init() is not needed in newer versions

        eduToken = IEDUToken(_eduToken);
        courseNFT = ICourseNFT(_courseNFT);
        certificateNFT = ICertificateNFT(_certificateNFT);
        scholarshipManager = IScholarshipManager(_scholarshipManager);
        aiOracle = IAIOracle(_aiOracle);
    }

    
    function _authorizeUpgrade(address) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}

    // Note: This is a simplified implementation
    // Full implementation would include all functions from BrainSafes.sol
    // with appropriate upgradeable modifiers
} 