# ACM Permissions — bscmainnet

Snapshot block: 112465173 · Updated: 2026-07-27 · Contracts: 68 · Permissions: 337 · Verification: ✅ verified on-chain (as of 2026-07-27)

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
| `addAuthorizedBatchers(address[])` | FastTrackTimelock, NormalTimelock |
| `executeBatch(uint256)` | FastTrackTimelock, NormalTimelock |
| `removeAuthorizedBatchers(address[])` | FastTrackTimelock, NormalTimelock |

## BinanceOracle / BinanceOracle_Proxy (`0x594810b741d136f1960141C0d8Fb4a91bE78A820`)

| Function | Grantees |
| --- | --- |
| `setMaxStalePeriod(string,uint256)` | FastTrackTimelock, Guardian 3, NormalTimelock |
| `setSymbolOverride(string,string)` | FastTrackTimelock, Guardian 3, NormalTimelock |

## BoundValidator / BoundValidator_Proxy (`0x6E332fF0bB52475304494E4AE5063c1051c7d735`)

| Function | Grantees |
| --- | --- |
| `setValidateConfig(ValidateConfig)` | NormalTimelock |

## BTCBPrimeConverter (`0xE8CeAa79f082768f99266dFd208d665d2Dd18f53`)

| Function | Grantees |
| --- | --- |
| `pauseConversion()` | FastTrackTimelock, Guardian 2, NormalTimelock |
| `resumeConversion()` | FastTrackTimelock, Guardian 2, NormalTimelock |
| `setConversionConfig(address,address,ConversionConfig)` | FastTrackTimelock, NormalTimelock |
| `setMinAmountToConvert(uint256)` | FastTrackTimelock, NormalTimelock |

## BTCBTreasuryBuyback / BTCBTreasuryBuyback_Proxy (`0x1F306a0d929a7098a0A0b12248Ba97600AB79026`)

| Function | Grantees |
| --- | --- |
| `executeBuyback(address,uint256,uint256,uint256,address,bytes,address)` | 0x88ac9ca69A371f47798Df18e5C36449af44526a4 |
| `forwardBaseAsset(address,uint256)` | 0x88ac9ca69A371f47798Df18e5C36449af44526a4 |

## ChainlinkOracle / ChainlinkOracle_Proxy (`0x1B2103441A0A108daD8848D8F5d790e4D402921F`)

| Function | Grantees |
| --- | --- |
| `setDirectPrice(address,uint256)` | FastTrackTimelock, Guardian 3, NormalTimelock |
| `setTokenConfig(TokenConfig)` | FastTrackTimelock, Guardian 3, NormalTimelock |
| `setUnderlyingPrice(address,uint256)` | FastTrackTimelock, Guardian 3, NormalTimelock |

## CollateralFactorsRiskSteward / CollateralFactorsRiskSteward_Proxy (`0x1414ADf007E324ec1D0A77b9F1A8759Ad33d2879`)

| Function | Grantees |
| --- | --- |
| `setSafeDeltaBps(uint256)` | FastTrackTimelock, NormalTimelock |

## Comptroller_DeFi (`0x3344417c9360b963ca93A4e8305361AEde340Ab9`)

| Function | Grantees |
| --- | --- |
| `setForcedLiquidation(address,bool)` | FastTrackTimelock, NormalTimelock |

## Comptroller_GameFi (`0x1b43ea8622e76627B81665B1eCeBB4867566B963`)

| Function | Grantees |
| --- | --- |
| `setForcedLiquidation(address,bool)` | FastTrackTimelock, NormalTimelock |

## Comptroller_LiquidStakedBNB (`0xd933909A4a2b7A4638903028f44D1d38ce27c352`)

| Function | Grantees |
| --- | --- |
| `setForcedLiquidation(address,bool)` | FastTrackTimelock, NormalTimelock |

## Comptroller_Stablecoins (`0x94c1495cD4c557f1560Cbd68EAB0d197e6291571`)

| Function | Grantees |
| --- | --- |
| `setForcedLiquidation(address,bool)` | FastTrackTimelock, NormalTimelock |

## Comptroller_Tron (`0x23b4404E4E5eC5FF5a6FFb70B7d14E3FabF237B0`)

| Function | Grantees |
| --- | --- |
| `setForcedLiquidation(address,bool)` | FastTrackTimelock, NormalTimelock |

## ConverterNetwork / ConverterNetwork_Proxy (`0xF7Caad5CeB0209165f2dFE71c92aDe14d0F15995`)

| Function | Grantees |
| --- | --- |
| `addTokenConverter(address)` | FastTrackTimelock, NormalTimelock |
| `removeTokenConverter(address)` | FastTrackTimelock, NormalTimelock |

## DeviationBoundedOracle / DeviationBoundedOracle_Proxy (`0xc79Cb7efEBd121DC4B39eA141C214606595D665A`)

| Function | Grantees |
| --- | --- |
| `exitProtectionMode(address)` | 0xa44eB88198a7a94dC6D2507Bc0e5a216C2410D79, FastTrackTimelock, Guardian 2, NormalTimelock |
| `setAssetBoundedPricingEnabled(address,bool)` | FastTrackTimelock, Guardian 2, NormalTimelock |
| `setCachingEnabled(address,bool)` | FastTrackTimelock, Guardian 2, NormalTimelock |
| `setCooldownPeriod(address,uint64)` | FastTrackTimelock, NormalTimelock |
| `setThresholds(address,uint256,uint256)` | FastTrackTimelock, NormalTimelock |
| `setTokenConfig((address,uint64,uint256,uint256,bool,bool))` | FastTrackTimelock, NormalTimelock |
| `setTokenConfigs((address,uint64,uint256,uint256,bool,bool)[])` | FastTrackTimelock, NormalTimelock |
| `syncPriceBoundsAndProtections((address,uint8,uint256)[])` | 0xa44eB88198a7a94dC6D2507Bc0e5a216C2410D79, FastTrackTimelock, Guardian 2, NormalTimelock |
| `updateMaxPrice(address,uint128)` | 0xa44eB88198a7a94dC6D2507Bc0e5a216C2410D79, FastTrackTimelock, Guardian 2, NormalTimelock |
| `updateMinPrice(address,uint128)` | 0xa44eB88198a7a94dC6D2507Bc0e5a216C2410D79, FastTrackTimelock, Guardian 2, NormalTimelock |

## DeviationSentinel / DeviationSentinel_Proxy (`0x6599C15cc8407046CD91E5c0F8B7f765fF914870`)

| Function | Grantees |
| --- | --- |
| `resetMarketState(address)` | FastTrackTimelock, Guardian 2, NormalTimelock |
| `setTokenConfig(address,(uint8,bool))` | FastTrackTimelock, Guardian 2, NormalTimelock |
| `setTokenMonitoringEnabled(address,bool)` | FastTrackTimelock, Guardian 2, NormalTimelock |
| `setTrustedKeeper(address,bool)` | FastTrackTimelock, Guardian 2, NormalTimelock |

## EBrake / EBrake_Proxy (`0x35eBaBB99c7Fb7ba0C90bCc26e5d55Cdf89C23Ec`)

| Function | Grantees |
| --- | --- |
| `decreaseCF(address,uint256)` | 0xCCa5a587eBDBe80f23c8610F2e53B03158e62948, DeviationSentinel / DeviationSentinel_Proxy, Executor / Executor_Proxy, FastTrackTimelock, Guardian 2, NormalTimelock |
| `decreaseCF(address,uint96,uint256)` | 0xCCa5a587eBDBe80f23c8610F2e53B03158e62948, FastTrackTimelock, Guardian 2, NormalTimelock |
| `disablePoolBorrow(uint96,address)` | 0xCCa5a587eBDBe80f23c8610F2e53B03158e62948, FastTrackTimelock, Guardian 2, NormalTimelock |
| `pauseActions(address[],uint8[])` | 0xCCa5a587eBDBe80f23c8610F2e53B03158e62948, FastTrackTimelock, Guardian 2, NormalTimelock |
| `pauseBorrow(address)` | 0xCCa5a587eBDBe80f23c8610F2e53B03158e62948, DeviationSentinel / DeviationSentinel_Proxy, Executor / Executor_Proxy, FastTrackTimelock, Guardian 2, NormalTimelock |
| `pauseFlashLoan()` | 0xCCa5a587eBDBe80f23c8610F2e53B03158e62948, FastTrackTimelock, Guardian 2, NormalTimelock |
| `pauseRedeem(address)` | 0xCCa5a587eBDBe80f23c8610F2e53B03158e62948, FastTrackTimelock, Guardian 2, NormalTimelock |
| `pauseSupply(address)` | 0xCCa5a587eBDBe80f23c8610F2e53B03158e62948, DeviationSentinel / DeviationSentinel_Proxy, Executor / Executor_Proxy, FastTrackTimelock, Guardian 2, NormalTimelock |
| `pauseTransfer(address)` | 0xCCa5a587eBDBe80f23c8610F2e53B03158e62948, FastTrackTimelock, Guardian 2, NormalTimelock |
| `resetBorrowCapSnapshot(address)` | FastTrackTimelock, Guardian 2, NormalTimelock |
| `resetCFSnapshot(address)` | FastTrackTimelock, Guardian 2, NormalTimelock |
| `resetSupplyCapSnapshot(address)` | FastTrackTimelock, Guardian 2, NormalTimelock |
| `revokeFlashLoanAccess(address)` | 0xCCa5a587eBDBe80f23c8610F2e53B03158e62948, FastTrackTimelock, Guardian 2, NormalTimelock |
| `setMarketBorrowCaps(address[],uint256[])` | 0xCCa5a587eBDBe80f23c8610F2e53B03158e62948, Executor / Executor_Proxy, FastTrackTimelock, Guardian 2, NormalTimelock |
| `setMarketSupplyCaps(address[],uint256[])` | 0xCCa5a587eBDBe80f23c8610F2e53B03158e62948, Executor / Executor_Proxy, FastTrackTimelock, Guardian 2, NormalTimelock |

## ETHPrimeConverter (`0xca430B8A97Ea918fF634162acb0b731445B8195E`)

| Function | Grantees |
| --- | --- |
| `pauseConversion()` | FastTrackTimelock, Guardian 2, NormalTimelock |
| `resumeConversion()` | FastTrackTimelock, Guardian 2, NormalTimelock |
| `setConversionConfig(address,address,ConversionConfig)` | FastTrackTimelock, NormalTimelock |
| `setMinAmountToConvert(uint256)` | FastTrackTimelock, NormalTimelock |

## ETHTreasuryBuyback / ETHTreasuryBuyback_Proxy (`0x41954F0bf26959dF2e1B8302DEBf736B5b154B64`)

| Function | Grantees |
| --- | --- |
| `executeBuyback(address,uint256,uint256,uint256,address,bytes,address)` | 0x88ac9ca69A371f47798Df18e5C36449af44526a4 |
| `forwardBaseAsset(address,uint256)` | 0x88ac9ca69A371f47798Df18e5C36449af44526a4 |

## Executor / Executor_Proxy (`0xDd541A1b065F9587b01815a390a4d4559D7b630F`)

| Function | Grantees |
| --- | --- |
| `handleBorrowCapExceeding(address)` | 0x61859C84E0C6aB7B5A9801A962C660477f31a2D3 |
| `handleCapAdjust(address,uint8,uint256)` | 0x61859C84E0C6aB7B5A9801A962C660477f31a2D3 |
| `handleLTVAdjust(address,uint256)` | 0x61859C84E0C6aB7B5A9801A962C660477f31a2D3 |
| `handleSupplyCapExceeding(address)` | 0x61859C84E0C6aB7B5A9801A962C660477f31a2D3 |
| `setMarketConfig(address,(uint256,uint256,bool))` | FastTrackTimelock, Guardian 2, NormalTimelock |

## InstitutionalVaultControllerProxy (`0x6D9e91cB766259af42619c14c994E694E57e6E85`)

| Function | Grantees |
| --- | --- |
| `acceptPositionTokenOwnership()` | NormalTimelock |
| `approvePositionTransfer(address,address)` | FastTrackTimelock, Guardian 1, NormalTimelock |
| `cancelVault(address)` | FastTrackTimelock, Guardian 1, NormalTimelock |
| `closeVault(address)` | FastTrackTimelock, Guardian 1, NormalTimelock |
| `completePauseVault(address)` | FastTrackTimelock, Guardian 1, NormalTimelock |
| `createVault(VaultConfig,InstitutionalConfig,RiskConfig,string,string,string)` | FastTrackTimelock, Guardian 1, NormalTimelock |
| `openVault(address)` | FastTrackTimelock, Guardian 1, NormalTimelock |
| `partialPauseVault(address)` | FastTrackTimelock, Guardian 1, NormalTimelock |
| `revokePositionTransfer(address)` | FastTrackTimelock, Guardian 1, NormalTimelock |
| `setComptroller(address)` | Guardian 1, NormalTimelock |
| `setInstitutionName(address,string)` | FastTrackTimelock, Guardian 1, NormalTimelock |
| `setInstitutionNameOverride(address,string)` | FastTrackTimelock, Guardian 1, NormalTimelock |
| `setLatePenaltyRate(address,uint256)` | FastTrackTimelock, NormalTimelock |
| `setLiquidationAdapter(address)` | Guardian 1, NormalTimelock |
| `setLiquidationIncentive(address,uint256)` | FastTrackTimelock, NormalTimelock |
| `setLiquidationThreshold(address,uint256)` | FastTrackTimelock, NormalTimelock |
| `setOracle(address)` | Guardian 1, NormalTimelock |
| `setProtocolShareReserve(address)` | Guardian 1, NormalTimelock |
| `setTreasury(address)` | Guardian 1, NormalTimelock |
| `setVaultImplementation(address)` | FastTrackTimelock, NormalTimelock |
| `sweep(address,address)` | FastTrackTimelock, Guardian 1, NormalTimelock |
| `unpauseVault(address)` | FastTrackTimelock, Guardian 1, NormalTimelock |

## LiquidationAdapterProxy (`0x17A6222fB8b4b6D852cA54f5bc376a6A2c6224Bd`)

| Function | Grantees |
| --- | --- |
| `setCloseFactor(uint256)` | FastTrackTimelock |
| `setLiquidatorWhitelist(address,bool)` | FastTrackTimelock, Guardian 1, NormalTimelock |
| `setProtocolLiquidationShare(uint256)` | FastTrackTimelock, NormalTimelock |
| `setSettlerWhitelist(address,bool)` | FastTrackTimelock, Guardian 1, NormalTimelock |
| `sweepProtocolShareToReserve(address)` | FastTrackTimelock, Guardian 1, NormalTimelock |

## Liquidator / Liquidator_Proxy (`0x0870793286aaDA55D39CE7f82fb2766e8004cF43`)

| Function | Grantees |
| --- | --- |
| `addToAllowlist(address,address)` | FastTrackTimelock, Guardian 2, NormalTimelock |
| `pauseForceVAILiquidate()` | FastTrackTimelock, Guardian 2, NormalTimelock |
| `removeFromAllowlist(address,address)` | FastTrackTimelock, Guardian 2, NormalTimelock |
| `restrictLiquidation(address)` | FastTrackTimelock, Guardian 2, NormalTimelock |
| `resumeForceVAILiquidate()` | FastTrackTimelock, Guardian 2, NormalTimelock |
| `setMinLiquidatableVAI(uint256)` | NormalTimelock |
| `setPendingRedeemChunkLength(uint256)` | NormalTimelock |
| `setTreasuryPercent(uint256)` | FastTrackTimelock, NormalTimelock |
| `unrestrictLiquidation(address)` | FastTrackTimelock, Guardian 2, NormalTimelock |

## MarketCapsRiskSteward / MarketCapsRiskSteward_Proxy (`0x816FfD00A274EDE0091421F77817ca260Db3a3E3`)

| Function | Grantees |
| --- | --- |
| `setSafeDeltaBps(uint256)` | FastTrackTimelock, NormalTimelock |

## OmnichainProposalSender (`0x36a69dE601381be7b0DcAc5D5dD058825505F8f6`)

| Function | Grantees |
| --- | --- |
| `execute(uint16,bytes,bytes,address)` | FastTrackTimelock, NormalTimelock |
| `pause()` | FastTrackTimelock, Guardian 2, NormalTimelock |
| `removeTrustedRemote(uint16)` | FastTrackTimelock, Guardian 2, NormalTimelock |
| `retryExecute(uint256,uint16,bytes,bytes,address,uint256)` | FastTrackTimelock, Guardian 2, NormalTimelock |
| `setConfig(uint16,uint16,uint256,bytes)` | FastTrackTimelock, NormalTimelock |
| `setMaxDailyLimit(uint16,uint256)` | FastTrackTimelock, Guardian 2, NormalTimelock |
| `setSendVersion(uint16)` | FastTrackTimelock, NormalTimelock |
| `setTrustedRemoteAddress(uint16,bytes)` | NormalTimelock |
| `unpause()` | FastTrackTimelock, Guardian 2, NormalTimelock |

## PancakeSwapOracle / PancakeSwapOracle_Proxy (`0x44B72078240A3509979faF450085Fa818401D32E`)

| Function | Grantees |
| --- | --- |
| `setPoolConfig(address,address)` | FastTrackTimelock, Guardian 2, NormalTimelock |

## PegStability_USDT / PegStability_USDT_Proxy (`0xC138aa4E424D1A8539e8F38Af5a754a2B7c3Cc36`)

| Function | Grantees |
| --- | --- |
| `pause()` | FastTrackTimelock, Guardian 2, NormalTimelock |
| `resume()` | FastTrackTimelock, Guardian 2, NormalTimelock |
| `setFeeIn(uint256)` | FastTrackTimelock, NormalTimelock |
| `setFeeOut(uint256)` | FastTrackTimelock, NormalTimelock |
| `setOracle(address)` | NormalTimelock |
| `setVAIMintCap(uint256)` | FastTrackTimelock, NormalTimelock |
| `setVenusTreasury(address)` | NormalTimelock |

## PendlePTVaultAdapter / PendlePTVaultAdapter_Proxy (`0x60Db419d8ea13C5827072Cf693D13cA1Ec6E0B4a`)

| Function | Grantees |
| --- | --- |
| `addMarket(address,address)` | NormalTimelock |
| `pause()` | FastTrackTimelock, Guardian 2, NormalTimelock |
| `unpause()` | FastTrackTimelock, Guardian 2, NormalTimelock |

## Prime / Prime_Proxy (`0xBbCD063efE506c3D42a0Fa2dB5C08430288C71FC`)

| Function | Grantees |
| --- | --- |
| `addMarket(address,address,uint256,uint256)` | FastTrackTimelock, NormalTimelock |
| `addMarket(address,uint256,uint256)` | FastTrackTimelock, NormalTimelock |
| `burn(address)` | FastTrackTimelock, NormalTimelock |
| `issue(bool,address[])` | FastTrackTimelock, NormalTimelock |
| `setLimit(uint256,uint256)` | FastTrackTimelock, NormalTimelock |
| `setMaxLoopsLimit(uint256)` | FastTrackTimelock |
| `setStakedAt(address[],uint256[])` | FastTrackTimelock, NormalTimelock |
| `togglePause()` | FastTrackTimelock, Guardian 2, NormalTimelock |
| `updateAlpha(uint128,uint128)` | FastTrackTimelock, NormalTimelock |
| `updateMultipliers(address,uint256,uint256)` | FastTrackTimelock, NormalTimelock |

## PrimeLeaderboard / PrimeLeaderboard_Proxy (`0x55e2ccF68B7A276dc28AfA107997b8B1Be932c0b`)

| Function | Grantees |
| --- | --- |
| `finalizeInitialization()` | 0xe0237587acA20f9304d30FACC9Afcd5DD9a94899, Guardian 2 |
| `initializeStakers(address[],uint256[],uint64[])` | 0xe0237587acA20f9304d30FACC9Afcd5DD9a94899, Guardian 2 |
| `setMultiplierTiers(uint256[],uint256[])` | NormalTimelock |
| `setPrimeV2(address)` | NormalTimelock |

## PrimeLiquidityProvider / PrimeLiquidityProvider_Proxy (`0x23c4F844ffDdC6161174eB32c770D4D8C07833F2`)

| Function | Grantees |
| --- | --- |
| `pauseFundsTransfer()` | FastTrackTimelock, Guardian 2, NormalTimelock |
| `resumeFundsTransfer()` | FastTrackTimelock, Guardian 2, NormalTimelock |
| `setMaxLoopsLimit(uint256)` | FastTrackTimelock |
| `setMaxTokensDistributionSpeed(address[],uint256[])` | FastTrackTimelock, NormalTimelock |
| `setTokensDistributionSpeed(address[],uint256[])` | FastTrackTimelock, NormalTimelock |

## PrimeV2 / PrimeV2_Proxy (`0x059EabA8676b03e4e8f009eFb7F587C28450F50f`)

| Function | Grantees |
| --- | --- |
| `addMarket(address,uint256,uint256)` | NormalTimelock |
| `burn(address)` | 0xe0237587acA20f9304d30FACC9Afcd5DD9a94899, Guardian 2, NormalTimelock |
| `burnBatch(address[])` | 0xe0237587acA20f9304d30FACC9Afcd5DD9a94899, Guardian 2, NormalTimelock |
| `issue(address)` | 0xe0237587acA20f9304d30FACC9Afcd5DD9a94899, Guardian 2, NormalTimelock |
| `issueBatch(address[])` | 0xe0237587acA20f9304d30FACC9Afcd5DD9a94899, Guardian 2, NormalTimelock |
| `pause()` | 0xCCa5a587eBDBe80f23c8610F2e53B03158e62948, FastTrackTimelock, Guardian 2, NormalTimelock |
| `recordCycleSnapshot(uint256)` | 0xe0237587acA20f9304d30FACC9Afcd5DD9a94899, Guardian 2, NormalTimelock |
| `removeMarket(address)` | NormalTimelock |
| `setLimit(uint256)` | Guardian 2, NormalTimelock |
| `setMintThreshold(uint256,uint256)` | Guardian 2, NormalTimelock |
| `setPrimeLeaderboard(address)` | NormalTimelock |
| `sweepUndistributed(address,address)` | NormalTimelock |
| `unpause()` | FastTrackTimelock, Guardian 2, NormalTimelock |
| `updateAlpha(uint128,uint128)` | NormalTimelock |
| `updateMultipliers(address,uint256,uint256)` | NormalTimelock |

## ProtocolShareReserve / ProtocolShareReserve_Proxy (`0xCa01D5A9A248a830E9D93231e791B1afFed7c446`)

| Function | Grantees |
| --- | --- |
| `addOrUpdateDistributionConfigs(DistributionConfig[])` | FastTrackTimelock, NormalTimelock |
| `removeDistributionConfig(Schema,address)` | FastTrackTimelock, NormalTimelock |

## PythOracle / PythOracle_Proxy (`0xb893E38162f55fb80B18Aa44da76FaDf8E9B2262`)

| Function | Grantees |
| --- | --- |
| `setTokenConfig(TokenConfig)` | FastTrackTimelock, Guardian 3, NormalTimelock |
| `setUnderlyingPythOracle(address)` | NormalTimelock |

## RedStoneOracle / RedStoneOracle_Proxy (`0x8455EFA4D7Ff63b8BFD96AdD889483Ea7d39B70a`)

| Function | Grantees |
| --- | --- |
| `setDirectPrice(address,uint256)` | FastTrackTimelock, Guardian 3, NormalTimelock |
| `setTokenConfig(TokenConfig)` | FastTrackTimelock, Guardian 3, NormalTimelock |

## RelativePositionManager / RelativePositionManager_Proxy (`0x1525D804DFff218DcC8B9359940F423209356C42`)

| Function | Grantees |
| --- | --- |
| `addDSAVToken(address)` | FastTrackTimelock, Guardian 2, NormalTimelock |
| `completePause()` | FastTrackTimelock, Guardian 2, NormalTimelock |
| `completeUnpause()` | FastTrackTimelock, Guardian 2, NormalTimelock |
| `executePositionAccountCall(address,address[],bytes[])` | FastTrackTimelock, Guardian 2, NormalTimelock |
| `partialPause()` | FastTrackTimelock, Guardian 2, NormalTimelock |
| `partialUnpause()` | FastTrackTimelock, Guardian 2, NormalTimelock |
| `setDSAVTokenActive(uint8,bool)` | FastTrackTimelock, Guardian 2, NormalTimelock |
| `setPositionAccountImplementation(address)` | NormalTimelock |
| `setProportionalCloseTolerance(uint256)` | FastTrackTimelock, Guardian 2, NormalTimelock |

## ResilientOracle / ResilientOracle_Proxy (`0x6592b5DE802159F3E74B2486b091D11a8256ab8A`)

| Function | Grantees |
| --- | --- |
| `enableOracle(address,uint8,bool)` | NormalTimelock |
| `pause()` | FastTrackTimelock, Guardian 3, NormalTimelock |
| `setOracle(address,address,uint8)` | NormalTimelock |
| `setTokenConfig(TokenConfig)` | FastTrackTimelock, Guardian 3, NormalTimelock |
| `unpause()` | FastTrackTimelock, Guardian 3, NormalTimelock |

## RiskFundBuyback / RiskFundBuyback_Proxy (`0x0c71EFabD00329E839745ef23aB946d3ed24A805`)

| Function | Grantees |
| --- | --- |
| `executeBuyback(address,uint256,uint256,uint256,address,bytes,address)` | 0x88ac9ca69A371f47798Df18e5C36449af44526a4 |
| `forwardBaseAsset(address,uint256)` | 0x88ac9ca69A371f47798Df18e5C36449af44526a4 |

## RiskFundConverter / RiskFundConverter_Proxy (`0xA5622D276CcbB8d9BBE3D1ffd1BB11a0032E53F0`)

| Function | Grantees |
| --- | --- |
| `pauseConversion()` | FastTrackTimelock, Guardian 2, NormalTimelock |
| `resumeConversion()` | FastTrackTimelock, Guardian 2, NormalTimelock |
| `setConversionConfig(address,address,ConversionConfig)` | FastTrackTimelock, NormalTimelock |
| `setMinAmountToConvert(uint256)` | FastTrackTimelock, NormalTimelock |
| `setPoolsAssetsDirectTransfer(address[],address[][],bool[][])` | FastTrackTimelock, NormalTimelock |
| `sweepToken(address,address,uint256)` | NormalTimelock |

## RiskFundV2 / RiskFundV2_Proxy (`0xdF31a28D68A2AB381D42b380649Ead7ae2A76E42`)

| Function | Grantees |
| --- | --- |
| `setMinAmountToConvert(uint256)` | FastTrackTimelock, NormalTimelock |
| `swapPoolsAssets(address[],uint256[],address[][],uint256)` | Guardian 1 |

## RiskOracle / RiskOracle_Proxy (`0x0E3E51958b0Daa8C57c949675975CBEDd7b5a1a1`)

| Function | Grantees |
| --- | --- |
| `addAuthorizedSender(address)` | NormalTimelock |
| `addUpdateType(string)` | FastTrackTimelock, NormalTimelock |
| `removeAuthorizedSender(address)` | FastTrackTimelock, Guardian 2, NormalTimelock |
| `setUpdateTypeActive(string,bool)` | FastTrackTimelock, Guardian 2, NormalTimelock |

## RiskStewardReceiver / RiskStewardReceiver_Proxy (`0x47856bFa74B71d24a5545c7506862B8FddE52baB`)

| Function | Grantees |
| --- | --- |
| `setConfigActive(string,bool)` | FastTrackTimelock, Guardian 2, NormalTimelock |
| `setPaused(bool)` | FastTrackTimelock, Guardian 2, NormalTimelock |
| `setRiskParameterConfig(string,address,uint256,uint256)` | FastTrackTimelock, NormalTimelock |
| `setWhitelistedExecutor(address,bool)` | FastTrackTimelock, Guardian 2, NormalTimelock |

## SentinelOracle / SentinelOracle_Proxy (`0x58eae0Cf4215590E19860b66b146C5d539cb6f14`)

| Function | Grantees |
| --- | --- |
| `setDirectPrice(address,uint256)` | FastTrackTimelock, Guardian 2, NormalTimelock |
| `setTokenOracleConfig(address,address)` | FastTrackTimelock, Guardian 2, NormalTimelock |

## Shortfall / Shortfall_Proxy (`0xf37530A8a810Fcb501AA0Ecd0B0699388F0F2209`)

| Function | Grantees |
| --- | --- |
| `pauseAuctions()` | FastTrackTimelock, Guardian 2, NormalTimelock |
| `resumeAuctions()` | FastTrackTimelock, Guardian 2, NormalTimelock |
| `updateIncentiveBps(uint256)` | FastTrackTimelock, NormalTimelock |
| `updateMinimumPoolBadDebt(uint256)` | FastTrackTimelock, NormalTimelock |
| `updateNextBidderBlockLimit(uint256)` | FastTrackTimelock, NormalTimelock |
| `updateWaitForFirstBidder(uint256)` | FastTrackTimelock, NormalTimelock |

## SolvBTCFundamentalChainlinkOracle / SolvBTCFundamentalChainlinkOracle_Proxy (`0x4521589226ef07d9805936de42F1ACF394B2B221`)

| Function | Grantees |
| --- | --- |
| `setDirectPrice(address,uint256)` | NormalTimelock |
| `setTokenConfig(TokenConfig)` | NormalTimelock |

## UniswapOracle / UniswapOracle_Proxy (`0x8FD05458faf220B2324c4BFbb29DBC4B3CF6f23f`)

| Function | Grantees |
| --- | --- |
| `setPoolConfig(address,address)` | FastTrackTimelock, Guardian 2, NormalTimelock |

## Unitroller / Unitroller_Proxy (`0xfD36E2c2a6789Db23113685031d7F16329158384`)

| Function | Grantees |
| --- | --- |
| `_setActionsPaused(address[],uint8[],bool)` | EBrake / EBrake_Proxy, FastTrackTimelock, Guardian 2, NormalTimelock |
| `_setForcedLiquidation(address,bool)` | FastTrackTimelock, NormalTimelock |
| `_setForcedLiquidationForUser(address,address,bool)` | FastTrackTimelock, NormalTimelock |
| `_setMarketBorrowCaps(address[],uint256[])` | EBrake / EBrake_Proxy, FastTrackTimelock, Guardian 1, MarketCapsRiskSteward / MarketCapsRiskSteward_Proxy, NormalTimelock |
| `_setMarketSupplyCaps(address[],uint256[])` | EBrake / EBrake_Proxy, FastTrackTimelock, Guardian 1, MarketCapsRiskSteward / MarketCapsRiskSteward_Proxy, NormalTimelock |
| `_setProtocolPaused(bool)` | FastTrackTimelock, Guardian 2, NormalTimelock |
| `_supportMarket(address)` | NormalTimelock |
| `addPoolMarkets(uint96[],address[])` | FastTrackTimelock, NormalTimelock |
| `createPool(string)` | FastTrackTimelock, NormalTimelock |
| `removePoolMarket(uint96,address)` | FastTrackTimelock, NormalTimelock |
| `seizeVenus(address[],address,address[])` | FastTrackTimelock, Guardian 1, NormalTimelock |
| `seizeVenus(address[],address)` | FastTrackTimelock, NormalTimelock |
| `setAllowCorePoolFallback(uint96,bool)` | FastTrackTimelock, NormalTimelock |
| `setCollateralFactor(address,uint256,uint256)` | EBrake / EBrake_Proxy |
| `setCollateralFactor(uint96,address,uint256,uint256)` | CollateralFactorsRiskSteward / CollateralFactorsRiskSteward_Proxy, EBrake / EBrake_Proxy, FastTrackTimelock, Guardian 1, NormalTimelock |
| `setDeviationBoundedOracle(address)` | Guardian 2, NormalTimelock |
| `setFlashLoanPaused(bool)` | EBrake / EBrake_Proxy, FastTrackTimelock, Guardian 2, NormalTimelock |
| `setIsBorrowAllowed(uint96,address,bool)` | EBrake / EBrake_Proxy, FastTrackTimelock, Guardian 2, NormalTimelock |
| `setLiquidationIncentive(address,uint256)` | NormalTimelock |
| `setLiquidationIncentive(uint96,address,uint256)` | NormalTimelock |
| `setPoolActive(uint96,bool)` | FastTrackTimelock, NormalTimelock |
| `setPoolLabel(uint96,string)` | FastTrackTimelock, NormalTimelock |
| `setWhiteListFlashLoanAccount(address,bool)` | EBrake / EBrake_Proxy, FastTrackTimelock, Guardian 2, NormalTimelock |

## UPrimeBuyback / UPrimeBuyback_Proxy (`0xBC9fFBfb799B2d189669D3816E2B7273c69041bd`)

| Function | Grantees |
| --- | --- |
| `executeBuyback(address,uint256,uint256,uint256,address,bytes,address)` | 0x88ac9ca69A371f47798Df18e5C36449af44526a4 |
| `forwardBaseAsset(address,uint256)` | 0x88ac9ca69A371f47798Df18e5C36449af44526a4 |

## USDCPrimeConverter (`0xa758c9C215B6c4198F0a0e3FA46395Fa15Db691b`)

| Function | Grantees |
| --- | --- |
| `pauseConversion()` | FastTrackTimelock, Guardian 2, NormalTimelock |
| `resumeConversion()` | FastTrackTimelock, Guardian 2, NormalTimelock |
| `setConversionConfig(address,address,ConversionConfig)` | FastTrackTimelock, NormalTimelock |
| `setMinAmountToConvert(uint256)` | FastTrackTimelock, NormalTimelock |

## USDCTreasuryBuyback / USDCTreasuryBuyback_Proxy (`0xd7aC40f9bd9A1beb8E2d121b4446CF90417cf169`)

| Function | Grantees |
| --- | --- |
| `executeBuyback(address,uint256,uint256,uint256,address,bytes,address)` | 0x88ac9ca69A371f47798Df18e5C36449af44526a4 |
| `forwardBaseAsset(address,uint256)` | 0x88ac9ca69A371f47798Df18e5C36449af44526a4 |

## USDTChainlinkOracle / USDTChainlinkOracle_Proxy (`0x22Dc2BAEa32E95AB07C2F5B8F63336CbF61aB6b8`)

| Function | Grantees |
| --- | --- |
| `setDirectPrice(address,uint256)` | FastTrackTimelock, Guardian 3, NormalTimelock |
| `setTokenConfig(TokenConfig)` | FastTrackTimelock, Guardian 3, NormalTimelock |

## USDTPrimeBuyback / USDTPrimeBuyback_Proxy (`0xD721932C7CA41Eb5305867287010587a266346a8`)

| Function | Grantees |
| --- | --- |
| `executeBuyback(address,uint256,uint256,uint256,address,bytes,address)` | 0x88ac9ca69A371f47798Df18e5C36449af44526a4 |
| `forwardBaseAsset(address,uint256)` | 0x88ac9ca69A371f47798Df18e5C36449af44526a4 |

## USDTPrimeConverter (`0xD9f101AA67F3D72662609a2703387242452078C3`)

| Function | Grantees |
| --- | --- |
| `pauseConversion()` | FastTrackTimelock, Guardian 2, NormalTimelock |
| `resumeConversion()` | FastTrackTimelock, Guardian 2, NormalTimelock |
| `setConversionConfig(address,address,ConversionConfig)` | FastTrackTimelock, NormalTimelock |
| `setMinAmountToConvert(uint256)` | FastTrackTimelock, NormalTimelock |
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
| `setBaseRate(uint256)` | FastTrackTimelock, NormalTimelock |
| `setFloatRate(uint256)` | FastTrackTimelock, NormalTimelock |
| `setMintCap(uint256)` | FastTrackTimelock, NormalTimelock |
| `toggleOnlyPrimeHolderMint()` | FastTrackTimelock, NormalTimelock |

## VAIVaultProxy / VAIVaultProxy_Proxy (`0x0667Eed0a0aAb930af74a3dfeDD263A73994f216`)

| Function | Grantees |
| --- | --- |
| `pause()` | FastTrackTimelock, Guardian 2, NormalTimelock |
| `resume()` | FastTrackTimelock, Guardian 2, NormalTimelock |

## VBNBAdmin / VBNBAdmin_Proxy (`0x9A7890534d9d91d473F28cB97962d176e2B65f1d`)

| Function | Grantees |
| --- | --- |
| `setInterestRateModel(address)` | FastTrackTimelock, NormalTimelock |

## VenusERC4626Factory / VenusERC4626Factory_Proxy (`0xC2f7924809830886EB04c6b40725Fd68F1891fA2`)

| Function | Grantees |
| --- | --- |
| `setRewardRecipient(address)` | NormalTimelock |

## VRTVaultProxy / VRTVaultProxy_Proxy (`0x98bF4786D72AAEF6c714425126Dd92f149e3F334`)

| Function | Grantees |
| --- | --- |
| `pause()` | FastTrackTimelock, Guardian 2, NormalTimelock |
| `resume()` | FastTrackTimelock, Guardian 2, NormalTimelock |
| `setLastAccruingBlock(uint256)` | NormalTimelock |
| `withdrawBep20(address,address,uint256)` | NormalTimelock |

## WBNBBurnConverter (`0x9eF79830e626C8ccA7e46DCEd1F90e51E7cFCeBE`)

| Function | Grantees |
| --- | --- |
| `pauseConversion()` | FastTrackTimelock, Guardian 2, NormalTimelock |
| `resumeConversion()` | FastTrackTimelock, Guardian 2, NormalTimelock |
| `setConversionConfig(address,address,ConversionConfig)` | FastTrackTimelock, NormalTimelock |
| `setMinAmountToConvert(uint256)` | FastTrackTimelock, NormalTimelock |

## XVSBridgeAdmin / XVSBridgeAdmin_Proxy (`0x70d644877b7b73800E9073BCFCE981eAaB6Dbc21`)

| Function | Grantees |
| --- | --- |
| `dropFailedMessage(uint16,bytes,uint64)` | FastTrackTimelock, NormalTimelock |
| `fallbackDeposit(address,uint256)` | NormalTimelock |
| `fallbackWithdraw(address,uint256)` | NormalTimelock |
| `forceResumeReceive(uint16,bytes)` | FastTrackTimelock, NormalTimelock |
| `pause()` | FastTrackTimelock, Guardian 2, NormalTimelock |
| `removeTrustedRemote(uint16)` | FastTrackTimelock, NormalTimelock |
| `setConfig(uint16,uint16,uint256,bytes)` | FastTrackTimelock, NormalTimelock |
| `setMaxDailyLimit(uint16,uint256)` | FastTrackTimelock, Guardian 2, NormalTimelock |
| `setMaxDailyReceiveLimit(uint16,uint256)` | FastTrackTimelock, Guardian 2, NormalTimelock |
| `setMaxSingleReceiveTransactionLimit(uint16,uint256)` | FastTrackTimelock, Guardian 2, NormalTimelock |
| `setMaxSingleTransactionLimit(uint16,uint256)` | FastTrackTimelock, Guardian 2, NormalTimelock |
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
| `unpause()` | FastTrackTimelock, Guardian 2, NormalTimelock |
| `updateSendAndCallEnabled(bool)` | FastTrackTimelock, NormalTimelock |

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
| `pauseConversion()` | FastTrackTimelock, Guardian 2, NormalTimelock |
| `resumeConversion()` | FastTrackTimelock, Guardian 2, NormalTimelock |
| `setConversionConfig(address,address,ConversionConfig)` | FastTrackTimelock, NormalTimelock |
| `setMinAmountToConvert(uint256)` | FastTrackTimelock, NormalTimelock |
| `sweepToken(address,address,uint256)` | NormalTimelock |

## XVSVaultProxy / XVSVaultProxy_Proxy (`0x051100480289e704d20e9DB4804837068f3f9204`)

| Function | Grantees |
| --- | --- |
| `add(address,uint256,address,uint256,uint256)` | NormalTimelock |
| `pause()` | 0xCCa5a587eBDBe80f23c8610F2e53B03158e62948, FastTrackTimelock, Guardian 2, NormalTimelock |
| `resume()` | FastTrackTimelock, Guardian 2, NormalTimelock |
| `set(address,uint256,uint256)` | NormalTimelock |
| `setBlocksPerYear(uint256)` | NormalTimelock |
| `setRewardAmountPerBlockOrSecond(address,uint256)` | FastTrackTimelock, NormalTimelock |
| `setWithdrawalLockingPeriod(address,uint256,uint256)` | NormalTimelock |

## XVSVaultTreasury / XVSVaultTreasury_Proxy (`0x269ff7818DB317f60E386D2be0B259e1a324a40a`)

| Function | Grantees |
| --- | --- |
| `fundXVSVault(uint256)` | FastTrackTimelock, NormalTimelock |

## 🃏 Wildcard permissions

| Function | Grantees |
| --- | --- |
| `_reduceReserves(uint256)` | FastTrackTimelock, NormalTimelock |
| `_setInterestRateModel(address)` | FastTrackTimelock, IRMRiskSteward / IRMRiskSteward_Proxy, NormalTimelock |
| `_setReserveFactor(uint256)` | FastTrackTimelock, NormalTimelock |
| `addMarket(AddMarketInput)` | NormalTimelock |
| `addPool(string,address,uint256,uint256,uint256)` | NormalTimelock |
| `setActionsPaused(address[],uint256[],bool)` | FastTrackTimelock, Guardian 2, NormalTimelock |
| `setCloseFactor(uint256)` | NormalTimelock, PoolRegistry / PoolRegistry_Proxy |
| `setCollateralFactor(address,uint256,uint256)` | FastTrackTimelock, Guardian 1, NormalTimelock, PoolRegistry / PoolRegistry_Proxy |
| `setFlashLoanEnabled(bool)` | FastTrackTimelock, Guardian 2, NormalTimelock |
| `setFlashLoanFeeMantissa(uint256,uint256)` | FastTrackTimelock, Guardian 2, NormalTimelock |
| `setGrowthRate(uint256,uint256)` | FastTrackTimelock, NormalTimelock |
| `setInterestRateModel(address)` | FastTrackTimelock, NormalTimelock |
| `setLastRewardingBlock(address[],uint32[],uint32[])` | NormalTimelock |
| `setLastRewardingBlocks(address[],uint32[],uint32[])` | NormalTimelock |
| `setLiquidationIncentive(uint256)` | NormalTimelock, PoolRegistry / PoolRegistry_Proxy |
| `setMarketBorrowCaps(address[],uint256[])` | FastTrackTimelock, Guardian 1, NormalTimelock, PoolRegistry / PoolRegistry_Proxy |
| `setMarketSupplyCaps(address[],uint256[])` | FastTrackTimelock, Guardian 1, NormalTimelock, PoolRegistry / PoolRegistry_Proxy |
| `setMaxLoopsLimit(uint256)` | NormalTimelock |
| `setMinLiquidatableCollateral(uint256)` | NormalTimelock, PoolRegistry / PoolRegistry_Proxy |
| `setPoolName(address,string)` | NormalTimelock |
| `setProtocolSeizeShare(uint256)` | NormalTimelock |
| `setReduceReservesBlockDelta(uint256)` | FastTrackTimelock, NormalTimelock |
| `setReserveFactor(uint256)` | FastTrackTimelock, NormalTimelock |
| `setRewardRecipient(address)` | NormalTimelock |
| `setRewardTokenSpeeds(address[],uint256[],uint256[])` | NormalTimelock |
| `setSnapshot(uint256,uint256)` | FastTrackTimelock, NormalTimelock |
| `setSnapshotGap(uint256)` | FastTrackTimelock, NormalTimelock |
| `supportMarket(address)` | PoolRegistry / PoolRegistry_Proxy |
| `unlistMarket(address)` | FastTrackTimelock, Guardian 2, NormalTimelock |
| `updateJumpRateModel(uint256,uint256,uint256,uint256)` | FastTrackTimelock, NormalTimelock |
| `updatePoolMetadata(address,VenusPoolMetaData)` | NormalTimelock |
