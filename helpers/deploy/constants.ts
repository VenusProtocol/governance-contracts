export enum SUPPORTED_NETWORKS {
  BSCTESTNET = "bsctestnet",
  BSCMAINNET = "bscmainnet",
  SEPOLIA = "sepolia",
  ETHERUEM = "ethereum",
  OPBNBTESTNET = "opbnbtestnet",
  OPBNBMAINNET = "opbnbmainnet",
  ARBITRUM_SEPOLIA = "arbitrumsepolia",
  ARBITRUM_ONE = "arbitrumone",
  ZKSYNC_SEPOLIA = "zksyncsepolia",
  HARDHAT = "hardhat",
}

export const LZ_CHAINID: Record<SUPPORTED_NETWORKS, number> = {
  ethereum: 101,
  bscmainnet: 102,
  opbnbmainnet: 202,
  arbitrumone: 110,
  sepolia: 10161,
  bsctestnet: 10102,
  opbnbtestnet: 10202,
  arbitrumsepolia: 10231,
  hardhat: 10102,
  zksyncsepolia: 10248,
};

// eslint-disable-next-line @typescript-eslint/no-empty-function
export default () => {};
