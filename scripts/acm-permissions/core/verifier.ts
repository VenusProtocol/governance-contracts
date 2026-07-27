import { isLegacyAcm } from "../config";
import { Correction, DiffEntry, Network, SnapshotDiff, SnapshotState } from "../types";
import { withRetry } from "./retry";

export const ACM_ABI = [
  "function hasPermission(address account, address contractAddress, string functionSig) view returns (bool)",
  "function hasRole(bytes32 role, address account) view returns (bool)",
];

export interface CallOverrides {
  blockTag?: number;
}

export interface AcmLike {
  hasPermission: (
    account: string,
    contractAddress: string,
    functionSig: string,
    overrides?: CallOverrides,
  ) => Promise<boolean>;
  hasRole: (role: string, account: string, overrides?: CallOverrides) => Promise<boolean>;
}

export interface VerifyOptions {
  batchSize?: number;
  blockTag?: number;
}

const DEFAULT_BATCH_SIZE = 20;

export async function checkOnChain(
  acm: AcmLike,
  network: Network,
  entry: DiffEntry,
  blockTag?: number,
): Promise<boolean> {
  // Omit the overrides argument when unpinned — never pass `undefined`. ethers only treats a
  // trailing argument as overrides when `typeof it === "object"`, so an explicit undefined
  // survives as a real argument and trips the arity check.
  const useRole = isLegacyAcm(network) || !entry.decoded;
  if (blockTag === undefined) {
    return useRole
      ? acm.hasRole(entry.roleHash, entry.account)
      : acm.hasPermission(entry.account, entry.contractAddress as string, entry.functionSig as string);
  }
  const overrides = { blockTag };
  return useRole
    ? acm.hasRole(entry.roleHash, entry.account, overrides)
    : acm.hasPermission(entry.account, entry.contractAddress as string, entry.functionSig as string, overrides);
}

async function checkInBatches(
  acm: AcmLike,
  network: Network,
  entries: DiffEntry[],
  batchSize: number,
  blockTag?: number,
): Promise<boolean[]> {
  const results: boolean[] = [];
  const at = blockTag === undefined ? "" : `@${blockTag}`;
  for (let i = 0; i < entries.length; i += batchSize) {
    const batch = entries.slice(i, i + batchSize);
    // Each eth_call retried individually: verification runs unattended at the end of every
    // fetch, so a transient RPC blip must not fail the whole network's run.
    const batchResults = await Promise.all(
      batch.map(entry =>
        withRetry(
          () => checkOnChain(acm, network, entry, blockTag),
          `${network} verify ${entry.roleHash}/${entry.account}${at}`,
        ),
      ),
    );
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

// Reconciles a replay-derived diff against the chain. Callers MUST pass `blockTag` set to the
// block their replay stopped at: the diff describes state as of that block, so checking it
// against `latest` turns any grant/revoke that landed afterwards into a bogus "correction"
// that is then written into a snapshot stamped with the earlier height.
export async function verifyDiff(
  acm: AcmLike,
  network: Network,
  diff: SnapshotDiff,
  state: SnapshotState,
  { batchSize = DEFAULT_BATCH_SIZE, blockTag }: VerifyOptions = {},
): Promise<Correction[]> {
  const corrections: Correction[] = [];

  const addedResults = await checkInBatches(acm, network, diff.added, batchSize, blockTag);
  diff.added.forEach((entry, i) => {
    if (!addedResults[i]) {
      removeGrantee(state, entry);
      corrections.push({ entry, replaySaid: "added", chainSays: "not-granted" });
    }
  });

  const removedResults = await checkInBatches(acm, network, diff.removed, batchSize, blockTag);
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
  { batchSize = DEFAULT_BATCH_SIZE, blockTag }: VerifyOptions = {},
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

  const results = await checkInBatches(acm, network, entries, batchSize, blockTag);
  return entries.filter((_, i) => !results[i]);
}

// Full verify with chain-authoritative fixes: every snapshot entry the chain denies is removed
// from `state` (the same correction verifyDiff applies to false adds) and returned. The reverse
// direction — a grant the chain has but the snapshot lacks — is undetectable without event
// enumeration; the next fetch's scan picks those up.
export async function verifyAllAndFix(
  acm: AcmLike,
  network: Network,
  state: SnapshotState,
  opts: VerifyOptions = {},
): Promise<DiffEntry[]> {
  const mismatches = await verifyAll(acm, network, state, opts);
  for (const entry of mismatches) removeGrantee(state, entry);
  return mismatches;
}
