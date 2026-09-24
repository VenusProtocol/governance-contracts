import { RoleState, SnapshotDiff, SnapshotState } from "../types";

// `metadata` supplies the role's descriptive fields, `txSource` the side whose transaction list
// witnessed the change — they differ for a removal, where the metadata may come from the new
// snapshot but the last touching transaction only exists in the old one.
const entry = (roleHash: string, metadata: RoleState, txSource: RoleState, account: string) => ({
  roleHash,
  contractAddress: metadata.contractAddress,
  functionSig: metadata.functionSig,
  decoded: metadata.decoded,
  account,
  txHash: txSource.transactions[txSource.transactions.length - 1] ?? "",
});

export function diffSnapshots(prev: SnapshotState, next: SnapshotState): SnapshotDiff {
  const added = [];
  const removed = [];

  // Get union of all role keys
  const allRoleHashes = new Set([...Object.keys(prev), ...Object.keys(next)]);

  for (const roleHash of allRoleHashes) {
    const prevRole = prev[roleHash];
    const nextRole = next[roleHash];

    const prevGrantees = new Set(prevRole?.grantees ?? []);
    const nextGrantees = new Set(nextRole?.grantees ?? []);

    // Find added grantees (in next but not in prev); nextGrantees non-empty implies nextRole exists
    for (const account of nextGrantees) {
      if (!prevGrantees.has(account)) added.push(entry(roleHash, nextRole, nextRole, account));
    }

    // Find removed grantees (in prev but not in next); prevGrantees non-empty implies prevRole exists
    for (const account of prevGrantees) {
      if (!nextGrantees.has(account)) removed.push(entry(roleHash, nextRole ?? prevRole, prevRole, account));
    }
  }

  return { added, removed };
}
