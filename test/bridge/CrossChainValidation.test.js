const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CrossChainValidation", function () {
    let CrossChainValidation, validation, admin, relayer, user;

    beforeEach(async function () {
        [admin, relayer, user] = await ethers.getSigners();
        CrossChainValidation = await ethers.getContractFactory("CrossChainValidation");
        validation = await CrossChainValidation.deploy();
        await validation.grantRole(await validation.VALIDATION_ADMIN(), admin.address);
        await validation.grantRole(await validation.RELAYER_ROLE(), relayer.address);
    });

    it("debe validar mensaje con Merkle y firma", async function () {
        const messageId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("msg1"));
        const merkleProof = [ethers.utils.keccak256(ethers.utils.toUtf8Bytes("proof"))];
        const signature = ethers.utils.hexlify(ethers.utils.randomBytes(65));
        const nonce = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("nonce1"));
        const expectedSigner = relayer.address;
        await expect(
            validation.connect(relayer).validateMessage(messageId, merkleProof, signature, nonce, expectedSigner)
        ).to.emit(validation, "MessageValidated");
    });

    it("debe prevenir replay de nonce", async function () {
        const messageId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("msg2"));
        const merkleProof = [ethers.utils.keccak256(ethers.utils.toUtf8Bytes("proof"))];
        const signature = ethers.utils.hexlify(ethers.utils.randomBytes(65));
        const nonce = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("nonce2"));
        const expectedSigner = relayer.address;
        await validation.connect(relayer).validateMessage(messageId, merkleProof, signature, nonce, expectedSigner);
        await expect(
            validation.connect(relayer).validateMessage(messageId, merkleProof, signature, nonce, expectedSigner)
        ).to.be.revertedWith("Nonce already used");
    });

    it("debe requerir signer válido", async function () {
        const messageId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("msg3"));
        const merkleProof = [ethers.utils.keccak256(ethers.utils.toUtf8Bytes("proof"))];
        const signature = ethers.utils.hexlify(ethers.utils.randomBytes(65));
        const nonce = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("nonce3"));
        await expect(
            validation.connect(relayer).validateMessage(messageId, merkleProof, signature, nonce, ethers.constants.AddressZero)
        ).to.be.revertedWith("Invalid signer");
    });

    it("debe pausar y despausar", async function () {
        await validation.pause();
        expect(await validation.paused()).to.be.true;
        await validation.unpause();
        expect(await validation.paused()).to.be.false;
    });
}); 