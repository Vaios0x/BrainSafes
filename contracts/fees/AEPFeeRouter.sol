// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";


contract AEPFeeRouter is AccessControl, ReentrancyGuard {
    bytes32 public constant FEE_ADMIN_ROLE = keccak256("FEE_ADMIN_ROLE");
    bytes32 public constant COLLECTOR_ROLE = keccak256("COLLECTOR_ROLE");

    struct FeeConfig {
        uint256 daoShare;      // Porcentaje para el DAO
        uint256 devShare;      // Porcentaje para desarrolladores
        uint256 ecosystemShare; // Porcentaje para el ecosistema
        uint256 totalFees;     // Total de tarifas acumuladas
    }

    struct FeeRecipient {
        address addr;
        uint256 share;         // Porcentaje de participación
        uint256 totalReceived;
        bool isActive;
    }

    struct FeeReport {
        uint256 timestamp;
        uint256 amount;
        string category;
        address collector;
    }

    // Estado del contrato
    FeeConfig public feeConfig;
    mapping(address => FeeRecipient) public recipients;
    mapping(uint256 => FeeReport) public feeReports;
    uint256 public reportCount;

    // Token nativo o ERC20 para tarifas
    IERC20 public feeToken;
    
    // Eventos
    event FeeCollected(address indexed collector, uint256 amount, string category);
    event FeeDistributed(address indexed recipient, uint256 amount);
    event FeeConfigUpdated(FeeConfig newConfig);
    event RecipientAdded(address indexed recipient, uint256 share);
    event RecipientRemoved(address indexed recipient);
    event FeeReported(uint256 indexed reportId, uint256 amount, string category);

    constructor(address _feeToken) {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(FEE_ADMIN_ROLE, msg.sender);
        
        feeToken = IERC20(_feeToken);

        // Configuración inicial
        feeConfig = FeeConfig({
            daoShare: 5000,      // 50%
            devShare: 3000,      // 30%
            ecosystemShare: 2000, // 20%
            totalFees: 0
        });
    }

    
    function collectFees(
        uint256 amount,
        string calldata category
    ) external nonReentrant onlyRole(COLLECTOR_ROLE) {
        require(amount > 0, "Invalid amount");
        
        // Transferir tarifas al contrato
        require(
            feeToken.transferFrom(msg.sender, address(this), amount),
            "Fee transfer failed"
        );

        // Actualizar estado
        feeConfig.totalFees += amount;

        // Crear reporte
        reportCount++;
        feeReports[reportCount] = FeeReport({
            timestamp: block.timestamp,
            amount: amount,
            category: category,
            collector: msg.sender
        });

        emit FeeCollected(msg.sender, amount, category);
        emit FeeReported(reportCount, amount, category);

        // Distribuir tarifas automáticamente
        _distributeFees(amount);
    }

    
    function _distributeFees(uint256 amount) internal {
        // Calcular montos por categoría
        uint256 daoAmount = (amount * feeConfig.daoShare) / 10000;
        uint256 devAmount = (amount * feeConfig.devShare) / 10000;
        uint256 ecosystemAmount = (amount * feeConfig.ecosystemShare) / 10000;

        // Distribuir a destinatarios activos
        for (uint256 i = 0; i < _getActiveRecipients().length; i++) {
        address recipient = _getActiveRecipients()[i];
            FeeRecipient storage feeRecipient = recipients[recipient];
            
            uint256 recipientAmount = 0;
            
            // Calcular monto basado en la participación
            if (feeRecipient.share > 0) {
                if (_isDAORecipient(recipient)) {
                    recipientAmount = (daoAmount * feeRecipient.share) / 10000;
                } else if (_isDevRecipient(recipient)) {
                    recipientAmount = (devAmount * feeRecipient.share) / 10000;
                } else {
                    recipientAmount = (ecosystemAmount * feeRecipient.share) / 10000;
                }
            }

            if (recipientAmount > 0) {
                require(
                    feeToken.transfer(recipient, recipientAmount),
                    "Distribution failed"
                );
                feeRecipient.totalReceived += recipientAmount;
                emit FeeDistributed(recipient, recipientAmount);
            }
        }
    }

    
    function updateFeeConfig(
        uint256 _daoShare,
        uint256 _devShare,
        uint256 _ecosystemShare
    ) external onlyRole(FEE_ADMIN_ROLE) {
        require(
            _daoShare + _devShare + _ecosystemShare == 10000,
            "Shares must total 100%"
        );

        feeConfig.daoShare = _daoShare;
        feeConfig.devShare = _devShare;
        feeConfig.ecosystemShare = _ecosystemShare;

        emit FeeConfigUpdated(feeConfig);
    }

    
    function addRecipient(
        address recipient,
        uint256 share
    ) external onlyRole(FEE_ADMIN_ROLE) {
        require(recipient != address(0), "Invalid address");
        require(!recipients[recipient].isActive, "Recipient already exists");
        require(share <= 10000, "Share too high");

        recipients[recipient] = FeeRecipient({
            addr: recipient,
            share: share,
            totalReceived: 0,
            isActive: true
        });

        emit RecipientAdded(recipient, share);
    }

    
    function removeRecipient(address recipient) external onlyRole(FEE_ADMIN_ROLE) {
        require(recipients[recipient].isActive, "Recipient not active");
        recipients[recipient].isActive = false;
        emit RecipientRemoved(recipient);
    }

    
    function _getActiveRecipients() internal view returns (address[] memory) {
        // Implementar lógica para obtener destinatarios activos
        return new address[](0);
    }

    
    function _isDAORecipient(address recipient) internal pure returns (bool) {
        // Implementar lógica de verificación
        return false;
    }

    
    function _isDevRecipient(address recipient) internal pure returns (bool) {
        // Implementar lógica de verificación
        return false;
    }

    
    function getFeeReport(
        uint256 reportId
    ) external view returns (FeeReport memory) {
        return feeReports[reportId];
    }

    
    function getRecipientInfo(
        address recipient
    ) external view returns (FeeRecipient memory) {
        return recipients[recipient];
    }

    
    function getGlobalStats() external view returns (
        uint256 totalCollected,
        uint256 totalDistributed,
        uint256 activeRecipients
    ) {
        return (
            feeConfig.totalFees,
            0, // Implementar suma
            0  // Implementar conteo
        );
    }
} 