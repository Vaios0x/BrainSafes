// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@arbitrum/nitro-contracts/src/precompiles/ArbSys.sol";

/**
 * @title TimeBoostSystem
 * @notice Time-based incentive system for BrainSafes
 * @dev Rewards users for timely actions and engagement
 * @author BrainSafes Team
 */
contract TimeBoostSystem is AccessControl, ReentrancyGuard {
    bytes32 public constant TIMEBOOST_ADMIN_ROLE = keccak256("TIMEBOOST_ADMIN_ROLE");
    bytes32 public constant VALIDATOR_ROLE = keccak256("VALIDATOR_ROLE");

    ArbSys constant arbsys = ArbSys(address(0x64));

    struct BoostConfig {
        uint256 maxBoostFactor;
        uint256 minConfirmations;
        uint256 cooldownPeriod;
        uint256 maxTimeSkip;
        bool enabled;
    }

    struct UserBoost {
        uint256 lastBoostTime;
        uint256 boostCount;
        uint256 totalBoostTime;
        uint256 avgBoostFactor;
        bool isActive;
    }

    struct TransactionBoost {
        bytes32 txHash;
        address user;
        uint256 boostFactor;
        uint256 appliedAt;
        uint256 confirmations;
        bool successful;
    }

    // Estado del contrato
    BoostConfig public config;
    mapping(address => UserBoost) public userBoosts;
    mapping(bytes32 => TransactionBoost) public txBoosts;
    
    // Estadísticas
    uint256 public totalBoosts;
    uint256 public totalTimeSkipped;
    uint256 public avgBoostFactor;

    // Eventos
    event BoostConfigUpdated(BoostConfig config);
    event BoostApplied(bytes32 indexed txHash, address indexed user, uint256 boostFactor);
    event BoostResult(bytes32 indexed txHash, bool success, uint256 timeSkipped);
    event UserBoostUpdated(address indexed user, UserBoost boost);

    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(TIMEBOOST_ADMIN_ROLE, msg.sender);

        // Configuración inicial
        config = BoostConfig({
            maxBoostFactor: 300, // 3x máximo
            minConfirmations: 10,
            cooldownPeriod: 1 hours,
            maxTimeSkip: 30 minutes,
            enabled: true
        });
    }

    /**
     * @notice Request a boost for a transaction.
     * @dev This function allows users to request a boost for a transaction.
     * @param txHash The hash of the transaction.
     * @param confirmations The number of confirmations for the transaction.
     * @return boostFactor The calculated boost factor.
     */
    function requestBoost(
        bytes32 txHash,
        uint256 confirmations
    ) external nonReentrant returns (uint256) {
        require(config.enabled, "TimeBoost disabled");
        require(confirmations >= config.minConfirmations, "Insufficient confirmations");
        require(
            !txBoosts[txHash].successful,
            "Transaction already boosted"
        );

        UserBoost storage userBoost = userBoosts[msg.sender];
        require(
            userBoost.lastBoostTime + config.cooldownPeriod <= block.timestamp,
            "Cooldown period not met"
        );

        // Calcular factor de boost
        uint256 boostFactor = _calculateBoostFactor(confirmations);
        require(boostFactor <= config.maxBoostFactor, "Boost factor too high");

        // Registrar boost
        txBoosts[txHash] = TransactionBoost({
            txHash: txHash,
            user: msg.sender,
            boostFactor: boostFactor,
            appliedAt: block.timestamp,
            confirmations: confirmations,
            successful: false
        });

        // Actualizar estadísticas de usuario
        userBoost.lastBoostTime = block.timestamp;
        userBoost.boostCount++;
        userBoost.isActive = true;
        userBoost.avgBoostFactor = (userBoost.avgBoostFactor * (userBoost.boostCount - 1) + boostFactor) / userBoost.boostCount;

        // Actualizar estadísticas globales
        totalBoosts++;
        avgBoostFactor = (avgBoostFactor * (totalBoosts - 1) + boostFactor) / totalBoosts;

        emit BoostApplied(txHash, msg.sender, boostFactor);
        emit UserBoostUpdated(msg.sender, userBoost);

        return boostFactor;
    }

    /**
     * @notice Apply a boost to a transaction.
     * @dev This function allows validators to apply a boost to a transaction.
     * @param txHash The hash of the transaction.
     * @return timeToSkip The time to skip.
     */
    function applyBoost(
        bytes32 txHash
    ) external onlyRole(VALIDATOR_ROLE) returns (uint256) {
        TransactionBoost storage boost = txBoosts[txHash];
        require(!boost.successful, "Boost already applied");
        require(boost.appliedAt > 0, "Boost not requested");

        // Calcular tiempo a saltar
        uint256 timeToSkip = _calculateTimeSkip(boost.boostFactor);
        require(timeToSkip <= config.maxTimeSkip, "Time skip too large");

        // Aplicar boost
        boost.successful = true;
        totalTimeSkipped += timeToSkip;

        // Actualizar estadísticas de usuario
        UserBoost storage userBoost = userBoosts[boost.user];
        userBoost.totalBoostTime += timeToSkip;

        emit BoostResult(txHash, true, timeToSkip);
        return timeToSkip;
    }

    /**
     * @notice Calculate the boost factor based on confirmations.
     * @dev This function calculates the boost factor based on the number of confirmations.
     * @param confirmations The number of confirmations.
     * @return boostFactor The calculated boost factor.
     */
    function _calculateBoostFactor(uint256 confirmations) internal view returns (uint256) {
        if (confirmations < config.minConfirmations) return 100; // 1x

        uint256 extraConfirmations = confirmations - config.minConfirmations;
        uint256 boost = 100 + (extraConfirmations * 20); // +20% por confirmación extra

        return boost > config.maxBoostFactor ? config.maxBoostFactor : boost;
    }

    /**
     * @notice Calculate the time to skip based on the boost factor.
     * @dev This function calculates the time to skip based on the boost factor.
     * @param boostFactor The boost factor.
     * @return timeToSkip The time to skip.
     */
    function _calculateTimeSkip(uint256 boostFactor) internal pure returns (uint256) {
        // Convertir boost factor (100 = 1x) a segundos
        return (boostFactor - 100) * 1 minutes;
    }

    /**
     * @notice Update the TimeBoost configuration.
     * @dev This function allows administrators to update the TimeBoost configuration.
     * @param _maxBoostFactor The maximum boost factor.
     * @param _minConfirmations The minimum number of confirmations.
     * @param _cooldownPeriod The cooldown period.
     * @param _maxTimeSkip The maximum time to skip.
     * @param _enabled Whether the boost is enabled.
     */
    function updateConfig(
        uint256 _maxBoostFactor,
        uint256 _minConfirmations,
        uint256 _cooldownPeriod,
        uint256 _maxTimeSkip,
        bool _enabled
    ) external onlyRole(TIMEBOOST_ADMIN_ROLE) {
        require(_maxBoostFactor >= 100, "Invalid boost factor"); // Mínimo 1x
        require(_maxBoostFactor <= 1000, "Boost factor too high"); // Máximo 10x

        config = BoostConfig({
            maxBoostFactor: _maxBoostFactor,
            minConfirmations: _minConfirmations,
            cooldownPeriod: _cooldownPeriod,
            maxTimeSkip: _maxTimeSkip,
            enabled: _enabled
        });

        emit BoostConfigUpdated(config);
    }

    /**
     * @notice Check if a user is eligible for a boost.
     * @dev This function checks if a user is eligible for a boost based on their last boost time and confirmations.
     * @param user The address of the user.
     * @param confirmations The number of confirmations for the transaction.
     * @return eligible Whether the user is eligible.
     * @return potentialBoost The potential boost factor.
     * @return cooldownRemaining The remaining cooldown time.
     */
    function checkBoostEligibility(
        address user,
        uint256 confirmations
    ) external view returns (
        bool eligible,
        uint256 potentialBoost,
        uint256 cooldownRemaining
    ) {
        UserBoost storage userBoost = userBoosts[user];
        
        uint256 timeSinceLastBoost = block.timestamp - userBoost.lastBoostTime;
        bool cooldownMet = timeSinceLastBoost >= config.cooldownPeriod;
        
        eligible = config.enabled && 
                  cooldownMet && 
                  confirmations >= config.minConfirmations;
                  
        potentialBoost = _calculateBoostFactor(confirmations);
        
        cooldownRemaining = cooldownMet ? 0 : 
            config.cooldownPeriod - timeSinceLastBoost;
            
        return (eligible, potentialBoost, cooldownRemaining);
    }

    /**
     * @notice Get the boost statistics for a user.
     * @dev This function retrieves the boost statistics for a specific user.
     * @param user The address of the user.
     * @return boostCount The number of boosts applied.
     * @return totalTimeSkipped The total time skipped.
     * @return avgBoostFactor The average boost factor.
     * @return isActive Whether the user is currently active.
     */
    function getUserBoostStats(
        address user
    ) external view returns (
        uint256 boostCount,
        uint256 totalTimeSkipped,
        uint256 avgBoostFactor,
        bool isActive
    ) {
        UserBoost storage boost = userBoosts[user];
        return (
            boost.boostCount,
            boost.totalBoostTime,
            boost.avgBoostFactor,
            boost.isActive
        );
    }

    /**
     * @notice Get the global boost statistics.
     * @dev This function retrieves the global boost statistics.
     * @return _totalBoosts The total number of boosts.
     * @return _totalTimeSkipped The total time skipped.
     * @return _avgBoostFactor The average boost factor.
     */
    function getGlobalStats() external view returns (
        uint256 _totalBoosts,
        uint256 _totalTimeSkipped,
        uint256 _avgBoostFactor
    ) {
        return (totalBoosts, totalTimeSkipped, avgBoostFactor);
    }

    /**
     * @notice Get the boost information for a transaction.
     * @dev This function retrieves the boost information for a specific transaction.
     * @param txHash The hash of the transaction.
     * @return boost The boost information.
     */
    function getTransactionBoost(
        bytes32 txHash
    ) external view returns (TransactionBoost memory) {
        return txBoosts[txHash];
    }
} 