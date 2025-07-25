// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "../bridge/L1L2MessageHandler.sol";
import "../optimizations/StorageOptimizer.sol";
import "../optimizations/AddressCompressor.sol";
import "../cache/DistributedCache.sol";
import "../monitoring/EnhancedMonitoring.sol";

contract IntegrationTests is AccessControl {
    // Contratos a probar
    L1L2MessageHandler public messageHandler;
    StorageOptimizer public storageOptimizer;
    AddressCompressor public addressCompressor;
    DistributedCache public cache;
    EnhancedMonitoring public monitoring;

    // Variables de prueba
    bytes32 public constant TESTER_ROLE = keccak256("TESTER_ROLE");
    uint256 public testCounter;
    mapping(bytes32 => bool) public testResults;
    mapping(bytes32 => string) public testErrors;

    // Eventos
    event TestStarted(bytes32 indexed testId, string testName);
    event TestCompleted(bytes32 indexed testId, bool success, string error);
    event TestSuiteCompleted(uint256 total, uint256 passed, uint256 failed);

    struct TestResult {
        bool success;
        string error;
        uint256 gasUsed;
        uint256 timestamp;
    }

    mapping(bytes32 => TestResult) public results;

    constructor(
        address _messageHandler,
        address _storageOptimizer,
        address _addressCompressor,
        address _cache,
        address _monitoring
    ) {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(TESTER_ROLE, msg.sender);

        messageHandler = L1L2MessageHandler(_messageHandler);
        storageOptimizer = StorageOptimizer(_storageOptimizer);
        addressCompressor = AddressCompressor(_addressCompressor);
        cache = DistributedCache(_cache);
        monitoring = EnhancedMonitoring(_monitoring);
    }

    function testCrossChainFlow() external onlyRole(TESTER_ROLE) {
        bytes32 testId = keccak256(abi.encodePacked("crosschain", block.timestamp));
        emit TestStarted(testId, "Cross-chain Message Flow");

        uint256 initialGas = gasleft();
        bool success = true;
        string memory error = "";

        try this.runCrossChainTests() {
            // Test pasó
        } catch Error(string memory err) {
            success = false;
            error = err;
        } catch (bytes memory) {
            success = false;
            error = "Unknown error in cross-chain tests";
        }

        results[testId] = TestResult({
            success: success,
            error: error,
            gasUsed: initialGas - gasleft(),
            timestamp: block.timestamp
        });

        emit TestCompleted(testId, success, error);
    }

    function testOptimizations() external onlyRole(TESTER_ROLE) {
        bytes32 testId = keccak256(abi.encodePacked("optimizations", block.timestamp));
        emit TestStarted(testId, "Storage and Gas Optimizations");

        uint256 initialGas = gasleft();
        bool success = true;
        string memory error = "";

        try this.runOptimizationTests() {
            // Test pasó
        } catch Error(string memory err) {
            success = false;
            error = err;
        } catch (bytes memory) {
            success = false;
            error = "Unknown error in optimization tests";
        }

        results[testId] = TestResult({
            success: success,
            error: error,
            gasUsed: initialGas - gasleft(),
            timestamp: block.timestamp
        });

        emit TestCompleted(testId, success, error);
    }

    function runCrossChainTests() external {
        // Test 1: Envío de mensaje L1->L2
        bytes32 messageId = messageHandler.sendL2Message(
            address(this),
            abi.encodeWithSignature("testCallback()"),
            1000000,
            1 gwei,
            1000000
        );
        require(messageId != bytes32(0), "Message sending failed");

        // Test 2: Compresión de direcciones
        uint256 compressed = addressCompressor.compressAddress(address(this));
        require(compressed != 0, "Address compression failed");
        address decompressed = addressCompressor.decompressAddress(compressed);
        require(decompressed == address(this), "Address decompression failed");

        // Test 3: Verificación de mensaje
        bool verified = messageHandler.processL1Message(
            messageId,
            abi.encodeWithSignature("testCallback()"),
            keccak256("test")
        );
        require(verified, "Message verification failed");
    }

    function runOptimizationTests() external {
        // Test 1: Optimización de storage
        uint256 savedGas = storageOptimizer.optimizeStorageLayout(address(this));
        require(savedGas > 0, "No gas savings achieved");

        // Test 2: Compresión de slots
        bytes32[] memory keys = new bytes32[](1);
        keys[0] = keccak256("test");
        uint256[] memory savings = storageOptimizer.compressStorageSlots(keys);
        require(savings[0] > 0, "Slot compression failed");

        // Test 3: Cache distribuido
        bytes32 cacheKey = keccak256("testCache");
        cache.set(cacheKey, abi.encode("test"), block.timestamp + 1 hours);
        bytes memory cached = cache.get(cacheKey);
        require(cached.length > 0, "Cache operation failed");
    }

    function testMonitoring() external onlyRole(TESTER_ROLE) {
        bytes32 testId = keccak256(abi.encodePacked("monitoring", block.timestamp));
        emit TestStarted(testId, "System Monitoring");

        uint256 initialGas = gasleft();
        bool success = true;
        string memory error = "";

        try this.runMonitoringTests() {
            // Test pasó
        } catch Error(string memory err) {
            success = false;
            error = err;
        } catch (bytes memory) {
            success = false;
            error = "Unknown error in monitoring tests";
        }

        results[testId] = TestResult({
            success: success,
            error: error,
            gasUsed: initialGas - gasleft(),
            timestamp: block.timestamp
        });

        emit TestCompleted(testId, success, error);
    }

    function runMonitoringTests() external {
        // Test 1: Monitoreo de transacción
        bytes32 txHash = keccak256("testTx");
        monitoring.monitorTransaction(
            txHash,
            address(this),
            abi.encodeWithSignature("testCallback()")
        );

        // Test 2: Verificación de métricas
        (uint256 gasEstimate,,, ) = monitoring.getTransactionMetrics(txHash);
        require(gasEstimate > 0, "Transaction monitoring failed");

        // Test 3: Sistema de recuperación
        bool recovered = monitoring.retryMessage(txHash);
        require(recovered, "Transaction recovery failed");
    }

    function runFullTestSuite() external onlyRole(TESTER_ROLE) {
        uint256 totalTests = 0;
        uint256 passedTests = 0;

        // Cross-chain tests
        testCrossChainFlow();
        totalTests++;
        if (results[keccak256(abi.encodePacked("crosschain", block.timestamp))].success) {
            passedTests++;
        }

        // Optimization tests
        testOptimizations();
        totalTests++;
        if (results[keccak256(abi.encodePacked("optimizations", block.timestamp))].success) {
            passedTests++;
        }

        // Monitoring tests
        testMonitoring();
        totalTests++;
        if (results[keccak256(abi.encodePacked("monitoring", block.timestamp))].success) {
            passedTests++;
        }

        emit TestSuiteCompleted(totalTests, passedTests, totalTests - passedTests);
    }

    // Función de callback para pruebas
    function testCallback() external pure returns (bool) {
        return true;
    }

    // Funciones de consulta
    function getTestResult(bytes32 testId) external view returns (TestResult memory) {
        return results[testId];
    }

    function getTestSummary() external view returns (
        uint256 totalTests,
        uint256 passedTests,
        uint256 failedTests,
        uint256 averageGasUsed
    ) {
        bytes32[] memory testIds = new bytes32[](testCounter);
        uint256 totalGasUsed = 0;
        
        for (uint256 i = 0; i < testCounter; i++) {
            bytes32 testId = keccak256(abi.encodePacked("test", i));
            if (results[testId].success) passedTests++;
            totalGasUsed += results[testId].gasUsed;
        }

        return (
            testCounter,
            passedTests,
            testCounter - passedTests,
            testCounter > 0 ? totalGasUsed / testCounter : 0
        );
    }
} 