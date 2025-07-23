// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@arbitrum/nitro-contracts/src/precompiles/ArbGasInfo.sol";

/**
 * @title DistributedCache
 * @dev Sistema de caché distribuido optimizado para Arbitrum
 */
contract DistributedCache is AccessControl, ReentrancyGuard, Pausable {
    bytes32 public constant CACHE_MANAGER_ROLE = keccak256("CACHE_MANAGER_ROLE");
    
    // Precompilados de Arbitrum
    ArbGasInfo constant arbGasInfo = ArbGasInfo(address(0x6c));
    
    // Estructuras
    struct CacheEntry {
        bytes data;
        uint256 timestamp;
        uint256 expiresAt;
        address owner;
        bool isCompressed;
        uint256 accessCount;
        uint256 size;
    }

    struct CacheStats {
        uint256 hits;
        uint256 misses;
        uint256 totalSize;
        uint256 entryCount;
        uint256 lastCleanup;
    }

    struct CacheConfig {
        uint256 maxEntrySize;
        uint256 maxTotalSize;
        uint256 defaultTTL;
        uint256 cleanupThreshold;
        uint256 compressionThreshold;
    }

    // Mappings
    mapping(bytes32 => CacheEntry) public entries;
    mapping(address => uint256) public userStorage;
    mapping(address => bytes32[]) public userKeys;
    mapping(bytes32 => bool) public isEvicted;

    // Configuración
    CacheConfig public config;
    CacheStats public stats;

    // Eventos
    event CacheSet(bytes32 indexed key, address indexed owner, uint256 size, uint256 expiresAt);
    event CacheGet(bytes32 indexed key, address indexed requester, bool hit);
    event CacheEvict(bytes32 indexed key, string reason);
    event CacheCleanup(uint256 entriesRemoved, uint256 bytesFreed);
    event ConfigUpdated(string parameter, uint256 value);
    event StatsReset();

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(CACHE_MANAGER_ROLE, msg.sender);

        // Configuración inicial
        config = CacheConfig({
            maxEntrySize: 100 * 1024, // 100KB
            maxTotalSize: 10 * 1024 * 1024, // 10MB
            defaultTTL: 1 hours,
            cleanupThreshold: 80, // 80% de uso
            compressionThreshold: 1024 // 1KB
        });

        // Estadísticas iniciales
        stats = CacheStats({
            hits: 0,
            misses: 0,
            totalSize: 0,
            entryCount: 0,
            lastCleanup: block.timestamp
        });
    }

    /**
     * @dev Almacena datos en caché
     */
    function set(
        bytes32 key,
        bytes calldata data,
        uint256 ttl
    ) external nonReentrant whenNotPaused returns (bool) {
        require(data.length > 0, "Empty data");
        require(data.length <= config.maxEntrySize, "Data too large");
        require(!isEvicted[key], "Key evicted");

        // Limpiar entrada anterior si existe
        if (entries[key].size > 0) {
            stats.totalSize -= entries[key].size;
            stats.entryCount--;
        }

        // Verificar espacio disponible
        require(stats.totalSize + data.length <= config.maxTotalSize, "Cache full");

        // Comprimir si es necesario
        bool shouldCompress = data.length >= config.compressionThreshold;
        bytes memory processedData = shouldCompress ? _compress(data) : data;

        // Almacenar entrada
        entries[key] = CacheEntry({
            data: processedData,
            timestamp: block.timestamp,
            expiresAt: block.timestamp + (ttl > 0 ? ttl : config.defaultTTL),
            owner: msg.sender,
            isCompressed: shouldCompress,
            accessCount: 0,
            size: processedData.length
        });

        // Actualizar estadísticas
        stats.totalSize += processedData.length;
        stats.entryCount++;
        userStorage[msg.sender] += processedData.length;
        userKeys[msg.sender].push(key);

        // Ejecutar limpieza si es necesario
        if (_shouldCleanup()) {
            _cleanup();
        }

        emit CacheSet(key, msg.sender, processedData.length, entries[key].expiresAt);
        return true;
    }

    /**
     * @dev Recupera datos de caché
     */
    function get(bytes32 key) external view returns (
        bytes memory data,
        bool exists,
        bool expired
    ) {
        CacheEntry storage entry = entries[key];
        
        if (entry.size == 0 || isEvicted[key]) {
            stats.misses++;
            return (new bytes(0), false, false);
        }

        bool isExpired = block.timestamp >= entry.expiresAt;
        if (isExpired) {
            stats.misses++;
            return (new bytes(0), true, true);
        }

        stats.hits++;
        entry.accessCount++;

        return (
            entry.isCompressed ? _decompress(entry.data) : entry.data,
            true,
            false
        );
    }

    /**
     * @dev Almacena múltiples entradas en batch
     */
    function setBatch(
        bytes32[] calldata keys,
        bytes[] calldata dataArray,
        uint256[] calldata ttls
    ) external nonReentrant whenNotPaused returns (bool[] memory) {
        require(
            keys.length == dataArray.length && keys.length == ttls.length,
            "Array length mismatch"
        );

        bool[] memory results = new bool[](keys.length);
        for (uint256 i = 0; i < keys.length; i++) {
            try this.set(keys[i], dataArray[i], ttls[i]) returns (bool success) {
                results[i] = success;
            } catch {
                results[i] = false;
            }
        }

        return results;
    }

    /**
     * @dev Recupera múltiples entradas en batch
     */
    function getBatch(
        bytes32[] calldata keys
    ) external view returns (
        bytes[] memory dataArray,
        bool[] memory exists,
        bool[] memory expired
    ) {
        dataArray = new bytes[](keys.length);
        exists = new bool[](keys.length);
        expired = new bool[](keys.length);

        for (uint256 i = 0; i < keys.length; i++) {
            (dataArray[i], exists[i], expired[i]) = this.get(keys[i]);
        }

        return (dataArray, exists, expired);
    }

    /**
     * @dev Elimina una entrada de caché
     */
    function evict(bytes32 key) external {
        require(
            entries[key].owner == msg.sender || hasRole(CACHE_MANAGER_ROLE, msg.sender),
            "Not authorized"
        );

        _evict(key, "Manual eviction");
    }

    /**
     * @dev Elimina múltiples entradas en batch
     */
    function evictBatch(bytes32[] calldata keys) external {
        for (uint256 i = 0; i < keys.length; i++) {
            if (entries[keys[i]].owner == msg.sender || hasRole(CACHE_MANAGER_ROLE, msg.sender)) {
                _evict(keys[i], "Batch eviction");
            }
        }
    }

    /**
     * @dev Limpia entradas expiradas
     */
    function cleanup() external onlyRole(CACHE_MANAGER_ROLE) {
        _cleanup();
    }

    /**
     * @dev Función interna para limpieza
     */
    function _cleanup() internal {
        uint256 entriesRemoved = 0;
        uint256 bytesFreed = 0;

        // Primero eliminar entradas expiradas
        bytes32[] memory allKeys = _getAllKeys();
        for (uint256 i = 0; i < allKeys.length; i++) {
            CacheEntry storage entry = entries[allKeys[i]];
            if (block.timestamp >= entry.expiresAt) {
                bytesFreed += entry.size;
                _evict(allKeys[i], "Expired");
                entriesRemoved++;
            }
        }

        // Si aún necesitamos espacio, eliminar por LRU
        if (_shouldCleanup()) {
            bytes32[] memory lruKeys = _getLRUKeys(20); // Eliminar 20 entradas menos usadas
            for (uint256 i = 0; i < lruKeys.length && _shouldCleanup(); i++) {
                bytesFreed += entries[lruKeys[i]].size;
                _evict(lruKeys[i], "LRU");
                entriesRemoved++;
            }
        }

        stats.lastCleanup = block.timestamp;
        emit CacheCleanup(entriesRemoved, bytesFreed);
    }

    /**
     * @dev Elimina una entrada
     */
    function _evict(bytes32 key, string memory reason) internal {
        CacheEntry storage entry = entries[key];
        if (entry.size > 0) {
            stats.totalSize -= entry.size;
            stats.entryCount--;
            userStorage[entry.owner] -= entry.size;
            isEvicted[key] = true;
            delete entries[key];
            emit CacheEvict(key, reason);
        }
    }

    /**
     * @dev Verifica si se necesita limpieza
     */
    function _shouldCleanup() internal view returns (bool) {
        return (stats.totalSize * 100) / config.maxTotalSize >= config.cleanupThreshold;
    }

    /**
     * @dev Obtiene todas las claves
     */
    function _getAllKeys() internal view returns (bytes32[] memory) {
        bytes32[] memory keys = new bytes32[](stats.entryCount);
        uint256 index = 0;
        
        address[] memory users = _getAllUsers();
        for (uint256 i = 0; i < users.length; i++) {
            bytes32[] storage userKeyList = userKeys[users[i]];
            for (uint256 j = 0; j < userKeyList.length; j++) {
                if (!isEvicted[userKeyList[j]] && entries[userKeyList[j]].size > 0) {
                    keys[index++] = userKeyList[j];
                }
            }
        }

        return keys;
    }

    /**
     * @dev Obtiene claves menos usadas
     */
    function _getLRUKeys(uint256 count) internal view returns (bytes32[] memory) {
        bytes32[] memory allKeys = _getAllKeys();
        bytes32[] memory lruKeys = new bytes32[](count);
        uint256[] memory accessCounts = new uint256[](allKeys.length);

        // Obtener conteos de acceso
        for (uint256 i = 0; i < allKeys.length; i++) {
            accessCounts[i] = entries[allKeys[i]].accessCount;
        }

        // Ordenar por conteo de acceso (bubble sort simplificado)
        for (uint256 i = 0; i < count && i < allKeys.length; i++) {
            uint256 minIndex = i;
            for (uint256 j = i + 1; j < allKeys.length; j++) {
                if (accessCounts[j] < accessCounts[minIndex]) {
                    minIndex = j;
                }
            }
            if (minIndex != i) {
                (allKeys[i], allKeys[minIndex]) = (allKeys[minIndex], allKeys[i]);
                (accessCounts[i], accessCounts[minIndex]) = (accessCounts[minIndex], accessCounts[i]);
            }
            lruKeys[i] = allKeys[i];
        }

        return lruKeys;
    }

    /**
     * @dev Obtiene todos los usuarios
     */
    function _getAllUsers() internal view returns (address[] memory) {
        address[] memory users = new address[](stats.entryCount);
        uint256 count = 0;
        
        bytes32[] memory allKeys = _getAllKeys();
        for (uint256 i = 0; i < allKeys.length; i++) {
            address owner = entries[allKeys[i]].owner;
            bool found = false;
            for (uint256 j = 0; j < count; j++) {
                if (users[j] == owner) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                users[count++] = owner;
            }
        }

        // Reducir array al tamaño real
        address[] memory result = new address[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = users[i];
        }

        return result;
    }

    /**
     * @dev Comprime datos (mock - en producción usar una librería real)
     */
    function _compress(bytes memory data) internal pure returns (bytes memory) {
        // Mock compression - en producción usar zlib o similar
        return data;
    }

    /**
     * @dev Descomprime datos (mock - en producción usar una librería real)
     */
    function _decompress(bytes memory data) internal pure returns (bytes memory) {
        // Mock decompression - en producción usar zlib o similar
        return data;
    }

    /**
     * @dev Actualiza configuración
     */
    function updateConfig(
        uint256 _maxEntrySize,
        uint256 _maxTotalSize,
        uint256 _defaultTTL,
        uint256 _cleanupThreshold,
        uint256 _compressionThreshold
    ) external onlyRole(CACHE_MANAGER_ROLE) {
        require(_maxEntrySize > 0, "Invalid max entry size");
        require(_maxTotalSize > _maxEntrySize, "Invalid max total size");
        require(_cleanupThreshold <= 100, "Invalid cleanup threshold");

        config.maxEntrySize = _maxEntrySize;
        config.maxTotalSize = _maxTotalSize;
        config.defaultTTL = _defaultTTL;
        config.cleanupThreshold = _cleanupThreshold;
        config.compressionThreshold = _compressionThreshold;

        emit ConfigUpdated("maxEntrySize", _maxEntrySize);
        emit ConfigUpdated("maxTotalSize", _maxTotalSize);
        emit ConfigUpdated("defaultTTL", _defaultTTL);
        emit ConfigUpdated("cleanupThreshold", _cleanupThreshold);
        emit ConfigUpdated("compressionThreshold", _compressionThreshold);
    }

    /**
     * @dev Resetea estadísticas
     */
    function resetStats() external onlyRole(CACHE_MANAGER_ROLE) {
        stats.hits = 0;
        stats.misses = 0;
        emit StatsReset();
    }

    /**
     * @dev Obtiene estadísticas de usuario
     */
    function getUserStats(
        address user
    ) external view returns (
        uint256 storageUsed,
        uint256 keyCount,
        bytes32[] memory keys
    ) {
        return (
            userStorage[user],
            userKeys[user].length,
            userKeys[user]
        );
    }

    /**
     * @dev Pausa el contrato
     */
    function pause() external onlyRole(CACHE_MANAGER_ROLE) {
        _pause();
    }

    /**
     * @dev Despausa el contrato
     */
    function unpause() external onlyRole(CACHE_MANAGER_ROLE) {
        _unpause();
    }
} 