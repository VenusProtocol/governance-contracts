# Foundry

Foundry runs alongside Hardhat here, it does not replace it. `contracts/` is shared; the TypeScript
suite in `tests/` is untouched.

`yarn test`, `yarn compile` and `yarn clean` run Hardhat first and then Foundry. `yarn build` is
Hardhat-only: it produces the published package. To work on the Foundry suite alone:

```
forge test                      256 fuzz runs
FOUNDRY_PROFILE=ci forge test   the 2000 runs CI uses
```

## What belongs where

Hardhat keeps the TypeScript tests, deployments (`deploy/`, `deployments/`, which the other Venus
repos consume), the zkSync build, docgen and coverage. Write a Foundry test only when Hardhat cannot
express it: in-EVM fuzzing, stateful invariants, cheatcode-driven fork tests. A plain unit test
belongs in `tests/` next to its siblings, and existing tests are not being ported.

Tests are named after the contract under test. Once a contract needs more than one file, move them
into a directory named after it.

## The 0.5.16 boundary

`contracts/` spans 0.5.16 and 0.8.25, so `auto_detect_solc` is on and `forge build` covers both.
A `0.8.25` test cannot import a `0.5.16` contract, though, so GovernorBravo, the 0.5.16 Timelock,
`AccessControlledV5` and everything under `contracts/legacy` stay with Hardhat. A fork test can still
call them through an interface.

## Traps

- `vm.prank` applies to **the next call made**, not the next line. In
  `acm.hasRole(acm.DEFAULT_ADMIN_ROLE(), account)` the prank is spent on `DEFAULT_ADMIN_ROLE()`.
  Read values into locals first.
- A failing fuzz input is persisted under `cache-foundry/` and replayed first. After changing an
  assertion, delete that directory or the old counterexample keeps failing.
- `out = 'out'` in `foundry.toml` is not redundant. With Hardhat's `artifacts/` present, Foundry
  writes its artifacts there instead.

## Dependencies

Solidity dependencies come from npm: Foundry derives remappings from `node_modules`, so run `yarn`
before `forge`. `forge-std` is the exception, a git submodule at `lib/forge-std`, because its npm
package is an abandoned fork. Clone with `--recurse-submodules`, or run
`git submodule update --init --recursive`.

`remappings.txt` holds only the `forge-std` line, for Solidity language servers, which do not read
`foundry.toml`. The `node_modules` remappings are still derived on top of it.

## Formatting

Prettier formats all Solidity, `tests/foundry` included. `forge fmt` is not configured, so the two
never fight over the same files.
