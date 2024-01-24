import { mine } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers, network, upgrades } from "hardhat";
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
  let makePayload;
  const delay = 3600;
  const values = [0];
  const proposalType = 0;
  const calldata = ethers.utils.defaultAbiCoder.encode(["uint256"], [delay]);
  let nativeFee;

  let signer1: SignerWithAddress,
    signer2: SignerWithAddress,
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

  async function storePayload(payload, adapterParams) {
    await expect(
      sender.connect(signer1).execute(remoteChainId, payload, adapterParams, {
        value: nativeFee,
      }),
    ).to.emit(sender, "StorePayload");
    const nonce = await sender.proposalCount();
    expect(await sender.storedExecutionHashes(nonce)).to.not.equals(ethers.constants.HashZero);
  }

  async function payloadWithId(payload) {
    const proposalId = await sender.proposalCount();
    const payloadWithIdEncoded = ethers.utils.defaultAbiCoder.encode(["bytes", "uint256"], [payload, proposalId]);
    return payloadWithIdEncoded;
  }

  async function getPayload(normalTimelockAddress) {
    const payload = await makePayload([normalTimelockAddress], values, ["setDelay(uint256)"], [calldata], proposalType);
    return payload;
  }

  async function getLastRemoteProposalId() {
    return await executor.lastProposalReceived();
  }

  async function getLastSourceProposalId() {
    return await sender.proposalCount();
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
    const activeArray = new Array(functionregistry.length).fill(true);
    await executorOwner.upsertSignature(functionregistry, activeArray);
  }

  before(async function () {
    deployer = (await ethers.getSigners())[0];
    signer1 = (await ethers.getSigners())[1];
    signer2 = (await ethers.getSigners())[2];

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

    makePayload = async (targets, values, signatures, calldatas, proposalType) => {
      const payload = ethers.utils.defaultAbiCoder.encode(
        ["address[]", "uint256[]", "string[]", "bytes[]", "uint8"],
        [targets, values, signatures, calldatas, proposalType],
      );
      return payload;
    };

    executor = await OmnichainGovernanceExecutor.deploy(remoteEndpoint.address, deployer.address);

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
      .giveCallPermission(sender.address, "execute(uint16,bytes,bytes)", signer1.address);
    await tx.wait();

    tx = await accessControlManager
      .connect(deployer)
      .giveCallPermission(sender.address, "updateValidChainId(uint16,bool)", signer1.address);
    await tx.wait();

    tx = await accessControlManager
      .connect(deployer)
      .giveCallPermission(executorOwner.address, "setTrustedRemoteAddress(uint16,bytes)", signer1.address);
    await tx.wait();

    tx = await accessControlManager
      .connect(deployer)
      .giveCallPermission(executorOwner.address, "setMaxDailyReceiveLimit(uint16,uint256)", signer1.address);
    await tx.wait();

    tx = await accessControlManager
      .connect(deployer)
      .giveCallPermission(executorOwner.address, "addTimelocks(address[])", signer1.address);
    await tx.wait();

    tx = await executor.transferOwnership(executorOwner.address);
    await tx.wait();

    remotePath = ethers.utils.solidityPack(["address"], [executor.address]);
    localPath = ethers.utils.solidityPack(["address"], [sender.address]);
    nativeFee = (await localEndpoint.estimateFees(remoteChainId, executor.address, "0x", false, adapterParams))
      .nativeFee;
  });

  it("Reverts if EOA called owner function of bridge", async function () {
    await expect(sender.connect(signer2).setTrustedRemoteAddress(remoteChainId, remotePath)).to.be.revertedWith(
      "access denied",
    );
  });

  it("Reverts if EOA call execute() without grant permission", async function () {
    const payload = await makePayload(
      [NormalTimelock.address],
      values,
      ["setDelay(uint256)"],
      [calldata],
      proposalType,
    );
    await expect(sender.connect(signer2).execute(remoteChainId, payload, "0x")).to.be.revertedWith("access denied");
  });

  it("Reverts when zero value passed", async function () {
    const payload = await makePayload(
      [NormalTimelock.address],
      values,
      ["setDelay(uint256)"],
      [calldata],
      proposalType,
    );
    await expect(sender.connect(signer1).execute(remoteChainId, payload, "0x")).to.be.revertedWith(
      "OmnichainProposalSender: value cannot be zero",
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
    await expect(
      sender.connect(signer1).execute(remoteChainId, payload, "0x", {
        value: ethers.utils.parseEther((nativeFee / 1e18 + 0.00001).toString()),
      }),
    ).to.be.revertedWith("OmnichainProposalSender: destination chain is not a trusted source");
  });

  it("Emit SetTrustedRemoteAddress event", async function () {
    expect(await sender.connect(signer1).setTrustedRemoteAddress(remoteChainId, remotePath))
      .to.emit(sender, "SetTrustedRemoteAddress")
      .withArgs(remoteChainId, remotePath);
    const remoteAndLocal = ethers.utils.solidityPack(["address", "address"], [executor.address, sender.address]);
    expect(await sender.trustedRemoteLookup(remoteChainId)).to.be.equals(remoteAndLocal);
  });

  it("Reverts with Daily Transaction Limit Exceed", async function () {
    const payload = await makePayload(
      [NormalTimelock.address],
      values,
      ["setDelay(uint256)"],
      [calldata],
      proposalType,
    );
    await expect(
      sender.connect(signer1).execute(remoteChainId, payload, "0x", {
        value: ethers.utils.parseEther((nativeFee / 1e18 + 0.00001).toString()),
      }),
    ).to.be.revertedWith("Daily Transaction Limit Exceeded");
  });

  it("Reverts if EOA call setMaxDailyLimit() without grant permisssion", async function () {
    await expect(sender.connect(signer2).setMaxDailyLimit(remoteChainId, maxDailyTransactionLimit)).to.be.revertedWith(
      "access denied",
    );
  });

  it("Set daily transaction limit and emit SetMaxDailyLimit event", async function () {
    expect(await sender.connect(signer1).setMaxDailyLimit(remoteChainId, maxDailyTransactionLimit))
      .to.emit(sender, "SetMaxDailyLimit")
      .withArgs(0, maxDailyTransactionLimit);
    expect(await sender.connect(signer1).chainIdToMaxDailyLimit(remoteChainId)).to.be.equals(maxDailyTransactionLimit);
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
      executorOwner.connect(signer2).upsertSignature(["setTrustedRemoteAddress(uint16,bytes"], [true]),
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("Function registry should not emit event if nonexistant function is removed", async function () {
    updateFunctionRegistry(executorOwner);
    expect(
      await executorOwner.connect(deployer).upsertSignature(["setTrustedRemoteAddress(uint16,bytes)"], [true]),
    ).to.not.emit(executorOwner, "FunctionRegistryChanged");
  });

  it("Function registry should be updated", async function () {
    updateFunctionRegistry(executorOwner);
    expect(await executorOwner.connect(deployer).upsertSignature(["setTrustedRemoteAddress(uint16,bytes)"], [true]))
      .to.emit(executorOwner, "FunctionRegistryChanged")
      .withArgs("setTrustedRemoteAddress(uint16,bytes)", true);
  });

  it("Function registry should not emit event if function is added twice", async function () {
    updateFunctionRegistry(executorOwner);
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
      await signer1.sendTransaction({
        to: executorOwner.address,
        data: data,
      }),
    ).to.emit(executor, "TimelocksAdded");
  });

  it("Emit SetTrustedRemoteAddress event", async function () {
    const data = executor.interface.encodeFunctionData("setTrustedRemoteAddress", [localChainId, localPath]);
    await expect(
      await signer1.sendTransaction({
        to: executorOwner.address,
        data: data,
      }),
    ).to.emit(executor, "SetTrustedRemoteAddress");
  });

  it("Set max daily receive limit", async function () {
    const data = executor.interface.encodeFunctionData("setMaxDailyReceiveLimit", [localChainId, maxDailyReceiveLimit]);
    await expect(
      await signer1.sendTransaction({
        to: executorOwner.address,
        data: data,
      }),
    ).to.emit(executor, "SetMaxDailyReceiveLimit");
  });

  it("Emit ExecuteRemoteProposal event", async function () {
    const payload = await makePayload(
      [NormalTimelock.address],
      values,
      ["setDelay(uint256)"],
      [calldata],
      proposalType,
    );
    await expect(
      await sender.connect(signer1).execute(remoteChainId, payload, adapterParams, {
        value: ethers.utils.parseEther((nativeFee / 1e18 + 0.00001).toString()),
      }),
    ).to.emit(sender, "ExecuteRemoteProposal");
  });

  it("Proposal should be update on remote", async function () {
    expect((await executor.proposals(0))[0]).to.equals(0);
  });

  it("Emit ProposalExecuted event", async function () {
    await mine(4500);
    const proposalId = await getLastRemoteProposalId();
    await expect(executor.execute(proposalId)).to.emit(executor, "ProposalExecuted").withArgs(proposalId);
  });

  it("Should update delay of timelock", async function () {
    expect(await NormalTimelock.delay()).to.equals(delay);
  });

  it("Revert if empty proposal", async function () {
    await expect(
      sender.connect(signer1).execute(remoteChainId, "0x", adapterParams, {
        value: ethers.utils.parseEther((nativeFee / 1e18 + 0.00001).toString()),
      }),
    ).to.be.revertedWith("OmnichainProposalSender: Empty payload");
  });

  it("Revert if same proposal come twice", async function () {
    const payload = await makePayload(
      [NormalTimelock.address],
      values,
      ["setDelay(uint256)"],
      [calldata],
      proposalType,
    );

    await sender.connect(signer1).execute(remoteChainId, payload, adapterParams, {
      value: ethers.utils.parseEther((nativeFee / 1e18 + 0.00001).toString()),
    });
    await network.provider.send("evm_setAutomine", [false]);
    const tx = await sender.connect(signer1).execute(remoteChainId, payload, adapterParams, {
      value: ethers.utils.parseEther((nativeFee / 1e18 + 0.00001).toString()),
    });
    await network.provider.send("evm_mine");
    expect(tx).to.be.revertedWith("Multiple bridging in a proposal");
    await network.provider.send("evm_setAutomine", [true]);
  });

  it("Reverts when other than guardian call cancel of executor", async function () {
    const payload = await makePayload(
      [NormalTimelock.address],
      values,
      ["setDelay(uint256)"],
      [calldata],
      proposalType,
    );
    await sender.connect(signer1).execute(remoteChainId, payload, adapterParams, {
      value: ethers.utils.parseEther((nativeFee / 1e18 + 0.00001).toString()),
    });
    const proposalId = await getLastRemoteProposalId();
    await expect(executor.connect(signer1).cancel(proposalId)).to.be.revertedWith(
      "OmnichainGovernanceExecutor::cancel: sender must be guardian",
    );
  });

  it("Revert if proposal is not queued", async function () {
    const proposalId = await getLastRemoteProposalId();
    expect(await executor.connect(deployer).cancel(proposalId)).to.be.revertedWith("proposal not queued");
  });

  it("Emit ProposalCanceled event when proposal gets cancelled", async function () {
    const payload = await makePayload(
      [NormalTimelock.address],
      values,
      ["setDelay(uint256)"],
      [calldata],
      proposalType,
    );

    await sender.connect(signer1).execute(remoteChainId, payload, adapterParams, {
      value: ethers.utils.parseEther((nativeFee / 1e18 + 0.00001).toString()),
    });
    const proposalId = await getLastRemoteProposalId();
    expect(await executor.connect(deployer).cancel(proposalId))
      .to.emit(executor, "ProposalCanceled")
      .withArgs(proposalId);
  });

  it("Reverts when cancel is called after execute", async function () {
    const payload = await makePayload(
      [NormalTimelock.address],
      values,
      ["setDelay(uint256)"],
      [calldata],
      proposalType,
    );
    await sender.connect(signer1).execute(remoteChainId, payload, adapterParams, {
      value: ethers.utils.parseEther((nativeFee / 1e18 + 0.00001).toString()),
    });
    mine(4500);
    const proposalId = await getLastRemoteProposalId();
    await executor.execute(proposalId);
    await expect(executor.connect(deployer).cancel(proposalId)).to.be.revertedWith(
      "OmnichainGovernanceExecutor::cancel: cannot cancel executed proposal",
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
    await sender.connect(signer1).execute(remoteChainId, payload, adapterParams, {
      value: ethers.utils.parseEther((nativeFee / 1e18 + 0.00001).toString()),
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
      [calldata],
      proposalType,
    );
    await expect(
      sender.connect(signer1).execute(remoteChainId, payload, adapterParams, {
        value: ethers.utils.parseEther((nativeFee / 1e18 + 0.00001).toString()),
      }),
    ).to.be.revertedWith("OmnichainProposalSender: proposal function information arity mismatch");
  });
  it("Refund stucked gas in contract, to given address", async function () {
    // Failed due to minDest is 0
    const adapterParams = ethers.utils.solidityPack(["uint16", "uint256"], [remoteChainId, 0]);
    const payload = await getPayload(NormalTimelock.address);

    await storePayload(payload, adapterParams);

    const balanceBefore = await ethers.provider.getBalance(signer2.address);
    const nonce = await sender.proposalCount();

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

    const nonce = await sender.proposalCount();

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
    ).to.be.revertedWith("OmnichainProposalSender: Empty payload");
  });

  it("Reverts when value exceeds contract's balance in fallback withdraw", async function () {
    const adapterParams = ethers.utils.solidityPack(["uint16", "uint256"], [remoteChainId, 0]);
    const payload = await getPayload(NormalTimelock.address);

    await storePayload(payload, adapterParams);

    const nonce = await sender.proposalCount();

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

    const nonce = await sender.proposalCount();

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

    const nonce = await sender.proposalCount();

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
    const nonce = await sender.proposalCount();

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

    const nonce = await sender.proposalCount();

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
    ).to.be.revertedWith("OmnichainProposalSender: Empty payload");
  });

  it("Reverts when different parameters passed in fallback withdraw", async function () {
    const adapterParams = ethers.utils.solidityPack(["uint16", "uint256"], [remoteChainId, 0]);
    const payload = await getPayload(NormalTimelock.address);

    await storePayload(payload, adapterParams);

    const nonce = await sender.proposalCount();

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

    const nonce = await sender.proposalCount();

    // Passed address has no receive method
    await expect(
      sender.fallbackWithdraw(sender.address, nonce, remoteChainId, payloadWithId(payload), adapterParams, nativeFee),
    ).to.be.revertedWith("Call failed");
  });

  it("Reverts when daily limit of sending transaction reached", async function () {
    const maxDailyTransactionLimit = 0;
    await sender.connect(signer1).setMaxDailyLimit(remoteChainId, maxDailyTransactionLimit);
    const payload = await makePayload(
      [NormalTimelock.address],
      values,
      ["setDelay(uint256)"],
      [calldata],
      proposalType,
    );
    await expect(
      sender.connect(signer1).execute(remoteChainId, payload, adapterParams, {
        value: ethers.utils.parseEther((nativeFee / 1e18 + 0.00001).toString()),
      }),
    ).to.be.revertedWith("Daily Transaction Limit Exceeded");
  });

  it("Proposal failed when receiving limit reached", async function () {
    maxDailyTransactionLimit = 100;
    await sender.connect(signer1).setMaxDailyLimit(remoteChainId, maxDailyTransactionLimit);
    maxDailyReceiveLimit = 0;
    const data = executor.interface.encodeFunctionData("setMaxDailyReceiveLimit", [localChainId, maxDailyReceiveLimit]);
    await signer1.sendTransaction({
      to: executorOwner.address,
      data: data,
    });

    const payload = await makePayload(
      [NormalTimelock.address],
      values,
      ["setDelay(uint256)"],
      [calldata],
      proposalType,
    );

    await sender.connect(signer1).execute(remoteChainId, payload, adapterParams, {
      value: ethers.utils.parseEther((nativeFee / 1e18 + 0.00001).toString()),
    });
    const proposalIdRemote = await getLastRemoteProposalId();
    const proposalIdSource = await getLastSourceProposalId();
    expect((await executor.proposals(proposalIdRemote))[0]).to.not.equals(proposalIdSource);
  });

  it("Emit TrustedRemoteRemoved event", async function () {
    expect(await sender.removeTrustedRemote(remoteChainId))
      .to.emit(sender, "TrustedRemoteRemoved")
      .withArgs(remoteChainId);
  });
});
