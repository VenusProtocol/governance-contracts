# ACM Permissions — opsepolia

Snapshot block: 45948402 · Updated: 2026-07-10 · Contracts: 16 · Permissions: 112 · Verification: ✅ verified on-chain

## 0xc66c4058A8524253C22a9461Df6769CE09F7d61e (`0xc66c4058A8524253C22a9461Df6769CE09F7d61e`)

| Function | Grantees |
| --- | --- |
| `setMaxLoopsLimit(uint256)` | NormalTimelock |
| `setRewardRecipient(address)` | NormalTimelock |

## BoundValidator / BoundValidator_Proxy (`0x482469F1DA6Ec736cacF6361Ec41621f811A6800`)

| Function | Grantees |
| --- | --- |
| `setValidateConfig(ValidateConfig)` | NormalTimelock |

## ChainlinkOracle / ChainlinkOracle_Proxy (`0x493C3f543AEa37EefF17D823f27Cb1feAB9f3143`)

| Function | Grantees |
| --- | --- |
| `setDirectPrice(address,uint256)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setTokenConfig(TokenConfig)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |

## CollateralFactorsRiskSteward / CollateralFactorsRiskSteward_Proxy (`0xC1eCF5Ee6B2F43194359c02FB460B31e4494895d`)

| Function | Grantees |
| --- | --- |
| `setSafeDeltaBps(uint256)` | FastTrackTimelock, Guardian, NormalTimelock |

## Comptroller_Core (`0x59d10988974223B042767aaBFb6D926863069535`)

| Function | Grantees |
| --- | --- |
| `setCollateralFactor(address,uint256,uint256)` | CollateralFactorsRiskSteward / CollateralFactorsRiskSteward_Proxy |
| `setMarketBorrowCaps(address[],uint256[])` | MarketCapsRiskSteward / MarketCapsRiskSteward_Proxy |
| `setMarketSupplyCaps(address[],uint256[])` | MarketCapsRiskSteward / MarketCapsRiskSteward_Proxy |

## DestinationStewardReceiver / DestinationStewardReceiver_Proxy (`0xCbab4C50D8458958515763dA4Db0Ba74769a5653`)

| Function | Grantees |
| --- | --- |
| `setConfigActive(string,bool)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setRemoteDelay(uint256)` | FastTrackTimelock, Guardian, NormalTimelock |
| `setRiskParameterConfig(string,address,uint256)` | FastTrackTimelock, Guardian, NormalTimelock |
| `setWhitelistedExecutor(address,bool)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |

## MarketCapsRiskSteward / MarketCapsRiskSteward_Proxy (`0x284d000665296515280a4fB066a887EFF6A3bD9E`)

| Function | Grantees |
| --- | --- |
| `setSafeDeltaBps(uint256)` | FastTrackTimelock, Guardian, NormalTimelock |

## OmnichainExecutorOwner / OmnichainExecutorOwner_Proxy (`0xE92E31df479BC1031B866063F65CF71B6bAC4FC6`)

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

## PoolRegistry / PoolRegistry_Proxy (`0x6538C861C7A6997602311342657b9143dD9E8152`)

| Function | Grantees |
| --- | --- |
| `addMarket(AddMarketInput)` | NormalTimelock |
| `addPool(string,address,uint256,uint256,uint256)` | NormalTimelock |
| `setPoolName(address,string)` | NormalTimelock |
| `updatePoolMetadata(address,VenusPoolMetaData)` | NormalTimelock |

## Prime / Prime_Proxy (`0x54dEb59698c628be5EEd5AD41Fd825Eb3Be89704`)

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

## PrimeLiquidityProvider / PrimeLiquidityProvider_Proxy (`0xE3EC955b94D197a8e4081844F3f25F81047A9AF5`)

| Function | Grantees |
| --- | --- |
| `pauseFundsTransfer()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `resumeFundsTransfer()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setMaxLoopsLimit(uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setMaxTokensDistributionSpeed(address[],uint256[])` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setTokensDistributionSpeed(address[],uint256[])` | CriticalTimelock, FastTrackTimelock, NormalTimelock |

## ProtocolShareReserve / ProtocolShareReserve_Proxy (`0x0F021c29283c47DF8237741dD5a0aA22952aFc88`)

| Function | Grantees |
| --- | --- |
| `addOrUpdateDistributionConfigs(DistributionConfig[])` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `removeDistributionConfig(Schema,address)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |

## ResilientOracle / ResilientOracle_Proxy (`0x6c01ECa2B5C97F135406a3A5531445A7d977D28e`)

| Function | Grantees |
| --- | --- |
| `enableOracle(address,uint8,bool)` | NormalTimelock |
| `pause()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setOracle(address,address,uint8)` | NormalTimelock |
| `setTokenConfig(TokenConfig)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `unpause()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |

## XVS (`0x789482e37218f9b26d8D9115E356462fA9A37116`)

| Function | Grantees |
| --- | --- |
| `burn(address,uint256)` | XVSProxyOFTDest |
| `migrateMinterTokens(address,address)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `mint(address,uint256)` | XVSProxyOFTDest |
| `pause()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setMintCap(address,uint256)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `unpause()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `updateBlacklist(address,bool)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |

## XVSBridgeAdmin / XVSBridgeAdmin_Proxy (`0x6bBcB95eCF9BEc9AE91d5Ad227783e3913145321`)

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

## XVSVaultProxy (`0x4d344e48F02234E82D7D1dB84d0A4A18Aa43Dacc`)

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
| `setInterestRateModel(address)` | CriticalTimelock, FastTrackTimelock, IRMRiskSteward / IRMRiskSteward_Proxy, NormalTimelock |
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
