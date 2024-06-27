import { Contract, EventFilter } from "ethers";
import * as fs from "fs";
import { ethers } from "hardhat";
import hre from "hardhat";
import inquirer from "inquirer";
import path from "path";

import { SUPPORTED_NETWORKS } from "../helpers/deploy/constants";

require("dotenv").config();

const startingBlockForACM: Record<string, number> = {
  bscmainnet: 21968139,
  bsctestnet: 26711168,
  ethereum: 18641314,
  sepolia: 4204345,
  opbnbmainnet: 10895878,
  opbnbtestnet: 14542763,
  arbitrumone: 201597544,
  arbitrumsepolia: 25350320,
};
type Event = {
  args: {
    account: string;
    contractAddress: string;
    functionSig: string;
  };
  blockNumber: number;
};

const network = hre.network.name as SUPPORTED_NETWORKS;

if (network === "bscmainnet") {
  inquirer
    .prompt([
      {
        name: "functionSignatureFile",
        message: "Please enter path of the .json file containing contract addresses and function signatures",
        default: "./BNBPermissions.json",
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
    .then((answers: { startBlock: string; endBlock: string; functionSignatureFile: string }) => {
      const startingBlock = parseInt(answers.startBlock, 10);
      const endingBlock = parseInt(answers.endBlock, 10);
      getACMPermissionsOnBNB(answers.functionSignatureFile, startingBlock, endingBlock);
    });
} else {
  inquirer
    .prompt([
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
    .then((answers: { startBlock: string; endBlock: string }) => {
      const startingBlock = parseInt(answers.startBlock, 10);
      const endingBlock = parseInt(answers.endBlock, 10);
      getACMPermission(network, startingBlock, endingBlock);
    });
}

async function getACMPermission(network: string, startBlock: number, endBlock: number) {
  try {
    const acm = await ethers.getContract("AccessControlManager");
    let eventFilter = acm.filters.PermissionGranted();
    const permissionGrantedEvents = await getPastEvents(acm, network, startBlock, endBlock, eventFilter);
    eventFilter = acm.filters.PermissionRevoked();
    const permissionsRevokeEvents = await getPastEvents(acm, network, startBlock, endBlock, eventFilter);
    const events = getActualPermissions(permissionGrantedEvents, permissionsRevokeEvents);

    updatePermissionFile(events, network);
  } catch (err) {
    console.log(err);
  }
}
function getActualPermissions(grantedEvents: Event[], revokedEvents: Event[]): Event[] {
  const permissionMap = new Map<string, Event>();

  grantedEvents.forEach(event => {
    const key = `${event.args.account}-${event.args.contractAddress}-${event.args.functionSig}`;
    permissionMap.set(key, event);
  });

  revokedEvents.forEach(event => {
    const key = `${event.args.account}-${event.args.contractAddress}-${event.args.functionSig}`;
    permissionMap.delete(key);
  });

  return Array.from(permissionMap.values());
}

async function getACMPermissionsOnBNB(inputPath: string, startBlock: number, endBlock: number) {
  const filePath = path.join(__dirname, inputPath);
  if (!isValidJson(filePath)) {
    throw new Error("Invalid Json");
  }

  const roleHashTable = getRoleHashTable(filePath);
  try {
    const acm = await ethers.getContract("AccessControlManager");
    const modifiedEvent: Event[] = [];
    const eventFilter = acm.filters.RoleGranted();
    const events = await getPastEvents(acm, network, startBlock, endBlock, eventFilter);
    let contractAddress: string;
    let functionSig: string;

    events.forEach(event => {
      let authorisedAddress = event.args.account;
      let role = event.args.role;
      if (roleHashTable[role] !== undefined) {
        contractAddress = roleHashTable[role].address;
        functionSig = roleHashTable[role].functionSig;
      }
      modifiedEvent.push({
        args: {
          account: authorisedAddress,
          contractAddress: contractAddress,
          functionSig: functionSig,
        },
        blockNumber: event.blockNumber,
      });
    });
    updatePermissionFile(modifiedEvent, network);
  } catch (err) {
    console.log(err);
  }
}

async function getPastEvents(
  contract: Contract,
  network: string,
  startBlock: number,
  endBlock: number,
  eventFilter: EventFilter,
) {
  const fromBlock = startBlock ? startBlock : startingBlockForACM[network];
  const toBlock = endBlock ? endBlock : await contract.provider.getBlockNumber();
  const chunkSize = 40000;
  const MAX_RETRIES = 3;
  const BASE_DELAY = 1000;
  const events: any[] = [];
  let start = fromBlock;

  while (start <= toBlock) {
    const endBlock = Math.min(start + chunkSize - 1, toBlock);
    const chunkEvents = await fetchWithExponentialBackoff(
      () => contract.queryFilter(eventFilter, startBlock, endBlock),
      MAX_RETRIES,
      BASE_DELAY,
    );
    events.push(...chunkEvents);
    console.log(`Fetched events from block ${start} to ${endBlock}`);
    start = endBlock + 1;
  }
  return events;
}

function updatePermissionFile(events: Event[], network: string) {
  const data = events.map(event => {
    return {
      account: event.args.account,
      contractAddress: event.args.contractAddress,
      functionSig: event.args.functionSig,
      blockNumber: event.blockNumber,
    };
  });

  const fileName = `${network}_permissions.md`;
  let markdownContent = data
    .map(
      entry => `
        - Account: ${entry.account}
        - Contract Address: ${entry.contractAddress}
        - Function Signature: ${entry.functionSig}
        - Block Number: ${entry.blockNumber}
            `,
    )
    .join("\n");

  fs.writeFileSync(fileName, markdownContent, "utf8");
  console.log(`File ${fileName} has been saved!`);
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getRoleHashTable(filePath: string): Record<string, { address: string; functionSig: string }> {
  const jsonData = fs.readFileSync(filePath, "utf8");
  const data = JSON.parse(jsonData);

  const hashTable: Record<string, { address: string; functionSig: string }> = {};

  for (const contract of data.contracts) {
    for (const address of contract.address) {
      for (const funcSig of contract.functions) {
        const role = ethers.utils.solidityPack(["address", "string"], [address, funcSig]);
        const roleHash = ethers.utils.keccak256(role);
        hashTable[roleHash] = {
          address: contract.address,
          functionSig: funcSig,
        };
      }
    }
  }
  return hashTable;
}

function isValidJson(filePath: string) {
  const jsonData = fs.readFileSync(filePath, "utf8");
  const data = JSON.parse(jsonData);
  if (typeof data !== "object" || data === null || !Array.isArray(data.contracts)) {
    return false;
  }
  for (const contract of data.contracts) {
    if (typeof contract !== "object" || contract === null) {
      return false;
    }
    if (!Array.isArray(contract.address) || !Array.isArray(contract.functions)) {
      return false;
    }
    if (!contract.address.every((addr: any) => typeof addr === "string" && addr.length === 42)) {
      return false;
    }
    if (!contract.functions.every((func: any) => typeof func === "string" && func === func.trim())) {
      return false;
    }
  }
  return true;
}

async function fetchWithExponentialBackoff(
  fetchFunction: () => Promise<any>,
  retries: number,
  baseDelay: number,
): Promise<any> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fetchFunction();
    } catch (error) {
      if (attempt < retries - 1) {
        const delayTime = baseDelay * Math.pow(2, attempt);
        console.warn(`Attempt ${attempt + 1} failed. Retrying in ${delayTime}ms...`);
        await delay(delayTime);
      } else {
        throw error;
      }
    }
  }
}
