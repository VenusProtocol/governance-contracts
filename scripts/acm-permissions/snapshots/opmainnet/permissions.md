# ACM Permissions — opmainnet

Snapshot block: 154785253 · Updated: 2026-07-27 · Contracts: 13 · Permissions: 105 · Verification: ✅ verified on-chain (as of 2026-07-27)

## BoundValidator / BoundValidator_Proxy (`0x37A04a1eF784448377a19F2b1b67cD40c09eA505`)

| Function | Grantees |
| --- | --- |
| `setValidateConfig(ValidateConfig)` | NormalTimelock |

## OmnichainExecutorOwner / OmnichainExecutorOwner_Proxy (`0xe6d9Eb3A07a1dc4496fc71417D7A7b9d5666BaA3`)

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

## PoolRegistry / PoolRegistry_Proxy (`0x147780799840d541C1d7c998F0cbA996d11D62bb`)

| Function | Grantees |
| --- | --- |
| `addMarket(AddMarketInput)` | NormalTimelock |
| `addPool(string,address,uint256,uint256,uint256)` | NormalTimelock |
| `setPoolName(address,string)` | NormalTimelock |
| `updatePoolMetadata(address,VenusPoolMetaData)` | NormalTimelock |

## Prime / Prime_Proxy (`0xE76d2173546Be97Fa6E18358027BdE9742a649f7`)

| Function | Grantees |
| --- | --- |
| `addMarket(address,address,uint256,uint256)` | FastTrackTimelock, NormalTimelock |
| `burn(address)` | FastTrackTimelock, NormalTimelock |
| `issue(bool,address[])` | FastTrackTimelock, NormalTimelock |
| `setLimit(uint256,uint256)` | FastTrackTimelock, NormalTimelock |
| `setMaxLoopsLimit(uint256)` | FastTrackTimelock |
| `setStakedAt(address[],uint256[])` | FastTrackTimelock, NormalTimelock |
| `togglePause()` | FastTrackTimelock, Guardian, NormalTimelock |
| `updateAlpha(uint128,uint128)` | FastTrackTimelock, NormalTimelock |
| `updateMultipliers(address,uint256,uint256)` | FastTrackTimelock, NormalTimelock |

## PrimeLiquidityProvider / PrimeLiquidityProvider_Proxy (`0x6412f6cd58D0182aE150b90B5A99e285b91C1a12`)

| Function | Grantees |
| --- | --- |
| `pauseFundsTransfer()` | FastTrackTimelock, Guardian, NormalTimelock |
| `resumeFundsTransfer()` | FastTrackTimelock, Guardian, NormalTimelock |
| `setMaxLoopsLimit(uint256)` | FastTrackTimelock |
| `setMaxTokensDistributionSpeed(address[],uint256[])` | FastTrackTimelock, NormalTimelock |
| `setTokensDistributionSpeed(address[],uint256[])` | FastTrackTimelock, NormalTimelock |

## ProtocolShareReserve / ProtocolShareReserve_Proxy (`0x735ed037cB0dAcf90B133370C33C08764f88140a`)

| Function | Grantees |
| --- | --- |
| `addOrUpdateDistributionConfigs(DistributionConfig[])` | FastTrackTimelock, Guardian, NormalTimelock |
| `removeDistributionConfig(Schema,address)` | FastTrackTimelock, Guardian, NormalTimelock |

## RedStoneOracle / RedStoneOracle_Proxy (`0x7478e4656F6CCDCa147B6A7314fF68d0C144751a`)

| Function | Grantees |
| --- | --- |
| `setDirectPrice(address,uint256)` | FastTrackTimelock, Guardian, NormalTimelock |
| `setTokenConfig(TokenConfig)` | FastTrackTimelock, Guardian, NormalTimelock |

## ResilientOracle / ResilientOracle_Proxy (`0x21FC48569bd3a6623281f55FC1F8B48B9386907b`)

| Function | Grantees |
| --- | --- |
| `enableOracle(address,uint8,bool)` | NormalTimelock |
| `pause()` | FastTrackTimelock, Guardian, NormalTimelock |
| `setOracle(address,address,uint8)` | NormalTimelock |
| `setTokenConfig(TokenConfig)` | FastTrackTimelock, Guardian, NormalTimelock |
| `unpause()` | FastTrackTimelock, Guardian, NormalTimelock |

## SequencerChainlinkOracle / SequencerChainlinkOracle_Proxy (`0x1076e5A60F1aC98e6f361813138275F1179BEb52`)

| Function | Grantees |
| --- | --- |
| `setDirectPrice(address,uint256)` | FastTrackTimelock, Guardian, NormalTimelock |
| `setTokenConfig(TokenConfig)` | FastTrackTimelock, Guardian, NormalTimelock |

## VenusERC4626Factory / VenusERC4626Factory_Proxy (`0xc801B471F00Dc22B9a7d7b839CBE87E46d70946F`)

| Function | Grantees |
| --- | --- |
| `setRewardRecipient(address)` | NormalTimelock |

## XVS (`0x4a971e87ad1F61f7f3081645f52a99277AE917cF`)

| Function | Grantees |
| --- | --- |
| `burn(address,uint256)` | XVSProxyOFTDest |
| `migrateMinterTokens(address,address)` | FastTrackTimelock, Guardian, NormalTimelock |
| `mint(address,uint256)` | XVSProxyOFTDest |
| `pause()` | FastTrackTimelock, Guardian, NormalTimelock |
| `setMintCap(address,uint256)` | FastTrackTimelock, Guardian, NormalTimelock |
| `unpause()` | FastTrackTimelock, Guardian, NormalTimelock |
| `updateBlacklist(address,bool)` | FastTrackTimelock, Guardian, NormalTimelock |

## XVSBridgeAdmin / XVSBridgeAdmin_Proxy (`0x3c307DF1Bf3198a2417d9CA86806B307D147Ddf7`)

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

## XVSVaultProxy (`0x133120607C018c949E91AE333785519F6d947e01`)

| Function | Grantees |
| --- | --- |
| `add(address,uint256,address,uint256,uint256)` | NormalTimelock |
| `pause()` | FastTrackTimelock, Guardian, NormalTimelock |
| `resume()` | FastTrackTimelock, Guardian, NormalTimelock |
| `set(address,uint256,uint256)` | NormalTimelock |
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
| `setLastRewardingBlockTimestamps(address[],uint256[],uint256[])` | NormalTimelock |
| `setLiquidationIncentive(uint256)` | NormalTimelock, PoolRegistry / PoolRegistry_Proxy |
| `setMarketBorrowCaps(address[],uint256[])` | FastTrackTimelock, Guardian, NormalTimelock, PoolRegistry / PoolRegistry_Proxy |
| `setMarketSupplyCaps(address[],uint256[])` | FastTrackTimelock, Guardian, NormalTimelock, PoolRegistry / PoolRegistry_Proxy |
| `setMaxLoopsLimit(uint256)` | NormalTimelock |
| `setMinLiquidatableCollateral(uint256)` | NormalTimelock, PoolRegistry / PoolRegistry_Proxy |
| `setProtocolSeizeShare(uint256)` | NormalTimelock |
| `setReduceReservesBlockDelta(uint256)` | FastTrackTimelock, NormalTimelock |
| `setReserveFactor(uint256)` | FastTrackTimelock, NormalTimelock |
| `setRewardRecipient(address)` | NormalTimelock |
| `setRewardTokenSpeeds(address[],uint256[],uint256[])` | NormalTimelock |
| `setSnapshot(uint256,uint256)` | FastTrackTimelock, NormalTimelock |
| `setSnapshotGap(uint256)` | FastTrackTimelock, NormalTimelock |
| `supportMarket(address)` | PoolRegistry / PoolRegistry_Proxy |
| `syncCash()` | NormalTimelock |
| `unlistMarket(address)` | FastTrackTimelock, NormalTimelock |
| `updateJumpRateModel(uint256,uint256,uint256,uint256)` | NormalTimelock |
