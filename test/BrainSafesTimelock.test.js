const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BrainSafesTimelock", function () {
    let timelock;
    let mockTarget;
    let owner;
    let admin;
    let proposer;
    let executor;
    let canceller;
    let emergency;
    let other;

    const TIMELOCK_ADMIN_ROLE = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes("TIMELOCK_ADMIN_ROLE")
    );
    const PROPOSER_ROLE = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes("PROPOSER_ROLE")
    );
    const EXECUTOR_ROLE = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes("EXECUTOR_ROLE")
    );
    const CANCELLER_ROLE = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes("CANCELLER_ROLE")
    );
    const EMERGENCY_ROLE = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes("EMERGENCY_ROLE")
    );

    const MIN_DELAY = 24 * 60 * 60; // 1 day
    const SALT = ethers.utils.formatBytes32String("SALT");

    beforeEach(async function () {
        [owner, admin, proposer, executor, canceller, emergency, other] = await ethers.getSigners();

        // Desplegar contrato mock para target
        const MockTarget = await ethers.getContractFactory("MockTarget");
        mockTarget = await MockTarget.deploy();
        await mockTarget.deployed();

        // Desplegar timelock
        const BrainSafesTimelock = await ethers.getContractFactory("BrainSafesTimelock");
        timelock = await BrainSafesTimelock.deploy(MIN_DELAY);
        await timelock.deployed();

        // Configurar roles
        await timelock.grantRole(TIMELOCK_ADMIN_ROLE, admin.address);
        await timelock.grantRole(PROPOSER_ROLE, proposer.address);
        await timelock.grantRole(EXECUTOR_ROLE, executor.address);
        await timelock.grantRole(CANCELLER_ROLE, canceller.address);
        await timelock.grantRole(EMERGENCY_ROLE, emergency.address);

        // Configurar miembros de emergencia adicionales para quorum
        for (let i = 0; i < 6; i++) {
            const signer = ethers.Wallet.createRandom().connect(ethers.provider);
            await timelock.grantRole(EMERGENCY_ROLE, signer.address);
        }
    });

    describe("Inicialización", function () {
        it("Debería configurar delays correctamente", async function () {
            expect(await timelock.minDelay()).to.equal(MIN_DELAY);
            expect(await timelock.emergencyDelay()).to.equal(60 * 60); // 1 hour
        });

        it("Debería configurar roles correctamente", async function () {
            expect(await timelock.hasRole(TIMELOCK_ADMIN_ROLE, admin.address)).to.be.true;
            expect(await timelock.hasRole(PROPOSER_ROLE, proposer.address)).to.be.true;
            expect(await timelock.hasRole(EXECUTOR_ROLE, executor.address)).to.be.true;
            expect(await timelock.hasRole(CANCELLER_ROLE, canceller.address)).to.be.true;
            expect(await timelock.hasRole(EMERGENCY_ROLE, emergency.address)).to.be.true;
        });
    });

    describe("Programación de operaciones", function () {
        const value = 0;
        const data = "0x";
        const predecessor = ethers.constants.HashZero;

        it("Debería programar operación normal", async function () {
            const tx = await timelock.connect(proposer).schedule(
                mockTarget.address,
                value,
                data,
                predecessor,
                SALT,
                MIN_DELAY,
                false
            );

            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === "OperationScheduled");
            expect(event.args.target).to.equal(mockTarget.address);
            expect(event.args.value).to.equal(value);
            expect(event.args.delay).to.equal(MIN_DELAY);
        });

        it("Debería programar operación de emergencia", async function () {
            const tx = await timelock.connect(emergency).schedule(
                mockTarget.address,
                value,
                data,
                predecessor,
                SALT,
                60 * 60, // 1 hour
                true
            );

            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === "OperationScheduled");
            expect(event.args.target).to.equal(mockTarget.address);
            expect(event.args.delay).to.equal(60 * 60);
        });

        it("Debería rechazar delay insuficiente", async function () {
            await expect(
                timelock.connect(proposer).schedule(
                    mockTarget.address,
                    value,
                    data,
                    predecessor,
                    SALT,
                    60, // 1 minute
                    false
                )
            ).to.be.revertedWith("Insufficient delay");
        });

        it("Debería rechazar operación duplicada", async function () {
            await timelock.connect(proposer).schedule(
                mockTarget.address,
                value,
                data,
                predecessor,
                SALT,
                MIN_DELAY,
                false
            );

            await expect(
                timelock.connect(proposer).schedule(
                    mockTarget.address,
                    value,
                    data,
                    predecessor,
                    SALT,
                    MIN_DELAY,
                    false
                )
            ).to.be.revertedWith("Operation already queued");
        });
    });

    describe("Ejecución de operaciones", function () {
        let operationId;

        beforeEach(async function () {
            const tx = await timelock.connect(proposer).schedule(
                mockTarget.address,
                value,
                data,
                predecessor,
                SALT,
                MIN_DELAY,
                false
            );

            const receipt = await tx.wait();
            operationId = receipt.events.find(e => e.event === "OperationScheduled").args.operationId;

            // Avanzar tiempo
            await ethers.provider.send("evm_increaseTime", [MIN_DELAY]);
            await ethers.provider.send("evm_mine");
        });

        it("Debería ejecutar operación", async function () {
            await timelock.connect(executor).execute(
                mockTarget.address,
                value,
                data,
                predecessor,
                SALT
            );

            expect(await timelock.isOperationDone(operationId)).to.be.true;
        });

        it("Debería rechazar ejecución prematura", async function () {
            await ethers.provider.send("evm_increaseTime", [-MIN_DELAY]); // Revertir tiempo
            await ethers.provider.send("evm_mine");

            await expect(
                timelock.connect(executor).execute(
                    mockTarget.address,
                    value,
                    data,
                    predecessor,
                    SALT
                )
            ).to.be.revertedWith("Operation not ready");
        });

        it("Debería rechazar ejecución por no ejecutor", async function () {
            await expect(
                timelock.connect(other).execute(
                    mockTarget.address,
                    value,
                    data,
                    predecessor,
                    SALT
                )
            ).to.be.revertedWith("Not executor");
        });
    });

    describe("Cancelación de operaciones", function () {
        let operationId;

        beforeEach(async function () {
            const tx = await timelock.connect(proposer).schedule(
                mockTarget.address,
                value,
                data,
                predecessor,
                SALT,
                MIN_DELAY,
                false
            );

            const receipt = await tx.wait();
            operationId = receipt.events.find(e => e.event === "OperationScheduled").args.operationId;
        });

        it("Debería permitir cancelación por proposer", async function () {
            await timelock.connect(proposer).cancel(operationId);
            expect(await timelock.isOperationDone(operationId)).to.be.true;
        });

        it("Debería permitir cancelación por canceller", async function () {
            await timelock.connect(canceller).cancel(operationId);
            expect(await timelock.isOperationDone(operationId)).to.be.true;
        });

        it("Debería rechazar cancelación por otros", async function () {
            await expect(
                timelock.connect(other).cancel(operationId)
            ).to.be.revertedWith("Not authorized");
        });
    });

    describe("Configuración", function () {
        it("Debería actualizar delay mínimo", async function () {
            const newDelay = 2 * MIN_DELAY;
            await timelock.connect(admin).updateMinDelay(newDelay);
            expect(await timelock.minDelay()).to.equal(newDelay);
        });

        it("Debería actualizar delay de emergencia", async function () {
            const newDelay = 2 * 60 * 60; // 2 hours
            await timelock.connect(admin).updateEmergencyDelay(newDelay);
            expect(await timelock.emergencyDelay()).to.equal(newDelay);
        });

        it("Debería rechazar delay inválido", async function () {
            await expect(
                timelock.connect(admin).updateMinDelay(31 * 24 * 60 * 60) // 31 days
            ).to.be.revertedWith("Invalid delay");
        });

        it("Debería rechazar delay de emergencia mayor que mínimo", async function () {
            await expect(
                timelock.connect(admin).updateEmergencyDelay(MIN_DELAY + 1)
            ).to.be.revertedWith("Delay too long");
        });
    });

    describe("Consultas", function () {
        let operationId;

        beforeEach(async function () {
            const tx = await timelock.connect(proposer).schedule(
                mockTarget.address,
                value,
                data,
                predecessor,
                SALT,
                MIN_DELAY,
                false
            );

            const receipt = await tx.wait();
            operationId = receipt.events.find(e => e.event === "OperationScheduled").args.operationId;
        });

        it("Debería verificar operación pendiente", async function () {
            expect(await timelock.isOperationPending(operationId)).to.be.true;
        });

        it("Debería verificar operación lista", async function () {
            await ethers.provider.send("evm_increaseTime", [MIN_DELAY]);
            await ethers.provider.send("evm_mine");

            expect(await timelock.isOperationReady(operationId)).to.be.true;
        });

        it("Debería obtener timestamp correcto", async function () {
            const timestamp = await timelock.getTimestamp(operationId);
            expect(timestamp).to.be.gt(0);
        });
    });
}); 