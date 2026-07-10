# ACM Permissions — bscmainnet

Snapshot block: 109200201 · Updated: 2026-07-10 · Contracts: 62 · Permissions: 351 · Verification: ✅ verified on-chain

## AccessControlManager (`0x4788629ABc6cFCA10F9f969efdEAa1cF70c23555`)

| Function | Grantees |
| --- | --- |
| `DEFAULT_ADMIN_ROLE` | NormalTimelock |

## AtlasOracle / AtlasOracle_Proxy (`0x9E6928Ec418948ceb9f1cd9872fD312b13D841D0`)

| Function | Grantees |
| --- | --- |
| `setDirectPrice(address,uint256)` | NormalTimelock |
| `setTokenConfig(TokenConfig)` | NormalTimelock |

## AuxiliaryCommandsAggregator / AuxiliaryCommandsAggregator_Proxy (`0x528A428748dfE73DFcc844176B401475D1831057`)

| Function | Grantees |
| --- | --- |
| `addAuthorizedBatchers(address[])` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `executeBatch(uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `removeAuthorizedBatchers(address[])` | CriticalTimelock, FastTrackTimelock, NormalTimelock |

## BinanceOracle / BinanceOracle_Proxy (`0x594810b741d136f1960141C0d8Fb4a91bE78A820`)

| Function | Grantees |
| --- | --- |
| `setMaxStalePeriod(string,uint256)` | CriticalTimelock, FastTrackTimelock, Guardian 3, NormalTimelock |
| `setSymbolOverride(string,string)` | CriticalTimelock, FastTrackTimelock, Guardian 3, NormalTimelock |

## BoundValidator / BoundValidator_Proxy (`0x6E332fF0bB52475304494E4AE5063c1051c7d735`)

| Function | Grantees |
| --- | --- |
| `setValidateConfig(ValidateConfig)` | NormalTimelock |

## BTCBPrimeConverter (`0xE8CeAa79f082768f99266dFd208d665d2Dd18f53`)

| Function | Grantees |
| --- | --- |
| `pauseConversion()` | CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock |
| `resumeConversion()` | CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock |
| `setConversionConfig(address,address,ConversionConfig)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setMinAmountToConvert(uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |

## BTCBTreasuryBuyback / BTCBTreasuryBuyback_Proxy (`0x1F306a0d929a7098a0A0b12248Ba97600AB79026`)

| Function | Grantees |
| --- | --- |
| `executeBuyback(address,uint256,uint256,uint256,address,bytes,address)` | 0x88ac9ca69A371f47798Df18e5C36449af44526a4 |
| `forwardBaseAsset(address,uint256)` | 0x88ac9ca69A371f47798Df18e5C36449af44526a4 |

## ChainlinkOracle / ChainlinkOracle_Proxy (`0x1B2103441A0A108daD8848D8F5d790e4D402921F`)

| Function | Grantees |
| --- | --- |
| `setDirectPrice(address,uint256)` | CriticalTimelock, FastTrackTimelock, Guardian 3, NormalTimelock |
| `setTokenConfig(TokenConfig)` | CriticalTimelock, FastTrackTimelock, Guardian 3, NormalTimelock |
| `setUnderlyingPrice(address,uint256)` | CriticalTimelock, FastTrackTimelock, Guardian 3, NormalTimelock |

## CollateralFactorsRiskSteward / CollateralFactorsRiskSteward_Proxy (`0x1414ADf007E324ec1D0A77b9F1A8759Ad33d2879`)

| Function | Grantees |
| --- | --- |
| `setSafeDeltaBps(uint256)` | FastTrackTimelock, NormalTimelock |

## Comptroller_DeFi (`0x3344417c9360b963ca93A4e8305361AEde340Ab9`)

| Function | Grantees |
| --- | --- |
| `setForcedLiquidation(address,bool)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |

## Comptroller_GameFi (`0x1b43ea8622e76627B81665B1eCeBB4867566B963`)

| Function | Grantees |
| --- | --- |
| `setForcedLiquidation(address,bool)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |

## Comptroller_LiquidStakedBNB (`0xd933909A4a2b7A4638903028f44D1d38ce27c352`)

| Function | Grantees |
| --- | --- |
| `setForcedLiquidation(address,bool)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |

## Comptroller_Stablecoins (`0x94c1495cD4c557f1560Cbd68EAB0d197e6291571`)

| Function | Grantees |
| --- | --- |
| `setForcedLiquidation(address,bool)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |

## Comptroller_Tron (`0x23b4404E4E5eC5FF5a6FFb70B7d14E3FabF237B0`)

| Function | Grantees |
| --- | --- |
| `setForcedLiquidation(address,bool)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |

## ConverterNetwork / ConverterNetwork_Proxy (`0xF7Caad5CeB0209165f2dFE71c92aDe14d0F15995`)

| Function | Grantees |
| --- | --- |
| `addTokenConverter(address)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `removeTokenConverter(address)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |

## DeviationBoundedOracle / DeviationBoundedOracle_Proxy (`0xc79Cb7efEBd121DC4B39eA141C214606595D665A`)

| Function | Grantees |
| --- | --- |
| `exitProtectionMode(address)` | 0xa44eB88198a7a94dC6D2507Bc0e5a216C2410D79, CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock |
| `setAssetBoundedPricingEnabled(address,bool)` | CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock |
| `setCachingEnabled(address,bool)` | CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock |
| `setCooldownPeriod(address,uint64)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setThresholds(address,uint256,uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setTokenConfig((address,uint64,uint256,uint256,bool,bool))` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setTokenConfigs((address,uint64,uint256,uint256,bool,bool)[])` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `syncPriceBoundsAndProtections((address,uint8,uint256)[])` | 0xa44eB88198a7a94dC6D2507Bc0e5a216C2410D79, CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock |
| `updateMaxPrice(address,uint128)` | 0xa44eB88198a7a94dC6D2507Bc0e5a216C2410D79, CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock |
| `updateMinPrice(address,uint128)` | 0xa44eB88198a7a94dC6D2507Bc0e5a216C2410D79, CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock |

## ETHPrimeConverter (`0xca430B8A97Ea918fF634162acb0b731445B8195E`)

| Function | Grantees |
| --- | --- |
| `pauseConversion()` | CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock |
| `resumeConversion()` | CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock |
| `setConversionConfig(address,address,ConversionConfig)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setMinAmountToConvert(uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |

## ETHTreasuryBuyback / ETHTreasuryBuyback_Proxy (`0x41954F0bf26959dF2e1B8302DEBf736B5b154B64`)

| Function | Grantees |
| --- | --- |
| `executeBuyback(address,uint256,uint256,uint256,address,bytes,address)` | 0x88ac9ca69A371f47798Df18e5C36449af44526a4 |
| `forwardBaseAsset(address,uint256)` | 0x88ac9ca69A371f47798Df18e5C36449af44526a4 |

## Legacy (old BNBPermissions.json (pending fresh-extraction diff, Task 6)) (`0xea2f042e1A4f057EF8A5220e57733AD747ea8867`)

| Function | Grantees |
| --- | --- |
| `setTokenConfig(TokenConfig)` | CriticalTimelock, FastTrackTimelock, Guardian 3, NormalTimelock |

## Legacy (old BNBPermissions.json (pending fresh-extraction diff, Task 6)) (`0xC2f7924809830886EB04c6b40725Fd68F1891fA2`)

| Function | Grantees |
| --- | --- |
| `setMaxLoopsLimit(uint256)` | NormalTimelock |
| `setRewardRecipient(address)` | NormalTimelock |

## Legacy (old BNBPermissions.json (pending fresh-extraction diff, Task 6)) (`0xBa2a43279a228cf9cD94d072777d8d98e7e0a229`)

| Function | Grantees |
| --- | --- |
| `pause()` | CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock |
| `setRiskParameterConfig(string,address,uint256)` | NormalTimelock |
| `toggleConfigActive(string)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `unpause()` | CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock |

## Legacy (old BNBPermissions.json (pending fresh-extraction diff, Task 6)) (`0xE7252dccd79F2A555E314B9cdd440745b697D562`)

| Function | Grantees |
| --- | --- |
| `setMaxDeltaBps(uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |

## Liquidator / Liquidator_Proxy (`0x0870793286aaDA55D39CE7f82fb2766e8004cF43`)

| Function | Grantees |
| --- | --- |
| `addToAllowlist(address,address)` | CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock |
| `pauseForceVAILiquidate()` | CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock |
| `removeFromAllowlist(address,address)` | CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock |
| `restrictLiquidation(address)` | CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock |
| `resumeForceVAILiquidate()` | CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock |
| `setMinLiquidatableVAI(uint256)` | NormalTimelock |
| `setPendingRedeemChunkLength(uint256)` | NormalTimelock |
| `setTreasuryPercent(uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `unrestrictLiquidation(address)` | CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock |

## MarketCapsRiskSteward / MarketCapsRiskSteward_Proxy (`0x816FfD00A274EDE0091421F77817ca260Db3a3E3`)

| Function | Grantees |
| --- | --- |
| `setSafeDeltaBps(uint256)` | FastTrackTimelock, NormalTimelock |

## OmnichainProposalSender (`0x36a69dE601381be7b0DcAc5D5dD058825505F8f6`)

| Function | Grantees |
| --- | --- |
| `execute(uint16,bytes,bytes,address)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `pause()` | CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock |
| `removeTrustedRemote(uint16)` | CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock |
| `retryExecute(uint256,uint16,bytes,bytes,address,uint256)` | CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock |
| `setConfig(uint16,uint16,uint256,bytes)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setMaxDailyLimit(uint16,uint256)` | CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock |
| `setSendVersion(uint16)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setTrustedRemoteAddress(uint16,bytes)` | NormalTimelock |
| `unpause()` | CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock |

## PegStability_USDT / PegStability_USDT_Proxy (`0xC138aa4E424D1A8539e8F38Af5a754a2B7c3Cc36`)

| Function | Grantees |
| --- | --- |
| `pause()` | CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock |
| `resume()` | CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock |
| `setFeeIn(uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setFeeOut(uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setOracle(address)` | NormalTimelock |
| `setVAIMintCap(uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setVenusTreasury(address)` | NormalTimelock |

## Prime / Prime_Proxy (`0xBbCD063efE506c3D42a0Fa2dB5C08430288C71FC`)

| Function | Grantees |
| --- | --- |
| `addMarket(address,address,uint256,uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `addMarket(address,uint256,uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `burn(address)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `issue(bool,address[])` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setLimit(uint256,uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setMaxLoopsLimit(uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setStakedAt(address[],uint256[])` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `togglePause()` | CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock |
| `updateAlpha(uint128,uint128)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `updateMultipliers(address,uint256,uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |

## PrimeLeaderboard / PrimeLeaderboard_Proxy (`0x55e2ccF68B7A276dc28AfA107997b8B1Be932c0b`)

| Function | Grantees |
| --- | --- |
| `finalizeInitialization()` | 0xe0237587acA20f9304d30FACC9Afcd5DD9a94899, Guardian 2 |
| `initializeStakers(address[],uint256[],uint64[])` | 0xe0237587acA20f9304d30FACC9Afcd5DD9a94899, Guardian 2 |
| `setMaxLoopsLimit(uint256)` | NormalTimelock |
| `setMultiplierTiers(uint256[],uint256[])` | NormalTimelock |
| `setPrimeV2(address)` | NormalTimelock |

## PrimeLiquidityProvider / PrimeLiquidityProvider_Proxy (`0x23c4F844ffDdC6161174eB32c770D4D8C07833F2`)

| Function | Grantees |
| --- | --- |
| `pauseFundsTransfer()` | CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock |
| `resumeFundsTransfer()` | CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock |
| `setMaxLoopsLimit(uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setMaxTokensDistributionSpeed(address[],uint256[])` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setTokensDistributionSpeed(address[],uint256[])` | CriticalTimelock, FastTrackTimelock, NormalTimelock |

## PrimeV2 / PrimeV2_Proxy (`0x059EabA8676b03e4e8f009eFb7F587C28450F50f`)

| Function | Grantees |
| --- | --- |
| `addMarket(address,uint256,uint256)` | NormalTimelock |
| `burn(address)` | 0xe0237587acA20f9304d30FACC9Afcd5DD9a94899, Guardian 2, NormalTimelock |
| `burnBatch(address[])` | 0xe0237587acA20f9304d30FACC9Afcd5DD9a94899, Guardian 2, NormalTimelock |
| `issue(address)` | 0xe0237587acA20f9304d30FACC9Afcd5DD9a94899, Guardian 2, NormalTimelock |
| `issueBatch(address[])` | 0xe0237587acA20f9304d30FACC9Afcd5DD9a94899, Guardian 2, NormalTimelock |
| `pause()` | 0xCCa5a587eBDBe80f23c8610F2e53B03158e62948, CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock |
| `recordCycleSnapshot(uint256)` | 0xe0237587acA20f9304d30FACC9Afcd5DD9a94899, Guardian 2, NormalTimelock |
| `removeMarket(address)` | NormalTimelock |
| `setLimit(uint256)` | Guardian 2, NormalTimelock |
| `setMaxLoopsLimit(uint256)` | NormalTimelock |
| `setMintThreshold(uint256,uint256)` | Guardian 2, NormalTimelock |
| `setPrimeLeaderboard(address)` | NormalTimelock |
| `sweepUndistributed(address,address)` | NormalTimelock |
| `unpause()` | CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock |
| `updateAlpha(uint128,uint128)` | NormalTimelock |
| `updateMultipliers(address,uint256,uint256)` | NormalTimelock |

## ProtocolShareReserve / ProtocolShareReserve_Proxy (`0xCa01D5A9A248a830E9D93231e791B1afFed7c446`)

| Function | Grantees |
| --- | --- |
| `addOrUpdateDistributionConfigs(DistributionConfig[])` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `removeDistributionConfig(Schema,address)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |

## PythOracle / PythOracle_Proxy (`0xb893E38162f55fb80B18Aa44da76FaDf8E9B2262`)

| Function | Grantees |
| --- | --- |
| `setTokenConfig(TokenConfig)` | CriticalTimelock, FastTrackTimelock, Guardian 3, NormalTimelock |
| `setUnderlyingPythOracle(address)` | NormalTimelock |

## RedStoneOracle / RedStoneOracle_Proxy (`0x8455EFA4D7Ff63b8BFD96AdD889483Ea7d39B70a`)

| Function | Grantees |
| --- | --- |
| `setDirectPrice(address,uint256)` | CriticalTimelock, FastTrackTimelock, Guardian 3, NormalTimelock |
| `setTokenConfig(TokenConfig)` | CriticalTimelock, FastTrackTimelock, Guardian 3, NormalTimelock |

## ResilientOracle / ResilientOracle_Proxy (`0x6592b5DE802159F3E74B2486b091D11a8256ab8A`)

| Function | Grantees |
| --- | --- |
| `enableOracle(address,uint8,bool)` | NormalTimelock |
| `pause()` | CriticalTimelock, FastTrackTimelock, Guardian 3, NormalTimelock |
| `setOracle(address,address,uint8)` | NormalTimelock |
| `setTokenConfig(TokenConfig)` | CriticalTimelock, FastTrackTimelock, Guardian 3, NormalTimelock |
| `unpause()` | CriticalTimelock, FastTrackTimelock, Guardian 3, NormalTimelock |

## RiskFundBuyback / RiskFundBuyback_Proxy (`0x0c71EFabD00329E839745ef23aB946d3ed24A805`)

| Function | Grantees |
| --- | --- |
| `executeBuyback(address,uint256,uint256,uint256,address,bytes,address)` | 0x88ac9ca69A371f47798Df18e5C36449af44526a4 |
| `forwardBaseAsset(address,uint256)` | 0x88ac9ca69A371f47798Df18e5C36449af44526a4 |

## RiskFundConverter / RiskFundConverter_Proxy (`0xA5622D276CcbB8d9BBE3D1ffd1BB11a0032E53F0`)

| Function | Grantees |
| --- | --- |
| `pauseConversion()` | CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock |
| `resumeConversion()` | CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock |
| `setConversionConfig(address,address,ConversionConfig)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setMinAmountToConvert(uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setPoolsAssetsDirectTransfer(address[],address[][],bool[][])` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `sweepToken(address,address,uint256)` | NormalTimelock |

## RiskFundV2 / RiskFundV2_Proxy (`0xdF31a28D68A2AB381D42b380649Ead7ae2A76E42`)

| Function | Grantees |
| --- | --- |
| `setMinAmountToConvert(uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `swapPoolsAssets(address[],uint256[],address[][],uint256)` | Guardian 1 |

## RiskOracle / RiskOracle_Proxy (`0x0E3E51958b0Daa8C57c949675975CBEDd7b5a1a1`)

| Function | Grantees |
| --- | --- |
| `addAuthorizedSender(address)` | NormalTimelock |
| `addUpdateType(string)` | FastTrackTimelock, NormalTimelock |
| `removeAuthorizedSender(address)` | CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock |
| `setUpdateTypeActive(string,bool)` | CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock |

## RiskStewardReceiver / RiskStewardReceiver_Proxy (`0x47856bFa74B71d24a5545c7506862B8FddE52baB`)

| Function | Grantees |
| --- | --- |
| `setConfigActive(string,bool)` | CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock |
| `setPaused(bool)` | CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock |
| `setRiskParameterConfig(string,address,uint256,uint256)` | FastTrackTimelock, NormalTimelock |
| `setWhitelistedExecutor(address,bool)` | CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock |

## Shortfall / Shortfall_Proxy (`0xf37530A8a810Fcb501AA0Ecd0B0699388F0F2209`)

| Function | Grantees |
| --- | --- |
| `pauseAuctions()` | CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock |
| `resumeAuctions()` | CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock |
| `updateIncentiveBps(uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `updateMinimumPoolBadDebt(uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `updateNextBidderBlockLimit(uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `updateWaitForFirstBidder(uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |

## SolvBTCFundamentalChainlinkOracle / SolvBTCFundamentalChainlinkOracle_Proxy (`0x4521589226ef07d9805936de42F1ACF394B2B221`)

| Function | Grantees |
| --- | --- |
| `setDirectPrice(address,uint256)` | NormalTimelock |
| `setTokenConfig(TokenConfig)` | NormalTimelock |

## Unitroller / Unitroller_Proxy (`0xfD36E2c2a6789Db23113685031d7F16329158384`)

| Function | Grantees |
| --- | --- |
| `_setActionsPaused(address[],uint8[],bool)` | 0x35eBaBB99c7Fb7ba0C90bCc26e5d55Cdf89C23Ec, 0x3f033c0827acb54a791EaaaE90d820f223Acf8e3, CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock |
| `_setCollateralFactor(address,uint256)` | Guardian 1 |
| `_setForcedLiquidation(address,bool)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `_setForcedLiquidationForUser(address,address,bool)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `_setMarketBorrowCaps(address[],uint256[])` | 0x35eBaBB99c7Fb7ba0C90bCc26e5d55Cdf89C23Ec, CriticalTimelock, FastTrackTimelock, Guardian 1, MarketCapsRiskSteward / MarketCapsRiskSteward_Proxy, NormalTimelock |
| `_setMarketSupplyCaps(address[],uint256[])` | 0x35eBaBB99c7Fb7ba0C90bCc26e5d55Cdf89C23Ec, CriticalTimelock, FastTrackTimelock, Guardian 1, MarketCapsRiskSteward / MarketCapsRiskSteward_Proxy, NormalTimelock |
| `_setProtocolPaused(bool)` | CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock |
| `_supportMarket(address)` | NormalTimelock |
| `addPoolMarkets(uint96[],address[])` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `createPool(string)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `removePoolMarket(uint96,address)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `seizeVenus(address[],address,address[])` | CriticalTimelock, FastTrackTimelock, Guardian 1, NormalTimelock |
| `seizeVenus(address[],address)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setAllowCorePoolFallback(uint96,bool)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setCollateralFactor(address,uint256,uint256)` | 0x35eBaBB99c7Fb7ba0C90bCc26e5d55Cdf89C23Ec, CriticalTimelock, FastTrackTimelock, Guardian 1, NormalTimelock |
| `setCollateralFactor(uint96,address,uint256,uint256)` | 0x35eBaBB99c7Fb7ba0C90bCc26e5d55Cdf89C23Ec, CollateralFactorsRiskSteward / CollateralFactorsRiskSteward_Proxy, CriticalTimelock, FastTrackTimelock, Guardian 1, NormalTimelock |
| `setDeviationBoundedOracle(address)` | Guardian 2, NormalTimelock |
| `setFlashLoanPaused(bool)` | 0x35eBaBB99c7Fb7ba0C90bCc26e5d55Cdf89C23Ec, CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock |
| `setIsBorrowAllowed(uint96,address,bool)` | 0x35eBaBB99c7Fb7ba0C90bCc26e5d55Cdf89C23Ec, CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock |
| `setLiquidationIncentive(address,uint256)` | NormalTimelock |
| `setLiquidationIncentive(uint96,address,uint256)` | NormalTimelock |
| `setPoolActive(uint96,bool)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setPoolLabel(uint96,string)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setWhiteListFlashLoanAccount(address,bool)` | 0x35eBaBB99c7Fb7ba0C90bCc26e5d55Cdf89C23Ec, CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock |
| `unlistMarket(address)` | CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock |

## UPrimeBuyback / UPrimeBuyback_Proxy (`0xBC9fFBfb799B2d189669D3816E2B7273c69041bd`)

| Function | Grantees |
| --- | --- |
| `executeBuyback(address,uint256,uint256,uint256,address,bytes,address)` | 0x88ac9ca69A371f47798Df18e5C36449af44526a4 |
| `forwardBaseAsset(address,uint256)` | 0x88ac9ca69A371f47798Df18e5C36449af44526a4 |

## USDCPrimeConverter (`0xa758c9C215B6c4198F0a0e3FA46395Fa15Db691b`)

| Function | Grantees |
| --- | --- |
| `pauseConversion()` | CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock |
| `resumeConversion()` | CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock |
| `setConversionConfig(address,address,ConversionConfig)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setMinAmountToConvert(uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |

## USDCTreasuryBuyback / USDCTreasuryBuyback_Proxy (`0xd7aC40f9bd9A1beb8E2d121b4446CF90417cf169`)

| Function | Grantees |
| --- | --- |
| `executeBuyback(address,uint256,uint256,uint256,address,bytes,address)` | 0x88ac9ca69A371f47798Df18e5C36449af44526a4 |
| `forwardBaseAsset(address,uint256)` | 0x88ac9ca69A371f47798Df18e5C36449af44526a4 |

## USDTChainlinkOracle / USDTChainlinkOracle_Proxy (`0x22Dc2BAEa32E95AB07C2F5B8F63336CbF61aB6b8`)

| Function | Grantees |
| --- | --- |
| `setDirectPrice(address,uint256)` | CriticalTimelock, FastTrackTimelock, Guardian 3, NormalTimelock |
| `setTokenConfig(TokenConfig)` | CriticalTimelock, FastTrackTimelock, Guardian 3, NormalTimelock |

## USDTPrimeBuyback / USDTPrimeBuyback_Proxy (`0xD721932C7CA41Eb5305867287010587a266346a8`)

| Function | Grantees |
| --- | --- |
| `executeBuyback(address,uint256,uint256,uint256,address,bytes,address)` | 0x88ac9ca69A371f47798Df18e5C36449af44526a4 |
| `forwardBaseAsset(address,uint256)` | 0x88ac9ca69A371f47798Df18e5C36449af44526a4 |

## USDTPrimeConverter (`0xD9f101AA67F3D72662609a2703387242452078C3`)

| Function | Grantees |
| --- | --- |
| `pauseConversion()` | CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock |
| `resumeConversion()` | CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock |
| `setConversionConfig(address,address,ConversionConfig)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setMinAmountToConvert(uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `sweepToken(address,address,uint256)` | NormalTimelock |

## USDTTreasuryBuyback / USDTTreasuryBuyback_Proxy (`0xB3dDf13E8B6b8dE10F5826087C202b80F1D1b490`)

| Function | Grantees |
| --- | --- |
| `executeBuyback(address,uint256,uint256,uint256,address,bytes,address)` | 0x88ac9ca69A371f47798Df18e5C36449af44526a4 |
| `forwardBaseAsset(address,uint256)` | 0x88ac9ca69A371f47798Df18e5C36449af44526a4 |

## UTreasuryBuyback / UTreasuryBuyback_Proxy (`0xec63411423D03327De19135446dDdA3055D2feA8`)

| Function | Grantees |
| --- | --- |
| `executeBuyback(address,uint256,uint256,uint256,address,bytes,address)` | 0x88ac9ca69A371f47798Df18e5C36449af44526a4 |
| `forwardBaseAsset(address,uint256)` | 0x88ac9ca69A371f47798Df18e5C36449af44526a4 |

## VaiUnitroller / VaiUnitroller_Proxy (`0x004065D34C6b18cE4370ced1CeBDE94865DbFAFE`)

| Function | Grantees |
| --- | --- |
| `setBaseRate(uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setFloatRate(uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setMintCap(uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `toggleOnlyPrimeHolderMint()` | CriticalTimelock, FastTrackTimelock, NormalTimelock |

## VAIVaultProxy / VAIVaultProxy_Proxy (`0x0667Eed0a0aAb930af74a3dfeDD263A73994f216`)

| Function | Grantees |
| --- | --- |
| `pause()` | CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock |
| `resume()` | CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock |

## VBNBAdmin / VBNBAdmin_Proxy (`0x9A7890534d9d91d473F28cB97962d176e2B65f1d`)

| Function | Grantees |
| --- | --- |
| `setInterestRateModel(address)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |

## VRTVaultProxy / VRTVaultProxy_Proxy (`0x98bF4786D72AAEF6c714425126Dd92f149e3F334`)

| Function | Grantees |
| --- | --- |
| `pause()` | CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock |
| `resume()` | CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock |
| `setLastAccruingBlock(uint256)` | NormalTimelock |
| `withdrawBep20(address,address,uint256)` | NormalTimelock |

## vUNI (`0x27FF564707786720C71A2e5c1490A63266683612`)

| Function | Grantees |
| --- | --- |
| `_setReserveFactor(uint256)` | NormalTimelock |
| `setReduceReservesBlockDelta(uint256)` | NormalTimelock |

## WBNBBurnConverter (`0x9eF79830e626C8ccA7e46DCEd1F90e51E7cFCeBE`)

| Function | Grantees |
| --- | --- |
| `pauseConversion()` | CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock |
| `resumeConversion()` | CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock |
| `setConversionConfig(address,address,ConversionConfig)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setMinAmountToConvert(uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |

## XVSBridgeAdmin / XVSBridgeAdmin_Proxy (`0x70d644877b7b73800E9073BCFCE981eAaB6Dbc21`)

| Function | Grantees |
| --- | --- |
| `dropFailedMessage(uint16,bytes,uint64)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `fallbackDeposit(address,uint256)` | NormalTimelock |
| `fallbackWithdraw(address,uint256)` | NormalTimelock |
| `forceResumeReceive(uint16,bytes)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `pause()` | CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock |
| `removeTrustedRemote(uint16)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setConfig(uint16,uint16,uint256,bytes)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setMaxDailyLimit(uint16,uint256)` | CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock |
| `setMaxDailyReceiveLimit(uint16,uint256)` | CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock |
| `setMaxSingleReceiveTransactionLimit(uint16,uint256)` | CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock |
| `setMaxSingleTransactionLimit(uint16,uint256)` | CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock |
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
| `unpause()` | CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock |
| `updateSendAndCallEnabled(bool)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |

## XVSBuyback / XVSBuyback_Proxy (`0x637E6246BBb0F9aBae9d764F5e1bB6347f028C12`)

| Function | Grantees |
| --- | --- |
| `executeBuyback(address,uint256,uint256,uint256,address,bytes,address)` | 0x88ac9ca69A371f47798Df18e5C36449af44526a4 |
| `forwardBaseAsset(address,uint256)` | 0x88ac9ca69A371f47798Df18e5C36449af44526a4 |

## XVSTreasuryBuyback / XVSTreasuryBuyback_Proxy (`0x6D2d239c16453062cF145A7a5128A6a60710d236`)

| Function | Grantees |
| --- | --- |
| `executeBuyback(address,uint256,uint256,uint256,address,bytes,address)` | 0x88ac9ca69A371f47798Df18e5C36449af44526a4 |
| `forwardBaseAsset(address,uint256)` | 0x88ac9ca69A371f47798Df18e5C36449af44526a4 |

## XVSVaultConverter (`0xd5b9AE835F4C59272032B3B954417179573331E0`)

| Function | Grantees |
| --- | --- |
| `pauseConversion()` | CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock |
| `resumeConversion()` | CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock |
| `setConversionConfig(address,address,ConversionConfig)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setMinAmountToConvert(uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `sweepToken(address,address,uint256)` | NormalTimelock |

## XVSVaultProxy / XVSVaultProxy_Proxy (`0x051100480289e704d20e9DB4804837068f3f9204`)

| Function | Grantees |
| --- | --- |
| `add(address,uint256,address,uint256,uint256)` | NormalTimelock |
| `pause()` | 0xCCa5a587eBDBe80f23c8610F2e53B03158e62948, CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock |
| `resume()` | CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock |
| `set(address,uint256,uint256)` | NormalTimelock |
| `setBlocksPerYear(uint256)` | NormalTimelock |
| `setRewardAmountPerBlockOrSecond(address,uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setWithdrawalLockingPeriod(address,uint256,uint256)` | NormalTimelock |

## XVSVaultTreasury / XVSVaultTreasury_Proxy (`0x269ff7818DB317f60E386D2be0B259e1a324a40a`)

| Function | Grantees |
| --- | --- |
| `fundXVSVault(uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |

## ⚠️ Unresolved roles

| Role hash | Grantees | Transactions |
| --- | --- | --- |
| `0x0048eafbc9d5b8641522394a9ebf2919803c3520fdeed025a94a6ca99a4f4f9e` | CriticalTimelock, FastTrackTimelock, Guardian 1, NormalTimelock | 0x09c01110d285f106048166b4ad642179b6c6fe5933a2a8a39199d8c64b91dfbf |
| `0x016f7b214779aa1bba7d253a126f42a16b920c265efd8208c26679cab6138904` | CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock | 0xa1efe72f8a0d04dac37d744c6d05860ec774cddc1b5b628a4663d3f97c3f7434 |
| `0x0604dbaf887861368e4a1ccc4b591586e31c0547c163db592a1acb2d83216133` | CriticalTimelock, FastTrackTimelock, Guardian 1, NormalTimelock | 0x02912c34b939446b52aa4e9998c369934fc57c08a5eb76b78483d4a5474f1a87 |
| `0x07bdf4f2d252133a375fd57e9d351a68a7525fec01ffd592c54b15f86bacc78e` | CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock | 0xa1efe72f8a0d04dac37d744c6d05860ec774cddc1b5b628a4663d3f97c3f7434 |
| `0x07def8746c3db9ffdfb7b5c8216298a77afea07be6785e87f463a2852dc1ecde` | CriticalTimelock, FastTrackTimelock, Guardian 1, NormalTimelock | 0x02912c34b939446b52aa4e9998c369934fc57c08a5eb76b78483d4a5474f1a87 |
| `0x0a631aebacb5c9e54e571e6efd84322582c88cddcde6f000ff3741642912867d` | NormalTimelock | 0x8cd0d1e5c9bc841b48cef99a325f12918dc917f51ce7489ed9deb98e0c01cbaa |
| `0x11708261739521733142e4ed10fe864937773f2e8d6ab1ef8f7ee35d9feeda65` | CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock | 0x7ca107b179ed22a3e3fb3b9e935d1f8642e984fe44021b46e9849c98f058604f |
| `0x119449078ef938edb95176d01e95d21e874e2d49dcbc05a3a3e3f41ef3fb03ca` | CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock | 0xc1ff66761b80f62b95529f081507afe89d61c490ad5329bfa57ec81b9239853d |
| `0x1225e28e307f85fbb3f1a2215adfa8a9f4a57d56517719839cd1fb5082d7720c` | 0x61859C84E0C6aB7B5A9801A962C660477f31a2D3 | 0x222b104cca1da34cd11c0dc3510ac3978c3e31e3ee5d0475961c93308c9aff94 |
| `0x16acef25b94fd5577c87fb33463ab369a330798d9543a5743fb07132881385bd` | CriticalTimelock, FastTrackTimelock, NormalTimelock | 0x82ac93057c6abbe956af9fd94e9de8f88b52242e9b975457a3573e330f32722a |
| `0x1faf26e2157a1495d823d3c6b82fae652f8efd507967754c3c971fdfe4ae1669` | CriticalTimelock, FastTrackTimelock, Guardian 1, NormalTimelock | 0x02912c34b939446b52aa4e9998c369934fc57c08a5eb76b78483d4a5474f1a87 |
| `0x2108c797a7ab7558acff6f084ff27b98f19a429b937a18a07d979dc4f4120904` | CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock | 0x222b104cca1da34cd11c0dc3510ac3978c3e31e3ee5d0475961c93308c9aff94 |
| `0x226d8205eacfb4b5362c135b437312fad377b2081dae1a873473850233eacf44` | CriticalTimelock, FastTrackTimelock, NormalTimelock | 0x02912c34b939446b52aa4e9998c369934fc57c08a5eb76b78483d4a5474f1a87 |
| `0x22eb8122b88459f3919d73aa77136d05aef22e685f01db4f301494a90a9eafd8` | CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock | 0xc1ff66761b80f62b95529f081507afe89d61c490ad5329bfa57ec81b9239853d |
| `0x286c30af1c72291e02516949eff3d18964d2e196a254e434f9c9056fe76b2a2e` | CriticalTimelock, FastTrackTimelock, Guardian 1, NormalTimelock | 0x02912c34b939446b52aa4e9998c369934fc57c08a5eb76b78483d4a5474f1a87 |
| `0x297d8c64384ce0d120f390fec742fe4eef0edec03c5a11160ac09be4e3b477be` | NormalTimelock | 0x7ca107b179ed22a3e3fb3b9e935d1f8642e984fe44021b46e9849c98f058604f |
| `0x2a19abfaa83a138f72441c871363f3fc2dade6481abe9d49d4d6f68ad00bbc19` | CriticalTimelock, FastTrackTimelock, NormalTimelock | 0x82ac93057c6abbe956af9fd94e9de8f88b52242e9b975457a3573e330f32722a |
| `0x2c218d94e60aa4c8dbf7f3983eaff74b6b7bbe66ae4d6e8f5ce248af5e80b291` | NormalTimelock | 0xf43966308d84af1ec3d58da914435282bb6272d5b4141349bf22588eb2054d25 |
| `0x2c6f491ae63bf4591f27f2224112475f5b34472cb92a0b8fa4a5372035948e46` | CriticalTimelock, FastTrackTimelock, Guardian 1, NormalTimelock | 0x02912c34b939446b52aa4e9998c369934fc57c08a5eb76b78483d4a5474f1a87 |
| `0x2f404a3e95b93b51eb821d7042d70628066eabd2113666c9420c4268108ee852` | CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock | 0xa23d3a2d79858e93c409a5ea3ac15a65c23ee56fcb7132d4afd97525622a5854 |
| `0x30c2f2ddbc5f11430f9a897c9b6a7ab5914ef8dfc33714980194a83ad042aa20` | 0x0b086B866A5A91D5882ed355a34d268c62f8BE66, CriticalTimelock, FastTrackTimelock, NormalTimelock, SetCheckpointBscmainnet | 0x7ca107b179ed22a3e3fb3b9e935d1f8642e984fe44021b46e9849c98f058604f, 0x0afcd30140672b69b3f06084ff15863a66a6a71c559de4498d026591bb322ba3, 0x6a01a7c04652b7746a870dc5accd04612e6bc5e860a929f2a4e9c039780cce71, 0x2ffe79fdef9bf7de1ac099980c3b6cc51735985d14f9dcf442ef5ae0ffce5b31 |
| `0x3287924616b007513ca6d95a61611553708268dbc45a1152f07e39045139a018` | 0x6599C15cc8407046CD91E5c0F8B7f765fF914870, 0xCCa5a587eBDBe80f23c8610F2e53B03158e62948, 0xDd541A1b065F9587b01815a390a4d4559D7b630F, CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock | 0xa1efe72f8a0d04dac37d744c6d05860ec774cddc1b5b628a4663d3f97c3f7434, 0x222b104cca1da34cd11c0dc3510ac3978c3e31e3ee5d0475961c93308c9aff94 |
| `0x335b3633d9ce1a0b46f8c2c78a22ad3b05885ed129cafb3b2ba2378c12ca0853` | 0xCCa5a587eBDBe80f23c8610F2e53B03158e62948, 0xDd541A1b065F9587b01815a390a4d4559D7b630F, CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock | 0xa1efe72f8a0d04dac37d744c6d05860ec774cddc1b5b628a4663d3f97c3f7434, 0x222b104cca1da34cd11c0dc3510ac3978c3e31e3ee5d0475961c93308c9aff94 |
| `0x355f72e96c4a7976cf3b627c02ede59bda6fbbbfe61cbf774c237aba50f7300f` | CriticalTimelock, FastTrackTimelock, Guardian 1, Legacy (old BNBPermissions.json (pending fresh-extraction diff, Task 6)), NormalTimelock, PoolRegistry / PoolRegistry_Proxy | 0x7ca107b179ed22a3e3fb3b9e935d1f8642e984fe44021b46e9849c98f058604f, 0x10942095b896ed312f8bd113d704707825e90ed7296d3069d2b1954ccb3c752c |
| `0x36b8cf6e4506cecb9a478bb7a01551dd0cac7eaeef7fdeb24481c33990aeb8c8` | PoolRegistry / PoolRegistry_Proxy | 0x7ca107b179ed22a3e3fb3b9e935d1f8642e984fe44021b46e9849c98f058604f |
| `0x39c07db57946c86434c884b733ec6f66c53f600de4868187f7532c022ba72ad6` | CriticalTimelock, FastTrackTimelock, NormalTimelock | 0x9fe8f67d9c813e6711e3bf3bfd71f70a527eed8ba27d12c59c638e7bab33c9d0 |
| `0x3c1b1aa2aae9a249d6ad24fe8012fc34c06c9d82e9cde88f8d0d4d8533bba925` | CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock | 0xe5c0e4e57ad836bc10a3ad4e8374935ef5c680da58a728984fa61f42ebe8ef95 |
| `0x4440743cd921883dd44bbea7863ef5925608feb2b0cf77fd11e2747b99aef769` | CriticalTimelock, FastTrackTimelock, Guardian 1, NormalTimelock | 0x02912c34b939446b52aa4e9998c369934fc57c08a5eb76b78483d4a5474f1a87 |
| `0x45bfaf596e23d9d35c6e3a0151fa0713795dad89cfac32c2e7600b0da1cb8139` | NormalTimelock | 0x7ca107b179ed22a3e3fb3b9e935d1f8642e984fe44021b46e9849c98f058604f |
| `0x47beb19f7997bd078604ead64a750dddddafeaa4b7284691a19db5d587731730` | 0x8504EF43463c1edC9897182c6e17C0ad47B9Ad31, 0xB3eE9073a1a394ef242d27267C1A5D3b9ed739fA, 0xCD6956823F1Aaa5be19a6827aFC6d32AD1ef8800, CriticalTimelock, FastTrackTimelock, IRMRiskSteward / IRMRiskSteward_Proxy, NormalTimelock | 0x9fe8f67d9c813e6711e3bf3bfd71f70a527eed8ba27d12c59c638e7bab33c9d0, 0x6a01a7c04652b7746a870dc5accd04612e6bc5e860a929f2a4e9c039780cce71, 0x2ffe79fdef9bf7de1ac099980c3b6cc51735985d14f9dcf442ef5ae0ffce5b31, 0xada3df1461c24e37fcc12f355fb98a81da01f4cf881fd242abfa43f3aebb2e32, 0xfec2001a460f1126b6a4ffd51805305664996aed6a30f554fb93bafe9c9cbc0c |
| `0x4b7a5fa404045b9768d561954e641872666d172b2c12d403992ff147e5795fcb` | CriticalTimelock, FastTrackTimelock, Guardian 1, NormalTimelock | 0x09c01110d285f106048166b4ad642179b6c6fe5933a2a8a39199d8c64b91dfbf |
| `0x4d18a59fb4e2b7acb539c410224c63a05e3faddab849b23257a418c5fc1fad50` | CriticalTimelock, FastTrackTimelock, NormalTimelock | 0x7ca107b179ed22a3e3fb3b9e935d1f8642e984fe44021b46e9849c98f058604f, 0x0afcd30140672b69b3f06084ff15863a66a6a71c559de4498d026591bb322ba3 |
| `0x5696a4adbfb03a7b180045722acb9bc57e442006b1077afc4c444c25e9c8dfce` | NormalTimelock | 0x7ca107b179ed22a3e3fb3b9e935d1f8642e984fe44021b46e9849c98f058604f |
| `0x576f5c8425cb8e915431718cf215d3a0461ce2968d607c53b8fb86fd1ef28c6e` | CriticalTimelock, FastTrackTimelock, Guardian 1, NormalTimelock, PoolRegistry / PoolRegistry_Proxy | 0x7ca107b179ed22a3e3fb3b9e935d1f8642e984fe44021b46e9849c98f058604f |
| `0x5a02e80b9cba1b8500807bf0c3a24a92c3b4dd68ddc5c09615250b108385a3d9` | 0xCCa5a587eBDBe80f23c8610F2e53B03158e62948, CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock | 0xa1efe72f8a0d04dac37d744c6d05860ec774cddc1b5b628a4663d3f97c3f7434 |
| `0x5d9d645d3418af55d4672a32f8cdf41f6ccff033daa50cad9948e5aade8fda4f` | CriticalTimelock, FastTrackTimelock, Guardian 1, NormalTimelock | 0x02912c34b939446b52aa4e9998c369934fc57c08a5eb76b78483d4a5474f1a87 |
| `0x607c613132c4899ad9b680d9a0280b4dfe6b5aba63219a6aec7f5feab9410e0d` | CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock | 0x2b6e1d55c3abdee008a5ef105aea9db9a7b5261f3319d2bf7530786e352d1abd |
| `0x672979ac1388ec49b9f81a6b34d4f4edd743ca63fcd1806ddd189262e5939d88` | CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock | 0xe5c0e4e57ad836bc10a3ad4e8374935ef5c680da58a728984fa61f42ebe8ef95 |
| `0x67b1f52883b06773d1a1720f20154ff9e3c80bbce3cbe78bcccfef8cf43f6f99` | NormalTimelock | 0xc1ff66761b80f62b95529f081507afe89d61c490ad5329bfa57ec81b9239853d |
| `0x68342efdd1848a9bf15af0f3a609735658cb72f0b2ff52af21b83730da663919` | CriticalTimelock, FastTrackTimelock, Guardian 1, NormalTimelock | 0x09c01110d285f106048166b4ad642179b6c6fe5933a2a8a39199d8c64b91dfbf |
| `0x68a7c211fdfb37d9043a4400ef412f207b3268c1e32b99647f03ef55213697b0` | CriticalTimelock, FastTrackTimelock, Guardian 1, NormalTimelock | 0x02912c34b939446b52aa4e9998c369934fc57c08a5eb76b78483d4a5474f1a87 |
| `0x6fb9478849ad9d56ec8375813c72baf41376c74f06a1d7c50de15592ae2d113d` | CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock | 0xc1ff66761b80f62b95529f081507afe89d61c490ad5329bfa57ec81b9239853d |
| `0x734ec16d72e74ab504681c41f48889c70af1bd2d7982b3d50b9100b2c185f12c` | CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock | 0xa23d3a2d79858e93c409a5ea3ac15a65c23ee56fcb7132d4afd97525622a5854 |
| `0x73e63cf1ba0c0ff74399ebe927a3caf9a8ecfdf265b816db2fb8bb9431e3b2b9` | NormalTimelock, PoolRegistry / PoolRegistry_Proxy | 0x7ca107b179ed22a3e3fb3b9e935d1f8642e984fe44021b46e9849c98f058604f |
| `0x77bc43936a3d8cdd37e18f660978b6558964eb8538ef409ab30ff025fe3c8cb4` | CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock | 0xc1ff66761b80f62b95529f081507afe89d61c490ad5329bfa57ec81b9239853d |
| `0x790c3ff831c38b9396fc7179bc4471651d15da2a887e166575d927a67448a131` | NormalTimelock, PoolRegistry / PoolRegistry_Proxy | 0x7ca107b179ed22a3e3fb3b9e935d1f8642e984fe44021b46e9849c98f058604f |
| `0x7a391eefdc1290938dee6943b808b5d126fd2e3e06395d0af954742298c18cef` | CriticalTimelock, FastTrackTimelock | 0x02912c34b939446b52aa4e9998c369934fc57c08a5eb76b78483d4a5474f1a87 |
| `0x7ec8835de19489dbe57ce48011aacd919daa62605dca726cf3925c9279daf414` | 0xCCa5a587eBDBe80f23c8610F2e53B03158e62948, 0xDd541A1b065F9587b01815a390a4d4559D7b630F, CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock | 0xa1efe72f8a0d04dac37d744c6d05860ec774cddc1b5b628a4663d3f97c3f7434, 0x222b104cca1da34cd11c0dc3510ac3978c3e31e3ee5d0475961c93308c9aff94 |
| `0x7ee4ddbdcf7d20893f347ca33c8924407e9301f86d4078e172389092f301b5d8` | NormalTimelock | 0xefcafcfda332bd5de6bd18ba3a65d7c851681fdd2233c8f59ef99b831c47cba0 |
| `0x808a205a42d1b35c5925ae527d8c4a0007cc98ac925b63313496b536d29f3823` | CriticalTimelock, FastTrackTimelock, NormalTimelock | 0x82ac93057c6abbe956af9fd94e9de8f88b52242e9b975457a3573e330f32722a |
| `0x8d74ee62ba1d72709605601aff6dc054c2683ce2467707fbf052a4e54b9be24a` | NormalTimelock | 0x2b6e1d55c3abdee008a5ef105aea9db9a7b5261f3319d2bf7530786e352d1abd |
| `0x8ff8122ad90b8546f0caf3592bedf1cfdc8383e2c648d7837cbc6c39193fc730` | 0x6599C15cc8407046CD91E5c0F8B7f765fF914870, 0xCCa5a587eBDBe80f23c8610F2e53B03158e62948, 0xDd541A1b065F9587b01815a390a4d4559D7b630F, CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock | 0xa1efe72f8a0d04dac37d744c6d05860ec774cddc1b5b628a4663d3f97c3f7434, 0x222b104cca1da34cd11c0dc3510ac3978c3e31e3ee5d0475961c93308c9aff94 |
| `0x900b24710b47341931d870f7c88ab8678379d82ca945c50d361f16191eabe24a` | CriticalTimelock, FastTrackTimelock, Guardian 1, NormalTimelock | 0x02912c34b939446b52aa4e9998c369934fc57c08a5eb76b78483d4a5474f1a87 |
| `0x9022c522bb4fd3dcc160058b746c6a15fe416ba099f3658ecef34c307a8222d4` | CriticalTimelock, FastTrackTimelock, NormalTimelock | 0x0e3152d9c982ca69b1cbb535018a0d390321ecdaa8dcad2a131b44489173bef1 |
| `0x9157241a792ab2f6b840408c8491862f7e80cf14420b95b8478fe973a80bf5ad` | CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock | 0xa23d3a2d79858e93c409a5ea3ac15a65c23ee56fcb7132d4afd97525622a5854 |
| `0x975242edb3220bac26df05b31489602d6291a6e0dbd3e15ebc837d95fd8d063f` | CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock | 0xa23d3a2d79858e93c409a5ea3ac15a65c23ee56fcb7132d4afd97525622a5854 |
| `0x99c519bb2e35ad7ebdafcbc7401b73cad7d3fcbffffc52f715218e22e7af8598` | CriticalTimelock, FastTrackTimelock, NormalTimelock | 0x02912c34b939446b52aa4e9998c369934fc57c08a5eb76b78483d4a5474f1a87 |
| `0x9b9b7c52755b3912e2729371cec4ae32d0c9a0a183748db962c6a6effbc762aa` | NormalTimelock | 0x7ca107b179ed22a3e3fb3b9e935d1f8642e984fe44021b46e9849c98f058604f |
| `0x9ed22e82ceea51953d758b06c623c3a89cc30431c1a595ac66161e6d35f8d10c` | CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock | 0xc1ff66761b80f62b95529f081507afe89d61c490ad5329bfa57ec81b9239853d |
| `0xa1d9c1dc5557d1799c38f176de59e1d4559faaeac0a5789142a987f201407961` | Guardian 1, NormalTimelock | 0x02912c34b939446b52aa4e9998c369934fc57c08a5eb76b78483d4a5474f1a87 |
| `0xa834a341b4f2c8ea2d6a21961ec8d98627b7262a1b00d16abfbde17d020008bb` | NormalTimelock | 0x7ca107b179ed22a3e3fb3b9e935d1f8642e984fe44021b46e9849c98f058604f |
| `0xae6956f2f447aedf791137cf371c17874dc44724aeaaa2f884b05a0925174daa` | 0x6599C15cc8407046CD91E5c0F8B7f765fF914870, 0xCCa5a587eBDBe80f23c8610F2e53B03158e62948, 0xDd541A1b065F9587b01815a390a4d4559D7b630F, CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock | 0xa1efe72f8a0d04dac37d744c6d05860ec774cddc1b5b628a4663d3f97c3f7434, 0x222b104cca1da34cd11c0dc3510ac3978c3e31e3ee5d0475961c93308c9aff94 |
| `0xaf406103ec2169b01218de03363bf79432889579fafcc297ff523f83aba3e1cb` | NormalTimelock, PoolRegistry / PoolRegistry_Proxy | 0x7ca107b179ed22a3e3fb3b9e935d1f8642e984fe44021b46e9849c98f058604f |
| `0xb664f6f233bfc446550797c9ebd39a0d4584e004eb0bd349c82fd878af7bcc9f` | NormalTimelock | 0xefcafcfda332bd5de6bd18ba3a65d7c851681fdd2233c8f59ef99b831c47cba0 |
| `0xb6ce117c30968fae931628e983c99c7d8e6a3c0737417b2db8bcd687751fdb18` | CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock | 0xc8b8fc07985f6d117ca16f72bdecb4df89fb4265cfe4c4886f89e1c592aeb8d1 |
| `0xbaf2c6a1ad605d32f0e24cd657f0b91fb54ccc25a594acce15c339d397c69e47` | 0x61859C84E0C6aB7B5A9801A962C660477f31a2D3 | 0x222b104cca1da34cd11c0dc3510ac3978c3e31e3ee5d0475961c93308c9aff94 |
| `0xbb68b1a35ef4d217e874ba0ea780bffc773705897ac3b28bf36229ddc5c89902` | 0xCCa5a587eBDBe80f23c8610F2e53B03158e62948, CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock | 0xa1efe72f8a0d04dac37d744c6d05860ec774cddc1b5b628a4663d3f97c3f7434 |
| `0xbc1c8068b284f71b0a1ac151989a4580e4fd047549c7dd872c5ce44b45210cd0` | NormalTimelock | 0x7ca107b179ed22a3e3fb3b9e935d1f8642e984fe44021b46e9849c98f058604f |
| `0xbe328165812762cda5c96a1329c1520bc065f456f9cee5d218383c9d9bbabbe0` | CriticalTimelock, FastTrackTimelock, Guardian 1, NormalTimelock | 0x02912c34b939446b52aa4e9998c369934fc57c08a5eb76b78483d4a5474f1a87 |
| `0xbe720f710025ac61a1c95526a08296d592f33f09fd53c5aeff9a693f4ac64a88` | CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock | 0xa23d3a2d79858e93c409a5ea3ac15a65c23ee56fcb7132d4afd97525622a5854 |
| `0xcfab3bdd8b559d9181ead274829a6f4bc097f25a365bb5f2a6d526f6a24b453d` | Guardian 1, NormalTimelock | 0x02912c34b939446b52aa4e9998c369934fc57c08a5eb76b78483d4a5474f1a87 |
| `0xd0457cbd80bd968e7840dd36fba798550c3b256af04575d456e204a8ee5a4835` | CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock | 0xc1ff66761b80f62b95529f081507afe89d61c490ad5329bfa57ec81b9239853d |
| `0xd17080b06acc43ba3e03655af6c749f48497c8188d956f9a45a850b1efb521f1` | Guardian 1, NormalTimelock | 0x02912c34b939446b52aa4e9998c369934fc57c08a5eb76b78483d4a5474f1a87 |
| `0xd4195ddb3496f61e74e00d2c409618a4460010231b2fd159063c7ac068e45b4d` | 0x61859C84E0C6aB7B5A9801A962C660477f31a2D3 | 0x222b104cca1da34cd11c0dc3510ac3978c3e31e3ee5d0475961c93308c9aff94 |
| `0xd4bfdc449c0b8355fe4f19aeeeccd7f013db6a5d547ca65f847f4f4be2479dd8` | 0x61859C84E0C6aB7B5A9801A962C660477f31a2D3 | 0x222b104cca1da34cd11c0dc3510ac3978c3e31e3ee5d0475961c93308c9aff94 |
| `0xd5d3c9db46a4b330bd02c5f3826e762ddd81d508ddfce399a4c7b3311afb646e` | NormalTimelock | 0x02912c34b939446b52aa4e9998c369934fc57c08a5eb76b78483d4a5474f1a87 |
| `0xd69e1c0bfd7d22679fbb23e5967cae5caea9c8545d3f4b3430dd026c1d3bc590` | CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock | 0xa23d3a2d79858e93c409a5ea3ac15a65c23ee56fcb7132d4afd97525622a5854 |
| `0xd871a0ee041a19494589e5de87f713b0b111634d7c8140023e4e74f8320d348d` | CriticalTimelock, FastTrackTimelock, NormalTimelock | 0x02912c34b939446b52aa4e9998c369934fc57c08a5eb76b78483d4a5474f1a87 |
| `0xd964094e42d54d4693f9dafa8955aeafa21f604efb71d7e65062f89976589b17` | CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock | 0x2b6e1d55c3abdee008a5ef105aea9db9a7b5261f3319d2bf7530786e352d1abd |
| `0xda9c322a6ed0436a246009dc30da332a36e7439d4cd26009ea0ca2383f57cb74` | CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock | 0xc1ff66761b80f62b95529f081507afe89d61c490ad5329bfa57ec81b9239853d |
| `0xdafc8840a0075839df105aac0d4cc6f967fbdbee84f80222e97fed458590fca2` | 0xCCa5a587eBDBe80f23c8610F2e53B03158e62948, CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock | 0xa1efe72f8a0d04dac37d744c6d05860ec774cddc1b5b628a4663d3f97c3f7434 |
| `0xddffe30879ec010efd4eb13c9d5daf5c70a68d5b2d6a85fe28f888d0af63d7b6` | CriticalTimelock, FastTrackTimelock, NormalTimelock | 0x9fe8f67d9c813e6711e3bf3bfd71f70a527eed8ba27d12c59c638e7bab33c9d0 |
| `0xdf0e74fdbb56ebe599f22a8c36b0c8a07439529ac039f6eaf2c8835073b81735` | 0xCCa5a587eBDBe80f23c8610F2e53B03158e62948, CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock | 0xa1efe72f8a0d04dac37d744c6d05860ec774cddc1b5b628a4663d3f97c3f7434 |
| `0xdfcdfd51301dad3b4a3f24bd0427c2c7a2173a37dd8baec68944358bf9a52bb4` | CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock | 0xa23d3a2d79858e93c409a5ea3ac15a65c23ee56fcb7132d4afd97525622a5854 |
| `0xe04e5f2338185d5275d0be1224da5aedf139a226012ef4fcf67c0663eb4a7ab7` | 0xCCa5a587eBDBe80f23c8610F2e53B03158e62948, CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock | 0xa1efe72f8a0d04dac37d744c6d05860ec774cddc1b5b628a4663d3f97c3f7434 |
| `0xe1d75cb376c0e0ecdba2b662225bc3257036c838b9cac5248787faebc8442106` | CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock | 0xc1ff66761b80f62b95529f081507afe89d61c490ad5329bfa57ec81b9239853d |
| `0xe1f98a9e309e5004cf79a432f2616c25ae131cd7340ef8f1a54368dcbf1dbdf1` | CriticalTimelock, FastTrackTimelock, Guardian 1, Legacy (old BNBPermissions.json (pending fresh-extraction diff, Task 6)), NormalTimelock, PoolRegistry / PoolRegistry_Proxy | 0x7ca107b179ed22a3e3fb3b9e935d1f8642e984fe44021b46e9849c98f058604f, 0x10942095b896ed312f8bd113d704707825e90ed7296d3069d2b1954ccb3c752c |
| `0xe4019075f4a8d7a80428b4765bd8d520a284fa23d752e021fffa86e513b87c1a` | CriticalTimelock, FastTrackTimelock, NormalTimelock | 0x7ca107b179ed22a3e3fb3b9e935d1f8642e984fe44021b46e9849c98f058604f, 0x0afcd30140672b69b3f06084ff15863a66a6a71c559de4498d026591bb322ba3 |
| `0xea27a29f4069439ff2c0230332bc55996da51429d87e9e1c625c412c0a5cbd4d` | 0xCCa5a587eBDBe80f23c8610F2e53B03158e62948, CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock | 0xa1efe72f8a0d04dac37d744c6d05860ec774cddc1b5b628a4663d3f97c3f7434 |
| `0xeccf76dd28a5596b0ebf89b561bc4e7f6d31e5b728876a97a548f50154999d76` | CriticalTimelock, FastTrackTimelock, NormalTimelock | 0x02912c34b939446b52aa4e9998c369934fc57c08a5eb76b78483d4a5474f1a87 |
| `0xed03fd9cd07b97eb173f2c528221a2a1e60ce9780a6eb02d166d6558fee12fe3` | CriticalTimelock, FastTrackTimelock, NormalTimelock | 0x02912c34b939446b52aa4e9998c369934fc57c08a5eb76b78483d4a5474f1a87 |
| `0xf0c409a7fd2e4158432f8dc3616bd0e356154acec28dc27be6d70b6b2bf46ae5` | CriticalTimelock, FastTrackTimelock, Guardian 1, NormalTimelock | 0x02912c34b939446b52aa4e9998c369934fc57c08a5eb76b78483d4a5474f1a87 |
| `0xf2375cf2686cf5ab696208b774eddd4059cb5adfb3ae932adea78034c361469a` | CriticalTimelock, FastTrackTimelock, Guardian 1, NormalTimelock | 0x02912c34b939446b52aa4e9998c369934fc57c08a5eb76b78483d4a5474f1a87 |
| `0xf3457e7cb039864a6906290a1019aa9fbb52804ac06ba79e08e214ca648bcb4e` | Guardian 1, NormalTimelock | 0x02912c34b939446b52aa4e9998c369934fc57c08a5eb76b78483d4a5474f1a87 |
| `0xf3f4cac8f1dedede03f0405f5373144d5594eab1cc8ff11ca71973fdfe36e5e6` | CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock | 0xa23d3a2d79858e93c409a5ea3ac15a65c23ee56fcb7132d4afd97525622a5854 |
| `0xf756bc413ace5678c05bee94ea31b80e7813c4e6b1d901d0d460deba4d0a0a4c` | Guardian 1, NormalTimelock | 0x02912c34b939446b52aa4e9998c369934fc57c08a5eb76b78483d4a5474f1a87 |
| `0xfa2f83ec49a8b616dce2ff16dfada1681181cb68bc37f16bc8b1291ceff817e1` | CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock | 0xa1efe72f8a0d04dac37d744c6d05860ec774cddc1b5b628a4663d3f97c3f7434 |
| `0xfc22bf625583ca88d390f6d6dc7c9c273c322ba2e2f86e854f249193f54aa7bb` | 0xCCa5a587eBDBe80f23c8610F2e53B03158e62948, CriticalTimelock, FastTrackTimelock, Guardian 2, NormalTimelock | 0xa1efe72f8a0d04dac37d744c6d05860ec774cddc1b5b628a4663d3f97c3f7434 |
| `0xfe884e1a7e73192fca00b53165901aaadd8754002e2b8967a6ddcc9f5d89665e` | CriticalTimelock, FastTrackTimelock, NormalTimelock | 0x9fe8f67d9c813e6711e3bf3bfd71f70a527eed8ba27d12c59c638e7bab33c9d0 |
