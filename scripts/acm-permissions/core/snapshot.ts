import * as fs from "fs";
import * as path from "path";

import { SNAPSHOTS_DIR, WILDCARD } from "../config";
import { Network, RoleState, SnapshotContract, SnapshotFile, SnapshotMeta, SnapshotState } from "../types";
import { HashTable } from "./decoder";
import { nameFor } from "./registry";

const UNRESOLVED_KEY = "__UNRESOLVED__";

function scopeFor(role: RoleState): "contract" | "wildcard" | "unresolved" {
  if (!role.decoded) return "unresolved";
  if (role.contractAddress === WILDCARD) return "wildcard";
  return "contract";
}

export function stateToFile(state: SnapshotState, meta: SnapshotMeta, names: Record<string, string>): SnapshotFile {
  const groups = new Map<string, SnapshotContract>();

  for (const role of Object.values(state)) {
    const scope = scopeFor(role);
    const key = scope === "unresolved" ? UNRESOLVED_KEY : (role.contractAddress as string);

    let group = groups.get(key);
    if (!group) {
      group =
        scope === "unresolved"
          ? { address: null, name: "UNRESOLVED", scope, permissions: [] }
          : {
              address: role.contractAddress,
              name: nameFor(names, role.contractAddress as string),
              scope,
              permissions: [],
            };
      groups.set(key, group);
    }

    group.permissions.push({
      functionSig: role.functionSig,
      roleHash: role.roleHash,
      decoded: role.decoded,
      grantees: role.grantees.map(g => ({ address: g, name: nameFor(names, g) })),
      transactions: role.transactions,
    });
  }

  const contracts = [...groups.values()]
    .map(group => ({
      ...group,
      // Grantees intentionally keep chronological (state) order for lossless round-trips;
      // the MD renderer sorts a display copy by name.
      permissions: [...group.permissions].sort((a, b) => {
        if (a.functionSig === b.functionSig) return a.roleHash.localeCompare(b.roleHash);
        if (a.functionSig === null) return 1;
        if (b.functionSig === null) return -1;
        return a.functionSig.localeCompare(b.functionSig);
      }),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return { ...meta, schemaVersion: 1, contracts };
}

export function fileToState(file: SnapshotFile): SnapshotState {
  const state: SnapshotState = {};
  for (const contract of file.contracts) {
    for (const permission of contract.permissions) {
      state[permission.roleHash] = {
        roleHash: permission.roleHash,
        contractAddress: contract.scope === "unresolved" ? null : contract.address,
        functionSig: permission.functionSig,
        decoded: permission.decoded,
        grantees: permission.grantees.map(g => g.address),
        transactions: permission.transactions ?? [],
      };
    }
  }
  return state;
}

// Re-annotates previously undecoded roles in a loaded state using a legacy hash table that may
// have grown since the last run (e.g. new signatures/contracts registered). Mutates `state` in
// place and must be called BEFORE any deep copy is taken for diffing, so re-annotation alone
// never shows up as an added/removed diff entry.
export function reannotateUndecoded(state: SnapshotState, table: HashTable | null): void {
  if (!table) return;
  for (const role of Object.values(state)) {
    if (role.decoded) continue;
    const hit = table[role.roleHash];
    if (!hit) continue;
    role.contractAddress = hit.contractAddress;
    role.functionSig = hit.functionSig;
    role.decoded = true;
  }
}

function permissionsFile(network: Network, baseDir: string): string {
  return path.join(baseDir, network, "permissions.json");
}

// `baseDir` exists so tests can point load/save at a scratch directory instead of the real
// snapshots/ tree; production callers omit it and get SNAPSHOTS_DIR.
export function loadSnapshotFile(network: Network, baseDir: string = SNAPSHOTS_DIR): SnapshotFile | null {
  const file = permissionsFile(network, baseDir);
  if (!fs.existsSync(file)) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (e) {
    throw new Error(`corrupt snapshot for ${network}: ${(e as Error).message}`);
  }

  const f = parsed as Partial<SnapshotFile>;
  if (f.schemaVersion !== 1) throw new Error(`corrupt snapshot for ${network}: schemaVersion !== 1`);
  if (typeof f.height !== "number") throw new Error(`corrupt snapshot for ${network}: height is not a number`);
  if (!Array.isArray(f.contracts)) throw new Error(`corrupt snapshot for ${network}: contracts is not an array`);

  return f as SnapshotFile;
}

export function saveSnapshotFile(network: Network, file: SnapshotFile, baseDir: string = SNAPSHOTS_DIR): void {
  const dir = path.join(baseDir, network);
  fs.mkdirSync(dir, { recursive: true });
  const target = permissionsFile(network, baseDir);
  const tmp = `${target}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(file, null, 2) + "\n");
  fs.renameSync(tmp, target);
}
