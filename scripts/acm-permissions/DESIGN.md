# ACM Permissions Tooling Rewrite — Design Spec

**Date:** 2026-07-10
**Status:** Draft — pending review
**Replaces:** `scripts/ACMPermissions/` (to be deleted)

---

## 1. Goal

Rebuild the ACM permission-fetching tooling as a single, standalone, non-interactive
CLI that:

1. Produces a **complete, correct, per-network snapshot** of every ACM permission in
   the Venus protocol — including additions **and** removals.
2. Emits results in **two formats**: human-reviewable Markdown and machine/LLM-friendly
   JSON.
3. Reports a **diff (added / removed permissions)** on every run and verifies that diff
   on-chain.
4. Runs **all networks in parallel with one command**, without hardhat runtime coupling.
5. Resolves **contract names automatically** from Venus deployment artifacts instead of
   hand-maintained address maps.
6. Handles the legacy **bscmainnet role-hash ACM** with a generated signature
   dictionary, and **never drops undecodable roles** — they stay in the snapshot as
   unresolved entries.
7. Is **resumable**: an interrupted scan continues from the last completed chunk.

### Non-goals (deferred, explicitly out of scope for this phase)

- Adaptive chunk sizing / intra-network parallel log fetching (chunks stay sequential
  per network; fixed chunk size with retry).
- Scheduled CI refresh (GitHub Action) — possible follow-up once the tool is stable.
- Identifying the currently-unresolvable legacy bscmainnet roles (they are preserved in
  output; investigation is future work).
- Advanced filter conditions (e.g. "timelock but not guardian" presets). Phase 1 filter
  is a simple multi-select by grantee.

---

## 2. Removal of the current system

A single commit deletes `scripts/ACMPermissions/` entirely — code **and** all
`networks/*/` output files (`permissions.json`, `permissions.md`,
`nonGuardianPermissions.json`, `BNBPermissions.json`, `BNBMissingRole.json`,
`missingRoleInfo.txt`).

Consequence: the first run of the new tool rebuilds every network **from the ACM
deployment block**. This is intentional — clean provenance, no inherited decode
mistakes. Resumability (Section 7) makes the long first build safe to interrupt.
The old files remain available in git history for reference.

Note: two pieces of manual knowledge are preserved before deletion:
`bscmainnet/missingRoleInfo.txt` (known typo'd legacy grants) is copied into
`registry/legacy-signatures.json` (§5.1), and the address arrays of the old
`BNBPermissions.json` are copied into `registry/legacy-contracts.json` (§5.2) so
retired contracts that no longer appear in deployment artifacts stay decodable.

---

## 3. New layout

Everything lives in one folder:

```
scripts/acm-permissions/
├── README.md                       — usage, architecture, how bscmainnet decoding works
├── cli.ts                          — entry point; commands: fetch | verify | filter | build-registry
├── config.ts                       — network list, ACM deployment blocks, RPC resolution
├── core/
│   ├── fetcher.ts                  — chunked log scanning, checkpointing, retry
│   ├── decoder.ts                  — event → PermissionEvent (both ACM event models)
│   ├── reducer.ts                  — ordered event replay → snapshot state
│   ├── diff.ts                     — previous snapshot vs new snapshot
│   ├── verifier.ts                 — on-chain checks (per-run diff verify + full verify)
│   ├── registry.ts                 — load/generate signature + contract-name registries
│   └── output.ts                   — JSON / Markdown / changes writers (atomic)
├── registry/
│   ├── sources.json                — MANUAL: manifest of repos/packages to scan (§5.3)
│   ├── signatures.json             — GENERATED: permission strings provable from current sources
│   ├── legacy-signatures.json      — MANUAL: inherited/typo'd strings with origin annotations (bscmainnet)
│   ├── legacy-contracts.json       — MANUAL: retired bscmainnet addresses (seeded from old BNBPermissions.json)
│   └── contracts/<network>.json    — GENERATED: address → contract name
├── .sources-cache/                 — git-ignored: shallow clones of git-type sources
└── snapshots/<network>/
    ├── permissions.json            — machine-readable snapshot (source of truth)
    ├── permissions.md              — human-readable view
    ├── changes.md                  — diff report of the latest run (overwritten per run)
    ├── changes.json                — same diff, machine-readable
    └── unresolved-roles.json       — bscmainnet only: extract of undecoded entries
```

`package.json` scripts:

```
"acm:fetch":          "ts-node scripts/acm-permissions/cli.ts fetch",
"acm:verify":         "ts-node scripts/acm-permissions/cli.ts verify",
"acm:filter":         "ts-node scripts/acm-permissions/cli.ts filter",
"acm:build-registry": "ts-node scripts/acm-permissions/cli.ts build-registry"
```

No hardhat runtime. Plain `ethers` (v5, already a dependency) `JsonRpcProvider`s.

---

## 4. Configuration

- **Networks:** the 16 networks currently in `SUPPORTED_NETWORKS` (bscmainnet,
  bsctestnet, ethereum, sepolia, opbnbmainnet, opbnbtestnet, arbitrumone,
  arbitrumsepolia, zksyncmainnet, zksyncsepolia, opmainnet, opsepolia, basemainnet,
  basesepolia, unichainmainnet, unichainsepolia). `hardhat` is excluded.
- **RPC URLs:** same convention as `hardhat.config.ts` — `ARCHIVE_NODE_<network>` env
  var, falling back to the same public defaults. No new env setup required.
- **ACM address:** read from `deployments/<network>_addresses.json` in this repo.
- **Start blocks:** the existing `startingBlockForACM` map (ACM deployment block per
  network) is carried over into `config.ts`.
- **Chunk size:** fixed default 40,000 blocks, overridable via `--chunk-size`.

---

## 5. Registries (generated inputs)

### 5.1 Signature registry — `registry/signatures.json`

The list of every permission string Venus has ever used.

**Why it is needed:** on bscmainnet the ACM only emits `keccak256(contract, string)`
role hashes (§6.2). Hashes cannot be reversed, so the only way to decode an event is
to already know every candidate string and pre-compute its hashes. It also documents
the protocol's full permission surface. The list is global, not per-network: pairing
an address with a string that was never actually granted is harmless — that hash
simply never matches any emitted event — so over-inclusion is safe; only
under-inclusion causes unresolved roles.

**How the current system gets this list:** one hand-written file,
`networks/bscmainnet/BNBPermissions.json` — 37 contract entries / 99 addresses with
function strings typed in manually. Updated by hand and rarely, which is the direct
cause of the 17 undecodable roles in `BNBMissingRole.json` and of grants/revokes on
unlisted contracts being silently skipped.

**How the new system builds it:** generated by `acm:build-registry` from three
sources, merged and deduplicated:

1. **`helpers/permissions.ts` (this repo)** — the curated per-contract-type permission
   catalog (~217 strings). Parsed statically (regex over string literals), not executed.
2. **Source scan** — grep all Solidity sources for string literals passed to
   `_checkAccessAllowed("...")` / `checkAccessAllowed(..., "...")`. Scanned roots:
   `contracts/` in every source listed in `registry/sources.json` (this repo plus
   the pinned npm tarballs under `.sources-cache/`).
   This source is essential because Venus permission strings use **struct names**
   (e.g. `setTokenConfig(TokenConfig)`), which cannot be derived from ABIs.
   Dynamically-built strings (not plain literals) are logged for manual review.
3. **ABI supplement** — canonical function signatures from deployment-artifact ABIs,
   covering any externally-guarded functions missed by (1)/(2).

**File format:** grouped per contract for human review — an array of
`{ "name": …, "addresses": { "<network>": ["0x…"] }, "signatures": […] }` entries.
`name` is the Solidity file / deployment-artifact name the signatures were extracted
from; `addresses` is filled when a deployment artifact under a recognized network
directory carries an address (empty for source-only or raw-ABI extractions). The
grouping is presentation only: every consumer (hash-table build, verification)
flattens all groups into a single deduplicated signature set before matching, so
grouping cannot change decoding behavior — the same string appearing under several
contracts is expected and harmless.

**Freshness & provenance rules:**

- `signatures.json` is **always rebuilt from scratch and overwritten** — it contains
  only what the current sources actually prove, and is never hand-edited.
- On every rebuild, `acm:build-registry` diffs the fresh result against the previous
  committed version and prints which strings appeared / disappeared.
- Strings the _old system_ knew (the function strings inside the old
  `BNBPermissions.json`) that fresh extraction does **not** re-find are _not_ mixed
  into `signatures.json` — they go into `registry/legacy-signatures.json`. This keeps
  provenance clear: `signatures.json` = provable from sources today;
  `legacy-signatures.json` = inherited/manual knowledge.

`registry/legacy-signatures.json` is manual, and every entry carries an `origin`
field so we always know where a string came from:

```json
{
  "signatures": [
    {
      "signature": "_setActionsPaused(address[],uint256[],bool)",
      "origin": "missingRoleInfo.txt — typo'd historical grant, role since revoked"
    },
    {
      "signature": "…",
      "origin": "old BNBPermissions.json — not re-found in any current source"
    }
  ]
}
```

The bscmainnet hash table (§6.2) is built from the **union** of both files.

Output shape:

```json
{
  "generatedAt": "…",
  "signatures": ["pause()", "setTokenConfig(TokenConfig)", "..."]
}
```

Which repos/packages get scanned is driven by the source manifest (§5.3).

### 5.2 Contract-name registry — `registry/contracts/<network>.json`

`address → name` for every deployed Venus contract on that network.

**Why it is needed — two distinct purposes:**

1. **Name resolution (all networks):** events carry raw addresses; outputs are only
   human-reviewable if `0x939b…6396` renders as `NormalTimelock` and `0xfD36…8384` as
   `Unitroller`. Both target contracts and grantee accounts resolve through this
   registry.
2. **bscmainnet role-hash decoding:** the hash table (§6.2) needs every candidate
   _address_ just as it needs every candidate string — a missing address makes all of
   that contract's roles undecodable.

**How the current system gets it:** two disconnected hand-maintained lists — the
`addressMap` in `config.ts` (only ~6 named addresses per network: timelocks, guardian,
PoolRegistry, XVSBridgeDest — every other contract shows as a raw address in outputs,
and it has a checksum-case bug) and, separately for bscmainnet decoding, the address
arrays inside `BNBPermissions.json`.

**How the new system builds it:** every `@venusprotocol/*` npm package (and every
Venus repo) ships its hardhat-deploy artifacts, including
`deployments/<network>_addresses.json` — a plain `{ "ContractName": "0xaddress" }`
map. `acm:build-registry` reads that file from every source in the manifest (§5.3 —
`venus-protocol`, `isolated-pools`, `oracle`, `protocol-reserve`, `token-bridge`,
fetched without installing) plus this repo's own
`deployments/<network>_addresses.json` (timelocks, ACM, …) and merges them into one
per-network map. Added on top:

- the Guardian multisig address(es) per network, from
  `helpers/deploy/deploymentUtils.ts` (bscmainnet has three — named
  `Guardian 1`, `Guardian 2`, `Guardian 3`);
- `registry/legacy-contracts.json` — a small manual file (bscmainnet) for addresses
  that held permissions historically but no longer appear in current deployment
  artifacts (retired/replaced contracts). Seeded from the address list of the old
  `BNBPermissions.json` before deletion, so no decoding coverage is lost.

Merge rules: all keys checksummed at generation time and all lookups checksummed at
read time (eliminating the old case-sensitivity bug); if two packages name the same
address differently, both names are kept (`"NameA / NameB"`) and a warning is
printed. Unknown addresses render as the raw address in outputs — never dropped.

As with signatures, the set of scanned repos is defined by the source manifest (§5.3).

### 5.3 Source manifest — `registry/sources.json`

Not every Venus repo is installed in this project as an npm package. So the registry
builder does not hard-code its inputs — it reads a committed manifest that lists every
source and how to obtain it. **Both** the signature extraction (§5.1) and the address
extraction (§5.2) iterate this same manifest.

```json
{
  "sources": [
    { "type": "local", "path": "." },
    { "type": "npm", "package": "@venusprotocol/venus-protocol", "version": "9.4.0" },
    { "type": "npm", "package": "@venusprotocol/isolated-pools", "version": "<pin>" },
    { "type": "npm", "package": "@venusprotocol/oracle", "version": "<pin>" },
    { "type": "npm", "package": "@venusprotocol/protocol-reserve", "version": "<pin>" },
    { "type": "npm", "package": "@venusprotocol/token-bridge", "version": "<pin>" },
    { "type": "git", "url": "https://github.com/VenusProtocol/<repo>", "ref": "<tag-or-commit>" }
  ]
}
```

- **`local`** — this repo itself (`contracts/`, `deployments/`,
  `helpers/permissions.ts`).
- **`npm`** — **no project install required.** The npm registry serves every
  published package as a plain tarball
  (`https://registry.npmjs.org/<pkg>/-/<name>-<version>.tgz`);
  `acm:build-registry` downloads it at the pinned `version` and extracts it into the
  git-ignored cache (`scripts/acm-permissions/.sources-cache/npm/<pkg>@<version>/`),
  then scans its `contracts/` and `deployments/` folders. If the package happens to
  already be in `node_modules` at exactly the pinned version (as
  `@venusprotocol/venus-protocol` is today), it is read from there instead of
  downloading. `package.json` / `node_modules` are never modified either way.
- **`git`** — for Venus repos **not published as npm packages**: shallow-clone at the
  pinned `ref` into the same cache and scan identically. Pinning refs/versions keeps
  registry builds reproducible.
- Contracts that live in **no repo at all** (one-off historical deployments) are
  covered by the manual files: `legacy-contracts.json` / `legacy-signatures.json`.

The cache is a build-time convenience only — `fetch`/`verify`/`filter` never touch
it; they read the committed generated registries. Adding a newly created Venus repo
in the future is a one-line manifest change followed by `yarn acm:build-registry`.

Both registries are committed to git, so fetch runs are deterministic and reviewable.
`acm:fetch` warns (does not fail) if the contract-name registry is missing — names
just render as raw addresses. Exception: a **bscmainnet** fetch aborts if
`signatures.json` is missing, since role hashes cannot be decoded without it.

---

## 6. Fetch pipeline

`yarn acm:fetch --network all` (or `--network bscmainnet,ethereum`; `--network all`
is the default).

Per network, independently and in parallel (`Promise.allSettled`, one async task per
network — chunks within a network remain sequential):

```
resume height = snapshot.height (or ACM deployment block if no snapshot)
for each chunk [start, start+chunkSize-1] up to latest block:
    logs   = provider.getLogs(ACM address, grant/revoke topics, chunk range)   (retry: 5x, exp. backoff)
    events = decode(logs)                    — model depends on network (below)
    sort events by (blockNumber, logIndex)   — deterministic replay order
    state  = reduce(state, events)
    write snapshot atomically (tmp file + rename), height = chunk end          ← resume point
after last chunk:
    diff = compare(previous committed snapshot, new snapshot)
    verify diff on-chain (Section 8.1)
    write permissions.md, changes.md/json, unresolved-roles.json
```

If the stored height is already at (or newer than) the chain head, the run is a clean
no-op ("already up to date"), not an error.

### 6.1 Modern networks (all except bscmainnet)

ACM emits self-describing events:

- `PermissionGranted(address account, address contractAddress, string functionSig)`
- `PermissionRevoked(address account, address contractAddress, string functionSig)`

Decoding is direct. `contractAddress == address(0)` means a **wildcard** permission
(account may call `functionSig` on any contract) and is represented explicitly in the
snapshot with `"scope": "wildcard"`.

State key: `(contractAddress, functionSig)`.

### 6.2 bscmainnet (legacy role-hash ACM)

ACM emits only OpenZeppelin-style events:

- `RoleGranted(bytes32 role, address account, address sender)`
- `RoleRevoked(bytes32 role, address account, address sender)`

where `role = keccak256(abi.encodePacked(contractAddress, functionSig))` — irreversible.

Decoding via a precomputed hash table, built at startup:

```
for every address A in (contracts registry ∪ address(0)):
    for every signature S in (signatures.json ∪ legacy-signatures.json):
        table[keccak256(A, S)] = { contract: A, signature: S }
table[0x00…00] = DEFAULT_ADMIN_ROLE (ACM admin)
```

(~all addresses × ~all signatures ≈ a few hundred thousand hashes; computed once,
in-memory, seconds.)

**State key: the role hash itself.** Decoded metadata (contract, signature) is an
annotation, not the key. Consequences:

- A `RoleRevoked` always removes the grantee correctly **even for roles we cannot
  decode** — fixing the old tool's silent-staleness bug.
- Undecoded roles appear in `permissions.json` with `"decoded": false` and the raw
  hash — the fact that _something_ is granted is never lost.
- `unresolved-roles.json` is a filtered extract of those entries (with the grant/revoke
  tx hashes for later investigation).
- If a later registry rebuild adds a matching signature, the next run re-annotates the
  entry automatically (decode is re-applied to state on load).

### 6.3 bscmainnet-specific behavior — explicit checklist

Everything that applies **only** to bscmainnet, in one place:

| #   | bscmainnet-only behavior                                                                                                      | Where      |
| --- | ----------------------------------------------------------------------------------------------------------------------------- | ---------- |
| 1   | Listens to `RoleGranted`/`RoleRevoked` (role-hash events) instead of `PermissionGranted`/`PermissionRevoked`                  | §6.2       |
| 2   | Precomputed hash table (all registry addresses × all registry signatures, plus `address(0)` wildcard) to decode role hashes   | §6.2       |
| 3   | Snapshot state keyed by **role hash**, not (contract, signature)                                                              | §6.2       |
| 4   | Undecoded roles kept in `permissions.json` (`"decoded": false`) and extracted to `unresolved-roles.json` with their tx hashes | §6.2, §9   |
| 5   | Manual registry inputs: `legacy-signatures.json` (typo'd historical strings) and `legacy-contracts.json` (retired addresses)  | §5.1, §5.2 |
| 6   | The all-zero role maps to `DEFAULT_ADMIN_ROLE` on the ACM itself                                                              | §6.2       |
| 7   | Verification uses `hasRole(roleHash, account)` instead of `hasPermission(account, contract, sig)`                             | §8         |
| 8   | Three Guardian multisigs (`Guardian 1/2/3`); the filter value `Guardian` matches all three                                    | §5.2, §10  |
| 9   | Fetch aborts if `signatures.json` is missing (decoding impossible without it)                                                 | §5.2       |

All other behavior — chunked scanning, checkpointing, resumability, diff, outputs,
parallelism — is identical across all networks.

---

## 7. Resumability

- The snapshot file embeds `height` (last fully processed block) and is written
  **atomically after every chunk** (write `permissions.json.tmp`, then rename).
- Killing the process at any point loses at most the in-flight chunk; the next run
  continues from `height + 1`.
- `--to` overrides where scanning stops, for debugging; `--rebuild` deletes the
  network's snapshot and starts from the ACM deployment block.

---

## 8. Verification

### 8.1 Per-run diff verification (automatic)

After a fetch produces a diff, each changed entry is checked against the ACM at the
**current chain head** (a plain `eth_call` with no `blockTag` — not the snapshot's
`height`). This leaves a small race window between the block the scan stopped at and
the block the verification call actually lands on: a permission changed in that gap
could be read as confirming or contradicting a stale state. The window is at most a
few blocks and is closed by the next `fetch`, which resumes scanning from `height + 1`.

The check itself:

- modern networks: `hasPermission(account, contract, functionSig)` — added entries must
  return `true`, removed entries `false`.
- bscmainnet: `hasRole(roleHash, account)` — works for decoded **and** undecoded roles.

**On discrepancy, the on-chain state is authoritative.** The snapshot entry is
corrected to match the chain before outputs are written:

- diff said _added_ but chain says not granted → grantee removed from the snapshot;
- diff said _removed_ but chain says still granted → grantee restored in the snapshot.

Every correction is recorded in a dedicated **`## Corrections (on-chain authoritative)`**
section of `changes.md` / `changes.json` — stating what event replay produced, what the
chain returned, and that the snapshot was reverted to the on-chain value — and printed
prominently in the console summary. The run still exits 0 (the output is correct by
construction); corrections are a signal of a decoder/registry gap worth investigating,
so they are impossible to miss but never block the run.

### 8.2 Full verification (manual command)

`yarn acm:verify --network <n|all>` re-checks **every** entry in the snapshot against
the ACM (same view calls as §8.1, batched view calls — `Promise.all` groups of 20).
Use whenever a dual-check is wanted. It is not read-only: a network completing with
0 mismatches has its snapshot re-stamped (`verified`/`verifiedAt` in
`permissions.json` plus the `permissions.md` header), and any mismatch clears a
previous stamp — `height` and `changes.*` are never touched.

Honest limitation, documented in the README: full verify proves everything in the
snapshot is real on-chain; it cannot _discover_ a permission the scan never saw an
event for. Checkpointed sequential scanning is what guarantees no events are missed;
`--rebuild` exists as the ultimate re-derivation.

---

## 9. Output formats

### 9.1 `permissions.json` (source of truth, LLM/tool-friendly)

**What it stores** — the complete current permission state of one network:

- header: schema version, network, ACM address, snapshot block (`height`), timestamp,
  plus the optional `verified`/`verifiedAt` fields — the persistent stamp of the last
  successful on-chain verification (§8), carried forward by `refresh` and cleared by a
  `verify` run that finds mismatches;
- every contract that has at least one active permission: address + resolved name;
- per contract: each guarded function signature with its role hash and `decoded` flag;
- per function: the full grantee list, every grantee as address + resolved name;
- special groups: `"scope": "wildcard"` (permission valid on any contract) and, on
  bscmainnet, `"scope": "unresolved"` (undecoded role hashes, with grant tx hashes).

```json
{
  "schemaVersion": 1,
  "network": "bscmainnet",
  "acmAddress": "0x…",
  "height": 66323914,
  "updatedAt": "2026-07-10T12:00:00Z",
  "contracts": [
    {
      "address": "0xfD36…8384",
      "name": "Unitroller",
      "scope": "contract",
      "permissions": [
        {
          "functionSig": "_setCollateralFactor(address,uint256)",
          "roleHash": "0x…",
          "decoded": true,
          "grantees": [
            { "address": "0x939b…6396", "name": "NormalTimelock" },
            { "address": "0x7B1A…51c9", "name": "Guardian 1" }
          ]
        }
      ]
    },
    {
      "address": null,
      "name": "UNRESOLVED",
      "scope": "unresolved",
      "permissions": [
        {
          "functionSig": null,
          "roleHash": "0x602f…37f1",
          "decoded": false,
          "grantees": [{ "address": "0x…", "name": "0x…" }],
          "transactions": ["0x…grant tx…"]
        }
      ]
    }
  ]
}
```

Grouped **per target contract**, names resolved everywhere, wildcard entries under a
`"scope": "wildcard"` group, bscmainnet undecoded entries under `"scope": "unresolved"`.
Entries with zero grantees are omitted (fully revoked), as today.

### 9.2 `permissions.md` (human review)

**What it stores** — the same data as `permissions.json`, rendered for reading; it is
a pure render (regenerated every run, never hand-edited):

- summary header: snapshot block, update date, contract count, permission count, and
  the verification status of the last run;
- one section per contract (resolved name + address), containing a table of
  function signature × grantee names;
- a wildcard section (if any) and, on bscmainnet, a clearly marked
  "Unresolved roles" section at the bottom.

Grouped by contract name, one table per contract, with a summary header:

```md
# ACM Permissions — bscmainnet

Snapshot block: 66,323,914 · Updated: 2026-07-10 · Contracts: 41 · Permissions: 194
Verification: ✅ last diff verified on-chain

## Unitroller (`0xfD36…8384`)

| Function                                | Grantees                   |
| --------------------------------------- | -------------------------- |
| `_setCollateralFactor(address,uint256)` | NormalTimelock, Guardian 1 |

## ⚠️ Unresolved roles (bscmainnet only)

| Role hash | Grantees | First seen tx |
| --------- | -------- | ------------- |
```

### 9.3 `changes.md` / `changes.json` (per-run diff)

**What they store** — only the delta produced by the latest run (not cumulative
history; history lives in git):

- run metadata: date and the block range that was scanned;
- **Added**: every newly granted (contract, function, grantee), with its on-chain
  verification result;
- **Removed**: every revoked (contract, function, grantee), with its on-chain
  verification result;
- **Corrections (on-chain authoritative)**: any entry where event replay disagreed
  with the chain — what replay said, what the chain returned, and that the snapshot
  was reverted to the on-chain value (§8.1);
- if nothing changed, the files still get written with "No changes" so a reviewer has
  positive confirmation the run completed.

`changes.json` mirrors `changes.md` exactly, adding tx-level detail (tx hash, block,
log index) per entry.

```md
# Changes — bscmainnet (run 2026-07-10, blocks 66,323,915 → 68,100,000)

## Added (5)

- ✅ Unitroller `_setActionsPaused(...)` → FastTrackTimelock (verified on-chain)

## Removed (3)

- ✅ VAIController `setBaseRate(uint256)` ⇸ Guardian 2 (verified revoked)
```

---

## 10. Filter command

Replaces `fetchNonGuardianPermissions.ts`.

```
yarn acm:filter --network bscmainnet --grantees NormalTimelock,Guardian
```

- `--grantees` accepts one or more of: `NormalTimelock`, `FastTrackTimelock`,
  `CriticalTimelock`, `Guardian` (bscmainnet's three guardians all match `Guardian`),
  or a raw address.
- For **each** selected grantee, lists all permissions it holds (per-grantee sections).
- Prints a table to the console; `--out <path>` additionally writes JSON.
- Reads only the snapshot file — no RPC calls.
- Future condition presets (e.g. "timelocks but not guardian") will be added as named
  flags later; out of scope now.

---

## 11. Error handling & robustness rules

- **No swallowed errors:** any write failure or decode failure is fatal for that
  network (non-zero exit); other networks continue and the final summary reports
  per-network status (`14 ok, 1 failed, 1 up-to-date`). Diff-verification
  discrepancies are not fatal — they are auto-corrected from chain state and
  reported (§8.1).
- **Atomic writes** for every output file (tmp + rename).
- **Retry:** `getLogs` and view calls retry 5× with exponential backoff (5s → 60s cap);
  a chunk that still fails halts that network at the last good checkpoint (resumable).
- **Address hygiene:** every address checksummed at ingestion; registry lookups are
  checksummed at read time (`nameFor` re-checksums its input on every call).
- **Schema validation:** snapshot files validated on load (schemaVersion + shape);
  corrupt files abort with a clear message instead of silently starting from scratch.
- **Deterministic:** events sorted by `(blockNumber, logIndex)` before reduction.

---

## 12. Testing

- **Unit — reducer:** grant → revoke → re-grant; duplicate grants; revoke-before-grant;
  wildcard entries; bscmainnet keyed-by-hash behavior incl. undecoded revoke.
- **Unit — decoder:** both event models against fixture logs; DEFAULT_ADMIN_ROLE;
  unknown role → unresolved entry.
- **Unit — diff:** added / removed / unchanged / re-annotated (decoded-later) cases.
- **Unit — registry generation:** signature extraction from fixture sources (incl.
  struct-name signatures); checksum validation.
- **Golden files:** one fixture snapshot → expected `permissions.md` and `changes.md`.
- **Live smoke test (manual, documented in README):** short block range on bscmainnet
  (legacy model) and ethereum (modern model), plus `acm:verify` on the result.

Tests live under the existing repo test setup (`describe`/`it`, hardhat test runner is
fine for unit tests — no network needed).

---

## 13. Implementation phases

| Phase | Deliverable                                                                                                                                                                                                                                       | Commit boundary |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| 0     | Delete `scripts/ACMPermissions/` (first preserving `missingRoleInfo.txt` facts into a `legacy-signatures.json` draft and the old `BNBPermissions.json` addresses into a `legacy-contracts.json` draft)                                            | 1 commit        |
| 1     | `build-registry`: sources manifest, signature extractor + contract-name registry; finalize `legacy-signatures.json` / `legacy-contracts.json` by diffing fresh extraction against the old system's lists (from git history); committed registries | 1 commit        |
| 2     | Core fetch pipeline: config, fetcher, decoder, reducer, snapshots, resumability, JSON+MD outputs, parallel `--network all`                                                                                                                        | 1–2 commits     |
| 3     | Diff engine + per-run diff verification + `acm:verify` full-check command                                                                                                                                                                         | 1 commit        |
| 4     | `acm:filter` command                                                                                                                                                                                                                              | 1 commit        |
| 5     | Tests, README, first full snapshot build for all 16 networks committed                                                                                                                                                                            | 1–2 commits     |

Each phase is independently reviewable; the tool is usable from Phase 2 onward.

---

## 14. Decisions log (from design discussion)

- Standalone (no hardhat runtime) — chosen for single-command all-network parallelism.
- Old scripts and old output files deleted in one commit; full rebuild from ACM
  deployment blocks.
- Folder name: `scripts/acm-permissions/`.
- RPC: reuse `ARCHIVE_NODE_<network>` env vars + public fallbacks; no extra override
  mechanism.
- Undecoded bscmainnet roles stay in the main snapshot (keyed by role hash) **and** get
  an extracted `unresolved-roles.json`; identifying them is future work.
- Verification = automatic diff-verify per run + manual full-verify command. On any
  diff-verify discrepancy, on-chain state wins: the snapshot is corrected to match the
  chain and the correction is logged in the changes files.
- Phase-1 performance scope: parallel across networks only; sequential fixed-size
  chunks within a network.
- `signatures.json` is always rebuilt fresh and never hand-edited; strings known only
  to the old system live separately in `legacy-signatures.json` with `origin`
  annotations, so provenance is always clear.
- Registry inputs are defined in a `sources.json` manifest supporting npm packages,
  this repo, and git-cloned repos (for Venus repos not published as packages).
- npm sources are fetched as version-pinned registry tarballs into a git-ignored
  cache — nothing is installed into the project's `package.json`/`node_modules`.
