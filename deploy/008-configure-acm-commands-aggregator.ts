import { ethers } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { ACMCommandsAggregator } from "typechain";

enum PermissionType {
  Give = 0,
  Revoke = 1,
}

enum AccountType {
  NORMAL_TIMELOCK = "NormalTimelock",
  FAST_TRACK_TIMELOCK = "FastTrackTimelock",
  CRITICAL_TIMELOCK = "CriticalTimelock",
}

interface Permissions {
  [key: string]: ACMCommandsAggregator.PermissionStruct[];
}

const permissions: Permissions = {
  sepolia: [
    {
      permissionType: PermissionType.Give,
      contractAddress: ethers.constants.AddressZero,
      functionSig: "updateJumpRateModel(uint256,uint256,uint256,uint256)",
      account: AccountType.NORMAL_TIMELOCK,
    },
  ],
};

function splitPermissions(
  array: ACMCommandsAggregator.PermissionStruct[],
  chunkSize: number = 100,
): ACMCommandsAggregator.PermissionStruct[][] {
  const result: ACMCommandsAggregator.PermissionStruct[][] = [];

  for (let i = 0; i < array.length; i += chunkSize) {
    const chunk = array.slice(i, i + chunkSize);
    result.push(chunk);
  }

  return result;
}

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const acmCommandsAggregator: ACMCommandsAggregator = await ethers.getContract("ACMCommandsAggregator");
  const networkPermissions = permissions[hre.network.name];

  for (const permission of networkPermissions) {
    const timelock = await ethers.getContract(permission.account as string);
    permission.account = timelock.address;
    permission.account = ethers.constants.AddressZero;
  }

  const chunks = splitPermissions(networkPermissions);
  const indexes: string[] = [];

  for (const chunk of chunks) {
    const tx = await acmCommandsAggregator.addPermissions(chunk);

    const receipt = await tx.wait();
    const events = receipt.events?.filter(event => event.event === "PermissionsAdded");
    indexes.push(events?.[0].args?.index.toString());
  }

  console.log("Permissions added with indexes: ", indexes.toString());
};

func.tags = ["ACMCommandsAggregatorConfigure", "ACMCommandsAggregatorTest"];

func.skip = async (hre: HardhatRuntimeEnvironment) => Object.keys(permissions).indexOf(hre.network.name) === -1;
export default func;
