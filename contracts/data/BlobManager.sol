// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "../cache/DistributedCache.sol";

/**
 * @title BlobManager
 * @notice Blob storage manager for BrainSafes
 * @dev Handles large data storage and retrieval
 * @author BrainSafes Team
 */
contract BlobManager is AccessControl, ReentrancyGuard {
    bytes32 public constant BLOB_ADMIN_ROLE = keccak256("BLOB_ADMIN_ROLE");
    bytes32 public constant BLOB_PROVIDER_ROLE = keccak256("BLOB_PROVIDER_ROLE");

    struct BlobConfig {
        uint256 maxBlobSize;
        uint256 minBlobSize;
        uint256 maxBlobsPerBlock;
        uint256 pricePerBlob;
        bool blobsEnabled;
    }

    struct BlobData {
        bytes32 blobHash;
        uint256 size;
        uint256 timestamp;
        address provider;
        bool isValid;
        uint256 expiryTime;
        uint256 usageCount;
    }

    struct BlobStats {
        uint256 totalBlobs;
        uint256 totalSize;
        uint256 activeBlobs;
        uint256 avgBlobSize;
        uint256 lastUpdate;
    }

    // Estado del contrato
    BlobConfig public config;
    mapping(bytes32 => BlobData) public blobs;
    mapping(address => uint256[]) public providerBlobs;
    BlobStats public stats;
    DistributedCache public cache;

    // Eventos
    event BlobConfigUpdated(BlobConfig config);
    event BlobStored(bytes32 indexed blobHash, address indexed provider);
    event BlobExpired(bytes32 indexed blobHash);
    event BlobsEnabled(bool enabled);
    event StatsUpdated(BlobStats stats);

    constructor(address _cache) {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(BLOB_ADMIN_ROLE, msg.sender);
        
        cache = DistributedCache(_cache);

        // Configuración inicial
        config = BlobConfig({
            maxBlobSize: 1024 * 1024, // 1MB
            minBlobSize: 1024,        // 1KB
            maxBlobsPerBlock: 10,
            pricePerBlob: 0.001 ether,
            blobsEnabled: false
        });

        // Inicializar estadísticas
        stats = BlobStats({
            totalBlobs: 0,
            totalSize: 0,
            activeBlobs: 0,
            avgBlobSize: 0,
            lastUpdate: block.timestamp
        });
    }

    /**
     * @dev Habilitar soporte para blobs
     */
    function enableBlobs(bool enable) external onlyRole(BLOB_ADMIN_ROLE) {
        config.blobsEnabled = enable;
        emit BlobsEnabled(enable);
    }

    /**
     * @dev Actualizar configuración de blobs
     */
    function updateBlobConfig(
        uint256 _maxBlobSize,
        uint256 _minBlobSize,
        uint256 _maxBlobsPerBlock,
        uint256 _pricePerBlob
    ) external onlyRole(BLOB_ADMIN_ROLE) {
        require(_maxBlobSize >= _minBlobSize, "Invalid sizes");
        
        config.maxBlobSize = _maxBlobSize;
        config.minBlobSize = _minBlobSize;
        config.maxBlobsPerBlock = _maxBlobsPerBlock;
        config.pricePerBlob = _pricePerBlob;

        emit BlobConfigUpdated(config);
    }

    /**
     * @dev Almacenar nuevo blob
     */
    function storeBlob(
        bytes calldata data,
        uint256 expiryTime
    ) external payable onlyRole(BLOB_PROVIDER_ROLE) returns (bytes32) {
        require(config.blobsEnabled, "Blobs not enabled");
        require(data.length >= config.minBlobSize, "Blob too small");
        require(data.length <= config.maxBlobSize, "Blob too large");
        require(msg.value >= config.pricePerBlob, "Insufficient payment");
        require(expiryTime > block.timestamp, "Invalid expiry time");

        bytes32 blobHash = keccak256(data);
        require(!blobs[blobHash].isValid, "Blob already exists");

        // Almacenar blob
        blobs[blobHash] = BlobData({
            blobHash: blobHash,
            size: data.length,
            timestamp: block.timestamp,
            provider: msg.sender,
            isValid: true,
            expiryTime: expiryTime,
            usageCount: 0
        });

        // Actualizar estadísticas
        stats.totalBlobs++;
        stats.totalSize += data.length;
        stats.activeBlobs++;
        stats.avgBlobSize = stats.totalSize / stats.totalBlobs;
        stats.lastUpdate = block.timestamp;

        // Cachear datos
        bytes32 cacheKey = keccak256(abi.encodePacked("blob", blobHash));
        cache.set(cacheKey, data, expiryTime);

        emit BlobStored(blobHash, msg.sender);
        emit StatsUpdated(stats);

        return blobHash;
    }

    /**
     * @dev Verificar blob
     */
    function verifyBlob(
        bytes32 blobHash,
        bytes calldata data
    ) external view returns (bool) {
        require(blobs[blobHash].isValid, "Blob not found");
        return keccak256(data) == blobHash;
    }

    /**
     * @dev Expirar blob
     */
    function expireBlob(bytes32 blobHash) external {
        BlobData storage blob = blobs[blobHash];
        require(blob.isValid, "Blob not found");
        require(
            msg.sender == blob.provider || hasRole(BLOB_ADMIN_ROLE, msg.sender),
            "Not authorized"
        );

        blob.isValid = false;
        stats.activeBlobs--;
        stats.lastUpdate = block.timestamp;

        emit BlobExpired(blobHash);
        emit StatsUpdated(stats);
    }

    /**
     * @dev Limpiar blobs expirados
     */
    function cleanupExpiredBlobs() external onlyRole(BLOB_ADMIN_ROLE) {
        bytes32[] memory blobHashes = _getAllBlobHashes();
        uint256 cleaned = 0;

        for (uint256 i = 0; i < blobHashes.length; i++) {
            BlobData storage blob = blobs[blobHashes[i]];
            if (blob.isValid && block.timestamp >= blob.expiryTime) {
                blob.isValid = false;
                cleaned++;
                emit BlobExpired(blobHashes[i]);
            }
        }

        if (cleaned > 0) {
            stats.activeBlobs -= cleaned;
            stats.lastUpdate = block.timestamp;
            emit StatsUpdated(stats);
        }
    }

    /**
     * @dev Obtener todos los hashes de blobs
     */
    function _getAllBlobHashes() internal pure returns (bytes32[] memory) {
        // Implementar obtención real de hashes
        return new bytes32[](0);
    }

    /**
     * @dev Obtener información de blob
     */
    function getBlobInfo(
        bytes32 blobHash
    ) external view returns (BlobData memory) {
        return blobs[blobHash];
    }

    /**
     * @dev Obtener blobs de proveedor
     */
    function getProviderBlobs(
        address provider
    ) external view returns (bytes32[] memory) {
        return _getBlobsByProvider(provider);
    }

    function _getBlobsByProvider(
        address provider
    ) internal pure returns (bytes32[] memory) {
        // Implementar obtención real de blobs por proveedor
        return new bytes32[](0);
    }

    /**
     * @dev Obtener estadísticas de blobs
     */
    function getBlobStats() external view returns (
        uint256 total,
        uint256 active,
        uint256 avgSize,
        uint256 totalStorage
    ) {
        return (
            stats.totalBlobs,
            stats.activeBlobs,
            stats.avgBlobSize,
            stats.totalSize
        );
    }

    /**
     * @dev Verificar disponibilidad de blob
     */
    function isBlobAvailable(bytes32 blobHash) external view returns (bool) {
        BlobData storage blob = blobs[blobHash];
        return blob.isValid && block.timestamp < blob.expiryTime;
    }
} 