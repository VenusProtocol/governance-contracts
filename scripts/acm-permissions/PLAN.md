# ACM Permissions Tooling Rewrite — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `scripts/ACMPermissions/` with a standalone, resumable, parallel CLI (`fetch | verify | filter | build-registry`) that snapshots every ACM permission on all 16 Venus networks into JSON + Markdown with per-run diff reports, per the approved spec at `scripts/acm-permissions/DESIGN.md`.

**Architecture:** Event-sourced state reconstruction (chunked `getLogs` scans with per-chunk checkpoints), a generated signature/contract-name registry for bscmainnet role-hash decoding and human-readable output, on-chain verification of each run's diff (chain wins on discrepancy), all networks fetched concurrently in one process via plain ethers v5 providers.

**Tech Stack:** TypeScript (repo's ts-node 10 / TS 4.9), ethers **v5.7** (already installed), Node 20 built-ins (`util.parseArgs`, `fetch`, `child_process`), mocha+chai via `npx hardhat test`. **No new npm dependencies.**

## Global Constraints

- **No new entries in `package.json` `dependencies`/`devDependencies`.** External Venus packages are fetched as tarballs into a git-ignored cache (spec §5.3), never installed.
- ethers v5 API only (`ethers.utils.*`, `ethers.providers.JsonRpcProvider`).
- Every address stored or compared is checksummed via `ethers.utils.getAddress` at ingestion.
- All output writes are atomic: write `<file>.tmp`, then `fs.renameSync`.
- RPC URLs: `process.env["ARCHIVE_NODE_<network>"]` falling back to the same public URLs as `hardhat.config.ts`.
- Tests live in `tests/acm-permissions/`, run with `npx hardhat test tests/acm-permissions/<file>.ts`.
- Run `npx prettier --write <changed files>` before every commit.
- Commit after every task. **Never add a Co-Authored-By line or any AI attribution to commits.**
- The old implementation (deleted in Task 1) remains readable at any time via `git show HEAD~N:scripts/ACMPermissions/PermissionFetcher.ts` — reference it for on-chain-facing details instead of re-deriving.

## File Structure (final)

```
scripts/acm-permissions/
├── DESIGN.md, PLAN.md, README.md
├── .gitignore                    — ignores .sources-cache/, *.tmp
├── cli.ts                        — arg parsing + command dispatch
├── config.ts                     — networks, RPCs, start blocks, guardians, paths
├── types.ts                      — all shared interfaces
├── core/
│   ├── retry.ts                  — withRetry()
│   ├── decoder.ts                — topics, roleHash(), buildHashTable(), decodeLog()
│   ├── reducer.ts                — applyEvents()
│   ├── snapshot.ts               — state⇄file conversion, load/save (atomic)
│   ├── fetcher.ts                — scanRange() chunk loop
│   ├── diff.ts                   — diffSnapshots()
│   ├── verifier.ts               — verifyDiff() (corrections), verifyAll()
│   ├── registry.ts               — runtime loaders: names, signatures, addresses
│   └── output.ts                 — permissions.md, changes.md/json, unresolved-roles.json
├── registry-builder/
│   ├── sources.ts                — manifest load + npm-tarball/git/local resolution
│   ├── signatures.ts             — permission-string extraction
│   └── contracts.ts              — address→name registry generation
├── registry/
│   ├── sources.json              — MANUAL manifest
│   ├── legacy-signatures.json    — MANUAL (seeded Task 1, finalized Task 6)
│   ├── legacy-contracts.json     — MANUAL (seeded Task 1)
│   ├── signatures.json           — GENERATED (Task 6)
│   └── contracts/<network>.json  — GENERATED (Task 6)
└── snapshots/<network>/permissions.{json,md}, changes.{json,md}, unresolved-roles.json

tests/acm-permissions/
├── decoder.test.ts, reducer.test.ts, snapshot.test.ts, fetcher.test.ts,
├── diff.test.ts, verifier.test.ts, signatures.test.ts, contracts.test.ts,
├── output.test.ts, filter.test.ts, config.test.ts
└── fixtures/
```

---

### Task 1: Preserve legacy knowledge, delete the old system

**Files:**

- Create: `scripts/acm-permissions/registry/legacy-signatures.json`
- Create: `scripts/acm-permissions/registry/legacy-contracts.json`
- Create: `scripts/acm-permissions/.gitignore`
- Delete: `scripts/ACMPermissions/` (entire folder)

**Interfaces:**

- Produces: `legacy-signatures.json` shape `{ "signatures": [{ "signature": string, "origin": string }] }`; `legacy-contracts.json` shape `{ "contracts": [{ "address": string(checksummed), "origin": string }] }`. Tasks 5, 6, 7 consume these.

- [ ] **Step 1: Seed the two legacy files from the old system's data**

Write and run this one-off script (then delete it):

```bash
cat > /tmp/seed-legacy.js <<'EOF'
const fs = require("fs");
const { utils } = require("ethers");
const bnb = JSON.parse(fs.readFileSync("scripts/ACMPermissions/networks/bscmainnet/BNBPermissions.json", "utf8"));
const sigs = new Set(), addrs = new Set();
for (const c of bnb.contracts) {
  c.functions.forEach(f => sigs.add(f));
  c.address.forEach(a => addrs.add(utils.getAddress(a)));
}
const out = "scripts/acm-permissions/registry/";
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(out + "legacy-signatures.json", JSON.stringify({
  signatures: [...sigs].sort().map(s => ({ signature: s, origin: "old BNBPermissions.json (pending fresh-extraction diff, Task 6)" }))
}, null, 2));
fs.writeFileSync(out + "legacy-contracts.json", JSON.stringify({
  contracts: [...addrs].sort().map(a => ({ address: a, origin: "old BNBPermissions.json (pending fresh-extraction diff, Task 6)" }))
}, null, 2));
console.log(sigs.size, "signatures,", addrs.size, "addresses");
EOF
node /tmp/seed-legacy.js
```

Expected output: `~1xx signatures, 99 addresses` (exact counts printed).

- [ ] **Step 2: Append the missingRoleInfo.txt facts**

Read `scripts/ACMPermissions/networks/bscmainnet/missingRoleInfo.txt`. For each documented typo'd signature (e.g. `_setActionsPaused(address[],uint256[],bool)`, `addMarket(address,uint256,uint256)`), add an entry to `legacy-signatures.json` (if not already present) with origin `"missingRoleInfo.txt — <the note from the file, e.g. 'typo'd grant, role since revoked'>"`. Edit the JSON by hand; keep the array sorted by `signature`.

- [ ] **Step 3: Create `scripts/acm-permissions/.gitignore`**

```
.sources-cache/
*.tmp
```

- [ ] **Step 4: Delete the old system and commit**

```bash
git rm -r scripts/ACMPermissions
git add scripts/acm-permissions/registry scripts/acm-permissions/.gitignore
npx prettier --write scripts/acm-permissions/registry/*.json
git add -u && git commit -m "chore(acm): remove legacy ACMPermissions scripts, preserve manual decode knowledge"
```

Verify: `git show --stat HEAD` lists deletions of all old files and the two new registry files.

---

### Task 2: `types.ts` + `config.ts`

**Files:**

- Create: `scripts/acm-permissions/types.ts`
- Create: `scripts/acm-permissions/config.ts`
- Test: `tests/acm-permissions/config.test.ts`

**Interfaces (produced — later tasks import these exact names):**

```ts
// types.ts
export const NETWORKS: readonly string[]; export type Network;
export interface PermissionEvent { type: "granted" | "revoked"; roleHash: string; account: string;
  contractAddress: string | null; functionSig: string | null; decoded: boolean;
  blockNumber: number; logIndex: number; txHash: string; }
export interface RoleState { roleHash: string; contractAddress: string | null; functionSig: string | null;
  decoded: boolean; grantees: string[]; transactions: string[]; }
export type SnapshotState = Record<string, RoleState>;           // key = roleHash
export interface SnapshotMeta { network: Network; acmAddress: string; height: number; updatedAt: string; }
export interface SnapshotGrantee { address: string; name: string; }
export interface SnapshotPermission { functionSig: string | null; roleHash: string; decoded: boolean;
  grantees: SnapshotGrantee[]; transactions?: string[]; }
export interface SnapshotContract { address: string | null; name: string;
  scope: "contract" | "wildcard" | "unresolved"; permissions: SnapshotPermission[]; }
export interface SnapshotFile extends SnapshotMeta { schemaVersion: 1; contracts: SnapshotContract[]; }
export interface DiffEntry { roleHash: string; contractAddress: string | null; functionSig: string | null;
  decoded: boolean; account: string; txHash: string; }
export interface SnapshotDiff { added: DiffEntry[]; removed: DiffEntry[]; }
export interface Correction { entry: DiffEntry; replaySaid: "added" | "removed"; chainSays: "granted" | "not-granted"; }
// config.ts
export const STARTING_BLOCKS: Record<Network, number>;
export const GUARDIANS: Record<Network, string[]>;               // checksummed
export const TIMELOCK_NAMES: string[];                            // ["NormalTimelock","FastTrackTimelock","CriticalTimelock"]
export const WILDCARD = "0x0000000000000000000000000000000000000000";
export const DEFAULT_ADMIN_ROLE = "0x000...000" (32 bytes);
export function isLegacyAcm(network: Network): boolean;          // network === "bscmainnet"
export function rpcUrl(network: Network): string;
export function acmAddress(network: Network): string;            // checksummed, from deployments/<network>_addresses.json
export const TOOL_DIR, REGISTRY_DIR, SNAPSHOTS_DIR: string;      // absolute paths
export function snapshotDir(network: Network): string;
```

- [ ] **Step 1: Write the failing test** — `tests/acm-permissions/config.test.ts`:

```ts
import { expect } from "chai";
import { ethers } from "ethers";

import { STARTING_BLOCKS, acmAddress, isLegacyAcm, rpcUrl } from "../../scripts/acm-permissions/config";
import { NETWORKS } from "../../scripts/acm-permissions/types";

describe("acm-permissions config", () => {
  it("has 16 networks, no hardhat", () => {
    expect(NETWORKS).to.have.length(16);
    expect(NETWORKS).to.not.include("hardhat");
  });
  it("has a starting block and RPC for every network", () => {
    for (const n of NETWORKS) {
      expect(STARTING_BLOCKS[n], n).to.be.a("number").greaterThan(0);
      expect(rpcUrl(n), n).to.match(/^https?:\/\//);
    }
  });
  it("resolves a checksummed ACM address for every network", () => {
    for (const n of NETWORKS) {
      const a = acmAddress(n);
      expect(a, n).to.equal(ethers.utils.getAddress(a));
    }
  });
  it("flags only bscmainnet as legacy", () => {
    expect(isLegacyAcm("bscmainnet")).to.equal(true);
    expect(isLegacyAcm("ethereum")).to.equal(false);
  });
});
```

- [ ] **Step 2: Run to verify it fails** — `npx hardhat test tests/acm-permissions/config.test.ts` → FAIL (module not found).

- [ ] **Step 3: Implement `types.ts`** with the exact interfaces above; `NETWORKS` as `["bscmainnet","bsctestnet","ethereum","sepolia","opbnbmainnet","opbnbtestnet","arbitrumone","arbitrumsepolia","zksyncmainnet","zksyncsepolia","opmainnet","opsepolia","basemainnet","basesepolia","unichainmainnet","unichainsepolia"] as const` and `export type Network = (typeof NETWORKS)[number]`.

- [ ] **Step 4: Implement `config.ts`**

```ts
import { ethers } from "ethers";
import * as fs from "fs";
import * as path from "path";

import { NETWORKS, Network } from "./types";

export const TOOL_DIR = __dirname;
export const REGISTRY_DIR = path.join(TOOL_DIR, "registry");
export const SNAPSHOTS_DIR = path.join(TOOL_DIR, "snapshots");
export const snapshotDir = (n: Network) => path.join(SNAPSHOTS_DIR, n);
export const WILDCARD = "0x0000000000000000000000000000000000000000";
export const DEFAULT_ADMIN_ROLE = "0x" + "0".repeat(64);
export const TIMELOCK_NAMES = ["NormalTimelock", "FastTrackTimelock", "CriticalTimelock"];
export const isLegacyAcm = (n: Network) => n === "bscmainnet";

// Copied from the deleted scripts/ACMPermissions/config.ts (git history) — ACM deployment blocks.
export const STARTING_BLOCKS: Record<Network, number> = {
  bscmainnet: 21968139,
  bsctestnet: 26711168,
  ethereum: 18641314,
  sepolia: 4204345,
  opbnbmainnet: 10895878,
  opbnbtestnet: 14542763,
  arbitrumone: 201597544,
  arbitrumsepolia: 25350320,
  zksyncmainnet: 42301367,
  zksyncsepolia: 3452622,
  opmainnet: 125490540,
  opsepolia: 14150254,
  basemainnet: 23212004,
  basesepolia: 16737042,
  unichainsepolia: 3358050,
  unichainmainnet: 8106529,
};

// Public fallbacks copied verbatim from hardhat.config.ts network `url` defaults.
const PUBLIC_RPC: Record<Network, string> = {
  /* copy the 16 default URLs from hardhat.config.ts */
} as any;
export const rpcUrl = (n: Network): string => process.env[`ARCHIVE_NODE_${n}`] || PUBLIC_RPC[n];

// Guardian multisigs, copied from helpers/deploy/deploymentUtils.ts `guardian()` +
// (bscmainnet's three, bsctestnet's one) from the deleted old config.ts addressMap.
export const GUARDIANS: Record<Network, string[]> = {
  /* checksummed literals for all 16 */
} as any;

export function acmAddress(n: Network): string {
  const file = path.join(TOOL_DIR, "..", "..", "deployments", `${n}_addresses.json`);
  const { addresses } = JSON.parse(fs.readFileSync(file, "utf8"));
  if (!addresses?.AccessControlManager) throw new Error(`No AccessControlManager in deployments for ${n}`);
  return ethers.utils.getAddress(addresses.AccessControlManager);
}
```

Fill `PUBLIC_RPC` from `hardhat.config.ts` (lines ~84–167) and `GUARDIANS` from `helpers/deploy/deploymentUtils.ts:29-62` plus bscmainnet `["0x7B1AE5Ea599bC56734624b95589e7E8E64C351c9","0x1C2CAc6ec528c20800B2fe734820D87b581eAA6B","0x3a3284dC0FaFfb0b5F0d074c4C704D14326C98cF"]` and bsctestnet `["0x2Ce1d0ffD7E869D9DF33e28552b12DdDed326706"]` (from `git show HEAD~1:scripts/ACMPermissions/config.ts`). Checksum every literal (run through `ethers.utils.getAddress` once and paste results).

- [ ] **Step 5: Run test → PASS, then commit**

```bash
npx hardhat test tests/acm-permissions/config.test.ts
npx prettier --write scripts/acm-permissions/*.ts tests/acm-permissions/config.test.ts
git add scripts/acm-permissions/types.ts scripts/acm-permissions/config.ts tests/acm-permissions/config.test.ts
git commit -m "feat(acm): add types and network config for permissions tool"
```

---

### Task 3: Source manifest + resolver (`registry-builder/sources.ts`)

**Files:**

- Create: `scripts/acm-permissions/registry/sources.json`
- Create: `scripts/acm-permissions/registry-builder/sources.ts`
- Test: `tests/acm-permissions/sources.test.ts`

**Interfaces:**

- Produces: `type Source = { type:"local"; path:string } | { type:"npm"; package:string; version:string } | { type:"git"; url:string; ref:string }`; `loadManifest(): Source[]`; `resolveSource(src: Source): string` (returns absolute dir of the source's root, downloading into `.sources-cache/` when needed); `npmTarballUrl(pkg: string, version: string): string` (pure, for testing).
- Consumes: `TOOL_DIR` from Task 2.

- [ ] **Step 1: Write `registry/sources.json`** — pin versions by checking the registry (`npm view @venusprotocol/isolated-pools version` etc. at execution time; use the latest published version of each):

```json
{
  "sources": [
    { "type": "local", "path": "../../.." },
    { "type": "npm", "package": "@venusprotocol/venus-protocol", "version": "<latest>" },
    { "type": "npm", "package": "@venusprotocol/isolated-pools", "version": "<latest>" },
    { "type": "npm", "package": "@venusprotocol/oracle", "version": "<latest>" },
    { "type": "npm", "package": "@venusprotocol/protocol-reserve", "version": "<latest>" },
    { "type": "npm", "package": "@venusprotocol/token-bridge", "version": "<latest>" }
  ]
}
```

(`local.path` is relative to `registry/`; no `git` sources initially — the type is supported for future repos.)

- [ ] **Step 2: Write the failing test**

```ts
import { expect } from "chai";
import * as fs from "fs";

import { loadManifest, npmTarballUrl, resolveSource } from "../../scripts/acm-permissions/registry-builder/sources";

describe("acm-permissions sources", () => {
  it("loads a valid manifest", () => {
    const sources = loadManifest();
    expect(sources.length).to.be.greaterThan(1);
    expect(sources[0].type).to.equal("local");
    for (const s of sources) if (s.type === "npm") expect(s.version).to.match(/^\d+\.\d+\.\d+/);
  });
  it("builds correct npm tarball URLs (scoped packages)", () => {
    expect(npmTarballUrl("@venusprotocol/oracle", "2.9.0")).to.equal(
      "https://registry.npmjs.org/@venusprotocol/oracle/-/oracle-2.9.0.tgz",
    );
  });
  it("resolves the local source to the repo root", () => {
    const root = resolveSource({ type: "local", path: "../../.." });
    expect(fs.existsSync(root + "/hardhat.config.ts")).to.equal(true);
  });
});
```

- [ ] **Step 3: Run → FAIL.** Then implement `sources.ts`:

```ts
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

import { REGISTRY_DIR, TOOL_DIR } from "../config";

export type Source =
  | { type: "local"; path: string }
  | { type: "npm"; package: string; version: string }
  | { type: "git"; url: string; ref: string };
const CACHE = path.join(TOOL_DIR, ".sources-cache");

export function loadManifest(): Source[] {
  const { sources } = JSON.parse(fs.readFileSync(path.join(REGISTRY_DIR, "sources.json"), "utf8"));
  if (!Array.isArray(sources) || sources.length === 0) throw new Error("sources.json: empty or invalid");
  for (const s of sources) {
    if (s.type === "npm" && (!s.package || !s.version))
      throw new Error(`npm source needs package+version: ${JSON.stringify(s)}`);
    if (s.type === "git" && (!s.url || !s.ref)) throw new Error(`git source needs url+ref: ${JSON.stringify(s)}`);
  }
  return sources;
}

export const npmTarballUrl = (pkg: string, version: string) =>
  `https://registry.npmjs.org/${pkg}/-/${pkg.split("/").pop()}-${version}.tgz`;

export function resolveSource(src: Source): string {
  if (src.type === "local") return path.resolve(REGISTRY_DIR, src.path);
  if (src.type === "npm") {
    // Prefer an already-installed copy at the exact pinned version.
    const installed = path.resolve(TOOL_DIR, "../../node_modules", src.package);
    try {
      const v = JSON.parse(fs.readFileSync(path.join(installed, "package.json"), "utf8")).version;
      if (v === src.version) return installed;
    } catch {
      /* not installed — fall through to cache */
    }
    const dir = path.join(CACHE, "npm", `${src.package.replace("/", "__")}@${src.version}`);
    if (!fs.existsSync(path.join(dir, "package.json"))) {
      fs.mkdirSync(dir, { recursive: true });
      const tgz = path.join(dir, "pkg.tgz");
      execSync(`curl -sSfL ${npmTarballUrl(src.package, src.version)} -o ${tgz}`, { stdio: "inherit" });
      execSync(`tar -xzf ${tgz} -C ${dir} --strip-components=1`, { stdio: "inherit" });
      fs.unlinkSync(tgz);
    }
    return dir;
  }
  // git
  const dir = path.join(CACHE, "git", `${src.url.split("/").pop()}@${src.ref}`.replace(/[^A-Za-z0-9@._-]/g, "_"));
  if (!fs.existsSync(dir)) execSync(`git clone --depth 1 --branch ${src.ref} ${src.url} ${dir}`, { stdio: "inherit" });
  return dir;
}
```

- [ ] **Step 4: Run test → PASS. Commit:** `git commit -m "feat(acm): add registry source manifest and resolver (npm tarball, git, local)"` (add `registry/sources.json`, `registry-builder/sources.ts`, test file).

---

### Task 4: Signature extractor (`registry-builder/signatures.ts`)

**Files:**

- Create: `scripts/acm-permissions/registry-builder/signatures.ts`
- Test: `tests/acm-permissions/signatures.test.ts` (+ `tests/acm-permissions/fixtures/Sample.sol`, `fixtures/sample-permissions-helper.ts`, `fixtures/sample-artifact.json`)

**Interfaces:**

- Produces: `extractFromTsHelper(content: string): string[]`; `extractFromSol(content: string): { signatures: string[]; dynamicCallsites: string[] }`; `extractFromAbi(abi: any[]): string[]`; `buildSignatures(roots: string[]): { signatures: string[]; dynamicCallsites: string[] }` (walks each root's `contracts/**/*.sol`, `deployments/**/*.json` with an `abi` key, and — for the local repo root — `helpers/permissions.ts`; returns sorted unique strings).
- Consumes: nothing new (pure functions + fs).

- [ ] **Step 1: Create fixtures.** `fixtures/Sample.sol`:

```solidity
contract Sample {
  function a() external {
    _checkAccessAllowed("setTokenConfig(TokenConfig)");
  }

  function b() external {
    acm.checkAccessAllowed(msg.sender, "pause()");
  }

  function c(string memory sig) external {
    _checkAccessAllowed(sig);
  } // dynamic — must be reported
}
```

`fixtures/sample-permissions-helper.ts`:

```ts
export const x = (a: string) => [
  [a, "setDirectPrice(address,uint256)", "NormalTimelock"],
  [a, "unpause()", "x"],
];
```

`fixtures/sample-artifact.json`: `{ "abi": [ { "type": "function", "name": "setOracle", "inputs": [{ "type": "address" }, { "type": "address" }, { "type": "uint8" }] }, { "type": "event", "name": "E", "inputs": [] } ] }`

- [ ] **Step 2: Write the failing test**

```ts
import { expect } from "chai";
import * as fs from "fs";
import * as path from "path";

import {
  extractFromAbi,
  extractFromSol,
  extractFromTsHelper,
} from "../../scripts/acm-permissions/registry-builder/signatures";

const fx = (f: string) => fs.readFileSync(path.join(__dirname, "fixtures", f), "utf8");

describe("signature extraction", () => {
  it("extracts literals from _checkAccessAllowed and checkAccessAllowed", () => {
    const { signatures, dynamicCallsites } = extractFromSol(fx("Sample.sol"));
    expect(signatures).to.have.members(["setTokenConfig(TokenConfig)", "pause()"]);
    expect(dynamicCallsites).to.have.length(1); // the `sig` variable call
  });
  it("extracts signature-shaped strings from the TS permissions helper", () => {
    expect(extractFromTsHelper(fx("sample-permissions-helper.ts"))).to.have.members([
      "setDirectPrice(address,uint256)",
      "unpause()",
    ]);
  });
  it("derives canonical signatures from ABI function fragments only", () => {
    const { abi } = JSON.parse(fx("sample-artifact.json"));
    expect(extractFromAbi(abi)).to.deep.equal(["setOracle(address,address,uint8)"]);
  });
});
```

- [ ] **Step 3: Run → FAIL. Implement:**

```ts
import * as fs from "fs";
import * as path from "path";

const SIG_RE = /"([A-Za-z_][A-Za-z0-9_]*\([^"()]*\))"/g;

export function extractFromTsHelper(content: string): string[] {
  return unique([...content.matchAll(SIG_RE)].map(m => m[1]));
}

export function extractFromSol(content: string): { signatures: string[]; dynamicCallsites: string[] } {
  const signatures: string[] = [],
    dynamicCallsites: string[] = [];
  const CALL_RE = /(_checkAccessAllowed|checkAccessAllowed)\s*\(([^;]*?)\)\s*;/g;
  for (const m of content.matchAll(CALL_RE)) {
    const lit = m[2].match(/"([^"]+)"/);
    if (lit) signatures.push(lit[1]);
    else dynamicCallsites.push(m[0].slice(0, 120));
  }
  return { signatures: unique(signatures), dynamicCallsites };
}

export function extractFromAbi(abi: any[]): string[] {
  return unique(
    abi
      .filter(f => f?.type === "function" && f.name)
      .map(f => `${f.name}(${(f.inputs || []).map((i: any) => i.type).join(",")})`),
  );
}

export function buildSignatures(roots: string[]): { signatures: string[]; dynamicCallsites: string[] } {
  const sigs = new Set<string>();
  const dyn: string[] = [];
  for (const root of roots) {
    for (const sol of walk(path.join(root, "contracts"), ".sol")) {
      const r = extractFromSol(fs.readFileSync(sol, "utf8"));
      r.signatures.forEach(s => sigs.add(s));
      dyn.push(...r.dynamicCallsites.map(d => `${sol}: ${d}`));
    }
    for (const j of walk(path.join(root, "deployments"), ".json")) {
      try {
        const { abi } = JSON.parse(fs.readFileSync(j, "utf8"));
        if (Array.isArray(abi)) extractFromAbi(abi).forEach(s => sigs.add(s));
      } catch {
        /* aggregate/malformed json without top-level abi — skip */
      }
    }
    const helper = path.join(root, "helpers", "permissions.ts");
    if (fs.existsSync(helper)) extractFromTsHelper(fs.readFileSync(helper, "utf8")).forEach(s => sigs.add(s));
  }
  return { signatures: [...sigs].sort(), dynamicCallsites: dyn };
}

const unique = (a: string[]) => [...new Set(a)];
function walk(dir: string, ext: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p, ext) : e.name.endsWith(ext) ? [p] : [];
  });
}
```

- [ ] **Step 4: Run test → PASS. Commit** `feat(acm): add permission-string extractor (sol literals, ts helper, abi)`.

---

### Task 5: Contract-name registry builder + runtime registry loaders

**Files:**

- Create: `scripts/acm-permissions/registry-builder/contracts.ts`
- Create: `scripts/acm-permissions/core/registry.ts`
- Test: `tests/acm-permissions/contracts.test.ts`

**Interfaces:**

- Produces (builder): `buildContractRegistry(network: Network, roots: string[]): Record<string, string>` — checksummed address → name; merges each root's `deployments/<network>_addresses.json` (`{ addresses: {Name: addr} }` shape), then `GUARDIANS[network]` (named `Guardian` or `Guardian 1..3` when several), then for bscmainnet the `legacy-contracts.json` addresses (named `Legacy: <origin>` when unknown); on name conflict for one address, joins as `"A / B"`.
- Produces (runtime, `core/registry.ts`): `loadNameMap(network): Record<string,string>`; `nameFor(map, address): string` (checksums the lookup, falls back to the raw address); `loadSignatures(): string[]` (union of `signatures.json` + `legacy-signatures.json`); `loadKnownAddresses(network): string[]` (keys of `contracts/<network>.json` + legacy contracts + `WILDCARD`); `requireSignaturesForLegacy(network): void` (throws for bscmainnet if `signatures.json` missing — spec §6.3.9).

- [ ] **Step 1: Write the failing test**

```ts
import { expect } from "chai";
import { ethers } from "ethers";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

import { nameFor } from "../../scripts/acm-permissions/core/registry";
import { buildContractRegistry } from "../../scripts/acm-permissions/registry-builder/contracts";

describe("contract registry", () => {
  it("merges sources, checksums keys, joins conflicting names", () => {
    const a = fs.mkdtempSync(path.join(os.tmpdir(), "srcA-")),
      b = fs.mkdtempSync(path.join(os.tmpdir(), "srcB-"));
    const addr = "0x939bd8d64c0a9583a7dcea9933f7b21697ab6396"; // lowercase on purpose
    for (const [root, name] of [
      [a, "Timelock"],
      [b, "NormalTimelock"],
    ] as const) {
      fs.mkdirSync(path.join(root, "deployments"), { recursive: true });
      fs.writeFileSync(
        path.join(root, "deployments", "bsctestnet_addresses.json"),
        JSON.stringify({ addresses: { [name]: addr } }),
      );
    }
    const reg = buildContractRegistry("bsctestnet", [a, b]);
    const key = ethers.utils.getAddress(addr);
    expect(reg[key]).to.equal("Timelock / NormalTimelock");
  });
  it("nameFor falls back to the raw address and is case-insensitive", () => {
    const key = ethers.utils.getAddress("0x939bd8d64c0a9583a7dcea9933f7b21697ab6396");
    const map = { [key]: "NormalTimelock" };
    expect(nameFor(map, key.toLowerCase())).to.equal("NormalTimelock");
    expect(nameFor(map, "0x0000000000000000000000000000000000000001")).to.equal(
      "0x0000000000000000000000000000000000000001",
    );
  });
});
```

- [ ] **Step 2: Run → FAIL. Implement `contracts.ts`:**

```ts
import { ethers } from "ethers";
import * as fs from "fs";
import * as path from "path";

import { GUARDIANS, REGISTRY_DIR } from "../config";
import { Network } from "../types";

export function buildContractRegistry(network: Network, roots: string[]): Record<string, string> {
  const reg: Record<string, string> = {};
  const put = (addr: string, name: string) => {
    const key = ethers.utils.getAddress(addr);
    if (reg[key] && reg[key] !== name && !reg[key].split(" / ").includes(name)) {
      console.warn(`[registry] name conflict for ${key}: "${reg[key]}" vs "${name}"`);
      reg[key] = `${reg[key]} / ${name}`;
    } else if (!reg[key]) reg[key] = name;
  };
  for (const root of roots) {
    const f = path.join(root, "deployments", `${network}_addresses.json`);
    if (!fs.existsSync(f)) continue;
    const { addresses } = JSON.parse(fs.readFileSync(f, "utf8"));
    for (const [name, addr] of Object.entries(addresses || {})) put(addr as string, name);
  }
  GUARDIANS[network].forEach((g, i, all) => put(g, all.length > 1 ? `Guardian ${i + 1}` : "Guardian"));
  if (network === "bscmainnet") {
    const f = path.join(REGISTRY_DIR, "legacy-contracts.json");
    for (const c of JSON.parse(fs.readFileSync(f, "utf8")).contracts) {
      if (!reg[ethers.utils.getAddress(c.address)]) put(c.address, `Legacy (${c.origin})`);
    }
  }
  return reg;
}
```

**Implement `core/registry.ts`:**

```ts
import { ethers } from "ethers";
import * as fs from "fs";
import * as path from "path";

import { REGISTRY_DIR, WILDCARD, isLegacyAcm } from "../config";
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
export function loadSignatures(): string[] {
  const fresh = path.join(REGISTRY_DIR, "signatures.json");
  const sigs = new Set<string>(fs.existsSync(fresh) ? readJson(fresh).signatures : []);
  for (const e of readJson(path.join(REGISTRY_DIR, "legacy-signatures.json")).signatures) sigs.add(e.signature);
  return [...sigs].sort();
}
export function loadKnownAddresses(network: Network): string[] {
  const set = new Set<string>([WILDCARD, ...Object.keys(loadNameMap(network))]);
  if (network === "bscmainnet")
    for (const c of readJson(path.join(REGISTRY_DIR, "legacy-contracts.json")).contracts)
      set.add(ethers.utils.getAddress(c.address));
  return [...set];
}
export function requireSignaturesForLegacy(network: Network): void {
  if (isLegacyAcm(network) && !fs.existsSync(path.join(REGISTRY_DIR, "signatures.json")))
    throw new Error("bscmainnet fetch requires registry/signatures.json — run `yarn acm:build-registry` first");
}
```

- [ ] **Step 3: Run test → PASS. Commit** `feat(acm): add contract-name registry builder and runtime registry loaders`.

---

### Task 6: `build-registry` CLI command + generate & commit real registries

**Files:**

- Create: `scripts/acm-permissions/cli.ts` (command skeleton + `build-registry`)
- Generate: `scripts/acm-permissions/registry/signatures.json`, `registry/contracts/<network>.json` × 16
- Modify: `scripts/acm-permissions/registry/legacy-signatures.json` (prune re-found), `registry/sources.json` (pin real versions)

**Interfaces:**

- Produces: `cli.ts` dispatch: `ts-node scripts/acm-permissions/cli.ts <command> [flags]` using `util.parseArgs` with `allowPositionals: true`; options used across tasks: `--network <csv|all>`, `--chunk-size <n>`, `--rebuild`, `--to <block>`, `--grantees <csv>`, `--out <path>`. `signatures.json` shape `{ generatedAt: string, signatures: string[] }`.

- [ ] **Step 1: Implement `cli.ts` skeleton + `build-registry`**

```ts
import * as fs from "fs";
import { parseArgs } from "node:util";
import * as path from "path";

import { REGISTRY_DIR } from "./config";
import { buildContractRegistry } from "./registry-builder/contracts";
import { buildSignatures } from "./registry-builder/signatures";
import { loadManifest, resolveSource } from "./registry-builder/sources";
import { NETWORKS, Network } from "./types";

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
  else if (cmd === "fetch" || cmd === "verify" || cmd === "filter")
    throw new Error(`${cmd}: implemented in a later task`);
  else {
    console.error("usage: cli.ts <build-registry|fetch|verify|filter> [--network all]");
    process.exit(2);
  }
})().catch(e => {
  console.error(e);
  process.exit(1);
});
```

- [ ] **Step 2: Pin real versions in `sources.json`** — run `npm view <pkg> version` for the 5 packages and write the results in.

- [ ] **Step 3: Run it for real**

```bash
npx ts-node scripts/acm-permissions/cli.ts build-registry
```

Expected: downloads 4 tarballs into `.sources-cache/`, prints signature count (expect 300–600) and 16 per-network contract counts (mainnets should show 100+ named contracts). Spot-check: `grep '"setTokenConfig(TokenConfig)"' scripts/acm-permissions/registry/signatures.json` → present; `python3 -c "import json;print(json.load(open('scripts/acm-permissions/registry/contracts/bscmainnet.json'))['0x939bD8d64c0A9583A7Dcea9933f7b21697ab6396'])"` → `NormalTimelock`.

- [ ] **Step 4: Finalize `legacy-signatures.json`** — remove entries whose `signature` now appears in the fresh `signatures.json` (they're proven from sources; provenance rule spec §5.1):

```bash
node -e '
const fs=require("fs");const R="scripts/acm-permissions/registry/";
const fresh=new Set(JSON.parse(fs.readFileSync(R+"signatures.json","utf8")).signatures);
const leg=JSON.parse(fs.readFileSync(R+"legacy-signatures.json","utf8"));
const kept=leg.signatures.filter(e=>!fresh.has(e.signature));
console.log("kept",kept.length,"of",leg.signatures.length);
fs.writeFileSync(R+"legacy-signatures.json",JSON.stringify({signatures:kept},null,2));'
```

- [ ] **Step 5: Commit** — `git add scripts/acm-permissions/cli.ts scripts/acm-permissions/registry` → `git commit -m "feat(acm): add build-registry command and generated signature/contract registries"`.

---

### Task 7: Decoder (`core/decoder.ts`)

**Files:**

- Create: `scripts/acm-permissions/core/decoder.ts`
- Test: `tests/acm-permissions/decoder.test.ts`

**Interfaces:**

- Produces: `TOPICS = { modern: { granted, revoked }, legacy: { granted, revoked } }` (topic0 hashes); `roleHash(contract: string, sig: string): string`; `type HashTable = Record<string, { contractAddress: string; functionSig: string }>`; `buildHashTable(addresses: string[], signatures: string[]): HashTable`; `decodeLog(log: ethers.providers.Log, network: Network, acmAddress: string, table: HashTable | null): PermissionEvent`.
- Port the on-chain facts from the old code: `git show <task1-commit>~1:scripts/ACMPermissions/PermissionFetcher.ts` lines 188–257.

- [ ] **Step 1: Write the failing test** (fixture logs built with ethers ABI coder so they're exact):

```ts
import { expect } from "chai";
import { ethers } from "ethers";

import { TOPICS, buildHashTable, decodeLog, roleHash } from "../../scripts/acm-permissions/core/decoder";

const ACM = "0x4788629ABc6cFCA10F9f969efdEAa1cF70c23555";
const T = "0x939bD8d64c0A9583A7Dcea9933f7b21697ab6396"; // account
const C = "0xfD36E2c2a6789Db23113685031d7F16329158384"; // target contract
const base = { blockNumber: 100, logIndex: 3, transactionHash: "0xabc", address: ACM } as any;

describe("decoder", () => {
  it("computes roleHash as solidity keccak256(encodePacked(address,string))", () => {
    expect(roleHash(C, "pause()")).to.equal(ethers.utils.solidityKeccak256(["address", "string"], [C, "pause()"]));
  });
  it("decodes modern PermissionGranted logs (non-indexed data)", () => {
    const data = ethers.utils.defaultAbiCoder.encode(["address", "address", "string"], [T, C, "pause()"]);
    const ev = decodeLog({ ...base, topics: [TOPICS.modern.granted], data }, "ethereum", ACM, null);
    expect(ev).to.include({
      type: "granted",
      account: T,
      contractAddress: C,
      functionSig: "pause()",
      decoded: true,
      blockNumber: 100,
      logIndex: 3,
    });
    expect(ev.roleHash).to.equal(roleHash(C, "pause()"));
  });
  it("decodes legacy RoleGranted via hash table, keeps unknown roles undecoded", () => {
    const table = buildHashTable([C], ["pause()"]);
    const topics = (role: string) => [TOPICS.legacy.granted, role, ethers.utils.hexZeroPad(T, 32)];
    const known = decodeLog({ ...base, topics: topics(roleHash(C, "pause()")), data: "0x" }, "bscmainnet", ACM, table);
    expect(known).to.include({ decoded: true, contractAddress: C, functionSig: "pause()", account: T });
    const unknown = decodeLog(
      { ...base, topics: topics("0x" + "11".repeat(32)), data: "0x" },
      "bscmainnet",
      ACM,
      table,
    );
    expect(unknown).to.include({ decoded: false, contractAddress: null, functionSig: null });
    expect(unknown.roleHash).to.equal("0x" + "11".repeat(32));
  });
  it("maps the all-zero role to DEFAULT_ADMIN_ROLE on the ACM", () => {
    const ev = decodeLog(
      { ...base, topics: [TOPICS.legacy.granted, "0x" + "00".repeat(32), ethers.utils.hexZeroPad(T, 32)], data: "0x" },
      "bscmainnet",
      ACM,
      {},
    );
    expect(ev).to.include({ decoded: true, contractAddress: ACM, functionSig: "DEFAULT_ADMIN_ROLE" });
  });
  it("decodes revoked events with type revoked", () => {
    const data = ethers.utils.defaultAbiCoder.encode(["address", "address", "string"], [T, C, "pause()"]);
    expect(decodeLog({ ...base, topics: [TOPICS.modern.revoked], data }, "ethereum", ACM, null).type).to.equal(
      "revoked",
    );
  });
});
```

- [ ] **Step 2: Run → FAIL. Implement:**

```ts
import { ethers } from "ethers";

import { DEFAULT_ADMIN_ROLE, isLegacyAcm } from "../config";
import { Network, PermissionEvent } from "../types";

export const TOPICS = {
  modern: {
    granted: ethers.utils.id("PermissionGranted(address,address,string)"),
    revoked: ethers.utils.id("PermissionRevoked(address,address,string)"),
  },
  legacy: {
    granted: ethers.utils.id("RoleGranted(bytes32,address,address)"),
    revoked: ethers.utils.id("RoleRevoked(bytes32,address,address)"),
  },
};

export const roleHash = (contract: string, sig: string) =>
  ethers.utils.solidityKeccak256(["address", "string"], [contract, sig]);

export type HashTable = Record<string, { contractAddress: string; functionSig: string }>;

export function buildHashTable(addresses: string[], signatures: string[]): HashTable {
  const t: HashTable = {};
  for (const a of addresses) {
    const cs = ethers.utils.getAddress(a);
    for (const s of signatures) t[roleHash(cs, s)] = { contractAddress: cs, functionSig: s };
  }
  return t;
}

export function decodeLog(
  log: ethers.providers.Log,
  network: Network,
  acmAddress: string,
  table: HashTable | null,
): PermissionEvent {
  const meta = { blockNumber: log.blockNumber, logIndex: log.logIndex, txHash: log.transactionHash };
  if (isLegacyAcm(network)) {
    const type = log.topics[0] === TOPICS.legacy.granted ? ("granted" as const) : ("revoked" as const);
    const role = log.topics[1];
    const account = ethers.utils.getAddress(ethers.utils.defaultAbiCoder.decode(["address"], log.topics[2])[0]);
    if (role === DEFAULT_ADMIN_ROLE)
      return {
        type,
        roleHash: role,
        account,
        contractAddress: ethers.utils.getAddress(acmAddress),
        functionSig: "DEFAULT_ADMIN_ROLE",
        decoded: true,
        ...meta,
      };
    const hit = table?.[role];
    return {
      type,
      roleHash: role,
      account,
      contractAddress: hit?.contractAddress ?? null,
      functionSig: hit?.functionSig ?? null,
      decoded: !!hit,
      ...meta,
    };
  }
  const type = log.topics[0] === TOPICS.modern.granted ? ("granted" as const) : ("revoked" as const);
  const [account, contractAddress, functionSig] = ethers.utils.defaultAbiCoder.decode(
    ["address", "address", "string"],
    log.data,
  );
  const c = ethers.utils.getAddress(contractAddress);
  return {
    type,
    roleHash: roleHash(c, functionSig),
    account: ethers.utils.getAddress(account),
    contractAddress: c,
    functionSig,
    decoded: true,
    ...meta,
  };
}
```

- [ ] **Step 3: Run test → PASS. Commit** `feat(acm): add event decoder for modern and legacy ACM models`.

---

### Task 8: Reducer (`core/reducer.ts`)

**Files:**

- Create: `scripts/acm-permissions/core/reducer.ts`
- Test: `tests/acm-permissions/reducer.test.ts`

**Interfaces:**

- Produces: `applyEvents(state: SnapshotState, events: PermissionEvent[]): SnapshotState` — sorts events by `(blockNumber, logIndex)`, grant adds grantee (dedup) + records txHash, revoke removes grantee, roles with zero grantees are deleted from state, undecoded events create entries keyed by roleHash with null metadata. Mutates and returns `state`.

- [ ] **Step 1: Write the failing test**

```ts
import { expect } from "chai";

import { applyEvents } from "../../scripts/acm-permissions/core/reducer";
import { PermissionEvent, SnapshotState } from "../../scripts/acm-permissions/types";

const ev = (o: Partial<PermissionEvent>): PermissionEvent => ({
  type: "granted",
  roleHash: "0xr1",
  account: "0xA",
  contractAddress: "0xC",
  functionSig: "pause()",
  decoded: true,
  blockNumber: 1,
  logIndex: 0,
  txHash: "0xt",
  ...o,
});

describe("reducer", () => {
  it("grant → revoke → re-grant, out of order input, ends granted", () => {
    const s: SnapshotState = {};
    applyEvents(s, [
      ev({ type: "granted", blockNumber: 5 }), // re-grant (latest)
      ev({ type: "granted", blockNumber: 1 }),
      ev({ type: "revoked", blockNumber: 3 }),
    ]);
    expect(s["0xr1"].grantees).to.deep.equal(["0xA"]);
  });
  it("removes fully-revoked roles from state", () => {
    const s: SnapshotState = {};
    applyEvents(s, [ev({ blockNumber: 1 }), ev({ type: "revoked", blockNumber: 2 })]);
    expect(s).to.deep.equal({});
  });
  it("dedupes duplicate grants and keeps tx history", () => {
    const s: SnapshotState = {};
    applyEvents(s, [ev({ txHash: "0x1" }), ev({ txHash: "0x2", blockNumber: 2 })]);
    expect(s["0xr1"].grantees).to.deep.equal(["0xA"]);
    expect(s["0xr1"].transactions).to.deep.equal(["0x1", "0x2"]);
  });
  it("revokes undecoded roles by hash (bscmainnet staleness fix)", () => {
    const s: SnapshotState = {};
    applyEvents(s, [ev({ roleHash: "0xdead", decoded: false, contractAddress: null, functionSig: null })]);
    expect(s["0xdead"].decoded).to.equal(false);
    applyEvents(s, [
      ev({
        type: "revoked",
        roleHash: "0xdead",
        decoded: false,
        contractAddress: null,
        functionSig: null,
        blockNumber: 9,
      }),
    ]);
    expect(s["0xdead"]).to.equal(undefined);
  });
  it("same-block events respect logIndex order", () => {
    const s: SnapshotState = {};
    applyEvents(s, [
      ev({ type: "revoked", blockNumber: 1, logIndex: 2 }),
      ev({ type: "granted", blockNumber: 1, logIndex: 1 }),
    ]);
    expect(s).to.deep.equal({});
  });
});
```

- [ ] **Step 2: Run → FAIL. Implement:**

```ts
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
```

- [ ] **Step 3: Run test → PASS. Commit** `feat(acm): add order-deterministic permission state reducer`.

---

### Task 9: Snapshot store (`core/snapshot.ts`)

**Files:**

- Create: `scripts/acm-permissions/core/snapshot.ts`
- Test: `tests/acm-permissions/snapshot.test.ts`

**Interfaces:**

- Produces: `stateToFile(state: SnapshotState, meta: SnapshotMeta, names: Record<string,string>): SnapshotFile` (groups per contract per spec §9.1: `scope` = `"wildcard"` when contractAddress===WILDCARD, `"unresolved"` when !decoded (grouped under one `address: null, name: "UNRESOLVED"` bucket with `transactions` included), else `"contract"`; contracts sorted by name, permissions by functionSig, grantees by name; grantee `{address, name}` via `nameFor`); `fileToState(file: SnapshotFile): SnapshotState`; `loadSnapshotFile(network): SnapshotFile | null` (missing → null; invalid JSON/schema → throw `corrupt snapshot`); `saveSnapshotFile(network, file): void` (atomic, creates dir).
- Consumes: `nameFor` (Task 5), types (Task 2).

- [ ] **Step 1: Write the failing test**

```ts
import { expect } from "chai";

import { WILDCARD } from "../../scripts/acm-permissions/config";
import { fileToState, stateToFile } from "../../scripts/acm-permissions/core/snapshot";
import { SnapshotMeta, SnapshotState } from "../../scripts/acm-permissions/types";

const meta: SnapshotMeta = {
  network: "bscmainnet",
  acmAddress: "0x4788629ABc6cFCA10F9f969efdEAa1cF70c23555",
  height: 123,
  updatedAt: "2026-07-10T00:00:00Z",
};
const C = "0xfD36E2c2a6789Db23113685031d7F16329158384",
  A = "0x939bD8d64c0A9583A7Dcea9933f7b21697ab6396";

const state: SnapshotState = {
  "0xr1": {
    roleHash: "0xr1",
    contractAddress: C,
    functionSig: "pause()",
    decoded: true,
    grantees: [A],
    transactions: ["0xt1"],
  },
  "0xr2": {
    roleHash: "0xr2",
    contractAddress: WILDCARD,
    functionSig: "unpause()",
    decoded: true,
    grantees: [A],
    transactions: ["0xt2"],
  },
  "0xr3": {
    roleHash: "0xr3",
    contractAddress: null,
    functionSig: null,
    decoded: false,
    grantees: [A],
    transactions: ["0xt3"],
  },
};

describe("snapshot store", () => {
  it("groups by contract with scopes and resolves names", () => {
    const f = stateToFile(state, meta, { [C]: "Unitroller", [A]: "NormalTimelock" });
    expect(f.schemaVersion).to.equal(1);
    const scopes = f.contracts.map(c => c.scope).sort();
    expect(scopes).to.deep.equal(["contract", "unresolved", "wildcard"]);
    const uni = f.contracts.find(c => c.name === "Unitroller")!;
    expect(uni.permissions[0].grantees[0]).to.deep.equal({ address: A, name: "NormalTimelock" });
    const unres = f.contracts.find(c => c.scope === "unresolved")!;
    expect(unres.address).to.equal(null);
    expect(unres.permissions[0].transactions).to.deep.equal(["0xt3"]);
  });
  it("round-trips file → state losslessly", () => {
    const f = stateToFile(state, meta, {});
    expect(fileToState(f)).to.deep.equal(state);
  });
});
```

- [ ] **Step 2: Run → FAIL. Implement `snapshot.ts`:** grouping logic per the interface description; `loadSnapshotFile` validates `schemaVersion === 1 && typeof height === "number" && Array.isArray(contracts)` and throws `Error("corrupt snapshot for <network>: <reason>")` otherwise; `saveSnapshotFile` writes `permissions.json` atomically under `snapshotDir(network)`. For round-trip fidelity every permission entry keeps `transactions` (write it for all scopes; the MD renderer only surfaces it for unresolved).

- [ ] **Step 3: Run test → PASS. Commit** `feat(acm): add grouped snapshot file format with lossless state round-trip`.

---

### Task 10: Fetcher (`core/retry.ts`, `core/fetcher.ts`)

**Files:**

- Create: `scripts/acm-permissions/core/retry.ts`, `scripts/acm-permissions/core/fetcher.ts`
- Test: `tests/acm-permissions/fetcher.test.ts`

**Interfaces:**

- Produces: `withRetry<T>(fn: () => Promise<T>, label: string, attempts = 5, baseMs = 5000, maxMs = 60000): Promise<T>` (exponential backoff ×2; in tests pass small `baseMs`); `scanRange(opts: { provider: { getLogs(f: any): Promise<any[]>; getBlockNumber(): Promise<number> }; network: Network; acmAddress: string; table: HashTable | null; fromBlock: number; toBlock?: number; chunkSize: number; onChunk: (events: PermissionEvent[], chunkEndBlock: number) => void; log?: (msg: string) => void }): Promise<{ fromBlock: number; toBlock: number; totalEvents: number; upToDate: boolean }>` — resolves `toBlock` to head when omitted; **returns `{upToDate: true}` without throwing when `fromBlock > toBlock`**; one `getLogs` per chunk with `{ address: acmAddress, topics: [[granted, revoked]], fromBlock, toBlock }` (both topic0s in one call), decodes, calls `onChunk` per chunk.
- Consumes: `decodeLog`, `TOPICS` (Task 7).

- [ ] **Step 1: Write the failing test** (fake provider, no network):

```ts
import { expect } from "chai";
import { ethers } from "ethers";

import { TOPICS } from "../../scripts/acm-permissions/core/decoder";
import { scanRange } from "../../scripts/acm-permissions/core/fetcher";
import { withRetry } from "../../scripts/acm-permissions/core/retry";

const ACM = "0x4788629ABc6cFCA10F9f969efdEAa1cF70c23555";
const log = (blockNumber: number) => ({
  address: ACM,
  blockNumber,
  logIndex: 0,
  transactionHash: "0xt",
  topics: [TOPICS.modern.granted],
  data: ethers.utils.defaultAbiCoder.encode(
    ["address", "address", "string"],
    ["0x939bD8d64c0A9583A7Dcea9933f7b21697ab6396", "0xfD36E2c2a6789Db23113685031d7F16329158384", "pause()"],
  ),
});

describe("fetcher", () => {
  it("chunks ranges, checkpoints each chunk, aggregates events", async () => {
    const calls: [number, number][] = [];
    const checkpoints: number[] = [];
    const provider = {
      getBlockNumber: async () => 250,
      getLogs: async (f: any) => {
        calls.push([f.fromBlock, f.toBlock]);
        return f.fromBlock === 1 ? [log(5)] : [];
      },
    };
    const r = await scanRange({
      provider,
      network: "ethereum",
      acmAddress: ACM,
      table: null,
      fromBlock: 1,
      chunkSize: 100,
      onChunk: (_e, end) => checkpoints.push(end),
    });
    expect(calls).to.deep.equal([
      [1, 100],
      [101, 200],
      [201, 250],
    ]);
    expect(checkpoints).to.deep.equal([100, 200, 250]);
    expect(r).to.include({ totalEvents: 1, upToDate: false, toBlock: 250 });
  });
  it("is a no-op when already at head", async () => {
    const provider = {
      getBlockNumber: async () => 100,
      getLogs: async () => {
        throw new Error("must not be called");
      },
    };
    const r = await scanRange({
      provider,
      network: "ethereum",
      acmAddress: ACM,
      table: null,
      fromBlock: 101,
      chunkSize: 100,
      onChunk: () => {
        throw new Error("no chunk expected");
      },
    });
    expect(r.upToDate).to.equal(true);
  });
  it("withRetry retries then succeeds, and gives up after N attempts", async () => {
    let n = 0;
    const v = await withRetry(
      async () => {
        if (++n < 3) throw new Error("flaky");
        return 42;
      },
      "t",
      5,
      1,
      2,
    );
    expect(v).to.equal(42);
    expect(n).to.equal(3);
    let m = 0;
    try {
      await withRetry(
        async () => {
          m++;
          throw new Error("always");
        },
        "t",
        3,
        1,
        2,
      );
      expect.fail("should throw");
    } catch (e: any) {
      expect(e.message).to.include("always");
      expect(m).to.equal(3);
    }
  });
});
```

- [ ] **Step 2: Run → FAIL. Implement** `retry.ts` (sleep = `new Promise(r => setTimeout(r, ms))`, delay `min(maxMs, baseMs * 2**attempt)`, log each retry with `label`) and `fetcher.ts`:

```ts
import { isLegacyAcm } from "../config";
import { Network, PermissionEvent } from "../types";
import { HashTable, TOPICS, decodeLog } from "./decoder";
import { withRetry } from "./retry";

export async function scanRange(opts: {
  /* as in Interfaces */
}) {
  const { provider, network, acmAddress, table, chunkSize, onChunk, log = () => {} } = opts;
  const toBlock = opts.toBlock ?? (await withRetry(() => provider.getBlockNumber(), `${network} getBlockNumber`));
  if (opts.fromBlock > toBlock) return { fromBlock: opts.fromBlock, toBlock, totalEvents: 0, upToDate: true };
  const t = isLegacyAcm(network) ? TOPICS.legacy : TOPICS.modern;
  let totalEvents = 0;
  for (let start = opts.fromBlock; start <= toBlock; ) {
    const end = Math.min(start + chunkSize - 1, toBlock);
    const logs = await withRetry(
      () => provider.getLogs({ address: acmAddress, topics: [[t.granted, t.revoked]], fromBlock: start, toBlock: end }),
      `${network} getLogs ${start}-${end}`,
    );
    const events: PermissionEvent[] = logs.map((l: any) => decodeLog(l, network, acmAddress, table));
    totalEvents += events.length;
    onChunk(events, end);
    log(`[${network}] blocks ${start}-${end}: ${events.length} events`);
    start = end + 1;
  }
  return { fromBlock: opts.fromBlock, toBlock, totalEvents, upToDate: false };
}
```

- [ ] **Step 3: Run test → PASS. Commit** `feat(acm): add resumable chunked log fetcher with retry`.

---

### Task 11: Diff engine (`core/diff.ts`)

**Files:**

- Create: `scripts/acm-permissions/core/diff.ts`
- Test: `tests/acm-permissions/diff.test.ts`

**Interfaces:**

- Produces: `diffSnapshots(prev: SnapshotState, next: SnapshotState): SnapshotDiff` — one `DiffEntry` per (roleHash, account) present in next-but-not-prev (added) or prev-but-not-next (removed); `txHash` = last tx of the role in the _next_ state for added / _prev_ state for removed; metadata (`contractAddress/functionSig/decoded`) taken from whichever state contains the role (next wins, so a later-decoded role reports decoded metadata).

- [ ] **Step 1: Write the failing test**

```ts
import { expect } from "chai";

import { diffSnapshots } from "../../scripts/acm-permissions/core/diff";
import { SnapshotState } from "../../scripts/acm-permissions/types";

const role = (grantees: string[], over: object = {}) => ({
  roleHash: "0xr1",
  contractAddress: "0xC",
  functionSig: "pause()",
  decoded: true,
  grantees,
  transactions: ["0xt"],
  ...over,
});

describe("diff", () => {
  it("detects added and removed grantees per role", () => {
    const prev: SnapshotState = { "0xr1": role(["0xA", "0xB"]) };
    const next: SnapshotState = { "0xr1": role(["0xB", "0xNew"]) };
    const d = diffSnapshots(prev, next);
    expect(d.added.map(e => e.account)).to.deep.equal(["0xNew"]);
    expect(d.removed.map(e => e.account)).to.deep.equal(["0xA"]);
  });
  it("whole-role appearance/disappearance", () => {
    const d = diffSnapshots({}, { "0xr1": role(["0xA"]) });
    expect(d.added).to.have.length(1);
    expect(d.removed).to.have.length(0);
    const d2 = diffSnapshots({ "0xr1": role(["0xA"]) }, {});
    expect(d2.removed).to.have.length(1);
  });
  it("empty diff on identical states", () => {
    const s: SnapshotState = { "0xr1": role(["0xA"]) };
    expect(diffSnapshots(s, s)).to.deep.equal({ added: [], removed: [] });
  });
});
```

- [ ] **Step 2: Run → FAIL. Implement** (iterate the union of role keys of both states; set-compare grantees). ~25 lines.

- [ ] **Step 3: Run test → PASS. Commit** `feat(acm): add snapshot diff engine`.

---

### Task 12: Verifier (`core/verifier.ts`)

**Files:**

- Create: `scripts/acm-permissions/core/verifier.ts`
- Test: `tests/acm-permissions/verifier.test.ts`

**Interfaces:**

- Produces: `ACM_ABI = ["function hasPermission(address account, address contractAddress, string functionSig) view returns (bool)", "function hasRole(bytes32 role, address account) view returns (bool)"]`;
  `checkOnChain(acm: { hasPermission: Function; hasRole: Function }, network: Network, entry: DiffEntry): Promise<boolean>` — legacy or undecoded → `hasRole(roleHash, account)`, else `hasPermission(account, contractAddress, functionSig)`;
  `verifyDiff(acm, network, diff: SnapshotDiff, state: SnapshotState, batchSize = 20): Promise<Correction[]>` — added entries expect `true`, removed expect `false`; **on mismatch corrects `state` in place** (removes/restores the grantee; a restore re-creates the role entry if needed) and returns the `Correction[]`;
  `verifyAll(acm, network, state: SnapshotState, batchSize = 20): Promise<DiffEntry[]>` — returns entries that are in the snapshot but NOT granted on-chain (mismatches; read-only, no correction).
- Consumes: types (Task 2), `WILDCARD` note: wildcard entries verify via `hasPermission(account, WILDCARD, sig)` — same role hash the ACM stores.

- [ ] **Step 1: Write the failing test** (fake acm object):

```ts
import { expect } from "chai";

import { checkOnChain, verifyAll, verifyDiff } from "../../scripts/acm-permissions/core/verifier";
import { DiffEntry, SnapshotDiff, SnapshotState } from "../../scripts/acm-permissions/types";

const entry = (o: Partial<DiffEntry>): DiffEntry => ({
  roleHash: "0xr1",
  contractAddress: "0xC",
  functionSig: "pause()",
  decoded: true,
  account: "0xA",
  txHash: "0xt",
  ...o,
});
const fakeAcm = (grantedPairs: Set<string>) => ({
  hasPermission: async (a: string, c: string, s: string) => grantedPairs.has(`${a}|${c}|${s}`),
  hasRole: async (r: string, a: string) => grantedPairs.has(`${r}|${a}`),
});

describe("verifier", () => {
  it("routes modern entries to hasPermission and legacy/undecoded to hasRole", async () => {
    const acm = fakeAcm(new Set(["0xA|0xC|pause()", "0xdead|0xA"]));
    expect(await checkOnChain(acm, "ethereum", entry({}))).to.equal(true);
    expect(await checkOnChain(acm, "bscmainnet", entry({ roleHash: "0xdead" }))).to.equal(true);
    expect(await checkOnChain(acm, "bscmainnet", entry({ roleHash: "0xother" }))).to.equal(false);
  });
  it("verifyDiff corrects state to match chain and reports corrections", async () => {
    // chain says: the "added" grant does NOT exist, and the "removed" one still exists
    const acm = fakeAcm(new Set(["0xB|0xC|unpause()"]));
    const state: SnapshotState = {
      "0xr1": {
        roleHash: "0xr1",
        contractAddress: "0xC",
        functionSig: "pause()",
        decoded: true,
        grantees: ["0xA"],
        transactions: ["0xt"],
      },
    };
    const diff: SnapshotDiff = {
      added: [entry({})], // false add → must be removed
      removed: [entry({ roleHash: "0xr2", functionSig: "unpause()", account: "0xB" })],
    }; // false remove → restore
    const corrections = await verifyDiff(acm, "ethereum", diff, state);
    expect(corrections).to.have.length(2);
    expect(state["0xr1"]).to.equal(undefined); // false add corrected away (last grantee removed)
    expect(state["0xr2"].grantees).to.deep.equal(["0xB"]); // false remove restored
    expect(corrections[0]).to.deep.include({ replaySaid: "added", chainSays: "not-granted" });
  });
  it("verifyDiff returns [] when chain agrees", async () => {
    const acm = fakeAcm(new Set(["0xA|0xC|pause()"]));
    const state: SnapshotState = {
      "0xr1": {
        roleHash: "0xr1",
        contractAddress: "0xC",
        functionSig: "pause()",
        decoded: true,
        grantees: ["0xA"],
        transactions: [],
      },
    };
    expect(await verifyDiff(acm, "ethereum", { added: [entry({})], removed: [] }, state)).to.deep.equal([]);
  });
  it("verifyAll reports snapshot entries missing on-chain", async () => {
    const acm = fakeAcm(new Set());
    const state: SnapshotState = {
      "0xr1": {
        roleHash: "0xr1",
        contractAddress: "0xC",
        functionSig: "pause()",
        decoded: true,
        grantees: ["0xA"],
        transactions: [],
      },
    };
    const bad = await verifyAll(acm, "ethereum", state);
    expect(bad).to.have.length(1);
    expect(bad[0].account).to.equal("0xA");
  });
});
```

- [ ] **Step 2: Run → FAIL. Implement.** Batch view calls with `Promise.all` over `batchSize`-sized groups (sequential between groups). `verifyDiff` mutates state exactly as the test asserts. ~60 lines.

- [ ] **Step 3: Run test → PASS. Commit** `feat(acm): add on-chain verifier with chain-authoritative corrections`.

---

### Task 13: Output writers (`core/output.ts`)

**Files:**

- Create: `scripts/acm-permissions/core/output.ts`
- Test: `tests/acm-permissions/output.test.ts` (+ golden files `fixtures/golden-permissions.md`, `fixtures/golden-changes.md`)

**Interfaces:**

- Produces: `renderPermissionsMd(file: SnapshotFile, verified: boolean): string` (spec §9.2: header `# ACM Permissions — <network>`, summary line with block/date/counts/verification, `## <Name> (\`<address>\`)`+ table`| Function | Grantees |`per contract,`## 🃏 Wildcard permissions`section when present,`## ⚠️ Unresolved roles`table last);`renderChangesMd(diff: SnapshotDiff, corrections: Correction[], meta: { network; fromBlock; toBlock; date: string }, names): string`(spec §9.3:`## Added (n)`/`## Removed (n)`/`## Corrections (on-chain authoritative)`sections;`No changes.`body when all empty);`changesJson(diff, corrections, meta): object`;
`writeRunOutputs(network, file: SnapshotFile, diff, corrections, meta, names): void`— writes`permissions.md`, `changes.md`, `changes.json`, and (bscmainnet only, when unresolved entries exist) `unresolved-roles.json`, all atomic.
- Consumes: Tasks 2, 5, 9, 11, 12 types/functions.

- [ ] **Step 1: Write the failing golden test** — build a small `SnapshotFile` + diff in the test (reuse the Task 9 fixture state shapes), render both MDs, compare to the golden fixture files with `expect(rendered).to.equal(fs.readFileSync(golden, "utf8"))`. Write the goldens by hand first with the exact expected output (this pins the format deliberately).

- [ ] **Step 2: Run → FAIL. Implement renderers** until goldens match byte-for-byte.

- [ ] **Step 3: Run test → PASS. Commit** `feat(acm): add markdown/json output writers with golden-file tests`.

---

### Task 14: `fetch` command — wiring + parallel networks

**Files:**

- Modify: `scripts/acm-permissions/cli.ts` (replace the `fetch` stub)

**Interfaces:**

- Consumes everything from Tasks 2–13. Per-network flow (exactly this order):

```ts
async function fetchNetwork(network: Network, opts: { chunkSize: number; toBlock?: number; rebuild: boolean }) {
  requireSignaturesForLegacy(network);
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl(network));
  const acmAddr = acmAddress(network);
  const names = loadNameMap(network);
  const table = isLegacyAcm(network) ? buildHashTable(loadKnownAddresses(network), loadSignatures()) : null;
  if (opts.rebuild) fs.rmSync(snapshotDir(network), { recursive: true, force: true });
  const prevFile = loadSnapshotFile(network);
  const state = prevFile ? fileToState(prevFile) : {};
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
  const acm = new ethers.Contract(acmAddr, ACM_ABI, provider);
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
```

- Command: resolve `--network` (`all` → all 16, else CSV, validate against `NETWORKS`), run `Promise.allSettled(selected.map(fetchNetwork))`, then print a one-line-per-network summary table (`ok / up-to-date / FAILED: <msg>` with added/removed/correction counts) and `process.exit(1)` if any network failed. Prefix all per-network logs with `[<network>]`.

- [ ] **Step 1: Implement the above** (no new unit tests — components are tested; this is composition).

- [ ] **Step 2: Live smoke test on a short recent range** (~10 min old blocks; cheap):

```bash
npx ts-node scripts/acm-permissions/cli.ts fetch --network sepolia
```

Expected: chunk progress lines from block 4204345 onward, checkpointed `snapshots/sepolia/permissions.json` growing, and on completion `permissions.md` + `changes.md` present. Interrupt it once (Ctrl-C mid-scan), rerun, and confirm it resumes from the stored height (first log line shows resumed block, not 4204345).

- [ ] **Step 3: Commit** `feat(acm): add parallel multi-network fetch command with diff verification` (do NOT commit `snapshots/` yet — that's Task 17).

---

### Task 15: `verify` command (full on-chain check)

**Files:**

- Modify: `scripts/acm-permissions/cli.ts` (replace `verify` stub)

**Interfaces:**

- Consumes: `verifyAll` (Task 12), snapshot store (Task 9).
- Flow per network: load snapshot (skip with warning if none), build `ethers.Contract`, `verifyAll(acm, network, fileToState(file))`; print each mismatch as `MISMATCH <network> <contractName>.<functionSig> grantee <name> — in snapshot but not on-chain`; summary line per network; exit 1 if any mismatch. Same `--network all|csv` handling and `Promise.allSettled` pattern as fetch.

- [ ] **Step 1: Implement.**
- [ ] **Step 2: Smoke test:** `npx ts-node scripts/acm-permissions/cli.ts verify --network sepolia` → expected `sepolia: <n> entries verified, 0 mismatches`.
- [ ] **Step 3: Commit** `feat(acm): add full on-chain verify command`.

---

### Task 16: `filter` command

**Files:**

- Modify: `scripts/acm-permissions/cli.ts` (replace `filter` stub, add `filterPermissions` exported for tests)
- Test: `tests/acm-permissions/filter.test.ts`

**Interfaces:**

- Produces: `filterPermissions(file: SnapshotFile, grantees: string[], network: Network): Record<string, Array<{ contract: string; functionSig: string | null; roleHash: string }>>` — keys are the _requested_ grantee labels. Each label resolves to addresses: raw `0x…` → itself; `"Guardian"` → all `GUARDIANS[network]`; timelock names → reverse lookup in the name map (error if not found). A permission matches a label if ANY of the label's addresses is a grantee.
- CLI: `filter --network bscmainnet --grantees NormalTimelock,Guardian [--out file.json]` — prints one section per label (`### NormalTimelock — N permissions`, lines `ContractName functionSig`), `--out` writes the JSON.

- [ ] **Step 1: Write the failing test** — build a `SnapshotFile` in-test with two permissions (one granted to a timelock address named in a stub name map argument — give `filterPermissions` an optional `nameMap` param to avoid fs in tests; one to a guardian from `GUARDIANS.bscmainnet`), assert: label keys present, guardian label matches all three bsc guardian addresses, unknown label throws, raw-address label works.

- [ ] **Step 2: Run → FAIL. Implement. Run → PASS.**

- [ ] **Step 3: Smoke:** `npx ts-node scripts/acm-permissions/cli.ts filter --network sepolia --grantees NormalTimelock` (uses Task 14's sepolia snapshot). Commit `feat(acm): add grantee filter command`.

---

### Task 17: README, package.json scripts, first full build

**Files:**

- Create: `scripts/acm-permissions/README.md`
- Modify: `package.json` (scripts only)
- Generate + commit: `scripts/acm-permissions/snapshots/<all 16 networks>/`

- [ ] **Step 1: Add package.json scripts** (scripts section only — no dependency changes):

```json
"acm:fetch": "ts-node scripts/acm-permissions/cli.ts fetch",
"acm:verify": "ts-node scripts/acm-permissions/cli.ts verify",
"acm:filter": "ts-node scripts/acm-permissions/cli.ts filter",
"acm:build-registry": "ts-node scripts/acm-permissions/cli.ts build-registry"
```

- [ ] **Step 2: Write README.md** covering: what the tool does, the four commands with examples, how bscmainnet decoding works (link DESIGN.md §6.2/§6.3), the two-tier verification model and its documented limitation (spec §8.2), how to add a new network / new source repo, resumability semantics, and output file meanings (§9 summary).

- [ ] **Step 3: First full build — all networks:**

```bash
export ARCHIVE_NODE_bscmainnet=... # any private RPCs available; otherwise public defaults apply
yarn acm:fetch --network all
```

Expected: all 16 networks scan from their ACM deployment blocks (bscmainnet is the long pole, ~1,100 chunks). If a network's public RPC rejects the range/rate, rerun — checkpoints resume. Afterwards sanity-check against the old system's last committed data:

```bash
# counts should be >= the old snapshot's (old data was 2025-10 stale): old bscmainnet had 194 perms, ethereum 123
python3 - <<'EOF'
import json, glob
for f in sorted(glob.glob("scripts/acm-permissions/snapshots/*/permissions.json")):
    d = json.load(open(f))
    n = sum(len(c["permissions"]) for c in d["contracts"])
    u = sum(len(c["permissions"]) for c in d["contracts"] if c["scope"] == "unresolved")
    print(f'{d["network"]:18} height={d["height"]:>12} roles={n:>4} unresolved={u}')
EOF
yarn acm:verify --network all   # expect 0 mismatches everywhere
```

Compare bscmainnet unresolved count to the old system's 17 missing roles — it should be **lower or equal** (fresh registry decodes more). Investigate (registry gap) if higher.

- [ ] **Step 4: Run the full unit suite once more:** `npx hardhat test tests/acm-permissions/*.ts` → all pass.

- [ ] **Step 5: Commits** (keep data separate from docs):

```bash
git add package.json scripts/acm-permissions/README.md
git commit -m "docs(acm): add README and yarn scripts for permissions tool"
git add scripts/acm-permissions/snapshots
git commit -m "chore(acm): first full permission snapshots for all 16 networks"
```

---

## Self-review checklist (run after all tasks)

- Every spec section maps to a task: §2→T1, §4→T2, §5.1→T4/T6, §5.2→T5/T6, §5.3→T3, §6.1/6.2→T7/T8, §6.3→T7/T12/T16 items, §7→T10/T14, §8.1→T12/T14, §8.2→T15, §9→T9/T13, §10→T16, §11→T3/T9/T10/T14, §12→all test steps, §13 phases→task order.
- No Co-Authored-By lines in any commit (`git log --format=%B | grep -i co-authored` → empty).
- `git status` clean; `.sources-cache/` ignored.
