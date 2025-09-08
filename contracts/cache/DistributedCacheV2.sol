// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";


contract DistributedCacheV2 is AccessControl, ReentrancyGuard {
    using SafeMath for uint256;

    bytes32 public constant CACHE_OPERATOR_ROLE = keccak256("CACHE_OPERATOR_ROLE");

    struct CacheEntry {
        bytes data;
        uint256 timestamp;
        uint256 ttl;
        uint256 accessCount;
        bool isValid;
        bytes32 hash;
        uint256 size;
        uint256 compressionRatio;
    }

    struct CacheStats {
        uint256 totalEntries;
        uint256 totalSize;
        uint256 hitCount;
        uint256 missCount;
        uint256 evictedCount;
        uint256 compressionSavings;
    }

    mapping(bytes32 => CacheEntry) public cacheEntries;
    mapping(bytes32 => uint256) public lastAccessTime;
    mapping(address => uint256) public userCacheUsage;
    
    CacheStats public cacheStats;
    
    uint256 public maxCacheSize = 1000; // Maximum number of entries
    uint256 public maxEntrySize = 1024 * 1024; // 1MB per entry
    uint256 public defaultTTL = 3600; // 1 hour default TTL
    uint256 public compressionThreshold = 1024; // Compress entries larger than 1KB

    event CacheSet(bytes32 indexed key, uint256 size, uint256 ttl);
    event CacheGet(bytes32 indexed key, bool hit);
    event CacheEvicted(bytes32 indexed key, uint256 reason);
    event CacheCleared(address indexed operator);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(CACHE_OPERATOR_ROLE, msg.sender);
    }

    
    function setCache(
        bytes32 key,
        bytes calldata data,
        uint256 ttl
    ) external onlyRole(CACHE_OPERATOR_ROLE) {
        require(data.length <= maxEntrySize, "Data too large");
        require(ttl > 0, "TTL must be positive");
        
        // Check if we need to evict entries
        if (cacheStats.totalEntries >= maxCacheSize) {
            _evictOldestEntries(1);
        }

        bytes32 dataHash = keccak256(data);
        bytes memory compressedData = _compressData(data);
        
        cacheEntries[key] = CacheEntry({
            data: compressedData,
            timestamp: block.timestamp,
            ttl: ttl,
            accessCount: 0,
            isValid: true,
            hash: dataHash,
            size: data.length,
            compressionRatio: _calculateCompressionRatio(data.length, compressedData.length)
        });

        lastAccessTime[key] = block.timestamp;
        cacheStats.totalEntries = cacheStats.totalEntries.add(1);
        cacheStats.totalSize = cacheStats.totalSize.add(compressedData.length);
        cacheStats.compressionSavings = cacheStats.compressionSavings.add(
            data.length.sub(compressedData.length)
        );

        emit CacheSet(key, data.length, ttl);
    }

    
    function getCache(bytes32 key) external view returns (bytes memory data, bool isValid) {
        CacheEntry storage entry = cacheEntries[key];
        
        if (!entry.isValid || block.timestamp > entry.timestamp.add(entry.ttl)) {
            cacheStats.missCount = cacheStats.missCount.add(1);
            emit CacheGet(key, false);
            return ("", false);
        }

        cacheStats.hitCount = cacheStats.hitCount.add(1);
        entry.accessCount = entry.accessCount.add(1);
        lastAccessTime[key] = block.timestamp;
        
        data = _decompressData(entry.data);
        isValid = true;
        
        emit CacheGet(key, true);
    }

    
    function hasCache(bytes32 key) external view returns (bool exists) {
        CacheEntry storage entry = cacheEntries[key];
        return entry.isValid && block.timestamp <= entry.timestamp.add(entry.ttl);
    }

    
    function updateTTL(bytes32 key, uint256 newTTL) external onlyRole(CACHE_OPERATOR_ROLE) {
        require(cacheEntries[key].isValid, "Entry does not exist");
        require(newTTL > 0, "TTL must be positive");
        
        cacheEntries[key].ttl = newTTL;
        cacheEntries[key].timestamp = block.timestamp;
    }

    
    function invalidateCache(bytes32 key) external onlyRole(CACHE_OPERATOR_ROLE) {
        if (cacheEntries[key].isValid) {
            _removeEntry(key);
            emit CacheEvicted(key, 1); // 1 = manual invalidation
        }
    }

    
    function clearCache() external onlyRole(CACHE_OPERATOR_ROLE) {
        cacheStats.totalEntries = 0;
        cacheStats.totalSize = 0;
        cacheStats.hitCount = 0;
        cacheStats.missCount = 0;
        cacheStats.evictedCount = 0;
        cacheStats.compressionSavings = 0;
        
        emit CacheCleared(msg.sender);
    }

    
    function getCacheStats() external view returns (CacheStats memory) {
        return cacheStats;
    }

    
    function getCacheInfo(bytes32 key) external view returns (
        uint256 timestamp,
        uint256 ttl,
        uint256 accessCount,
        bool isValid,
        uint256 size,
        uint256 compressionRatio
    ) {
        CacheEntry storage entry = cacheEntries[key];
        return (
            entry.timestamp,
            entry.ttl,
            entry.accessCount,
            entry.isValid && block.timestamp <= entry.timestamp.add(entry.ttl),
            entry.size,
            entry.compressionRatio
        );
    }

    
    function setCacheConfig(
        uint256 _maxCacheSize,
        uint256 _maxEntrySize,
        uint256 _defaultTTL,
        uint256 _compressionThreshold
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        maxCacheSize = _maxCacheSize;
        maxEntrySize = _maxEntrySize;
        defaultTTL = _defaultTTL;
        compressionThreshold = _compressionThreshold;
    }

    
    function _evictOldestEntries(uint256 count) internal {
        bytes32[] memory keys = new bytes32[](count);
        uint256[] memory timestamps = new uint256[](count);
        uint256 found = 0;

        // Find oldest entries
        for (uint256 i = 0; i < count; i++) {
            bytes32 oldestKey = bytes32(0);
            uint256 oldestTime = block.timestamp;

            // This is a simplified implementation - in production, you'd use a more efficient data structure
            // like a priority queue or sorted list
            for (uint256 j = 0; j < maxCacheSize; j++) {
                bytes32 key = bytes32(j);
                if (cacheEntries[key].isValid && lastAccessTime[key] < oldestTime) {
                    oldestKey = key;
                    oldestTime = lastAccessTime[key];
                }
            }

            if (oldestKey != bytes32(0)) {
                keys[found] = oldestKey;
                timestamps[found] = oldestTime;
                found++;
            }
        }

        // Evict found entries
        for (uint256 i = 0; i < found; i++) {
            _removeEntry(keys[i]);
            emit CacheEvicted(keys[i], 2); // 2 = eviction due to size limit
        }
    }

    
    function _removeEntry(bytes32 key) internal {
        CacheEntry storage entry = cacheEntries[key];
        if (entry.isValid) {
            cacheStats.totalSize = cacheStats.totalSize.sub(entry.data.length);
            cacheStats.totalEntries = cacheStats.totalEntries.sub(1);
            cacheStats.evictedCount = cacheStats.evictedCount.add(1);
            
            delete cacheEntries[key];
            delete lastAccessTime[key];
        }
    }

    
    function _compressData(bytes memory data) internal pure returns (bytes memory compressedData) {
        // This is a simplified compression - in production, you'd use a proper compression algorithm
        if (data.length > 1024) {
            // Simple RLE compression for demonstration
            compressedData = new bytes(data.length);
            uint256 compressedIndex = 0;
            
            for (uint256 i = 0; i < data.length; i++) {
                uint256 count = 1;
                while (i + 1 < data.length && data[i] == data[i + 1] && count < 255) {
                    count++;
                    i++;
                }
                
                if (count > 3) {
                    compressedData[compressedIndex] = 0x00; // Marker for RLE
                    compressedData[compressedIndex + 1] = bytes1(uint8(count));
                    compressedData[compressedIndex + 2] = data[i];
                    compressedIndex += 3;
                } else {
                    for (uint256 j = 0; j < count; j++) {
                        compressedData[compressedIndex] = data[i - count + 1 + j];
                        compressedIndex++;
                    }
                }
            }
            
            // Resize to actual compressed size
            assembly {
                mstore(compressedData, compressedIndex)
            }
        } else {
            compressedData = data;
        }
    }

    
    function _decompressData(bytes memory compressedData) internal pure returns (bytes memory data) {
        // This is a simplified decompression - in production, you'd use a proper decompression algorithm
        data = new bytes(compressedData.length * 2); // Estimate size
        uint256 dataIndex = 0;
        
        for (uint256 i = 0; i < compressedData.length; i++) {
            if (compressedData[i] == 0x00 && i + 2 < compressedData.length) {
                // RLE marker found
                uint256 count = uint8(compressedData[i + 1]);
                bytes1 value = compressedData[i + 2];
                
                for (uint256 j = 0; j < count; j++) {
                    data[dataIndex] = value;
                    dataIndex++;
                }
                i += 2;
            } else {
                data[dataIndex] = compressedData[i];
                dataIndex++;
            }
        }
        
        // Resize to actual decompressed size
        assembly {
            mstore(data, dataIndex)
        }
    }

    
    function _calculateCompressionRatio(uint256 originalSize, uint256 compressedSize) internal pure returns (uint256 ratio) {
        if (originalSize == 0) return 0;
        return ((originalSize.sub(compressedSize)).mul(100)).div(originalSize);
    }
}
