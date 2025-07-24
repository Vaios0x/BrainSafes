const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Scalability Tests", function () {
    let BrainSafes, brainSafes, JobMarketplace, jobMarketplace, AIOracle, aiOracle, admin, users;
    const USER_COUNT = 1000;
    const BATCH_SIZE = 100;

    before(async function () {
        [admin, ...users] = await ethers.getSigners();
        BrainSafes = await ethers.getContractFactory("BrainSafes");
        brainSafes = await BrainSafes.deploy();
        JobMarketplace = await ethers.getContractFactory("JobMarketplace");
        jobMarketplace = await JobMarketplace.deploy();
        AIOracle = await ethers.getContractFactory("AIOracle");
        aiOracle = await AIOracle.deploy(admin.address);
    });

    it("debe registrar miles de usuarios en batch", async function () {
        const userDatas = [];
        for (let i = 0; i < USER_COUNT; i++) {
            userDatas.push(ethers.utils.hexlify(ethers.utils.randomBytes(32)));
        }
        const tx = await brainSafes.batchRegisterUsers(userDatas);
        const receipt = await tx.wait();
        expect(receipt.status).to.equal(1);
    });

    it("debe publicar cientos de ofertas de trabajo en batch", async function () {
        const jobDatas = [];
        for (let i = 0; i < BATCH_SIZE; i++) {
            jobDatas.push(ethers.utils.hexlify(ethers.utils.randomBytes(64)));
        }
        const tx = await jobMarketplace.batchPostJobs(jobDatas);
        const receipt = await tx.wait();
        expect(receipt.status).to.equal(1);
    });

    it("debe procesar inferencias IA en batch", async function () {
        const inputs = [];
        for (let i = 0; i < BATCH_SIZE; i++) {
            inputs.push(ethers.utils.hexlify(ethers.utils.randomBytes(128)));
        }
        const tx = await aiOracle.batchInfer(inputs);
        const receipt = await tx.wait();
        expect(receipt.status).to.equal(1);
    });

    it("debe medir el gas y tiempo de operaciones masivas", async function () {
        const userDatas = [];
        for (let i = 0; i < BATCH_SIZE; i++) {
            userDatas.push(ethers.utils.hexlify(ethers.utils.randomBytes(32)));
        }
        const start = Date.now();
        const tx = await brainSafes.batchRegisterUsers(userDatas);
        const receipt = await tx.wait();
        const end = Date.now();
        console.log("Gas usado:", receipt.gasUsed.toString());
        console.log("Tiempo (ms):", end - start);
        expect(receipt.status).to.equal(1);
    });
}); 