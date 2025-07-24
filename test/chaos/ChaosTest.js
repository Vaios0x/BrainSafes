const { ethers } = require("hardhat");
const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { FaultInjector } = require("./helpers/FaultInjector");

describe("BrainSafes Chaos Tests", function() {
    async function deployFixture() {
        const [owner, ...users] = await ethers.getSigners();
        
        const BrainSafes = await ethers.getContractFactory("BrainSafes");
        const brainSafes = await BrainSafes.deploy();
        
        const Education = await ethers.getContractFactory("EnhancedEducationSystem");
        const education = await Education.deploy(brainSafes.address);
        
        const Bridge = await ethers.getContractFactory("BrainSafesBridge");
        const bridge = await Bridge.deploy();
        
        const Oracle = await ethers.getContractFactory("MultiOracle");
        const oracle = await Oracle.deploy();
        
        return { brainSafes, education, bridge, oracle, owner, users };
    }

    describe("Network Chaos", function() {
        it("Should handle network latency spikes", async function() {
            const { brainSafes, users } = await loadFixture(deployFixture);
            const faultInjector = new FaultInjector();
            
            // Introducir latencia aleatoria
            await faultInjector.injectNetworkLatency({
                minLatency: 1000,
                maxLatency: 5000,
                duration: 60
            });

            // Intentar operaciones durante la latencia
            const tx = await brainSafes.connect(users[0]).registerUser(
                "Test User",
                "test@example.com",
                "ipfs://profile"
            );
            
            await tx.wait();
            
            const profile = await brainSafes.userProfiles(users[0].address);
            expect(profile.isActive).to.be.true;
        });

        it("Should recover from network partitions", async function() {
            const { brainSafes, education, users } = await loadFixture(deployFixture);
            const faultInjector = new FaultInjector();
            
            // Crear partición de red
            await faultInjector.createNetworkPartition({
                duration: 30,
                nodeGroups: [
                    [0, 1, 2],
                    [3, 4, 5]
                ]
            });

            // Intentar operaciones en ambos grupos
            const promises = users.slice(0, 6).map(async (user, index) => {
                try {
                    await brainSafes.connect(user).registerUser(
                        `User ${index}`,
                        `user${index}@example.com`,
                        `ipfs://profile/${index}`
                    );
                } catch (e) {
                    return false;
                }
                return true;
            });

            const results = await Promise.all(promises);
            
            // Verificar que algunas operaciones tuvieron éxito
            expect(results.filter(r => r).length).to.be.above(0);
            
            // Esperar reconexión
            await faultInjector.healNetworkPartition();
            
            // Verificar consistencia
            const totalUsers = await brainSafes.getTotalUsers();
            expect(totalUsers).to.equal(results.filter(r => r).length);
        });
    });

    describe("State Chaos", function() {
        it("Should handle corrupted state", async function() {
            const { brainSafes, education } = await loadFixture(deployFixture);
            const faultInjector = new FaultInjector();
            
            // Corromper estado
            await faultInjector.corruptState({
                contract: brainSafes.address,
                storage: {
                    slot: "0x1",
                    value: ethers.utils.randomBytes(32)
                }
            });

            // Intentar recuperación
            await brainSafes.runStateValidation();
            
            // Verificar recuperación
            const isValid = await brainSafes.isStateValid();
            expect(isValid).to.be.true;
        });

        it("Should recover from inconsistent state", async function() {
            const { brainSafes, education, bridge } = await loadFixture(deployFixture);
            const faultInjector = new FaultInjector();
            
            // Crear inconsistencia entre contratos
            await faultInjector.createStateInconsistency({
                contracts: [brainSafes, education, bridge],
                type: "counter_mismatch"
            });

            // Ejecutar reconciliación
            await brainSafes.reconcileState();
            
            // Verificar consistencia
            const [mainCount, eduCount, bridgeCount] = await Promise.all([
                brainSafes.getCounter(),
                education.getCounter(),
                bridge.getCounter()
            ]);
            
            expect(mainCount).to.equal(eduCount);
            expect(eduCount).to.equal(bridgeCount);
        });
    });

    describe("Resource Chaos", function() {
        it("Should handle out of memory conditions", async function() {
            const { brainSafes } = await loadFixture(deployFixture);
            const faultInjector = new FaultInjector();
            
            // Simular condición de memoria baja
            await faultInjector.limitResources({
                memory: "100MB"
            });

            // Intentar operación que requiere memoria
            const largeData = Array(10000).fill("x").join("");
            await brainSafes.processLargeData(largeData);
            
            // Verificar manejo correcto
            const stats = await brainSafes.getResourceStats();
            expect(stats.memoryErrors).to.equal(0);
        });

        it("Should handle CPU spikes", async function() {
            const { brainSafes, oracle } = await loadFixture(deployFixture);
            const faultInjector = new FaultInjector();
            
            // Generar carga CPU
            await faultInjector.injectCPULoad({
                percentage: 90,
                duration: 30
            });

            // Ejecutar operaciones intensivas
            const promises = Array(100).fill().map(() => 
                oracle.performComplexCalculation()
            );

            await Promise.all(promises);
            
            // Verificar rendimiento
            const metrics = await oracle.getPerformanceMetrics();
            expect(metrics.failedCalculations).to.equal(0);
        });
    });

    describe("Oracle Chaos", function() {
        it("Should handle oracle failures", async function() {
            const { oracle, education } = await loadFixture(deployFixture);
            const faultInjector = new FaultInjector();
            
            // Simular fallas de oracle
            await faultInjector.injectOracleFailures({
                failureRate: 0.3,
                duration: 60
            });

            // Intentar operaciones que requieren oracle
            const results = await Promise.all([
                education.getExternalData(),
                education.verifyCredential("0x123"),
                education.updatePrices()
            ]);
            
            // Verificar fallback
            results.forEach(result => {
                expect(result.usedFallback).to.be.true;
                expect(result.hasValue).to.be.true;
            });
        });

        it("Should handle oracle data corruption", async function() {
            const { oracle } = await loadFixture(deployFixture);
            const faultInjector = new FaultInjector();
            
            // Corromper datos de oracle
            await faultInjector.corruptOracleData({
                percentage: 20
            });

            // Verificar detección
            const validations = await oracle.validateDataIntegrity();
            expect(validations.corruptedData).to.be.false;
            expect(validations.usedRedundancy).to.be.true;
        });
    });

    describe("Bridge Chaos", function() {
        it("Should handle bridge disconnections", async function() {
            const { bridge } = await loadFixture(deployFixture);
            const faultInjector = new FaultInjector();
            
            // Simular desconexión de bridge
            await faultInjector.disconnectBridge({
                duration: 60
            });

            // Intentar transferencias
            const tx = await bridge.transferAsset(
                "0x123",
                "L2",
                { gasLimit: 1000000 }
            );
            
            // Verificar queue
            const queuedTx = await bridge.getQueuedTransactions();
            expect(queuedTx.length).to.equal(1);
            
            // Reconectar y verificar procesamiento
            await faultInjector.reconnectBridge();
            await bridge.processQueuedTransactions();
            
            const finalQueue = await bridge.getQueuedTransactions();
            expect(finalQueue.length).to.equal(0);
        });

        it("Should handle bridge state inconsistency", async function() {
            const { bridge } = await loadFixture(deployFixture);
            const faultInjector = new FaultInjector();
            
            // Crear inconsistencia L1-L2
            await faultInjector.createBridgeInconsistency({
                type: "balance_mismatch"
            });

            // Ejecutar reconciliación
            await bridge.reconcileL1L2State();
            
            // Verificar consistencia
            const [l1Balance, l2Balance] = await bridge.getBalances();
            expect(l1Balance).to.equal(l2Balance);
        });
    });
}); 