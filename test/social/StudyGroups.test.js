const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("StudyGroups", function () {
  let StudyGroups, groups, admin, user1, user2, user3;

  beforeEach(async function () {
    [admin, user1, user2, user3] = await ethers.getSigners();
    StudyGroups = await ethers.getContractFactory("StudyGroups");
    groups = await StudyGroups.deploy();
    await groups.deployed();
  });

  it("permite crear grupo y unirse (abierto)", async function () {
    await expect(groups.connect(user1).createGroup("Math", "desc", "ipfs://meta", true))
      .to.emit(groups, "GroupCreated");
    await expect(groups.connect(user2).joinGroup(1))
      .to.emit(groups, "MemberJoined");
    expect(await groups.isGroupMember(1, user2.address)).to.be.true;
  });

  it("solo admin puede invitar, solo invitados pueden unirse si cerrado", async function () {
    await groups.connect(user1).createGroup("Math", "desc", "ipfs://meta", false);
    await expect(groups.connect(user2).joinGroup(1)).to.be.reverted;
    await expect(groups.connect(user2).inviteMember(1, user3.address)).to.be.reverted;
    await groups.connect(user1).inviteMember(1, user2.address);
    await expect(groups.connect(user2).joinGroup(1)).to.emit(groups, "MemberJoined");
  });

  it("permite salir y transferir admin", async function () {
    await groups.connect(user1).createGroup("Math", "desc", "ipfs://meta", true);
    await groups.connect(user2).joinGroup(1);
    await expect(groups.connect(user2).leaveGroup(1)).to.emit(groups, "MemberLeft");
    await groups.connect(user2).joinGroup(1);
    await expect(groups.connect(user1).transferAdmin(1, user2.address)).to.emit(groups, "AdminTransferred");
  });
}); 