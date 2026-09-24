import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import fs from "fs";
import { ethers, upgrades } from "hardhat";
import path from "path";

import {
  MarketCapsRiskSteward,
  MockCoreComptroller,
  MockVToken,
  RiskOracle,
  RiskStewardLens,
  RiskStewardReceiver,
} from "../../typechain";

const { parseUnits } = ethers.utils;

const parseUnitsToHex = (value: number) =>
  ethers.utils.defaultAbiCoder.encode(["uint256"], [parseUnits(value.toString(), 18)]);

const encodeCollateralFactors = (collateralFactor: number, liquidationThreshold: number) =>
  ethers.utils.defaultAbiCoder.encode(
    ["uint256", "uint256"],
    [parseUnits(collateralFactor.toString(), 18), parseUnits(liquidationThreshold.toString(), 18)],
  );

const DAY_AND_ONE_SECOND = 60 * 60 * 24 + 1;
const SIX_HOURS = 60 * 60 * 6;
const EXPIRATION_TIME = 2 * 24 * 60 * 60;

const BSC_LZV2_CHAIN_ID = 30102;
const ETHEREUM_LZV2_CHAIN_ID = 30101;

describe("RiskStewardLens", async function () {
  let riskOracle: RiskOracle,
    riskStewardReceiver: RiskStewardReceiver,
    marketCapsRiskSteward: MarketCapsRiskSteward,
    mockCoreComptroller: MockCoreComptroller,
    mockCoreVToken: MockVToken,
    lens: RiskStewardLens;

  const borrowCapArgs = (value: number, destLzEid = 0) =>
    ["ipfs://QmLens", parseUnitsToHex(value), "borrowCap", mockCoreVToken.address, 0, destLzEid, "0x"] as const;

  // One core pool market (caps 8, CF 0.5 / LT 0.6) behind the real oracle, receiver and stewards, with a 50% safe
  // delta, 6h timelock and 1 day debounce. Nothing is sent over LayerZero, so the endpoint only has to exist.
  const lensFixture = async () => {
    const [deployer] = await ethers.getSigners();

    const accessControlManager = await (await ethers.getContractFactory("AccessControlManager")).deploy();

    mockCoreComptroller = await (await ethers.getContractFactory("MockCoreComptroller")).deploy();
    mockCoreVToken = await (await ethers.getContractFactory("MockVToken")).deploy(mockCoreComptroller.address);
    await mockCoreComptroller.supportMarket(mockCoreVToken.address);
    await mockCoreComptroller.setMarketSupplyCaps([mockCoreVToken.address], [parseUnits("8", 18)]);
    await mockCoreComptroller.setMarketBorrowCaps([mockCoreVToken.address], [parseUnits("8", 18)]);
    await mockCoreComptroller.setCollateralFactor(
      0,
      mockCoreVToken.address,
      parseUnits("0.5", 18),
      parseUnits("0.6", 18),
    );

    riskOracle = await upgrades.deployProxy(
      await ethers.getContractFactory("RiskOracle"),
      [accessControlManager.address],
      { constructorArgs: [], initializer: "initialize", unsafeAllow: ["state-variable-immutable"] },
    );

    const endpointArtifact = JSON.parse(
      fs.readFileSync(
        path.join(
          __dirname,
          "../../node_modules/@layerzerolabs/test-devtools-evm-hardhat/artifacts/contracts/mocks/EndpointV2Mock.sol/EndpointV2Mock.json",
        ),
        "utf8",
      ),
    );
    const endpoint = await new ethers.ContractFactory(endpointArtifact.abi, endpointArtifact.bytecode, deployer).deploy(
      BSC_LZV2_CHAIN_ID,
    );

    riskStewardReceiver = await upgrades.deployProxy(
      await ethers.getContractFactory("RiskStewardReceiver"),
      [accessControlManager.address, deployer.address],
      {
        constructorArgs: [riskOracle.address, endpoint.address, BSC_LZV2_CHAIN_ID],
        initializer: "initialize",
        unsafeAllow: ["state-variable-immutable", "constructor"],
      },
    );

    const stewardOptions = (constructorArgs: string[]) => ({
      constructorArgs,
      initializer: "initialize",
      unsafeAllow: ["state-variable-immutable", "constructor"] as ("state-variable-immutable" | "constructor")[],
    });
    marketCapsRiskSteward = await upgrades.deployProxy(
      await ethers.getContractFactory("MarketCapsRiskSteward"),
      [accessControlManager.address],
      stewardOptions([riskStewardReceiver.address]),
    );
    const collateralFactorsRiskSteward = await upgrades.deployProxy(
      await ethers.getContractFactory("CollateralFactorsRiskSteward"),
      [accessControlManager.address],
      stewardOptions([mockCoreComptroller.address, riskStewardReceiver.address]),
    );
    const irmRiskSteward = await upgrades.deployProxy(
      await ethers.getContractFactory("IRMRiskSteward"),
      [accessControlManager.address],
      stewardOptions([mockCoreComptroller.address, riskStewardReceiver.address]),
    );

    const permissions: [string, string][] = [
      [riskOracle.address, "addAuthorizedSender(address)"],
      [riskOracle.address, "addUpdateType(string)"],
      [riskStewardReceiver.address, "setRiskParameterConfig(string,address,uint256,uint256)"],
      [riskStewardReceiver.address, "setConfigActive(string,bool)"],
      [marketCapsRiskSteward.address, "setSafeDeltaBps(uint256)"],
      [collateralFactorsRiskSteward.address, "setSafeDeltaBps(uint256)"],
    ];
    for (const [target, signature] of permissions) {
      await accessControlManager.giveCallPermission(target, signature, deployer.address);
    }

    await riskOracle.addAuthorizedSender(deployer.address);
    const stewardByType: [string, string][] = [
      ["supplyCap", marketCapsRiskSteward.address],
      ["borrowCap", marketCapsRiskSteward.address],
      ["collateralFactors", collateralFactorsRiskSteward.address],
      ["interestRateModel", irmRiskSteward.address],
    ];
    for (const [updateType, steward] of stewardByType) {
      await riskOracle.addUpdateType(updateType);
      await riskStewardReceiver.setRiskParameterConfig(updateType, steward, DAY_AND_ONE_SECOND, SIX_HOURS);
    }
    await marketCapsRiskSteward.setSafeDeltaBps(5000);
    await collateralFactorsRiskSteward.setSafeDeltaBps(5000);

    lens = await (
      await ethers.getContractFactory("RiskStewardLens")
    ).deploy(riskStewardReceiver.address, mockCoreComptroller.address);
  };

  beforeEach(async function () {
    await loadFixture(lensFixture);
  });

  it("previews a direct execution before it is proposed, then follows it once published", async function () {
    const preview = await lens.previewUpdate(...borrowCapArgs(10));
    expect(preview.updateId).to.equal(1);
    expect(preview.status).to.equal(0); // None
    expect(preview.executesDirectly).to.equal(true);
    expect(preview.unlockTime).to.be.closeTo(await time.latest(), 1);
    expect(preview.currentValues).to.deep.equal([parseUnits("8", 18)]);
    expect(preview.proposedValues).to.deep.equal([parseUnits("10", 18)]);
    expect(preview.debounceEndsAt).to.equal(0);
    expect(preview.blockingUpdateId).to.equal(0);

    await riskOracle.publishRiskParameterUpdate(...borrowCapArgs(10));
    const published = await lens.getUpdateDetails(1);
    expect(published.executesDirectly).to.equal(true);
    expect(published.expiresAt).to.equal((await riskOracle.getUpdateById(1)).timestamp.add(EXPIRATION_TIME));

    await riskStewardReceiver.processUpdate(1);
    const executed = await lens.getUpdateDetails(1);
    expect(executed.status).to.equal(2); // Executed
    expect(executed.executableNow).to.equal(false);
    expect(executed.currentValues).to.deep.equal([parseUnits("10", 18)]);

    // The next proposal is held back by debounce from the execution above
    const executedAt = (await riskStewardReceiver.updates(1)).executedAt;
    const next = await lens.previewUpdate(...borrowCapArgs(12));
    expect(next.debounceEndsAt).to.equal(executedAt.add(DAY_AND_ONE_SECOND));

    // Once the debounce has passed it no longer holds anything back, so it reads 0
    await time.increase(DAY_AND_ONE_SECOND);
    expect((await lens.previewUpdate(...borrowCapArgs(12))).debounceEndsAt).to.equal(0);
  });

  it("tracks a timelocked update from registration to expiry", async function () {
    const preview = await lens.previewUpdate(...borrowCapArgs(3));
    expect(preview.executesDirectly).to.equal(false);
    expect(preview.unlockTime.sub(await time.latest())).to.be.within(SIX_HOURS, SIX_HOURS + 1);

    await riskOracle.publishRiskParameterUpdate(...borrowCapArgs(3));
    await riskStewardReceiver.processUpdate(1);
    const pending = await lens.getUpdateDetails(1);
    expect(pending.status).to.equal(1); // Pending
    expect(pending.unlockTime).to.equal((await riskStewardReceiver.updates(1)).unlockTime);
    expect(pending.executableNow).to.equal(false);
    expect(pending.blockingUpdateId).to.equal(0); // itself does not count

    // A new proposal for the same market is blocked by the pending one
    expect((await lens.previewUpdate(...borrowCapArgs(4))).blockingUpdateId).to.equal(1);

    await time.increase(SIX_HOURS + 1);
    expect((await lens.getUpdateDetails(1)).executableNow).to.equal(true);

    await time.increase(EXPIRATION_TIME);
    expect((await lens.getUpdateDetails(1)).executableNow).to.equal(false);
    // Once expired it no longer blocks a new proposal
    expect((await lens.previewUpdate(...borrowCapArgs(4))).blockingUpdateId).to.equal(0);
  });

  it("reports debounce and blockers only for an update not yet processed", async function () {
    await riskOracle.publishRiskParameterUpdate(...borrowCapArgs(10));
    await riskStewardReceiver.processUpdate(1);
    // Its own execution starts a debounce, but that only holds back the next update
    expect((await lens.getUpdateDetails(1)).debounceEndsAt).to.equal(0);

    await time.increase(DAY_AND_ONE_SECOND);
    await riskOracle.publishRiskParameterUpdate(...borrowCapArgs(30));
    await riskStewardReceiver.processUpdate(2);
    // #2 is pending now, but it cannot block #1, which was executed before it
    expect((await lens.getUpdateDetails(1)).blockingUpdateId).to.equal(0);
  });

  it("flags an unprocessed update that a newer one has replaced", async function () {
    await riskOracle.publishRiskParameterUpdate(...borrowCapArgs(3));
    await riskOracle.publishRiskParameterUpdate(...borrowCapArgs(4));

    const replaced = await lens.getUpdateDetails(1);
    expect(replaced.replacedByUpdateId).to.equal(2);
    expect(replaced.unlockTime).to.equal(0); // it will never be processed, so nothing is projected
    expect(replaced.currentValues).to.deep.equal([parseUnits("8", 18)]);
    expect((await lens.getUpdateDetails(2)).replacedByUpdateId).to.equal(0);
    await expect(riskStewardReceiver.processUpdate(1)).to.be.revertedWithCustomError(
      riskStewardReceiver,
      "UpdateIsExpired",
    );
  });

  it("still reports a replaced update when the steward would reject it", async function () {
    await riskOracle.publishRiskParameterUpdate(...borrowCapArgs(10));
    await riskOracle.publishRiskParameterUpdate(...borrowCapArgs(10));
    await riskStewardReceiver.processUpdate(2);

    // #1 now sets the value the market already has, so the steward would revert with RedundantValue
    expect((await lens.getUpdateDetails(1)).replacedByUpdateId).to.equal(2);
  });

  it("reverts with the steward's error when the steward rejects the update", async function () {
    await expect(lens.previewUpdate(...borrowCapArgs(8))).to.be.revertedWithCustomError(
      marketCapsRiskSteward,
      "RedundantValue",
    );
  });

  it("reads eMode collateral factors from the pool the update targets", async function () {
    const poolId = 1;
    await mockCoreComptroller.setCollateralFactor(
      poolId,
      mockCoreVToken.address,
      parseUnits("0.7", 18),
      parseUnits("0.8", 18),
    );

    const preview = await lens.previewUpdate(
      "ipfs://QmLensEMode",
      encodeCollateralFactors(0.75, 0.8),
      "collateralFactors",
      mockCoreVToken.address,
      poolId,
      0,
      "0x",
    );
    expect(preview.executesDirectly).to.equal(false);
    expect(preview.currentValues).to.deep.equal([parseUnits("0.7", 18), parseUnits("0.8", 18)]);
    expect(preview.proposedValues).to.deep.equal([parseUnits("0.75", 18), parseUnits("0.8", 18)]);
  });

  it("reads collateral factors from an isolated pool comptroller", async function () {
    const isolatedComptroller = await (await ethers.getContractFactory("MockComptroller")).deploy();
    const isolatedVToken = await (await ethers.getContractFactory("MockVToken")).deploy(isolatedComptroller.address);
    await isolatedComptroller.supportMarket(isolatedVToken.address);
    await isolatedComptroller.setCollateralFactor(isolatedVToken.address, parseUnits("0.5", 18), parseUnits("0.6", 18));

    const previewCollateralFactors = (poolId: number) =>
      lens.previewUpdate(
        "ipfs://QmLensIsolated",
        encodeCollateralFactors(0.55, 0.65),
        "collateralFactors",
        isolatedVToken.address,
        poolId,
        0,
        "0x",
      );

    expect((await previewCollateralFactors(0)).currentValues).to.deep.equal([
      parseUnits("0.5", 18),
      parseUnits("0.6", 18),
    ]);
    // Isolated pools have no eMode pools, so there is nothing to read
    expect((await previewCollateralFactors(1)).currentValues).to.deep.equal([
      ethers.constants.Zero,
      ethers.constants.Zero,
    ]);
  });

  it("returns an interest rate model update as addresses", async function () {
    const newIRM = (await ethers.getSigners())[10].address;
    const preview = await lens.previewUpdate(
      "ipfs://QmLensIRM",
      ethers.utils.defaultAbiCoder.encode(["address"], [newIRM]),
      "interestRateModel",
      mockCoreVToken.address,
      0,
      0,
      "0x",
    );
    expect(preview.currentValues).to.deep.equal([ethers.constants.Zero]);
    expect(preview.proposedValues).to.deep.equal([ethers.BigNumber.from(newIRM)]);
  });

  it("marks the current value of a remote update as unknown", async function () {
    const preview = await lens.previewUpdate(...borrowCapArgs(12, ETHEREUM_LZV2_CHAIN_ID));
    expect(preview.isRemote).to.equal(true);
    expect(preview.currentValues).to.deep.equal([ethers.constants.MaxUint256]);
    expect(preview.proposedValues).to.deep.equal([parseUnits("12", 18)]);
  });

  it("reverts with ConfigNotActive for a local update whose type has no steward", async function () {
    await expect(
      lens.previewUpdate(
        "ipfs://QmLensNoSteward",
        parseUnitsToHex(1),
        "unknownType",
        mockCoreVToken.address,
        0,
        0,
        "0x",
      ),
    ).to.be.revertedWithCustomError(riskStewardReceiver, "ConfigNotActive");
  });

  it("reverts with ConfigNotActive for a type whose config was switched off", async function () {
    await riskOracle.publishRiskParameterUpdate(...borrowCapArgs(10));
    await riskStewardReceiver.setConfigActive("borrowCap", false);

    // The steward is still set, but processUpdate rejects the type, and so does the lens
    await expect(lens.previewUpdate(...borrowCapArgs(10))).to.be.revertedWithCustomError(
      riskStewardReceiver,
      "ConfigNotActive",
    );
    await expect(lens.getUpdateDetails(1)).to.be.revertedWithCustomError(riskStewardReceiver, "ConfigNotActive");
    await expect(riskStewardReceiver.processUpdate(1)).to.be.revertedWithCustomError(
      riskStewardReceiver,
      "ConfigNotActive",
    );
  });

  it("returns empty values for an update type it does not know", async function () {
    // Remote, so no steward is asked and only the lens's own decoding is exercised
    const preview = await lens.previewUpdate(
      "ipfs://QmLensUnknown",
      parseUnitsToHex(1),
      "unknownType",
      mockCoreVToken.address,
      0,
      ETHEREUM_LZV2_CHAIN_ID,
      "0x",
    );
    expect(preview.currentValues).to.be.empty;
    expect(preview.proposedValues).to.be.empty;
  });
});
