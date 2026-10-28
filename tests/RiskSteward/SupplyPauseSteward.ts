import { impersonateAccount, loadFixture, setBalance, time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { parseUnits } from "ethers/lib/utils";
import fs from "fs";
import { ethers, upgrades } from "hardhat";
import { SignerWithAddress } from "hardhat-deploy-ethers/signers";
import path from "path";

import {
  AccessControlManager,
  DestinationStewardReceiver,
  MockComptroller,
  MockCoreComptroller,
  MockVToken,
  RiskOracle,
  RiskStewardReceiver,
  SupplyPauseSteward,
} from "../../typechain";

const MINT = 0;
const EMODE_POOL_ID = 1;
// A pool that exists but does not list the market under test
const UNLISTED_POOL_ID = 2;

const COLLATERAL_FACTOR = parseUnits("0.7", 18);
const LIQUIDATION_THRESHOLD = parseUnits("0.8", 18);
const EMODE_COLLATERAL_FACTOR = parseUnits("0.9", 18);
const EMODE_LIQUIDATION_THRESHOLD = parseUnits("0.93", 18);

const ONE_DAY = 60 * 60 * 24;
const SIX_HOURS = 60 * 60 * 6;

const BSC_LZV2_CHAIN_ID = 30102;
const ETHEREUM_LZV2_CHAIN_ID = 30101;

describe("SupplyPauseSteward", async function () {
  let deployer: SignerWithAddress,
    executor: SignerWithAddress,
    accessControlManager: AccessControlManager,
    riskOracle: RiskOracle,
    riskStewardReceiver: RiskStewardReceiver,
    destinationRiskStewardReceiver: DestinationStewardReceiver,
    supplyPauseSteward: SupplyPauseSteward,
    destinationSupplyPauseSteward: SupplyPauseSteward,
    mockCoreComptroller: MockCoreComptroller,
    mockComptroller: MockComptroller,
    mockCoreVToken: MockVToken,
    mockVToken: MockVToken;

  const publish = (market: string, poolId = 0, dstEid = 0) =>
    riskOracle.publishRiskParameterUpdate("ipfs://QmSupplyPause", "0x", "supplyPause", market, poolId, dstEid, "0x");

  const fixture = async () => {
    [deployer, , executor] = await ethers.getSigners();

    const accessControlManagerFactory = await ethers.getContractFactory("AccessControlManager");
    accessControlManager = await accessControlManagerFactory.deploy();

    const MockVTokenFactory = await ethers.getContractFactory("MockVToken");
    mockCoreComptroller = await (await ethers.getContractFactory("MockCoreComptroller")).deploy();
    mockCoreVToken = await MockVTokenFactory.deploy(mockCoreComptroller.address);
    await mockCoreComptroller.supportMarket(mockCoreVToken.address);
    await mockCoreComptroller.setCollateralFactor(0, mockCoreVToken.address, COLLATERAL_FACTOR, LIQUIDATION_THRESHOLD);
    await mockCoreComptroller.setCollateralFactor(
      EMODE_POOL_ID,
      mockCoreVToken.address,
      EMODE_COLLATERAL_FACTOR,
      EMODE_LIQUIDATION_THRESHOLD,
    );
    const otherCoreVToken = await MockVTokenFactory.deploy(mockCoreComptroller.address);
    await mockCoreComptroller.supportMarket(otherCoreVToken.address);
    await mockCoreComptroller.setCollateralFactor(
      UNLISTED_POOL_ID,
      otherCoreVToken.address,
      EMODE_COLLATERAL_FACTOR,
      EMODE_LIQUIDATION_THRESHOLD,
    );
    mockComptroller = await (await ethers.getContractFactory("MockComptroller")).deploy();
    mockVToken = await MockVTokenFactory.deploy(mockComptroller.address);
    await mockComptroller.supportMarket(mockVToken.address);
    await mockComptroller.setCollateralFactor(mockVToken.address, COLLATERAL_FACTOR, LIQUIDATION_THRESHOLD);

    riskOracle = await upgrades.deployProxy(
      await ethers.getContractFactory("RiskOracle"),
      [accessControlManager.address],
      {
        initializer: "initialize",
      },
    );

    const artifactPath = path.join(
      __dirname,
      "../../node_modules/@layerzerolabs/test-devtools-evm-hardhat/artifacts/contracts/mocks/EndpointV2Mock.sol/EndpointV2Mock.json",
    );
    const endpointArtifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    const EndpointFactory = new ethers.ContractFactory(endpointArtifact.abi, endpointArtifact.bytecode, deployer);
    const localEndpointV2 = await EndpointFactory.deploy(BSC_LZV2_CHAIN_ID);
    const remoteEndpointV2 = await EndpointFactory.deploy(ETHEREUM_LZV2_CHAIN_ID);

    riskStewardReceiver = await upgrades.deployProxy(
      await ethers.getContractFactory("RiskStewardReceiver"),
      [accessControlManager.address, deployer.address],
      {
        constructorArgs: [riskOracle.address, localEndpointV2.address, BSC_LZV2_CHAIN_ID],
        initializer: "initialize",
        unsafeAllow: ["state-variable-immutable", "constructor"],
      },
    );
    await deployer.sendTransaction({ to: riskStewardReceiver.address, value: ethers.utils.parseEther("1") });

    destinationRiskStewardReceiver = await upgrades.deployProxy(
      await ethers.getContractFactory("DestinationStewardReceiver"),
      [accessControlManager.address, deployer.address],
      {
        constructorArgs: [remoteEndpointV2.address, ETHEREUM_LZV2_CHAIN_ID],
        initializer: "initialize",
        unsafeAllow: ["state-variable-immutable", "constructor"],
      },
    );

    await localEndpointV2.setDestLzEndpoint(destinationRiskStewardReceiver.address, remoteEndpointV2.address);
    await remoteEndpointV2.setDestLzEndpoint(riskStewardReceiver.address, localEndpointV2.address);
    await riskStewardReceiver.setPeer(
      ETHEREUM_LZV2_CHAIN_ID,
      ethers.utils.hexZeroPad(destinationRiskStewardReceiver.address, 32),
    );
    await destinationRiskStewardReceiver.setPeer(
      BSC_LZV2_CHAIN_ID,
      ethers.utils.hexZeroPad(riskStewardReceiver.address, 32),
    );

    const SupplyPauseStewardFactory = await ethers.getContractFactory("SupplyPauseSteward");
    supplyPauseSteward = await upgrades.deployProxy(SupplyPauseStewardFactory, [accessControlManager.address], {
      constructorArgs: [mockCoreComptroller.address, riskStewardReceiver.address],
      initializer: "initialize",
      unsafeAllow: ["state-variable-immutable", "constructor"],
    });
    destinationSupplyPauseSteward = await upgrades.deployProxy(
      SupplyPauseStewardFactory,
      [accessControlManager.address],
      {
        constructorArgs: [ethers.constants.AddressZero, destinationRiskStewardReceiver.address],
        initializer: "initialize",
        unsafeAllow: ["state-variable-immutable", "constructor"],
      },
    );

    const permissions: [string, string][] = [
      [riskOracle.address, "addAuthorizedSender(address)"],
      [riskOracle.address, "addUpdateType(string)"],
      [riskStewardReceiver.address, "setRiskParameterConfig(string,address,uint256,uint256)"],
      [riskStewardReceiver.address, "setWhitelistedExecutor(address,bool)"],
      [destinationRiskStewardReceiver.address, "setRiskParameterConfig(string,address,uint256)"],
      [destinationRiskStewardReceiver.address, "setWhitelistedExecutor(address,bool)"],
    ];
    for (const [contract, signature] of permissions) {
      await accessControlManager.giveCallPermission(contract, signature, deployer.address);
    }

    await riskOracle.addAuthorizedSender(deployer.address);
    await riskOracle.addUpdateType("supplyPause");

    await riskStewardReceiver.setRiskParameterConfig("supplyPause", supplyPauseSteward.address, ONE_DAY, 0);
    await riskStewardReceiver.setWhitelistedExecutor(executor.address, true);
    await destinationRiskStewardReceiver.setRiskParameterConfig(
      "supplyPause",
      destinationSupplyPauseSteward.address,
      ONE_DAY,
    );
    await destinationRiskStewardReceiver.setWhitelistedExecutor(executor.address, true);
  };

  beforeEach(async function () {
    await loadFixture(fixture);
  });

  describe("deployment", async function () {
    it("reverts on a zero receiver address", async function () {
      const factory = await ethers.getContractFactory("SupplyPauseSteward");
      await expect(
        factory.deploy(mockCoreComptroller.address, ethers.constants.AddressZero),
      ).to.be.revertedWithCustomError(factory, "ZeroAddressNotAllowed");
    });

    it("accepts a zero Core Pool Comptroller for chains without one", async function () {
      expect(await destinationSupplyPauseSteward.CORE_POOL_COMPTROLLER()).to.equal(ethers.constants.AddressZero);
      expect(await destinationSupplyPauseSteward.RISK_STEWARD_RECEIVER()).to.equal(
        destinationRiskStewardReceiver.address,
      );
    });
  });

  describe("supplyPause", async function () {
    it("pauses supply in every pool of a core pool market at once, keeping each liquidation threshold", async function () {
      await publish(mockCoreVToken.address);

      await expect(riskStewardReceiver.processUpdate(1))
        .to.emit(supplyPauseSteward, "SupplyPaused")
        .withArgs(1, mockCoreVToken.address)
        .and.to.emit(riskStewardReceiver, "UpdateExecuted")
        .withArgs(1);

      const market = await mockCoreComptroller.poolMarkets(0, mockCoreVToken.address);
      expect(market.collateralFactorMantissa).to.equal(0);
      expect(market.liquidationThresholdMantissa).to.equal(LIQUIDATION_THRESHOLD);

      const eModeMarket = await mockCoreComptroller.poolMarkets(EMODE_POOL_ID, mockCoreVToken.address);
      expect(eModeMarket.collateralFactorMantissa).to.equal(0);
      expect(eModeMarket.liquidationThresholdMantissa).to.equal(EMODE_LIQUIDATION_THRESHOLD);

      // The mock lists a market in any pool it sets a factor on, so this fails if the steward touched pool 2
      expect((await mockCoreComptroller.poolMarkets(UNLISTED_POOL_ID, mockCoreVToken.address)).isListed).to.equal(
        false,
      );
      expect(await mockCoreComptroller.actionPaused(mockCoreVToken.address, MINT)).to.equal(true);
    });

    it("still zeroes an eMode pool when the core pool is already paused", async function () {
      await mockCoreComptroller.setCollateralFactor(0, mockCoreVToken.address, 0, LIQUIDATION_THRESHOLD);
      await mockCoreComptroller.setActionsPaused([mockCoreVToken.address], [MINT], true);
      await publish(mockCoreVToken.address);

      await expect(riskStewardReceiver.processUpdate(1))
        .to.emit(supplyPauseSteward, "SupplyPaused")
        .withArgs(1, mockCoreVToken.address);

      const eModeMarket = await mockCoreComptroller.poolMarkets(EMODE_POOL_ID, mockCoreVToken.address);
      expect(eModeMarket.collateralFactorMantissa).to.equal(0);
      expect(eModeMarket.liquidationThresholdMantissa).to.equal(EMODE_LIQUIDATION_THRESHOLD);
    });

    it("pauses supply on an isolated pool market at once, keeping its liquidation threshold", async function () {
      await publish(mockVToken.address);

      await expect(riskStewardReceiver.processUpdate(1))
        .to.emit(supplyPauseSteward, "SupplyPaused")
        .withArgs(1, mockVToken.address);

      const market = await mockComptroller.markets(mockVToken.address);
      expect(market.collateralFactorMantissa).to.equal(0);
      expect(market.liquidationThresholdMantissa).to.equal(LIQUIDATION_THRESHOLD);
      expect(await mockComptroller.actionPaused(mockVToken.address, MINT)).to.equal(true);
    });

    it("sets the collateral factor to 0 when MINT is already paused", async function () {
      await mockComptroller.setActionsPaused([mockVToken.address], [MINT], true);
      await publish(mockVToken.address);

      await expect(riskStewardReceiver.processUpdate(1)).to.emit(supplyPauseSteward, "SupplyPaused");
      expect((await mockComptroller.markets(mockVToken.address)).collateralFactorMantissa).to.equal(0);
    });

    it("pauses MINT when the collateral factor is already 0", async function () {
      await mockComptroller.setCollateralFactor(mockVToken.address, 0, LIQUIDATION_THRESHOLD);
      await publish(mockVToken.address);

      await expect(riskStewardReceiver.processUpdate(1)).to.emit(supplyPauseSteward, "SupplyPaused");
      expect(await mockComptroller.actionPaused(mockVToken.address, MINT)).to.equal(true);
      expect((await mockComptroller.markets(mockVToken.address)).liquidationThresholdMantissa).to.equal(
        LIQUIDATION_THRESHOLD,
      );
    });

    it("applies at once even when the update type has a timelock", async function () {
      await riskStewardReceiver.setRiskParameterConfig("supplyPause", supplyPauseSteward.address, ONE_DAY, SIX_HOURS);
      await publish(mockVToken.address);

      const tx = await riskStewardReceiver.processUpdate(1);
      await expect(tx).to.emit(riskStewardReceiver, "UpdateExecuted").withArgs(1);
      await expect(tx).to.emit(supplyPauseSteward, "SupplyPaused").withArgs(1, mockVToken.address);

      const registered = await riskStewardReceiver.updates(1);
      expect(registered.status).to.equal(2); // Executed
      expect(registered.unlockTime).to.equal(registered.executedAt);
      expect(await mockComptroller.actionPaused(mockVToken.address, MINT)).to.equal(true);
    });
  });

  describe("validation", async function () {
    it("reverts when a core pool market's supply is already paused in every pool", async function () {
      await mockCoreComptroller.setCollateralFactor(0, mockCoreVToken.address, 0, LIQUIDATION_THRESHOLD);
      await mockCoreComptroller.setCollateralFactor(
        EMODE_POOL_ID,
        mockCoreVToken.address,
        0,
        EMODE_LIQUIDATION_THRESHOLD,
      );
      await mockCoreComptroller.setActionsPaused([mockCoreVToken.address], [MINT], true);
      await publish(mockCoreVToken.address);

      await expect(riskStewardReceiver.processUpdate(1)).to.be.revertedWithCustomError(
        supplyPauseSteward,
        "RedundantValue",
      );
    });

    it("reverts when an isolated pool market's supply is already paused", async function () {
      await mockComptroller.setCollateralFactor(mockVToken.address, 0, LIQUIDATION_THRESHOLD);
      await mockComptroller.setActionsPaused([mockVToken.address], [MINT], true);
      await publish(mockVToken.address);

      await expect(riskStewardReceiver.processUpdate(1)).to.be.revertedWithCustomError(
        supplyPauseSteward,
        "RedundantValue",
      );
    });

    it("reverts on a pool ID on either comptroller, since a pause covers every pool", async function () {
      await publish(mockCoreVToken.address, EMODE_POOL_ID);
      await publish(mockVToken.address, EMODE_POOL_ID);

      await expect(riskStewardReceiver.processUpdate(1)).to.be.revertedWithCustomError(
        supplyPauseSteward,
        "InvalidPool",
      );
      await expect(riskStewardReceiver.processUpdate(2)).to.be.revertedWithCustomError(
        supplyPauseSteward,
        "InvalidPool",
      );
      expect(
        (await mockCoreComptroller.poolMarkets(EMODE_POOL_ID, mockCoreVToken.address)).collateralFactorMantissa,
      ).to.equal(EMODE_COLLATERAL_FACTOR);
    });

    it("reports a pool ID as InvalidPool even when every pool is already paused", async function () {
      await mockCoreComptroller.setCollateralFactor(0, mockCoreVToken.address, 0, LIQUIDATION_THRESHOLD);
      await mockCoreComptroller.setCollateralFactor(
        EMODE_POOL_ID,
        mockCoreVToken.address,
        0,
        EMODE_LIQUIDATION_THRESHOLD,
      );
      await mockCoreComptroller.setActionsPaused([mockCoreVToken.address], [MINT], true);
      await publish(mockCoreVToken.address, EMODE_POOL_ID);

      await expect(
        supplyPauseSteward.isSafeForDirectExecution(await riskOracle.getUpdateById(1)),
      ).to.be.revertedWithCustomError(supplyPauseSteward, "InvalidPool");
    });

    it("reverts on an unsupported update type", async function () {
      const update = {
        referenceId: "",
        updateId: 1,
        market: mockVToken.address,
        updateType: "supplyCap",
        updateTypeKey: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("supplyCap")),
        newValue: "0x",
        previousValue: "0x",
        timestamp: 0,
        publisher: deployer.address,
        poolId: 0,
        destLzEid: 0,
        additionalData: "0x",
      };
      await expect(supplyPauseSteward.isSafeForDirectExecution(update)).to.be.revertedWithCustomError(
        supplyPauseSteward,
        "UnsupportedUpdateType",
      );

      await impersonateAccount(riskStewardReceiver.address);
      await setBalance(riskStewardReceiver.address, ethers.utils.parseEther("1"));
      const receiverSigner = await ethers.getSigner(riskStewardReceiver.address);
      await expect(supplyPauseSteward.connect(receiverSigner).applyUpdate(update)).to.be.revertedWithCustomError(
        supplyPauseSteward,
        "UnsupportedUpdateType",
      );
    });

    it("reverts when applyUpdate is not called by the receiver", async function () {
      await publish(mockVToken.address);
      const update = await riskOracle.getUpdateById(1);
      await expect(supplyPauseSteward.applyUpdate(update)).to.be.revertedWithCustomError(
        supplyPauseSteward,
        "OnlyRiskStewardReceiver",
      );
    });
  });

  describe("remote updates", async function () {
    it("pauses supply on the destination chain after the remote delay", async function () {
      await publish(mockVToken.address, 0, ETHEREUM_LZV2_CHAIN_ID);
      await expect(riskStewardReceiver.processUpdate(1)).to.emit(riskStewardReceiver, "UpdateSentToDestination");

      await expect(destinationRiskStewardReceiver.connect(executor).executeUpdate(1)).to.be.revertedWithCustomError(
        destinationRiskStewardReceiver,
        "UpdateNotUnlocked",
      );

      await time.increase(SIX_HOURS + 1);
      await expect(destinationRiskStewardReceiver.connect(executor).executeUpdate(1))
        .to.emit(destinationSupplyPauseSteward, "SupplyPaused")
        .withArgs(1, mockVToken.address);

      const market = await mockComptroller.markets(mockVToken.address);
      expect(market.collateralFactorMantissa).to.equal(0);
      expect(market.liquidationThresholdMantissa).to.equal(LIQUIDATION_THRESHOLD);
      expect(await mockComptroller.actionPaused(mockVToken.address, MINT)).to.equal(true);
    });
  });
});
