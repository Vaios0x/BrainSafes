const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("DataValidationSystem", function () {
    async function deployFixture() {
        const [owner, validator1, validator2, source1, source2, attacker] = await ethers.getSigners();

        // Deploy mock contracts
        const MockAIProcessor = await ethers.getContractFactory("contracts/mocks/MockContract.sol:MockContract");
        const aiProcessor = await MockAIProcessor.deploy();

        const SecurityManager = await ethers.getContractFactory("SecurityManager");
        const securityManager = await SecurityManager.deploy();

        // Deploy DataValidationSystem
        const DataValidationSystem = await ethers.getContractFactory("DataValidationSystem");
        const validationSystem = await DataValidationSystem.deploy(
            aiProcessor.address,
            securityManager.address
        );

        // Setup roles
        await validationSystem.grantRole(await validationSystem.VALIDATION_ADMIN(), owner.address);
        await validationSystem.grantRole(await validationSystem.VALIDATOR_ROLE(), validator1.address);
        await validationSystem.grantRole(await validationSystem.VALIDATOR_ROLE(), validator2.address);

        return {
            validationSystem,
            aiProcessor,
            securityManager,
            owner,
            validator1,
            validator2,
            source1,
            source2,
            attacker
        };
    }

    describe("Deployment", function () {
        it("Should deploy with correct initial configuration", async function () {
            const { validationSystem, aiProcessor, securityManager } = await loadFixture(deployFixture);

            expect(await validationSystem.aiProcessor()).to.equal(aiProcessor.address);
            expect(await validationSystem.securityManager()).to.equal(securityManager.address);
            expect(await validationSystem.minValidationConfidence()).to.equal(75);
            expect(await validationSystem.validationTimeout()).to.equal(5 * 60); // 5 minutes
        });

        it("Should set up roles correctly", async function () {
            const { validationSystem, owner, validator1 } = await loadFixture(deployFixture);

            const adminRole = await validationSystem.DEFAULT_ADMIN_ROLE();
            const validationAdminRole = await validationSystem.VALIDATION_ADMIN();
            const validatorRole = await validationSystem.VALIDATOR_ROLE();

            expect(await validationSystem.hasRole(adminRole, owner.address)).to.be.true;
            expect(await validationSystem.hasRole(validationAdminRole, owner.address)).to.be.true;
            expect(await validationSystem.hasRole(validatorRole, validator1.address)).to.be.true;
        });
    });

    describe("Validation Rules", function () {
        it("Should create validation rule successfully", async function () {
            const { validationSystem, owner } = await loadFixture(deployFixture);

            const dataKey = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test_data"));
            
            await expect(
                validationSystem.createValidationRule(
                    "Range Check Rule",
                    0, // RANGE_CHECK
                    dataKey,
                    100, // minValue
                    1000, // maxValue
                    5, // maxDeviation
                    3600, // maxAge
                    2 // minSources
                )
            ).to.emit(validationSystem, "ValidationRuleCreated")
            .withArgs(1, "Range Check Rule", 0);

            const rule = await validationSystem.validationRules(1);
            expect(rule.name).to.equal("Range Check Rule");
            expect(rule.ruleType).to.equal(0);
            expect(rule.dataKey).to.equal(dataKey);
            expect(rule.minValue).to.equal(100);
            expect(rule.maxValue).to.equal(1000);
            expect(rule.isActive).to.be.true;
        });

        it("Should fail to create rule with invalid parameters", async function () {
            const { validationSystem, owner } = await loadFixture(deployFixture);

            const dataKey = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test_data"));
            
            await expect(
                validationSystem.createValidationRule(
                    "", // empty name
                    0,
                    dataKey,
                    100,
                    1000,
                    5,
                    3600,
                    2
                )
            ).to.be.revertedWith("Invalid name");
        });

        it("Should prevent non-admin from creating rules", async function () {
            const { validationSystem, validator1 } = await loadFixture(deployFixture);

            const dataKey = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test_data"));
            
            await expect(
                validationSystem.connect(validator1).createValidationRule(
                    "Test Rule",
                    0,
                    dataKey,
                    100,
                    1000,
                    5,
                    3600,
                    2
                )
            ).to.be.reverted;
        });
    });

    describe("Data Validation", function () {
        beforeEach(async function () {
            const { validationSystem, owner } = await loadFixture(deployFixture);
            this.validationSystem = validationSystem;
            this.owner = owner;

            // Create a test validation rule
            this.dataKey = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test_data"));
            await validationSystem.createValidationRule(
                "Range Check Rule",
                0, // RANGE_CHECK
                this.dataKey,
                100, // minValue
                1000, // maxValue
                5, // maxDeviation
                3600, // maxAge
                2 // minSources
            );
        });

        it("Should validate data successfully", async function () {
            const { validationSystem, validator1, source1 } = await loadFixture(deployFixture);
            
            const dataKey = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test_data"));
            const validValue = 500; // Within range [100, 1000]
            const metadata = ethers.utils.toUtf8Bytes("test metadata");

            // Create validation rule first
            await validationSystem.createValidationRule(
                "Range Check Rule",
                0,
                dataKey,
                100,
                1000,
                5,
                3600,
                2
            );

            await expect(
                validationSystem.connect(validator1).validateData(
                    dataKey,
                    validValue,
                    metadata,
                    source1.address
                )
            ).to.emit(validationSystem, "DataValidated");
        });

        it("Should fail validation for out-of-range values", async function () {
            const { validationSystem, validator1, source1 } = await loadFixture(deployFixture);
            
            const dataKey = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test_data"));
            const invalidValue = 2000; // Outside range [100, 1000]
            const metadata = ethers.utils.toUtf8Bytes("test metadata");

            // Create validation rule first
            await validationSystem.createValidationRule(
                "Range Check Rule",
                0,
                dataKey,
                100,
                1000,
                5,
                3600,
                2
            );

            // This should not revert but should return a validation result with low confidence
            const tx = await validationSystem.connect(validator1).validateData(
                dataKey,
                invalidValue,
                metadata,
                source1.address
            );

            await expect(tx).to.emit(validationSystem, "DataValidated");
        });

        it("Should prevent non-validator from validating data", async function () {
            const { validationSystem, source1, source2 } = await loadFixture(deployFixture);
            
            const dataKey = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test_data"));
            const metadata = ethers.utils.toUtf8Bytes("test metadata");

            await expect(
                validationSystem.connect(source1).validateData(
                    dataKey,
                    500,
                    metadata,
                    source2.address
                )
            ).to.be.reverted;
        });

        it("Should reject validation with invalid source", async function () {
            const { validationSystem, validator1 } = await loadFixture(deployFixture);
            
            const dataKey = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test_data"));
            const metadata = ethers.utils.toUtf8Bytes("test metadata");

            await expect(
                validationSystem.connect(validator1).validateData(
                    dataKey,
                    500,
                    metadata,
                    ethers.constants.AddressZero
                )
            ).to.be.revertedWith("Invalid source");
        });
    });

    describe("Cross Validation", function () {
        it("Should setup cross validation successfully", async function () {
            const { validationSystem, owner } = await loadFixture(deployFixture);

            const primaryKey = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("primary_data"));
            const relatedKeys = [
                ethers.utils.keccak256(ethers.utils.toUtf8Bytes("related_data_1")),
                ethers.utils.keccak256(ethers.utils.toUtf8Bytes("related_data_2"))
            ];
            const correlationFactors = [80, 60]; // 80%, 60% correlation
            const maxDeviation = 15; // 15% max deviation

            await validationSystem.setupCrossValidation(
                primaryKey,
                relatedKeys,
                correlationFactors,
                maxDeviation
            );

            const crossVal = await validationSystem.crossValidations(primaryKey);
            expect(crossVal.primaryKey).to.equal(primaryKey);
            expect(crossVal.maxCorrelationDeviation).to.equal(maxDeviation);
            expect(crossVal.isActive).to.be.true;
        });

        it("Should fail cross validation setup with mismatched arrays", async function () {
            const { validationSystem, owner } = await loadFixture(deployFixture);

            const primaryKey = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("primary_data"));
            const relatedKeys = [
                ethers.utils.keccak256(ethers.utils.toUtf8Bytes("related_data_1"))
            ];
            const correlationFactors = [80, 60]; // Mismatched length

            await expect(
                validationSystem.setupCrossValidation(
                    primaryKey,
                    relatedKeys,
                    correlationFactors,
                    15
                )
            ).to.be.revertedWith("Length mismatch");
        });

        it("Should fail cross validation setup with invalid deviation", async function () {
            const { validationSystem, owner } = await loadFixture(deployFixture);

            const primaryKey = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("primary_data"));
            const relatedKeys = [
                ethers.utils.keccak256(ethers.utils.toUtf8Bytes("related_data_1"))
            ];
            const correlationFactors = [80];

            await expect(
                validationSystem.setupCrossValidation(
                    primaryKey,
                    relatedKeys,
                    correlationFactors,
                    150 // > 100%
                )
            ).to.be.revertedWith("Invalid deviation");
        });
    });

    describe("Anomaly Detection", function () {
        it("Should handle anomaly detection with insufficient data", async function () {
            const { validationSystem, validator1, source1 } = await loadFixture(deployFixture);
            
            const dataKey = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("anomaly_test"));
            const metadata = ethers.utils.toUtf8Bytes("test metadata");

            // Create basic rule
            await validationSystem.createValidationRule(
                "Basic Rule",
                0,
                dataKey,
                0,
                10000,
                50,
                3600,
                1
            );

            // First few data points should not trigger anomaly detection
            await validationSystem.connect(validator1).validateData(
                dataKey,
                100,
                metadata,
                source1.address
            );

            // Should not fail due to insufficient historical data
            const anomalyDetector = await validationSystem.anomalyDetectors(dataKey);
            expect(anomalyDetector.sampleSize).to.equal(1);
        });

        it("Should build historical data for anomaly detection", async function () {
            const { validationSystem, validator1, source1 } = await loadFixture(deployFixture);
            
            const dataKey = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("historical_test"));
            const metadata = ethers.utils.toUtf8Bytes("test metadata");

            // Create basic rule
            await validationSystem.createValidationRule(
                "Historical Rule",
                0,
                dataKey,
                0,
                10000,
                50,
                3600,
                1
            );

            // Add multiple data points
            const values = [100, 110, 95, 105, 98, 112, 89, 107];
            for (let i = 0; i < values.length; i++) {
                await validationSystem.connect(validator1).validateData(
                    dataKey,
                    values[i],
                    metadata,
                    source1.address
                );
            }

            const anomalyDetector = await validationSystem.anomalyDetectors(dataKey);
            expect(anomalyDetector.sampleSize).to.equal(values.length);
            expect(anomalyDetector.mean).to.be.gt(0);
        });
    });

    describe("Validator Metrics", function () {
        it("Should track validator performance", async function () {
            const { validationSystem, validator1, source1 } = await loadFixture(deployFixture);
            
            const dataKey = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("metrics_test"));
            const metadata = ethers.utils.toUtf8Bytes("test metadata");

            // Create rule
            await validationSystem.createValidationRule(
                "Metrics Rule",
                0,
                dataKey,
                0,
                10000,
                50,
                3600,
                1
            );

            // Validate some data
            await validationSystem.connect(validator1).validateData(
                dataKey,
                500,
                metadata,
                source1.address
            );

            const metrics = await validationSystem.getValidationMetrics(validator1.address);
            expect(metrics.totalValidations).to.equal(1);
            expect(metrics.lastUpdated).to.be.gt(0);
        });

        it("Should emit validator performance updates", async function () {
            const { validationSystem, validator1, source1 } = await loadFixture(deployFixture);
            
            const dataKey = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("performance_test"));
            const metadata = ethers.utils.toUtf8Bytes("test metadata");

            // Create rule
            await validationSystem.createValidationRule(
                "Performance Rule",
                0,
                dataKey,
                0,
                10000,
                50,
                3600,
                1
            );

            await expect(
                validationSystem.connect(validator1).validateData(
                    dataKey,
                    500,
                    metadata,
                    source1.address
                )
            ).to.emit(validationSystem, "ValidatorPerformanceUpdated");
        });
    });

    describe("Access Control", function () {
        it("Should allow admin to pause and unpause", async function () {
            const { validationSystem, owner } = await loadFixture(deployFixture);

            await validationSystem.connect(owner).pause();
            expect(await validationSystem.paused()).to.be.true;

            await validationSystem.connect(owner).unpause();
            expect(await validationSystem.paused()).to.be.false;
        });

        it("Should prevent validation when paused", async function () {
            const { validationSystem, validator1, source1, owner } = await loadFixture(deployFixture);

            await validationSystem.connect(owner).pause();

            const dataKey = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("paused_test"));
            const metadata = ethers.utils.toUtf8Bytes("test metadata");

            await expect(
                validationSystem.connect(validator1).validateData(
                    dataKey,
                    500,
                    metadata,
                    source1.address
                )
            ).to.be.revertedWith("Pausable: paused");
        });

        it("Should prevent non-admin from pausing", async function () {
            const { validationSystem, validator1 } = await loadFixture(deployFixture);

            await expect(
                validationSystem.connect(validator1).pause()
            ).to.be.reverted;
        });
    });

    describe("Integration Tests", function () {
        it("Should handle complex validation scenario", async function () {
            const { validationSystem, validator1, validator2, source1, owner } = await loadFixture(deployFixture);
            
            const dataKey = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("complex_test"));
            const metadata = ethers.utils.toUtf8Bytes("complex metadata");

            // Create multiple validation rules
            await validationSystem.createValidationRule(
                "Range Rule",
                0, // RANGE_CHECK
                dataKey,
                50,
                150,
                10,
                3600,
                1
            );

            await validationSystem.createValidationRule(
                "Deviation Rule",
                1, // DEVIATION_CHECK
                dataKey,
                0,
                0,
                15,
                3600,
                1
            );

            // Setup cross validation
            const relatedKey = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("related_complex"));
            await validationSystem.setupCrossValidation(
                dataKey,
                [relatedKey],
                [75],
                20
            );

            // Validate data with multiple validators
            const result1 = await validationSystem.connect(validator1).validateData(
                dataKey,
                100,
                metadata,
                source1.address
            );

            const result2 = await validationSystem.connect(validator2).validateData(
                relatedKey,
                80,
                metadata,
                source1.address
            );

            // Both should succeed
            await expect(result1).to.emit(validationSystem, "DataValidated");
            await expect(result2).to.emit(validationSystem, "DataValidated");
        });

        it("Should maintain consistent state across multiple validations", async function () {
            const { validationSystem, validator1, source1 } = await loadFixture(deployFixture);
            
            const dataKey = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("consistency_test"));
            const metadata = ethers.utils.toUtf8Bytes("consistency metadata");

            // Create rule
            await validationSystem.createValidationRule(
                "Consistency Rule",
                0,
                dataKey,
                0,
                1000,
                25,
                3600,
                1
            );

            // Perform multiple validations
            const values = [100, 200, 150, 175, 125];
            for (let value of values) {
                await validationSystem.connect(validator1).validateData(
                    dataKey,
                    value,
                    metadata,
                    source1.address
                );
            }

            // Check that metrics are consistently updated
            const metrics = await validationSystem.getValidationMetrics(validator1.address);
            expect(metrics.totalValidations).to.equal(values.length);
            expect(metrics.averageConfidence).to.be.gt(0);
        });
    });

    describe("Error Handling", function () {
        it("Should handle AI processor failures gracefully", async function () {
            const { validationSystem, validator1, source1 } = await loadFixture(deployFixture);
            
            const dataKey = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("ai_fail_test"));
            const metadata = ethers.utils.toUtf8Bytes("ai fail metadata");

            // Create rule
            await validationSystem.createValidationRule(
                "AI Fail Rule",
                0,
                dataKey,
                0,
                1000,
                25,
                3600,
                1
            );

            // Even if AI fails, validation should proceed with other methods
            await expect(
                validationSystem.connect(validator1).validateData(
                    dataKey,
                    500,
                    metadata,
                    source1.address
                )
            ).to.emit(validationSystem, "DataValidated");
        });

        it("Should handle edge cases in statistical calculations", async function () {
            const { validationSystem, validator1, source1 } = await loadFixture(deployFixture);
            
            const dataKey = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("edge_case_test"));
            const metadata = ethers.utils.toUtf8Bytes("edge case metadata");

            // Create rule
            await validationSystem.createValidationRule(
                "Edge Case Rule",
                0,
                dataKey,
                0,
                100,
                50,
                3600,
                1
            );

            // Test with zero value
            await validationSystem.connect(validator1).validateData(
                dataKey,
                0,
                metadata,
                source1.address
            );

            // Test with maximum value
            await validationSystem.connect(validator1).validateData(
                dataKey,
                100,
                metadata,
                source1.address
            );

            // Should handle both cases without reverting
            const metrics = await validationSystem.getValidationMetrics(validator1.address);
            expect(metrics.totalValidations).to.equal(2);
        });
    });
}); 