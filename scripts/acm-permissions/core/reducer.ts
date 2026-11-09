import { PermissionEvent, SnapshotState } from "../types";

// Creates the role on first grant, then records the grantee and the transaction that granted it.
function applyGrant(state: SnapshotState, ev: PermissionEvent): void {
  let role = state[ev.roleHash];
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
}

export function applyEvents(state: SnapshotState, events: PermissionEvent[]): SnapshotState {
  const sorted = [...events].sort((a, b) => a.blockNumber - b.blockNumber || a.logIndex - b.logIndex);
  for (const ev of sorted) {
    if (ev.type === "granted") {
      applyGrant(state, ev);
      continue;
    }
    const role = state[ev.roleHash];
    if (!role) continue;
    role.grantees = role.grantees.filter(g => g !== ev.account);
    if (role.grantees.length === 0) delete state[ev.roleHash];
  }
  return state;
}
