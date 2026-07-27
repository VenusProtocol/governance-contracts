import { ethers } from "ethers";

import { GUARDIANS, TIMELOCK_NAMES } from "../config";
import { Network, SnapshotFile } from "../types";
import { loadNameMap } from "./registry";

export type FilterResult = Record<string, Array<{ contract: string; functionSig: string | null; roleHash: string }>>;

// Expands grantee aliases BEFORE resolution, so the report keeps one section per real grantee
// (per-timelock / per-guardian attribution survives); the output filename is built from the
// short alias the user typed, not the expansion.
//   - "Timelocks" → the three timelock labels
//   - "Guardian" on a multi-guardian network → "Guardian 1".."Guardian N" (matching the
//     registry's naming); on a single-guardian network it stays "Guardian" (the registry name)
export const expandAliases = (labels: string[], network: Network): string[] =>
  labels.flatMap(l => {
    if (l === "Timelocks") return TIMELOCK_NAMES;
    if (l === "Guardian" && GUARDIANS[network].length > 1) return GUARDIANS[network].map((_, i) => `Guardian ${i + 1}`);
    return [l];
  });

// Resolves a requested grantee label to the address(es) it stands for:
//   - a raw `0x…` address resolves to itself (checksummed)
//   - the literal "Guardian" resolves to ALL guardian multisigs on the network
//   - anything else is looked up in the name map (address whose mapped name matches the label;
//     registries join conflicting deployments as "A / B" — e.g. "X / X_Proxy" — so each
//     " / "-separated part matches on its own)
// Throws a clear error when a label resolves to nothing, rather than silently matching zero
// permissions (which would look identical to "this grantee legitimately holds nothing").
function resolveLabel(label: string, network: Network, nameMap: Record<string, string>): string[] {
  if (label.startsWith("0x")) return [ethers.utils.getAddress(label)];
  if (label === "Guardian") return GUARDIANS[network];
  const addresses = Object.keys(nameMap).filter(addr => nameMap[addr].split(" / ").includes(label));
  if (addresses.length === 0) {
    throw new Error(
      `unknown grantee label "${label}" — expected a 0x… address, "Guardian", "Timelocks", or a name ` +
        `present in the ${network} contract registry`,
    );
  }
  return addresses;
}

export function filterPermissions(
  file: SnapshotFile,
  grantees: string[],
  network: Network,
  nameMap: Record<string, string> = loadNameMap(network),
  exclude: string[] = [],
  onlySigs: Set<string> | null = null,
): FilterResult {
  const result: FilterResult = {};
  // Set difference on the exact permission entry (same contract + roleHash): a permission is
  // dropped only when an excluded grantee holds that very role, not merely the same function
  // signature on a different contract.
  const excluded = new Set(
    exclude.flatMap(label => resolveLabel(label, network, nameMap)).map(a => ethers.utils.getAddress(a)),
  );

  for (const label of grantees) {
    const targets = new Set(resolveLabel(label, network, nameMap).map(a => ethers.utils.getAddress(a)));
    const matches: FilterResult[string] = [];
    for (const contract of file.contracts) {
      for (const permission of contract.permissions) {
        if (onlySigs && (permission.functionSig === null || !onlySigs.has(permission.functionSig))) continue;
        const isGrantedToLabel = permission.grantees.some(g => targets.has(ethers.utils.getAddress(g.address)));
        const isAlsoExcluded = permission.grantees.some(g => excluded.has(ethers.utils.getAddress(g.address)));
        if (isGrantedToLabel && !isAlsoExcluded) {
          matches.push({ contract: contract.name, functionSig: permission.functionSig, roleHash: permission.roleHash });
        }
      }
    }
    result[label] = matches;
  }

  return result;
}

// "NormalTimelock, 0xAbC…" -> "NormalTimelock+0xAbC…" with anything path-hostile replaced.
export const slugify = (labels: string[]) => labels.map(l => l.replace(/[^A-Za-z0-9_.-]+/g, "-")).join("+");

export function renderFilterMd(
  meta: {
    network: Network;
    height: number;
    updatedAt: string;
    grantees: string[];
    exclude: string[];
    legacyOnly?: boolean;
  },
  result: FilterResult,
): string {
  const lines: string[] = [
    `# Permission filter — ${meta.network}`,
    "",
    `- Grantees: ${meta.grantees.join(", ")}`,
    ...(meta.exclude.length ? [`- Excluding permissions also held by: ${meta.exclude.join(", ")}`] : []),
    ...(meta.legacyOnly
      ? ["- Only permissions whose signature exists solely in legacy-signatures.json (no package source proves it)"]
      : []),
    `- Snapshot height: ${meta.height} (updated ${meta.updatedAt})`,
    "",
  ];
  for (const label of meta.grantees) {
    const matches = result[label];
    lines.push(`## ${label} — ${matches.length} permission${matches.length === 1 ? "" : "s"}`, "");
    if (matches.length) {
      lines.push("| Contract | Function | Role hash |", "| --- | --- | --- |");
      for (const m of matches) lines.push(`| ${m.contract} | ${m.functionSig ?? "(undecoded)"} | ${m.roleHash} |`);
      lines.push("");
    }
  }
  return lines.join("\n");
}
