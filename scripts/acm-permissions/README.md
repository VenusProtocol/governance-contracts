# ACM permissions tool

This CLI keeps a readable, reviewable record of who can call protected functions through Venus
`AccessControlManager` (ACM) contracts. It scans permission events on all supported networks, builds a
snapshot of the current state, and checks changes against the chain before saving them.

The tool uses `ethers` JSON-RPC providers directly; it does not start Hardhat. Snapshots and generated
registries are committed to git, so normal code review and `git diff` show permission changes clearly.
For implementation details and design decisions, see [DESIGN.md](./DESIGN.md).

## Quick start

Run commands from the repository root:

```bash
# Update every network from its last saved block
yarn acm:fetch

# Update one network
yarn acm:fetch --network ethereum

# Review what changed
git diff -- scripts/acm-permissions/snapshots
```

Each network uses `ARCHIVE_NODE_<network>` when it is set, for example
`ARCHIVE_NODE_ethereum`. Otherwise, the tool falls back to the public RPC URL in `config.ts`. An
archive-capable, reliable RPC is recommended for rebuilds and older block ranges.

## How the data is organized

| Directory    | Purpose                                                                                                     |
| ------------ | ----------------------------------------------------------------------------------------------------------- |
| `registry/`  | Known contract names and guarded function signatures used to label and decode permissions.                  |
| `snapshots/` | The current permission state for each network. These files are the source of truth and should be committed. |
| `filters/`   | On-demand reports for selected grantees. These can be regenerated at any time.                              |

Only `fetch` discovers new grants and revocations. The other commands verify, relabel, or filter data
that is already stored locally.

## Commands

### Fetch permissions

`fetch` scans from the snapshot's last completed block to the requested block or current chain head.
It applies grant and revoke events, verifies every changed entry against the same end block, and then
writes the updated snapshot. A run that finds changes stamps the snapshot as verified; a run that only
advances the block height without finding events verified nothing, so it carries the previous
verification stamp through unchanged.

```bash
yarn acm:fetch                                      # all networks, in parallel
yarn acm:fetch --network bscmainnet                 # one network
yarn acm:fetch --network ethereum,arbitrumone       # selected networks
yarn acm:fetch --network ethereum --chunk-size 20000
yarn acm:fetch --network sepolia --to 5000000       # stop at a specific block
yarn acm:fetch --network ethereum --verify          # also verify every stored entry
yarn acm:fetch --network bscmainnet --rebuild       # discard its snapshot and scan from deployment
```

The default chunk size is 40,000 blocks. A snapshot is saved atomically after every chunk, so an
interrupted run continues from the next unprocessed block. Networks run independently: one failed
network does not stop the others, but the command exits with an error if any network fails.

Use `--rebuild` carefully. It removes the selected network's existing snapshot before scanning again
from the configured ACM deployment block.

### Verify a snapshot

`verify` checks every grantee entry currently in a snapshot with `hasPermission` or `hasRole`. Entries
denied by the chain are printed as `FIXED`, removed, and the Markdown report is regenerated.

```bash
yarn acm:verify --network all
yarn acm:verify --network bscmainnet,ethereum
```

This is a full audit of stored entries. It can prove that an entry in the snapshot is still active,
but it cannot find a permission missing from the snapshot; only event scanning can do that. Use
`fetch --rebuild` if you suspect a gap in scan history.

Every check is pinned to the snapshot's own block, so the result describes the same chain state the
snapshot claims and `height` stays meaningful. That needs an RPC still holding state at that block.
The public fallbacks prune, so on anything but a just-fetched snapshot either run `fetch` first or
point `ARCHIVE_NODE_<network>` at an archive node. A single probe call runs before the sweep, so a
node without that state fails in seconds with a message naming the fix, rather than part way in.

### Filter by grantee

`filter` reads a single local snapshot and creates JSON and Markdown reports without making RPC calls.

```bash
yarn acm:filter --network bscmainnet --grantees Timelocks
yarn acm:filter --network bscmainnet --grantees Timelocks --exclude Guardian
yarn acm:filter --network ethereum --grantees 0x1111111111111111111111111111111111111111 --out /tmp/permissions.json
yarn acm:filter --network bscmainnet --grantees Timelocks,Guardian --legacy-only
```

| Flag            | Meaning                                                                            |
| --------------- | ---------------------------------------------------------------------------------- |
| `--network`     | One network only. `all` and comma-separated lists are not supported here.          |
| `--grantees`    | Required comma-separated names or addresses to report.                             |
| `--exclude`     | Remove a permission when any excluded party holds that exact same role.            |
| `--legacy-only` | Keep only signatures known solely through `legacy-signatures.json`.                |
| `--out`         | Choose the JSON output path. Markdown is still written under `filters/<network>/`. |

Useful aliases are:

- `Timelocks`: expands to Normal, FastTrack, and Critical timelocks, with a separate section for each.
- `Guardian`: expands to every configured guardian on the network.
- A registry name such as `NormalTimelock`, or any checksummed/raw `0x...` address.

`--exclude` works on the complete permission role, not just the function name. For example,
`--grantees Timelocks --exclude Guardian` answers: “Which permissions do the timelocks hold that no
guardian also holds?” The same function on two different contracts counts as two different roles.

Reports are written to:

```text
filters/<network>/<grantees>[-minus-<exclude>][-legacy-only].json
filters/<network>/<grantees>[-minus-<exclude>][-legacy-only].md
```

### Rebuild the registry

`build-registry` rebuilds contract names and protected function signatures from the pinned sources in
`registry/sources.json`:

```bash
yarn acm:build-registry
```

It scans Solidity access checks, deployment ABIs and address files. Pinned npm packages or git
repositories are downloaded into the ignored `.sources-cache/` directory when they are not already
available. The command writes:

- `registry/signatures.json`
- `registry/contracts/<network>.json`

Signatures that disappear from current sources are preserved automatically in
`registry/legacy-signatures.json`, because an old permission may still be live on-chain. Dynamic
access-check callsites that cannot be decoded statically are printed for manual review.

Review the reported additions and removals before committing regenerated registry files.

### Relabel existing snapshots

After rebuilding the registry, use `relabel` to apply newly discovered names and signatures to
existing snapshots without scanning the chain or changing snapshot heights:

```bash
yarn acm:relabel
yarn acm:relabel --network bscmainnet
```

On BNB Chain mainnet, this can decode previously unresolved role hashes. On every network, it refreshes
contract and grantee names and regenerates the human-readable report. It preserves the snapshot's
existing verification status because it makes no on-chain calls.

## Output files

Each `snapshots/<network>/` directory contains:

| File                    | Contents                                                                                                      |
| ----------------------- | ------------------------------------------------------------------------------------------------------------- |
| `permissions.json`      | Machine-readable source of truth: snapshot height, verification metadata, roles, grantees and resolved names. |
| `permissions.md`        | Human-readable view grouped by contract, including wildcard and unresolved roles when present.                |
| `unresolved-roles.json` | Undecoded BNB Chain mainnet roles and their grant transaction hashes. Omitted when none remain.               |

Do not edit generated snapshots, contract maps, or `signatures.json` by hand. Update them through the
commands above and use `git diff` as the change log. The source manifest and legacy registry files are
the exceptions: maintainers update those inputs manually when needed.

## Why BNB Chain mainnet is different

Modern ACM contracts emit the account, target contract and function signature directly in each event.
The legacy ACM on `bscmainnet` emits only a `bytes32` role hash.

To decode that hash, the tool builds candidate roles from every known contract address and function
signature. A role that still cannot be decoded is kept in the snapshot with its raw hash; it is never
silently dropped. After adding a missing address or signature, run `build-registry` and then `relabel`
to try decoding it again.

Legacy signatures deserve review, but they are not automatically stale permissions. A signature may
be there because its function was removed, or simply because its current source cannot be discovered
by the registry builder. Use the origin notes in `registry/legacy-signatures.json` to tell the cases
apart.

## Common workflows

Routine update:

```bash
yarn acm:fetch
git diff -- scripts/acm-permissions/snapshots
```

After adding or updating a pinned source:

```bash
yarn acm:build-registry
yarn acm:relabel
git diff -- scripts/acm-permissions/registry scripts/acm-permissions/snapshots
```

Investigate permissions unique to timelocks:

```bash
yarn acm:filter --network bscmainnet --grantees Timelocks --exclude Guardian
```

## Extending the tool

To add a network, update `NETWORKS` in `types.ts` and add its deployment block, RPC fallback and
guardian configuration in `config.ts`. Ensure its deployment address file contains
`AccessControlManager`, then rebuild the registry and fetch the new snapshot.

To add a source, add a pinned `local`, `npm`, or `git` entry to `registry/sources.json`, run
`yarn acm:build-registry`, review the diff, and run `yarn acm:relabel`. Historical BNB Chain contracts
that exist in no source repository can be recorded in `registry/legacy-contracts.json`.
