/**
 * Fails if a proxied contract's storage layout is not a compatible upgrade of what is deployed.
 *
 * Old side: the `storageLayout` in the deployment artifact, read from the base branch on a PR so a
 * deploy PR cannot compare new source against its own freshly written artifact. New side: today's
 * source from artifacts/build-info (`hardhat run` compiles first). The rules are OpenZeppelin's.
 *
 *   yarn check:storage-layout                                        against the working tree
 *   STORAGE_LAYOUT_BASE_REF=origin/develop yarn check:storage-layout  against a git ref
 */
import {
  getContractVersion,
  getStorageLayout,
  getStorageUpgradeReport,
  solcInputOutputDecoder,
  validate,
  withValidationDefaults,
} from "@openzeppelin/upgrades-core";
import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";

/** Mainnets only. zksync builds through hardhat.config.zksync.ts into a build-info dir not read here. */
const NETWORKS = [
  "bscmainnet",
  "ethereum",
  "arbitrumone",
  "opbnbmainnet",
  "basemainnet",
  "opmainnet",
  "unichainmainnet",
];

/** hardhat-deploy writes the implementation behind a proxy under this suffix. */
const SUFFIX = "_Implementation.json";

/**
 * Implementations behind GovernorBravoDelegator, which is not a hardhat-deploy proxy, so nothing in
 * the artifacts marks them. Only list contracts that something delegatecalls into.
 */
const DELEGATOR_IMPLS = ["GovernorBravoDelegate"];

const ROOT = path.join(__dirname, "..");
const BUILD_INFO_DIR = path.join(ROOT, "artifacts", "build-info");
const ALLOWLIST_PATH = path.join(__dirname, "storage-layout-allowlist.json");

/** GITHUB_BASE_REF is a bare branch name; `origin/` resolves because CI checks out with fetch-depth: 0.
 *  Empty means the working tree. */
const BASE_REF =
  process.env.STORAGE_LAYOUT_BASE_REF || (process.env.GITHUB_BASE_REF ? `origin/${process.env.GITHUB_BASE_REF}` : "");

/** OZ's StorageLayout, whose type is only exported from dist/. */
type Layout = Parameters<typeof getStorageUpgradeReport>[0];

interface Target {
  key: string;
  fqName?: string;
  deployed?: Layout;
  isNew?: boolean;
  blocked?: string;
}

/** Artifact layouts lack `src`, which OZ requires but only uses in failure messages. */
const normalize = (raw: { storage?: Record<string, unknown>[]; types?: Record<string, unknown> }): Layout =>
  ({
    storage: (raw.storage ?? []).map(item => ({ ...item, src: item.src ?? `${item.contract}:${item.astId ?? 0}` })),
    types: raw.types ?? {},
  } as Layout);

/** Undefined means absent from the reference, i.e. a new deployment. A corrupt artifact throws. */
function readReference(relPath: string): Record<string, unknown> | undefined {
  let raw: string;
  try {
    raw = BASE_REF
      ? execFileSync("git", ["show", `${BASE_REF}:${relPath}`], {
          encoding: "utf8",
          maxBuffer: 1 << 28,
          stdio: ["ignore", "pipe", "ignore"],
        })
      : fs.readFileSync(path.join(ROOT, relPath), "utf8");
  } catch {
    return undefined;
  }
  return JSON.parse(raw);
}

/** Both misconfigurations would otherwise pass having compared nothing. */
function assertReferenceIsUsable(): void {
  if (!BASE_REF) {
    if (!process.env.CI) return;
    console.error(
      "No base ref. GitHub sets GITHUB_BASE_REF on pull_request events only, so this job must be " +
        "gated on `if: github.event_name == 'pull_request'`. Comparing against the working tree " +
        "here would compare the branch with itself.\nSet STORAGE_LAYOUT_BASE_REF to pick a ref explicitly.",
    );
    process.exit(1);
  }
  try {
    execFileSync("git", ["rev-parse", "--verify", `${BASE_REF}^{commit}`], { stdio: "ignore" });
  } catch {
    console.error(
      `Cannot resolve '${BASE_REF}'. Every deployment would look new and this check would pass ` +
        `without comparing anything.\nFetch the base branch (actions/checkout needs fetch-depth: 0) ` +
        `or unset STORAGE_LAYOUT_BASE_REF to compare against the working tree.`,
    );
    process.exit(1);
  }
}

/** Fully qualified name of the contract a deployment was compiled from. */
function readFqName(metadata?: string): string | undefined {
  if (!metadata) return undefined;
  const target = JSON.parse(metadata)?.settings?.compilationTarget;
  const source = target && Object.keys(target)[0];
  return source ? `${source}:${target[source]}` : undefined;
}

/** An unreadable artifact fails its own target rather than the whole run. */
function targetFor(key: string, relPath: string): Target {
  try {
    return toTarget(key, readReference(relPath));
  } catch (error) {
    return { key, blocked: `artifact could not be read: ${(error as Error).message}` };
  }
}

function toTarget(key: string, artifact?: Record<string, unknown>): Target {
  if (!artifact) return { key, isNew: true };
  const layout = artifact.storageLayout as { storage?: Record<string, unknown>[] } | undefined;
  if (!layout) return { key, blocked: "deployment artifact records no storageLayout" };
  const fqName = readFqName(artifact.metadata as string | undefined);
  if (!fqName) return { key, blocked: "deployment artifact records no compiler metadata, so its source is unknown" };
  return { key, fqName, deployed: normalize(layout) };
}

/** File list from the working tree, contents from the base ref, so a deleted deployment drops out. */
function collectTargets(): Target[] {
  const targets: Target[] = [];
  const matched = new Set<string>();

  for (const network of NETWORKS) {
    const dir = path.join(ROOT, "deployments", network);
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir).filter(f => f.endsWith(SUFFIX))) {
      const key = `${network}/${file.slice(0, -SUFFIX.length)}`;
      targets.push(targetFor(key, path.posix.join("deployments", network, file)));
    }
    for (const name of DELEGATOR_IMPLS) {
      if (!fs.existsSync(path.join(dir, `${name}.json`))) continue;
      matched.add(name);
      targets.push(targetFor(`${network}/${name}`, path.posix.join("deployments", network, `${name}.json`)));
    }
  }

  // A name that matched on no network is a typo; its key is outside the allowlist's namespace.
  for (const name of DELEGATOR_IMPLS.filter(n => !matched.has(n))) {
    targets.push({
      key: `DELEGATOR_IMPLS/${name}`,
      blocked: "listed in DELEGATOR_IMPLS but has no deployment file on any network",
    });
  }
  return targets;
}

/** Newest build-info first, so stale files cannot shadow the current compile. Going through
 *  validate() is what makes `@custom:oz-*` annotations count. */
function resolveCurrentLayouts(wanted: Set<string>): Map<string, Layout> {
  const found = new Map<string, Layout>();
  if (!fs.existsSync(BUILD_INFO_DIR)) return found;

  const files = fs
    .readdirSync(BUILD_INFO_DIR)
    .filter(f => f.endsWith(".json"))
    .map(f => path.join(BUILD_INFO_DIR, f))
    .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);

  for (const file of files) {
    if (found.size === wanted.size) break;
    const { input, output, solcVersion } = JSON.parse(fs.readFileSync(file, "utf8"));
    const present = [...wanted].filter(fq => !found.has(fq) && hasContract(output, fq));
    if (present.length === 0) continue;

    const validation = validate(output, solcInputOutputDecoder(input, output), solcVersion, input);
    for (const fqName of present) {
      // Throws for interfaces and abstract contracts; the caller reports them as missing.
      try {
        found.set(fqName, getStorageLayout(validation, getContractVersion(validation, fqName)));
      } catch {
        continue;
      }
    }
  }
  return found;
}

function hasContract(output: { contracts?: Record<string, Record<string, unknown>> }, fqName: string): boolean {
  const at = fqName.lastIndexOf(":");
  return Boolean(output.contracts?.[fqName.slice(0, at)]?.[fqName.slice(at + 1)]);
}

const STRICT = withValidationDefaults({});
const LENIENT = withValidationDefaults({ unsafeAllowCustomTypes: true });

/**
 * Artifacts never record enum members, so OZ cannot compare an enum slot (`UpdateStatus` in
 * RiskStewardReceiver). The lenient mode skips every type missing members across the whole target,
 * so it is used only where such an enum exists; structs are still compared because solc always
 * records their members. Blind spot: reordering an enum's members is not caught.
 */
const hasMemberlessEnum = (layout: Layout): boolean =>
  Object.entries((layout as unknown as { types: Record<string, { members?: unknown }> }).types).some(
    ([name, type]) => name.startsWith("t_enum") && type.members === undefined,
  );

/** Undefined when compatible. A contract missing from build-info fails rather than skips. */
function check(target: Target, current: Map<string, Layout>): string | undefined {
  const updated = target.fqName ? current.get(target.fqName) : undefined;
  if (!updated) return `${target.fqName} was not found in artifacts/build-info`;
  const deployed = target.deployed as Layout;
  const report = getStorageUpgradeReport(deployed, updated, hasMemberlessEnum(deployed) ? LENIENT : STRICT);
  return report.ok ? undefined : report.explain(false);
}

interface Results {
  failures: string[];
  /** Allowlisted targets that now pass. */
  stale: string[];
}

type Verdict =
  | { kind: "new" }
  | { kind: "ok" }
  /** Not comparable, but allowlisted. */
  | { kind: "skipped" }
  | { kind: "stale" }
  | { kind: "failed"; detail: string };

/** The allowlist excuses a target that cannot be compared, never one that compares badly. */
function verdictFor(target: Target, current: Map<string, Layout>, allowlist: Record<string, string>): Verdict {
  if (target.isNew) return { kind: "new" };
  const allowed = target.key in allowlist;
  if (target.blocked) return allowed ? { kind: "skipped" } : { kind: "failed", detail: target.blocked };
  const detail = check(target, current);
  if (detail) return { kind: "failed", detail };
  return allowed ? { kind: "stale" } : { kind: "ok" };
}

const indent = (text: string): string => text.replace(/^/gm, "      ");

function classify(targets: Target[], current: Map<string, Layout>, allowlist: Record<string, string>): Results {
  const results: Results = { failures: [], stale: [] };

  for (const target of targets) {
    const verdict = verdictFor(target, current, allowlist);
    if (verdict.kind === "failed") {
      results.failures.push(`  FAILED    ${target.key}  (${target.fqName ?? "unresolved"})\n${indent(verdict.detail)}`);
    } else if (verdict.kind === "stale") {
      results.stale.push(target.key);
    } else {
      const source = verdict.kind === "ok" ? `  (${target.fqName})` : "";
      console.log(`  ${verdict.kind.padEnd(9)} ${target.key}${source}`);
    }
  }
  return results;
}

function main(): void {
  assertReferenceIsUsable();

  const allowlist: Record<string, string> = fs.existsSync(ALLOWLIST_PATH)
    ? JSON.parse(fs.readFileSync(ALLOWLIST_PATH, "utf8")).skip ?? {}
    : {};

  const targets = collectTargets();
  const current = resolveCurrentLayouts(new Set(targets.flatMap(t => t.fqName ?? [])));

  console.log(`Reference: ${BASE_REF || "working tree"} | ${targets.length} deployed implementations\n`);
  const { failures, stale } = classify(targets, current, allowlist);

  failures.forEach(f => console.log(`\n${f}`));
  // A stale allowlist entry fails the run like a real failure.
  const verdict = failures.length === 0 && stale.length === 0 ? "PASSED" : "FAILED";
  const staleCount = stale.length > 0 ? `, ${stale.length} stale` : "";
  console.log(`\n${verdict} (${targets.length} checked, ${failures.length} incompatible${staleCount})`);

  if (stale.length > 0) {
    console.log(
      `\nThese now pass -- delete them from storage-layout-allowlist.json:\n${stale.map(s => `  ${s}`).join("\n")}`,
    );
  }
  if (verdict === "FAILED") process.exit(1);
}

main();
