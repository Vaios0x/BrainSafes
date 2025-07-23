// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IAIProcessor
 * @dev Interface for the Stylus-based AI Processor
 */
interface IAIProcessor {
    // Estructuras
    struct ModelConfig {
        uint256 modelId;
        uint256 inputSize;
        uint256 outputSize;
        uint256 batchSize;
        uint256 computeUnits;
        bool isActive;
    }

    struct InferenceResult {
        uint256 requestId;
        bytes inputHash;
        bytes output;
        uint256 confidence;
        uint256 timestamp;
        uint256 gasUsed;
    }

    struct ProcessingStats {
        uint256 totalRequests;
        uint256 totalGasUsed;
        uint256 avgProcessingTime;
        uint256 successRate;
    }

    // Eventos
    event BatchProcessed(uint256 modelId, uint32 count, uint64 gasUsed);

    // Funciones
    function registerModel(
        uint256 modelId,
        uint256 inputSize,
        uint256 outputSize,
        uint256 batchSize,
        uint256 computeUnits
    ) external returns (bool);

    function processInference(
        uint256 modelId,
        bytes calldata inputData
    ) external returns (InferenceResult memory);

    function batchProcess(
        uint256 modelId,
        bytes[] calldata inputs
    ) external returns (InferenceResult[] memory);

    function getModelConfig(
        uint256 modelId
    ) external view returns (ModelConfig memory);

    function getProcessingStats(
        uint256 modelId
    ) external view returns (ProcessingStats memory);
} 