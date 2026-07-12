# ACM Permissions Tooling

A standalone, non-interactive CLI that scans every `AccessControlManager` (ACM) on
every Venus network and produces a complete, correct, human- and machine-readable
snapshot of who can call what. It replaces the old `scripts/ACMPermissions/` system
(deleted; see git history), which relied on hand-maintained address/signature maps and
silently dropped undecodable roles and grants on unlisted contracts.

Full design rationale lives in [`DESIGN.md`](./DESIGN.md) — this README is the
day-to-day usage guide.

No hardhat runtime is involved: everything runs on plain `ethers` v5
`JsonRpcProvider`s, so all commands are plain `ts-node` invocations and all networks
can run in parallel with one command.

## Commands

### `yarn acm:fetch`

Scans ACM `PermissionGranted`/`PermissionRevoked` events (or, on bscmainnet,
`RoleGranted`/`RoleRevoked` — see [Decoding bscmainnet](#decoding-bscmainnet) below)
from the last checkpointed block (or the ACM deployment block, on a first run) up to
the current chain head, replays them into a snapshot, diffs against the previously
committed snapshot, verifies the diff on-chain, and writes:
`snapshots/<network>/{permissions.json,permissions.md,changes.md,changes.json,unresolved-roles.json}`.

```bash
yarn acm:fetch                                   # every network, in parallel
yarn acm:fetch --network bscmainnet              # one network
yarn acm:fetch --network bscmainnet,ethereum     # a subset
yarn acm:fetch --network ethereum --chunk-size 20000   # smaller getLogs chunks (default 40000)
yarn acm:fetch --network sepolia --to 5000000          # stop scanning at a specific block (debugging)
yarn acm:fetch --network bscmainnet --rebuild          # wipe the snapshot, rescan from the ACM deployment block
```

Networks run independently (`Promise.allSettled`) — one network failing (e.g. an RPC
timing out) does not stop the others; the final `=== fetch summary ===` block reports
per-network status (`ok`, `up-to-date`, or `FAILED: <reason>`), and re-running the same
command resumes only the failed/incomplete networks from their last checkpoint (see
[Resumability](#resumability)).

### `yarn acm:verify`

Re-checks **every** entry in a network's committed snapshot directly against the ACM
(`hasPermission` on modern networks, `hasRole` on bscmainnet) — a full, independent
audit of the snapshot, as opposed to the incremental diff-check that `fetch` already
does automatically on every run. See [Verification model](#verification-model) for
what this can and cannot prove.

```bash
yarn acm:verify --network all
yarn acm:verify --network bscmainnet
```

Exits non-zero (and prints every `MISMATCH` line) if any snapshot entry is not
actually held on-chain. Note that `verify` is not read-only: it stamps the outcome
onto the snapshot — a clean network gets `verified`/`verifiedAt` written into
`permissions.json` and the `permissions.md` header re-rendered to
`✅ verified on-chain (as of <date>)`, while any mismatch clears a previous stamp back
to `⚠️ not verified` (heights and `changes.*` are never touched).

### `yarn acm:filter`

Lists every permission a specific grantee (or set of grantees) holds, read entirely
from the committed snapshot — no RPC calls. Replaces the old
`fetchNonGuardianPermissions.ts`.

```bash
yarn acm:filter --network bscmainnet --grantees NormalTimelock,Guardian
yarn acm:filter --network ethereum --grantees 0xAbC...123 --out /tmp/out.json
```

`--grantees` accepts timelock names (`NormalTimelock`, `FastTrackTimelock`,
`CriticalTimelock`), the literal `Guardian` (matches all guardian multisigs on that
network — bscmainnet has three), any other resolvable name in the network's contract
registry, or a raw `0x…` address. Requires exactly one `--network` (no `all`, no
comma lists) since the output is grouped per grantee for one network at a time.

`--exclude` takes the same label kinds and turns the listing into a set difference:
only permissions the grantee holds that **none** of the excluded grantees also hold
on that exact role (same contract + role hash). The main use is
"what can a timelock do that Guardian cannot":

```bash
yarn acm:filter --network bscmainnet --grantees NormalTimelock,FastTrackTimelock,CriticalTimelock --exclude Guardian
```

Every run writes an on-demand report (JSON + Markdown) to
`scripts/acm-permissions/filters/<network>/<grantees>[-minus-<exclude>].{json,md}` —
kept apart from `snapshots/` because these are ad-hoc views regenerated at will, not
fetch-maintained state. `--out <path>` redirects the JSON copy.

### `yarn acm:build-registry`

Rebuilds the two **generated** registries that `fetch`/`verify`/`filter` read from —
`registry/signatures.json` (every permission string provable from current sources,
grouped per contract as `{ name, addresses: { network: [addr…] }, signatures: […] }`
for reviewability — consumers flatten all groups into one deduplicated set before
matching) and `registry/contracts/<network>.json` (address → name, per network). Run this whenever
a new Venus repo/version is added to the source manifest (see
[Adding a network or source repo](#adding-a-network-or-source-repo)), or periodically
to pick up newly deployed contracts/newly added guarded functions.

```bash
yarn acm:build-registry
```

Prints a diff of which permission strings appeared/disappeared versus the previously
committed `signatures.json`, and how many named contracts were resolved per network.
Any dynamically-built `checkAccessAllowed` string (i.e. not a plain literal) is logged
for manual review — it cannot be statically extracted and may need a
`registry/legacy-signatures.json` entry.

### `yarn acm:refresh`

Offline re-annotation and re-render of the **already-committed** snapshots — no RPC
calls, no height change, no `changes.md`/`changes.json` rewrite (there is nothing to
diff: no scanning happened). It exists because the snapshot already stores every event
it has ever seen (keyed by role hash on bscmainnet), so growing the registry (a new
source added to `sources.json`, newly resolved contract names, newly discovered
signatures) never requires a rescan — only a re-decode/re-render of what's already on
disk.

```bash
yarn acm:refresh                       # every network
yarn acm:refresh --network bscmainnet  # one network
```

Per network: loads the snapshot, re-applies `reannotateUndecoded` against a freshly
built hash table (bscmainnet only — this is the only network with roles that can ever
be undecoded), re-resolves every contract/grantee name from the **current**
`registry/contracts/<network>.json`, and rewrites `permissions.json`/`permissions.md`
(and deletes `unresolved-roles.json` once nothing remains unresolved). Prints
`<network>: <N> roles, <K> newly decoded, <U> still unresolved` per network; missing
snapshot → warn + skip.

Typical workflow after adding a new source repo:

```bash
# edit registry/sources.json to add the new source
yarn acm:build-registry     # regenerate signatures.json / contracts/<network>.json
yarn acm:refresh            # re-decode/re-render existing snapshots against the new registry
```

## Decoding bscmainnet

Every network except bscmainnet runs a modern ACM that emits self-describing
`PermissionGranted(address account, address contractAddress, string functionSig)` /
`PermissionRevoked(...)` events — decoding is direct, and `contractAddress ==
address(0)` marks a wildcard permission. bscmainnet alone runs the legacy ACM, which
emits only OpenZeppelin `RoleGranted(bytes32 role, address account, address sender)` /
`RoleRevoked(...)` events, where
`role = keccak256(abi.encodePacked(contractAddress, functionSig))` — a one-way hash.
Decoding it requires already knowing every candidate `(address, signature)` pair, so
`fetch` builds an in-memory hash table at startup:

```
for every address A in the contracts registry:
  for every signature S in (signatures.json ∪ legacy-signatures.json):
    table[keccak256(A, S)] = { contract: A, signature: S }
for every signature S: table[keccak256(bytes32(0) ++ S)] = { contract: address(0), signature: S }
table[0x00…00] = DEFAULT_ADMIN_ROLE
```

(a few hundred thousand hashes, computed once, in memory, in seconds).

The wildcard row hashes a **32-byte zero constant** because that is how the ACM
actually deployed on bscmainnet derives its wildcard ("may call this on any
contract") role — `keccak256(bytes32(0) ++ functionSig)` — unlike the modern ACM
source in this repo, which packs the 20-byte `address(0)`. All of bscmainnet's
wildcard grants use the 32-byte form and are live (verified via `isAllowedToCall`).
The 20-byte `address(0)` form is deliberately **not** in the table: the deployed ACM
never derives it, so a role that only matched that form would be a broken grant the
ACM ignores — better surfaced as unresolved than decoded as a working wildcard.

The snapshot is keyed by the **role hash itself**, not by `(contract, signature)` —
so a `RoleRevoked` always removes the grantee correctly even when the role can't be
decoded (the old tool's silent-staleness bug is gone). Roles the table can't decode
stay in `permissions.json` with `"decoded": false` and the raw hash — nothing is ever
dropped — and are additionally extracted into `unresolved-roles.json` with their
grant tx hashes for later investigation (revoke transactions are not recorded). If a
later `build-registry` run adds a matching signature or address, the very next `fetch`
re-annotates those entries automatically (re-decode is applied to loaded state before
any diff is computed).

Full details, including the complete bscmainnet-only behavior checklist, are in
[`DESIGN.md` §6.2/§6.3](./DESIGN.md#62-bscmainnet-legacy-role-hash-acm).

## Verification model

Two tiers, both automatic-or-cheap, deliberately not the same check twice:

1. **Per-run diff verification (automatic, every `fetch`)** — only the entries that
   _changed_ in this run (added/removed) are checked against the chain
   (`hasPermission`/`hasRole`, per §6.2). On any discrepancy, **on-chain state wins**:
   the snapshot entry is corrected to match the chain before any output is written, and
   the correction is recorded in a `## Corrections (on-chain authoritative)` section of
   `changes.md`/`changes.json` and printed prominently. The run still exits 0 —
   corrections are a signal of a decoder/registry gap worth investigating, not a
   failure.
2. **Full verification (manual, `acm:verify`)** — re-checks _every_ entry currently in
   the snapshot against the chain. Use this as an independent, whole-snapshot audit —
   it does not rely on trusting the diff logic that produced the snapshot.

**Documented limitation (DESIGN.md §8.2):** full verify proves that everything
_already in_ the snapshot is real on-chain. It **cannot discover** a permission the
scan never saw an event for (e.g. a gap in the scanned block range, or a registry that
was missing an address/signature at scan time). The guarantee against missed events
comes entirely from the checkpointed, sequential, gap-free chunk scanning that `fetch`
performs — `acm:fetch --network <n> --rebuild` is the ultimate re-derivation if a gap
is ever suspected.

## Adding a network or source repo

- **New network:** add it to `NETWORKS` in `types.ts`, its ACM deployment block to
  `STARTING_BLOCKS` in `config.ts`, its public RPC fallback to `PUBLIC_RPC`, and its
  guardian multisig(s) to `GUARDIANS`. Then run `yarn acm:build-registry` (to generate
  `registry/contracts/<network>.json`) followed by `yarn acm:fetch --network <network>`.
- **New source repo/package** (a Venus repo whose contracts/deployments should feed
  the signature and contract-name registries): add one entry to
  `registry/sources.json` — `{ "type": "npm", "package": "...", "version": "..." }`
  for anything published to npm (fetched as a version-pinned tarball into the
  git-ignored `.sources-cache/`, no `package.json`/`node_modules` changes), or
  `{ "type": "git", "url": "...", "ref": "..." }` for repos not published as packages
  (shallow-cloned at the pinned ref). Then run `yarn acm:build-registry` and review the
  printed appeared/disappeared signature diff before committing. Contracts that live in
  no repo at all (retired, one-off historical deployments — bscmainnet only) go in the
  manual `registry/legacy-contracts.json` instead.
- Both generated registries (`registry/signatures.json`,
  `registry/contracts/<network>.json`) are committed to git so that `fetch` runs are
  deterministic and reviewable — they are never edited by hand, only regenerated.

## Resumability

Every snapshot file embeds `height` (the last fully processed block) and is written
**atomically** (temp file + rename) after **every** chunk, not just at the end of a
run. Killing the process at any point loses at most the in-flight chunk — the next
`fetch` for that network continues from `height + 1` automatically; no flag is needed.
`--to` overrides where scanning stops (for debugging); `--rebuild` deletes the
network's snapshot entirely and starts over from the ACM deployment block. This is
also what makes the very first full build (~1,100 sequential `getLogs` chunks on
bscmainnet, the long pole among all 16 networks) safe to interrupt and re-run — a
flaky public RPC rejecting one chunk only costs that chunk, not the whole scan.

## Output files (per network, under `snapshots/<network>/`)

| File                          | Contents                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `permissions.json`            | Source of truth. Current permission state: header (schema version, network, ACM address, `height`, `updatedAt`), then every contract with at least one active permission — grouped by resolved contract name/address, each guarded function signature with its role hash, `decoded` flag, and full grantee list (address + resolved name). Wildcard permissions (`contractAddress == address(0)`, "may call this function on any contract") appear under `"scope": "wildcard"`; bscmainnet's undecoded role hashes appear under `"scope": "unresolved"`. Entries with zero remaining grantees are omitted. |
| `permissions.md`              | Pure render of `permissions.json` for human review — one table per contract, a summary header (block, date, contract/permission counts, last verification status), a wildcard section, and (bscmainnet) an "Unresolved roles" section. Regenerated every run, never hand-edited.                                                                                                                                                                                                                                                                                                                           |
| `changes.md` / `changes.json` | Only the delta from the **latest run** (not cumulative — history lives in git): run metadata (date, block range scanned), `Added`, `Removed`, and `Corrections (on-chain authoritative)` sections. Written with "No changes" whenever a scan ran this run but found nothing, so a reviewer has positive confirmation the run completed; an already-up-to-date no-op run (nothing left to scan) writes neither file at all. `changes.json` mirrors `changes.md`, adding each entry's tx hash.                                                                                                               |
| `unresolved-roles.json`       | bscmainnet only (omitted when there is nothing to report). Extract of every undecoded role hash from `permissions.json`, with grantees and first-seen grant tx hashes, for later investigation.                                                                                                                                                                                                                                                                                                                                                                                                            |

## Live smoke test (manual)

For a quick end-to-end sanity check on a real RPC without waiting for a full scan:

```bash
yarn acm:fetch --network ethereum --to <deployment-block + a few thousand>   # modern event model
yarn acm:fetch --network bscmainnet --to <deployment-block + a few thousand> # legacy role-hash model
yarn acm:verify --network ethereum,bscmainnet
```
