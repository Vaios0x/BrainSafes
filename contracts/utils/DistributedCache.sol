// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title DistributedCache
 * @notice Distributed cache utility for BrainSafes
 * @dev Stores and retrieves expensive computation results for gas savings
 * @author BrainSafes Team
 */
contract DistributedCache {
    struct CacheEntry {
        bytes data;
        uint256 expiresAt;
    }

    mapping(bytes32 => CacheEntry) private cache;

    /// @notice Guarda un valor en el cache con expiración
    /// @param key Clave única del cache
    /// @param data Datos a almacenar
    /// @param expiresAt Timestamp de expiración
    function set(bytes32 key, bytes calldata data, uint256 expiresAt) external {
        require(expiresAt > block.timestamp, "Expiración inválida");
        cache[key] = CacheEntry(data, expiresAt);
    }

    /// @notice Obtiene un valor del cache si no ha expirado
    /// @param key Clave única del cache
    /// @return data Datos almacenados (vacío si expirado o no existe)
    function get(bytes32 key) external view returns (bytes memory data) {
        CacheEntry storage entry = cache[key];
        if (entry.expiresAt > block.timestamp) {
            return entry.data;
        }
        return "";
    }

    /// @notice Limpia una entrada del cache
    /// @param key Clave única del cache
    function clear(bytes32 key) external {
        delete cache[key];
    }

    /// @notice Limpia todas las entradas expiradas (requiere iteración off-chain para eficiencia en producción)
    /// @dev Esta función es solo de ejemplo, no iterar en producción en mainnet
    function clearExpired(bytes32[] calldata keys) external {
        for (uint256 i = 0; i < keys.length; i++) {
            if (cache[keys[i]].expiresAt <= block.timestamp) {
                delete cache[keys[i]];
            }
        }
    }
} 