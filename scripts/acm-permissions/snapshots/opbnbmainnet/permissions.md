# ACM Permissions — opbnbmainnet

Snapshot block: 168209406 · Updated: 2026-07-27 · Contracts: 10 · Permissions: 89 · Verification: ✅ verified on-chain (as of 2026-07-27)

## BinanceOracle / BinanceOracle_Proxy (`0xB09EC9B628d04E1287216Aa3e2432291f50F9588`)

| Function | Grantees |
| --- | --- |
| `setMaxStalePeriod(string,uint256)` | FastTrackTimelock, Guardian, NormalTimelock |
| `setSymbolOverride(string,string)` | FastTrackTimelock, Guardian, NormalTimelock |

## BoundValidator / BoundValidator_Proxy (`0xd1f80C371C6E2Fa395A5574DB3E3b4dAf43dadCE`)

| Function | Grantees |
| --- | --- |
| `setValidateConfig(ValidateConfig)` | NormalTimelock |

## OmnichainExecutorOwner / OmnichainExecutorOwner_Proxy (`0xf7e4c81Cf4A03d52472a4d00c3d9Ef35aF127E45`)

| Function | Grantees |
| --- | --- |
| `addTimelocks(address[])` | FastTrackTimelock, Guardian, NormalTimelock |
| `forceResumeReceive(uint16,bytes)` | Guardian |
| `pause()` | FastTrackTimelock, Guardian, NormalTimelock |
| `retryMessage(uint16,bytes,uint64,bytes)` | FastTrackTimelock, Guardian, NormalTimelock |
| `setConfig(uint16,uint16,uint256,bytes)` | FastTrackTimelock, Guardian, NormalTimelock |
| `setGuardian(address)` | NormalTimelock |
| `setMaxDailyReceiveLimit(uint256)` | FastTrackTimelock, Guardian, NormalTimelock |
| `setMinDstGas(uint16,uint16,uint256)` | NormalTimelock |
| `setPayloadSizeLimit(uint16,uint256)` | NormalTimelock |
| `setPrecrime(address)` | NormalTimelock |
| `setReceiveVersion(uint16)` | FastTrackTimelock, Guardian, NormalTimelock |
| `setSendVersion(uint16)` | NormalTimelock |
| `setSrcChainId(uint16)` | Guardian, NormalTimelock |
| `setTimelockPendingAdmin(address,uint8)` | Guardian, NormalTimelock |
| `setTrustedRemoteAddress(uint16,bytes)` | Guardian, NormalTimelock |
| `transferBridgeOwnership(address)` | Guardian, NormalTimelock |
| `unpause()` | Guardian |

## PoolRegistry / PoolRegistry_Proxy (`0x345a030Ad22e2317ac52811AC41C1A63cfa13aEe`)

| Function | Grantees |
| --- | --- |
| `addMarket(AddMarketInput)` | NormalTimelock |
| `addPool(string,address,uint256,uint256,uint256)` | NormalTimelock |
| `setPoolName(address,string)` | NormalTimelock |
| `updatePoolMetadata(address,VenusPoolMetaData)` | NormalTimelock |

## ProtocolShareReserve / ProtocolShareReserve_Proxy (`0xA2EDD515B75aBD009161B15909C19959484B0C1e`)

| Function | Grantees |
| --- | --- |
| `addOrUpdateDistributionConfigs(DistributionConfig[])` | FastTrackTimelock, Guardian, NormalTimelock |
| `removeDistributionConfig(Schema,address)` | FastTrackTimelock, Guardian, NormalTimelock |

## ResilientOracle / ResilientOracle_Proxy (`0x8f3618c4F0183e14A218782c116fb2438571dAC9`)

| Function | Grantees |
| --- | --- |
| `enableOracle(address,uint8,bool)` | NormalTimelock |
| `pause()` | FastTrackTimelock, Guardian, NormalTimelock |
| `setOracle(address,address,uint8)` | NormalTimelock |
| `setTokenConfig(TokenConfig)` | FastTrackTimelock, Guardian, NormalTimelock |
| `unpause()` | FastTrackTimelock, Guardian, NormalTimelock |

## VenusERC4626Factory / VenusERC4626Factory_Proxy (`0x89A5Ce0A6db7e66E53F148B50D879b700dEB81C8`)

| Function | Grantees |
| --- | --- |
| `setRewardRecipient(address)` | NormalTimelock |

## XVS (`0x3E2e61F1c075881F3fB8dd568043d8c221fd5c61`)

| Function | Grantees |
| --- | --- |
| `burn(address,uint256)` | XVSProxyOFTDest |
| `migrateMinterTokens(address,address)` | FastTrackTimelock, Guardian, NormalTimelock |
| `mint(address,uint256)` | XVSProxyOFTDest |
| `pause()` | FastTrackTimelock, Guardian, NormalTimelock |
| `setMintCap(address,uint256)` | FastTrackTimelock, Guardian, NormalTimelock |
| `unpause()` | FastTrackTimelock, Guardian, NormalTimelock |
| `updateBlacklist(address,bool)` | FastTrackTimelock, Guardian, NormalTimelock |

## XVSBridgeAdmin / XVSBridgeAdmin_Proxy (`0x52fcE05aDbf6103d71ed2BA8Be7A317282731831`)

| Function | Grantees |
| --- | --- |
| `dropFailedMessage(uint16,bytes,uint64)` | FastTrackTimelock, NormalTimelock |
| `forceResumeReceive(uint16,bytes)` | FastTrackTimelock, NormalTimelock |
| `pause()` | FastTrackTimelock, Guardian, NormalTimelock |
| `removeTrustedRemote(uint16)` | FastTrackTimelock, NormalTimelock |
| `setConfig(uint16,uint16,uint256,bytes)` | FastTrackTimelock, NormalTimelock |
| `setMaxDailyLimit(uint16,uint256)` | FastTrackTimelock, Guardian, NormalTimelock |
| `setMaxDailyReceiveLimit(uint16,uint256)` | FastTrackTimelock, Guardian, NormalTimelock |
| `setMaxSingleReceiveTransactionLimit(uint16,uint256)` | FastTrackTimelock, Guardian, NormalTimelock |
| `setMaxSingleTransactionLimit(uint16,uint256)` | FastTrackTimelock, Guardian, NormalTimelock |
| `setMinDstGas(uint16,uint16,uint256)` | FastTrackTimelock, NormalTimelock |
| `setOracle(address)` | NormalTimelock |
| `setPayloadSizeLimit(uint16,uint256)` | FastTrackTimelock, NormalTimelock |
| `setPrecrime(address)` | NormalTimelock |
| `setReceiveVersion(uint16)` | FastTrackTimelock, NormalTimelock |
| `setSendVersion(uint16)` | FastTrackTimelock, NormalTimelock |
| `setTrustedRemoteAddress(uint16,bytes)` | NormalTimelock |
| `setWhitelist(address,bool)` | FastTrackTimelock, NormalTimelock |
| `sweepToken(address,address,uint256)` | NormalTimelock |
| `transferBridgeOwnership(address)` | NormalTimelock |
| `unpause()` | FastTrackTimelock, Guardian, NormalTimelock |
| `updateSendAndCallEnabled(bool)` | FastTrackTimelock, NormalTimelock |

## XVSVaultProxy (`0x7dc969122450749A8B0777c0e324522d67737988`)

| Function | Grantees |
| --- | --- |
| `add(address,uint256,address,uint256,uint256)` | NormalTimelock |
| `pause()` | FastTrackTimelock, Guardian, NormalTimelock |
| `resume()` | FastTrackTimelock, Guardian, NormalTimelock |
| `set(address,uint256,uint256)` | NormalTimelock |
| `setBlocksPerYear(uint256)` | NormalTimelock |
| `setRewardAmountPerBlockOrSecond(address,uint256)` | FastTrackTimelock, NormalTimelock |
| `setWithdrawalLockingPeriod(address,uint256,uint256)` | NormalTimelock |

## 🃏 Wildcard permissions

| Function | Grantees |
| --- | --- |
| `setActionsPaused(address[],uint256[],bool)` | FastTrackTimelock, Guardian, NormalTimelock |
| `setCloseFactor(uint256)` | NormalTimelock, PoolRegistry / PoolRegistry_Proxy |
| `setCollateralFactor(address,uint256,uint256)` | FastTrackTimelock, Guardian, NormalTimelock, PoolRegistry / PoolRegistry_Proxy |
| `setForcedLiquidation(address,bool)` | FastTrackTimelock, NormalTimelock |
| `setGrowthRate(uint256,uint256)` | FastTrackTimelock, NormalTimelock |
| `setInterestRateModel(address)` | FastTrackTimelock, NormalTimelock |
| `setLastRewardingBlocks(address[],uint32[],uint32[])` | Guardian |
| `setLiquidationIncentive(uint256)` | NormalTimelock, PoolRegistry / PoolRegistry_Proxy |
| `setMarketBorrowCaps(address[],uint256[])` | FastTrackTimelock, Guardian, NormalTimelock, PoolRegistry / PoolRegistry_Proxy |
| `setMarketSupplyCaps(address[],uint256[])` | FastTrackTimelock, Guardian, NormalTimelock, PoolRegistry / PoolRegistry_Proxy |
| `setMaxLoopsLimit(uint256)` | NormalTimelock |
| `setMinLiquidatableCollateral(uint256)` | NormalTimelock, PoolRegistry / PoolRegistry_Proxy |
| `setProtocolSeizeShare(uint256)` | NormalTimelock |
| `setReduceReservesBlockDelta(uint256)` | FastTrackTimelock, NormalTimelock |
| `setReserveFactor(uint256)` | FastTrackTimelock, NormalTimelock |
| `setRewardRecipient(address)` | NormalTimelock |
| `setSnapshot(uint256,uint256)` | FastTrackTimelock, NormalTimelock |
| `setSnapshotGap(uint256)` | FastTrackTimelock, NormalTimelock |
| `supportMarket(address)` | PoolRegistry / PoolRegistry_Proxy |
| `syncCash()` | NormalTimelock |
| `unlistMarket(address)` | FastTrackTimelock, Guardian, NormalTimelock |
| `updateJumpRateModel(uint256,uint256,uint256,uint256)` | NormalTimelock |
