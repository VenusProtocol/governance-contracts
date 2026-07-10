import { ethers } from "ethers";

import { DEFAULT_ADMIN_ROLE, isLegacyAcm } from "../config";
import { Network, PermissionEvent } from "../types";

export const TOPICS = {
  modern: {
    granted: ethers.utils.id("PermissionGranted(address,address,string)"),
    revoked: ethers.utils.id("PermissionRevoked(address,address,string)"),
  },
  legacy: {
    granted: ethers.utils.id("RoleGranted(bytes32,address,address)"),
    revoked: ethers.utils.id("RoleRevoked(bytes32,address,address)"),
  },
};

export const roleHash = (contract: string, sig: string) =>
  ethers.utils.solidityKeccak256(["address", "string"], [contract, sig]);

export type HashTable = Record<string, { contractAddress: string; functionSig: string }>;

export function buildHashTable(addresses: string[], signatures: string[]): HashTable {
  const t: HashTable = {};
  for (const a of addresses) {
    const cs = ethers.utils.getAddress(a);
    for (const s of signatures) t[roleHash(cs, s)] = { contractAddress: cs, functionSig: s };
  }
  return t;
}

export function decodeLog(
  log: ethers.providers.Log,
  network: Network,
  acmAddress: string,
  table: HashTable | null,
): PermissionEvent {
  const meta = { blockNumber: log.blockNumber, logIndex: log.logIndex, txHash: log.transactionHash };
  if (isLegacyAcm(network)) {
    const type = log.topics[0] === TOPICS.legacy.granted ? ("granted" as const) : ("revoked" as const);
    const role = log.topics[1];
    const account = ethers.utils.getAddress(ethers.utils.defaultAbiCoder.decode(["address"], log.topics[2])[0]);
    if (role === DEFAULT_ADMIN_ROLE)
      return {
        type,
        roleHash: role,
        account,
        contractAddress: ethers.utils.getAddress(acmAddress),
        functionSig: "DEFAULT_ADMIN_ROLE",
        decoded: true,
        ...meta,
      };
    const hit = table?.[role];
    return {
      type,
      roleHash: role,
      account,
      contractAddress: hit?.contractAddress ?? null,
      functionSig: hit?.functionSig ?? null,
      decoded: !!hit,
      ...meta,
    };
  }
  const type = log.topics[0] === TOPICS.modern.granted ? ("granted" as const) : ("revoked" as const);
  const [account, contractAddress, functionSig] = ethers.utils.defaultAbiCoder.decode(
    ["address", "address", "string"],
    log.data,
  );
  const c = ethers.utils.getAddress(contractAddress);
  return {
    type,
    roleHash: roleHash(c, functionSig),
    account: ethers.utils.getAddress(account),
    contractAddress: c,
    functionSig,
    decoded: true,
    ...meta,
  };
}
