const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DistributedCacheV2", function () {
    let DistributedCacheV2, cache, admin, node1, node2, syncer;

    beforeEach(async function () {
        [admin, node1, node2, syncer] = await ethers.getSigners();
        DistributedCacheV2 = await ethers.getContractFactory("DistributedCacheV2");
        cache = await DistributedCacheV2.deploy();
        await cache.grantRole(await cache.CACHE_ADMIN(), admin.address);
        await cache.grantRole(await cache.CACHE_NODE(), node1.address);
        await cache.grantRole(await cache.CACHE_NODE(), node2.address);
        await cache.grantRole(await cache.SYNC_OPERATOR(), syncer.address);
    });

    it("debe agregar y remover nodos", async function () {
        const newNode = ethers.Wallet.createRandom().address;
        await cache.connect(admin).addNode(newNode);
        expect(await cache.activeNodes(newNode)).to.be.true;
        await cache.connect(admin).removeNode(newNode);
        expect(await cache.activeNodes(newNode)).to.be.false;
    });

    it("debe setear y obtener cache", async function () {
        const key = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("k1"));
        const value = ethers.utils.toUtf8Bytes("v1");
        const expires = Math.floor(Date.now() / 1000) + 3600;
        await cache.connect(node1).set(key, value, expires);
        const [val, valid, exp, ver] = await cache.get(key);
        expect(valid).to.be.true;
        expect(exp).to.be.gt(Math.floor(Date.now() / 1000));
        expect(ver).to.equal(1);
    });

    it("debe invalidar cache", async function () {
        const key = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("k2"));
        const value = ethers.utils.toUtf8Bytes("v2");
        const expires = Math.floor(Date.now() / 1000) + 3600;
        await cache.connect(node1).set(key, value, expires);
        await cache.connect(node1).invalidate(key);
        const [val, valid] = await cache.get(key);
        expect(valid).to.be.false;
    });

    it("debe sincronizar cache entre nodos", async function () {
        const key = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("k3"));
        const value = ethers.utils.toUtf8Bytes("v3");
        const expires = Math.floor(Date.now() / 1000) + 3600;
        await cache.connect(node1).set(key, value, expires);
        await expect(
            cache.connect(syncer).syncCache(key, node2.address)
        ).to.emit(cache, "CacheSynced");
    });

    it("debe restringir pausabilidad a admin", async function () {
        await cache.connect(admin).pause();
        expect(await cache.paused()).to.be.true;
        await cache.connect(admin).unpause();
        expect(await cache.paused()).to.be.false;
    });
}); 