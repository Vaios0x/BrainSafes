const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MessageRecoverySystem", function () {
    let MessageRecoverySystem, recovery, admin, operator, user;

    beforeEach(async function () {
        [admin, operator, user] = await ethers.getSigners();
        MessageRecoverySystem = await ethers.getContractFactory("MessageRecoverySystem");
        recovery = await MessageRecoverySystem.deploy();
        await recovery.grantRole(await recovery.RECOVERY_ADMIN(), admin.address);
        await recovery.grantRole(await recovery.OPERATOR_ROLE(), operator.address);
    });

    it("debe iniciar recuperación de mensaje", async function () {
        const messageId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("msg1"));
        await expect(
            recovery.connect(operator).initiateRecovery(messageId, "Perdido")
        ).to.emit(recovery, "MessageRecoveryInitiated");
    });

    it("debe hacer retry de recuperación", async function () {
        const messageId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("msg2"));
        await recovery.connect(operator).initiateRecovery(messageId, "Delay");
        await expect(
            recovery.connect(operator).retryRecovery(messageId)
        ).to.emit(recovery, "MessageRecoverySuccess");
    });

    it("debe marcar manualmente como recuperado", async function () {
        const messageId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("msg3"));
        await recovery.connect(operator).initiateRecovery(messageId, "Manual");
        await expect(
            recovery.connect(admin).manualMarkRecovered(messageId, "OK")
        ).to.emit(recovery, "MessageRecoverySuccess");
    });

    it("debe consultar logs de recuperación", async function () {
        const messageId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("msg4"));
        await recovery.connect(operator).initiateRecovery(messageId, "Consulta");
        const log = await recovery.getRecoveryLog(messageId);
        expect(log.messageId).to.equal(messageId);
    });

    it("debe pausar y despausar", async function () {
        await recovery.pause();
        expect(await recovery.paused()).to.be.true;
        await recovery.unpause();
        expect(await recovery.paused()).to.be.false;
    });
}); 