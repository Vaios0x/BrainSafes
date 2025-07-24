// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";

/**
 * @title BrainSafes Storage Optimizer
 * @dev Handles storage optimizations and data packing
 * @custom:security-contact security@brainsafes.com
 */
contract StorageOptimizer is UUPSUpgradeable, AccessControlUpgradeable, PausableUpgradeable {
    // Roles
    bytes32 public constant STORAGE_ADMIN = keccak256("STORAGE_ADMIN");
    bytes32 public constant DATA_PACKER = keccak256("DATA_PACKER");

    // Constants for bit packing
    uint256 private constant UINT8_MASK = 0xFF;
    uint256 private constant UINT16_MASK = 0xFFFF;
    uint256 private constant UINT32_MASK = 0xFFFFFFFF;
    uint256 private constant UINT64_MASK = 0xFFFFFFFFFFFFFFFF;

    // Structs
    struct PackedData {
        bytes32 key;
        bytes32 packedValue;
        uint8 itemCount;
        uint8[] bitSizes;
        bool isCompressed;
    }

    struct StorageLayout {
        bytes32 layoutId;
        string name;
        uint8[] fieldSizes;
        string[] fieldNames;
        bool isActive;
    }

    struct CompressionStats {
        uint256 originalSize;
        uint256 compressedSize;
        uint256 accessCount;
        uint256 lastAccess;
        uint256 savingsPercent;
    }

    // Storage
    mapping(bytes32 => PackedData) public packedStorage;
    mapping(bytes32 => StorageLayout) public layouts;
    mapping(bytes32 => CompressionStats) public compressionStats;
    mapping(bytes32 => mapping(uint256 => uint256)) public slotHistory;

    // Events
    event DataPacked(bytes32 indexed key, uint8 itemCount, uint256 savingsPercent);
    event LayoutRegistered(bytes32 indexed layoutId, string name, uint8 fieldCount);
    event StorageOptimized(bytes32 indexed key, uint256 originalSize, uint256 newSize);
    event CompressionUpdated(bytes32 indexed key, uint256 savingsPercent);

    /**
     * @dev Initialize the contract
     */
    function initialize() public initializer {
        __UUPSUpgradeable_init();
        __AccessControl_init();
        __Pausable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(STORAGE_ADMIN, msg.sender);
    }

    /**
     * @dev Register a new storage layout
     */
    function registerLayout(
        string calldata name,
        uint8[] calldata fieldSizes,
        string[] calldata fieldNames
    ) external onlyRole(STORAGE_ADMIN) returns (bytes32) {
        require(fieldSizes.length == fieldNames.length, "Size/name mismatch");
        require(fieldSizes.length > 0, "Empty layout");

        bytes32 layoutId = keccak256(abi.encodePacked(name, fieldSizes.length));
        require(!layouts[layoutId].isActive, "Layout exists");

        StorageLayout storage layout = layouts[layoutId];
        layout.layoutId = layoutId;
        layout.name = name;
        layout.fieldSizes = fieldSizes;
        layout.fieldNames = fieldNames;
        layout.isActive = true;

        emit LayoutRegistered(layoutId, name, uint8(fieldSizes.length));
        return layoutId;
    }

    /**
     * @dev Pack multiple values into a single storage slot
     */
    function packValues(
        bytes32 layoutId,
        bytes32 key,
        uint256[] calldata values
    ) external onlyRole(DATA_PACKER) returns (bytes32) {
        StorageLayout storage layout = layouts[layoutId];
        require(layout.isActive, "Invalid layout");
        require(values.length == layout.fieldSizes.length, "Value count mismatch");

        uint256 packedValue = 0;
        uint256 bitPosition = 0;

        for (uint i = 0; i < values.length; i++) {
            uint256 maxValue = (1 << layout.fieldSizes[i]) - 1;
            require(values[i] <= maxValue, "Value too large");

            packedValue |= values[i] << bitPosition;
            bitPosition += layout.fieldSizes[i];
        }

        PackedData storage data = packedStorage[key];
        data.key = key;
        data.packedValue = bytes32(packedValue);
        data.itemCount = uint8(values.length);
        data.bitSizes = layout.fieldSizes;
        data.isCompressed = true;

        // Calculate savings
        uint256 originalSize = values.length * 32;
        uint256 newSize = 32;
        uint256 savingsPercent = (originalSize - newSize) * 100 / originalSize;

        updateCompressionStats(key, originalSize, newSize);
        emit DataPacked(key, uint8(values.length), savingsPercent);

        return bytes32(packedValue);
    }

    /**
     * @dev Unpack values from a storage slot
     */
    function unpackValues(
        bytes32 key
    ) external view returns (uint256[] memory) {
        PackedData storage data = packedStorage[key];
        require(data.isCompressed, "Data not packed");

        uint256[] memory values = new uint256[](data.itemCount);
        uint256 packedValue = uint256(data.packedValue);
        uint256 bitPosition = 0;

        for (uint i = 0; i < data.itemCount; i++) {
            uint256 mask = (1 << data.bitSizes[i]) - 1;
            values[i] = (packedValue >> bitPosition) & mask;
            bitPosition += data.bitSizes[i];
        }

        return values;
    }

    /**
     * @dev Pack address and uint96 into a single slot
     */
    function packAddressUint96(
        address addr,
        uint96 value
    ) external pure returns (bytes32) {
        return bytes32(uint256(uint160(addr)) | (uint256(value) << 160));
    }

    /**
     * @dev Unpack address and uint96 from a single slot
     */
    function unpackAddressUint96(
        bytes32 packed
    ) external pure returns (address addr, uint96 value) {
        addr = address(uint160(uint256(packed)));
        value = uint96(uint256(packed) >> 160);
    }

    /**
     * @dev Pack multiple small uints into a single slot
     */
    function packMultipleUints(
        uint8[] calldata uint8Values,
        uint16[] calldata uint16Values,
        uint32[] calldata uint32Values
    ) external pure returns (bytes32) {
        require(
            uint8Values.length <= 32 &&
            uint16Values.length <= 16 &&
            uint32Values.length <= 8,
            "Too many values"
        );

        uint256 packed = 0;
        uint256 bitPosition = 0;

        // Pack uint8s
        for (uint i = 0; i < uint8Values.length; i++) {
            packed |= uint256(uint8Values[i]) << bitPosition;
            bitPosition += 8;
        }

        // Pack uint16s
        for (uint i = 0; i < uint16Values.length; i++) {
            packed |= uint256(uint16Values[i]) << bitPosition;
            bitPosition += 16;
        }

        // Pack uint32s
        for (uint i = 0; i < uint32Values.length; i++) {
            packed |= uint256(uint32Values[i]) << bitPosition;
            bitPosition += 32;
        }

        return bytes32(packed);
    }

    /**
     * @dev Update compression statistics
     */
    function updateCompressionStats(
        bytes32 key,
        uint256 originalSize,
        uint256 newSize
    ) internal {
        CompressionStats storage stats = compressionStats[key];
        stats.originalSize = originalSize;
        stats.compressedSize = newSize;
        stats.accessCount++;
        stats.lastAccess = block.timestamp;
        stats.savingsPercent = (originalSize - newSize) * 100 / originalSize;

        emit CompressionUpdated(key, stats.savingsPercent);
    }

    /**
     * @dev Get compression statistics
     */
    function getCompressionStats(
        bytes32 key
    ) external view returns (
        uint256 originalSize,
        uint256 compressedSize,
        uint256 accessCount,
        uint256 lastAccess,
        uint256 savingsPercent
    ) {
        CompressionStats storage stats = compressionStats[key];
        return (
            stats.originalSize,
            stats.compressedSize,
            stats.accessCount,
            stats.lastAccess,
            stats.savingsPercent
        );
    }

    /**
     * @dev Get layout details
     */
    function getLayout(
        bytes32 layoutId
    ) external view returns (
        string memory name,
        uint8[] memory fieldSizes,
        string[] memory fieldNames,
        bool isActive
    ) {
        StorageLayout storage layout = layouts[layoutId];
        return (
            layout.name,
            layout.fieldSizes,
            layout.fieldNames,
            layout.isActive
        );
    }

    /**
     * @dev Required by UUPS
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}
} 