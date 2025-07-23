// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title SecurityManager
 * @notice Role and security management utility for BrainSafes
 * @dev Handles access control, contract security, and critical validations
 * @author BrainSafes Team
 */
contract SecurityManager {
    mapping(address => bool) public whitelist;
    mapping(address => bool) public blacklist;
    mapping(address => bool) public secureContracts;

    event Whitelisted(address indexed account);
    event Blacklisted(address indexed account);
    event RemovedFromWhitelist(address indexed account);
    event RemovedFromBlacklist(address indexed account);
    event SecureContractAdded(address indexed contractAddr);
    event SecureContractRemoved(address indexed contractAddr);

    /// @notice Agrega una dirección a la whitelist
    function addToWhitelist(address account) external {
        whitelist[account] = true;
        emit Whitelisted(account);
    }

    /// @notice Quita una dirección de la whitelist
    function removeFromWhitelist(address account) external {
        whitelist[account] = false;
        emit RemovedFromWhitelist(account);
    }

    /// @notice Agrega una dirección a la blacklist
    function addToBlacklist(address account) external {
        blacklist[account] = true;
        emit Blacklisted(account);
    }

    /// @notice Quita una dirección de la blacklist
    function removeFromBlacklist(address account) external {
        blacklist[account] = false;
        emit RemovedFromBlacklist(account);
    }

    /// @notice Verifica si una dirección es segura (no está en blacklist)
    function isSecure(address account) public view returns (bool) {
        return !blacklist[account];
    }

    /// @notice Marca un contrato como seguro para upgrades o integración
    function addSecureContract(address contractAddr) external {
        require(contractAddr != address(0), "Dirección inválida");
        secureContracts[contractAddr] = true;
        emit SecureContractAdded(contractAddr);
    }

    /// @notice Quita un contrato de la lista de seguros
    function removeSecureContract(address contractAddr) external {
        secureContracts[contractAddr] = false;
        emit SecureContractRemoved(contractAddr);
    }

    /// @notice Verifica si un contrato es seguro
    function isContractSecure(address contractAddr) public view returns (bool) {
        return secureContracts[contractAddr];
    }
} 