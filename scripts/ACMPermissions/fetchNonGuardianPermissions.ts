import * as fs from "fs";
import hre from "hardhat";
import { Address } from "hardhat-deploy/types";
import { SUPPORTED_NETWORKS } from "helpers/deploy/constants";
import path from "path";

import { guardian } from "../../helpers/deploy/deploymentUtils";
import { addressMap } from "./config";
import { Permission } from "./types";

/**
 * Checks if a permission group includes at least one timelock but excludes the guardian.
 */
function isTimelockAndNotGuardian(addresses: string[], guardianAddress: string, network: SUPPORTED_NETWORKS): boolean {
  const TIMELOCK = ["NormalTimelock", "FastTrackTimelock", "CriticalTimelock"];
  const BSCGUARDIANS = ["Guardian 1", "Guardian 2", "Guardian 3"];
  let hasTimelock = false;
  let hasGuardian = false;

  for (const address of addresses) {
    const resolvedName = addressMap[network][address];
    if (!hasTimelock) {
      hasTimelock = TIMELOCK.includes(resolvedName);
    }
    if (!hasGuardian) {
      hasGuardian = network === "bscmainnet" ? BSCGUARDIANS.includes(resolvedName) : address === guardianAddress;
    }
    if (hasTimelock && hasGuardian) break;
  }

  return hasTimelock && !hasGuardian;
}

/**
 * Filters out permissions that involve timelocks but do not include the guardian.
 * Writes the filtered permissions to a JSON file.
 */
async function exportNonGuardianTimelockPermissions(): Promise<void> {
  try {
    const network = hre.network.name as SUPPORTED_NETWORKS;
    const guardianAddress = await guardian(network);

    const inputFilePath = path.join(__dirname, "networks", network, "permissions.json");
    const outputFilePath = path.join(__dirname, "networks", network, "nonGuardianPermissions.json");

    if (!fs.existsSync(inputFilePath)) {
      throw new Error(`Permissions file not found for network: ${network}`);
    }

    const permissionsData = fs.readFileSync(inputFilePath, "utf8");
    const parsedPermissions = JSON.parse(permissionsData);

    const filteredPermissions = parsedPermissions.permissions
      .filter((permission: Permission) => isTimelockAndNotGuardian(permission.addresses, guardianAddress, network))
      .map((permission: Permission) => {
        const addressNames = permission.addresses.map((address: Address) => addressMap[network][address] || address);
        return { ...permission, addressNames };
      });

    fs.writeFileSync(outputFilePath, JSON.stringify(filteredPermissions, null, 2));
    console.log(`Filtered permissions written to: ${outputFilePath}`);
  } catch (error) {
    console.error("Failed to export non-guardian permissions:", error);
  }
}

// Run the script
exportNonGuardianTimelockPermissions();
