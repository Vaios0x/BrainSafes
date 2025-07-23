// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./BrainSafes.sol";
import "@arbitrum/nitro-contracts/src/precompiles/ArbSys.sol";
import "@arbitrum/nitro-contracts/src/libraries/AddressAliasHelper.sol";

/**
 * @title BrainSafesL2
 * @dev Versión L2 (Arbitrum) del contrato BrainSafes
 */
contract BrainSafesL2 is BrainSafes {
    // Precompilados de Arbitrum
    ArbSys constant arbsys = ArbSys(address(0x64));

    // Direcciones de contratos L1
    address public l1BrainSafes;
    address public l1Bridge;

    // Mappings
    mapping(bytes32 => bool) public processedMessages;
    mapping(uint256 => WithdrawalRequest) public withdrawals;

    // Estructuras
    struct WithdrawalRequest {
        address sender;
        address recipient;
        uint256 amount;
        uint256 timestamp;
        bool completed;
    }

    // Eventos
    event MessageReceived(bytes32 indexed messageId, address indexed sender, bytes data);
    event WithdrawalInitiated(uint256 indexed withdrawalId, address indexed sender, uint256 amount);
    event WithdrawalCompleted(uint256 indexed withdrawalId);

    // Contador
    uint256 private withdrawalCounter;

    constructor(
        address _l1BrainSafes,
        address _l1Bridge,
        address _eduToken,
        address _courseNFT,
        address _certificateNFT,
        address _scholarshipManager,
        address _aiOracle
    ) BrainSafes(
        _eduToken,
        _courseNFT,
        _certificateNFT,
        _scholarshipManager,
        _aiOracle
    ) {
        require(_l1BrainSafes != address(0), "Invalid L1 address");
        require(_l1Bridge != address(0), "Invalid bridge address");
        
        l1BrainSafes = _l1BrainSafes;
        l1Bridge = _l1Bridge;
    }

    /**
     * @dev Recibe tokens desde L1
     */
    function receiveFromL1(
        address sender,
        address recipient,
        uint256 amount,
        bytes calldata data
    ) external {
        require(msg.sender == l1Bridge, "Only bridge can call");
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Invalid amount");

        // Mintear tokens
        eduToken.mint(recipient, amount);

        // Procesar datos adicionales si existen
        if (data.length > 0) {
            _processL1Data(sender, recipient, data);
        }
    }

    /**
     * @dev Inicia un retiro hacia L1
     */
    function initiateWithdrawal(
        address sender,
        address recipient,
        uint256 amount
    ) external {
        require(msg.sender == l1Bridge, "Only bridge can call");
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Invalid amount");

        // Quemar tokens
        eduToken.burn(sender, amount);

        // Crear solicitud de retiro
        withdrawalCounter++;
        withdrawals[withdrawalCounter] = WithdrawalRequest({
            sender: sender,
            recipient: recipient,
            amount: amount,
            timestamp: block.timestamp,
            completed: false
        });

        emit WithdrawalInitiated(withdrawalCounter, sender, amount);

        // Enviar mensaje a L1
        bytes memory data = abi.encodeWithSignature(
            "processWithdrawal(uint256,address,address,uint256)",
            withdrawalCounter,
            sender,
            recipient,
            amount
        );

        arbsys.sendTxToL1(l1BrainSafes, data);
    }

    /**
     * @dev Mintea tokens desde L1
     */
    function mintFromL1(
        address recipient,
        uint256 amount
    ) external {
        require(msg.sender == l1Bridge, "Only bridge can call");
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Invalid amount");

        eduToken.mint(recipient, amount);
    }

    /**
     * @dev Recibe certificado desde L1
     */
    function receiveCertificateFromL1(
        address recipient,
        uint256 tokenId,
        bytes calldata metadata
    ) external {
        require(msg.sender == l1Bridge, "Only bridge can call");
        require(recipient != address(0), "Invalid recipient");

        // Mintear certificado
        certificateNFT.mintCertificate(
            recipient,
            tokenId,
            string(metadata),
            100 // Score máximo para certificados bridgeados
        );
    }

    /**
     * @dev Mintea certificado desde L1
     */
    function mintCertificateFromL1(
        address recipient,
        uint256 tokenId,
        bytes calldata metadata
    ) external {
        require(msg.sender == l1Bridge, "Only bridge can call");
        require(recipient != address(0), "Invalid recipient");

        certificateNFT.mintCertificate(
            recipient,
            tokenId,
            string(metadata),
            100
        );
    }

    /**
     * @dev Procesa mensaje desde L1
     */
    function processL1Message(
        bytes32 messageId,
        address sender,
        bytes calldata data
    ) external {
        require(msg.sender == l1Bridge, "Only bridge can call");
        require(!processedMessages[messageId], "Message already processed");
        require(sender == l1BrainSafes, "Invalid sender");

        processedMessages[messageId] = true;
        emit MessageReceived(messageId, sender, data);

        // Procesar mensaje
        _processL1Message(sender, data);
    }

    /**
     * @dev Envía mensaje a L1
     */
    function sendMessageToL1(
        address target,
        bytes calldata data
    ) external onlyRole(ADMIN_ROLE) {
        arbsys.sendTxToL1(target, data);
    }

    /**
     * @dev Verifica si un mensaje ha sido procesado
     */
    function isMessageProcessed(bytes32 messageId) external view returns (bool) {
        return processedMessages[messageId];
    }

    /**
     * @dev Obtiene el estado de un retiro
     */
    function getWithdrawalStatus(uint256 withdrawalId) external view returns (
        address sender,
        address recipient,
        uint256 amount,
        uint256 timestamp,
        bool completed
    ) {
        WithdrawalRequest storage withdrawal = withdrawals[withdrawalId];
        return (
            withdrawal.sender,
            withdrawal.recipient,
            withdrawal.amount,
            withdrawal.timestamp,
            withdrawal.completed
        );
    }

    /**
     * @dev Procesa datos adicionales de L1
     */
    function _processL1Data(
        address sender,
        address recipient,
        bytes memory data
    ) internal {
        // Implementar lógica específica según el tipo de datos
        // Por ejemplo, actualizar reputación, logros, etc.
    }

    /**
     * @dev Procesa mensaje de L1
     */
    function _processL1Message(
        address sender,
        bytes memory data
    ) internal {
        // Decodificar y procesar mensaje según su tipo
        (bytes4 selector, bytes memory payload) = abi.decode(data, (bytes4, bytes));

        if (selector == bytes4(keccak256("updateUserProfile(address,string)"))) {
            (address user, string memory newProfile) = abi.decode(payload, (address, string));
            _updateUserProfile(user, newProfile);
        } else if (selector == bytes4(keccak256("updateAchievement(uint256,string)"))) {
            (uint256 achievementId, string memory newData) = abi.decode(payload, (uint256, string));
            _updateAchievement(achievementId, newData);
        }
    }

    /**
     * @dev Actualiza perfil de usuario
     */
    function _updateUserProfile(
        address user,
        string memory newProfile
    ) internal {
        // Implementar actualización de perfil
    }

    /**
     * @dev Actualiza logro
     */
    function _updateAchievement(
        uint256 achievementId,
        string memory newData
    ) internal {
        // Implementar actualización de logro
    }

    /**
     * @dev Actualiza dirección del contrato L1
     */
    function updateL1Contract(
        address newL1Contract
    ) external onlyRole(ADMIN_ROLE) {
        require(newL1Contract != address(0), "Invalid address");
        l1BrainSafes = newL1Contract;
    }

    /**
     * @dev Actualiza dirección del bridge
     */
    function updateBridge(
        address newBridge
    ) external onlyRole(ADMIN_ROLE) {
        require(newBridge != address(0), "Invalid address");
        l1Bridge = newBridge;
    }
} 