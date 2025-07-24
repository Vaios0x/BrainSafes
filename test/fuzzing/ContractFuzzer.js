const { ethers } = require("hardhat");
const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { FuzzGenerator } = require("./helpers/FuzzGenerator");

describe("BrainSafes Fuzzing Tests", function() {
    async function deployFixture() {
        const [owner, ...users] = await ethers.getSigners();
        
        const BrainSafes = await ethers.getContractFactory("BrainSafes");
        const brainSafes = await BrainSafes.deploy();
        
        const Education = await ethers.getContractFactory("EnhancedEducationSystem");
        const education = await Education.deploy(brainSafes.address);
        
        return { brainSafes, education, owner, users };
    }

    describe("Function Parameter Fuzzing", function() {
        it("Should fuzz user registration parameters", async function() {
            const { brainSafes } = await loadFixture(deployFixture);
            const fuzzGen = new FuzzGenerator();
            
            // Generar datos aleatorios
            for (let i = 0; i < 1000; i++) {
                const name = fuzzGen.generateString(1, 100);
                const email = fuzzGen.generateEmail();
                const profile = fuzzGen.generateIPFSHash();
                
                try {
                    await brainSafes.registerUser(name, email, profile);
                } catch (e) {
                    // Verificar que solo fallan casos inválidos
                    expect(
                        e.message.includes("Invalid") ||
                        e.message.includes("Required") ||
                        e.message.includes("Length")
                    ).to.be.true;
                }
            }
        });

        it("Should fuzz course creation parameters", async function() {
            const { education } = await loadFixture(deployFixture);
            const fuzzGen = new FuzzGenerator();
            
            for (let i = 0; i < 1000; i++) {
                const params = {
                    title: fuzzGen.generateString(1, 200),
                    description: fuzzGen.generateString(0, 1000),
                    ipfsContent: fuzzGen.generateIPFSHash(),
                    price: fuzzGen.generateUint256(),
                    duration: fuzzGen.generateUint256(1, 365),
                    maxStudents: fuzzGen.generateUint256(1, 10000),
                    skills: fuzzGen.generateStringArray(0, 10),
                    difficulty: fuzzGen.generateUint256(1, 5)
                };
                
                try {
                    await education.createCourse(
                        params.title,
                        params.description,
                        params.ipfsContent,
                        params.price,
                        params.duration,
                        params.maxStudents,
                        params.skills,
                        params.difficulty
                    );
                } catch (e) {
                    expect(e.message).to.match(/Invalid|Required|Overflow/);
                }
            }
        });
    });

    describe("State Transition Fuzzing", function() {
        it("Should fuzz state transitions", async function() {
            const { brainSafes, education } = await loadFixture(deployFixture);
            const fuzzGen = new FuzzGenerator();
            
            // Generar secuencias aleatorias de operaciones
            for (let i = 0; i < 100; i++) {
                const sequence = fuzzGen.generateOperationSequence(10);
                
                for (const operation of sequence) {
                    try {
                        await operation.execute(brainSafes, education);
                        // Verificar invariantes después de cada operación
                        await operation.verifyInvariants();
                    } catch (e) {
                        expect(e.message).to.not.include("Invariant violation");
                    }
                }
            }
        });

        it("Should fuzz concurrent operations", async function() {
            const { brainSafes } = await loadFixture(deployFixture);
            const fuzzGen = new FuzzGenerator();
            
            // Generar operaciones concurrentes
            for (let i = 0; i < 10; i++) {
                const operations = fuzzGen.generateConcurrentOperations(100);
                
                await Promise.all(
                    operations.map(op => op.execute(brainSafes))
                );
                
                // Verificar estado final
                const finalState = await brainSafes.getSystemState();
                expect(finalState.isValid).to.be.true;
            }
        });
    });

    describe("Data Structure Fuzzing", function() {
        it("Should fuzz complex data structures", async function() {
            const { education } = await loadFixture(deployFixture);
            const fuzzGen = new FuzzGenerator();
            
            // Generar estructuras de datos complejas
            for (let i = 0; i < 100; i++) {
                const data = fuzzGen.generateComplexStructure();
                
                try {
                    await education.processComplexData(data);
                } catch (e) {
                    expect(e.message).to.not.include("Stack overflow");
                    expect(e.message).to.not.include("Out of gas");
                }
            }
        });

        it("Should fuzz nested mappings", async function() {
            const { brainSafes } = await loadFixture(deployFixture);
            const fuzzGen = new FuzzGenerator();
            
            // Probar operaciones en mappings anidados
            for (let i = 0; i < 100; i++) {
                const keys = fuzzGen.generateNestedKeys(3);
                const value = fuzzGen.generateBytes32();
                
                try {
                    await brainSafes.setNestedMapping(...keys, value);
                    const retrieved = await brainSafes.getNestedMapping(...keys);
                    expect(retrieved).to.equal(value);
                } catch (e) {
                    expect(e.message).to.match(/Invalid key|Nesting too deep/);
                }
            }
        });
    });

    describe("Edge Case Fuzzing", function() {
        it("Should fuzz boundary conditions", async function() {
            const { brainSafes } = await loadFixture(deployFixture);
            const fuzzGen = new FuzzGenerator();
            
            // Probar valores límite
            const boundaryValues = fuzzGen.generateBoundaryValues();
            
            for (const value of boundaryValues) {
                try {
                    await brainSafes.processBoundaryValue(value);
                } catch (e) {
                    expect(e.message).to.match(/Overflow|Underflow|Invalid/);
                }
            }
        });

        it("Should fuzz error conditions", async function() {
            const { education } = await loadFixture(deployFixture);
            const fuzzGen = new FuzzGenerator();
            
            // Generar condiciones de error
            for (let i = 0; i < 100; i++) {
                const errorCondition = fuzzGen.generateErrorCondition();
                
                try {
                    await education.processErrorCondition(errorCondition);
                } catch (e) {
                    expect(e.message).to.not.include("Unexpected error");
                }
            }
        });
    });

    describe("Gas Optimization Fuzzing", function() {
        it("Should fuzz gas usage patterns", async function() {
            const { brainSafes } = await loadFixture(deployFixture);
            const fuzzGen = new FuzzGenerator();
            
            // Probar patrones de uso de gas
            for (let i = 0; i < 100; i++) {
                const operation = fuzzGen.generateGasIntensiveOperation();
                
                const tx = await brainSafes.executeOperation(operation);
                const receipt = await tx.wait();
                
                expect(receipt.gasUsed).to.be.below(
                    ethers.BigNumber.from("8000000")
                );
            }
        });

        it("Should fuzz storage patterns", async function() {
            const { education } = await loadFixture(deployFixture);
            const fuzzGen = new FuzzGenerator();
            
            // Probar patrones de almacenamiento
            for (let i = 0; i < 100; i++) {
                const storagePattern = fuzzGen.generateStoragePattern();
                
                const tx = await education.processStoragePattern(storagePattern);
                const receipt = await tx.wait();
                
                // Verificar optimización de storage
                const slots = await education.getStorageSlotsUsed();
                expect(slots).to.be.below(100);
            }
        });
    });

    describe("Cross-Contract Fuzzing", function() {
        it("Should fuzz contract interactions", async function() {
            const { brainSafes, education } = await loadFixture(deployFixture);
            const fuzzGen = new FuzzGenerator();
            
            // Probar interacciones entre contratos
            for (let i = 0; i < 100; i++) {
                const interaction = fuzzGen.generateContractInteraction();
                
                try {
                    await brainSafes.interactWithEducation(
                        education.address,
                        interaction
                    );
                } catch (e) {
                    expect(e.message).to.not.include("Unexpected interaction error");
                }
            }
        });

        it("Should fuzz delegate calls", async function() {
            const { brainSafes } = await loadFixture(deployFixture);
            const fuzzGen = new FuzzGenerator();
            
            // Probar delegate calls
            for (let i = 0; i < 100; i++) {
                const delegateData = fuzzGen.generateDelegateCallData();
                
                try {
                    await brainSafes.executeDelegateCall(
                        delegateData.target,
                        delegateData.data
                    );
                } catch (e) {
                    expect(e.message).to.match(/Invalid delegate|Unauthorized/);
                }
            }
        });
    });
}); 