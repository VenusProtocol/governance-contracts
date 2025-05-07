import { ethers } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { ACMCommandsAggregator } from "typechain";

import { UNICHAINSEPOLIA_CONVERTER_NETWORK, UNICHAINSEPOLIA_XVS_VAULT_TREASURY } from "../helpers/Addresses";
import {
  getConverterNetworkPermissions,
  getConverterPermissions,
  getXVSVaultTreasuryPermissions,
} from "../helpers/permissions";

const grantPermissions = [
  ...getConverterNetworkPermissions(UNICHAINSEPOLIA_CONVERTER_NETWORK),
  ...getConverterPermissions(),
  ...getXVSVaultTreasuryPermissions(UNICHAINSEPOLIA_XVS_VAULT_TREASURY),
];
export enum AccountType {
  NORMAL_TIMELOCK = "NormalTimelock",
  FAST_TRACK_TIMELOCK = "FastTrackTimelock",
  CRITICAL_TIMELOCK = "CriticalTimelock",
}
const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const acmCommandsAggregator: ACMCommandsAggregator = await ethers.getContract("ACMCommandsAggregator");
  for (const permission of grantPermissions) {
    if (Object.values(AccountType).includes(permission[2] as AccountType)) {
      const timelock = await ethers.getContract(permission[2]);
      permission[2] = timelock.address;
    }
  }
  const _grantPermissions: ACMCommandsAggregator.PermissionStruct[] = grantPermissions.map(permission => ({
    contractAddress: permission[0],
    functionSig: permission[1],
    account: permission[2],
  }));

  try {
    // Add grant permissions
    const tx = await acmCommandsAggregator.addGrantPermissions(_grantPermissions);
    const receipt = await tx.wait();
    const events = receipt.events?.filter(event => event.event === "GrantPermissionsAdded");
    console.log(`Grant Permissions for ${hre.network.name} added with indexes:`, events?.[0].args?.index.toString());
  } catch (error) {
    console.error("Error adding permissions:", error);
  }
};

func.tags = ["converter-permissions"];

func.skip = async (hre: HardhatRuntimeEnvironment) => hre.network.name === "hardhat";

export default func;
