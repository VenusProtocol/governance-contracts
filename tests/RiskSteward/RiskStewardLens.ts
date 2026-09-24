import { loadFixture, takeSnapshot, time } from "@nomicfoundation/hardhat-network-helpers";
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
  // delta, 6h timelock and 1 day debounce. Remote updates go to a second mock endpoint where nothing listens: the mock
  // swallows the failed delivery, so the send succeeds on this chain, which is all the lens reads.
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

    const remoteEndpoint = await new ethers.ContractFactory(
      endpointArtifact.abi,
      endpointArtifact.bytecode,
      deployer,
    ).deploy(ETHEREUM_LZV2_CHAIN_ID);
    await endpoint.setDestLzEndpoint(remoteEndpoint.address, remoteEndpoint.address);
    await riskStewardReceiver.setPeer(ETHEREUM_LZV2_CHAIN_ID, ethers.utils.hexZeroPad(remoteEndpoint.address, 32));
    await deployer.sendTransaction({ to: riskStewardReceiver.address, value: parseUnits("1", 18) });

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
      [riskStewardReceiver.address, "setPaused(bool)"],
      [riskStewardReceiver.address, "setWhitelistedExecutor(address,bool)"],
      [marketCapsRiskSteward.address, "setSafeDeltaBps(uint256)"],
      [collateralFactorsRiskSteward.address, "setSafeDeltaBps(uint256)"],
    ];
    for (const [target, signature] of permissions) {
      await accessControlManager.giveCallPermission(target, signature, deployer.address);
    }

    await riskOracle.addAuthorizedSender(deployer.address);
    await riskStewardReceiver.setWhitelistedExecutor(deployer.address, true);
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
    expect(preview.canProcessNow).to.equal(true);
    expect(preview.executableNow).to.equal(true);
    expect(preview.unlockTime).to.be.closeTo(await time.latest(), 1);
    expect(preview.currentValues).to.deep.equal([parseUnits("8", 18)]);
    expect(preview.proposedValues).to.deep.equal([parseUnits("10", 18)]);
    expect(preview.debounceEndsAt).to.equal(0);
    expect(preview.blockingUpdateId).to.equal(0);

    await riskOracle.publishRiskParameterUpdate(...borrowCapArgs(10));
    const published = await lens.getUpdateDetails(1);
    expect(published.executableNow).to.equal(true);
    expect(published.expiresAt).to.be.gt(await time.latest());

    await riskStewardReceiver.processUpdate(1);
    const executed = await lens.getUpdateDetails(1);
    expect(executed.status).to.equal(2); // Executed
    expect(executed.canProcessNow).to.equal(false);
    expect(executed.executableNow).to.equal(false);
    expect(executed.expiresAt).to.equal(0); // nothing left for it to miss
    expect(executed.currentValues).to.deep.equal([parseUnits("10", 18)]);

    // The next proposal is held back by debounce from the execution above
    const executedAt = (await riskStewardReceiver.updates(1)).executedAt;
    const next = await lens.previewUpdate(...borrowCapArgs(12));
    expect(next.debounceEndsAt).to.equal(executedAt.add(DAY_AND_ONE_SECOND));
    expect(next.canProcessNow).to.equal(false);
    // 10 -> 12 is within the safe delta, but debounce still holds it back
    expect(next.executableNow).to.equal(false);

    // Once the debounce has passed, the end time stays the same; it simply lies in the past
    await time.increase(DAY_AND_ONE_SECOND);
    const afterDebounce = await lens.previewUpdate(...borrowCapArgs(12));
    expect(afterDebounce.debounceEndsAt).to.equal(executedAt.add(DAY_AND_ONE_SECOND));
    expect(afterDebounce.canProcessNow).to.equal(true);
    expect(afterDebounce.executableNow).to.equal(true);
  });

  it("tracks a timelocked update from registration to expiry", async function () {
    const preview = await lens.previewUpdate(...borrowCapArgs(3));
    expect(preview.canProcessNow).to.equal(true);
    expect(preview.executableNow).to.equal(false);
    expect(preview.unlockTime.sub(await time.latest())).to.be.within(SIX_HOURS, SIX_HOURS + 1);

    await riskOracle.publishRiskParameterUpdate(...borrowCapArgs(3));
    await riskStewardReceiver.processUpdate(1);
    const pending = await lens.getUpdateDetails(1);
    expect(pending.status).to.equal(1); // Pending
    expect(pending.canProcessNow).to.equal(false);
    expect(pending.unlockTime).to.equal((await riskStewardReceiver.updates(1)).unlockTime);
    expect(pending.executableNow).to.equal(false);
    expect(pending.blockingUpdateId).to.equal(0); // itself does not count

    // A new proposal for the same market is blocked by the pending one
    const blocked = await lens.previewUpdate(...borrowCapArgs(4));
    expect(blocked.blockingUpdateId).to.equal(1);
    expect(blocked.canProcessNow).to.equal(false);
    // 8 -> 4 is within the safe delta, but the pending update still holds it back
    expect(blocked.executableNow).to.equal(false);

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
    expect(replaced.canProcessNow).to.equal(false);
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

  it("flags an unprocessed update that has already expired", async function () {
    await riskOracle.publishRiskParameterUpdate(...borrowCapArgs(3));
    await time.increase(EXPIRATION_TIME + 1);

    const expired = await lens.getUpdateDetails(1);
    expect(expired.expiresAt).to.be.lt(await time.latest());
    expect(expired.canProcessNow).to.equal(false);
    expect(expired.unlockTime).to.equal(0);
    expect(expired.currentValues).to.deep.equal([parseUnits("8", 18)]);
    await expect(riskStewardReceiver.processUpdate(1)).to.be.revertedWithCustomError(
      riskStewardReceiver,
      "UpdateIsExpired",
    );
  });

  it("expires an unprocessed update one timelock before its 2 days are up", async function () {
    await riskOracle.publishRiskParameterUpdate(...borrowCapArgs(3));
    const publishedAt = (await riskOracle.getUpdateById(1)).timestamp;
    const expiresAt = (await lens.getUpdateDetails(1)).expiresAt;
    expect(expiresAt).to.equal(publishedAt.add(EXPIRATION_TIME - SIX_HOURS));

    // processUpdate still accepts it at exactly expiresAt
    const snapshot = await takeSnapshot();
    await time.setNextBlockTimestamp(expiresAt);
    await riskStewardReceiver.processUpdate(1);
    await snapshot.restore();

    // One second later it is still inside its 2 days, but less than the 6 hour timelock remains
    await time.increaseTo(expiresAt.add(1));
    const tooLate = await lens.getUpdateDetails(1);
    expect(tooLate.expiresAt).to.equal(expiresAt);
    expect(tooLate.unlockTime).to.equal(0);
    await expect(riskStewardReceiver.processUpdate(1)).to.be.revertedWithCustomError(
      riskStewardReceiver,
      "UpdateWillExpireBeforeUnlock",
    );
  });

  it("flags a pending update that expired before it was executed", async function () {
    await riskOracle.publishRiskParameterUpdate(...borrowCapArgs(3));
    await riskStewardReceiver.processUpdate(1);
    // Once registered, the timelock is no longer subtracted: execution just has to happen within the 2 days
    const publishedAt = (await riskOracle.getUpdateById(1)).timestamp;
    expect((await lens.getUpdateDetails(1)).expiresAt).to.equal(publishedAt.add(EXPIRATION_TIME));

    await time.increase(EXPIRATION_TIME + 1);
    const expired = await lens.getUpdateDetails(1);
    expect(expired.status).to.equal(1); // still Pending on the receiver
    expect(expired.expiresAt).to.be.lt(await time.latest());
    expect(expired.executableNow).to.equal(false);
    expect(expired.unlockTime).to.equal((await riskStewardReceiver.updates(1)).unlockTime);
  });

  it("reports a sent remote update and how long it can still be resent", async function () {
    await riskOracle.publishRiskParameterUpdate(...borrowCapArgs(12, ETHEREUM_LZV2_CHAIN_ID));
    await riskStewardReceiver.processUpdate(1);

    const sent = await lens.getUpdateDetails(1);
    expect(sent.status).to.equal(5); // SENT_TO_DESTINATION
    expect(sent.isRemote).to.equal(true);
    expect(sent.executableNow).to.equal(false);
    expect(sent.unlockTime).to.equal((await riskStewardReceiver.updates(1)).unlockTime);
    // A resend has no timelock ahead of it, so the full 2 days apply
    const publishedAt = (await riskOracle.getUpdateById(1)).timestamp;
    expect(sent.expiresAt).to.equal(publishedAt.add(EXPIRATION_TIME));
    expect(sent.currentValues).to.be.empty;
  });

  it("reports nothing left to miss for a rejected update or one the receiver marked expired", async function () {
    await riskOracle.publishRiskParameterUpdate(...borrowCapArgs(3));
    await riskStewardReceiver.processUpdate(1);
    await riskStewardReceiver.rejectUpdate(1);

    const rejected = await lens.getUpdateDetails(1);
    expect(rejected.status).to.equal(3); // Rejected
    expect(rejected.executableNow).to.equal(false);
    expect(rejected.expiresAt).to.equal(0);
    expect(rejected.unlockTime).to.equal((await riskStewardReceiver.updates(1)).unlockTime);

    // processUpdate marks a pending update Expired when a newer one for the same market and type comes in after it
    await riskOracle.publishRiskParameterUpdate(
      "ipfs://QmLensExpired",
      parseUnitsToHex(3),
      "supplyCap",
      mockCoreVToken.address,
      0,
      0,
      "0x",
    );
    await riskStewardReceiver.processUpdate(2);
    await time.increase(EXPIRATION_TIME + 1);
    await riskOracle.publishRiskParameterUpdate(
      "ipfs://QmLensExpired",
      parseUnitsToHex(10),
      "supplyCap",
      mockCoreVToken.address,
      0,
      0,
      "0x",
    );
    await riskStewardReceiver.processUpdate(3);

    const expired = await lens.getUpdateDetails(2);
    expect(expired.status).to.equal(4); // Expired
    expect(expired.executableNow).to.equal(false);
    expect(expired.expiresAt).to.equal(0);
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
    expect(preview.executableNow).to.equal(false);
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

  it("leaves the current value of a remote update empty", async function () {
    const preview = await lens.previewUpdate(...borrowCapArgs(12, ETHEREUM_LZV2_CHAIN_ID));
    expect(preview.isRemote).to.equal(true);
    expect(preview.canProcessNow).to.equal(true);
    expect(preview.executableNow).to.equal(false);
    expect(preview.currentValues).to.be.empty;
    expect(preview.proposedValues).to.deep.equal([parseUnits("12", 18)]);
  });

  it("flags a paused receiver, which holds back processUpdate but not the execution of a pending update", async function () {
    await riskOracle.publishRiskParameterUpdate(...borrowCapArgs(3));
    await riskStewardReceiver.processUpdate(1);
    await time.increase(SIX_HOURS + 1);
    await riskStewardReceiver.setPaused(true);

    // 8 -> 12 is within the safe delta and nothing else holds it back, so only the pause stops it
    const preview = await lens.previewUpdate(
      "ipfs://QmLensPaused",
      parseUnitsToHex(12),
      "supplyCap",
      mockCoreVToken.address,
      0,
      0,
      "0x",
    );
    expect(preview.isPaused).to.equal(true);
    expect(preview.canProcessNow).to.equal(false);
    expect(preview.executableNow).to.equal(false);

    const pending = await lens.getUpdateDetails(1);
    expect(pending.isPaused).to.equal(true);
    expect(pending.canProcessNow).to.equal(false);
    expect(pending.executableNow).to.equal(true);

    await riskStewardReceiver.setPaused(false);
    expect(
      (
        await lens.previewUpdate(
          "ipfs://QmLensPaused",
          parseUnitsToHex(12),
          "supplyCap",
          mockCoreVToken.address,
          0,
          0,
          "0x",
        )
      ).executableNow,
    ).to.equal(true);
  });

  it("flags a local update whose type was never configured on the receiver", async function () {
    const preview = await lens.previewUpdate(
      "ipfs://QmLensNoSteward",
      parseUnitsToHex(1),
      "unknownType",
      mockCoreVToken.address,
      0,
      0,
      "0x",
    );
    expect(preview.isConfigActive).to.equal(false);
    expect(preview.canProcessNow).to.equal(false);
    expect(preview.executableNow).to.equal(false);
    expect(preview.unlockTime).to.equal(0);
  });

  it("flags a switched-off type but still previews it with its stored config", async function () {
    await riskOracle.publishRiskParameterUpdate(...borrowCapArgs(3));
    await riskStewardReceiver.processUpdate(1);
    await time.increase(SIX_HOURS + 1);
    await riskStewardReceiver.setConfigActive("borrowCap", false);

    // Unlocked and unexpired, so the switched-off config is the only reason it cannot run
    const pending = await lens.getUpdateDetails(1);
    expect(pending.isConfigActive).to.equal(false);
    expect(pending.executableNow).to.equal(false);
    expect(pending.unlockTime).to.equal((await riskStewardReceiver.updates(1)).unlockTime);

    // A new proposal is previewed as if the config were switched back on as stored; only executableNow says it is off
    const safe = await lens.previewUpdate(...borrowCapArgs(4));
    expect(safe.isConfigActive).to.equal(false);
    expect(safe.canProcessNow).to.equal(false);
    expect(safe.executableNow).to.equal(false);
    expect(safe.unlockTime).to.be.closeTo(await time.latest(), 1); // 8 -> 4 is within the safe delta
    expect(safe.blockingUpdateId).to.equal(1);
    expect(safe.currentValues).to.deep.equal([parseUnits("8", 18)]);

    // 8 -> 2 is outside the safe delta, so the stored 6 hour timelock still applies
    const timelocked = await lens.previewUpdate(...borrowCapArgs(2));
    expect(timelocked.unlockTime.sub(await time.latest())).to.be.within(SIX_HOURS, SIX_HOURS + 1);

    const remote = await lens.previewUpdate(...borrowCapArgs(12, ETHEREUM_LZV2_CHAIN_ID));
    expect(remote.isConfigActive).to.equal(false);
    expect(remote.unlockTime).to.be.closeTo(await time.latest(), 1);
  });

  it("still flags expiry for an unprocessed update whose config is switched off", async function () {
    await riskOracle.publishRiskParameterUpdate(...borrowCapArgs(3));
    await riskStewardReceiver.setConfigActive("borrowCap", false);
    await time.increase(EXPIRATION_TIME + 1);

    const expired = await lens.getUpdateDetails(1);
    expect(expired.expiresAt).to.be.lt(await time.latest());
    expect(expired.isConfigActive).to.equal(false);
  });

  it("returns empty values for an update type it does not know", async function () {
    // Configured on the receiver but unknown to the lens, e.g. a type added after the lens was deployed. Remote, so
    // no steward is asked and only the lens's own decoding is exercised.
    await riskStewardReceiver.setRiskParameterConfig(
      "unknownType",
      marketCapsRiskSteward.address,
      DAY_AND_ONE_SECOND,
      SIX_HOURS,
    );
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
