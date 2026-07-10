export const NETWORKS = [
  "bscmainnet",
  "bsctestnet",
  "ethereum",
  "sepolia",
  "opbnbmainnet",
  "opbnbtestnet",
  "arbitrumone",
  "arbitrumsepolia",
  "zksyncmainnet",
  "zksyncsepolia",
  "opmainnet",
  "opsepolia",
  "basemainnet",
  "basesepolia",
  "unichainmainnet",
  "unichainsepolia",
] as const;

export type Network = (typeof NETWORKS)[number];

export interface PermissionEvent {
  type: "granted" | "revoked";
  roleHash: string;
  account: string;
  contractAddress: string | null;
  functionSig: string | null;
  decoded: boolean;
  blockNumber: number;
  logIndex: number;
  txHash: string;
}

export interface RoleState {
  roleHash: string;
  contractAddress: string | null;
  functionSig: string | null;
  decoded: boolean;
  grantees: string[];
  transactions: string[];
}

export type SnapshotState = Record<string, RoleState>; // key = roleHash

export interface SnapshotMeta {
  network: Network;
  acmAddress: string;
  height: number;
  updatedAt: string;
}

export interface SnapshotGrantee {
  address: string;
  name: string;
}

export interface SnapshotPermission {
  functionSig: string | null;
  roleHash: string;
  decoded: boolean;
  grantees: SnapshotGrantee[];
  transactions?: string[];
}

export interface SnapshotContract {
  address: string | null;
  name: string;
  scope: "contract" | "wildcard" | "unresolved";
  permissions: SnapshotPermission[];
}

export interface SnapshotFile extends SnapshotMeta {
  schemaVersion: 1;
  contracts: SnapshotContract[];
}

export interface DiffEntry {
  roleHash: string;
  contractAddress: string | null;
  functionSig: string | null;
  decoded: boolean;
  account: string;
  txHash: string;
}

export interface SnapshotDiff {
  added: DiffEntry[];
  removed: DiffEntry[];
}

export interface Correction {
  entry: DiffEntry;
  replaySaid: "added" | "removed";
  chainSays: "granted" | "not-granted";
}
