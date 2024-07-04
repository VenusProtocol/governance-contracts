import { Contract } from "ethers";
import * as fs from "fs";
import { ethers } from "hardhat";
import { remove, union } from "lodash";
import path from "path";
import { BackOffPolicy, ExponentialBackoffStrategy, Retryable } from "typescript-retry-decorator";

import { addressMap, startingBlockForACM } from "./config";

require("dotenv").config();

enum PermissionsEnum {
  "Granted",
  "Revoked",
}
type MissingRoleMap = {
  [role: string]: {
    transactions: string[];
  };
};
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
  missingRoleMap: MissingRoleMap = {};
  roleHashTable: Record<string, Role>;
  bnbPermissionFile: string;
  existingPermissions: Permission[];
  missingRoleFile: string;

  constructor(network: any, backOffParams: any[], bnbPermissionFile: string) {
    this.network = network;
    this.backOffParams = backOffParams;
    this.mdFilePath = path.join(__dirname, "networks", this.network, "permissions.md");
    this.jsonFilePath = path.join(__dirname, "networks", this.network, "permissions.json");
    this.bnbPermissionFile = path.join(__dirname, bnbPermissionFile);
    this.roleHashTable = this.getRoleHashTable(this.bnbPermissionFile);
    const { permissions: existingPermissions } = this.getPermissionsJson();
    this.existingPermissions = existingPermissions;
    this.missingRoleFile = path.join(__dirname, "networks", this.network, "BNBMissingRole.json");

    this.addPrevPermissionsInMap();
  }

  async getPastEvents(startBlock: number, endBlock: number) {
    const fromBlock = startBlock ? startBlock : startingBlockForACM[this.network];
    const toBlock = endBlock ? endBlock : await ethers.provider.getBlockNumber();
    const chunkSize = 40000;
    const events: any[] = [];

    let start = fromBlock;
    const lastStoredBlock = this.getLastBlockNumber();
    console.log("StartBlock:", lastStoredBlock);

    if (start < lastStoredBlock) {
      start = lastStoredBlock + 1;
    }
    try {
      const acm = await ethers.getContract("AccessControlManager");
      const acmAddress = acm.address;
      const modifiedEvent: Event[] = [];
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
      let height = this.getLastBlockNumber().toString();
      while (start <= toBlock) {
        const endBlock = Math.min(start + chunkSize - 1, toBlock);

        const chunkEvents = await this.fetchEvents(acm, eventFilter, start, endBlock);
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
            const defaultAdminRole = "0x0000000000000000000000000000000000000000000000000000000000000000";
            if (this.roleHashTable[role] !== undefined || role === defaultAdminRole) {
              if (role === defaultAdminRole) {
                contractAddress = acm.address;
                functionSig = "DFAULT_ADMIN_ROLE";
              } else {
                contractAddress = this.roleHashTable[role].contractAddress;
                functionSig = this.roleHashTable[role].functionSignature;
              }
              const eventType = event.topics[0] === topics[0] ? PermissionsEnum.Granted : PermissionsEnum.Revoked;

              modifiedEvent.push({
                contractAddress: contractAddress,
                functionSignature: functionSig,
                account: account,
                type: eventType,
              });
              height = event.blockNumber.toString();
              this.processEvents(modifiedEvent, height);
            } else {
              this.addMissingRole(role, event.transactionHash);
            }
          });
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
            height = event.blockNumber.toString();
          });
          this.processEvents(modifiedEvent, height);
        }
        console.log(`Fetched events from block ${start} to ${endBlock}`);
        start = endBlock + 1;
      }
      this.mapAddresses();
      this.updateMDPermissionFile();
    } catch (err: any) {
      throw new Error(err.toString());
    }
  }

  private processEvents(events: Event[], height: string) {
    events.forEach(event => {
      const hash = this.getHash(event.contractAddress, event.functionSignature);

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
      this.permissionsMap[hash].addresses = permission.addresses;
    });
    this.storeInJson(height);
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
        permission.addresses.forEach(address => {
          mdContent += `  - \`${address}\`\n`;
        });
        mdContent += "\n";
      });

      fs.writeFileSync(this.mdFilePath, mdContent, "utf8");
      console.log(`Markdown file has been written to ${this.mdFilePath}`);
    } catch (error) {
      console.error(`Error processing ${this.jsonFilePath}:`, error);
    }
  }
  private addPrevPermissionsInMap() {
    this.existingPermissions.forEach(permission => {
      const hash = this.getHash(permission.contractAddress, permission.functionSignature);
      this.permissionsMap[hash] = permission;
    });
  }

  private storeInJson(height: string): void {
    const snapshot: Snapshot = {
      permissions: Object.values(this.permissionsMap),
      height: height,
    };
    try {
      fs.writeFileSync(this.jsonFilePath, JSON.stringify(snapshot, null, 2), "utf8");
      console.log(`Snapshot successfully written to ${this.jsonFilePath}`);
    } catch (error) {
      console.error(`Error writing to ${this.jsonFilePath}:`, error);
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

    const hashTable: Record<string, Role> = {};

    for (const contract of data.contracts) {
      for (const address of contract.address) {
        for (const funcSig of contract.functions) {
          const role = ethers.utils.solidityPack(["address", "string"], [address, funcSig]);
          const roleHash = ethers.utils.keccak256(role);
          hashTable[roleHash] = {
            contractAddress: address,
            functionSignature: funcSig,
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
      if (!contract.address.every((addr: any) => typeof addr === "string" && addr === addr.trim())) {
        return false;
      }
      if (!contract.functions.every((func: any) => typeof func === "string" && func === func.trim())) {
        return false;
      }
    }
    return true;
  }

  private mapAddresses() {
    try {
      const jsonData = fs.readFileSync(this.jsonFilePath, "utf8");
      const data = JSON.parse(jsonData);

      data.permissions.forEach((permission: { addresses: any[] }) => {
        permission.addresses = permission.addresses.map(address => {
          return addressMap[address] || address;
        });
      });

      fs.writeFileSync(this.jsonFilePath, JSON.stringify(data, null, 2), "utf8");
      console.log(`File ${this.jsonFilePath} has been updated with mapped addresses!`);
    } catch (error) {
      console.error(`Error processing ${this.jsonFilePath}:`, error);
    }
  }

  @Retryable({
    maxAttempts: 3,
    backOffPolicy: BackOffPolicy.ExponentialBackOffPolicy,
    backOff: 1000,
    exponentialOption: { maxInterval: 4000, multiplier: 2, backoffStrategy: ExponentialBackoffStrategy.FullJitter },
  })
  private async fetchEvents(
    acm: Contract,
    eventFilter: {
      acmAddress: string;
      topics: string[][];
    },
    start: number,
    endBlock: number,
  ): Promise<any> {
    return await acm.queryFilter(eventFilter, start, endBlock);
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

  private getLastBlockNumber(): number {
    const fileContent = fs.readFileSync(this.jsonFilePath, "utf8");

    const blockNumberRegex = /"height":\s*"(\d+)"/g;
    const match = blockNumberRegex.exec(fileContent);
    if (match) {
      return parseInt(match[1], 10);
    }
    return startingBlockForACM[this.network];
  }

  private getHash(contractAddress: string, functionSignature: string): string {
    const hash = ethers.utils.solidityKeccak256(["string", "string"], [contractAddress, functionSignature]);
    return hash;
  }
}
