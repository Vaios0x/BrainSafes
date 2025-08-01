// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "../cache/DistributedCache.sol";

/**
 * @title BoLDSystem
 * @notice Blockchain-based Open Learning Data system for BrainSafes
 * @dev Manages open learning data and analytics
 * @author BrainSafes Team
 */
contract BoLDSystem is AccessControl, ReentrancyGuard {
    bytes32 public constant BOLD_ADMIN_ROLE = keccak256("BOLD_ADMIN_ROLE");
    bytes32 public constant DATA_PROVIDER_ROLE = keccak256("DATA_PROVIDER_ROLE");
    bytes32 public constant VALIDATOR_ROLE = keccak256("VALIDATOR_ROLE");

    struct DataChunk {
        bytes32 dataHash;
        uint256 size;
        uint256 timestamp;
        address provider;
        uint256 validations;
        bool isValid;
        uint256 compressionRatio;
        bytes32 originalDataHash;
    }

    struct ValidationInfo {
        address validator;
        bool approved;
        uint256 timestamp;
        bytes32 validationHash;
    }

    struct CompressionConfig {
        uint256 minCompressionRatio;
        uint256 maxChunkSize;
        uint256 minValidations;
        uint256 validationTimeout;
        bool compressionRequired;
    }

    // Estado del contrato
    mapping(bytes32 => DataChunk) public dataChunks;
    mapping(bytes32 => ValidationInfo[]) public validations;
    mapping(address => uint256) public validatorScores;
    CompressionConfig public config;
    DistributedCache public cache;

    // Contadores y estadísticas
    uint256 public totalChunks;
    uint256 public totalValidations;
    uint256 public totalDataSize;
    uint256 public avgCompressionRatio;

    // Eventos
    event DataChunkStored(bytes32 indexed dataHash, address indexed provider, uint256 size);
    event DataValidated(bytes32 indexed dataHash, address indexed validator, bool approved);
    event CompressionConfigUpdated(CompressionConfig config);
    event ValidationScoreUpdated(address indexed validator, uint256 newScore);
    event DataChunkInvalidated(bytes32 indexed dataHash, string reason);

    constructor(address _cache) {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(BOLD_ADMIN_ROLE, msg.sender);
        
        cache = DistributedCache(_cache);

        // Configuración inicial
        config = CompressionConfig({
            minCompressionRatio: 150, // 1.5x compresión mínima
            maxChunkSize: 1024 * 1024, // 1MB
            minValidations: 3,
            validationTimeout: 1 hours,
            compressionRequired: true
        });
    }

    /**
     * @dev Almacenar nuevo chunk de datos
     * @param data Raw data to be stored.
     * @param compressedData Compressed data.
     * @return bytes32 The hash of the stored data chunk.
     */
    function storeDataChunk(
        bytes calldata data,
        bytes calldata compressedData
    ) external onlyRole(DATA_PROVIDER_ROLE) returns (bytes32) {
        require(data.length > 0, "Empty data");
        require(data.length <= config.maxChunkSize, "Data too large");
        
        bytes32 originalHash = keccak256(data);
        bytes32 compressedHash = keccak256(compressedData);
        
        require(!dataChunks[compressedHash].isValid, "Data already exists");

        // Calcular ratio de compresión
        uint256 compressionRatio = (data.length * 100) / compressedData.length;
        require(
            !config.compressionRequired || compressionRatio >= config.minCompressionRatio,
            "Insufficient compression"
        );

        // Almacenar chunk
        dataChunks[compressedHash] = DataChunk({
            dataHash: compressedHash,
            size: compressedData.length,
            timestamp: block.timestamp,
            provider: msg.sender,
            validations: 0,
            isValid: true,
            compressionRatio: compressionRatio,
            originalDataHash: originalHash
        });

        // Actualizar estadísticas
        totalChunks++;
        totalDataSize += compressedData.length;
        avgCompressionRatio = ((avgCompressionRatio * (totalChunks - 1)) + compressionRatio) / totalChunks;

        // Cachear datos comprimidos
        bytes32 cacheKey = keccak256(abi.encodePacked("bold", compressedHash));
        cache.set(cacheKey, compressedData, block.timestamp + 7 days);

        emit DataChunkStored(compressedHash, msg.sender, compressedData.length);
        return compressedHash;
    }

    /**
     * @dev Validar chunk de datos
     * @param dataHash The hash of the data chunk to validate.
     * @param approve True to approve, false to reject.
     * @param validationHash A unique hash for the validation.
     */
    function validateDataChunk(
        bytes32 dataHash,
        bool approve,
        bytes32 validationHash
    ) external onlyRole(VALIDATOR_ROLE) {
        DataChunk storage chunk = dataChunks[dataHash];
        require(chunk.isValid, "Data chunk not found or invalid");
        require(
            block.timestamp <= chunk.timestamp + config.validationTimeout,
            "Validation timeout"
        );

        // Verificar que el validador no haya validado antes
        for (uint256 i = 0; i < validations[dataHash].length; i++) {
            require(
                validations[dataHash][i].validator != msg.sender,
                "Already validated"
            );
        }

        // Registrar validación
        validations[dataHash].push(ValidationInfo({
            validator: msg.sender,
            approved: approve,
            timestamp: block.timestamp,
            validationHash: validationHash
        }));

        chunk.validations++;
        totalValidations++;

        // Actualizar score del validador
        validatorScores[msg.sender]++;

        emit DataValidated(dataHash, msg.sender, approve);

        // Verificar si el chunk debe ser invalidado
        if (!approve && _shouldInvalidateChunk(dataHash)) {
            _invalidateChunk(dataHash, "Failed validation threshold");
        }
    }

    /**
     * @dev Verificar si un chunk debe ser invalidado
     * @param dataHash The hash of the data chunk to check.
     * @return bool True if the chunk should be invalidated, false otherwise.
     */
    function _shouldInvalidateChunk(bytes32 dataHash) internal view returns (bool) {
        uint256 rejections = 0;
        ValidationInfo[] storage chunkValidations = validations[dataHash];
        
        for (uint256 i = 0; i < chunkValidations.length; i++) {
            if (!chunkValidations[i].approved) {
                rejections++;
            }
        }

        return rejections >= config.minValidations;
    }

    /**
     * @dev Invalidar chunk de datos
     * @param dataHash The hash of the data chunk to invalidate.
     * @param reason The reason for invalidation.
     */
    function _invalidateChunk(bytes32 dataHash, string memory reason) internal {
        DataChunk storage chunk = dataChunks[dataHash];
        chunk.isValid = false;

        // Limpiar cache
        bytes32 cacheKey = keccak256(abi.encodePacked("bold", dataHash));
        cache.set(cacheKey, "", 0); // Expirar inmediatamente

        emit DataChunkInvalidated(dataHash, reason);
    }

    /**
     * @dev Actualizar configuración de compresión
     * @param _minCompressionRatio Minimum compression ratio.
     * @param _maxChunkSize Maximum chunk size.
     * @param _minValidations Minimum validations required.
     * @param _validationTimeout Validation timeout.
     * @param _compressionRequired True if compression is required.
     */
    function updateCompressionConfig(
        uint256 _minCompressionRatio,
        uint256 _maxChunkSize,
        uint256 _minValidations,
        uint256 _validationTimeout,
        bool _compressionRequired
    ) external onlyRole(BOLD_ADMIN_ROLE) {
        config = CompressionConfig({
            minCompressionRatio: _minCompressionRatio,
            maxChunkSize: _maxChunkSize,
            minValidations: _minValidations,
            validationTimeout: _validationTimeout,
            compressionRequired: _compressionRequired
        });

        emit CompressionConfigUpdated(config);
    }

    /**
     * @dev Obtener información de chunk
     * @param dataHash The hash of the data chunk to get info for.
     * @return chunk DataChunk struct.
     * @return chunkValidations Array of ValidationInfo.
     */
    function getDataChunkInfo(
        bytes32 dataHash
    ) external view returns (
        DataChunk memory chunk,
        ValidationInfo[] memory chunkValidations
    ) {
        chunk = dataChunks[dataHash];
        chunkValidations = validations[dataHash];
    }

    /**
     * @dev Verificar validez de datos
     * @param dataHash The hash of the data chunk to verify.
     * @param data The raw data to verify against.
     * @return bool True if data is valid, false otherwise.
     */
    function verifyData(
        bytes32 dataHash,
        bytes calldata data
    ) external view returns (bool) {
        DataChunk storage chunk = dataChunks[dataHash];
        if (!chunk.isValid) return false;

        return keccak256(data) == chunk.originalDataHash;
    }

    /**
     * @dev Obtener estadísticas del sistema
     * @return chunks Total number of chunks.
     * @return validationCount Total number of validations.
     * @return dataSize Total size of all data chunks.
     * @return compressionRatio Average compression ratio.
     */
    function getSystemStats() external view returns (
        uint256 chunks,
        uint256 validationCount,
        uint256 dataSize,
        uint256 compressionRatio
    ) {
        return (
            totalChunks,
            totalValidations,
            totalDataSize,
            avgCompressionRatio
        );
    }

    /**
     * @dev Obtener score de validador
     * @param validator The address of the validator.
     * @return uint256 The score of the validator.
     */
    function getValidatorScore(address validator) external view returns (uint256) {
        return validatorScores[validator];
    }
} 