const { ethers } = require("hardhat");
const crypto = require("crypto");

class FuzzGenerator {
    constructor() {
        this.charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        this.emailDomains = ["example.com", "test.com", "fuzz.org", "random.net"];
    }

    // Generadores básicos
    generateString(minLength, maxLength) {
        const length = this.randomInt(minLength, maxLength);
        return Array(length)
            .fill()
            .map(() => this.charset[this.randomInt(0, this.charset.length - 1)])
            .join("");
    }

    generateEmail() {
        const username = this.generateString(5, 15);
        const domain = this.emailDomains[this.randomInt(0, this.emailDomains.length - 1)];
        return `${username}@${domain}`;
    }

    generateIPFSHash() {
        return `ipfs://${crypto.randomBytes(32).toString("hex")}`;
    }

    generateUint256(min = 0, max = ethers.constants.MaxUint256) {
        return ethers.BigNumber.from(min).add(
            ethers.BigNumber.from(
                crypto.randomBytes(32)
            ).mod(
                ethers.BigNumber.from(max).sub(min).add(1)
            )
        );
    }

    generateAddress() {
        return ethers.utils.getAddress(
            "0x" + crypto.randomBytes(20).toString("hex")
        );
    }

    generateBytes32() {
        return "0x" + crypto.randomBytes(32).toString("hex");
    }

    generateStringArray(minLength, maxLength) {
        const length = this.randomInt(minLength, maxLength);
        return Array(length).fill().map(() => this.generateString(5, 20));
    }

    // Generadores complejos
    generateOperationSequence(length) {
        return Array(length).fill().map(() => ({
            execute: async (brainSafes, education) => {
                const op = this.randomInt(0, 5);
                switch (op) {
                    case 0:
                        return brainSafes.registerUser(
                            this.generateString(5, 20),
                            this.generateEmail(),
                            this.generateIPFSHash()
                        );
                    case 1:
                        return education.createCourse(
                            this.generateString(5, 20),
                            this.generateString(10, 100),
                            this.generateIPFSHash(),
                            this.generateUint256(1, 1000),
                            this.generateUint256(1, 365),
                            this.generateUint256(1, 1000),
                            this.generateStringArray(1, 5),
                            this.generateUint256(1, 5)
                        );
                    // Más operaciones...
                }
            },
            verifyInvariants: async () => {
                // Verificar invariantes del sistema
                return true;
            }
        }));
    }

    generateConcurrentOperations(count) {
        return Array(count).fill().map(() => ({
            execute: async (contract) => {
                const op = this.randomInt(0, 3);
                switch (op) {
                    case 0:
                        return contract.registerUser(
                            this.generateString(5, 20),
                            this.generateEmail(),
                            this.generateIPFSHash()
                        );
                    case 1:
                        return contract.updateProfile(
                            this.generateString(5, 20),
                            this.generateIPFSHash()
                        );
                    case 2:
                        return contract.getSystemStats();
                }
            }
        }));
    }

    generateComplexStructure() {
        return {
            metadata: {
                name: this.generateString(5, 20),
                description: this.generateString(10, 100),
                timestamp: Date.now(),
                version: this.generateString(5, 10)
            },
            data: Array(this.randomInt(1, 10)).fill().map(() => ({
                key: this.generateBytes32(),
                value: this.generateString(10, 50),
                attributes: Array(this.randomInt(1, 5)).fill().map(() => ({
                    name: this.generateString(5, 15),
                    value: this.generateUint256()
                }))
            })),
            signatures: Array(this.randomInt(1, 3)).fill().map(() => ({
                signer: this.generateAddress(),
                signature: this.generateBytes32(),
                timestamp: Date.now()
            }))
        };
    }

    generateNestedKeys(depth) {
        return Array(depth).fill().map(() => this.generateBytes32());
    }

    generateBoundaryValues() {
        return [
            ethers.constants.Zero,
            ethers.constants.One,
            ethers.constants.MaxUint256,
            ethers.constants.MaxInt256,
            ethers.constants.MinInt256,
            ethers.constants.Two.pow(128),
            ethers.constants.WeiPerEther,
            ethers.constants.MaxUint256.sub(1)
        ];
    }

    generateErrorCondition() {
        const conditions = [
            { type: "overflow", value: ethers.constants.MaxUint256 },
            { type: "underflow", value: ethers.constants.Zero },
            { type: "divisionByZero", value: ethers.constants.Zero },
            { type: "invalidAddress", value: ethers.constants.AddressZero },
            { type: "invalidSignature", value: "0x" + "0".repeat(130) }
        ];
        return conditions[this.randomInt(0, conditions.length - 1)];
    }

    generateGasIntensiveOperation() {
        return {
            type: "complex_operation",
            iterations: this.randomInt(100, 1000),
            data: this.generateBytes32(),
            nested: Array(this.randomInt(1, 10)).fill().map(() => ({
                key: this.generateBytes32(),
                value: this.generateUint256()
            }))
        };
    }

    generateStoragePattern() {
        return {
            type: "storage_test",
            slots: Array(this.randomInt(1, 20)).fill().map(() => ({
                key: this.generateBytes32(),
                value: this.generateBytes32(),
                packed: this.randomInt(0, 1) === 1
            }))
        };
    }

    generateContractInteraction() {
        return {
            method: ["call", "delegatecall", "staticcall"][this.randomInt(0, 2)],
            target: this.generateAddress(),
            value: this.generateUint256(0, 1000),
            data: this.generateBytes32(),
            gasLimit: this.generateUint256(21000, 1000000)
        };
    }

    generateDelegateCallData() {
        return {
            target: this.generateAddress(),
            data: ethers.utils.defaultAbiCoder.encode(
                ["uint256", "address", "bytes32"],
                [
                    this.generateUint256(),
                    this.generateAddress(),
                    this.generateBytes32()
                ]
            )
        };
    }

    // Utilidades
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    randomBool() {
        return Math.random() < 0.5;
    }

    randomElement(array) {
        return array[this.randomInt(0, array.length - 1)];
    }
}

module.exports = {
    FuzzGenerator
}; 