# ACM Permissions — basemainnet

Snapshot block: 48454999 · Updated: 2026-07-10 · Contracts: 25 · Permissions: 135 · Verification: ⚠️ not verified this run

## 0x1A430825B31DdA074751D6731Ce7Dca38D012D13 (`0x1A430825B31DdA074751D6731Ce7Dca38D012D13`)

| Function | Grantees |
| --- | --- |
| `setMaxLoopsLimit(uint256)` | NormalTimelock |
| `setRewardRecipient(address)` | NormalTimelock |

## AerodromeSlipstreamOracle / AerodromeSlipstreamOracle_Proxy (`0x5DE0B322A74088fD64CDD01042BE2fBc47FE82EC`)

| Function | Grantees |
| --- | --- |
| `setPoolConfig(address,address)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |

## AuxiliaryCommandsAggregator / AuxiliaryCommandsAggregator_Proxy (`0x768FEf3a88ea92cCF9CAcDf0aB15C4B29B3C1379`)

| Function | Grantees |
| --- | --- |
| `addAuthorizedBatchers(address[])` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `executeBatch(uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `removeAuthorizedBatchers(address[])` | CriticalTimelock, FastTrackTimelock, NormalTimelock |

## BoundValidator / BoundValidator_Proxy (`0x66dDE062D3DC1BB5223A0096EbB89395d1f11DB0`)

| Function | Grantees |
| --- | --- |
| `setValidateConfig(ValidateConfig)` | NormalTimelock |

## ChainlinkOracle / ChainlinkOracle_Proxy (`0x6F2eA73597955DB37d7C06e1319F0dC7C7455dEb`)

| Function | Grantees |
| --- | --- |
| `setDirectPrice(address,uint256)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setTokenConfig(TokenConfig)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |

## Comptroller_Core (`0x0C7973F9598AA62f9e03B94E92C967fD5437426C`)

| Function | Grantees |
| --- | --- |
| `setActionsPaused(address[],uint256[],bool)` | EBrake / EBrake_Proxy |
| `setCollateralFactor(address,uint256,uint256)` | EBrake / EBrake_Proxy |
| `setMarketBorrowCaps(address[],uint256[])` | EBrake / EBrake_Proxy |
| `setMarketSupplyCaps(address[],uint256[])` | EBrake / EBrake_Proxy |

## DeviationSentinel / DeviationSentinel_Proxy (`0x12D09d5b13A673269cdB624D17A42f45a5233076`)

| Function | Grantees |
| --- | --- |
| `setTokenConfig(address,(uint8,bool))` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setTokenMonitoringEnabled(address,bool)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setTrustedKeeper(address,bool)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |

## EBrake / EBrake_Proxy (`0x062C68Af7B9Fb059DCB7FA4B6b92E633350fb7c2`)

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

## OmnichainExecutorOwner / OmnichainExecutorOwner_Proxy (`0x8BA591f72a90fb379b9a82087b190d51b226F0a9`)

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

## PoolRegistry / PoolRegistry_Proxy (`0xeef902918DdeCD773D4B422aa1C6e1673EB9136F`)

| Function | Grantees |
| --- | --- |
| `addMarket(AddMarketInput)` | NormalTimelock |
| `addPool(string,address,uint256,uint256,uint256)` | NormalTimelock |
| `setPoolName(address,string)` | NormalTimelock |
| `updatePoolMetadata(address,VenusPoolMetaData)` | NormalTimelock |

## Prime / Prime_Proxy (`0xD2e84244f1e9Fca03Ff024af35b8f9612D5d7a30`)

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

## PrimeLiquidityProvider / PrimeLiquidityProvider_Proxy (`0xcB293EB385dEFF2CdeDa4E7060974BB90ee0B208`)

| Function | Grantees |
| --- | --- |
| `pauseFundsTransfer()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `resumeFundsTransfer()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setMaxLoopsLimit(uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setMaxTokensDistributionSpeed(address[],uint256[])` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setTokensDistributionSpeed(address[],uint256[])` | CriticalTimelock, FastTrackTimelock, NormalTimelock |

## ProtocolShareReserve / ProtocolShareReserve_Proxy (`0x3565001d57c91062367C3792B74458e3c6eD910a`)

| Function | Grantees |
| --- | --- |
| `addOrUpdateDistributionConfigs(DistributionConfig[])` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `removeDistributionConfig(Schema,address)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |

## RedStoneOracle / RedStoneOracle_Proxy (`0xd101Bf51937A6718F402dA944CbfdcD12bB6a6eb`)

| Function | Grantees |
| --- | --- |
| `setDirectPrice(address,uint256)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setTokenConfig(TokenConfig)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |

## ResilientOracle / ResilientOracle_Proxy (`0xcBBf58bD5bAdE357b634419B70b215D5E9d6FbeD`)

| Function | Grantees |
| --- | --- |
| `enableOracle(address,uint8,bool)` | NormalTimelock |
| `pause()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setOracle(address,address,uint8)` | NormalTimelock |
| `setTokenConfig(TokenConfig)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `unpause()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |

## SentinelOracle / SentinelOracle_Proxy (`0xCdD6D79Fd313C21967CED04C1b8bE70BDc27574D`)

| Function | Grantees |
| --- | --- |
| `setDirectPrice(address,uint256)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setTokenOracleConfig(address,address)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |

## UniswapOracle / UniswapOracle_Proxy (`0xc3b5169a7d5f6341403c74187Db3C4Fe6d447762`)

| Function | Grantees |
| --- | --- |
| `setPoolConfig(address,address)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |

## VToken_vcbBTC_Core (`0x7bBd1005bB24Ec84705b04e1f2DfcCad533b6D72`)

| Function | Grantees |
| --- | --- |
| `syncCash()` | NormalTimelock |

## VToken_vUSDC_Core (`0x3cb752d175740043Ec463673094e06ACDa2F9a2e`)

| Function | Grantees |
| --- | --- |
| `syncCash()` | NormalTimelock |

## VToken_vWETH_Core (`0xEB8A79bD44cF4500943bf94a2b4434c95C008599`)

| Function | Grantees |
| --- | --- |
| `syncCash()` | NormalTimelock |

## VToken_vwstETH_Core (`0x133d3BCD77158D125B75A17Cb517fFD4B4BE64C5`)

| Function | Grantees |
| --- | --- |
| `syncCash()` | NormalTimelock |

## VToken_vwsuperOETHb_Core (`0x75201D81B3B0b9D17b179118837Be37f64fc4930`)

| Function | Grantees |
| --- | --- |
| `syncCash()` | NormalTimelock |

## XVS (`0xebB7873213c8d1d9913D8eA39Aa12d74cB107995`)

| Function | Grantees |
| --- | --- |
| `burn(address,uint256)` | XVSProxyOFTDest |
| `migrateMinterTokens(address,address)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `mint(address,uint256)` | XVSProxyOFTDest |
| `pause()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setMintCap(address,uint256)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `unpause()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `updateBlacklist(address,bool)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |

## XVSBridgeAdmin / XVSBridgeAdmin_Proxy (`0x6303FEcee7161bF959d65df4Afb9e1ba5701f78e`)

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

## XVSVaultProxy (`0x708B54F2C3f3606ea48a8d94dab88D9Ab22D7fCd`)

| Function | Grantees |
| --- | --- |
| `add(address,uint256,address,uint256,uint256)` | NormalTimelock |
| `pause()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `resume()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `set(address,uint256,uint256)` | NormalTimelock |
| `setRewardAmountPerBlockOrSecond(address,uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setWithdrawalLockingPeriod(address,uint256,uint256)` | NormalTimelock |

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
| `unlistMarket(address)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `updateJumpRateModel(uint256,uint256,uint256,uint256)` | NormalTimelock |
