const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AutoAuditSystem", function () {
    let AutoAuditSystem, SecurityMonitor, PenetrationTester, audit, monitor, pentest, owner, bot, admin;

    beforeEach(async function () {
        [owner, bot, admin] = await ethers.getSigners();
        SecurityMonitor = await ethers.getContractFactory("SecurityMonitor");
        monitor = await SecurityMonitor.deploy();
        PenetrationTester = await ethers.getContractFactory("PenetrationTester");
        pentest = await PenetrationTester.deploy(monitor.address);
        AutoAuditSystem = await ethers.getContractFactory("AutoAuditSystem");
        audit = await AutoAuditSystem.deploy(monitor.address, pentest.address);
        await audit.grantRole(await audit.AUDIT_BOT(), bot.address);
        await audit.grantRole(await audit.AUDIT_ADMIN(), admin.address);
    });

    it("debe permitir loguear eventos críticos", async function () {
        await expect(
            audit.connect(bot).logEvent("UPGRADE", bot.address, "Upgrade ejecutado", true)
        ).to.emit(audit, "AuditEventLogged");
    });

    it("debe permitir generar reportes automáticos", async function () {
        await expect(
            audit.connect(bot).generateReport("Resumen", ["Fallo 1", "Fallo 2"], true)
        ).to.emit(audit, "AuditReportGenerated");
    });

    it("debe consultar logs de eventos y reportes", async function () {
        await audit.connect(bot).logEvent("UPGRADE", bot.address, "Upgrade ejecutado", true);
        await audit.connect(bot).generateReport("Resumen", ["Fallo 1"], true);
        const events = await audit.getEvents(1, 1);
        expect(events.length).to.equal(1);
        const reports = await audit.getReports(1, 1);
        expect(reports.length).to.equal(1);
    });

    it("debe restringir acceso a bots y admins", async function () {
        await expect(
            audit.logEvent("UPGRADE", owner.address, "", true)
        ).to.be.reverted;
        await expect(
            audit.generateReport("", [], true)
        ).to.be.reverted;
        await expect(
            audit.connect(admin).pause()
        ).to.emit(audit, "Paused");
        await expect(
            audit.connect(admin).unpause()
        ).to.emit(audit, "Unpaused");
    });
}); 