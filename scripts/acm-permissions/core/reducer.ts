import { PermissionEvent, SnapshotState } from "../types";

export function applyEvents(state: SnapshotState, events: PermissionEvent[]): SnapshotState {
  const sorted = [...events].sort((a, b) => a.blockNumber - b.blockNumber || a.logIndex - b.logIndex);
  for (const ev of sorted) {
    let role = state[ev.roleHash];
    if (ev.type === "granted") {
      if (!role)
        role = state[ev.roleHash] = {
          roleHash: ev.roleHash,
          contractAddress: ev.contractAddress,
          functionSig: ev.functionSig,
          decoded: ev.decoded,
          grantees: [],
          transactions: [],
        };
      if (!role.grantees.includes(ev.account)) role.grantees.push(ev.account);
      if (!role.transactions.includes(ev.txHash)) role.transactions.push(ev.txHash);
    } else if (role) {
      role.grantees = role.grantees.filter(g => g !== ev.account);
      if (role.grantees.length === 0) delete state[ev.roleHash];
    }
  }
  return state;
}
