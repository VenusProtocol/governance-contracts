import hre from "hardhat";
import inquirer from "inquirer";

import { SUPPORTED_NETWORKS } from "../../helpers/deploy/constants";
import { PermissionFetcher } from "./PermissionFetcher";
import { startingBlockForACM } from "./config";

const network = hre.network.name as SUPPORTED_NETWORKS;

inquirer
  .prompt([
    {
      name: "BNBFunctionSignatureFile",
      message:
        "Please enter path of the .json file containing contract addresses and function signatures of BNB mainnet {optional}",
      default: "./networks/bscmainnet/BNBPermissions.json",
    },
    {
      name: "startBlock",
      message: "Please enter starting block of given network from which you want the logs {optional}",
      default: startingBlockForACM[network],
    },
    {
      name: "endBlock",
      message: "Please enter ending block of given network till which you want the logs {optional}",
      default: "latest",
    },
  ])
  .then((answers: { startBlock: string; endBlock: string; BNBFunctionSignatureFile: string }) => {
    const startingBlock = parseInt(answers.startBlock, 10);
    const endingBlock = parseInt(answers.endBlock, 10);
    const permissionFetcher = new PermissionFetcher(network, [], answers.BNBFunctionSignatureFile );
    permissionFetcher.getPastEvents(startingBlock, endingBlock);
  });
