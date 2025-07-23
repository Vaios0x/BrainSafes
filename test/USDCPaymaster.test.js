const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("USDCPaymaster", function () {
    let usdcPaymaster;
    let mockUsdc;
    let mockContract;
    let owner;
    let operator;
    let user;
    let otherUser;

    const OPERATOR_ROLE = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes("OPERATOR_ROLE")
    );

    beforeEach(async function () {
        [owner, operator, user, otherUser] = await ethers.getSigners();

        // Desplegar USDC mock
        const MockERC20 = await ethers.getContractFactory("MockERC20");
        mockUsdc = await MockERC20.deploy("USD Coin", "USDC", 6);
        await mockUsdc.deployed();

        // Desplegar contrato mock para probar
        const MockContract = await ethers.getContractFactory("MockContract");
        mockContract = await MockContract.deploy();
        await mockContract.deployed();

        // Desplegar USDCPaymaster
        const USDCPaymaster = await ethers.getContractFactory("USDCPaymaster");
        usdcPaymaster = await USDCPaymaster.deploy(mockUsdc.address);
        await usdcPaymaster.deployed();

        // Configurar roles
        await usdcPaymaster.grantRole(OPERATOR_ROLE, operator.address);

        // Dar USDC al usuario
        await mockUsdc.mint(user.address, ethers.utils.parseUnits("10000", 6));
        await mockUsdc.connect(user).approve(usdcPaymaster.address, ethers.constants.MaxUint256);
    });

    describe("Inicialización", function () {
        it("Debería configurar USDC correctamente", async function () {
            expect(await usdcPaymaster.usdc()).to.equal(mockUsdc.address);
        });

        it("Debería asignar roles correctamente", async function () {
            expect(await usdcPaymaster.hasRole(OPERATOR_ROLE, operator.address)).to.be.true;
        });

        it("Debería revertir con dirección USDC inválida", async function () {
            const USDCPaymaster = await ethers.getContractFactory("USDCPaymaster");
            await expect(
                USDCPaymaster.deploy(ethers.constants.AddressZero)
            ).to.be.revertedWith("Invalid USDC address");
        });
    });

    describe("Sponsoreo de gas", function () {
        beforeEach(async function () {
            // Whitelist usuario y contrato
            await usdcPaymaster.connect(operator).whitelistUser(user.address, true);
            await usdcPaymaster.connect(operator).sponsorContract(mockContract.address, true);

            // Sponsorear función de prueba
            const functionSig = mockContract.interface.getSighash("testFunction");
            await usdcPaymaster.connect(operator).sponsorFunction(functionSig, true);
        });

        it("Debería sponsorear gas correctamente", async function () {
            const txData = mockContract.interface.encodeFunctionData("testFunction", [123]);
            
            await expect(
                usdcPaymaster.sponsorGas(user.address, txData)
            ).to.emit(usdcPaymaster, "GasSponsored");

            const gasInfo = await usdcPaymaster.getUserGasInfo(user.address);
            expect(gasInfo.totalGasSponsored).to.be.gt(0);
            expect(gasInfo.usdcSpent).to.be.gt(0);
        });

        it("Debería revertir si usuario no está whitelisted", async function () {
            const txData = mockContract.interface.encodeFunctionData("testFunction", [123]);
            
            await expect(
                usdcPaymaster.sponsorGas(otherUser.address, txData)
            ).to.be.revertedWith("User not whitelisted");
        });

        it("Debería revertir si función no está sponsoreada", async function () {
            const txData = mockContract.interface.encodeFunctionData("nonSponsoredFunction", []);
            
            await expect(
                usdcPaymaster.sponsorGas(user.address, txData)
            ).to.be.revertedWith("Function not sponsored");
        });

        it("Debería revertir si contrato no está sponsoreado", async function () {
            const NonSponsoredContract = await ethers.getContractFactory("MockContract");
            const nonSponsoredContract = await NonSponsoredContract.deploy();
            
            const txData = nonSponsoredContract.interface.encodeFunctionData("testFunction", [123]);
            
            await expect(
                usdcPaymaster.sponsorGas(user.address, txData)
            ).to.be.revertedWith("Contract not sponsored");
        });

        it("Debería revertir si balance USDC es insuficiente", async function () {
            // Quemar todo el USDC del usuario
            const balance = await mockUsdc.balanceOf(user.address);
            await mockUsdc.connect(user).transfer(otherUser.address, balance);
            
            const txData = mockContract.interface.encodeFunctionData("testFunction", [123]);
            
            await expect(
                usdcPaymaster.sponsorGas(user.address, txData)
            ).to.be.revertedWith("Insufficient USDC balance");
        });
    });

    describe("Gestión de whitelist", function () {
        it("Debería whitelist un usuario", async function () {
            await usdcPaymaster.connect(operator).whitelistUser(user.address, true);
            const gasInfo = await usdcPaymaster.getUserGasInfo(user.address);
            expect(gasInfo.isWhitelisted).to.be.true;
        });

        it("Debería whitelist múltiples usuarios", async function () {
            await usdcPaymaster.connect(operator).whitelistUsers(
                [user.address, otherUser.address],
                true
            );
            
            const gasInfo1 = await usdcPaymaster.getUserGasInfo(user.address);
            const gasInfo2 = await usdcPaymaster.getUserGasInfo(otherUser.address);
            
            expect(gasInfo1.isWhitelisted).to.be.true;
            expect(gasInfo2.isWhitelisted).to.be.true;
        });

        it("Debería revertir si no es operator", async function () {
            await expect(
                usdcPaymaster.connect(user).whitelistUser(otherUser.address, true)
            ).to.be.revertedWith("AccessControl");
        });
    });

    describe("Gestión de contratos y funciones", function () {
        it("Debería sponsorear un contrato", async function () {
            await usdcPaymaster.connect(operator).sponsorContract(mockContract.address, true);
            expect(await usdcPaymaster.sponsoredContracts(mockContract.address)).to.be.true;
        });

        it("Debería sponsorear una función", async function () {
            const functionSig = mockContract.interface.getSighash("testFunction");
            await usdcPaymaster.connect(operator).sponsorFunction(functionSig, true);
            expect(await usdcPaymaster.sponsoredFunctions(functionSig)).to.be.true;
        });
    });

    describe("Configuración", function () {
        it("Debería actualizar markup de gas", async function () {
            const newMarkup = 1000; // 10%
            await usdcPaymaster.updateGasMarkup(newMarkup);
            expect(await usdcPaymaster.gasMarkup()).to.equal(newMarkup);
        });

        it("Debería revertir si markup es muy alto", async function () {
            await expect(
                usdcPaymaster.updateGasMarkup(2100) // 21%
            ).to.be.revertedWith("Markup too high");
        });

        it("Debería actualizar balance mínimo", async function () {
            const newBalance = ethers.utils.parseUnits("2000", 6);
            await usdcPaymaster.updateMinBalance(newBalance);
            expect(await usdcPaymaster.minUsdcBalance()).to.equal(newBalance);
        });

        it("Debería actualizar gas máximo", async function () {
            const newMax = 2000000;
            await usdcPaymaster.updateMaxGas(newMax);
            expect(await usdcPaymaster.maxGasSponsored()).to.equal(newMax);
        });
    });

    describe("Verificación de transacciones", function () {
        beforeEach(async function () {
            await usdcPaymaster.connect(operator).whitelistUser(user.address, true);
            await usdcPaymaster.connect(operator).sponsorContract(mockContract.address, true);
            
            const functionSig = mockContract.interface.getSighash("testFunction");
            await usdcPaymaster.connect(operator).sponsorFunction(functionSig, true);
        });

        it("Debería verificar transacción sponsoreable", async function () {
            const txData = mockContract.interface.encodeFunctionData("testFunction", [123]);
            
            const [sponsoreable, reason] = await usdcPaymaster.isTransactionSponsoreable(
                user.address,
                txData
            );
            
            expect(sponsoreable).to.be.true;
            expect(reason).to.equal("Transaction sponsoreable");
        });

        it("Debería identificar transacción no sponsoreable", async function () {
            const txData = mockContract.interface.encodeFunctionData("nonSponsoredFunction", []);
            
            const [sponsoreable, reason] = await usdcPaymaster.isTransactionSponsoreable(
                user.address,
                txData
            );
            
            expect(sponsoreable).to.be.false;
            expect(reason).to.equal("Function not sponsored");
        });
    });

    describe("Administración", function () {
        it("Debería permitir retirar USDC", async function () {
            const amount = ethers.utils.parseUnits("100", 6);
            await mockUsdc.mint(usdcPaymaster.address, amount);
            
            await usdcPaymaster.withdrawUsdc(owner.address, amount);
            expect(await mockUsdc.balanceOf(owner.address)).to.equal(amount);
        });

        it("Debería permitir pausar", async function () {
            await usdcPaymaster.pause();
            expect(await usdcPaymaster.paused()).to.be.true;
        });

        it("Debería permitir despausar", async function () {
            await usdcPaymaster.pause();
            await usdcPaymaster.unpause();
            expect(await usdcPaymaster.paused()).to.be.false;
        });
    });
}); 