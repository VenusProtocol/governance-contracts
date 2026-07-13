import * as fs from "fs";
import * as path from "path";

import { SNAPSHOTS_DIR } from "../config";
import { Network, SnapshotContract, SnapshotFile, SnapshotPermission } from "../types";

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

export function renderPermissionsMd(file: SnapshotFile): string {
  const lines: string[] = [`# ACM Permissions — ${file.network}`, ""];

  const contractBuckets = file.contracts.filter(c => c.scope === "contract");
  const wildcardPerms = file.contracts.filter(c => c.scope === "wildcard").flatMap(c => c.permissions);
  const unresolvedPerms = file.contracts.filter(c => c.scope === "unresolved").flatMap(c => c.permissions);
  const permissionCount = file.contracts.reduce((sum, c) => sum + c.permissions.length, 0);
  // Derived from the persistent verified/verifiedAt fields on the snapshot itself (set by
  // `fetch`'s diff-verify or a full `acm:verify` run, carried forward unchanged by `refresh`)
  // rather than a per-call boolean, so the header always reflects the last time this exact
  // snapshot was actually checked against the chain — not just whether this render call was
  // triggered by a run that happened to verify something.
  const verification =
    file.verified && file.verifiedAt
      ? `✅ verified on-chain (as of ${file.verifiedAt.slice(0, 10)})`
      : "⚠️ not verified";

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

// Ensures exactly one trailing newline (idempotent — callers that already append "\n"
// themselves are unaffected) so every generated file matches prettier's EOF convention.
// Mirrors cli.ts's writeAtomic so both writers produce identical EOF behavior.
function atomicWrite(target: string, content: string): void {
  const tmp = `${target}.tmp`;
  const withNewline = content.endsWith("\n") ? content : content + "\n";
  fs.writeFileSync(tmp, withNewline);
  fs.renameSync(tmp, target);
}

// Writes the rendered permissions view (permissions.md + unresolved-roles.json). Run deltas are
// deliberately NOT written to files — permissions.json/md are committed, so `git diff` on them
// IS the change log; the fetch/verify console summaries cover the current run.
// Deletes unresolved-roles.json when the unresolved bucket is empty, so a role that becomes
// decodable doesn't leave a stale (now-empty-of-that-entry, but not deleted) file behind.
//
// `baseDir` exists so tests can write to a scratch directory instead of the real snapshots/
// tree; production callers omit it and get SNAPSHOTS_DIR.
export function writePermissionsOutputs(
  network: Network,
  file: SnapshotFile,
  names: Record<string, string>,
  baseDir: string = SNAPSHOTS_DIR,
): void {
  const dir = path.join(baseDir, network);
  fs.mkdirSync(dir, { recursive: true });

  atomicWrite(path.join(dir, "permissions.md"), renderPermissionsMd(file));

  const unresolvedFile = path.join(dir, "unresolved-roles.json");
  const unresolved = file.contracts.find((c: SnapshotContract) => c.scope === "unresolved");
  if (unresolved && unresolved.permissions.length > 0) {
    atomicWrite(unresolvedFile, JSON.stringify(unresolved.permissions, null, 2) + "\n");
  } else if (fs.existsSync(unresolvedFile)) {
    fs.rmSync(unresolvedFile);
  }
}
