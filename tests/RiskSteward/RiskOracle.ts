import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { SignerWithAddress } from "hardhat-deploy-ethers/signers";

import { AccessControlManager, RiskOracle } from "../../typechain";

const { parseUnits, hexValue } = ethers.utils;

const parseUnitsToHex = (value: number) => {
  return ethers.utils.hexZeroPad(hexValue(ethers.BigNumber.from(parseUnits(value.toString(), 18))), 32);
};

describe("RiskOracle", async function () {
  let deployer: SignerWithAddress,
    authorizedSender: SignerWithAddress,
    unauthorizedSigner: SignerWithAddress,
    riskOracle: RiskOracle,
    accessControlManager: AccessControlManager;

  const riskOracleFixture = async () => {
    [deployer, authorizedSender, unauthorizedSigner] = await ethers.getSigners();

    const AccessControlManagerFactory = await ethers.getContractFactory("AccessControlManager");
    accessControlManager = await AccessControlManagerFactory.deploy();

    const RiskOracleFactory = await ethers.getContractFactory("RiskOracle");
    riskOracle = await upgrades.deployProxy(RiskOracleFactory, [accessControlManager.address], {
      initializer: "initialize",
    });

    // Grant permissions to deployer
    await accessControlManager.giveCallPermission(riskOracle.address, "addAuthorizedSender(address)", deployer.address);
    await accessControlManager.giveCallPermission(riskOracle.address, "addUpdateType(string)", deployer.address);
    await accessControlManager.giveCallPermission(
      riskOracle.address,
      "setUpdateTypeActive(string,bool)",
      deployer.address,
    );
    await accessControlManager.giveCallPermission(
      riskOracle.address,
      "removeAuthorizedSender(address)",
      deployer.address,
    );

    return { riskOracle, accessControlManager, deployer, authorizedSender, unauthorizedSigner };
  };

  describe("Initialization", async function () {
    it("should initialize with access control manager", async function () {
      const { riskOracle, accessControlManager } = await loadFixture(riskOracleFixture);
      expect(await riskOracle.accessControlManager()).to.equal(accessControlManager.address);
    });

    it("should start with zero update counter", async function () {
      const { riskOracle } = await loadFixture(riskOracleFixture);
      expect(await riskOracle.updateCounter()).to.equal(0);
    });

    it("should revert when initializing with zero address", async function () {
      const RiskOracleFactory = await ethers.getContractFactory("RiskOracle");
      await expect(
        upgrades.deployProxy(RiskOracleFactory, [ethers.constants.AddressZero], {
          initializer: "initialize",
        }),
      ).to.be.reverted;
    });
  });

  describe("Authorized Sender Management", async function () {
    beforeEach(async function () {
      ({ riskOracle, deployer, authorizedSender } = await loadFixture(riskOracleFixture));
    });

    it("should add authorized sender", async function () {
      await expect(riskOracle.addAuthorizedSender(authorizedSender.address))
        .to.emit(riskOracle, "AuthorizedSenderAdded")
        .withArgs(authorizedSender.address);

      expect(await riskOracle.authorizedSenders(authorizedSender.address)).to.be.true;
    });

    it("should revert when adding zero address as authorized sender", async function () {
      await expect(riskOracle.addAuthorizedSender(ethers.constants.AddressZero)).to.be.reverted;
    });

    it("should revert when adding already authorized sender", async function () {
      await riskOracle.addAuthorizedSender(authorizedSender.address);
      await expect(riskOracle.addAuthorizedSender(authorizedSender.address)).to.be.revertedWithCustomError(
        riskOracle,
        "SenderAlreadyAuthorized",
      );
    });

    it("should revert when unauthorized user tries to add authorized sender", async function () {
      await expect(riskOracle.connect(unauthorizedSigner).addAuthorizedSender(authorizedSender.address)).to.be.reverted;
    });

    it("should remove authorized sender", async function () {
      await riskOracle.addAuthorizedSender(authorizedSender.address);
      await expect(riskOracle.removeAuthorizedSender(authorizedSender.address))
        .to.emit(riskOracle, "AuthorizedSenderRemoved")
        .withArgs(authorizedSender.address);

      expect(await riskOracle.authorizedSenders(authorizedSender.address)).to.be.false;
    });

    it("should revert when removing non-authorized sender", async function () {
      await expect(riskOracle.removeAuthorizedSender(authorizedSender.address)).to.be.revertedWithCustomError(
        riskOracle,
        "SenderNotAuthorized",
      );
    });

    it("should revert when unauthorized user tries to remove authorized sender", async function () {
      await riskOracle.addAuthorizedSender(authorizedSender.address);
      await expect(riskOracle.connect(unauthorizedSigner).removeAuthorizedSender(authorizedSender.address)).to.be
        .reverted;
    });
  });

  describe("Update Type Management", async function () {
    beforeEach(async function () {
      ({ riskOracle, deployer } = await loadFixture(riskOracleFixture));
    });

    it("should add update type", async function () {
      await expect(riskOracle.addUpdateType("supplyCap")).to.emit(riskOracle, "UpdateTypeAdded").withArgs("supplyCap");

      expect(await riskOracle.getActiveUpdateTypes("supplyCap")).to.be.true;
      expect(await riskOracle.allUpdateTypes(0)).to.equal("supplyCap");
    });

    it("should revert when adding empty update type", async function () {
      await expect(riskOracle.addUpdateType("")).to.be.revertedWithCustomError(riskOracle, "InvalidUpdateTypeString");
    });

    it("should revert when adding update type exceeding 64 characters", async function () {
      const longString = "a".repeat(65);
      await expect(riskOracle.addUpdateType(longString)).to.be.revertedWithCustomError(
        riskOracle,
        "InvalidUpdateTypeString",
      );
    });

    it("should revert when adding duplicate update type", async function () {
      await riskOracle.addUpdateType("supplyCap");
      await expect(riskOracle.addUpdateType("supplyCap")).to.be.revertedWithCustomError(
        riskOracle,
        "UpdateTypeAlreadyExists",
      );
    });

    it("should revert when unauthorized user tries to add update type", async function () {
      await expect(riskOracle.connect(unauthorizedSigner).addUpdateType("supplyCap")).to.be.reverted;
    });

    it("should set update type active status to false", async function () {
      await riskOracle.addUpdateType("supplyCap");
      await expect(riskOracle.setUpdateTypeActive("supplyCap", false))
        .to.emit(riskOracle, "UpdateTypeActiveStatusChanged")
        .withArgs("supplyCap", true, false);

      expect(await riskOracle.getActiveUpdateTypes("supplyCap")).to.be.false;
    });

    it("should set update type active status to true", async function () {
      await riskOracle.addUpdateType("supplyCap");
      await riskOracle.setUpdateTypeActive("supplyCap", false);
      await expect(riskOracle.setUpdateTypeActive("supplyCap", true))
        .to.emit(riskOracle, "UpdateTypeActiveStatusChanged")
        .withArgs("supplyCap", false, true);

      expect(await riskOracle.getActiveUpdateTypes("supplyCap")).to.be.true;
    });

    it("should revert when setting status for non-existent update type", async function () {
      await expect(riskOracle.setUpdateTypeActive("nonExistent", false)).to.be.revertedWithCustomError(
        riskOracle,
        "UpdateTypeNotFound",
      );
    });

    it("should revert when setting status to same value", async function () {
      await riskOracle.addUpdateType("supplyCap");
      await expect(riskOracle.setUpdateTypeActive("supplyCap", true)).to.be.revertedWithCustomError(
        riskOracle,
        "UpdateTypeStatusUnchanged",
      );
    });

    it("should revert when unauthorized user tries to set update type active status", async function () {
      await riskOracle.addUpdateType("supplyCap");
      await expect(riskOracle.connect(unauthorizedSigner).setUpdateTypeActive("supplyCap", false)).to.be.reverted;
    });
  });

  describe("Publishing Updates", async function () {
    beforeEach(async function () {
      ({ riskOracle, deployer, authorizedSender, unauthorizedSigner } = await loadFixture(riskOracleFixture));
      await riskOracle.addAuthorizedSender(authorizedSender.address);
      await riskOracle.addUpdateType("supplyCap");
      await riskOracle.addUpdateType("borrowCap");
      await riskOracle.addUpdateType("collateralFactors");
    });

    it("should publish single update", async function () {
      const market = deployer.address;
      const newValue = parseUnitsToHex(10);
      const referenceId = "ipfs://QmTest1";

      await expect(
        riskOracle
          .connect(authorizedSender)
          .publishRiskParameterUpdate(referenceId, newValue, "supplyCap", market, 0, 0, "0x"),
      )
        .to.emit(riskOracle, "UpdatePublished")
        .withArgs(
          referenceId,
          1,
          market,
          "supplyCap",
          newValue,
          "0x",
          (value: any) => value.gt(0), // timestamp
          authorizedSender.address,
          "0x",
        );

      expect(await riskOracle.updateCounter()).to.equal(1);
      expect(await riskOracle.getLatestUpdateIdByMarketAndType("supplyCap", market)).to.equal(1);

      const update = await riskOracle.getUpdateById(1);
      expect(update.updateId).to.equal(1);
      expect(update.market).to.equal(market);
      expect(update.updateType).to.equal("supplyCap");
      expect(update.newValue).to.equal(newValue);
      expect(update.previousValue).to.equal("0x");
      expect(update.publisher).to.equal(authorizedSender.address);
      expect(update.poolId).to.equal(0);
      expect(update.destLzEid).to.equal(0);
    });

    it("should publish update with poolId and dstEid", async function () {
      const market = deployer.address;
      const newValue = parseUnitsToHex(15);
      const referenceId = "ipfs://QmTest2";
      const poolId = 1;
      const dstEid = 30101;
      const additionalData = ethers.utils.formatBytes32String("test");

      await riskOracle
        .connect(authorizedSender)
        .publishRiskParameterUpdate(referenceId, newValue, "supplyCap", market, poolId, dstEid, additionalData);

      const update = await riskOracle.getUpdateById(1);
      expect(update.poolId).to.equal(poolId);
      expect(update.destLzEid).to.equal(dstEid);
      expect(update.additionalData).to.equal(additionalData);
    });

    it("should track previous value for subsequent updates", async function () {
      const market = deployer.address;
      const firstValue = parseUnitsToHex(10);
      const secondValue = parseUnitsToHex(20);

      await riskOracle
        .connect(authorizedSender)
        .publishRiskParameterUpdate("ipfs://QmFirst", firstValue, "supplyCap", market, 0, 0, "0x");

      await riskOracle
        .connect(authorizedSender)
        .publishRiskParameterUpdate("ipfs://QmSecond", secondValue, "supplyCap", market, 0, 0, "0x");

      const firstUpdate = await riskOracle.getUpdateById(1);
      const secondUpdate = await riskOracle.getUpdateById(2);

      expect(firstUpdate.previousValue).to.equal("0x");
      expect(secondUpdate.previousValue).to.equal(firstValue);
      expect(await riskOracle.getLatestUpdateIdByMarketAndType("supplyCap", market)).to.equal(2);
    });

    it("should revert when non-authorized sender tries to publish", async function () {
      await expect(
        riskOracle
          .connect(unauthorizedSigner)
          .publishRiskParameterUpdate("ipfs://QmTest", parseUnitsToHex(10), "supplyCap", deployer.address, 0, 0, "0x"),
      ).to.be.revertedWithCustomError(riskOracle, "SenderNotAuthorized");
    });

    it("should revert when publishing with inactive update type", async function () {
      await riskOracle.setUpdateTypeActive("supplyCap", false);
      await expect(
        riskOracle
          .connect(authorizedSender)
          .publishRiskParameterUpdate("ipfs://QmTest", parseUnitsToHex(10), "supplyCap", deployer.address, 0, 0, "0x"),
      ).to.be.revertedWithCustomError(riskOracle, "UpdateTypeNotActive");
    });

    it("should revert when publishing with zero address market", async function () {
      await expect(
        riskOracle
          .connect(authorizedSender)
          .publishRiskParameterUpdate(
            "ipfs://QmTest",
            parseUnitsToHex(10),
            "supplyCap",
            ethers.constants.AddressZero,
            0,
            0,
            "0x",
          ),
      ).to.be.reverted;
    });
  });

  describe("Bulk Publishing Updates", async function () {
    beforeEach(async function () {
      ({ riskOracle, deployer, authorizedSender } = await loadFixture(riskOracleFixture));
      await riskOracle.addAuthorizedSender(authorizedSender.address);
      await riskOracle.addUpdateType("supplyCap");
      await riskOracle.addUpdateType("borrowCap");
    });

    it("should publish bulk updates", async function () {
      const market1 = deployer.address;
      const market2 = authorizedSender.address;

      const referenceIds = ["ipfs://QmBulk1", "ipfs://QmBulk2"];
      const newValues = [parseUnitsToHex(10), parseUnitsToHex(20)];
      const updateTypes = ["supplyCap", "borrowCap"];
      const markets = [market1, market2];
      const poolIds = [0, 0];
      const dstEids = [0, 0];
      const additionalData = ["0x", "0x"];

      await expect(
        riskOracle
          .connect(authorizedSender)
          .publishBulkRiskParameterUpdates(
            referenceIds,
            newValues,
            updateTypes,
            markets,
            poolIds,
            dstEids,
            additionalData,
          ),
      )
        .to.emit(riskOracle, "UpdatePublished")
        .withArgs(
          referenceIds[0],
          1,
          markets[0],
          updateTypes[0],
          newValues[0],
          "0x",
          (value: any) => value.gt(0), // timestamp
          authorizedSender.address,
          additionalData[0],
        )
        .and.to.emit(riskOracle, "UpdatePublished")
        .withArgs(
          referenceIds[1],
          2,
          markets[1],
          updateTypes[1],
          newValues[1],
          "0x",
          (value: any) => value.gt(0), // timestamp
          authorizedSender.address,
          additionalData[1],
        );

      expect(await riskOracle.updateCounter()).to.equal(2);
      expect(await riskOracle.getLatestUpdateIdByMarketAndType("supplyCap", market1)).to.equal(1);
      expect(await riskOracle.getLatestUpdateIdByMarketAndType("borrowCap", market2)).to.equal(2);
    });

    it("should revert when array lengths don't match", async function () {
      const referenceIds = ["ipfs://QmBulk1", "ipfs://QmBulk2"];
      const newValues = [parseUnitsToHex(10)];
      const updateTypes = ["supplyCap", "borrowCap"];
      const markets = [deployer.address, authorizedSender.address];
      const poolIds = [0, 0];
      const dstEids = [0, 0];
      const additionalData = ["0x", "0x"];

      await expect(
        riskOracle
          .connect(authorizedSender)
          .publishBulkRiskParameterUpdates(
            referenceIds,
            newValues,
            updateTypes,
            markets,
            poolIds,
            dstEids,
            additionalData,
          ),
      ).to.be.revertedWithCustomError(riskOracle, "ArrayLengthMismatch");
    });

    it("should revert when empty array is provided", async function () {
      await expect(
        riskOracle.connect(authorizedSender).publishBulkRiskParameterUpdates([], [], [], [], [], [], []),
      ).to.be.revertedWithCustomError(riskOracle, "ArrayLengthMismatch");
    });

    it("should revert when any update type is inactive", async function () {
      await riskOracle.setUpdateTypeActive("supplyCap", false);

      const referenceIds = ["ipfs://QmBulk1"];
      const newValues = [parseUnitsToHex(10)];
      const updateTypes = ["supplyCap"];
      const markets = [deployer.address];
      const poolIds = [0];
      const dstEids = [0];
      const additionalData = ["0x"];

      await expect(
        riskOracle
          .connect(authorizedSender)
          .publishBulkRiskParameterUpdates(
            referenceIds,
            newValues,
            updateTypes,
            markets,
            poolIds,
            dstEids,
            additionalData,
          ),
      ).to.be.revertedWithCustomError(riskOracle, "UpdateTypeNotActive");
    });
  });

  describe("Querying Updates", async function () {
    beforeEach(async function () {
      ({ riskOracle, deployer, authorizedSender } = await loadFixture(riskOracleFixture));
      await riskOracle.addAuthorizedSender(authorizedSender.address);
      await riskOracle.addUpdateType("supplyCap");
    });

    it("should get update by ID", async function () {
      const market = deployer.address;
      const newValue = parseUnitsToHex(10);
      const referenceId = "ipfs://QmGetById";

      await riskOracle
        .connect(authorizedSender)
        .publishRiskParameterUpdate(referenceId, newValue, "supplyCap", market, 0, 0, "0x");

      const update = await riskOracle.getUpdateById(1);
      expect(update.updateId).to.equal(1);
      expect(update.referenceId).to.equal(referenceId);
      expect(update.market).to.equal(market);
      expect(update.updateType).to.equal("supplyCap");
      expect(update.newValue).to.equal(newValue);
    });

    it("should revert when getting update with invalid ID (zero)", async function () {
      await expect(riskOracle.getUpdateById(0)).to.be.revertedWithCustomError(riskOracle, "InvalidUpdateId");
    });

    it("should revert when getting update with ID greater than counter", async function () {
      await expect(riskOracle.getUpdateById(1)).to.be.revertedWithCustomError(riskOracle, "InvalidUpdateId");
    });

    it("should get latest update by parameter and market", async function () {
      const market = deployer.address;
      const firstValue = parseUnitsToHex(10);
      const secondValue = parseUnitsToHex(20);

      await riskOracle
        .connect(authorizedSender)
        .publishRiskParameterUpdate("ipfs://QmFirst", firstValue, "supplyCap", market, 0, 0, "0x");

      await riskOracle
        .connect(authorizedSender)
        .publishRiskParameterUpdate("ipfs://QmSecond", secondValue, "supplyCap", market, 0, 0, "0x");

      const latestUpdate = await riskOracle.getLatestUpdateByMarketAndType("supplyCap", market);
      expect(latestUpdate.updateId).to.equal(2);
      expect(latestUpdate.newValue).to.equal(secondValue);
    });

    it("should revert when getting latest update for non-existent market and type", async function () {
      await expect(
        riskOracle.getLatestUpdateByMarketAndType("supplyCap", deployer.address),
      ).to.be.revertedWithCustomError(riskOracle, "NoUpdateFound");
    });

    it("should return all update", async function () {
      // beforeEach already adds "supplyCap", so add different ones
      await riskOracle.addUpdateType("borrowCap");
      await riskOracle.addUpdateType("collateralFactors");

      const length = await riskOracle.allUpdateTypesLength();
      expect(length).to.equal(3);

      const allTypes = await riskOracle.getAllUpdateTypes();
      expect(allTypes.length).to.equal(3);
      expect(allTypes).to.include("supplyCap");
      expect(allTypes).to.include("borrowCap");
      expect(allTypes).to.include("collateralFactors");
    });

    it("should return empty array when no update types are added", async function () {
      const { riskOracle: freshOracle } = await loadFixture(riskOracleFixture);
      const length = await freshOracle.allUpdateTypesLength();
      expect(length).to.equal(0);

      const allTypes = await freshOracle.getAllUpdateTypes();
      expect(allTypes.length).to.equal(0);
    });

    it("should correctly return all update types after deactivating one", async function () {
      // beforeEach already adds "supplyCap", so add a different one
      await riskOracle.addUpdateType("borrowCap");

      const length = await riskOracle.allUpdateTypesLength();
      expect(length).to.equal(2);

      await riskOracle.setUpdateTypeActive("supplyCap", false);

      const allTypes = await riskOracle.getAllUpdateTypes();
      expect(allTypes.length).to.equal(2);
      expect(allTypes).to.include("supplyCap");
      expect(allTypes).to.include("borrowCap");

      expect(await riskOracle.getActiveUpdateTypes("supplyCap")).to.be.false;
      expect(await riskOracle.getActiveUpdateTypes("borrowCap")).to.be.true;
    });
  });
});
