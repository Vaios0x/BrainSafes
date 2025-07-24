// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title DistributedCacheV2
 * @dev Cache distribuido mejorado para BrainSafes (multi-nodo, cross-chain, invalidación inteligente)
 * @notice Permite almacenamiento temporal eficiente, sincronización entre nodos y contratos, e invalidación flexible
 * @custom:security-contact security@brainsafes.com
 */
contract DistributedCacheV2 is AccessControl, Pausable, ReentrancyGuard {
    bytes32 public constant CACHE_ADMIN = keccak256("CACHE_ADMIN");
    bytes32 public constant CACHE_NODE = keccak256("CACHE_NODE");
    bytes32 public constant SYNC_OPERATOR = keccak256("SYNC_OPERATOR");

    struct CacheEntry {
        bytes32 key;
        bytes value;
        uint256 expiresAt;
        address node;
        bool valid;
        uint256 version;
    }

    mapping(bytes32 => CacheEntry) public cache;
    mapping(bytes32 => uint256) public keyVersions;
    mapping(address => bool) public activeNodes;
    uint256 public nodeCount;

    event CacheSet(bytes32 indexed key, address indexed node, uint256 version, uint256 expiresAt);
    event CacheInvalidated(bytes32 indexed key, address indexed node, uint256 version);
    event CacheSynced(bytes32 indexed key, address indexed fromNode, address indexed toNode, uint256 version);
    event NodeAdded(address indexed node);
    event NodeRemoved(address indexed node);

    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(CACHE_ADMIN, msg.sender);
    }

    function addNode(address node) external onlyRole(CACHE_ADMIN) {
        require(node != address(0), "Invalid node");
        require(!activeNodes[node], "Already a node");
        activeNodes[node] = true;
        nodeCount++;
        _setupRole(CACHE_NODE, node);
        emit NodeAdded(node);
    }

    function removeNode(address node) external onlyRole(CACHE_ADMIN) {
        require(activeNodes[node], "Not a node");
        activeNodes[node] = false;
        nodeCount--;
        _revokeRole(CACHE_NODE, node);
        emit NodeRemoved(node);
    }

    function set(bytes32 key, bytes memory value, uint256 expiresAt) external onlyRole(CACHE_NODE) whenNotPaused {
        require(expiresAt > block.timestamp, "Invalid expiration");
        uint256 version = keyVersions[key] + 1;
        cache[key] = CacheEntry({
            key: key,
            value: value,
            expiresAt: expiresAt,
            node: msg.sender,
            valid: true,
            version: version
        });
        keyVersions[key] = version;
        emit CacheSet(key, msg.sender, version, expiresAt);
    }

    function get(bytes32 key) external view returns (bytes memory value, bool valid, uint256 expiresAt, uint256 version) {
        CacheEntry storage entry = cache[key];
        if (entry.expiresAt < block.timestamp || !entry.valid) {
            return ("", false, entry.expiresAt, entry.version);
        }
        return (entry.value, true, entry.expiresAt, entry.version);
    }

    function invalidate(bytes32 key) external onlyRole(CACHE_NODE) whenNotPaused {
        CacheEntry storage entry = cache[key];
        require(entry.valid, "Already invalid");
        entry.valid = false;
        emit CacheInvalidated(key, msg.sender, entry.version);
    }

    function syncCache(bytes32 key, address toNode) external onlyRole(SYNC_OPERATOR) whenNotPaused {
        require(activeNodes[toNode], "Target not a node");
        CacheEntry storage entry = cache[key];
        require(entry.valid, "Entry invalid");
        // Simular sincronización (en producción, usar eventos cross-chain)
        emit CacheSynced(key, entry.node, toNode, entry.version);
    }

    function pause() external onlyRole(CACHE_ADMIN) {
        _pause();
    }
    function unpause() external onlyRole(CACHE_ADMIN) {
        _unpause();
    }
} 