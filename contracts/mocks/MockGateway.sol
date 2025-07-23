// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title MockGateway
 * @dev Mock para probar integración con gateways L1/L2
 */
contract MockGateway {
    // Eventos
    event MessageSent(
        address indexed sender,
        address indexed recipient,
        bytes data
    );
    
    event TokensDeposited(
        address indexed sender,
        address indexed recipient,
        uint256 amount
    );
    
    event TokensWithdrawn(
        address indexed sender,
        address indexed recipient,
        uint256 amount
    );
    
    event CertificateBridged(
        address indexed recipient,
        uint256 tokenId,
        bytes data
    );

    // Funciones mock
    function finalizeDeposit(
        address sender,
        address recipient,
        uint256 amount,
        bytes calldata data
    ) external {
        emit TokensDeposited(sender, recipient, amount);
        emit MessageSent(sender, recipient, data);
    }

    function finalizeWithdrawal(
        address sender,
        address recipient,
        uint256 amount,
        bytes calldata data
    ) external {
        emit TokensWithdrawn(sender, recipient, amount);
        emit MessageSent(sender, recipient, data);
    }

    function bridgeCertificate(
        address recipient,
        bytes calldata data
    ) external {
        emit CertificateBridged(recipient, 0, data);
        emit MessageSent(msg.sender, recipient, data);
    }

    function bridgeData(
        address recipient,
        bytes calldata data
    ) external {
        emit MessageSent(msg.sender, recipient, data);
    }

    // Función para simular recepción de ETH
    receive() external payable {}
} 