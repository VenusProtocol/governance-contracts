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

enum PermissionType {
  Give = 0,
  Revoke = 1,
}

enum AccountType {
  NORMAL_TIMELOCK = "NormalTimelock",
  FAST_TRACK_TIMELOCK = "FastTrackTimelock",
  CRITICAL_TIMELOCK = "CriticalTimelock",
}

interface Permission {
  permissionType: PermissionType;
  params: string[];
}

interface Permissions {
  [key: string]: Permission[];
}

const permissions: Permissions = {
  arbitrumone: [
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMONE_RESILIENT_ORACLE, "pause()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMONE_RESILIENT_ORACLE, "unpause()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMONE_RESILIENT_ORACLE, "setOracle(address,address,uint8)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMONE_RESILIENT_ORACLE, "enableOracle(address,uint8,bool)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMONE_RESILIENT_ORACLE, "setTokenConfig(TokenConfig)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMONE_CHAINLINK_ORACLE, "setTokenConfig(TokenConfig)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMONE_CHAINLINK_ORACLE, "setDirectPrice(address,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMONE_REDSTONE_ORACLE, "setTokenConfig(TokenConfig)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMONE_REDSTONE_ORACLE, "setDirectPrice(address,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMONE_BOUND_VALIDATOR, "setValidateConfig(ValidateConfig)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMONE_RESILIENT_ORACLE, "pause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMONE_RESILIENT_ORACLE, "unpause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMONE_RESILIENT_ORACLE, "setTokenConfig(TokenConfig)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMONE_CHAINLINK_ORACLE, "setTokenConfig(TokenConfig)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMONE_CHAINLINK_ORACLE, "setDirectPrice(address,uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },

    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMONE_REDSTONE_ORACLE, "setTokenConfig(TokenConfig)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMONE_REDSTONE_ORACLE, "setDirectPrice(address,uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_RESILIENT_ORACLE, "pause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMONE_RESILIENT_ORACLE, "pause()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMONE_RESILIENT_ORACLE, "unpause()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMONE_RESILIENT_ORACLE, "setTokenConfig(TokenConfig)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMONE_CHAINLINK_ORACLE, "setTokenConfig(TokenConfig)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMONE_CHAINLINK_ORACLE, "setDirectPrice(address,uint256)", AccountType.CRITICAL_TIMELOCK],
    },

    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMONE_REDSTONE_ORACLE, "setTokenConfig(TokenConfig)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMONE_REDSTONE_ORACLE, "setDirectPrice(address,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
  ],
  ethereum: [
    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_RESILIENT_ORACLE, "pause()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_RESILIENT_ORACLE, "unpause()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_RESILIENT_ORACLE, "setOracle(address,address,uint8)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_RESILIENT_ORACLE, "enableOracle(address,uint8,bool)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_RESILIENT_ORACLE, "setTokenConfig(TokenConfig)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_CHAINLINK_ORACLE, "setTokenConfig(TokenConfig)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_CHAINLINK_ORACLE, "setDirectPrice(address,uint256)", AccountType.NORMAL_TIMELOCK],
    },

    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_REDSTONE_ORACLE, "setTokenConfig(TokenConfig)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_REDSTONE_ORACLE, "setDirectPrice(address,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_BOUND_VALIDATOR, "setValidateConfig(ValidateConfig)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_sFrxETH_ORACLE, "setMaxAllowedPriceDifference(uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_RESILIENT_ORACLE, "unpause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_RESILIENT_ORACLE, "setTokenConfig(TokenConfig)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_CHAINLINK_ORACLE, "setTokenConfig(TokenConfig)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_CHAINLINK_ORACLE, "setDirectPrice(address,uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },

    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_REDSTONE_ORACLE, "setTokenConfig(TokenConfig)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_REDSTONE_ORACLE, "setDirectPrice(address,uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_sFrxETH_ORACLE, "setMaxAllowedPriceDifference(uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_RESILIENT_ORACLE, "pause()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_RESILIENT_ORACLE, "unpause()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_RESILIENT_ORACLE, "setTokenConfig(TokenConfig)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_CHAINLINK_ORACLE, "setTokenConfig(TokenConfig)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_CHAINLINK_ORACLE, "setDirectPrice(address,uint256)", AccountType.CRITICAL_TIMELOCK],
    },

    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_REDSTONE_ORACLE, "setTokenConfig(TokenConfig)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_REDSTONE_ORACLE, "setDirectPrice(address,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_sFrxETH_ORACLE, "setMaxAllowedPriceDifference(uint256)", AccountType.CRITICAL_TIMELOCK],
    },
  ],
  opbnbmainnet: [
    {
      permissionType: PermissionType.Give,
      params: [OPBNBMAINNET_RESILIENT_ORACLE, "pause()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBMAINNET_RESILIENT_ORACLE, "unpause()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBMAINNET_RESILIENT_ORACLE, "setOracle(address,address,uint8)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBMAINNET_RESILIENT_ORACLE, "enableOracle(address,uint8,bool)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBMAINNET_RESILIENT_ORACLE, "setTokenConfig(TokenConfig)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBMAINNET_BINANCE_ORACLE, "setMaxStalePeriod(string,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBMAINNET_BINANCE_ORACLE, "setSymbolOverride(string,string)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBMAINNET_BOUND_VALIDATOR, "setValidateConfig(ValidateConfig)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBMAINNET_RESILIENT_ORACLE, "pause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBMAINNET_RESILIENT_ORACLE, "unpause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBMAINNET_RESILIENT_ORACLE, "setTokenConfig(TokenConfig)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBMAINNET_BINANCE_ORACLE, "setMaxStalePeriod(string,uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBMAINNET_BINANCE_ORACLE, "setSymbolOverride(string,string)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBMAINNET_RESILIENT_ORACLE, "pause()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBMAINNET_RESILIENT_ORACLE, "unpause()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBMAINNET_RESILIENT_ORACLE, "setTokenConfig(TokenConfig)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBMAINNET_BINANCE_ORACLE, "setMaxStalePeriod(string,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBMAINNET_BINANCE_ORACLE, "setSymbolOverride(string,string)", AccountType.CRITICAL_TIMELOCK],
    },
  ],
  arbitrumsepolia: [
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMSEPOLIA_RESILIENT_ORACLE, "pause()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMSEPOLIA_RESILIENT_ORACLE, "unpause()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMSEPOLIA_RESILIENT_ORACLE, "setOracle(address,address,uint8)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMSEPOLIA_RESILIENT_ORACLE, "enableOracle(address,uint8,bool)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMSEPOLIA_RESILIENT_ORACLE, "setTokenConfig(TokenConfig)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMSEPOLIA_CHAINLINK_ORACLE, "setTokenConfig(TokenConfig)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMSEPOLIA_CHAINLINK_ORACLE, "setDirectPrice(address,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMSEPOLIA_REDSTONE_ORACLE, "setTokenConfig(TokenConfig)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMSEPOLIA_REDSTONE_ORACLE, "setDirectPrice(address,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUM_SEPOLIA_BOUND_VALIDATOR, "setValidateConfig(ValidateConfig)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMSEPOLIA_RESILIENT_ORACLE, "pause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMSEPOLIA_RESILIENT_ORACLE, "unpause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMSEPOLIA_RESILIENT_ORACLE, "setTokenConfig(TokenConfig)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMSEPOLIA_CHAINLINK_ORACLE, "setTokenConfig(TokenConfig)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMSEPOLIA_CHAINLINK_ORACLE, "setDirectPrice(address,uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMSEPOLIA_REDSTONE_ORACLE, "setTokenConfig(TokenConfig)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMSEPOLIA_REDSTONE_ORACLE, "setDirectPrice(address,uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMSEPOLIA_RESILIENT_ORACLE, "pause()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMSEPOLIA_RESILIENT_ORACLE, "unpause()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMSEPOLIA_RESILIENT_ORACLE, "setTokenConfig(TokenConfig)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMSEPOLIA_CHAINLINK_ORACLE, "setTokenConfig(TokenConfig)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMSEPOLIA_CHAINLINK_ORACLE, "setDirectPrice(address,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMSEPOLIA_REDSTONE_ORACLE, "setTokenConfig(TokenConfig)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMSEPOLIA_REDSTONE_ORACLE, "setDirectPrice(address,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
  ],
  sepolia: [
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_RESILIENT_ORACLE, "pause()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_RESILIENT_ORACLE, "unpause()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_RESILIENT_ORACLE, "setOracle(address,address,uint8)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_RESILIENT_ORACLE, "enableOracle(address,uint8,bool)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_RESILIENT_ORACLE, "setTokenConfig(TokenConfig)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_CHAINLINK_ORACLE, "setTokenConfig(TokenConfig)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_CHAINLINK_ORACLE, "setDirectPrice(address,uint256)", AccountType.NORMAL_TIMELOCK],
    },

    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_REDSTONE_ORACLE, "setTokenConfig(TokenConfig)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_REDSTONE_ORACLE, "setDirectPrice(address,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_BOUND_VALIDATOR, "setValidateConfig(ValidateConfig)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_sFrxETH_ORACLE, "setMaxAllowedPriceDifference(uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_RESILIENT_ORACLE, "pause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_RESILIENT_ORACLE, "unpause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_RESILIENT_ORACLE, "setTokenConfig(TokenConfig)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_CHAINLINK_ORACLE, "setTokenConfig(TokenConfig)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_CHAINLINK_ORACLE, "setDirectPrice(address,uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },

    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_REDSTONE_ORACLE, "setTokenConfig(TokenConfig)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_REDSTONE_ORACLE, "setDirectPrice(address,uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_sFrxETH_ORACLE, "setMaxAllowedPriceDifference(uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_RESILIENT_ORACLE, "pause()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_RESILIENT_ORACLE, "unpause()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_RESILIENT_ORACLE, "setTokenConfig(TokenConfig)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_CHAINLINK_ORACLE, "setTokenConfig(TokenConfig)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_CHAINLINK_ORACLE, "setDirectPrice(address,uint256)", AccountType.CRITICAL_TIMELOCK],
    },

    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_REDSTONE_ORACLE, "setTokenConfig(TokenConfig)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_REDSTONE_ORACLE, "setDirectPrice(address,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_sFrxETH_ORACLE, "setMaxAllowedPriceDifference(uint256)", AccountType.CRITICAL_TIMELOCK],
    },
  ],
  opbnbtestnet: [
    {
      permissionType: PermissionType.Give,
      params: [OPBNBTESTNET_RESILIENT_ORACLE, "pause()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBTESTNET_RESILIENT_ORACLE, "unpause()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBTESTNET_RESILIENT_ORACLE, "setOracle(address,address,uint8)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBTESTNET_RESILIENT_ORACLE, "enableOracle(address,uint8,bool)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBTESTNET_RESILIENT_ORACLE, "setTokenConfig(TokenConfig)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBTESTNET_BINANCE_ORACLE, "setMaxStalePeriod(string,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBTESTNET_BINANCE_ORACLE, "setSymbolOverride(string,string)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBTESTNET_BOUND_VALIDATOR, "setValidateConfig(ValidateConfig)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBTESTNET_RESILIENT_ORACLE, "pause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBTESTNET_RESILIENT_ORACLE, "unpause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBTESTNET_RESILIENT_ORACLE, "setTokenConfig(TokenConfig)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBTESTNET_BINANCE_ORACLE, "setMaxStalePeriod(string,uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBTESTNET_BINANCE_ORACLE, "setSymbolOverride(string,string)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBTESTNET_RESILIENT_ORACLE, "pause()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBTESTNET_RESILIENT_ORACLE, "unpause()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBTESTNET_RESILIENT_ORACLE, "setTokenConfig(TokenConfig)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBTESTNET_BINANCE_ORACLE, "setMaxStalePeriod(string,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBTESTNET_BINANCE_ORACLE, "setSymbolOverride(string,string)", AccountType.CRITICAL_TIMELOCK],
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

func.tags = ["ACMCommandsAggregatorConfigure", "ACMCommandsAggregatorTest"];

func.skip = async (hre: HardhatRuntimeEnvironment) => Object.keys(permissions).indexOf(hre.network.name) === -1;
export default func;
