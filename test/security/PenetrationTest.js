const { ethers } = require("hardhat");
const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { SecurityTester } = require("./helpers/SecurityTester");
const { FuzzTester } = require("./helpers/FuzzTester");

describe("BrainSafes Security Tests", function() {
    async function deployFixture() {
        const [owner, attacker, ...users] = await ethers.getSigners();
        
        const BrainSafes = await ethers.getContractFactory("BrainSafes");
        const brainSafes = await BrainSafes.deploy();
        
        const Education = await ethers.getContractFactory("EnhancedEducationSystem");
        const education = await Education.deploy(brainSafes.address);
        
        const Bridge = await ethers.getContractFactory("BrainSafesBridge");
        const bridge = await Bridge.deploy();
        
        return { brainSafes, education, bridge, owner, attacker, users };
    }

    describe("Access Control Tests", function() {
        it("Should prevent unauthorized role assignments", async function() {
            const { brainSafes, attacker } = await loadFixture(deployFixture);
            const securityTester = new SecurityTester();
            
            // Intentar asignar roles sin autorización
            await expect(
                securityTester.attemptRoleEscalation(brainSafes, attacker)
            ).to.be.revertedWith("AccessControl:");
        });

        it("Should prevent privilege escalation", async function() {
            const { brainSafes, education, attacker } = await loadFixture(deployFixture);
            const securityTester = new SecurityTester();
            
            // Intentar escalar privilegios
            const attacks = [
                () => securityTester.attemptDelegateCall(brainSafes, attacker),
                () => securityTester.attemptSelfdestruct(education, attacker),
                () => securityTester.attemptProxyManipulation(brainSafes, attacker)
            ];
            
            for (const attack of attacks) {
                await expect(attack()).to.be.reverted;
            }
        });
    });

    describe("Input Validation Tests", function() {
        it("Should validate and sanitize all inputs", async function() {
            const { brainSafes } = await loadFixture(deployFixture);
            const securityTester = new SecurityTester();
            
            // Probar inyecciones y entradas maliciosas
            const maliciousInputs = [
                "<script>alert('xss')</script>",
                "'; DROP TABLE users; --",
                "0x' UNION SELECT * FROM transactions; --",
                Buffer.alloc(1000000).toString()
            ];
            
            for (const input of maliciousInputs) {
                await expect(
                    securityTester.testInputSanitization(brainSafes, input)
                ).to.be.reverted;
            }
        });

        it("Should prevent integer overflows", async function() {
            const { brainSafes, education } = await loadFixture(deployFixture);
            const securityTester = new SecurityTester();
            
            // Intentar causar overflows
            await expect(
                securityTester.attemptIntegerOverflow(education)
            ).to.be.reverted;
            
            await expect(
                securityTester.attemptIntegerUnderflow(education)
            ).to.be.reverted;
        });
    });

    describe("Reentrancy Tests", function() {
        it("Should prevent reentrancy attacks", async function() {
            const { brainSafes, attacker } = await loadFixture(deployFixture);
            const securityTester = new SecurityTester();
            
            // Desplegar contrato malicioso
            const MaliciousContract = await ethers.getContractFactory("MaliciousReentrancy");
            const malicious = await MaliciousContract.connect(attacker).deploy();
            
            // Intentar reentrancy
            await expect(
                securityTester.attemptReentrancy(brainSafes, malicious)
            ).to.be.revertedWith("ReentrancyGuard:");
        });

        it("Should prevent cross-function reentrancy", async function() {
            const { brainSafes, education, attacker } = await loadFixture(deployFixture);
            const securityTester = new SecurityTester();
            
            // Intentar reentrancy entre contratos
            await expect(
                securityTester.attemptCrossFunctionReentrancy(brainSafes, education, attacker)
            ).to.be.reverted;
        });
    });

    describe("Oracle Security Tests", function() {
        it("Should prevent oracle manipulation", async function() {
            const { brainSafes, oracle, attacker } = await loadFixture(deployFixture);
            const securityTester = new SecurityTester();
            
            // Intentar manipular datos del oráculo
            await expect(
                securityTester.attemptOracleManipulation(oracle, attacker)
            ).to.be.reverted;
        });

        it("Should detect malicious oracle data", async function() {
            const { oracle } = await loadFixture(deployFixture);
            const securityTester = new SecurityTester();
            
            // Intentar inyectar datos maliciosos
            const result = await securityTester.testOracleDataIntegrity(oracle);
            expect(result.maliciousDataDetected).to.be.true;
            expect(result.preventiveMeasuresTriggered).to.be.true;
        });
    });

    describe("Bridge Security Tests", function() {
        it("Should prevent bridge manipulation", async function() {
            const { bridge, attacker } = await loadFixture(deployFixture);
            const securityTester = new SecurityTester();
            
            // Intentar manipular el bridge
            await expect(
                securityTester.attemptBridgeManipulation(bridge, attacker)
            ).to.be.reverted;
        });

        it("Should prevent replay attacks", async function() {
            const { bridge } = await loadFixture(deployFixture);
            const securityTester = new SecurityTester();
            
            // Intentar replay attack
            const tx = await bridge.transferAsset("0x123", "L2");
            await expect(
                securityTester.attemptReplayAttack(bridge, tx)
            ).to.be.revertedWith("Transaction already processed");
        });
    });

    describe("Fuzzing Tests", function() {
        it("Should handle random function inputs", async function() {
            const { brainSafes } = await loadFixture(deployFixture);
            const fuzzTester = new FuzzTester();
            
            // Ejecutar fuzzing en funciones públicas
            const results = await fuzzTester.fuzzPublicFunctions(brainSafes, {
                iterations: 1000,
                maxValueSize: 1000000
            });
            
            expect(results.crashes).to.equal(0);
            expect(results.unexpectedBehavior).to.equal(0);
        });

        it("Should handle malformed transactions", async function() {
            const { brainSafes } = await loadFixture(deployFixture);
            const fuzzTester = new FuzzTester();
            
            // Fuzzing de transacciones
            const results = await fuzzTester.fuzzTransactions(brainSafes, {
                iterations: 1000,
                includeInvalid: true
            });
            
            expect(results.successfulAttacks).to.equal(0);
        });
    });

    describe("DOS Protection Tests", function() {
        it("Should prevent gas limit attacks", async function() {
            const { brainSafes, attacker } = await loadFixture(deployFixture);
            const securityTester = new SecurityTester();
            
            // Intentar DOS por gas
            await expect(
                securityTester.attemptGasLimitAttack(brainSafes, attacker)
            ).to.be.revertedWith("Gas limit exceeded");
        });

        it("Should handle high traffic gracefully", async function() {
            const { brainSafes } = await loadFixture(deployFixture);
            const securityTester = new SecurityTester();
            
            // Simular alto tráfico
            const results = await securityTester.simulateHighTraffic(brainSafes, {
                requests: 1000,
                concurrent: true
            });
            
            expect(results.failedRequests).to.be.below(results.totalRequests * 0.01); // Max 1% fallos
        });
    });

    describe("Storage Security Tests", function() {
        it("Should prevent storage manipulation", async function() {
            const { brainSafes, attacker } = await loadFixture(deployFixture);
            const securityTester = new SecurityTester();
            
            // Intentar manipular storage
            await expect(
                securityTester.attemptStorageManipulation(brainSafes, attacker)
            ).to.be.reverted;
        });

        it("Should protect sensitive data", async function() {
            const { brainSafes } = await loadFixture(deployFixture);
            const securityTester = new SecurityTester();
            
            // Verificar protección de datos
            const results = await securityTester.auditDataProtection(brainSafes);
            expect(results.sensitiveDataExposed).to.be.false;
            expect(results.encryptionImplemented).to.be.true;
        });
    });
}); 