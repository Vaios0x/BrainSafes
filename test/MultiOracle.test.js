const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MultiOracle", function () {
    let multiOracle;
    let chainlinkOracle;
    let api3Oracle;
    let supraOracle;
    let chronicleOracle;
    let owner;
    let manager;
    let user;

    beforeEach(async function () {
        [owner, manager, user] = await ethers.getSigners();

        // Desplegar mocks de oráculos
        const MockChainlink = await ethers.getContractFactory("MockChainlinkOracle");
        chainlinkOracle = await MockChainlink.deploy();
        await chainlinkOracle.deployed();

        const MockApi3 = await ethers.getContractFactory("MockApi3Oracle");
        api3Oracle = await MockApi3.deploy();
        await api3Oracle.deployed();

        const MockSupra = await ethers.getContractFactory("MockSupraOracle");
        supraOracle = await MockSupra.deploy();
        await supraOracle.deployed();

        const MockChronicle = await ethers.getContractFactory("MockChronicleOracle");
        chronicleOracle = await MockChronicle.deploy();
        await chronicleOracle.deployed();

        // Desplegar MultiOracle
        const MultiOracle = await ethers.getContractFactory("MultiOracle");
        multiOracle = await MultiOracle.deploy(
            chainlinkOracle.address,
            api3Oracle.address,
            supraOracle.address,
            chronicleOracle.address
        );
        await multiOracle.deployed();

        // Configurar roles
        const ORACLE_MANAGER_ROLE = await multiOracle.ORACLE_MANAGER_ROLE();
        await multiOracle.grantRole(ORACLE_MANAGER_ROLE, manager.address);
    });

    describe("Inicialización", function () {
        it("Debería configurar oráculos correctamente", async function () {
            expect(await multiOracle.chainlinkOracle()).to.equal(chainlinkOracle.address);
            expect(await multiOracle.api3Oracle()).to.equal(api3Oracle.address);
            expect(await multiOracle.supraOracle()).to.equal(supraOracle.address);
            expect(await multiOracle.chronicleOracle()).to.equal(chronicleOracle.address);
        });

        it("Debería autorizar oráculos iniciales", async function () {
            expect(await multiOracle.authorizedOracles(chainlinkOracle.address)).to.be.true;
            expect(await multiOracle.authorizedOracles(api3Oracle.address)).to.be.true;
            expect(await multiOracle.authorizedOracles(supraOracle.address)).to.be.true;
            expect(await multiOracle.authorizedOracles(chronicleOracle.address)).to.be.true;
        });
    });

    describe("Gestión de oráculos", function () {
        it("Debería permitir autorizar nuevo oráculo", async function () {
            const newOracle = ethers.Wallet.createRandom().address;
            await multiOracle.connect(manager).setOracleAuthorization(newOracle, true);
            expect(await multiOracle.authorizedOracles(newOracle)).to.be.true;
        });

        it("Debería permitir desautorizar oráculo", async function () {
            await multiOracle.connect(manager).setOracleAuthorization(chainlinkOracle.address, false);
            expect(await multiOracle.authorizedOracles(chainlinkOracle.address)).to.be.false;
        });

        it("Debería revertir si no es manager", async function () {
            const newOracle = ethers.Wallet.createRandom().address;
            await expect(
                multiOracle.connect(user).setOracleAuthorization(newOracle, true)
            ).to.be.revertedWith("AccessControl");
        });
    });

    describe("Obtención de datos", function () {
        beforeEach(async function () {
            // Configurar datos mock
            await chainlinkOracle.setPrice(ethers.utils.parseEther("100"));
            await api3Oracle.setData(ethers.utils.formatBytes32String("test"), ethers.utils.parseEther("102"));
            await supraOracle.setData(ethers.utils.formatBytes32String("test"), ethers.utils.parseEther("101"));
            await chronicleOracle.setData(ethers.utils.formatBytes32String("test"), ethers.utils.parseEther("103"));
        });

        it("Debería obtener precio de token", async function () {
            const price = await multiOracle.getTokenPrice(ethers.constants.AddressZero);
            expect(price).to.equal(ethers.utils.parseEther("100"));
        });

        it("Debería obtener datos educativos", async function () {
            const data = await multiOracle.getEducationalData(ethers.utils.formatBytes32String("test"));
            expect(ethers.utils.parseEther("102")).to.equal(ethers.BigNumber.from(data));
        });

        it("Debería obtener datos históricos", async function () {
            const timestamp = Math.floor(Date.now() / 1000);
            const data = await multiOracle.getHistoricalData(
                ethers.utils.formatBytes32String("test"),
                timestamp
            );
            expect(data).to.equal(ethers.utils.parseEther("103"));
        });
    });

    describe("Agregación de datos", function () {
        const testKey = ethers.utils.formatBytes32String("test");

        beforeEach(async function () {
            // Enviar respuestas de oráculos
            await multiOracle.connect(manager).receiveOracleResponse(
                chainlinkOracle.address,
                testKey,
                ethers.utils.parseEther("100")
            );
            await multiOracle.connect(manager).receiveOracleResponse(
                api3Oracle.address,
                testKey,
                ethers.utils.parseEther("102")
            );
        });

        it("Debería agregar datos correctamente", async function () {
            const [value, numResponses, timestamp] = await multiOracle.getAggregatedData(testKey);
            expect(value).to.equal(ethers.utils.parseEther("101")); // Promedio
            expect(numResponses).to.equal(2);
            expect(timestamp).to.be.gt(0);
        });

        it("Debería rechazar desviación excesiva", async function () {
            await expect(
                multiOracle.connect(manager).receiveOracleResponse(
                    supraOracle.address,
                    testKey,
                    ethers.utils.parseEther("200") // >5% desviación
                )
            ).to.be.revertedWith("Excessive deviation between oracles");
        });

        it("Debería requerir mínimo de respuestas", async function () {
            const newKey = ethers.utils.formatBytes32String("new");
            await multiOracle.connect(manager).receiveOracleResponse(
                chainlinkOracle.address,
                newKey,
                ethers.utils.parseEther("100")
            );

            await expect(
                multiOracle.getAggregatedData(newKey)
            ).to.be.revertedWith("Insufficient oracle responses");
        });
    });

    describe("Administración", function () {
        it("Debería permitir pausar", async function () {
            await multiOracle.connect(manager).pause();
            expect(await multiOracle.paused()).to.be.true;
        });

        it("Debería permitir despausar", async function () {
            await multiOracle.connect(manager).pause();
            await multiOracle.connect(manager).unpause();
            expect(await multiOracle.paused()).to.be.false;
        });

        it("Debería actualizar dirección de oráculo", async function () {
            const newOracle = ethers.Wallet.createRandom().address;
            await multiOracle.connect(manager).updateOracleAddress("chainlink", newOracle);
            expect(await multiOracle.chainlinkOracle()).to.equal(newOracle);
        });

        it("Debería revertir tipo de oráculo inválido", async function () {
            await expect(
                multiOracle.connect(manager).updateOracleAddress(
                    "invalid",
                    ethers.Wallet.createRandom().address
                )
            ).to.be.revertedWith("Invalid oracle type");
        });
    });
}); 