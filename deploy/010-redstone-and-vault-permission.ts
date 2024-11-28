import { ethers } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { ACMCommandsAggregator } from "typechain";

import {
  ARBITRUMONE_GUARDIAN,
  ARBITRUMONE_REDSTONE_ORACLE,
  ARBITRUMONE_XVS_VAULT_PROXY,
  ARBITRUMSEPOLIA_GUARDIAN,
  ARBITRUMSEPOLIA_REDSTONE_ORACLE,
  ARBITRUMSEPOLIA_XVS_VAULT_PROXY,
  ETHEREUM_GUARDIAN,
  ETHEREUM_REDSTONE_ORACLE,
  ETHEREUM_XVS_VAULT_PROXY,
  OPBNBMAINNET_GUARDIAN,
  OPBNBMAINNET_XVS_VAULT_PROXY,
  OPBNBTESTNET_GUARDIAN,
  OPBNBTESTNET_XVS_VAULT_PROXY,
  SEPOLIA_GUARDIAN,
  SEPOLIA_REDSTONE_ORACLE,
  SEPOLIA_XVS_VAULT_PROXY,
} from "../helpers/Addresses";
import { getRedstoneOraclePermissionsRevokedPreviously, getXVSVaultRevokePermissions } from "../helpers/permissions";

interface Permissions {
  [key: string]: string[][];
}
const BSCMAINNET_REDSTONE_ORACLE = "0x8455EFA4D7Ff63b8BFD96AdD889483Ea7d39B70a";
const BSCTESTNET_REDSTONE_ORACLE = "0x0Af51d1504ac5B711A9EAFe2fAC11A51d32029Ad";

const BSCMAINNET_GUARDIAN = "0x3a3284dC0FaFfb0b5F0d074c4C704D14326C98cF";
const BSCTESTNET_GUARDIAN = "0x2Ce1d0ffD7E869D9DF33e28552b12DdDed326706";

const grantPermissions: Permissions = {
  arbitrumone: [...getRedstoneOraclePermissionsRevokedPreviously(ARBITRUMONE_REDSTONE_ORACLE, ARBITRUMONE_GUARDIAN)],
  arbitrumsepolia: [
    ...getRedstoneOraclePermissionsRevokedPreviously(ARBITRUMSEPOLIA_REDSTONE_ORACLE, ARBITRUMSEPOLIA_GUARDIAN),
  ],
  ethereum: [...getRedstoneOraclePermissionsRevokedPreviously(ETHEREUM_REDSTONE_ORACLE, ETHEREUM_GUARDIAN)],
  sepolia: [...getRedstoneOraclePermissionsRevokedPreviously(SEPOLIA_REDSTONE_ORACLE, SEPOLIA_GUARDIAN)],
  bscmainnet: [...getRedstoneOraclePermissionsRevokedPreviously(BSCMAINNET_REDSTONE_ORACLE, BSCMAINNET_GUARDIAN)],
  bsctestnet: [...getRedstoneOraclePermissionsRevokedPreviously(BSCTESTNET_REDSTONE_ORACLE, BSCTESTNET_GUARDIAN)],
};

const revokePermissions: Permissions = {
  arbitrumone: [...getXVSVaultRevokePermissions(ARBITRUMONE_XVS_VAULT_PROXY, ARBITRUMONE_GUARDIAN)],
  arbitrumsepolia: [...getXVSVaultRevokePermissions(ARBITRUMSEPOLIA_XVS_VAULT_PROXY, ARBITRUMSEPOLIA_GUARDIAN)],
  ethereum: [...getXVSVaultRevokePermissions(ETHEREUM_XVS_VAULT_PROXY, ETHEREUM_GUARDIAN)],
  sepolia: [...getXVSVaultRevokePermissions(SEPOLIA_XVS_VAULT_PROXY, SEPOLIA_GUARDIAN)],
  opbnbmainnet: [...getXVSVaultRevokePermissions(OPBNBMAINNET_XVS_VAULT_PROXY, OPBNBMAINNET_GUARDIAN)],
  opbnbtestnet: [...getXVSVaultRevokePermissions(OPBNBTESTNET_XVS_VAULT_PROXY, OPBNBTESTNET_GUARDIAN)],
};

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const acmCommandsAggregator: ACMCommandsAggregator = await ethers.getContract("ACMCommandsAggregator");

  const _grantPermissions: ACMCommandsAggregator.PermissionStruct[] = grantPermissions[hre.network.name].map(
    permission => ({
      contractAddress: permission[0],
      functionSig: permission[1],
      account: permission[2],
    }),
  );

  const _revokePermissions: ACMCommandsAggregator.PermissionStruct[] = revokePermissions[hre.network.name].map(
    permission => ({
      contractAddress: permission[0],
      functionSig: permission[1],
      account: permission[2],
    }),
  );

  try {
    // Add grant permissions
    let tx = await acmCommandsAggregator.addGrantPermissions(_grantPermissions);
    let receipt = await tx.wait();
    let events = receipt.events?.filter(event => event.event === "GrantPermissionsAdded");
    console.log(`Grant Permissions for ${hre.network.name} added with indexes: `, events?.[0].args?.index.toString());

    // Add revoke permissions
    tx = await acmCommandsAggregator.addRevokePermissions(_revokePermissions);
    receipt = await tx.wait();
    events = receipt.events?.filter(event => event.event === "RevokePermissionsAdded");
    console.log(`Revoke Permissions for ${hre.network.name} added with indexes: `, events?.[0].args?.index.toString());
  } catch (error) {
    console.error("Error adding adding permissions:", error);
  }
};

func.tags = ["redstone-vault-permissions"];

func.skip = async (hre: HardhatRuntimeEnvironment) => hre.network.name === "hardhat";

export default func;
