import { ethers } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { ACMCommandsAggregator } from "typechain";

const ARBITRUMONE_RESILIENT_ORACLE = "0xd55A98150e0F9f5e3F6280FC25617A5C93d96007";
const ARBITRUMONE_CHAINLINK_ORACLE = "0x9cd9Fcc7E3dEDA360de7c080590AaD377ac9F113";
const ARBITRUMONE_REDSTONE_ORACLE = "0xF792C4D3BdeF534D6d1dcC305056D00C95453dD6";
const ARBITRUMONE_BOUND_VALIDATOR = "0x2245FA2420925Cd3C2D889Ddc5bA1aefEF0E14CF";
const ETHEREUM_RESILIENT_ORACLE = "0xd2ce3fb018805ef92b8C5976cb31F84b4E295F94";
const ETHEREUM_CHAINLINK_ORACLE = "0x94c3A2d6B7B2c051aDa041282aec5B0752F8A1F2";
const ETHEREUM_REDSTONE_ORACLE = "0x0FC8001B2c9Ec90352A46093130e284de5889C86";
const ETHEREUM_BOUND_VALIDATOR = "0x1Cd5f336A1d28Dff445619CC63d3A0329B4d8a58";
const ETHEREUM_sFrxETH_ORACLE = "0x5E06A5f48692E4Fff376fDfCA9E4C0183AAADCD1";
const OPBNBMAINNET_RESILIENT_ORACLE = "0x8f3618c4F0183e14A218782c116fb2438571dAC9";
const OPBNBMAINNET_BINANCE_ORACLE = "0xB09EC9B628d04E1287216Aa3e2432291f50F9588";
const OPBNBMAINNET_BOUND_VALIDATOR = "0xd1f80C371C6E2Fa395A5574DB3E3b4dAf43dadCE";
const ARBITRUMSEPOLIA_RESILIENT_ORACLE = "0x6708bAd042916B47311c8078b29d7f432342102F";
const ARBITRUMSEPOLIA_CHAINLINK_ORACLE = "0xeDd02c7FfA31490b4107e8f2c25e9198a04F9E45";
const ARBITRUMSEPOLIA_REDSTONE_ORACLE = "0x15058891ca0c71Bd724b873c41596A682420613C";
const ARBITRUMSEPOLIA_BOUND_VALIDATOR = "0xfe6bc1545Cc14C131bacA97476D6035ffcC0b889";
const SEPOLIA_RESILIENT_ORACLE = "0x8000eca36201dddf5805Aa4BeFD73d1EB4D23264";
const SEPOLIA_CHAINLINK_ORACLE = "0x102F0b714E5d321187A4b6E5993358448f7261cE";
const SEPOLIA_REDSTONE_ORACLE = "0x4e6269Ef406B4CEE6e67BA5B5197c2FfD15099AE";
const SEPOLIA_BOUND_VALIDATOR = "0x60c4Aa92eEb6884a76b309Dd8B3731ad514d6f9B";
const SEPOLIA_sFrxETH_ORACLE = "0x61EB836afA467677e6b403D504fe69D6940e7996";
const OPBNBTESTNET_RESILIENT_ORACLE = "0xEF4e53a9A4565ef243A2f0ee9a7fc2410E1aA623";
const OPBNBTESTNET_BINANCE_ORACLE = "0x496B6b03469472572C47bdB407d5549b244a74F2";
const OPBNBTESTNET_BOUND_VALIDATOR = "0x049537Bb065e6253e9D8D08B45Bf6b753657A746";

const ARBITRUMONE_XVS = "0xc1Eb7689147C81aC840d4FF0D298489fc7986d52";
const ETHEREUM_XVS = "0xd3CC9d8f3689B83c91b7B59cAB4946B063EB894A";
const OPBNBMAINNET_XVS = "0x3E2e61F1c075881F3fB8dd568043d8c221fd5c61";
const ARBITRUMSEPOLIA_XVS = "0x877Dc896e7b13096D3827872e396927BbE704407";
const SEPOLIA_XVS = "0x66ebd019E86e0af5f228a0439EBB33f045CBe63E";
const OPBNBTESTNET_XVS = "0xc2931B1fEa69b6D6dA65a50363A8D75d285e4da9";
const ARBITRUMONE_XVS_BRIDGE_ADMIN = "0xf5d81C6F7DAA3F97A6265C8441f92eFda22Ad784";
const ETHEREUM_XVS_BRIDGE_ADMIN = "0x9C6C95632A8FB3A74f2fB4B7FfC50B003c992b96";
const OPBNBMAINNET_XVS_BRIDGE_ADMIN = "0x52fcE05aDbf6103d71ed2BA8Be7A317282731831";
const ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN = "0xc94578caCC89a29B044a0a1D54d20d48A645E5C8";
const SEPOLIA_XVS_BRIDGE_ADMIN = "0xd3c6bdeeadB2359F726aD4cF42EAa8B7102DAd9B";
const OPBNBTESTNET_XVS_BRIDGE_ADMIN = "0x19252AFD0B2F539C400aEab7d460CBFbf74c17ff";

const ARBITRUMONE_XVS_VAULT_PROXY = "0x8b79692AAB2822Be30a6382Eb04763A74752d5B4";
const ETHEREUM_XVS_VAULT_PROXY = "0xA0882C2D5DF29233A092d2887A258C2b90e9b994";
const OPBNBMAINNET_XVS_VAULT_PROXY = "0x7dc969122450749A8B0777c0e324522d67737988";
const ARBITRUMSEPOLIA_XVS_VAULT_PROXY = "0x407507DC2809D3aa31D54EcA3BEde5C5c4C8A17F";
const SEPOLIA_XVS_VAULT_PROXY = "0x1129f882eAa912aE6D4f6D445b2E2b1eCbA99fd5";
const OPBNBTESTNET_XVS_VAULT_PROXY = "0xB14A0e72C5C202139F78963C9e89252c1ad16f01";

const ETHEREUM_XVS_VAULT_TREASURY = "0xaE39C38AF957338b3cEE2b3E5d825ea88df02EfE";
const SEPOLIA_XVS_VAULT_TREASURY = "0xCCB08e5107b406E67Ad8356023dd489CEbc79B40";

const ETHEREUM_POOL_REGISTRY = "0x61CAff113CCaf05FFc6540302c37adcf077C5179";
const ARBITRUMONE_POOL_REGISTRY = "0x382238f07Bc4Fe4aA99e561adE8A4164b5f815DA";
const OPBNBMAINNET_POOL_REGISTRY = "0x345a030Ad22e2317ac52811AC41C1A63cfa13aEe";
const SEPOLIA_POOL_REGISTRY = "0x758f5715d817e02857Ba40889251201A5aE3E186";
const OPBNBTESTNET_POOL_REGISTRY = "0x560eA4e1cC42591E9f5F5D83Ad2fd65F30128951";
const ARBITRUMSEPOLIA_POOL_REGISTRY = "0xf93Df3135e0D555185c0BC888073374cA551C5fE";

const ARBITRUMONE_PRIME = "0xFE69720424C954A2da05648a0FAC84f9bf11Ef49";
const ARBITRUMONE_PLP = "0x86bf21dB200f29F21253080942Be8af61046Ec29";
const ARBITRUMONE_PSR = "0xF9263eaF7eB50815194f26aCcAB6765820B13D41";
const ETHEREUM_CONVERTER_NETWORK = "0x232CC47AECCC55C2CAcE4372f5B268b27ef7cac8";
const ETHEREUM_PRIME = "0x14C4525f47A7f7C984474979c57a2Dccb8EACB39";
const ETHEREUM_PLP = "0x8ba6aFfd0e7Bcd0028D1639225C84DdCf53D8872";
const ETHEREUM_PSR = "0x8c8c8530464f7D95552A11eC31Adbd4dC4AC4d3E";
const OPBNBMAINNET_PSR = "0xA2EDD515B75aBD009161B15909C19959484B0C1e";
const ARBITRUMSEPOLIA_PRIME = "0xadb04ac4942683bc41e27d18234c8dc884786e89";
const ARBITRUMSEPOLIA_PLP = "0xe82c2c10f55d3268126c29ec813dc6f086904694";
const ARBITRUMSEPOLIA_PSR = "0x09267d30798B59c581ce54E861A084C6FC298666";
const SEPOLIA_PRIME = "0x2Ec432F123FEbb114e6fbf9f4F14baF0B1F14AbC";
const SEPOLIA_PLP = "0x15242a55Ad1842A1aEa09c59cf8366bD2f3CE9B4";
const SEPOLIA_PSR = "0xbea70755cc3555708ca11219adB0db4C80F6721B";
const OPBNBTESTNET_PSR = "0xc355dEb1A9289f8C58CFAa076EEdBf51F3A8Da7F";
const SEPOLIA_CONVERTER_NETWORK = "0xB5A4208bFC4cC2C4670744849B8fC35B21A690Fa";

const ARBITRUMONE_GUARDIAN = "0x14e0E151b33f9802b3e75b621c1457afc44DcAA0";
const ETHEREUM_GUARDIAN = "0x285960C5B22fD66A736C7136967A3eB15e93CC67";
const OPBNBMAINNET_GUARDIAN = "0xC46796a21a3A9FAB6546aF3434F2eBfFd0604207";
const SEPOLIA_GUARDIAN = "0x94fa6078b6b8a26f0b6edffbe6501b22a10470fb";
const OPBNBTESTNET_GUARDIAN = "0xb15f6EfEbC276A3b9805df81b5FB3D50C2A62BDf";
const ARBITRUMSEPOLIA_GUARDIAN = "0x1426A5Ae009c4443188DA8793751024E358A61C2";

const ARBITRUMSEPOLIA_OMNICHAIN_EXECUTOR_OWNER = "0xfCA70dd553b7dF6eB8F813CFEA6a9DD039448878";
const SEPOLIA_OMNICHAIN_EXECUTOR_OWNER = "0xf964158C67439D01e5f17F0A3F39DfF46823F27A";
const OPBNBTESTNET_OMNICHAIN_EXECUTOR_OWNER = "0x4F570240FF6265Fbb1C79cE824De6408F1948913";

const ETHEREUM_CONVERTERS: string[] = [
  "0xaE39C38AF957338b3cEE2b3E5d825ea88df02EfE",
  "0x4f55cb0a24D5542a3478B0E284259A6B850B06BD",
  "0xcEB9503f10B781E30213c0b320bCf3b3cE54216E",
  "0xDcCDE673Cd8988745dA384A7083B0bd22085dEA0",
  "0xb8fD67f215117FADeF06447Af31590309750529D",
  "0x1FD30e761C3296fE36D9067b1e398FD97B4C0407",
];
const SEPOLIA_CONVERTERS: string[] = [
  "0xCCB08e5107b406E67Ad8356023dd489CEbc79B40",
  "0x3716C24EA86A67cAf890d7C9e4C4505cDDC2F8A2",
  "0x511a559a699cBd665546a1F75908f7E9454Bfc67",
  "0x8a3937F27921e859db3FDA05729CbCea8cfd82AE",
  "0x274a834eFFA8D5479502dD6e78925Bc04ae82B46",
  "0xc203bfA9dCB0B5fEC510Db644A494Ff7f4968ed2",
];

enum AccountType {
  NORMAL_TIMELOCK = "NormalTimelock",
  FAST_TRACK_TIMELOCK = "FastTrackTimelock",
  CRITICAL_TIMELOCK = "CriticalTimelock",
}

interface Permissions {
  [key: string]: string[][];
}

const accounts = [AccountType.NORMAL_TIMELOCK]
  .concat(AccountType.CRITICAL_TIMELOCK)
  .concat(AccountType.FAST_TRACK_TIMELOCK);

const getResilientOraclePermissions = (resilientOracle: string): string[][] => {
  return [
    accounts.flatMap(timelock => [resilientOracle, "pause()", timelock]),
    accounts.flatMap(timelock => [resilientOracle, "unpause()", timelock]),
    accounts.flatMap(timelock => [resilientOracle, "setTokenConfig(TokenConfig)", timelock]),
    [resilientOracle, "setOracle(address,address,uint8)", AccountType.NORMAL_TIMELOCK],
    [resilientOracle, "enableOracle(address,uint8,bool)", AccountType.NORMAL_TIMELOCK],
  ];
};

const getChainlinkOraclePermissions = (chainlinkOracle: string): string[][] => {
  return [
    accounts.flatMap(timelock => [chainlinkOracle, "setTokenConfig(TokenConfig)", timelock]),
    accounts.flatMap(timelock => [chainlinkOracle, "setDirectPrice(address,uint256)", timelock]),
  ];
};

const getRedstoneOraclePermissions = (redstoneOracle: string): string[][] => {
  return [
    accounts.flatMap(timelock => [redstoneOracle, "setTokenConfig(TokenConfig)", timelock]),
    accounts.flatMap(timelock => [redstoneOracle, "setDirectPrice(address,uint256)", timelock]),
  ];
};

const getBoundValidatorPermissions = (boundValidator: string): string[][] => {
  return [[boundValidator, "setValidateConfig(ValidateConfig)", AccountType.NORMAL_TIMELOCK]];
};

const getSFrxETHOraclePermissions = (sFrxETHOracle: string): string[][] => {
  return [accounts.flatMap(timelock => [sFrxETHOracle, "setMaxAllowedPriceDifference(uint256)", timelock])];
};

const getBinanceOraclePermissions = (binanceOracle: string): string[][] => {
  return [
    accounts.flatMap(timelock => [binanceOracle, "setMaxStalePeriod(string,uint256)", timelock]),
    accounts.flatMap(timelock => [binanceOracle, "setSymbolOverride(string,string)", timelock]),
  ];
};

const getXVSPermissions = (xvs: string): string[][] => {
  return [
    accounts.flatMap(timelock => [xvs, "migrateMinterTokens(address,address)", timelock]),
    accounts.flatMap(timelock => [xvs, "setMintCap(address,uint256)", timelock]),
    accounts.flatMap(timelock => [xvs, "updateBlacklist(address,bool)", timelock]),
    accounts.flatMap(timelock => [xvs, "pause()", timelock]),
    accounts.flatMap(timelock => [xvs, "unpause()", timelock]),
  ];
};

const getXVSBridgeAdminPermissions = (xvsBridgeAdmin: string): string[][] => {
  return [
    accounts.flatMap(timelock => [xvsBridgeAdmin, "setSendVersion(uint16)", timelock]),
    accounts.flatMap(timelock => [xvsBridgeAdmin, "setReceiveVersion(uint16)", timelock]),
    accounts.flatMap(timelock => [xvsBridgeAdmin, "forceResumeReceive(uint16,bytes)", timelock]),
    accounts.flatMap(timelock => [xvsBridgeAdmin, "setMaxSingleTransactionLimit(uint16,uint256)", timelock]),
    [xvsBridgeAdmin, "setOracle(address)", AccountType.NORMAL_TIMELOCK],
    accounts.flatMap(timelock => [xvsBridgeAdmin, "setMaxDailyLimit(uint16,uint256)", timelock]),
    accounts.flatMap(timelock => [xvsBridgeAdmin, "setMaxSingleReceiveTransactionLimit(uint16,uint256)", timelock]),
    accounts.flatMap(timelock => [xvsBridgeAdmin, "setMaxDailyReceiveLimit(uint16,uint256)", timelock]),
    accounts.flatMap(timelock => [xvsBridgeAdmin, "pause()", timelock]),
    accounts.flatMap(timelock => [xvsBridgeAdmin, "unpause()", timelock]),
    accounts.flatMap(timelock => [xvsBridgeAdmin, "removeTrustedRemote(uint16)", timelock]),
    accounts.flatMap(timelock => [xvsBridgeAdmin, "dropFailedMessage(uint16,bytes,uint64)", timelock]),
    [xvsBridgeAdmin, "setPrecrime(address)", AccountType.NORMAL_TIMELOCK],
    accounts.flatMap(timelock => [xvsBridgeAdmin, "setMinDstGas(uint16,uint16,uint256)", timelock]),
    accounts.flatMap(timelock => [xvsBridgeAdmin, "setPayloadSizeLimit(uint16,uint256)", timelock]),
    accounts.flatMap(timelock => [xvsBridgeAdmin, "setWhitelist(address,bool)", timelock]),
    accounts.flatMap(timelock => [xvsBridgeAdmin, "setConfig(uint16,uint16,uint256,bytes)", timelock]),
    [xvsBridgeAdmin, "sweepToken(address,address,uint256)", AccountType.NORMAL_TIMELOCK],
    accounts.flatMap(timelock => [xvsBridgeAdmin, "updateSendAndCallEnabled(bool)", timelock]),
    [xvsBridgeAdmin, "setTrustedRemoteAddress(uint16,bytes)", AccountType.NORMAL_TIMELOCK],
    [xvsBridgeAdmin, "transferBridgeOwnership(address)", AccountType.NORMAL_TIMELOCK],
  ];
};

const getXVSVaultPermissions = (xvsVault: string): string[][] => {
  return [
    [xvsVault, "pause()", AccountType.CRITICAL_TIMELOCK],
    [xvsVault, "resume()", AccountType.CRITICAL_TIMELOCK],
    [xvsVault, "setRewardAmountPerBlockOrSecond(address,uint256)", AccountType.CRITICAL_TIMELOCK],
    [xvsVault, "pause()", AccountType.FAST_TRACK_TIMELOCK],
    [xvsVault, "resume()", AccountType.FAST_TRACK_TIMELOCK],
    [xvsVault, "setRewardAmountPerBlockOrSecond(address,uint256)", AccountType.FAST_TRACK_TIMELOCK],
    [xvsVault, "pause()", AccountType.NORMAL_TIMELOCK],
    [xvsVault, "resume()", AccountType.NORMAL_TIMELOCK],
    [xvsVault, "add(address,uint256,address,uint256,uint256)", AccountType.NORMAL_TIMELOCK],
    [xvsVault, "set(address,uint256,uint256)", AccountType.NORMAL_TIMELOCK],
    [xvsVault, "setRewardAmountPerBlockOrSecond(address,uint256)", AccountType.NORMAL_TIMELOCK],
    [xvsVault, "setWithdrawalLockingPeriod(address,uint256,uint256)", AccountType.NORMAL_TIMELOCK],
  ];
};

const getPoolRegistryPermissions = (poolRegistry: string): string[][] => {
  return [
    [poolRegistry, "addPool(string,address,uint256,uint256,uint256)", AccountType.NORMAL_TIMELOCK],
    [poolRegistry, "addMarket(AddMarketInput)", AccountType.NORMAL_TIMELOCK],
    [poolRegistry, "setPoolName(address,string)", AccountType.NORMAL_TIMELOCK],
    [poolRegistry, "updatePoolMetadata(address,VenusPoolMetaData)", AccountType.NORMAL_TIMELOCK],
  ];
};

const getPrimePermissions = (prime: string): string[][] => {
  return [
    accounts.flatMap(timelock => [prime, "updateAlpha(uint128,uint128)", timelock]),
    accounts.flatMap(timelock => [prime, "updateMultipliers(address,uint256,uint256)", timelock]),
    accounts.flatMap(timelock => [prime, "setStakedAt(address[],uint256[])", timelock]),
    accounts.flatMap(timelock => [prime, "addMarket(address,address,uint256,uint256)", timelock]),
    accounts.flatMap(timelock => [prime, "setLimit(uint256,uint256)", timelock]),
    accounts.flatMap(timelock => [prime, "setMaxLoopsLimit(uint256)", timelock]),
    accounts.flatMap(timelock => [prime, "issue(bool,address[])", timelock]),
    accounts.flatMap(timelock => [prime, "burn(address)", timelock]),
    accounts.flatMap(timelock => [prime, "togglePause()", timelock]),
  ];
};

const getPrimeLiquidityProviderPermissions = (primeLiquidityProvider: string): string[][] => {
  return [
    accounts.flatMap(timelock => [primeLiquidityProvider, "setTokensDistributionSpeed(address[],uint256[])", timelock]),
    accounts.flatMap(timelock => [
      primeLiquidityProvider,
      "setMaxTokensDistributionSpeed(address[],uint256[])",
      timelock,
    ]),
    accounts.flatMap(timelock => [primeLiquidityProvider, "setMaxLoopsLimit(uint256)", timelock]),
    accounts.flatMap(timelock => [primeLiquidityProvider, "pauseFundsTransfer()", timelock]),
    accounts.flatMap(timelock => [primeLiquidityProvider, "resumeFundsTransfer()", timelock]),
  ];
};

const getProtocolShareReservePermissions = (protocolShareReserve: string): string[][] => {
  return [
    accounts.flatMap(timelock => [
      protocolShareReserve,
      "addOrUpdateDistributionConfigs(DistributionConfig[])",
      timelock,
    ]),
    accounts.flatMap(timelock => [protocolShareReserve, "removeDistributionConfig(Schema,address)", timelock]),
  ];
};

const getConverterNetworkPermissions = (converterNetwork: string): string[][] => {
  return [
    accounts.flatMap(timelock => [converterNetwork, "addTokenConverter(address)", timelock]),
    accounts.flatMap(timelock => [converterNetwork, "removeTokenConverter(address)", timelock]),
  ];
};

const getComptrollerPermissions = (): string[][] => {
  return [
    accounts.flatMap(timelock => [
      ethers.constants.AddressZero,
      "setCollateralFactor(address,uint256,uint256)",
      timelock,
    ]),
    accounts.flatMap(timelock => [ethers.constants.AddressZero, "setMarketBorrowCaps(address[],uint256[])", timelock]),
    accounts.flatMap(timelock => [ethers.constants.AddressZero, "setMarketSupplyCaps(address[],uint256[])", timelock]),
    accounts.flatMap(timelock => [
      ethers.constants.AddressZero,
      "setActionsPaused(address[],uint256[],bool)",
      timelock,
    ]),
    accounts.flatMap(timelock => [ethers.constants.AddressZero, "setForcedLiquidation(address,bool)", timelock]),
    accounts.flatMap(timelock => [ethers.constants.AddressZero, "unlistMarket(address)", timelock]),
    [ethers.constants.AddressZero, "setCloseFactor(uint256)", AccountType.NORMAL_TIMELOCK],
    [ethers.constants.AddressZero, "setLiquidationIncentive(uint256)", AccountType.NORMAL_TIMELOCK],
    [ethers.constants.AddressZero, "setMinLiquidatableCollateral(uint256)", AccountType.NORMAL_TIMELOCK],
  ];
};

const getVTokenPermissions = (): string[][] => {
  return [
    accounts.flatMap(timelock => [ethers.constants.AddressZero, "setReserveFactor(uint256)", timelock]),
    accounts.flatMap(timelock => [ethers.constants.AddressZero, "setInterestRateModel(address)", timelock]),
    accounts.flatMap(timelock => [ethers.constants.AddressZero, "setReduceReservesBlockDelta(uint256)", timelock]),
    [ethers.constants.AddressZero, "setProtocolSeizeShare(uint256)", AccountType.NORMAL_TIMELOCK],
  ];
};

const getRewardDistributorPermissionsTimebased = (): string[][] => {
  return [
    [ethers.constants.AddressZero, "setRewardTokenSpeeds(address[],uint256[],uint256[])", AccountType.NORMAL_TIMELOCK],
    [
      ethers.constants.AddressZero,
      "setLastRewardingBlockTimestamps(address[],uint256[],uint256[])",
      AccountType.NORMAL_TIMELOCK,
    ],
  ];
};

const getRewardDistributorPermissionsBlockbased = (): string[][] => {
  return [
    [ethers.constants.AddressZero, "setRewardTokenSpeeds(address[],uint256[],uint256[])", AccountType.NORMAL_TIMELOCK],
    [ethers.constants.AddressZero, "setLastRewardingBlocks(address[],uint32[],uint32[])", AccountType.NORMAL_TIMELOCK],
  ];
};

const getIRMPermissions = (): string[][] => {
  return [
    [ethers.constants.AddressZero, "updateJumpRateModel(uint256,uint256,uint256,uint256)", AccountType.NORMAL_TIMELOCK],
  ];
};

const getConverterPermissions = (): string[][] => {
  return [
    accounts.flatMap(timelock => [ethers.constants.AddressZero, "pauseConversion()", timelock]),
    accounts.flatMap(timelock => [ethers.constants.AddressZero, "resumeConversion()", timelock]),
    accounts.flatMap(timelock => [ethers.constants.AddressZero, "setMinAmountToConvert(uint256)", timelock]),
    accounts.flatMap(timelock => [
      ethers.constants.AddressZero,
      "setConversionConfig(address,address,ConversionConfig)",
      timelock,
    ]),
  ];
};

const getXVSVaultTreasuryPermissions = (xvsVaultTreasury: string): string[][] => {
  return [accounts.flatMap(timelock => [xvsVaultTreasury, "fundXVSVault(uint256)", timelock])];
};

const getOmniChainExecutorOwnerPermissions = (omniChainExecutor: string, guardian: string): string[][] => {
  return [
    [omniChainExecutor, "setSrcChainId(uint16)", AccountType.NORMAL_TIMELOCK],
    [omniChainExecutor, "transferBridgeOwnership(address)", AccountType.NORMAL_TIMELOCK],
    [omniChainExecutor, "setSrcChainId(uint16)", guardian],
    [omniChainExecutor, "transferBridgeOwnership(address)", guardian],
  ];
};

const getXVSBridgeAdminRevokePermissions = (xvsBridgeAdmin: string, guardian: string): string[][] => {
  return [
    [xvsBridgeAdmin, "setSendVersion(uint16)", guardian],
    [xvsBridgeAdmin, "setReceiveVersion(uint16)", guardian],
    [xvsBridgeAdmin, "forceResumeReceive(uint16,bytes)", guardian],
    [xvsBridgeAdmin, "setOracle(address)", guardian],
    [xvsBridgeAdmin, "setMaxDailyLimit(uint16,uint256)", guardian],
    [xvsBridgeAdmin, "setMaxSingleReceiveTransactionLimit(uint16,uint256)", guardian],
    [xvsBridgeAdmin, "setMaxDailyReceiveLimit(uint16,uint256)", guardian],
    [xvsBridgeAdmin, "pause()", guardian],
    [xvsBridgeAdmin, "unpause()", guardian],
    [xvsBridgeAdmin, "removeTrustedRemote(uint16)", guardian],
    [xvsBridgeAdmin, "dropFailedMessage(uint16,bytes,uint64)", guardian],
    [xvsBridgeAdmin, "setPrecrime(address)", guardian],
    [xvsBridgeAdmin, "setMinDstGas(uint16,uint16,uint256)", guardian],
    [xvsBridgeAdmin, "setPayloadSizeLimit(uint16,uint256)", guardian],
    [xvsBridgeAdmin, "setWhitelist(address,bool)", guardian],
    [xvsBridgeAdmin, "setConfig(uint16,uint16,uint256,bytes)", guardian],
    [xvsBridgeAdmin, "sweepToken(address,address,uint256)", guardian],
    [xvsBridgeAdmin, "updateSendAndCallEnabled(bool)", guardian],
    [xvsBridgeAdmin, "setTrustedRemoteAddress(uint16,bytes)", guardian],
    [xvsBridgeAdmin, "transferBridgeOwnership(address)", guardian],
  ];
};

const getXVSVaultTreasuryRevokePermissions = (xvsVaultTreasury: string, guardian: string): string[][] => {
  return [[xvsVaultTreasury, "fundXVSVault(uint256)", guardian]];
};

const getPrimeRevokePermissions = (prime: string, guardian: string): string[][] => {
  return [
    [prime, "updateAlpha(uint128,uint128)", guardian],
    [prime, "updateMultipliers(address,uint256,uint256)", guardian],
    [prime, "setStakedAt(address[],uint256[])", guardian],
    [prime, "addMarket(address,address,uint256,uint256)", guardian],
    [prime, "setLimit(uint256,uint256)", guardian],
    [prime, "setMaxLoopsLimit(uint256)", guardian],
    [prime, "issue(bool,address[])", guardian],
    [prime, "burn(address)", guardian],
  ];
};

const getPrimeLiquidityProviderRevokePermissions = (primeLiquidityProvider: string, guardian: string): string[][] => {
  return [
    [primeLiquidityProvider, "setTokensDistributionSpeed(address[],uint256[])", guardian],
    [primeLiquidityProvider, "setMaxTokensDistributionSpeed(address[],uint256[])", guardian],
    [primeLiquidityProvider, "setMaxLoopsLimit(uint256)", guardian],
  ];
};

const getResilientOracleRevokePermissions = (resilientOracle: string, guardian: string): string[][] => {
  return [
    [resilientOracle, "setOracle(address,address,uint8)", guardian],
    [resilientOracle, "enableOracle(address,uint8,bool)", guardian],
  ];
};

const getBoundValidatorRevokePermissions = (boundValidator: string, guardian: string): string[][] => {
  return [[boundValidator, "setValidateConfig(ValidateConfig)", guardian]];
};

const getXVSVaultRevokePermissions = (xvsVault: string, guardian: string): string[][] => {
  return [
    [xvsVault, "add(address,uint256,address,uint256,uint256)", guardian],
    [xvsVault, "set(address,uint256,uint256)", guardian],
    [xvsVault, "setRewardAmountPerBlockOrSecond(address,uint256)", guardian],
    [xvsVault, "setWithdrawalLockingPeriod(address,uint256,uint256)", guardian],
  ];
};

const getRewardDistributorRevokePermissions = (guardian: string, lastRewardingBlockTimestamp: boolean): string[][] => {
  const permissions = [
    [ethers.constants.AddressZero, "setLastRewardingBlock(address[],uint32[],uint32[])", guardian],
    [ethers.constants.AddressZero, "setLastRewardingBlocks(address[],uint32[],uint32[])", guardian],
    [ethers.constants.AddressZero, "setRewardTokenSpeeds(address[],uint256[],uint256[])", guardian],
  ];
  if (lastRewardingBlockTimestamp) {
    permissions.push([
      ethers.constants.AddressZero,
      "setLastRewardingBlockTimestamps(address[],uint256[],uint256[])",
      guardian,
    ]);
  }
  return permissions;
};

const getIRMRevokePermissions = (guardian: string): string[][] => {
  return [[ethers.constants.AddressZero, "updateJumpRateModel(uint256,uint256,uint256,uint256)", guardian]];
};

const getPoolRegistryRevokePermissions = (poolRegistry: string, guardian: string): string[][] => {
  if (poolRegistry === OPBNBTESTNET_POOL_REGISTRY || poolRegistry === ARBITRUMSEPOLIA_POOL_REGISTRY) {
    return [
      [ethers.constants.AddressZero, "addPool(string,address,uint256,uint256,uint256)", guardian],
      [ethers.constants.AddressZero, "addMarket(AddMarketInput)", guardian],
      [ethers.constants.AddressZero, "setPoolName(address,string)", guardian],
      [ethers.constants.AddressZero, "updatePoolMetadata(address,VenusPoolMetaData)", guardian],
    ];
  } else {
    return [
      [poolRegistry, "addPool(string,address,uint256,uint256,uint256)", guardian],
      [poolRegistry, "addMarket(AddMarketInput)", guardian],
      [poolRegistry, "setPoolName(address,string)", guardian],
      [poolRegistry, "updatePoolMetadata(address,VenusPoolMetaData)", guardian],
    ];
  }
};

const getComptrollerRevokePermissions = (guardian: string): string[][] => {
  return [
    [ethers.constants.AddressZero, "setCloseFactor(uint256)", guardian],
    [ethers.constants.AddressZero, "setLiquidationIncentive(uint256)", guardian],
    [ethers.constants.AddressZero, "setMinLiquidatableCollateral(uint256)", guardian],
    [ethers.constants.AddressZero, "setForcedLiquidation(address,bool)", guardian],
  ];
};

const getVTokenRevokePermissions = (guardian: string): string[][] => {
  return [
    [ethers.constants.AddressZero, "setProtocolSeizeShare(uint256)", guardian],
    [ethers.constants.AddressZero, "setReserveFactor(uint256)", guardian],
    [ethers.constants.AddressZero, "setInterestRateModel(address)", guardian],
    [ethers.constants.AddressZero, "setReduceReservesBlockDelta(uint256)", guardian],
  ];
};

const getRedstoneOracleRevokePermissions = (redstoneOracle: string, guardian: string): string[][] => {
  return [
    [redstoneOracle, "setTokenConfig(TokenConfig)", guardian],
    [redstoneOracle, "setDirectPrice(address,uint256)", guardian],
  ];
};

const getConverterNetworkRevokePermissions = (converterNetwork: string, guardian: string): string[][] => {
  return [
    [converterNetwork, "addTokenConverter(address)", guardian],
    [converterNetwork, "removeTokenConverter(address)", guardian],
  ];
};

const getSFrxETHOracleRevokePermissions = (sFrxETHOracle: string, guardian: string): string[][] => {
  return [[sFrxETHOracle, "setMaxAllowedPriceDifference(uint256)", guardian]];
};

const getConvertersRevokePermissions = (converters: string[], guardian: string): string[][] => {
  return [
    converters.flatMap(converter => [converter, "setMinAmountToConvert(uint256)", guardian]),
    converters.flatMap(converter => [converter, "setConversionConfig(address,address,ConversionConfig)", guardian]),
  ];
};

const getOmniChainExecutorOwnerRevokePermissions = (omniChainExecutor: string, guardian: string): string[][] => {
  return [
    [omniChainExecutor, "setTrustedRemoteAddress(uint16,bytes)", AccountType.CRITICAL_TIMELOCK],
    [omniChainExecutor, "setTimelockPendingAdmin(address,uint8)", AccountType.CRITICAL_TIMELOCK],
    [omniChainExecutor, "setGuardian(address)", AccountType.CRITICAL_TIMELOCK],
    [omniChainExecutor, "setTrustedRemoteAddress(uint16,bytes)", AccountType.FAST_TRACK_TIMELOCK],
    [omniChainExecutor, "setTimelockPendingAdmin(address,uint8)", AccountType.FAST_TRACK_TIMELOCK],
    [omniChainExecutor, "setGuardian(address)", AccountType.FAST_TRACK_TIMELOCK],
    [omniChainExecutor, "setSendVersion(uint16)", guardian],
    [omniChainExecutor, "setPrecrime(address)", guardian],
    [omniChainExecutor, "setMinDstGas(uint16,uint16,uint256)", guardian],
    [omniChainExecutor, "setPayloadSizeLimit(uint16,uint256)", guardian],
  ];
};

const grantPermissions: Permissions = {
  arbitrumone: [
    ...getResilientOraclePermissions(ARBITRUMONE_RESILIENT_ORACLE),
    ...getChainlinkOraclePermissions(ARBITRUMONE_CHAINLINK_ORACLE),
    ...getRedstoneOraclePermissions(ARBITRUMONE_REDSTONE_ORACLE),
    ...getBoundValidatorPermissions(ARBITRUMONE_BOUND_VALIDATOR),
    ...getXVSPermissions(ARBITRUMONE_XVS),
    ...getXVSBridgeAdminPermissions(ARBITRUMONE_XVS_BRIDGE_ADMIN),
    ...getXVSVaultPermissions(ARBITRUMONE_XVS_VAULT_PROXY),
    ...getPoolRegistryPermissions(ARBITRUMONE_POOL_REGISTRY),
    ...getPrimePermissions(ARBITRUMONE_PRIME),
    ...getPrimeLiquidityProviderPermissions(ARBITRUMONE_PLP),
    ...getProtocolShareReservePermissions(ARBITRUMONE_PSR),
    ...getComptrollerPermissions(),
    ...getVTokenPermissions(),
    ...getRewardDistributorPermissionsTimebased(),
    ...getIRMPermissions(),
  ],
  ethereum: [
    ...getResilientOraclePermissions(ETHEREUM_RESILIENT_ORACLE),
    ...getChainlinkOraclePermissions(ETHEREUM_CHAINLINK_ORACLE),
    ...getRedstoneOraclePermissions(ETHEREUM_REDSTONE_ORACLE),
    ...getBoundValidatorPermissions(ETHEREUM_BOUND_VALIDATOR),
    ...getSFrxETHOraclePermissions(ETHEREUM_sFrxETH_ORACLE),
    ...getXVSPermissions(ETHEREUM_XVS),
    ...getXVSBridgeAdminPermissions(ETHEREUM_XVS_BRIDGE_ADMIN),
    ...getXVSVaultPermissions(ETHEREUM_XVS_VAULT_PROXY),
    ...getPoolRegistryPermissions(ETHEREUM_POOL_REGISTRY),
    ...getPrimePermissions(ETHEREUM_PRIME),
    ...getPrimeLiquidityProviderPermissions(ETHEREUM_PLP),
    ...getProtocolShareReservePermissions(ETHEREUM_PSR),
    ...getConverterNetworkPermissions(ETHEREUM_CONVERTER_NETWORK),
    ...getComptrollerPermissions(),
    ...getVTokenPermissions(),
    ...getRewardDistributorPermissionsBlockbased(),
    ...getIRMPermissions(),
    ...getConverterPermissions(),
    ...getXVSVaultTreasuryPermissions(ETHEREUM_XVS_VAULT_TREASURY),
  ],
  opbnbmainnet: [
    ...getResilientOraclePermissions(OPBNBMAINNET_RESILIENT_ORACLE),
    ...getBoundValidatorPermissions(OPBNBMAINNET_BOUND_VALIDATOR),
    ...getBinanceOraclePermissions(OPBNBMAINNET_BINANCE_ORACLE),
    ...getXVSPermissions(OPBNBMAINNET_XVS),
    ...getXVSBridgeAdminPermissions(OPBNBMAINNET_XVS_BRIDGE_ADMIN),
    ...getXVSVaultPermissions(OPBNBMAINNET_XVS_VAULT_PROXY),
    ...getPoolRegistryPermissions(OPBNBMAINNET_POOL_REGISTRY),
    ...getProtocolShareReservePermissions(OPBNBMAINNET_PSR),
    ...getComptrollerPermissions(),
    ...getVTokenPermissions(),
    ...getIRMPermissions(),
  ],
  arbitrumsepolia: [
    ...getResilientOraclePermissions(ARBITRUMSEPOLIA_RESILIENT_ORACLE),
    ...getChainlinkOraclePermissions(ARBITRUMSEPOLIA_CHAINLINK_ORACLE),
    ...getRedstoneOraclePermissions(ARBITRUMSEPOLIA_REDSTONE_ORACLE),
    ...getBoundValidatorPermissions(ARBITRUMSEPOLIA_BOUND_VALIDATOR),
    ...getXVSPermissions(ARBITRUMSEPOLIA_XVS),
    ...getXVSBridgeAdminPermissions(ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN),
    ...getXVSVaultPermissions(ARBITRUMSEPOLIA_XVS_VAULT_PROXY),
    ...getPoolRegistryPermissions(ARBITRUMSEPOLIA_POOL_REGISTRY),
    ...getPrimePermissions(ARBITRUMSEPOLIA_PRIME),
    ...getPrimeLiquidityProviderPermissions(ARBITRUMSEPOLIA_PLP),
    ...getProtocolShareReservePermissions(ARBITRUMSEPOLIA_PSR),
    ...getComptrollerPermissions(),
    ...getVTokenPermissions(),
    ...getRewardDistributorPermissionsTimebased(),
    ...getIRMPermissions(),
    ...getOmniChainExecutorOwnerPermissions(ARBITRUMSEPOLIA_OMNICHAIN_EXECUTOR_OWNER, ARBITRUMSEPOLIA_GUARDIAN),
  ],
  sepolia: [
    ...getResilientOraclePermissions(SEPOLIA_RESILIENT_ORACLE),
    ...getResilientOraclePermissions(SEPOLIA_CHAINLINK_ORACLE),
    ...getRedstoneOraclePermissions(SEPOLIA_REDSTONE_ORACLE),
    ...getBoundValidatorPermissions(SEPOLIA_BOUND_VALIDATOR),
    ...getSFrxETHOraclePermissions(SEPOLIA_sFrxETH_ORACLE),
    ...getXVSPermissions(SEPOLIA_XVS),
    ...getXVSBridgeAdminPermissions(SEPOLIA_XVS_BRIDGE_ADMIN),
    ...getXVSVaultPermissions(SEPOLIA_XVS_VAULT_PROXY),
    ...getPoolRegistryPermissions(SEPOLIA_POOL_REGISTRY),
    ...getPrimePermissions(SEPOLIA_PRIME),
    ...getPrimeLiquidityProviderPermissions(SEPOLIA_PLP),
    ...getProtocolShareReservePermissions(SEPOLIA_PSR),
    ...getConverterNetworkPermissions(SEPOLIA_CONVERTER_NETWORK),
    ...getComptrollerPermissions(),
    ...getVTokenPermissions(),
    ...getRewardDistributorPermissionsBlockbased(),
    ...getIRMPermissions(),
    ...getConverterPermissions(),
    ...getXVSVaultTreasuryPermissions(SEPOLIA_XVS_VAULT_TREASURY),
    ...getOmniChainExecutorOwnerPermissions(SEPOLIA_OMNICHAIN_EXECUTOR_OWNER, SEPOLIA_GUARDIAN),
  ],
  opbnbtestnet: [
    ...getResilientOraclePermissions(OPBNBTESTNET_RESILIENT_ORACLE),
    ...getResilientOraclePermissions(OPBNBTESTNET_BOUND_VALIDATOR),
    ...getBinanceOraclePermissions(OPBNBTESTNET_BINANCE_ORACLE),
    ...getXVSPermissions(OPBNBTESTNET_XVS),
    ...getXVSBridgeAdminPermissions(OPBNBTESTNET_XVS_BRIDGE_ADMIN),
    ...getXVSVaultPermissions(OPBNBTESTNET_XVS_VAULT_PROXY),
    ...getPoolRegistryPermissions(OPBNBTESTNET_POOL_REGISTRY),
    ...getProtocolShareReservePermissions(OPBNBTESTNET_PSR),
    ...getComptrollerPermissions(),
    ...getVTokenPermissions(),
    ...getIRMPermissions(),
    ...getOmniChainExecutorOwnerPermissions(OPBNBTESTNET_OMNICHAIN_EXECUTOR_OWNER, OPBNBTESTNET_GUARDIAN),
  ],
};

const revokePermissions: Permissions = {
  arbitrumone: [
    ...getPrimeRevokePermissions(ARBITRUMONE_PRIME, ARBITRUMONE_GUARDIAN),
    ...getPrimeLiquidityProviderRevokePermissions(ARBITRUMONE_PLP, ARBITRUMONE_GUARDIAN),
    ...getResilientOracleRevokePermissions(ARBITRUMONE_RESILIENT_ORACLE, ARBITRUMONE_GUARDIAN),
    ...getBoundValidatorRevokePermissions(ARBITRUMONE_BOUND_VALIDATOR, ARBITRUMONE_GUARDIAN),
    ...getXVSVaultRevokePermissions(ARBITRUMONE_XVS, ARBITRUMONE_GUARDIAN),
    ...getRewardDistributorRevokePermissions(ARBITRUMONE_GUARDIAN, true),
    ...getIRMRevokePermissions(ARBITRUMONE_GUARDIAN),
    ...getPoolRegistryRevokePermissions(ARBITRUMONE_POOL_REGISTRY, ARBITRUMONE_GUARDIAN),
    ...getComptrollerRevokePermissions(ARBITRUMONE_GUARDIAN),
    ...getVTokenRevokePermissions(ARBITRUMONE_GUARDIAN),
    ...getXVSBridgeAdminRevokePermissions(ARBITRUMONE_XVS_BRIDGE_ADMIN, ARBITRUMONE_GUARDIAN),
    ...getRedstoneOracleRevokePermissions(ARBITRUMONE_REDSTONE_ORACLE, ARBITRUMONE_GUARDIAN),
  ],
  ethereum: [
    ...getPrimeRevokePermissions(ETHEREUM_PRIME, ETHEREUM_GUARDIAN),
    ...getPrimeLiquidityProviderRevokePermissions(ETHEREUM_PLP, ETHEREUM_GUARDIAN),
    ...getResilientOracleRevokePermissions(ETHEREUM_RESILIENT_ORACLE, ETHEREUM_GUARDIAN),
    ...getBoundValidatorRevokePermissions(ETHEREUM_BOUND_VALIDATOR, ETHEREUM_GUARDIAN),
    ...getXVSVaultRevokePermissions(ETHEREUM_XVS, ETHEREUM_GUARDIAN),
    ...getRewardDistributorRevokePermissions(ETHEREUM_GUARDIAN, false),
    ...getIRMRevokePermissions(ETHEREUM_GUARDIAN),
    ...getPoolRegistryRevokePermissions(ETHEREUM_POOL_REGISTRY, ETHEREUM_GUARDIAN),
    ...getComptrollerRevokePermissions(ETHEREUM_GUARDIAN),
    ...getVTokenRevokePermissions(ETHEREUM_GUARDIAN),
    ...getRedstoneOracleRevokePermissions(ETHEREUM_REDSTONE_ORACLE, ETHEREUM_GUARDIAN),
    ...getConverterNetworkRevokePermissions(ETHEREUM_CONVERTER_NETWORK, ETHEREUM_GUARDIAN),
    ...getSFrxETHOracleRevokePermissions(ETHEREUM_sFrxETH_ORACLE, ETHEREUM_GUARDIAN),
    ...getConvertersRevokePermissions(ETHEREUM_CONVERTERS, ETHEREUM_GUARDIAN),
    ...getXVSVaultTreasuryRevokePermissions(ETHEREUM_XVS_VAULT_TREASURY, ETHEREUM_GUARDIAN),
    ...getXVSBridgeAdminRevokePermissions(ETHEREUM_XVS_BRIDGE_ADMIN, ETHEREUM_GUARDIAN),
  ],
  opbnbmainnet: [
    ...getResilientOracleRevokePermissions(OPBNBMAINNET_RESILIENT_ORACLE, OPBNBMAINNET_GUARDIAN),
    ...getBoundValidatorRevokePermissions(OPBNBMAINNET_BOUND_VALIDATOR, OPBNBMAINNET_GUARDIAN),
    ...getXVSVaultRevokePermissions(OPBNBMAINNET_XVS, OPBNBMAINNET_GUARDIAN),
    ...getIRMRevokePermissions(OPBNBMAINNET_GUARDIAN),
    ...getPoolRegistryRevokePermissions(OPBNBMAINNET_POOL_REGISTRY, OPBNBMAINNET_GUARDIAN),
    ...getComptrollerRevokePermissions(OPBNBMAINNET_GUARDIAN),
    ...getVTokenRevokePermissions(OPBNBMAINNET_GUARDIAN),
    ...getXVSBridgeAdminRevokePermissions(OPBNBMAINNET_XVS_BRIDGE_ADMIN, OPBNBMAINNET_GUARDIAN),
  ],
  opbnbtestnet: [
    ...getResilientOracleRevokePermissions(OPBNBTESTNET_RESILIENT_ORACLE, OPBNBTESTNET_GUARDIAN),
    ...getBoundValidatorRevokePermissions(OPBNBTESTNET_BOUND_VALIDATOR, OPBNBTESTNET_GUARDIAN),
    ...getXVSVaultRevokePermissions(OPBNBTESTNET_XVS, OPBNBTESTNET_GUARDIAN),
    ...getIRMRevokePermissions(OPBNBTESTNET_GUARDIAN),
    ...getPoolRegistryRevokePermissions(OPBNBTESTNET_POOL_REGISTRY, OPBNBTESTNET_GUARDIAN),
    ...getComptrollerRevokePermissions(OPBNBTESTNET_GUARDIAN),
    ...getVTokenRevokePermissions(OPBNBTESTNET_GUARDIAN),
    ...getXVSBridgeAdminRevokePermissions(OPBNBTESTNET_XVS_BRIDGE_ADMIN, OPBNBTESTNET_GUARDIAN),
    ...getRewardDistributorRevokePermissions(OPBNBTESTNET_GUARDIAN, false),
    ...getOmniChainExecutorOwnerRevokePermissions(OPBNBTESTNET_OMNICHAIN_EXECUTOR_OWNER, OPBNBTESTNET_GUARDIAN),
  ],
  sepolia: [
    ...getPrimeRevokePermissions(SEPOLIA_PRIME, SEPOLIA_GUARDIAN),
    ...getPrimeLiquidityProviderRevokePermissions(SEPOLIA_PLP, SEPOLIA_GUARDIAN),
    ...getResilientOracleRevokePermissions(SEPOLIA_RESILIENT_ORACLE, SEPOLIA_GUARDIAN),
    ...getBoundValidatorRevokePermissions(SEPOLIA_BOUND_VALIDATOR, SEPOLIA_GUARDIAN),
    ...getXVSVaultRevokePermissions(SEPOLIA_XVS, SEPOLIA_GUARDIAN),
    ...getRewardDistributorRevokePermissions(SEPOLIA_GUARDIAN, false),
    ...getIRMRevokePermissions(SEPOLIA_GUARDIAN),
    ...getPoolRegistryRevokePermissions(SEPOLIA_POOL_REGISTRY, SEPOLIA_GUARDIAN),
    ...getComptrollerRevokePermissions(SEPOLIA_GUARDIAN),
    ...getVTokenRevokePermissions(SEPOLIA_GUARDIAN),
    ...getRedstoneOracleRevokePermissions(SEPOLIA_REDSTONE_ORACLE, SEPOLIA_GUARDIAN),
    ...getConverterNetworkRevokePermissions(SEPOLIA_CONVERTER_NETWORK, SEPOLIA_GUARDIAN),
    ...getSFrxETHOracleRevokePermissions(SEPOLIA_sFrxETH_ORACLE, SEPOLIA_GUARDIAN),
    ...getConvertersRevokePermissions(SEPOLIA_CONVERTERS, SEPOLIA_GUARDIAN),
    ...getXVSVaultTreasuryRevokePermissions(SEPOLIA_XVS_VAULT_TREASURY, SEPOLIA_GUARDIAN),
    ...getXVSBridgeAdminRevokePermissions(SEPOLIA_XVS_BRIDGE_ADMIN, SEPOLIA_GUARDIAN),
    ...getOmniChainExecutorOwnerRevokePermissions(SEPOLIA_OMNICHAIN_EXECUTOR_OWNER, SEPOLIA_GUARDIAN),
  ],
  arbitrumsepolia: [
    ...getPrimeRevokePermissions(ARBITRUMSEPOLIA_PRIME, ARBITRUMSEPOLIA_GUARDIAN),
    ...getPrimeLiquidityProviderRevokePermissions(ARBITRUMSEPOLIA_PLP, ARBITRUMSEPOLIA_GUARDIAN),
    ...getResilientOracleRevokePermissions(ARBITRUMSEPOLIA_RESILIENT_ORACLE, ARBITRUMSEPOLIA_GUARDIAN),
    ...getBoundValidatorRevokePermissions(ARBITRUMSEPOLIA_BOUND_VALIDATOR, ARBITRUMSEPOLIA_GUARDIAN),
    ...getXVSVaultRevokePermissions(ARBITRUMSEPOLIA_XVS, ARBITRUMSEPOLIA_GUARDIAN),
    ...getRewardDistributorRevokePermissions(ARBITRUMSEPOLIA_GUARDIAN, true),
    ...getIRMRevokePermissions(ARBITRUMSEPOLIA_GUARDIAN),
    ...getPoolRegistryRevokePermissions(ARBITRUMSEPOLIA_POOL_REGISTRY, ARBITRUMSEPOLIA_GUARDIAN),
    ...getComptrollerRevokePermissions(ARBITRUMSEPOLIA_GUARDIAN),
    ...getVTokenRevokePermissions(ARBITRUMSEPOLIA_GUARDIAN),
    ...getXVSBridgeAdminRevokePermissions(ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN, ARBITRUMSEPOLIA_GUARDIAN),
    ...getRedstoneOracleRevokePermissions(ARBITRUMSEPOLIA_REDSTONE_ORACLE, ARBITRUMSEPOLIA_GUARDIAN),
    ...getOmniChainExecutorOwnerRevokePermissions(ARBITRUMSEPOLIA_OMNICHAIN_EXECUTOR_OWNER, ARBITRUMSEPOLIA_GUARDIAN),
  ],
};

function splitPermissions(
  array: ACMCommandsAggregator.PermissionStruct[],
  chunkSize: number = 100,
): ACMCommandsAggregator.PermissionStruct[][] {
  const result: ACMCommandsAggregator.PermissionStruct[][] = [];

  for (let i = 0; i < array.length; i += chunkSize) {
    const chunk = array.slice(i, i + chunkSize);
    result.push(chunk);
  }

  return result;
}

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const acmCommandsAggregator: ACMCommandsAggregator = await ethers.getContract("ACMCommandsAggregator");
  const networkGrantPermissions = grantPermissions[hre.network.name];

  for (const permission of networkGrantPermissions) {
    if (Object.values(AccountType).includes(permission[2] as AccountType)) {
      const timelock = await ethers.getContract(permission[2]);
      permission[2] = timelock.address;
    }
  }

  const _grantPermissions: ACMCommandsAggregator.PermissionStruct[] = networkGrantPermissions.map(permission => ({
    contractAddress: permission[0],
    functionSig: permission[1],
    account: permission[2],
  }));

  const grantChunks = splitPermissions(_grantPermissions);
  const grantIndexes: string[] = [];

  for (const chunk of grantChunks) {
    const tx = await acmCommandsAggregator.addGrantPermissions(chunk);

    const receipt = await tx.wait();
    const events = receipt.events?.filter(event => event.event === "GrantPermissionsAdded");
    grantIndexes.push(events?.[0].args?.index.toString());
  }

  console.log("Grant Permissions added with indexes: ", grantIndexes.toString());

  const networkRevokePermissions = revokePermissions[hre.network.name];

  for (const permission of networkRevokePermissions) {
    if (Object.values(AccountType).includes(permission[2] as AccountType)) {
      const timelock = await ethers.getContract(permission[2]);
      permission[2] = timelock.address;
    }
  }

  const _revokePermissions: ACMCommandsAggregator.PermissionStruct[] = networkRevokePermissions.map(permission => ({
    contractAddress: permission[0],
    functionSig: permission[1],
    account: permission[2],
  }));

  const revokeChunks = splitPermissions(_revokePermissions);
  const revokeIndexes: string[] = [];

  for (const chunk of revokeChunks) {
    const tx = await acmCommandsAggregator.addRevokePermissions(chunk);

    const receipt = await tx.wait();
    const events = receipt.events?.filter(event => event.event === "RevokePermissionsAdded");
    revokeIndexes.push(events?.[0].args?.index.toString());
  }

  console.log("Revoke Permissions added with indexes: ", revokeIndexes.toString());
};

func.tags = ["ACMCommandsAggregatorConfigure"];

func.skip = async (hre: HardhatRuntimeEnvironment) =>
  Object.keys(grantPermissions).concat(Object.keys(revokePermissions)).indexOf(hre.network.name) === -1;
export default func;
