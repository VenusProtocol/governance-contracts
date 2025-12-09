import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { BigNumber } from "ethers";
import { parseUnits } from "ethers/lib/utils";
import { ethers, upgrades } from "hardhat";

import {
  AccessControlManager__factory,
  CollateralFactorsRiskSteward,
  ICorePoolComptroller,
  ICorePoolComptroller__factory,
  ICorePoolVToken,
  ICorePoolVToken__factory,
  IIsolatedPoolVToken,
  IIsolatedPoolVToken__factory,
  IIsolatedPoolsComptroller,
  IIsolatedPoolsComptroller__factory,
  IRMRiskSteward,
  MarketCapsRiskSteward,
  RiskOracle,
  RiskStewardReceiver,
} from "../../typechain";
import { forking, initMainnetUser } from "./utils";

const FORK_MAINNET = process.env.FORKED_NETWORK === "bscmainnet";

const ACM = "0x4788629abc6cfca10f9f969efdeaa1cf70c23555";
const NORMAL_TIMELOCK = "0x939bD8d64c0A9583A7Dcea9933f7b21697ab6396";
const CORE_COMPTROLLER_ADDRESS = "0xfD36E2c2a6789Db23113685031d7F16329158384";
const vCAKE_CORE = "0x86aC3974e2BD0d60825230fa6F355fF11409df5c";
const vDAI_CORE = "0x334b3eCB4DCa3593BCCC3c7EBD1A1C1d1780FBF1";
const vWBNB_CORE = "0x6bCa74586218dB34cdB402295796b79663d816e9";

const DEFI_COMPTROLLER_ADDRESS = "0x3344417c9360b963ca93A4e8305361AEde340Ab9";
const vUSDT_DeFI = "0x1D8bBDE12B6b34140604E18e9f9c6e14deC16854";
const vBSW_Defi = "0x8f657dFD3a1354DEB4545765fE6840cc54AFd379";

const bigNumberToHex = (value: BigNumber) => {
  return ethers.utils.hexZeroPad(ethers.utils.hexValue(value), 32);
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

const setupACMPermissions = async (
  accessControlManager: any,
  timelock: any,
  riskOracle: RiskOracle,
  riskStewardReceiver: RiskStewardReceiver,
  marketCapsRiskSteward: MarketCapsRiskSteward,
  collateralFactorsRiskSteward: CollateralFactorsRiskSteward,
  irmRiskSteward: IRMRiskSteward,
) => {
  await accessControlManager.giveCallPermission(riskOracle.address, "addAuthorizedSender(address)", timelock.address);
  await accessControlManager.giveCallPermission(riskOracle.address, "addUpdateType(string)", timelock.address);
  await accessControlManager.giveCallPermission(
    riskStewardReceiver.address,
    "setRiskParameterConfig(string,address,uint256,uint256)",
    timelock.address,
  );
  await accessControlManager.giveCallPermission(
    riskStewardReceiver.address,
    "setWhitelistedExecutor(address,bool)",
    timelock.address,
  );
  await accessControlManager.giveCallPermission(
    CORE_COMPTROLLER_ADDRESS,
    "_setMarketSupplyCaps(address[],uint256[])",
    marketCapsRiskSteward.address,
  );
  await accessControlManager.giveCallPermission(
    CORE_COMPTROLLER_ADDRESS,
    "_setMarketBorrowCaps(address[],uint256[])",
    marketCapsRiskSteward.address,
  );
  await accessControlManager.giveCallPermission(
    CORE_COMPTROLLER_ADDRESS,
    "setCollateralFactor(uint96,address,uint256,uint256)",
    collateralFactorsRiskSteward.address,
  );
  await accessControlManager.giveCallPermission(
    DEFI_COMPTROLLER_ADDRESS,
    "setMarketBorrowCaps(address[],uint256[])",
    marketCapsRiskSteward.address,
  );
  await accessControlManager.giveCallPermission(
    DEFI_COMPTROLLER_ADDRESS,
    "setCollateralFactor(address,uint256,uint256)",
    collateralFactorsRiskSteward.address,
  );
  await accessControlManager.giveCallPermission(vDAI_CORE, "_setInterestRateModel(address)", irmRiskSteward.address);
  await accessControlManager.giveCallPermission(vUSDT_DeFI, "setInterestRateModel(address)", irmRiskSteward.address);
};

const riskStewardFixture = async () => {
  const [, updateSender, executor] = await ethers.getSigners();

  const timelock = await initMainnetUser(NORMAL_TIMELOCK, parseUnits("2"));
  const accessControlManager = AccessControlManager__factory.connect(ACM, timelock);

  // core comptroller
  const comptroller = await ICorePoolComptroller__factory.connect(CORE_COMPTROLLER_ADDRESS, timelock);

  // core markets
  const vCake_CORE = ICorePoolVToken__factory.connect(vCAKE_CORE, timelock);
  const vDai_CORE = ICorePoolVToken__factory.connect(vDAI_CORE, timelock);
  const vWbnb_CORE = ICorePoolVToken__factory.connect(vWBNB_CORE, timelock);

  // Isolated comptroller
  const comptroller_defi = await IIsolatedPoolsComptroller__factory.connect(DEFI_COMPTROLLER_ADDRESS, timelock);

  // Isolated markets
  const vUsdt_DeFI = IIsolatedPoolVToken__factory.connect(vUSDT_DeFI, timelock);
  const vBsw_Defi = IIsolatedPoolVToken__factory.connect(vBSW_Defi, timelock);

  // Deploy RiskOracle
  const RiskOracleFactory = await ethers.getContractFactory("RiskOracle");
  const riskOracle = await upgrades.deployProxy(RiskOracleFactory, [accessControlManager.address], {
    initializer: "initialize",
  });

  // Deploy LayerZero endpoint mock (simplified - we won't use it for remote updates in fork tests)
  // For fork tests, we'll use a zero address or minimal mock
  const LZ_BSC_ENDPOINT = "0x1a44076050125825900e736c501f859c50fE728c";

  // Deploy RiskStewardReceiver
  const RiskStewardReceiverFactory = await ethers.getContractFactory("RiskStewardReceiver");
  const riskStewardReceiver = await upgrades.deployProxy(
    RiskStewardReceiverFactory,
    [accessControlManager.address, timelock.address],
    {
      constructorArgs: [riskOracle.address, LZ_BSC_ENDPOINT, BSC_LZV2_CHAIN_ID],
      initializer: "initialize",
      unsafeAllow: ["state-variable-immutable"],
    },
  );

  // Deploy MarketCapsRiskSteward
  const MarketCapsRiskStewardFactory = await ethers.getContractFactory("MarketCapsRiskSteward");
  const marketCapsRiskSteward = await upgrades.deployProxy(
    MarketCapsRiskStewardFactory,
    [accessControlManager.address],
    {
      constructorArgs: [riskStewardReceiver.address],
      initializer: "initialize",
      unsafeAllow: ["state-variable-immutable"],
    },
  );

  // Deploy CollateralFactorsRiskSteward
  const CollateralFactorsRiskStewardFactory = await ethers.getContractFactory("CollateralFactorsRiskSteward");
  const collateralFactorsRiskSteward = await upgrades.deployProxy(
    CollateralFactorsRiskStewardFactory,
    [accessControlManager.address],
    {
      constructorArgs: [comptroller.address, riskStewardReceiver.address],
      initializer: "initialize",
      unsafeAllow: ["state-variable-immutable"],
    },
  );

  // Deploy IRMRiskSteward
  const IRMRiskStewardFactory = await ethers.getContractFactory("IRMRiskSteward");
  const irmRiskSteward = await upgrades.deployProxy(IRMRiskStewardFactory, [accessControlManager.address], {
    constructorArgs: [comptroller.address, riskStewardReceiver.address],
    initializer: "initialize",
    unsafeAllow: ["state-variable-immutable"],
  });

  // Set safeDeltaBps for stewards (5000 = 50%)
  const deltaBps50 = 5000;
  await accessControlManager.giveCallPermission(
    marketCapsRiskSteward.address,
    "setSafeDeltaBps(uint256)",
    timelock.address,
  );
  await accessControlManager.giveCallPermission(
    collateralFactorsRiskSteward.address,
    "setSafeDeltaBps(uint256)",
    timelock.address,
  );

  await marketCapsRiskSteward.connect(timelock).setSafeDeltaBps(deltaBps50);
  await collateralFactorsRiskSteward.connect(timelock).setSafeDeltaBps(deltaBps50);

  await setupACMPermissions(
    accessControlManager,
    timelock,
    riskOracle,
    riskStewardReceiver,
    marketCapsRiskSteward,
    collateralFactorsRiskSteward,
    irmRiskSteward,
  );

  // Add update types and authorize sender
  await riskOracle.connect(timelock).addAuthorizedSender(updateSender.address);
  await riskOracle.connect(timelock).addUpdateType("supplyCap");
  await riskOracle.connect(timelock).addUpdateType("borrowCap");
  await riskOracle.connect(timelock).addUpdateType("collateralFactors");
  await riskOracle.connect(timelock).addUpdateType("interestRateModel");

  // Configure risk steward receiver
  await riskStewardReceiver
    .connect(timelock)
    .setRiskParameterConfig("supplyCap", marketCapsRiskSteward.address, DAY_AND_ONE_SECOND, SIX_HOURS);

  await riskStewardReceiver
    .connect(timelock)
    .setRiskParameterConfig("borrowCap", marketCapsRiskSteward.address, DAY_AND_ONE_SECOND, SIX_HOURS);
  await riskStewardReceiver
    .connect(timelock)
    .setRiskParameterConfig("collateralFactors", collateralFactorsRiskSteward.address, DAY_AND_ONE_SECOND, SIX_HOURS);
  await riskStewardReceiver
    .connect(timelock)
    .setRiskParameterConfig("interestRateModel", irmRiskSteward.address, DAY_AND_ONE_SECOND, SIX_HOURS);

  // Set executor
  await riskStewardReceiver.connect(timelock).setWhitelistedExecutor(executor.address, true);

  return {
    comptroller,
    comptroller_defi,
    vCake_CORE,
    vDai_CORE,
    vWbnb_CORE,
    vUsdt_DeFI,
    vBsw_Defi,
    riskOracle,
    riskStewardReceiver,
    marketCapsRiskSteward,
    collateralFactorsRiskSteward,
    irmRiskSteward,
    timelock,
    updateSender,
    executor,
  };
};

// ---------- Main Forked Test ----------
if (FORK_MAINNET) {
  const blockNumber = 70919869;
  forking(blockNumber, () => {
    describe("Risk Steward Fork Tests", function () {
      let comptroller: ICorePoolComptroller;
      let comptroller_defi: IIsolatedPoolsComptroller;
      let vCake_CORE: ICorePoolVToken;
      let vDai_CORE: ICorePoolVToken;
      let vWbnb_CORE: ICorePoolVToken;
      let vUsdt_DeFI: IIsolatedPoolVToken;
      let vBsw_Defi: IIsolatedPoolVToken;
      let riskOracle: RiskOracle;
      let riskStewardReceiver: RiskStewardReceiver;
      let marketCapsRiskSteward: MarketCapsRiskSteward;
      let collateralFactorsRiskSteward: CollateralFactorsRiskSteward;
      let irmRiskSteward: IRMRiskSteward;
      let updateSender: any;
      let executor: any;

      beforeEach(async function () {
        ({
          comptroller,
          comptroller_defi,
          vCake_CORE,
          vDai_CORE,
          vWbnb_CORE,
          vUsdt_DeFI,
          vBsw_Defi,
          riskOracle,
          riskStewardReceiver,
          marketCapsRiskSteward,
          collateralFactorsRiskSteward,
          irmRiskSteward,
          updateSender,
          executor,
        } = await loadFixture(riskStewardFixture));
      });

      describe("supplyCap updates", async function () {
        it("should immediately execute SupplyCap increase for core pool market", async function () {
          const currentCap = await comptroller.supplyCaps(vCake_CORE.address);
          const newCap = currentCap.mul(110).div(100); // 10% increase
          const newCapHex = bigNumberToHex(newCap);

          await riskOracle
            .connect(updateSender)
            .publishRiskParameterUpdate(
              "ipfs://QmSupplyCapFork",
              newCapHex,
              "supplyCap",
              vCake_CORE.address,
              0,
              0,
              "0x",
            );

          await expect(riskStewardReceiver.processUpdate(1))
            .to.emit(marketCapsRiskSteward, "SupplyCapUpdated")
            .withArgs(1, vCake_CORE.address, newCap);

          expect(await comptroller.supplyCaps(vCake_CORE.address)).to.equal(newCap);
        });

        it("should register and then execute SupplyCap update with large change", async function () {
          const currentCap = await comptroller.supplyCaps(vDai_CORE.address);
          const newCap = currentCap.mul(40).div(100); // 40% decrease - large change
          const newCapHex = bigNumberToHex(newCap);

          await riskOracle
            .connect(updateSender)
            .publishRiskParameterUpdate(
              "ipfs://QmSupplyCapRegisteredFork",
              newCapHex,
              "supplyCap",
              vDai_CORE.address,
              0,
              0,
              "0x",
            );

          await expect(riskStewardReceiver.processUpdate(1)).to.emit(riskStewardReceiver, "UpdateRegistered");

          await time.increase(SIX_HOURS + 1);

          await expect(riskStewardReceiver.connect(executor).executeRegisteredUpdate(1))
            .to.emit(marketCapsRiskSteward, "SupplyCapUpdated")
            .withArgs(1, vDai_CORE.address, newCap);

          expect(await comptroller.supplyCaps(vDai_CORE.address)).to.equal(newCap);
        });
      });

      describe("borrowCap updates", async function () {
        it("should immediately execute BorrowCap increase for core pool market", async function () {
          const currentCap = await comptroller.borrowCaps(vWbnb_CORE.address);
          const newCap = currentCap.mul(110).div(100); // 10% increase
          const newCapHex = bigNumberToHex(newCap);

          await riskOracle
            .connect(updateSender)
            .publishRiskParameterUpdate(
              "ipfs://QmBorrowCapFork",
              newCapHex,
              "borrowCap",
              vWbnb_CORE.address,
              0,
              0,
              "0x",
            );

          await expect(riskStewardReceiver.processUpdate(1))
            .to.emit(marketCapsRiskSteward, "BorrowCapUpdated")
            .withArgs(1, vWbnb_CORE.address, newCap);

          expect(await comptroller.borrowCaps(vWbnb_CORE.address)).to.equal(newCap);
        });

        it("should register and then execute BorrowCap update with large change for isolated market", async function () {
          const currentCap = await comptroller_defi.borrowCaps(vUsdt_DeFI.address);
          const newCap = currentCap.mul(40).div(100); // 40% decrease - large change (less than 50% threshold)
          const newCapHex = bigNumberToHex(newCap);

          await riskOracle
            .connect(updateSender)
            .publishRiskParameterUpdate(
              "ipfs://QmBorrowCapIsolatedFork",
              newCapHex,
              "borrowCap",
              vUsdt_DeFI.address,
              0,
              0,
              "0x",
            );

          await expect(riskStewardReceiver.processUpdate(1)).to.emit(riskStewardReceiver, "UpdateRegistered");

          await time.increase(SIX_HOURS + 1);

          await expect(riskStewardReceiver.connect(executor).executeRegisteredUpdate(1))
            .to.emit(marketCapsRiskSteward, "BorrowCapUpdated")
            .withArgs(1, vUsdt_DeFI.address, newCap);

          expect(await comptroller_defi.borrowCaps(vUsdt_DeFI.address)).to.equal(newCap);
        });
      });

      describe("collateralFactors updates", async function () {
        it("should immediately execute CollateralFactors increase for core pool market", async function () {
          const marketInfo = await comptroller.markets(vCake_CORE.address);
          const currentCF = marketInfo.collateralFactorMantissa;
          const currentLT = marketInfo.liquidationThresholdMantissa;
          const newCF = currentCF.mul(110).div(100); // 10% increase
          const newLT = currentLT.mul(110).div(100); // 10% increase

          const newCFDecimal = Number(newCF) / 1e18;
          const newLTDecimal = Number(newLT) / 1e18;

          await riskOracle
            .connect(updateSender)
            .publishRiskParameterUpdate(
              "ipfs://QmCollateralFactorsFork",
              encodeCollateralFactors(newCFDecimal, newLTDecimal),
              "collateralFactors",
              vCake_CORE.address,
              0,
              0,
              "0x",
            );

          await expect(riskStewardReceiver.processUpdate(1))
            .to.emit(collateralFactorsRiskSteward, "CollateralFactorsUpdated")
            .withArgs(1, vCake_CORE.address, newCF, newLT);

          const updatedMarketInfo = await comptroller.markets(vCake_CORE.address);
          expect(updatedMarketInfo.collateralFactorMantissa).to.equal(newCF);
          expect(updatedMarketInfo.liquidationThresholdMantissa).to.equal(newLT);
        });

        it("should register and then execute CollateralFactors update for isolated market", async function () {
          const marketInfo = await comptroller_defi.markets(vBsw_Defi.address);
          const currentCF = marketInfo.collateralFactorMantissa;
          const currentLT = marketInfo.liquidationThresholdMantissa;
          const newCF = currentCF.mul(140).div(100); // 40% increase - large change (less than 50% threshold)
          const newLT = currentLT.mul(140).div(100); // 40% increase - large change (less than 50% threshold)

          const newCFDecimal = Number(newCF) / 1e18;
          const newLTDecimal = Number(newLT) / 1e18;

          await riskOracle
            .connect(updateSender)
            .publishRiskParameterUpdate(
              "ipfs://QmCollateralFactorsIsolatedFork",
              encodeCollateralFactors(newCFDecimal, newLTDecimal),
              "collateralFactors",
              vBsw_Defi.address,
              0,
              0,
              "0x",
            );

          await expect(riskStewardReceiver.processUpdate(1)).to.emit(riskStewardReceiver, "UpdateRegistered");

          await time.increase(SIX_HOURS + 1);

          await expect(riskStewardReceiver.connect(executor).executeRegisteredUpdate(1))
            .to.emit(collateralFactorsRiskSteward, "CollateralFactorsUpdated")
            .withArgs(1, vBsw_Defi.address, newCF, newLT);

          const updatedMarketInfo = await comptroller_defi.markets(vBsw_Defi.address);
          expect(updatedMarketInfo.collateralFactorMantissa).to.equal(newCF);
          expect(updatedMarketInfo.liquidationThresholdMantissa).to.equal(newLT);
        });
      });

      describe("interestRateModel updates", async function () {
        it("should register and then execute IRM update for core pool market", async function () {
          // Deploy a new InterestRateModel
          const WhitePaperInterestRateModelFactory = await ethers.getContractFactory("WhitePaperInterestRateModel");
          const baseRatePerYear = parseUnits("0.02", 18); // 2% base rate
          const multiplierPerYear = parseUnits("0.18", 18); // 18% multiplier

          const newIRM = await WhitePaperInterestRateModelFactory.deploy(baseRatePerYear, multiplierPerYear);

          const encodedIRM = ethers.utils.defaultAbiCoder.encode(["address"], [newIRM.address]);

          await riskOracle
            .connect(updateSender)
            .publishRiskParameterUpdate(
              "ipfs://QmIRMFork",
              encodedIRM,
              "interestRateModel",
              vDai_CORE.address,
              0,
              0,
              "0x",
            );

          await expect(riskStewardReceiver.processUpdate(1)).to.emit(riskStewardReceiver, "UpdateRegistered");

          await time.increase(SIX_HOURS + 1);

          await expect(riskStewardReceiver.connect(executor).executeRegisteredUpdate(1))
            .to.emit(irmRiskSteward, "InterestRateModelUpdated")
            .withArgs(1, vDai_CORE.address, newIRM.address);

          expect(await vDai_CORE.interestRateModel()).to.equal(newIRM.address);
        });

        it("should register and then execute IRM update for isolated market", async function () {
          // Deploy a new InterestRateModel
          const WhitePaperInterestRateModelFactory = await ethers.getContractFactory("WhitePaperInterestRateModel");
          const baseRatePerYear = parseUnits("0.02", 18); // 2% base rate
          const multiplierPerYear = parseUnits("0.18", 18); // 18% multiplier

          const newIRM = await WhitePaperInterestRateModelFactory.deploy(baseRatePerYear, multiplierPerYear);

          const encodedIRM = ethers.utils.defaultAbiCoder.encode(["address"], [newIRM.address]);

          await riskOracle
            .connect(updateSender)
            .publishRiskParameterUpdate(
              "ipfs://QmIRMIsolatedFork",
              encodedIRM,
              "interestRateModel",
              vUsdt_DeFI.address,
              0,
              0,
              "0x",
            );

          await expect(riskStewardReceiver.processUpdate(1)).to.emit(riskStewardReceiver, "UpdateRegistered");

          await time.increase(SIX_HOURS + 1);

          await expect(riskStewardReceiver.connect(executor).executeRegisteredUpdate(1))
            .to.emit(irmRiskSteward, "InterestRateModelUpdated")
            .withArgs(1, vUsdt_DeFI.address, newIRM.address);

          expect(await vUsdt_DeFI.interestRateModel()).to.equal(newIRM.address);
        });
      });
    });
  });
}
