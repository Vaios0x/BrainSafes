const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AdvancedBatchProcessor", function () {
    let AdvancedBatchProcessor, processor, admin, operator, user, Target;

    beforeEach(async function () {
        [admin, operator, user] = await ethers.getSigners();
        AdvancedBatchProcessor = await ethers.getContractFactory("AdvancedBatchProcessor");
        processor = await AdvancedBatchProcessor.deploy();
        await processor.grantRole(await processor.BATCH_ADMIN(), admin.address);
        await processor.grantRole(await processor.BATCH_OPERATOR(), operator.address);
        // Mock target contract
        Target = await ethers.getContractFactory("contracts/mocks/MockContract.sol:MockContract");
    });

    it("debe ejecutar batch atómico exitoso", async function () {
        const target = await Target.deploy();
        const calls = [
            { target: target.address, value: 0, data: "0x" },
            { target: target.address, value: 0, data: "0x" }
        ];
        await expect(
            processor.connect(operator).executeBatch(calls, true)
        ).to.emit(processor, "BatchExecuted");
    });

    it("debe revertir batch atómico en error", async function () {
        const target = await Target.deploy();
        const calls = [
            { target: target.address, value: 0, data: "0x" },
            { target: ethers.constants.AddressZero, value: 0, data: "0x" }
        ];
        await expect(
            processor.connect(operator).executeBatch(calls, true)
        ).to.be.revertedWith("Batch failed at call 1: Unknown error");
    });

    it("debe ejecutar batch no atómico con errores parciales", async function () {
        const target = await Target.deploy();
        const calls = [
            { target: target.address, value: 0, data: "0x" },
            { target: ethers.constants.AddressZero, value: 0, data: "0x" }
        ];
        const tx = await processor.connect(operator).executeBatch(calls, false);
        const receipt = await tx.wait();
        const event = receipt.events.find(e => e.event === "BatchExecuted");
        expect(event.args.failCount).to.equal(1);
    });

    it("debe manejar pagos ETH en batch", async function () {
        const target = await Target.deploy();
        const calls = [
            { target: target.address, value: ethers.utils.parseEther("1"), data: "0x" }
        ];
        await expect(
            processor.connect(operator).executeBatch(calls, false, { value: ethers.utils.parseEther("1") })
        ).to.emit(processor, "BatchExecuted");
    });

    it("debe restringir pausabilidad a admin", async function () {
        await processor.connect(admin).pause();
        expect(await processor.paused()).to.be.true;
        await processor.connect(admin).unpause();
        expect(await processor.paused()).to.be.false;
    });
}); 