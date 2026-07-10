import { SnapshotDiff, SnapshotState } from "../types";

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
      if (!prevGrantees.has(account)) {
        added.push({
          roleHash,
          contractAddress: nextRole.contractAddress,
          functionSig: nextRole.functionSig,
          decoded: nextRole.decoded,
          account,
          txHash: nextRole.transactions[nextRole.transactions.length - 1] ?? "",
        });
      }
    }

    // Find removed grantees (in prev but not in next); prevGrantees non-empty implies prevRole exists
    for (const account of prevGrantees) {
      if (!nextGrantees.has(account)) {
        const metadataRole = nextRole ?? prevRole;
        removed.push({
          roleHash,
          contractAddress: metadataRole.contractAddress,
          functionSig: metadataRole.functionSig,
          decoded: metadataRole.decoded,
          account,
          txHash: prevRole.transactions[prevRole.transactions.length - 1] ?? "",
        });
      }
    }
  }

  return { added, removed };
}
