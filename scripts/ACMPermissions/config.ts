import { SUPPORTED_NETWORKS } from "helpers/deploy/constants";

export const startingBlockForACM: Record<string, number> = {
  bscmainnet: 21968139,
  bsctestnet: 26711168,
  ethereum: 18641314,
  sepolia: 4204345,
  opbnbmainnet: 10895878,
  opbnbtestnet: 14542763,
  arbitrumone: 201597544,
  arbitrumsepolia: 25350320,
  zksyncmainnet: 42301367,
  zksyncsepolia: 3452622,
  opmainnet: 125490540,
  opsepolia: 14150254,
  basemainnet: 23212004,
  basesepolia: 16737042,
  unichainsepolia: 3358050,
  unichainmainnet: 8106529,
};

export const addressMap: Record<SUPPORTED_NETWORKS, Record<string, string>> = {
  hardhat: {
    "0x0000000000000000000000000000000000000000": "AddressZero",
  },
  bscmainnet: {
    "0x939bD8d64c0A9583A7Dcea9933f7b21697ab6396": "NormalTimelock",
    "0x555ba73dB1b006F3f2C7dB7126d6e4343aDBce02": "FastTrackTimelock",
    "0x213c446ec11e45b15a6E29C1C1b402B8897f606d": "CriticalTimelock",
    "0x7B1AE5Ea599bC56734624b95589e7E8E64C351c9": "Guardian 1",
    "0x1C2CAc6ec528c20800B2fe734820D87b581eAA6B": "Guardian 2",
    "0x3a3284dC0FaFfb0b5F0d074c4C704D14326C98cF": "Guardian 3",
    "0x9F7b01A536aFA00EF10310A162877fd792cD0666": "PoolRegistry",
  },

  bsctestnet: {
    "0xce10739590001705F7FF231611ba4A48B2820327": "NormalTimelock",
    "0x3CFf21b7AF8390fE68799D58727d3b4C25a83cb6": "FastTrackTimelock",
    "0x23B893a7C45a5Eb8c8C062b9F32d0D2e43eD286D": "CriticalTimelock",
    "0x2Ce1d0ffD7E869D9DF33e28552b12DdDed326706": "Guardian",
    "0xC85491616Fa949E048F3aAc39fbf5b0703800667": "PoolRegistry",
  },

  ethereum: {
    "0xd969E79406c35E80750aAae061D402Aab9325714": "NormalTimelock",
    "0x8764F50616B62a99A997876C2DEAaa04554C5B2E": "FastTrackTimelock",
    "0xeB9b85342c34F65af734C7bd4a149c86c472bC00": "CriticalTimelock",
    "0x285960C5B22fD66A736C7136967A3eB15e93CC67": "Guardian",
    "0x61CAff113CCaf05FFc6540302c37adcf077C5179": "PoolRegistry",
    "0x888E317606b4c590BBAD88653863e8B345702633": "XVSBridgeDest",
  },

  sepolia: {
    "0xc332F7D8D5eA72cf760ED0E1c0485c8891C6E0cF": "NormalTimelock",
    "0x7F043F43Adb392072a3Ba0cC9c96e894C6f7e182": "FastTrackTimelock",
    "0xA24A7A65b8968a749841988Bd7d05F6a94329fDe": "CriticalTimelock",
    "0x94fa6078b6b8a26F0B6EDFFBE6501B22A10470fB": "Guardian",
    "0x758f5715d817e02857Ba40889251201A5aE3E186": "PoolRegistry",
    "0xc340b7d3406502F43dC11a988E4EC5bbE536E642": "XVSBridgeDest",
  },

  opbnbmainnet: {
    "0x10f504e939b912569Dca611851fDAC9E3Ef86819": "NormalTimelock",
    "0xEdD04Ecef0850e834833789576A1d435e7207C0d": "FastTrackTimelock",
    "0xA7DD2b15B24377296F11c702e758cd9141AB34AA": "CriticalTimelock",
    "0xC46796a21a3A9FAB6546aF3434F2eBfFd0604207": "Guardian",
    "0x345a030Ad22e2317ac52811AC41C1A63cfa13aEe": "PoolRegistry",
    "0x100D331C1B5Dcd41eACB1eCeD0e83DCEbf3498B2": "XVSBridgeDest",
  },

  opbnbtestnet: {
    "0x1c4e015Bd435Efcf4f58D82B0d0fBa8fC4F81120": "NormalTimelock",
    "0xB2E6268085E75817669479b22c73C2AfEaADF7A6": "FastTrackTimelock",
    "0xBd06aCDEF38230F4EdA0c6FD392905Ad463e42E3": "CriticalTimelock",
    "0xb15f6EfEbC276A3b9805df81b5FB3D50C2A62BDf": "Guardian",
    "0x560eA4e1cC42591E9f5F5D83Ad2fd65F30128951": "PoolRegistry",
    "0xA03205bC635A772E533E7BE36b5701E331a70ea3": "XVSBridgeDest",
  },

  arbitrumone: {
    "0x4b94589Cc23F618687790036726f744D602c4017": "NormalTimelock",
    "0x2286a9B2a5246218f2fC1F380383f45BDfCE3E04": "FastTrackTimelock",
    "0x181E4f8F21D087bF02Ea2F64D5e550849FBca674": "CriticalTimelock",
    "0x14e0E151b33f9802b3e75b621c1457afc44DcAA0": "Guardian",
    "0x382238f07Bc4Fe4aA99e561adE8A4164b5f815DA": "PoolRegistry",
    "0x20cEa49B5F7a6DBD78cAE772CA5973eF360AA1e6": "XVSBridgeDest",
  },

  arbitrumsepolia: {
    "0x794BCA78E606f3a462C31e5Aba98653Efc1322F8": "NormalTimelock",
    "0x14642991184F989F45505585Da52ca6A6a7dD4c8": "FastTrackTimelock",
    "0x0b32Be083f7041608E023007e7802430396a2123": "CriticalTimelock",
    "0x1426A5Ae009c4443188DA8793751024E358A61C2": "Guardian",
    "0xf93Df3135e0D555185c0BC888073374cA551C5fE": "PoolRegistry",
    "0xFdC5cEC63FD167DA46cF006585b30D03B104eFD4": "XVSBridgeDest",
  },

  zksyncmainnet: {
    "0x093565Bc20AA326F4209eBaF3a26089272627613": "NormalTimelock",
    "0x32f71c95BC8F9d996f89c642f1a84d06B2484AE9": "FastTrackTimelock",
    "0xbfbc79D4198963e4a66270F3EfB1fdA0F382E49c": "CriticalTimelock",
    "0x751Aa759cfBB6CE71A43b48e40e1cCcFC66Ba4aa": "Guardian",
    "0xFD96B926298034aed9bBe0Cca4b651E41eB87Bc4": "PoolRegistry",
    "0x16a62B534e09A7534CD5847CFE5Bf6a4b0c1B116": "XVSBridgeDest",
  },
  zksyncsepolia: {
    "0x1730527a0f0930269313D77A317361b42971a67E": "NormalTimelock",
    "0xb055e028b27d53a455a6c040a6952e44E9E615c4": "FastTrackTimelock",
    "0x0E6138bE0FA1915efC73670a20A10EFd720a6Cc8": "CriticalTimelock",
    "0xa2f83de95E9F28eD443132C331B6a9C9B7a9F866": "Guardian",
    "0x1401404e6279BB8C06E5E3999eCA3e2008B46A76": "PoolRegistry",
    "0x760461ccB2508CAAa2ECe0c28af3a4707b853043": "XVSBridgeDest",
  },
  opmainnet: {
    "0x0C6f1E6B4fDa846f63A0d5a8a73EB811E0e0C04b": "NormalTimelock",
    "0x508bD9C31E8d6760De04c70fe6c2b24B3cDea7E7": "FastTrackTimelock",
    "0xB82479bc345CAA7326D7d21306972033226fC185": "CriticalTimelock",
    "0x2e94dd14E81999CdBF5deDE31938beD7308354b3": "Guardian",
    "0x147780799840d541C1d7c998F0cbA996d11D62bb": "PoolRegistry",
    "0xbBe46bAec851355c3FC4856914c47eB6Cea0B8B4": "XVSBridgeDest",
  },
  opsepolia: {
    "0xdDe31d7eEEAD7Cf9790F833C4FF4c6e61404402a": "NormalTimelock",
    "0xe0Fa35b6279dd802C382ae54c50C8B16deaC0885": "FastTrackTimelock",
    "0x45d2263c6E0dbF84eBffB1Ee0b80aC740607990B": "CriticalTimelock",
    "0xd57365EE4E850e881229e2F8Aa405822f289e78d": "Guardian",
    "0x6538C861C7A6997602311342657b9143dD9E8152": "PoolRegistry",
    "0x79a36dc9a43D05Db4747c59c02F48ed500e47dF1": "XVSBridgeDest",
  },
  basemainnet: {
    "0x939bD8d64c0A9583A7Dcea9933f7b21697ab6396": "NormalTimelock",
    "0x555ba73dB1b006F3f2C7dB7126d6e4343aDBce02": "FastTrackTimelock",
    "0x213c446ec11e45b15a6E29C1C1b402B8897f606d": "CriticalTimelock",
    "0x1803Cf1D3495b43cC628aa1d8638A981F8CD341C": "Guardian",
    "0xeef902918DdeCD773D4B422aa1C6e1673EB9136F": "PoolRegistry",
    "0x3dd92fb51a5d381ae78e023dfb5dd1d45d2426cd": "XVSBridgeDest",
  },
  basesepolia: {
    "0xCc84f6122649eDc48f4a426814e6b6C6fF9bBe0a": "NormalTimelock",
    "0x3dFA652D3aaDcb93F9EA7d160d674C441AaA8EE2": "FastTrackTimelock",
    "0xbeDb7F2d0617292364bA4D73cf016c0f6BB5542E": "CriticalTimelock",
    "0xdf3b635d2b535f906BB02abb22AED71346E36a00": "Guardian",
    "0xCa330282BEeb07a81963336d0bf8f5f34317916c": "PoolRegistry",
    "0xD5Cd1fD17B724a391C1bce55Eb9d88E3205eED60": "XVSBridgeDest",
  },
  unichainmainnet: {
    "0x918532A78d22419Da4091930d472bDdf532BE89a": "NormalTimelock",
    "0x4121995b87f9EE8bA0a89e87470255e2E0fe48c7": "FastTrackTimelock",
    "0x1b05eCb489842786776a9A10e91AAb56e2CFe15e": "CriticalTimelock",
    "0x1803Cf1D3495b43cC628aa1d8638A981F8CD341C": "Guardian",
    "0x0C52403E16BcB8007C1e54887E1dFC1eC9765D7C": "PoolRegistry",
    "0x9c95f8aa28fFEB7ECdC0c407B9F632419c5daAF8": "XVSBridgeDest",
  },
  unichainsepolia: {
    "0x5e20F5A2e23463D39287185DF84607DF7068F314": "NormalTimelock",
    "0x668cDb1A414006D0a26e9e13881D4Cd30B8b2a4A": "FastTrackTimelock",
    "0x86C093266e824FA4345484a7B9109e9567923DA6": "CriticalTimelock",
    "0x9831D3A641E8c7F082EEA75b8249c99be9D09a34": "Guardian",
    "0x9027cF782515F3184bbF7A6cD7a33052dc52E439": "PoolRegistry",
    "0xCAF833318a6663bb23aa7f218e597c2F7970b4D2": "XVSBridgeDest",
  },
};
