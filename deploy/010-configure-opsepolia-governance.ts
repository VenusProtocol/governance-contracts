import { ethers, network } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { ACMCommandsAggregator } from "typechain";

import { SUPPORTED_NETWORKS } from "../helpers/deploy/constants";
import { guardian } from "../helpers/deploy/deploymentUtils";

const functionSignatures = {
  normal: [
    "setSendVersion(uint16)",
    "setReceiveVersion(uint16)",
    "setMaxDailyReceiveLimit(uint256)",
    "pause()",
    "setPrecrime(address)",
    "setMinDstGas(uint16,uint16,uint256)",
    "setPayloadSizeLimit(uint16,uint256)",
    "setConfig(uint16,uint16,uint256,bytes)",
    "addTimelocks(address[])",
    "setTrustedRemoteAddress(uint16,bytes)",
    "setTimelockPendingAdmin(address,uint8)",
    "retryMessage(uint16,bytes,uint64,bytes)",
    "setGuardian(address)",
    "setSrcChainId(uint16)",
    "transferBridgeOwnership(address)",
  ],
  fasttrack: [
    "setReceiveVersion(uint16)",
    "setMaxDailyReceiveLimit(uint256)",
    "pause()",
    "setConfig(uint16,uint16,uint256,bytes)",
    "addTimelocks(address[])",
    "retryMessage(uint16,bytes,uint64,bytes)",
  ],
  critical: [
    "setReceiveVersion(uint16)",
    "setMaxDailyReceiveLimit(uint256)",
    "pause()",
    "setConfig(uint16,uint16,uint256,bytes)",
    "addTimelocks(address[])",
    "retryMessage(uint16,bytes,uint64,bytes)",
  ],
  guardian: [
    "setReceiveVersion(uint16)",
    "forceResumeReceive(uint16,bytes)",
    "setMaxDailyReceiveLimit(uint256)",
    "pause()",
    "unpause()",
    "setConfig(uint16,uint16,uint256,bytes)",
    "addTimelocks(address[])",
    "setTrustedRemoteAddress(uint16,bytes)",
    "setTimelockPendingAdmin(address,uint8)",
    "retryMessage(uint16,bytes,uint64,bytes)",
    "setSrcChainId(uint16)",
    "transferBridgeOwnership(address)",
  ],
};

const grantPermissions = (
  OMNICHAIN_EXECUTOR_OWNER: string,
  functionSigs: string[],
  account: string,
): ACMCommandsAggregator.PermissionStruct[] =>
  functionSigs.map(functionSig => ({
    contractAddress: OMNICHAIN_EXECUTOR_OWNER,
    functionSig: functionSig,
    account: account,
  }));

const func: DeployFunction = async function () {
  const NORMAL_TIMELOCK = await ethers.getContract("NormalTimelock");
  const FASTTRACK_TIMELOCK = await ethers.getContract("FastTrackTimelock");
  const CRITICAL_TIMELOCK = await ethers.getContract("CriticalTimelock");
  const OMNICHAIN_EXECUTOR_OWNER = await ethers.getContract("OmnichainExecutorOwner");
  const GUARDIAN = await guardian(network.name as SUPPORTED_NETWORKS);
  const acmCommandsAggregator: ACMCommandsAggregator = await ethers.getContract("ACMCommandsAggregator");

  // Grant permissions for each category
  const normalGrantPermissions = grantPermissions(
    OMNICHAIN_EXECUTOR_OWNER.address,
    functionSignatures.normal,
    NORMAL_TIMELOCK.address,
  );
  const fasttrackGrantPermissions = grantPermissions(
    OMNICHAIN_EXECUTOR_OWNER.address,
    functionSignatures.fasttrack,
    FASTTRACK_TIMELOCK.address,
  );
  const criticalGrantPermissions = grantPermissions(
    OMNICHAIN_EXECUTOR_OWNER.address,
    functionSignatures.critical,
    CRITICAL_TIMELOCK.address,
  );
  const guardianGrantPermissions = grantPermissions(
    OMNICHAIN_EXECUTOR_OWNER.address,
    functionSignatures.guardian,
    GUARDIAN,
  );

  const allGrantPermissions: ACMCommandsAggregator.PermissionStruct[] = [
    ...normalGrantPermissions,
    ...fasttrackGrantPermissions,
    ...criticalGrantPermissions,
    ...guardianGrantPermissions,
  ];

  try {
    const tx = await acmCommandsAggregator.addGrantPermissions(allGrantPermissions);

    const receipt = await tx.wait();
    const events = receipt.events?.filter(event => event.event === "GrantPermissionsAdded");
    console.log("Grant Permissions for OP added with indexes: ", events?.[0].args?.index.toString());
  } catch (error) {
    console.error("Error adding grant permissions:", error);
  }
};
func.tags = ["op-permissions"];

func.skip = async (hre: HardhatRuntimeEnvironment) =>
  hre.network.name != "opsepolia" && hre.network.name != "opmainnet";

export default func;
