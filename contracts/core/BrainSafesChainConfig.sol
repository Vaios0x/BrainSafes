// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@arbitrum/nitro-contracts/src/precompiles/ArbGasInfo.sol";
import "@arbitrum/nitro-contracts/src/precompiles/ArbSys.sol";

/**
 * @title BrainSafesChainConfig
 * @dev Configuración personalizada de la cadena Arbitrum para BrainSafes
 */
contract BrainSafesChainConfig is AccessControl {
    bytes32 public constant CHAIN_ADMIN_ROLE = keccak256("CHAIN_ADMIN_ROLE");
    
    struct ChainConfig {
        bool isAnyTrust;              // True para AnyTrust, False para Rollup
        uint256 challengePeriod;      // Período de desafío en segundos
        address customGasToken;       // Token personalizado para gas (solo AnyTrust)
        bool enableBlobs;            // Habilitar soporte para blobs post-4844
        uint256 stateGrowthLimit;    // Límite de crecimiento del estado
        uint256 maxBatchSize;        // Tamaño máximo de batch
        uint256 maxTxGasLimit;       // Límite de gas por transacción
        string chainName;            // Nombre de la cadena
        string chainId;              // ID de la cadena
    }

    // Estado actual de la configuración
    ChainConfig public currentConfig;
    
    // Parámetros de rendimiento
    uint256 public constant MIN_CHALLENGE_PERIOD = 1 hours;
    uint256 public constant MAX_CHALLENGE_PERIOD = 7 days;
    uint256 public constant DEFAULT_STATE_GROWTH_LIMIT = 1e9; // 1GB

    // Eventos
    event ChainConfigUpdated(ChainConfig newConfig);
    event GasTokenChanged(address indexed oldToken, address indexed newToken);
    event ChallengePeriodUpdated(uint256 oldPeriod, uint256 newPeriod);
    event BlobSupportToggled(bool enabled);

    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(CHAIN_ADMIN_ROLE, msg.sender);

        // Configuración por defecto
        currentConfig = ChainConfig({
            isAnyTrust: true,
            challengePeriod: 1 days,
            customGasToken: address(0),
            enableBlobs: false,
            stateGrowthLimit: DEFAULT_STATE_GROWTH_LIMIT,
            maxBatchSize: 100,
            maxTxGasLimit: 10000000,
            chainName: "BrainSafes Chain",
            chainId: "42161" // Ejemplo de Chain ID
        });
    }

    /**
     * @dev Actualizar la configuración completa de la cadena
     */
    function updateChainConfig(ChainConfig memory newConfig) external onlyRole(CHAIN_ADMIN_ROLE) {
        require(
            newConfig.challengePeriod >= MIN_CHALLENGE_PERIOD &&
            newConfig.challengePeriod <= MAX_CHALLENGE_PERIOD,
            "Invalid challenge period"
        );

        if (newConfig.isAnyTrust) {
            require(newConfig.customGasToken != address(0), "Gas token required for AnyTrust");
        }

        emit ChainConfigUpdated(newConfig);
        currentConfig = newConfig;
    }

    /**
     * @dev Actualizar el token de gas (solo AnyTrust)
     */
    function updateGasToken(address newToken) external onlyRole(CHAIN_ADMIN_ROLE) {
        require(currentConfig.isAnyTrust, "Gas token only available in AnyTrust mode");
        require(newToken != address(0), "Invalid token address");

        address oldToken = currentConfig.customGasToken;
        currentConfig.customGasToken = newToken;
        
        emit GasTokenChanged(oldToken, newToken);
    }

    /**
     * @dev Actualizar período de desafío
     */
    function updateChallengePeriod(uint256 newPeriod) external onlyRole(CHAIN_ADMIN_ROLE) {
        require(
            newPeriod >= MIN_CHALLENGE_PERIOD && 
            newPeriod <= MAX_CHALLENGE_PERIOD,
            "Invalid challenge period"
        );

        uint256 oldPeriod = currentConfig.challengePeriod;
        currentConfig.challengePeriod = newPeriod;
        
        emit ChallengePeriodUpdated(oldPeriod, newPeriod);
    }

    /**
     * @dev Habilitar/deshabilitar soporte para blobs
     */
    function toggleBlobSupport(bool enable) external onlyRole(CHAIN_ADMIN_ROLE) {
        currentConfig.enableBlobs = enable;
        emit BlobSupportToggled(enable);
    }

    /**
     * @dev Actualizar límite de crecimiento del estado
     */
    function updateStateGrowthLimit(uint256 newLimit) external onlyRole(CHAIN_ADMIN_ROLE) {
        require(newLimit > 0, "Invalid state growth limit");
        currentConfig.stateGrowthLimit = newLimit;
    }

    /**
     * @dev Actualizar límites de transacción
     */
    function updateTransactionLimits(
        uint256 newMaxBatchSize,
        uint256 newMaxTxGasLimit
    ) external onlyRole(CHAIN_ADMIN_ROLE) {
        require(newMaxBatchSize > 0, "Invalid batch size");
        require(newMaxTxGasLimit > 0, "Invalid gas limit");

        currentConfig.maxBatchSize = newMaxBatchSize;
        currentConfig.maxTxGasLimit = newMaxTxGasLimit;
    }

    /**
     * @dev Obtener configuración actual
     */
    function getChainConfig() external view returns (ChainConfig memory) {
        return currentConfig;
    }

    /**
     * @dev Verificar si la configuración es válida
     */
    function validateConfig(ChainConfig memory config) public pure returns (bool, string memory) {
        if (config.challengePeriod < MIN_CHALLENGE_PERIOD) {
            return (false, "Challenge period too short");
        }
        if (config.challengePeriod > MAX_CHALLENGE_PERIOD) {
            return (false, "Challenge period too long");
        }
        if (config.isAnyTrust && config.customGasToken == address(0)) {
            return (false, "Gas token required for AnyTrust");
        }
        if (config.stateGrowthLimit == 0) {
            return (false, "Invalid state growth limit");
        }
        return (true, "");
    }

    /**
     * @dev Obtener estadísticas de la cadena
     */
    function getChainStats() external view returns (
        uint256 currentStateSize,
        uint256 avgBlockTime,
        uint256 totalTransactions
    ) {
        // Implementar obtención de estadísticas
        return (0, 0, 0);
    }
} 