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

interface Permission {
  params: string[];
}

interface Permissions {
  [key: string]: Permission[];
}

const getResilientOraclePermissions = (resilientOracle: string): Permission[] => {
  return [
    {
      params: [resilientOracle, "pause()", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [resilientOracle, "unpause()", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [resilientOracle, "setOracle(address,address,uint8)", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [resilientOracle, "enableOracle(address,uint8,bool)", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [resilientOracle, "setTokenConfig(TokenConfig)", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [resilientOracle, "pause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      params: [resilientOracle, "unpause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      params: [resilientOracle, "setTokenConfig(TokenConfig)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      params: [resilientOracle, "pause()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      params: [resilientOracle, "unpause()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      params: [resilientOracle, "setTokenConfig(TokenConfig)", AccountType.CRITICAL_TIMELOCK],
    },
  ];
};

const getChainlinkOraclePermissions = (chainlinkOracle: string): Permission[] => {
  return [
    {
      params: [chainlinkOracle, "setTokenConfig(TokenConfig)", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [chainlinkOracle, "setDirectPrice(address,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [chainlinkOracle, "setTokenConfig(TokenConfig)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      params: [chainlinkOracle, "setDirectPrice(address,uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      params: [chainlinkOracle, "setTokenConfig(TokenConfig)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      params: [chainlinkOracle, "setDirectPrice(address,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
  ];
};

const getRedstoneOraclePermissions = (redstoneOracle: string): Permission[] => {
  return [
    {
      params: [redstoneOracle, "setTokenConfig(TokenConfig)", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [redstoneOracle, "setDirectPrice(address,uint256)", AccountType.NORMAL_TIMELOCK],
    },

    {
      params: [redstoneOracle, "setTokenConfig(TokenConfig)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      params: [redstoneOracle, "setDirectPrice(address,uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },

    {
      params: [redstoneOracle, "setTokenConfig(TokenConfig)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      params: [redstoneOracle, "setDirectPrice(address,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
  ];
};

const getBoundValidatorPermissions = (boundValidator: string): Permission[] => {
  return [
    {
      params: [boundValidator, "setValidateConfig(ValidateConfig)", AccountType.NORMAL_TIMELOCK],
    },
  ];
};

const getSFrxETHOraclePermissions = (sFrxETHOracle: string): Permission[] => {
  return [
    {
      params: [sFrxETHOracle, "setMaxAllowedPriceDifference(uint256)", AccountType.NORMAL_TIMELOCK],
    },

    {
      params: [sFrxETHOracle, "setMaxAllowedPriceDifference(uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      params: [sFrxETHOracle, "setMaxAllowedPriceDifference(uint256)", AccountType.CRITICAL_TIMELOCK],
    },
  ];
};

const getBinanceOraclePermissions = (binanceOracle: string): Permission[] => {
  return [
    {
      params: [OPBNBMAINNET_BINANCE_ORACLE, "setMaxStalePeriod(string,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [OPBNBMAINNET_BINANCE_ORACLE, "setSymbolOverride(string,string)", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [OPBNBMAINNET_BINANCE_ORACLE, "setMaxStalePeriod(string,uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      params: [OPBNBMAINNET_BINANCE_ORACLE, "setSymbolOverride(string,string)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      params: [OPBNBMAINNET_BINANCE_ORACLE, "setMaxStalePeriod(string,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      params: [OPBNBMAINNET_BINANCE_ORACLE, "setSymbolOverride(string,string)", AccountType.CRITICAL_TIMELOCK],
    },
  ]
}

const getXVSPermissions = (xvs: string): Permission[] => {
  return [
    {
      params: [xvs, "migrateMinterTokens(address,address)", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [xvs, "setMintCap(address,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [xvs, "updateBlacklist(address,bool)", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [xvs, "pause()", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [xvs, "unpause()", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [xvs, "migrateMinterTokens(address,address)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      params: [xvs, "setMintCap(address,uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      params: [xvs, "updateBlacklist(address,bool)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      params: [xvs, "pause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      params: [xvs, "unpause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      params: [xvs, "migrateMinterTokens(address,address)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      params: [xvs, "setMintCap(address,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      params: [xvs, "updateBlacklist(address,bool)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      params: [xvs, "pause()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      params: [xvs, "unpause()", AccountType.CRITICAL_TIMELOCK],
    },
  ]
}

const getXVSBridgeAdminPermissions = (xvsBridgeAdmin: string): Permission[] => {
  return [
    {
      params: [xvsBridgeAdmin, "setSendVersion(uint16)", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [xvsBridgeAdmin, "setReceiveVersion(uint16)", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [xvsBridgeAdmin, "forceResumeReceive(uint16,bytes)", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [xvsBridgeAdmin, "setOracle(address)", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [
        xvsBridgeAdmin,
        "setMaxSingleTransactionLimit(uint16,uint256)",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      params: [xvsBridgeAdmin, "setMaxDailyLimit(uint16,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [
        xvsBridgeAdmin,
        "setMaxSingleReceiveTransactionLimit(uint16,uint256)",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      params: [xvsBridgeAdmin, "setMaxDailyReceiveLimit(uint16,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [xvsBridgeAdmin, "pause()", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [xvsBridgeAdmin, "unpause()", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [xvsBridgeAdmin, "removeTrustedRemote(uint16)", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [xvsBridgeAdmin, "dropFailedMessage(uint16,bytes,uint64)", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [xvsBridgeAdmin, "setPrecrime(address)", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [xvsBridgeAdmin, "setMinDstGas(uint16,uint16,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [xvsBridgeAdmin, "setPayloadSizeLimit(uint16,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [xvsBridgeAdmin, "setWhitelist(address,bool)", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [xvsBridgeAdmin, "setConfig(uint16,uint16,uint256,bytes)", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [xvsBridgeAdmin, "sweepToken(address,address,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [xvsBridgeAdmin, "updateSendAndCallEnabled(bool)", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [xvsBridgeAdmin, "setTrustedRemoteAddress(uint16,bytes)", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [xvsBridgeAdmin, "transferBridgeOwnership(address)", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [xvsBridgeAdmin, "setSendVersion(uint16)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      params: [xvsBridgeAdmin, "setReceiveVersion(uint16)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      params: [xvsBridgeAdmin, "forceResumeReceive(uint16,bytes)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      params: [
        xvsBridgeAdmin,
        "setMaxSingleTransactionLimit(uint16,uint256)",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      params: [xvsBridgeAdmin, "setMaxDailyLimit(uint16,uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      params: [
        xvsBridgeAdmin,
        "setMaxSingleReceiveTransactionLimit(uint16,uint256)",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      params: [
        xvsBridgeAdmin,
        "setMaxDailyReceiveLimit(uint16,uint256)",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      params: [xvsBridgeAdmin, "pause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      params: [xvsBridgeAdmin, "unpause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      params: [xvsBridgeAdmin, "removeTrustedRemote(uint16)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      params: [xvsBridgeAdmin, "dropFailedMessage(uint16,bytes,uint64)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      params: [xvsBridgeAdmin, "setMinDstGas(uint16,uint16,uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      params: [xvsBridgeAdmin, "setPayloadSizeLimit(uint16,uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      params: [xvsBridgeAdmin, "setWhitelist(address,bool)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      params: [xvsBridgeAdmin, "setConfig(uint16,uint16,uint256,bytes)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      params: [xvsBridgeAdmin, "updateSendAndCallEnabled(bool)", AccountType.FAST_TRACK_TIMELOCK],
    },

    {
      params: [xvsBridgeAdmin, "setSendVersion(uint16)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      params: [xvsBridgeAdmin, "setReceiveVersion(uint16)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      params: [xvsBridgeAdmin, "forceResumeReceive(uint16,bytes)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      params: [
        xvsBridgeAdmin,
        "setMaxSingleTransactionLimit(uint16,uint256)",
        AccountType.CRITICAL_TIMELOCK,
      ],
    },
    {
      params: [xvsBridgeAdmin, "setMaxDailyLimit(uint16,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      params: [
        xvsBridgeAdmin,
        "setMaxSingleReceiveTransactionLimit(uint16,uint256)",
        AccountType.CRITICAL_TIMELOCK,
      ],
    },
    {
      params: [xvsBridgeAdmin, "setMaxDailyReceiveLimit(uint16,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      params: [xvsBridgeAdmin, "pause()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      params: [xvsBridgeAdmin, "unpause()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      params: [xvsBridgeAdmin, "removeTrustedRemote(uint16)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      params: [xvsBridgeAdmin, "dropFailedMessage(uint16,bytes,uint64)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      params: [xvsBridgeAdmin, "setMinDstGas(uint16,uint16,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      params: [xvsBridgeAdmin, "setPayloadSizeLimit(uint16,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      params: [xvsBridgeAdmin, "setWhitelist(address,bool)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      params: [xvsBridgeAdmin, "setConfig(uint16,uint16,uint256,bytes)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      params: [xvsBridgeAdmin, "updateSendAndCallEnabled(bool)", AccountType.CRITICAL_TIMELOCK],
    },
  ]
}

const getXVSVaultPermissions = (xvsVault: string): Permission[] => {
  return [
    {
      params: [xvsVault, "pause()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      params: [xvsVault, "resume()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      params: [
        xvsVault,
        "setRewardAmountPerBlockOrSecond(address,uint256)",
        AccountType.CRITICAL_TIMELOCK,
      ],
    },
    {
      params: [xvsVault, "pause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      params: [xvsVault, "resume()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      params: [
        xvsVault,
        "setRewardAmountPerBlockOrSecond(address,uint256)",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      params: [xvsVault, "pause()", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [xvsVault, "resume()", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [
        xvsVault,
        "add(address,uint256,address,uint256,uint256)",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      params: [xvsVault, "set(address,uint256,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [
        xvsVault,
        "setRewardAmountPerBlockOrSecond(address,uint256)",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      params: [
        xvsVault,
        "setWithdrawalLockingPeriod(address,uint256,uint256)",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
  ]
}

const getPoolRegistryPermissions = (poolRegistry: string): Permission[] => {
  return [
    {
      params: [poolRegistry, "addPool(string,address,uint256,uint256,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [poolRegistry, "addMarket(AddMarketInput)", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [poolRegistry, "setPoolName(address,string)", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [poolRegistry, "updatePoolMetadata(address,VenusPoolMetaData)", AccountType.NORMAL_TIMELOCK],
    },
  ];
}

const getPrimePermissions = (prime: string): Permission[] => {
  return [
    {
      params: [prime, "updateAlpha(uint128,uint128)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      params: [prime, "updateMultipliers(address,uint256,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      params: [prime, "setStakedAt(address[],uint256[])", AccountType.CRITICAL_TIMELOCK],
    },
    {
      params: [prime, "addMarket(address,address,uint256,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      params: [prime, "setLimit(uint256,uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      params: [prime, "setMaxLoopsLimit(uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      params: [prime, "issue(bool,address[])", AccountType.CRITICAL_TIMELOCK],
    },
    {
      params: [prime, "burn(address)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      params: [prime, "togglePause()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      params: [prime, "updateAlpha(uint128,uint128)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      params: [prime, "updateMultipliers(address,uint256,uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      params: [prime, "setStakedAt(address[],uint256[])", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      params: [prime, "addMarket(address,address,uint256,uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      params: [prime, "setLimit(uint256,uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      params: [prime, "setMaxLoopsLimit(uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      params: [prime, "issue(bool,address[])", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      params: [prime, "burn(address)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      params: [prime, "togglePause()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      params: [prime, "updateAlpha(uint128,uint128)", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [prime, "updateMultipliers(address,uint256,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [prime, "setStakedAt(address[],uint256[])", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [prime, "addMarket(address,address,uint256,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [prime, "setLimit(uint256,uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [prime, "setMaxLoopsLimit(uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [prime, "issue(bool,address[])", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [prime, "burn(address)", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [prime, "togglePause()", AccountType.NORMAL_TIMELOCK],
    },
  ]
}

const getPrimeLiquidityProviderPermissions = (primeLiquidityProvider: string): Permission[] => {
  return [
    {
      params: [primeLiquidityProvider, "setTokensDistributionSpeed(address[],uint256[])", AccountType.CRITICAL_TIMELOCK],
    },
    {
      params: [primeLiquidityProvider, "setMaxTokensDistributionSpeed(address[],uint256[])", AccountType.CRITICAL_TIMELOCK],
    },
    {
      params: [primeLiquidityProvider, "setMaxLoopsLimit(uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      params: [primeLiquidityProvider, "pauseFundsTransfer()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      params: [primeLiquidityProvider, "resumeFundsTransfer()", AccountType.CRITICAL_TIMELOCK],
    },
    
    {
      params: [primeLiquidityProvider, "setTokensDistributionSpeed(address[],uint256[])", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      params: [primeLiquidityProvider, "setMaxTokensDistributionSpeed(address[],uint256[])", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      params: [primeLiquidityProvider, "setMaxLoopsLimit(uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      params: [primeLiquidityProvider, "pauseFundsTransfer()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      params: [primeLiquidityProvider, "resumeFundsTransfer()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      params: [primeLiquidityProvider, "setTokensDistributionSpeed(address[],uint256[])", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [primeLiquidityProvider, "setMaxTokensDistributionSpeed(address[],uint256[])", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [primeLiquidityProvider, "setMaxLoopsLimit(uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [primeLiquidityProvider, "pauseFundsTransfer()", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [primeLiquidityProvider, "resumeFundsTransfer()", AccountType.NORMAL_TIMELOCK],
    },
  ]
}

const getProtocolShareReservePermissions = (protocolShareReserve: string): Permission[] => {
  return [
    {
      params: [ARBITRUMONE_PSR, "removeDistributionConfig(Schema,address)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      params: [ARBITRUMONE_PSR, "addOrUpdateDistributionConfigs(DistributionConfig[])", AccountType.CRITICAL_TIMELOCK],
    },
    {
      params: [ARBITRUMONE_PSR, "removeDistributionConfig(Schema,address)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      params: [
        ARBITRUMONE_PSR,
        "addOrUpdateDistributionConfigs(DistributionConfig[])",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      params: [ARBITRUMONE_PSR, "removeDistributionConfig(Schema,address)", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [ARBITRUMONE_PSR, "addOrUpdateDistributionConfigs(DistributionConfig[])", AccountType.NORMAL_TIMELOCK],
    },
  ]
}

const getConverterNetworkPermissions = (converterNetwork: string): Permission[] => {
  return [
    {
      params: [converterNetwork, "addTokenConverter(address)", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [converterNetwork, "removeTokenConverter(address)", AccountType.NORMAL_TIMELOCK],
    },

    {
      params: [converterNetwork, "addTokenConverter(address)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      params: [converterNetwork, "removeTokenConverter(address)", AccountType.FAST_TRACK_TIMELOCK],
    },

    {
      params: [converterNetwork, "addTokenConverter(address)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      params: [converterNetwork, "removeTokenConverter(address)", AccountType.CRITICAL_TIMELOCK],
    },
  ];
}

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
    {
      params: [
        ethers.constants.AddressZero,
        "updateJumpRateModel(uint256,uint256,uint256,uint256)",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      params: [
        ethers.constants.AddressZero,
        "setRewardTokenSpeeds(address[],uint256[],uint256[])",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      params: [
        ethers.constants.AddressZero,
        "setLastRewardingBlocks(address[],uint32[],uint32[])",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      params: [
        ethers.constants.AddressZero,
        "setLastRewardingBlockTimestamps(address[],uint256[],uint256[])",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
   
    
    
    {
      params: [
        ethers.constants.AddressZero,
        "setCollateralFactor(address,uint256,uint256)",
        AccountType.CRITICAL_TIMELOCK,
      ],
    },
    {
      params: [ethers.constants.AddressZero, "setMarketBorrowCaps(address[],uint256[])", AccountType.CRITICAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setMarketSupplyCaps(address[],uint256[])", AccountType.CRITICAL_TIMELOCK],
    },
    {
      params: [
        ethers.constants.AddressZero,
        "setActionsPaused(address[],uint256[],bool)",
        AccountType.CRITICAL_TIMELOCK,
      ],
    },
    {
      params: [ethers.constants.AddressZero, "setForcedLiquidation(address,bool)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setReserveFactor(uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setInterestRateModel(address)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setReduceReservesBlockDelta(uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "unlistMarket(address)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      params: [
        ethers.constants.AddressZero,
        "setCollateralFactor(address,uint256,uint256)",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      params: [
        ethers.constants.AddressZero,
        "setMarketBorrowCaps(address[],uint256[])",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      params: [
        ethers.constants.AddressZero,
        "setMarketSupplyCaps(address[],uint256[])",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      params: [
        ethers.constants.AddressZero,
        "setActionsPaused(address[],uint256[],bool)",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      params: [ethers.constants.AddressZero, "setForcedLiquidation(address,bool)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setReserveFactor(uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setInterestRateModel(address)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setReduceReservesBlockDelta(uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "unlistMarket(address)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      params: [
        ethers.constants.AddressZero,
        "setCollateralFactor(address,uint256,uint256)",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      params: [ethers.constants.AddressZero, "setCloseFactor(uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setLiquidationIncentive(uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setMarketBorrowCaps(address[],uint256[])", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setMarketSupplyCaps(address[],uint256[])", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setActionsPaused(address[],uint256[],bool)", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setMinLiquidatableCollateral(uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setForcedLiquidation(address,bool)", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setProtocolSeizeShare(uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setReserveFactor(uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setInterestRateModel(address)", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setReduceReservesBlockDelta(uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "unlistMarket(address)", AccountType.NORMAL_TIMELOCK],
    },
    
    
 
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
    {
      params: [ethers.constants.AddressZero, "pauseConversion()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "resumeConversion()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setMinAmountToConvert(uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      params: [
        ethers.constants.AddressZero,
        "setConversionConfig(address,address,ConversionConfig)",
        AccountType.CRITICAL_TIMELOCK,
      ],
    },
    {
      params: [ethers.constants.AddressZero, "pauseConversion()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "resumeConversion()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setMinAmountToConvert(uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      params: [
        ethers.constants.AddressZero,
        "setConversionConfig(address,address,ConversionConfig)",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      params: [ethers.constants.AddressZero, "pauseConversion()", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "resumeConversion()", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setMinAmountToConvert(uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [
        ethers.constants.AddressZero,
        "setConversionConfig(address,address,ConversionConfig)",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      params: [
        ethers.constants.AddressZero,
        "updateJumpRateModel(uint256,uint256,uint256,uint256)",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      params: [
        ethers.constants.AddressZero,
        "setRewardTokenSpeeds(address[],uint256[],uint256[])",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      params: [
        ethers.constants.AddressZero,
        "setLastRewardingBlocks(address[],uint32[],uint32[])",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
   
    {
      params: [
        ethers.constants.AddressZero,
        "setCollateralFactor(address,uint256,uint256)",
        AccountType.CRITICAL_TIMELOCK,
      ],
    },
    {
      params: [ethers.constants.AddressZero, "setMarketBorrowCaps(address[],uint256[])", AccountType.CRITICAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setMarketSupplyCaps(address[],uint256[])", AccountType.CRITICAL_TIMELOCK],
    },
    {
      params: [
        ethers.constants.AddressZero,
        "setActionsPaused(address[],uint256[],bool)",
        AccountType.CRITICAL_TIMELOCK,
      ],
    },
    {
      params: [ethers.constants.AddressZero, "setForcedLiquidation(address,bool)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setReserveFactor(uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setInterestRateModel(address)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setReduceReservesBlockDelta(uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "unlistMarket(address)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      params: [
        ethers.constants.AddressZero,
        "setCollateralFactor(address,uint256,uint256)",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      params: [
        ethers.constants.AddressZero,
        "setMarketBorrowCaps(address[],uint256[])",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      params: [
        ethers.constants.AddressZero,
        "setMarketSupplyCaps(address[],uint256[])",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      params: [
        ethers.constants.AddressZero,
        "setActionsPaused(address[],uint256[],bool)",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      params: [ethers.constants.AddressZero, "setForcedLiquidation(address,bool)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setReserveFactor(uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setInterestRateModel(address)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setReduceReservesBlockDelta(uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "unlistMarket(address)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      params: [
        ethers.constants.AddressZero,
        "setCollateralFactor(address,uint256,uint256)",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      params: [ethers.constants.AddressZero, "setCloseFactor(uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setLiquidationIncentive(uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setMarketBorrowCaps(address[],uint256[])", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setMarketSupplyCaps(address[],uint256[])", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setActionsPaused(address[],uint256[],bool)", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setMinLiquidatableCollateral(uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setForcedLiquidation(address,bool)", AccountType.NORMAL_TIMELOCK],
    },
    
    {
      params: [ethers.constants.AddressZero, "setProtocolSeizeShare(uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setReserveFactor(uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setInterestRateModel(address)", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setReduceReservesBlockDelta(uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "unlistMarket(address)", AccountType.NORMAL_TIMELOCK],
    },
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
    {
      params: [
        ethers.constants.AddressZero,
        "updateJumpRateModel(uint256,uint256,uint256,uint256)",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      params: [
        ethers.constants.AddressZero,
        "setCollateralFactor(address,uint256,uint256)",
        AccountType.CRITICAL_TIMELOCK,
      ],
    },
    {
      params: [ethers.constants.AddressZero, "setMarketBorrowCaps(address[],uint256[])", AccountType.CRITICAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setMarketSupplyCaps(address[],uint256[])", AccountType.CRITICAL_TIMELOCK],
    },
    {
      params: [
        ethers.constants.AddressZero,
        "setActionsPaused(address[],uint256[],bool)",
        AccountType.CRITICAL_TIMELOCK,
      ],
    },
    {
      params: [ethers.constants.AddressZero, "setForcedLiquidation(address,bool)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setReserveFactor(uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setInterestRateModel(address)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setReduceReservesBlockDelta(uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "unlistMarket(address)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      params: [
        ethers.constants.AddressZero,
        "setCollateralFactor(address,uint256,uint256)",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      params: [
        ethers.constants.AddressZero,
        "setMarketBorrowCaps(address[],uint256[])",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      params: [
        ethers.constants.AddressZero,
        "setMarketSupplyCaps(address[],uint256[])",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      params: [
        ethers.constants.AddressZero,
        "setActionsPaused(address[],uint256[],bool)",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      params: [ethers.constants.AddressZero, "setForcedLiquidation(address,bool)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setReserveFactor(uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setInterestRateModel(address)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setReduceReservesBlockDelta(uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "unlistMarket(address)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      params: [
        ethers.constants.AddressZero,
        "setCollateralFactor(address,uint256,uint256)",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      params: [ethers.constants.AddressZero, "setCloseFactor(uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setLiquidationIncentive(uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setMarketBorrowCaps(address[],uint256[])", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setMarketSupplyCaps(address[],uint256[])", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setActionsPaused(address[],uint256[],bool)", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setMinLiquidatableCollateral(uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setForcedLiquidation(address,bool)", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setProtocolSeizeShare(uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setReserveFactor(uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setInterestRateModel(address)", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setReduceReservesBlockDelta(uint256)", AccountType.NORMAL_TIMELOCK],
    },
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
    {
      params: [
        ethers.constants.AddressZero,
        "updateJumpRateModel(uint256,uint256,uint256,uint256)",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      params: [
        ethers.constants.AddressZero,
        "setRewardTokenSpeeds(address[],uint256[],uint256[])",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      params: [
        ethers.constants.AddressZero,
        "setLastRewardingBlocks(address[],uint32[],uint32[])",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      params: [
        ethers.constants.AddressZero,
        "setLastRewardingBlockTimestamps(address[],uint256[],uint256[])",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      params: [
        ethers.constants.AddressZero,
        "setCollateralFactor(address,uint256,uint256)",
        AccountType.CRITICAL_TIMELOCK,
      ],
    },
    {
      params: [ethers.constants.AddressZero, "setMarketBorrowCaps(address[],uint256[])", AccountType.CRITICAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setMarketSupplyCaps(address[],uint256[])", AccountType.CRITICAL_TIMELOCK],
    },
    {
      params: [
        ethers.constants.AddressZero,
        "setActionsPaused(address[],uint256[],bool)",
        AccountType.CRITICAL_TIMELOCK,
      ],
    },
    {
      params: [ethers.constants.AddressZero, "setForcedLiquidation(address,bool)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setReserveFactor(uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setInterestRateModel(address)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setReduceReservesBlockDelta(uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "unlistMarket(address)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      params: [
        ethers.constants.AddressZero,
        "setCollateralFactor(address,uint256,uint256)",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      params: [
        ethers.constants.AddressZero,
        "setMarketBorrowCaps(address[],uint256[])",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      params: [
        ethers.constants.AddressZero,
        "setMarketSupplyCaps(address[],uint256[])",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      params: [
        ethers.constants.AddressZero,
        "setActionsPaused(address[],uint256[],bool)",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      params: [ethers.constants.AddressZero, "setForcedLiquidation(address,bool)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setReserveFactor(uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setInterestRateModel(address)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setReduceReservesBlockDelta(uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "unlistMarket(address)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      params: [
        ethers.constants.AddressZero,
        "setCollateralFactor(address,uint256,uint256)",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      params: [ethers.constants.AddressZero, "setCloseFactor(uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setLiquidationIncentive(uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setMarketBorrowCaps(address[],uint256[])", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setMarketSupplyCaps(address[],uint256[])", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setActionsPaused(address[],uint256[],bool)", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setMinLiquidatableCollateral(uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setForcedLiquidation(address,bool)", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setProtocolSeizeShare(uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setReserveFactor(uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setInterestRateModel(address)", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setReduceReservesBlockDelta(uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "unlistMarket(address)", AccountType.NORMAL_TIMELOCK],
    },
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
    {
      params: [ethers.constants.AddressZero, "pauseConversion()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "resumeConversion()", AccountType.CRITICAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setMinAmountToConvert(uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      params: [
        ethers.constants.AddressZero,
        "setConversionConfig(address,address,ConversionConfig)",
        AccountType.CRITICAL_TIMELOCK,
      ],
    },
    {
      params: [ethers.constants.AddressZero, "pauseConversion()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "resumeConversion()", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setMinAmountToConvert(uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      params: [
        ethers.constants.AddressZero,
        "setConversionConfig(address,address,ConversionConfig)",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      params: [ethers.constants.AddressZero, "pauseConversion()", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "resumeConversion()", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setMinAmountToConvert(uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [
        ethers.constants.AddressZero,
        "setConversionConfig(address,address,ConversionConfig)",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      params: [
        ethers.constants.AddressZero,
        "updateJumpRateModel(uint256,uint256,uint256,uint256)",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      params: [
        ethers.constants.AddressZero,
        "setRewardTokenSpeeds(address[],uint256[],uint256[])",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      params: [
        ethers.constants.AddressZero,
        "setLastRewardingBlocks(address[],uint32[],uint32[])",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      params: [
        ethers.constants.AddressZero,
        "setCollateralFactor(address,uint256,uint256)",
        AccountType.CRITICAL_TIMELOCK,
      ],
    },
    {
      params: [ethers.constants.AddressZero, "setMarketBorrowCaps(address[],uint256[])", AccountType.CRITICAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setMarketSupplyCaps(address[],uint256[])", AccountType.CRITICAL_TIMELOCK],
    },
    {
      params: [
        ethers.constants.AddressZero,
        "setActionsPaused(address[],uint256[],bool)",
        AccountType.CRITICAL_TIMELOCK,
      ],
    },
    {
      params: [ethers.constants.AddressZero, "setForcedLiquidation(address,bool)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setReserveFactor(uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setInterestRateModel(address)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setReduceReservesBlockDelta(uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "unlistMarket(address)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      params: [
        ethers.constants.AddressZero,
        "setCollateralFactor(address,uint256,uint256)",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      params: [
        ethers.constants.AddressZero,
        "setMarketBorrowCaps(address[],uint256[])",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      params: [
        ethers.constants.AddressZero,
        "setMarketSupplyCaps(address[],uint256[])",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      params: [
        ethers.constants.AddressZero,
        "setActionsPaused(address[],uint256[],bool)",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      params: [ethers.constants.AddressZero, "setForcedLiquidation(address,bool)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setReserveFactor(uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setInterestRateModel(address)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setReduceReservesBlockDelta(uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "unlistMarket(address)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      params: [
        ethers.constants.AddressZero,
        "setCollateralFactor(address,uint256,uint256)",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      params: [ethers.constants.AddressZero, "setCloseFactor(uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setLiquidationIncentive(uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setMarketBorrowCaps(address[],uint256[])", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setMarketSupplyCaps(address[],uint256[])", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setActionsPaused(address[],uint256[],bool)", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setMinLiquidatableCollateral(uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setForcedLiquidation(address,bool)", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setProtocolSeizeShare(uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setReserveFactor(uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setInterestRateModel(address)", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setReduceReservesBlockDelta(uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "unlistMarket(address)", AccountType.NORMAL_TIMELOCK],
    },
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
    {
      params: [
        ethers.constants.AddressZero,
        "updateJumpRateModel(uint256,uint256,uint256,uint256)",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      params: [
        ethers.constants.AddressZero,
        "setCollateralFactor(address,uint256,uint256)",
        AccountType.CRITICAL_TIMELOCK,
      ],
    },
    {
      params: [ethers.constants.AddressZero, "setMarketBorrowCaps(address[],uint256[])", AccountType.CRITICAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setMarketSupplyCaps(address[],uint256[])", AccountType.CRITICAL_TIMELOCK],
    },
    {
      params: [
        ethers.constants.AddressZero,
        "setActionsPaused(address[],uint256[],bool)",
        AccountType.CRITICAL_TIMELOCK,
      ],
    },
    {
      params: [ethers.constants.AddressZero, "setForcedLiquidation(address,bool)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setReserveFactor(uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setInterestRateModel(address)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setReduceReservesBlockDelta(uint256)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "unlistMarket(address)", AccountType.CRITICAL_TIMELOCK],
    },
    {
      params: [
        ethers.constants.AddressZero,
        "setCollateralFactor(address,uint256,uint256)",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      params: [
        ethers.constants.AddressZero,
        "setMarketBorrowCaps(address[],uint256[])",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      params: [
        ethers.constants.AddressZero,
        "setMarketSupplyCaps(address[],uint256[])",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      params: [
        ethers.constants.AddressZero,
        "setActionsPaused(address[],uint256[],bool)",
        AccountType.FAST_TRACK_TIMELOCK,
      ],
    },
    {
      params: [ethers.constants.AddressZero, "setForcedLiquidation(address,bool)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setReserveFactor(uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setInterestRateModel(address)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setReduceReservesBlockDelta(uint256)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "unlistMarket(address)", AccountType.FAST_TRACK_TIMELOCK],
    },
    {
      params: [
        ethers.constants.AddressZero,
        "setCollateralFactor(address,uint256,uint256)",
        AccountType.NORMAL_TIMELOCK,
      ],
    },
    {
      params: [ethers.constants.AddressZero, "setCloseFactor(uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setLiquidationIncentive(uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setMarketBorrowCaps(address[],uint256[])", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setMarketSupplyCaps(address[],uint256[])", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setActionsPaused(address[],uint256[],bool)", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setMinLiquidatableCollateral(uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setForcedLiquidation(address,bool)", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setProtocolSeizeShare(uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setReserveFactor(uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setInterestRateModel(address)", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "setReduceReservesBlockDelta(uint256)", AccountType.NORMAL_TIMELOCK],
    },
    {
      params: [ethers.constants.AddressZero, "unlistMarket(address)", AccountType.NORMAL_TIMELOCK],
    },
  ],
};

const revokePermissions: Permissions = {
  arbitrumone: [
    {
      params: [ARBITRUMONE_PRIME, "setTokensDistributionSpeed(address[],uint256[])", ARBITRUMONE_GUARDIAN],
    },
    {
      params: [ARBITRUMONE_PRIME, "setMaxTokensDistributionSpeed(address[],uint256[])", ARBITRUMONE_GUARDIAN],
    },
    {
      params: [ARBITRUMONE_PRIME, "setMaxLoopsLimit(uint256)", ARBITRUMONE_GUARDIAN],
    },
    {
      params: [ARBITRUMONE_PLP, "updateAlpha(uint128,uint128)", ARBITRUMONE_GUARDIAN],
    },
    {
      params: [ARBITRUMONE_PLP, "updateMultipliers(address,uint256,uint256)", ARBITRUMONE_GUARDIAN],
    },
    {
      params: [ARBITRUMONE_PLP, "setStakedAt(address[],uint256[])", ARBITRUMONE_GUARDIAN],
    },
    {
      params: [ARBITRUMONE_PLP, "addMarket(address,address,uint256,uint256)", ARBITRUMONE_GUARDIAN],
    },
    {
      params: [ARBITRUMONE_PLP, "setLimit(uint256,uint256)", ARBITRUMONE_GUARDIAN],
    },
    {
      params: [ARBITRUMONE_PLP, "setMaxLoopsLimit(uint256)", ARBITRUMONE_GUARDIAN],
    },
    {
      params: [ARBITRUMONE_PLP, "issue(bool,address[])", ARBITRUMONE_GUARDIAN],
    },
    {
      params: [ARBITRUMONE_PLP, "burn(address)", ARBITRUMONE_GUARDIAN],
    },
    {
      params: [ARBITRUMONE_RESILIENT_ORACLE, "setOracle(address,address,uint8)", ARBITRUMONE_GUARDIAN],
    },
    {
      params: [ARBITRUMONE_RESILIENT_ORACLE, "enableOracle(address,uint8,bool)", ARBITRUMONE_GUARDIAN],
    },
    {
      params: [ARBITRUMONE_BOUND_VALIDATOR, "setValidateConfig(ValidateConfig)", ARBITRUMONE_GUARDIAN],
    },

    {
      params: [ARBITRUMONE_XVS_VAULT_PROXY, "add(address,uint256,address,uint256,uint256)", ARBITRUMONE_GUARDIAN],
    },
    {
      params: [ARBITRUMONE_XVS_VAULT_PROXY, "set(address,uint256,uint256)", ARBITRUMONE_GUARDIAN],
    },
    {
      params: [ARBITRUMONE_XVS_VAULT_PROXY, "setRewardAmountPerBlockOrSecond(address,uint256)", ARBITRUMONE_GUARDIAN],
    },
    {
      params: [
        ARBITRUMONE_XVS_VAULT_PROXY,
        "setWithdrawalLockingPeriod(address,uint256,uint256)",
        ARBITRUMONE_GUARDIAN,
      ],
    },

    {
      params: [ARBITRUMONE_POOL_REGISTRY, "addPool(string,address,uint256,uint256,uint256)", ARBITRUMONE_GUARDIAN],
    },
    {
      params: [ARBITRUMONE_POOL_REGISTRY, "addMarket(AddMarketInput)", ARBITRUMONE_GUARDIAN],
    },
    {
      params: [ARBITRUMONE_POOL_REGISTRY, "setPoolName(address,string)", ARBITRUMONE_GUARDIAN],
    },
    {
      params: [ARBITRUMONE_POOL_REGISTRY, "updatePoolMetadata(address,VenusPoolMetaData)", ARBITRUMONE_GUARDIAN],
    },
    {
      params: [
        ethers.constants.AddressZero,
        "updateJumpRateModel(uint256,uint256,uint256,uint256)",
        ARBITRUMONE_GUARDIAN,
      ],
    },
    {
      params: [ethers.constants.AddressZero, "setCloseFactor(uint256)", ARBITRUMONE_GUARDIAN],
    },
    {
      params: [ethers.constants.AddressZero, "setLiquidationIncentive(uint256)", ARBITRUMONE_GUARDIAN],
    },
    {
      params: [ethers.constants.AddressZero, "setMinLiquidatableCollateral(uint256)", ARBITRUMONE_GUARDIAN],
    },
    {
      params: [ethers.constants.AddressZero, "setForcedLiquidation(address,bool)", ARBITRUMONE_GUARDIAN],
    },
    {
      params: [ethers.constants.AddressZero, "setProtocolSeizeShare(uint256)", ARBITRUMONE_GUARDIAN],
    },
    {
      params: [ethers.constants.AddressZero, "setReserveFactor(uint256)", ARBITRUMONE_GUARDIAN],
    },
    {
      params: [ethers.constants.AddressZero, "setInterestRateModel(address)", ARBITRUMONE_GUARDIAN],
    },
    {
      params: [ethers.constants.AddressZero, "setReduceReservesBlockDelta(uint256)", ARBITRUMONE_GUARDIAN],
    },
    {
      params: [
        ethers.constants.AddressZero,
        "setRewardTokenSpeeds(address[],uint256[],uint256[])",
        ARBITRUMONE_GUARDIAN,
      ],
    },
    {
      params: [
        ethers.constants.AddressZero,
        "setLastRewardingBlock(address[],uint32[],uint32[])",
        ARBITRUMONE_GUARDIAN,
      ],
    },
    {
      params: [
        ethers.constants.AddressZero,
        "setLastRewardingBlocks(address[],uint32[],uint32[])",
        ARBITRUMONE_GUARDIAN,
      ],
    },
    {
      params: [
        ethers.constants.AddressZero,
        "setLastRewardingBlockTimestamps(address[],uint256[],uint256[])",
        ARBITRUMONE_GUARDIAN,
      ],
    },
  ],
  ethereum: [
    {
      params: [ETHEREUM_PRIME, "setTokensDistributionSpeed(address[],uint256[])", ETHEREUM_GUARDIAN],
    },
    {
      params: [ETHEREUM_PRIME, "setMaxTokensDistributionSpeed(address[],uint256[])", ETHEREUM_GUARDIAN],
    },
    {
      params: [ETHEREUM_PRIME, "setMaxLoopsLimit(uint256)", ETHEREUM_GUARDIAN],
    },
    {
      params: [ETHEREUM_PLP, "updateAlpha(uint128,uint128)", ETHEREUM_GUARDIAN],
    },
    {
      params: [ETHEREUM_PLP, "updateMultipliers(address,uint256,uint256)", ETHEREUM_GUARDIAN],
    },
    {
      params: [ETHEREUM_PLP, "setStakedAt(address[],uint256[])", ETHEREUM_GUARDIAN],
    },
    {
      params: [ETHEREUM_PLP, "addMarket(address,address,uint256,uint256)", ETHEREUM_GUARDIAN],
    },
    {
      params: [ETHEREUM_PLP, "setLimit(uint256,uint256)", ETHEREUM_GUARDIAN],
    },
    {
      params: [ETHEREUM_PLP, "setMaxLoopsLimit(uint256)", ETHEREUM_GUARDIAN],
    },
    {
      params: [ETHEREUM_PLP, "issue(bool,address[])", ETHEREUM_GUARDIAN],
    },
    {
      params: [ETHEREUM_PLP, "burn(address)", ETHEREUM_GUARDIAN],
    },

    {
      params: [ETHEREUM_CONVERTER_NETWORK, "addTokenConverter(address)", ETHEREUM_GUARDIAN],
    },
    {
      params: [ETHEREUM_CONVERTER_NETWORK, "removeTokenConverter(address)", ETHEREUM_GUARDIAN],
    },
    {
      params: [ETHEREUM_RESILIENT_ORACLE, "setOracle(address,address,uint8)", ETHEREUM_GUARDIAN],
    },
    {
      params: [ETHEREUM_RESILIENT_ORACLE, "enableOracle(address,uint8,bool)", ETHEREUM_GUARDIAN],
    },
    {
      params: [ETHEREUM_REDSTONE_ORACLE, "setTokenConfig(TokenConfig)", ETHEREUM_GUARDIAN],
    },
    {
      params: [ETHEREUM_REDSTONE_ORACLE, "setDirectPrice(address,uint256)", ETHEREUM_GUARDIAN],
    },
    {
      params: [ETHEREUM_BOUND_VALIDATOR, "setValidateConfig(ValidateConfig)", ETHEREUM_GUARDIAN],
    },
    {
      params: [ETHEREUM_sFrxETH_ORACLE, "setMaxAllowedPriceDifference(uint256)", ETHEREUM_GUARDIAN],
    },

    {
      params: [ETHEREUM_XVS_VAULT_PROXY, "add(address,uint256,address,uint256,uint256)", ETHEREUM_GUARDIAN],
    },
    {
      params: [ETHEREUM_XVS_VAULT_PROXY, "set(address,uint256,uint256)", ETHEREUM_GUARDIAN],
    },
    {
      params: [ETHEREUM_XVS_VAULT_PROXY, "setRewardAmountPerBlockOrSecond(address,uint256)", ETHEREUM_GUARDIAN],
    },
    {
      params: [ETHEREUM_XVS_VAULT_PROXY, "setWithdrawalLockingPeriod(address,uint256,uint256)", ETHEREUM_GUARDIAN],
    },
    {
      params: [ETHEREUM_POOL_REGISTRY, "addPool(string,address,uint256,uint256,uint256)", ETHEREUM_GUARDIAN],
    },
    {
      params: [ETHEREUM_POOL_REGISTRY, "addMarket(AddMarketInput)", ETHEREUM_GUARDIAN],
    },
    {
      params: [ETHEREUM_POOL_REGISTRY, "setPoolName(address,string)", ETHEREUM_GUARDIAN],
    },
    {
      params: [ETHEREUM_POOL_REGISTRY, "updatePoolMetadata(address,VenusPoolMetaData)", ETHEREUM_GUARDIAN],
    },
    {
      params: [ethers.constants.AddressZero, "setCloseFactor(uint256)", ETHEREUM_GUARDIAN],
    },
    {
      params: [ethers.constants.AddressZero, "setLiquidationIncentive(uint256)", ETHEREUM_GUARDIAN],
    },
    {
      params: [ethers.constants.AddressZero, "setMinLiquidatableCollateral(uint256)", ETHEREUM_GUARDIAN],
    },
    {
      params: [ethers.constants.AddressZero, "setForcedLiquidation(address,bool)", ETHEREUM_GUARDIAN],
    },
    {
      params: [ethers.constants.AddressZero, "setProtocolSeizeShare(uint256)", ETHEREUM_GUARDIAN],
    },
    {
      params: [ethers.constants.AddressZero, "setReserveFactor(uint256)", ETHEREUM_GUARDIAN],
    },
    {
      params: [ethers.constants.AddressZero, "setInterestRateModel(address)", ETHEREUM_GUARDIAN],
    },
    {
      params: [ethers.constants.AddressZero, "setReduceReservesBlockDelta(uint256)", ETHEREUM_GUARDIAN],
    },
    {
      params: [ethers.constants.AddressZero, "setRewardTokenSpeeds(address[],uint256[],uint256[])", ETHEREUM_GUARDIAN],
    },
    {
      params: [ethers.constants.AddressZero, "setLastRewardingBlock(address[],uint32[],uint32[])", ETHEREUM_GUARDIAN],
    },
    {
      params: [ethers.constants.AddressZero, "setLastRewardingBlocks(address[],uint32[],uint32[])", ETHEREUM_GUARDIAN],
    },

    {
      params: [ethers.constants.AddressZero, "updateJumpRateModel(uint256,uint256,uint256,uint256)", ETHEREUM_GUARDIAN],
    },
    ...ETHEREUM_CONVERTERS.map(converter => ({
      params: [converter, "setMinAmountToConvert(uint256)", ETHEREUM_GUARDIAN],
    })),
    ...ETHEREUM_CONVERTERS.map(converter => ({
      params: [converter, "setConversionConfig(address,address,ConversionConfig)", ETHEREUM_GUARDIAN],
    })),
  ],
  opbnbmainnet: [
    {
      params: [OPBNBMAINNET_RESILIENT_ORACLE, "setOracle(address,address,uint8)", OPBNBMAINNET_GUARDIAN],
    },
    {
      params: [OPBNBMAINNET_RESILIENT_ORACLE, "enableOracle(address,uint8,bool)", OPBNBMAINNET_GUARDIAN],
    },
    {
      params: [OPBNBMAINNET_BOUND_VALIDATOR, "setValidateConfig(ValidateConfig)", OPBNBMAINNET_GUARDIAN],
    },
    {
      params: [OPBNBMAINNET_XVS_VAULT_PROXY, "add(address,uint256,address,uint256,uint256)", OPBNBMAINNET_GUARDIAN],
    },
    {
      params: [OPBNBMAINNET_XVS_VAULT_PROXY, "set(address,uint256,uint256)", OPBNBMAINNET_GUARDIAN],
    },
    {
      params: [OPBNBMAINNET_XVS_VAULT_PROXY, "setRewardAmountPerBlockOrSecond(address,uint256)", OPBNBMAINNET_GUARDIAN],
    },
    {
      params: [
        OPBNBMAINNET_XVS_VAULT_PROXY,
        "setWithdrawalLockingPeriod(address,uint256,uint256)",
        OPBNBMAINNET_GUARDIAN,
      ],
    },

    {
      params: [OPBNBMAINNET_POOL_REGISTRY, "addPool(string,address,uint256,uint256,uint256)", OPBNBMAINNET_GUARDIAN],
    },
    {
      params: [OPBNBMAINNET_POOL_REGISTRY, "addMarket(AddMarketInput)", OPBNBMAINNET_GUARDIAN],
    },
    {
      params: [OPBNBMAINNET_POOL_REGISTRY, "setPoolName(address,string)", OPBNBMAINNET_GUARDIAN],
    },
    {
      params: [OPBNBMAINNET_POOL_REGISTRY, "updatePoolMetadata(address,VenusPoolMetaData)", OPBNBMAINNET_GUARDIAN],
    },
    {
      params: [ethers.constants.AddressZero, "setCloseFactor(uint256)", OPBNBMAINNET_GUARDIAN],
    },
    {
      params: [ethers.constants.AddressZero, "setLiquidationIncentive(uint256)", OPBNBMAINNET_GUARDIAN],
    },
    {
      params: [ethers.constants.AddressZero, "setMinLiquidatableCollateral(uint256)", OPBNBMAINNET_GUARDIAN],
    },
    {
      params: [ethers.constants.AddressZero, "setForcedLiquidation(address,bool)", OPBNBMAINNET_GUARDIAN],
    },
    {
      params: [ethers.constants.AddressZero, "setProtocolSeizeShare(uint256)", OPBNBMAINNET_GUARDIAN],
    },
    {
      params: [ethers.constants.AddressZero, "setReserveFactor(uint256)", OPBNBMAINNET_GUARDIAN],
    },
    {
      params: [ethers.constants.AddressZero, "setInterestRateModel(address)", OPBNBMAINNET_GUARDIAN],
    },
    {
      params: [ethers.constants.AddressZero, "setReduceReservesBlockDelta(uint256)", OPBNBMAINNET_GUARDIAN],
    },
    {
      params: [
        ethers.constants.AddressZero,
        "updateJumpRateModel(uint256,uint256,uint256,uint256)",
        OPBNBMAINNET_GUARDIAN,
      ],
    },
  ],
  opbnbtestnet: [
    {
      params: [OPBNBTESTNET_RESILIENT_ORACLE, "setOracle(address,address,uint8)", OPBNBTESTNET_GUARDIAN],
    },
    {
      params: [OPBNBTESTNET_RESILIENT_ORACLE, "enableOracle(address,uint8,bool)", OPBNBTESTNET_GUARDIAN],
    },
    {
      params: [OPBNBTESTNET_BOUND_VALIDATOR, "setValidateConfig(ValidateConfig)", OPBNBTESTNET_GUARDIAN],
    },
    {
      params: [OPBNBTESTNET_XVS_VAULT_PROXY, "add(address,uint256,address,uint256,uint256)", OPBNBTESTNET_GUARDIAN],
    },
    {
      params: [OPBNBTESTNET_XVS_VAULT_PROXY, "set(address,uint256,uint256)", OPBNBTESTNET_GUARDIAN],
    },
    {
      params: [OPBNBTESTNET_XVS_VAULT_PROXY, "setRewardAmountPerBlockOrSecond(address,uint256)", OPBNBTESTNET_GUARDIAN],
    },
    {
      params: [
        OPBNBTESTNET_XVS_VAULT_PROXY,
        "setWithdrawalLockingPeriod(address,uint256,uint256)",
        OPBNBTESTNET_GUARDIAN,
      ],
    },

    {
      params: [OPBNBTESTNET_POOL_REGISTRY, "addPool(string,address,uint256,uint256,uint256)", OPBNBTESTNET_GUARDIAN],
    },
    {
      params: [OPBNBTESTNET_POOL_REGISTRY, "addMarket(AddMarketInput)", OPBNBTESTNET_GUARDIAN],
    },
    {
      params: [OPBNBTESTNET_POOL_REGISTRY, "setPoolName(address,string)", OPBNBTESTNET_GUARDIAN],
    },
    {
      params: [OPBNBTESTNET_POOL_REGISTRY, "updatePoolMetadata(address,VenusPoolMetaData)", OPBNBTESTNET_GUARDIAN],
    },
    {
      params: [ethers.constants.AddressZero, "setCloseFactor(uint256)", OPBNBTESTNET_GUARDIAN],
    },
    {
      params: [ethers.constants.AddressZero, "setLiquidationIncentive(uint256)", OPBNBTESTNET_GUARDIAN],
    },
    {
      params: [ethers.constants.AddressZero, "setMinLiquidatableCollateral(uint256)", OPBNBTESTNET_GUARDIAN],
    },
    {
      params: [ethers.constants.AddressZero, "setForcedLiquidation(address,bool)", OPBNBTESTNET_GUARDIAN],
    },
    {
      params: [ethers.constants.AddressZero, "setProtocolSeizeShare(uint256)", OPBNBTESTNET_GUARDIAN],
    },
    {
      params: [ethers.constants.AddressZero, "setReserveFactor(uint256)", OPBNBTESTNET_GUARDIAN],
    },
    {
      params: [ethers.constants.AddressZero, "setInterestRateModel(address)", OPBNBTESTNET_GUARDIAN],
    },
    {
      params: [ethers.constants.AddressZero, "setReduceReservesBlockDelta(uint256)", OPBNBTESTNET_GUARDIAN],
    },
    {
      params: [
        ethers.constants.AddressZero,
        "updateJumpRateModel(uint256,uint256,uint256,uint256)",
        OPBNBTESTNET_GUARDIAN,
      ],
    },
  ],
  sepolia: [
    {
      params: [SEPOLIA_PRIME, "setTokensDistributionSpeed(address[],uint256[])", SEPOLIA_GUARDIAN],
    },
    {
      params: [SEPOLIA_PRIME, "setMaxTokensDistributionSpeed(address[],uint256[])", SEPOLIA_GUARDIAN],
    },
    {
      params: [SEPOLIA_PRIME, "setMaxLoopsLimit(uint256)", SEPOLIA_GUARDIAN],
    },
    {
      params: [SEPOLIA_PLP, "updateAlpha(uint128,uint128)", SEPOLIA_GUARDIAN],
    },
    {
      params: [SEPOLIA_PLP, "updateMultipliers(address,uint256,uint256)", SEPOLIA_GUARDIAN],
    },
    {
      params: [SEPOLIA_PLP, "setStakedAt(address[],uint256[])", SEPOLIA_GUARDIAN],
    },
    {
      params: [SEPOLIA_PLP, "addMarket(address,address,uint256,uint256)", SEPOLIA_GUARDIAN],
    },
    {
      params: [SEPOLIA_PLP, "setLimit(uint256,uint256)", SEPOLIA_GUARDIAN],
    },
    {
      params: [SEPOLIA_PLP, "setMaxLoopsLimit(uint256)", SEPOLIA_GUARDIAN],
    },
    {
      params: [SEPOLIA_PLP, "issue(bool,address[])", SEPOLIA_GUARDIAN],
    },
    {
      params: [SEPOLIA_PLP, "burn(address)", SEPOLIA_GUARDIAN],
    },

    {
      params: [SEPOLIA_CONVERTER_NETWORK, "addTokenConverter(address)", SEPOLIA_GUARDIAN],
    },
    {
      params: [SEPOLIA_CONVERTER_NETWORK, "removeTokenConverter(address)", SEPOLIA_GUARDIAN],
    },
    {
      params: [SEPOLIA_RESILIENT_ORACLE, "setOracle(address,address,uint8)", SEPOLIA_GUARDIAN],
    },
    {
      params: [SEPOLIA_RESILIENT_ORACLE, "enableOracle(address,uint8,bool)", SEPOLIA_GUARDIAN],
    },
    {
      params: [SEPOLIA_REDSTONE_ORACLE, "setTokenConfig(TokenConfig)", SEPOLIA_GUARDIAN],
    },
    {
      params: [SEPOLIA_REDSTONE_ORACLE, "setDirectPrice(address,uint256)", SEPOLIA_GUARDIAN],
    },
    {
      params: [SEPOLIA_BOUND_VALIDATOR, "setValidateConfig(ValidateConfig)", SEPOLIA_GUARDIAN],
    },
    {
      params: [SEPOLIA_sFrxETH_ORACLE, "setMaxAllowedPriceDifference(uint256)", SEPOLIA_GUARDIAN],
    },

    {
      params: [SEPOLIA_XVS_VAULT_PROXY, "add(address,uint256,address,uint256,uint256)", SEPOLIA_GUARDIAN],
    },
    {
      params: [SEPOLIA_XVS_VAULT_PROXY, "set(address,uint256,uint256)", SEPOLIA_GUARDIAN],
    },
    {
      params: [SEPOLIA_XVS_VAULT_PROXY, "setRewardAmountPerBlockOrSecond(address,uint256)", SEPOLIA_GUARDIAN],
    },
    {
      params: [SEPOLIA_XVS_VAULT_PROXY, "setWithdrawalLockingPeriod(address,uint256,uint256)", SEPOLIA_GUARDIAN],
    },

    {
      params: [SEPOLIA_POOL_REGISTRY, "addPool(string,address,uint256,uint256,uint256)", SEPOLIA_GUARDIAN],
    },
    {
      params: [SEPOLIA_POOL_REGISTRY, "addMarket(AddMarketInput)", SEPOLIA_GUARDIAN],
    },
    {
      params: [SEPOLIA_POOL_REGISTRY, "setPoolName(address,string)", SEPOLIA_GUARDIAN],
    },
    {
      params: [SEPOLIA_POOL_REGISTRY, "updatePoolMetadata(address,VenusPoolMetaData)", SEPOLIA_GUARDIAN],
    },
    {
      params: [ethers.constants.AddressZero, "setCloseFactor(uint256)", SEPOLIA_GUARDIAN],
    },
    {
      params: [ethers.constants.AddressZero, "setLiquidationIncentive(uint256)", SEPOLIA_GUARDIAN],
    },
    {
      params: [ethers.constants.AddressZero, "setMinLiquidatableCollateral(uint256)", SEPOLIA_GUARDIAN],
    },
    {
      params: [ethers.constants.AddressZero, "setForcedLiquidation(address,bool)", SEPOLIA_GUARDIAN],
    },
    {
      params: [ethers.constants.AddressZero, "setProtocolSeizeShare(uint256)", SEPOLIA_GUARDIAN],
    },
    {
      params: [ethers.constants.AddressZero, "setReserveFactor(uint256)", SEPOLIA_GUARDIAN],
    },
    {
      params: [ethers.constants.AddressZero, "setInterestRateModel(address)", SEPOLIA_GUARDIAN],
    },
    {
      params: [ethers.constants.AddressZero, "setReduceReservesBlockDelta(uint256)", SEPOLIA_GUARDIAN],
    },
    {
      params: [ethers.constants.AddressZero, "setRewardTokenSpeeds(address[],uint256[],uint256[])", SEPOLIA_GUARDIAN],
    },
    {
      params: [ethers.constants.AddressZero, "setLastRewardingBlock(address[],uint32[],uint32[])", SEPOLIA_GUARDIAN],
    },
    {
      params: [ethers.constants.AddressZero, "updateJumpRateModel(uint256,uint256,uint256,uint256)", SEPOLIA_GUARDIAN],
    },
    ...SEPOLIA_CONVERTERS.map(converter => ({
      params: [converter, "setMinAmountToConvert(uint256)", SEPOLIA_GUARDIAN],
    })),
    ...SEPOLIA_CONVERTERS.map(converter => ({
      params: [converter, "setConversionConfig(address,address,ConversionConfig)", SEPOLIA_GUARDIAN],
    })),
  ],
  arbitrumsepolia: [
    {
      params: [ARBITRUMSEPOLIA_PRIME, "setTokensDistributionSpeed(address[],uint256[])", ARBITRUMSEPOLIA_GUARDIAN],
    },
    {
      params: [ARBITRUMSEPOLIA_PRIME, "setMaxTokensDistributionSpeed(address[],uint256[])", ARBITRUMSEPOLIA_GUARDIAN],
    },
    {
      params: [ARBITRUMSEPOLIA_PRIME, "setMaxLoopsLimit(uint256)", ARBITRUMSEPOLIA_GUARDIAN],
    },
    {
      params: [ARBITRUMSEPOLIA_PLP, "updateAlpha(uint128,uint128)", ARBITRUMSEPOLIA_GUARDIAN],
    },
    {
      params: [ARBITRUMSEPOLIA_PLP, "updateMultipliers(address,uint256,uint256)", ARBITRUMSEPOLIA_GUARDIAN],
    },
    {
      params: [ARBITRUMSEPOLIA_PLP, "setStakedAt(address[],uint256[])", ARBITRUMSEPOLIA_GUARDIAN],
    },
    {
      params: [ARBITRUMSEPOLIA_PLP, "addMarket(address,address,uint256,uint256)", ARBITRUMSEPOLIA_GUARDIAN],
    },
    {
      params: [ARBITRUMSEPOLIA_PLP, "setLimit(uint256,uint256)", ARBITRUMSEPOLIA_GUARDIAN],
    },
    {
      params: [ARBITRUMSEPOLIA_PLP, "setMaxLoopsLimit(uint256)", ARBITRUMSEPOLIA_GUARDIAN],
    },
    {
      params: [ARBITRUMSEPOLIA_PLP, "issue(bool,address[])", ARBITRUMSEPOLIA_GUARDIAN],
    },
    {
      params: [ARBITRUMSEPOLIA_PLP, "burn(address)", ARBITRUMSEPOLIA_GUARDIAN],
    },
    {
      params: [ARBITRUMSEPOLIA_RESILIENT_ORACLE, "setOracle(address,address,uint8)", ARBITRUMSEPOLIA_GUARDIAN],
    },
    {
      params: [ARBITRUMSEPOLIA_RESILIENT_ORACLE, "enableOracle(address,uint8,bool)", ARBITRUMSEPOLIA_GUARDIAN],
    },
    {
      params: [ARBITRUM_SEPOLIA_BOUND_VALIDATOR, "setValidateConfig(ValidateConfig)", ARBITRUMSEPOLIA_GUARDIAN],
    },

    {
      params: [
        ARBITRUMSEPOLIA_XVS_VAULT_PROXY,
        "add(address,uint256,address,uint256,uint256)",
        ARBITRUMSEPOLIA_GUARDIAN,
      ],
    },
    {
      params: [ARBITRUMSEPOLIA_XVS_VAULT_PROXY, "set(address,uint256,uint256)", ARBITRUMSEPOLIA_GUARDIAN],
    },
    {
      params: [
        ARBITRUMSEPOLIA_XVS_VAULT_PROXY,
        "setRewardAmountPerBlockOrSecond(address,uint256)",
        ARBITRUMSEPOLIA_GUARDIAN,
      ],
    },
    {
      params: [
        ARBITRUMSEPOLIA_XVS_VAULT_PROXY,
        "setWithdrawalLockingPeriod(address,uint256,uint256)",
        ARBITRUMSEPOLIA_GUARDIAN,
      ],
    },

    {
      params: [
        ARBITRUMSEPOLIA_POOL_REGISTRY,
        "addPool(string,address,uint256,uint256,uint256)",
        ARBITRUMSEPOLIA_GUARDIAN,
      ],
    },
    {
      params: [ARBITRUMSEPOLIA_POOL_REGISTRY, "addMarket(AddMarketInput)", ARBITRUMSEPOLIA_GUARDIAN],
    },
    {
      params: [ARBITRUMSEPOLIA_POOL_REGISTRY, "setPoolName(address,string)", ARBITRUMSEPOLIA_GUARDIAN],
    },
    {
      params: [
        ARBITRUMSEPOLIA_POOL_REGISTRY,
        "updatePoolMetadata(address,VenusPoolMetaData)",
        ARBITRUMSEPOLIA_GUARDIAN,
      ],
    },
    {
      params: [ethers.constants.AddressZero, "setCloseFactor(uint256)", ARBITRUMSEPOLIA_GUARDIAN],
    },
    {
      params: [ethers.constants.AddressZero, "setLiquidationIncentive(uint256)", ARBITRUMSEPOLIA_GUARDIAN],
    },
    {
      params: [ethers.constants.AddressZero, "setMinLiquidatableCollateral(uint256)", ARBITRUMSEPOLIA_GUARDIAN],
    },
    {
      params: [ethers.constants.AddressZero, "setForcedLiquidation(address,bool)", ARBITRUMSEPOLIA_GUARDIAN],
    },
    {
      params: [ethers.constants.AddressZero, "setProtocolSeizeShare(uint256)", ARBITRUMSEPOLIA_GUARDIAN],
    },
    {
      params: [ethers.constants.AddressZero, "setReserveFactor(uint256)", ARBITRUMSEPOLIA_GUARDIAN],
    },
    {
      params: [ethers.constants.AddressZero, "setInterestRateModel(address)", ARBITRUMSEPOLIA_GUARDIAN],
    },
    {
      params: [ethers.constants.AddressZero, "setReduceReservesBlockDelta(uint256)", ARBITRUMSEPOLIA_GUARDIAN],
    },
    {
      params: [
        ethers.constants.AddressZero,
        "setRewardTokenSpeeds(address[],uint256[],uint256[])",
        ARBITRUMSEPOLIA_GUARDIAN,
      ],
    },
    {
      params: [
        ethers.constants.AddressZero,
        "setLastRewardingBlock(address[],uint32[],uint32[])",
        ARBITRUMSEPOLIA_GUARDIAN,
      ],
    },
    {
      params: [
        ethers.constants.AddressZero,
        "setLastRewardingBlocks(address[],uint32[],uint32[])",
        ARBITRUMSEPOLIA_GUARDIAN,
      ],
    },
    {
      params: [
        ethers.constants.AddressZero,
        "setLastRewardingBlockTimestamps(address[],uint256[],uint256[])",
        ARBITRUMSEPOLIA_GUARDIAN,
      ],
    },
    {
      params: [
        ethers.constants.AddressZero,
        "updateJumpRateModel(uint256,uint256,uint256,uint256)",
        ARBITRUMSEPOLIA_GUARDIAN,
      ],
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
  const networkGrantPermissions = grantPermissions[hre.network.name];

  for (const permission of networkGrantPermissions) {
    const timelock = await ethers.getContract(permission.params[2]);
    permission.params[2] = timelock.address;
  }

  for (const permission of revokePermissions[hre.network.name]) {
    const timelock = await ethers.getContract(permission.params[2]);
    permission.params[2] = timelock.address;
  }

  const _grantPermissions: ACMCommandsAggregator.PermissionStruct[] = networkGrantPermissions.map(permission => ({
    contractAddress: permission.params[0],
    functionSig: permission.params[1],
    account: permission.params[2],
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

  const _revokePermissions: ACMCommandsAggregator.PermissionStruct[] = revokePermissions[hre.network.name].map(
    permission => ({
      contractAddress: permission.params[0],
      functionSig: permission.params[1],
      account: permission.params[2],
    }),
  );

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
