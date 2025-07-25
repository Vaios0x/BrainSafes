// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "../optimizations/AddressCompressor.sol";

/**
 * @title DataAvailabilityCommittee
 * @notice Data availability committee contract for BrainSafes
 * @dev Ensures data availability and integrity for the system
 * @author BrainSafes Team
 */
contract DataAvailabilityCommittee is AccessControl, ReentrancyGuard {
    bytes32 public constant DAC_MEMBER_ROLE = keccak256("DAC_MEMBER_ROLE");
    bytes32 public constant DATA_SUBMITTER_ROLE = keccak256("DATA_SUBMITTER_ROLE");

    struct DACMember {
        address addr;
        string endpoint;
        uint256 stake;
        bool isActive;
        uint256 lastHeartbeat;
    }

    struct DataChunk {
        bytes32 dataHash;
        uint256 timestamp;
        uint256 confirmations;
        bool isConfirmed;
        mapping(address => bool) confirmations;
    }

    // Estado del comité
    mapping(address => DACMember) public members;
    mapping(bytes32 => DataChunk) public dataChunks;
    uint256 public requiredConfirmations;
    uint256 public totalMembers;
    uint256 public minStake;

    // Configuración
    uint256 public constant HEARTBEAT_INTERVAL = 1 hours;
    uint256 public constant MAX_CHUNK_SIZE = 1024 * 1024; // 1MB
    uint256 public constant MIN_CONFIRMATIONS = 2;

    // Eventos
    event MemberAdded(address indexed member, string endpoint, uint256 stake);
    event MemberRemoved(address indexed member);
    event DataSubmitted(bytes32 indexed dataHash, address indexed submitter);
    event DataConfirmed(bytes32 indexed dataHash, address indexed confirmer);
    event DataAvailable(bytes32 indexed dataHash, uint256 confirmations);
    event HeartbeatReceived(address indexed member, uint256 timestamp);

    constructor(uint256 _minStake, uint256 _requiredConfirmations) {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        minStake = _minStake;
        requiredConfirmations = _requiredConfirmations;
    }

    /**
     * @dev Añadir un nuevo miembro al DAC
     * @param member The address of the new member.
     * @param endpoint The endpoint URL for the new member.
     */
    function addMember(
        address member,
        string calldata endpoint
    ) external payable onlyRole(DEFAULT_ADMIN_ROLE) {
        require(msg.value >= minStake, "Insufficient stake");
        require(!members[member].isActive, "Member already exists");

        members[member] = DACMember({
            addr: member,
            endpoint: endpoint,
            stake: msg.value,
            isActive: true,
            lastHeartbeat: block.timestamp
        });

        _grantRole(DAC_MEMBER_ROLE, member);
        totalMembers++;

        emit MemberAdded(member, endpoint, msg.value);
    }

    /**
     * @dev Remover un miembro del DAC
     * @param member The address of the member to remove.
     */
    function removeMember(address member) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(members[member].isActive, "Member not active");

        uint256 stake = members[member].stake;
        members[member].isActive = false;
        _revokeRole(DAC_MEMBER_ROLE, member);
        totalMembers--;

        payable(member).transfer(stake);
        emit MemberRemoved(member);
    }

    /**
     * @dev Enviar datos para confirmación
     * @param data The data bytes to submit.
     * @return The hash of the submitted data.
     */
    function submitData(
        bytes calldata data
    ) external onlyRole(DATA_SUBMITTER_ROLE) returns (bytes32) {
        require(data.length <= MAX_CHUNK_SIZE, "Data too large");

        bytes32 dataHash = keccak256(data);
        require(!dataChunks[dataHash].isConfirmed, "Data already confirmed");

        DataChunk storage chunk = dataChunks[dataHash];
        chunk.dataHash = dataHash;
        chunk.timestamp = block.timestamp;
        chunk.confirmations = 0;
        chunk.isConfirmed = false;

        emit DataSubmitted(dataHash, msg.sender);
        return dataHash;
    }

    /**
     * @dev Confirmar disponibilidad de datos
     * @param dataHash The hash of the data chunk to confirm.
     */
    function confirmData(bytes32 dataHash) external onlyRole(DAC_MEMBER_ROLE) {
        require(members[msg.sender].isActive, "Not an active member");
        require(!dataChunks[dataHash].confirmations[msg.sender], "Already confirmed");

        DataChunk storage chunk = dataChunks[dataHash];
        chunk.confirmations[msg.sender] = true;
        chunk.confirmations++;

        emit DataConfirmed(dataHash, msg.sender);

        if (chunk.confirmations >= requiredConfirmations && !chunk.isConfirmed) {
            chunk.isConfirmed = true;
            emit DataAvailable(dataHash, chunk.confirmations);
        }
    }

    /**
     * @dev Enviar heartbeat para mantener estado activo
     */
    function sendHeartbeat() external onlyRole(DAC_MEMBER_ROLE) {
        require(members[msg.sender].isActive, "Not an active member");
        members[msg.sender].lastHeartbeat = block.timestamp;
        emit HeartbeatReceived(msg.sender, block.timestamp);
    }

    /**
     * @dev Verificar si un miembro está activo
     * @param member The address of the member to check.
     * @return True if the member is active, false otherwise.
     */
    function isMemberActive(address member) public view returns (bool) {
        DACMember memory dacMember = members[member];
        return dacMember.isActive &&
            block.timestamp - dacMember.lastHeartbeat <= HEARTBEAT_INTERVAL;
    }

    /**
     * @dev Verificar si los datos están disponibles
     * @param dataHash The hash of the data chunk to check.
     * @return True if the data is available, false otherwise.
     */
    function isDataAvailable(bytes32 dataHash) external view returns (bool) {
        return dataChunks[dataHash].isConfirmed;
    }

    /**
     * @dev Obtener información de un miembro
     * @param member The address of the member to get info for.
     * @return A DACMember struct containing member information.
     */
    function getMemberInfo(address member) external view returns (DACMember memory) {
        return members[member];
    }

    /**
     * @dev Obtener estado del comité
     * @return activeMembers The number of active members.
     * @return totalStake The total stake of all members.
     * @return confirmedDataChunks The number of confirmed data chunks.
     */
    function getCommitteeStatus() external view returns (
        uint256 activeMembers,
        uint256 totalStake,
        uint256 confirmedDataChunks
    ) {
        uint256 active = 0;
        uint256 stake = 0;
        uint256 confirmed = 0;

        // Implementar conteo de estadísticas
        return (active, stake, confirmed);
    }

    /**
     * @dev Actualizar configuración del comité
     * @param _minStake The new minimum stake required for a member.
     * @param _requiredConfirmations The new number of confirmations required.
     */
    function updateConfig(
        uint256 _minStake,
        uint256 _requiredConfirmations
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_requiredConfirmations >= MIN_CONFIRMATIONS, "Invalid confirmations");
        require(_requiredConfirmations <= totalMembers, "Too many confirmations required");

        minStake = _minStake;
        requiredConfirmations = _requiredConfirmations;
    }
} 