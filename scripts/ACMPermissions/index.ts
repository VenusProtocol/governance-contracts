import hre from "hardhat";
import { SUPPORTED_NETWORKS } from "helpers/deploy/constants";
import inquirer from "inquirer";

import { PermissionFetcher } from "./PermissionFetcher";
import { startingBlockForACM } from "./config";

const network = hre.network.name as SUPPORTED_NETWORKS;

(async () => {
  const params: { startBlock: string; endBlock: string; BNBFunctionSignatureFile: string; chunkSize: number } =
    await inquirer.prompt([
      // [TODO]: Catch error and ask to create file if does not exist for BNB network.
      {
        name: "BNBFunctionSignatureFile",
        message:
          "Please enter path of the .json file containing contract addresses and function signatures of BNB mainnet {optional}",
        default: "scripts/ACMPermissions/networks/bscmainnet/BNBPermissions.json",
      },
      {
        name: "chunkSize",
        message:
          "Please enter the block chunk size for fetching the events. This is important as some RPCs fail to return logs for a large chunk of blocks",
        default: 40000,
      },
      {
        name: "startBlock",
        message:
          "Please enter starting block of given network from which you want the logs. Will be ignored if permissions.json is already created. Log fetching start from the previous stored block {optional}",
        default: startingBlockForACM[network],
      },
      {
        name: "endBlock",
        message: "Please enter ending block of given network till which you want the logs {optional}",
        default: "latest",
      },
    ]);

  const startingBlock = parseInt(params.startBlock, 10);
  const endingBlock = parseInt(params.endBlock, 10);

  const permissionFetcher = new PermissionFetcher(network, params.BNBFunctionSignatureFile, params.chunkSize);
  await permissionFetcher.getPastEvents(startingBlock, endingBlock);
})();
