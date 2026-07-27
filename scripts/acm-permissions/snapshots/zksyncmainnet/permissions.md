# ACM Permissions — zksyncmainnet

Snapshot block: 71331070 · Updated: 2026-07-27 · Contracts: 15 · Permissions: 109 · Verification: ✅ verified on-chain (as of 2026-07-27)

## AuxiliaryCommandsAggregator / AuxiliaryCommandsAggregator_Proxy (`0x0B906d55025cE88bF713764AAc6F23918a25fA49`)

| Function | Grantees |
| --- | --- |
| `addAuthorizedBatchers(address[])` | FastTrackTimelock, NormalTimelock |
| `executeBatch(uint256)` | FastTrackTimelock, NormalTimelock |
| `removeAuthorizedBatchers(address[])` | FastTrackTimelock, NormalTimelock |

## BoundValidator / BoundValidator_Proxy (`0x51519cdCDDD05E2ADCFA108f4a960755D9d6ea8b`)

| Function | Grantees |
| --- | --- |
| `setValidateConfig(ValidateConfig)` | NormalTimelock |

## ChainlinkOracle / ChainlinkOracle_Proxy (`0x4FC29E1d3fFFbDfbf822F09d20A5BE97e59F66E5`)

| Function | Grantees |
| --- | --- |
| `setDirectPrice(address,uint256)` | FastTrackTimelock, Guardian, NormalTimelock |
| `setTokenConfig(TokenConfig)` | FastTrackTimelock, Guardian, NormalTimelock |

## OmnichainExecutorOwner / OmnichainExecutorOwner_Proxy (`0xdfaed3E5d9707629Ed5c225b4fB980c064286771`)

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

## PoolRegistry / PoolRegistry_Proxy (`0xFD96B926298034aed9bBe0Cca4b651E41eB87Bc4`)

| Function | Grantees |
| --- | --- |
| `addMarket(AddMarketInput)` | NormalTimelock |
| `addPool(string,address,uint256,uint256,uint256)` | NormalTimelock |
| `setPoolName(address,string)` | NormalTimelock |
| `updatePoolMetadata(address,VenusPoolMetaData)` | NormalTimelock |

## Prime / Prime_Proxy (`0xdFe62Dcba3Ce0A827439390d7d45Af8baE599978`)

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

## PrimeLiquidityProvider / PrimeLiquidityProvider_Proxy (`0x0EDE6d7fB474614C5D3d5a16581628bb96CB5dff`)

| Function | Grantees |
| --- | --- |
| `pauseFundsTransfer()` | FastTrackTimelock, Guardian, NormalTimelock |
| `resumeFundsTransfer()` | FastTrackTimelock, Guardian, NormalTimelock |
| `setMaxLoopsLimit(uint256)` | FastTrackTimelock |
| `setMaxTokensDistributionSpeed(address[],uint256[])` | FastTrackTimelock, NormalTimelock |
| `setTokensDistributionSpeed(address[],uint256[])` | FastTrackTimelock, NormalTimelock |

## ProtocolShareReserve / ProtocolShareReserve_Proxy (`0xA1193e941BDf34E858f7F276221B4886EfdD040b`)

| Function | Grantees |
| --- | --- |
| `addOrUpdateDistributionConfigs(DistributionConfig[])` | FastTrackTimelock, Guardian, NormalTimelock |
| `removeDistributionConfig(Schema,address)` | FastTrackTimelock, Guardian, NormalTimelock |

## RedStoneOracle / RedStoneOracle_Proxy (`0xFa1e65e714CDfefDC9729130496AB5b5f3708fdA`)

| Function | Grantees |
| --- | --- |
| `setDirectPrice(address,uint256)` | FastTrackTimelock, Guardian, NormalTimelock |
| `setTokenConfig(TokenConfig)` | FastTrackTimelock, Guardian, NormalTimelock |

## ResilientOracle / ResilientOracle_Proxy (`0xDe564a4C887d5ad315a19a96DC81991c98b12182`)

| Function | Grantees |
| --- | --- |
| `enableOracle(address,uint8,bool)` | NormalTimelock |
| `pause()` | FastTrackTimelock, Guardian, NormalTimelock |
| `setOracle(address,address,uint8)` | NormalTimelock |
| `setTokenConfig(TokenConfig)` | FastTrackTimelock, Guardian, NormalTimelock |
| `unpause()` | FastTrackTimelock, Guardian, NormalTimelock |

## VenusERC4626Factory / VenusERC4626Factory_Proxy (`0xDC59Dd76Dd7A64d743C764a9aa8C96Ff2Ea8BAc3`)

| Function | Grantees |
| --- | --- |
| `setRewardRecipient(address)` | NormalTimelock |

## VToken_vwUSDM_Core (`0x183dE3C349fCf546aAe925E1c7F364EA6FB4033c`)

| Function | Grantees |
| --- | --- |
| `setReserveFactor(uint256)` | Guardian |

## XVS (`0xD78ABD81a3D57712a3af080dc4185b698Fe9ac5A`)

| Function | Grantees |
| --- | --- |
| `burn(address,uint256)` | XVSProxyOFTDest |
| `migrateMinterTokens(address,address)` | FastTrackTimelock, Guardian, NormalTimelock |
| `mint(address,uint256)` | XVSProxyOFTDest |
| `pause()` | FastTrackTimelock, Guardian, NormalTimelock |
| `setMintCap(address,uint256)` | FastTrackTimelock, Guardian, NormalTimelock |
| `unpause()` | FastTrackTimelock, Guardian, NormalTimelock |
| `updateBlacklist(address,bool)` | FastTrackTimelock, Guardian, NormalTimelock |

## XVSBridgeAdmin / XVSBridgeAdmin_Proxy (`0x2471043F05Cc41A6051dd6714DC967C7BfC8F902`)

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

## XVSVaultProxy (`0xbbB3C88192a5B0DB759229BeF49DcD1f168F326F`)

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
