# ACM Permissions — arbitrumone

Snapshot block: 482433317 · Updated: 2026-07-10 · Contracts: 36 · Permissions: 162 · Verification: ⚠️ not verified this run

## 0xC1422B928cb6FC9BA52880892078578a93aa5Cc7 (`0xC1422B928cb6FC9BA52880892078578a93aa5Cc7`)

| Function | Grantees |
| --- | --- |
| `setMaxLoopsLimit(uint256)` | NormalTimelock |
| `setRewardRecipient(address)` | NormalTimelock |

## AuxiliaryCommandsAggregator / AuxiliaryCommandsAggregator_Proxy (`0x768FEf3a88ea92cCF9CAcDf0aB15C4B29B3C1379`)

| Function | Grantees |
| --- | --- |
| `addAuthorizedBatchers(address[])` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `executeBatch(uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `removeAuthorizedBatchers(address[])` | CriticalTimelock, FastTrackTimelock, NormalTimelock |

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
| `addTokenConverter(address)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `removeTokenConverter(address)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |

## DeviationSentinel / DeviationSentinel_Proxy (`0xb4CC54B33d34fD809E8fBD83A066158591ED7Fba`)

| Function | Grantees |
| --- | --- |
| `setTokenConfig(address,(uint8,bool))` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setTokenMonitoringEnabled(address,bool)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setTrustedKeeper(address,bool)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |

## EBrake / EBrake_Proxy (`0xFc4CE7Ca9BB5119705Cfb84d6e4476e8a4032b26`)

| Function | Grantees |
| --- | --- |
| `decreaseCF(address,uint256)` | 0xCCa5a587eBDBe80f23c8610F2e53B03158e62948, CriticalTimelock, DeviationSentinel / DeviationSentinel_Proxy, FastTrackTimelock, Guardian, NormalTimelock |
| `pauseActions(address[],uint8[])` | 0xCCa5a587eBDBe80f23c8610F2e53B03158e62948, CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `pauseBorrow(address)` | 0xCCa5a587eBDBe80f23c8610F2e53B03158e62948, CriticalTimelock, DeviationSentinel / DeviationSentinel_Proxy, FastTrackTimelock, Guardian, NormalTimelock |
| `pauseRedeem(address)` | 0xCCa5a587eBDBe80f23c8610F2e53B03158e62948, CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `pauseSupply(address)` | 0xCCa5a587eBDBe80f23c8610F2e53B03158e62948, CriticalTimelock, DeviationSentinel / DeviationSentinel_Proxy, FastTrackTimelock, Guardian, NormalTimelock |
| `pauseTransfer(address)` | 0xCCa5a587eBDBe80f23c8610F2e53B03158e62948, CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `resetBorrowCapSnapshot(address)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `resetCFSnapshot(address)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `resetSupplyCapSnapshot(address)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setMarketBorrowCaps(address[],uint256[])` | 0xCCa5a587eBDBe80f23c8610F2e53B03158e62948, CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setMarketSupplyCaps(address[],uint256[])` | 0xCCa5a587eBDBe80f23c8610F2e53B03158e62948, CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |

## OmnichainExecutorOwner / OmnichainExecutorOwner_Proxy (`0xf72C1Aa0A1227B4bCcB28E1B1015F0616E2db7fD`)

| Function | Grantees |
| --- | --- |
| `addTimelocks(address[])` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `forceResumeReceive(uint16,bytes)` | Guardian |
| `pause()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `retryMessage(uint16,bytes,uint64,bytes)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setConfig(uint16,uint16,uint256,bytes)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setGuardian(address)` | NormalTimelock |
| `setMaxDailyReceiveLimit(uint256)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setMinDstGas(uint16,uint16,uint256)` | NormalTimelock |
| `setPayloadSizeLimit(uint16,uint256)` | NormalTimelock |
| `setPrecrime(address)` | NormalTimelock |
| `setReceiveVersion(uint16)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
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
| `addMarket(address,address,uint256,uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `burn(address)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `issue(bool,address[])` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setLimit(uint256,uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setMaxLoopsLimit(uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setStakedAt(address[],uint256[])` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `togglePause()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `updateAlpha(uint128,uint128)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `updateMultipliers(address,uint256,uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |

## PrimeLiquidityProvider / PrimeLiquidityProvider_Proxy (`0x86bf21dB200f29F21253080942Be8af61046Ec29`)

| Function | Grantees |
| --- | --- |
| `pauseFundsTransfer()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `resumeFundsTransfer()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setMaxLoopsLimit(uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setMaxTokensDistributionSpeed(address[],uint256[])` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setTokensDistributionSpeed(address[],uint256[])` | CriticalTimelock, FastTrackTimelock, NormalTimelock |

## ProtocolShareReserve / ProtocolShareReserve_Proxy (`0xF9263eaF7eB50815194f26aCcAB6765820B13D41`)

| Function | Grantees |
| --- | --- |
| `addOrUpdateDistributionConfigs(DistributionConfig[])` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `removeDistributionConfig(Schema,address)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |

## RedStoneOracle / RedStoneOracle_Proxy (`0xF792C4D3BdeF534D6d1dcC305056D00C95453dD6`)

| Function | Grantees |
| --- | --- |
| `setDirectPrice(address,uint256)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setTokenConfig(TokenConfig)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |

## ResilientOracle / ResilientOracle_Proxy (`0xd55A98150e0F9f5e3F6280FC25617A5C93d96007`)

| Function | Grantees |
| --- | --- |
| `enableOracle(address,uint8,bool)` | NormalTimelock |
| `pause()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setOracle(address,address,uint8)` | NormalTimelock |
| `setTokenConfig(TokenConfig)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `unpause()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |

## SentinelOracle / SentinelOracle_Proxy (`0x3563CAbc541a0432C66A64942ffB4070a9726226`)

| Function | Grantees |
| --- | --- |
| `setDirectPrice(address,uint256)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setTokenOracleConfig(address,address)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |

## SequencerChainlinkOracle / SequencerChainlinkOracle_Proxy (`0x9cd9Fcc7E3dEDA360de7c080590AaD377ac9F113`)

| Function | Grantees |
| --- | --- |
| `setDirectPrice(address,uint256)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setTokenConfig(TokenConfig)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |

## UniswapOracle / UniswapOracle_Proxy (`0xB6CFbfe6834EF519f002DBc1a8B81Ea437Ca647D`)

| Function | Grantees |
| --- | --- |
| `setPoolConfig(address,address)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |

## USDCPrimeConverter (`0x6553C9f9E131191d4fECb6F0E73bE13E229065C6`)

| Function | Grantees |
| --- | --- |
| `pauseConversion()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `resumeConversion()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setConversionConfig(address,address,ConversionConfig)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setMinAmountToConvert(uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |

## USDTPrimeConverter (`0x435Fac1B002d5D31f374E07c0177A1D709d5DC2D`)

| Function | Grantees |
| --- | --- |
| `pauseConversion()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `resumeConversion()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setConversionConfig(address,address,ConversionConfig)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setMinAmountToConvert(uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |

## VToken_vARB_Core (`0xAeB0FEd69354f34831fe1D16475D9A83ddaCaDA6`)

| Function | Grantees |
| --- | --- |
| `syncCash()` | NormalTimelock |

## VToken_vgmBTC-USDC_Core (`0x4f3a73f318C5EA67A86eaaCE24309F29f89900dF`)

| Function | Grantees |
| --- | --- |
| `syncCash()` | NormalTimelock |

## VToken_vgmWETH-USDC_Core (`0x9bb8cEc9C0d46F53b4f2173BB2A0221F66c353cC`)

| Function | Grantees |
| --- | --- |
| `syncCash()` | NormalTimelock |

## VToken_vUSDC_Core (`0x7D8609f8da70fF9027E9bc5229Af4F6727662707`)

| Function | Grantees |
| --- | --- |
| `syncCash()` | NormalTimelock |

## VToken_vUSDT_Core (`0xB9F9117d4200dC296F9AcD1e8bE1937df834a2fD`)

| Function | Grantees |
| --- | --- |
| `syncCash()` | NormalTimelock |

## VToken_vWBTC_Core (`0xaDa57840B372D4c28623E87FC175dE8490792811`)

| Function | Grantees |
| --- | --- |
| `syncCash()` | NormalTimelock |

## VToken_vweETH_LiquidStakedETH (`0x246a35E79a3a0618535A469aDaF5091cAA9f7E88`)

| Function | Grantees |
| --- | --- |
| `syncCash()` | NormalTimelock |

## VToken_vWETH_Core (`0x68a34332983f4Bf866768DD6D6E638b02eF5e1f0`)

| Function | Grantees |
| --- | --- |
| `syncCash()` | NormalTimelock |

## VToken_vWETH_LiquidStakedETH (`0x39D6d13Ea59548637104E40e729E4aABE27FE106`)

| Function | Grantees |
| --- | --- |
| `syncCash()` | NormalTimelock |

## VToken_vwstETH_LiquidStakedETH (`0x9df6B5132135f14719696bBAe3C54BAb272fDb16`)

| Function | Grantees |
| --- | --- |
| `syncCash()` | NormalTimelock |

## WBTCPrimeConverter (`0xF91369009c37f029aa28AF89709a352375E5A162`)

| Function | Grantees |
| --- | --- |
| `pauseConversion()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `resumeConversion()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setConversionConfig(address,address,ConversionConfig)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setMinAmountToConvert(uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |

## WETHPrimeConverter (`0x4aCB90ddD6df24dC6b0D50df84C94e72012026d0`)

| Function | Grantees |
| --- | --- |
| `pauseConversion()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `resumeConversion()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setConversionConfig(address,address,ConversionConfig)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setMinAmountToConvert(uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |

## XVS (`0xc1Eb7689147C81aC840d4FF0D298489fc7986d52`)

| Function | Grantees |
| --- | --- |
| `burn(address,uint256)` | XVSProxyOFTDest |
| `migrateMinterTokens(address,address)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `mint(address,uint256)` | XVSProxyOFTDest |
| `pause()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setMintCap(address,uint256)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `unpause()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `updateBlacklist(address,bool)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |

## XVSBridgeAdmin / XVSBridgeAdmin_Proxy (`0xf5d81C6F7DAA3F97A6265C8441f92eFda22Ad784`)

| Function | Grantees |
| --- | --- |
| `dropFailedMessage(uint16,bytes,uint64)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `forceResumeReceive(uint16,bytes)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `pause()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `removeTrustedRemote(uint16)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setConfig(uint16,uint16,uint256,bytes)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setMaxDailyLimit(uint16,uint256)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setMaxDailyReceiveLimit(uint16,uint256)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setMaxSingleReceiveTransactionLimit(uint16,uint256)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setMaxSingleTransactionLimit(uint16,uint256)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setMinDstGas(uint16,uint16,uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setOracle(address)` | NormalTimelock |
| `setPayloadSizeLimit(uint16,uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setPrecrime(address)` | NormalTimelock |
| `setReceiveVersion(uint16)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setSendVersion(uint16)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setTrustedRemoteAddress(uint16,bytes)` | NormalTimelock |
| `setWhitelist(address,bool)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `sweepToken(address,address,uint256)` | NormalTimelock |
| `transferBridgeOwnership(address)` | NormalTimelock |
| `unpause()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `updateSendAndCallEnabled(bool)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |

## XVSVaultConverter (`0x9c5A7aB705EA40876c1B292630a3ff2e0c213DB1`)

| Function | Grantees |
| --- | --- |
| `pauseConversion()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `resumeConversion()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setConversionConfig(address,address,ConversionConfig)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setMinAmountToConvert(uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |

## XVSVaultProxy (`0x8b79692AAB2822Be30a6382Eb04763A74752d5B4`)

| Function | Grantees |
| --- | --- |
| `add(address,uint256,address,uint256,uint256)` | NormalTimelock |
| `pause()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `resume()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `set(address,uint256,uint256)` | NormalTimelock |
| `setRewardAmountPerBlockOrSecond(address,uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setWithdrawalLockingPeriod(address,uint256,uint256)` | NormalTimelock |

## XVSVaultTreasury / XVSVaultTreasury_Proxy (`0xb076D4f15c08D7A7B89466327Ba71bc7e1311b58`)

| Function | Grantees |
| --- | --- |
| `fundXVSVault(uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |

## 🃏 Wildcard permissions

| Function | Grantees |
| --- | --- |
| `setActionsPaused(address[],uint256[],bool)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setCloseFactor(uint256)` | NormalTimelock, PoolRegistry / PoolRegistry_Proxy |
| `setCollateralFactor(address,uint256,uint256)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock, PoolRegistry / PoolRegistry_Proxy |
| `setForcedLiquidation(address,bool)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setGrowthRate(uint256,uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setInterestRateModel(address)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setLastRewardingBlockTimestamps(address[],uint256[],uint256[])` | NormalTimelock |
| `setLiquidationIncentive(uint256)` | NormalTimelock, PoolRegistry / PoolRegistry_Proxy |
| `setMarketBorrowCaps(address[],uint256[])` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock, PoolRegistry / PoolRegistry_Proxy |
| `setMarketSupplyCaps(address[],uint256[])` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock, PoolRegistry / PoolRegistry_Proxy |
| `setMaxLoopsLimit(uint256)` | NormalTimelock |
| `setMinLiquidatableCollateral(uint256)` | NormalTimelock, PoolRegistry / PoolRegistry_Proxy |
| `setProtocolSeizeShare(uint256)` | NormalTimelock |
| `setReduceReservesBlockDelta(uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setReserveFactor(uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setRewardRecipient(address)` | NormalTimelock |
| `setRewardTokenSpeeds(address[],uint256[],uint256[])` | NormalTimelock |
| `setSnapshot(uint256,uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setSnapshotGap(uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `supportMarket(address)` | PoolRegistry / PoolRegistry_Proxy |
| `unlistMarket(address)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `updateJumpRateModel(uint256,uint256,uint256,uint256)` | NormalTimelock |
