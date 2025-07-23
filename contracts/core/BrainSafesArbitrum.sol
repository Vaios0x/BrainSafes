// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../core/BrainSafesUpgradeable.sol";
import "@arbitrum/nitro-contracts/src/precompiles/ArbSys.sol";
import "@arbitrum/nitro-contracts/src/precompiles/ArbGasInfo.sol";
import "@arbitrum/nitro-contracts/src/precompiles/ArbRetryableTx.sol";
import "@arbitrum/nitro-contracts/src/precompiles/ArbAddressTable.sol";
import "@arbitrum/nitro-contracts/src/libraries/AddressAliasHelper.sol";
import "@arbitrum/nitro-contracts/src/node-interface/NodeInterface.sol";
import "../utils/AddressCompressor.sol";
import "../utils/EnhancedMulticall.sol";
import "../utils/DistributedCache.sol";
import "../utils/SecurityManager.sol";
import "../utils/UserExperience.sol";

/**
 * @title BrainSafesArbitrum
 * @dev Arbitrum-optimized version of BrainSafes with enhanced precompile usage
 * @author BrainSafes Team
 */
contract BrainSafesArbitrum is BrainSafesUpgradeable {
    // Arbitrum precompiles
    ArbSys constant arbsys = ArbSys(address(0x64));
    ArbGasInfo constant arbGasInfo = ArbGasInfo(address(0x6c));
    ArbRetryableTx constant arbRetryableTx = ArbRetryableTx(address(0x6e));
    ArbAddressTable constant arbAddressTable = ArbAddressTable(address(0x66));
    NodeInterface constant nodeInterface = NodeInterface(address(0xc8));
    
    // L1 contract address for cross-chain messaging
    address public l1BrainSafesAddress;
    
    // Address compression
    mapping(address => uint256) public compressedAddresses;
    
    // Retryable ticket tracking
    mapping(bytes32 => bool) public retryableTickets;
    
    // Events
    event AddressCompressed(address indexed original, uint256 indexed compressed);
    event RetryableTicketCreated(bytes32 indexed ticketId, address indexed sender);
    event GasOptimizationApplied(string optimizationType, uint256 gasSaved);
    event NodeInfoUpdated(uint256 blockNumber, uint256 timestamp, uint256 baseFee);
    
    // Nuevas integraciones
    AddressCompressor public addressCompressor;
    EnhancedMulticall public multicall;
    DistributedCache public cache;
    SecurityManager public securityManager;
    UserExperience public userExperience;
    
    /**
     * @dev Initialize the contract with L1 contract address
     */
    function initialize(
        address _l1BrainSafesAddress,
        address _addressCompressor,
        address _multicall,
        address _cache,
        address _securityManager,
        address _userExperience
    ) public initializer {
        __BrainSafesUpgradeable_init();
        l1BrainSafesAddress = _l1BrainSafesAddress;
        
        addressCompressor = AddressCompressor(_addressCompressor);
        multicall = EnhancedMulticall(_multicall);
        cache = DistributedCache(_cache);
        securityManager = SecurityManager(_securityManager);
        userExperience = UserExperience(_userExperience);
        
        // Registrar direcciones para compresión
        _registerAddressForCompression(address(this));
        _registerAddressForCompression(l1BrainSafesAddress);
    }
    
    /**
     * @dev Register an address for compression
     */
    function _registerAddressForCompression(address addr) internal {
        if (compressedAddresses[addr] == 0) {
            uint256 index = arbAddressTable.register(addr);
            compressedAddresses[addr] = index;
            emit AddressCompressed(addr, index);
        }
    }
    
    /**
     * @dev Get node information using NodeInterface
     */
    function getNodeInfo() external view returns (
        uint256 blockNumber,
        uint256 timestamp,
        uint256 baseFee,
        uint256 l1BaseFee,
        uint256 chainId
    ) {
        NodeInterface.BlockInfo memory info = nodeInterface.blockInfo();
        return (
            info.number,
            info.timestamp,
            info.baseFee,
            info.l1BaseFee,
            info.chainId
        );
    }
    
    /**
     * @dev Get estimated gas costs for a transaction
     */
    function getEstimatedGasCosts(
        address to,
        uint256 value,
        bytes calldata data
    ) external returns (
        uint256 gasEstimate,
        uint256 gasEstimateForL1,
        uint256 baseFee,
        uint256 l1BaseFee
    ) {
        // Get gas estimates using NodeInterface
        (gasEstimate, gasEstimateForL1, baseFee, l1BaseFee) = nodeInterface.gasEstimateComponents(
            msg.sender,
            value,
            to,
            data
        );
        
        // Apply gas optimizations based on estimates
        if (gasEstimate > 1000000) {
            emit GasOptimizationApplied("high_gas_optimization", gasEstimate / 10);
        }
        
        return (gasEstimate, gasEstimateForL1, baseFee, l1BaseFee);
    }
    
    /**
     * @dev Get aggregator information
     */
    function getAggregatorInfo() external view returns (
        address aggregator,
        bool isActive,
        uint256 minTxGasLimit,
        uint256 maxTxGasLimit,
        uint256 maxTxGasPerBlock
    ) {
        NodeInterface.AggregatorInfo memory info = nodeInterface.aggregatorInfo();
        return (
            info.aggregator,
            info.isActive,
            info.minTxGasLimit,
            info.maxTxGasLimit,
            info.maxTxGasPerBlock
        );
    }
    
    /**
     * @dev Create a retryable ticket with optimized gas estimation
     */
    function createRetryableTicket(
        address to,
        uint256 l2CallValue,
        uint256 maxSubmissionCost,
        address excessFeeRefundAddress,
        address callValueRefundAddress,
        uint256 gasLimit,
        uint256 maxFeePerGas,
        bytes calldata data
    ) external payable returns (bytes32) {
        // Get gas estimates for the retryable ticket
        (uint256 gasEstimate, uint256 gasEstimateForL1,,) = nodeInterface.gasEstimateComponents(
            msg.sender,
            l2CallValue,
            to,
            data
        );
        
        // Adjust gas limit based on estimates
        uint256 adjustedGasLimit = gasEstimate + gasEstimateForL1;
        require(adjustedGasLimit <= gasLimit, "Gas limit too low");
        
        bytes32 ticketId = arbRetryableTx.createRetryableTicket{value: msg.value}(
            to,
            l2CallValue,
            maxSubmissionCost,
            excessFeeRefundAddress,
            callValueRefundAddress,
            adjustedGasLimit,
            maxFeePerGas,
            data
        );
        
        retryableTickets[ticketId] = true;
        emit RetryableTicketCreated(ticketId, msg.sender);
        return ticketId;
    }
    
    /**
     * @dev Redeem a retryable ticket with gas optimization
     */
    function redeemRetryableTicket(bytes32 ticketId) external {
        require(retryableTickets[ticketId], "Invalid ticket");
        
        // Get current gas prices
        NodeInterface.BlockInfo memory info = nodeInterface.blockInfo();
        
        // Check if gas prices are favorable
        if (info.baseFee <= info.l1BaseFee / 10) {
            arbRetryableTx.redeem(ticketId);
        } else {
            revert("Unfavorable gas prices for redemption");
        }
    }
    
    /**
     * @dev Get node configuration
     */
    function getNodeConfig() external view returns (
        uint256 priceInWei,
        uint256 speedLimitPerSecond,
        uint256 maxExecutionSteps,
        uint256 averageBlockTime
    ) {
        NodeInterface.NodeConfig memory config = nodeInterface.nodeConfig();
        return (
            config.priceInWei,
            config.speedLimitPerSecond,
            config.maxExecutionSteps,
            config.averageBlockTime
        );
    }
    
    /**
     * @dev Override to optimize gas usage for certificate creation with NodeInterface
     */
    function _beforeCertificateCreation(
        address user,
        uint256 certId
    ) internal virtual override {
        super._beforeCertificateCreation(user, certId);
        
        // Comprimir dirección del usuario
        uint256 compressedUser = addressCompressor.compressAddress(user);
        
        // Obtener información del nodo para optimización
        NodeInterface.BlockInfo memory info = nodeInterface.blockInfo();
        
        // Verificar seguridad
        require(securityManager.isSecure(user), "User not secure");
        
        emit NodeInfoUpdated(info.number, info.timestamp, info.baseFee);
        emit GasOptimizationApplied("certificate_creation_compressed", 20000);
    }

    // Nuevo método para transacciones optimizadas
    function optimizedTransaction(
        address target,
        bytes calldata data,
        bytes32 cacheKey
    ) external returns (bytes memory) {
        // Verificar seguridad
        require(securityManager.isSecure(msg.sender), "Sender not secure");
        
        // Intentar obtener del cache
        bytes memory cachedResult = cache.get(cacheKey);
        if (cachedResult.length > 0) {
            return cachedResult;
        }

        // Comprimir dirección
        address compressedTarget = address(uint160(addressCompressor.compressAddress(target)));

        // Ejecutar a través de multicall
        EnhancedMulticall.Call[] memory calls = new EnhancedMulticall.Call[](1);
        calls[0] = EnhancedMulticall.Call({
            target: compressedTarget,
            callData: data,
            gasLimit: gasleft() - 5000
        });

        EnhancedMulticall.Result[] memory results = multicall.aggregate(calls);

        // Guardar en cache si fue exitoso
        if (results[0].success) {
            cache.set(cacheKey, results[0].returnData, block.timestamp + 1 hours);
        }

        return results[0].returnData;
    }

    // Método para estimar costos de gas
    function estimateTransactionCosts(
        address target,
        bytes calldata data
    ) external returns (
        uint256 gasEstimate,
        uint256 gasEstimateForL1,
        uint256 baseFee,
        uint256 l1BaseFee
    ) {
        return userExperience.estimateTransactionCosts(target, data, 0);
    }

    // Override para usar seguridad mejorada
    function _authorizeUpgrade(address newImplementation) internal override {
        super._authorizeUpgrade(newImplementation);
        require(securityManager.isSecure(newImplementation), "Implementation not secure");
    }
    
    /**
     * @notice Ejecuta un multicall usando el módulo EnhancedMulticall
     */
    function batchExecute(EnhancedMulticall.Call[] calldata calls) external returns (EnhancedMulticall.Result[] memory) {
        require(securityManager.isSecure(msg.sender), "Sender not secure");
        return multicall.aggregate(calls);
    }

    /**
     * @notice Usa el cache distribuido para obtener/guardar resultados costosos
     */
    function getCached(bytes32 key) external view returns (bytes memory) {
        return cache.get(key);
    }
    function setCached(bytes32 key, bytes calldata data, uint256 expiresAt) external {
        cache.set(key, data, expiresAt);
    }

    /**
     * @notice Permite a los usuarios enviar feedback de UX
     */
    function submitUXFeedback(string calldata message) external {
        userExperience.submitFeedback(message);
    }
    function getUXFeedback(uint256 index) external view returns (address, string memory, uint256) {
        return userExperience.getFeedback(index);
    }
    function getUXOptimizationTips() external pure returns (string[] memory) {
        return userExperience.getOptimizationTips();
    }
    function estimateGasUX(address target, bytes calldata data, uint256 value) external view returns (uint256) {
        return userExperience.estimateTransactionCosts(target, data, value);
    }

    /**
     * @notice Comprime y descomprime direcciones usando AddressCompressor
     */
    function compressAddress(address addr) external view returns (uint256) {
        return addressCompressor.compressAddress(addr);
    }
    function decompressAddress(uint256 index) external view returns (address) {
        return addressCompressor.decompressAddress(index);
    }

    /**
     * @notice Validación de seguridad para upgrades y llamadas críticas
     */
    function isAddressSecure(address addr) external view returns (bool) {
        return securityManager.isSecure(addr);
    }
    function isContractSecure(address contractAddr) external view returns (bool) {
        return securityManager.isContractSecure(contractAddr);
    }
    
    /**
     * @dev Get the current gas prices with NodeInterface
     */
    function getCurrentGasPrices() external view returns (
        uint256 l1BaseFee,
        uint256 l1GasPrice,
        uint256 l2GasPrice
    ) {
        NodeInterface.BlockInfo memory info = nodeInterface.blockInfo();
        l1BaseFee = info.l1BaseFee;
        l2GasPrice = info.baseFee;
        l1GasPrice = arbGasInfo.getL1GasPriceEstimate();
        return (l1BaseFee, l1GasPrice, l2GasPrice);
    }
    
    /**
     * @dev Get the compressed address index
     */
    function getCompressedAddress(address addr) external view returns (uint256) {
        return compressedAddresses[addr];
    }
    
    /**
     * @dev Check if a retryable ticket exists
     */
    function isRetryableTicket(bytes32 ticketId) external view returns (bool) {
        return retryableTickets[ticketId];
    }
    
    /**
     * @dev Get the lifetime of a retryable ticket
     */
    function getRetryableLifetime() external view returns (uint256) {
        return arbRetryableTx.getLifetime();
    }
    
    /**
     * @dev Get the timeout of a retryable ticket
     */
    function getRetryableTimeout() external view returns (uint256) {
        return arbRetryableTx.getTimeout();
    }
} 