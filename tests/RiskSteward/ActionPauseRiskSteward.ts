import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import fs from "fs";
import { ethers, upgrades } from "hardhat";
import { SignerWithAddress } from "hardhat-deploy-ethers/signers";
import path from "path";

import {
  AccessControlManager,
  ActionPauseRiskSteward,
  DestinationStewardReceiver,
  MockComptroller,
  MockCoreComptroller,
  MockVToken,
  RiskOracle,
  RiskStewardReceiver,
} from "../../typechain";

const MINT = 0;
const REDEEM = 1;
const BORROW = 2;
const ENTER_MARKET = 7;
const EXIT_MARKET = 8;

const ONE_DAY = 60 * 60 * 24;
const SIX_HOURS = 60 * 60 * 6;

const BSC_LZV2_CHAIN_ID = 30102;
const ETHEREUM_LZV2_CHAIN_ID = 30101;

const encodeActions = (actions: number[]) => ethers.utils.defaultAbiCoder.encode(["uint8[]"], [actions]);

describe("ActionPauseRiskSteward", async function () {
  let deployer: SignerWithAddress,
    executor: SignerWithAddress,
    accessControlManager: AccessControlManager,
    riskOracle: RiskOracle,
    riskStewardReceiver: RiskStewardReceiver,
    destinationRiskStewardReceiver: DestinationStewardReceiver,
    actionPauseRiskSteward: ActionPauseRiskSteward,
    destinationActionPauseRiskSteward: ActionPauseRiskSteward,
    mockCoreComptroller: MockCoreComptroller,
    mockComptroller: MockComptroller,
    mockCoreVToken: MockVToken,
    mockVToken: MockVToken;

  const publish = (updateType: string, market: string, actions: number[], poolId = 0, dstEid = 0) =>
    riskOracle.publishRiskParameterUpdate(
      "ipfs://QmActions",
      encodeActions(actions),
      updateType,
      market,
      poolId,
      dstEid,
      "0x",
    );

  const fixture = async () => {
    [deployer, , executor] = await ethers.getSigners();

    const accessControlManagerFactory = await ethers.getContractFactory("AccessControlManager");
    accessControlManager = await accessControlManagerFactory.deploy();

    const MockVTokenFactory = await ethers.getContractFactory("MockVToken");
    mockCoreComptroller = await (await ethers.getContractFactory("MockCoreComptroller")).deploy();
    mockCoreVToken = await MockVTokenFactory.deploy(mockCoreComptroller.address);
    await mockCoreComptroller.supportMarket(mockCoreVToken.address);
    mockComptroller = await (await ethers.getContractFactory("MockComptroller")).deploy();
    mockVToken = await MockVTokenFactory.deploy(mockComptroller.address);
    await mockComptroller.supportMarket(mockVToken.address);

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

    const ActionPauseRiskStewardFactory = await ethers.getContractFactory("ActionPauseRiskSteward");
    actionPauseRiskSteward = await upgrades.deployProxy(ActionPauseRiskStewardFactory, [accessControlManager.address], {
      constructorArgs: [riskStewardReceiver.address],
      initializer: "initialize",
      unsafeAllow: ["state-variable-immutable", "constructor"],
    });
    destinationActionPauseRiskSteward = await upgrades.deployProxy(
      ActionPauseRiskStewardFactory,
      [accessControlManager.address],
      {
        constructorArgs: [destinationRiskStewardReceiver.address],
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
    await riskOracle.addUpdateType("pauseActions");
    await riskOracle.addUpdateType("unpauseActions");

    await riskStewardReceiver.setRiskParameterConfig("pauseActions", actionPauseRiskSteward.address, 1, 0);
    await riskStewardReceiver.setRiskParameterConfig(
      "unpauseActions",
      actionPauseRiskSteward.address,
      ONE_DAY,
      SIX_HOURS,
    );
    await riskStewardReceiver.setWhitelistedExecutor(executor.address, true);
    await destinationRiskStewardReceiver.setRiskParameterConfig(
      "pauseActions",
      destinationActionPauseRiskSteward.address,
      1,
    );
    await destinationRiskStewardReceiver.setWhitelistedExecutor(executor.address, true);
  };

  beforeEach(async function () {
    await loadFixture(fixture);
  });

  describe("deployment", async function () {
    it("reverts on a zero receiver address", async function () {
      const factory = await ethers.getContractFactory("ActionPauseRiskSteward");
      await expect(factory.deploy(ethers.constants.AddressZero)).to.be.revertedWithCustomError(
        factory,
        "ZeroAddressNotAllowed",
      );
    });
  });

  describe("pauseActions", async function () {
    it("pauses actions on a core pool market at once", async function () {
      await publish("pauseActions", mockCoreVToken.address, [MINT, BORROW]);

      await expect(riskStewardReceiver.processUpdate(1))
        .to.emit(actionPauseRiskSteward, "ActionsPausedUpdated")
        .withArgs(1, mockCoreVToken.address, [MINT, BORROW], true);

      expect(await mockCoreComptroller.actionPaused(mockCoreVToken.address, MINT)).to.equal(true);
      expect(await mockCoreComptroller.actionPaused(mockCoreVToken.address, BORROW)).to.equal(true);
    });

    it("pauses actions on an isolated pool market at once", async function () {
      await publish("pauseActions", mockVToken.address, [ENTER_MARKET, REDEEM]);

      await expect(riskStewardReceiver.processUpdate(1))
        .to.emit(actionPauseRiskSteward, "ActionsPausedUpdated")
        .withArgs(1, mockVToken.address, [ENTER_MARKET, REDEEM], true);

      expect(await mockComptroller.actionPaused(mockVToken.address, ENTER_MARKET)).to.equal(true);
      expect(await mockComptroller.actionPaused(mockVToken.address, REDEEM)).to.equal(true);
    });

    it("applies when only some actions are already paused", async function () {
      await mockComptroller.setActionsPaused([mockVToken.address], [MINT], true);
      await publish("pauseActions", mockVToken.address, [MINT, BORROW]);

      await expect(riskStewardReceiver.processUpdate(1)).to.emit(actionPauseRiskSteward, "ActionsPausedUpdated");
      expect(await mockComptroller.actionPaused(mockVToken.address, BORROW)).to.equal(true);
    });

    it("is not blocked by a pending unpause on the same market", async function () {
      await mockComptroller.setActionsPaused([mockVToken.address], [MINT], true);
      await publish("unpauseActions", mockVToken.address, [MINT]);
      await expect(riskStewardReceiver.processUpdate(1)).to.emit(riskStewardReceiver, "UpdateRegistered");

      await publish("pauseActions", mockVToken.address, [BORROW]);
      await expect(riskStewardReceiver.processUpdate(2)).to.emit(actionPauseRiskSteward, "ActionsPausedUpdated");
    });
  });

  describe("unpauseActions", async function () {
    it("waits for the timelock", async function () {
      await mockCoreComptroller.setActionsPaused([mockCoreVToken.address], [MINT], true);
      await publish("unpauseActions", mockCoreVToken.address, [MINT]);

      await expect(riskStewardReceiver.processUpdate(1)).to.emit(riskStewardReceiver, "UpdateRegistered");
      await expect(riskStewardReceiver.connect(executor).executeRegisteredUpdate(1)).to.be.revertedWithCustomError(
        riskStewardReceiver,
        "UpdateNotUnlocked",
      );

      await time.increase(SIX_HOURS + 1);
      await expect(riskStewardReceiver.connect(executor).executeRegisteredUpdate(1))
        .to.emit(actionPauseRiskSteward, "ActionsPausedUpdated")
        .withArgs(1, mockCoreVToken.address, [MINT], false);
      expect(await mockCoreComptroller.actionPaused(mockCoreVToken.address, MINT)).to.equal(false);
    });
  });

  describe("validation", async function () {
    it("reverts when every action already has the requested state", async function () {
      await publish("unpauseActions", mockVToken.address, [MINT]);
      await expect(riskStewardReceiver.processUpdate(1)).to.be.revertedWithCustomError(
        actionPauseRiskSteward,
        "RedundantValue",
      );
    });

    it("reverts on an empty action list", async function () {
      await publish("pauseActions", mockVToken.address, []);
      await expect(riskStewardReceiver.processUpdate(1)).to.be.revertedWithCustomError(
        actionPauseRiskSteward,
        "EmptyActions",
      );
    });

    it("reverts on an action above MAX_ACTION", async function () {
      await publish("pauseActions", mockVToken.address, [MINT, EXIT_MARKET + 1]);
      await expect(riskStewardReceiver.processUpdate(1))
        .to.be.revertedWithCustomError(actionPauseRiskSteward, "InvalidAction")
        .withArgs(EXIT_MARKET + 1);
    });

    it("reverts on a repeated action", async function () {
      await publish("pauseActions", mockVToken.address, [MINT, BORROW, MINT]);
      await expect(riskStewardReceiver.processUpdate(1))
        .to.be.revertedWithCustomError(actionPauseRiskSteward, "InvalidAction")
        .withArgs(MINT);
    });

    it("reverts on an eMode pool ID", async function () {
      await publish("pauseActions", mockCoreVToken.address, [MINT], 1);
      await expect(riskStewardReceiver.processUpdate(1)).to.be.revertedWithCustomError(
        actionPauseRiskSteward,
        "InvalidPool",
      );
    });

    it("reverts on an unsupported update type", async function () {
      const update = {
        referenceId: "",
        updateId: 1,
        market: mockVToken.address,
        updateType: "supplyCap",
        updateTypeKey: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("supplyCap")),
        newValue: encodeActions([MINT]),
        previousValue: "0x",
        timestamp: 0,
        publisher: deployer.address,
        poolId: 0,
        destLzEid: 0,
        additionalData: "0x",
      };
      await expect(actionPauseRiskSteward.isSafeForDirectExecution(update)).to.be.revertedWithCustomError(
        actionPauseRiskSteward,
        "UnsupportedUpdateType",
      );
    });

    it("reverts when applyUpdate is not called by the receiver", async function () {
      await publish("pauseActions", mockVToken.address, [MINT]);
      const update = await riskOracle.getUpdateById(1);
      await expect(actionPauseRiskSteward.applyUpdate(update)).to.be.revertedWithCustomError(
        actionPauseRiskSteward,
        "OnlyRiskStewardReceiver",
      );
    });
  });

  describe("remote updates", async function () {
    it("pauses actions on the destination chain after the remote delay", async function () {
      await publish("pauseActions", mockVToken.address, [MINT], 0, ETHEREUM_LZV2_CHAIN_ID);
      await expect(riskStewardReceiver.processUpdate(1)).to.emit(riskStewardReceiver, "UpdateSentToDestination");

      await time.increase(SIX_HOURS + 1);
      await expect(destinationRiskStewardReceiver.connect(executor).executeUpdate(1))
        .to.emit(destinationActionPauseRiskSteward, "ActionsPausedUpdated")
        .withArgs(1, mockVToken.address, [MINT], true);
      expect(await mockComptroller.actionPaused(mockVToken.address, MINT)).to.equal(true);
    });

    it("validates the actions on the destination chain", async function () {
      await publish("pauseActions", mockVToken.address, [EXIT_MARKET + 1], 0, ETHEREUM_LZV2_CHAIN_ID);
      await riskStewardReceiver.processUpdate(1);

      await time.increase(SIX_HOURS + 1);
      await expect(destinationRiskStewardReceiver.connect(executor).executeUpdate(1))
        .to.be.revertedWithCustomError(destinationActionPauseRiskSteward, "InvalidAction")
        .withArgs(EXIT_MARKET + 1);
    });
  });
});
