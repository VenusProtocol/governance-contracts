import * as fs from "fs";
import * as path from "path";

import { WILDCARD, snapshotDir } from "../config";
import { Network, RoleState, SnapshotContract, SnapshotFile, SnapshotMeta, SnapshotState } from "../types";
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

function permissionsFile(network: Network): string {
  return path.join(snapshotDir(network), "permissions.json");
}

export function loadSnapshotFile(network: Network): SnapshotFile | null {
  const file = permissionsFile(network);
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

export function saveSnapshotFile(network: Network, file: SnapshotFile): void {
  const dir = snapshotDir(network);
  fs.mkdirSync(dir, { recursive: true });
  const target = permissionsFile(network);
  const tmp = `${target}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(file, null, 2) + "\n");
  fs.renameSync(tmp, target);
}
