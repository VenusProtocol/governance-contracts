// import { MockContract, smock } from "@defi-wonderland/smock";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { BigNumber, ContractFactory } from "ethers";
import { ethers, upgrades } from "hardhat";
import { SignerWithAddress } from "hardhat-deploy-ethers/signers";

import { LZ_CHAINID } from "../../helpers/deploy/constants";
import { MarketCapsRiskSteward, MockComptroller, MockVToken, RiskStewardDestinationReceiver } from "../../typechain";

const { parseUnits, hexValue } = ethers.utils;

const parseUnitsToHex = (value: number) => {
  return ethers.utils.hexZeroPad(hexValue(BigNumber.from(parseUnits(value.toString(), 18))), 32);
};

const DAY_AND_ONE_SECOND = 60 * 60 * 24 + 1;
const HARDHAT_LAYER_ZERO_CHAIN_ID = LZ_CHAINID.hardhat;

describe("Risk Steward", async function () {
  let deployer: SignerWithAddress,
    signer1: SignerWithAddress,
    riskStewardDestinationReceiver: RiskStewardDestinationReceiver,
    RiskStewardDestinationReceiverFactory: ContractFactory,
    MockMarketCapsRiskStewardFactory: ContractFactory,
    mockVToken: MockVToken,
    mockComptroller: MockComptroller,
    marketCapsRiskSteward: MarketCapsRiskSteward;

  const riskStewardFixture = async () => {
    deployer = (await ethers.getSigners())[0];
    signer1 = (await ethers.getSigners())[1];
    const accessControlManagerFactory = await ethers.getContractFactory("AccessControlManager");

    const accessControlManager = await accessControlManagerFactory.deploy();

    // Set up mock comptroller and markets
    const MockVTokenFactory = await ethers.getContractFactory("MockVToken");

    // IL Comptroller
    const MockComptrollerFactory = await ethers.getContractFactory("MockComptroller");
    mockComptroller = await MockComptrollerFactory.deploy();
    mockVToken = await MockVTokenFactory.deploy(mockComptroller.address);

    await mockComptroller.supportMarket(mockVToken.address);
    await mockComptroller.setMarketSupplyCaps([mockVToken.address], [parseUnits("8", 18)]);
    await mockComptroller.setMarketBorrowCaps([mockVToken.address], [parseUnits("8", 18)]);

    MockMarketCapsRiskStewardFactory = await ethers.getContractFactory("MarketCapsRiskSteward");

    RiskStewardDestinationReceiverFactory = await ethers.getContractFactory("RiskStewardDestinationReceiver");

    await accessControlManager
      .connect(deployer)
      .giveCallPermission(deployer.address, "removeTrustedRemote(uint16)", deployer.address);

    riskStewardDestinationReceiver = await upgrades.deployProxy(
      RiskStewardDestinationReceiverFactory,
      [accessControlManager.address],
      {
        constructorArgs: [],
        initializer: "initialize",
        unsafeAllow: ["state-variable-immutable"],
      },
    );

    marketCapsRiskSteward = await upgrades.deployProxy(
      MockMarketCapsRiskStewardFactory,
      [accessControlManager.address, 5000, 5],
      {
        constructorArgs: [riskStewardDestinationReceiver.address, HARDHAT_LAYER_ZERO_CHAIN_ID],
        initializer: "initialize",
        unsafeAllow: ["state-variable-immutable"],
      },
    );

    await accessControlManager.giveCallPermission(
      riskStewardDestinationReceiver.address,
      "setRiskParameterConfig(string,address,uint256)",
      deployer.address,
    );

    await accessControlManager.giveCallPermission(
      riskStewardDestinationReceiver.address,
      "toggleConfigActive(string)",
      deployer.address,
    );

    await accessControlManager.giveCallPermission(riskStewardDestinationReceiver.address, "pause()", deployer.address);

    await accessControlManager.giveCallPermission(
      riskStewardDestinationReceiver.address,
      "unpause()",
      deployer.address,
    );

    await accessControlManager.giveCallPermission(
      riskStewardDestinationReceiver.address,
      "processUpdate(uint256,bytes,string,address,bytes,uint256)",
      deployer.address,
    );

    await accessControlManager.giveCallPermission(
      riskStewardDestinationReceiver.address,
      "setDestinationChainRiskStewardRemoteReceiver(uint16,address)",
      deployer.address,
    );

    await accessControlManager.giveCallPermission(
      riskStewardDestinationReceiver.address,
      "deleteDestinationChainRiskStewardRemoteReceiver(uint16)",
      deployer.address,
    );

    await accessControlManager.giveCallPermission(
      marketCapsRiskSteward.address,
      "setMaxDeltaBps(uint256)",
      deployer.address,
    );

    await riskStewardDestinationReceiver.setRiskParameterConfig(
      "supplyCap",
      marketCapsRiskSteward.address,
      DAY_AND_ONE_SECOND,
    );
    await riskStewardDestinationReceiver.setRiskParameterConfig(
      "borrowCap",
      marketCapsRiskSteward.address,
      DAY_AND_ONE_SECOND,
    );
  };

  beforeEach(async function () {
    await loadFixture(riskStewardFixture);
  });

  describe("Access Control", async function () {
    it("should revert if access control manager is set to zero address", async function () {
      await expect(
        upgrades.deployProxy(RiskStewardDestinationReceiverFactory, [ethers.constants.AddressZero], {
          constructorArgs: [],
          initializer: "initialize",
          unsafeAllow: ["state-variable-immutable"],
        }),
      ).to.be.rejectedWith("invalid acess control manager address");
    });

    it("should revert if access is not granted for processing update", async function () {
      await expect(
        riskStewardDestinationReceiver
          .connect(signer1)
          .setRiskParameterConfig("supplyCap", marketCapsRiskSteward.address, 1),
      ).to.be.rejectedWith(
        `Unauthorized("${signer1.address}", "${riskStewardDestinationReceiver.address}", "setRiskParameterConfig(string,address,uint256)")`,
      );
    });

    it("should revert if access is not granted for toggling config active", async function () {
      await expect(riskStewardDestinationReceiver.connect(signer1).toggleConfigActive("supplyCap")).to.be.rejectedWith(
        `Unauthorized("${signer1.address}", "${riskStewardDestinationReceiver.address}", "toggleConfigActive(string)")`,
        ``,
      );
    });

    it("should revert if access is not granted for pausing", async function () {
      await expect(riskStewardDestinationReceiver.connect(signer1).pause()).to.be.rejectedWith(
        `Unauthorized("${signer1.address}", "${riskStewardDestinationReceiver.address}", "pause()")`,
      );
    });

    it("should revert if access is not granted for unpausing", async function () {
      await expect(riskStewardDestinationReceiver.connect(signer1).unpause()).to.be.rejectedWith(
        `Unauthorized("${signer1.address}", "${riskStewardDestinationReceiver.address}", "unpause()")`,
      );
    });

    it("should revert if access is not granted for processing update on RiskStewardDestinationReceiver", async function () {
      await expect(
        riskStewardDestinationReceiver
          .connect(signer1)
          .processUpdate(1, "0x", "supplyCap", mockVToken.address, "0x", new Date().getTime()),
      ).to.be.rejectedWith(
        'Unauthorized("0x70997970C51812dc3A010C7d01b50e0d17dc79C8", "0x367761085BF3C12e5DA2Df99AC6E1a824612b8fb", "processUpdate(uint256,bytes,string,address,bytes,uint256)")',
      );
    });

    it("should revert if access is not granted for processing update on MarketCapsRiskSteward", async function () {
      await expect(
        marketCapsRiskSteward.connect(signer1).processUpdate(1, "0x", "supplyCap", mockVToken.address, "0x"),
      ).to.be.rejectedWith("OnlyRiskStewardReceiver()");
    });
  });

  describe("Upgradeable", async function () {
    it("new implementation should be set", async function () {
      await upgrades.upgradeProxy(riskStewardDestinationReceiver, RiskStewardDestinationReceiverFactory, {
        constructorArgs: [],
        unsafeAllow: ["state-variable-immutable"],
      });
    });
  });

  describe("Risk Steward Pause", async function () {
    it("should toggle paused state", async function () {
      await riskStewardDestinationReceiver.pause();
      expect(await riskStewardDestinationReceiver.paused()).to.equal(true);
    });

    it("should revert if contract is paused", async function () {
      await riskStewardDestinationReceiver.pause();
      await expect(
        riskStewardDestinationReceiver.processUpdate(1, "0x", "supplyCap", mockVToken.address, "0x", 1),
      ).to.be.rejectedWith("Pausable: paused");
    });
  });

  describe("Risk Parameter Update Reverts under incorrect conditions", async function () {
    it("should error if updateType is not implemented", async function () {
      await expect(
        riskStewardDestinationReceiver.processUpdate(
          1,
          parseUnitsToHex(10),
          "randomUpdateType",
          mockVToken.address,
          "0x",
          new Date().getTime(),
        ),
      )
        .to.emit(riskStewardDestinationReceiver, "RiskParameterUpdateFailed")
        .withArgs(1, 2);
      expect(await riskStewardDestinationReceiver.processedUpdates(1)).to.equal(2);
    });

    it("should error if updateType is not active", async function () {
      await riskStewardDestinationReceiver.toggleConfigActive("supplyCap");
      await expect(
        riskStewardDestinationReceiver.processUpdate(1, parseUnitsToHex(10), "supplyCap", mockVToken.address, "0x", 1),
      )
        .to.emit(riskStewardDestinationReceiver, "RiskParameterUpdateFailed")
        .withArgs(1, 2);
      expect(await riskStewardDestinationReceiver.processedUpdates(1)).to.equal(2);

      await riskStewardDestinationReceiver.toggleConfigActive("borrowCap");
      await expect(
        riskStewardDestinationReceiver.processUpdate(2, parseUnitsToHex(10), "borrowCap", mockVToken.address, "0x", 1),
      )
        .to.emit(riskStewardDestinationReceiver, "RiskParameterUpdateFailed")
        .withArgs(2, 2);
      expect(await riskStewardDestinationReceiver.processedUpdates(1)).to.equal(2);
    });

    it("should error if the update is expired", async function () {
      await expect(
        riskStewardDestinationReceiver.processUpdate(1, parseUnitsToHex(10), "supplyCap", mockVToken.address, "0x", 1),
      )
        .to.emit(riskStewardDestinationReceiver, "RiskParameterUpdateFailed")
        .withArgs(1, 3);
      await expect(
        riskStewardDestinationReceiver.processUpdate(2, parseUnitsToHex(10), "borrowCap", mockVToken.address, "0x", 1),
      )
        .to.emit(riskStewardDestinationReceiver, "RiskParameterUpdateFailed")
        .withArgs(2, 3);
    });

    it("should revert if market is not supported", async function () {
      // Wrong address
      await expect(
        riskStewardDestinationReceiver.processUpdate(
          1,
          parseUnitsToHex(10),
          "supplyCap",
          mockComptroller.address,
          "0x",
          new Date().getTime(),
        ),
      )
        .to.emit(riskStewardDestinationReceiver, "RiskParameterUpdateFailed")
        .withArgs(1, 5);
    });

    it("should error if the update is too frequent", async function () {
      await expect(
        await riskStewardDestinationReceiver.processUpdate(
          3,
          parseUnitsToHex(10),
          "borrowCap",
          mockVToken.address,
          "0x",
          new Date().getTime(),
        ),
      )
        .to.emit(riskStewardDestinationReceiver, "RiskParameterUpdateProcessed")
        .withArgs(3);

      await expect(
        riskStewardDestinationReceiver.processUpdate(
          4,
          parseUnitsToHex(10),
          "borrowCap",
          mockVToken.address,
          "0x",
          new Date().getTime(),
        ),
      )
        .to.emit(riskStewardDestinationReceiver, "RiskParameterUpdateFailed")
        .withArgs(4, 5);
    });

    it("should revert if the update has already been applied", async function () {
      await riskStewardDestinationReceiver.processUpdate(
        1,
        parseUnitsToHex(10),
        "supplyCap",
        mockVToken.address,
        "0x",
        new Date().getTime(),
      );
      await expect(
        riskStewardDestinationReceiver.processUpdate(
          1,
          parseUnitsToHex(10),
          "supplyCap",
          mockVToken.address,
          "0x",
          new Date().getTime(),
        ),
      )
        .to.emit(riskStewardDestinationReceiver, "RiskParameterUpdateFailed")
        .withArgs(1, 1);
    });

    it("should revert if the update is out of bounds", async function () {
      // Too low
      await expect(
        riskStewardDestinationReceiver.processUpdate(
          1,
          parseUnitsToHex(1),
          "supplyCap",
          mockVToken.address,
          "0x",
          new Date().getTime(),
        ),
      )
        .to.emit(riskStewardDestinationReceiver, "RiskParameterUpdateFailed")
        .withArgs(1, 5);

      // Too high
      await expect(
        riskStewardDestinationReceiver.processUpdate(
          3,
          parseUnitsToHex(20),
          "borrowCap",
          mockVToken.address,
          "0x",
          new Date().getTime(),
        ),
      )
        .to.emit(riskStewardDestinationReceiver, "RiskParameterUpdateFailed")
        .withArgs(3, 5);
    });
  });
});
