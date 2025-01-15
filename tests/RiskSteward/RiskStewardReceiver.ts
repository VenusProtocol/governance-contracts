import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { BigNumber, ContractFactory } from "ethers";
import { ethers, upgrades } from "hardhat";
import { SignerWithAddress } from "hardhat-deploy-ethers/signers";

import { MockComptroller, MockCoreComptroller, MockRiskOracle, MockVToken, RiskStewardReceiver } from "../../typechain";

const { parseUnits, hexValue } = ethers.utils;

const parseUnitsToHex = (value: number) => {
  return ethers.utils.hexZeroPad(hexValue(BigNumber.from(parseUnits(value.toString(), 18))), 32);
};

describe("Risk Steward", async function () {
  let deployer: SignerWithAddress,
    mockRiskOracle: MockRiskOracle,
    riskStewardReceiver: RiskStewardReceiver,
    RiskStewardReceiverFactory: ContractFactory,
    MockRiskOracleFactory: ContractFactory,
    mockCoreVToken: MockVToken,
    mockVToken: MockVToken,
    mockCoreComptroller: MockCoreComptroller,
    mockComptroller: MockComptroller;

  const riskStewardFixture = async () => {
    deployer = (await ethers.getSigners())[0];

    // Set up mock comptroller and markets
    const MockVTokenFactory = await ethers.getContractFactory("MockVToken");
    // Core Pool Comptroller
    const MockCoreComptrollerFactory = await ethers.getContractFactory("MockCoreComptroller");
    mockCoreComptroller = await MockCoreComptrollerFactory.deploy();
    mockCoreVToken = await MockVTokenFactory.deploy(mockCoreComptroller.address);
    mockCoreComptroller._supportMarket(mockCoreVToken.address);
    mockCoreComptroller._setMarketSupplyCaps([mockCoreVToken.address], [parseUnits("8", 18)]);
    mockCoreComptroller._setMarketBorrowCaps([mockCoreVToken.address], [parseUnits("8", 18)]);

    // IL Comptroller
    const MockComptrollerFactory = await ethers.getContractFactory("MockComptroller");
    mockComptroller = await MockComptrollerFactory.deploy();
    mockVToken = await MockVTokenFactory.deploy(mockComptroller.address);

    mockComptroller.supportMarket(mockVToken.address);
    mockComptroller.setMarketSupplyCaps([mockVToken.address], [parseUnits("8", 18)]);
    mockComptroller.setMarketBorrowCaps([mockVToken.address], [parseUnits("8", 18)]);
    MockRiskOracleFactory = await ethers.getContractFactory("MockRiskOracle");
    mockRiskOracle = (await MockRiskOracleFactory.deploy(
      "Mock Risk Oracle",
      [deployer.address],
      ["MarketSupplyCaps", "MarketBorrowCaps", "RandomUpdateType"],
    )) as MockRiskOracle;
    RiskStewardReceiverFactory = await ethers.getContractFactory("RiskStewardReceiver");
    riskStewardReceiver = await upgrades.deployProxy(RiskStewardReceiverFactory, [], {
      constructorArgs: [mockRiskOracle.address, mockCoreComptroller.address],
      initializer: "initialize",
      unsafeAllow: ["state-variable-immutable"],
    });

    await riskStewardReceiver.setRiskParameterConfig("MarketSupplyCaps", 5, 5000, true);
    await riskStewardReceiver.setRiskParameterConfig("MarketBorrowCaps", 5, 5000, true);
  };

  beforeEach(async function () {
    await loadFixture(riskStewardFixture);
  });

  describe("Upgradeable", async function () {
    it("new implementation should update core comptroller", async function () {
      const corePoolComptrollerTestnetAddress = "0x94d1820b2D1c7c7452A163983Dc888CEC546b77D";
      await upgrades.upgradeProxy(riskStewardReceiver, RiskStewardReceiverFactory, {
        constructorArgs: [mockRiskOracle.address, corePoolComptrollerTestnetAddress],
        unsafeAllow: ["state-variable-immutable"],
      });
      expect(await riskStewardReceiver.CORE_POOL_COMPTROLLER()).to.equal(corePoolComptrollerTestnetAddress);
    });

    it("new implementation should update risk oracle", async function () {
      const mockRiskOracle = (await MockRiskOracleFactory.deploy(
        "Mock Risk Oracle",
        [deployer.address],
        ["MarketSupplyCaps", "MarketBorrowCaps"],
      )) as MockRiskOracle;
      await upgrades.upgradeProxy(riskStewardReceiver, RiskStewardReceiverFactory, {
        constructorArgs: [mockRiskOracle.address, mockCoreComptroller.address],
        unsafeAllow: ["state-variable-immutable"],
      });
      expect(await riskStewardReceiver.RISK_ORACLE()).to.equal(mockRiskOracle.address);
    });
  });

  describe("Risk Parameter Config", async function () {
    it("should get original risk parameter configs", async function () {
      expect(await riskStewardReceiver.getRiskParameterConfig("MarketSupplyCaps")).to.deep.equal([
        true,
        BigNumber.from(5),
        BigNumber.from(5000),
        true,
      ]);
      expect(await riskStewardReceiver.getRiskParameterConfig("MarketBorrowCaps")).to.deep.equal([
        true,
        BigNumber.from(5),
        BigNumber.from(5000),
        true,
      ]);
    });

    it("should pause risk parameter configs", async function () {
      await riskStewardReceiver.toggleConfigActive("MarketSupplyCaps");
      expect((await riskStewardReceiver.getRiskParameterConfig("MarketSupplyCaps")).active).to.equal(false);
    });

    it("should update risk parameter configs", async function () {
      await riskStewardReceiver.setRiskParameterConfig("MarketSupplyCaps", 1, 1000, true);
      expect(await riskStewardReceiver.getRiskParameterConfig("MarketSupplyCaps")).to.deep.equal([
        true,
        BigNumber.from(1),
        BigNumber.from(1000),
        true,
      ]);
    });
  });

  describe("Risk Steward Pause", async function () {
    it("should toggle paused state", async function () {
      await riskStewardReceiver.pause();
      expect(await riskStewardReceiver.paused()).to.equal(true);
    });

    it("should revert if contract is paused", async function () {
      await riskStewardReceiver.pause();
      await expect(riskStewardReceiver.processUpdateById(1)).to.be.rejectedWith("Pausable: paused");
    });

    it("should revert if contract is paused", async function () {
      await riskStewardReceiver.pause();
      await expect(riskStewardReceiver.processUpdateByParameterAndMarket("MarketSupplyCaps", mockCoreVToken.address)).to.be.rejectedWith("Pausable: paused");
    });
  });

  describe("Risk Parameter Update Reverts under incorrect conditions", async function () {
    it("should revert if updateType is unknown", async function () {
      await expect(
        mockRiskOracle.publishRiskParameterUpdate(
          "ipfs://QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdw8eX9",
          parseUnits("10", 18),
          "UnknownUpdateType",
          mockCoreVToken.address,
          "0x",
        ),
      ).to.be.revertedWith("Unauthorized update type.");
    });

    it("should revert if updateType is implemented", async function () {
      await mockRiskOracle.publishRiskParameterUpdate(
        "ipfs://QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdw8eX9",
        parseUnits("10", 18),
        "RandomUpdateType",
        mockCoreVToken.address,
        "0x",
      );
      await riskStewardReceiver.setRiskParameterConfig("RandomUpdateType", 5, 5000, true);
      await expect(riskStewardReceiver.processUpdateById(1)).to.be.rejectedWith("UnsupportedUpdateType");
    });

    it("should revert if updateType is not active", async function () {
      await mockRiskOracle.publishRiskParameterUpdate(
        "ipfs://QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdw8eX9",
        parseUnitsToHex(10),
        "MarketSupplyCaps",
        mockCoreVToken.address,
        "0x",
      );
      await mockRiskOracle.publishRiskParameterUpdate(
        "ipfs://QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdw8eX9",
        parseUnitsToHex(10),
        "MarketBorrowCaps",
        mockCoreVToken.address,
        "0x",
      );
      await riskStewardReceiver.toggleConfigActive("MarketSupplyCaps");
      await expect(riskStewardReceiver.processUpdateById(1)).to.be.rejectedWith("ConfigNotActive");

      await riskStewardReceiver.toggleConfigActive("MarketBorrowCaps");
      await expect(riskStewardReceiver.processUpdateById(2)).to.be.rejectedWith("ConfigNotActive");
    });

    it("should revert if the update is expired", async function () {
      await mockRiskOracle.publishRiskParameterUpdate(
        "ipfs://QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdw8eX9",
        parseUnitsToHex(10),
        "MarketSupplyCaps",
        mockCoreVToken.address,
        "0x",
      );
      await mockRiskOracle.publishRiskParameterUpdate(
        "ipfs://QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdw8eX9",
        parseUnitsToHex(10),
        "MarketBorrowCaps",
        mockCoreVToken.address,
        "0x",
      );
      await time.increase(60 * 60 * 24 + 1);
      await expect(riskStewardReceiver.processUpdateById(1)).to.be.rejectedWith("UpdateIsExpired");
      await expect(riskStewardReceiver.processUpdateById(2)).to.be.rejectedWith("UpdateIsExpired");
    });

    it("should revert if market is not supported", async function () {
      await mockRiskOracle.publishRiskParameterUpdate(
        "ipfs://QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdw8eX9",
        parseUnitsToHex(10),
        "MarketSupplyCaps",
        mockCoreComptroller.address,
        "0x",
      );
      await expect(riskStewardReceiver.processUpdateById(1)).to.be.reverted;

      await mockRiskOracle.publishRiskParameterUpdate(
        "ipfs://QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdw8eX9",
        parseUnitsToHex(10),
        "MarketBorrowCaps",
        mockCoreComptroller.address,
        "0x",
      );
      await expect(riskStewardReceiver.processUpdateById(2)).to.be.reverted;
    });

    it("should revert if the update is too frequent", async function () {
      await mockRiskOracle.publishRiskParameterUpdate(
        "ipfs://QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdw8eX9",
        parseUnitsToHex(10),
        "MarketSupplyCaps",
        mockCoreVToken.address,
        "0x",
      );
      await mockRiskOracle.publishRiskParameterUpdate(
        "ipfs://QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdw8eX9",
        parseUnitsToHex(12),
        "MarketSupplyCaps",
        mockCoreVToken.address,
        "0x",
      );
      await riskStewardReceiver.processUpdateById(1);
      await expect(riskStewardReceiver.processUpdateById(2)).to.be.rejectedWith("UpdateTooFrequent");

      await mockRiskOracle.publishRiskParameterUpdate(
        "ipfs://QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdw8eX9",
        parseUnitsToHex(10),
        "MarketBorrowCaps",
        mockCoreVToken.address,
        "0x",
      );
      await mockRiskOracle.publishRiskParameterUpdate(
        "ipfs://QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdw8eX9",
        parseUnitsToHex(12),
        "MarketBorrowCaps",
        mockCoreVToken.address,
        "0x",
      );
      await riskStewardReceiver.processUpdateById(3);
      await expect(riskStewardReceiver.processUpdateById(4)).to.be.rejectedWith("UpdateTooFrequent");
    });

    it("should error on invalid update ID", async function () {
      await expect(riskStewardReceiver.processUpdateById(1)).to.be.revertedWith("Invalid update ID.");
    });

    it("should revert if the update has already been applied", async function () {
      await mockRiskOracle.publishRiskParameterUpdate(
        "ipfs://QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdw8eX9",
        parseUnitsToHex(10),
        "MarketSupplyCaps",
        mockCoreVToken.address,
        "0x",
      );
      await riskStewardReceiver.processUpdateById(1);
      await expect(riskStewardReceiver.processUpdateById(1)).to.be.rejectedWith("ConfigAlreadyProcessed");
    });

    it("should revert if the update is out of bounds", async function () {
      // Lower
      await mockRiskOracle.publishRiskParameterUpdate(
        "ipfs://QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdw8eX9",
        parseUnitsToHex(5),
        "MarketSupplyCaps",
        mockCoreVToken.address,
        "0x",
      );
      await expect(riskStewardReceiver.processUpdateById(1)).to.be.rejectedWith("UpdateNotInRange");

      // Too high
      await mockRiskOracle.publishRiskParameterUpdate(
        "ipfs://QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdw8eX9",
        parseUnitsToHex(20),
        "MarketSupplyCaps",
        mockCoreVToken.address,
        "0x",
      );
      await expect(riskStewardReceiver.processUpdateById(1)).to.be.rejectedWith("UpdateNotInRange");

      // Lower
      await mockRiskOracle.publishRiskParameterUpdate(
        "ipfs://QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdw8eX9",
        parseUnitsToHex(5),
        "MarketBorrowCaps",
        mockCoreVToken.address,
        "0x",
      );
      await expect(riskStewardReceiver.processUpdateById(1)).to.be.rejectedWith("UpdateNotInRange");

      // Too high
      await mockRiskOracle.publishRiskParameterUpdate(
        "ipfs://QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdw8eX9",
        parseUnitsToHex(20),
        "MarketBorrowCaps",
        mockCoreVToken.address,
        "0x",
      );
      await expect(riskStewardReceiver.processUpdateById(1)).to.be.rejectedWith("UpdateNotInRange");
    });
  });

  describe("Risk Parameter Updates under correct conditions", async function () {
    it("should process update by id", async function () {
      // Core Pool
      expect(await mockCoreComptroller.supplyCaps(mockCoreVToken.address)).to.equal(parseUnits("8", 18));
      expect(await mockCoreComptroller.borrowCaps(mockCoreVToken.address)).to.equal(parseUnits("8", 18));
      await mockRiskOracle.publishRiskParameterUpdate(
        "ipfs://QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdw8eX9",
        parseUnitsToHex(10),
        "MarketSupplyCaps",
        mockCoreVToken.address,
        "0x",
      );
      await mockRiskOracle.publishRiskParameterUpdate(
        "ipfs://QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdw8eX9",
        parseUnitsToHex(10),
        "MarketBorrowCaps",
        mockCoreVToken.address,
        "0x",
      );
      await riskStewardReceiver.processUpdateById(1);
      await riskStewardReceiver.processUpdateById(2);
      expect(await mockCoreComptroller.supplyCaps(mockCoreVToken.address)).to.equal(parseUnits("10", 18));
      expect(await mockCoreComptroller.borrowCaps(mockCoreVToken.address)).to.equal(parseUnits("10", 18));
      // Isolated Pool
      expect(await mockComptroller.supplyCaps(mockVToken.address)).to.equal(parseUnits("8", 18));
      expect(await mockComptroller.borrowCaps(mockVToken.address)).to.equal(parseUnits("8", 18));
      await mockRiskOracle.publishRiskParameterUpdate(
        "ipfs://QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdw8eX9",
        parseUnitsToHex(10),
        "MarketSupplyCaps",
        mockVToken.address,
        "0x",
      );
      await mockRiskOracle.publishRiskParameterUpdate(
        "ipfs://QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdw8eX9",
        parseUnitsToHex(10),
        "MarketBorrowCaps",
        mockVToken.address,
        "0x",
      );
      await riskStewardReceiver.processUpdateById(3);
      await riskStewardReceiver.processUpdateById(4);
      expect(await mockComptroller.supplyCaps(mockVToken.address)).to.equal(parseUnits("10", 18));
      expect(await mockComptroller.borrowCaps(mockVToken.address)).to.equal(parseUnits("10", 18));
    });

    it("should process update by parameter and market", async function () {
      // Core Pool
      expect(await mockCoreComptroller.supplyCaps(mockCoreVToken.address)).to.equal(parseUnits("8", 18));
      expect(await mockCoreComptroller.borrowCaps(mockCoreVToken.address)).to.equal(parseUnits("8", 18));
      await mockRiskOracle.publishRiskParameterUpdate(
        "ipfs://QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdw8eX9",
        parseUnitsToHex(10),
        "MarketSupplyCaps",
        mockCoreVToken.address,
        "0x",
      );
      await mockRiskOracle.publishRiskParameterUpdate(
        "ipfs://QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdw8eX9",
        parseUnitsToHex(10),
        "MarketBorrowCaps",
        mockCoreVToken.address,
        "0x",
      );
      await riskStewardReceiver.processUpdateByParameterAndMarket("MarketSupplyCaps", mockCoreVToken.address);
      await riskStewardReceiver.processUpdateByParameterAndMarket("MarketBorrowCaps", mockCoreVToken.address);
      expect(await mockCoreComptroller.supplyCaps(mockCoreVToken.address)).to.equal(parseUnits("10", 18));
      expect(await mockCoreComptroller.borrowCaps(mockCoreVToken.address)).to.equal(parseUnits("10", 18));
      // Isolated Pool
      expect(await mockComptroller.supplyCaps(mockVToken.address)).to.equal(parseUnits("8", 18));
      expect(await mockComptroller.borrowCaps(mockVToken.address)).to.equal(parseUnits("8", 18));
      await mockRiskOracle.publishRiskParameterUpdate(
        "ipfs://QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdw8eX9",
        parseUnitsToHex(10),
        "MarketSupplyCaps",
        mockVToken.address,
        "0x",
      );
      await mockRiskOracle.publishRiskParameterUpdate(
        "ipfs://QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdw8eX9",
        parseUnitsToHex(10),
        "MarketBorrowCaps",
        mockVToken.address,
        "0x",
      );
      await riskStewardReceiver.processUpdateByParameterAndMarket("MarketSupplyCaps", mockVToken.address);
      await riskStewardReceiver.processUpdateByParameterAndMarket("MarketBorrowCaps", mockVToken.address);
      expect(await mockComptroller.supplyCaps(mockVToken.address)).to.equal(parseUnits("10", 18));
      expect(await mockComptroller.borrowCaps(mockVToken.address)).to.equal(parseUnits("10", 18));
    });
  });
});
