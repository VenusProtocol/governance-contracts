# ACM Permissions — arbitrumone

Snapshot block: 488311020 · Updated: 2026-07-27 · Contracts: 26 · Permissions: 152 · Verification: ✅ verified on-chain (as of 2026-07-27)

## AuxiliaryCommandsAggregator / AuxiliaryCommandsAggregator_Proxy (`0x768FEf3a88ea92cCF9CAcDf0aB15C4B29B3C1379`)

| Function | Grantees |
| --- | --- |
| `addAuthorizedBatchers(address[])` | FastTrackTimelock, NormalTimelock |
| `executeBatch(uint256)` | FastTrackTimelock, NormalTimelock |
| `removeAuthorizedBatchers(address[])` | FastTrackTimelock, NormalTimelock |

## BoundValidator / BoundValidator_Proxy (`0x2245FA2420925Cd3C2D889Ddc5bA1aefEF0E14CF`)

| Function | Grantees |
| --- | --- |
| `setValidateConfig(ValidateConfig)` | NormalTimelock |

## Comptroller_Core (`0x317c1A5739F39046E20b08ac9BeEa3f10fD43326`)

| Function | Grantees |
| --- | --- |
| `setActionsPaused(address[],uint256[],bool)` | EBrake / EBrake_Proxy |
| `setCollateralFactor(address,uint256,uint256)` | EBrake / EBrake_Proxy |
| `setMarketBorrowCaps(address[],uint256[])` | EBrake / EBrake_Proxy |
| `setMarketSupplyCaps(address[],uint256[])` | EBrake / EBrake_Proxy |

## ConverterNetwork / ConverterNetwork_Proxy (`0x2F6672C9A0988748b0172D97961BecfD9DC6D6d5`)

| Function | Grantees |
| --- | --- |
| `addTokenConverter(address)` | FastTrackTimelock, NormalTimelock |
| `removeTokenConverter(address)` | FastTrackTimelock, NormalTimelock |

## DeviationSentinel / DeviationSentinel_Proxy (`0xb4CC54B33d34fD809E8fBD83A066158591ED7Fba`)

| Function | Grantees |
| --- | --- |
| `setTokenConfig(address,(uint8,bool))` | FastTrackTimelock, Guardian, NormalTimelock |
| `setTokenMonitoringEnabled(address,bool)` | FastTrackTimelock, Guardian, NormalTimelock |
| `setTrustedKeeper(address,bool)` | FastTrackTimelock, Guardian, NormalTimelock |

## EBrake / EBrake_Proxy (`0xFc4CE7Ca9BB5119705Cfb84d6e4476e8a4032b26`)

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

## OmnichainExecutorOwner / OmnichainExecutorOwner_Proxy (`0xf72C1Aa0A1227B4bCcB28E1B1015F0616E2db7fD`)

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

## PoolRegistry / PoolRegistry_Proxy (`0x382238f07Bc4Fe4aA99e561adE8A4164b5f815DA`)

| Function | Grantees |
| --- | --- |
| `addMarket(AddMarketInput)` | NormalTimelock |
| `addPool(string,address,uint256,uint256,uint256)` | NormalTimelock |
| `setPoolName(address,string)` | NormalTimelock |
| `updatePoolMetadata(address,VenusPoolMetaData)` | NormalTimelock |

## Prime / Prime_Proxy (`0xFE69720424C954A2da05648a0FAC84f9bf11Ef49`)

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

## PrimeLiquidityProvider / PrimeLiquidityProvider_Proxy (`0x86bf21dB200f29F21253080942Be8af61046Ec29`)

| Function | Grantees |
| --- | --- |
| `pauseFundsTransfer()` | FastTrackTimelock, Guardian, NormalTimelock |
| `resumeFundsTransfer()` | FastTrackTimelock, Guardian, NormalTimelock |
| `setMaxLoopsLimit(uint256)` | FastTrackTimelock |
| `setMaxTokensDistributionSpeed(address[],uint256[])` | FastTrackTimelock, NormalTimelock |
| `setTokensDistributionSpeed(address[],uint256[])` | FastTrackTimelock, NormalTimelock |

## ProtocolShareReserve / ProtocolShareReserve_Proxy (`0xF9263eaF7eB50815194f26aCcAB6765820B13D41`)

| Function | Grantees |
| --- | --- |
| `addOrUpdateDistributionConfigs(DistributionConfig[])` | FastTrackTimelock, Guardian, NormalTimelock |
| `removeDistributionConfig(Schema,address)` | FastTrackTimelock, Guardian, NormalTimelock |

## RedStoneOracle / RedStoneOracle_Proxy (`0xF792C4D3BdeF534D6d1dcC305056D00C95453dD6`)

| Function | Grantees |
| --- | --- |
| `setDirectPrice(address,uint256)` | FastTrackTimelock, Guardian, NormalTimelock |
| `setTokenConfig(TokenConfig)` | FastTrackTimelock, Guardian, NormalTimelock |

## ResilientOracle / ResilientOracle_Proxy (`0xd55A98150e0F9f5e3F6280FC25617A5C93d96007`)

| Function | Grantees |
| --- | --- |
| `enableOracle(address,uint8,bool)` | NormalTimelock |
| `pause()` | FastTrackTimelock, Guardian, NormalTimelock |
| `setOracle(address,address,uint8)` | NormalTimelock |
| `setTokenConfig(TokenConfig)` | FastTrackTimelock, Guardian, NormalTimelock |
| `unpause()` | FastTrackTimelock, Guardian, NormalTimelock |

## SentinelOracle / SentinelOracle_Proxy (`0x3563CAbc541a0432C66A64942ffB4070a9726226`)

| Function | Grantees |
| --- | --- |
| `setDirectPrice(address,uint256)` | FastTrackTimelock, Guardian, NormalTimelock |
| `setTokenOracleConfig(address,address)` | FastTrackTimelock, Guardian, NormalTimelock |

## SequencerChainlinkOracle / SequencerChainlinkOracle_Proxy (`0x9cd9Fcc7E3dEDA360de7c080590AaD377ac9F113`)

| Function | Grantees |
| --- | --- |
| `setDirectPrice(address,uint256)` | FastTrackTimelock, Guardian, NormalTimelock |
| `setTokenConfig(TokenConfig)` | FastTrackTimelock, Guardian, NormalTimelock |

## UniswapOracle / UniswapOracle_Proxy (`0xB6CFbfe6834EF519f002DBc1a8B81Ea437Ca647D`)

| Function | Grantees |
| --- | --- |
| `setPoolConfig(address,address)` | FastTrackTimelock, Guardian, NormalTimelock |

## USDCPrimeConverter (`0x6553C9f9E131191d4fECb6F0E73bE13E229065C6`)

| Function | Grantees |
| --- | --- |
| `pauseConversion()` | FastTrackTimelock, Guardian, NormalTimelock |
| `resumeConversion()` | FastTrackTimelock, Guardian, NormalTimelock |
| `setConversionConfig(address,address,ConversionConfig)` | FastTrackTimelock, NormalTimelock |
| `setMinAmountToConvert(uint256)` | FastTrackTimelock, NormalTimelock |

## USDTPrimeConverter (`0x435Fac1B002d5D31f374E07c0177A1D709d5DC2D`)

| Function | Grantees |
| --- | --- |
| `pauseConversion()` | FastTrackTimelock, Guardian, NormalTimelock |
| `resumeConversion()` | FastTrackTimelock, Guardian, NormalTimelock |
| `setConversionConfig(address,address,ConversionConfig)` | FastTrackTimelock, NormalTimelock |
| `setMinAmountToConvert(uint256)` | FastTrackTimelock, NormalTimelock |

## VenusERC4626Factory / VenusERC4626Factory_Proxy (`0xC1422B928cb6FC9BA52880892078578a93aa5Cc7`)

| Function | Grantees |
| --- | --- |
| `setRewardRecipient(address)` | NormalTimelock |

## WBTCPrimeConverter (`0xF91369009c37f029aa28AF89709a352375E5A162`)

| Function | Grantees |
| --- | --- |
| `pauseConversion()` | FastTrackTimelock, Guardian, NormalTimelock |
| `resumeConversion()` | FastTrackTimelock, Guardian, NormalTimelock |
| `setConversionConfig(address,address,ConversionConfig)` | FastTrackTimelock, NormalTimelock |
| `setMinAmountToConvert(uint256)` | FastTrackTimelock, NormalTimelock |

## WETHPrimeConverter (`0x4aCB90ddD6df24dC6b0D50df84C94e72012026d0`)

| Function | Grantees |
| --- | --- |
| `pauseConversion()` | FastTrackTimelock, Guardian, NormalTimelock |
| `resumeConversion()` | FastTrackTimelock, Guardian, NormalTimelock |
| `setConversionConfig(address,address,ConversionConfig)` | FastTrackTimelock, NormalTimelock |
| `setMinAmountToConvert(uint256)` | FastTrackTimelock, NormalTimelock |

## XVS (`0xc1Eb7689147C81aC840d4FF0D298489fc7986d52`)

| Function | Grantees |
| --- | --- |
| `burn(address,uint256)` | XVSProxyOFTDest |
| `migrateMinterTokens(address,address)` | FastTrackTimelock, Guardian, NormalTimelock |
| `mint(address,uint256)` | XVSProxyOFTDest |
| `pause()` | FastTrackTimelock, Guardian, NormalTimelock |
| `setMintCap(address,uint256)` | FastTrackTimelock, Guardian, NormalTimelock |
| `unpause()` | FastTrackTimelock, Guardian, NormalTimelock |
| `updateBlacklist(address,bool)` | FastTrackTimelock, Guardian, NormalTimelock |

## XVSBridgeAdmin / XVSBridgeAdmin_Proxy (`0xf5d81C6F7DAA3F97A6265C8441f92eFda22Ad784`)

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

## XVSVaultConverter (`0x9c5A7aB705EA40876c1B292630a3ff2e0c213DB1`)

| Function | Grantees |
| --- | --- |
| `pauseConversion()` | FastTrackTimelock, Guardian, NormalTimelock |
| `resumeConversion()` | FastTrackTimelock, Guardian, NormalTimelock |
| `setConversionConfig(address,address,ConversionConfig)` | FastTrackTimelock, NormalTimelock |
| `setMinAmountToConvert(uint256)` | FastTrackTimelock, NormalTimelock |

## XVSVaultProxy (`0x8b79692AAB2822Be30a6382Eb04763A74752d5B4`)

| Function | Grantees |
| --- | --- |
| `add(address,uint256,address,uint256,uint256)` | NormalTimelock |
| `pause()` | FastTrackTimelock, Guardian, NormalTimelock |
| `resume()` | FastTrackTimelock, Guardian, NormalTimelock |
| `set(address,uint256,uint256)` | NormalTimelock |
| `setRewardAmountPerBlockOrSecond(address,uint256)` | FastTrackTimelock, NormalTimelock |
| `setWithdrawalLockingPeriod(address,uint256,uint256)` | NormalTimelock |

## XVSVaultTreasury / XVSVaultTreasury_Proxy (`0xb076D4f15c08D7A7B89466327Ba71bc7e1311b58`)

| Function | Grantees |
| --- | --- |
| `fundXVSVault(uint256)` | FastTrackTimelock, NormalTimelock |

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
| `unlistMarket(address)` | FastTrackTimelock, Guardian, NormalTimelock |
| `updateJumpRateModel(uint256,uint256,uint256,uint256)` | NormalTimelock |
