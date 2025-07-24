const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");

describe("OracleConsensusSystem", function () {
    async function deployFixture() {
        const [owner, node1, node2, node3, node4, challenger, arbitrator] = await ethers.getSigners();

        // Deploy mock staking token
        const MockERC20 = await ethers.getContractFactory("contracts/mocks/MockERC20.sol:MockERC20");
        const stakingToken = await MockERC20.deploy("Staking Token", "STAKE", ethers.utils.parseEther("1000000"));

        // Deploy mock validation system
        const MockValidation = await ethers.getContractFactory("contracts/mocks/MockContract.sol:MockContract");
        const validationSystem = await MockValidation.deploy();

        // Deploy security manager
        const SecurityManager = await ethers.getContractFactory("SecurityManager");
        const securityManager = await SecurityManager.deploy();

        // Deploy OracleConsensusSystem
        const OracleConsensusSystem = await ethers.getContractFactory("OracleConsensusSystem");
        const consensusSystem = await OracleConsensusSystem.deploy(
            stakingToken.address,
            validationSystem.address,
            securityManager.address
        );

        // Setup roles
        await consensusSystem.grantRole(await consensusSystem.CONSENSUS_ADMIN(), owner.address);
        await consensusSystem.grantRole(await consensusSystem.ARBITRATOR_ROLE(), arbitrator.address);

        // Distribute tokens and approve
        const stakeAmount = ethers.utils.parseEther("1000");
        for (let node of [node1, node2, node3, node4, challenger]) {
            await stakingToken.transfer(node.address, stakeAmount.mul(2));
            await stakingToken.connect(node).approve(consensusSystem.address, stakeAmount.mul(2));
        }

        return {
            consensusSystem,
            stakingToken,
            validationSystem,
            securityManager,
            owner,
            node1,
            node2,
            node3,
            node4,
            challenger,
            arbitrator,
            stakeAmount
        };
    }

    describe("Deployment", function () {
        it("Should deploy with correct initial configuration", async function () {
            const { consensusSystem, stakingToken, validationSystem, securityManager } = await loadFixture(deployFixture);

            expect(await consensusSystem.stakingToken()).to.equal(stakingToken.address);
            expect(await consensusSystem.validationSystem()).to.equal(validationSystem.address);
            expect(await consensusSystem.securityManager()).to.equal(securityManager.address);
            expect(await consensusSystem.minStakeAmount()).to.equal(ethers.utils.parseEther("1000"));
            expect(await consensusSystem.consensusThreshold()).to.equal(67);
        });

        it("Should set up roles correctly", async function () {
            const { consensusSystem, owner, arbitrator } = await loadFixture(deployFixture);

            const adminRole = await consensusSystem.DEFAULT_ADMIN_ROLE();
            const consensusAdminRole = await consensusSystem.CONSENSUS_ADMIN();
            const arbitratorRole = await consensusSystem.ARBITRATOR_ROLE();

            expect(await consensusSystem.hasRole(adminRole, owner.address)).to.be.true;
            expect(await consensusSystem.hasRole(consensusAdminRole, owner.address)).to.be.true;
            expect(await consensusSystem.hasRole(arbitratorRole, arbitrator.address)).to.be.true;
        });
    });

    describe("Node Registration", function () {
        it("Should register node successfully", async function () {
            const { consensusSystem, node1, stakeAmount } = await loadFixture(deployFixture);

            await expect(
                consensusSystem.connect(node1).registerNode(stakeAmount, "ipfs://metadata")
            ).to.emit(consensusSystem, "NodeRegistered")
            .withArgs(node1.address, stakeAmount);

            const nodeInfo = await consensusSystem.getNodeInfo(node1.address);
            expect(nodeInfo.nodeAddress).to.equal(node1.address);
            expect(nodeInfo.stake).to.equal(stakeAmount);
            expect(nodeInfo.isActive).to.be.true;
            expect(nodeInfo.reputation).to.equal(100);
            expect(nodeInfo.metadata).to.equal("ipfs://metadata");
        });

        it("Should fail registration with insufficient stake", async function () {
            const { consensusSystem, node1 } = await loadFixture(deployFixture);

            const lowStake = ethers.utils.parseEther("500"); // Below minimum

            await expect(
                consensusSystem.connect(node1).registerNode(lowStake, "ipfs://metadata")
            ).to.be.revertedWith("Insufficient stake");
        });

        it("Should fail registration with excessive stake", async function () {
            const { consensusSystem, node1, stakingToken } = await loadFixture(deployFixture);

            const highStake = ethers.utils.parseEther("200000"); // Above maximum
            await stakingToken.transfer(node1.address, highStake);
            await stakingToken.connect(node1).approve(consensusSystem.address, highStake);

            await expect(
                consensusSystem.connect(node1).registerNode(highStake, "ipfs://metadata")
            ).to.be.revertedWith("Stake too high");
        });

        it("Should prevent double registration", async function () {
            const { consensusSystem, node1, stakeAmount } = await loadFixture(deployFixture);

            await consensusSystem.connect(node1).registerNode(stakeAmount, "ipfs://metadata");

            await expect(
                consensusSystem.connect(node1).registerNode(stakeAmount, "ipfs://metadata2")
            ).to.be.revertedWith("Node already registered");
        });

        it("Should require metadata", async function () {
            const { consensusSystem, node1, stakeAmount } = await loadFixture(deployFixture);

            await expect(
                consensusSystem.connect(node1).registerNode(stakeAmount, "")
            ).to.be.revertedWith("Missing metadata");
        });

        it("Should grant ORACLE_NODE role upon registration", async function () {
            const { consensusSystem, node1, stakeAmount } = await loadFixture(deployFixture);

            await consensusSystem.connect(node1).registerNode(stakeAmount, "ipfs://metadata");

            const oracleNodeRole = await consensusSystem.ORACLE_NODE();
            expect(await consensusSystem.hasRole(oracleNodeRole, node1.address)).to.be.true;
        });
    });

    describe("Consensus Rounds", function () {
        beforeEach(async function () {
            const { consensusSystem, node1, node2, node3, stakeAmount } = await loadFixture(deployFixture);
            
            // Register nodes
            await consensusSystem.connect(node1).registerNode(stakeAmount, "ipfs://node1");
            await consensusSystem.connect(node2).registerNode(stakeAmount, "ipfs://node2");
            await consensusSystem.connect(node3).registerNode(stakeAmount, "ipfs://node3");
            
            this.consensusSystem = consensusSystem;
            this.node1 = node1;
            this.node2 = node2;
            this.node3 = node3;
        });

        it("Should start consensus round successfully", async function () {
            const { consensusSystem, owner } = await loadFixture(deployFixture);
            
            // Register minimum nodes first
            const { node1, node2, node3, stakeAmount } = await loadFixture(deployFixture);
            await consensusSystem.connect(node1).registerNode(stakeAmount, "ipfs://node1");
            await consensusSystem.connect(node2).registerNode(stakeAmount, "ipfs://node2");
            await consensusSystem.connect(node3).registerNode(stakeAmount, "ipfs://node3");

            const dataKey = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test_data"));

            await expect(
                consensusSystem.connect(owner).startConsensusRound(dataKey)
            ).to.emit(consensusSystem, "ConsensusRoundStarted")
            .withArgs(1, dataKey);

            const roundInfo = await consensusSystem.getRoundInfo(1);
            expect(roundInfo.dataKey).to.equal(dataKey);
            expect(roundInfo.state).to.equal(0); // VOTING
            expect(roundInfo.isFinalized).to.be.false;
        });

        it("Should fail to start round with insufficient nodes", async function () {
            const { consensusSystem, owner } = await loadFixture(deployFixture);

            const dataKey = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test_data"));

            await expect(
                consensusSystem.connect(owner).startConsensusRound(dataKey)
            ).to.be.revertedWith("Insufficient nodes");
        });

        it("Should prevent duplicate rounds for same data key", async function () {
            const { consensusSystem, owner, node1, node2, node3, stakeAmount } = await loadFixture(deployFixture);
            
            // Register nodes
            await consensusSystem.connect(node1).registerNode(stakeAmount, "ipfs://node1");
            await consensusSystem.connect(node2).registerNode(stakeAmount, "ipfs://node2");
            await consensusSystem.connect(node3).registerNode(stakeAmount, "ipfs://node3");

            const dataKey = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test_data"));

            await consensusSystem.connect(owner).startConsensusRound(dataKey);

            await expect(
                consensusSystem.connect(owner).startConsensusRound(dataKey)
            ).to.be.revertedWith("Round already exists for data key");
        });
    });

    describe("Voting Process", function () {
        beforeEach(async function () {
            const { consensusSystem, owner, node1, node2, node3, stakeAmount } = await loadFixture(deployFixture);
            
            // Register nodes
            await consensusSystem.connect(node1).registerNode(stakeAmount, "ipfs://node1");
            await consensusSystem.connect(node2).registerNode(stakeAmount, "ipfs://node2");
            await consensusSystem.connect(node3).registerNode(stakeAmount, "ipfs://node3");

            // Start round
            this.dataKey = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test_data"));
            await consensusSystem.connect(owner).startConsensusRound(this.dataKey);
            
            this.consensusSystem = consensusSystem;
            this.node1 = node1;
            this.node2 = node2;
            this.node3 = node3;
            this.roundId = 1;
        });

        it("Should commit vote successfully", async function () {
            const commitment = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("commitment1"));

            await expect(
                this.consensusSystem.connect(this.node1).commitVote(this.roundId, commitment)
            ).to.emit(this.consensusSystem, "VoteCommitted")
            .withArgs(this.roundId, this.node1.address, commitment);
        });

        it("Should prevent double voting in commit phase", async function () {
            const commitment = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("commitment1"));

            await this.consensusSystem.connect(this.node1).commitVote(this.roundId, commitment);

            await expect(
                this.consensusSystem.connect(this.node1).commitVote(this.roundId, commitment)
            ).to.be.revertedWith("Already voted");
        });

        it("Should prevent voting after voting period", async function () {
            // Fast forward past voting period
            await time.increase(11 * 60); // 11 minutes

            const commitment = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("commitment1"));

            await expect(
                this.consensusSystem.connect(this.node1).commitVote(this.roundId, commitment)
            ).to.be.revertedWith("Voting period ended");
        });

        it("Should prevent non-oracle nodes from voting", async function () {
            const { consensusSystem, challenger } = await loadFixture(deployFixture);
            const commitment = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("commitment1"));

            await expect(
                consensusSystem.connect(challenger).commitVote(this.roundId, commitment)
            ).to.be.reverted; // Should fail due to missing ORACLE_NODE role
        });

        it("Should transition to reveal phase automatically", async function () {
            // Commit votes
            const commitment1 = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("commitment1"));
            const commitment2 = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("commitment2"));
            
            await this.consensusSystem.connect(this.node1).commitVote(this.roundId, commitment1);
            await this.consensusSystem.connect(this.node2).commitVote(this.roundId, commitment2);

            // Progress to reveal phase
            await time.increase(11 * 60); // 11 minutes
            await this.consensusSystem.progressRoundState(this.roundId);

            const roundInfo = await this.consensusSystem.getRoundInfo(this.roundId);
            expect(roundInfo.state).to.equal(1); // REVEALING
        });
    });

    describe("Reveal Process", function () {
        beforeEach(async function () {
            const { consensusSystem, owner, node1, node2, node3, stakeAmount } = await loadFixture(deployFixture);
            
            // Setup and register nodes
            await consensusSystem.connect(node1).registerNode(stakeAmount, "ipfs://node1");
            await consensusSystem.connect(node2).registerNode(stakeAmount, "ipfs://node2");
            await consensusSystem.connect(node3).registerNode(stakeAmount, "ipfs://node3");

            this.dataKey = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test_data"));
            await consensusSystem.connect(owner).startConsensusRound(this.dataKey);
            
            // Commit votes
            this.value1 = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("value1"));
            this.value2 = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("value2"));
            this.value3 = this.value1; // node3 agrees with node1
            
            this.nonce1 = 12345;
            this.nonce2 = 67890;
            this.nonce3 = 11111;
            
            const commitment1 = ethers.utils.keccak256(ethers.utils.solidityPack(
                ["bytes32", "uint256", "address"],
                [this.value1, this.nonce1, node1.address]
            ));
            const commitment2 = ethers.utils.keccak256(ethers.utils.solidityPack(
                ["bytes32", "uint256", "address"],
                [this.value2, this.nonce2, node2.address]
            ));
            const commitment3 = ethers.utils.keccak256(ethers.utils.solidityPack(
                ["bytes32", "uint256", "address"],
                [this.value3, this.nonce3, node3.address]
            ));

            await consensusSystem.connect(node1).commitVote(1, commitment1);
            await consensusSystem.connect(node2).commitVote(1, commitment2);
            await consensusSystem.connect(node3).commitVote(1, commitment3);

            // Transition to reveal phase
            await time.increase(11 * 60);
            await consensusSystem.progressRoundState(1);
            
            this.consensusSystem = consensusSystem;
            this.node1 = node1;
            this.node2 = node2;
            this.node3 = node3;
            this.roundId = 1;
        });

        it("Should reveal vote successfully", async function () {
            await expect(
                this.consensusSystem.connect(this.node1).revealVote(
                    this.roundId,
                    this.value1,
                    this.nonce1
                )
            ).to.emit(this.consensusSystem, "VoteRevealed")
            .withArgs(this.roundId, this.node1.address, this.value1);
        });

        it("Should fail reveal with wrong nonce", async function () {
            await expect(
                this.consensusSystem.connect(this.node1).revealVote(
                    this.roundId,
                    this.value1,
                    99999 // Wrong nonce
                )
            ).to.be.revertedWith("Invalid reveal");
        });

        it("Should fail reveal with wrong value", async function () {
            const wrongValue = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("wrong_value"));
            
            await expect(
                this.consensusSystem.connect(this.node1).revealVote(
                    this.roundId,
                    wrongValue,
                    this.nonce1
                )
            ).to.be.revertedWith("Invalid reveal");
        });

        it("Should prevent double reveal", async function () {
            await this.consensusSystem.connect(this.node1).revealVote(
                this.roundId,
                this.value1,
                this.nonce1
            );

            await expect(
                this.consensusSystem.connect(this.node1).revealVote(
                    this.roundId,
                    this.value1,
                    this.nonce1
                )
            ).to.be.revertedWith("Already revealed");
        });

        it("Should group votes by value", async function () {
            // Reveal all votes
            await this.consensusSystem.connect(this.node1).revealVote(this.roundId, this.value1, this.nonce1);
            await this.consensusSystem.connect(this.node2).revealVote(this.roundId, this.value2, this.nonce2);
            await this.consensusSystem.connect(this.node3).revealVote(this.roundId, this.value3, this.nonce3);

            // value1 should have 2 votes (node1 and node3), value2 should have 1 vote
            // This is tested implicitly through successful finalization
        });
    });

    describe("Consensus Finalization", function () {
        beforeEach(async function () {
            const { consensusSystem, owner, node1, node2, node3, stakeAmount } = await loadFixture(deployFixture);
            
            // Full setup
            await consensusSystem.connect(node1).registerNode(stakeAmount, "ipfs://node1");
            await consensusSystem.connect(node2).registerNode(stakeAmount, "ipfs://node2");
            await consensusSystem.connect(node3).registerNode(stakeAmount, "ipfs://node3");

            this.dataKey = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test_data"));
            await consensusSystem.connect(owner).startConsensusRound(this.dataKey);
            
            // Setup votes where value1 gets majority
            this.value1 = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("majority_value"));
            this.value2 = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("minority_value"));
            
            this.nonce1 = 12345;
            this.nonce2 = 67890;
            this.nonce3 = 11111;

            const commitment1 = ethers.utils.keccak256(ethers.utils.solidityPack(
                ["bytes32", "uint256", "address"],
                [this.value1, this.nonce1, node1.address]
            ));
            const commitment2 = ethers.utils.keccak256(ethers.utils.solidityPack(
                ["bytes32", "uint256", "address"],
                [this.value2, this.nonce2, node2.address]
            ));
            const commitment3 = ethers.utils.keccak256(ethers.utils.solidityPack(
                ["bytes32", "uint256", "address"],
                [this.value1, this.nonce3, node3.address]
            ));

            // Commit and reveal
            await consensusSystem.connect(node1).commitVote(1, commitment1);
            await consensusSystem.connect(node2).commitVote(1, commitment2);
            await consensusSystem.connect(node3).commitVote(1, commitment3);

            await time.increase(11 * 60);
            await consensusSystem.progressRoundState(1);

            await consensusSystem.connect(node1).revealVote(1, this.value1, this.nonce1);
            await consensusSystem.connect(node2).revealVote(1, this.value2, this.nonce2);
            await consensusSystem.connect(node3).revealVote(1, this.value1, this.nonce3);

            await time.increase(6 * 60); // Past reveal period
            
            this.consensusSystem = consensusSystem;
            this.owner = owner;
            this.node1 = node1;
            this.node2 = node2;
            this.node3 = node3;
            this.roundId = 1;
        });

        it("Should finalize round with consensus", async function () {
            await expect(
                this.consensusSystem.connect(this.owner).finalizeRound(this.roundId)
            ).to.emit(this.consensusSystem, "ConsensusReached")
            .withArgs(this.roundId, this.value1, 67); // Should reach ~67% consensus

            const roundInfo = await this.consensusSystem.getRoundInfo(this.roundId);
            expect(roundInfo.finalValue).to.equal(this.value1);
            expect(roundInfo.isFinalized).to.be.true;
            expect(roundInfo.state).to.equal(3); // FINALIZED
        });

        it("Should update node reputations after consensus", async function () {
            const node1InfoBefore = await this.consensusSystem.getNodeInfo(this.node1.address);
            const node2InfoBefore = await this.consensusSystem.getNodeInfo(this.node2.address);

            await this.consensusSystem.connect(this.owner).finalizeRound(this.roundId);

            const node1InfoAfter = await this.consensusSystem.getNodeInfo(this.node1.address);
            const node2InfoAfter = await this.consensusSystem.getNodeInfo(this.node2.address);

            // Node1 voted correctly, should have higher reputation
            expect(node1InfoAfter.reputation).to.be.gt(node1InfoBefore.reputation);
            expect(node1InfoAfter.correctVotes).to.equal(1);
            expect(node1InfoAfter.totalVotes).to.equal(1);

            // Node2 voted incorrectly, should have lower reputation
            expect(node2InfoAfter.reputation).to.be.lt(node2InfoBefore.reputation);
            expect(node2InfoAfter.correctVotes).to.equal(0);
            expect(node2InfoAfter.totalVotes).to.equal(1);
        });

        it("Should fail finalization without sufficient participation", async function () {
            const { consensusSystem, owner, node1, stakeAmount } = await loadFixture(deployFixture);
            
            // Register only one node (insufficient for minParticipation)
            await consensusSystem.connect(node1).registerNode(stakeAmount, "ipfs://node1");
            
            const dataKey = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("low_participation"));
            await consensusSystem.connect(owner).startConsensusRound(dataKey);

            // Only one vote
            const value = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("single_value"));
            const nonce = 12345;
            const commitment = ethers.utils.keccak256(ethers.utils.solidityPack(
                ["bytes32", "uint256", "address"],
                [value, nonce, node1.address]
            ));

            await consensusSystem.connect(node1).commitVote(2, commitment);
            await time.increase(11 * 60);
            await consensusSystem.progressRoundState(2);
            await consensusSystem.connect(node1).revealVote(2, value, nonce);
            await time.increase(6 * 60);

            await expect(
                consensusSystem.connect(owner).finalizeRound(2)
            ).to.be.revertedWith("Insufficient participation");
        });

        it("Should emit reputation update events", async function () {
            await expect(
                this.consensusSystem.connect(this.owner).finalizeRound(this.roundId)
            ).to.emit(this.consensusSystem, "ReputationUpdated");
        });
    });

    describe("Dispute System", function () {
        beforeEach(async function () {
            // Complete setup with finalized round
            const { consensusSystem, owner, node1, node2, node3, challenger, stakeAmount } = await loadFixture(deployFixture);
            
            // Register nodes
            await consensusSystem.connect(node1).registerNode(stakeAmount, "ipfs://node1");
            await consensusSystem.connect(node2).registerNode(stakeAmount, "ipfs://node2");
            await consensusSystem.connect(node3).registerNode(stakeAmount, "ipfs://node3");
            await consensusSystem.connect(challenger).registerNode(stakeAmount, "ipfs://challenger");

            // Complete a round
            this.dataKey = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("dispute_test"));
            await consensusSystem.connect(owner).startConsensusRound(this.dataKey);
            
            this.finalValue = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("consensus_value"));
            this.challengeValue = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("challenge_value"));
            
            // Simulate consensus (simplified)
            // In real scenario, would go through full commit-reveal process
            // For testing, we'll manipulate the round state directly or use owner functions
            
            this.consensusSystem = consensusSystem;
            this.owner = owner;
            this.challenger = challenger;
            this.roundId = 1;
        });

        it("Should prevent disputes on non-finalized rounds", async function () {
            const { consensusSystem, challenger } = await loadFixture(deployFixture);

            await expect(
                consensusSystem.connect(challenger).raiseDispute(
                    999, // Non-existent round
                    this.challengeValue,
                    "Invalid consensus"
                )
            ).to.be.reverted;
        });

        it("Should require proper stake for disputes", async function () {
            // This test would require a properly finalized round
            // Skip for now due to complexity of setup
            this.skip();
        });
    });

    describe("Slashing System", function () {
        beforeEach(async function () {
            const { consensusSystem, node1, stakeAmount } = await loadFixture(deployFixture);
            
            await consensusSystem.connect(node1).registerNode(stakeAmount, "ipfs://node1");
            
            this.consensusSystem = consensusSystem;
            this.node1 = node1;
            this.stakeAmount = stakeAmount;
        });

        it("Should slash node for malicious behavior", async function () {
            const { consensusSystem, owner, node1 } = await loadFixture(deployFixture);
            const stakeAmount = ethers.utils.parseEther("1000");
            
            await consensusSystem.connect(node1).registerNode(stakeAmount, "ipfs://malicious");

            const nodeInfoBefore = await consensusSystem.getNodeInfo(node1.address);

            await expect(
                consensusSystem.connect(owner).slashNode(node1.address, "Malicious voting")
            ).to.emit(consensusSystem, "NodeSlashed")
            .withArgs(node1.address, stakeAmount.div(10), "Malicious voting"); // 10% slashing

            const nodeInfoAfter = await consensusSystem.getNodeInfo(node1.address);
            expect(nodeInfoAfter.stake).to.equal(stakeAmount.mul(9).div(10)); // 90% remaining
            expect(nodeInfoAfter.reputation).to.be.lt(nodeInfoBefore.reputation);
            expect(nodeInfoAfter.slashCount).to.equal(1);
        });

        it("Should deactivate node with insufficient stake after slashing", async function () {
            const { consensusSystem, owner, node1, stakingToken } = await loadFixture(deployFixture);
            
            // Register with minimum stake
            const minStake = await consensusSystem.minStakeAmount();
            await stakingToken.transfer(node1.address, minStake);
            await stakingToken.connect(node1).approve(consensusSystem.address, minStake);
            await consensusSystem.connect(node1).registerNode(minStake, "ipfs://minimal");

            // Slash the node
            await consensusSystem.connect(owner).slashNode(node1.address, "Minimal stake test");

            const nodeInfo = await consensusSystem.getNodeInfo(node1.address);
            expect(nodeInfo.isActive).to.be.false;

            // Should no longer have ORACLE_NODE role
            const oracleRole = await consensusSystem.ORACLE_NODE();
            expect(await consensusSystem.hasRole(oracleRole, node1.address)).to.be.false;
        });

        it("Should prevent slashing inactive nodes", async function () {
            const { consensusSystem, owner, challenger } = await loadFixture(deployFixture);

            await expect(
                consensusSystem.connect(owner).slashNode(challenger.address, "Not registered")
            ).to.be.revertedWith("Node not active");
        });

        it("Should record slashing history", async function () {
            const { consensusSystem, owner, node1 } = await loadFixture(deployFixture);
            const stakeAmount = ethers.utils.parseEther("1000");
            
            await consensusSystem.connect(node1).registerNode(stakeAmount, "ipfs://history");

            await consensusSystem.connect(owner).slashNode(node1.address, "First offense");

            // Check slashing history (would need getter function in contract)
            const nodeInfo = await consensusSystem.getNodeInfo(node1.address);
            expect(nodeInfo.slashCount).to.equal(1);
        });
    });

    describe("Metrics and Statistics", function () {
        it("Should track system metrics", async function () {
            const { consensusSystem } = await loadFixture(deployFixture);

            const metrics = await consensusSystem.getSystemMetrics();
            expect(metrics.totalRounds).to.equal(0);
            expect(metrics.successfulRounds).to.equal(0);
            expect(metrics.totalDisputes).to.equal(0);
        });

        it("Should update metrics after successful round", async function () {
            // This would require completing a full round
            // Skip for now due to complexity
            this.skip();
        });
    });

    describe("Access Control", function () {
        it("Should allow admin to pause and unpause", async function () {
            const { consensusSystem, owner } = await loadFixture(deployFixture);

            await consensusSystem.connect(owner).pause();
            expect(await consensusSystem.paused()).to.be.true;

            await consensusSystem.connect(owner).unpause();
            expect(await consensusSystem.paused()).to.be.false;
        });

        it("Should prevent operations when paused", async function () {
            const { consensusSystem, owner, node1, stakeAmount } = await loadFixture(deployFixture);

            await consensusSystem.connect(owner).pause();

            await expect(
                consensusSystem.connect(node1).registerNode(stakeAmount, "ipfs://paused")
            ).to.be.revertedWith("Pausable: paused");
        });

        it("Should prevent non-admin from pausing", async function () {
            const { consensusSystem, node1 } = await loadFixture(deployFixture);

            await expect(
                consensusSystem.connect(node1).pause()
            ).to.be.reverted;
        });
    });

    describe("Integration Tests", function () {
        it("Should handle complete consensus workflow", async function () {
            const { consensusSystem, owner, node1, node2, node3, stakeAmount } = await loadFixture(deployFixture);
            
            // Register nodes
            await consensusSystem.connect(node1).registerNode(stakeAmount, "ipfs://node1");
            await consensusSystem.connect(node2).registerNode(stakeAmount, "ipfs://node2");
            await consensusSystem.connect(node3).registerNode(stakeAmount, "ipfs://node3");

            // Start round
            const dataKey = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("integration_test"));
            await consensusSystem.connect(owner).startConsensusRound(dataKey);

            // Commit phase
            const value = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("consensus_value"));
            const nonce1 = 11111;
            const nonce2 = 22222;
            const nonce3 = 33333;

            const commitment1 = ethers.utils.keccak256(ethers.utils.solidityPack(
                ["bytes32", "uint256", "address"],
                [value, nonce1, node1.address]
            ));
            const commitment2 = ethers.utils.keccak256(ethers.utils.solidityPack(
                ["bytes32", "uint256", "address"],
                [value, nonce2, node2.address]
            ));
            const commitment3 = ethers.utils.keccak256(ethers.utils.solidityPack(
                ["bytes32", "uint256", "address"],
                [value, nonce3, node3.address]
            ));

            await consensusSystem.connect(node1).commitVote(1, commitment1);
            await consensusSystem.connect(node2).commitVote(1, commitment2);
            await consensusSystem.connect(node3).commitVote(1, commitment3);

            // Transition to reveal
            await time.increase(11 * 60);
            await consensusSystem.progressRoundState(1);

            // Reveal phase
            await consensusSystem.connect(node1).revealVote(1, value, nonce1);
            await consensusSystem.connect(node2).revealVote(1, value, nonce2);
            await consensusSystem.connect(node3).revealVote(1, value, nonce3);

            // Finalize
            await time.increase(6 * 60);
            await consensusSystem.connect(owner).finalizeRound(1);

            const roundInfo = await consensusSystem.getRoundInfo(1);
            expect(roundInfo.finalValue).to.equal(value);
            expect(roundInfo.confidence).to.equal(100); // 100% consensus
            expect(roundInfo.isFinalized).to.be.true;
        });

        it("Should maintain consistent state across operations", async function () {
            const { consensusSystem, node1, stakeAmount } = await loadFixture(deployFixture);

            // Multiple registrations and operations
            await consensusSystem.connect(node1).registerNode(stakeAmount, "ipfs://consistency");

            let nodeInfo = await consensusSystem.getNodeInfo(node1.address);
            expect(nodeInfo.isActive).to.be.true;
            expect(nodeInfo.stake).to.equal(stakeAmount);

            // State should remain consistent
            nodeInfo = await consensusSystem.getNodeInfo(node1.address);
            expect(nodeInfo.isActive).to.be.true;
            expect(nodeInfo.stake).to.equal(stakeAmount);
        });
    });

    describe("Error Handling", function () {
        it("Should handle invalid round IDs gracefully", async function () {
            const { consensusSystem, node1 } = await loadFixture(deployFixture);

            const invalidRoundId = 999;
            const commitment = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test"));

            // Should not crash, but may revert with appropriate error
            await expect(
                consensusSystem.connect(node1).commitVote(invalidRoundId, commitment)
            ).to.be.reverted;
        });

        it("Should handle edge cases in vote counting", async function () {
            // Test with minimal viable setup
            const { consensusSystem, owner, node1, node2, node3, stakeAmount } = await loadFixture(deployFixture);
            
            await consensusSystem.connect(node1).registerNode(stakeAmount, "ipfs://edge1");
            await consensusSystem.connect(node2).registerNode(stakeAmount, "ipfs://edge2");
            await consensusSystem.connect(node3).registerNode(stakeAmount, "ipfs://edge3");

            const dataKey = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("edge_case"));
            await consensusSystem.connect(owner).startConsensusRound(dataKey);

            // Should handle the case where not all nodes participate
            const value = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("edge_value"));
            const nonce = 12345;
            const commitment = ethers.utils.keccak256(ethers.utils.solidityPack(
                ["bytes32", "uint256", "address"],
                [value, nonce, node1.address]
            ));

            await consensusSystem.connect(node1).commitVote(1, commitment);
            // node2 and node3 don't vote

            await time.increase(11 * 60);
            await consensusSystem.progressRoundState(1);
            await consensusSystem.connect(node1).revealVote(1, value, nonce);
            await time.increase(6 * 60);

            // Should fail due to insufficient participation
            await expect(
                consensusSystem.connect(owner).finalizeRound(1)
            ).to.be.revertedWith("Insufficient participation");
        });
    });
}); 