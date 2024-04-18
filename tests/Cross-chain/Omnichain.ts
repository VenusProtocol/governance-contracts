import { mine } from "@nomicfoundation/hardhat-network-helpers";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers, network, upgrades } from "hardhat";
import { SignerWithAddress } from "hardhat-deploy-ethers/signers";

import {
  AccessControlManager,
  LZEndpointMock,
  OmnichainExecutorOwner,
  OmnichainGovernanceExecutor,
  OmnichainProposalSender,
  TimelockV8,
} from "../../typechain";

describe("Omnichain: ", async function () {
  const localChainId = 1;
  const remoteChainId = 2;
  let maxDailyTransactionLimit = 100;
  let maxDailyReceiveLimit = 100;
  let makePayload: any;
  const delay = 3600;
  const values = [0];
  const proposalType = 0;
  const calldata = ethers.utils.defaultAbiCoder.encode(["uint256"], [delay]);
  let nativeFee: BigNumber;

  let signer1: SignerWithAddress,
    signer2: SignerWithAddress,
    deployer: SignerWithAddress,
    accessControlManager: AccessControlManager,
    remoteEndpoint: LZEndpointMock,
    executorOwner: OmnichainExecutorOwner,
    executor: OmnichainGovernanceExecutor,
    remotePath: string,
    sender: OmnichainProposalSender,
    NormalTimelock: TimelockV8,
    FasttrackTimelock: TimelockV8,
    CriticalTimelock: TimelockV8,
    adapterParams: string,
    localEndpoint: LZEndpointMock,
    localPath: string;

  async function storePayload(payload: string, adapterParams: string) {
    await expect(
      sender.connect(signer1).execute(remoteChainId, payload, adapterParams, ethers.constants.AddressZero, {
        value: nativeFee,
      }),
    ).to.emit(sender, "StorePayload");
    const nonce = await getLastSourceProposalId();
    expect(await sender.storedExecutionHashes(nonce)).to.not.equals(ethers.constants.HashZero);
  }

  async function payloadWithId(payload: string) {
    const proposalId = await getLastSourceProposalId();
    const payloadWithIdEncoded = ethers.utils.defaultAbiCoder.encode(["bytes", "uint256"], [payload, proposalId]);
    return payloadWithIdEncoded;
  }

  async function getPayload(normalTimelockAddress: string) {
    const payload = await makePayload([normalTimelockAddress], values, ["setDelay(uint256)"], [calldata], proposalType);
    return payload;
  }

  async function getLastRemoteProposalId() {
    return await executor.lastProposalReceived();
  }

  async function getLastSourceProposalId() {
    return await sender.proposalCount();
  }

  async function updateFunctionRegistry(executorOwner: OmnichainExecutorOwner) {
    const functionregistry = [
      "setOracle(address)",
      "setMaxDailyReceiveLimit(uint256)",
      "pause()",
      "unpause()",
      "setConfig(uint16,uint16,uint256,bytes)",
      "setSendVersion(uint16)",
      "setReceiveVersion(uint16)",
      "forceResumeReceive(uint16,bytes)",
      "setTrustedRemoteAddress(uint16,bytes)",
      "setPrecrime(address)",
      "setMinDstGas(uint16,uint16,uint256)",
      "setPayloadSizeLimit(uint16,uint256)",
      "setUseCustomAdapterParams(bool)",
      "addTimelocks(address[])",
      "setTimelockPendingAdmin(address,uint8)",
      "retryMessage(uint16,bytes,uint64,bytes)",
    ];
    const activeArray = new Array(functionregistry.length).fill(true);
    await executorOwner.upsertSignature(functionregistry, activeArray);
  }

  const omnichainFixture = async () => {
    deployer = (await ethers.getSigners())[0];
    signer1 = (await ethers.getSigners())[1];
    signer2 = (await ethers.getSigners())[2];

    const LZEndpointMock = await ethers.getContractFactory("LZEndpointMock");
    const OmnichainGovernanceExecutor = await ethers.getContractFactory("OmnichainGovernanceExecutor");
    const OmnichainProposalSender = await ethers.getContractFactory("OmnichainProposalSender");
    const Timelock = await ethers.getContractFactory("TimelockV8");
    const accessControlManagerFactory = await ethers.getContractFactory("AccessControlManager");
    const OmnichainProposalExecutorOwner = await ethers.getContractFactory("OmnichainExecutorOwner");

    accessControlManager = await accessControlManagerFactory.deploy();
    remoteEndpoint = await LZEndpointMock.deploy(remoteChainId);
    localEndpoint = await LZEndpointMock.deploy(localChainId);
    sender = await OmnichainProposalSender.deploy(localEndpoint.address, accessControlManager.address);

    makePayload = async (targets: [], values: [], signatures: [], calldatas: [], proposalType: number) => {
      const payload = ethers.utils.defaultAbiCoder.encode(
        ["address[]", "uint256[]", "string[]", "bytes[]", "uint8"],
        [targets, values, signatures, calldatas, proposalType],
      );
      return payload;
    };

    executor = await OmnichainGovernanceExecutor.deploy(remoteEndpoint.address, deployer.address, localChainId);

    NormalTimelock = await Timelock.deploy(executor.address, delay);
    FasttrackTimelock = await Timelock.deploy(executor.address, delay);
    CriticalTimelock = await Timelock.deploy(executor.address, delay);

    executorOwner = await upgrades.deployProxy(OmnichainProposalExecutorOwner, [accessControlManager.address], {
      constructorArgs: [executor.address],
      initializer: "initialize",
      unsafeAllow: ["state-variable-immutable"],
    });

    await localEndpoint.setDestLzEndpoint(executor.address, remoteEndpoint.address);
    await remoteEndpoint.setDestLzEndpoint(sender.address, localEndpoint.address);

    adapterParams = ethers.utils.solidityPack(["uint16", "uint256"], [1, 500000]);

    let tx = await accessControlManager
      .connect(deployer)
      .giveCallPermission(sender.address, "setTrustedRemoteAddress(uint16,bytes)", signer1.address);
    await tx.wait();

    tx = await accessControlManager
      .connect(deployer)
      .giveCallPermission(sender.address, "setMaxDailyLimit(uint16,uint256)", signer1.address);
    await tx.wait();

    tx = await accessControlManager
      .connect(deployer)
      .giveCallPermission(sender.address, "execute(uint16,bytes,bytes,address)", signer1.address);
    await tx.wait();

    tx = await accessControlManager
      .connect(deployer)
      .giveCallPermission(sender.address, "retryExecute(uint256,uint16,bytes,bytes,address,uint256)", signer1.address);
    await tx.wait();

    tx = await accessControlManager
      .connect(deployer)
      .giveCallPermission(sender.address, "removeTrustedRemote(uint16)", signer1.address);
    await tx.wait();
    tx = await accessControlManager
      .connect(deployer)
      .giveCallPermission(executorOwner.address, "pause()", signer1.address);
    await tx.wait();

    tx = await accessControlManager
      .connect(deployer)
      .giveCallPermission(executorOwner.address, "unpause()", signer1.address);
    await tx.wait();
    tx = await accessControlManager
      .connect(deployer)
      .giveCallPermission(executorOwner.address, "setTrustedRemoteAddress(uint16,bytes)", signer1.address);
    await tx.wait();

    tx = await accessControlManager
      .connect(deployer)
      .giveCallPermission(executorOwner.address, "setMaxDailyReceiveLimit(uint256)", signer1.address);
    await tx.wait();
    tx = await accessControlManager
      .connect(deployer)
      .giveCallPermission(executorOwner.address, "addTimelocks(address[])", signer1.address);
    await tx.wait();
    tx = await accessControlManager
      .connect(deployer)
      .giveCallPermission(executorOwner.address, "setTimelockPendingAdmin(address,uint8)", signer1.address);
    await tx.wait();
    tx = await accessControlManager
      .connect(deployer)
      .giveCallPermission(executorOwner.address, "retryMessage(uint16,bytes,uint64,bytes)", signer1.address);
    await tx.wait();

    remotePath = ethers.utils.solidityPack(["address"], [executor.address]);
    localPath = ethers.utils.solidityPack(["address"], [sender.address]);

    await sender.connect(signer1).setTrustedRemoteAddress(remoteChainId, remotePath);
    await sender.connect(signer1).setMaxDailyLimit(remoteChainId, maxDailyTransactionLimit);
    await executor.connect(deployer).setTrustedRemoteAddress(localChainId, localPath);
    await executor.connect(deployer).setMaxDailyReceiveLimit(maxDailyReceiveLimit);
    await executor
      .connect(deployer)
      .addTimelocks([NormalTimelock.address, FasttrackTimelock.address, CriticalTimelock.address]);

    tx = await executor.transferOwnership(executorOwner.address);
    await tx.wait();

    updateFunctionRegistry(executorOwner);

    const payload = await getPayload(NormalTimelock.address);
    nativeFee = (await sender.estimateFees(remoteChainId, payloadWithId(payload), false, adapterParams))[0];
  };

  beforeEach(async function () {
    await loadFixture(omnichainFixture);
  });

  it("Reverts if EOA called owner function of bridge", async function () {
    await expect(sender.connect(signer2).setTrustedRemoteAddress(remoteChainId, remotePath)).to.be.revertedWith(
      "access denied",
    );
  });

  it("Reverts if EOA call execute() without grant permission", async function () {
    const payload = await getPayload(NormalTimelock.address);
    await expect(
      sender.connect(signer2).execute(remoteChainId, payload, "0x", ethers.constants.AddressZero),
    ).to.be.revertedWith("access denied");
  });

  it("Reverts when zero value passed", async function () {
    const payload = await getPayload(NormalTimelock.address);
    await expect(
      sender.connect(signer1).execute(remoteChainId, payload, "0x", ethers.constants.AddressZero),
    ).to.be.revertedWith("OmnichainProposalSender: value cannot be zero");
  });
  it("Revert if trusted remote is removed by non owner", async function () {
    await expect(sender.connect(signer2).removeTrustedRemote(remoteChainId)).to.be.revertedWith("access denied");
  });
  it("Revert if non trusted remote is removed", async function () {
    await expect(sender.connect(signer1).removeTrustedRemote(18)).to.be.revertedWith(
      "OmnichainProposalSender: trusted remote not found",
    );
  });
  it("Reverts when trusted remote is not set", async function () {
    const payload = await makePayload(
      [NormalTimelock.address],
      values,
      ["setDelay(uint256)"],
      [calldata],
      proposalType,
    );
    expect(await sender.connect(signer1).removeTrustedRemote(remoteChainId))
      .to.emit(sender, "TrustedRemoteRemoved")
      .withArgs(remoteChainId);

    await expect(
      sender.connect(signer1).execute(remoteChainId, payload, "0x", ethers.constants.AddressZero, {
        value: ethers.utils.parseEther((nativeFee / 1e18 + 0.00001).toString()),
      }),
    ).to.be.revertedWith("OmnichainProposalSender: destination chain is not a trusted source");
  });

  it("Reverts with Daily Transaction Limit Exceed", async function () {
    await sender.connect(signer1).setMaxDailyLimit(remoteChainId, 0);
    const payload = await getPayload(NormalTimelock.address);

    await expect(
      sender.connect(signer1).execute(remoteChainId, payload, "0x", ethers.constants.AddressZero, {
        value: nativeFee,
      }),
    ).to.be.revertedWith("Daily Transaction Limit Exceeded");
  });

  it("Reverts if EOA call setMaxDailyLimit() without grant permisssion", async function () {
    await expect(sender.connect(signer2).setMaxDailyLimit(remoteChainId, maxDailyTransactionLimit)).to.be.revertedWith(
      "access denied",
    );
  });

  it("Revert if function in not found in function registry", async function () {
    const data = executor.interface.encodeFunctionData("setTrustedRemote", [localChainId, localPath]);
    await expect(
      deployer.sendTransaction({
        to: executorOwner.address,
        data: data,
      }),
    ).to.revertedWith("Function not found");
  });

  it("Reverts if any user other than owner try to add function in function registry", async function () {
    await expect(
      executorOwner.connect(signer2).upsertSignature(["setTrustedRemote(uint16,bytes"], [true]),
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("Function registry should not emit event if nonexistant function is removed", async function () {
    await expect(
      executorOwner.connect(deployer).upsertSignature(["setTrustedRemote(uint16,bytes)"], [false]),
    ).to.not.emit(executorOwner, "FunctionRegistryChanged");
  });

  it("Function registry should not emit event if function is added twice", async function () {
    expect(
      await executorOwner.connect(deployer).upsertSignature(["setTrustedRemoteAddress(uint16,bytes)"], [true]),
    ).to.not.emit(executorOwner, "FunctionRegistryChanged");
  });

  it("Reverts if EOA called owner function of Executor", async function () {
    let data = executor.interface.encodeFunctionData("setTrustedRemoteAddress", [localChainId, localPath]);
    await expect(
      signer2.sendTransaction({
        to: executorOwner.address,
        data: data,
      }),
    ).to.reverted;
    data = executor.interface.encodeFunctionData("setTrustedRemote", [localChainId, localPath]);
    await expect(
      deployer.sendTransaction({
        to: executorOwner.address,
        data: data,
      }),
    ).to.reverted;

    data = executor.interface.encodeFunctionData("setMaxDailyReceiveLimit", [maxDailyReceiveLimit]);
    await expect(
      deployer.sendTransaction({
        to: executorOwner.address,
        data: data,
      }),
    ).to.reverted;

    data = executor.interface.encodeFunctionData("addTimelocks", [
      [NormalTimelock.address, FasttrackTimelock.address, CriticalTimelock.address],
    ]);
    await expect(
      deployer.sendTransaction({
        to: executorOwner.address,
        data: data,
      }),
    ).to.reverted;
  });

  it("Emit TimelocksAdded event", async function () {
    const data = executor.interface.encodeFunctionData("addTimelocks", [
      [NormalTimelock.address, FasttrackTimelock.address, CriticalTimelock.address],
    ]);
    await expect(
      signer1.sendTransaction({
        to: executorOwner.address,
        data: data,
      }),
    ).to.emit(executor, "TimelockAdded");
  });

  it("Emit SetTrustedRemoteAddress event", async function () {
    const data = executor.interface.encodeFunctionData("setTrustedRemoteAddress", [localChainId, localPath]);
    await expect(
      signer1.sendTransaction({
        to: executorOwner.address,
        data: data,
      }),
    ).to.emit(executor, "SetTrustedRemoteAddress");
  });

  it("Emit ExecuteRemoteProposal event", async function () {
    const payload = await getPayload(NormalTimelock.address);
    await expect(
      sender.connect(signer1).execute(remoteChainId, payload, adapterParams, ethers.constants.AddressZero, {
        value: nativeFee,
      }),
    ).to.emit(sender, "ExecuteRemoteProposal");
    expect(await sender.chainIdToLast24HourCommandsSent(remoteChainId)).to.equal(1);
  });

  it("Revert initially, success on retry", async () => {
    const payload = await getPayload(NormalTimelock.address);
    await expect(
      sender.connect(signer1).execute(remoteChainId, payload, adapterParams, ethers.constants.AddressZero, {
        value: ethers.utils.parseEther("0.0000001"),
      }),
    ).to.emit(sender, "StorePayload");
    const pId = await getLastSourceProposalId();

    await expect(
      sender
        .connect(signer1)
        .retryExecute(
          pId,
          remoteChainId,
          payloadWithId(payload),
          adapterParams,
          ethers.constants.AddressZero,
          ethers.utils.parseEther("0.0000001"),
          {
            value: nativeFee,
          },
        ),
    ).to.emit(sender, "ClearPayload");
    expect(await sender.storedExecutionHashes(pId)).to.equals(ethers.constants.HashZero);
  });

  it("Revert when daily limit exceeds in retry", async () => {
    const payload = await getPayload(NormalTimelock.address);
    await expect(
      sender.connect(signer1).execute(remoteChainId, payload, adapterParams, ethers.constants.AddressZero, {
        value: ethers.utils.parseEther("0.0000001"),
      }),
    ).to.emit(sender, "StorePayload");
    await sender.connect(signer1).setMaxDailyLimit(remoteChainId, 0);
    const pId = await getLastSourceProposalId();
    await expect(
      sender
        .connect(signer1)
        .retryExecute(
          pId,
          remoteChainId,
          payloadWithId(payload),
          adapterParams,
          ethers.constants.AddressZero,
          ethers.utils.parseEther("0.0000001"),
          {
            value: ethers.utils.parseEther("1"),
          },
        ),
    ).to.be.revertedWith("Daily Transaction Limit Exceeded");
  });

  it("Emit ProposalExecuted event", async function () {
    const payload = await getPayload(NormalTimelock.address);
    await expect(
      sender.connect(signer1).execute(remoteChainId, payload, adapterParams, ethers.constants.AddressZero, {
        value: nativeFee,
      }),
    ).to.emit(sender, "ExecuteRemoteProposal");
    await mine(4500);
    const proposalId = await getLastRemoteProposalId();
    await expect(executor.execute(proposalId)).to.emit(executor, "ProposalExecuted").withArgs(proposalId);
    expect(await executor.state(proposalId)).equals(2);
    expect(await executor.queued(proposalId)).equals(false);
  });

  it("Should update delay of timelock on destination", async function () {
    const newDelay = 50000;
    const calldata = ethers.utils.defaultAbiCoder.encode(["uint256"], [newDelay]);
    const payload = await makePayload([NormalTimelock.address], [0], ["setDelay(uint256)"], [calldata], proposalType);
    await expect(
      sender.connect(signer1).execute(remoteChainId, payload, adapterParams, ethers.constants.AddressZero, {
        value: nativeFee,
      }),
    ).to.emit(sender, "ExecuteRemoteProposal");
    mine(4500);
    const proposalId = await getLastRemoteProposalId();
    await executor.execute(proposalId);
    expect(await executor.queued(proposalId)).equals(false);
    expect(await NormalTimelock.delay()).to.equals(newDelay);
  });
  it("Admin can set the new pending admin of Timelock", async () => {
    const OmnichainGovernanceExecutor = await ethers.getContractFactory("OmnichainGovernanceExecutor");
    const executor2 = await OmnichainGovernanceExecutor.deploy(remoteEndpoint.address, deployer.address, localChainId);
    const data = executor.interface.encodeFunctionData("setTimelockPendingAdmin", [executor2.address, 0]);
    await expect(
      signer1.sendTransaction({
        to: executorOwner.address,
        data: data,
      }),
    ).to.emit(executor, "SetTimelockPendingAdmin");
    expect(await NormalTimelock.pendingAdmin()).to.equals(executor2.address);
  });

  it("Set new pending admin of Timelock through proposal", async () => {
    const OmnichainGovernanceExecutor = await ethers.getContractFactory("OmnichainGovernanceExecutor");
    const executor2 = await OmnichainGovernanceExecutor.deploy(remoteEndpoint.address, deployer.address, localChainId);
    const calldata = ethers.utils.defaultAbiCoder.encode(["address"], [executor2.address]);
    const payload = await makePayload(
      [NormalTimelock.address],
      [0],
      ["setPendingAdmin(address)"],
      [calldata],
      proposalType,
    );
    await expect(
      sender.connect(signer1).execute(remoteChainId, payload, adapterParams, ethers.constants.AddressZero, {
        value: nativeFee,
      }),
    ).to.emit(sender, "ExecuteRemoteProposal");
    mine(4500);
    const proposalId = await getLastRemoteProposalId();
    expect(await NormalTimelock.pendingAdmin()).to.equals(ethers.constants.AddressZero);

    await executor.execute(proposalId);
    expect(await executor.queued(proposalId)).equals(false);
    expect(await NormalTimelock.pendingAdmin()).to.equals(executor2.address);
  });
  it("should revert when invalid proposalType is passed", async function () {
    const OmnichainGovernanceExecutor = await ethers.getContractFactory("OmnichainGovernanceExecutor");
    const executor2 = await OmnichainGovernanceExecutor.deploy(remoteEndpoint.address, deployer.address, localChainId);
    const data = executor.interface.encodeFunctionData("setTimelockPendingAdmin", [executor2.address, 3]);
    await expect(
      signer1.sendTransaction({
        to: executorOwner.address,
        data: data,
      }),
    ).to.be.reverted;
  });
  it("Revert when zero address passed as pending admin", async function () {
    const data = executor.interface.encodeFunctionData("setTimelockPendingAdmin", [ethers.constants.AddressZero, 1]);
    await expect(
      signer1.sendTransaction({
        to: executorOwner.address,
        data: data,
      }),
    ).to.be.reverted;
  });

  it("Revert when non owner sets the pending admin of Timelock", async function () {
    const OmnichainGovernanceExecutor = await ethers.getContractFactory("OmnichainGovernanceExecutor");
    const executor2 = await OmnichainGovernanceExecutor.deploy(remoteEndpoint.address, deployer.address, localChainId);
    const data = executor.interface.encodeFunctionData("setTimelockPendingAdmin", [executor2.address, 1]);
    await expect(
      signer2.sendTransaction({
        to: executorOwner.address,
        data: data,
      }),
    ).to.be.reverted;
  });

  it("Revert if empty proposal", async function () {
    await expect(
      sender.connect(signer1).execute(remoteChainId, "0x", adapterParams, ethers.constants.AddressZero, {
        value: nativeFee,
      }),
    ).to.be.revertedWith("OmnichainProposalSender: empty payload");
  });

  it("Revert on invalid proposal type", async function () {
    const payload = await makePayload(
      [NormalTimelock.address],
      [0],
      ["setDelay(uint256)"],
      [calldata],
      proposalType + 3,
    );
    const lastProposal = await getLastRemoteProposalId();
    await sender.connect(signer1).execute(remoteChainId, payload, adapterParams, ethers.constants.AddressZero, {
      value: nativeFee,
    });
    expect(await executor.lastProposalReceived()).not.to.equals(lastProposal.add(1));
  });

  it("Revert if same proposal come twice", async function () {
    const payload = await getPayload(NormalTimelock.address);

    await sender.connect(signer1).execute(remoteChainId, payload, adapterParams, ethers.constants.AddressZero, {
      value: nativeFee,
    });
    await network.provider.send("evm_setAutomine", [false]);
    const tx = await sender
      .connect(signer1)
      .execute(remoteChainId, payload, adapterParams, ethers.constants.AddressZero, {
        value: nativeFee,
      });
    await network.provider.send("evm_mine");
    expect(tx).to.be.revertedWith("Multiple bridging in a proposal");
    await network.provider.send("evm_setAutomine", [true]);
  });

  it("Retry message on destination on failure", async function () {
    let data = executor.interface.encodeFunctionData("pause", []);
    const srcAddress = ethers.utils.solidityPack(["address", "address"], [sender.address, executor.address]);
    // Pause the Executor
    await expect(
      signer1.sendTransaction({
        to: executorOwner.address,
        data: data,
      }),
    ).to.emit(executor, "Paused");
    const payload = await getPayload(NormalTimelock.address);
    expect(
      await sender.connect(signer1).execute(remoteChainId, payload, adapterParams, ethers.constants.AddressZero, {
        value: nativeFee,
      }),
    ).to.emit(sender, "ExecuteRemoteProposal");
    expect(await executor.failedMessages(localChainId, srcAddress, 1)).not.equals(ethers.constants.HashZero);

    // Unpause the Executor
    data = executor.interface.encodeFunctionData("unpause", []);
    await expect(
      signer1.sendTransaction({
        to: executorOwner.address,
        data: data,
      }),
    ).to.emit(executor, "Unpaused");

    // Retry message on destination
    data = executor.interface.encodeFunctionData("retryMessage", [
      localChainId,
      srcAddress,
      1,
      await payloadWithId(payload),
    ]);
    await expect(
      signer1.sendTransaction({
        to: executorOwner.address,
        data: data,
      }),
    ).to.emit(executor, "RetryMessageSuccess");
    expect(await executor.failedMessages(localChainId, srcAddress, 1)).equals(ethers.constants.HashZero);
  });

  it("Retry messages that failed due to low gas at the destination using the Endpoint.", async function () {
    // low destination gas
    const adapterParamsLocal = ethers.utils.solidityPack(["uint16", "uint256"], [remoteChainId, 10000]);
    const srcAddress = ethers.utils.solidityPack(["address", "address"], [sender.address, executor.address]);
    const payload = await getPayload(NormalTimelock.address);
    expect(
      await sender.connect(signer1).execute(remoteChainId, payload, adapterParamsLocal, ethers.constants.AddressZero, {
        value: nativeFee,
      }),
    ).to.emit(sender, "ExecuteRemoteProposal");
    const lastProposalReceived = await executor.lastProposalReceived();
    expect(await remoteEndpoint.hasStoredPayload(localChainId, srcAddress)).equals(true);

    // Retry message on destination Endpoint
    await expect(remoteEndpoint.retryPayload(localChainId, srcAddress, await payloadWithId(payload))).to.emit(
      remoteEndpoint,
      "PayloadCleared",
    );
    expect(await executor.lastProposalReceived()).equals(lastProposalReceived.add(1));
    expect(await remoteEndpoint.hasStoredPayload(localChainId, srcAddress)).equals(false);
  });

  it("Reverts when other than guardian call cancel of executor", async function () {
    const payload = await getPayload(NormalTimelock.address);
    await sender.connect(signer1).execute(remoteChainId, payload, adapterParams, ethers.constants.AddressZero, {
      value: nativeFee,
    });
    const proposalId = await getLastRemoteProposalId();
    await expect(executor.connect(signer1).cancel(proposalId)).to.be.revertedWith(
      "OmnichainGovernanceExecutor::cancel: sender must be guardian",
    );
  });

  it("Revert if proposal is not queued", async function () {
    const proposalId = (await getLastRemoteProposalId()).add(1);
    await expect(executor.connect(deployer).cancel(proposalId)).to.be.revertedWithCustomError(
      executor,
      "InvalidProposalId",
    );
  });
  it("Revert when proposal is not queued", async function () {
    await expect(executor.state(1000)).to.be.revertedWithCustomError(executor, "InvalidProposalId");
  });

  it("Emit ProposalCanceled event when proposal gets canceled", async function () {
    const payload = await getPayload(NormalTimelock.address);
    await sender.connect(signer1).execute(remoteChainId, payload, adapterParams, ethers.constants.AddressZero, {
      value: nativeFee,
    });
    const proposalId = await getLastRemoteProposalId();
    await expect(executor.connect(deployer).cancel(proposalId))
      .to.emit(executor, "ProposalCanceled")
      .withArgs(proposalId);
    expect(await executor.state(proposalId)).equals(0);
    expect(await executor.queued(proposalId)).equals(false);
  });

  it("Reverts when cancel is called after execute", async function () {
    const payload = await getPayload(NormalTimelock.address);
    await sender.connect(signer1).execute(remoteChainId, payload, adapterParams, ethers.constants.AddressZero, {
      value: nativeFee,
    });
    mine(4500);
    const proposalId = await getLastRemoteProposalId();
    await executor.execute(proposalId);
    await expect(executor.connect(deployer).cancel(proposalId)).to.be.revertedWith(
      "OmnichainGovernanceExecutor::cancel: proposal should be queued and not executed",
    );
  });

  it("Proposal fails if any number of commands fail on destination", async function () {
    const calldata = ethers.utils.defaultAbiCoder.encode(["uint256", "uint256"], [delay, delay - 20]);
    const payload = await makePayload(
      [NormalTimelock.address, FasttrackTimelock.address],
      [0, 0],
      ["setDelay(uint256)", "setDelay(uint256)"],
      [calldata, calldata],
      proposalType,
    );
    await sender.connect(signer1).execute(remoteChainId, payload, adapterParams, ethers.constants.AddressZero, {
      value: nativeFee,
    });
    const proposalIdRemote = await getLastRemoteProposalId();
    const proposalIdSource = await getLastSourceProposalId();
    expect((await executor.proposals(proposalIdRemote))[0]).to.not.equals(proposalIdSource);
  });
  it("Reverts when number of parameters mismatch", async function () {
    const calldata = ethers.utils.defaultAbiCoder.encode(["uint256", "uint256"], [delay, delay - 20]);
    const payload = await makePayload(
      [NormalTimelock.address, FasttrackTimelock.address],
      [0, 0],
      ["setDelay(uint256)", "setDelay(uint256)"],
      [calldata], // fail due to no calldata provided for second command
      proposalType,
    );
    await expect(
      sender.connect(signer1).execute(remoteChainId, payload, adapterParams, ethers.constants.AddressZero, {
        value: nativeFee,
      }),
    ).to.be.revertedWith("OmnichainProposalSender: proposal function information arity mismatch");
  });
  it("Refund stucked gas in contract, to given address", async function () {
    // Failed due to minDest is 0
    const adapterParams = ethers.utils.solidityPack(["uint16", "uint256"], [remoteChainId, 0]);
    const payload = await getPayload(NormalTimelock.address);

    await storePayload(payload, adapterParams);

    const balanceBefore = await ethers.provider.getBalance(signer2.address);
    const pId = await getLastSourceProposalId();

    await expect(
      sender.fallbackWithdraw(signer2.address, pId, remoteChainId, payloadWithId(payload), adapterParams, nativeFee),
    )
      .to.emit(sender, "FallbackWithdraw")
      .and.to.emit(sender, "ClearPayload");

    const balanceAfter = await ethers.provider.getBalance(signer2.address);
    expect(balanceBefore.add(nativeFee)).to.equals(balanceAfter);
  });

  it("Reverts on passing zero values in parameters in fallback withdraw", async function () {
    const adapterParams = ethers.utils.solidityPack(["uint16", "uint256"], [remoteChainId, 0]);
    const payload = await getPayload(NormalTimelock.address);

    await storePayload(payload, adapterParams);

    const nonce = await getLastSourceProposalId();

    await expect(
      sender.fallbackWithdraw(
        ethers.constants.AddressZero,
        nonce,
        remoteChainId,
        payloadWithId(payload),
        adapterParams,
        nativeFee,
      ),
    ).to.be.revertedWithCustomError(sender, "ZeroAddressNotAllowed");

    await expect(
      sender.fallbackWithdraw(signer2.address, nonce, remoteChainId, "0x", adapterParams, nativeFee),
    ).to.be.revertedWith("OmnichainProposalSender: empty payload");
  });

  it("Reverts when value exceeds contract's balance in fallback withdraw", async function () {
    const adapterParams = ethers.utils.solidityPack(["uint16", "uint256"], [remoteChainId, 0]);
    const payload = await getPayload(NormalTimelock.address);

    await storePayload(payload, adapterParams);

    const nonce = await getLastSourceProposalId();

    await expect(
      sender.fallbackWithdraw(
        signer2.address,
        nonce,
        remoteChainId,
        payloadWithId(payload),
        adapterParams,
        nativeFee.mul(10),
      ),
    ).to.be.revertedWith("OmnichainProposalSender: invalid execution params");
  });

  it("Reverts when different parameters passed in fallback withdraw", async function () {
    const adapterParams = ethers.utils.solidityPack(["uint16", "uint256"], [remoteChainId, 0]);
    const payload = await getPayload(NormalTimelock.address);

    await storePayload(payload, adapterParams);

    const nonce = await getLastSourceProposalId();

    await expect(
      sender.fallbackWithdraw(
        signer2.address,
        nonce,
        localChainId, // Different chain ID passed
        payloadWithId(payload),
        adapterParams,
        nativeFee,
      ),
    ).to.be.revertedWith("OmnichainProposalSender: invalid execution params");

    // Wrong nonce passed
    await expect(
      sender.fallbackWithdraw(signer2.address, nonce.add(1), remoteChainId, payload, adapterParams, nativeFee),
    ).to.be.revertedWith("OmnichainProposalSender: no stored payload");
  });

  it("Reverts when receiver is unable to receive in fallback withdraw", async function () {
    const adapterParams = ethers.utils.solidityPack(["uint16", "uint256"], [remoteChainId, 0]);
    const payload = await getPayload(NormalTimelock.address);

    await storePayload(payload, adapterParams);

    const nonce = await getLastSourceProposalId();

    // Passed address has no receive method
    await expect(
      sender.fallbackWithdraw(sender.address, nonce, remoteChainId, payloadWithId(payload), adapterParams, nativeFee),
    ).to.be.revertedWith("Call failed");
  });
  it("Refund stucked gas in contract, to given address", async function () {
    // Failed due to minDest is 0
    const adapterParams = ethers.utils.solidityPack(["uint16", "uint256"], [remoteChainId, 0]);
    const payload = await getPayload(NormalTimelock.address);

    await storePayload(payload, adapterParams);

    const balanceBefore = await ethers.provider.getBalance(signer2.address);
    const nonce = await getLastSourceProposalId();

    await expect(
      sender.fallbackWithdraw(signer2.address, nonce, remoteChainId, payloadWithId(payload), adapterParams, nativeFee),
    )
      .to.emit(sender, "FallbackWithdraw")
      .and.to.emit(sender, "ClearPayload");

    const balanceAfter = await ethers.provider.getBalance(signer2.address);
    expect(balanceBefore.add(nativeFee)).to.equals(balanceAfter);
  });

  it("Reverts on passing zero values in parameters in fallback withdraw", async function () {
    const adapterParams = ethers.utils.solidityPack(["uint16", "uint256"], [remoteChainId, 0]);
    const payload = await getPayload(NormalTimelock.address);

    await storePayload(payload, adapterParams);

    const nonce = await getLastSourceProposalId();

    await expect(
      sender.fallbackWithdraw(
        ethers.constants.AddressZero,
        nonce,
        remoteChainId,
        payloadWithId(payload),
        adapterParams,
        nativeFee,
      ),
    ).to.be.revertedWithCustomError(sender, "ZeroAddressNotAllowed");

    await expect(
      sender.fallbackWithdraw(signer2.address, nonce, remoteChainId, "0x", adapterParams, nativeFee),
    ).to.be.revertedWith("OmnichainProposalSender: empty payload");
  });

  it("Reverts when different parameters passed in fallback withdraw", async function () {
    const adapterParams = ethers.utils.solidityPack(["uint16", "uint256"], [remoteChainId, 0]);
    const payload = await getPayload(NormalTimelock.address);

    await storePayload(payload, adapterParams);

    const nonce = await getLastSourceProposalId();

    await expect(
      sender.fallbackWithdraw(
        signer2.address,
        nonce,
        localChainId, // Different chain ID passed
        payloadWithId(payload),
        adapterParams,
        nativeFee,
      ),
    ).to.be.revertedWith("OmnichainProposalSender: invalid execution params");

    // Wrong nonce passed
    await expect(
      sender.fallbackWithdraw(signer2.address, nonce.add(1), remoteChainId, payload, adapterParams, nativeFee),
    ).to.be.revertedWith("OmnichainProposalSender: no stored payload");
  });

  it("Reverts when receiver is unable to receive in fallback withdraw", async function () {
    const adapterParams = ethers.utils.solidityPack(["uint16", "uint256"], [remoteChainId, 0]);
    const payload = await getPayload(NormalTimelock.address);

    await storePayload(payload, adapterParams);

    const nonce = await getLastSourceProposalId();

    // Passed address has no receive method
    await expect(
      sender.fallbackWithdraw(sender.address, nonce, remoteChainId, payloadWithId(payload), adapterParams, nativeFee),
    ).to.be.revertedWith("Call failed");
  });

  it("Reverts when daily limit of sending transaction reached", async function () {
    const maxDailyTransactionLimit = 0;
    await sender.connect(signer1).setMaxDailyLimit(remoteChainId, maxDailyTransactionLimit);
    const payload = await getPayload(NormalTimelock.address);
    await expect(
      sender.connect(signer1).execute(remoteChainId, payload, adapterParams, ethers.constants.AddressZero, {
        value: nativeFee,
      }),
    ).to.be.revertedWith("Daily Transaction Limit Exceeded");
  });

  it("Proposal failed when receiving limit reached", async function () {
    maxDailyTransactionLimit = 100;
    await sender.connect(signer1).setMaxDailyLimit(remoteChainId, maxDailyTransactionLimit);
    maxDailyReceiveLimit = 0;
    const data = executor.interface.encodeFunctionData("setMaxDailyReceiveLimit", [maxDailyReceiveLimit]);
    await signer1.sendTransaction({
      to: executorOwner.address,
      data: data,
    });

    const payload = await getPayload(NormalTimelock.address);

    await sender.connect(signer1).execute(remoteChainId, payload, adapterParams, ethers.constants.AddressZero, {
      value: nativeFee,
    });
    const proposalIdRemote = await getLastRemoteProposalId();
    const proposalIdSource = await getLastSourceProposalId();
    expect((await executor.proposals(proposalIdRemote))[0]).to.not.equals(proposalIdSource);
  });
});
