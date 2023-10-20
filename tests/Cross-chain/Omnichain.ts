import { mine } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { SignerWithAddress } from "hardhat-deploy-ethers/signers";

import {
  AccessControlManager,
  LZEndpointMock,
  OmnichainExecutorOwner,
  OmnichainGovernanceExecutor,
  OmnichainProposalSender,
  Timelock,
} from "../../typechain";

describe("OmnichainProposalSender: ", async function () {
  const localChainId = 1;
  const remoteChainId = 2;
  let maxDailyTransactionLimit = 100;
  let maxDailyReceiveLimit = 100;
  let proposalId = 1;
  const delay = 3800;
  const values = [0];
  const proposalType = 0;
  const calldata = ethers.utils.defaultAbiCoder.encode(["uint256"], [delay]);
  let Payload;
  let nativeFee;

  let alice: SignerWithAddress,
    bob: SignerWithAddress,
    deployer: SignerWithAddress,
    accessControlManager: AccessControlManager,
    remoteEndpoint: LZEndpointMock,
    executorOwner: OmnichainExecutorOwner,
    executor: OmnichainGovernanceExecutor,
    remotePath,
    sender: OmnichainProposalSender,
    NormalTimelock: Timelock,
    FasttrackTimelock: Timelock,
    CriticalTimelock: Timelock,
    adapterParams,
    localEndpoint: LZEndpointMock,
    localPath;

  function makePayload(targets, values, signatures, calldatas, proposalId, proposalType) {
    const payload = ethers.utils.defaultAbiCoder.encode(
      ["address[]", "uint256[]", "string[]", "bytes[]", "uint256", "uint8"],
      [targets, values, signatures, calldatas, proposalId, proposalType],
    );
    return payload;
  }

  async function updateFunctionRegistry(executorOwner) {
    const functionregistry = [
      "setOracle(address)",
      "setMaxDailyReceiveLimit(uint16,uint256)",
      "pause()",
      "unpause()",
      "setConfig(uint16,uint16,uint256,bytes)",
      "setSendVersion(uint16)",
      "setReceiveVersion(uint16)",
      "forceResumeReceive(uint16,bytes)",
      "setTrustedRemote(uint16,bytes)",
      "setTrustedRemoteAddress(uint16,bytes)",
      "setPrecrime(address)",
      "setMinDstGas(uint16,uint16,uint256)",
      "setPayloadSizeLimit(uint16,uint256)",
      "setUseCustomAdapterParams(bool)",
      "addTimelocks(address[])",
    ];
    const removeArray = new Array(functionregistry.length).fill(false);
    await executorOwner.upsertSignature(functionregistry, removeArray);
  }

  before(async function () {
    deployer = (await ethers.getSigners())[0];
    alice = (await ethers.getSigners())[1];
    bob = (await ethers.getSigners())[2];

    const LZEndpointMock = await ethers.getContractFactory("LZEndpointMock");
    const OmnichainGovernanceExecutor = await ethers.getContractFactory("OmnichainGovernanceExecutor");
    const OmnichainProposalSender = await ethers.getContractFactory("OmnichainProposalSender");
    const Timelock = await ethers.getContractFactory("Timelock");
    const accessControlManagerFactory = await ethers.getContractFactory("AccessControlManager");
    const OmnichainProposalExecutorOwner = await ethers.getContractFactory("OmnichainExecutorOwner");

    accessControlManager = await accessControlManagerFactory.deploy();
    remoteEndpoint = await LZEndpointMock.deploy(remoteChainId);
    localEndpoint = await LZEndpointMock.deploy(localChainId);
    sender = await OmnichainProposalSender.deploy(localEndpoint.address, accessControlManager.address);
    executor = await OmnichainGovernanceExecutor.deploy(remoteEndpoint.address, deployer.address);
    NormalTimelock = await Timelock.deploy(executor.address, 3600);
    FasttrackTimelock = await Timelock.deploy(executor.address, 3600);
    CriticalTimelock = await Timelock.deploy(executor.address, 3600);

    executorOwner = await upgrades.deployProxy(OmnichainProposalExecutorOwner, [accessControlManager.address], {
      constructorArgs: [executor.address],
      initializer: "initialize",
      unsafeAllow: ["state-variable-immutable"],
    });

    await localEndpoint.setDestLzEndpoint(executor.address, remoteEndpoint.address);
    await remoteEndpoint.setDestLzEndpoint(sender.address, localEndpoint.address);

    Payload = makePayload(
      [NormalTimelock.address],
      values,
      ["setDelay(uint256)"],
      [calldata],
      proposalId,
      proposalType,
    );

    adapterParams = ethers.utils.solidityPack(["uint16", "uint256"], [1, 500000]);

    let tx = await accessControlManager
      .connect(deployer)
      .giveCallPermission(sender.address, "setTrustedRemoteAddress(uint16,bytes)", alice.address);
    await tx.wait();

    tx = await accessControlManager
      .connect(deployer)
      .giveCallPermission(sender.address, "setMaxDailyLimit(uint16,uint256)", alice.address);
    await tx.wait();

    tx = await accessControlManager
      .connect(deployer)
      .giveCallPermission(sender.address, "execute(uint16,bytes,bytes)", alice.address);
    await tx.wait();

    tx = await accessControlManager
      .connect(deployer)
      .giveCallPermission(sender.address, "updateValidChainId(uint16,bool)", alice.address);
    await tx.wait();

    tx = await accessControlManager
      .connect(deployer)
      .giveCallPermission(executorOwner.address, "setTrustedRemoteAddress(uint16,bytes)", alice.address);
    await tx.wait();

    tx = await accessControlManager
      .connect(deployer)
      .giveCallPermission(executorOwner.address, "setMaxDailyReceiveLimit(uint16,uint256)", alice.address);
    await tx.wait();

    tx = await accessControlManager
      .connect(deployer)
      .giveCallPermission(executorOwner.address, "addTimelocks(address[])", alice.address);
    await tx.wait();

    tx = await executor.transferOwnership(executorOwner.address);
    await tx.wait();

    remotePath = ethers.utils.solidityPack(["address"], [executor.address]);
    localPath = ethers.utils.solidityPack(["address"], [sender.address]);
    nativeFee = (await localEndpoint.estimateFees(remoteChainId, executor.address, "0x", false, adapterParams))
      .nativeFee;
  });

  it("Reverts if EOA called owner function of bridge", async function () {
    await expect(sender.connect(bob).setTrustedRemoteAddress(remoteChainId, remotePath)).to.be.revertedWith(
      "access denied",
    );
  });
  it("Reverts if EOA call execute() without grant permission", async function () {
    await expect(sender.connect(bob).execute(remoteChainId, Payload, "0x")).to.be.revertedWith("access denied");
  });
  it("Reverts with Invalid chainId", async function () {
    await expect(sender.connect(alice).execute(remoteChainId, Payload, "0x")).to.be.revertedWith(
      "OmnichainProposalSender: Invalid chainId",
    );
  });
  it("Reverts when EOA call updateValidChainId without grant permission", async function () {
    await expect(sender.connect(bob).updateValidChainId(remoteChainId, true)).to.be.revertedWith("access denied");
  });
  it("Emit SetTrustedRemoteAddress event", async function () {
    expect(await sender.connect(alice).setTrustedRemoteAddress(remoteChainId, remotePath))
      .to.emit(sender, "SetTrustedRemoteAddress")
      .withArgs(remoteChainId, remotePath);
    const remoteAndLocal = ethers.utils.solidityPack(["address", "address"], [executor.address, sender.address]);
    expect(await sender.trustedRemoteLookup(remoteChainId)).to.be.equals(remoteAndLocal);
  });
  it("Emit UpdatedValidChainId", async function () {
    await expect(sender.connect(alice).updateValidChainId(remoteChainId, true)).to.emit(sender, "UpdatedValidChainId");
    expect(await sender.validChainIds(remoteChainId)).to.be.equals(true);
  });
  it("Reverts with Daily Transaction Limit Exceed", async function () {
    await expect(sender.connect(alice).execute(remoteChainId, Payload, "0x")).to.be.revertedWith(
      "Daily Transaction Limit Exceeded",
    );
  });
  it("Reverts if EOA call setMaxDailyLimit() without grant permisssion", async function () {
    await expect(sender.connect(bob).setMaxDailyLimit(remoteChainId, maxDailyTransactionLimit)).to.be.revertedWith(
      "access denied",
    );
  });
  it("Set daily transaction limit and emit SetMaxDailyLimit event", async function () {
    expect(await sender.connect(alice).setMaxDailyLimit(remoteChainId, maxDailyTransactionLimit))
      .to.emit(sender, "SetMaxDailyLimit")
      .withArgs(0, maxDailyTransactionLimit);
    expect(await sender.connect(alice).chainIdToMaxDailyLimit(remoteChainId)).to.be.equals(maxDailyTransactionLimit);
  });
  it("Revert if function in not found in function registry", async function () {
    const data = executor.interface.encodeFunctionData("setTrustedRemoteAddress", [localChainId, localPath]);
    await expect(
      deployer.sendTransaction({
        to: executorOwner.address,
        data: data,
      }),
    ).to.revertedWith("Function not found");
  });
  it("Reverts if any user other than owner try to add function in function registry", async function () {
    await expect(
      executorOwner.connect(bob).upsertSignature(["setTrustedRemoteAddress(uint16,bytes"], [false]),
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });
  it("Function registry should be updated", async function () {
    updateFunctionRegistry(executorOwner);
    expect(await executorOwner.connect(deployer).upsertSignature(["setTrustedRemoteAddress(uint16,bytes)"], [false]))
      .to.emit(executorOwner, "FunctionRegistryChanged")
      .withArgs("setTrustedRemoteAddress(uint16,bytes)", false);
  });
  it("Reverts if EOA called owner function of Executor", async function () {
    let data = executor.interface.encodeFunctionData("setTrustedRemoteAddress", [localChainId, localPath]);
    await expect(
      bob.sendTransaction({
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

    data = executor.interface.encodeFunctionData("setMaxDailyReceiveLimit", [localChainId, maxDailyReceiveLimit]);
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
    expect(
      await alice.sendTransaction({
        to: executorOwner.address,
        data: data,
      }),
    ).to.emit(executor, "TimelocksAdded");
  });
  it("Emit SetTrustedRemoteAddress event", async function () {
    const data = executor.interface.encodeFunctionData("setTrustedRemoteAddress", [localChainId, localPath]);
    await expect(
      await alice.sendTransaction({
        to: executorOwner.address,
        data: data,
      }),
    ).to.emit(executor, "SetTrustedRemoteAddress");
  });
  it("Set max daily receive limit", async function () {
    const data = executor.interface.encodeFunctionData("setMaxDailyReceiveLimit", [localChainId, maxDailyReceiveLimit]);
    await expect(
      await alice.sendTransaction({
        to: executorOwner.address,
        data: data,
      }),
    ).to.emit(executor, "SetMaxDailyReceiveLimit");
  });

  it("Emit ExecuteRemoteProposal event", async function () {
    await expect(
      await sender.connect(alice).execute(remoteChainId, Payload, adapterParams, {
        value: ethers.utils.parseEther((nativeFee / 1e18 + 0.00001).toString()),
      }),
    ).to.emit(sender, "ExecuteRemoteProposal");
  });
  it("Proposal should be update on remote", async function () {
    expect((await executor.proposals(proposalId))[0]).to.equals(proposalId);
  });
  it("Emit ProposalExecuted event", async function () {
    await mine(4500);
    expect(await executor.execute(proposalId))
      .to.emit(executor, "ProposalExecuted")
      .withArgs(1);
  });
  it("Should update delay of timelock", async function () {
    expect(await NormalTimelock.delay()).to.equals(delay);
  });
  it("Revert if same proposal come twice", async function () {
    await expect(
      sender.connect(alice).execute(remoteChainId, Payload, adapterParams, {
        value: ethers.utils.parseEther((nativeFee / 1e18 + 0.00001).toString()),
      }),
    ).to.be.revertedWith("OmnichainProposalSender: Invalid proposal");
  });
  it("Reverts when other than guardian call cancel of executor", async function () {
    ++proposalId;
    Payload = makePayload(
      [NormalTimelock.address],
      values,
      ["setDelay(uint256)"],
      [calldata],
      proposalId,
      proposalType,
    );
    await sender.connect(alice).execute(remoteChainId, Payload, adapterParams, {
      value: ethers.utils.parseEther((nativeFee / 1e18 + 0.00001).toString()),
    });
    await expect(executor.connect(alice).cancel(proposalId)).to.be.revertedWith(
      "OmnichainGovernanceExecutor::cancel: sender must be guardian",
    );
  });
  it("Emit ProposalCanceled event when proposal gets cancelled", async function () {
    ++proposalId;
    Payload = makePayload(
      [NormalTimelock.address],
      values,
      ["setDelay(uint256)"],
      [calldata],
      proposalId,
      proposalType,
    );

    await sender.connect(alice).execute(remoteChainId, Payload, adapterParams, {
      value: ethers.utils.parseEther((nativeFee / 1e18 + 0.00001).toString()),
    });
    expect(await executor.connect(deployer).cancel(proposalId))
      .to.emit(executor, "ProposalCanceled")
      .withArgs(proposalId);
  });
  it("Reverts when cancel is called after execute", async function () {
    ++proposalId;
    Payload = makePayload(
      [NormalTimelock.address],
      values,
      ["setDelay(uint256)"],
      [calldata],
      proposalId,
      proposalType,
    );
    await sender.connect(alice).execute(remoteChainId, Payload, adapterParams, {
      value: ethers.utils.parseEther((nativeFee / 1e18 + 0.00001).toString()),
    });
    mine(4500);
    await executor.execute(proposalId);
    await expect(executor.connect(deployer).cancel(proposalId)).to.be.revertedWith(
      "OmnichainGovernanceExecutor::cancel: cannot cancel executed proposal",
    );
  });
  it("Proposal fails if any number of commands fail on destination", async function () {
    ++proposalId;
    const calldata = ethers.utils.defaultAbiCoder.encode(["uint256", "uint256"], [delay, delay - 20]);
    Payload = makePayload(
      [NormalTimelock.address, FasttrackTimelock.address],
      [0.0],
      ["setDelay(uint256)", "setDelay(uint256)"],
      [calldata],
      proposalId,
      proposalType,
    );
    await sender.connect(alice).execute(remoteChainId, Payload, adapterParams, {
      value: ethers.utils.parseEther((nativeFee / 1e18 + 0.00001).toString()),
    });
    expect((await executor.proposals(proposalId))[0]).to.not.equals(proposalId);
  });
  it("Reverts when daily limit of sending transaction reached", async function () {
    maxDailyTransactionLimit = 0;
    await sender.connect(alice).setMaxDailyLimit(remoteChainId, maxDailyTransactionLimit);
    ++proposalId;
    Payload = makePayload(
      [NormalTimelock.address],
      values,
      ["setDelay(uint256)"],
      [calldata],
      proposalId,
      proposalType,
    );
    await expect(
      sender.connect(alice).execute(remoteChainId, Payload, adapterParams, {
        value: ethers.utils.parseEther((nativeFee / 1e18 + 0.00001).toString()),
      }),
    ).to.be.revertedWith("Daily Transaction Limit Exceeded");
  });
  it("Proposal failed when receiving limit reached", async function () {
    maxDailyTransactionLimit = 100;
    await sender.connect(alice).setMaxDailyLimit(remoteChainId, maxDailyTransactionLimit);
    maxDailyReceiveLimit = 0;
    const data = executor.interface.encodeFunctionData("setMaxDailyReceiveLimit", [localChainId, maxDailyReceiveLimit]);
    await alice.sendTransaction({
      to: executorOwner.address,
      data: data,
    });
    ++proposalId;
    Payload = makePayload(
      [NormalTimelock.address],
      values,
      ["setDelay(uint256)"],
      [calldata],
      proposalId,
      proposalType,
    );

    await sender.connect(alice).execute(remoteChainId, Payload, adapterParams, {
      value: ethers.utils.parseEther((nativeFee / 1e18 + 0.00001).toString()),
    });

    expect((await executor.proposals(proposalId))[0]).to.not.equals(proposalId);
  });
});
