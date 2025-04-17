import "dotenv/config";
import { Event as NetworkEvent } from "ethers";
import * as fs from "fs";
import { ethers } from "hardhat";
import { SUPPORTED_NETWORKS } from "helpers/deploy/constants";
import { remove, union } from "lodash";
import path from "path";
import { BackOffPolicy, Retryable } from "typescript-retry-decorator";

import { addressMap, startingBlockForACM } from "./config";
import { Event, MissingRoleMap, Permission, PermissionsEnum, Role, Snapshot } from "./types";

export class PermissionFetcher {
  mdFilePath: string;
  jsonFilePath: string;
  permissionsMap: Record<string, Permission> = {};
  missingRoleMap: MissingRoleMap = {};
  roleHashTable: Record<string, Role>;
  existingPermissions: Permission[];
  missingRoleFile: string;
  blocksParsed: number;

  constructor(readonly network: SUPPORTED_NETWORKS, readonly bnbPermissionFile: string, readonly chunkSize: number) {
    this.mdFilePath = path.join(__dirname, "networks", this.network, "permissions.md");
    this.jsonFilePath = path.join(__dirname, "networks", this.network, "permissions.json");
    this.roleHashTable = this.getRoleHashTable(this.bnbPermissionFile);
    this.missingRoleFile = path.join(__dirname, "networks", this.network, "BNBMissingRole.json");

    const { permissions: existingPermissions } = this.getPermissionsJson();
    this.existingPermissions = existingPermissions;
    this.blocksParsed = parseInt(this.getPermissionsJson().height, 10);
    this.addPrevPermissionsInMap();
  }

  async getPastEvents(startBlock: number, endBlock: number) {
    const fromBlock = startBlock ? startBlock : startingBlockForACM[this.network];
    const toBlock = endBlock ? endBlock : await ethers.provider.getBlockNumber();

    if (fromBlock >= toBlock) {
      throw new Error(`From block ${fromBlock} cannot be more than to block ${toBlock}`);
    }

    let start = fromBlock;
    const lastStoredBlock = this.blocksParsed;

    console.log("StartBlock:", lastStoredBlock);

    // If last stored block is found, start from the last stored block and ignore the input fromBlock.
    if (start < lastStoredBlock) {
      start = lastStoredBlock + 1;
    }

    while (start <= toBlock) {
      const endBlock = Math.min(start + this.chunkSize - 1, toBlock);
      const events = await this.fetchEvents(start, endBlock);
      this.processEvents(events);
      this.blocksParsed = endBlock;
      this.storeInJson();

      console.log(`Fetched events from block ${start} to ${endBlock}`);
      start = endBlock + 1;
    }

    this.updateMDPermissionFile();
  }

  private processEvents(events: Event[]) {
    events.forEach(event => {
      const hash = this.getHash(event.contractAddress, event.functionSignature);

      if (!this.permissionsMap[hash]) {
        this.permissionsMap[hash] = {
          contractAddress: event.contractAddress,
          functionSignature: event.functionSignature,
          role: hash,
          addresses: [],
        };
      }
      const permission = this.permissionsMap[hash];

      if (event.type === PermissionsEnum.Granted) {
        permission.addresses = union(permission.addresses, [event.account]);
      } else if (event.type === PermissionsEnum.Revoked) {
        remove(permission.addresses, address => address === event.account);
      }
      this.permissionsMap[hash].addresses = permission.addresses;
    });
  }

  private updateMDPermissionFile() {
    try {
      const jsonData = fs.readFileSync(this.jsonFilePath, "utf8");
      const data = JSON.parse(jsonData);

      let mdContent = "# Permissions\n\n";

      data.permissions.forEach((permission: Permission) => {
        mdContent += `## Contract Address: ${permission.contractAddress}\n`;
        mdContent += `- **Function Signature**: \`${permission.functionSignature}\`\n`;
        mdContent += `- **Addresses**:\n`;
        permission.addresses.forEach((address: string) => {
          mdContent += `  - \`${addressMap[this.network][address] || address}\`\n`;
        });
        mdContent += "\n";
      });

      fs.writeFileSync(this.mdFilePath, mdContent, "utf8");
      console.log(`Markdown file has been written to ${this.mdFilePath}`);
    } catch (error) {
      console.error(`Error writing to MD file ${this.jsonFilePath}:`, error);
    }
  }
  private addPrevPermissionsInMap() {
    this.existingPermissions.forEach(permission => {
      const hash = this.getHash(permission.contractAddress, permission.functionSignature);
      this.permissionsMap[hash] = permission;
    });
  }

  private storeInJson(): void {
    const snapshot: Snapshot = {
      permissions: Object.values(this.permissionsMap).filter(permission => permission.addresses.length > 0),
      height: this.blocksParsed,
    };

    try {
      fs.writeFileSync(this.jsonFilePath, JSON.stringify(snapshot, null, 2), "utf8");
      console.log(`Snapshot successfully written to ${this.jsonFilePath}`);
    } catch (error) {
      console.error(`Error writing JSON to ${this.jsonFilePath}:`, error);
      throw new Error(`Error writing JSON to ${this.jsonFilePath}`);
    }
  }

  private decodeLogs(data: string): { account: string; contractAddress: string; functionSignature: string } {
    const abiCoder = new ethers.utils.AbiCoder();
    const decodedData = abiCoder.decode(["address", "address", "string"], data);

    return { account: decodedData[0], contractAddress: decodedData[1], functionSignature: decodedData[2] };
  }

  private getRoleHashTable(filePath: string): Record<string, Role> {
    const jsonData = fs.readFileSync(filePath, "utf8");
    const data = JSON.parse(jsonData);

    // [TODO]: use a schema validator
    if (typeof data !== "object" || data === null || !Array.isArray(data.contracts)) {
      throw new Error("Invalid Json");
    }

    for (const contract of data.contracts) {
      if (typeof contract !== "object" || contract === null) {
        throw new Error("Invalid Json");
      }
      if (!Array.isArray(contract.address) || !Array.isArray(contract.functions)) {
        throw new Error("Invalid Json");
      }
      if (!contract.address.every((addr: any) => typeof addr === "string" && addr === addr.trim())) {
        throw new Error("Invalid Json");
      }
      if (!contract.functions.every((func: any) => typeof func === "string" && func === func.trim())) {
        throw new Error("Invalid Json");
      }
    }

    const hashTable: Record<string, Role> = {};

    for (const contract of data.contracts) {
      for (const address of contract.address) {
        for (const funcSig of contract.functions) {
          const role = this.getHash(address, funcSig);
          hashTable[role] = {
            contractAddress: address,
            functionSignature: funcSig,
          };
        }
      }
    }
    return hashTable;
  }

  @Retryable({
    maxAttempts: 5,
    backOffPolicy: BackOffPolicy.ExponentialBackOffPolicy,
    backOff: 5000,
    exponentialOption: { maxInterval: 60000, multiplier: 2 },
  })
  private async fetchEvents(start: number, endBlock: number): Promise<Event[]> {
    const acm = await ethers.getContract("AccessControlManager");
    const acmAddress = acm.address;

    const topics =
      this.network === "bscmainnet"
        ? [
            ethers.utils.id("RoleGranted(bytes32,address,address)"),
            ethers.utils.id("RoleRevoked(bytes32,address,address)"),
          ]
        : [
            ethers.utils.id("PermissionGranted(address,address,string)"),
            ethers.utils.id("PermissionRevoked(address,address,string)"),
          ];

    const eventFilter = {
      acmAddress,
      topics: [topics],
    };

    const events: NetworkEvent[] = await acm.queryFilter(eventFilter, start, endBlock);

    if (this.network === "bscmainnet") {
      let contractAddress: string;
      let functionSig: string;

      const newEvents: Event[] = [];

      events.forEach(event => {
        const role = ethers.utils.defaultAbiCoder.decode(["bytes32"], event.topics[1])[0];
        const account = ethers.utils.defaultAbiCoder.decode(["address"], event.topics[2])[0];
        const defaultAdminRole = "0x0000000000000000000000000000000000000000000000000000000000000000";
        if (this.roleHashTable[role] !== undefined || role === defaultAdminRole) {
          if (role === defaultAdminRole) {
            contractAddress = acm.address;
            functionSig = "DFAULT_ADMIN_ROLE";
          } else {
            contractAddress = this.roleHashTable[role].contractAddress;
            functionSig = this.roleHashTable[role].functionSignature;
          }
          const eventType =
            event.topics[0] === eventFilter.topics[0][0] ? PermissionsEnum.Granted : PermissionsEnum.Revoked;

          newEvents.push({
            contractAddress: contractAddress,
            functionSignature: functionSig,
            account: account,
            type: eventType,
          });
        } else {
          this.addMissingRole(role, event.transactionHash);
        }
      });

      return newEvents;
    }

    return events.map(event => {
      const data = event.data;
      const { account, contractAddress, functionSignature } = this.decodeLogs(data);
      const eventType =
        event.topics[0] === eventFilter.topics[0][0] ? PermissionsEnum.Granted : PermissionsEnum.Revoked;
      return {
        contractAddress: contractAddress,
        functionSignature: functionSignature,
        account: account,
        type: eventType,
      };
    });
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
      throw new Error("Error parsing JSON file");
    }
  }

  private addMissingRole(role: string, transaction: string) {
    let data: MissingRoleMap = {};

    try {
      if (fs.existsSync(this.missingRoleFile)) {
        const fileContent = fs.readFileSync(this.missingRoleFile, "utf8").trim();
        if (fileContent) {
          try {
            data = JSON.parse(fileContent);
          } catch (error) {
            console.error("Error parsing JSON:", error);
            throw new Error("Error parsing JSON");
          }
        }
      }

      if (!data[role]) {
        data[role] = { transactions: [] };
      }

      if (!data[role].transactions.includes(transaction)) {
        data[role].transactions.push(transaction);
      }

      fs.writeFileSync(this.missingRoleFile, JSON.stringify(data, null, 2), "utf8");
    } catch (error) {
      console.error("Error adding missing role:", error);
    }
  }

  private getHash(contractAddress: string, functionSignature: string): string {
    const hash = ethers.utils.solidityKeccak256(["address", "string"], [contractAddress, functionSignature]);
    return hash;
  }
}
