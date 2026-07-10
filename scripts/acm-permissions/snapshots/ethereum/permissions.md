# ACM Permissions — ethereum

Snapshot block: 25503255 · Updated: 2026-07-10 · Contracts: 66 · Permissions: 186 · Verification: ⚠️ not verified this run

## 0x39cb747453Be3416E659dAeA169540b6F000c885 (`0x39cb747453Be3416E659dAeA169540b6F000c885`)

| Function | Grantees |
| --- | --- |
| `setMaxLoopsLimit(uint256)` | NormalTimelock |
| `setRewardRecipient(address)` | NormalTimelock |

## AuxiliaryCommandsAggregator / AuxiliaryCommandsAggregator_Proxy (`0xc79Cb7efEBd121DC4B39eA141C214606595D665A`)

| Function | Grantees |
| --- | --- |
| `addAuthorizedBatchers(address[])` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `executeBatch(uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `removeAuthorizedBatchers(address[])` | CriticalTimelock, FastTrackTimelock, NormalTimelock |

## BoundValidator / BoundValidator_Proxy (`0x1Cd5f336A1d28Dff445619CC63d3A0329B4d8a58`)

| Function | Grantees |
| --- | --- |
| `setValidateConfig(ValidateConfig)` | NormalTimelock |

## ChainlinkOracle / ChainlinkOracle_Proxy (`0x94c3A2d6B7B2c051aDa041282aec5B0752F8A1F2`)

| Function | Grantees |
| --- | --- |
| `setDirectPrice(address,uint256)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setTokenConfig(TokenConfig)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |

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
| `addTokenConverter(address)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `removeTokenConverter(address)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |

## CurveOracle / CurveOracle_Proxy (`0x9F508F3146cb03276282f9237c6eE64f76E3261D`)

| Function | Grantees |
| --- | --- |
| `setPoolConfig(address,address,uint8,uint8,address,uint8)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |

## DeviationSentinel / DeviationSentinel_Proxy (`0x7D0EFA41eBF1aF242A37174E1E047bD6ea1b1B9c`)

| Function | Grantees |
| --- | --- |
| `setTokenConfig(address,(uint8,bool))` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setTokenMonitoringEnabled(address,bool)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setTrustedKeeper(address,bool)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |

## EBrake / EBrake_Proxy (`0xCD09042c5DFFed762998Df9a058ec5944e39949B`)

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

## OmnichainExecutorOwner / OmnichainExecutorOwner_Proxy (`0x87Ed3Fd3a25d157637b955991fb1B41B566916Ba`)

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
| `addMarket(address,address,uint256,uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `burn(address)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `issue(bool,address[])` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setLimit(uint256,uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setMaxLoopsLimit(uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setStakedAt(address[],uint256[])` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `togglePause()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `updateAlpha(uint128,uint128)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `updateMultipliers(address,uint256,uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |

## PrimeLiquidityProvider / PrimeLiquidityProvider_Proxy (`0x8ba6aFfd0e7Bcd0028D1639225C84DdCf53D8872`)

| Function | Grantees |
| --- | --- |
| `pauseFundsTransfer()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `resumeFundsTransfer()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setMaxLoopsLimit(uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setMaxTokensDistributionSpeed(address[],uint256[])` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setTokensDistributionSpeed(address[],uint256[])` | CriticalTimelock, FastTrackTimelock, NormalTimelock |

## ProtocolShareReserve / ProtocolShareReserve_Proxy (`0x8c8c8530464f7D95552A11eC31Adbd4dC4AC4d3E`)

| Function | Grantees |
| --- | --- |
| `addOrUpdateDistributionConfigs(DistributionConfig[])` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `removeDistributionConfig(Schema,address)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |

## RedStoneOracle / RedStoneOracle_Proxy (`0x0FC8001B2c9Ec90352A46093130e284de5889C86`)

| Function | Grantees |
| --- | --- |
| `setDirectPrice(address,uint256)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setTokenConfig(TokenConfig)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |

## ResilientOracle / ResilientOracle_Proxy (`0xd2ce3fb018805ef92b8C5976cb31F84b4E295F94`)

| Function | Grantees |
| --- | --- |
| `enableOracle(address,uint8,bool)` | NormalTimelock |
| `pause()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setOracle(address,address,uint8)` | NormalTimelock |
| `setTokenConfig(TokenConfig)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `unpause()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |

## SentinelOracle / SentinelOracle_Proxy (`0x444C53E194B40c272fAd683210e2cB1c16Ab132e`)

| Function | Grantees |
| --- | --- |
| `setDirectPrice(address,uint256)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setTokenOracleConfig(address,address)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |

## SFrxETHOracle / SFrxETHOracle_Proxy (`0x5E06A5f48692E4Fff376fDfCA9E4C0183AAADCD1`)

| Function | Grantees |
| --- | --- |
| `setMaxAllowedPriceDifference(uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |

## UniswapOracle / UniswapOracle_Proxy (`0x873993F8f5f5Ddbae0952e939ab3005Af363Af00`)

| Function | Grantees |
| --- | --- |
| `setPoolConfig(address,address)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |

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

## VToken_vBAL_Core (`0x0Ec5488e4F8f319213a14cab188E01fB8517Faa8`)

| Function | Grantees |
| --- | --- |
| `syncCash()` | NormalTimelock |

## VToken_vCRV_Curve (`0x30aD10Bd5Be62CAb37863C2BfcC6E8fb4fD85BDa`)

| Function | Grantees |
| --- | --- |
| `syncCash()` | NormalTimelock |

## VToken_vcrvUSD_Core (`0x672208C10aaAA2F9A6719F449C4C8227bc0BC202`)

| Function | Grantees |
| --- | --- |
| `syncCash()` | NormalTimelock |

## VToken_vcrvUSD_Curve (`0x2d499800239C4CD3012473Cb1EAE33562F0A6933`)

| Function | Grantees |
| --- | --- |
| `syncCash()` | NormalTimelock |

## VToken_vDAI_Core (`0xd8AdD9B41D4E1cd64Edad8722AB0bA8D35536657`)

| Function | Grantees |
| --- | --- |
| `syncCash()` | NormalTimelock |

## VToken_veBTC_Core / VToken_veBTC_Core_Proxy (`0x325cEB02fe1C2fF816A83a5770eA0E88e2faEcF2`)

| Function | Grantees |
| --- | --- |
| `syncCash()` | NormalTimelock |

## VToken_vEIGEN_Core / VToken_vEIGEN_Core_Proxy (`0x256AdDBe0a387c98f487e44b85c29eb983413c5e`)

| Function | Grantees |
| --- | --- |
| `syncCash()` | NormalTimelock |

## VToken_vezETH_LiquidStakedETH (`0xA854D35664c658280fFf27B6eDC6C4195c3229B3`)

| Function | Grantees |
| --- | --- |
| `syncCash()` | NormalTimelock |

## VToken_vFRAX_Core (`0x4fAfbDc4F2a9876Bd1764827b26fb8dc4FD1dB95`)

| Function | Grantees |
| --- | --- |
| `syncCash()` | NormalTimelock |

## VToken_vLBTC_Core (`0x25C20e6e110A1cE3FEbaCC8b7E48368c7b2F0C91`)

| Function | Grantees |
| --- | --- |
| `syncCash()` | NormalTimelock |

## VToken_vPT-sUSDE-27MAR2025_Ethena (`0xCca202a95E8096315E3F19E46e19E1b326634889`)

| Function | Grantees |
| --- | --- |
| `syncCash()` | NormalTimelock |

## VToken_vPT-USDe-27MAR2025_Ethena (`0x62D9E2010Cff87Bae05B91d5E04605ef864ABc3B`)

| Function | Grantees |
| --- | --- |
| `syncCash()` | NormalTimelock |

## VToken_vPT-weETH-26DEC2024_LiquidStakedETH (`0x76697f8eaeA4bE01C678376aAb97498Ee8f80D5C`)

| Function | Grantees |
| --- | --- |
| `syncCash()` | NormalTimelock |

## VToken_vpufETH_LiquidStakedETH (`0xE0ee5dDeBFe0abe0a4Af50299D68b74Cec31668e`)

| Function | Grantees |
| --- | --- |
| `syncCash()` | NormalTimelock |

## VToken_vrsETH_LiquidStakedETH (`0xDB6C345f864883a8F4cae87852Ac342589E76D1B`)

| Function | Grantees |
| --- | --- |
| `syncCash()` | NormalTimelock |

## VToken_vsFRAX_Core (`0x17142a05fe678e9584FA1d88EfAC1bF181bF7ABe`)

| Function | Grantees |
| --- | --- |
| `syncCash()` | NormalTimelock |

## VToken_vsfrxETH_LiquidStakedETH (`0xF9E9Fe17C00a8B96a8ac20c4E344C8688D7b947E`)

| Function | Grantees |
| --- | --- |
| `syncCash()` | NormalTimelock |

## VToken_vsUSDe_Core (`0xa836ce315b7A6Bb19397Ee996551659B1D92298e`)

| Function | Grantees |
| --- | --- |
| `syncCash()` | NormalTimelock |

## VToken_vsUSDe_Ethena (`0x0792b9c60C728C1D2Fd6665b3D7A08762a9b28e0`)

| Function | Grantees |
| --- | --- |
| `syncCash()` | NormalTimelock |

## VToken_vsUSDS_Core (`0xE36Ae842DbbD7aE372ebA02C8239cd431cC063d6`)

| Function | Grantees |
| --- | --- |
| `syncCash()` | NormalTimelock |

## VToken_vtBTC_Core (`0x5e35C312862d53FD566737892aDCf010cb4928F7`)

| Function | Grantees |
| --- | --- |
| `syncCash()` | NormalTimelock |

## VToken_vTUSD_Core (`0x13eB80FDBe5C5f4a7039728E258A6f05fb3B912b`)

| Function | Grantees |
| --- | --- |
| `syncCash()` | NormalTimelock |

## VToken_vUSDC_Core (`0x17C07e0c232f2f80DfDbd7a95b942D893A4C5ACb`)

| Function | Grantees |
| --- | --- |
| `syncCash()` | NormalTimelock |

## VToken_vUSDC_Ethena (`0xa8e7f9473635a5CB79646f14356a9Fc394CA111A`)

| Function | Grantees |
| --- | --- |
| `syncCash()` | NormalTimelock |

## VToken_vUSDe_Core (`0xa0EE2bAA024cC3AA1BC9395522D07B7970Ca75b3`)

| Function | Grantees |
| --- | --- |
| `syncCash()` | NormalTimelock |

## VToken_vUSDS_Core (`0x0c6B19287999f1e31a5c0a44393b24B62D2C0468`)

| Function | Grantees |
| --- | --- |
| `syncCash()` | NormalTimelock |

## VToken_vUSDT_Core (`0x8C3e3821259B82fFb32B2450A95d2dcbf161C24E`)

| Function | Grantees |
| --- | --- |
| `syncCash()` | NormalTimelock |

## VToken_vWBTC_Core (`0x8716554364f20BCA783cb2BAA744d39361fd1D8d`)

| Function | Grantees |
| --- | --- |
| `syncCash()` | NormalTimelock |

## VToken_vweETH_LiquidStakedETH (`0xb4933AF59868986316Ed37fa865C829Eba2df0C7`)

| Function | Grantees |
| --- | --- |
| `syncCash()` | NormalTimelock |

## VToken_vweETHs_Core (`0xc42E4bfb996ED35235bda505430cBE404Eb49F77`)

| Function | Grantees |
| --- | --- |
| `syncCash()` | NormalTimelock |

## VToken_vweETHs_LiquidStakedETH (`0xEF26C64bC06A8dE4CA5D31f119835f9A1d9433b9`)

| Function | Grantees |
| --- | --- |
| `syncCash()` | NormalTimelock |

## VToken_vWETH_Core (`0x7c8ff7d2A1372433726f879BD945fFb250B94c65`)

| Function | Grantees |
| --- | --- |
| `syncCash()` | NormalTimelock |

## VToken_vWETH_LiquidStakedETH (`0xc82780Db1257C788F262FBbDA960B3706Dfdcaf2`)

| Function | Grantees |
| --- | --- |
| `syncCash()` | NormalTimelock |

## VToken_vwstETH_LiquidStakedETH (`0x4a240F0ee138697726C8a3E43eFE6Ac3593432CB`)

| Function | Grantees |
| --- | --- |
| `syncCash()` | NormalTimelock |

## VToken_vyvUSDC-1_Core (`0xf87c0a64dc3a8622D6c63265FA29137788163879`)

| Function | Grantees |
| --- | --- |
| `syncCash()` | NormalTimelock |

## VToken_vyvUSDS-1_Core (`0x520d67226Bc904aC122dcE66ed2f8f61AA1ED764`)

| Function | Grantees |
| --- | --- |
| `syncCash()` | NormalTimelock |

## VToken_vyvUSDT-1_Core (`0x475d0C68a8CD275c15D1F01F4f291804E445F677`)

| Function | Grantees |
| --- | --- |
| `syncCash()` | NormalTimelock |

## VToken_vyvWETH-1_Core (`0xba3916302cBA4aBcB51a01e706fC6051AaF272A0`)

| Function | Grantees |
| --- | --- |
| `syncCash()` | NormalTimelock |

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
| `migrateMinterTokens(address,address)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `mint(address,uint256)` | XVSProxyOFTDest |
| `pause()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setMintCap(address,uint256)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `unpause()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `updateBlacklist(address,bool)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |

## XVSBridgeAdmin / XVSBridgeAdmin_Proxy (`0x9C6C95632A8FB3A74f2fB4B7FfC50B003c992b96`)

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

## XVSVaultConverter (`0x1FD30e761C3296fE36D9067b1e398FD97B4C0407`)

| Function | Grantees |
| --- | --- |
| `pauseConversion()` | Guardian |
| `resumeConversion()` | Guardian |

## XVSVaultProxy (`0xA0882C2D5DF29233A092d2887A258C2b90e9b994`)

| Function | Grantees |
| --- | --- |
| `add(address,uint256,address,uint256,uint256)` | NormalTimelock |
| `pause()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `resume()` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `set(address,uint256,uint256)` | NormalTimelock |
| `setRewardAmountPerBlockOrSecond(address,uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setWithdrawalLockingPeriod(address,uint256,uint256)` | NormalTimelock |

## XVSVaultTreasury / XVSVaultTreasury_Proxy (`0xaE39C38AF957338b3cEE2b3E5d825ea88df02EfE`)

| Function | Grantees |
| --- | --- |
| `fundXVSVault(uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |

## 🃏 Wildcard permissions

| Function | Grantees |
| --- | --- |
| `pauseConversion()` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `resumeConversion()` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setActionsPaused(address[],uint256[],bool)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock |
| `setCloseFactor(uint256)` | NormalTimelock, PoolRegistry / PoolRegistry_Proxy |
| `setCollateralFactor(address,uint256,uint256)` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock, PoolRegistry / PoolRegistry_Proxy |
| `setConversionConfig(address,address,ConversionConfig)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setForcedLiquidation(address,bool)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setGrowthRate(uint256,uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setInterestRateModel(address)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
| `setLastRewardingBlocks(address[],uint32[],uint32[])` | NormalTimelock |
| `setLiquidationIncentive(uint256)` | NormalTimelock, PoolRegistry / PoolRegistry_Proxy |
| `setMarketBorrowCaps(address[],uint256[])` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock, PoolRegistry / PoolRegistry_Proxy |
| `setMarketSupplyCaps(address[],uint256[])` | CriticalTimelock, FastTrackTimelock, Guardian, NormalTimelock, PoolRegistry / PoolRegistry_Proxy |
| `setMaxLoopsLimit(uint256)` | NormalTimelock |
| `setMinAmountToConvert(uint256)` | CriticalTimelock, FastTrackTimelock, NormalTimelock |
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
