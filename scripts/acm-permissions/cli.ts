import "dotenv/config";
import { ethers } from "ethers";
import * as fs from "fs";
import { parseArgs } from "node:util";
import * as path from "path";

import { REGISTRY_DIR, STARTING_BLOCKS, acmAddress, filtersDir, isLegacyAcm, rpcUrl, snapshotDir } from "./config";
import { buildHashTable } from "./core/decoder";
import { diffSnapshots } from "./core/diff";
import { scanRange } from "./core/fetcher";
import { expandAliases, filterPermissions, renderFilterMd, slugify } from "./core/filter";
import { writePermissionsOutputs } from "./core/output";
import { applyEvents } from "./core/reducer";
import { refreshNetwork } from "./core/refresh";
import {
  loadKnownAddresses,
  loadLegacyOnlySignatures,
  loadNameMap,
  loadSignatures,
  nameFor,
  recordDroppedSignatures,
  requireSignaturesForLegacy,
} from "./core/registry";
import { fileToState, loadSnapshotFile, reannotateUndecoded, saveSnapshotFile, stateToFile } from "./core/snapshot";
import { ACM_ABI, AcmLike, verifyAllAndFix, verifyDiff } from "./core/verifier";
import { buildContractRegistry } from "./registry-builder/contracts";
import { buildSignatures, flattenSignatures } from "./registry-builder/signatures";
import { loadManifest, resolveSource } from "./registry-builder/sources";
import { NETWORKS, Network, SnapshotFile } from "./types";

// Ensures exactly one trailing newline (idempotent — callers that already append "\n"
// themselves are unaffected) so every generated file matches prettier's EOF convention.
// Mirrors core/output.ts's atomicWrite so both writers produce identical EOF behavior.
const writeAtomic = (file: string, data: string) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const content = data.endsWith("\n") ? data : data + "\n";
  fs.writeFileSync(file + ".tmp", content);
  fs.renameSync(file + ".tmp", file);
};

async function buildRegistry() {
  const roots = loadManifest().map(resolveSource);
  const { contracts, dynamicCallsites } = buildSignatures(roots);
  const signatures = flattenSignatures(contracts);
  const prevFile = path.join(REGISTRY_DIR, "signatures.json");
  const prevRaw = fs.existsSync(prevFile) ? JSON.parse(fs.readFileSync(prevFile, "utf8")) : null;
  // Diff against either format: grouped (current) or the flat pre-grouping array.
  const prev: string[] = prevRaw ? prevRaw.signatures ?? flattenSignatures(prevRaw.contracts ?? []) : [];
  const appeared = signatures.filter(s => !prev.includes(s)),
    disappeared = prev.filter(s => !signatures.includes(s));
  writeAtomic(prevFile, JSON.stringify({ generatedAt: new Date().toISOString(), contracts }, null, 2));
  console.log(
    `signatures: ${signatures.length} unique across ${contracts.length} contracts (+${appeared.length} / -${disappeared.length})`,
  );
  disappeared.forEach(s => console.log(`  disappeared: ${s}`));
  // A string removed from the sources vanishes from the regenerated file, but roles hashed
  // from it may still be granted on-chain — archive it in the manual legacy file so the full
  // record of every string ever used for decoding survives rebuilds.
  const archived = recordDroppedSignatures(disappeared);
  if (archived) console.log(`  recorded ${archived} dropped signature(s) in legacy-signatures.json`);
  if (dynamicCallsites.length) {
    console.log(`⚠ dynamic checkAccessAllowed callsites (manual review):`);
    dynamicCallsites.forEach(d => console.log("  " + d));
  }
  for (const n of NETWORKS) {
    const reg = buildContractRegistry(n as Network, roots);
    writeAtomic(path.join(REGISTRY_DIR, "contracts", `${n}.json`), JSON.stringify(reg, null, 2));
    console.log(`${n}: ${Object.keys(reg).length} named contracts`);
  }
}

type FetchResult =
  | { network: Network; status: "up-to-date" }
  | { network: Network; status: "ok"; added: number; removed: number; corrections: number };

async function fetchNetwork(
  network: Network,
  opts: { chunkSize: number; toBlock?: number; rebuild: boolean },
): Promise<FetchResult> {
  requireSignaturesForLegacy(network);
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl(network));
  const acmAddr = acmAddress(network);
  const names = loadNameMap(network);
  const table = isLegacyAcm(network) ? buildHashTable(loadKnownAddresses(network), loadSignatures()) : null;
  if (opts.rebuild) fs.rmSync(snapshotDir(network), { recursive: true, force: true });
  const prevFile = loadSnapshotFile(network);
  const state = prevFile ? fileToState(prevFile) : {};
  // Re-annotate any previously-undecoded roles using the (possibly grown) legacy hash table
  // BEFORE taking the deep copy below, so re-annotation alone never shows up as a diff.
  reannotateUndecoded(state, table);
  const prevState = JSON.parse(JSON.stringify(state)); // deep copy for diffing
  const fromBlock = (prevFile?.height ?? STARTING_BLOCKS[network] - 1) + 1;
  const meta = () => ({ network, acmAddress: acmAddr, height: 0, updatedAt: new Date().toISOString() });
  const scan = await scanRange({
    provider,
    network,
    acmAddress: acmAddr,
    table,
    fromBlock,
    toBlock: opts.toBlock,
    chunkSize: opts.chunkSize,
    log: console.log,
    onChunk: (events, end) => {
      applyEvents(state, events);
      saveSnapshotFile(network, stateToFile(state, { ...meta(), height: end }, names));
    },
  }); // checkpoint
  // Up to date: the re-annotation applied to `state` above is discarded unsaved here (no
  // rewrite on a no-op run) — that's fine, `yarn acm:refresh` exists precisely to persist
  // re-annotation without a rescan.
  if (scan.upToDate) return { network, status: "up-to-date" as const };
  const diff = diffSnapshots(prevState, state);
  const acm = new ethers.Contract(acmAddr, ACM_ABI, provider) as unknown as AcmLike;
  const corrections = await verifyDiff(acm, network, diff, state, { blockTag: scan.toBlock });
  // Corrections only live in the console now (changes.md/json are gone — `git diff` on the
  // committed permissions.json/md is the change log), so print each one in full.
  for (const c of corrections) {
    const contract = c.entry.contractAddress === null ? c.entry.roleHash : nameFor(names, c.entry.contractAddress);
    console.log(
      `[${network}] correction: ${contract} ${c.entry.functionSig ?? ""} grantee ` +
        `${nameFor(names, c.entry.account)} — replay said ${c.replaySaid}, chain says ${c.chainSays}; ` +
        `snapshot follows chain`,
    );
  }
  // Diff-verify always runs when there were changes (above) and, having completed without
  // throwing, has reconciled `state` against the chain (applying `corrections` where replay
  // disagreed) — so the snapshot this run produces is verified on-chain as of right now,
  // regardless of whether any corrections were needed.
  const verifiedAt = new Date().toISOString();
  const file = stateToFile(state, { ...meta(), height: scan.toBlock, verified: true, verifiedAt }, names);
  saveSnapshotFile(network, file);
  writePermissionsOutputs(network, file, names);
  return {
    network,
    status: "ok" as const,
    added: diff.added.length,
    removed: diff.removed.length,
    corrections: corrections.length,
  };
}

type VerifyResult =
  | { network: Network; status: "skipped" }
  | { network: Network; status: "ok"; verified: number; fixed: string[] };

// Full on-chain verification, chain-authoritative: every snapshot entry the chain denies is
// dropped from the snapshot (the same correction fetch's diff-verify applies to false adds),
// the fixed snapshot is saved and re-rendered, and verified/verifiedAt is stamped — after the
// fixes the snapshot matches the chain for everything checkable. The reverse direction (a
// grant the chain has but the snapshot lacks) is undetectable without an event scan; the next
// fetch picks those up. Never touches height: fixes are chain-state corrections, not a rescan.
// Opt-in: runs after a fetch only with `--verify`, or explicitly via `yarn acm:verify` — the
// mandatory diff-verify inside fetchNetwork already checks every entry that changed, so the
// full sweep is an independent audit, not a routine requirement.
async function verifyNetwork(network: Network): Promise<VerifyResult> {
  const file = loadSnapshotFile(network);
  if (!file) {
    console.warn(`[${network}] no snapshot — skipping`);
    return { network, status: "skipped" as const };
  }
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl(network));
  const acm = new ethers.Contract(acmAddress(network), ACM_ABI, provider) as unknown as AcmLike;
  const state = fileToState(file);
  const names = loadNameMap(network);
  const total = Object.values(state).reduce((sum, role) => sum + role.grantees.length, 0);
  // Human-readable labels for the fixed entries: logged here at fix time, and returned so the
  // final summary block can repeat them (in a parallel multi-network run, lines printed here
  // scroll away among the per-chunk logs).
  const fixed = (await verifyAllAndFix(acm, network, state)).map(entry => {
    const contract = entry.contractAddress === null ? "UNRESOLVED" : nameFor(names, entry.contractAddress);
    const sig = entry.functionSig ?? entry.roleHash;
    return `${contract}.${sig} grantee ${nameFor(names, entry.account)}`;
  });
  for (const label of fixed) console.log(`FIXED ${network} ${label} — in snapshot but not on-chain; removed`);
  const stampedFile: SnapshotFile = stateToFile(
    state,
    {
      network: file.network,
      acmAddress: file.acmAddress,
      height: file.height,
      updatedAt: file.updatedAt,
      verified: true,
      verifiedAt: new Date().toISOString(),
    },
    names,
  );
  saveSnapshotFile(network, stampedFile);
  writePermissionsOutputs(network, stampedFile, names);
  return { network, status: "ok" as const, verified: total, fixed };
}

async function verifyCommand(values: { network?: string }): Promise<void> {
  let selected: Network[];
  try {
    selected = resolveNetworks(values.network ?? "all");
  } catch (e) {
    console.error((e as Error).message);
    process.exit(2);
  }

  const results = await Promise.allSettled(selected.map(n => verifyNetwork(n)));

  console.log("\n=== verify summary ===");
  let anyFailed = false;
  results.forEach((result, i) => {
    const network = selected[i];
    if (result.status === "fulfilled") {
      const r = result.value;
      if (r.status === "skipped") console.log(`${network}: skipped (no snapshot)`);
      // Mismatches are fixed in place (chain-authoritative), so they don't fail the run —
      // only an RPC/IO error that prevented verification does.
      else {
        console.log(`${network}: ${r.verified} entries verified, ${r.fixed.length} fixed`);
        for (const label of r.fixed) console.log(`  fixed: ${label} — was in snapshot but not on-chain; removed`);
      }
    } else {
      anyFailed = true;
      const message = result.reason instanceof Error ? result.reason.message : String(result.reason);
      console.log(`${network}: FAILED: ${message}`);
    }
  });

  if (anyFailed) process.exit(1);
}

function resolveNetworks(arg: string): Network[] {
  if (arg === "all") return [...NETWORKS];
  const requested = arg.split(",").map(s => s.trim());
  const unknown = requested.filter(n => !(NETWORKS as readonly string[]).includes(n));
  if (unknown.length > 0) {
    throw new Error(`unknown network(s): ${unknown.join(", ")} — expected one of ${NETWORKS.join(", ")} or "all"`);
  }
  // Dedupe so a repeated name (e.g. `--network bscmainnet,bscmainnet`) doesn't spawn two
  // concurrent tasks racing on the same snapshot directory.
  return [...new Set(requested)] as Network[];
}

function resolveSingleNetwork(arg: string): Network {
  if (arg === "all" || arg.includes(",")) {
    throw new Error(`filter requires exactly one --network (got "${arg}") — "all" and lists are not supported`);
  }
  if (!(NETWORKS as readonly string[]).includes(arg)) {
    throw new Error(`unknown network: ${arg} — expected one of ${NETWORKS.join(", ")}`);
  }
  return arg as Network;
}

function filterCommand(values: {
  network?: string;
  grantees?: string;
  exclude?: string;
  "legacy-only"?: boolean;
  out?: string;
}): void {
  let network: Network;
  try {
    network = resolveSingleNetwork(values.network ?? "all");
  } catch (e) {
    console.error((e as Error).message);
    process.exit(2);
  }

  if (!values.grantees) {
    console.error("filter requires --grantees <label1,label2,...>");
    process.exit(2);
  }
  const rawGrantees = values.grantees.split(",").map(s => s.trim());
  const rawExclude = values.exclude ? values.exclude.split(",").map(s => s.trim()) : [];
  const grantees = expandAliases(rawGrantees, network);
  const exclude = expandAliases(rawExclude, network);
  const legacyOnly = values["legacy-only"] ?? false;
  const onlySigs = legacyOnly ? new Set(loadLegacyOnlySignatures()) : null;

  const file = loadSnapshotFile(network);
  if (!file) {
    console.error(`no snapshot for ${network} — run \`yarn acm:fetch --network ${network}\` first`);
    process.exit(1);
  }

  const result = filterPermissions(file, grantees, network, loadNameMap(network), exclude, onlySigs);

  for (const label of grantees) {
    const matches = result[label];
    console.log(`### ${label} — ${matches.length} permissions`);
    for (const m of matches) console.log(`${m.contract} ${m.functionSig ?? m.roleHash}`);
  }

  const meta = { network, height: file.height, updatedAt: file.updatedAt, grantees, exclude, legacyOnly };
  const report = { ...meta, generatedAt: new Date().toISOString(), results: result };
  const slug =
    slugify(rawGrantees) +
    (rawExclude.length ? `-minus-${slugify(rawExclude)}` : "") +
    (legacyOnly ? "-legacy-only" : "");
  const jsonPath = values.out ?? path.join(filtersDir(network), `${slug}.json`);
  writeAtomic(jsonPath, JSON.stringify(report, null, 2) + "\n");
  const mdPath = path.join(filtersDir(network), `${slug}.md`);
  writeAtomic(mdPath, renderFilterMd(meta, result));
  console.log(`\nwrote ${jsonPath}`);
  console.log(`wrote ${mdPath}`);
}

async function fetchCommand(values: {
  network?: string;
  "chunk-size"?: string;
  to?: string;
  rebuild?: boolean;
  verify?: boolean;
}): Promise<void> {
  let selected: Network[];
  try {
    selected = resolveNetworks(values.network ?? "all");
  } catch (e) {
    console.error((e as Error).message);
    process.exit(2);
  }
  const chunkSize = parseInt(values["chunk-size"] ?? "40000", 10);
  if (!Number.isFinite(chunkSize) || chunkSize <= 0) {
    console.error(`invalid --chunk-size: ${values["chunk-size"]} — expected a positive integer`);
    process.exit(2);
  }
  let toBlock: number | undefined;
  if (values.to !== undefined) {
    toBlock = parseInt(values.to, 10);
    if (!Number.isFinite(toBlock)) {
      console.error(`invalid --to: ${values.to} — expected an integer block number`);
      process.exit(2);
    }
  }
  const rebuild = !!values.rebuild;

  const results = await Promise.allSettled(
    selected.map(async n => {
      const fetch = await fetchNetwork(n, { chunkSize, toBlock, rebuild });
      // The diff-verify inside fetchNetwork is mandatory and already ran. The full sweep of
      // the final list is opt-in (`--verify`) — replay is exact, so it exists as an
      // independent audit, not a routine step.
      const verify = values.verify ? await verifyNetwork(n) : null;
      return { fetch, verify };
    }),
  );

  console.log("\n=== fetch summary ===");
  let anyFailed = false;
  results.forEach((result, i) => {
    const network = selected[i];
    if (result.status === "fulfilled") {
      const { fetch, verify } = result.value;
      const fetchPart =
        fetch.status === "up-to-date"
          ? "up-to-date"
          : `ok (added ${fetch.added} removed ${fetch.removed} corrections ${fetch.corrections})`;
      const verifyPart =
        verify === null
          ? ""
          : verify.status === "skipped"
          ? " · verify skipped (no snapshot)"
          : ` · verified ${verify.verified} entries, ${verify.fixed.length} fixed`;
      console.log(`${network}: ${fetchPart}${verifyPart}`);
      if (verify?.status === "ok")
        for (const label of verify.fixed) console.log(`  fixed: ${label} — was in snapshot but not on-chain; removed`);
    } else {
      anyFailed = true;
      const message = result.reason instanceof Error ? result.reason.message : String(result.reason);
      console.log(`${network}: FAILED: ${message}`);
    }
  });

  if (anyFailed) process.exit(1);
}

function refreshCommand(values: { network?: string }): void {
  let selected: Network[];
  try {
    selected = resolveNetworks(values.network ?? "all");
  } catch (e) {
    console.error((e as Error).message);
    process.exit(2);
  }

  console.log("\n=== refresh summary ===");
  let anyFailed = false;
  for (const network of selected) {
    try {
      const result = refreshNetwork(network);
      if (result)
        console.log(
          `${network}: ${result.total} roles, ${result.newlyDecoded} newly decoded, ${result.unresolved} still unresolved`,
        );
    } catch (e) {
      anyFailed = true;
      const message = e instanceof Error ? e.message : String(e);
      console.log(`${network}: FAILED: ${message}`);
    }
  }

  if (anyFailed) process.exit(1);
}

// Guarded so importing this module never triggers the CLI dispatch below — only running
// `cli.ts` directly does.
if (require.main === module) {
  (async () => {
    const { positionals, values } = parseArgs({
      allowPositionals: true,
      options: {
        network: { type: "string", default: "all" },
        "chunk-size": { type: "string", default: "40000" },
        rebuild: { type: "boolean", default: false },
        verify: { type: "boolean", default: false },
        to: { type: "string" },
        grantees: { type: "string" },
        exclude: { type: "string" },
        "legacy-only": { type: "boolean" },
        out: { type: "string" },
      },
    });
    const cmd = positionals[0];
    if (cmd === "build-registry") await buildRegistry();
    else if (cmd === "fetch") await fetchCommand(values);
    else if (cmd === "verify") await verifyCommand(values);
    else if (cmd === "filter") filterCommand(values);
    else if (cmd === "refresh") refreshCommand(values);
    else {
      console.error("usage: cli.ts <build-registry|fetch|verify|filter|refresh> [--network all]");
      process.exit(2);
    }
  })().catch(e => {
    console.error(e);
    process.exit(1);
  });
}
