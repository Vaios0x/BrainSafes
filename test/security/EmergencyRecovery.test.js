const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EmergencyRecovery", function () {
    let EmergencyRecovery, SecurityManager, recovery, security, owner, admin, approver, user;

    beforeEach(async function () {
        [owner, admin, approver, user] = await ethers.getSigners();
        SecurityManager = await ethers.getContractFactory("SecurityManager");
        security = await SecurityManager.deploy();
        EmergencyRecovery = await ethers.getContractFactory("EmergencyRecovery");
        recovery = await EmergencyRecovery.deploy(security.address, 2, 3600); // 2 approvals, 1h delay
        await recovery.grantRole(await recovery.RECOVERY_ADMIN(), admin.address);
        await recovery.grantRole(await recovery.RECOVERY_APPROVER(), approver.address);
    });

    it("debe permitir proponer recuperación solo en emergencia", async function () {
        await expect(
            recovery.connect(admin).proposeRecovery("Test", ["accion1"])
        ).to.be.revertedWith("System not in emergency");
    });

    it("flujo completo de recuperación de emergencia", async function () {
        // Simular emergencia
        await security.pause();
        // Proponer
        await expect(
            recovery.connect(admin).proposeRecovery("Test", ["accion1"])
        ).to.emit(recovery, "RecoveryProposed");
        // Aprobar
        await expect(
            recovery.connect(approver).approveRecovery(1)
        ).to.emit(recovery, "RecoveryApproved");
        // Segundo aprobador
        await recovery.grantRole(await recovery.RECOVERY_APPROVER(), owner.address);
        await expect(
            recovery.connect(owner).approveRecovery(1)
        ).to.emit(recovery, "RecoveryApproved");
        // Esperar delay
        await ethers.provider.send("evm_increaseTime", [3600]);
        await ethers.provider.send("evm_mine");
        // Ejecutar
        await expect(
            recovery.connect(admin).executeRecovery(1)
        ).to.emit(recovery, "RecoveryExecuted");
    });

    it("no debe ejecutar sin suficientes aprobaciones", async function () {
        await security.pause();
        await recovery.connect(admin).proposeRecovery("Test", ["accion1"]);
        await expect(
            recovery.connect(admin).executeRecovery(1)
        ).to.be.revertedWith("Not enough approvals");
    });

    it("no debe ejecutar antes del delay", async function () {
        await security.pause();
        await recovery.connect(admin).proposeRecovery("Test", ["accion1"]);
        await recovery.connect(approver).approveRecovery(1);
        await recovery.grantRole(await recovery.RECOVERY_APPROVER(), owner.address);
        await recovery.connect(owner).approveRecovery(1);
        await expect(
            recovery.connect(admin).executeRecovery(1)
        ).to.be.revertedWith("Delay not met");
    });

    it("debe permitir recuperar fondos en emergencia", async function () {
        await security.pause();
        // Enviar ETH al contrato
        await owner.sendTransaction({ to: recovery.address, value: ethers.utils.parseEther("1") });
        // Recuperar
        await expect(
            recovery.connect(admin).recoverFunds(ethers.constants.AddressZero, user.address, ethers.utils.parseEther("1"))
        ).to.emit(recovery, "FundsRecovered");
    });

    it("debe permitir restaurar estado en emergencia", async function () {
        await security.pause();
        await expect(
            recovery.connect(admin).restoreState("restaurar variable X")
        ).to.emit(recovery, "StateRestored");
    });
}); 