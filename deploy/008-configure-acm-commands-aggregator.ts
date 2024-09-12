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

const ARBITRUMONE_XVS_VAULT_PROXY = "";
const ETHEREUM_XVS_VAULT_PROXY = "";
const OPBNBMAINNET_XVS_VAULT_PROXY = "";
const ARBITRUMSEPOLIA_XVS_VAULT_PROXY = "";
const SEPOLIA_XVS_VAULT_PROXY = "";
const OPBNBTESTNET_XVS_VAULT_PROXY = "";

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
      params: [ARBITRUMONE_XVS_VAULT_PROXY, "pause()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMONE_XVS_VAULT_PROXY, "resume()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [
        ARBITRUMONE_XVS_VAULT_PROXY,
        "setRewardAmountPerBlockOrSecond(address,uint256)",
        AccountType.CRITICAL_TIMELOCK,
      ],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMONE_XVS_VAULT_PROXY, "pause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMONE_XVS_VAULT_PROXY, "resume()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [
        ARBITRUMONE_XVS_VAULT_PROXY,
        "setRewardAmountPerBlockOrSecond(address,uint256)",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMONE_XVS_VAULT_PROXY, "pause()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMONE_XVS_VAULT_PROXY, "resume()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [
        ARBITRUMONE_XVS_VAULT_PROXY,
        "add(address,uint256,address,uint256,uint256)",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMONE_XVS_VAULT_PROXY, "set(address,uint256,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [
        ARBITRUMONE_XVS_VAULT_PROXY,
        "setRewardAmountPerBlockOrSecond(address,uint256)",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      permissionType: PermissionType.Give,
      params: [
        ARBITRUMONE_XVS_VAULT_PROXY,
        "setWithdrawalLockingPeriod(address,uint256,uint256)",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
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
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMONE_XVS, "migrateMinterTokens(address,address)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMONE_XVS, "setMintCap(address,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMONE_XVS, "updateBlacklist(address,bool)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMONE_XVS, "pause()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMONE_XVS, "unpause()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMONE_XVS, "migrateMinterTokens(address,address)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMONE_XVS, "setMintCap(address,uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMONE_XVS, "updateBlacklist(address,bool)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMONE_XVS, "pause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMONE_XVS, "unpause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMONE_XVS, "migrateMinterTokens(address,address)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMONE_XVS, "setMintCap(address,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMONE_XVS, "updateBlacklist(address,bool)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMONE_XVS, "pause()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMONE_XVS, "unpause()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMONE_XVS_BRIDGE_ADMIN, "setSendVersion(uint16)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMONE_XVS_BRIDGE_ADMIN, "setReceiveVersion(uint16)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMONE_XVS_BRIDGE_ADMIN, "forceResumeReceive(uint16,bytes)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMONE_XVS_BRIDGE_ADMIN, "setOracle(address)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [
        ARBITRUMONE_XVS_BRIDGE_ADMIN,
        "setMaxSingleTransactionLimit(uint16,uint256)",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMONE_XVS_BRIDGE_ADMIN, "setMaxDailyLimit(uint16,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [
        ARBITRUMONE_XVS_BRIDGE_ADMIN,
        "setMaxSingleReceiveTransactionLimit(uint16,uint256)",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMONE_XVS_BRIDGE_ADMIN, "setMaxDailyReceiveLimit(uint16,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMONE_XVS_BRIDGE_ADMIN, "pause()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMONE_XVS_BRIDGE_ADMIN, "unpause()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMONE_XVS_BRIDGE_ADMIN, "removeTrustedRemote(uint16)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMONE_XVS_BRIDGE_ADMIN, "dropFailedMessage(uint16,bytes,uint64)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMONE_XVS_BRIDGE_ADMIN, "setPrecrime(address)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMONE_XVS_BRIDGE_ADMIN, "setMinDstGas(uint16,uint16,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMONE_XVS_BRIDGE_ADMIN, "setPayloadSizeLimit(uint16,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMONE_XVS_BRIDGE_ADMIN, "setWhitelist(address,bool)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMONE_XVS_BRIDGE_ADMIN, "setConfig(uint16,uint16,uint256,bytes)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMONE_XVS_BRIDGE_ADMIN, "sweepToken(address,address,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMONE_XVS_BRIDGE_ADMIN, "updateSendAndCallEnabled(bool)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMONE_XVS_BRIDGE_ADMIN, "setTrustedRemoteAddress(uint16,bytes)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMONE_XVS_BRIDGE_ADMIN, "transferBridgeOwnership(address)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMONE_XVS_BRIDGE_ADMIN, "setSendVersion(uint16)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMONE_XVS_BRIDGE_ADMIN, "setReceiveVersion(uint16)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMONE_XVS_BRIDGE_ADMIN, "forceResumeReceive(uint16,bytes)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [
        ARBITRUMONE_XVS_BRIDGE_ADMIN,
        "setMaxSingleTransactionLimit(uint16,uint256)",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMONE_XVS_BRIDGE_ADMIN, "setMaxDailyLimit(uint16,uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [
        ARBITRUMONE_XVS_BRIDGE_ADMIN,
        "setMaxSingleReceiveTransactionLimit(uint16,uint256)",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      permissionType: PermissionType.Give,
      params: [
        ARBITRUMONE_XVS_BRIDGE_ADMIN,
        "setMaxDailyReceiveLimit(uint16,uint256)",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMONE_XVS_BRIDGE_ADMIN, "pause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMONE_XVS_BRIDGE_ADMIN, "unpause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMONE_XVS_BRIDGE_ADMIN, "removeTrustedRemote(uint16)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMONE_XVS_BRIDGE_ADMIN, "dropFailedMessage(uint16,bytes,uint64)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMONE_XVS_BRIDGE_ADMIN, "setMinDstGas(uint16,uint16,uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMONE_XVS_BRIDGE_ADMIN, "setPayloadSizeLimit(uint16,uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMONE_XVS_BRIDGE_ADMIN, "setWhitelist(address,bool)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMONE_XVS_BRIDGE_ADMIN, "setConfig(uint16,uint16,uint256,bytes)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMONE_XVS_BRIDGE_ADMIN, "updateSendAndCallEnabled(bool)", AccountType.FAST_TRACK_TIMELOCK],
    },

    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMONE_XVS_BRIDGE_ADMIN, "setSendVersion(uint16)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMONE_XVS_BRIDGE_ADMIN, "setReceiveVersion(uint16)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMONE_XVS_BRIDGE_ADMIN, "forceResumeReceive(uint16,bytes)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [
        ARBITRUMONE_XVS_BRIDGE_ADMIN,
        "setMaxSingleTransactionLimit(uint16,uint256)",
        AccountType.CRITICAL_TIMELOCK,
      ],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMONE_XVS_BRIDGE_ADMIN, "setMaxDailyLimit(uint16,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [
        ARBITRUMONE_XVS_BRIDGE_ADMIN,
        "setMaxSingleReceiveTransactionLimit(uint16,uint256)",
        AccountType.CRITICAL_TIMELOCK,
      ],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMONE_XVS_BRIDGE_ADMIN, "setMaxDailyReceiveLimit(uint16,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMONE_XVS_BRIDGE_ADMIN, "pause()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMONE_XVS_BRIDGE_ADMIN, "unpause()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMONE_XVS_BRIDGE_ADMIN, "removeTrustedRemote(uint16)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMONE_XVS_BRIDGE_ADMIN, "dropFailedMessage(uint16,bytes,uint64)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMONE_XVS_BRIDGE_ADMIN, "setMinDstGas(uint16,uint16,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMONE_XVS_BRIDGE_ADMIN, "setPayloadSizeLimit(uint16,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMONE_XVS_BRIDGE_ADMIN, "setWhitelist(address,bool)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMONE_XVS_BRIDGE_ADMIN, "setConfig(uint16,uint16,uint256,bytes)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMONE_XVS_BRIDGE_ADMIN, "updateSendAndCallEnabled(bool)", AccountType.CRITICAL_TIMELOCK],
    },
  ],
  ethereum: [
    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_XVS_VAULT_PROXY, "pause()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_XVS_VAULT_PROXY, "resume()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [
        ETHEREUM_XVS_VAULT_PROXY,
        "setRewardAmountPerBlockOrSecond(address,uint256)",
        AccountType.CRITICAL_TIMELOCK,
      ],
    },
    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_XVS_VAULT_PROXY, "pause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_XVS_VAULT_PROXY, "resume()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [
        ETHEREUM_XVS_VAULT_PROXY,
        "setRewardAmountPerBlockOrSecond(address,uint256)",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_XVS_VAULT_PROXY, "pause()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_XVS_VAULT_PROXY, "resume()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_XVS_VAULT_PROXY, "add(address,uint256,address,uint256,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_XVS_VAULT_PROXY, "set(address,uint256,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [
        ETHEREUM_XVS_VAULT_PROXY,
        "setRewardAmountPerBlockOrSecond(address,uint256)",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      permissionType: PermissionType.Give,
      params: [
        ETHEREUM_XVS_VAULT_PROXY,
        "setWithdrawalLockingPeriod(address,uint256,uint256)",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
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
    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_XVS, "migrateMinterTokens(address,address)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_XVS, "setMintCap(address,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_XVS, "updateBlacklist(address,bool)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_XVS, "pause()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_XVS, "unpause()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_XVS, "migrateMinterTokens(address,address)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_XVS, "setMintCap(address,uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_XVS, "updateBlacklist(address,bool)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_XVS, "pause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_XVS, "unpause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_XVS, "migrateMinterTokens(address,address)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_XVS, "setMintCap(address,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_XVS, "updateBlacklist(address,bool)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_XVS, "pause()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_XVS, "unpause()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "setSendVersion(uint16)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "setReceiveVersion(uint16)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "forceResumeReceive(uint16,bytes)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "setOracle(address)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "setMaxSingleTransactionLimit(uint16,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "setMaxDailyLimit(uint16,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [
        ETHEREUM_XVS_BRIDGE_ADMIN,
        "setMaxSingleReceiveTransactionLimit(uint16,uint256)",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "setMaxDailyReceiveLimit(uint16,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "pause()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "unpause()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "removeTrustedRemote(uint16)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "dropFailedMessage(uint16,bytes,uint64)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "setPrecrime(address)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "setMinDstGas(uint16,uint16,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "setPayloadSizeLimit(uint16,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "setWhitelist(address,bool)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "setConfig(uint16,uint16,uint256,bytes)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "sweepToken(address,address,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "updateSendAndCallEnabled(bool)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "setTrustedRemoteAddress(uint16,bytes)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "transferBridgeOwnership(address)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "setSendVersion(uint16)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "setReceiveVersion(uint16)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "forceResumeReceive(uint16,bytes)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [
        ETHEREUM_XVS_BRIDGE_ADMIN,
        "setMaxSingleTransactionLimit(uint16,uint256)",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "setMaxDailyLimit(uint16,uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [
        ETHEREUM_XVS_BRIDGE_ADMIN,
        "setMaxSingleReceiveTransactionLimit(uint16,uint256)",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "setMaxDailyReceiveLimit(uint16,uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "pause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "unpause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "removeTrustedRemote(uint16)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "dropFailedMessage(uint16,bytes,uint64)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "setMinDstGas(uint16,uint16,uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "setPayloadSizeLimit(uint16,uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "setWhitelist(address,bool)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "setConfig(uint16,uint16,uint256,bytes)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "updateSendAndCallEnabled(bool)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "setSendVersion(uint16)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "setReceiveVersion(uint16)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "forceResumeReceive(uint16,bytes)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [
        ETHEREUM_XVS_BRIDGE_ADMIN,
        "setMaxSingleTransactionLimit(uint16,uint256)",
        AccountType.CRITICAL_TIMELOCK,
      ],
    },
    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "setMaxDailyLimit(uint16,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [
        ETHEREUM_XVS_BRIDGE_ADMIN,
        "setMaxSingleReceiveTransactionLimit(uint16,uint256)",
        AccountType.CRITICAL_TIMELOCK,
      ],
    },
    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "setMaxDailyReceiveLimit(uint16,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "pause()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "unpause()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "removeTrustedRemote(uint16)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "dropFailedMessage(uint16,bytes,uint64)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "setMinDstGas(uint16,uint16,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "setPayloadSizeLimit(uint16,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "setWhitelist(address,bool)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "setConfig(uint16,uint16,uint256,bytes)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ETHEREUM_XVS_BRIDGE_ADMIN, "updateSendAndCallEnabled(bool)", AccountType.CRITICAL_TIMELOCK],
    },
  ],
  opbnbmainnet: [
    {
      permissionType: PermissionType.Give,
      params: [OPBNBMAINNET_XVS_VAULT_PROXY, "pause()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBMAINNET_XVS_VAULT_PROXY, "resume()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [
        OPBNBMAINNET_XVS_VAULT_PROXY,
        "setRewardAmountPerBlockOrSecond(address,uint256)",
        AccountType.CRITICAL_TIMELOCK,
      ],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBMAINNET_XVS_VAULT_PROXY, "pause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBMAINNET_XVS_VAULT_PROXY, "resume()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [
        OPBNBMAINNET_XVS_VAULT_PROXY,
        "setRewardAmountPerBlockOrSecond(address,uint256)",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBMAINNET_XVS_VAULT_PROXY, "pause()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBMAINNET_XVS_VAULT_PROXY, "resume()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [
        OPBNBMAINNET_XVS_VAULT_PROXY,
        "add(address,uint256,address,uint256,uint256)",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBMAINNET_XVS_VAULT_PROXY, "set(address,uint256,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [
        OPBNBMAINNET_XVS_VAULT_PROXY,
        "setRewardAmountPerBlockOrSecond(address,uint256)",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      permissionType: PermissionType.Give,
      params: [
        OPBNBMAINNET_XVS_VAULT_PROXY,
        "setWithdrawalLockingPeriod(address,uint256,uint256)",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
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
    {
      permissionType: PermissionType.Give,
      params: [OPBNBMAINNET_XVS, "migrateMinterTokens(address,address)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBMAINNET_XVS, "setMintCap(address,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBMAINNET_XVS, "updateBlacklist(address,bool)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBMAINNET_XVS, "pause()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBMAINNET_XVS, "unpause()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBMAINNET_XVS, "migrateMinterTokens(address,address)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBMAINNET_XVS, "setMintCap(address,uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBMAINNET_XVS, "updateBlacklist(address,bool)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBMAINNET_XVS, "pause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBMAINNET_XVS, "unpause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBMAINNET_XVS, "migrateMinterTokens(address,address)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBMAINNET_XVS, "setMintCap(address,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBMAINNET_XVS, "updateBlacklist(address,bool)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBMAINNET_XVS, "pause()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBMAINNET_XVS, "unpause()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBMAINNET_XVS_BRIDGE_ADMIN, "setSendVersion(uint16)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBMAINNET_XVS_BRIDGE_ADMIN, "setReceiveVersion(uint16)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBMAINNET_XVS_BRIDGE_ADMIN, "forceResumeReceive(uint16,bytes)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBMAINNET_XVS_BRIDGE_ADMIN, "setOracle(address)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [
        OPBNBMAINNET_XVS_BRIDGE_ADMIN,
        "setMaxSingleTransactionLimit(uint16,uint256)",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBMAINNET_XVS_BRIDGE_ADMIN, "setMaxDailyLimit(uint16,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [
        OPBNBMAINNET_XVS_BRIDGE_ADMIN,
        "setMaxSingleReceiveTransactionLimit(uint16,uint256)",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBMAINNET_XVS_BRIDGE_ADMIN, "setMaxDailyReceiveLimit(uint16,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBMAINNET_XVS_BRIDGE_ADMIN, "pause()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBMAINNET_XVS_BRIDGE_ADMIN, "unpause()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBMAINNET_XVS_BRIDGE_ADMIN, "removeTrustedRemote(uint16)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBMAINNET_XVS_BRIDGE_ADMIN, "dropFailedMessage(uint16,bytes,uint64)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBMAINNET_XVS_BRIDGE_ADMIN, "setPrecrime(address)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBMAINNET_XVS_BRIDGE_ADMIN, "setMinDstGas(uint16,uint16,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBMAINNET_XVS_BRIDGE_ADMIN, "setPayloadSizeLimit(uint16,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBMAINNET_XVS_BRIDGE_ADMIN, "setWhitelist(address,bool)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBMAINNET_XVS_BRIDGE_ADMIN, "setConfig(uint16,uint16,uint256,bytes)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBMAINNET_XVS_BRIDGE_ADMIN, "sweepToken(address,address,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBMAINNET_XVS_BRIDGE_ADMIN, "updateSendAndCallEnabled(bool)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBMAINNET_XVS_BRIDGE_ADMIN, "setTrustedRemoteAddress(uint16,bytes)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBMAINNET_XVS_BRIDGE_ADMIN, "transferBridgeOwnership(address)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBMAINNET_XVS_BRIDGE_ADMIN, "setSendVersion(uint16)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBMAINNET_XVS_BRIDGE_ADMIN, "setReceiveVersion(uint16)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBMAINNET_XVS_BRIDGE_ADMIN, "forceResumeReceive(uint16,bytes)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [
        OPBNBMAINNET_XVS_BRIDGE_ADMIN,
        "setMaxSingleTransactionLimit(uint16,uint256)",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBMAINNET_XVS_BRIDGE_ADMIN, "setMaxDailyLimit(uint16,uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [
        OPBNBMAINNET_XVS_BRIDGE_ADMIN,
        "setMaxSingleReceiveTransactionLimit(uint16,uint256)",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      permissionType: PermissionType.Give,
      params: [
        OPBNBMAINNET_XVS_BRIDGE_ADMIN,
        "setMaxDailyReceiveLimit(uint16,uint256)",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBMAINNET_XVS_BRIDGE_ADMIN, "pause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBMAINNET_XVS_BRIDGE_ADMIN, "unpause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBMAINNET_XVS_BRIDGE_ADMIN, "removeTrustedRemote(uint16)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [
        OPBNBMAINNET_XVS_BRIDGE_ADMIN,
        "dropFailedMessage(uint16,bytes,uint64)",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBMAINNET_XVS_BRIDGE_ADMIN, "setMinDstGas(uint16,uint16,uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBMAINNET_XVS_BRIDGE_ADMIN, "setPayloadSizeLimit(uint16,uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBMAINNET_XVS_BRIDGE_ADMIN, "setWhitelist(address,bool)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [
        OPBNBMAINNET_XVS_BRIDGE_ADMIN,
        "setConfig(uint16,uint16,uint256,bytes)",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBMAINNET_XVS_BRIDGE_ADMIN, "updateSendAndCallEnabled(bool)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBMAINNET_XVS_BRIDGE_ADMIN, "setSendVersion(uint16)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBMAINNET_XVS_BRIDGE_ADMIN, "setReceiveVersion(uint16)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBMAINNET_XVS_BRIDGE_ADMIN, "forceResumeReceive(uint16,bytes)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [
        OPBNBMAINNET_XVS_BRIDGE_ADMIN,
        "setMaxSingleTransactionLimit(uint16,uint256)",
        AccountType.CRITICAL_TIMELOCK,
      ],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBMAINNET_XVS_BRIDGE_ADMIN, "setMaxDailyLimit(uint16,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [
        OPBNBMAINNET_XVS_BRIDGE_ADMIN,
        "setMaxSingleReceiveTransactionLimit(uint16,uint256)",
        AccountType.CRITICAL_TIMELOCK,
      ],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBMAINNET_XVS_BRIDGE_ADMIN, "setMaxDailyReceiveLimit(uint16,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBMAINNET_XVS_BRIDGE_ADMIN, "pause()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBMAINNET_XVS_BRIDGE_ADMIN, "unpause()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBMAINNET_XVS_BRIDGE_ADMIN, "removeTrustedRemote(uint16)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBMAINNET_XVS_BRIDGE_ADMIN, "dropFailedMessage(uint16,bytes,uint64)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBMAINNET_XVS_BRIDGE_ADMIN, "setMinDstGas(uint16,uint16,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBMAINNET_XVS_BRIDGE_ADMIN, "setPayloadSizeLimit(uint16,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBMAINNET_XVS_BRIDGE_ADMIN, "setWhitelist(address,bool)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBMAINNET_XVS_BRIDGE_ADMIN, "setConfig(uint16,uint16,uint256,bytes)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBMAINNET_XVS_BRIDGE_ADMIN, "updateSendAndCallEnabled(bool)", AccountType.CRITICAL_TIMELOCK],
    },
  ],
  arbitrumsepolia: [
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMSEPOLIA_XVS_VAULT_PROXY, "pause()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMSEPOLIA_XVS_VAULT_PROXY, "resume()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [
        ARBITRUMSEPOLIA_XVS_VAULT_PROXY,
        "setRewardAmountPerBlockOrSecond(address,uint256)",
        AccountType.CRITICAL_TIMELOCK,
      ],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMSEPOLIA_XVS_VAULT_PROXY, "pause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMSEPOLIA_XVS_VAULT_PROXY, "resume()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [
        ARBITRUMSEPOLIA_XVS_VAULT_PROXY,
        "setRewardAmountPerBlockOrSecond(address,uint256)",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMSEPOLIA_XVS_VAULT_PROXY, "pause()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMSEPOLIA_XVS_VAULT_PROXY, "resume()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [
        ARBITRUMSEPOLIA_XVS_VAULT_PROXY,
        "add(address,uint256,address,uint256,uint256)",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMSEPOLIA_XVS_VAULT_PROXY, "set(address,uint256,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [
        ARBITRUMSEPOLIA_XVS_VAULT_PROXY,
        "setRewardAmountPerBlockOrSecond(address,uint256)",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      permissionType: PermissionType.Give,
      params: [
        ARBITRUMSEPOLIA_XVS_VAULT_PROXY,
        "setWithdrawalLockingPeriod(address,uint256,uint256)",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
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
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMSEPOLIA_XVS, "migrateMinterTokens(address,address)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMSEPOLIA_XVS, "setMintCap(address,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMSEPOLIA_XVS, "updateBlacklist(address,bool)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMSEPOLIA_XVS, "pause()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMSEPOLIA_XVS, "unpause()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMSEPOLIA_XVS, "migrateMinterTokens(address,address)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMSEPOLIA_XVS, "setMintCap(address,uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMSEPOLIA_XVS, "updateBlacklist(address,bool)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMSEPOLIA_XVS, "pause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMSEPOLIA_XVS, "unpause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMSEPOLIA_XVS, "migrateMinterTokens(address,address)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMSEPOLIA_XVS, "setMintCap(address,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMSEPOLIA_XVS, "updateBlacklist(address,bool)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMSEPOLIA_XVS, "pause()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMSEPOLIA_XVS, "unpause()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN, "setSendVersion(uint16)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN, "setReceiveVersion(uint16)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN, "forceResumeReceive(uint16,bytes)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN, "setOracle(address)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [
        ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN,
        "setMaxSingleTransactionLimit(uint16,uint256)",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN, "setMaxDailyLimit(uint16,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [
        ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN,
        "setMaxSingleReceiveTransactionLimit(uint16,uint256)",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      permissionType: PermissionType.Give,
      params: [
        ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN,
        "setMaxDailyReceiveLimit(uint16,uint256)",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN, "pause()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN, "unpause()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN, "removeTrustedRemote(uint16)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN, "dropFailedMessage(uint16,bytes,uint64)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN, "setPrecrime(address)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN, "setMinDstGas(uint16,uint16,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN, "setPayloadSizeLimit(uint16,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN, "setWhitelist(address,bool)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN, "setConfig(uint16,uint16,uint256,bytes)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN, "sweepToken(address,address,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN, "updateSendAndCallEnabled(bool)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN, "setTrustedRemoteAddress(uint16,bytes)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN, "transferBridgeOwnership(address)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN, "setSendVersion(uint16)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN, "setReceiveVersion(uint16)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN, "forceResumeReceive(uint16,bytes)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [
        ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN,
        "setMaxSingleTransactionLimit(uint16,uint256)",
        AccountType.CRITICAL_TIMELOCK,
      ],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN, "setMaxDailyLimit(uint16,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [
        ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN,
        "setMaxSingleReceiveTransactionLimit(uint16,uint256)",
        AccountType.CRITICAL_TIMELOCK,
      ],
    },
    {
      permissionType: PermissionType.Give,
      params: [
        ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN,
        "setMaxDailyReceiveLimit(uint16,uint256)",
        AccountType.CRITICAL_TIMELOCK,
      ],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN, "pause()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN, "unpause()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN, "removeTrustedRemote(uint16)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [
        ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN,
        "dropFailedMessage(uint16,bytes,uint64)",
        AccountType.CRITICAL_TIMELOCK,
      ],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN, "setMinDstGas(uint16,uint16,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN, "setPayloadSizeLimit(uint16,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN, "setWhitelist(address,bool)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [
        ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN,
        "setConfig(uint16,uint16,uint256,bytes)",
        AccountType.CRITICAL_TIMELOCK,
      ],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN, "updateSendAndCallEnabled(bool)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN, "setSendVersion(uint16)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN, "setReceiveVersion(uint16)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN, "forceResumeReceive(uint16,bytes)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [
        ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN,
        "setMaxSingleTransactionLimit(uint16,uint256)",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN, "setMaxDailyLimit(uint16,uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [
        ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN,
        "setMaxSingleReceiveTransactionLimit(uint16,uint256)",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      permissionType: PermissionType.Give,
      params: [
        ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN,
        "setMaxDailyReceiveLimit(uint16,uint256)",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN, "pause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN, "unpause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN, "removeTrustedRemote(uint16)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [
        ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN,
        "dropFailedMessage(uint16,bytes,uint64)",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      permissionType: PermissionType.Give,
      params: [
        ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN,
        "setMinDstGas(uint16,uint16,uint256)",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      permissionType: PermissionType.Give,
      params: [
        ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN,
        "setPayloadSizeLimit(uint16,uint256)",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN, "setWhitelist(address,bool)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [
        ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN,
        "setConfig(uint16,uint16,uint256,bytes)",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      permissionType: PermissionType.Give,
      params: [ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN, "updateSendAndCallEnabled(bool)", AccountType.FAST_TRACK_TIMELOCK],
    },
  ],
  sepolia: [
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_XVS_VAULT_PROXY, "pause()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_XVS_VAULT_PROXY, "resume()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [
        SEPOLIA_XVS_VAULT_PROXY,
        "setRewardAmountPerBlockOrSecond(address,uint256)",
        AccountType.CRITICAL_TIMELOCK,
      ],
    },
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_XVS_VAULT_PROXY, "pause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_XVS_VAULT_PROXY, "resume()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [
        SEPOLIA_XVS_VAULT_PROXY,
        "setRewardAmountPerBlockOrSecond(address,uint256)",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_XVS_VAULT_PROXY, "pause()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_XVS_VAULT_PROXY, "resume()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_XVS_VAULT_PROXY, "add(address,uint256,address,uint256,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_XVS_VAULT_PROXY, "set(address,uint256,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [
        SEPOLIA_XVS_VAULT_PROXY,
        "setRewardAmountPerBlockOrSecond(address,uint256)",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      permissionType: PermissionType.Give,
      params: [
        SEPOLIA_XVS_VAULT_PROXY,
        "setWithdrawalLockingPeriod(address,uint256,uint256)",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
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
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_XVS, "migrateMinterTokens(address,address)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_XVS, "setMintCap(address,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_XVS, "updateBlacklist(address,bool)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_XVS, "pause()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_XVS, "unpause()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_XVS, "migrateMinterTokens(address,address)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_XVS, "setMintCap(address,uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_XVS, "updateBlacklist(address,bool)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_XVS, "pause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_XVS, "unpause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_XVS, "migrateMinterTokens(address,address)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_XVS, "setMintCap(address,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_XVS, "updateBlacklist(address,bool)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_XVS, "pause()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_XVS, "unpause()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "setSendVersion(uint16)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "setReceiveVersion(uint16)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "forceResumeReceive(uint16,bytes)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "setOracle(address)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "setMaxSingleTransactionLimit(uint16,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "setMaxDailyLimit(uint16,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [
        SEPOLIA_XVS_BRIDGE_ADMIN,
        "setMaxSingleReceiveTransactionLimit(uint16,uint256)",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "setMaxDailyReceiveLimit(uint16,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "pause()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "unpause()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "removeTrustedRemote(uint16)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "dropFailedMessage(uint16,bytes,uint64)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "setPrecrime(address)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "setMinDstGas(uint16,uint16,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "setPayloadSizeLimit(uint16,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "setWhitelist(address,bool)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "setConfig(uint16,uint16,uint256,bytes)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "sweepToken(address,address,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "updateSendAndCallEnabled(bool)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "setTrustedRemoteAddress(uint16,bytes)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "transferBridgeOwnership(address)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "setSendVersion(uint16)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "setReceiveVersion(uint16)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "forceResumeReceive(uint16,bytes)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [
        SEPOLIA_XVS_BRIDGE_ADMIN,
        "setMaxSingleTransactionLimit(uint16,uint256)",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "setMaxDailyLimit(uint16,uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [
        SEPOLIA_XVS_BRIDGE_ADMIN,
        "setMaxSingleReceiveTransactionLimit(uint16,uint256)",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "setMaxDailyReceiveLimit(uint16,uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "pause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "unpause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "removeTrustedRemote(uint16)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "dropFailedMessage(uint16,bytes,uint64)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "setMinDstGas(uint16,uint16,uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "setPayloadSizeLimit(uint16,uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "setWhitelist(address,bool)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "setConfig(uint16,uint16,uint256,bytes)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "updateSendAndCallEnabled(bool)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "setSendVersion(uint16)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "setReceiveVersion(uint16)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "forceResumeReceive(uint16,bytes)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "setMaxSingleTransactionLimit(uint16,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "setMaxDailyLimit(uint16,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [
        SEPOLIA_XVS_BRIDGE_ADMIN,
        "setMaxSingleReceiveTransactionLimit(uint16,uint256)",
        AccountType.CRITICAL_TIMELOCK,
      ],
    },
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "setMaxDailyReceiveLimit(uint16,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "pause()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "unpause()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "removeTrustedRemote(uint16)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "dropFailedMessage(uint16,bytes,uint64)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "setMinDstGas(uint16,uint16,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "setPayloadSizeLimit(uint16,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "setWhitelist(address,bool)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "setConfig(uint16,uint16,uint256,bytes)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [SEPOLIA_XVS_BRIDGE_ADMIN, "updateSendAndCallEnabled(bool)", AccountType.CRITICAL_TIMELOCK],
    },
  ],
  opbnbtestnet: [
    {
      permissionType: PermissionType.Give,
      params: [OPBNBTESTNET_XVS_VAULT_PROXY, "pause()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBTESTNET_XVS_VAULT_PROXY, "resume()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [
        OPBNBTESTNET_XVS_VAULT_PROXY,
        "setRewardAmountPerBlockOrSecond(address,uint256)",
        AccountType.CRITICAL_TIMELOCK,
      ],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBTESTNET_XVS_VAULT_PROXY, "pause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBTESTNET_XVS_VAULT_PROXY, "resume()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [
        OPBNBTESTNET_XVS_VAULT_PROXY,
        "setRewardAmountPerBlockOrSecond(address,uint256)",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBTESTNET_XVS_VAULT_PROXY, "pause()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBTESTNET_XVS_VAULT_PROXY, "resume()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [
        OPBNBTESTNET_XVS_VAULT_PROXY,
        "add(address,uint256,address,uint256,uint256)",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBTESTNET_XVS_VAULT_PROXY, "set(address,uint256,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [
        OPBNBTESTNET_XVS_VAULT_PROXY,
        "setRewardAmountPerBlockOrSecond(address,uint256)",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      permissionType: PermissionType.Give,
      params: [
        OPBNBTESTNET_XVS_VAULT_PROXY,
        "setWithdrawalLockingPeriod(address,uint256,uint256)",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
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
    {
      permissionType: PermissionType.Give,
      params: [OPBNBTESTNET_XVS, "migrateMinterTokens(address,address)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBTESTNET_XVS, "setMintCap(address,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBTESTNET_XVS, "updateBlacklist(address,bool)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBTESTNET_XVS, "pause()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBTESTNET_XVS, "unpause()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBTESTNET_XVS, "migrateMinterTokens(address,address)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBTESTNET_XVS, "setMintCap(address,uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBTESTNET_XVS, "updateBlacklist(address,bool)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBTESTNET_XVS, "pause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBTESTNET_XVS, "unpause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBTESTNET_XVS, "migrateMinterTokens(address,address)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBTESTNET_XVS, "setMintCap(address,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBTESTNET_XVS, "updateBlacklist(address,bool)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBTESTNET_XVS, "pause()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBTESTNET_XVS, "unpause()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBTESTNET_XVS_BRIDGE_ADMIN, "setSendVersion(uint16)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBTESTNET_XVS_BRIDGE_ADMIN, "setReceiveVersion(uint16)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBTESTNET_XVS_BRIDGE_ADMIN, "forceResumeReceive(uint16,bytes)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBTESTNET_XVS_BRIDGE_ADMIN, "setOracle(address)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [
        OPBNBTESTNET_XVS_BRIDGE_ADMIN,
        "setMaxSingleTransactionLimit(uint16,uint256)",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBTESTNET_XVS_BRIDGE_ADMIN, "setMaxDailyLimit(uint16,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [
        OPBNBTESTNET_XVS_BRIDGE_ADMIN,
        "setMaxSingleReceiveTransactionLimit(uint16,uint256)",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBTESTNET_XVS_BRIDGE_ADMIN, "setMaxDailyReceiveLimit(uint16,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBTESTNET_XVS_BRIDGE_ADMIN, "pause()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBTESTNET_XVS_BRIDGE_ADMIN, "unpause()", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBTESTNET_XVS_BRIDGE_ADMIN, "removeTrustedRemote(uint16)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBTESTNET_XVS_BRIDGE_ADMIN, "dropFailedMessage(uint16,bytes,uint64)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBTESTNET_XVS_BRIDGE_ADMIN, "setPrecrime(address)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBTESTNET_XVS_BRIDGE_ADMIN, "setMinDstGas(uint16,uint16,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBTESTNET_XVS_BRIDGE_ADMIN, "setPayloadSizeLimit(uint16,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBTESTNET_XVS_BRIDGE_ADMIN, "setWhitelist(address,bool)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBTESTNET_XVS_BRIDGE_ADMIN, "setConfig(uint16,uint16,uint256,bytes)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBTESTNET_XVS_BRIDGE_ADMIN, "sweepToken(address,address,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBTESTNET_XVS_BRIDGE_ADMIN, "updateSendAndCallEnabled(bool)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBTESTNET_XVS_BRIDGE_ADMIN, "setTrustedRemoteAddress(uint16,bytes)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBTESTNET_XVS_BRIDGE_ADMIN, "transferBridgeOwnership(address)", AccountType.NORMAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBTESTNET_XVS_BRIDGE_ADMIN, "setSendVersion(uint16)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBTESTNET_XVS_BRIDGE_ADMIN, "setReceiveVersion(uint16)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBTESTNET_XVS_BRIDGE_ADMIN, "forceResumeReceive(uint16,bytes)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [
        OPBNBTESTNET_XVS_BRIDGE_ADMIN,
        "setMaxSingleTransactionLimit(uint16,uint256)",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBTESTNET_XVS_BRIDGE_ADMIN, "setMaxDailyLimit(uint16,uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [
        OPBNBTESTNET_XVS_BRIDGE_ADMIN,
        "setMaxSingleReceiveTransactionLimit(uint16,uint256)",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      permissionType: PermissionType.Give,
      params: [
        OPBNBTESTNET_XVS_BRIDGE_ADMIN,
        "setMaxDailyReceiveLimit(uint16,uint256)",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBTESTNET_XVS_BRIDGE_ADMIN, "pause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBTESTNET_XVS_BRIDGE_ADMIN, "unpause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBTESTNET_XVS_BRIDGE_ADMIN, "removeTrustedRemote(uint16)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [
        OPBNBTESTNET_XVS_BRIDGE_ADMIN,
        "dropFailedMessage(uint16,bytes,uint64)",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBTESTNET_XVS_BRIDGE_ADMIN, "setMinDstGas(uint16,uint16,uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBTESTNET_XVS_BRIDGE_ADMIN, "setPayloadSizeLimit(uint16,uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBTESTNET_XVS_BRIDGE_ADMIN, "setWhitelist(address,bool)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [
        OPBNBTESTNET_XVS_BRIDGE_ADMIN,
        "setConfig(uint16,uint16,uint256,bytes)",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBTESTNET_XVS_BRIDGE_ADMIN, "updateSendAndCallEnabled(bool)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBTESTNET_XVS_BRIDGE_ADMIN, "setSendVersion(uint16)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBTESTNET_XVS_BRIDGE_ADMIN, "setReceiveVersion(uint16)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBTESTNET_XVS_BRIDGE_ADMIN, "forceResumeReceive(uint16,bytes)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [
        OPBNBTESTNET_XVS_BRIDGE_ADMIN,
        "setMaxSingleTransactionLimit(uint16,uint256)",
        AccountType.CRITICAL_TIMELOCK,
      ],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBTESTNET_XVS_BRIDGE_ADMIN, "setMaxDailyLimit(uint16,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [
        OPBNBTESTNET_XVS_BRIDGE_ADMIN,
        "setMaxSingleReceiveTransactionLimit(uint16,uint256)",
        AccountType.CRITICAL_TIMELOCK,
      ],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBTESTNET_XVS_BRIDGE_ADMIN, "setMaxDailyReceiveLimit(uint16,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBTESTNET_XVS_BRIDGE_ADMIN, "pause()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBTESTNET_XVS_BRIDGE_ADMIN, "unpause()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBTESTNET_XVS_BRIDGE_ADMIN, "removeTrustedRemote(uint16)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBTESTNET_XVS_BRIDGE_ADMIN, "dropFailedMessage(uint16,bytes,uint64)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBTESTNET_XVS_BRIDGE_ADMIN, "setMinDstGas(uint16,uint16,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBTESTNET_XVS_BRIDGE_ADMIN, "setPayloadSizeLimit(uint16,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBTESTNET_XVS_BRIDGE_ADMIN, "setWhitelist(address,bool)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
      params: [OPBNBTESTNET_XVS_BRIDGE_ADMIN, "setConfig(uint16,uint16,uint256,bytes)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      permissionType: PermissionType.Give,
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
