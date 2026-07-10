import "dotenv/config";
import { ethers } from "ethers";
import * as fs from "fs";
import { parseArgs } from "node:util";
import * as path from "path";

import { REGISTRY_DIR, STARTING_BLOCKS, acmAddress, isLegacyAcm, rpcUrl, snapshotDir } from "./config";
import { buildHashTable } from "./core/decoder";
import { diffSnapshots } from "./core/diff";
import { scanRange } from "./core/fetcher";
import { writeRunOutputs } from "./core/output";
import { applyEvents } from "./core/reducer";
import { loadKnownAddresses, loadNameMap, loadSignatures, nameFor, requireSignaturesForLegacy } from "./core/registry";
import { fileToState, loadSnapshotFile, reannotateUndecoded, saveSnapshotFile, stateToFile } from "./core/snapshot";
import { ACM_ABI, AcmLike, verifyAll, verifyDiff } from "./core/verifier";
import { buildContractRegistry } from "./registry-builder/contracts";
import { buildSignatures } from "./registry-builder/signatures";
import { loadManifest, resolveSource } from "./registry-builder/sources";
import { DiffEntry, NETWORKS, Network } from "./types";

const writeAtomic = (file: string, data: string) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file + ".tmp", data);
  fs.renameSync(file + ".tmp", file);
};

async function buildRegistry() {
  const roots = loadManifest().map(resolveSource);
  const { signatures, dynamicCallsites } = buildSignatures(roots);
  const prevFile = path.join(REGISTRY_DIR, "signatures.json");
  const prev: string[] = fs.existsSync(prevFile) ? JSON.parse(fs.readFileSync(prevFile, "utf8")).signatures : [];
  const appeared = signatures.filter(s => !prev.includes(s)),
    disappeared = prev.filter(s => !signatures.includes(s));
  writeAtomic(prevFile, JSON.stringify({ generatedAt: new Date().toISOString(), signatures }, null, 2));
  console.log(`signatures: ${signatures.length} (+${appeared.length} / -${disappeared.length})`);
  disappeared.forEach(s => console.log(`  disappeared: ${s}`));
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
  if (scan.upToDate) return { network, status: "up-to-date" as const };
  const diff = diffSnapshots(prevState, state);
  const acm = new ethers.Contract(acmAddr, ACM_ABI, provider) as unknown as AcmLike;
  const corrections = await verifyDiff(acm, network, diff, state);
  const file = stateToFile(state, { ...meta(), height: scan.toBlock }, names);
  saveSnapshotFile(network, file);
  writeRunOutputs(
    network,
    file,
    diff,
    corrections,
    { network, fromBlock, toBlock: scan.toBlock, date: new Date().toISOString() },
    names,
  );
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
  | { network: Network; status: "ok"; verified: number; mismatches: DiffEntry[] };

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
  const mismatches = await verifyAll(acm, network, state);
  for (const entry of mismatches) {
    const contract = entry.contractAddress === null ? "UNRESOLVED" : nameFor(names, entry.contractAddress);
    const sig = entry.functionSig ?? entry.roleHash;
    const grantee = nameFor(names, entry.account);
    console.log(`MISMATCH ${network} ${contract}.${sig} grantee ${grantee} — in snapshot but not on-chain`);
  }
  return { network, status: "ok" as const, verified: total, mismatches };
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
      else {
        if (r.mismatches.length > 0) anyFailed = true;
        console.log(`${network}: ${r.verified} entries verified, ${r.mismatches.length} mismatches`);
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
  return requested as Network[];
}

async function fetchCommand(values: {
  network?: string;
  "chunk-size"?: string;
  to?: string;
  rebuild?: boolean;
}): Promise<void> {
  let selected: Network[];
  try {
    selected = resolveNetworks(values.network ?? "all");
  } catch (e) {
    console.error((e as Error).message);
    process.exit(2);
  }
  const chunkSize = parseInt(values["chunk-size"] ?? "40000", 10);
  const toBlock = values.to !== undefined ? parseInt(values.to, 10) : undefined;
  const rebuild = !!values.rebuild;

  const results = await Promise.allSettled(selected.map(n => fetchNetwork(n, { chunkSize, toBlock, rebuild })));

  console.log("\n=== fetch summary ===");
  let anyFailed = false;
  results.forEach((result, i) => {
    const network = selected[i];
    if (result.status === "fulfilled") {
      const r = result.value;
      if (r.status === "up-to-date") console.log(`${network}: up-to-date`);
      else console.log(`${network}: ok (added ${r.added} removed ${r.removed} corrections ${r.corrections})`);
    } else {
      anyFailed = true;
      const message = result.reason instanceof Error ? result.reason.message : String(result.reason);
      console.log(`${network}: FAILED: ${message}`);
    }
  });

  if (anyFailed) process.exit(1);
}

(async () => {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: {
      network: { type: "string", default: "all" },
      "chunk-size": { type: "string", default: "40000" },
      rebuild: { type: "boolean", default: false },
      to: { type: "string" },
      grantees: { type: "string" },
      out: { type: "string" },
    },
  });
  const cmd = positionals[0];
  if (cmd === "build-registry") await buildRegistry();
  else if (cmd === "fetch") await fetchCommand(values);
  else if (cmd === "verify") await verifyCommand(values);
  else if (cmd === "filter") throw new Error(`${cmd}: implemented in a later task`);
  else {
    console.error("usage: cli.ts <build-registry|fetch|verify|filter> [--network all]");
    process.exit(2);
  }
})().catch(e => {
  console.error(e);
  process.exit(1);
});
