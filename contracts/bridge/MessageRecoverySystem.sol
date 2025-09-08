// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";


contract MessageRecoverySystem is AccessControl, Pausable, ReentrancyGuard {
    bytes32 public constant RECOVERY_ADMIN = keccak256("RECOVERY_ADMIN");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    struct RecoveryLog {
        bytes32 messageId;
        address operator;
        uint256 retryCount;
        uint256 lastAttempt;
        bool recovered;
        string reason;
    }

    mapping(bytes32 => RecoveryLog) public recoveryLogs;
    mapping(bytes32 => bool) public isRecovering;
    uint256 public recoveryCount;

    event MessageRecoveryInitiated(bytes32 indexed messageId, address operator, string reason);
    event MessageRecoverySuccess(bytes32 indexed messageId, address operator);
    event MessageRecoveryFailed(bytes32 indexed messageId, address operator, string reason);

    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(RECOVERY_ADMIN, msg.sender);
    }

    function initiateRecovery(bytes32 messageId, string memory reason) external onlyRole(OPERATOR_ROLE) whenNotPaused {
        require(!isRecovering[messageId], "Already recovering");
        isRecovering[messageId] = true;
        recoveryCount++;
        recoveryLogs[messageId] = RecoveryLog({
            messageId: messageId,
            operator: msg.sender,
            retryCount: 0,
            lastAttempt: block.timestamp,
            recovered: false,
            reason: reason
        });
        emit MessageRecoveryInitiated(messageId, msg.sender, reason);
    }

    function retryRecovery(bytes32 messageId) external onlyRole(OPERATOR_ROLE) whenNotPaused {
        require(isRecovering[messageId], "Not in recovery");
        RecoveryLog storage log = recoveryLogs[messageId];
        log.retryCount++;
        log.lastAttempt = block.timestamp;
        // Aquí se implementaría la lógica real de reenvío/reprocesamiento
        bool success = _attemptRecovery(messageId);
        if (success) {
            log.recovered = true;
            isRecovering[messageId] = false;
            emit MessageRecoverySuccess(messageId, msg.sender);
        } else {
            emit MessageRecoveryFailed(messageId, msg.sender, "Retry failed");
        }
    }

    function manualMarkRecovered(bytes32 messageId, string memory reason) external onlyRole(RECOVERY_ADMIN) {
        require(isRecovering[messageId], "Not in recovery");
        recoveryLogs[messageId].recovered = true;
        isRecovering[messageId] = false;
        recoveryLogs[messageId].reason = reason;
        emit MessageRecoverySuccess(messageId, msg.sender);
    }

    function _attemptRecovery(bytes32 messageId) internal pure returns (bool) {
        // Implementar lógica real de reenvío/reprocesamiento
        return true; // Placeholder
    }

    function getRecoveryLog(bytes32 messageId) external view returns (RecoveryLog memory) {
        return recoveryLogs[messageId];
    }

    function pause() external onlyRole(RECOVERY_ADMIN) {
        _pause();
    }

    function unpause() external onlyRole(RECOVERY_ADMIN) {
        _unpause();
    }
} 