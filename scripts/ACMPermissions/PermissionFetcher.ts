import { Contract, EventFilter } from "ethers";
import * as fs from "fs";
import { ethers } from "hardhat";
import { remove, union } from "lodash";
import path from "path";

import { startingBlockForACM } from "./config";

require("dotenv").config();

enum PermissionsEnum {
  "Granted",
  "Revoked",
}

type Snapshot = {
  permissions: Permission[];
  height: string;
};

type Permission = {
  contractAddress: string;
  functionSignature: string;
  addresses: string[];
};

type Event = {
  contractAddress: string;
  functionSignature: string;
  account: string;
  type: PermissionsEnum;
};

type Role = {
  contractAddress: string;
  functionSignature: string;
};

export class PermissionFetcher {
  readonly network: string;
  backOffParams: any[];
  mdFilePath: string;
  jsonFilePath: string;
  permissionsMap: Record<string, Permission> = {};
  roleHashTable: Record<string, { address: string; functionSig: string }>;
  bnbPermissionFile: string;
  existingPermissions: Permission[];
  initial: boolean

  constructor(network: any, backOffParams: any[], bnbPermissionFile: string) {
    this.network = network;
    this.backOffParams = backOffParams;
    this.mdFilePath = path.join(__dirname, "networks", this.network, "permissions.md");
    this.jsonFilePath = path.join(__dirname, "networks", this.network, "permissions.json");
    this.bnbPermissionFile = path.join(__dirname, bnbPermissionFile);
    this.roleHashTable = this.getRoleHashTable(this.bnbPermissionFile);
    const { permissions: existingPermissions } = this.getPermissionsJson();
    this.existingPermissions = existingPermissions;
    this.initial = true;

  }

  async getPastEvents(startBlock: number, endBlock: number) {
    const fromBlock = startBlock ? startBlock : startingBlockForACM[this.network];
    const toBlock = endBlock ? endBlock : await ethers.provider.getBlockNumber();
    const chunkSize = 40000;
    const MAX_RETRIES = 3;
    const BASE_DELAY = 1000;
    const events: any[] = [];

    let start = fromBlock;
    const lastStoredBlock = this.getLastBlockNumber();
    if (start < lastStoredBlock) {
      start = lastStoredBlock + 1;
    }
    try {
      const acm = await ethers.getContract("AccessControlManager");
      const acmAddress = acm.address;
      let modifiedEvent: Event[] = [];
      let topics;
      if (this.network === "bscmainnet") {
        topics = [
          ethers.utils.id("RoleGranted(bytes32,address,address)"),
          ethers.utils.id("RoleRevoked(bytes32,address,address)"),
        ];
      } else {
        topics = [
          ethers.utils.id("PermissionGranted(address,address,string)"),
          ethers.utils.id("PermissionRevoked(address,address,string)"),
        ];
      }
      const eventFilter = {
        acmAddress,
        topics: [topics],
      };
      while (start <= toBlock) {
        let height: string;
        const endBlock = Math.min(start + chunkSize - 1, toBlock);
        const chunkEvents = await this.fetchWithExponentialBackoff(
          () => acm.queryFilter(eventFilter, start, endBlock),
          MAX_RETRIES,
          BASE_DELAY,
        );
        events.push(...chunkEvents);

        if (this.network === "bscmainnet") {
          if (!this.isValidJson(this.bnbPermissionFile as string)) {
            throw new Error("Invalid Json");
          }
          let contractAddress: string;
          let functionSig: string;

          events.forEach(event => {
            const role = ethers.utils.defaultAbiCoder.decode(["bytes32"], event.topics[1])[0];
            const account = ethers.utils.defaultAbiCoder.decode(["address"], event.topics[2])[0];
            if (this.roleHashTable[role] !== undefined) {
              contractAddress = this.roleHashTable[role].address;
              functionSig = this.roleHashTable[role].functionSig;
            }
            const eventType = event.topics[0] === topics[0] ? PermissionsEnum.Granted : PermissionsEnum.Revoked;

            modifiedEvent.push({
              contractAddress: contractAddress,
              functionSignature: functionSig,
              account: account,
              type: eventType,
            });
            height = event.blockNumber;
          });
          this.processEvents(modifiedEvent, height);
        } else {
          events.forEach(event => {
            const data = event.data;
            const { account, contractAddress, functionSignature } = this.decodeLogs(data);

            const eventType = event.topics[0] === topics[0] ? PermissionsEnum.Granted : PermissionsEnum.Revoked;
            modifiedEvent.push({
              contractAddress: contractAddress,
              functionSignature: functionSignature,
              account: account,
              type: eventType,
            });
            height = event.blockNumber;
          });
        }
        this.processEvents(modifiedEvent, height);
        console.log(`Fetched events from block ${start} to ${endBlock}`);
        start = endBlock + 1;
      }
    } catch (err: any) {

      throw new Error(err.toString());
    }
  }

  processEvents(events: Event[], height: string) {
    events.forEach(event => {
      if (event.contractAddress && event.functionSignature) {
        const hash = ethers.utils.solidityKeccak256(
          ["string", "string"],
          [event.contractAddress, event.functionSignature],
        );

        if (!this.permissionsMap[hash]) {
          this.permissionsMap[hash] = {
            contractAddress: event.contractAddress,
            functionSignature: event.functionSignature,
            addresses: [],
          };
        }

        const permission = this.permissionsMap[hash];

        if (event.type === PermissionsEnum.Granted) {
          permission.addresses = union(permission.addresses, [event.account]);
        } else if (event.type === PermissionsEnum.Revoked) {
          remove(permission.addresses, address => address === event.account);
        }
        this.permissionsMap[hash].addresses = permission.addresses
      }
    });
    this.storeInJson(height);

  }
  public storeInJson(height: string): void {
    let permissions
    if(this.initial){
       permissions = this.existingPermissions.concat(Object.values(this.permissionsMap));
    }else{
      permissions = Object.values(this.permissionsMap)
    }
    const snapshot: Snapshot = {
      permissions: permissions ,
      height: height,
    };

    try {
      fs.writeFileSync(this.jsonFilePath, JSON.stringify(snapshot, null, 2), "utf8");
      console.log(`Snapshot successfully written to ${this.jsonFilePath}`);
    } catch (error) {
      console.error(`Error writing to ${this.jsonFilePath}:`, error);
    }
    this.initial = false;
  }

  private decodeLogs(data: string): { account: string; contractAddress: string; functionSignature: string } {
    const abiCoder = new ethers.utils.AbiCoder();
    const decodedData = abiCoder.decode(["address", "address", "string"], data);

    return { account: decodedData[0], contractAddress: decodedData[1], functionSignature: decodedData[2] };
  }

  async delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private getRoleHashTable(filePath: string): Record<string, { address: string; functionSig: string }> {
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

  private isValidJson(filePath: string): boolean {
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

  private async fetchWithExponentialBackoff(
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
          await this.delay(delayTime);
        } else {
          throw error;
        }
      }
    }
  }

  private getPermissionsJson(): { permissions: Permission[]; height: string } {
    try {
      if (!fs.existsSync(this.jsonFilePath)) {
        return { permissions: [], height: startingBlockForACM[this.network].toString() };
      }

      const fileContent = fs.readFileSync(this.jsonFilePath, "utf8");

      if (!fileContent.trim()) {
        return { permissions: [], height: startingBlockForACM[this.network].toString() };
      }
      return JSON.parse(fileContent);
    } catch (error) {
      console.error(`Error parsing JSON file:`, error);
      throw error;
    }
  }
  private getLastBlockNumber(): number {
    const fileContent = fs.readFileSync(this.jsonFilePath, "utf8");

    const blockNumberRegex = /"height":\s*(\d+)/g;
    let match;
    let lastMatch;

    while ((match = blockNumberRegex.exec(fileContent)) !== null) {
      lastMatch = match;
    }
    if (lastMatch) {
      console.log("Last Block Number found:", parseInt(lastMatch[1], 10));

      return parseInt(lastMatch[1], 10);
    }
    return startingBlockForACM[this.network];
  }
}
