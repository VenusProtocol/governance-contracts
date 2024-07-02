export const startingBlockForACM: Record<string, number> = {
  bscmainnet: 21968139,
  bsctestnet: 26711168,
  ethereum: 18641314,
  sepolia: 4204345,
  opbnbmainnet: 10895878,
  opbnbtestnet: 14542763,
  arbitrumone: 201597544,
  arbitrumsepolia: 25350320,
};


export const addressMap : Record<string, string> = {

  // BNB mainnet
  "0x939bD8d64c0A9583A7Dcea9933f7b21697ab6396" : "NormalTimelock",
  "0x555ba73dB1b006F3f2C7dB7126d6e4343aDBce02" : "FastTrackTimelock",
  "0x213c446ec11e45b15a6E29C1C1b402B8897f606d" : "CriticalTimelock",
  "0x7B1AE5Ea599bC56734624b95589e7E8E64C351c9" : "Guardian 1",
  "0x1C2CAc6ec528c20800B2fe734820D87b581eAA6B" : "Guardian 2",
  "0x3a3284dC0FaFfb0b5F0d074c4C704D14326C98cF" : "Guardian 3",
  "0x9F7b01A536aFA00EF10310A162877fd792cD0666" : "PoolRegistry",

  // BNB testnet
  "0xce10739590001705F7FF231611ba4A48B2820327" : "NormalTimelock",
  "0x3CFf21b7AF8390fE68799D58727d3b4C25a83cb6" : "FastTrackTimelock",
  "0x23B893a7C45a5Eb8c8C062b9F32d0D2e43eD286D" : "CriticalTimelock",
  "0x2Ce1d0ffD7E869D9DF33e28552b12DdDed326706" : "Guardian",
  "0xC85491616Fa949E048F3aAc39fbf5b0703800667" : "PoolRegistry",

  // Ethereum
  "0xd969E79406c35E80750aAae061D402Aab9325714" : "NormalTimelock",
  "0x8764F50616B62a99A997876C2DEAaa04554C5B2E" : "FastTrackTimelock",
  "0xeB9b85342c34F65af734C7bd4a149c86c472bC00" : "CriticalTimelock",
  "0x285960C5B22fD66A736C7136967A3eB15e93CC67" : "Guardian",
  "0x61CAff113CCaf05FFc6540302c37adcf077C5179" : "PoolRegistry",

  // Sepolia
  "0xc332F7D8D5eA72cf760ED0E1c0485c8891C6E0cF" : "NormalTimelock",
  "0x7F043F43Adb392072a3Ba0cC9c96e894C6f7e182" : "FastTrackTimelock",
  "0xA24A7A65b8968a749841988Bd7d05F6a94329fDe" : "CriticalTimelock",
  "0x94fa6078b6b8a26F0B6EDFFBE6501B22A10470fB" : "Guardian",
  "0x758f5715d817e02857Ba40889251201A5aE3E186" : "PoolRegistry",
  
  // OPBNB mainnet 
  "0x10f504e939b912569Dca611851fDAC9E3Ef86819" : "NormalTimelock",
  "0xEdD04Ecef0850e834833789576A1d435e7207C0d" : "FastTrackTimelock",
  "0xA7DD2b15B24377296F11c702e758cd9141AB34AA" : "CriticalTimelock",
  "0xC46796a21a3A9FAB6546aF3434F2eBfFd0604207" : "Guardian",
  "0x345a030Ad22e2317ac52811AC41C1A63cfa13aEe" : "PoolRegistry",

  // OPBNB testnet
  "0x1c4e015Bd435Efcf4f58D82B0d0fBa8fC4F81120" : "NormalTimelock",
  "0xB2E6268085E75817669479b22c73C2AfEaADF7A6" : "FastTrackTimelock",
  "0xBd06aCDEF38230F4EdA0c6FD392905Ad463e42E3" : "CriticalTimelock",
  "0xb15f6EfEbC276A3b9805df81b5FB3D50C2A62BDf" : "Guardian",
  "0x560eA4e1cC42591E9f5F5D83Ad2fd65F30128951" : "PoolRegistry",

  // Arbitrum one
  "0x4b94589Cc23F618687790036726f744D602c4017" : "NormalTimelock",
  "0x2286a9B2a5246218f2fC1F380383f45BDfCE3E04" : "FastTrackTimelock",
  "0x181E4f8F21D087bF02Ea2F64D5e550849FBca674" : "CriticalTimelock",
  "0x14e0E151b33f9802b3e75b621c1457afc44DcAA0" : "Guardian",
  "0x382238f07Bc4Fe4aA99e561adE8A4164b5f815DA" : "PoolRegistry",

  // Arbitrum sepolia
  "0x794BCA78E606f3a462C31e5Aba98653Efc1322F8" : "NormalTimelock",
  "0x14642991184F989F45505585Da52ca6A6a7dD4c8" : "FastTrackTimelock",
  "0x0b32Be083f7041608E023007e7802430396a2123" : "CriticalTimelock",
  "0x1426A5Ae009c4443188DA8793751024E358A61C2" : "Guardian",
  "0xf93Df3135e0D555185c0BC888073374cA551C5fE" : "PoolRegistry",
}
