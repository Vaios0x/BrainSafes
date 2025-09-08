// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./BrainSafes.sol";
import "@arbitrum/nitro-contracts/src/precompiles/ArbSys.sol";
import "@arbitrum/nitro-contracts/src/libraries/AddressAliasHelper.sol";


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

    
    function initiateWithdrawal(
        address sender,
        address recipient,
        uint256 amount
    ) external {
        require(msg.sender == l1Bridge, "Only bridge can call");
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Invalid amount");

        // Quemar tokens
        eduToken.burn(amount); // Standard ERC20 burn function takes only amount

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

    
    function mintFromL1(
        address recipient,
        uint256 amount
    ) external {
        require(msg.sender == l1Bridge, "Only bridge can call");
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Invalid amount");

        eduToken.mint(recipient, amount);
    }

    
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

    
    function sendMessageToL1(
        address target,
        bytes calldata data
    ) external onlyRole(ADMIN_ROLE) {
        arbsys.sendTxToL1(target, data);
    }

    
    function isMessageProcessed(bytes32 messageId) external view returns (bool) {
        return processedMessages[messageId];
    }

    
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

    
    function _processL1Data(
        address sender,
        address recipient,
        bytes memory data
    ) internal {
        // Implementar lógica específica según el tipo de datos
        // Por ejemplo, actualizar reputación, logros, etc.
    }

    
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

    
    function _updateUserProfile(
        address user,
        string memory newProfile
    ) internal {
        // Implementar actualización de perfil
    }

    
    function _updateAchievement(
        uint256 achievementId,
        string memory newData
    ) internal {
        // Implementar actualización de logro
    }

    
    function updateL1Contract(
        address newL1Contract
    ) external onlyRole(ADMIN_ROLE) {
        require(newL1Contract != address(0), "Invalid address");
        l1BrainSafes = newL1Contract;
    }

    
    function updateBridge(
        address newBridge
    ) external onlyRole(ADMIN_ROLE) {
        require(newBridge != address(0), "Invalid address");
        l1Bridge = newBridge;
    }
} 