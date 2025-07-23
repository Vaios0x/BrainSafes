// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@arbitrum/nitro-contracts/src/precompiles/ArbSys.sol";
import "../monitoring/ChainMonitor.sol";

/**
 * @title ArbOSManager
 * @dev Gestor de actualizaciones de ArbOS con verificación y rollback
 */
contract ArbOSManager is AccessControl, ReentrancyGuard {
    bytes32 public constant UPGRADE_ADMIN_ROLE = keccak256("UPGRADE_ADMIN_ROLE");
    bytes32 public constant VALIDATOR_ROLE = keccak256("VALIDATOR_ROLE");

    ArbSys constant arbsys = ArbSys(address(0x64));
    ChainMonitor public monitor;

    struct ArbOSVersion {
        uint256 version;
        string name;
        string description;
        bytes32 codeHash;
        uint256 deployedAt;
        bool isActive;
        address deployer;
        uint256 validations;
    }

    struct UpgradeProposal {
        uint256 id;
        uint256 targetVersion;
        uint256 proposedAt;
        uint256 scheduledFor;
        bool executed;
        bool cancelled;
        string reason;
        mapping(address => bool) validations;
    }

    struct ValidationReport {
        address validator;
        bool approved;
        string comments;
        uint256 timestamp;
    }

    // Estado del contrato
    mapping(uint256 => ArbOSVersion) public versions;
    mapping(uint256 => UpgradeProposal) public proposals;
    mapping(uint256 => ValidationReport[]) public validationReports;
    
    uint256 public currentVersion;
    uint256 public proposalCount;
    uint256 public minValidations;
    uint256 public upgradeDelay;
    bool public upgradeFreeze;

    // Eventos
    event VersionRegistered(uint256 indexed version, string name);
    event UpgradeProposed(uint256 indexed proposalId, uint256 targetVersion);
    event UpgradeValidated(uint256 indexed proposalId, address indexed validator, bool approved);
    event UpgradeScheduled(uint256 indexed proposalId, uint256 scheduledTime);
    event UpgradeExecuted(uint256 indexed proposalId, uint256 fromVersion, uint256 toVersion);
    event UpgradeCancelled(uint256 indexed proposalId, string reason);
    event EmergencyFreeze(bool frozen);

    constructor(address _monitor) {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(UPGRADE_ADMIN_ROLE, msg.sender);
        
        monitor = ChainMonitor(_monitor);
        
        // Configuración inicial
        minValidations = 3;
        upgradeDelay = 2 days;
        upgradeFreeze = false;

        // Registrar versión inicial
        _registerVersion(1, "Initial ArbOS", "Base version", bytes32(0));
        currentVersion = 1;
    }

    /**
     * @dev Registrar nueva versión de ArbOS
     */
    function registerVersion(
        uint256 version,
        string calldata name,
        string calldata description,
        bytes32 codeHash
    ) external onlyRole(UPGRADE_ADMIN_ROLE) {
        require(version > currentVersion, "Invalid version");
        require(versions[version].version == 0, "Version exists");
        
        _registerVersion(version, name, description, codeHash);
    }

    function _registerVersion(
        uint256 version,
        string memory name,
        string memory description,
        bytes32 codeHash
    ) internal {
        versions[version] = ArbOSVersion({
            version: version,
            name: name,
            description: description,
            codeHash: codeHash,
            deployedAt: 0,
            isActive: false,
            deployer: msg.sender,
            validations: 0
        });

        emit VersionRegistered(version, name);
    }

    /**
     * @dev Proponer actualización
     */
    function proposeUpgrade(
        uint256 targetVersion,
        string calldata reason
    ) external onlyRole(UPGRADE_ADMIN_ROLE) returns (uint256) {
        require(!upgradeFreeze, "Upgrades frozen");
        require(versions[targetVersion].version > 0, "Invalid version");
        require(targetVersion > currentVersion, "Invalid target version");

        proposalCount++;
        
        UpgradeProposal storage proposal = proposals[proposalCount];
        proposal.id = proposalCount;
        proposal.targetVersion = targetVersion;
        proposal.proposedAt = block.timestamp;
        proposal.scheduledFor = 0;
        proposal.executed = false;
        proposal.cancelled = false;
        proposal.reason = reason;

        emit UpgradeProposed(proposalCount, targetVersion);
        return proposalCount;
    }

    /**
     * @dev Validar propuesta de actualización
     */
    function validateUpgrade(
        uint256 proposalId,
        bool approve,
        string calldata comments
    ) external onlyRole(VALIDATOR_ROLE) {
        require(!upgradeFreeze, "Upgrades frozen");
        
        UpgradeProposal storage proposal = proposals[proposalId];
        require(!proposal.executed && !proposal.cancelled, "Invalid proposal state");
        require(!proposal.validations[msg.sender], "Already validated");

        proposal.validations[msg.sender] = true;
        versions[proposal.targetVersion].validations++;

        validationReports[proposalId].push(ValidationReport({
            validator: msg.sender,
            approved: approve,
            comments: comments,
            timestamp: block.timestamp
        }));

        emit UpgradeValidated(proposalId, msg.sender, approve);

        // Verificar si se puede programar la actualización
        if (_canScheduleUpgrade(proposalId)) {
            _scheduleUpgrade(proposalId);
        }
    }

    /**
     * @dev Ejecutar actualización programada
     */
    function executeUpgrade(uint256 proposalId) external nonReentrant onlyRole(UPGRADE_ADMIN_ROLE) {
        require(!upgradeFreeze, "Upgrades frozen");
        
        UpgradeProposal storage proposal = proposals[proposalId];
        require(!proposal.executed && !proposal.cancelled, "Invalid proposal state");
        require(
            proposal.scheduledFor > 0 && block.timestamp >= proposal.scheduledFor,
            "Not ready for execution"
        );

        // Verificar estado de la cadena
        require(_isChainHealthy(), "Chain not healthy");

        uint256 oldVersion = currentVersion;
        uint256 newVersion = proposal.targetVersion;

        // Ejecutar actualización
        _performUpgrade(oldVersion, newVersion);

        // Actualizar estado
        proposal.executed = true;
        currentVersion = newVersion;
        versions[newVersion].isActive = true;
        versions[newVersion].deployedAt = block.timestamp;

        emit UpgradeExecuted(proposalId, oldVersion, newVersion);
    }

    /**
     * @dev Cancelar actualización
     */
    function cancelUpgrade(
        uint256 proposalId,
        string calldata reason
    ) external onlyRole(UPGRADE_ADMIN_ROLE) {
        UpgradeProposal storage proposal = proposals[proposalId];
        require(!proposal.executed && !proposal.cancelled, "Invalid proposal state");

        proposal.cancelled = true;
        proposal.reason = reason;

        emit UpgradeCancelled(proposalId, reason);
    }

    /**
     * @dev Congelar actualizaciones (emergencia)
     */
    function toggleUpgradeFreeze() external onlyRole(DEFAULT_ADMIN_ROLE) {
        upgradeFreeze = !upgradeFreeze;
        emit EmergencyFreeze(upgradeFreeze);
    }

    /**
     * @dev Verificar si se puede programar la actualización
     */
    function _canScheduleUpgrade(uint256 proposalId) internal view returns (bool) {
        UpgradeProposal storage proposal = proposals[proposalId];
        return versions[proposal.targetVersion].validations >= minValidations;
    }

    /**
     * @dev Programar actualización
     */
    function _scheduleUpgrade(uint256 proposalId) internal {
        UpgradeProposal storage proposal = proposals[proposalId];
        proposal.scheduledFor = block.timestamp + upgradeDelay;
        emit UpgradeScheduled(proposalId, proposal.scheduledFor);
    }

    /**
     * @dev Verificar salud de la cadena
     */
    function _isChainHealthy() internal view returns (bool) {
        // Implementar verificación real usando ChainMonitor
        return true;
    }

    /**
     * @dev Ejecutar actualización de ArbOS
     */
    function _performUpgrade(uint256 oldVersion, uint256 newVersion) internal {
        // Implementar lógica real de actualización
        // Este es un placeholder - la implementación real dependería del contexto
    }

    /**
     * @dev Obtener información de versión
     */
    function getVersionInfo(
        uint256 version
    ) external view returns (ArbOSVersion memory) {
        return versions[version];
    }

    /**
     * @dev Obtener reportes de validación
     */
    function getValidationReports(
        uint256 proposalId
    ) external view returns (ValidationReport[] memory) {
        return validationReports[proposalId];
    }

    /**
     * @dev Verificar estado de actualización
     */
    function getUpgradeStatus(
        uint256 proposalId
    ) external view returns (
        bool canExecute,
        uint256 validationCount,
        uint256 timeUntilExecution
    ) {
        UpgradeProposal storage proposal = proposals[proposalId];
        
        canExecute = !proposal.executed && 
                    !proposal.cancelled && 
                    proposal.scheduledFor > 0 && 
                    block.timestamp >= proposal.scheduledFor;
                    
        validationCount = versions[proposal.targetVersion].validations;
        
        timeUntilExecution = proposal.scheduledFor > block.timestamp ? 
            proposal.scheduledFor - block.timestamp : 
            0;
            
        return (canExecute, validationCount, timeUntilExecution);
    }
} 