import { ethers } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { ACMCommandsAggregator } from "typechain";

import {
  AccountType,
  getBinanceOraclePermissions,
  getBoundValidatorPermissions,
  getBoundValidatorRevokePermissions,
  getChainlinkOraclePermissions,
  getComptrollerPermissions,
  getComptrollerRevokePermissions,
  getConverterNetworkPermissions,
  getConverterNetworkRevokePermissions,
  getConverterPermissions,
  getConvertersRevokePermissions,
  getIRMPermissions,
  getIRMRevokePermissions,
  getOmniChainExecutorOwnerPermissions,
  getOmniChainExecutorOwnerRevokePermissions,
  getPoolRegistryPermissions,
  getPoolRegistryRevokePermissions,
  getPoolRegistryRevokePermissionsForWildcard,
  getPrimeLiquidityProviderPermissions,
  getPrimeLiquidityProviderRevokePermissions,
  getPrimePermissions,
  getPrimeRevokePermissions,
  getProtocolShareReservePermissions,
  getRedstoneOraclePermissions,
  getResilientOraclePermissions,
  getResilientOracleRevokePermissions,
  getRewardDistributorPermissionsBlockbased,
  getRewardDistributorPermissionsTimebased,
  getRewardDistributorRevokePermissions,
  getSFrxETHOraclePermissions,
  getSFrxETHOracleRevokePermissions,
  getVTokenPermissions,
  getVTokenRevokePermissions,
  getXVSBridgeAdminPermissions,
  getXVSBridgeAdminRevokePermissions,
  getXVSPermissions,
  getXVSVaultPermissions,
  getXVSVaultRevokePermissions,
  getXVSVaultTreasuryPermissions,
  getXVSVaultTreasuryRevokePermissions,
} from "../helpers/permissions";

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
const OPMAINNET_RESILIENT_ORACLE = "0x21FC48569bd3a6623281f55FC1F8B48B9386907b";
const OPMAINNET_CHAINLINK_ORACLE = "0x1076e5A60F1aC98e6f361813138275F1179BEb52";
const OPMAINNET_REDSTONE_ORACLE = "0x7478e4656F6CCDCa147B6A7314fF68d0C144751a";
const OPMAINNET_BOUND_VALIDATOR = "0x37A04a1eF784448377a19F2b1b67cD40c09eA505";
const ZKSYNCMAINNET_RESILIENT_ORACLE = "0xDe564a4C887d5ad315a19a96DC81991c98b12182";
const ZKSYNCMAINNET_CHAINLINK_ORACLE = "0x4FC29E1d3fFFbDfbf822F09d20A5BE97e59F66E5";
const ZKSYNCMAINNET_REDSTONE_ORACLE = "0xFa1e65e714CDfefDC9729130496AB5b5f3708fdA";
const ZKSYNCMAINNET_BOUND_VALIDATOR = "0x51519cdCDDD05E2ADCFA108f4a960755D9d6ea8b";
const BASEMAINNET_RESILIENT_ORACLE = "0xcBBf58bD5bAdE357b634419B70b215D5E9d6FbeD";
const BASEMAINNET_CHAINLINK_ORACLE = "0x6F2eA73597955DB37d7C06e1319F0dC7C7455dEb";
const BASEMAINNET_REDSTONE_ORACLE = "0xd101Bf51937A6718F402dA944CbfdcD12bB6a6eb";
const BASEMAINNET_BOUND_VALIDATOR = "0x66dDE062D3DC1BB5223A0096EbB89395d1f11DB0";
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
const OPSEPOLIA_RESILIENT_ORACLE = "0x6c01ECa2B5C97F135406a3A5531445A7d977D28e";
const OPSEPOLIA_CHAINLINK_ORACLE = "0x493C3f543AEa37EefF17D823f27Cb1feAB9f3143";
const OPSEPOLIA_BOUND_VALIDATOR = "0x482469F1DA6Ec736cacF6361Ec41621f811A6800";
const ZKSYNCSEPOLIA_RESILIENT_ORACLE = "0x748853B3bE26c46b4562Fd314dfb82708F395bDf";
const ZKSYNCSEPOLIA_CHAINLINK_ORACLE = "0x0DFf10dCdb3526010Df01ECc42076C25C27F8323";
const ZKSYNCSEPOLIA_REDSTONE_ORACLE = "0x3af097f1Dcec172D5ECdD0D1eFA6B118FF15f152";
const ZKSYNCSEPOLIA_BOUND_VALIDATOR = "0x0A4daBeF41C83Af7e30FfC33feC56ba769f3D24b";
const BASESEPOLIA_RESILIENT_ORACLE = "0xC34871C982cf0Bc6e7aCa2c2670Bc319bDA1C744";
const BASESEPOLIA_CHAINLINK_ORACLE = "0x801aB33A69AD867500fbCda7b3dB66C73151494b";
const BASESEPOLIA_REDSTONE_ORACLE = "0x8267FE3f75E0A37ee34e113E767F9C9727206838";
const BASESEPOLIA_BOUND_VALIDATOR = "0xC76284488E57554A457A75a8b166fB2ADAB430dB";

const ARBITRUMONE_XVS = "0xc1Eb7689147C81aC840d4FF0D298489fc7986d52";
const ETHEREUM_XVS = "0xd3CC9d8f3689B83c91b7B59cAB4946B063EB894A";
const OPBNBMAINNET_XVS = "0x3E2e61F1c075881F3fB8dd568043d8c221fd5c61";
const OPMAINNET_XVS = "0x4a971e87ad1F61f7f3081645f52a99277AE917cF";
const BASEMAINNET_XVS = "0xebB7873213c8d1d9913D8eA39Aa12d74cB107995";

const ZKSYNCMAINNET_XVS = "0xD78ABD81a3D57712a3af080dc4185b698Fe9ac5A";
const ARBITRUMSEPOLIA_XVS = "0x877Dc896e7b13096D3827872e396927BbE704407";
const SEPOLIA_XVS = "0x66ebd019E86e0af5f228a0439EBB33f045CBe63E";
const OPBNBTESTNET_XVS = "0xc2931B1fEa69b6D6dA65a50363A8D75d285e4da9";
const OPSEPOLIA_XVS = "0x789482e37218f9b26d8D9115E356462fA9A37116";
const ZKSYNCSEPOLIA_XVS = "0x3AeCac43A2ebe5D8184e650403bf9F656F9D1cfA";
const ARBITRUMONE_XVS_BRIDGE_ADMIN = "0xf5d81C6F7DAA3F97A6265C8441f92eFda22Ad784";
const ETHEREUM_XVS_BRIDGE_ADMIN = "0x9C6C95632A8FB3A74f2fB4B7FfC50B003c992b96";
const OPBNBMAINNET_XVS_BRIDGE_ADMIN = "0x52fcE05aDbf6103d71ed2BA8Be7A317282731831";
const OPMAINNET_XVS_BRIDGE_ADMIN = "0x3c307DF1Bf3198a2417d9CA86806B307D147Ddf7";
const ZKSYNCMAINNET_XVS_BRIDGE_ADMIN = "0x2471043F05Cc41A6051dd6714DC967C7BfC8F902";
const BASEMAINNET_XVS_BRIDGE_ADMIN = "0x6303FEcee7161bF959d65df4Afb9e1ba5701f78e";
const ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN = "0xc94578caCC89a29B044a0a1D54d20d48A645E5C8";
const SEPOLIA_XVS_BRIDGE_ADMIN = "0xd3c6bdeeadB2359F726aD4cF42EAa8B7102DAd9B";
const OPBNBTESTNET_XVS_BRIDGE_ADMIN = "0x19252AFD0B2F539C400aEab7d460CBFbf74c17ff";
const OPSEPOLIA_XVS_BRIDGE_ADMIN = "0x6bBcB95eCF9BEc9AE91d5Ad227783e3913145321";
const ZKSYNCSEPOLIA_XVS_BRIDGE_ADMIN = "0x28cfE3f2D7D8944FAd162a058260ec922C19065E";
const BASESEPOLIA_XVS = "0xE657EDb5579B82135a274E85187927C42E38C021";
const BASESEPOLIA_XVS_BRIDGE_ADMIN = "0xE431E82d8fFfd81E7c082BeC7Fe2C306f5c988aD";

const ARBITRUMONE_XVS_VAULT_PROXY = "0x8b79692AAB2822Be30a6382Eb04763A74752d5B4";
const ETHEREUM_XVS_VAULT_PROXY = "0xA0882C2D5DF29233A092d2887A258C2b90e9b994";
const OPBNBMAINNET_XVS_VAULT_PROXY = "0x7dc969122450749A8B0777c0e324522d67737988";
const OPMAINNET_XVS_VAULT_PROXY = "0x133120607C018c949E91AE333785519F6d947e01";
const ZKSYNCMAINNET_XVS_VAULT_PROXY = "0xbbB3C88192a5B0DB759229BeF49DcD1f168F326F";
const BASEMAINNET_XVS_VAULT_PROXY = "0x708B54F2C3f3606ea48a8d94dab88D9Ab22D7fCd";
const ARBITRUMSEPOLIA_XVS_VAULT_PROXY = "0x407507DC2809D3aa31D54EcA3BEde5C5c4C8A17F";
const SEPOLIA_XVS_VAULT_PROXY = "0x1129f882eAa912aE6D4f6D445b2E2b1eCbA99fd5";
const OPBNBTESTNET_XVS_VAULT_PROXY = "0xB14A0e72C5C202139F78963C9e89252c1ad16f01";
const OPSEPOLIA_XVS_VAULT_PROXY = "0x4d344e48F02234E82D7D1dB84d0A4A18Aa43Dacc";
const ZKSYNCSEPOLIA_XVS_VAULT_PROXY = "0x825f9EE3b2b1C159a5444A111A70607f3918564e";
const BASESEPOLIA_XVS_VAULT_PROXY = "0x9b5D0aDfCEcC8ed422d714EcbcE2FFA436e269B8";

const ETHEREUM_XVS_VAULT_TREASURY = "0xaE39C38AF957338b3cEE2b3E5d825ea88df02EfE";
const SEPOLIA_XVS_VAULT_TREASURY = "0xCCB08e5107b406E67Ad8356023dd489CEbc79B40";

const ETHEREUM_POOL_REGISTRY = "0x61CAff113CCaf05FFc6540302c37adcf077C5179";
const ARBITRUMONE_POOL_REGISTRY = "0x382238f07Bc4Fe4aA99e561adE8A4164b5f815DA";
const OPBNBMAINNET_POOL_REGISTRY = "0x345a030Ad22e2317ac52811AC41C1A63cfa13aEe";
const OPMAINNET_POOL_REGISTRY = "0x147780799840d541C1d7c998F0cbA996d11D62bb";
const ZKSYNCMAINNET_POOL_REGISTRY = "0xFD96B926298034aed9bBe0Cca4b651E41eB87Bc4";
const BASEMAINNET_POOL_REGISTRY = "0xeef902918DdeCD773D4B422aa1C6e1673EB9136F";
const SEPOLIA_POOL_REGISTRY = "0x758f5715d817e02857Ba40889251201A5aE3E186";
const OPBNBTESTNET_POOL_REGISTRY = "0x560eA4e1cC42591E9f5F5D83Ad2fd65F30128951";
const ARBITRUMSEPOLIA_POOL_REGISTRY = "0xf93Df3135e0D555185c0BC888073374cA551C5fE";
const OPSEPOLIA_POOL_REGISTRY = "0x6538C861C7A6997602311342657b9143dD9E8152";
const ZKSYNCSEPOLIA_POOL_REGISTRY = "0x1401404e6279BB8C06E5E3999eCA3e2008B46A76";
const BASESEPOLIA_POOL_REGISTRY = "0xCa330282BEeb07a81963336d0bf8f5f34317916c";

const ARBITRUMONE_PRIME = "0xFE69720424C954A2da05648a0FAC84f9bf11Ef49";
const ARBITRUMONE_PLP = "0x86bf21dB200f29F21253080942Be8af61046Ec29";
const ARBITRUMONE_PSR = "0xF9263eaF7eB50815194f26aCcAB6765820B13D41";
const ETHEREUM_CONVERTER_NETWORK = "0x232CC47AECCC55C2CAcE4372f5B268b27ef7cac8";
const ETHEREUM_PRIME = "0x14C4525f47A7f7C984474979c57a2Dccb8EACB39";
const ETHEREUM_PLP = "0x8ba6aFfd0e7Bcd0028D1639225C84DdCf53D8872";
const ETHEREUM_PSR = "0x8c8c8530464f7D95552A11eC31Adbd4dC4AC4d3E";
const OPBNBMAINNET_PSR = "0xA2EDD515B75aBD009161B15909C19959484B0C1e";
const OPMAINNET_PRIME = "0xE76d2173546Be97Fa6E18358027BdE9742a649f7";
const OPMAINNET_PLP = "0x6412f6cd58D0182aE150b90B5A99e285b91C1a12";
const OPMAINNET_PSR = "0x735ed037cB0dAcf90B133370C33C08764f88140a";
const ZKSYNCMAINNET_PRIME = "0xdFe62Dcba3Ce0A827439390d7d45Af8baE599978";
const ZKSYNCMAINNET_PLP = "0x0EDE6d7fB474614C5D3d5a16581628bb96CB5dff";
const ZKSYNCMAINNET_PSR = "0xA1193e941BDf34E858f7F276221B4886EfdD040b";
const BASEMAINNET_PRIME = "0xD2e84244f1e9Fca03Ff024af35b8f9612D5d7a30";
const BASEMAINNET_PLP = "0xcB293EB385dEFF2CdeDa4E7060974BB90ee0B208";
const BASEMAINNET_PSR = "0x3565001d57c91062367C3792B74458e3c6eD910a";
const ARBITRUMSEPOLIA_PRIME = "0xadb04ac4942683bc41e27d18234c8dc884786e89";
const ARBITRUMSEPOLIA_PLP = "0xe82c2c10f55d3268126c29ec813dc6f086904694";
const ARBITRUMSEPOLIA_PSR = "0x09267d30798B59c581ce54E861A084C6FC298666";
const SEPOLIA_PRIME = "0x2Ec432F123FEbb114e6fbf9f4F14baF0B1F14AbC";
const SEPOLIA_PLP = "0x15242a55Ad1842A1aEa09c59cf8366bD2f3CE9B4";
const SEPOLIA_PSR = "0xbea70755cc3555708ca11219adB0db4C80F6721B";
const OPBNBTESTNET_PSR = "0xc355dEb1A9289f8C58CFAa076EEdBf51F3A8Da7F";
const SEPOLIA_CONVERTER_NETWORK = "0xB5A4208bFC4cC2C4670744849B8fC35B21A690Fa";
const OPSEPOLIA_PRIME = "0x54dEb59698c628be5EEd5AD41Fd825Eb3Be89704";
const OPSEPOLIA_PLP = "0xE3EC955b94D197a8e4081844F3f25F81047A9AF5";
const OPSEPOLIA_PSR = "0x0F021c29283c47DF8237741dD5a0aA22952aFc88";
const ZKSYNCSEPOLIA_PRIME = "0x72b85930F7f8D00ACe5EAD10a315C17b8954FBcF";
const ZKSYNCSEPOLIA_PLP = "0x3407c349F80E4E9544c73ca1E9334CeEA7266517";
const ZKSYNCSEPOLIA_PSR = "0x5722B43BD91fAaDC4E7f384F4d6Fb32456Ec5ffB";
const BASESEPOLIA_PRIME = "0x15A1AC7fA14C5900Ba93853375d66b6bB6A83B50";
const BASESEPOLIA_PLP = "0xb5BA66311C5f9A5C9d3CeE0183F5426DD694dE37";
const BASESEPOLIA_PSR = "0x4Ae3D77Ece08Ec3E5f5842B195f746bd3bCb8d73";

const ARBITRUMONE_GUARDIAN = "0x14e0E151b33f9802b3e75b621c1457afc44DcAA0";
const ETHEREUM_GUARDIAN = "0x285960C5B22fD66A736C7136967A3eB15e93CC67";
const OPBNBMAINNET_GUARDIAN = "0xC46796a21a3A9FAB6546aF3434F2eBfFd0604207";
const OPMAINNET_GUARDIAN = "0x2e94dd14E81999CdBF5deDE31938beD7308354b3";
const ZKSYNCMAINNET_GUARDIAN = "0x751Aa759cfBB6CE71A43b48e40e1cCcFC66Ba4aa";
const BASEMAINNET_GUARDIAN = "0x1803Cf1D3495b43cC628aa1d8638A981F8CD341C";
const SEPOLIA_GUARDIAN = "0x94fa6078b6b8a26f0b6edffbe6501b22a10470fb";
const OPBNBTESTNET_GUARDIAN = "0xb15f6EfEbC276A3b9805df81b5FB3D50C2A62BDf";
const ARBITRUMSEPOLIA_GUARDIAN = "0x1426A5Ae009c4443188DA8793751024E358A61C2";
const OPSEPOLIA_GUARDIAN = "0xd57365EE4E850e881229e2F8Aa405822f289e78d";
const ZKSYNCSEPOLIA_GUARDIAN = "0xa2f83de95E9F28eD443132C331B6a9C9B7a9F866";
const BASESEPOLIA_GUARDIAN = "0xdf3b635d2b535f906BB02abb22AED71346E36a00";

const ARBITRUMSEPOLIA_OMNICHAIN_EXECUTOR_OWNER = "0xfCA70dd553b7dF6eB8F813CFEA6a9DD039448878";
const SEPOLIA_OMNICHAIN_EXECUTOR_OWNER = "0xf964158C67439D01e5f17F0A3F39DfF46823F27A";
const OPBNBTESTNET_OMNICHAIN_EXECUTOR_OWNER = "0x4F570240FF6265Fbb1C79cE824De6408F1948913";
const BASEMAINNET_OMNICHAIN_EXECUTOR_OWNER = "0x8BA591f72a90fb379b9a82087b190d51b226F0a9";
const BASESEPOLIA_OMNICHAIN_EXECUTOR_OWNER = "0xe3fb08B8817a0c88d39A4DA4eFFD586D3326b73b";

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

interface Permissions {
  [key: string]: string[][];
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
  zksyncmainnet: [
    ...getResilientOraclePermissions(ZKSYNCMAINNET_RESILIENT_ORACLE),
    ...getChainlinkOraclePermissions(ZKSYNCMAINNET_CHAINLINK_ORACLE),
    ...getRedstoneOraclePermissions(ZKSYNCMAINNET_REDSTONE_ORACLE),
    ...getBoundValidatorPermissions(ZKSYNCMAINNET_BOUND_VALIDATOR),
    ...getXVSPermissions(ZKSYNCMAINNET_XVS),
    ...getXVSBridgeAdminPermissions(ZKSYNCMAINNET_XVS_BRIDGE_ADMIN),
    ...getXVSVaultPermissions(ZKSYNCMAINNET_XVS_VAULT_PROXY),
    ...getPoolRegistryPermissions(ZKSYNCMAINNET_POOL_REGISTRY),
    ...getPrimePermissions(ZKSYNCMAINNET_PRIME),
    ...getPrimeLiquidityProviderPermissions(ZKSYNCMAINNET_PLP),
    ...getProtocolShareReservePermissions(ZKSYNCMAINNET_PSR),
    ...getComptrollerPermissions(),
    ...getVTokenPermissions(),
    ...getRewardDistributorPermissionsTimebased(),
    ...getIRMPermissions(),
  ],
  opmainnet: [
    ...getResilientOraclePermissions(OPMAINNET_RESILIENT_ORACLE),
    ...getChainlinkOraclePermissions(OPMAINNET_CHAINLINK_ORACLE),
    ...getRedstoneOraclePermissions(OPMAINNET_REDSTONE_ORACLE),
    ...getBoundValidatorPermissions(OPMAINNET_BOUND_VALIDATOR),
    ...getXVSPermissions(OPMAINNET_XVS),
    ...getXVSBridgeAdminPermissions(OPMAINNET_XVS_BRIDGE_ADMIN),
    ...getXVSVaultPermissions(OPMAINNET_XVS_VAULT_PROXY),
    ...getPoolRegistryPermissions(OPMAINNET_POOL_REGISTRY),
    ...getPrimePermissions(OPMAINNET_PRIME),
    ...getPrimeLiquidityProviderPermissions(OPMAINNET_PLP),
    ...getProtocolShareReservePermissions(OPMAINNET_PSR),
    ...getComptrollerPermissions(),
    ...getVTokenPermissions(),
    ...getRewardDistributorPermissionsTimebased(),
    ...getIRMPermissions(),
  ],
  basemainnet: [
    ...getResilientOraclePermissions(BASEMAINNET_RESILIENT_ORACLE),
    ...getChainlinkOraclePermissions(BASEMAINNET_CHAINLINK_ORACLE),
    ...getRedstoneOraclePermissions(BASEMAINNET_REDSTONE_ORACLE),
    ...getBoundValidatorPermissions(BASEMAINNET_BOUND_VALIDATOR),
    ...getXVSPermissions(BASEMAINNET_XVS),
    ...getXVSBridgeAdminPermissions(BASEMAINNET_XVS_BRIDGE_ADMIN),
    ...getXVSVaultPermissions(BASEMAINNET_XVS_VAULT_PROXY),
    ...getPoolRegistryPermissions(BASEMAINNET_POOL_REGISTRY),
    ...getPrimePermissions(BASEMAINNET_PRIME),
    ...getPrimeLiquidityProviderPermissions(BASEMAINNET_PLP),
    ...getProtocolShareReservePermissions(BASEMAINNET_PSR),
    ...getComptrollerPermissions(),
    ...getVTokenPermissions(),
    ...getRewardDistributorPermissionsTimebased(),
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
    ...getChainlinkOraclePermissions(SEPOLIA_CHAINLINK_ORACLE),
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
    ...getBoundValidatorPermissions(OPBNBTESTNET_BOUND_VALIDATOR),
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
  opsepolia: [
    ...getResilientOraclePermissions(OPSEPOLIA_RESILIENT_ORACLE),
    ...getChainlinkOraclePermissions(OPSEPOLIA_CHAINLINK_ORACLE),
    ...getBoundValidatorPermissions(OPSEPOLIA_BOUND_VALIDATOR),
    ...getXVSPermissions(OPSEPOLIA_XVS),
    ...getXVSBridgeAdminPermissions(OPSEPOLIA_XVS_BRIDGE_ADMIN),
    ...getXVSVaultPermissions(OPSEPOLIA_XVS_VAULT_PROXY),
    ...getPoolRegistryPermissions(OPSEPOLIA_POOL_REGISTRY),
    ...getPrimePermissions(OPSEPOLIA_PRIME),
    ...getPrimeLiquidityProviderPermissions(OPSEPOLIA_PLP),
    ...getProtocolShareReservePermissions(OPSEPOLIA_PSR),
    ...getComptrollerPermissions(),
    ...getVTokenPermissions(),
    ...getRewardDistributorPermissionsTimebased(),
    ...getIRMPermissions(),
  ],
  zksyncsepolia: [
    ...getResilientOraclePermissions(ZKSYNCSEPOLIA_RESILIENT_ORACLE),
    ...getChainlinkOraclePermissions(ZKSYNCSEPOLIA_CHAINLINK_ORACLE),
    ...getRedstoneOraclePermissions(ZKSYNCSEPOLIA_REDSTONE_ORACLE),
    ...getBoundValidatorPermissions(ZKSYNCSEPOLIA_BOUND_VALIDATOR),
    ...getXVSPermissions(ZKSYNCSEPOLIA_XVS),
    ...getXVSBridgeAdminPermissions(ZKSYNCSEPOLIA_XVS_BRIDGE_ADMIN),
    ...getXVSVaultPermissions(ZKSYNCSEPOLIA_XVS_VAULT_PROXY),
    ...getPoolRegistryPermissions(ZKSYNCSEPOLIA_POOL_REGISTRY),
    ...getPrimePermissions(ZKSYNCSEPOLIA_PRIME),
    ...getPrimeLiquidityProviderPermissions(ZKSYNCSEPOLIA_PLP),
    ...getProtocolShareReservePermissions(ZKSYNCSEPOLIA_PSR),
    ...getComptrollerPermissions(),
    ...getVTokenPermissions(),
    ...getRewardDistributorPermissionsTimebased(),
    ...getIRMPermissions(),
  ],
  basesepolia: [
    ...getResilientOraclePermissions(BASESEPOLIA_RESILIENT_ORACLE),
    ...getChainlinkOraclePermissions(BASESEPOLIA_CHAINLINK_ORACLE),
    ...getRedstoneOraclePermissions(BASESEPOLIA_REDSTONE_ORACLE),
    ...getBoundValidatorPermissions(BASESEPOLIA_BOUND_VALIDATOR),
    ...getXVSPermissions(BASESEPOLIA_XVS),
    ...getXVSBridgeAdminPermissions(BASESEPOLIA_XVS_BRIDGE_ADMIN),
    ...getXVSVaultPermissions(BASESEPOLIA_XVS_VAULT_PROXY),
    ...getPoolRegistryPermissions(BASESEPOLIA_POOL_REGISTRY),
    ...getPrimePermissions(BASESEPOLIA_PRIME),
    ...getPrimeLiquidityProviderPermissions(BASESEPOLIA_PLP),
    ...getProtocolShareReservePermissions(BASESEPOLIA_PSR),
    ...getComptrollerPermissions(),
    ...getVTokenPermissions(),
    ...getRewardDistributorPermissionsTimebased(),
    ...getIRMPermissions(),
  ],
};

const revokePermissions: Permissions = {
  arbitrumone: [
    ...getPrimeRevokePermissions(ARBITRUMONE_PRIME, ARBITRUMONE_GUARDIAN),
    ...getPrimeLiquidityProviderRevokePermissions(ARBITRUMONE_PLP, ARBITRUMONE_GUARDIAN),
    ...getResilientOracleRevokePermissions(ARBITRUMONE_RESILIENT_ORACLE, ARBITRUMONE_GUARDIAN),
    ...getBoundValidatorRevokePermissions(ARBITRUMONE_BOUND_VALIDATOR, ARBITRUMONE_GUARDIAN),
    ...getXVSVaultRevokePermissions(ARBITRUMONE_XVS_VAULT_PROXY, ARBITRUMONE_GUARDIAN),
    ...getRewardDistributorRevokePermissions(ARBITRUMONE_GUARDIAN, true),
    ...getIRMRevokePermissions(ARBITRUMONE_GUARDIAN),
    ...getPoolRegistryRevokePermissions(ARBITRUMONE_POOL_REGISTRY, ARBITRUMONE_GUARDIAN),
    ...getComptrollerRevokePermissions(ARBITRUMONE_GUARDIAN),
    ...getVTokenRevokePermissions(ARBITRUMONE_GUARDIAN),
    ...getXVSBridgeAdminRevokePermissions(ARBITRUMONE_XVS_BRIDGE_ADMIN, ARBITRUMONE_GUARDIAN),
  ],
  ethereum: [
    ...getPrimeRevokePermissions(ETHEREUM_PRIME, ETHEREUM_GUARDIAN),
    ...getPrimeLiquidityProviderRevokePermissions(ETHEREUM_PLP, ETHEREUM_GUARDIAN),
    ...getResilientOracleRevokePermissions(ETHEREUM_RESILIENT_ORACLE, ETHEREUM_GUARDIAN),
    ...getBoundValidatorRevokePermissions(ETHEREUM_BOUND_VALIDATOR, ETHEREUM_GUARDIAN),
    ...getXVSVaultRevokePermissions(ETHEREUM_XVS_VAULT_PROXY, ETHEREUM_GUARDIAN),
    ...getRewardDistributorRevokePermissions(ETHEREUM_GUARDIAN, false),
    ...getIRMRevokePermissions(ETHEREUM_GUARDIAN),
    ...getPoolRegistryRevokePermissions(ETHEREUM_POOL_REGISTRY, ETHEREUM_GUARDIAN),
    ...getComptrollerRevokePermissions(ETHEREUM_GUARDIAN),
    ...getVTokenRevokePermissions(ETHEREUM_GUARDIAN),
    ...getConverterNetworkRevokePermissions(ETHEREUM_CONVERTER_NETWORK, ETHEREUM_GUARDIAN),
    ...getSFrxETHOracleRevokePermissions(ETHEREUM_sFrxETH_ORACLE, ETHEREUM_GUARDIAN),
    ...getConvertersRevokePermissions(ETHEREUM_CONVERTERS, ETHEREUM_GUARDIAN),
    ...getXVSVaultTreasuryRevokePermissions(ETHEREUM_XVS_VAULT_TREASURY, ETHEREUM_GUARDIAN),
    ...getXVSBridgeAdminRevokePermissions(ETHEREUM_XVS_BRIDGE_ADMIN, ETHEREUM_GUARDIAN),
  ],
  opbnbmainnet: [
    ...getResilientOracleRevokePermissions(OPBNBMAINNET_RESILIENT_ORACLE, OPBNBMAINNET_GUARDIAN),
    ...getBoundValidatorRevokePermissions(OPBNBMAINNET_BOUND_VALIDATOR, OPBNBMAINNET_GUARDIAN),
    ...getXVSVaultRevokePermissions(OPBNBMAINNET_XVS_VAULT_PROXY, OPBNBMAINNET_GUARDIAN),
    ...getIRMRevokePermissions(OPBNBMAINNET_GUARDIAN),
    ...getPoolRegistryRevokePermissions(OPBNBMAINNET_POOL_REGISTRY, OPBNBMAINNET_GUARDIAN),
    ...getComptrollerRevokePermissions(OPBNBMAINNET_GUARDIAN),
    ...getVTokenRevokePermissions(OPBNBMAINNET_GUARDIAN),
    ...getXVSBridgeAdminRevokePermissions(OPBNBMAINNET_XVS_BRIDGE_ADMIN, OPBNBMAINNET_GUARDIAN),
  ],
  opmainnet: [
    ...getPrimeRevokePermissions(OPMAINNET_PRIME, OPMAINNET_GUARDIAN),
    ...getPrimeLiquidityProviderRevokePermissions(OPMAINNET_PLP, OPMAINNET_GUARDIAN),
    ...getResilientOracleRevokePermissions(OPMAINNET_RESILIENT_ORACLE, OPMAINNET_GUARDIAN),
    ...getBoundValidatorRevokePermissions(OPMAINNET_BOUND_VALIDATOR, OPMAINNET_GUARDIAN),
    ...getXVSVaultRevokePermissions(OPMAINNET_XVS_VAULT_PROXY, OPMAINNET_GUARDIAN),
    ...getRewardDistributorRevokePermissions(OPMAINNET_GUARDIAN, true),
    ...getIRMRevokePermissions(OPMAINNET_GUARDIAN),
    ...getPoolRegistryRevokePermissions(OPMAINNET_POOL_REGISTRY, OPMAINNET_GUARDIAN),
    ...getComptrollerRevokePermissions(OPMAINNET_GUARDIAN),
    ...getVTokenRevokePermissions(OPMAINNET_GUARDIAN),
    ...getXVSBridgeAdminRevokePermissions(OPMAINNET_XVS_BRIDGE_ADMIN, OPMAINNET_GUARDIAN),
  ],

  zksyncmainnet: [
    ...getPrimeRevokePermissions(ZKSYNCMAINNET_PRIME, ZKSYNCMAINNET_GUARDIAN),
    ...getPrimeLiquidityProviderRevokePermissions(ZKSYNCMAINNET_PLP, ZKSYNCMAINNET_GUARDIAN),
    ...getResilientOracleRevokePermissions(ZKSYNCMAINNET_RESILIENT_ORACLE, ZKSYNCMAINNET_GUARDIAN),
    ...getBoundValidatorRevokePermissions(ZKSYNCMAINNET_BOUND_VALIDATOR, ZKSYNCMAINNET_GUARDIAN),
    ...getXVSVaultRevokePermissions(ZKSYNCMAINNET_XVS_VAULT_PROXY, ZKSYNCMAINNET_GUARDIAN),
    ...getRewardDistributorRevokePermissions(ZKSYNCMAINNET_GUARDIAN, true),
    ...getIRMRevokePermissions(ZKSYNCMAINNET_GUARDIAN),
    ...getPoolRegistryRevokePermissionsForWildcard(ZKSYNCMAINNET_GUARDIAN),
    ...getPoolRegistryRevokePermissions(ZKSYNCMAINNET_POOL_REGISTRY, ZKSYNCMAINNET_GUARDIAN),
    ...getComptrollerRevokePermissions(ZKSYNCMAINNET_GUARDIAN),
    ...getVTokenRevokePermissions(ZKSYNCMAINNET_GUARDIAN),
    ...getXVSBridgeAdminRevokePermissions(ZKSYNCMAINNET_XVS_BRIDGE_ADMIN, ZKSYNCMAINNET_GUARDIAN),
  ],

  basemainnet: [
    ...getPrimeRevokePermissions(BASEMAINNET_PRIME, BASEMAINNET_GUARDIAN),
    ...getPrimeLiquidityProviderRevokePermissions(BASEMAINNET_PLP, BASEMAINNET_GUARDIAN),
    ...getResilientOracleRevokePermissions(BASEMAINNET_RESILIENT_ORACLE, BASEMAINNET_GUARDIAN),
    ...getBoundValidatorRevokePermissions(BASEMAINNET_BOUND_VALIDATOR, BASEMAINNET_GUARDIAN),
    ...getXVSVaultRevokePermissions(BASEMAINNET_XVS_VAULT_PROXY, BASEMAINNET_GUARDIAN),
    ...getRewardDistributorRevokePermissions(BASEMAINNET_GUARDIAN, true),
    ...getIRMRevokePermissions(BASEMAINNET_GUARDIAN),
    ...getPoolRegistryRevokePermissions(BASEMAINNET_POOL_REGISTRY, BASEMAINNET_GUARDIAN),
    ...getComptrollerRevokePermissions(BASEMAINNET_GUARDIAN),
    ...getVTokenRevokePermissions(BASEMAINNET_GUARDIAN),
    ...getXVSBridgeAdminRevokePermissions(BASEMAINNET_XVS_BRIDGE_ADMIN, BASEMAINNET_GUARDIAN),
  ],
  
  opbnbtestnet: [
    ...getResilientOracleRevokePermissions(OPBNBTESTNET_RESILIENT_ORACLE, OPBNBTESTNET_GUARDIAN),
    ...getBoundValidatorRevokePermissions(OPBNBTESTNET_BOUND_VALIDATOR, OPBNBTESTNET_GUARDIAN),
    ...getXVSVaultRevokePermissions(OPBNBTESTNET_XVS_VAULT_PROXY, OPBNBTESTNET_GUARDIAN),
    ...getIRMRevokePermissions(OPBNBTESTNET_GUARDIAN),
    ...getPoolRegistryRevokePermissionsForWildcard(OPBNBTESTNET_GUARDIAN),
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
    ...getXVSVaultRevokePermissions(SEPOLIA_XVS_VAULT_PROXY, SEPOLIA_GUARDIAN),
    ...getRewardDistributorRevokePermissions(SEPOLIA_GUARDIAN, false),
    ...getIRMRevokePermissions(SEPOLIA_GUARDIAN),
    ...getPoolRegistryRevokePermissions(SEPOLIA_POOL_REGISTRY, SEPOLIA_GUARDIAN),
    ...getComptrollerRevokePermissions(SEPOLIA_GUARDIAN),
    ...getVTokenRevokePermissions(SEPOLIA_GUARDIAN),
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
    ...getXVSVaultRevokePermissions(ARBITRUMSEPOLIA_XVS_VAULT_PROXY, ARBITRUMSEPOLIA_GUARDIAN),
    ...getRewardDistributorRevokePermissions(ARBITRUMSEPOLIA_GUARDIAN, true),
    ...getIRMRevokePermissions(ARBITRUMSEPOLIA_GUARDIAN),
    ...getPoolRegistryRevokePermissionsForWildcard(ARBITRUMSEPOLIA_GUARDIAN),
    ...getComptrollerRevokePermissions(ARBITRUMSEPOLIA_GUARDIAN),
    ...getVTokenRevokePermissions(ARBITRUMSEPOLIA_GUARDIAN),
    ...getXVSBridgeAdminRevokePermissions(ARBITRUMSEPOLIA_XVS_BRIDGE_ADMIN, ARBITRUMSEPOLIA_GUARDIAN),
    ...getOmniChainExecutorOwnerRevokePermissions(ARBITRUMSEPOLIA_OMNICHAIN_EXECUTOR_OWNER, ARBITRUMSEPOLIA_GUARDIAN),
  ],
  opsepolia: [
    ...getPrimeRevokePermissions(OPSEPOLIA_PRIME, OPSEPOLIA_GUARDIAN),
    ...getPrimeLiquidityProviderRevokePermissions(OPSEPOLIA_PLP, OPSEPOLIA_GUARDIAN),
    ...getResilientOracleRevokePermissions(OPSEPOLIA_RESILIENT_ORACLE, OPSEPOLIA_GUARDIAN),
    ...getBoundValidatorRevokePermissions(OPSEPOLIA_BOUND_VALIDATOR, OPSEPOLIA_GUARDIAN),
    ...getXVSVaultRevokePermissions(OPSEPOLIA_XVS_VAULT_PROXY, OPSEPOLIA_GUARDIAN),
    ...getRewardDistributorRevokePermissions(OPSEPOLIA_GUARDIAN, true),
    ...getIRMRevokePermissions(OPSEPOLIA_GUARDIAN),
    ...getPoolRegistryRevokePermissions(OPSEPOLIA_POOL_REGISTRY, OPSEPOLIA_GUARDIAN),
    ...getComptrollerRevokePermissions(OPSEPOLIA_GUARDIAN),
    ...getVTokenRevokePermissions(OPSEPOLIA_GUARDIAN),
    ...getXVSBridgeAdminRevokePermissions(OPSEPOLIA_XVS_BRIDGE_ADMIN, OPSEPOLIA_GUARDIAN),
  ],
  zksyncsepolia: [
    ...getPrimeRevokePermissions(ZKSYNCSEPOLIA_PRIME, ZKSYNCSEPOLIA_GUARDIAN),
    ...getPrimeLiquidityProviderRevokePermissions(ZKSYNCSEPOLIA_PLP, ZKSYNCSEPOLIA_GUARDIAN),
    ...getResilientOracleRevokePermissions(ZKSYNCSEPOLIA_RESILIENT_ORACLE, ZKSYNCSEPOLIA_GUARDIAN),
    ...getBoundValidatorRevokePermissions(ZKSYNCSEPOLIA_BOUND_VALIDATOR, ZKSYNCSEPOLIA_GUARDIAN),
    ...getXVSVaultRevokePermissions(ZKSYNCSEPOLIA_XVS_VAULT_PROXY, ZKSYNCSEPOLIA_GUARDIAN),
    ...getRewardDistributorRevokePermissions(ZKSYNCSEPOLIA_GUARDIAN, true),
    ...getIRMRevokePermissions(ZKSYNCSEPOLIA_GUARDIAN),
    ...getPoolRegistryRevokePermissionsForWildcard(ZKSYNCSEPOLIA_GUARDIAN),
    ...getPoolRegistryRevokePermissions(ZKSYNCSEPOLIA_POOL_REGISTRY, ZKSYNCSEPOLIA_GUARDIAN),
    ...getComptrollerRevokePermissions(ZKSYNCSEPOLIA_GUARDIAN),
    ...getVTokenRevokePermissions(ZKSYNCSEPOLIA_GUARDIAN),
    ...getXVSBridgeAdminRevokePermissions(ZKSYNCSEPOLIA_XVS_BRIDGE_ADMIN, ZKSYNCSEPOLIA_GUARDIAN),
  ],
  basesepolia: [
    ...getPrimeRevokePermissions(BASESEPOLIA_PRIME, BASESEPOLIA_GUARDIAN),
    ...getPrimeLiquidityProviderRevokePermissions(BASESEPOLIA_PLP, BASESEPOLIA_GUARDIAN),
    ...getResilientOracleRevokePermissions(BASESEPOLIA_RESILIENT_ORACLE, BASESEPOLIA_GUARDIAN),
    ...getBoundValidatorRevokePermissions(BASESEPOLIA_BOUND_VALIDATOR, BASESEPOLIA_GUARDIAN),
    ...getXVSVaultRevokePermissions(BASESEPOLIA_XVS_VAULT_PROXY, BASESEPOLIA_GUARDIAN),
    ...getRewardDistributorRevokePermissions(BASESEPOLIA_GUARDIAN, true),
    ...getIRMRevokePermissions(BASESEPOLIA_GUARDIAN),
    ...getPoolRegistryRevokePermissions(BASESEPOLIA_POOL_REGISTRY, BASESEPOLIA_GUARDIAN),
    ...getComptrollerRevokePermissions(BASESEPOLIA_GUARDIAN),
    ...getVTokenRevokePermissions(BASESEPOLIA_GUARDIAN),
    ...getXVSBridgeAdminRevokePermissions(BASESEPOLIA_XVS_BRIDGE_ADMIN, BASESEPOLIA_GUARDIAN),
  ],
};

function splitPermissions(
  array: ACMCommandsAggregator.PermissionStruct[],
  chunkSize: number = 200,
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
