# ACM Permissions — opbnbtestnet

Snapshot block: 179560074 · Updated: 2026-07-10 · Contracts: 12 · Permissions: 123 · Verification: ✅ verified on-chain (as of 2026-07-12)

## 0x22E504FaD56cc14B0Cf258C374C44384772c8A40 (`0x22E504FaD56cc14B0Cf258C374C44384772c8A40`)

| Function | Grantees |
| --- | --- |
| `addTimelocks(address[])` | 0xd8Adf0e83189B3cea99F8ad7320afFa8a66Ba75B, 0xF4Bfe9F6C93eD08f5298574aa7a640Bb3d34F762, 0xF58E03870105F799e0147f465629bD2359dfCa30, Guardian |
| `forceResumeReceive(uint16,bytes)` | Guardian |
| `pause()` | 0xd8Adf0e83189B3cea99F8ad7320afFa8a66Ba75B, 0xF4Bfe9F6C93eD08f5298574aa7a640Bb3d34F762, 0xF58E03870105F799e0147f465629bD2359dfCa30, Guardian |
| `retryMessage(uint16,bytes,uint64,bytes)` | 0xd8Adf0e83189B3cea99F8ad7320afFa8a66Ba75B, 0xF4Bfe9F6C93eD08f5298574aa7a640Bb3d34F762, 0xF58E03870105F799e0147f465629bD2359dfCa30, Guardian |
| `setConfig(uint16,uint16,uint256,bytes)` | 0xd8Adf0e83189B3cea99F8ad7320afFa8a66Ba75B, 0xF4Bfe9F6C93eD08f5298574aa7a640Bb3d34F762, 0xF58E03870105F799e0147f465629bD2359dfCa30, Guardian |
| `setMaxDailyReceiveLimit(uint256)` | 0xd8Adf0e83189B3cea99F8ad7320afFa8a66Ba75B, 0xF4Bfe9F6C93eD08f5298574aa7a640Bb3d34F762, 0xF58E03870105F799e0147f465629bD2359dfCa30, Guardian |
| `setMinDstGas(uint16,uint16,uint256)` | 0xd8Adf0e83189B3cea99F8ad7320afFa8a66Ba75B, Guardian |
| `setPayloadSizeLimit(uint16,uint256)` | 0xd8Adf0e83189B3cea99F8ad7320afFa8a66Ba75B, Guardian |
| `setPrecrime(address)` | 0xd8Adf0e83189B3cea99F8ad7320afFa8a66Ba75B, Guardian |
| `setReceiveVersion(uint16)` | 0xd8Adf0e83189B3cea99F8ad7320afFa8a66Ba75B, 0xF4Bfe9F6C93eD08f5298574aa7a640Bb3d34F762, 0xF58E03870105F799e0147f465629bD2359dfCa30, Guardian |
| `setSendVersion(uint16)` | 0xd8Adf0e83189B3cea99F8ad7320afFa8a66Ba75B, Guardian |
| `setTimelockPendingAdmin(address,uint8)` | 0xd8Adf0e83189B3cea99F8ad7320afFa8a66Ba75B, 0xF4Bfe9F6C93eD08f5298574aa7a640Bb3d34F762, 0xF58E03870105F799e0147f465629bD2359dfCa30, Guardian |
| `setTrustedRemoteAddress(uint16,bytes)` | 0xd8Adf0e83189B3cea99F8ad7320afFa8a66Ba75B, 0xF4Bfe9F6C93eD08f5298574aa7a640Bb3d34F762, 0xF58E03870105F799e0147f465629bD2359dfCa30, Guardian |
| `unpause()` | Guardian |

## 0x233eFd8aFd8C164A8d5e54f649E948F823f0a425 (`0x233eFd8aFd8C164A8d5e54f649E948F823f0a425`)

| Function | Grantees |
| --- | --- |
| `addTimelocks(address[])` | Guardian |
| `forceResumeReceive(uint16,bytes)` | Guardian |
| `pause()` | Guardian |
| `retryMessage(uint16,bytes,uint64,bytes)` | Guardian |
| `setConfig(uint16,uint16,uint256,bytes)` | Guardian |
| `setMaxDailyReceiveLimit(uint256)` | Guardian |
| `setMinDstGas(uint16,uint16,uint256)` | Guardian |
| `setPayloadSizeLimit(uint16,uint256)` | Guardian |
| `setPrecrime(address)` | Guardian |
| `setReceiveVersion(uint16)` | Guardian |
| `setSendVersion(uint16)` | Guardian |
| `setTimelockPendingAdmin(address,uint8)` | Guardian |
| `setTrustedRemoteAddress(uint16,bytes)` | Guardian |
| `unpause()` | Guardian |

## 0x3dEDBD90EFC6E2257887FF36842337dF0739B8A1 (`0x3dEDBD90EFC6E2257887FF36842337dF0739B8A1`)

| Function | Grantees |
| --- | --- |
| `setMaxLoopsLimit(uint256)` | NormalTimelock |
| `setRewardRecipient(address)` | NormalTimelock |

## BinanceOracle / BinanceOracle_Proxy (`0x496B6b03469472572C47bdB407d5549b244a74F2`)

| Function | Grantees |
| --- | --- |
| `setMaxStalePeriod(string,uint256)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setSymbolOverride(string,string)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |

## BoundValidator / BoundValidator_Proxy (`0x049537Bb065e6253e9D8D08B45Bf6b753657A746`)

| Function | Grantees |
| --- | --- |
| `enableOracle(address,uint8,bool)` | NormalTimelock |
| `pause()` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setOracle(address,address,uint8)` | NormalTimelock |
| `setTokenConfig(TokenConfig)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setValidateConfig(ValidateConfig)` | NormalTimelock |
| `unpause()` | CriticalTimelock, FastTrackTimelock, NormalTimelock |

## OmnichainExecutorOwner / OmnichainExecutorOwner_Proxy (`0x4F570240FF6265Fbb1C79cE824De6408F1948913`)

| Function | Grantees |
| --- | --- |
| `addTimelocks(address[])` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `forceResumeReceive(uint16,bytes)` | Guardian |
| `pause()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `retryMessage(uint16,bytes,uint64,bytes)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setConfig(uint16,uint16,uint256,bytes)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setGuardian(address)` | Guardian, NormalTimelock |
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

## PoolRegistry / PoolRegistry_Proxy (`0x560eA4e1cC42591E9f5F5D83Ad2fd65F30128951`)

| Function | Grantees |
| --- | --- |
| `addMarket(AddMarketInput)` | NormalTimelock |
| `addPool(string,address,uint256,uint256,uint256)` | NormalTimelock |
| `setPoolName(address,string)` | NormalTimelock |
| `updatePoolMetadata(address,VenusPoolMetaData)` | NormalTimelock |

## ProtocolShareReserve / ProtocolShareReserve_Proxy (`0xc355dEb1A9289f8C58CFAa076EEdBf51F3A8Da7F`)

| Function | Grantees |
| --- | --- |
| `addOrUpdateDistributionConfigs(DistributionConfig[])` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `removeDistributionConfig(Schema,address)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |

## ResilientOracle / ResilientOracle_Proxy (`0xEF4e53a9A4565ef243A2f0ee9a7fc2410E1aA623`)

| Function | Grantees |
| --- | --- |
| `enableOracle(address,uint8,bool)` | NormalTimelock |
| `pause()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setOracle(address,address,uint8)` | NormalTimelock |
| `setTokenConfig(TokenConfig)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `unpause()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |

## XVS (`0xc2931B1fEa69b6D6dA65a50363A8D75d285e4da9`)

| Function | Grantees |
| --- | --- |
| `burn(address,uint256)` | XVSProxyOFTDest |
| `migrateMinterTokens(address,address)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `mint(address,uint256)` | XVSProxyOFTDest |
| `pause()` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setMintCap(address,uint256)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `unpause()` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `updateBlacklist(address,bool)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |

## XVSBridgeAdmin / XVSBridgeAdmin_Proxy (`0x19252AFD0B2F539C400aEab7d460CBFbf74c17ff`)

| Function | Grantees |
| --- | --- |
| `dropFailedMessage(uint16,bytes,uint64)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `dropFailedMessage(uint16,bytes)` | Guardian |
| `fallbackWithdraw(address,uint256)` | Guardian |
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

## XVSVaultProxy (`0xB14A0e72C5C202139F78963C9e89252c1ad16f01`)

| Function | Grantees |
| --- | --- |
| `add(address,uint256,address,uint256,uint256)` | NormalTimelock |
| `pause()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `resume()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `set(address,uint256,uint256)` | NormalTimelock |
| `setBlocksPerYear(uint256)` | NormalTimelock |
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
| `setLiquidationIncentive(uint256)` | NormalTimelock, PoolRegistry / PoolRegistry_Proxy |
| `setMarketBorrowCaps(address[],uint256[])` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock, PoolRegistry / PoolRegistry_Proxy |
| `setMarketSupplyCaps(address[],uint256[])` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock, PoolRegistry / PoolRegistry_Proxy |
| `setMaxLoopsLimit(uint256)` | NormalTimelock |
| `setMinLiquidatableCollateral(uint256)` | NormalTimelock, PoolRegistry / PoolRegistry_Proxy |
| `setProtocolSeizeShare(uint256)` | NormalTimelock |
| `setReduceReservesBlockDelta(uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setReserveFactor(uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setRewardRecipient(address)` | NormalTimelock |
| `setSnapshot(uint256,uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setSnapshotGap(uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `supportMarket(address)` | PoolRegistry / PoolRegistry_Proxy |
| `unlistMarket(address)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `updateJumpRateModel(uint256,uint256,uint256,uint256)` | NormalTimelock |
