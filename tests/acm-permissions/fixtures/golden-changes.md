# Changes — bscmainnet (run 2026-07-10, blocks 66323915 → 68100000)

## Added (1)

- Unitroller `_setActionsPaused(bool[],bool)` → FastTrackTimelock

## Removed (1)

- VAIController `setBaseRate(uint256)` ⇸ Guardian 2

## Corrections (on-chain authoritative)

- Unitroller `_setLiquidationIncentive(uint256)` → Guardian 3 — replay said **removed**, chain says **granted**; snapshot reverted to chain.
