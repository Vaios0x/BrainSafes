// contracts/proxy/EnhancedUUPSProxy.sol

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";
import "@arbitrum/nitro-contracts/src/precompiles/ArbGasInfo.sol";

contract EnhancedUUPSProxy is UUPSUpgradeable {
    ArbGasInfo constant arbGasInfo = ArbGasInfo(address(0x6c));
    
    uint256 public constant UPGRADE_TIMELOCK = 2 days;
    mapping(address => uint256) public upgradeTimestamps;
    mapping(address => bool) public upgradeApprovals;
    
    event UpgradeScheduled(address indexed implementation, uint256 scheduledTime);
    event UpgradeApproved(address indexed implementation, address indexed approver);
    
    function scheduleUpgrade(address newImplementation) external onlyRole(UPGRADER_ROLE) {
        require(newImplementation != address(0), "Invalid implementation");
        upgradeTimestamps[newImplementation] = block.timestamp + UPGRADE_TIMELOCK;
        emit UpgradeScheduled(newImplementation, upgradeTimestamps[newImplementation]);
    }
    
    function _authorizeUpgrade(address newImplementation) internal override {
        require(upgradeTimestamps[newImplementation] > 0, "Upgrade not scheduled");
        require(block.timestamp >= upgradeTimestamps[newImplementation], "Timelock not expired");
        require(upgradeApprovals[newImplementation], "Upgrade not approved");
    }
} 