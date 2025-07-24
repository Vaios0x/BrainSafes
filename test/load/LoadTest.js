const { ethers } = require("hardhat");
const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { Artillery } = require("artillery");

describe("BrainSafes Load Tests", function() {
    // Configuración inicial
    async function deployFixture() {
        const [owner, ...users] = await ethers.getSigners();
        
        // Desplegar contratos
        const BrainSafes = await ethers.getContractFactory("BrainSafes");
        const brainSafes = await BrainSafes.deploy();
        
        const Education = await ethers.getContractFactory("EnhancedEducationSystem");
        const education = await Education.deploy(brainSafes.address);
        
        return { brainSafes, education, owner, users };
    }

    describe("Concurrent User Testing", function() {
        it("Should handle 1000+ concurrent user registrations", async function() {
            const { brainSafes, users } = await loadFixture(deployFixture);
            
            // Crear 1000 transacciones concurrentes
            const promises = users.slice(0, 1000).map(async (user) => {
                return brainSafes.connect(user).registerUser(
                    `User ${user.address}`,
                    `user${user.address}@example.com`,
                    `ipfs://profile/${user.address}`
                );
            });

            // Ejecutar todas las transacciones
            await Promise.all(promises);
            
            // Verificar registros
            for (let i = 0; i < 1000; i++) {
                const profile = await brainSafes.userProfiles(users[i].address);
                expect(profile.isActive).to.be.true;
            }
        });

        it("Should handle 1000+ concurrent course enrollments", async function() {
            const { brainSafes, education, users } = await loadFixture(deployFixture);
            
            // Crear curso de prueba
            await education.createCourse(
                "Test Course",
                "Description",
                "ipfs://content",
                ethers.utils.parseEther("1"),
                30,
                1000,
                ["blockchain"],
                3
            );

            // Inscribir 1000 usuarios concurrentemente
            const promises = users.slice(0, 1000).map(async (user) => {
                return education.connect(user).enrollInCourse(1, {
                    value: ethers.utils.parseEther("1")
                });
            });

            await Promise.all(promises);
            
            // Verificar inscripciones
            const course = await education.courses(1);
            expect(course.currentStudents).to.equal(1000);
        });

        it("Should handle 1000+ concurrent certificate verifications", async function() {
            const { brainSafes, education, users } = await loadFixture(deployFixture);
            
            // Emitir certificados de prueba
            for (let i = 0; i < 1000; i++) {
                await education.issueCertificate(users[i].address, 1);
            }

            // Verificar certificados concurrentemente
            const promises = users.slice(0, 1000).map(async (user, index) => {
                return education.verifyCertificate(index + 1);
            });

            const results = await Promise.all(promises);
            
            // Verificar resultados
            results.forEach(result => {
                expect(result).to.be.true;
            });
        });
    });

    describe("System Performance", function() {
        it("Should maintain response times under load", async function() {
            const { brainSafes } = await loadFixture(deployFixture);
            
            // Configurar Artillery para pruebas de rendimiento
            const artillery = new Artillery();
            
            const testConfig = {
                target: "http://localhost:8545",
                phases: [
                    { duration: 60, arrivalRate: 10 },
                    { duration: 120, arrivalRate: 50 },
                    { duration: 180, arrivalRate: 100 }
                ],
                scenarios: [
                    {
                        name: "Register and enroll",
                        flow: [
                            { function: "registerUser" },
                            { think: 2 },
                            { function: "enrollInCourse" }
                        ]
                    }
                ]
            };

            const metrics = await artillery.run(testConfig);
            
            // Verificar métricas
            expect(metrics.p95ResponseTime).to.be.below(2000); // 2 segundos
            expect(metrics.errorRate).to.be.below(0.01); // 1% error máximo
        });

        it("Should handle high transaction throughput", async function() {
            const { brainSafes } = await loadFixture(deployFixture);
            
            // Medir TPS (Transactions Per Second)
            const startTime = Date.now();
            const numTransactions = 10000;
            
            const promises = [];
            for (let i = 0; i < numTransactions; i++) {
                promises.push(brainSafes.getSystemStats());
            }

            await Promise.all(promises);
            
            const endTime = Date.now();
            const duration = (endTime - startTime) / 1000;
            const tps = numTransactions / duration;
            
            expect(tps).to.be.above(100); // Mínimo 100 TPS
        });
    });

    describe("Resource Utilization", function() {
        it("Should maintain efficient gas usage under load", async function() {
            const { brainSafes, users } = await loadFixture(deployFixture);
            
            const gasUsage = [];
            
            // Ejecutar 1000 transacciones y medir gas
            for (let i = 0; i < 1000; i++) {
                const tx = await brainSafes.connect(users[i]).registerUser(
                    `User ${i}`,
                    `user${i}@example.com`,
                    `ipfs://profile/${i}`
                );
                
                const receipt = await tx.wait();
                gasUsage.push(receipt.gasUsed);
            }

            // Calcular estadísticas
            const avgGas = gasUsage.reduce((a, b) => a.add(b), ethers.BigNumber.from(0))
                .div(gasUsage.length);
            
            expect(avgGas).to.be.below(ethers.BigNumber.from("200000")); // Límite de gas
        });

        it("Should handle memory efficiently", async function() {
            const { brainSafes } = await loadFixture(deployFixture);
            
            // Generar datos grandes
            const largeData = Array(1000).fill().map((_, i) => ({
                name: `User ${i}`,
                email: `user${i}@example.com`,
                profile: `ipfs://profile/${i}`
            }));

            // Procesar en lotes optimizados
            for (let i = 0; i < largeData.length; i += 100) {
                const batch = largeData.slice(i, i + 100);
                await brainSafes.batchProcessUsers(batch);
            }

            // Verificar estado del sistema
            const stats = await brainSafes.getSystemStats();
            expect(stats.memoryUtilization).to.be.below(80); // Máximo 80% uso de memoria
        });
    });
}); 