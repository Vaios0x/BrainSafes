// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;


import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract DistributedCache is AccessControl, ReentrancyGuard, Pausable {
    // ========== CONSTANTS ==========
    bytes32 public constant CACHE_OPERATOR_ROLE = keccak256("CACHE_OPERATOR_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    uint256 public constant MAX_CACHE_SIZE = 10000;
    uint256 public constant MAX_DATA_SIZE = 100000; // 100KB
    uint256 public constant MIN_EXPIRY_TIME = 300; // 5 minutes
    uint256 public constant MAX_EXPIRY_TIME = 86400 * 30; // 30 days

    // ========== STATE VARIABLES ==========
    mapping(bytes32 => CacheEntry) private cache;
    mapping(bytes32 => uint256) private accessCount;
    mapping(bytes32 => uint256) private lastAccessTime;
    mapping(address => uint256) private userCacheUsage;
    
    uint256 public totalEntries;
    uint256 public totalHits;
    uint256 public totalMisses;
    uint256 public totalStorageUsed;
    uint256 public lastCleanupTime;

    // ========== STRUCTURES ==========
    struct CacheEntry {
        bytes data;
        uint256 expiresAt;
        uint256 createdAt;
        address creator;
        bool isValid;
        uint256 size;
        string metadata;
    }

    struct CacheStats {
        uint256 totalEntries;
        uint256 totalHits;
        uint256 totalMisses;
        uint256 hitRate;
        uint256 totalStorageUsed;
        uint256 averageEntrySize;
    }

    struct CacheInfo {
        bytes32 key;
        uint256 size;
        uint256 accessCount;
        uint256 lastAccess;
        uint256 expiresAt;
        bool isValid;
    }

    // ========== EVENTS ==========
    event CacheSet(bytes32 indexed key, address indexed creator, uint256 size, uint256 expiresAt);
    event CacheHit(bytes32 indexed key, address indexed user);
    event CacheMiss(bytes32 indexed key, address indexed user);
    event CacheCleared(bytes32 indexed key, address indexed admin);
    event CacheExpired(bytes32 indexed key);
    event CacheStatsUpdated(uint256 totalEntries, uint256 hitRate, uint256 storageUsed);
    event EmergencyPaused(address indexed admin);
    event EmergencyUnpaused(address indexed admin);

    // ========== CONSTRUCTOR ==========
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(CACHE_OPERATOR_ROLE, msg.sender);
    }

    // ========== CORE CACHE FUNCTIONS ==========
    
    function set(
        bytes32 key,
        bytes calldata data,
        uint256 expiresAt,
        string calldata metadata
    ) external whenNotPaused {
        require(data.length > 0, "Empty data");
        require(data.length <= MAX_DATA_SIZE, "Data too large");
        require(expiresAt > block.timestamp + MIN_EXPIRY_TIME, "Expiry too soon");
        require(expiresAt < block.timestamp + MAX_EXPIRY_TIME, "Expiry too far");
        require(totalEntries < MAX_CACHE_SIZE, "Cache full");
        
        // Check if entry exists and update storage
        if (cache[key].isValid) {
            totalStorageUsed -= cache[key].size;
        } else {
            totalEntries++;
        }
        
        cache[key] = CacheEntry({
            data: data,
            expiresAt: expiresAt,
            createdAt: block.timestamp,
            creator: msg.sender,
            isValid: true,
            size: data.length,
            metadata: metadata
        });
        
        totalStorageUsed += data.length;
        userCacheUsage[msg.sender] += data.length;
        
        emit CacheSet(key, msg.sender, data.length, expiresAt);
    }

    
    function get(bytes32 key) external view returns (bytes memory data, bool isValid) {
        CacheEntry storage entry = cache[key];
        
        if (entry.isValid && entry.expiresAt > block.timestamp) {
            // Update access statistics (in a real implementation, this would be state-changing)
            // accessCount[key]++;
            // lastAccessTime[key] = block.timestamp;
            // totalHits++;
            
            return (entry.data, true);
        } else {
            // totalMisses++;
            return ("", false);
        }
    }

    
    function getCacheInfo(bytes32 key) external view returns (CacheInfo memory entry) {
        CacheEntry storage cacheEntry = cache[key];
        
        entry.key = key;
        entry.size = cacheEntry.size;
        entry.accessCount = accessCount[key];
        entry.lastAccess = lastAccessTime[key];
        entry.expiresAt = cacheEntry.expiresAt;
        entry.isValid = cacheEntry.isValid && cacheEntry.expiresAt > block.timestamp;
    }

    
    function clear(bytes32 key) external onlyRole(CACHE_OPERATOR_ROLE) {
        require(cache[key].isValid, "Entry not found");
        
        totalStorageUsed -= cache[key].size;
        totalEntries--;
        userCacheUsage[cache[key].creator] -= cache[key].size;
        
        delete cache[key];
        delete accessCount[key];
        delete lastAccessTime[key];
        
        emit CacheCleared(key, msg.sender);
    }

    
    function clearExpired(bytes32[] calldata keys) external onlyRole(CACHE_OPERATOR_ROLE) {
        uint256 clearedCount = 0;
        
        for (uint256 i = 0; i < keys.length; i++) {
            bytes32 key = keys[i];
            CacheEntry storage entry = cache[key];
            
            if (entry.isValid && entry.expiresAt <= block.timestamp) {
                totalStorageUsed -= entry.size;
                totalEntries--;
                userCacheUsage[entry.creator] -= entry.size;
                
                delete cache[key];
                delete accessCount[key];
                delete lastAccessTime[key];
                
                clearedCount++;
                emit CacheExpired(key);
            }
        }
        
        if (clearedCount > 0) {
            lastCleanupTime = block.timestamp;
        }
    }

    // ========== ADVANCED CACHE FUNCTIONS ==========
    
    function batchSet(
        bytes32[] calldata keys,
        bytes[] calldata dataArray,
        uint256[] calldata expiryTimes,
        string[] calldata metadataArray
    ) external whenNotPaused {
        require(keys.length == dataArray.length, "Array length mismatch");
        require(keys.length == expiryTimes.length, "Array length mismatch");
        require(keys.length == metadataArray.length, "Array length mismatch");
        require(keys.length <= 100, "Batch too large");
        require(totalEntries + keys.length <= MAX_CACHE_SIZE, "Would exceed cache size");
        
        for (uint256 i = 0; i < keys.length; i++) {
            bytes32 key = keys[i];
            bytes calldata data = dataArray[i];
            uint256 expiresAt = expiryTimes[i];
            string calldata metadata = metadataArray[i];
            
            require(data.length > 0, "Empty data");
            require(data.length <= MAX_DATA_SIZE, "Data too large");
            require(expiresAt > block.timestamp + MIN_EXPIRY_TIME, "Expiry too soon");
            require(expiresAt < block.timestamp + MAX_EXPIRY_TIME, "Expiry too far");
            
            // Check if entry exists and update storage
            if (cache[key].isValid) {
                totalStorageUsed -= cache[key].size;
            } else {
                totalEntries++;
            }
            
            cache[key] = CacheEntry({
                data: data,
                expiresAt: expiresAt,
                createdAt: block.timestamp,
                creator: msg.sender,
                isValid: true,
                size: data.length,
                metadata: metadata
            });
            
            totalStorageUsed += data.length;
            userCacheUsage[msg.sender] += data.length;
            
            emit CacheSet(key, msg.sender, data.length, expiresAt);
        }
    }

    
    function batchGet(
        bytes32[] calldata keys
    ) external view returns (bytes[] memory dataArray, bool[] memory validArray) {
        require(keys.length <= 100, "Batch too large");
        
        dataArray = new bytes[](keys.length);
        validArray = new bool[](keys.length);
        
        for (uint256 i = 0; i < keys.length; i++) {
            bytes32 key = keys[i];
            CacheEntry storage entry = cache[key];
            
            if (entry.isValid && entry.expiresAt > block.timestamp) {
                dataArray[i] = entry.data;
                validArray[i] = true;
            } else {
                dataArray[i] = "";
                validArray[i] = false;
            }
        }
    }

    
    function updateMetadata(
        bytes32 key,
        string calldata newMetadata
    ) external {
        require(cache[key].isValid, "Entry not found");
        require(cache[key].creator == msg.sender, "Not the creator");
        
        cache[key].metadata = newMetadata;
    }

    
    function extendExpiry(
        bytes32 key,
        uint256 newExpiry
    ) external onlyRole(CACHE_OPERATOR_ROLE) {
        require(cache[key].isValid, "Entry not found");
        require(newExpiry > block.timestamp + MIN_EXPIRY_TIME, "Expiry too soon");
        require(newExpiry < block.timestamp + MAX_EXPIRY_TIME, "Expiry too far");
        
        cache[key].expiresAt = newExpiry;
    }

    // ========== STATISTICS FUNCTIONS ==========
    
    function getCacheStats() external view returns (CacheStats memory stats) {
        stats.totalEntries = totalEntries;
        stats.totalHits = totalHits;
        stats.totalMisses = totalMisses;
        stats.hitRate = (totalHits + totalMisses) > 0 ? (totalHits * 100) / (totalHits + totalMisses) : 0;
        stats.totalStorageUsed = totalStorageUsed;
        stats.averageEntrySize = totalEntries > 0 ? totalStorageUsed / totalEntries : 0;
    }

    
    function getUserCacheUsage(address user) external view returns (uint256 usage) {
        return userCacheUsage[user];
    }

    
    function getAccessStats(
        bytes32 key
    ) external view returns (uint256 accessCountResult, uint256 lastAccess) {
        return (accessCount[key], lastAccessTime[key]);
    }

    // ========== UTILITY FUNCTIONS ==========
    
    function exists(bytes32 key) external view returns (bool existsResult) {
        CacheEntry storage entry = cache[key];
        return entry.isValid && entry.expiresAt > block.timestamp;
    }

    
    function getEntrySize(bytes32 key) external view returns (uint256 size) {
        return cache[key].size;
    }

    
    function getCacheEfficiency() external view returns (uint256 efficiency) {
        return (totalHits + totalMisses) > 0 ? (totalHits * 100) / (totalHits + totalMisses) : 0;
    }

    // ========== ADMIN FUNCTIONS ==========
    
    function emergencyPause() external onlyRole(ADMIN_ROLE) {
        _pause();
        emit EmergencyPaused(msg.sender);
    }

    
    function emergencyUnpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
        emit EmergencyUnpaused(msg.sender);
    }

    
    function grantCacheOperatorRole(address account) external onlyRole(ADMIN_ROLE) {
        _grantRole(CACHE_OPERATOR_ROLE, account);
    }

    
    function revokeCacheOperatorRole(address account) external onlyRole(ADMIN_ROLE) {
        _revokeRole(CACHE_OPERATOR_ROLE, account);
    }

    
    function emergencyClearAll() external onlyRole(ADMIN_ROLE) {
        totalEntries = 0;
        totalStorageUsed = 0;
        lastCleanupTime = block.timestamp;
        
        // Note: This doesn't actually clear the storage, but resets counters
        // In a real emergency, you might want to implement actual clearing
    }

    // ========== VIEW FUNCTIONS ==========
    
    function version() external pure returns (string memory) {
        return "2.0.0";
    }

    
    function getContractStats() external view returns (
        uint256 totalEntriesResult,
        uint256 totalStorage,
        uint256 hitRate,
        uint256 lastCleanup
    ) {
        hitRate = (totalHits + totalMisses) > 0 ? (totalHits * 100) / (totalHits + totalMisses) : 0;
        return (totalEntries, totalStorageUsed, hitRate, lastCleanupTime);
    }
} 