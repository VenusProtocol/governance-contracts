# ACM Permissions Tooling

A standalone CLI that scans every `AccessControlManager` (ACM) across all 16 Venus networks and
keeps a committed, reviewable answer to one question: **who can call what.** It replaces
`scripts/ACMPermissions/` (deleted; see git history), which relied on hand-maintained address and
signature maps and silently dropped roles it could not decode.

No hardhat runtime is involved — everything runs on plain `ethers` v5 `JsonRpcProvider`s, so every
command is a `ts-node` invocation and all networks can run in parallel. Design rationale lives in
[`DESIGN.md`](./DESIGN.md); this is the usage guide.

## How it fits together

Three directories, each with one job:

| Directory    | Holds                                                                                                                                                                                     | Written by                   |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| `registry/`  | A dictionary. `contracts/<network>.json` maps `0x1234… → "Comptroller"`; `signatures.json` lists every guarded function string found in Venus source. Knows nothing about who holds what. | `build-registry`             |
| `snapshots/` | The answer. `<network>/permissions.json` says which accounts hold which permission on which contract. Committed to git, so `git diff` is the record of what changed.                      | `fetch`, `verify`, `relabel` |
| `filters/`   | A question you asked of the snapshot — "what can the timelocks do that the guardians cannot". Ad-hoc, regenerate at will.                                                                 | `filter`                     |

`fetch` is the only command that discovers new facts. Everything else re-reads, re-checks or
re-renders what is already on disk.

## Commands

| Command                   | Reaches the chain      | Writes       | Run it when                                         |
| ------------------------- | ---------------------- | ------------ | --------------------------------------------------- |
| `yarn acm:fetch`          | yes                    | `snapshots/` | routinely — pick up new grants and revokes          |
| `yarn acm:verify`         | yes                    | `snapshots/` | you want an independent audit of the whole snapshot |
| `yarn acm:filter`         | no                     | `filters/`   | answering "what does this grantee hold?"            |
| `yarn acm:relabel`        | no                     | `snapshots/` | the registry grew and the reports need re-rendering |
| `yarn acm:build-registry` | downloads source repos | `registry/`  | a new Venus repo or version, or new deployments     |

### `yarn acm:fetch`

Scans ACM `PermissionGranted`/`PermissionRevoked` events — or, on bscmainnet, `RoleGranted`/`RoleRevoked`
(see [Decoding bscmainnet](#decoding-bscmainnet)) — from the last checkpointed block up to the chain
head, replays them into a snapshot, diffs against the committed snapshot, verifies that diff on-chain,
and writes `snapshots/<network>/{permissions.json,permissions.md,unresolved-roles.json}`.

```bash
yarn acm:fetch                                          # every network, in parallel
yarn acm:fetch --network bscmainnet                     # one network
yarn acm:fetch --network bscmainnet,ethereum            # a subset
yarn acm:fetch --network ethereum --chunk-size 20000    # smaller getLogs chunks (default 40000)
yarn acm:fetch --network sepolia --to 5000000           # stop at a specific block (debugging)
yarn acm:fetch --network bscmainnet --rebuild           # wipe and rescan from the ACM deployment block
yarn acm:fetch --network bscmainnet --verify            # also run the full on-chain sweep afterwards
```

The diff-verification is mandatory and runs every time. `--verify` additionally runs the full sweep
that `acm:verify` does — see [Verification model](#verification-model) for why those are two different
checks rather than the same one twice.

Networks run independently through `Promise.allSettled`, so one RPC timing out does not stop the
others. The closing `=== fetch summary ===` block reports `ok`, `up-to-date` or `FAILED: <reason>` per
network, and re-running resumes only the incomplete ones from their checkpoint
(see [Resumability](#resumability)).

There is no separate change-log file. The snapshots are committed, so `git diff` on
`permissions.json` is the record of a run; the run's own counts and every correction in full are
printed to the console.

### `yarn acm:verify`

Takes what is already in a network's snapshot and asks the chain, entry by entry, whether it is still
true — `hasPermission` on modern networks, `hasRole` on bscmainnet. It discovers nothing new; it only
removes entries the chain denies.

```bash
yarn acm:verify --network all
yarn acm:verify --network bscmainnet
```

Verification is chain-authoritative and self-correcting. Any denied entry is printed as a `FIXED` line
and removed from the snapshot, then the snapshot is saved with `verified`/`verifiedAt` stamped and
`permissions.md` re-rendered as `verified on-chain (as of <date>)`. Heights are never touched, because
a fix is a state correction rather than a rescan. The command exits non-zero only when an RPC or IO
error prevented verification — mismatches are fixed, not failed.

### `yarn acm:filter`

Lists what a grantee holds, read entirely from the committed snapshot. No RPC calls. Replaces the old
`fetchNonGuardianPermissions.ts`.

```bash
yarn acm:filter --network bscmainnet --grantees NormalTimelock,Guardian
yarn acm:filter --network ethereum --grantees 0xAbC…123 --out /tmp/out.json
```

| Flag            | Required | Meaning                                                                                                      |
| --------------- | -------- | ------------------------------------------------------------------------------------------------------------ |
| `--network`     | yes      | Exactly one network. No `all`, no comma lists — the report is grouped per grantee for one network at a time. |
| `--grantees`    | yes      | Whose sections to print. One section per name.                                                               |
| `--exclude`     | no       | Which rows to drop from those sections. Creates no sections of its own.                                      |
| `--legacy-only` | no       | Narrow to permissions no current source can explain (see [Legacy signatures](#legacy-signatures)).           |
| `--out`         | no       | Redirect the JSON copy. The Markdown copy always lands in `filters/<network>/`.                              |

`--grantees` and `--exclude` accept the same labels: a timelock name (`NormalTimelock`,
`FastTrackTimelock`, `CriticalTimelock`), the alias `Timelocks` (expands to all three, each keeping
its own section), the literal `Guardian` (expands to every guardian multisig on that network, so
per-guardian attribution survives), a specific `Guardian 2`, any other resolvable name in the
network's contract registry, or a raw `0x…` address. Aliases expand in the report sections, but the
output filename keeps the short label you typed.

#### How `--exclude` works

It removes permission rows, not parties. For every row in the snapshot — one contract, one function —
the rule is:

> Keep it if someone in `--grantees` holds it **and** nobody in `--exclude` holds it.

An excluded party's presence kills the row for everyone, including the grantee you asked about. Take
four real rows from `snapshots/bscmainnet/permissions.json`:

| Contract                    | Function                            | Grantees                                          |
| --------------------------- | ----------------------------------- | ------------------------------------------------- |
| BinanceOracle               | `setMaxStalePeriod(string,uint256)` | NormalTimelock, FastTrackTimelock, **Guardian 3** |
| BTCBPrimeConverter          | `pauseConversion()`                 | NormalTimelock, FastTrackTimelock, **Guardian 2** |
| AtlasOracle                 | `setTokenConfig(TokenConfig)`       | NormalTimelock                                    |
| AuxiliaryCommandsAggregator | `addAuthorizedBatchers(address[])`  | NormalTimelock, FastTrackTimelock                 |

Running `--grantees Timelocks --exclude Guardian` expands `Timelocks` to the three timelocks and
`Guardian` to all three bscmainnet guardians, then evaluates each row:

| Row                     | A timelock holds it | A guardian holds it | Result                                           |
| ----------------------- | ------------------- | ------------------- | ------------------------------------------------ |
| `setMaxStalePeriod`     | yes                 | yes                 | dropped                                          |
| `pauseConversion`       | yes                 | yes                 | dropped                                          |
| `setTokenConfig`        | yes                 | no                  | kept, under NormalTimelock                       |
| `addAuthorizedBatchers` | yes                 | no                  | kept, under NormalTimelock and FastTrackTimelock |

NormalTimelock genuinely holds `setMaxStalePeriod`, yet it is gone from NormalTimelock's own section
because a guardian holds it too. That is the point of the flag: the question it answers is _what can
the timelocks do that the guardians cannot_, and anything both hold is shared power rather than
timelock-exclusive power.

Matching is on the exact role — same contract plus same role hash — not the function name. If a
guardian holds `sweepToken(address,uint256)` on RiskFund and a timelock holds it on Comptroller, those
are different role hashes, so the timelock's row survives.

```bash
yarn acm:filter --network bscmainnet --grantees Timelocks --exclude Guardian
```

Every run writes both formats to
`filters/<network>/<grantees>[-minus-<exclude>][-legacy-only].{json,md}`, kept apart from `snapshots/`
because these are ad-hoc views regenerated at will, not fetch-maintained state.

### `yarn acm:build-registry`

Rebuilds the dictionary that `fetch`, `verify`, `relabel` and `filter` all read from.

It starts from `registry/sources.json`, a version-pinned manifest of 10 Venus code sources — this repo
plus `venus-protocol`, `isolated-pools`, `oracle`, `protocol-reserve`, `token-bridge`,
`venus-periphery`, `fixed-rate-vaults`, `erc-4626` and `guardian`. The npm ones are fetched as pinned
tarballs into the git-ignored `.sources-cache/`, so nothing touches `package.json` or `node_modules`.

From those sources it runs two scrapes:

- **Function names.** Every `contracts/**/*.sol` is searched for guard calls carrying a string
  literal. `_checkAccessAllowed("setReserveFactor(uint256)")` is captured;
  `_checkAccessAllowed(someVariable)` cannot be, and is printed for manual review — those may need a
  `registry/legacy-signatures.json` entry. Every ABI under `deployments/`, and `helpers/permissions.ts`
  where it exists, are scraped the same way.
- **Contract names.** Each repo's `deployments/<network>_addresses.json` is inverted into
  address → name, per network.

```bash
yarn acm:build-registry
```

It writes `registry/signatures.json` (grouped per contract as
`{ name, addresses: { network: [addr…] }, signatures: […] }` for reviewability — consumers flatten all
groups into one deduplicated set before matching) and `registry/contracts/<network>.json` for each of
the 16 networks. It prints how many signatures appeared and disappeared since the last run, and how
many named contracts resolved per network. Anything that **disappeared** is copied into
`legacy-signatures.json` before it is lost.

You need this registry for two unrelated reasons. Reports on all 16 networks need address → name to be
readable at all, and bscmainnet cannot decode its role hashes without the candidate set of addresses
and signatures.

### `yarn acm:relabel`

Offline re-annotation and re-render of the committed snapshots. No RPC calls, no height change. It
exists because the snapshot already stores every event it has ever seen, so growing the registry never
requires a rescan.

```bash
yarn acm:relabel                       # every network
yarn acm:relabel --network bscmainnet  # one network
```

It does two jobs, and only one is bscmainnet-specific:

- **Decode role hashes — bscmainnet only.** `reannotateUndecoded` runs against a freshly built hash
  table, and in `core/relabel.ts` the table is `isLegacyAcm(network) ? buildHashTable(…) : null`, so
  it is `null` on the other 15 networks. They decode fully at fetch time and have nothing to
  re-decode.
- **Re-resolve names and re-render — all 16 networks.** Contract and grantee names are looked up again
  in the current `registry/contracts/<network>.json`, then `permissions.json` and `permissions.md` are
  rewritten. If `build-registry` learned a new name for an address, every network's report needs this.

Per network it prints `<network>: <N> roles, <K> newly decoded, <U> still unresolved`, and deletes
`unresolved-roles.json` once nothing remains unresolved. A missing snapshot warns and skips.

The typical sequence after adding a source repo:

```bash
# edit registry/sources.json to add the new source
yarn acm:build-registry     # the dictionary grows
yarn acm:relabel            # old unreadable hashes become readable, all reports relabelled
```

## Decoding bscmainnet

Every network except bscmainnet runs a modern ACM emitting self-describing events:

```
PermissionGranted(address account, address contractAddress, string functionSig)
```

Nothing to decode, and `contractAddress == address(0)` marks a wildcard permission. bscmainnet alone
runs the legacy ACM, which emits only the OpenZeppelin form:

```
RoleGranted(bytes32 role, address account, address sender)
```

where `role = keccak256(abi.encodePacked(contractAddress, functionSig))`. That is a one-way hash, so
the only way to read it is to already know every candidate pair and look for a match. `fetch` builds
that table in memory at startup:

```
for every address A in the contracts registry:
  for every signature S in (signatures.json ∪ legacy-signatures.json):
    table[keccak256(A, S)] = { contract: A, signature: S }
for every signature S: table[keccak256(bytes32(0) ++ S)] = { contract: address(0), signature: S }
table[0x00…00] = DEFAULT_ADMIN_ROLE
```

A few hundred thousand hashes, computed once, in seconds.

The wildcard row hashes a **32-byte zero constant**, because that is how the ACM actually deployed on
bscmainnet derives its wildcard role — `keccak256(bytes32(0) ++ functionSig)` — unlike the modern ACM
source in this repo, which packs the 20-byte `address(0)`. All of bscmainnet's wildcard grants use the
32-byte form and are live, verified via `isAllowedToCall`. The 20-byte form is deliberately absent from
the table: the deployed ACM never derives it, so a role matching only that form would be a broken grant
the ACM ignores, better surfaced as unresolved than decoded as a working wildcard.

The snapshot is keyed by the **role hash itself**, not by `(contract, signature)`, so a `RoleRevoked`
removes the grantee correctly even when the role cannot be decoded — the old tool's silent-staleness
bug is gone. Roles the table cannot decode stay in `permissions.json` with `"decoded": false` and the
raw hash, so nothing is ever dropped, and are extracted into `unresolved-roles.json` with their grant
transaction hashes for later investigation. The next `build-registry` that adds a matching signature or
address makes them readable on the following `relabel` or `fetch`, since re-decode is applied to loaded
state before any diff is computed. bscmainnet currently has 337 permissions across 69 contracts, none
of them undecoded.

Full detail, including the bscmainnet-only behaviour checklist, is in
[`DESIGN.md` §6.2/§6.3](./DESIGN.md#62-bscmainnet-legacy-role-hash-acm).

## Legacy signatures

Some permissions on chain point at a function that is not in any Venus source repo the tool scrapes.
Their function strings live in `registry/legacy-signatures.json`, a hand-maintained file, so bscmainnet
can still decode their hashes. `acm:filter --legacy-only` narrows a report to exactly those.

A string lands in that file two ways. `build-registry` copies it in automatically when it disappears
from the sources — a function renamed or deleted — so the record of every string ever used for
decoding survives a rebuild. Or someone traces an old VIP, recovers the string, and adds it by hand
with a note on where it came from.

When a permission shows up under `--legacy-only`, the grant is real and live on chain; that is never in
doubt. What is missing is source code containing that function. Two very different causes produce the
same output, and the file's `origin` notes are what tell them apart:

| Cause                                                        | Example (all 4 current entries are one or the other)                                                                 | What to do                          |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| The function is genuinely gone, and nobody revoked the grant | `sweepTokenFromPool(address,address,address,uint256)` — VIP-357 on RiskFundV2, absent from protocol-reserve sources  | **revocation candidate**            |
| The function is alive; the registry just cannot see it       | `createVault(VaultConfig,…)` — fixed-rate-vaults ABI emits `tuple` for struct params, so the string is not derivable | **fix the registry, not the grant** |

So treat the output as an investigation list rather than a revocation list. The first question per
entry is whether this is a registry gap; close those by adding the source or the string, rerun
`build-registry`, and what survives is the real cleanup work.

```bash
yarn acm:filter --network bscmainnet --grantees Timelocks,Guardian --legacy-only
```

## Verification model

Two tiers, deliberately not the same check twice.

**Tier 1 — per-run diff verification, mandatory on every `fetch`.** Only the entries that changed in
this run are checked against the chain. On any discrepancy the chain wins: the snapshot entry is
corrected before any output is written, and each correction is printed in full. The run still exits 0,
because a correction signals a decoder or registry gap worth investigating rather than a failure. This
tier is the only one that can catch a **false removal** — a grant the replay dropped but the chain
still has — which is why it stays even though tier 2 follows it.

**Tier 2 — full verification, opt-in via `acm:fetch --verify` or an explicit `acm:verify`.** Re-checks
every entry currently in the snapshot and removes anything the chain denies, printed as `FIXED` lines.
Not needed routinely, since tier 1 already chain-checks everything that changed, but it is the
independent audit that does not rely on trusting the diff logic that produced the snapshot.

**Documented limitation ([`DESIGN.md` §8.2](./DESIGN.md#8-verification)):** full verify proves that
everything already in the snapshot is real on-chain. It cannot discover a permission the scan never saw
an event for — a gap in the scanned block range, or a registry missing an address or signature at scan
time. The guarantee against missed events comes entirely from the checkpointed, sequential, gap-free
chunk scanning that `fetch` performs, and `acm:fetch --network <n> --rebuild` is the ultimate
re-derivation if a gap is ever suspected.

## Output files

Per network, under `snapshots/<network>/`:

| File                    | Contents                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `permissions.json`      | Source of truth. A header (`schemaVersion`, `network`, `acmAddress`, `height`, `updatedAt`, `verified`, `verifiedAt`), then every contract holding at least one active permission, each guarded function with its role hash, `decoded` flag and full grantee list of address plus resolved name. Wildcard permissions carry `"scope": "wildcard"`; bscmainnet's undecoded hashes carry `"scope": "unresolved"`. Entries with zero grantees are omitted. |
| `permissions.md`        | A pure render of `permissions.json` for human review — one table per contract, a summary header with block, date, counts and last verification status, a wildcard section, and on bscmainnet an unresolved-roles section. Regenerated every run, never hand-edited.                                                                                                                                                                                     |
| `unresolved-roles.json` | bscmainnet only, and omitted when there is nothing to report. Every undecoded role hash with its grantees and first-seen grant transaction hashes. Revoke transactions are not recorded.                                                                                                                                                                                                                                                                |

## Adding a network or source repo

**A new network** needs four edits: add it to `NETWORKS` in `types.ts`, its ACM deployment block to
`STARTING_BLOCKS` in `config.ts`, its public RPC fallback to `PUBLIC_RPC`, and its guardian multisigs to
`GUARDIANS`. Then run `yarn acm:build-registry` to generate `registry/contracts/<network>.json`,
followed by `yarn acm:fetch --network <network>`.

**A new source repo** needs one entry in `registry/sources.json`:
`{ "type": "npm", "package": "…", "version": "…" }` for anything published to npm, fetched as a
version-pinned tarball into `.sources-cache/`, or `{ "type": "git", "url": "…", "ref": "…" }` for repos
that are not published as packages, shallow-cloned at the pinned ref. Then run `yarn acm:build-registry`
and review the printed appeared/disappeared diff before committing. Contracts that live in no repo at
all — retired one-off historical deployments, bscmainnet only — go in the manual
`registry/legacy-contracts.json` instead.

Both generated registries are committed to git so that `fetch` runs are deterministic and reviewable.
They are never edited by hand, only regenerated.

## Resumability

Every snapshot embeds `height`, the last fully processed block, and is written atomically — temp file
then rename — after **every chunk**, not just at the end of a run. Killing the process loses at most the
in-flight chunk; the next `fetch` continues from `height + 1` automatically, with no flag needed.
`--to` overrides where scanning stops, for debugging. `--rebuild` deletes the snapshot entirely and
starts from the ACM deployment block.

This is also what makes the first full build safe to interrupt — roughly 1,100 sequential `getLogs`
chunks on bscmainnet, the long pole among the 16 networks. A flaky public RPC rejecting one chunk costs
that chunk, not the scan.

## Live smoke test

A quick end-to-end check against a real RPC without waiting for a full scan:

```bash
yarn acm:fetch --network ethereum --to <deployment-block + a few thousand>    # modern event model
yarn acm:fetch --network bscmainnet --to <deployment-block + a few thousand>  # legacy role-hash model
yarn acm:verify --network ethereum,bscmainnet
```
