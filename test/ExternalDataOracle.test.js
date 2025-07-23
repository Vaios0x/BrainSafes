const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ExternalDataOracle", function () {
    let oracle;
    let mockChainlink;
    let mockApi3;
    let owner;
    let admin;
    let provider;
    let validator;
    let other;

    const ORACLE_ADMIN_ROLE = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes("ORACLE_ADMIN_ROLE")
    );
    const DATA_PROVIDER_ROLE = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes("DATA_PROVIDER_ROLE")
    );
    const VALIDATOR_ROLE = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes("VALIDATOR_ROLE")
    );

    const MAX_DEVIATION = 500; // 5%
    const MIN_CONFIDENCE = 80; // 80%
    const MAX_AGE = 24 * 60 * 60; // 24 hours
    const REQUIRED_SOURCES = 2;

    beforeEach(async function () {
        [owner, admin, provider, validator, other] = await ethers.getSigners();

        // Desplegar mocks
        const MockChainlink = await ethers.getContractFactory("MockChainlinkOracle");
        mockChainlink = await MockChainlink.deploy();
        await mockChainlink.deployed();

        const MockApi3 = await ethers.getContractFactory("MockApi3Oracle");
        mockApi3 = await MockApi3.deploy();
        await mockApi3.deployed();

        // Desplegar oráculo
        const ExternalDataOracle = await ethers.getContractFactory("ExternalDataOracle");
        oracle = await ExternalDataOracle.deploy(
            MAX_DEVIATION,
            MIN_CONFIDENCE,
            MAX_AGE,
            REQUIRED_SOURCES
        );
        await oracle.deployed();

        // Configurar roles
        await oracle.grantRole(ORACLE_ADMIN_ROLE, admin.address);
        await oracle.grantRole(DATA_PROVIDER_ROLE, provider.address);
        await oracle.grantRole(VALIDATOR_ROLE, validator.address);
    });

    describe("Inicialización", function () {
        it("Debería configurar parámetros correctamente", async function () {
            const config = await oracle.validationConfig();
            expect(config.maxDeviation).to.equal(MAX_DEVIATION);
            expect(config.minConfidence).to.equal(MIN_CONFIDENCE);
            expect(config.maxAge).to.equal(MAX_AGE);
            expect(config.requiredSources).to.equal(REQUIRED_SOURCES);
        });

        it("Debería configurar roles correctamente", async function () {
            expect(await oracle.hasRole(ORACLE_ADMIN_ROLE, admin.address)).to.be.true;
            expect(await oracle.hasRole(DATA_PROVIDER_ROLE, provider.address)).to.be.true;
            expect(await oracle.hasRole(VALIDATOR_ROLE, validator.address)).to.be.true;
        });
    });

    describe("Fuentes de datos", function () {
        it("Debería añadir fuente Chainlink", async function () {
            const tx = await oracle.connect(admin).addDataSource(
                "ETH/USD Chainlink",
                0, // CHAINLINK
                mockChainlink.address,
                ethers.utils.formatBytes32String("ETH-USD"),
                2, // minimumSources
                5 * 60, // 5 minutos
                1 * 60 * 60 // 1 hora
            );

            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === "DataSourceAdded");
            expect(event.args.name).to.equal("ETH/USD Chainlink");
            expect(event.args.sourceType).to.equal(0);

            const source = await oracle.getDataSource(1);
            expect(source.name).to.equal("ETH/USD Chainlink");
            expect(source.oracleAddress).to.equal(mockChainlink.address);
            expect(source.isActive).to.be.true;
        });

        it("Debería añadir fuente API3", async function () {
            const tx = await oracle.connect(admin).addDataSource(
                "BTC/USD API3",
                1, // API3
                mockApi3.address,
                ethers.utils.formatBytes32String("BTC-USD"),
                2,
                5 * 60,
                1 * 60 * 60
            );

            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === "DataSourceAdded");
            expect(event.args.name).to.equal("BTC/USD API3");
            expect(event.args.sourceType).to.equal(1);
        });

        it("Debería rechazar intervalo inválido", async function () {
            await expect(
                oracle.connect(admin).addDataSource(
                    "Test Source",
                    0,
                    mockChainlink.address,
                    ethers.utils.formatBytes32String("TEST"),
                    2,
                    30, // 30 segundos
                    1 * 60 * 60
                )
            ).to.be.revertedWith("Invalid interval");
        });

        it("Debería actualizar fuente", async function () {
            await oracle.connect(admin).addDataSource(
                "Test Source",
                0,
                mockChainlink.address,
                ethers.utils.formatBytes32String("TEST"),
                2,
                5 * 60,
                1 * 60 * 60
            );

            await oracle.connect(admin).updateDataSource(
                1,
                3, // nuevo minimumSources
                10 * 60, // nuevo intervalo
                2 * 60 * 60, // nuevo periodo
                true
            );

            const source = await oracle.getDataSource(1);
            expect(source.minimumSources).to.equal(3);
            expect(source.updateInterval).to.equal(10 * 60);
            expect(source.validityPeriod).to.equal(2 * 60 * 60);
        });
    });

    describe("Actualización de datos", function () {
        let sourceId;
        const dataKey = ethers.utils.formatBytes32String("ETH-USD");

        beforeEach(async function () {
            const tx = await oracle.connect(admin).addDataSource(
                "ETH/USD Chainlink",
                0,
                mockChainlink.address,
                dataKey,
                2,
                5 * 60,
                1 * 60 * 60
            );
            sourceId = tx.value;

            // Configurar mock Chainlink
            await mockChainlink.setPrice(ethers.utils.parseEther("2000"));
        });

        it("Debería actualizar datos Chainlink", async function () {
            await oracle.updateChainlinkData(sourceId, dataKey);

            const data = await oracle.getLatestData(dataKey);
            expect(data.value).to.be.gt(0);
            expect(data.isValid).to.be.true;

            const history = await oracle.getDataHistory(dataKey);
            expect(history.length).to.equal(1);
            expect(history[0].source).to.equal("Chainlink");
        });

        it("Debería respetar intervalo de actualización", async function () {
            await oracle.updateChainlinkData(sourceId, dataKey);

            await expect(
                oracle.updateChainlinkData(sourceId, dataKey)
            ).to.be.revertedWith("Too soon to update");
        });

        it("Debería actualizar datos personalizados", async function () {
            const customSourceId = (await oracle.connect(admin).addDataSource(
                "Custom Source",
                2, // CUSTOM
                ethers.constants.AddressZero,
                dataKey,
                1,
                5 * 60,
                1 * 60 * 60
            )).value;

            await oracle.connect(provider).updateCustomData(
                customSourceId,
                dataKey,
                ethers.utils.parseEther("2100"),
                90 // 90% confidence
            );

            const data = await oracle.getLatestData(dataKey);
            expect(data.value).to.be.gt(0);
            expect(data.isValid).to.be.true;
        });
    });

    describe("Agregación de datos", function () {
        const dataKey = ethers.utils.formatBytes32String("ETH-USD");

        beforeEach(async function () {
            // Añadir múltiples fuentes
            await oracle.connect(admin).addDataSource(
                "Chainlink Source",
                0,
                mockChainlink.address,
                dataKey,
                2,
                5 * 60,
                1 * 60 * 60
            );

            await oracle.connect(admin).addDataSource(
                "API3 Source",
                1,
                mockApi3.address,
                dataKey,
                2,
                5 * 60,
                1 * 60 * 60
            );

            await oracle.connect(admin).addDataSource(
                "Custom Source",
                2,
                ethers.constants.AddressZero,
                dataKey,
                2,
                5 * 60,
                1 * 60 * 60
            );

            // Configurar precios similares
            await mockChainlink.setPrice(ethers.utils.parseEther("2000"));
            await mockApi3.setData(dataKey, ethers.utils.parseEther("2050"));
        });

        it("Debería agregar datos de múltiples fuentes", async function () {
            // Actualizar datos de todas las fuentes
            await oracle.updateChainlinkData(1, dataKey);
            await oracle.updateApi3Data(2, dataKey);
            await oracle.connect(provider).updateCustomData(
                3,
                dataKey,
                ethers.utils.parseEther("2025"),
                90
            );

            const aggregated = await oracle.getAggregatedData(dataKey);
            expect(aggregated.numSources).to.equal(3);
            expect(aggregated.isValid).to.be.true;
            expect(aggregated.deviation).to.be.lt(MAX_DEVIATION);
        });

        it("Debería rechazar datos con alta desviación", async function () {
            // Configurar precio muy diferente
            await mockApi3.setData(dataKey, ethers.utils.parseEther("3000"));

            await oracle.updateChainlinkData(1, dataKey);
            await oracle.updateApi3Data(2, dataKey);

            const aggregated = await oracle.getAggregatedData(dataKey);
            expect(aggregated.isValid).to.be.false;
        });

        it("Debería aplicar pesos correctamente", async function () {
            await oracle.updateChainlinkData(1, dataKey);
            await oracle.updateApi3Data(2, dataKey);

            const aggregated = await oracle.getAggregatedData(dataKey);
            const value = aggregated.value;

            // El valor agregado debería estar entre los dos precios
            expect(value).to.be.gt(ethers.utils.parseEther("2000"));
            expect(value).to.be.lt(ethers.utils.parseEther("2050"));
        });
    });

    describe("Administración", function () {
        it("Debería actualizar configuración de validación", async function () {
            await oracle.connect(admin).updateValidationConfig(
                400, // 4%
                85, // 85%
                12 * 60 * 60, // 12 horas
                3 // 3 fuentes
            );

            const config = await oracle.validationConfig();
            expect(config.maxDeviation).to.equal(400);
            expect(config.minConfidence).to.equal(85);
            expect(config.maxAge).to.equal(12 * 60 * 60);
            expect(config.requiredSources).to.equal(3);
        });

        it("Debería permitir pausar/despausar", async function () {
            await oracle.connect(admin).pause();
            expect(await oracle.paused()).to.be.true;

            const sourceId = (await oracle.connect(admin).addDataSource(
                "Test Source",
                0,
                mockChainlink.address,
                ethers.utils.formatBytes32String("TEST"),
                2,
                5 * 60,
                1 * 60 * 60
            )).value;

            await expect(
                oracle.updateChainlinkData(
                    sourceId,
                    ethers.utils.formatBytes32String("TEST")
                )
            ).to.be.revertedWith("Pausable: paused");

            await oracle.connect(admin).unpause();
            expect(await oracle.paused()).to.be.false;
        });
    });
}); 