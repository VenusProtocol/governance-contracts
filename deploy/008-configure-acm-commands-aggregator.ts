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
const ARBITRUM_SEPOLIA_BOUND_VALIDATOR = "0xfe6bc1545Cc14C131bacA97476D6035ffcC0b889";
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

enum AccountType {
  NORMAL_TIMELOCK = "NormalTimelock",
  FAST_TRACK_TIMELOCK = "FastTrackTimelock",
  CRITICAL_TIMELOCK = "CriticalTimelock",
}

interface Permission {
  permissionType: boolean;
  params: string[];
}

interface Permissions {
  [key: string]: Permission[];
}

const permissions: Permissions = {
  arbitrumone: [
    {
      permissionType: false,
      params: [
        ethers.constants.AddressZero,
        "updateJumpRateModel(uint256,uint256,uint256,uint256)",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [
        ethers.constants.AddressZero,
        "setRewardTokenSpeeds(address[],uint256[],uint256[])",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [
        ethers.constants.AddressZero,
        "setLastRewardingBlocks(address[],uint32[],uint32[])",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [
        ethers.constants.AddressZero,
        "setLastRewardingBlockTimestamps(address[],uint256[],uint256[])",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_PRIME, "updateAlpha(uint128,uint128)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_PRIME, "updateMultipliers(address,uint256,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_PRIME, "setStakedAt(address[],uint256[])", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_PRIME, "addMarket(address,address,uint256,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_PRIME, "setLimit(uint256,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_PRIME, "setMaxLoopsLimit(uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_PRIME, "issue(bool,address[])", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_PRIME, "burn(address)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_PRIME, "togglePause()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_PLP, "setTokensDistributionSpeed(address[],uint256[])", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_PLP, "setMaxTokensDistributionSpeed(address[],uint256[])", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_PLP, "setMaxLoopsLimit(uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_PLP, "pauseFundsTransfer()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_PLP, "resumeFundsTransfer()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_PRIME, "updateAlpha(uint128,uint128)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_PRIME, "updateMultipliers(address,uint256,uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_PRIME, "setStakedAt(address[],uint256[])", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_PRIME, "addMarket(address,address,uint256,uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_PRIME, "setLimit(uint256,uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_PRIME, "setMaxLoopsLimit(uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_PRIME, "issue(bool,address[])", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_PRIME, "burn(address)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_PRIME, "togglePause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_PLP, "setTokensDistributionSpeed(address[],uint256[])", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_PLP, "setMaxTokensDistributionSpeed(address[],uint256[])", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_PLP, "setMaxLoopsLimit(uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_PLP, "pauseFundsTransfer()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_PLP, "resumeFundsTransfer()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_PRIME, "updateAlpha(uint128,uint128)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_PRIME, "updateMultipliers(address,uint256,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_PRIME, "setStakedAt(address[],uint256[])", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_PRIME, "addMarket(address,address,uint256,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_PRIME, "setLimit(uint256,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_PRIME, "setMaxLoopsLimit(uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_PRIME, "issue(bool,address[])", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_PRIME, "burn(address)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_PRIME, "togglePause()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_PLP, "setTokensDistributionSpeed(address[],uint256[])", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_PLP, "setMaxTokensDistributionSpeed(address[],uint256[])", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_PLP, "setMaxLoopsLimit(uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_PLP, "pauseFundsTransfer()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_PLP, "resumeFundsTransfer()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_PSR, "removeDistributionConfig(Schema,address)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_PSR, "addOrUpdateDistributionConfigs(DistributionConfig[])", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_PSR, "removeDistributionConfig(Schema,address)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        ARBITRUMONE_PSR,
        "addOrUpdateDistributionConfigs(DistributionConfig[])",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_PSR, "removeDistributionConfig(Schema,address)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_PSR, "addOrUpdateDistributionConfigs(DistributionConfig[])", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        ethers.constants.AddressZero,
        "setCollateralFactor(address,uint256,uint256)",
        AccountType.CRITICAL_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setMarketBorrowCaps(address[],uint256[])", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setMarketSupplyCaps(address[],uint256[])", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        ethers.constants.AddressZero,
        "setActionsPaused(address[],uint256[],bool)",
        AccountType.CRITICAL_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setForcedLiquidation(address,bool)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setReserveFactor(uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setInterestRateModel(address)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setReduceReservesBlockDelta(uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "unlistMarket(address)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        ethers.constants.AddressZero,
        "setCollateralFactor(address,uint256,uint256)",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [
        ethers.constants.AddressZero,
        "setMarketBorrowCaps(address[],uint256[])",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [
        ethers.constants.AddressZero,
        "setMarketSupplyCaps(address[],uint256[])",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [
        ethers.constants.AddressZero,
        "setActionsPaused(address[],uint256[],bool)",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setForcedLiquidation(address,bool)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setReserveFactor(uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setInterestRateModel(address)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setReduceReservesBlockDelta(uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "unlistMarket(address)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        ethers.constants.AddressZero,
        "setCollateralFactor(address,uint256,uint256)",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setCloseFactor(uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setLiquidationIncentive(uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setMarketBorrowCaps(address[],uint256[])", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setMarketSupplyCaps(address[],uint256[])", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setActionsPaused(address[],uint256[],bool)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setMinLiquidatableCollateral(uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setForcedLiquidation(address,bool)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        ARBITRUMONE_POOL_REGISTRY,
        "addPool(string,address,uint256,uint256,uint256)",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_POOL_REGISTRY, "addMarket(AddMarketInput)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_POOL_REGISTRY, "setPoolName(address,string)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_POOL_REGISTRY, "updatePoolMetadata(address,VenusPoolMetaData)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setProtocolSeizeShare(uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setReserveFactor(uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setInterestRateModel(address)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setReduceReservesBlockDelta(uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "unlistMarket(address)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_XVS_VAULT_PROXY, "pause()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_XVS_VAULT_PROXY, "resume()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        ARBITRUMONE_XVS_VAULT_PROXY,
        "setRewardAmountPerBlockOrSecond(address,uint256)",
        AccountType.CRITICAL_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_XVS_VAULT_PROXY, "pause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_XVS_VAULT_PROXY, "resume()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        ARBITRUMONE_XVS_VAULT_PROXY,
        "setRewardAmountPerBlockOrSecond(address,uint256)",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_XVS_VAULT_PROXY, "pause()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_XVS_VAULT_PROXY, "resume()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        ARBITRUMONE_XVS_VAULT_PROXY,
        "add(address,uint256,address,uint256,uint256)",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_XVS_VAULT_PROXY, "set(address,uint256,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        ARBITRUMONE_XVS_VAULT_PROXY,
        "setRewardAmountPerBlockOrSecond(address,uint256)",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [
        ARBITRUMONE_XVS_VAULT_PROXY,
        "setWithdrawalLockingPeriod(address,uint256,uint256)",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_RESILIENT_ORACLE, "pause()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_RESILIENT_ORACLE, "unpause()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_RESILIENT_ORACLE, "setOracle(address,address,uint8)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_RESILIENT_ORACLE, "enableOracle(address,uint8,bool)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_RESILIENT_ORACLE, "setTokenConfig(TokenConfig)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_CHAINLINK_ORACLE, "setTokenConfig(TokenConfig)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_CHAINLINK_ORACLE, "setDirectPrice(address,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_REDSTONE_ORACLE, "setTokenConfig(TokenConfig)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_REDSTONE_ORACLE, "setDirectPrice(address,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_BOUND_VALIDATOR, "setValidateConfig(ValidateConfig)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_RESILIENT_ORACLE, "pause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_RESILIENT_ORACLE, "unpause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_RESILIENT_ORACLE, "setTokenConfig(TokenConfig)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_CHAINLINK_ORACLE, "setTokenConfig(TokenConfig)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_CHAINLINK_ORACLE, "setDirectPrice(address,uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },

    {
      permissionType: false,
      params: [ARBITRUMONE_REDSTONE_ORACLE, "setTokenConfig(TokenConfig)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_REDSTONE_ORACLE, "setDirectPrice(address,uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_RESILIENT_ORACLE, "pause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_RESILIENT_ORACLE, "pause()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_RESILIENT_ORACLE, "unpause()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_RESILIENT_ORACLE, "setTokenConfig(TokenConfig)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_CHAINLINK_ORACLE, "setTokenConfig(TokenConfig)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_CHAINLINK_ORACLE, "setDirectPrice(address,uint256)", AccountType.CRITICAL_TIMELOCK],
    },

    {
      permissionType: false,
      params: [ARBITRUMONE_REDSTONE_ORACLE, "setTokenConfig(TokenConfig)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_REDSTONE_ORACLE, "setDirectPrice(address,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_XVS, "migrateMinterTokens(address,address)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_XVS, "setMintCap(address,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_XVS, "updateBlacklist(address,bool)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_XVS, "pause()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_XVS, "unpause()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_XVS, "migrateMinterTokens(address,address)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_XVS, "setMintCap(address,uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_XVS, "updateBlacklist(address,bool)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_XVS, "pause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_XVS, "unpause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_XVS, "migrateMinterTokens(address,address)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_XVS, "setMintCap(address,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_XVS, "updateBlacklist(address,bool)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_XVS, "pause()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_XVS, "unpause()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_XVS_BRIDGE_ADMIN, "setSendVersion(uint16)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_XVS_BRIDGE_ADMIN, "setReceiveVersion(uint16)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_XVS_BRIDGE_ADMIN, "forceResumeReceive(uint16,bytes)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_XVS_BRIDGE_ADMIN, "setOracle(address)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        ARBITRUMONE_XVS_BRIDGE_ADMIN,
        "setMaxSingleTransactionLimit(uint16,uint256)",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_XVS_BRIDGE_ADMIN, "setMaxDailyLimit(uint16,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        ARBITRUMONE_XVS_BRIDGE_ADMIN,
        "setMaxSingleReceiveTransactionLimit(uint16,uint256)",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_XVS_BRIDGE_ADMIN, "setMaxDailyReceiveLimit(uint16,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_XVS_BRIDGE_ADMIN, "pause()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_XVS_BRIDGE_ADMIN, "unpause()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_XVS_BRIDGE_ADMIN, "removeTrustedRemote(uint16)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_XVS_BRIDGE_ADMIN, "dropFailedMessage(uint16,bytes,uint64)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_XVS_BRIDGE_ADMIN, "setPrecrime(address)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_XVS_BRIDGE_ADMIN, "setMinDstGas(uint16,uint16,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_XVS_BRIDGE_ADMIN, "setPayloadSizeLimit(uint16,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_XVS_BRIDGE_ADMIN, "setWhitelist(address,bool)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_XVS_BRIDGE_ADMIN, "setConfig(uint16,uint16,uint256,bytes)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_XVS_BRIDGE_ADMIN, "sweepToken(address,address,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_XVS_BRIDGE_ADMIN, "updateSendAndCallEnabled(bool)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_XVS_BRIDGE_ADMIN, "setTrustedRemoteAddress(uint16,bytes)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_XVS_BRIDGE_ADMIN, "transferBridgeOwnership(address)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_XVS_BRIDGE_ADMIN, "setSendVersion(uint16)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_XVS_BRIDGE_ADMIN, "setReceiveVersion(uint16)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_XVS_BRIDGE_ADMIN, "forceResumeReceive(uint16,bytes)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        ARBITRUMONE_XVS_BRIDGE_ADMIN,
        "setMaxSingleTransactionLimit(uint16,uint256)",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_XVS_BRIDGE_ADMIN, "setMaxDailyLimit(uint16,uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        ARBITRUMONE_XVS_BRIDGE_ADMIN,
        "setMaxSingleReceiveTransactionLimit(uint16,uint256)",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [
        ARBITRUMONE_XVS_BRIDGE_ADMIN,
        "setMaxDailyReceiveLimit(uint16,uint256)",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_XVS_BRIDGE_ADMIN, "pause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_XVS_BRIDGE_ADMIN, "unpause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_XVS_BRIDGE_ADMIN, "removeTrustedRemote(uint16)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_XVS_BRIDGE_ADMIN, "dropFailedMessage(uint16,bytes,uint64)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_XVS_BRIDGE_ADMIN, "setMinDstGas(uint16,uint16,uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_XVS_BRIDGE_ADMIN, "setPayloadSizeLimit(uint16,uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_XVS_BRIDGE_ADMIN, "setWhitelist(address,bool)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_XVS_BRIDGE_ADMIN, "setConfig(uint16,uint16,uint256,bytes)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_XVS_BRIDGE_ADMIN, "updateSendAndCallEnabled(bool)", AccountType.FAST_TRACK_TIMELOCK],
    },

    {
      permissionType: false,
      params: [ARBITRUMONE_XVS_BRIDGE_ADMIN, "setSendVersion(uint16)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_XVS_BRIDGE_ADMIN, "setReceiveVersion(uint16)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_XVS_BRIDGE_ADMIN, "forceResumeReceive(uint16,bytes)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        ARBITRUMONE_XVS_BRIDGE_ADMIN,
        "setMaxSingleTransactionLimit(uint16,uint256)",
        AccountType.CRITICAL_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_XVS_BRIDGE_ADMIN, "setMaxDailyLimit(uint16,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        ARBITRUMONE_XVS_BRIDGE_ADMIN,
        "setMaxSingleReceiveTransactionLimit(uint16,uint256)",
        AccountType.CRITICAL_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_XVS_BRIDGE_ADMIN, "setMaxDailyReceiveLimit(uint16,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_XVS_BRIDGE_ADMIN, "pause()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_XVS_BRIDGE_ADMIN, "unpause()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_XVS_BRIDGE_ADMIN, "removeTrustedRemote(uint16)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_XVS_BRIDGE_ADMIN, "dropFailedMessage(uint16,bytes,uint64)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_XVS_BRIDGE_ADMIN, "setMinDstGas(uint16,uint16,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_XVS_BRIDGE_ADMIN, "setPayloadSizeLimit(uint16,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_XVS_BRIDGE_ADMIN, "setWhitelist(address,bool)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_XVS_BRIDGE_ADMIN, "setConfig(uint16,uint16,uint256,bytes)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMONE_XVS_BRIDGE_ADMIN, "updateSendAndCallEnabled(bool)", AccountType.CRITICAL_TIMELOCK],
    },
  ],
  ethereum: [
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "pauseConversion()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "resumeConversion()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setMinAmountToConvert(uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        ethers.constants.AddressZero,
        "setConversionConfig(address,address,ConversionConfig)",
        AccountType.CRITICAL_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "pauseConversion()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "resumeConversion()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setMinAmountToConvert(uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        ethers.constants.AddressZero,
        "setConversionConfig(address,address,ConversionConfig)",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "pauseConversion()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "resumeConversion()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setMinAmountToConvert(uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        ethers.constants.AddressZero,
        "setConversionConfig(address,address,ConversionConfig)",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [
        ethers.constants.AddressZero,
        "updateJumpRateModel(uint256,uint256,uint256,uint256)",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [
        ethers.constants.AddressZero,
        "setRewardTokenSpeeds(address[],uint256[],uint256[])",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [
        ethers.constants.AddressZero,
        "setLastRewardingBlocks(address[],uint32[],uint32[])",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [ETHEREUM_CONVERTER_NETWORK, "addTokenConverter(address)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_CONVERTER_NETWORK, "removeTokenConverter(address)", AccountType.NORMAL_TIMELOCK],
    },

    // Grant permissions to fast track timelock
    {
      permissionType: false,
      params: [ETHEREUM_CONVERTER_NETWORK, "addTokenConverter(address)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_CONVERTER_NETWORK, "removeTokenConverter(address)", AccountType.FAST_TRACK_TIMELOCK],
    },

    // Grant permissions to critical timelock
    {
      permissionType: false,
      params: [ETHEREUM_CONVERTER_NETWORK, "addTokenConverter(address)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_CONVERTER_NETWORK, "removeTokenConverter(address)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_PRIME, "updateAlpha(uint128,uint128)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_PRIME, "updateMultipliers(address,uint256,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_PRIME, "setStakedAt(address[],uint256[])", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_PRIME, "addMarket(address,address,uint256,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_PRIME, "setLimit(uint256,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_PRIME, "setMaxLoopsLimit(uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_PRIME, "issue(bool,address[])", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_PRIME, "burn(address)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_PRIME, "togglePause()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_PLP, "setTokensDistributionSpeed(address[],uint256[])", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_PLP, "setMaxTokensDistributionSpeed(address[],uint256[])", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_PLP, "setMaxLoopsLimit(uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_PLP, "pauseFundsTransfer()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_PLP, "resumeFundsTransfer()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_PRIME, "updateAlpha(uint128,uint128)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_PRIME, "updateMultipliers(address,uint256,uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_PRIME, "setStakedAt(address[],uint256[])", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_PRIME, "addMarket(address,address,uint256,uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_PRIME, "setLimit(uint256,uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_PRIME, "setMaxLoopsLimit(uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_PRIME, "issue(bool,address[])", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_PRIME, "burn(address)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_PRIME, "togglePause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_PLP, "setTokensDistributionSpeed(address[],uint256[])", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_PLP, "setMaxTokensDistributionSpeed(address[],uint256[])", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_PLP, "setMaxLoopsLimit(uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_PLP, "pauseFundsTransfer()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_PLP, "resumeFundsTransfer()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_PRIME, "updateMultipliers(address,uint256,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_PRIME, "setStakedAt(address[],uint256[])", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_PRIME, "addMarket(address,address,uint256,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_PRIME, "setLimit(uint256,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_PRIME, "setMaxLoopsLimit(uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_PRIME, "issue(bool,address[])", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_PRIME, "burn(address)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_PRIME, "togglePause()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_PLP, "setTokensDistributionSpeed(address[],uint256[])", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_PLP, "setMaxTokensDistributionSpeed(address[],uint256[])", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_PLP, "setMaxLoopsLimit(uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_PLP, "pauseFundsTransfer()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_PLP, "resumeFundsTransfer()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_PRIME, "updateAlpha(uint128,uint128)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_PSR, "removeDistributionConfig(Schema,address)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_PSR, "addOrUpdateDistributionConfigs(DistributionConfig[])", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_PSR, "removeDistributionConfig(Schema,address)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_PSR, "addOrUpdateDistributionConfigs(DistributionConfig[])", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_PSR, "removeDistributionConfig(Schema,address)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_PSR, "addOrUpdateDistributionConfigs(DistributionConfig[])", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        ethers.constants.AddressZero,
        "setCollateralFactor(address,uint256,uint256)",
        AccountType.CRITICAL_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setMarketBorrowCaps(address[],uint256[])", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setMarketSupplyCaps(address[],uint256[])", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        ethers.constants.AddressZero,
        "setActionsPaused(address[],uint256[],bool)",
        AccountType.CRITICAL_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setForcedLiquidation(address,bool)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setReserveFactor(uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setInterestRateModel(address)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setReduceReservesBlockDelta(uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "unlistMarket(address)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        ethers.constants.AddressZero,
        "setCollateralFactor(address,uint256,uint256)",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [
        ethers.constants.AddressZero,
        "setMarketBorrowCaps(address[],uint256[])",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [
        ethers.constants.AddressZero,
        "setMarketSupplyCaps(address[],uint256[])",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [
        ethers.constants.AddressZero,
        "setActionsPaused(address[],uint256[],bool)",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setForcedLiquidation(address,bool)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setReserveFactor(uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setInterestRateModel(address)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setReduceReservesBlockDelta(uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "unlistMarket(address)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        ethers.constants.AddressZero,
        "setCollateralFactor(address,uint256,uint256)",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setCloseFactor(uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setLiquidationIncentive(uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setMarketBorrowCaps(address[],uint256[])", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setMarketSupplyCaps(address[],uint256[])", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setActionsPaused(address[],uint256[],bool)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setMinLiquidatableCollateral(uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setForcedLiquidation(address,bool)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_POOL_REGISTRY, "addPool(string,address,uint256,uint256,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_POOL_REGISTRY, "addMarket(AddMarketInput)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_POOL_REGISTRY, "setPoolName(address,string)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_POOL_REGISTRY, "updatePoolMetadata(address,VenusPoolMetaData)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setProtocolSeizeShare(uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setReserveFactor(uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setInterestRateModel(address)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setReduceReservesBlockDelta(uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "unlistMarket(address)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_XVS_VAULT_PROXY, "pause()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_XVS_VAULT_PROXY, "resume()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        ETHEREUM_XVS_VAULT_PROXY,
        "setRewardAmountPerBlockOrSecond(address,uint256)",
        AccountType.CRITICAL_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [ETHEREUM_XVS_VAULT_PROXY, "pause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_XVS_VAULT_PROXY, "resume()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        ETHEREUM_XVS_VAULT_PROXY,
        "setRewardAmountPerBlockOrSecond(address,uint256)",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [ETHEREUM_XVS_VAULT_PROXY, "pause()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_XVS_VAULT_PROXY, "resume()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_XVS_VAULT_PROXY, "add(address,uint256,address,uint256,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_XVS_VAULT_PROXY, "set(address,uint256,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        ETHEREUM_XVS_VAULT_PROXY,
        "setRewardAmountPerBlockOrSecond(address,uint256)",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [
        ETHEREUM_XVS_VAULT_PROXY,
        "setWithdrawalLockingPeriod(address,uint256,uint256)",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [ETHEREUM_RESILIENT_ORACLE, "pause()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_RESILIENT_ORACLE, "unpause()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_RESILIENT_ORACLE, "setOracle(address,address,uint8)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_RESILIENT_ORACLE, "enableOracle(address,uint8,bool)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_RESILIENT_ORACLE, "setTokenConfig(TokenConfig)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_CHAINLINK_ORACLE, "setTokenConfig(TokenConfig)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_CHAINLINK_ORACLE, "setDirectPrice(address,uint256)", AccountType.NORMAL_TIMELOCK],
    },

    {
      permissionType: false,
      params: [ETHEREUM_REDSTONE_ORACLE, "setTokenConfig(TokenConfig)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_REDSTONE_ORACLE, "setDirectPrice(address,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_BOUND_VALIDATOR, "setValidateConfig(ValidateConfig)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_sFrxETH_ORACLE, "setMaxAllowedPriceDifference(uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_RESILIENT_ORACLE, "unpause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_RESILIENT_ORACLE, "setTokenConfig(TokenConfig)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_CHAINLINK_ORACLE, "setTokenConfig(TokenConfig)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_CHAINLINK_ORACLE, "setDirectPrice(address,uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },

    {
      permissionType: false,
      params: [ETHEREUM_REDSTONE_ORACLE, "setTokenConfig(TokenConfig)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_REDSTONE_ORACLE, "setDirectPrice(address,uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_sFrxETH_ORACLE, "setMaxAllowedPriceDifference(uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_RESILIENT_ORACLE, "pause()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_RESILIENT_ORACLE, "unpause()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_RESILIENT_ORACLE, "setTokenConfig(TokenConfig)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_CHAINLINK_ORACLE, "setTokenConfig(TokenConfig)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_CHAINLINK_ORACLE, "setDirectPrice(address,uint256)", AccountType.CRITICAL_TIMELOCK],
    },

    {
      permissionType: false,
      params: [ETHEREUM_REDSTONE_ORACLE, "setTokenConfig(TokenConfig)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_REDSTONE_ORACLE, "setDirectPrice(address,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_sFrxETH_ORACLE, "setMaxAllowedPriceDifference(uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_XVS, "migrateMinterTokens(address,address)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_XVS, "setMintCap(address,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_XVS, "updateBlacklist(address,bool)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_XVS, "pause()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_XVS, "unpause()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_XVS, "migrateMinterTokens(address,address)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_XVS, "setMintCap(address,uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_XVS, "updateBlacklist(address,bool)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_XVS, "pause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_XVS, "unpause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_XVS, "migrateMinterTokens(address,address)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_XVS, "setMintCap(address,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_XVS, "updateBlacklist(address,bool)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_XVS, "pause()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_XVS, "unpause()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "setSendVersion(uint16)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "setReceiveVersion(uint16)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "forceResumeReceive(uint16,bytes)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "setOracle(address)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "setMaxSingleTransactionLimit(uint16,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "setMaxDailyLimit(uint16,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        ETHEREUM_XVS_BRIDGE_ADMIN,
        "setMaxSingleReceiveTransactionLimit(uint16,uint256)",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "setMaxDailyReceiveLimit(uint16,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "pause()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "unpause()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "removeTrustedRemote(uint16)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "dropFailedMessage(uint16,bytes,uint64)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "setPrecrime(address)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "setMinDstGas(uint16,uint16,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "setPayloadSizeLimit(uint16,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "setWhitelist(address,bool)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "setConfig(uint16,uint16,uint256,bytes)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "sweepToken(address,address,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "updateSendAndCallEnabled(bool)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "setTrustedRemoteAddress(uint16,bytes)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "transferBridgeOwnership(address)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "setSendVersion(uint16)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "setReceiveVersion(uint16)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "forceResumeReceive(uint16,bytes)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        ETHEREUM_XVS_BRIDGE_ADMIN,
        "setMaxSingleTransactionLimit(uint16,uint256)",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "setMaxDailyLimit(uint16,uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        ETHEREUM_XVS_BRIDGE_ADMIN,
        "setMaxSingleReceiveTransactionLimit(uint16,uint256)",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "setMaxDailyReceiveLimit(uint16,uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "pause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "unpause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "removeTrustedRemote(uint16)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "dropFailedMessage(uint16,bytes,uint64)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "setMinDstGas(uint16,uint16,uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "setPayloadSizeLimit(uint16,uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "setWhitelist(address,bool)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "setConfig(uint16,uint16,uint256,bytes)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "updateSendAndCallEnabled(bool)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "setSendVersion(uint16)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "setReceiveVersion(uint16)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "forceResumeReceive(uint16,bytes)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        ETHEREUM_XVS_BRIDGE_ADMIN,
        "setMaxSingleTransactionLimit(uint16,uint256)",
        AccountType.CRITICAL_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "setMaxDailyLimit(uint16,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        ETHEREUM_XVS_BRIDGE_ADMIN,
        "setMaxSingleReceiveTransactionLimit(uint16,uint256)",
        AccountType.CRITICAL_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "setMaxDailyReceiveLimit(uint16,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "pause()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "unpause()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "removeTrustedRemote(uint16)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "dropFailedMessage(uint16,bytes,uint64)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "setMinDstGas(uint16,uint16,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "setPayloadSizeLimit(uint16,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "setWhitelist(address,bool)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "setConfig(uint16,uint16,uint256,bytes)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "updateSendAndCallEnabled(bool)", AccountType.CRITICAL_TIMELOCK],
    },
  ],
  opbnbmainnet: [
    {
      permissionType: false,
      params: [
        ethers.constants.AddressZero,
        "updateJumpRateModel(uint256,uint256,uint256,uint256)",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [OPBNBMAINNET_PSR, "removeDistributionConfig(Schema,address)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBMAINNET_PSR, "addOrUpdateDistributionConfigs(DistributionConfig[])", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBMAINNET_PSR, "removeDistributionConfig(Schema,address)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        OPBNBMAINNET_PSR,
        "addOrUpdateDistributionConfigs(DistributionConfig[])",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [OPBNBMAINNET_PSR, "removeDistributionConfig(Schema,address)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBMAINNET_PSR, "addOrUpdateDistributionConfigs(DistributionConfig[])", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        ethers.constants.AddressZero,
        "setCollateralFactor(address,uint256,uint256)",
        AccountType.CRITICAL_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setMarketBorrowCaps(address[],uint256[])", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setMarketSupplyCaps(address[],uint256[])", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        ethers.constants.AddressZero,
        "setActionsPaused(address[],uint256[],bool)",
        AccountType.CRITICAL_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setForcedLiquidation(address,bool)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setReserveFactor(uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setInterestRateModel(address)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setReduceReservesBlockDelta(uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "unlistMarket(address)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        ethers.constants.AddressZero,
        "setCollateralFactor(address,uint256,uint256)",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [
        ethers.constants.AddressZero,
        "setMarketBorrowCaps(address[],uint256[])",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [
        ethers.constants.AddressZero,
        "setMarketSupplyCaps(address[],uint256[])",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [
        ethers.constants.AddressZero,
        "setActionsPaused(address[],uint256[],bool)",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setForcedLiquidation(address,bool)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setReserveFactor(uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setInterestRateModel(address)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setReduceReservesBlockDelta(uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "unlistMarket(address)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        ethers.constants.AddressZero,
        "setCollateralFactor(address,uint256,uint256)",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setCloseFactor(uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setLiquidationIncentive(uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setMarketBorrowCaps(address[],uint256[])", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setMarketSupplyCaps(address[],uint256[])", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setActionsPaused(address[],uint256[],bool)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setMinLiquidatableCollateral(uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setForcedLiquidation(address,bool)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        OPBNBMAINNET_POOL_REGISTRY,
        "addPool(string,address,uint256,uint256,uint256)",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [OPBNBMAINNET_POOL_REGISTRY, "addMarket(AddMarketInput)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBMAINNET_POOL_REGISTRY, "setPoolName(address,string)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        OPBNBMAINNET_POOL_REGISTRY,
        "updatePoolMetadata(address,VenusPoolMetaData)",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setProtocolSeizeShare(uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setReserveFactor(uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setInterestRateModel(address)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setReduceReservesBlockDelta(uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBMAINNET_XVS_VAULT_PROXY, "pause()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBMAINNET_XVS_VAULT_PROXY, "resume()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        OPBNBMAINNET_XVS_VAULT_PROXY,
        "setRewardAmountPerBlockOrSecond(address,uint256)",
        AccountType.CRITICAL_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [OPBNBMAINNET_XVS_VAULT_PROXY, "pause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBMAINNET_XVS_VAULT_PROXY, "resume()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        OPBNBMAINNET_XVS_VAULT_PROXY,
        "setRewardAmountPerBlockOrSecond(address,uint256)",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [OPBNBMAINNET_XVS_VAULT_PROXY, "pause()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBMAINNET_XVS_VAULT_PROXY, "resume()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        OPBNBMAINNET_XVS_VAULT_PROXY,
        "add(address,uint256,address,uint256,uint256)",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [OPBNBMAINNET_XVS_VAULT_PROXY, "set(address,uint256,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        OPBNBMAINNET_XVS_VAULT_PROXY,
        "setRewardAmountPerBlockOrSecond(address,uint256)",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [
        OPBNBMAINNET_XVS_VAULT_PROXY,
        "setWithdrawalLockingPeriod(address,uint256,uint256)",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [OPBNBMAINNET_RESILIENT_ORACLE, "pause()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBMAINNET_RESILIENT_ORACLE, "unpause()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBMAINNET_RESILIENT_ORACLE, "setOracle(address,address,uint8)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBMAINNET_RESILIENT_ORACLE, "enableOracle(address,uint8,bool)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBMAINNET_RESILIENT_ORACLE, "setTokenConfig(TokenConfig)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBMAINNET_BINANCE_ORACLE, "setMaxStalePeriod(string,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBMAINNET_BINANCE_ORACLE, "setSymbolOverride(string,string)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBMAINNET_BOUND_VALIDATOR, "setValidateConfig(ValidateConfig)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBMAINNET_RESILIENT_ORACLE, "pause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBMAINNET_RESILIENT_ORACLE, "unpause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBMAINNET_RESILIENT_ORACLE, "setTokenConfig(TokenConfig)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBMAINNET_BINANCE_ORACLE, "setMaxStalePeriod(string,uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBMAINNET_BINANCE_ORACLE, "setSymbolOverride(string,string)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBMAINNET_RESILIENT_ORACLE, "pause()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBMAINNET_RESILIENT_ORACLE, "unpause()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBMAINNET_RESILIENT_ORACLE, "setTokenConfig(TokenConfig)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBMAINNET_BINANCE_ORACLE, "setMaxStalePeriod(string,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBMAINNET_BINANCE_ORACLE, "setSymbolOverride(string,string)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBMAINNET_XVS, "migrateMinterTokens(address,address)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBMAINNET_XVS, "setMintCap(address,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBMAINNET_XVS, "updateBlacklist(address,bool)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBMAINNET_XVS, "pause()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBMAINNET_XVS, "unpause()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBMAINNET_XVS, "migrateMinterTokens(address,address)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBMAINNET_XVS, "setMintCap(address,uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBMAINNET_XVS, "updateBlacklist(address,bool)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBMAINNET_XVS, "pause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBMAINNET_XVS, "unpause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBMAINNET_XVS, "migrateMinterTokens(address,address)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBMAINNET_XVS, "setMintCap(address,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBMAINNET_XVS, "updateBlacklist(address,bool)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBMAINNET_XVS, "pause()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBMAINNET_XVS, "unpause()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBMAINNET_XVS_BRIDGE_ADMIN, "setSendVersion(uint16)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBMAINNET_XVS_BRIDGE_ADMIN, "setReceiveVersion(uint16)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBMAINNET_XVS_BRIDGE_ADMIN, "forceResumeReceive(uint16,bytes)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBMAINNET_XVS_BRIDGE_ADMIN, "setOracle(address)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        OPBNBMAINNET_XVS_BRIDGE_ADMIN,
        "setMaxSingleTransactionLimit(uint16,uint256)",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [OPBNBMAINNET_XVS_BRIDGE_ADMIN, "setMaxDailyLimit(uint16,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        OPBNBMAINNET_XVS_BRIDGE_ADMIN,
        "setMaxSingleReceiveTransactionLimit(uint16,uint256)",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [OPBNBMAINNET_XVS_BRIDGE_ADMIN, "setMaxDailyReceiveLimit(uint16,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBMAINNET_XVS_BRIDGE_ADMIN, "pause()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBMAINNET_XVS_BRIDGE_ADMIN, "unpause()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBMAINNET_XVS_BRIDGE_ADMIN, "removeTrustedRemote(uint16)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBMAINNET_XVS_BRIDGE_ADMIN, "dropFailedMessage(uint16,bytes,uint64)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBMAINNET_XVS_BRIDGE_ADMIN, "setPrecrime(address)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBMAINNET_XVS_BRIDGE_ADMIN, "setMinDstGas(uint16,uint16,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBMAINNET_XVS_BRIDGE_ADMIN, "setPayloadSizeLimit(uint16,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBMAINNET_XVS_BRIDGE_ADMIN, "setWhitelist(address,bool)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBMAINNET_XVS_BRIDGE_ADMIN, "setConfig(uint16,uint16,uint256,bytes)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBMAINNET_XVS_BRIDGE_ADMIN, "sweepToken(address,address,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBMAINNET_XVS_BRIDGE_ADMIN, "updateSendAndCallEnabled(bool)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBMAINNET_XVS_BRIDGE_ADMIN, "setTrustedRemoteAddress(uint16,bytes)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBMAINNET_XVS_BRIDGE_ADMIN, "transferBridgeOwnership(address)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBMAINNET_XVS_BRIDGE_ADMIN, "setSendVersion(uint16)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBMAINNET_XVS_BRIDGE_ADMIN, "setReceiveVersion(uint16)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBMAINNET_XVS_BRIDGE_ADMIN, "forceResumeReceive(uint16,bytes)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        OPBNBMAINNET_XVS_BRIDGE_ADMIN,
        "setMaxSingleTransactionLimit(uint16,uint256)",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [OPBNBMAINNET_XVS_BRIDGE_ADMIN, "setMaxDailyLimit(uint16,uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        OPBNBMAINNET_XVS_BRIDGE_ADMIN,
        "setMaxSingleReceiveTransactionLimit(uint16,uint256)",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [
        OPBNBMAINNET_XVS_BRIDGE_ADMIN,
        "setMaxDailyReceiveLimit(uint16,uint256)",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [OPBNBMAINNET_XVS_BRIDGE_ADMIN, "pause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBMAINNET_XVS_BRIDGE_ADMIN, "unpause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBMAINNET_XVS_BRIDGE_ADMIN, "removeTrustedRemote(uint16)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        OPBNBMAINNET_XVS_BRIDGE_ADMIN,
        "dropFailedMessage(uint16,bytes,uint64)",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [OPBNBMAINNET_XVS_BRIDGE_ADMIN, "setMinDstGas(uint16,uint16,uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBMAINNET_XVS_BRIDGE_ADMIN, "setPayloadSizeLimit(uint16,uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBMAINNET_XVS_BRIDGE_ADMIN, "setWhitelist(address,bool)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        OPBNBMAINNET_XVS_BRIDGE_ADMIN,
        "setConfig(uint16,uint16,uint256,bytes)",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [OPBNBMAINNET_XVS_BRIDGE_ADMIN, "updateSendAndCallEnabled(bool)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBMAINNET_XVS_BRIDGE_ADMIN, "setSendVersion(uint16)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBMAINNET_XVS_BRIDGE_ADMIN, "setReceiveVersion(uint16)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBMAINNET_XVS_BRIDGE_ADMIN, "forceResumeReceive(uint16,bytes)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        OPBNBMAINNET_XVS_BRIDGE_ADMIN,
        "setMaxSingleTransactionLimit(uint16,uint256)",
        AccountType.CRITICAL_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [OPBNBMAINNET_XVS_BRIDGE_ADMIN, "setMaxDailyLimit(uint16,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        OPBNBMAINNET_XVS_BRIDGE_ADMIN,
        "setMaxSingleReceiveTransactionLimit(uint16,uint256)",
        AccountType.CRITICAL_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [OPBNBMAINNET_XVS_BRIDGE_ADMIN, "setMaxDailyReceiveLimit(uint16,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBMAINNET_XVS_BRIDGE_ADMIN, "pause()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBMAINNET_XVS_BRIDGE_ADMIN, "unpause()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBMAINNET_XVS_BRIDGE_ADMIN, "removeTrustedRemote(uint16)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBMAINNET_XVS_BRIDGE_ADMIN, "dropFailedMessage(uint16,bytes,uint64)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBMAINNET_XVS_BRIDGE_ADMIN, "setMinDstGas(uint16,uint16,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBMAINNET_XVS_BRIDGE_ADMIN, "setPayloadSizeLimit(uint16,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBMAINNET_XVS_BRIDGE_ADMIN, "setWhitelist(address,bool)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBMAINNET_XVS_BRIDGE_ADMIN, "setConfig(uint16,uint16,uint256,bytes)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBMAINNET_XVS_BRIDGE_ADMIN, "updateSendAndCallEnabled(bool)", AccountType.CRITICAL_TIMELOCK],
    },
  ],
  arbitrumsepolia: [
    {
      permissionType: false,
      params: [
        ethers.constants.AddressZero,
        "updateJumpRateModel(uint256,uint256,uint256,uint256)",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [
        ethers.constants.AddressZero,
        "setRewardTokenSpeeds(address[],uint256[],uint256[])",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [
        ethers.constants.AddressZero,
        "setLastRewardingBlocks(address[],uint32[],uint32[])",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [
        ethers.constants.AddressZero,
        "setLastRewardingBlockTimestamps(address[],uint256[],uint256[])",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_PRIME, "updateAlpha(uint128,uint128)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_PRIME, "updateMultipliers(address,uint256,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_PRIME, "setStakedAt(address[],uint256[])", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_PRIME, "addMarket(address,address,uint256,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_PRIME, "setLimit(uint256,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_PRIME, "setMaxLoopsLimit(uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_PRIME, "issue(bool,address[])", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_PRIME, "burn(address)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_PRIME, "togglePause()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_PLP, "setTokensDistributionSpeed(address[],uint256[])", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        ARBITRUMSEPOLIA_PLP,
        "setMaxTokensDistributionSpeed(address[],uint256[])",
        AccountType.CRITICAL_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_PLP, "setMaxLoopsLimit(uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_PLP, "pauseFundsTransfer()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_PLP, "resumeFundsTransfer()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_PRIME, "updateAlpha(uint128,uint128)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_PRIME, "updateMultipliers(address,uint256,uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_PRIME, "setStakedAt(address[],uint256[])", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_PRIME, "addMarket(address,address,uint256,uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_PRIME, "setLimit(uint256,uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_PRIME, "setMaxLoopsLimit(uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_PRIME, "issue(bool,address[])", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_PRIME, "burn(address)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_PRIME, "togglePause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_PLP, "setTokensDistributionSpeed(address[],uint256[])", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        ARBITRUMSEPOLIA_PLP,
        "setMaxTokensDistributionSpeed(address[],uint256[])",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_PLP, "setMaxLoopsLimit(uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_PLP, "pauseFundsTransfer()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_PLP, "resumeFundsTransfer()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_PRIME, "updateAlpha(uint128,uint128)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_PRIME, "updateMultipliers(address,uint256,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_PRIME, "setStakedAt(address[],uint256[])", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_PRIME, "addMarket(address,address,uint256,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_PRIME, "setLimit(uint256,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_PRIME, "setMaxLoopsLimit(uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_PRIME, "issue(bool,address[])", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_PRIME, "burn(address)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_PRIME, "togglePause()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_PLP, "setTokensDistributionSpeed(address[],uint256[])", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_PLP, "setMaxTokensDistributionSpeed(address[],uint256[])", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_PLP, "setMaxLoopsLimit(uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_PLP, "pauseFundsTransfer()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_PLP, "resumeFundsTransfer()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_PSR, "removeDistributionConfig(Schema,address)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        ARBITRUMSEPOLIA_PSR,
        "addOrUpdateDistributionConfigs(DistributionConfig[])",
        AccountType.CRITICAL_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_PSR, "removeDistributionConfig(Schema,address)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        ARBITRUMSEPOLIA_PSR,
        "addOrUpdateDistributionConfigs(DistributionConfig[])",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_PSR, "removeDistributionConfig(Schema,address)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        ARBITRUMSEPOLIA_PSR,
        "addOrUpdateDistributionConfigs(DistributionConfig[])",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [
        ethers.constants.AddressZero,
        "setCollateralFactor(address,uint256,uint256)",
        AccountType.CRITICAL_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setMarketBorrowCaps(address[],uint256[])", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setMarketSupplyCaps(address[],uint256[])", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        ethers.constants.AddressZero,
        "setActionsPaused(address[],uint256[],bool)",
        AccountType.CRITICAL_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setForcedLiquidation(address,bool)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setReserveFactor(uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setInterestRateModel(address)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setReduceReservesBlockDelta(uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "unlistMarket(address)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        ethers.constants.AddressZero,
        "setCollateralFactor(address,uint256,uint256)",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [
        ethers.constants.AddressZero,
        "setMarketBorrowCaps(address[],uint256[])",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [
        ethers.constants.AddressZero,
        "setMarketSupplyCaps(address[],uint256[])",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [
        ethers.constants.AddressZero,
        "setActionsPaused(address[],uint256[],bool)",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setForcedLiquidation(address,bool)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setReserveFactor(uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setInterestRateModel(address)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setReduceReservesBlockDelta(uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "unlistMarket(address)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        ethers.constants.AddressZero,
        "setCollateralFactor(address,uint256,uint256)",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setCloseFactor(uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setLiquidationIncentive(uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setMarketBorrowCaps(address[],uint256[])", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setMarketSupplyCaps(address[],uint256[])", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setActionsPaused(address[],uint256[],bool)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setMinLiquidatableCollateral(uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setForcedLiquidation(address,bool)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        ARBITRUMSEPOLIA_POOL_REGISTRY,
        "addPool(string,address,uint256,uint256,uint256)",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_POOL_REGISTRY, "addMarket(AddMarketInput)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_POOL_REGISTRY, "setPoolName(address,string)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        ARBITRUMSEPOLIA_POOL_REGISTRY,
        "updatePoolMetadata(address,VenusPoolMetaData)",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setProtocolSeizeShare(uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setReserveFactor(uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setInterestRateModel(address)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setReduceReservesBlockDelta(uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "unlistMarket(address)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_XVS_VAULT_PROXY, "pause()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_XVS_VAULT_PROXY, "resume()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        ARBITRUMSEPOLIA_XVS_VAULT_PROXY,
        "setRewardAmountPerBlockOrSecond(address,uint256)",
        AccountType.CRITICAL_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_XVS_VAULT_PROXY, "pause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_XVS_VAULT_PROXY, "resume()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        ARBITRUMSEPOLIA_XVS_VAULT_PROXY,
        "setRewardAmountPerBlockOrSecond(address,uint256)",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_XVS_VAULT_PROXY, "pause()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_XVS_VAULT_PROXY, "resume()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        ARBITRUMSEPOLIA_XVS_VAULT_PROXY,
        "add(address,uint256,address,uint256,uint256)",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_XVS_VAULT_PROXY, "set(address,uint256,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        ARBITRUMSEPOLIA_XVS_VAULT_PROXY,
        "setRewardAmountPerBlockOrSecond(address,uint256)",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [
        ARBITRUMSEPOLIA_XVS_VAULT_PROXY,
        "setWithdrawalLockingPeriod(address,uint256,uint256)",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_RESILIENT_ORACLE, "pause()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_RESILIENT_ORACLE, "unpause()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_RESILIENT_ORACLE, "setOracle(address,address,uint8)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_RESILIENT_ORACLE, "enableOracle(address,uint8,bool)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_RESILIENT_ORACLE, "setTokenConfig(TokenConfig)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_CHAINLINK_ORACLE, "setTokenConfig(TokenConfig)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_CHAINLINK_ORACLE, "setDirectPrice(address,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_REDSTONE_ORACLE, "setTokenConfig(TokenConfig)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_REDSTONE_ORACLE, "setDirectPrice(address,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUM_SEPOLIA_BOUND_VALIDATOR, "setValidateConfig(ValidateConfig)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_RESILIENT_ORACLE, "pause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_RESILIENT_ORACLE, "unpause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_RESILIENT_ORACLE, "setTokenConfig(TokenConfig)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_CHAINLINK_ORACLE, "setTokenConfig(TokenConfig)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_CHAINLINK_ORACLE, "setDirectPrice(address,uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_REDSTONE_ORACLE, "setTokenConfig(TokenConfig)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_REDSTONE_ORACLE, "setDirectPrice(address,uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_RESILIENT_ORACLE, "pause()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_RESILIENT_ORACLE, "unpause()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_RESILIENT_ORACLE, "setTokenConfig(TokenConfig)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_CHAINLINK_ORACLE, "setTokenConfig(TokenConfig)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_CHAINLINK_ORACLE, "setDirectPrice(address,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_REDSTONE_ORACLE, "setTokenConfig(TokenConfig)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_REDSTONE_ORACLE, "setDirectPrice(address,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_XVS, "migrateMinterTokens(address,address)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_XVS, "setMintCap(address,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_XVS, "updateBlacklist(address,bool)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_XVS, "pause()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_XVS, "unpause()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_XVS, "migrateMinterTokens(address,address)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_XVS, "setMintCap(address,uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_XVS, "updateBlacklist(address,bool)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_XVS, "pause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_XVS, "unpause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_XVS, "migrateMinterTokens(address,address)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_XVS, "setMintCap(address,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_XVS, "updateBlacklist(address,bool)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_XVS, "pause()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_XVS, "unpause()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN, "setSendVersion(uint16)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN, "setReceiveVersion(uint16)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN, "forceResumeReceive(uint16,bytes)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN, "setOracle(address)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN,
        "setMaxSingleTransactionLimit(uint16,uint256)",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN, "setMaxDailyLimit(uint16,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN,
        "setMaxSingleReceiveTransactionLimit(uint16,uint256)",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [
        ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN,
        "setMaxDailyReceiveLimit(uint16,uint256)",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN, "pause()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN, "unpause()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN, "removeTrustedRemote(uint16)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN, "dropFailedMessage(uint16,bytes,uint64)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN, "setPrecrime(address)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN, "setMinDstGas(uint16,uint16,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN, "setPayloadSizeLimit(uint16,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN, "setWhitelist(address,bool)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN, "setConfig(uint16,uint16,uint256,bytes)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN, "sweepToken(address,address,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN, "updateSendAndCallEnabled(bool)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN, "setTrustedRemoteAddress(uint16,bytes)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN, "transferBridgeOwnership(address)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN, "setSendVersion(uint16)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN, "setReceiveVersion(uint16)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN, "forceResumeReceive(uint16,bytes)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN,
        "setMaxSingleTransactionLimit(uint16,uint256)",
        AccountType.CRITICAL_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN, "setMaxDailyLimit(uint16,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN,
        "setMaxSingleReceiveTransactionLimit(uint16,uint256)",
        AccountType.CRITICAL_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [
        ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN,
        "setMaxDailyReceiveLimit(uint16,uint256)",
        AccountType.CRITICAL_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN, "pause()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN, "unpause()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN, "removeTrustedRemote(uint16)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN,
        "dropFailedMessage(uint16,bytes,uint64)",
        AccountType.CRITICAL_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN, "setMinDstGas(uint16,uint16,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN, "setPayloadSizeLimit(uint16,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN, "setWhitelist(address,bool)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN,
        "setConfig(uint16,uint16,uint256,bytes)",
        AccountType.CRITICAL_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN, "updateSendAndCallEnabled(bool)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN, "setSendVersion(uint16)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN, "setReceiveVersion(uint16)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN, "forceResumeReceive(uint16,bytes)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN,
        "setMaxSingleTransactionLimit(uint16,uint256)",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN, "setMaxDailyLimit(uint16,uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN,
        "setMaxSingleReceiveTransactionLimit(uint16,uint256)",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [
        ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN,
        "setMaxDailyReceiveLimit(uint16,uint256)",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN, "pause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN, "unpause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN, "removeTrustedRemote(uint16)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN,
        "dropFailedMessage(uint16,bytes,uint64)",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [
        ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN,
        "setMinDstGas(uint16,uint16,uint256)",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [
        ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN,
        "setPayloadSizeLimit(uint16,uint256)",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN, "setWhitelist(address,bool)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN,
        "setConfig(uint16,uint16,uint256,bytes)",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN, "updateSendAndCallEnabled(bool)", AccountType.FAST_TRACK_TIMELOCK],
    },
  ],
  sepolia: [
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "pauseConversion()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "resumeConversion()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setMinAmountToConvert(uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        ethers.constants.AddressZero,
        "setConversionConfig(address,address,ConversionConfig)",
        AccountType.CRITICAL_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "pauseConversion()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "resumeConversion()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setMinAmountToConvert(uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        ethers.constants.AddressZero,
        "setConversionConfig(address,address,ConversionConfig)",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "pauseConversion()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "resumeConversion()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setMinAmountToConvert(uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        ethers.constants.AddressZero,
        "setConversionConfig(address,address,ConversionConfig)",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [
        ethers.constants.AddressZero,
        "updateJumpRateModel(uint256,uint256,uint256,uint256)",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [
        ethers.constants.AddressZero,
        "setRewardTokenSpeeds(address[],uint256[],uint256[])",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [
        ethers.constants.AddressZero,
        "setLastRewardingBlocks(address[],uint32[],uint32[])",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [SEPOLIA_CONVERTER_NETWORK, "addTokenConverter(address)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_CONVERTER_NETWORK, "removeTokenConverter(address)", AccountType.NORMAL_TIMELOCK],
    },

    {
      permissionType: false,
      params: [SEPOLIA_CONVERTER_NETWORK, "addTokenConverter(address)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_CONVERTER_NETWORK, "removeTokenConverter(address)", AccountType.FAST_TRACK_TIMELOCK],
    },

    {
      permissionType: false,
      params: [SEPOLIA_CONVERTER_NETWORK, "addTokenConverter(address)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_CONVERTER_NETWORK, "removeTokenConverter(address)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_PRIME, "updateAlpha(uint128,uint128)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_PRIME, "updateMultipliers(address,uint256,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_PRIME, "setStakedAt(address[],uint256[])", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_PRIME, "addMarket(address,address,uint256,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_PRIME, "setLimit(uint256,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_PRIME, "setMaxLoopsLimit(uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_PRIME, "issue(bool,address[])", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_PRIME, "burn(address)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_PRIME, "togglePause()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_PLP, "setTokensDistributionSpeed(address[],uint256[])", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_PLP, "setMaxTokensDistributionSpeed(address[],uint256[])", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_PLP, "setMaxLoopsLimit(uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_PLP, "pauseFundsTransfer()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_PLP, "resumeFundsTransfer()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_PRIME, "updateAlpha(uint128,uint128)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_PRIME, "updateMultipliers(address,uint256,uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_PRIME, "setStakedAt(address[],uint256[])", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_PRIME, "addMarket(address,address,uint256,uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_PRIME, "setLimit(uint256,uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_PRIME, "setMaxLoopsLimit(uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_PRIME, "issue(bool,address[])", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_PRIME, "burn(address)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_PRIME, "togglePause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_PLP, "setTokensDistributionSpeed(address[],uint256[])", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_PLP, "setMaxTokensDistributionSpeed(address[],uint256[])", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_PLP, "setMaxLoopsLimit(uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_PLP, "pauseFundsTransfer()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_PLP, "resumeFundsTransfer()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_PRIME, "updateAlpha(uint128,uint128)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_PRIME, "updateMultipliers(address,uint256,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_PRIME, "setStakedAt(address[],uint256[])", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_PRIME, "addMarket(address,address,uint256,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_PRIME, "setLimit(uint256,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_PRIME, "setMaxLoopsLimit(uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_PRIME, "issue(bool,address[])", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_PRIME, "burn(address)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_PRIME, "togglePause()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_PLP, "setTokensDistributionSpeed(address[],uint256[])", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_PLP, "setMaxTokensDistributionSpeed(address[],uint256[])", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_PLP, "setMaxLoopsLimit(uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_PLP, "pauseFundsTransfer()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_PLP, "resumeFundsTransfer()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_PSR, "removeDistributionConfig(Schema,address)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_PSR, "addOrUpdateDistributionConfigs(DistributionConfig[])", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_PSR, "removeDistributionConfig(Schema,address)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_PSR, "addOrUpdateDistributionConfigs(DistributionConfig[])", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_PSR, "removeDistributionConfig(Schema,address)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_PSR, "addOrUpdateDistributionConfigs(DistributionConfig[])", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        ethers.constants.AddressZero,
        "setCollateralFactor(address,uint256,uint256)",
        AccountType.CRITICAL_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setMarketBorrowCaps(address[],uint256[])", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setMarketSupplyCaps(address[],uint256[])", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        ethers.constants.AddressZero,
        "setActionsPaused(address[],uint256[],bool)",
        AccountType.CRITICAL_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setForcedLiquidation(address,bool)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setReserveFactor(uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setInterestRateModel(address)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setReduceReservesBlockDelta(uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "unlistMarket(address)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        ethers.constants.AddressZero,
        "setCollateralFactor(address,uint256,uint256)",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [
        ethers.constants.AddressZero,
        "setMarketBorrowCaps(address[],uint256[])",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [
        ethers.constants.AddressZero,
        "setMarketSupplyCaps(address[],uint256[])",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [
        ethers.constants.AddressZero,
        "setActionsPaused(address[],uint256[],bool)",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setForcedLiquidation(address,bool)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setReserveFactor(uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setInterestRateModel(address)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setReduceReservesBlockDelta(uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "unlistMarket(address)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        ethers.constants.AddressZero,
        "setCollateralFactor(address,uint256,uint256)",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setCloseFactor(uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setLiquidationIncentive(uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setMarketBorrowCaps(address[],uint256[])", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setMarketSupplyCaps(address[],uint256[])", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setActionsPaused(address[],uint256[],bool)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setMinLiquidatableCollateral(uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setForcedLiquidation(address,bool)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_POOL_REGISTRY, "addPool(string,address,uint256,uint256,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_POOL_REGISTRY, "addMarket(AddMarketInput)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_POOL_REGISTRY, "setPoolName(address,string)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_POOL_REGISTRY, "updatePoolMetadata(address,VenusPoolMetaData)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setProtocolSeizeShare(uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setReserveFactor(uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setInterestRateModel(address)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setReduceReservesBlockDelta(uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "unlistMarket(address)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_XVS_VAULT_PROXY, "pause()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_XVS_VAULT_PROXY, "resume()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        SEPOLIA_XVS_VAULT_PROXY,
        "setRewardAmountPerBlockOrSecond(address,uint256)",
        AccountType.CRITICAL_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [SEPOLIA_XVS_VAULT_PROXY, "pause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_XVS_VAULT_PROXY, "resume()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        SEPOLIA_XVS_VAULT_PROXY,
        "setRewardAmountPerBlockOrSecond(address,uint256)",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [SEPOLIA_XVS_VAULT_PROXY, "pause()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_XVS_VAULT_PROXY, "resume()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_XVS_VAULT_PROXY, "add(address,uint256,address,uint256,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_XVS_VAULT_PROXY, "set(address,uint256,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        SEPOLIA_XVS_VAULT_PROXY,
        "setRewardAmountPerBlockOrSecond(address,uint256)",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [
        SEPOLIA_XVS_VAULT_PROXY,
        "setWithdrawalLockingPeriod(address,uint256,uint256)",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [SEPOLIA_RESILIENT_ORACLE, "pause()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_RESILIENT_ORACLE, "unpause()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_RESILIENT_ORACLE, "setOracle(address,address,uint8)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_RESILIENT_ORACLE, "enableOracle(address,uint8,bool)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_RESILIENT_ORACLE, "setTokenConfig(TokenConfig)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_CHAINLINK_ORACLE, "setTokenConfig(TokenConfig)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_CHAINLINK_ORACLE, "setDirectPrice(address,uint256)", AccountType.NORMAL_TIMELOCK],
    },

    {
      permissionType: false,
      params: [SEPOLIA_REDSTONE_ORACLE, "setTokenConfig(TokenConfig)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_REDSTONE_ORACLE, "setDirectPrice(address,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_BOUND_VALIDATOR, "setValidateConfig(ValidateConfig)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_sFrxETH_ORACLE, "setMaxAllowedPriceDifference(uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_RESILIENT_ORACLE, "pause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_RESILIENT_ORACLE, "unpause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_RESILIENT_ORACLE, "setTokenConfig(TokenConfig)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_CHAINLINK_ORACLE, "setTokenConfig(TokenConfig)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_CHAINLINK_ORACLE, "setDirectPrice(address,uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },

    {
      permissionType: false,
      params: [SEPOLIA_REDSTONE_ORACLE, "setTokenConfig(TokenConfig)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_REDSTONE_ORACLE, "setDirectPrice(address,uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_sFrxETH_ORACLE, "setMaxAllowedPriceDifference(uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_RESILIENT_ORACLE, "pause()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_RESILIENT_ORACLE, "unpause()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_RESILIENT_ORACLE, "setTokenConfig(TokenConfig)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_CHAINLINK_ORACLE, "setTokenConfig(TokenConfig)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_CHAINLINK_ORACLE, "setDirectPrice(address,uint256)", AccountType.CRITICAL_TIMELOCK],
    },

    {
      permissionType: false,
      params: [SEPOLIA_REDSTONE_ORACLE, "setTokenConfig(TokenConfig)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_REDSTONE_ORACLE, "setDirectPrice(address,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_sFrxETH_ORACLE, "setMaxAllowedPriceDifference(uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_XVS, "migrateMinterTokens(address,address)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_XVS, "setMintCap(address,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_XVS, "updateBlacklist(address,bool)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_XVS, "pause()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_XVS, "unpause()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_XVS, "migrateMinterTokens(address,address)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_XVS, "setMintCap(address,uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_XVS, "updateBlacklist(address,bool)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_XVS, "pause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_XVS, "unpause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_XVS, "migrateMinterTokens(address,address)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_XVS, "setMintCap(address,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_XVS, "updateBlacklist(address,bool)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_XVS, "pause()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_XVS, "unpause()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "setSendVersion(uint16)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "setReceiveVersion(uint16)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "forceResumeReceive(uint16,bytes)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "setOracle(address)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "setMaxSingleTransactionLimit(uint16,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "setMaxDailyLimit(uint16,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        SEPOLIA_XVS_BRIDGE_ADMIN,
        "setMaxSingleReceiveTransactionLimit(uint16,uint256)",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "setMaxDailyReceiveLimit(uint16,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "pause()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "unpause()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "removeTrustedRemote(uint16)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "dropFailedMessage(uint16,bytes,uint64)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "setPrecrime(address)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "setMinDstGas(uint16,uint16,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "setPayloadSizeLimit(uint16,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "setWhitelist(address,bool)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "setConfig(uint16,uint16,uint256,bytes)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "sweepToken(address,address,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "updateSendAndCallEnabled(bool)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "setTrustedRemoteAddress(uint16,bytes)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "transferBridgeOwnership(address)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "setSendVersion(uint16)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "setReceiveVersion(uint16)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "forceResumeReceive(uint16,bytes)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        SEPOLIA_XVS_BRIDGE_ADMIN,
        "setMaxSingleTransactionLimit(uint16,uint256)",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "setMaxDailyLimit(uint16,uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        SEPOLIA_XVS_BRIDGE_ADMIN,
        "setMaxSingleReceiveTransactionLimit(uint16,uint256)",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "setMaxDailyReceiveLimit(uint16,uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "pause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "unpause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "removeTrustedRemote(uint16)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "dropFailedMessage(uint16,bytes,uint64)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "setMinDstGas(uint16,uint16,uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "setPayloadSizeLimit(uint16,uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "setWhitelist(address,bool)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "setConfig(uint16,uint16,uint256,bytes)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "updateSendAndCallEnabled(bool)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "setSendVersion(uint16)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "setReceiveVersion(uint16)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "forceResumeReceive(uint16,bytes)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "setMaxSingleTransactionLimit(uint16,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "setMaxDailyLimit(uint16,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        SEPOLIA_XVS_BRIDGE_ADMIN,
        "setMaxSingleReceiveTransactionLimit(uint16,uint256)",
        AccountType.CRITICAL_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "setMaxDailyReceiveLimit(uint16,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "pause()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "unpause()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "removeTrustedRemote(uint16)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "dropFailedMessage(uint16,bytes,uint64)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "setMinDstGas(uint16,uint16,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "setPayloadSizeLimit(uint16,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "setWhitelist(address,bool)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "setConfig(uint16,uint16,uint256,bytes)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "updateSendAndCallEnabled(bool)", AccountType.CRITICAL_TIMELOCK],
    },
  ],
  opbnbtestnet: [
    {
      permissionType: false,
      params: [
        ethers.constants.AddressZero,
        "updateJumpRateModel(uint256,uint256,uint256,uint256)",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [OPBNBTESTNET_PSR, "removeDistributionConfig(Schema,address)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBTESTNET_PSR, "addOrUpdateDistributionConfigs(DistributionConfig[])", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBTESTNET_PSR, "removeDistributionConfig(Schema,address)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        OPBNBTESTNET_PSR,
        "addOrUpdateDistributionConfigs(DistributionConfig[])",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [OPBNBTESTNET_PSR, "removeDistributionConfig(Schema,address)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBTESTNET_PSR, "addOrUpdateDistributionConfigs(DistributionConfig[])", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        ethers.constants.AddressZero,
        "setCollateralFactor(address,uint256,uint256)",
        AccountType.CRITICAL_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setMarketBorrowCaps(address[],uint256[])", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setMarketSupplyCaps(address[],uint256[])", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        ethers.constants.AddressZero,
        "setActionsPaused(address[],uint256[],bool)",
        AccountType.CRITICAL_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setForcedLiquidation(address,bool)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setReserveFactor(uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setInterestRateModel(address)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setReduceReservesBlockDelta(uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "unlistMarket(address)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        ethers.constants.AddressZero,
        "setCollateralFactor(address,uint256,uint256)",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [
        ethers.constants.AddressZero,
        "setMarketBorrowCaps(address[],uint256[])",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [
        ethers.constants.AddressZero,
        "setMarketSupplyCaps(address[],uint256[])",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [
        ethers.constants.AddressZero,
        "setActionsPaused(address[],uint256[],bool)",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setForcedLiquidation(address,bool)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setReserveFactor(uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setInterestRateModel(address)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setReduceReservesBlockDelta(uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "unlistMarket(address)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        ethers.constants.AddressZero,
        "setCollateralFactor(address,uint256,uint256)",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setCloseFactor(uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setLiquidationIncentive(uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setMarketBorrowCaps(address[],uint256[])", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setMarketSupplyCaps(address[],uint256[])", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setActionsPaused(address[],uint256[],bool)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setMinLiquidatableCollateral(uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setForcedLiquidation(address,bool)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        OPBNBTESTNET_POOL_REGISTRY,
        "addPool(string,address,uint256,uint256,uint256)",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [OPBNBTESTNET_POOL_REGISTRY, "addMarket(AddMarketInput)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBTESTNET_POOL_REGISTRY, "setPoolName(address,string)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        OPBNBTESTNET_POOL_REGISTRY,
        "updatePoolMetadata(address,VenusPoolMetaData)",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setProtocolSeizeShare(uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setReserveFactor(uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setInterestRateModel(address)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "setReduceReservesBlockDelta(uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [ethers.constants.AddressZero, "unlistMarket(address)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBTESTNET_XVS_VAULT_PROXY, "pause()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBTESTNET_XVS_VAULT_PROXY, "resume()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        OPBNBTESTNET_XVS_VAULT_PROXY,
        "setRewardAmountPerBlockOrSecond(address,uint256)",
        AccountType.CRITICAL_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [OPBNBTESTNET_XVS_VAULT_PROXY, "pause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBTESTNET_XVS_VAULT_PROXY, "resume()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        OPBNBTESTNET_XVS_VAULT_PROXY,
        "setRewardAmountPerBlockOrSecond(address,uint256)",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [OPBNBTESTNET_XVS_VAULT_PROXY, "pause()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBTESTNET_XVS_VAULT_PROXY, "resume()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        OPBNBTESTNET_XVS_VAULT_PROXY,
        "add(address,uint256,address,uint256,uint256)",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [OPBNBTESTNET_XVS_VAULT_PROXY, "set(address,uint256,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        OPBNBTESTNET_XVS_VAULT_PROXY,
        "setRewardAmountPerBlockOrSecond(address,uint256)",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [
        OPBNBTESTNET_XVS_VAULT_PROXY,
        "setWithdrawalLockingPeriod(address,uint256,uint256)",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [OPBNBTESTNET_RESILIENT_ORACLE, "pause()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBTESTNET_RESILIENT_ORACLE, "unpause()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBTESTNET_RESILIENT_ORACLE, "setOracle(address,address,uint8)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBTESTNET_RESILIENT_ORACLE, "enableOracle(address,uint8,bool)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBTESTNET_RESILIENT_ORACLE, "setTokenConfig(TokenConfig)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBTESTNET_BINANCE_ORACLE, "setMaxStalePeriod(string,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBTESTNET_BINANCE_ORACLE, "setSymbolOverride(string,string)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBTESTNET_BOUND_VALIDATOR, "setValidateConfig(ValidateConfig)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBTESTNET_RESILIENT_ORACLE, "pause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBTESTNET_RESILIENT_ORACLE, "unpause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBTESTNET_RESILIENT_ORACLE, "setTokenConfig(TokenConfig)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBTESTNET_BINANCE_ORACLE, "setMaxStalePeriod(string,uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBTESTNET_BINANCE_ORACLE, "setSymbolOverride(string,string)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBTESTNET_RESILIENT_ORACLE, "pause()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBTESTNET_RESILIENT_ORACLE, "unpause()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBTESTNET_RESILIENT_ORACLE, "setTokenConfig(TokenConfig)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBTESTNET_BINANCE_ORACLE, "setMaxStalePeriod(string,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBTESTNET_BINANCE_ORACLE, "setSymbolOverride(string,string)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBTESTNET_XVS, "migrateMinterTokens(address,address)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBTESTNET_XVS, "setMintCap(address,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBTESTNET_XVS, "updateBlacklist(address,bool)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBTESTNET_XVS, "pause()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBTESTNET_XVS, "unpause()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBTESTNET_XVS, "migrateMinterTokens(address,address)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBTESTNET_XVS, "setMintCap(address,uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBTESTNET_XVS, "updateBlacklist(address,bool)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBTESTNET_XVS, "pause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBTESTNET_XVS, "unpause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBTESTNET_XVS, "migrateMinterTokens(address,address)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBTESTNET_XVS, "setMintCap(address,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBTESTNET_XVS, "updateBlacklist(address,bool)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBTESTNET_XVS, "pause()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBTESTNET_XVS, "unpause()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBTESTNET_XVS_BRIDGE_ADMIN, "setSendVersion(uint16)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBTESTNET_XVS_BRIDGE_ADMIN, "setReceiveVersion(uint16)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBTESTNET_XVS_BRIDGE_ADMIN, "forceResumeReceive(uint16,bytes)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBTESTNET_XVS_BRIDGE_ADMIN, "setOracle(address)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        OPBNBTESTNET_XVS_BRIDGE_ADMIN,
        "setMaxSingleTransactionLimit(uint16,uint256)",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [OPBNBTESTNET_XVS_BRIDGE_ADMIN, "setMaxDailyLimit(uint16,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        OPBNBTESTNET_XVS_BRIDGE_ADMIN,
        "setMaxSingleReceiveTransactionLimit(uint16,uint256)",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [OPBNBTESTNET_XVS_BRIDGE_ADMIN, "setMaxDailyReceiveLimit(uint16,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBTESTNET_XVS_BRIDGE_ADMIN, "pause()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBTESTNET_XVS_BRIDGE_ADMIN, "unpause()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBTESTNET_XVS_BRIDGE_ADMIN, "removeTrustedRemote(uint16)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBTESTNET_XVS_BRIDGE_ADMIN, "dropFailedMessage(uint16,bytes,uint64)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBTESTNET_XVS_BRIDGE_ADMIN, "setPrecrime(address)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBTESTNET_XVS_BRIDGE_ADMIN, "setMinDstGas(uint16,uint16,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBTESTNET_XVS_BRIDGE_ADMIN, "setPayloadSizeLimit(uint16,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBTESTNET_XVS_BRIDGE_ADMIN, "setWhitelist(address,bool)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBTESTNET_XVS_BRIDGE_ADMIN, "setConfig(uint16,uint16,uint256,bytes)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBTESTNET_XVS_BRIDGE_ADMIN, "sweepToken(address,address,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBTESTNET_XVS_BRIDGE_ADMIN, "updateSendAndCallEnabled(bool)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBTESTNET_XVS_BRIDGE_ADMIN, "setTrustedRemoteAddress(uint16,bytes)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBTESTNET_XVS_BRIDGE_ADMIN, "transferBridgeOwnership(address)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBTESTNET_XVS_BRIDGE_ADMIN, "setSendVersion(uint16)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBTESTNET_XVS_BRIDGE_ADMIN, "setReceiveVersion(uint16)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBTESTNET_XVS_BRIDGE_ADMIN, "forceResumeReceive(uint16,bytes)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        OPBNBTESTNET_XVS_BRIDGE_ADMIN,
        "setMaxSingleTransactionLimit(uint16,uint256)",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [OPBNBTESTNET_XVS_BRIDGE_ADMIN, "setMaxDailyLimit(uint16,uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        OPBNBTESTNET_XVS_BRIDGE_ADMIN,
        "setMaxSingleReceiveTransactionLimit(uint16,uint256)",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [
        OPBNBTESTNET_XVS_BRIDGE_ADMIN,
        "setMaxDailyReceiveLimit(uint16,uint256)",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [OPBNBTESTNET_XVS_BRIDGE_ADMIN, "pause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBTESTNET_XVS_BRIDGE_ADMIN, "unpause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBTESTNET_XVS_BRIDGE_ADMIN, "removeTrustedRemote(uint16)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        OPBNBTESTNET_XVS_BRIDGE_ADMIN,
        "dropFailedMessage(uint16,bytes,uint64)",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [OPBNBTESTNET_XVS_BRIDGE_ADMIN, "setMinDstGas(uint16,uint16,uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBTESTNET_XVS_BRIDGE_ADMIN, "setPayloadSizeLimit(uint16,uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBTESTNET_XVS_BRIDGE_ADMIN, "setWhitelist(address,bool)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        OPBNBTESTNET_XVS_BRIDGE_ADMIN,
        "setConfig(uint16,uint16,uint256,bytes)",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [OPBNBTESTNET_XVS_BRIDGE_ADMIN, "updateSendAndCallEnabled(bool)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBTESTNET_XVS_BRIDGE_ADMIN, "setSendVersion(uint16)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBTESTNET_XVS_BRIDGE_ADMIN, "setReceiveVersion(uint16)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBTESTNET_XVS_BRIDGE_ADMIN, "forceResumeReceive(uint16,bytes)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        OPBNBTESTNET_XVS_BRIDGE_ADMIN,
        "setMaxSingleTransactionLimit(uint16,uint256)",
        AccountType.CRITICAL_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [OPBNBTESTNET_XVS_BRIDGE_ADMIN, "setMaxDailyLimit(uint16,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [
        OPBNBTESTNET_XVS_BRIDGE_ADMIN,
        "setMaxSingleReceiveTransactionLimit(uint16,uint256)",
        AccountType.CRITICAL_TIMELOCK,
      ],
    },
    {
      permissionType: false,
      params: [OPBNBTESTNET_XVS_BRIDGE_ADMIN, "setMaxDailyReceiveLimit(uint16,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBTESTNET_XVS_BRIDGE_ADMIN, "pause()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBTESTNET_XVS_BRIDGE_ADMIN, "unpause()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBTESTNET_XVS_BRIDGE_ADMIN, "removeTrustedRemote(uint16)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBTESTNET_XVS_BRIDGE_ADMIN, "dropFailedMessage(uint16,bytes,uint64)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBTESTNET_XVS_BRIDGE_ADMIN, "setMinDstGas(uint16,uint16,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBTESTNET_XVS_BRIDGE_ADMIN, "setPayloadSizeLimit(uint16,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBTESTNET_XVS_BRIDGE_ADMIN, "setWhitelist(address,bool)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBTESTNET_XVS_BRIDGE_ADMIN, "setConfig(uint16,uint16,uint256,bytes)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: false,
      params: [OPBNBTESTNET_XVS_BRIDGE_ADMIN, "updateSendAndCallEnabled(bool)", AccountType.CRITICAL_TIMELOCK],
    },
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
  const networkPermissions = permissions[hre.network.name];

  for (const permission of networkPermissions) {
    const timelock = await ethers.getContract(permission.params[2]);
    permission.params[2] = timelock.address;
  }

  const _permissions: ACMCommandsAggregator.PermissionStruct[] = networkPermissions.map(permission => ({
    permissionType: permission.permissionType,
    contractAddress: permission.params[0],
    functionSig: permission.params[1],
    account: permission.params[2],
  }));

  const chunks = splitPermissions(_permissions);
  const indexes: string[] = [];

  for (const chunk of chunks) {
    const tx = await acmCommandsAggregator.addPermissions(chunk);

    const receipt = await tx.wait();
    const events = receipt.events?.filter(event => event.event === "PermissionsAdded");
    indexes.push(events?.[0].args?.index.toString());
  }

  console.log("Permissions added with indexes: ", indexes.toString());
};

func.tags = ["ACMCommandsAggregatorConfigure"];

func.skip = async (hre: HardhatRuntimeEnvironment) => Object.keys(permissions).indexOf(hre.network.name) === -1;
export default func;
