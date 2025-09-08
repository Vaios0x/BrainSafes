// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";


contract DistributedCache is UUPSUpgradeable, AccessControlUpgradeable, PausableUpgradeable {
    // Roles
    bytes32 public constant CACHE_ADMIN = keccak256("CACHE_ADMIN");
    bytes32 public constant CACHE_WRITER = keccak256("CACHE_WRITER");

    // Structs
    struct CacheEntry {
        bytes data;
        uint256 timestamp;
        uint256 expiryTime;
        uint256 accessCount;
        uint256 lastAccess;
        bool isCompressed;
        address owner;
    }

    struct CacheStats {
        uint256 hits;
        uint256 misses;
        uint256 totalSize;
        uint256 compressedSize;
        uint256 savingsPercent;
    }

    struct CacheConfig {
        uint256 maxSize;
        uint256 defaultTTL;
        uint256 minAccessCount;
        uint256 compressionThreshold;
        bool autoCompress;
        mapping(address => bool) trustedSources;
    }

    // Storage
    mapping(bytes32 => CacheEntry) public cache;
    mapping(address => CacheStats) public stats;
    mapping(bytes32 => mapping(uint256 => bytes)) public versionHistory;
    
    // Configuration
    CacheConfig public config;
    uint256 public currentSize;
    uint256 public evictionCount;

    // Events
    event CacheSet(bytes32 indexed key, uint256 size, uint256 ttl);
    event CacheEvicted(bytes32 indexed key, uint256 size);
    event CacheHit(bytes32 indexed key, address indexed user);
    event CacheMiss(bytes32 indexed key, address indexed user);
    event CacheCompressed(bytes32 indexed key, uint256 savingsPercent);
    event ConfigUpdated(uint256 maxSize, uint256 defaultTTL);

    
    function initialize() public initializer {
        __UUPSUpgradeable_init();
        __AccessControl_init();
        __Pausable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(CACHE_ADMIN, msg.sender);

        // Initialize default configuration
        config.maxSize = 1000000; // 1MB
        config.defaultTTL = 1 hours;
        config.minAccessCount = 5;
        config.compressionThreshold = 1000; // 1KB
        config.autoCompress = true;
    }

    
    function set(
        bytes32 key,
        bytes calldata data,
        uint256 ttl
    ) external whenNotPaused onlyRole(CACHE_WRITER) returns (bool) {
        require(data.length > 0, "Empty data");
        require(ttl > 0, "Invalid TTL");

        // Check size limits
        require(
            currentSize + data.length <= config.maxSize,
            "Cache size limit exceeded"
        );

        // Store version history
        versionHistory[key][block.timestamp] = data;

        // Compress if needed
        bytes memory cachedData = data;
        bool isCompressed = false;

        if (config.autoCompress && data.length > config.compressionThreshold) {
            cachedData = _compressData(data);
            isCompressed = true;
        }

        // Update cache entry
        CacheEntry storage entry = cache[key];
        entry.data = cachedData;
        entry.timestamp = block.timestamp;
        entry.expiryTime = block.timestamp + ttl;
        entry.accessCount = 0;
        entry.lastAccess = block.timestamp;
        entry.isCompressed = isCompressed;
        entry.owner = msg.sender;

        // Update stats
        currentSize = currentSize + cachedData.length;
        _updateStats(msg.sender, 0, 0, cachedData.length, data.length);

        emit CacheSet(key, cachedData.length, ttl);
        return true;
    }

    
    function get(bytes32 key) external view whenNotPaused returns (bytes memory, bool) {
        CacheEntry storage entry = cache[key];

        if (_isValidEntry(entry)) {
            // Update stats
            stats[msg.sender].hits++;
            emit CacheHit(key, msg.sender);

            // Return decompressed data if needed
            if (entry.isCompressed) {
                return (_decompressData(entry.data), true);
            }
            return (entry.data, true);
        }

        stats[msg.sender].misses++;
        emit CacheMiss(key, msg.sender);
        return (new bytes(0), false);
    }

    
    function getEntryDetails(
        bytes32 key
    ) external view returns (
        uint256 size,
        uint256 timestamp,
        uint256 expiryTime,
        uint256 accessCount,
        bool isCompressed,
        address owner
    ) {
        CacheEntry storage entry = cache[key];
        return (
            entry.data.length,
            entry.timestamp,
            entry.expiryTime,
            entry.accessCount,
            entry.isCompressed,
            entry.owner
        );
    }

    
    function updateConfig(
        uint256 maxSize,
        uint256 defaultTTL,
        uint256 minAccessCount,
        uint256 compressionThreshold,
        bool autoCompress
    ) external onlyRole(CACHE_ADMIN) {
        require(maxSize > 0, "Invalid max size");
        require(defaultTTL > 0, "Invalid TTL");

        config.maxSize = maxSize;
        config.defaultTTL = defaultTTL;
        config.minAccessCount = minAccessCount;
        config.compressionThreshold = compressionThreshold;
        config.autoCompress = autoCompress;

        emit ConfigUpdated(maxSize, defaultTTL);
    }

    
    function addTrustedSource(address source) external onlyRole(CACHE_ADMIN) {
        config.trustedSources[source] = true;
    }

    
    function removeTrustedSource(address source) external onlyRole(CACHE_ADMIN) {
        config.trustedSources[source] = false;
    }

    
    function clearExpired() external onlyRole(CACHE_ADMIN) returns (uint256) {
        uint256 cleared = 0;
        bytes32[] memory keys = _getAllKeys();

        for (uint i = 0; i < keys.length; i++) {
            CacheEntry storage entry = cache[keys[i]];
            if (block.timestamp > entry.expiryTime) {
                cleared += entry.data.length;
                currentSize -= entry.data.length;
                delete cache[keys[i]];
                evictionCount++;
            }
        }

        return cleared;
    }

    
    function getStats(
        address user
    ) external view returns (
        uint256 hits,
        uint256 misses,
        uint256 totalSize,
        uint256 compressedSize,
        uint256 savingsPercent
    ) {
        CacheStats storage userStats = stats[user];
        return (
            userStats.hits,
            userStats.misses,
            userStats.totalSize,
            userStats.compressedSize,
            userStats.savingsPercent
        );
    }

    
    function _isValidEntry(CacheEntry storage entry) internal view returns (bool) {
        return
            entry.data.length > 0 &&
            block.timestamp <= entry.expiryTime;
    }

    
    function _updateStats(
        address user,
        uint256 hits,
        uint256 misses,
        uint256 compressedSize,
        uint256 originalSize
    ) internal {
        CacheStats storage userStats = stats[user];
        userStats.hits += hits;
        userStats.misses += misses;
        userStats.totalSize += originalSize;
        userStats.compressedSize += compressedSize;
        
        if (originalSize > 0) {
            userStats.savingsPercent = 
                ((originalSize - compressedSize) * 100) / originalSize;
        }
    }

    
    function _getAllKeys() internal pure returns (bytes32[] memory) {
        // Implementation would depend on how we want to track keys
        // This is a placeholder
        return new bytes32[](0);
    }

    
    function _compressData(bytes memory data) internal pure returns (bytes memory) {
        if (data.length < 3) return data;

        bytes memory compressed = new bytes(data.length * 2); // Worst case
        uint256 compressedLength = 0;
        uint8 count = 1;

        for (uint i = 1; i < data.length; i++) {
            if (data[i] == data[i-1] && count < 255) {
                count++;
            } else {
                compressed[compressedLength++] = data[i-1];
                compressed[compressedLength++] = bytes1(count);
                count = 1;
            }
        }

        // Handle last sequence
        compressed[compressedLength++] = data[data.length-1];
        compressed[compressedLength++] = bytes1(count);

        // Create correctly sized array
        bytes memory result = new bytes(compressedLength);
        for (uint i = 0; i < compressedLength; i++) {
            result[i] = compressed[i];
        }

        return result;
    }

    
    function _decompressData(bytes memory compressed) internal pure returns (bytes memory) {
        if (compressed.length < 2) return compressed;

        // Calculate decompressed size
        uint256 decompressedLength = 0;
        for (uint i = 1; i < compressed.length; i += 2) {
            decompressedLength += uint8(compressed[i]);
        }

        bytes memory decompressed = new bytes(decompressedLength);
        uint256 pos = 0;

        // Decompress
        for (uint i = 0; i < compressed.length; i += 2) {
            uint8 count = uint8(compressed[i + 1]);
            for (uint j = 0; j < count; j++) {
                decompressed[pos++] = compressed[i];
            }
        }

        return decompressed;
    }

    
    function _authorizeUpgrade(address newImplementation) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}
} 