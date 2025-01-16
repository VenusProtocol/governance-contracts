import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { BigNumber, ContractFactory } from "ethers";
import { ethers, upgrades } from "hardhat";
import { SignerWithAddress } from "hardhat-deploy-ethers/signers";

import {
  MarketCapsRiskSteward,
  MockComptroller,
  MockCoreComptroller,
  MockRiskOracle,
  MockVToken,
  RiskStewardReceiver,
} from "../../typechain";

const { parseUnits, hexValue } = ethers.utils;

const parseUnitsToHex = (value: number) => {
  return ethers.utils.hexZeroPad(hexValue(BigNumber.from(parseUnits(value.toString(), 18))), 32);
};

describe("Risk Steward", async function () {
  let deployer: SignerWithAddress,
    signer1: SignerWithAddress,
    mockRiskOracle: MockRiskOracle,
    riskStewardReceiver: RiskStewardReceiver,
    RiskStewardReceiverFactory: ContractFactory,
    MockRiskOracleFactory: ContractFactory,
    MockMarketCapsRiskStewardFactory: ContractFactory,
    mockCoreVToken: MockVToken,
    mockVToken: MockVToken,
    mockCoreComptroller: MockCoreComptroller,
    mockComptroller: MockComptroller,
    marketCapsRiskSteward: MarketCapsRiskSteward;

  const riskStewardFixture = async () => {
    deployer = (await ethers.getSigners())[0];
    signer1 = (await ethers.getSigners())[1];
    const accessControlManagerFactory = await ethers.getContractFactory("AccessControlManager");

    const accessControlManager = await accessControlManagerFactory.deploy();

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
    MockMarketCapsRiskStewardFactory = await ethers.getContractFactory("MarketCapsRiskSteward");
    mockRiskOracle = (await MockRiskOracleFactory.deploy(
      "MockRiskOracle",
      [deployer.address],
      ["MarketSupplyCap", "MarketBorrowCap", "RandomUpdateType"],
    )) as MockRiskOracle;
    RiskStewardReceiverFactory = await ethers.getContractFactory("RiskStewardReceiver");
    riskStewardReceiver = await upgrades.deployProxy(RiskStewardReceiverFactory, [accessControlManager.address], {
      constructorArgs: [mockRiskOracle.address],
      initializer: "initialize",
      unsafeAllow: ["state-variable-immutable"],
    });

    marketCapsRiskSteward = await upgrades.deployProxy(
      MockMarketCapsRiskStewardFactory,
      [accessControlManager.address, 5000],
      {
        constructorArgs: [mockCoreComptroller.address],
        initializer: "initialize",
        unsafeAllow: ["state-variable-immutable"],
      },
    );

    await accessControlManager.giveCallPermission(
      riskStewardReceiver.address,
      "setRiskParameterConfig(string,address,uint256)",
      deployer.address,
    );

    await accessControlManager.giveCallPermission(
      riskStewardReceiver.address,
      "toggleConfigActive(string)",
      deployer.address,
    );

    await accessControlManager.giveCallPermission(riskStewardReceiver.address, "pause()", deployer.address);

    await accessControlManager.giveCallPermission(riskStewardReceiver.address, "unpause()", deployer.address);

    await accessControlManager.giveCallPermission(
      marketCapsRiskSteward.address,
      "processUpdate(RiskParameterUpdate)",
      riskStewardReceiver.address,
    );

    await accessControlManager.giveCallPermission(
      marketCapsRiskSteward.address,
      "setMaxIncreaseBps(uint256)",
      deployer.address,
    );

    await riskStewardReceiver.setRiskParameterConfig("MarketSupplyCap", marketCapsRiskSteward.address, 5);
    await riskStewardReceiver.setRiskParameterConfig("MarketBorrowCap", marketCapsRiskSteward.address, 5);
  };

  beforeEach(async function () {
    await loadFixture(riskStewardFixture);
  });

  describe("Access Control", async function () {
    it("should revert if access is not granted for setting risk parameter config", async function () {
      await expect(
        riskStewardReceiver
          .connect(signer1)
          .setRiskParameterConfig("MarketSupplyCap", marketCapsRiskSteward.address, 1),
      ).to.be.rejectedWith(
        'Unauthorized("0x70997970C51812dc3A010C7d01b50e0d17dc79C8", "0x4631BCAbD6dF18D94796344963cB60d44a4136b6", "setRiskParameterConfig(string,address,uint256)")',
      );
    });

    it("should revert if access is not granted for toggling config active", async function () {
      await expect(riskStewardReceiver.connect(signer1).toggleConfigActive("MarketSupplyCap")).to.be.rejectedWith(
        'Unauthorized("0x70997970C51812dc3A010C7d01b50e0d17dc79C8", "0x4631BCAbD6dF18D94796344963cB60d44a4136b6", "toggleConfigActive(string)")',
      );
    });

    it("should revert if access is not granted for pausing", async function () {
      await expect(riskStewardReceiver.connect(signer1).pause()).to.be.rejectedWith(
        'Unauthorized("0x70997970C51812dc3A010C7d01b50e0d17dc79C8", "0x4631BCAbD6dF18D94796344963cB60d44a4136b6", "pause()")',
      );
    });

    it("should revert if access is not granted for unpausing", async function () {
      await expect(riskStewardReceiver.connect(signer1).unpause()).to.be.rejectedWith(
        'Unauthorized("0x70997970C51812dc3A010C7d01b50e0d17dc79C8", "0x4631BCAbD6dF18D94796344963cB60d44a4136b6", "unpause()")',
      );
    });

    it("should revert if access is not granted for processing update", async function () {
      await expect(
        marketCapsRiskSteward.connect(signer1).processUpdate({
          timestamp: 100,
          newValue: "0x",
          previousValue: "0x",
          referenceId: "1",
          updateType: "MarketSupplyCap",
          updateId: 1,
          additionalData: "0x",
          market: mockCoreVToken.address,
        }),
      ).to.be.rejectedWith(
        'Unauthorized("0x70997970C51812dc3A010C7d01b50e0d17dc79C8", "0xA4899D35897033b927acFCf422bc745916139776", "processUpdate(RiskParameterUpdate)")',
      );
    });

    it("should revert if access is not granted for setting max increase bps", async function () {
      await expect(marketCapsRiskSteward.connect(signer1).setMaxIncreaseBps(1)).to.be.rejectedWith(
        'Unauthorized("0x70997970C51812dc3A010C7d01b50e0d17dc79C8", "0xA4899D35897033b927acFCf422bc745916139776", "setMaxIncreaseBps(uint256)")',
      );
    });
  });

  describe("Upgradeable", async function () {
    it("new implementation should update core comptroller", async function () {
      const corePoolComptrollerTestnetAddress = "0x94d1820b2D1c7c7452A163983Dc888CEC546b77D";
      await upgrades.upgradeProxy(marketCapsRiskSteward, MockMarketCapsRiskStewardFactory, {
        constructorArgs: [corePoolComptrollerTestnetAddress],
        unsafeAllow: ["state-variable-immutable"],
      });
      expect(await marketCapsRiskSteward.CORE_POOL_COMPTROLLER()).to.equal(corePoolComptrollerTestnetAddress);
    });

    it("new implementation should update risk oracle", async function () {
      const mockRiskOracle = (await MockRiskOracleFactory.deploy(
        "Mock Risk Oracle",
        [deployer.address],
        ["MarketSupplyCap", "MarketBorrowCap"],
      )) as MockRiskOracle;
      await upgrades.upgradeProxy(riskStewardReceiver, RiskStewardReceiverFactory, {
        constructorArgs: [mockRiskOracle.address],
        unsafeAllow: ["state-variable-immutable"],
      });
      expect(await riskStewardReceiver.RISK_ORACLE()).to.equal(mockRiskOracle.address);
    });
  });

  describe("Risk Parameter Config", async function () {
    it("should get original risk parameter configs", async function () {
      expect(await riskStewardReceiver.getRiskParameterConfig("MarketSupplyCap")).to.deep.equal([
        true,
        BigNumber.from(5),
        marketCapsRiskSteward.address,
      ]);
      expect(await riskStewardReceiver.getRiskParameterConfig("MarketBorrowCap")).to.deep.equal([
        true,
        BigNumber.from(5),
        marketCapsRiskSteward.address,
      ]);
    });

    it("should pause risk parameter configs", async function () {
      await riskStewardReceiver.toggleConfigActive("MarketSupplyCap");
      expect((await riskStewardReceiver.getRiskParameterConfig("MarketSupplyCap")).active).to.equal(false);
    });

    it("should revert if pausing unsupported update type", async function () {
      await expect(riskStewardReceiver.toggleConfigActive("Supply")).to.be.rejectedWith("UnsupportedUpdateType");
    });

    it("should update risk parameter configs", async function () {
      await riskStewardReceiver.setRiskParameterConfig("MarketSupplyCap", marketCapsRiskSteward.address, 1);
      expect(await riskStewardReceiver.getRiskParameterConfig("MarketSupplyCap")).to.deep.equal([
        true,
        BigNumber.from(1),
        marketCapsRiskSteward.address,
      ]);
    });

    it("should emit RiskParameterConfigSet event", async function () {
      await expect(
        riskStewardReceiver.setRiskParameterConfig("MarketSupplyCap", marketCapsRiskSteward.address, 1),
      ).to.emit(riskStewardReceiver, "RiskParameterConfigSet");
    });

    it("should revert if empty updateType is set", async function () {
      await expect(riskStewardReceiver.setRiskParameterConfig("", marketCapsRiskSteward.address, 1)).to.be.rejectedWith(
        "UnsupportedUpdateType",
      );
    });

    it("should revert if debounce is 0", async function () {
      await expect(
        riskStewardReceiver.setRiskParameterConfig("MarketSupplyCap", marketCapsRiskSteward.address, 0),
      ).to.be.rejectedWith("InvalidDebounce");
    });

    it("should revert if maxIncreaseBps is 0", async function () {
      await expect(marketCapsRiskSteward.setMaxIncreaseBps(0)).to.be.rejectedWith("InvalidMaxIncreaseBps");
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
      await expect(
        riskStewardReceiver.processUpdateByParameterAndMarket("MarketSupplyCap", mockCoreVToken.address),
      ).to.be.rejectedWith("Pausable: paused");
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
      await riskStewardReceiver.setRiskParameterConfig("RandomUpdateType", marketCapsRiskSteward.address, 5);
      await expect(riskStewardReceiver.processUpdateById(1)).to.be.rejectedWith("UnsupportedUpdateType");
    });

    it("should revert if updateType is not active", async function () {
      await mockRiskOracle.publishRiskParameterUpdate(
        "ipfs://QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdw8eX9",
        parseUnitsToHex(10),
        "MarketSupplyCap",
        mockCoreVToken.address,
        "0x",
      );
      await mockRiskOracle.publishRiskParameterUpdate(
        "ipfs://QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdw8eX9",
        parseUnitsToHex(10),
        "MarketBorrowCap",
        mockCoreVToken.address,
        "0x",
      );
      await riskStewardReceiver.toggleConfigActive("MarketSupplyCap");
      await expect(riskStewardReceiver.processUpdateById(1)).to.be.rejectedWith("ConfigNotActive");

      await riskStewardReceiver.toggleConfigActive("MarketBorrowCap");
      await expect(riskStewardReceiver.processUpdateById(2)).to.be.rejectedWith("ConfigNotActive");
    });

    it("should revert if the update is expired", async function () {
      await mockRiskOracle.publishRiskParameterUpdate(
        "ipfs://QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdw8eX9",
        parseUnitsToHex(10),
        "MarketSupplyCap",
        mockCoreVToken.address,
        "0x",
      );
      await mockRiskOracle.publishRiskParameterUpdate(
        "ipfs://QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdw8eX9",
        parseUnitsToHex(10),
        "MarketBorrowCap",
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
        "MarketSupplyCap",
        mockCoreComptroller.address,
        "0x",
      );
      await expect(riskStewardReceiver.processUpdateById(1)).to.be.reverted;

      await mockRiskOracle.publishRiskParameterUpdate(
        "ipfs://QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdw8eX9",
        parseUnitsToHex(10),
        "MarketBorrowCap",
        mockCoreComptroller.address,
        "0x",
      );
      await expect(riskStewardReceiver.processUpdateById(2)).to.be.reverted;
    });

    it("should revert if the update is too frequent", async function () {
      await mockRiskOracle.publishRiskParameterUpdate(
        "ipfs://QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdw8eX9",
        parseUnitsToHex(10),
        "MarketSupplyCap",
        mockCoreVToken.address,
        "0x",
      );
      await mockRiskOracle.publishRiskParameterUpdate(
        "ipfs://QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdw8eX9",
        parseUnitsToHex(12),
        "MarketSupplyCap",
        mockCoreVToken.address,
        "0x",
      );
      await riskStewardReceiver.processUpdateById(1);
      await expect(riskStewardReceiver.processUpdateById(2)).to.be.rejectedWith("UpdateTooFrequent");

      await mockRiskOracle.publishRiskParameterUpdate(
        "ipfs://QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdw8eX9",
        parseUnitsToHex(10),
        "MarketBorrowCap",
        mockCoreVToken.address,
        "0x",
      );
      await mockRiskOracle.publishRiskParameterUpdate(
        "ipfs://QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdw8eX9",
        parseUnitsToHex(12),
        "MarketBorrowCap",
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
        "MarketSupplyCap",
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
        "MarketSupplyCap",
        mockCoreVToken.address,
        "0x",
      );
      await expect(riskStewardReceiver.processUpdateById(1)).to.be.rejectedWith("UpdateNotInRange");

      // Too high
      await mockRiskOracle.publishRiskParameterUpdate(
        "ipfs://QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdw8eX9",
        parseUnitsToHex(20),
        "MarketSupplyCap",
        mockCoreVToken.address,
        "0x",
      );
      await expect(riskStewardReceiver.processUpdateById(1)).to.be.rejectedWith("UpdateNotInRange");

      // Lower
      await mockRiskOracle.publishRiskParameterUpdate(
        "ipfs://QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdw8eX9",
        parseUnitsToHex(5),
        "MarketBorrowCap",
        mockCoreVToken.address,
        "0x",
      );
      await expect(riskStewardReceiver.processUpdateById(1)).to.be.rejectedWith("UpdateNotInRange");

      // Too high
      await mockRiskOracle.publishRiskParameterUpdate(
        "ipfs://QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdw8eX9",
        parseUnitsToHex(20),
        "MarketBorrowCap",
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
        "MarketSupplyCap",
        mockCoreVToken.address,
        "0x",
      );
      await mockRiskOracle.publishRiskParameterUpdate(
        "ipfs://QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdw8eX9",
        parseUnitsToHex(10),
        "MarketBorrowCap",
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
        "MarketSupplyCap",
        mockVToken.address,
        "0x",
      );
      await mockRiskOracle.publishRiskParameterUpdate(
        "ipfs://QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdw8eX9",
        parseUnitsToHex(10),
        "MarketBorrowCap",
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
        "MarketSupplyCap",
        mockCoreVToken.address,
        "0x",
      );
      await mockRiskOracle.publishRiskParameterUpdate(
        "ipfs://QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdw8eX9",
        parseUnitsToHex(10),
        "MarketBorrowCap",
        mockCoreVToken.address,
        "0x",
      );
      await riskStewardReceiver.processUpdateByParameterAndMarket("MarketSupplyCap", mockCoreVToken.address);
      await riskStewardReceiver.processUpdateByParameterAndMarket("MarketBorrowCap", mockCoreVToken.address);
      expect(await mockCoreComptroller.supplyCaps(mockCoreVToken.address)).to.equal(parseUnits("10", 18));
      expect(await mockCoreComptroller.borrowCaps(mockCoreVToken.address)).to.equal(parseUnits("10", 18));
      // Isolated Pool
      expect(await mockComptroller.supplyCaps(mockVToken.address)).to.equal(parseUnits("8", 18));
      expect(await mockComptroller.borrowCaps(mockVToken.address)).to.equal(parseUnits("8", 18));
      await mockRiskOracle.publishRiskParameterUpdate(
        "ipfs://QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdw8eX9",
        parseUnitsToHex(10),
        "MarketSupplyCap",
        mockVToken.address,
        "0x",
      );
      await mockRiskOracle.publishRiskParameterUpdate(
        "ipfs://QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdw8eX9",
        parseUnitsToHex(10),
        "MarketBorrowCap",
        mockVToken.address,
        "0x",
      );
      await riskStewardReceiver.processUpdateByParameterAndMarket("MarketSupplyCap", mockVToken.address);
      await riskStewardReceiver.processUpdateByParameterAndMarket("MarketBorrowCap", mockVToken.address);
      expect(await mockComptroller.supplyCaps(mockVToken.address)).to.equal(parseUnits("10", 18));
      expect(await mockComptroller.borrowCaps(mockVToken.address)).to.equal(parseUnits("10", 18));
    });
  });
});
