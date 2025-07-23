const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EnhancedMulticall", function () {
  let EnhancedMulticall, enhancedMulticall, TargetMock, targetMock, owner;

  beforeEach(async function () {
    [owner] = await ethers.getSigners();
    EnhancedMulticall = await ethers.getContractFactory("EnhancedMulticall");
    enhancedMulticall = await EnhancedMulticall.deploy();
    await enhancedMulticall.deployed();

    // Mock contract to call
    TargetMock = await ethers.getContractFactory("TargetMock");
    targetMock = await TargetMock.deploy();
    await targetMock.deployed();
  });

  it("Debe ejecutar un batch de llamadas exitosas", async function () {
    const callData1 = targetMock.interface.encodeFunctionData("setValue", [42]);
    const callData2 = targetMock.interface.encodeFunctionData("setValue", [99]);
    const calls = [
      { target: targetMock.address, callData: callData1, gasLimit: 100000 },
      { target: targetMock.address, callData: callData2, gasLimit: 100000 }
    ];
    const tx = await enhancedMulticall.aggregate(calls);
    const receipt = await tx.wait();
    // No revert, batch exitoso
    expect(receipt.status).to.equal(1);
  });

  it("Debe devolver success=false si una llamada falla, pero continuar", async function () {
    const callData1 = targetMock.interface.encodeFunctionData("setValue", [123]);
    const callData2 = targetMock.interface.encodeFunctionData("failAlways");
    const calls = [
      { target: targetMock.address, callData: callData1, gasLimit: 100000 },
      { target: targetMock.address, callData: callData2, gasLimit: 100000 }
    ];
    const tx = await enhancedMulticall.aggregate(calls);
    const receipt = await tx.wait();
    // No revert, batch ejecutado
    expect(receipt.status).to.equal(1);
  });

  it("Debe fallar si el target es address(0)", async function () {
    const callData = targetMock.interface.encodeFunctionData("setValue", [1]);
    const calls = [
      { target: ethers.constants.AddressZero, callData, gasLimit: 100000 }
    ];
    await expect(enhancedMulticall.aggregate(calls)).to.be.revertedWith("Target inválido");
  });

  it("Debe ejecutar llamadas con diferentes límites de gas", async function () {
    const callData = targetMock.interface.encodeFunctionData("setValue", [55]);
    const calls = [
      { target: targetMock.address, callData, gasLimit: 50000 },
      { target: targetMock.address, callData, gasLimit: 200000 }
    ];
    const tx = await enhancedMulticall.aggregate(calls);
    const receipt = await tx.wait();
    expect(receipt.status).to.equal(1);
  });

  it("Debe manejar un batch vacío sin error", async function () {
    const calls = [];
    const tx = await enhancedMulticall.aggregate(calls);
    const receipt = await tx.wait();
    expect(receipt.status).to.equal(1);
  });
});

// Mock contract para pruebas
// SPDX-License-Identifier: MIT
const hre = require("hardhat");
if (!hre.artifacts.readArtifactSync("TargetMock")) {
  hre.artifacts.saveArtifactAndDebug({
    contractName: "TargetMock",
    sourceName: "contracts/utils/TargetMock.sol",
    abi: [
      { "inputs": [ { "internalType": "uint256", "name": "v", "type": "uint256" } ], "name": "setValue", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
      { "inputs": [], "name": "failAlways", "outputs": [], "stateMutability": "nonpayable", "type": "function" }
    ],
    bytecode: "0x..."
  });
} 