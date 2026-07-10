import { isLegacyAcm } from "../config";
import { Correction, DiffEntry, Network, SnapshotDiff, SnapshotState } from "../types";

export const ACM_ABI = [
  "function hasPermission(address account, address contractAddress, string functionSig) view returns (bool)",
  "function hasRole(bytes32 role, address account) view returns (bool)",
];

export interface AcmLike {
  hasPermission: (account: string, contractAddress: string, functionSig: string) => Promise<boolean>;
  hasRole: (role: string, account: string) => Promise<boolean>;
}

export async function checkOnChain(acm: AcmLike, network: Network, entry: DiffEntry): Promise<boolean> {
  if (isLegacyAcm(network) || !entry.decoded) {
    return acm.hasRole(entry.roleHash, entry.account);
  }
  return acm.hasPermission(entry.account, entry.contractAddress as string, entry.functionSig as string);
}

async function checkInBatches(
  acm: AcmLike,
  network: Network,
  entries: DiffEntry[],
  batchSize: number,
): Promise<boolean[]> {
  const results: boolean[] = [];
  for (let i = 0; i < entries.length; i += batchSize) {
    const batch = entries.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(entry => checkOnChain(acm, network, entry)));
    results.push(...batchResults);
  }
  return results;
}

function removeGrantee(state: SnapshotState, entry: DiffEntry): void {
  const role = state[entry.roleHash];
  if (!role) return;
  role.grantees = role.grantees.filter(g => g !== entry.account);
  if (role.grantees.length === 0) delete state[entry.roleHash];
}

function restoreGrantee(state: SnapshotState, entry: DiffEntry): void {
  let role = state[entry.roleHash];
  if (!role) {
    role = state[entry.roleHash] = {
      roleHash: entry.roleHash,
      contractAddress: entry.contractAddress,
      functionSig: entry.functionSig,
      decoded: entry.decoded,
      grantees: [],
      transactions: entry.txHash ? [entry.txHash] : [],
    };
  }
  if (!role.grantees.includes(entry.account)) role.grantees.push(entry.account);
}

export async function verifyDiff(
  acm: AcmLike,
  network: Network,
  diff: SnapshotDiff,
  state: SnapshotState,
  batchSize = 20,
): Promise<Correction[]> {
  const corrections: Correction[] = [];

  const addedResults = await checkInBatches(acm, network, diff.added, batchSize);
  diff.added.forEach((entry, i) => {
    if (!addedResults[i]) {
      removeGrantee(state, entry);
      corrections.push({ entry, replaySaid: "added", chainSays: "not-granted" });
    }
  });

  const removedResults = await checkInBatches(acm, network, diff.removed, batchSize);
  diff.removed.forEach((entry, i) => {
    if (removedResults[i]) {
      restoreGrantee(state, entry);
      corrections.push({ entry, replaySaid: "removed", chainSays: "granted" });
    }
  });

  return corrections;
}

export async function verifyAll(
  acm: AcmLike,
  network: Network,
  state: SnapshotState,
  batchSize = 20,
): Promise<DiffEntry[]> {
  const entries: DiffEntry[] = [];
  for (const role of Object.values(state)) {
    for (const account of role.grantees) {
      entries.push({
        roleHash: role.roleHash,
        contractAddress: role.contractAddress,
        functionSig: role.functionSig,
        decoded: role.decoded,
        account,
        txHash: role.transactions[role.transactions.length - 1] ?? "",
      });
    }
  }

  const results = await checkInBatches(acm, network, entries, batchSize);
  return entries.filter((_, i) => !results[i]);
}
