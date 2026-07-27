import { ethers } from "ethers";
import * as fs from "fs";
import * as path from "path";

import { REGISTRY_DIR, isLegacyAcm } from "../config";
import { Network } from "../types";

const readJson = (f: string) => JSON.parse(fs.readFileSync(f, "utf8"));
const contractsFile = (n: Network) => path.join(REGISTRY_DIR, "contracts", `${n}.json`);

export function loadNameMap(network: Network): Record<string, string> {
  const f = contractsFile(network);
  if (!fs.existsSync(f)) {
    console.warn(`[registry] missing ${f} — names will be raw addresses`);
    return {};
  }
  return readJson(f);
}
export function nameFor(map: Record<string, string>, address: string): string {
  const key = ethers.utils.getAddress(address);
  return map[key] || key;
}
function loadGeneratedSignatures(): Set<string> {
  const fresh = path.join(REGISTRY_DIR, "signatures.json");
  const sigs = new Set<string>();
  if (fs.existsSync(fresh)) {
    const data = readJson(fresh);
    // Current format groups signatures per contract; the flat `signatures` array is the
    // pre-grouping format, still accepted so an older checkout of the file keeps working.
    for (const c of data.contracts ?? []) for (const s of c.signatures) sigs.add(s);
    for (const s of data.signatures ?? []) sigs.add(s);
  }
  return sigs;
}

export function loadSignatures(): string[] {
  const sigs = loadGeneratedSignatures();
  for (const e of readJson(path.join(REGISTRY_DIR, "legacy-signatures.json")).signatures) sigs.add(e.signature);
  return [...sigs].sort();
}

// Signatures that ONLY the manual legacy file proves — i.e. no current package source
// contains them. Permissions using these strings are the ones the packages cannot explain.
export function loadLegacyOnlySignatures(): string[] {
  const generated = loadGeneratedSignatures();
  const legacy: string[] = readJson(path.join(REGISTRY_DIR, "legacy-signatures.json")).signatures.map(
    (e: { signature: string }) => e.signature,
  );
  return [...new Set(legacy.filter(s => !generated.has(s)))].sort();
}

// Appends signatures that a registry rebuild dropped from signatures.json (string removed
// from the source contracts) to the legacy file, so the record of every string ever used
// for decoding is never lost. Skips signatures already present. Returns how many were added.
export function recordDroppedSignatures(
  dropped: string[],
  filePath: string = path.join(REGISTRY_DIR, "legacy-signatures.json"),
): number {
  if (dropped.length === 0) return 0;
  const data = readJson(filePath);
  const present = new Set(data.signatures.map((e: { signature: string }) => e.signature));
  const additions = [...new Set(dropped)].filter(s => !present.has(s));
  for (const s of additions) {
    data.signatures.push({
      signature: s,
      origin: `dropped from generated signatures.json on ${new Date()
        .toISOString()
        .slice(0, 10)} — string no longer found in any source package`,
    });
  }
  if (additions.length) {
    data.signatures.sort((a: { signature: string }, b: { signature: string }) =>
      a.signature < b.signature ? -1 : a.signature > b.signature ? 1 : 0,
    );
    fs.writeFileSync(filePath + ".tmp", JSON.stringify(data, null, 2) + "\n");
    fs.renameSync(filePath + ".tmp", filePath);
  }
  return additions.length;
}
// Deliberately does NOT include the zero address: the deployed bscmainnet ACM derives its
// wildcard role from 32 zero bytes (handled directly in buildHashTable), never from the
// 20-byte address(0) — a role that somehow matched that form would be a broken grant the
// ACM ignores, and it should surface as unresolved rather than decode as a wildcard.
export function loadKnownAddresses(network: Network): string[] {
  const set = new Set<string>(Object.keys(loadNameMap(network)));
  if (network === "bscmainnet")
    for (const c of readJson(path.join(REGISTRY_DIR, "legacy-contracts.json")).contracts)
      set.add(ethers.utils.getAddress(c.address));
  return [...set];
}
export function requireSignaturesForLegacy(network: Network): void {
  if (isLegacyAcm(network) && !fs.existsSync(path.join(REGISTRY_DIR, "signatures.json")))
    throw new Error("bscmainnet fetch requires registry/signatures.json — run `yarn acm:build-registry` first");
}
