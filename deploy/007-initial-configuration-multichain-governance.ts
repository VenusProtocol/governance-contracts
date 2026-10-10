import { ethers, network } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { SUPPORTED_NETWORKS } from "../helpers/deploy/constants";
import { addPermissionBatches, guardian, requireAuthorizedBatcher } from "../helpers/deploy/deploymentUtils";

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

const grantPermissions = (OMNICHAIN_EXECUTOR_OWNER: string, functionSigs: string[], account: string): string[][] =>
  functionSigs.map(functionSig => [OMNICHAIN_EXECUTOR_OWNER, functionSig, account]);

const func: DeployFunction = async function () {
  await requireAuthorizedBatcher();

  const NORMAL_TIMELOCK = await ethers.getContract("NormalTimelock");
  const FASTTRACK_TIMELOCK = await ethers.getContract("FastTrackTimelock");
  const CRITICAL_TIMELOCK = await ethers.getContract("CriticalTimelock");
  const OMNICHAIN_EXECUTOR_OWNER = await ethers.getContract("OmnichainExecutorOwner");
  const GUARDIAN = await guardian(network.name as SUPPORTED_NETWORKS);

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

  const allGrantPermissions: string[][] = [
    ...normalGrantPermissions,
    ...fasttrackGrantPermissions,
    ...criticalGrantPermissions,
    ...guardianGrantPermissions,
  ];

  try {
    const indexes = await addPermissionBatches(allGrantPermissions, "grant");
    console.log(`Grant Permissions for ${network.name} added with indexes: `, indexes.toString());
  } catch (error) {
    console.error("Error adding grant permissions:", error);
  }
};
func.tags = ["multichain-governance-permissions"];
func.dependencies = ["AuxiliaryCommandsAggregator"];

func.skip = async (hre: HardhatRuntimeEnvironment) =>
  hre.network.name === "bsctestnet" ||
  hre.network.name === "bscmainnet" ||
  !(await hre.deployments.getOrNull("AuxiliaryCommandsAggregator"));

export default func;
