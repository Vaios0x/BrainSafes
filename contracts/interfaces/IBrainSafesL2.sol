// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IBrainSafesL2
 * @dev Interfaz para el contrato BrainSafes en L2 (Arbitrum)
 */
interface IBrainSafesL2 {
    /**
     * @dev Recibe tokens desde L1
     */
    function receiveFromL1(
        address sender,
        address recipient,
        uint256 amount,
        bytes calldata data
    ) external;

    /**
     * @dev Inicia un retiro hacia L1
     */
    function initiateWithdrawal(
        address sender,
        address recipient,
        uint256 amount
    ) external;

    /**
     * @dev Mintea tokens desde L1
     */
    function mintFromL1(
        address recipient,
        uint256 amount
    ) external;

    /**
     * @dev Recibe certificado desde L1
     */
    function receiveCertificateFromL1(
        address recipient,
        uint256 tokenId,
        bytes calldata metadata
    ) external;

    /**
     * @dev Mintea certificado desde L1
     */
    function mintCertificateFromL1(
        address recipient,
        uint256 tokenId,
        bytes calldata metadata
    ) external;

    /**
     * @dev Procesa mensaje desde L1
     */
    function processL1Message(
        bytes32 messageId,
        address sender,
        bytes calldata data
    ) external;

    /**
     * @dev Envía mensaje a L1
     */
    function sendMessageToL1(
        address target,
        bytes calldata data
    ) external;

    /**
     * @dev Verifica si un mensaje ha sido procesado
     */
    function isMessageProcessed(bytes32 messageId) external view returns (bool);

    /**
     * @dev Obtiene el estado de un retiro
     */
    function getWithdrawalStatus(uint256 withdrawalId) external view returns (
        address sender,
        address recipient,
        uint256 amount,
        uint256 timestamp,
        bool completed
    );
} 