# ACM Permissions — bsctestnet

Snapshot block: 121608669 · Updated: 2026-07-27 · Contracts: 113 · Permissions: 674 · Verification: ✅ verified on-chain (as of 2026-07-27)

## 0x044E572144bc08ed2D90E081EeEd7b5b6Cb01016 (`0x044E572144bc08ed2D90E081EeEd7b5b6Cb01016`)

| Function | Grantees |
| --- | --- |
| `addResource(address,address)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `lowerResourceCap(address,uint256)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `pauseResource(address)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `raiseResourceCap(address,uint256)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `removeResource(address)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setBlocksPerYear(uint256)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setInnerDepositQueue(address[])` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setInnerWithdrawQueue(address[])` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `sweep(address,address)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `unpauseResource(address)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `updateResourceAdapter(address,address)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |

## 0x05968239d978601146D3e50eE1F29e8571249fB0 (`0x05968239d978601146D3e50eE1F29e8571249fB0`)

| Function | Grantees |
| --- | --- |
| `processUpdate(RiskParameterUpdate)` | 0x34e4505f92C8499B07eeb7Aa72404A490D152Ab3 |
| `setMaxIncreaseBps(uint256)` | NormalTimelock |

## 0x07c10cd93d7ACE4c1EfAE0248393e96c072A69F3 (`0x07c10cd93d7ACE4c1EfAE0248393e96c072A69F3`)

| Function | Grantees |
| --- | --- |
| `pauseConversion()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `resumeConversion()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setConversionConfig(address,address,ConversionConfig)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setMinAmountToConvert(uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setPoolsAssetsDirectTransfer(address[],address[][],bool[][])` | CriticalTimelock, FastTrackTimelock, NormalTimelock |

## 0x11e39DC7b8b16BBDA8D9C2903dF741Ae9341Ec88 (`0x11e39DC7b8b16BBDA8D9C2903dF741Ae9341Ec88`)

| Function | Grantees |
| --- | --- |
| `addResource(address,address)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `lowerResourceCap(address,uint256)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `pauseResource(address)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `raiseResourceCap(address,uint256)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `removeResource(address)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setBlocksPerYear(uint256)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setInnerDepositQueue(address[])` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setInnerWithdrawQueue(address[])` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `sweep(address,address)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `unpauseResource(address)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `updateResourceAdapter(address,address)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |

## 0x18F2543DCCD09dEb0e28575008CD24c0700e964B (`0x18F2543DCCD09dEb0e28575008CD24c0700e964B`)

| Function | Grantees |
| --- | --- |
| `pauseConversion()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `resumeConversion()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setConversionConfig(address,address,ConversionConfig)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setMinAmountToConvert(uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |

## 0x1aF50D1Ee859Bb972384F1f96F3cFCccfC5Ac210 (`0x1aF50D1Ee859Bb972384F1f96F3cFCccfC5Ac210`)

| Function | Grantees |
| --- | --- |
| `addMarket(AddMarketInput)` | Guardian |
| `createRegistryPool(string,address,uint256,uint256,uint256,address,uint256,address)` | Guardian |

## 0x22E7443A271A4A59EcF2c96134B579d60dc15a1A (`0x22E7443A271A4A59EcF2c96134B579d60dc15a1A`)

| Function | Grantees |
| --- | --- |
| `addMarket(AddMarketInput)` | Guardian |
| `createRegistryPool(string,address,uint256,uint256,uint256,address,uint256,address)` | Guardian |

## 0x24b4A647B005291e97AdFf7078b912A39C905091 (`0x24b4A647B005291e97AdFf7078b912A39C905091`)

| Function | Grantees |
| --- | --- |
| `execute(uint16,bytes,bytes,address)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `pause()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `retryExecute(uint256,uint16,bytes,bytes,address,uint256)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setConfig(uint16,uint16,uint256,bytes)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setMaxDailyLimit(uint16,uint256)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setSendVersion(uint16)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setTrustedRemoteAddress(uint16,bytes)` | NormalTimelock |
| `unpause()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |

## 0x2822E0Ac03e64F7BA26e0aCb79EC0B6336e9CA2A (`0x2822E0Ac03e64F7BA26e0aCb79EC0B6336e9CA2A`)

| Function | Grantees |
| --- | --- |
| `pause()` | CriticalTimelock, FastTrackTimelock |
| `resume()` | CriticalTimelock, FastTrackTimelock |
| `setComptroller(address)` | NormalTimelock |
| `setFeeIn(uint256)` | NormalTimelock |
| `setFeeOut(uint256)` | NormalTimelock |
| `setVaiMintCap(uint256)` | NormalTimelock |
| `setVenusTreasury(address)` | NormalTimelock |

## 0x2B8e226a462138250df2551bb499ad71218c4353 (`0x2B8e226a462138250df2551bb499ad71218c4353`)

| Function | Grantees |
| --- | --- |
| `pauseFundsTransfer()` | Guardian |
| `resumeFundsTransfer()` | Guardian |
| `setTokensDistributionSpeed(address[],uint256[])` | Guardian |

## 0x31DEb4D1326838522697f7a012992f0824d80f2b (`0x31DEb4D1326838522697f7a012992f0824d80f2b`)

| Function | Grantees |
| --- | --- |
| `pause()` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setRiskParameterConfig(string,address,uint256)` | NormalTimelock |
| `toggleConfigActive(string)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `unpause()` | CriticalTimelock, FastTrackTimelock, NormalTimelock |

## 0x34e4505f92C8499B07eeb7Aa72404A490D152Ab3 (`0x34e4505f92C8499B07eeb7Aa72404A490D152Ab3`)

| Function | Grantees |
| --- | --- |
| `pause()` | NormalTimelock |
| `setRiskParameterConfig(string,address,uint256)` | NormalTimelock |
| `toggleConfigActive(string)` | NormalTimelock |
| `unpause()` | NormalTimelock |

## 0x354B807373a9D07A08b0F6a4064B9Ef80fAD7DBf (`0x354B807373a9D07A08b0F6a4064B9Ef80fAD7DBf`)

| Function | Grantees |
| --- | --- |
| `pauseConversion()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `resumeConversion()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setConversionConfig(address,address,ConversionConfig)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setMinAmountToConvert(uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |

## 0x357eD75C02A26C44fB84527B5d64B80D6222C5a1 (`0x357eD75C02A26C44fB84527B5d64B80D6222C5a1`)

| Function | Grantees |
| --- | --- |
| `pauseConversion()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `resumeConversion()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setConversionConfig(address,address,ConversionConfig)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setMinAmountToConvert(uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |

## 0x36bA78812Ffff64B9ec060a1F07FcFa2012f6F89 (`0x36bA78812Ffff64B9ec060a1F07FcFa2012f6F89`)

| Function | Grantees |
| --- | --- |
| `acceptPositionTokenOwnership()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `approvePositionTransfer(address)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `closeVault(address)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `completePauseVault(address)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `createVault(VaultConfig,InstitutionalConfig,RiskConfig,string,string)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `createVault(VaultConfig,InstitutionalConfig,RiskConfig)` | Guardian |
| `openVault(address)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `partialPauseVault(address)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `revokePositionTransfer(address)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setComptroller(address)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setLatePenaltyRate(address,uint256)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setLiquidationAdapter(address)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setLiquidationIncentive(address,uint256)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setLiquidationThreshold(address,uint256)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setOracle(address)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setProtocolShareReserve(address)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setTreasury(address)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setVaultImplementation(address)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `sweep(address,address)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `unpauseVault(address)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |

## 0x3eeE05d929D1E9816185B1b6d8c470eC192b4432 (`0x3eeE05d929D1E9816185B1b6d8c470eC192b4432`)

| Function | Grantees |
| --- | --- |
| `setTokenConfig(TokenConfig)` | NormalTimelock |
| `setTokenConfigs(TokenConfig[])` | NormalTimelock |

## 0x42Ab178C9a1e4186220B5CAc53Df54FaE7d557Cb (`0x42Ab178C9a1e4186220B5CAc53Df54FaE7d557Cb`)

| Function | Grantees |
| --- | --- |
| `pauseFundsTransfer()` | Guardian |
| `resumeFundsTransfer()` | Guardian |
| `setTokensDistributionSpeed(address[],uint256[])` | Guardian |

## 0x45E9b8A46558c359b6Ee30580A599AAa1e5d9cDE (`0x45E9b8A46558c359b6Ee30580A599AAa1e5d9cDE`)

| Function | Grantees |
| --- | --- |
| `finalizeInitialization()` | Guardian, NormalTimelock |
| `initializeStakers(address[],uint256[],uint64[])` | Guardian, NormalTimelock |
| `setMaxLoopsLimit(uint256)` | Guardian, NormalTimelock |
| `setMultiplierTiers(uint256[],uint256[])` | Guardian, NormalTimelock |
| `setPrimeV2(address)` | Guardian, NormalTimelock |

## 0x49be570231a5b9EfB0359CfC781EfDf5359dcD51 (`0x49be570231a5b9EfB0359CfC781EfDf5359dcD51`)

| Function | Grantees |
| --- | --- |
| `setTokenConfig(TokenConfig)` | NormalTimelock |
| `setTokenConfigs(TokenConfig[])` | NormalTimelock |

## 0x4aB96DCDE8c617FBBF95A381fDb21Fb49551ec63 (`0x4aB96DCDE8c617FBBF95A381fDb21Fb49551ec63`)

| Function | Grantees |
| --- | --- |
| `setMaxStalePeriod(string,uint256)` | NormalTimelock |

## 0x4B8b963324dB0D40f64539032AB49CB07c88e312 (`0x4B8b963324dB0D40f64539032AB49CB07c88e312`)

| Function | Grantees |
| --- | --- |
| `addMarket(address,uint256,uint256)` | Guardian, NormalTimelock |
| `burn(address)` | Guardian, NormalTimelock |
| `burnBatch(address[])` | Guardian, NormalTimelock |
| `issue(address)` | Guardian, NormalTimelock |
| `issueBatch(address[])` | Guardian, NormalTimelock |
| `pause()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `recordCycleSnapshot(uint256)` | Guardian, NormalTimelock |
| `removeMarket(address)` | Guardian, NormalTimelock |
| `setLimit(uint256)` | Guardian, NormalTimelock |
| `setMaxLoopsLimit(uint256)` | Guardian, NormalTimelock |
| `setMintThreshold(uint256,uint256)` | Guardian, NormalTimelock |
| `setPrimeLeaderboard(address)` | Guardian, NormalTimelock |
| `unpause()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `updateAlpha(uint128,uint128)` | Guardian, NormalTimelock |
| `updateMultipliers(address,uint256,uint256)` | Guardian, NormalTimelock |

## 0x4e446d6Fe16c4e95eEAd7f963C9312Cf4c280270 (`0x4e446d6Fe16c4e95eEAd7f963C9312Cf4c280270`)

| Function | Grantees |
| --- | --- |
| `addMarket(address,uint256,uint256)` | Guardian |
| `burn(address)` | Guardian |
| `issue(bool,address[])` | Guardian |
| `setLimit(uint256,uint256)` | Guardian |
| `togglePause()` | Guardian |
| `updateAlpha(uint128,uint128)` | Guardian |
| `updateMultipliers(address,uint256,uint256)` | Guardian |

## 0x503BF2929232a0Cf7C1D296a8C59D63C6224777D (`0x503BF2929232a0Cf7C1D296a8C59D63C6224777D`)

| Function | Grantees |
| --- | --- |
| `addResource(address,address)` | Guardian |
| `forceRemoveResource(address)` | Guardian |
| `pauseResource(address)` | Guardian |
| `removeResource(address)` | Guardian |
| `setInnerDepositQueue(address[])` | Guardian |
| `setInnerWithdrawQueue(address[])` | Guardian |
| `sweep(address,address)` | Guardian |
| `unpauseResource(address)` | Guardian |
| `updateResourceAdapter(address,address)` | Guardian |

## 0x5346f648029d1D1d1034e09e8AD7a115f5D7A159 (`0x5346f648029d1D1d1034e09e8AD7a115f5D7A159`)

| Function | Grantees |
| --- | --- |
| `addHub(address)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `removeHub(address)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |

## 0x5A53efCa9ac93c6456d60E3c33839e3F06BA9356 (`0x5A53efCa9ac93c6456d60E3c33839e3F06BA9356`)

| Function | Grantees |
| --- | --- |
| `addResource(address,address)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `lowerResourceCap(address,uint256)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `pauseResource(address)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `raiseResourceCap(address,uint256)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `removeResource(address)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setBlocksPerYear(uint256)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setInnerDepositQueue(address[])` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setInnerWithdrawQueue(address[])` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `sweep(address,address)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `unpauseResource(address)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `updateResourceAdapter(address,address)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |

## 0x5D08D49A2e43aC4c72C60754d1550BA12e846d66 (`0x5D08D49A2e43aC4c72C60754d1550BA12e846d66`)

| Function | Grantees |
| --- | --- |
| `dropFailedMessage(uint16,bytes)` | NormalTimelock |
| `fallbackWithdraw(address,uint256)` | NormalTimelock |
| `forceResumeReceive(uint16,bytes)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `pause()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `removeTrustedRemote(uint16)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setConfig(uint16,uint16,uint256,bytes)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setMaxDailyLimit(uint16,uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setMaxDailyReceiveLimit(uint16,uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setMaxSingleReceiveTransactionLimit(uint16,uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setMaxSingleTransactionLimit(uint16,uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setMinDstGas(uint16,uint16,uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setOracle(address)` | NormalTimelock |
| `setPayloadSizeLimit(uint16,uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setPrecrime(address)` | NormalTimelock |
| `setReceiveVersion(uint16)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setSendVersion(uint16)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setTrustedRemoteAddress(uint16,bytes)` | NormalTimelock |
| `setWhitelist(address,bool)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `transferBridgeOwnership(address)` | NormalTimelock |
| `unpause()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |

## 0x650B1C775E737c439129611f068AFA3763b57Ff5 (`0x650B1C775E737c439129611f068AFA3763b57Ff5`)

| Function | Grantees |
| --- | --- |
| `addTokenConverter(address)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `removeTokenConverter(address)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |

## 0x67dD3aD52f6b575654651B5228de88fEF9462724 (`0x67dD3aD52f6b575654651B5228de88fEF9462724`)

| Function | Grantees |
| --- | --- |
| `processUpdate(RiskParameterUpdate)` | 0xec20a50A9c162f64eF8D215eD7f688bf57f8cDB9 |
| `setMaxIncreaseBps(uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |

## 0x69d79D60abD5A7080C9f178a44c5f1bf1A461541 (`0x69d79D60abD5A7080C9f178a44c5f1bf1A461541`)

| Function | Grantees |
| --- | --- |
| `setCloseFactor(uint256)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setLiquidatorWhitelist(address,bool)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setProtocolLiquidationShare(uint256)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setSettlerWhitelist(address,bool)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `sweepProtocolShareToReserve(address)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |

## 0x7a8e88bA76E6A15De6CEa3fa60a465a2af365173 (`0x7a8e88bA76E6A15De6CEa3fa60a465a2af365173`)

| Function | Grantees |
| --- | --- |
| `execute(uint16,bytes,bytes,address)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `pause()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `retryExecute(uint256,uint16,bytes,bytes,address,uint256)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setConfig(uint16,uint16,uint256,bytes)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setMaxDailyLimit(uint16,uint256)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setSendVersion(uint16)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setTrustedRemoteAddress(uint16,bytes)` | NormalTimelock |
| `unpause()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |

## 0x7cE6ADF754D0eC81A6CF8ACd9C7454F45077dc61 (`0x7cE6ADF754D0eC81A6CF8ACd9C7454F45077dc61`)

| Function | Grantees |
| --- | --- |
| `addYieldGroup(address,uint256,uint16)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `emergencyReallocate((address,address,uint256)[],(address,address,uint256)[])` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `lowerMaxWithdrawalSize(uint256)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `lowerYieldGroupCap(address,uint256,uint16)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `pauseHub()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `pauseYieldGroup(address)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `raiseMaxWithdrawalSize(uint256)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `raiseYieldGroupCap(address,uint256,uint16)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `reallocate((address,address,uint256)[],(address,address,uint256)[])` | Guardian |
| `removeYieldGroup(address)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setFeeRecipient(address)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setManagementFeeBps(uint16)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setOuterDepositQueue(address[])` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setOuterWithdrawQueue(address[])` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setPerformanceFeeBps(uint16)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setRedeemFeeBps(uint16)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `sweep(address,address)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `unpauseHub()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `unpauseYieldGroup(address)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |

## 0x84e96554776607E5Ba78aeC299a81b70D03a53D6 (`0x84e96554776607E5Ba78aeC299a81b70D03a53D6`)

| Function | Grantees |
| --- | --- |
| `setValidateConfig(ValidateConfig)` | NormalTimelock |
| `setValidateConfigs(ValidateConfig[])` | NormalTimelock |

## 0x8Aac02EB8054F4CBAdE1396651b94F8F7D87fafc (`0x8Aac02EB8054F4CBAdE1396651b94F8F7D87fafc`)

| Function | Grantees |
| --- | --- |
| `addResource(address,address)` | Guardian |
| `lowerResourceCap(address,uint256)` | Guardian |
| `pauseResource(address)` | Guardian |
| `raiseResourceCap(address,uint256)` | Guardian |
| `removeResource(address)` | Guardian |
| `setBlocksPerYear(uint256)` | Guardian |
| `setInnerDepositQueue(address[])` | Guardian |
| `setInnerWithdrawQueue(address[])` | Guardian |
| `sweep(address,address)` | Guardian |
| `unpauseResource(address)` | Guardian |
| `updateResourceAdapter(address,address)` | Guardian |

## 0x8B7F7176176c4eF5BeDCC5BC5958dFBD8DD9a740 (`0x8B7F7176176c4eF5BeDCC5BC5958dFBD8DD9a740`)

| Function | Grantees |
| --- | --- |
| `pauseConversion()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `resumeConversion()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setConversionConfig(address,address,ConversionConfig)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setMinAmountToConvert(uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |

## 0x8C8894217b9552736CF86784B087b5114b7CfF76 (`0x8C8894217b9552736CF86784B087b5114b7CfF76`)

| Function | Grantees |
| --- | --- |
| `addYieldGroup(address,uint256,uint16)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `emergencyReallocate((address,address,uint256)[],(address,address,uint256)[])` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `lowerMaxWithdrawalSize(uint256)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `lowerYieldGroupCap(address,uint256,uint16)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `pauseHub()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `pauseYieldGroup(address)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `raiseMaxWithdrawalSize(uint256)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `raiseYieldGroupCap(address,uint256,uint16)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `reallocate((address,address,uint256)[],(address,address,uint256)[])` | Guardian |
| `removeYieldGroup(address)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setFeeRecipient(address)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setManagementFeeBps(uint16)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setOuterDepositQueue(address[])` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setOuterWithdrawQueue(address[])` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setPerformanceFeeBps(uint16)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setRedeemFeeBps(uint16)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `sweep(address,address)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `unpauseHub()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `unpauseYieldGroup(address)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |

## 0x9084aFAaa6b06171B59Ce629295c86c8974CcEF8 (`0x9084aFAaa6b06171B59Ce629295c86c8974CcEF8`)

| Function | Grantees |
| --- | --- |
| `pauseConversion()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `resumeConversion()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setConversionConfig(address,address,ConversionConfig)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setMinAmountToConvert(uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |

## 0x9b40390771cAeEa69DE55EEd176aeDC72d70cA3E (`0x9b40390771cAeEa69DE55EEd176aeDC72d70cA3E`)

| Function | Grantees |
| --- | --- |
| `processUpdate(RiskParameterUpdate)` | 0x31DEb4D1326838522697f7a012992f0824d80f2b |
| `setMaxIncreaseBps(uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |

## 0xA0Fb0fFeBdcB7F45A3Ec841cCE7F78B7CeBD0f82 (`0xA0Fb0fFeBdcB7F45A3Ec841cCE7F78B7CeBD0f82`)

| Function | Grantees |
| --- | --- |
| `addResource(address,address)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `forceRemoveResource(address)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `pauseResource(address)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `removeResource(address)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setInnerDepositQueue(address[])` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setInnerWithdrawQueue(address[])` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `sweep(address,address)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `unpauseResource(address)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `updateResourceAdapter(address,address)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |

## 0xa7D2A407A40A071681CeeEaa9C6C59259eaF0597 (`0xa7D2A407A40A071681CeeEaa9C6C59259eaF0597`)

| Function | Grantees |
| --- | --- |
| `addOrRemoveAssetFromPrime(address,bool)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `addOrUpdateDistributionConfigs(DistributionConfig[])` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `removeDistributionConfig(Schema,address)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |

## 0xab79995b1154433C9652393B7BF3aeb65C2573Bd (`0xab79995b1154433C9652393B7BF3aeb65C2573Bd`)

| Function | Grantees |
| --- | --- |
| `fundXVSVault(uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |

## 0xB46BDd025F8FB78eD5174155F74Cb452DF15d6D4 (`0xB46BDd025F8FB78eD5174155F74Cb452DF15d6D4`)

| Function | Grantees |
| --- | --- |
| `addOrRemoveAssetFromPrime(address,bool)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `addOrUpdateDistributionConfigs(DistributionConfig[])` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `removeDistributionConfig(Schema,address)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |

## 0xcBF6db3DC2f3F8e3552b12B564a8Faf74B64DaeA (`0xcBF6db3DC2f3F8e3552b12B564a8Faf74B64DaeA`)

| Function | Grantees |
| --- | --- |
| `setTokenConfig(TokenConfig)` | NormalTimelock |
| `setTokenConfigs(TokenConfig[])` | NormalTimelock |
| `setUnderlyingPythOracle(IPyth)` | NormalTimelock |

## 0xD9D16795A92212662a2D44AAc810eC68fdE61076 (`0xD9D16795A92212662a2D44AAc810eC68fdE61076`)

| Function | Grantees |
| --- | --- |
| `enableOracle(address,OracleRole,bool)` | NormalTimelock |
| `pause()` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setOracle(address,address,OracleRole)` | NormalTimelock |
| `setTokenConfig(TokenConfig)` | NormalTimelock |
| `setTokenConfigs(TokenConfig[])` | NormalTimelock |
| `unpause()` | CriticalTimelock, FastTrackTimelock, NormalTimelock |

## 0xDe0c98BeecA94bf9d5B87D025442F80c076A78D8 (`0xDe0c98BeecA94bf9d5B87D025442F80c076A78D8`)

| Function | Grantees |
| --- | --- |
| `addMarket(address,uint256,uint256)` | Guardian |
| `burn(address)` | Guardian |
| `issue(bool,address[])` | Guardian |
| `pauseFundsTransfer()` | Guardian |
| `resumeFundsTransfer()` | Guardian |
| `setLimit(uint256,uint256)` | Guardian |
| `setTokensDistributionSpeed(address[],uint256[])` | Guardian |
| `togglePause()` | Guardian |
| `updateAlpha(uint128,uint128)` | Guardian |
| `updateMultipliers(address,uint256,uint256)` | Guardian |

## 0xec20a50A9c162f64eF8D215eD7f688bf57f8cDB9 (`0xec20a50A9c162f64eF8D215eD7f688bf57f8cDB9`)

| Function | Grantees |
| --- | --- |
| `pause()` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setRiskParameterConfig(string,address,uint256)` | NormalTimelock |
| `toggleConfigActive(string)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `unpause()` | CriticalTimelock, FastTrackTimelock, NormalTimelock |

## 0xF1d8bcED87d5e077e662160490797cd2B5494d4A (`0xF1d8bcED87d5e077e662160490797cd2B5494d4A`)

| Function | Grantees |
| --- | --- |
| `addOrRemoveAssetFromPrime(address,bool)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `addOrUpdateDistributionConfigs(DistributionConfig[])` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `removeDistributionConfig(Schema,address)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |

## 0xF57fdd25224807B1113f40E4F95c5f625fB458E2 (`0xF57fdd25224807B1113f40E4F95c5f625fB458E2`)

| Function | Grantees |
| --- | --- |
| `addMarket(AddMarketInput)` | Guardian |
| `addPool(string,address,uint256,uint256,uint256)` | Guardian |
| `createRegistryPool(string,address,uint256,uint256,uint256,address,uint256,address)` | Guardian |

## 0xfc4e26B7fD56610E84d33372435F0275A359E8eF (`0xfc4e26B7fD56610E84d33372435F0275A359E8eF`)

| Function | Grantees |
| --- | --- |
| `setDirectPrice(address,uint256)` | Guardian, NormalTimelock |
| `setTokenConfig(TokenConfig)` | NormalTimelock |
| `setTokenConfigs(TokenConfig[])` | NormalTimelock |
| `setUnderlyingPrice(VBep20Interface,uint256)` | NormalTimelock |

## AtlasOracle / AtlasOracle_Proxy (`0x7F00af2f30a55e79311392C98fBBfA629D19b3A5`)

| Function | Grantees |
| --- | --- |
| `setDirectPrice(address,uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setTokenConfig(TokenConfig)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |

## BinanceOracle / BinanceOracle_Proxy (`0xB58BFDCE610042311Dc0e034a80Cc7776c1D68f5`)

| Function | Grantees |
| --- | --- |
| `setMaxStalePeriod(string,uint256)` | 0x3a3284dC0FaFfb0b5F0d074c4C704D14326C98cF, CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setSymbolOverride(string,string)` | 0x3a3284dC0FaFfb0b5F0d074c4C704D14326C98cF, CriticalTimelock, FastTrackTimelock, NormalTimelock |

## BoundValidator / BoundValidator_Proxy (`0x2842140e4Ad3a92e9af30e27e290300dd785076d`)

| Function | Grantees |
| --- | --- |
| `setValidateConfig(ValidateConfig)` | NormalTimelock |
| `setValidateConfigs(ValidateConfig[])` | NormalTimelock |

## BTCBPrimeConverter (`0x989A1993C023a45DA141928921C0dE8fD123b7d1`)

| Function | Grantees |
| --- | --- |
| `pauseConversion()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `resumeConversion()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setConversionConfig(address,address,ConversionConfig)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setMinAmountToConvert(uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |

## BTCBTreasuryBuyback / BTCBTreasuryBuyback_Proxy (`0x3AC5D1933B0087487A62fAC8944De62FCF39feb6`)

| Function | Grantees |
| --- | --- |
| `executeBuyback(address,uint256,uint256,uint256,address,bytes,address)` | Guardian |
| `forwardBaseAsset(address,uint256)` | Guardian |
| `setDailyCapUsd(uint256)` | NormalTimelock |
| `setSlippageEventUsd(uint256)` | NormalTimelock |

## ChainlinkOracle / ChainlinkOracle_Proxy (`0xCeA29f1266e880A1482c06eD656cD08C148BaA32`)

| Function | Grantees |
| --- | --- |
| `setDirectPrice(address,uint256)` | 0x20A9ea5E6808209F28BA6113b6a9EcD88c8dB298, Guardian, NormalTimelock |
| `setTokenConfig(TokenConfig)` | NormalTimelock |
| `setTokenConfigs(TokenConfig[])` | NormalTimelock |
| `setUnderlyingPrice(address,uint256)` | NormalTimelock |

## CollateralFactorsRiskSteward / CollateralFactorsRiskSteward_Proxy (`0xBf821F512EA224201108303cc6dA200391Eb38aC`)

| Function | Grantees |
| --- | --- |
| `setSafeDeltaBps(uint256)` | FastTrackTimelock, NormalTimelock |

## Comptroller_BTC (`0xfE87008bf29DeCACC09a75FaAc2d128367D46e7a`)

| Function | Grantees |
| --- | --- |
| `setMarketBorrowCaps(address[],uint256[])` | 0x05968239d978601146D3e50eE1F29e8571249fB0 |
| `setMarketSupplyCaps(address[],uint256[])` | 0x05968239d978601146D3e50eE1F29e8571249fB0 |

## Comptroller_DeFi (`0x23a73971A6B9f6580c048B9CB188869B2A2aA2aD`)

| Function | Grantees |
| --- | --- |
| `setForcedLiquidation(address,bool)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setMarketBorrowCaps(address[],uint256[])` | 0x05968239d978601146D3e50eE1F29e8571249fB0 |
| `setMarketSupplyCaps(address[],uint256[])` | 0x05968239d978601146D3e50eE1F29e8571249fB0 |

## Comptroller_GameFi (`0x1F4f0989C51f12DAcacD4025018176711f3Bf289`)

| Function | Grantees |
| --- | --- |
| `setForcedLiquidation(address,bool)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setMarketBorrowCaps(address[],uint256[])` | 0x05968239d978601146D3e50eE1F29e8571249fB0 |
| `setMarketSupplyCaps(address[],uint256[])` | 0x05968239d978601146D3e50eE1F29e8571249fB0 |

## Comptroller_LiquidStakedBNB (`0x596B11acAACF03217287939f88d63b51d3771704`)

| Function | Grantees |
| --- | --- |
| `setForcedLiquidation(address,bool)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setMarketBorrowCaps(address[],uint256[])` | 0x05968239d978601146D3e50eE1F29e8571249fB0 |
| `setMarketSupplyCaps(address[],uint256[])` | 0x05968239d978601146D3e50eE1F29e8571249fB0 |

## Comptroller_LiquidStakedETH (`0xC7859B809Ed5A2e98659ab5427D5B69e706aE26b`)

| Function | Grantees |
| --- | --- |
| `setMarketBorrowCaps(address[],uint256[])` | 0x05968239d978601146D3e50eE1F29e8571249fB0 |
| `setMarketSupplyCaps(address[],uint256[])` | 0x05968239d978601146D3e50eE1F29e8571249fB0 |

## Comptroller_Meme (`0x92e8E3C202093A495e98C10f9fcaa5Abe288F74A`)

| Function | Grantees |
| --- | --- |
| `setMarketBorrowCaps(address[],uint256[])` | 0x05968239d978601146D3e50eE1F29e8571249fB0 |
| `setMarketSupplyCaps(address[],uint256[])` | 0x05968239d978601146D3e50eE1F29e8571249fB0 |

## Comptroller_StableCoins / Comptroller_Stablecoins (`0x10b57706AD2345e590c2eA4DC02faef0d9f5b08B`)

| Function | Grantees |
| --- | --- |
| `setForcedLiquidation(address,bool)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setMarketBorrowCaps(address[],uint256[])` | 0x05968239d978601146D3e50eE1F29e8571249fB0 |
| `setMarketSupplyCaps(address[],uint256[])` | 0x05968239d978601146D3e50eE1F29e8571249fB0 |

## Comptroller_Tron (`0x11537D023f489E4EF0C7157cc729C7B69CbE0c97`)

| Function | Grantees |
| --- | --- |
| `setForcedLiquidation(address,bool)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setMarketBorrowCaps(address[],uint256[])` | 0x05968239d978601146D3e50eE1F29e8571249fB0 |
| `setMarketSupplyCaps(address[],uint256[])` | 0x05968239d978601146D3e50eE1F29e8571249fB0 |

## ConverterNetwork / ConverterNetwork_Proxy (`0xC8f2B705d5A2474B390f735A5aFb570e1ce0b2cf`)

| Function | Grantees |
| --- | --- |
| `addTokenConverter(address)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `removeTokenConverter(address)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |

## DeviationBoundedOracle / DeviationBoundedOracle_Proxy (`0xE0dafC97895B3c98d3B96D3f8739AaC73166beB8`)

| Function | Grantees |
| --- | --- |
| `exitProtectionMode(address)` | 0x2947e6B99688F64f2DC629748A26CE82560f75F3, 0xf57fD8ea6dd883995A2815C7f9766A33270af57f, CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setAssetBoundedPricingEnabled(address,bool)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setCooldownPeriod(address,uint64)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setThresholds(address,uint256,uint256)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setTokenConfig((address,uint64,uint256,uint256,bool,bool))` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setTokenConfigs((address,uint64,uint256,uint256,bool,bool)[])` | 0xf57fD8ea6dd883995A2815C7f9766A33270af57f, CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `syncPriceBoundsAndProtections((address,uint8,uint256)[])` | 0x2947e6B99688F64f2DC629748A26CE82560f75F3, 0xf57fD8ea6dd883995A2815C7f9766A33270af57f |
| `updateMaxPrice(address,uint128)` | 0x2947e6B99688F64f2DC629748A26CE82560f75F3, 0xf57fD8ea6dd883995A2815C7f9766A33270af57f, CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `updateMinPrice(address,uint128)` | 0x2947e6B99688F64f2DC629748A26CE82560f75F3, 0xf57fD8ea6dd883995A2815C7f9766A33270af57f, CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |

## DeviationSentinel / DeviationSentinel_Proxy (`0x9245d72712548707809D66848e63B8E2B169F3c1`)

| Function | Grantees |
| --- | --- |
| `resetMarketState(address)` | Guardian |
| `setTokenConfig(address,(uint8,bool))` | Guardian |
| `setTokenMonitoringEnabled(address,bool)` | Guardian |
| `setTrustedKeeper(address,bool)` | Guardian |

## EBrake / EBrake_Proxy (`0x957c09e3Ac3d9e689244DC74307c94111FBa8B42`)

| Function | Grantees |
| --- | --- |
| `decreaseCF(address,uint256)` | DeviationSentinel / DeviationSentinel_Proxy, Executor / Executor_Proxy |
| `pauseBorrow(address)` | DeviationSentinel / DeviationSentinel_Proxy, Executor / Executor_Proxy |
| `pauseSupply(address)` | DeviationSentinel / DeviationSentinel_Proxy, Executor / Executor_Proxy |
| `setMarketBorrowCaps(address[],uint256[])` | Executor / Executor_Proxy |
| `setMarketSupplyCaps(address[],uint256[])` | Executor / Executor_Proxy |

## ETHPrimeConverter (`0xf358650A007aa12ecC8dac08CF8929Be7f72A4D9`)

| Function | Grantees |
| --- | --- |
| `pauseConversion()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `resumeConversion()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setConversionConfig(address,address,ConversionConfig)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setMinAmountToConvert(uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |

## ETHTreasuryBuyback / ETHTreasuryBuyback_Proxy (`0x721CCABeFC18d1e436B3479C9462B1A59988C35d`)

| Function | Grantees |
| --- | --- |
| `executeBuyback(address,uint256,uint256,uint256,address,bytes,address)` | Guardian |
| `forwardBaseAsset(address,uint256)` | Guardian |
| `setDailyCapUsd(uint256)` | NormalTimelock |
| `setSlippageEventUsd(uint256)` | NormalTimelock |

## Executor / Executor_Proxy (`0x6E447F044b59F4e0Ed46052cD7c5F6a2579FC661`)

| Function | Grantees |
| --- | --- |
| `handleBorrowCapExceeding(address)` | 0x61859C84E0C6aB7B5A9801A962C660477f31a2D3 |
| `handleCapAdjust(address,uint8,uint256)` | 0x61859C84E0C6aB7B5A9801A962C660477f31a2D3 |
| `handleLTVAdjust(address,uint256)` | 0x61859C84E0C6aB7B5A9801A962C660477f31a2D3 |
| `handleSupplyCapExceeding(address)` | 0x61859C84E0C6aB7B5A9801A962C660477f31a2D3 |
| `setMarketConfig(address,(uint256,uint256,bool))` | 0x61859C84E0C6aB7B5A9801A962C660477f31a2D3, Guardian, NormalTimelock |

## InstitutionalVaultControllerProxy (`0xf77dED2A00F94e33C392126238360D4642c16Ba2`)

| Function | Grantees |
| --- | --- |
| `acceptPositionTokenOwnership()` | NormalTimelock |
| `approvePositionTransfer(address,address)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `cancelVault(address)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `closeVault(address)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `completePauseVault(address)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `createVault(VaultConfig,InstitutionalConfig,RiskConfig,string,string,string)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `openVault(address)` | 0x45bE7346a092BeD374C8fb308ddDe89BEC03031E, CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `partialPauseVault(address)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `revokePositionTransfer(address)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setComptroller(address)` | Guardian, NormalTimelock |
| `setInstitutionName(address,string)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setInstitutionNameOverride(address,string)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setLatePenaltyRate(address,uint256)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setLiquidationAdapter(address)` | Guardian, NormalTimelock |
| `setLiquidationIncentive(address,uint256)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setLiquidationThreshold(address,uint256)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setOracle(address)` | Guardian, NormalTimelock |
| `setProtocolShareReserve(address)` | Guardian, NormalTimelock |
| `setTreasury(address)` | Guardian, NormalTimelock |
| `setVaultImplementation(address)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `sweep(address,address)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `unpauseVault(address)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |

## LiquidationAdapterProxy (`0x4b302b56315Ca16A0A4565108e62404496916491`)

| Function | Grantees |
| --- | --- |
| `setCloseFactor(uint256)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setLiquidatorWhitelist(address,bool)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setProtocolLiquidationShare(uint256)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setSettlerWhitelist(address,bool)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `sweepProtocolShareToReserve(address)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |

## Liquidator / Liquidator_Proxy (`0x55AEABa76ecf144031Ef64E222166eb28Cb4865F`)

| Function | Grantees |
| --- | --- |
| `addToAllowlist(address,address)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `pauseForceVAILiquidate()` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `removeFromAllowlist(address,address)` | NormalTimelock |
| `restrictLiquidation(address)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `resumeForceVAILiquidate()` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setMinLiquidatableVAI(uint256)` | NormalTimelock |
| `setPendingRedeemChunkLength(uint256)` | NormalTimelock |
| `setTreasuryPercent(uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `unrestrictLiquidation(address)` | NormalTimelock |

## MarketCapsRiskSteward / MarketCapsRiskSteward_Proxy (`0xecC583037338D1EFE2C15bb2c6ac81E0294375C2`)

| Function | Grantees |
| --- | --- |
| `setSafeDeltaBps(uint256)` | FastTrackTimelock, NormalTimelock |

## OmnichainProposalSender (`0xCfD34AEB46b1CB4779c945854d405E91D27A1899`)

| Function | Grantees |
| --- | --- |
| `execute(uint16,bytes,bytes,address)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `pause()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `retryExecute(uint256,uint16,bytes,bytes,address,uint256)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setConfig(uint16,uint16,uint256,bytes)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setMaxDailyLimit(uint16,uint256)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setSendVersion(uint16)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setTrustedRemoteAddress(uint16,bytes)` | NormalTimelock |
| `unpause()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |

## PegStability_USDT / PegStability_USDT_Proxy (`0xB21E69eef4Bc1D64903fa28D9b32491B1c0786F1`)

| Function | Grantees |
| --- | --- |
| `pause()` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `resume()` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setFeeIn(uint256)` | NormalTimelock |
| `setFeeOut(uint256)` | NormalTimelock |
| `setOracle(address)` | NormalTimelock |
| `setVaiMintCap(uint256)` | NormalTimelock |
| `setVenusTreasury(address)` | NormalTimelock |

## Prime / Prime_Proxy (`0xe840F8EC2Dc50E7D22e5e2991975b9F6e34b62Ad`)

| Function | Grantees |
| --- | --- |
| `addMarket(address,address,uint256,uint256)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `addMarket(address,uint256,uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `burn(address)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `issue(bool,address[])` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setLimit(uint256,uint256)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setMaxLoopsLimit(uint256)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setStakedAt(address[],uint256[])` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `togglePause()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `updateAlpha(uint128,uint128)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `updateMultipliers(address,uint256,uint256)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `updateScores(address[],uint256[])` | Guardian |

## PrimeLeaderboard / PrimeLeaderboard_Proxy (`0x1a4408613eec291f2d338F7A88E9D550fa9cD8dC`)

| Function | Grantees |
| --- | --- |
| `finalizeInitialization()` | Guardian, NormalTimelock |
| `initializeStakers(address[],uint256[],uint64[])` | Guardian, NormalTimelock |
| `resetCycle(address[])` | Guardian, NormalTimelock |
| `setMaxLoopsLimit(uint256)` | NormalTimelock |
| `setMultiplierTiers(uint256[],uint256[])` | NormalTimelock |
| `setPrimeV2(address)` | NormalTimelock |

## PrimeLiquidityProvider / PrimeLiquidityProvider_Proxy (`0xAdeddc73eAFCbed174e6C400165b111b0cb80B7E`)

| Function | Grantees |
| --- | --- |
| `pauseFundsTransfer()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `resumeFundsTransfer()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setMaxLoopsLimit(uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setMaxTokensDistributionSpeed(address[],uint256[])` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setTokensDistributionSpeed(address[],uint256[])` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |

## PrimeV2 / PrimeV2_Proxy (`0xeC22366d2572e52BCB29B50C905b945BA421B9b2`)

| Function | Grantees |
| --- | --- |
| `addMarket(address,uint256,uint256)` | Guardian, NormalTimelock |
| `burn(address)` | Guardian, NormalTimelock |
| `burnBatch(address[])` | Guardian, NormalTimelock |
| `issue(address)` | Guardian, NormalTimelock |
| `issueBatch(address[])` | Guardian, NormalTimelock |
| `pause()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `recordCycleSnapshot(uint256)` | Guardian, NormalTimelock |
| `removeMarket(address)` | Guardian, NormalTimelock |
| `resetCycle(address[])` | Guardian, NormalTimelock |
| `setLimit(uint256)` | Guardian, NormalTimelock |
| `setMaxLoopsLimit(uint256)` | Guardian, NormalTimelock |
| `setMintThreshold(uint256,uint256)` | Guardian, NormalTimelock |
| `setPrimeLeaderboard(address)` | Guardian, NormalTimelock |
| `setTokensDistributionSpeed(address[],uint256[])` | Guardian |
| `sweepUndistributed(address,address)` | NormalTimelock |
| `unpause()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `updateAlpha(uint128,uint128)` | Guardian, NormalTimelock |
| `updateMultipliers(address,uint256,uint256)` | Guardian, NormalTimelock |

## ProtocolShareReserve / ProtocolShareReserve_Proxy (`0x25c7c7D6Bf710949fD7f03364E9BA19a1b3c10E3`)

| Function | Grantees |
| --- | --- |
| `addOrUpdateDistributionConfigs(DistributionConfig[])` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `removeDistributionConfig(Schema,address)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |

## PythOracle / PythOracle_Proxy (`0x94E1534c14e0736BB24decA625f2F5364B198E0C`)

| Function | Grantees |
| --- | --- |
| `setTokenConfig(TokenConfig)` | NormalTimelock |
| `setTokenConfigs(TokenConfig[])` | NormalTimelock |
| `setUnderlyingPythOracle(address)` | NormalTimelock |

## RedStoneOracle / RedStoneOracle_Proxy (`0x0Af51d1504ac5B711A9EAFe2fAC11A51d32029Ad`)

| Function | Grantees |
| --- | --- |
| `setDirectPrice(address,uint256)` | 0x20A9ea5E6808209F28BA6113b6a9EcD88c8dB298, 0xCab91EBcbf5d242758e22fd436AB568343463A9c, 0xFEA1c651A47FE29dB9b1bf3cC1f224d8D9CFF68C, CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setTokenConfig(TokenConfig)` | 0xFEA1c651A47FE29dB9b1bf3cC1f224d8D9CFF68C, CriticalTimelock, FastTrackTimelock, NormalTimelock |

## RelativePositionManager / RelativePositionManager_Proxy (`0x25dbA64B28F93cC40e9cAf9691266043fe1000a2`)

| Function | Grantees |
| --- | --- |
| `addDSAVToken(address)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `completePause()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `completeUnpause()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `executePositionAccountCall(address,address[],bytes[])` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `partialPause()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `partialUnpause()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setDSAVTokenActive(uint8,bool)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setPositionAccountImplementation(address)` | NormalTimelock |
| `setProportionalCloseTolerance(uint256)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |

## ResilientOracle / ResilientOracle_Proxy (`0x3cD69251D04A28d887Ac14cbe2E14c52F3D57823`)

| Function | Grantees |
| --- | --- |
| `enableOracle(address,uint8,bool)` | NormalTimelock |
| `pause()` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setOracle(address,address,uint8)` | NormalTimelock |
| `setTokenConfig(TokenConfig)` | NormalTimelock |
| `setTokenConfigs(TokenConfig[])` | NormalTimelock |
| `unpause()` | CriticalTimelock, FastTrackTimelock, NormalTimelock |

## RiskFundBuyback / RiskFundBuyback_Proxy (`0x1a063a07853b9bC797E571E54B5Ce632195071fE`)

| Function | Grantees |
| --- | --- |
| `executeBuyback(address,uint256,uint256,uint256,address,bytes,address)` | Guardian |
| `forwardBaseAsset(address,uint256)` | Guardian |
| `setDailyCapUsd(uint256)` | NormalTimelock |
| `setSlippageEventUsd(uint256)` | NormalTimelock |

## RiskFundConverter / RiskFundConverter_Proxy (`0x32Fbf7bBbd79355B86741E3181ef8c1D9bD309Bb`)

| Function | Grantees |
| --- | --- |
| `pauseConversion()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `resumeConversion()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setConversionConfig(address,address,ConversionConfig)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setMinAmountToConvert(uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setPoolsAssetsDirectTransfer(address[],address[][],bool[][])` | CriticalTimelock, FastTrackTimelock, NormalTimelock |

## RiskFundV2 / RiskFundV2_Proxy (`0x487CeF72dacABD7E12e633bb3B63815a386f7012`)

| Function | Grantees |
| --- | --- |
| `setMinAmountToConvert(uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `swapPoolsAssets(address[],uint256[],address[][],uint256)` | Guardian |
| `sweepTokenFromPool(address,address,address,uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |

## RiskOracle / RiskOracle_Proxy (`0x4DEA4D1A9F6101D4adacE89f16064D780D2F241d`)

| Function | Grantees |
| --- | --- |
| `addAuthorizedSender(address)` | Guardian, NormalTimelock |
| `addUpdateType(string)` | FastTrackTimelock, NormalTimelock |
| `removeAuthorizedSender(address)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setUpdateTypeActive(string,bool)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |

## RiskStewardReceiver / RiskStewardReceiver_Proxy (`0x2F6eb64826f3A067eBFFb5909De7AA4e0Cb31b81`)

| Function | Grantees |
| --- | --- |
| `setConfigActive(string,bool)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setPaused(bool)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setRiskParameterConfig(string,address,uint256,uint256)` | FastTrackTimelock, NormalTimelock |
| `setWhitelistedExecutor(address,bool)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |

## SentinelOracle / SentinelOracle_Proxy (`0xa4f2B03919BAAdCA80C31406412C7Ee059A579D3`)

| Function | Grantees |
| --- | --- |
| `setDirectPrice(address,uint256)` | Guardian |
| `setTokenOracleConfig(address,address)` | Guardian |

## Shortfall / Shortfall_Proxy (`0x503574a82fE2A9f968d355C8AAc1Ba0481859369`)

| Function | Grantees |
| --- | --- |
| `pauseAuctions()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `resumeAuctions()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `updateIncentiveBps(uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `updateMinimumPoolBadDebt(uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `updateNextBidderBlockLimit(uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `updateWaitForFirstBidder(uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |

## Unitroller / Unitroller_Proxy (`0x94d1820b2D1c7c7452A163983Dc888CEC546b77D`)

| Function | Grantees |
| --- | --- |
| `_setActionsPaused(address[],uint8[],bool)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `_setForcedLiquidation(address,bool)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `_setForcedLiquidationForUser(address,address,bool)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `_setMarketBorrowCaps(address[],uint256[])` | 0x05968239d978601146D3e50eE1F29e8571249fB0, 0x67dD3aD52f6b575654651B5228de88fEF9462724, 0x9b40390771cAeEa69DE55EEd176aeDC72d70cA3E, CriticalTimelock, FastTrackTimelock, MarketCapsRiskSteward / MarketCapsRiskSteward_Proxy, NormalTimelock |
| `_setMarketSupplyCaps(address[],uint256[])` | 0x05968239d978601146D3e50eE1F29e8571249fB0, 0x67dD3aD52f6b575654651B5228de88fEF9462724, 0x9b40390771cAeEa69DE55EEd176aeDC72d70cA3E, CriticalTimelock, FastTrackTimelock, MarketCapsRiskSteward / MarketCapsRiskSteward_Proxy, NormalTimelock |
| `_setProtocolPaused(bool)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `_supportMarket(address)` | NormalTimelock |
| `addPoolMarkets(uint96[],address[])` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `createPool(string)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `removePoolMarket(uint96,address)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `seizeVenus(address[],address,address[])` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `seizeVenus(address[],address)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setAllowCorePoolFallback(uint96,bool)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setCollateralFactor(address,uint256,uint256)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setCollateralFactor(uint96,address,uint256,uint256)` | CollateralFactorsRiskSteward / CollateralFactorsRiskSteward_Proxy, CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setDeviationBoundedOracle(address)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setFlashLoanPaused(bool)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setIsBorrowAllowed(uint96,address,bool)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setLiquidationIncentive(address,uint256)` | NormalTimelock |
| `setLiquidationIncentive(uint96,address,uint256)` | NormalTimelock |
| `setPoolActive(uint96,bool)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setPoolLabel(uint96,string)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setWhiteListFlashLoanAccount(address,bool)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `unlistMarket(address)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |

## UPrimeBuyback / UPrimeBuyback_Proxy (`0xa9f091C50C2Bd214F757DAF243bCb94A9fE707a4`)

| Function | Grantees |
| --- | --- |
| `executeBuyback(address,uint256,uint256,uint256,address,bytes,address)` | Guardian |
| `forwardBaseAsset(address,uint256)` | Guardian |
| `setDailyCapUsd(uint256)` | NormalTimelock |
| `setSlippageEventUsd(uint256)` | NormalTimelock |

## USDCPrimeConverter (`0x2ecEdE6989d8646c992344fF6C97c72a3f811A13`)

| Function | Grantees |
| --- | --- |
| `pauseConversion()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `resumeConversion()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setConversionConfig(address,address,ConversionConfig)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setMinAmountToConvert(uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |

## USDCTreasuryBuyback / USDCTreasuryBuyback_Proxy (`0x90814cc1e02Bb821De7A280D64dFd7C0f7940fF3`)

| Function | Grantees |
| --- | --- |
| `executeBuyback(address,uint256,uint256,uint256,address,bytes,address)` | Guardian |
| `forwardBaseAsset(address,uint256)` | Guardian |
| `setDailyCapUsd(uint256)` | NormalTimelock |
| `setSlippageEventUsd(uint256)` | NormalTimelock |

## USDTChainlinkOracle / USDTChainlinkOracle_Proxy (`0x188b608544Fa32D313DE3BBB0480a238c0906e2a`)

| Function | Grantees |
| --- | --- |
| `setDirectPrice(address,uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setTokenConfig(TokenConfig)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |

## USDTPrimeBuyback / USDTPrimeBuyback_Proxy (`0xaAc507Ae5BF60d94e15489fcF75C3AB9D3C6ab55`)

| Function | Grantees |
| --- | --- |
| `executeBuyback(address,uint256,uint256,uint256,address,bytes,address)` | Guardian |
| `forwardBaseAsset(address,uint256)` | Guardian |
| `setDailyCapUsd(uint256)` | NormalTimelock |
| `setSlippageEventUsd(uint256)` | NormalTimelock |

## USDTPrimeConverter (`0xf1FA230D25fC5D6CAfe87C5A6F9e1B17Bc6F194E`)

| Function | Grantees |
| --- | --- |
| `pauseConversion()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `resumeConversion()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setConversionConfig(address,address,ConversionConfig)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setMinAmountToConvert(uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |

## USDTTreasuryBuyback / USDTTreasuryBuyback_Proxy (`0xBCF3Ef25Fb09aA4d39aDA5a737aF7E03B0Fca497`)

| Function | Grantees |
| --- | --- |
| `executeBuyback(address,uint256,uint256,uint256,address,bytes,address)` | Guardian |
| `forwardBaseAsset(address,uint256)` | Guardian |
| `setDailyCapUsd(uint256)` | NormalTimelock |
| `setSlippageEventUsd(uint256)` | NormalTimelock |

## UTreasuryBuyback / UTreasuryBuyback_Proxy (`0x281d5376723933990815E9EC27D3139903630C5C`)

| Function | Grantees |
| --- | --- |
| `executeBuyback(address,uint256,uint256,uint256,address,bytes,address)` | Guardian |
| `forwardBaseAsset(address,uint256)` | Guardian |
| `setDailyCapUsd(uint256)` | NormalTimelock |
| `setSlippageEventUsd(uint256)` | NormalTimelock |

## VaiUnitroller / VaiUnitroller_Proxy (`0xf70C3C6b749BbAb89C081737334E74C9aFD4BE16`)

| Function | Grantees |
| --- | --- |
| `setBaseRate(uint256)` | CriticalTimelock, Guardian, NormalTimelock |
| `setFloatRate(uint256)` | CriticalTimelock, Guardian, NormalTimelock |
| `setMintCap(uint256)` | CriticalTimelock, NormalTimelock |
| `setReceiver(address)` | Guardian, NormalTimelock |
| `setReceiver(uint256)` | Guardian, NormalTimelock |
| `toggleOnlyPrimeHolderMint()` | CriticalTimelock, FastTrackTimelock, NormalTimelock |

## VAIVaultProxy / VAIVaultProxy_Proxy (`0x7Db4f5cC3bBA3e12FF1F528D2e3417afb0a57118`)

| Function | Grantees |
| --- | --- |
| `pause()` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `resume()` | CriticalTimelock, FastTrackTimelock, NormalTimelock |

## VBNBAdmin / VBNBAdmin_Proxy (`0x04109575c1dbB4ac2e59e60c783800ea10441BBe`)

| Function | Grantees |
| --- | --- |
| `setInterestRateModel(address)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |

## VenusERC4626Factory / VenusERC4626Factory_Proxy (`0x07fcd489aef6a3EEAA9e8adE4361Fe5CC5BF30f7`)

| Function | Grantees |
| --- | --- |
| `setMaxLoopsLimit(uint256)` | NormalTimelock |
| `setRewardRecipient(address)` | NormalTimelock |

## VRTVaultProxy / VRTVaultProxy_Proxy (`0x1ffD1b8B67A1AE0C189c734B0F58B0954522FF71`)

| Function | Grantees |
| --- | --- |
| `pause()` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `resume()` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setLastAccruingBlock(uint256)` | NormalTimelock |

## WBNBBurnConverter (`0x42DBA48e7cCeB030eC73AaAe29d4A3F0cD4facba`)

| Function | Grantees |
| --- | --- |
| `pauseConversion()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `resumeConversion()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setConversionConfig(address,address,ConversionConfig)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setMinAmountToConvert(uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |

## XVSBridgeAdmin / XVSBridgeAdmin_Proxy (`0xB164Cb262328Ca44a806bA9e3d4094931E658513`)

| Function | Grantees |
| --- | --- |
| `dropFailedMessage(uint16,bytes)` | NormalTimelock |
| `fallbackDeposit(uint256)` | NormalTimelock |
| `fallbackWithdraw(address,uint256)` | NormalTimelock |
| `forceResumeReceive(uint16,bytes)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `pause()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `removeTrustedRemote(uint16)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setConfig(uint16,uint16,uint256,bytes)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setMaxDailyLimit(uint16,uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setMaxDailyReceiveLimit(uint16,uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setMaxSingleReceiveTransactionLimit(uint16,uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setMaxSingleTransactionLimit(uint16,uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setMinDstGas(uint16,uint16,uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setOracle(address)` | NormalTimelock |
| `setPayloadSizeLimit(uint16,uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setPrecrime(address)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setReceiveVersion(uint16)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setSendVersion(uint16)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setTrustedRemoteAddress(uint16,bytes)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setWhitelist(address,bool)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `sweepToken(address,address,uint256)` | NormalTimelock |
| `transferBridgeOwnership(address)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `unpause()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `updateSendAndCallEnabled(bool)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |

## XVSBuyback / XVSBuyback_Proxy (`0x7b96F9f3A19fd3fbB3b9621058F21d3935Bf5a11`)

| Function | Grantees |
| --- | --- |
| `executeBuyback(address,uint256,uint256,uint256,address,bytes,address)` | Guardian |
| `forwardBaseAsset(address,uint256)` | Guardian |
| `setDailyCapUsd(uint256)` | NormalTimelock |
| `setSlippageEventUsd(uint256)` | NormalTimelock |

## XVSTreasuryBuyback / XVSTreasuryBuyback_Proxy (`0x9d8d03EfB3777f97ab1e28D1D88b53aCE2CAE773`)

| Function | Grantees |
| --- | --- |
| `executeBuyback(address,uint256,uint256,uint256,address,bytes,address)` | Guardian |
| `forwardBaseAsset(address,uint256)` | Guardian |
| `setDailyCapUsd(uint256)` | NormalTimelock |
| `setSlippageEventUsd(uint256)` | NormalTimelock |

## XVSVaultConverter (`0x258f49254C758a0E37DAb148ADDAEA851F4b02a2`)

| Function | Grantees |
| --- | --- |
| `pauseConversion()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `resumeConversion()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setConversionConfig(address,address,ConversionConfig)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setMinAmountToConvert(uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |

## XVSVaultProxy / XVSVaultProxy_Proxy (`0x9aB56bAD2D7631B2A857ccf36d998232A8b82280`)

| Function | Grantees |
| --- | --- |
| `pause()` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `resume()` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setBlocksPerYear(uint256)` | NormalTimelock |
| `setRewardAmountPerBlockOrSecond(address,uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |

## XVSVaultTreasury / XVSVaultTreasury_Proxy (`0x317c6C4c9AA7F87170754DB08b4804dD689B68bF`)

| Function | Grantees |
| --- | --- |
| `fundXVSVault(uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |

## 🃏 Wildcard permissions

| Function | Grantees |
| --- | --- |
| `_reduceReserves(uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `_setActionsPaused(address[],uint8[],bool)` | EBrake / EBrake_Proxy, Guardian |
| `_setInterestRateModel(address)` | CriticalTimelock, FastTrackTimelock, IRMRiskSteward / IRMRiskSteward_Proxy, NormalTimelock |
| `_setMarketBorrowCaps(address[],uint256[])` | EBrake / EBrake_Proxy |
| `_setMarketSupplyCaps(address[],uint256[])` | EBrake / EBrake_Proxy |
| `_setReserveFactor(uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `addMarket(AddMarketInput)` | NormalTimelock |
| `addPool(string,address,uint256,uint256,uint256)` | NormalTimelock |
| `decreaseCF(address,uint256)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `decreaseCF(address,uint96,uint256)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `disablePoolBorrow(uint96,address)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `pauseActions(address[],uint8[])` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `pauseBorrow(address)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `pauseFlashLoan()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `pauseRedeem(address)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `pauseSupply(address)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `pauseTransfer(address)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `resetBorrowCapSnapshot(address)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `resetCFSnapshot(address)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `resetSupplyCapSnapshot(address)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `revokeFlashLoanAccess(address)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setActionsPaused(address[],uint256[],bool)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setCloseFactor(uint256)` | 0x1aF50D1Ee859Bb972384F1f96F3cFCccfC5Ac210, 0x22E7443A271A4A59EcF2c96134B579d60dc15a1A, 0x94911A95B9BB6d83eB7d3623DBCd2C75b6A0316B, 0xF57fdd25224807B1113f40E4F95c5f625fB458E2, NormalTimelock, PoolRegistry / PoolRegistry_Proxy |
| `setCollateralFactor(address,uint256,uint256)` | 0x1aF50D1Ee859Bb972384F1f96F3cFCccfC5Ac210, 0x22E7443A271A4A59EcF2c96134B579d60dc15a1A, 0x94911A95B9BB6d83eB7d3623DBCd2C75b6A0316B, 0xF57fdd25224807B1113f40E4F95c5f625fB458E2, CriticalTimelock, EBrake / EBrake_Proxy, FastTrackTimelock, Guardian, NormalTimelock, PoolRegistry / PoolRegistry_Proxy |
| `setCollateralFactor(uint96,address,uint256,uint256)` | EBrake / EBrake_Proxy |
| `setDirectPrice(address,uint256)` | 0x93cda8c581e174ae45844EF4F298D79106b201e3 |
| `setFlashLoanEnabled(bool)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setFlashLoanFeeMantissa(uint256,uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setFlashLoanPaused(bool)` | EBrake / EBrake_Proxy |
| `setGrowthRate(uint256,uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setInterestRateModel(address)` | 0x36190f4735A23D67C23AF9F9688617Ec00208Ddd, 0x3d6E0b2a7b389d7942C80657Ef898932e1fD63Cb, 0x6b28f5112f948dC820d302945A2cE06F664C207B, CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setIsBorrowAllowed(uint96,address,bool)` | EBrake / EBrake_Proxy |
| `setLastRewardingBlock(address[],uint32[],uint32[])` | NormalTimelock |
| `setLiquidationIncentive(uint256)` | 0x1aF50D1Ee859Bb972384F1f96F3cFCccfC5Ac210, 0x22E7443A271A4A59EcF2c96134B579d60dc15a1A, 0x94911A95B9BB6d83eB7d3623DBCd2C75b6A0316B, 0xF57fdd25224807B1113f40E4F95c5f625fB458E2, NormalTimelock, PoolRegistry / PoolRegistry_Proxy |
| `setMarketBorrowCaps(address[],uint256[])` | 0x1aF50D1Ee859Bb972384F1f96F3cFCccfC5Ac210, 0x22E7443A271A4A59EcF2c96134B579d60dc15a1A, 0x67dD3aD52f6b575654651B5228de88fEF9462724, 0x94911A95B9BB6d83eB7d3623DBCd2C75b6A0316B, 0x9b40390771cAeEa69DE55EEd176aeDC72d70cA3E, 0xF57fdd25224807B1113f40E4F95c5f625fB458E2, CriticalTimelock, EBrake / EBrake_Proxy, FastTrackTimelock, Guardian, NormalTimelock, PoolRegistry / PoolRegistry_Proxy |
| `setMarketSupplyCaps(address[],uint256[])` | 0x1aF50D1Ee859Bb972384F1f96F3cFCccfC5Ac210, 0x22E7443A271A4A59EcF2c96134B579d60dc15a1A, 0x67dD3aD52f6b575654651B5228de88fEF9462724, 0x94911A95B9BB6d83eB7d3623DBCd2C75b6A0316B, 0x9b40390771cAeEa69DE55EEd176aeDC72d70cA3E, 0xF57fdd25224807B1113f40E4F95c5f625fB458E2, CriticalTimelock, EBrake / EBrake_Proxy, FastTrackTimelock, Guardian, NormalTimelock, PoolRegistry / PoolRegistry_Proxy |
| `setMaxLoopsLimit(uint256)` | NormalTimelock |
| `setMinLiquidatableCollateral(uint256)` | 0x1aF50D1Ee859Bb972384F1f96F3cFCccfC5Ac210, 0x22E7443A271A4A59EcF2c96134B579d60dc15a1A, 0x94911A95B9BB6d83eB7d3623DBCd2C75b6A0316B, 0xF57fdd25224807B1113f40E4F95c5f625fB458E2, NormalTimelock, PoolRegistry / PoolRegistry_Proxy |
| `setPoolName(address,string)` | NormalTimelock |
| `setProtocolSeizeShare(uint256)` | NormalTimelock |
| `setReduceReservesBlockDelta(uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setReserveFactor(uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setRewardRecipient(address)` | NormalTimelock |
| `setRewardTokenSpeeds(address[],uint256[],uint256[])` | Guardian, NormalTimelock |
| `setSnapshot(uint256,uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setSnapshotGap(uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setWhiteListFlashLoanAccount(address,bool)` | EBrake / EBrake_Proxy |
| `supportMarket(address)` | 0x1aF50D1Ee859Bb972384F1f96F3cFCccfC5Ac210, 0x22E7443A271A4A59EcF2c96134B579d60dc15a1A, 0x94911A95B9BB6d83eB7d3623DBCd2C75b6A0316B, 0xF57fdd25224807B1113f40E4F95c5f625fB458E2, PoolRegistry / PoolRegistry_Proxy |
| `swapPoolsAssets(address[],uint256[],address[][])` | Guardian |
| `unlistMarket(address)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `updateJumpRateModel(uint256,uint256,uint256,uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `updatePoolMetadata(address,VenusPoolMetaData)` | NormalTimelock |
