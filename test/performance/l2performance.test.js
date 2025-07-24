const { expect } = require("chai");
const { ethers, network } = require("hardhat");

describe("L2 Performance Tests (Arbitrum)", function () {
    let BrainSafes, brainSafes, JobMarketplace, jobMarketplace, AIOracle, aiOracle, admin, users;
    const BATCH_SIZE = 50;

    before(async function () {
        [admin, ...users] = await ethers.getSigners();
        BrainSafes = await ethers.getContractFactory("BrainSafes");
        brainSafes = await BrainSafes.deploy();
        JobMarketplace = await ethers.getContractFactory("JobMarketplace");
        jobMarketplace = await JobMarketplace.deploy();
        AIOracle = await ethers.getContractFactory("AIOracle");
        aiOracle = await AIOracle.deploy(admin.address);
    });

    it("debe medir gas y latencia de batch en L2", async function () {
        const userDatas = [];
        for (let i = 0; i < BATCH_SIZE; i++) {
            userDatas.push(ethers.utils.hexlify(ethers.utils.randomBytes(32)));
        }
        const start = Date.now();
        const tx = await brainSafes.batchRegisterUsers(userDatas);
        const receipt = await tx.wait();
        const end = Date.now();
        console.log("[L2] Gas usado:", receipt.gasUsed.toString());
        console.log("[L2] Tiempo (ms):", end - start);
        expect(receipt.status).to.equal(1);
    });

    it("debe comparar gas y latencia con L1 (simulado)", async function () {
        // Simulación: en testnet L2, pero se puede comparar con valores históricos de L1
        const jobDatas = [];
        for (let i = 0; i < BATCH_SIZE; i++) {
            jobDatas.push(ethers.utils.hexlify(ethers.utils.randomBytes(64)));
        }
        const start = Date.now();
        const tx = await jobMarketplace.batchPostJobs(jobDatas);
        const receipt = await tx.wait();
        const end = Date.now();
        console.log("[L2] Gas usado (jobs):", receipt.gasUsed.toString());
        console.log("[L2] Tiempo (ms):", end - start);
        expect(receipt.status).to.equal(1);
    });

    it("debe soportar concurrencia de múltiples usuarios en L2", async function () {
        const txs = [];
        for (let i = 0; i < 10; i++) {
            const user = users[i];
            txs.push(brainSafes.connect(user).batchRegisterUsers([
                ethers.utils.hexlify(ethers.utils.randomBytes(32))
            ]));
        }
        const start = Date.now();
        const receipts = await Promise.all(txs.map(tx => tx.then(t => t.wait())));
        const end = Date.now();
        receipts.forEach(r => expect(r.status).to.equal(1));
        console.log("[L2] Concurrencia 10 usuarios, tiempo total (ms):", end - start);
    });
}); 