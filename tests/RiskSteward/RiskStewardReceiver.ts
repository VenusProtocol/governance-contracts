import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { BigNumber, ContractFactory } from "ethers";
import fs from "fs";
import { ethers, upgrades } from "hardhat";
import { SignerWithAddress } from "hardhat-deploy-ethers/signers";
import path from "path";

import {
  AccessControlManager,
  CollateralFactorsRiskSteward,
  DestinationStewardReceiver,
  IRMRiskSteward,
  MarketCapsRiskSteward,
  MockComptroller,
  MockCoreComptroller,
  MockVToken,
  RiskOracle,
  RiskStewardReceiver,
} from "../../typechain";

const { parseUnits, hexValue } = ethers.utils;

const parseUnitsToHex = (value: number) => {
  return ethers.utils.hexZeroPad(hexValue(BigNumber.from(parseUnits(value.toString(), 18))), 32);
};

const encodeCollateralFactors = (collateralFactor: number, liquidationThreshold: number) => {
  return ethers.utils.defaultAbiCoder.encode(
    ["uint256", "uint256"],
    [parseUnits(collateralFactor.toString(), 18), parseUnits(liquidationThreshold.toString(), 18)],
  );
};

const DAY_AND_ONE_SECOND = 60 * 60 * 24 + 1;
const SIX_HOURS = 60 * 60 * 6;

const BSC_LZV2_CHAIN_ID = 30102;
const ETHEREUM_LZV2_CHAIN_ID = 30101;

describe("Risk Steward", async function () {
  let deployer: SignerWithAddress,
    unauthorizedSigner: SignerWithAddress,
    executor: SignerWithAddress,
    riskOracle: RiskOracle,
    riskStewardReceiver: RiskStewardReceiver,
    destinationRiskStewardReceiver: DestinationStewardReceiver,
    RiskStewardReceiverFactory: ContractFactory,
    DestinationStewardReceiverFactory: ContractFactory,
    RiskOracleFactory: ContractFactory,
    MarketCapsRiskStewardFactory: ContractFactory,
    CollateralFactorsRiskStewardFactory: ContractFactory,
    IRMRiskStewardFactory: ContractFactory,
    mockCoreVToken: MockVToken,
    mockVToken: MockVToken,
    mockCoreComptroller: MockCoreComptroller,
    mockComptroller: MockComptroller,
    marketCapsRiskSteward: MarketCapsRiskSteward,
    destinationMarketCapsRiskSteward: MarketCapsRiskSteward,
    collateralFactorsRiskSteward: CollateralFactorsRiskSteward,
    destinationCollateralFactorsRiskSteward: CollateralFactorsRiskSteward,
    irmRiskSteward: IRMRiskSteward,
    destinationIRMRiskSteward: IRMRiskSteward,
    accessControlManager: AccessControlManager;

  const deployAndConfigureBridge = async (localEndpointV2: any, remoteEndpointV2: any) => {
    // Bridge connection
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
  };

  const setupPermissionsAndConfigs = async (accessControlManager: any) => {
    await accessControlManager.giveCallPermission(riskOracle.address, "addAuthorizedSender(address)", deployer.address);
    await accessControlManager.giveCallPermission(riskOracle.address, "addUpdateType(string)", deployer.address);

    await accessControlManager.giveCallPermission(
      riskStewardReceiver.address,
      "setRiskParameterConfig(string,address,uint256,uint256)",
      deployer.address,
    );

    await accessControlManager.giveCallPermission(
      riskStewardReceiver.address,
      "setWhitelistedExecutor(address,bool)",
      deployer.address,
    );

    await accessControlManager.giveCallPermission(riskStewardReceiver.address, "setPaused(bool)", deployer.address);

    await accessControlManager.giveCallPermission(
      riskStewardReceiver.address,
      "setConfigActive(string,bool)",
      deployer.address,
    );

    // Destination receiver permissions
    await accessControlManager.giveCallPermission(
      destinationRiskStewardReceiver.address,
      "setRiskParameterConfig(string,address,uint256)",
      deployer.address,
    );
    await accessControlManager.giveCallPermission(
      destinationRiskStewardReceiver.address,
      "setWhitelistedExecutor(address,bool)",
      deployer.address,
    );
    await accessControlManager.giveCallPermission(
      destinationRiskStewardReceiver.address,
      "setConfigActive(string,bool)",
      deployer.address,
    );

    await riskOracle.addAuthorizedSender(deployer.address);
    await riskOracle.addUpdateType("supplyCap");
    await riskOracle.addUpdateType("borrowCap");
    await riskOracle.addUpdateType("collateralFactors");
    await riskOracle.addUpdateType("interestRateModel");

    await riskStewardReceiver.setRiskParameterConfig(
      "supplyCap",
      marketCapsRiskSteward.address,
      DAY_AND_ONE_SECOND,
      SIX_HOURS,
    );
    await riskStewardReceiver.setRiskParameterConfig(
      "borrowCap",
      marketCapsRiskSteward.address,
      DAY_AND_ONE_SECOND,
      SIX_HOURS,
    );
    await riskStewardReceiver.setRiskParameterConfig(
      "collateralFactors",
      collateralFactorsRiskSteward.address,
      DAY_AND_ONE_SECOND,
      SIX_HOURS,
    );
    await riskStewardReceiver.setRiskParameterConfig(
      "interestRateModel",
      irmRiskSteward.address,
      DAY_AND_ONE_SECOND,
      SIX_HOURS,
    );

    await riskStewardReceiver.setWhitelistedExecutor(executor.address, true);

    // Destination chain config and executor
    await destinationRiskStewardReceiver.setRiskParameterConfig(
      "borrowCap",
      destinationMarketCapsRiskSteward.address,
      DAY_AND_ONE_SECOND,
    );
    await destinationRiskStewardReceiver.setRiskParameterConfig(
      "collateralFactors",
      destinationCollateralFactorsRiskSteward.address,
      DAY_AND_ONE_SECOND,
    );
    await destinationRiskStewardReceiver.setRiskParameterConfig(
      "interestRateModel",
      destinationIRMRiskSteward.address,
      DAY_AND_ONE_SECOND,
    );
    await destinationRiskStewardReceiver.setWhitelistedExecutor(executor.address, true);
  };

  const riskStewardFixture = async () => {
    [deployer, unauthorizedSigner, executor] = await ethers.getSigners();

    const accessControlManagerFactory = await ethers.getContractFactory("AccessControlManager");
    accessControlManager = await accessControlManagerFactory.deploy();

    // Core receiver factories
    RiskStewardReceiverFactory = await ethers.getContractFactory("RiskStewardReceiver");
    DestinationStewardReceiverFactory = await ethers.getContractFactory("DestinationStewardReceiver");

    // Set up mock comptroller and markets
    const MockVTokenFactory = await ethers.getContractFactory("MockVToken");
    const MockCoreComptrollerFactory = await ethers.getContractFactory("MockCoreComptroller");
    const MockComptrollerFactory = await ethers.getContractFactory("MockComptroller");

    // Core markets
    mockCoreComptroller = await MockCoreComptrollerFactory.deploy();
    mockCoreVToken = await MockVTokenFactory.deploy(mockCoreComptroller.address);
    await mockCoreComptroller.supportMarket(mockCoreVToken.address);
    await mockCoreComptroller.setMarketSupplyCaps([mockCoreVToken.address], [parseUnits("8", 18)]);
    await mockCoreComptroller.setMarketBorrowCaps([mockCoreVToken.address], [parseUnits("8", 18)]);
    await mockCoreComptroller.setCollateralFactor(
      0,
      mockCoreVToken.address,
      parseUnits("0.5", 18),
      parseUnits("0.6", 18),
    );

    // Isolated markets
    mockComptroller = await MockComptrollerFactory.deploy();
    mockVToken = await MockVTokenFactory.deploy(mockComptroller.address);
    await mockComptroller.supportMarket(mockVToken.address);
    await mockComptroller.setMarketSupplyCaps([mockVToken.address], [parseUnits("8", 18)]);
    await mockComptroller.setMarketBorrowCaps([mockVToken.address], [parseUnits("8", 18)]);

    // Risk oracle
    RiskOracleFactory = await ethers.getContractFactory("RiskOracle");
    riskOracle = await upgrades.deployProxy(RiskOracleFactory, [accessControlManager.address], {
      constructorArgs: [],
      initializer: "initialize",
      unsafeAllow: ["state-variable-immutable"],
    });

    // LayerZero endpoint mocks
    const artifactPath = path.join(
      __dirname,
      "../../node_modules/@layerzerolabs/test-devtools-evm-hardhat/artifacts/contracts/mocks/EndpointV2Mock.sol/EndpointV2Mock.json",
    );
    const endpointArtifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    const EndpointFactory = new ethers.ContractFactory(endpointArtifact.abi, endpointArtifact.bytecode, deployer);

    const localEndpointV2 = await EndpointFactory.deploy(BSC_LZV2_CHAIN_ID);
    const remoteEndpointV2 = await EndpointFactory.deploy(ETHEREUM_LZV2_CHAIN_ID);

    // Receivers
    riskStewardReceiver = await upgrades.deployProxy(
      RiskStewardReceiverFactory,
      [accessControlManager.address, deployer.address],
      {
        constructorArgs: [riskOracle.address, localEndpointV2.address, BSC_LZV2_CHAIN_ID],
        initializer: "initialize",
        unsafeAllow: ["state-variable-immutable", "constructor"],
      },
    );

    // fund riskStewardReceiver for bridge fees
    await deployer.sendTransaction({
      to: riskStewardReceiver.address,
      value: ethers.utils.parseEther("2.0"),
    });

    destinationRiskStewardReceiver = await upgrades.deployProxy(
      DestinationStewardReceiverFactory,
      [accessControlManager.address, deployer.address],
      {
        constructorArgs: [remoteEndpointV2.address, ETHEREUM_LZV2_CHAIN_ID],
        initializer: "initialize",
        unsafeAllow: ["state-variable-immutable", "constructor"],
      },
    );

    // Bridge wiring
    await deployAndConfigureBridge(localEndpointV2, remoteEndpointV2);

    // Market caps stewards
    MarketCapsRiskStewardFactory = await ethers.getContractFactory("MarketCapsRiskSteward");
    marketCapsRiskSteward = await upgrades.deployProxy(MarketCapsRiskStewardFactory, [accessControlManager.address], {
      constructorArgs: [riskStewardReceiver.address],
      initializer: "initialize",
      unsafeAllow: ["state-variable-immutable", "constructor"],
    });

    destinationMarketCapsRiskSteward = await upgrades.deployProxy(
      MarketCapsRiskStewardFactory,
      [accessControlManager.address],
      {
        constructorArgs: [destinationRiskStewardReceiver.address],
        initializer: "initialize",
        unsafeAllow: ["state-variable-immutable", "constructor"],
      },
    );

    // Collateral factors steward
    CollateralFactorsRiskStewardFactory = await ethers.getContractFactory("CollateralFactorsRiskSteward");
    collateralFactorsRiskSteward = await upgrades.deployProxy(
      CollateralFactorsRiskStewardFactory,
      [accessControlManager.address],
      {
        constructorArgs: [mockCoreComptroller.address, riskStewardReceiver.address],
        initializer: "initialize",
        unsafeAllow: ["state-variable-immutable", "constructor"],
      },
    );

    // Destination collateral factors steward
    destinationCollateralFactorsRiskSteward = await upgrades.deployProxy(
      CollateralFactorsRiskStewardFactory,
      [accessControlManager.address],
      {
        constructorArgs: [mockCoreComptroller.address, destinationRiskStewardReceiver.address],
        initializer: "initialize",
        unsafeAllow: ["state-variable-immutable", "constructor"],
      },
    );

    // Set safeDeltaBps for stewards (5000 = 50%)
    const deltaBps50 = 5000;
    await accessControlManager.giveCallPermission(
      marketCapsRiskSteward.address,
      "setSafeDeltaBps(uint256)",
      deployer.address,
    );
    await accessControlManager.giveCallPermission(
      destinationMarketCapsRiskSteward.address,
      "setSafeDeltaBps(uint256)",
      deployer.address,
    );
    await accessControlManager.giveCallPermission(
      collateralFactorsRiskSteward.address,
      "setSafeDeltaBps(uint256)",
      deployer.address,
    );
    await accessControlManager.giveCallPermission(
      destinationCollateralFactorsRiskSteward.address,
      "setSafeDeltaBps(uint256)",
      deployer.address,
    );

    await marketCapsRiskSteward.setSafeDeltaBps(deltaBps50);
    await destinationMarketCapsRiskSteward.setSafeDeltaBps(deltaBps50);
    await collateralFactorsRiskSteward.setSafeDeltaBps(deltaBps50);
    await destinationCollateralFactorsRiskSteward.setSafeDeltaBps(deltaBps50);

    // IRM steward
    IRMRiskStewardFactory = await ethers.getContractFactory("IRMRiskSteward");
    irmRiskSteward = await upgrades.deployProxy(IRMRiskStewardFactory, [accessControlManager.address], {
      constructorArgs: [mockCoreComptroller.address, riskStewardReceiver.address],
      initializer: "initialize",
      unsafeAllow: ["state-variable-immutable", "constructor"],
    });

    // Destination IRM steward
    destinationIRMRiskSteward = await upgrades.deployProxy(IRMRiskStewardFactory, [accessControlManager.address], {
      constructorArgs: [mockCoreComptroller.address, destinationRiskStewardReceiver.address],
      initializer: "initialize",
      unsafeAllow: ["state-variable-immutable", "constructor"],
    });

    await setupPermissionsAndConfigs(accessControlManager);
  };

  beforeEach(async function () {
    await loadFixture(riskStewardFixture);
  });

  describe("Risk Parameter Updates E2E", async function () {
    describe("immediate execution", async function () {
      it("should immediately execute SupplyCap update with increased value", async function () {
        expect(await mockCoreComptroller.supplyCaps(mockCoreVToken.address)).to.equal(parseUnits("8", 18));

        await riskOracle.publishRiskParameterUpdate(
          "ipfs://QmSupplyCapIncrease",
          parseUnitsToHex(10),
          "supplyCap",
          mockCoreVToken.address,
          0,
          0,
          "0x",
        );

        await expect(await riskStewardReceiver.processUpdate(1))
          .to.emit(marketCapsRiskSteward, "SupplyCapUpdated")
          .withArgs(1, mockCoreVToken.address, parseUnits("10", 18));

        expect(await mockCoreComptroller.supplyCaps(mockCoreVToken.address)).to.equal(parseUnits("10", 18));
      });

      it("should immediately execute BorrowCap update with decreased value", async function () {
        expect(await mockComptroller.borrowCaps(mockVToken.address)).to.equal(parseUnits("8", 18));

        await riskOracle.publishRiskParameterUpdate(
          "ipfs://QmBorrowCapDecrease",
          parseUnitsToHex(7),
          "borrowCap",
          mockVToken.address,
          0,
          0,
          "0x",
        );

        await expect(await riskStewardReceiver.processUpdate(1))
          .to.emit(marketCapsRiskSteward, "BorrowCapUpdated")
          .withArgs(1, mockVToken.address, parseUnits("7", 18));

        expect(await mockComptroller.borrowCaps(mockVToken.address)).to.equal(parseUnits("7", 18));
      });

      it("should immediately execute CollateralFactors update with increased CF and LT values", async function () {
        // Set initial collateral factors
        await mockCoreComptroller.setCollateralFactor(
          0,
          mockCoreVToken.address,
          parseUnits("0.5", 18),
          parseUnits("0.6", 18),
        );

        const newCF = parseUnits("0.6", 18);
        const newLT = parseUnits("0.7", 18);

        await riskOracle.publishRiskParameterUpdate(
          "ipfs://QmCollateralFactorsIncrease",
          encodeCollateralFactors(0.6, 0.7),
          "collateralFactors",
          mockCoreVToken.address,
          0,
          0,
          "0x",
        );

        await expect(await riskStewardReceiver.processUpdate(1))
          .to.emit(collateralFactorsRiskSteward, "CollateralFactorsUpdated")
          .withArgs(1, mockCoreVToken.address, newCF, newLT);

        const marketInfo = await mockCoreComptroller.markets(mockCoreVToken.address);
        expect(marketInfo.collateralFactorMantissa).to.equal(newCF);
        expect(marketInfo.liquidationThresholdMantissa).to.equal(newLT);
      });

      it("should immediately execute CollateralFactors update for isolated market", async function () {
        // Set initial collateral factors for isolated market
        await mockComptroller.setCollateralFactor(mockVToken.address, parseUnits("0.5", 18), parseUnits("0.6", 18));

        const newCF = parseUnits("0.6", 18);
        const newLT = parseUnits("0.7", 18);

        await riskOracle.publishRiskParameterUpdate(
          "ipfs://QmCollateralFactorsIsolated",
          encodeCollateralFactors(0.6, 0.7),
          "collateralFactors",
          mockVToken.address,
          0,
          0,
          "0x",
        );

        await expect(await riskStewardReceiver.processUpdate(1))
          .to.emit(collateralFactorsRiskSteward, "CollateralFactorsUpdated")
          .withArgs(1, mockVToken.address, newCF, newLT);

        const marketInfo = await mockComptroller.markets(mockVToken.address);
        expect(marketInfo.collateralFactorMantissa).to.equal(newCF);
        expect(marketInfo.liquidationThresholdMantissa).to.equal(newLT);
      });
    });

    describe("pause control", async function () {
      it("should pause, block processUpdate, and resume when unpaused", async function () {
        expect(await riskStewardReceiver.paused()).to.equal(false);

        await expect(riskStewardReceiver.setPaused(true))
          .to.emit(riskStewardReceiver, "PauseStatusUpdated")
          .withArgs(false, true);
        expect(await riskStewardReceiver.paused()).to.equal(true);

        await riskOracle.publishRiskParameterUpdate(
          "ipfs://QmPauseTestSupplyCap",
          parseUnitsToHex(9),
          "supplyCap",
          mockCoreVToken.address,
          0,
          0,
          "0x",
        );

        await expect(riskStewardReceiver.processUpdate(1)).to.be.revertedWithCustomError(
          riskStewardReceiver,
          "PausedError",
        );

        await expect(riskStewardReceiver.setPaused(false))
          .to.emit(riskStewardReceiver, "PauseStatusUpdated")
          .withArgs(true, false);
        expect(await riskStewardReceiver.paused()).to.equal(false);

        await expect(riskStewardReceiver.processUpdate(1))
          .to.emit(marketCapsRiskSteward, "SupplyCapUpdated")
          .withArgs(1, mockCoreVToken.address, parseUnits("9", 18));
        expect(await mockCoreComptroller.supplyCaps(mockCoreVToken.address)).to.equal(parseUnits("9", 18));
      });

      it("should revert for unauthorized pause attempts", async function () {
        await expect(riskStewardReceiver.connect(unauthorizedSigner).setPaused(true)).to.be.reverted;
      });
    });

    describe("registered and execute updates", async function () {
      it("should register and then execute BorrowCap update when change exceeds safe delta and decreases value", async function () {
        expect(await mockCoreComptroller.borrowCaps(mockCoreVToken.address)).to.equal(parseUnits("8", 18));

        await riskOracle.publishRiskParameterUpdate(
          "ipfs://QmBorrowCapHighDeltaDecrease",
          parseUnitsToHex(3),
          "borrowCap",
          mockCoreVToken.address,
          0,
          0,
          "0x",
        );

        // Not safe for direct execution, so this should only register the update
        await expect(riskStewardReceiver.processUpdate(1)).to.emit(riskStewardReceiver, "UpdateRegistered");

        // Move forward in time past the timelock
        await time.increase(SIX_HOURS + 1);

        await expect(riskStewardReceiver.connect(executor).executeRegisteredUpdate(1))
          .to.emit(marketCapsRiskSteward, "BorrowCapUpdated")
          .withArgs(1, mockCoreVToken.address, parseUnits("3", 18));

        expect(await mockCoreComptroller.borrowCaps(mockCoreVToken.address)).to.equal(parseUnits("3", 18));
      });

      it("should register and then execute eMode CollateralFactor update with increased CF only (not LT)", async function () {
        const poolId = 1; // eMode group
        const initialCF = parseUnits("0.5", 18);
        const initialLT = parseUnits("0.6", 18);

        // Set initial eMode collateral factors
        await mockCoreComptroller.setCollateralFactor(poolId, mockCoreVToken.address, initialCF, initialLT);

        const newCF = parseUnits("0.55", 18);
        const newLT = initialLT;

        await riskOracle.publishRiskParameterUpdate(
          "ipfs://QmEModeCFIncrease",
          encodeCollateralFactors(0.55, 0.6),
          "collateralFactors",
          mockCoreVToken.address,
          poolId,
          0,
          "0x",
        );

        // eMode updates always require timelock
        await expect(riskStewardReceiver.processUpdate(1)).to.emit(riskStewardReceiver, "UpdateRegistered");

        // Move forward in time past the timelock
        await time.increase(SIX_HOURS + 1);

        await expect(riskStewardReceiver.connect(executor).executeRegisteredUpdate(1))
          .to.emit(collateralFactorsRiskSteward, "CollateralFactorsUpdated")
          .withArgs(1, mockCoreVToken.address, newCF, newLT);

        const eModeMarketInfo = await mockCoreComptroller.poolMarkets(poolId, mockCoreVToken.address);
        expect(eModeMarketInfo.collateralFactorMantissa).to.equal(newCF);
        expect(eModeMarketInfo.liquidationThresholdMantissa).to.equal(newLT);
      });

      it("should register and then execute IRM update", async function () {
        // Create a mock IRM address
        const newIRM = (await ethers.getSigners())[10].address;

        // Encode the IRM address (32 bytes as expected by IRMRiskSteward)
        const encodedIRM = ethers.utils.defaultAbiCoder.encode(["address"], [newIRM]);

        expect(await mockCoreVToken.interestRateModel()).to.equal(ethers.constants.AddressZero);

        await riskOracle.publishRiskParameterUpdate(
          "ipfs://QmIRMUpdate",
          encodedIRM,
          "interestRateModel",
          mockCoreVToken.address,
          0,
          0,
          "0x",
        );

        // IRM updates always require timelock, so this should register the update
        await expect(riskStewardReceiver.processUpdate(1)).to.emit(riskStewardReceiver, "UpdateRegistered");

        // Move forward in time past the timelock
        await time.increase(SIX_HOURS + 1);

        await expect(riskStewardReceiver.connect(executor).executeRegisteredUpdate(1))
          .to.emit(irmRiskSteward, "InterestRateModelUpdated")
          .withArgs(1, mockCoreVToken.address, newIRM);

        expect(await mockCoreVToken.interestRateModel()).to.equal(newIRM);
      });

      it("should register and then execute IRM update for isolated market", async function () {
        // Create a mock IRM address
        const newIRM = (await ethers.getSigners())[11].address;

        // Encode the IRM address (32 bytes as expected by IRMRiskSteward)
        const encodedIRM = ethers.utils.defaultAbiCoder.encode(["address"], [newIRM]);

        expect(await mockVToken.interestRateModel()).to.equal(ethers.constants.AddressZero);

        await riskOracle.publishRiskParameterUpdate(
          "ipfs://QmIRMUpdateIsolated",
          encodedIRM,
          "interestRateModel",
          mockVToken.address,
          0,
          0,
          "0x",
        );

        // IRM updates always require timelock
        await expect(riskStewardReceiver.processUpdate(1)).to.emit(riskStewardReceiver, "UpdateRegistered");

        // Move forward in time past the timelock
        await time.increase(SIX_HOURS + 1);

        await expect(riskStewardReceiver.connect(executor).executeRegisteredUpdate(1))
          .to.emit(irmRiskSteward, "InterestRateModelUpdated")
          .withArgs(1, mockVToken.address, newIRM);

        expect(await mockVToken.interestRateModel()).to.equal(newIRM);
      });
    });

    describe("remote updates", async function () {
      it("should send remote BorrowCap update to destination chain", async function () {
        // Initial local caps on core market
        expect(await mockCoreComptroller.borrowCaps(mockCoreVToken.address)).to.equal(parseUnits("8", 18));

        await riskOracle.publishRiskParameterUpdate(
          "ipfs://QmBorrowCapRemoteUpdate",
          parseUnitsToHex(12),
          "borrowCap",
          mockCoreVToken.address,
          0,
          ETHEREUM_LZV2_CHAIN_ID,
          "0x",
        );

        // For remote updates, the receiver should forward the update
        await expect(riskStewardReceiver.processUpdate(1))
          .to.emit(riskStewardReceiver, "UpdateSentToDestination")
          .withArgs(1, ETHEREUM_LZV2_CHAIN_ID, "borrowCap", mockCoreVToken.address);

        // do not touch local caps (can be improved by deploying a diffrent vToken for remote updates)
        expect(await mockCoreComptroller.borrowCaps(mockCoreVToken.address)).to.equal(parseUnits("8", 18));

        // Destination receiver should have the bridged update registered
        const destUpdate = await destinationRiskStewardReceiver.getRegisteredUpdate(
          "borrowCap",
          mockCoreVToken.address,
        );
        expect(destUpdate.update.updateId).to.equal(1);

        // Move time forward on destination past the remote delay
        await time.increase(SIX_HOURS + 1);

        await expect(destinationRiskStewardReceiver.connect(executor).executeUpdate(1))
          .to.emit(destinationMarketCapsRiskSteward, "BorrowCapUpdated")
          .withArgs(1, mockCoreVToken.address, parseUnits("12", 18));

        // After destination execution, caps should reflect the new remote value
        expect(await mockCoreComptroller.borrowCaps(mockCoreVToken.address)).to.equal(parseUnits("12", 18));
      });

      it("should send remote CollateralFactors update for isolated market to destination chain", async function () {
        // Set initial collateral factors for isolated market
        await mockComptroller.setCollateralFactor(mockVToken.address, parseUnits("0.5", 18), parseUnits("0.6", 18));

        const newCF = parseUnits("0.6", 18);
        const newLT = parseUnits("0.7", 18);

        await riskOracle.publishRiskParameterUpdate(
          "ipfs://QmCollateralFactorsRemoteIsolated",
          encodeCollateralFactors(0.6, 0.7),
          "collateralFactors",
          mockVToken.address,
          0,
          ETHEREUM_LZV2_CHAIN_ID,
          "0x",
        );

        await expect(riskStewardReceiver.processUpdate(1))
          .to.emit(riskStewardReceiver, "UpdateSentToDestination")
          .withArgs(1, ETHEREUM_LZV2_CHAIN_ID, "collateralFactors", mockVToken.address);

        // Local values remain unchanged on the origin chain
        const localMarketInfo = await mockComptroller.markets(mockVToken.address);
        expect(localMarketInfo.collateralFactorMantissa).to.equal(parseUnits("0.5", 18));
        expect(localMarketInfo.liquidationThresholdMantissa).to.equal(parseUnits("0.6", 18));

        // Destination receiver should have the bridged update registered
        const destUpdate = await destinationRiskStewardReceiver.getRegisteredUpdate(
          "collateralFactors",
          mockVToken.address,
        );
        expect(destUpdate.update.updateId).to.equal(1);

        // Move time forward on destination past the remote delay
        await time.increase(SIX_HOURS + 1);

        await expect(destinationRiskStewardReceiver.connect(executor).executeUpdate(1))
          .to.emit(destinationCollateralFactorsRiskSteward, "CollateralFactorsUpdated")
          .withArgs(1, mockVToken.address, newCF, newLT);

        const destMarketInfo = await mockComptroller.markets(mockVToken.address);
        expect(destMarketInfo.collateralFactorMantissa).to.equal(newCF);
        expect(destMarketInfo.liquidationThresholdMantissa).to.equal(newLT);
      });

      it("should send remote IRM update for core pool market to destination chain", async function () {
        // Create a mock IRM address
        const newIRM = (await ethers.getSigners())[12].address;

        // Encode the IRM address (32 bytes as expected by IRMRiskSteward)
        const encodedIRM = ethers.utils.defaultAbiCoder.encode(["address"], [newIRM]);

        expect(await mockCoreVToken.interestRateModel()).to.equal(ethers.constants.AddressZero);

        await riskOracle.publishRiskParameterUpdate(
          "ipfs://QmIRMRemoteUpdate",
          encodedIRM,
          "interestRateModel",
          mockCoreVToken.address,
          0,
          ETHEREUM_LZV2_CHAIN_ID,
          "0x",
        );

        await expect(riskStewardReceiver.processUpdate(1))
          .to.emit(riskStewardReceiver, "UpdateSentToDestination")
          .withArgs(1, ETHEREUM_LZV2_CHAIN_ID, "interestRateModel", mockCoreVToken.address);

        // Local IRM remains unchanged on the origin chain
        expect(await mockCoreVToken.interestRateModel()).to.equal(ethers.constants.AddressZero);

        // Destination receiver should have the bridged update registered
        const destUpdate = await destinationRiskStewardReceiver.getRegisteredUpdate(
          "interestRateModel",
          mockCoreVToken.address,
        );
        expect(destUpdate.update.updateId).to.equal(1);

        // Move time forward on destination past the remote delay
        await time.increase(SIX_HOURS + 1);

        await expect(destinationRiskStewardReceiver.connect(executor).executeUpdate(1))
          .to.emit(destinationIRMRiskSteward, "InterestRateModelUpdated")
          .withArgs(1, mockCoreVToken.address, newIRM);

        // After destination execution, IRM should reflect the new remote value
        expect(await mockCoreVToken.interestRateModel()).to.equal(newIRM);
      });
    });

    describe("failure cases", async function () {
      it("should revert when processing an update with inactive config", async function () {
        await riskOracle.publishRiskParameterUpdate(
          "ipfs://QmInactiveConfig",
          parseUnitsToHex(10),
          "supplyCap",
          mockCoreVToken.address,
          0,
          0,
          "0x",
        );

        await riskStewardReceiver.setConfigActive("supplyCap", false);

        await expect(riskStewardReceiver.processUpdate(1)).to.be.revertedWithCustomError(
          riskStewardReceiver,
          "ConfigNotActive",
        );
      });

      it("should revert when processing an already resolved update", async function () {
        await riskOracle.publishRiskParameterUpdate(
          "ipfs://QmAlreadyResolved",
          parseUnitsToHex(10),
          "supplyCap",
          mockCoreVToken.address,
          0,
          0,
          "0x",
        );

        await riskStewardReceiver.processUpdate(1);

        await expect(riskStewardReceiver.processUpdate(1)).to.be.revertedWithCustomError(
          riskStewardReceiver,
          "UpdateAlreadyResolved",
        );
      });

      it("should revert when processing an expired update", async function () {
        await riskOracle.publishRiskParameterUpdate(
          "ipfs://QmExpired",
          parseUnitsToHex(10),
          "supplyCap",
          mockCoreVToken.address,
          0,
          0,
          "0x",
        );

        await time.increase(DAY_AND_ONE_SECOND * 2);

        await expect(riskStewardReceiver.processUpdate(1)).to.be.revertedWithCustomError(
          riskStewardReceiver,
          "UpdateIsExpired",
        );
      });

      it("should revert when processing an update that is not the latest for the market and type", async function () {
        await riskOracle.publishRiskParameterUpdate(
          "ipfs://QmFirstUpdate",
          parseUnitsToHex(10),
          "supplyCap",
          mockCoreVToken.address,
          0,
          0,
          "0x",
        );

        await riskOracle.publishRiskParameterUpdate(
          "ipfs://QmSecondUpdate",
          parseUnitsToHex(12),
          "supplyCap",
          mockCoreVToken.address,
          0,
          0,
          "0x",
        );

        await expect(riskStewardReceiver.processUpdate(1)).to.be.revertedWithCustomError(
          riskStewardReceiver,
          "UpdateIsExpired",
        );
      });

      it("should revert when processing an update too frequently (debounce not passed)", async function () {
        await riskOracle.publishRiskParameterUpdate(
          "ipfs://QmFirstDebounce",
          parseUnitsToHex(10),
          "supplyCap",
          mockCoreVToken.address,
          0,
          0,
          "0x",
        );

        await riskStewardReceiver.processUpdate(1);

        await riskOracle.publishRiskParameterUpdate(
          "ipfs://QmSecondDebounce",
          parseUnitsToHex(11),
          "supplyCap",
          mockCoreVToken.address,
          0,
          0,
          "0x",
        );

        await expect(riskStewardReceiver.processUpdate(2)).to.be.revertedWithCustomError(
          riskStewardReceiver,
          "UpdateTooFrequent",
        );
      });

      it("should revert when processing an update when there is a pending registered update of the same type", async function () {
        await riskOracle.publishRiskParameterUpdate(
          "ipfs://QmPendingUpdate",
          parseUnitsToHex(3),
          "borrowCap",
          mockCoreVToken.address,
          0,
          0,
          "0x",
        );

        await riskStewardReceiver.processUpdate(1);

        await riskOracle.publishRiskParameterUpdate(
          "ipfs://QmOverlappingUpdate",
          parseUnitsToHex(4),
          "borrowCap",
          mockCoreVToken.address,
          0,
          0,
          "0x",
        );

        await expect(riskStewardReceiver.processUpdate(2)).to.be.revertedWithCustomError(
          riskStewardReceiver,
          "RegisteredUpdateTypeExist",
        );
      });

      it("should revert when processing an update that will expire before the timelock unlocks", async function () {
        // Set a timelock that's close to UPDATE_EXPIRATION_TIME (2 days = 172800 seconds)
        const nearMaxTimelock = 172799; // Just under 2 days

        await riskStewardReceiver.setRiskParameterConfig(
          "supplyCap",
          marketCapsRiskSteward.address,
          DAY_AND_ONE_SECOND,
          nearMaxTimelock,
        );

        await riskOracle.publishRiskParameterUpdate(
          "ipfs://QmWillExpireBeforeUnlock",
          parseUnitsToHex(10),
          "supplyCap",
          mockCoreVToken.address,
          0,
          0,
          "0x",
        );

        // Advance time so that the update will expire before timelock unlocks
        await time.increase(2);

        await expect(riskStewardReceiver.processUpdate(1)).to.be.revertedWithCustomError(
          riskStewardReceiver,
          "UpdateWillExpireBeforeUnlock",
        );
      });

      it("should revert when processing remote update with unsupported update type on destination", async function () {
        await riskOracle.publishRiskParameterUpdate(
          "ipfs://QmUnsupportedRemote",
          parseUnitsToHex(12),
          "supplyCap", // not consigured in theh fixture
          mockCoreVToken.address,
          0,
          ETHEREUM_LZV2_CHAIN_ID,
          "0x",
        );

        await riskStewardReceiver.processUpdate(1);

        const destUpdate = await destinationRiskStewardReceiver.getRegisteredUpdate(
          "supplyCap",
          mockCoreVToken.address,
        );
        expect(destUpdate.update.updateId).to.equal(1);

        await time.increase(SIX_HOURS + 1);

        await expect(destinationRiskStewardReceiver.connect(executor).executeUpdate(1)).to.be.revertedWithCustomError(
          destinationRiskStewardReceiver,
          "ConfigNotActive",
        );
      });
    });

    describe("failure cases for executing registered updates", async function () {
      it("should revert when trying to execute update before timelock expires", async function () {
        await riskOracle.publishRiskParameterUpdate(
          "ipfs://QmBeforeTimelock",
          parseUnitsToHex(3),
          "borrowCap",
          mockCoreVToken.address,
          0,
          0,
          "0x",
        );

        await riskStewardReceiver.processUpdate(1);

        await expect(riskStewardReceiver.connect(executor).executeRegisteredUpdate(1)).to.be.revertedWithCustomError(
          riskStewardReceiver,
          "UpdateNotUnlocked",
        );
      });

      it("should revert when trying to execute an already executed update", async function () {
        await riskOracle.publishRiskParameterUpdate(
          "ipfs://QmAlreadyExecuted",
          parseUnitsToHex(3),
          "borrowCap",
          mockCoreVToken.address,
          0,
          0,
          "0x",
        );

        await riskStewardReceiver.processUpdate(1);
        await time.increase(SIX_HOURS + 1);
        await riskStewardReceiver.connect(executor).executeRegisteredUpdate(1);

        await expect(riskStewardReceiver.connect(executor).executeRegisteredUpdate(1)).to.be.revertedWithCustomError(
          riskStewardReceiver,
          "UpdateAlreadyResolved",
        );
      });

      it("should revert when trying to execute an expired registered update", async function () {
        await riskOracle.publishRiskParameterUpdate(
          "ipfs://QmExpiredRegistered",
          parseUnitsToHex(3),
          "borrowCap",
          mockCoreVToken.address,
          0,
          0,
          "0x",
        );

        await riskStewardReceiver.processUpdate(1);
        await time.increase(DAY_AND_ONE_SECOND * 2);

        await expect(riskStewardReceiver.connect(executor).executeRegisteredUpdate(1)).to.be.revertedWithCustomError(
          riskStewardReceiver,
          "UpdateIsExpired",
        );
      });

      it("should revert when trying to execute update with inactive config", async function () {
        await riskOracle.publishRiskParameterUpdate(
          "ipfs://QmInactiveConfigExecute",
          parseUnitsToHex(3),
          "borrowCap",
          mockCoreVToken.address,
          0,
          0,
          "0x",
        );

        await riskStewardReceiver.processUpdate(1);

        await riskStewardReceiver.setConfigActive("borrowCap", false);

        await time.increase(SIX_HOURS + 1);

        await expect(riskStewardReceiver.connect(executor).executeRegisteredUpdate(1)).to.be.revertedWithCustomError(
          riskStewardReceiver,
          "ConfigNotActive",
        );
      });

      it("should revert when non-executor tries to execute registered update", async function () {
        await riskOracle.publishRiskParameterUpdate(
          "ipfs://QmNonExecutorExecute",
          parseUnitsToHex(3),
          "borrowCap",
          mockCoreVToken.address,
          0,
          0,
          "0x",
        );

        await riskStewardReceiver.processUpdate(1);
        await time.increase(SIX_HOURS + 1);

        await expect(
          riskStewardReceiver.connect(unauthorizedSigner).executeRegisteredUpdate(1),
        ).to.be.revertedWithCustomError(riskStewardReceiver, "NotAnExecutor");
      });

      it("should revert when trying to execute update that was never registered", async function () {
        await riskOracle.publishRiskParameterUpdate(
          "ipfs://QmNeverRegistered",
          parseUnitsToHex(10),
          "supplyCap",
          mockCoreVToken.address,
          0,
          0,
          "0x",
        );

        await expect(riskStewardReceiver.connect(executor).executeRegisteredUpdate(1)).to.be.revertedWithCustomError(
          riskStewardReceiver,
          "InvalidRegisteredUpdate",
        );
      });

      it("should revert when trying to execute a rejected update", async function () {
        await riskOracle.publishRiskParameterUpdate(
          "ipfs://QmRejectedUpdate",
          parseUnitsToHex(3),
          "borrowCap",
          mockCoreVToken.address,
          0,
          0,
          "0x",
        );

        await riskStewardReceiver.processUpdate(1);

        await riskStewardReceiver.connect(executor).rejectUpdate(1);
        await time.increase(SIX_HOURS + 1);

        await expect(riskStewardReceiver.connect(executor).executeRegisteredUpdate(1)).to.be.revertedWithCustomError(
          riskStewardReceiver,
          "UpdateAlreadyResolved",
        );
      });
    });

    describe("reject update", async function () {
      it("should successfully reject a registered update in RSR", async function () {
        await riskOracle.publishRiskParameterUpdate(
          "ipfs://QmRejectTest",
          parseUnitsToHex(3),
          "borrowCap",
          mockCoreVToken.address,
          0,
          0,
          "0x",
        );

        await riskStewardReceiver.processUpdate(1);

        await expect(riskStewardReceiver.connect(executor).rejectUpdate(1))
          .to.emit(riskStewardReceiver, "UpdateRejected")
          .withArgs(1);

        const update = await riskStewardReceiver.updates(1);
        expect(update.status).to.equal(3); // UpdateStatus.Rejected
      });

      it("should revert when non-executor tries to reject update in RSR", async function () {
        await riskOracle.publishRiskParameterUpdate(
          "ipfs://QmRejectNonExecutor",
          parseUnitsToHex(3),
          "borrowCap",
          mockCoreVToken.address,
          0,
          0,
          "0x",
        );

        await riskStewardReceiver.processUpdate(1);

        await expect(riskStewardReceiver.connect(unauthorizedSigner).rejectUpdate(1)).to.be.revertedWithCustomError(
          riskStewardReceiver,
          "NotAnExecutor",
        );
      });

      it("should revert when trying to reject an already executed update in RSR", async function () {
        await riskOracle.publishRiskParameterUpdate(
          "ipfs://QmRejectExecuted",
          parseUnitsToHex(3),
          "borrowCap",
          mockCoreVToken.address,
          0,
          0,
          "0x",
        );

        await riskStewardReceiver.processUpdate(1);
        await time.increase(SIX_HOURS + 1);
        await riskStewardReceiver.connect(executor).executeRegisteredUpdate(1);

        await expect(riskStewardReceiver.connect(executor).rejectUpdate(1)).to.be.revertedWithCustomError(
          riskStewardReceiver,
          "UpdateAlreadyResolved",
        );
      });
    });

    describe("failure cases at destination receiver", async function () {
      it("should revert when non-executor tries to execute update on destination", async function () {
        await riskOracle.publishRiskParameterUpdate(
          "ipfs://QmDestNonExecutor",
          parseUnitsToHex(12),
          "borrowCap",
          mockCoreVToken.address,
          0,
          ETHEREUM_LZV2_CHAIN_ID,
          "0x",
        );

        await riskStewardReceiver.processUpdate(1);

        const destUpdate = await destinationRiskStewardReceiver.getRegisteredUpdate(
          "borrowCap",
          mockCoreVToken.address,
        );
        expect(destUpdate.update.updateId).to.equal(1);

        await time.increase(SIX_HOURS + 1);

        await expect(
          destinationRiskStewardReceiver.connect(unauthorizedSigner).executeUpdate(1),
        ).to.be.revertedWithCustomError(destinationRiskStewardReceiver, "NotAnExecutor");
      });

      it("should revert when trying to execute update with unconfigured update type on destination", async function () {
        await riskOracle.publishRiskParameterUpdate(
          "ipfs://QmDestUnconfigured",
          parseUnitsToHex(10),
          "supplyCap", // not configured for remote
          mockCoreVToken.address,
          0,
          ETHEREUM_LZV2_CHAIN_ID,
          "0x",
        );

        await riskStewardReceiver.processUpdate(1);

        const destUpdate = await destinationRiskStewardReceiver.getRegisteredUpdate(
          "supplyCap",
          mockCoreVToken.address,
        );
        expect(destUpdate.update.updateId).to.equal(1);

        await time.increase(SIX_HOURS + 1);

        await expect(destinationRiskStewardReceiver.connect(executor).executeUpdate(1)).to.be.revertedWithCustomError(
          destinationRiskStewardReceiver,
          "ConfigNotActive",
        );
      });

      it("should revert when trying to execute update that doesn't exist on destination", async function () {
        await expect(destinationRiskStewardReceiver.connect(executor).executeUpdate(999)).to.be.revertedWithCustomError(
          destinationRiskStewardReceiver,
          "ConfigNotActive",
        ); //reverts early
      });

      it("should revert when trying to execute update before remote delay expires", async function () {
        await riskOracle.publishRiskParameterUpdate(
          "ipfs://QmDestBeforeDelay",
          parseUnitsToHex(12),
          "borrowCap",
          mockCoreVToken.address,
          0,
          ETHEREUM_LZV2_CHAIN_ID,
          "0x",
        );

        await riskStewardReceiver.processUpdate(1);

        const destUpdate = await destinationRiskStewardReceiver.getRegisteredUpdate(
          "borrowCap",
          mockCoreVToken.address,
        );
        expect(destUpdate.update.updateId).to.equal(1);

        await expect(destinationRiskStewardReceiver.connect(executor).executeUpdate(1)).to.be.revertedWithCustomError(
          destinationRiskStewardReceiver,
          "UpdateNotUnlocked",
        );
      });

      it("should revert when trying to execute expired update on destination", async function () {
        await riskOracle.publishRiskParameterUpdate(
          "ipfs://QmDestExpired",
          parseUnitsToHex(12),
          "borrowCap",
          mockCoreVToken.address,
          0,
          ETHEREUM_LZV2_CHAIN_ID,
          "0x",
        );

        await riskStewardReceiver.processUpdate(1);

        const destUpdate = await destinationRiskStewardReceiver.getRegisteredUpdate(
          "borrowCap",
          mockCoreVToken.address,
        );
        expect(destUpdate.update.updateId).to.equal(1);

        await time.increase(DAY_AND_ONE_SECOND * 3);

        await expect(destinationRiskStewardReceiver.connect(executor).executeUpdate(1)).to.be.revertedWithCustomError(
          destinationRiskStewardReceiver,
          "UpdateIsExpired",
        );
      });

      it("should revert when trying to execute update too frequently on destination (debounce)", async function () {
        await riskStewardReceiver.setRiskParameterConfig(
          "borrowCap",
          marketCapsRiskSteward.address,
          SIX_HOURS,
          SIX_HOURS,
        );

        await riskOracle.publishRiskParameterUpdate(
          "ipfs://QmDestFirstDebounce",
          parseUnitsToHex(12),
          "borrowCap",
          mockCoreVToken.address,
          0,
          ETHEREUM_LZV2_CHAIN_ID,
          "0x",
        );

        await riskStewardReceiver.processUpdate(1);

        const destUpdate1 = await destinationRiskStewardReceiver.getRegisteredUpdate(
          "borrowCap",
          mockCoreVToken.address,
        );
        expect(destUpdate1.update.updateId).to.equal(1);

        await time.increase(SIX_HOURS + 1);
        await destinationRiskStewardReceiver.connect(executor).executeUpdate(1);

        await riskOracle.publishRiskParameterUpdate(
          "ipfs://QmDestSecondDebounce",
          parseUnitsToHex(13),
          "borrowCap",
          mockCoreVToken.address,
          0,
          ETHEREUM_LZV2_CHAIN_ID,
          "0x",
        );

        await time.increase(2);
        await riskStewardReceiver.processUpdate(2);

        const destUpdate2 = await destinationRiskStewardReceiver.getRegisteredUpdate(
          "borrowCap",
          mockCoreVToken.address,
        );
        expect(destUpdate2.update.updateId).to.equal(2);

        await time.increase(SIX_HOURS + 1);

        await expect(destinationRiskStewardReceiver.connect(executor).executeUpdate(2)).to.be.revertedWithCustomError(
          destinationRiskStewardReceiver,
          "UpdateTooFrequent",
        );
      });

      it("should revert when trying to execute already executed update on destination", async function () {
        await riskOracle.publishRiskParameterUpdate(
          "ipfs://QmDestAlreadyExecuted",
          parseUnitsToHex(12),
          "borrowCap",
          mockCoreVToken.address,
          0,
          ETHEREUM_LZV2_CHAIN_ID,
          "0x",
        );

        await riskStewardReceiver.processUpdate(1);

        const destUpdate = await destinationRiskStewardReceiver.getRegisteredUpdate(
          "borrowCap",
          mockCoreVToken.address,
        );
        expect(destUpdate.update.updateId).to.equal(1);

        await time.increase(SIX_HOURS + 1);
        await destinationRiskStewardReceiver.connect(executor).executeUpdate(1);

        await expect(destinationRiskStewardReceiver.connect(executor).executeUpdate(1)).to.be.revertedWithCustomError(
          destinationRiskStewardReceiver,
          "UpdateNotFound",
        );
      });
    });

    describe("reject update at destination receiver", async function () {
      it("should successfully reject a registered update on destination", async function () {
        await riskOracle.publishRiskParameterUpdate(
          "ipfs://QmDestRejectTest",
          parseUnitsToHex(12),
          "borrowCap",
          mockCoreVToken.address,
          0,
          ETHEREUM_LZV2_CHAIN_ID,
          "0x",
        );

        await riskStewardReceiver.processUpdate(1);

        const destUpdate = await destinationRiskStewardReceiver.getRegisteredUpdate(
          "borrowCap",
          mockCoreVToken.address,
        );
        expect(destUpdate.update.updateId).to.equal(1);

        await expect(destinationRiskStewardReceiver.connect(executor).rejectUpdate(1))
          .to.emit(destinationRiskStewardReceiver, "UpdateRejected")
          .withArgs(1);

        const rejectedUpdate = await destinationRiskStewardReceiver.getRegisteredUpdate(
          "borrowCap",
          mockCoreVToken.address,
        );
        expect(rejectedUpdate.status).to.equal(3); // UpdateStatus.Rejected
      });

      it("should revert when non-executor tries to reject update on destination", async function () {
        await riskOracle.publishRiskParameterUpdate(
          "ipfs://QmDestRejectNonExecutor",
          parseUnitsToHex(12),
          "borrowCap",
          mockCoreVToken.address,
          0,
          ETHEREUM_LZV2_CHAIN_ID,
          "0x",
        );

        await riskStewardReceiver.processUpdate(1);

        await expect(
          destinationRiskStewardReceiver.connect(unauthorizedSigner).rejectUpdate(1),
        ).to.be.revertedWithCustomError(destinationRiskStewardReceiver, "NotAnExecutor");
      });

      it("should revert when trying to reject an already executed update on destination", async function () {
        await riskOracle.publishRiskParameterUpdate(
          "ipfs://QmDestRejectExecuted",
          parseUnitsToHex(12),
          "borrowCap",
          mockCoreVToken.address,
          0,
          ETHEREUM_LZV2_CHAIN_ID,
          "0x",
        );

        await riskStewardReceiver.processUpdate(1);

        await time.increase(SIX_HOURS + 1);
        await destinationRiskStewardReceiver.connect(executor).executeUpdate(1);

        await expect(destinationRiskStewardReceiver.connect(executor).rejectUpdate(1)).to.be.revertedWithCustomError(
          destinationRiskStewardReceiver,
          "UpdateNotFound",
        );
      });

      it("should prevent execution after rejecting an update on destination", async function () {
        await riskOracle.publishRiskParameterUpdate(
          "ipfs://QmDestRejectThenExecute",
          parseUnitsToHex(12),
          "borrowCap",
          mockCoreVToken.address,
          0,
          ETHEREUM_LZV2_CHAIN_ID,
          "0x",
        );

        await riskStewardReceiver.processUpdate(1);

        await destinationRiskStewardReceiver.connect(executor).rejectUpdate(1);

        await time.increase(SIX_HOURS + 1);

        await expect(destinationRiskStewardReceiver.connect(executor).executeUpdate(1)).to.be.revertedWithCustomError(
          destinationRiskStewardReceiver,
          "UpdateNotFound",
        );
      });

      it("should revert when executing update with inactive config on destination", async function () {
        await destinationRiskStewardReceiver.setConfigActive("borrowCap", false);

        await riskOracle.publishRiskParameterUpdate(
          "ipfs://QmDestInactiveConfig",
          parseUnitsToHex(12),
          "borrowCap",
          mockCoreVToken.address,
          0,
          ETHEREUM_LZV2_CHAIN_ID,
          "0x",
        );

        await riskStewardReceiver.processUpdate(1);

        // Move time forward past remote delay
        await time.increase(SIX_HOURS + 1);

        await expect(destinationRiskStewardReceiver.connect(executor).executeUpdate(1)).to.be.revertedWithCustomError(
          destinationRiskStewardReceiver,
          "ConfigNotActive",
        );
      });
    });

    describe("getExecutableUpdates", async function () {
      describe("RiskStewardReceiver", async function () {
        it("should return executable updates excluding rejected ones", async function () {
          // Create additional markets
          const mockCoreVToken2 = await (
            await ethers.getContractFactory("MockVToken")
          ).deploy(mockCoreComptroller.address);
          const mockCoreVToken3 = await (
            await ethers.getContractFactory("MockVToken")
          ).deploy(mockCoreComptroller.address);
          const mockCoreVToken4 = await (
            await ethers.getContractFactory("MockVToken")
          ).deploy(mockCoreComptroller.address);

          await mockCoreComptroller.supportMarket(mockCoreVToken2.address);
          await mockCoreComptroller.supportMarket(mockCoreVToken3.address);
          await mockCoreComptroller.supportMarket(mockCoreVToken4.address);
          await mockCoreComptroller.setMarketBorrowCaps(
            [mockCoreVToken2.address, mockCoreVToken3.address, mockCoreVToken4.address],
            [parseUnits("8", 18), parseUnits("8", 18), parseUnits("8", 18)],
          );

          // Register 4 updates for different markets (large changes to trigger registration)
          await riskOracle.publishRiskParameterUpdate(
            "ipfs://QmUpdate1",
            parseUnitsToHex(13),
            "borrowCap",
            mockCoreVToken.address,
            0,
            0,
            "0x",
          );
          await riskOracle.publishRiskParameterUpdate(
            "ipfs://QmUpdate2",
            parseUnitsToHex(14),
            "borrowCap",
            mockCoreVToken2.address,
            0,
            0,
            "0x",
          );
          await riskOracle.publishRiskParameterUpdate(
            "ipfs://QmUpdate3",
            parseUnitsToHex(15),
            "borrowCap",
            mockCoreVToken3.address,
            0,
            0,
            "0x",
          );
          await riskOracle.publishRiskParameterUpdate(
            "ipfs://QmUpdate4",
            parseUnitsToHex(16),
            "borrowCap",
            mockCoreVToken4.address,
            0,
            0,
            "0x",
          );

          await riskStewardReceiver.processUpdate(1);
          await riskStewardReceiver.processUpdate(2);
          await riskStewardReceiver.processUpdate(3);
          await riskStewardReceiver.processUpdate(4);

          // Before timelock expires, should return empty
          let executableUpdates = await riskStewardReceiver.getExecutableUpdates(
            "borrowCap",
            mockCoreComptroller.address,
          );
          expect(executableUpdates).to.be.an("array").that.is.empty;

          // Reject one update (update 2) before time elapses
          await riskStewardReceiver.connect(executor).rejectUpdate(2);

          // Move time forward past timelock
          await time.increase(SIX_HOURS + 1);

          // Get executable updates - should not include the rejected one
          executableUpdates = await riskStewardReceiver.getExecutableUpdates("borrowCap", mockCoreComptroller.address);
          expect(executableUpdates).to.have.lengthOf(3);
          const updateIds = executableUpdates.map((id: any) => id.toNumber());
          expect(updateIds).to.include.members([1, 3, 4]);
          expect(updateIds).to.not.include(2);
        });
      });

      describe("DestinationStewardReceiver", async function () {
        it("should return executable updates excluding rejected ones", async function () {
          // Create additional markets
          const mockCoreVToken2 = await (
            await ethers.getContractFactory("MockVToken")
          ).deploy(mockCoreComptroller.address);
          const mockCoreVToken3 = await (
            await ethers.getContractFactory("MockVToken")
          ).deploy(mockCoreComptroller.address);
          const mockCoreVToken4 = await (
            await ethers.getContractFactory("MockVToken")
          ).deploy(mockCoreComptroller.address);

          await mockCoreComptroller.supportMarket(mockCoreVToken2.address);
          await mockCoreComptroller.supportMarket(mockCoreVToken3.address);
          await mockCoreComptroller.supportMarket(mockCoreVToken4.address);
          await mockCoreComptroller.setMarketBorrowCaps(
            [mockCoreVToken2.address, mockCoreVToken3.address, mockCoreVToken4.address],
            [parseUnits("8", 18), parseUnits("8", 18), parseUnits("8", 18)],
          );

          // Register 4 remote updates for different markets
          await riskOracle.publishRiskParameterUpdate(
            "ipfs://QmDestUpdate1",
            parseUnitsToHex(12),
            "borrowCap",
            mockCoreVToken.address,
            0,
            ETHEREUM_LZV2_CHAIN_ID,
            "0x",
          );
          await riskOracle.publishRiskParameterUpdate(
            "ipfs://QmDestUpdate2",
            parseUnitsToHex(13),
            "borrowCap",
            mockCoreVToken2.address,
            0,
            ETHEREUM_LZV2_CHAIN_ID,
            "0x",
          );
          await riskOracle.publishRiskParameterUpdate(
            "ipfs://QmDestUpdate3",
            parseUnitsToHex(14),
            "borrowCap",
            mockCoreVToken3.address,
            0,
            ETHEREUM_LZV2_CHAIN_ID,
            "0x",
          );
          await riskOracle.publishRiskParameterUpdate(
            "ipfs://QmDestUpdate4",
            parseUnitsToHex(15),
            "borrowCap",
            mockCoreVToken4.address,
            0,
            ETHEREUM_LZV2_CHAIN_ID,
            "0x",
          );

          await riskStewardReceiver.processUpdate(1);
          await riskStewardReceiver.processUpdate(2);
          await riskStewardReceiver.processUpdate(3);
          await riskStewardReceiver.processUpdate(4);

          // Before remote delay expires, should return empty
          let executableUpdates = await destinationRiskStewardReceiver.getExecutableUpdates(
            "borrowCap",
            mockCoreComptroller.address,
          );
          expect(executableUpdates).to.be.an("array").that.is.empty;

          // Reject one update (update 2) before time elapses
          await destinationRiskStewardReceiver.connect(executor).rejectUpdate(2);

          // Move time forward past remote delay
          await time.increase(SIX_HOURS + 1);

          // Get executable updates - should not include the rejected one
          executableUpdates = await destinationRiskStewardReceiver.getExecutableUpdates(
            "borrowCap",
            mockCoreComptroller.address,
          );
          expect(executableUpdates).to.have.lengthOf(3);
          const updateIds = executableUpdates.map((id: any) => id.toNumber());
          expect(updateIds).to.include.members([1, 3, 4]);
          expect(updateIds).to.not.include(2);
        });
      });
    });
  });
});
