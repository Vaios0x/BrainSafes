// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@arbitrum/nitro-contracts/src/precompiles/ArbGasInfo.sol";

/**
 * @title USDCPaymaster
 * @notice Paymaster contract for gas abstraction using USDC in BrainSafes
 * @dev Supports sponsored transactions and gas fee payments in USDC
 * @author BrainSafes Team
 */
contract USDCPaymaster is AccessControl, ReentrancyGuard, Pausable {
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    
    // Precompilados de Arbitrum
    ArbGasInfo constant arbGasInfo = ArbGasInfo(address(0x6c));
    
    // Contratos externos
    IERC20 public immutable usdc;
    
    // Configuración
    uint256 public constant PRICE_DENOMINATOR = 10000;
    uint256 public gasMarkup = 500; // 5% markup sobre el precio base
    uint256 public minUsdcBalance = 1000 * 10**6; // 1000 USDC
    uint256 public maxGasSponsored = 1000000; // 1M gas units
    
    // Estructuras
    struct UserGasInfo {
        uint256 totalGasSponsored;
        uint256 lastSponsoredTime;
        uint256 usdcSpent;
        bool isWhitelisted;
    }
    
    // Mappings
    mapping(address => UserGasInfo) public userGasInfo;
    mapping(bytes4 => bool) public sponsoredFunctions;
    mapping(address => bool) public sponsoredContracts;
    
    // Eventos
    event GasSponsored(
        address indexed user,
        uint256 gasUsed,
        uint256 usdcAmount,
        bytes32 indexed txHash
    );
    event GasMarkupUpdated(uint256 oldMarkup, uint256 newMarkup);
    event MinBalanceUpdated(uint256 oldBalance, uint256 newBalance);
    event MaxGasUpdated(uint256 oldMax, uint256 newMax);
    event ContractSponsored(address indexed contractAddress, bool sponsored);
    event FunctionSponsored(bytes4 indexed functionSig, bool sponsored);
    event UserWhitelisted(address indexed user, bool whitelisted);
    
    constructor(address _usdc) {
        require(_usdc != address(0), "Invalid USDC address");
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, msg.sender);
        
        usdc = IERC20(_usdc);
    }
    
    /**
     * @notice Sponsors gas for a transaction.
     * @dev This function is used to sponsor gas fees for a transaction.
     * @param user The address of the user sponsoring the gas.
     * @param txData The calldata of the transaction.
     * @return bool True if the gas sponsorship was successful.
     */
    function sponsorGas(
        address user,
        bytes calldata txData
    ) external nonReentrant whenNotPaused returns (bool) {
        require(userGasInfo[user].isWhitelisted, "User not whitelisted");
        
        // Verificar función llamada
        bytes4 functionSig = bytes4(txData[:4]);
        require(sponsoredFunctions[functionSig], "Function not sponsored");
        
        // Verificar contrato llamado
        address targetContract;
        assembly {
            targetContract := calldataload(36) // 4 (selector) + 32 (user address)
        }
        require(sponsoredContracts[targetContract], "Contract not sponsored");
        
        // Calcular costo de gas
        uint256 gasPrice = arbGasInfo.getL1BaseFeeEstimate();
        uint256 gasLimit = _estimateGas(txData);
        require(gasLimit <= maxGasSponsored, "Gas limit too high");
        
        // Calcular costo en USDC
        uint256 gasCost = gasPrice * gasLimit;
        uint256 usdcAmount = _convertEthToUsdc(gasCost);
        uint256 totalCost = usdcAmount + (usdcAmount * gasMarkup) / PRICE_DENOMINATOR;
        
        // Verificar balance USDC
        require(usdc.balanceOf(user) >= minUsdcBalance, "Insufficient USDC balance");
        
        // Transferir USDC
        require(
            usdc.transferFrom(user, address(this), totalCost),
            "USDC transfer failed"
        );
        
        // Actualizar estadísticas
        userGasInfo[user].totalGasSponsored += gasLimit;
        userGasInfo[user].lastSponsoredTime = block.timestamp;
        userGasInfo[user].usdcSpent += totalCost;
        
        emit GasSponsored(user, gasLimit, totalCost, blockhash(block.number - 1));
        
        return true;
    }
    
    /**
     * @notice Estimates the gas needed for a transaction.
     * @dev This function is used to estimate the gas required for a transaction.
     * @param txData The calldata of the transaction.
     * @return uint256 The estimated gas limit.
     */
    function _estimateGas(bytes calldata txData) internal view returns (uint256) {
        // Usar precompilado de Arbitrum para estimación precisa
        (uint256 gasEstimate,,,) = arbGasInfo.getPricesInWei();
        return gasEstimate;
    }
    
    /**
     * @notice Converts ETH to USDC using an oracle price.
     * @dev This function is used to convert an amount of ETH to USDC.
     * @param ethAmount The amount of ETH to convert.
     * @return uint256 The converted amount in USDC.
     */
    function _convertEthToUsdc(uint256 ethAmount) internal pure returns (uint256) {
        // TODO: Usar oracle para precio real
        return ethAmount * 1800; // 1 ETH = 1800 USDC (ejemplo)
    }
    
    /**
     * @notice Whitelists a user.
     * @dev This function is used to whitelist a user.
     * @param user The address of the user to whitelist.
     * @param whitelisted The boolean indicating if the user should be whitelisted.
     */
    function whitelistUser(
        address user,
        bool whitelisted
    ) external onlyRole(OPERATOR_ROLE) {
        userGasInfo[user].isWhitelisted = whitelisted;
        emit UserWhitelisted(user, whitelisted);
    }
    
    /**
     * @notice Whitelists multiple users.
     * @dev This function is used to whitelist multiple users.
     * @param users An array of addresses to whitelist.
     * @param whitelisted The boolean indicating if all users should be whitelisted.
     */
    function whitelistUsers(
        address[] calldata users,
        bool whitelisted
    ) external onlyRole(OPERATOR_ROLE) {
        for (uint256 i = 0; i < users.length; i++) {
            userGasInfo[users[i]].isWhitelisted = whitelisted;
            emit UserWhitelisted(users[i], whitelisted);
        }
    }
    
    /**
     * @notice Sponsors a contract.
     * @dev This function is used to sponsor a contract.
     * @param contractAddress The address of the contract to sponsor.
     * @param sponsored The boolean indicating if the contract should be sponsored.
     */
    function sponsorContract(
        address contractAddress,
        bool sponsored
    ) external onlyRole(OPERATOR_ROLE) {
        sponsoredContracts[contractAddress] = sponsored;
        emit ContractSponsored(contractAddress, sponsored);
    }
    
    /**
     * @notice Sponsors a function.
     * @dev This function is used to sponsor a function.
     * @param functionSig The function signature to sponsor.
     * @param sponsored The boolean indicating if the function should be sponsored.
     */
    function sponsorFunction(
        bytes4 functionSig,
        bool sponsored
    ) external onlyRole(OPERATOR_ROLE) {
        sponsoredFunctions[functionSig] = sponsored;
        emit FunctionSponsored(functionSig, sponsored);
    }
    
    /**
     * @notice Updates the gas markup.
     * @dev This function is used to update the gas markup.
     * @param newMarkup The new markup value.
     */
    function updateGasMarkup(uint256 newMarkup) external onlyRole(ADMIN_ROLE) {
        require(newMarkup <= 2000, "Markup too high"); // Max 20%
        uint256 oldMarkup = gasMarkup;
        gasMarkup = newMarkup;
        emit GasMarkupUpdated(oldMarkup, newMarkup);
    }
    
    /**
     * @notice Updates the minimum USDC balance.
     * @dev This function is used to update the minimum USDC balance.
     * @param newBalance The new minimum balance.
     */
    function updateMinBalance(uint256 newBalance) external onlyRole(ADMIN_ROLE) {
        uint256 oldBalance = minUsdcBalance;
        minUsdcBalance = newBalance;
        emit MinBalanceUpdated(oldBalance, newBalance);
    }
    
    /**
     * @notice Updates the maximum gas sponsored.
     * @dev This function is used to update the maximum gas sponsored.
     * @param newMax The new maximum gas value.
     */
    function updateMaxGas(uint256 newMax) external onlyRole(ADMIN_ROLE) {
        uint256 oldMax = maxGasSponsored;
        maxGasSponsored = newMax;
        emit MaxGasUpdated(oldMax, newMax);
    }
    
    /**
     * @notice Withdraws accumulated USDC.
     * @dev This function is used to withdraw accumulated USDC.
     * @param to The address to which the USDC will be transferred.
     * @param amount The amount of USDC to withdraw.
     */
    function withdrawUsdc(
        address to,
        uint256 amount
    ) external onlyRole(ADMIN_ROLE) {
        require(usdc.transfer(to, amount), "USDC transfer failed");
    }
    
    /**
     * @notice Gets user gas information.
     * @dev This function is used to retrieve gas information for a user.
     * @param user The address of the user.
     * @return UserGasInfo The gas information for the user.
     */
    function getUserGasInfo(
        address user
    ) external view returns (UserGasInfo memory) {
        return userGasInfo[user];
    }
    
    /**
     * @notice Checks if a transaction is sponsoreable.
     * @dev This function is used to check if a transaction is sponsoreable.
     * @param user The address of the user.
     * @param txData The calldata of the transaction.
     * @return sponsoreable bool True if the transaction is sponsoreable, false otherwise.
     * @return reason string The reason for the transaction not being sponsoreable.
     */
    function isTransactionSponsoreable(
        address user,
        bytes calldata txData
    ) external view returns (
        bool sponsoreable,
        string memory reason
    ) {
        // Verificar whitelist
        if (!userGasInfo[user].isWhitelisted) {
            return (false, "User not whitelisted");
        }
        
        // Verificar función
        bytes4 functionSig = bytes4(txData[:4]);
        if (!sponsoredFunctions[functionSig]) {
            return (false, "Function not sponsored");
        }
        
        // Verificar contrato
        address targetContract;
        assembly {
            targetContract := calldataload(36)
        }
        if (!sponsoredContracts[targetContract]) {
            return (false, "Contract not sponsored");
        }
        
        // Verificar gas
        uint256 gasLimit = _estimateGas(txData);
        if (gasLimit > maxGasSponsored) {
            return (false, "Gas limit too high");
        }
        
        // Verificar balance USDC
        if (usdc.balanceOf(user) < minUsdcBalance) {
            return (false, "Insufficient USDC balance");
        }
        
        return (true, "Transaction sponsoreable");
    }
    
    /**
     * @notice Pauses the contract.
     * @dev This function is used to pause the contract.
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }
    
    /**
     * @notice Unpauses the contract.
     * @dev This function is used to unpause the contract.
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
} 