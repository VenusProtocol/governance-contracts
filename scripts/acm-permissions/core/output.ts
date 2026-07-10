import * as fs from "fs";
import * as path from "path";

import { snapshotDir } from "../config";
import {
  Correction,
  DiffEntry,
  Network,
  SnapshotContract,
  SnapshotDiff,
  SnapshotFile,
  SnapshotPermission,
} from "../types";
import { nameFor } from "./registry";

interface RunMeta {
  network: string;
  fromBlock: number;
  toBlock: number;
  date: string;
}

// Sorts a DISPLAY COPY of a permission's grantees by name; never mutates the input
// (grantee arrays in SnapshotFile are chronological and must round-trip losslessly).
function granteesCell(perm: SnapshotPermission): string {
  return [...perm.grantees]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(g => g.name)
    .join(", ");
}

function pushTrimmed(lines: string[]): string {
  while (lines.length && lines[lines.length - 1] === "") lines.pop();
  return lines.join("\n") + "\n";
}

export function renderPermissionsMd(file: SnapshotFile, verified: boolean): string {
  const lines: string[] = [`# ACM Permissions — ${file.network}`, ""];

  const contractBuckets = file.contracts.filter(c => c.scope === "contract");
  const wildcardPerms = file.contracts.filter(c => c.scope === "wildcard").flatMap(c => c.permissions);
  const unresolvedPerms = file.contracts.filter(c => c.scope === "unresolved").flatMap(c => c.permissions);
  const permissionCount = file.contracts.reduce((sum, c) => sum + c.permissions.length, 0);
  const verification = verified ? "✅ verified on-chain" : "⚠️ not verified this run";

  lines.push(
    `Snapshot block: ${file.height} · Updated: ${file.updatedAt.slice(0, 10)} · ` +
      `Contracts: ${contractBuckets.length} · Permissions: ${permissionCount} · Verification: ${verification}`,
    "",
  );

  for (const bucket of contractBuckets) {
    lines.push(`## ${bucket.name} (\`${bucket.address}\`)`, "", "| Function | Grantees |", "| --- | --- |");
    for (const perm of bucket.permissions) {
      lines.push(`| \`${perm.functionSig}\` | ${granteesCell(perm)} |`);
    }
    lines.push("");
  }

  if (wildcardPerms.length > 0) {
    lines.push("## 🃏 Wildcard permissions", "", "| Function | Grantees |", "| --- | --- |");
    for (const perm of wildcardPerms) {
      lines.push(`| \`${perm.functionSig}\` | ${granteesCell(perm)} |`);
    }
    lines.push("");
  }

  if (unresolvedPerms.length > 0) {
    lines.push("## ⚠️ Unresolved roles", "", "| Role hash | Grantees | Transactions |", "| --- | --- | --- |");
    for (const perm of unresolvedPerms) {
      lines.push(`| \`${perm.roleHash}\` | ${granteesCell(perm)} | ${(perm.transactions ?? []).join(", ")} |`);
    }
    lines.push("");
  }

  return pushTrimmed(lines);
}

// "<ContractName or roleHash> `<functionSig>`" — falls back to the roleHash for entries whose
// contract/function could not be resolved (undecoded / unresolved roles).
function entryLabel(entry: DiffEntry, names: Record<string, string>): string {
  const name = entry.contractAddress ? nameFor(names, entry.contractAddress) : entry.roleHash;
  const sig = entry.functionSig ?? entry.roleHash;
  return `${name} \`${sig}\``;
}

export function renderChangesMd(
  diff: SnapshotDiff,
  corrections: Correction[],
  meta: RunMeta,
  names: Record<string, string>,
): string {
  const lines: string[] = [
    `# Changes — ${meta.network} (run ${meta.date}, blocks ${meta.fromBlock} → ${meta.toBlock})`,
    "",
  ];

  if (diff.added.length === 0 && diff.removed.length === 0 && corrections.length === 0) {
    lines.push("No changes.");
    return pushTrimmed(lines);
  }

  lines.push(`## Added (${diff.added.length})`, "");
  for (const entry of diff.added) lines.push(`- ${entryLabel(entry, names)} → ${nameFor(names, entry.account)}`);
  lines.push("");

  lines.push(`## Removed (${diff.removed.length})`, "");
  for (const entry of diff.removed) lines.push(`- ${entryLabel(entry, names)} ⇸ ${nameFor(names, entry.account)}`);
  lines.push("");

  if (corrections.length > 0) {
    lines.push("## Corrections (on-chain authoritative)", "");
    for (const c of corrections) {
      // Arrow reflects the chain-authoritative outcome, not what replay said: a grantee the
      // chain confirms holds the permission gets →, one the chain confirms does not gets ⇸.
      const arrow = c.chainSays === "granted" ? "→" : "⇸";
      lines.push(
        `- ${entryLabel(c.entry, names)} ${arrow} ${nameFor(names, c.entry.account)} — replay said ` +
          `**${c.replaySaid}**, chain says **${c.chainSays}**; snapshot reverted to chain.`,
      );
    }
    lines.push("");
  }

  return pushTrimmed(lines);
}

export function changesJson(diff: SnapshotDiff, corrections: Correction[], meta: RunMeta): object {
  return { ...meta, added: diff.added, removed: diff.removed, corrections };
}

function atomicWrite(target: string, content: string): void {
  const tmp = `${target}.tmp`;
  fs.writeFileSync(tmp, content);
  fs.renameSync(tmp, target);
}

export function writeRunOutputs(
  network: Network,
  file: SnapshotFile,
  diff: SnapshotDiff,
  corrections: Correction[],
  meta: RunMeta,
  names: Record<string, string>,
): void {
  const dir = snapshotDir(network);
  fs.mkdirSync(dir, { recursive: true });

  const verified = corrections.length === 0;
  atomicWrite(path.join(dir, "permissions.md"), renderPermissionsMd(file, verified));
  atomicWrite(path.join(dir, "changes.md"), renderChangesMd(diff, corrections, meta, names));
  atomicWrite(path.join(dir, "changes.json"), JSON.stringify(changesJson(diff, corrections, meta), null, 2) + "\n");

  const unresolved = file.contracts.find((c: SnapshotContract) => c.scope === "unresolved");
  if (unresolved && unresolved.permissions.length > 0) {
    atomicWrite(path.join(dir, "unresolved-roles.json"), JSON.stringify(unresolved.permissions, null, 2) + "\n");
  }
}
