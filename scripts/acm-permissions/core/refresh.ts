import { isLegacyAcm } from "../config";
import { Network } from "../types";
import { buildHashTable } from "./decoder";
import { writePermissionsOutputs } from "./output";
import { loadKnownAddresses, loadNameMap, loadSignatures } from "./registry";
import { fileToState, loadSnapshotFile, reannotateUndecoded, saveSnapshotFile, stateToFile } from "./snapshot";

export interface RefreshResult {
  newlyDecoded: number;
  total: number;
  unresolved: number;
}

// Offline re-annotation + re-render of a committed snapshot — no RPC calls, no height change. Only
// bscmainnet can ever produce newlyDecoded > 0, since only its roles are ever undecoded (legacy
// hash-based roles awaiting registry growth); other networks decode fully at fetch time.
// Returns null (after warning) when there is no snapshot to refresh for `network`.
export function refreshNetwork(network: Network, opts: { baseDir?: string } = {}): RefreshResult | null {
  const { baseDir } = opts;
  const file = loadSnapshotFile(network, baseDir);
  if (!file) {
    console.warn(`[${network}] no snapshot — skipping`);
    return null;
  }

  const state = fileToState(file);
  const table = isLegacyAcm(network) ? buildHashTable(loadKnownAddresses(network), loadSignatures()) : null;
  const before = Object.values(state).filter(r => !r.decoded).length;
  reannotateUndecoded(state, table);
  const after = Object.values(state).filter(r => !r.decoded).length;

  const names = loadNameMap(network);
  const newFile = stateToFile(
    state,
    {
      network: file.network,
      acmAddress: file.acmAddress,
      height: file.height,
      updatedAt: file.updatedAt,
      // refresh makes no chain calls, so it cannot change the verification status — carry the
      // loaded file's verified/verifiedAt through unchanged.
      verified: file.verified,
      verifiedAt: file.verifiedAt,
    },
    names,
  );
  saveSnapshotFile(network, newFile, baseDir);
  writePermissionsOutputs(network, newFile, names, baseDir);

  return { newlyDecoded: before - after, total: Object.keys(state).length, unresolved: after };
}
