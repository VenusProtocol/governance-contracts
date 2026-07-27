# ACM Permissions — ethereum

Snapshot block: 25625304 · Updated: 2026-07-27 · Contracts: 28 · Permissions: 148 · Verification: ✅ verified on-chain (as of 2026-07-27)

## AuxiliaryCommandsAggregator / AuxiliaryCommandsAggregator_Proxy (`0xc79Cb7efEBd121DC4B39eA141C214606595D665A`)

| Function | Grantees |
| --- | --- |
| `addAuthorizedBatchers(address[])` | FastTrackTimelock, NormalTimelock |
| `executeBatch(uint256)` | FastTrackTimelock, NormalTimelock |
| `removeAuthorizedBatchers(address[])` | FastTrackTimelock, NormalTimelock |

## BoundValidator / BoundValidator_Proxy (`0x1Cd5f336A1d28Dff445619CC63d3A0329B4d8a58`)

| Function | Grantees |
| --- | --- |
| `setValidateConfig(ValidateConfig)` | NormalTimelock |

## ChainlinkOracle / ChainlinkOracle_Proxy (`0x94c3A2d6B7B2c051aDa041282aec5B0752F8A1F2`)

| Function | Grantees |
| --- | --- |
| `setDirectPrice(address,uint256)` | FastTrackTimelock, Guardian, NormalTimelock |
| `setTokenConfig(TokenConfig)` | FastTrackTimelock, Guardian, NormalTimelock |

## Comptroller_Core (`0x687a01ecF6d3907658f7A7c714749fAC32336D1B`)

| Function | Grantees |
| --- | --- |
| `setActionsPaused(address[],uint256[],bool)` | EBrake / EBrake_Proxy |
| `setCollateralFactor(address,uint256,uint256)` | EBrake / EBrake_Proxy |
| `setMarketBorrowCaps(address[],uint256[])` | EBrake / EBrake_Proxy |
| `setMarketSupplyCaps(address[],uint256[])` | EBrake / EBrake_Proxy |

## ConverterNetwork / ConverterNetwork_Proxy (`0x232CC47AECCC55C2CAcE4372f5B268b27ef7cac8`)

| Function | Grantees |
| --- | --- |
| `addTokenConverter(address)` | FastTrackTimelock, NormalTimelock |
| `removeTokenConverter(address)` | FastTrackTimelock, NormalTimelock |

## CurveOracle / CurveOracle_Proxy (`0x9F508F3146cb03276282f9237c6eE64f76E3261D`)

| Function | Grantees |
| --- | --- |
| `setPoolConfig(address,address,uint8,uint8,address,uint8)` | FastTrackTimelock, Guardian, NormalTimelock |

## DeviationSentinel / DeviationSentinel_Proxy (`0x7D0EFA41eBF1aF242A37174E1E047bD6ea1b1B9c`)

| Function | Grantees |
| --- | --- |
| `setTokenConfig(address,(uint8,bool))` | FastTrackTimelock, Guardian, NormalTimelock |
| `setTokenMonitoringEnabled(address,bool)` | FastTrackTimelock, Guardian, NormalTimelock |
| `setTrustedKeeper(address,bool)` | FastTrackTimelock, Guardian, NormalTimelock |

## EBrake / EBrake_Proxy (`0xCD09042c5DFFed762998Df9a058ec5944e39949B`)

| Function | Grantees |
| --- | --- |
| `decreaseCF(address,uint256)` | 0xCCa5a587eBDBe80f23c8610F2e53B03158e62948, DeviationSentinel / DeviationSentinel_Proxy, FastTrackTimelock, Guardian, NormalTimelock |
| `pauseActions(address[],uint8[])` | 0xCCa5a587eBDBe80f23c8610F2e53B03158e62948, FastTrackTimelock, Guardian, NormalTimelock |
| `pauseBorrow(address)` | 0xCCa5a587eBDBe80f23c8610F2e53B03158e62948, DeviationSentinel / DeviationSentinel_Proxy, FastTrackTimelock, Guardian, NormalTimelock |
| `pauseRedeem(address)` | 0xCCa5a587eBDBe80f23c8610F2e53B03158e62948, FastTrackTimelock, Guardian, NormalTimelock |
| `pauseSupply(address)` | 0xCCa5a587eBDBe80f23c8610F2e53B03158e62948, DeviationSentinel / DeviationSentinel_Proxy, FastTrackTimelock, Guardian, NormalTimelock |
| `pauseTransfer(address)` | 0xCCa5a587eBDBe80f23c8610F2e53B03158e62948, FastTrackTimelock, Guardian, NormalTimelock |
| `resetBorrowCapSnapshot(address)` | FastTrackTimelock, Guardian, NormalTimelock |
| `resetCFSnapshot(address)` | FastTrackTimelock, Guardian, NormalTimelock |
| `resetSupplyCapSnapshot(address)` | FastTrackTimelock, Guardian, NormalTimelock |
| `setMarketBorrowCaps(address[],uint256[])` | 0xCCa5a587eBDBe80f23c8610F2e53B03158e62948, FastTrackTimelock, Guardian, NormalTimelock |
| `setMarketSupplyCaps(address[],uint256[])` | 0xCCa5a587eBDBe80f23c8610F2e53B03158e62948, FastTrackTimelock, Guardian, NormalTimelock |

## OmnichainExecutorOwner / OmnichainExecutorOwner_Proxy (`0x87Ed3Fd3a25d157637b955991fb1B41B566916Ba`)

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

## PoolRegistry / PoolRegistry_Proxy (`0x61CAff113CCaf05FFc6540302c37adcf077C5179`)

| Function | Grantees |
| --- | --- |
| `addMarket(AddMarketInput)` | NormalTimelock |
| `addPool(string,address,uint256,uint256,uint256)` | NormalTimelock |
| `setPoolName(address,string)` | NormalTimelock |
| `updatePoolMetadata(address,VenusPoolMetaData)` | NormalTimelock |

## Prime / Prime_Proxy (`0x14C4525f47A7f7C984474979c57a2Dccb8EACB39`)

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

## PrimeLiquidityProvider / PrimeLiquidityProvider_Proxy (`0x8ba6aFfd0e7Bcd0028D1639225C84DdCf53D8872`)

| Function | Grantees |
| --- | --- |
| `pauseFundsTransfer()` | FastTrackTimelock, Guardian, NormalTimelock |
| `resumeFundsTransfer()` | FastTrackTimelock, Guardian, NormalTimelock |
| `setMaxLoopsLimit(uint256)` | FastTrackTimelock |
| `setMaxTokensDistributionSpeed(address[],uint256[])` | FastTrackTimelock, NormalTimelock |
| `setTokensDistributionSpeed(address[],uint256[])` | FastTrackTimelock, NormalTimelock |

## ProtocolShareReserve / ProtocolShareReserve_Proxy (`0x8c8c8530464f7D95552A11eC31Adbd4dC4AC4d3E`)

| Function | Grantees |
| --- | --- |
| `addOrUpdateDistributionConfigs(DistributionConfig[])` | FastTrackTimelock, Guardian, NormalTimelock |
| `removeDistributionConfig(Schema,address)` | FastTrackTimelock, Guardian, NormalTimelock |

## RedStoneOracle / RedStoneOracle_Proxy (`0x0FC8001B2c9Ec90352A46093130e284de5889C86`)

| Function | Grantees |
| --- | --- |
| `setDirectPrice(address,uint256)` | FastTrackTimelock, Guardian, NormalTimelock |
| `setTokenConfig(TokenConfig)` | FastTrackTimelock, Guardian, NormalTimelock |

## ResilientOracle / ResilientOracle_Proxy (`0xd2ce3fb018805ef92b8C5976cb31F84b4E295F94`)

| Function | Grantees |
| --- | --- |
| `enableOracle(address,uint8,bool)` | NormalTimelock |
| `pause()` | FastTrackTimelock, Guardian, NormalTimelock |
| `setOracle(address,address,uint8)` | NormalTimelock |
| `setTokenConfig(TokenConfig)` | FastTrackTimelock, Guardian, NormalTimelock |
| `unpause()` | FastTrackTimelock, Guardian, NormalTimelock |

## SentinelOracle / SentinelOracle_Proxy (`0x444C53E194B40c272fAd683210e2cB1c16Ab132e`)

| Function | Grantees |
| --- | --- |
| `setDirectPrice(address,uint256)` | FastTrackTimelock, Guardian, NormalTimelock |
| `setTokenOracleConfig(address,address)` | FastTrackTimelock, Guardian, NormalTimelock |

## SFrxETHOracle / SFrxETHOracle_Proxy (`0x5E06A5f48692E4Fff376fDfCA9E4C0183AAADCD1`)

| Function | Grantees |
| --- | --- |
| `setMaxAllowedPriceDifference(uint256)` | FastTrackTimelock, NormalTimelock |

## UniswapOracle / UniswapOracle_Proxy (`0x873993F8f5f5Ddbae0952e939ab3005Af363Af00`)

| Function | Grantees |
| --- | --- |
| `setPoolConfig(address,address)` | FastTrackTimelock, Guardian, NormalTimelock |

## USDCPrimeConverter (`0xcEB9503f10B781E30213c0b320bCf3b3cE54216E`)

| Function | Grantees |
| --- | --- |
| `pauseConversion()` | Guardian |
| `resumeConversion()` | Guardian |

## USDTPrimeConverter (`0x4f55cb0a24D5542a3478B0E284259A6B850B06BD`)

| Function | Grantees |
| --- | --- |
| `pauseConversion()` | Guardian |
| `resumeConversion()` | Guardian |

## VenusERC4626Factory / VenusERC4626Factory_Proxy (`0x39cb747453Be3416E659dAeA169540b6F000c885`)

| Function | Grantees |
| --- | --- |
| `setRewardRecipient(address)` | NormalTimelock |

## WBTCPrimeConverter (`0xDcCDE673Cd8988745dA384A7083B0bd22085dEA0`)

| Function | Grantees |
| --- | --- |
| `pauseConversion()` | Guardian |
| `resumeConversion()` | Guardian |

## WETHPrimeConverter (`0xb8fD67f215117FADeF06447Af31590309750529D`)

| Function | Grantees |
| --- | --- |
| `pauseConversion()` | Guardian |
| `resumeConversion()` | Guardian |

## XVS (`0xd3CC9d8f3689B83c91b7B59cAB4946B063EB894A`)

| Function | Grantees |
| --- | --- |
| `burn(address,uint256)` | XVSProxyOFTDest |
| `migrateMinterTokens(address,address)` | FastTrackTimelock, Guardian, NormalTimelock |
| `mint(address,uint256)` | XVSProxyOFTDest |
| `pause()` | FastTrackTimelock, Guardian, NormalTimelock |
| `setMintCap(address,uint256)` | FastTrackTimelock, Guardian, NormalTimelock |
| `unpause()` | FastTrackTimelock, Guardian, NormalTimelock |
| `updateBlacklist(address,bool)` | FastTrackTimelock, Guardian, NormalTimelock |

## XVSBridgeAdmin / XVSBridgeAdmin_Proxy (`0x9C6C95632A8FB3A74f2fB4B7FfC50B003c992b96`)

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

## XVSVaultConverter (`0x1FD30e761C3296fE36D9067b1e398FD97B4C0407`)

| Function | Grantees |
| --- | --- |
| `pauseConversion()` | Guardian |
| `resumeConversion()` | Guardian |

## XVSVaultProxy (`0xA0882C2D5DF29233A092d2887A258C2b90e9b994`)

| Function | Grantees |
| --- | --- |
| `add(address,uint256,address,uint256,uint256)` | NormalTimelock |
| `pause()` | FastTrackTimelock, Guardian, NormalTimelock |
| `resume()` | FastTrackTimelock, Guardian, NormalTimelock |
| `set(address,uint256,uint256)` | NormalTimelock |
| `setRewardAmountPerBlockOrSecond(address,uint256)` | FastTrackTimelock, NormalTimelock |
| `setWithdrawalLockingPeriod(address,uint256,uint256)` | NormalTimelock |

## XVSVaultTreasury / XVSVaultTreasury_Proxy (`0xaE39C38AF957338b3cEE2b3E5d825ea88df02EfE`)

| Function | Grantees |
| --- | --- |
| `fundXVSVault(uint256)` | FastTrackTimelock, NormalTimelock |

## 🃏 Wildcard permissions

| Function | Grantees |
| --- | --- |
| `pauseConversion()` | FastTrackTimelock, NormalTimelock |
| `resumeConversion()` | FastTrackTimelock, NormalTimelock |
| `setActionsPaused(address[],uint256[],bool)` | FastTrackTimelock, Guardian, NormalTimelock |
| `setCloseFactor(uint256)` | NormalTimelock, PoolRegistry / PoolRegistry_Proxy |
| `setCollateralFactor(address,uint256,uint256)` | FastTrackTimelock, Guardian, NormalTimelock, PoolRegistry / PoolRegistry_Proxy |
| `setConversionConfig(address,address,ConversionConfig)` | FastTrackTimelock, NormalTimelock |
| `setForcedLiquidation(address,bool)` | FastTrackTimelock, NormalTimelock |
| `setGrowthRate(uint256,uint256)` | FastTrackTimelock, NormalTimelock |
| `setInterestRateModel(address)` | FastTrackTimelock, NormalTimelock |
| `setLastRewardingBlocks(address[],uint32[],uint32[])` | NormalTimelock |
| `setLiquidationIncentive(uint256)` | NormalTimelock, PoolRegistry / PoolRegistry_Proxy |
| `setMarketBorrowCaps(address[],uint256[])` | FastTrackTimelock, Guardian, NormalTimelock, PoolRegistry / PoolRegistry_Proxy |
| `setMarketSupplyCaps(address[],uint256[])` | FastTrackTimelock, Guardian, NormalTimelock, PoolRegistry / PoolRegistry_Proxy |
| `setMaxLoopsLimit(uint256)` | NormalTimelock |
| `setMinAmountToConvert(uint256)` | FastTrackTimelock, NormalTimelock |
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
| `unlistMarket(address)` | FastTrackTimelock, Guardian, NormalTimelock |
| `updateJumpRateModel(uint256,uint256,uint256,uint256)` | NormalTimelock |
