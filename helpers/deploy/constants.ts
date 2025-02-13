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
  ZKSYNC_MAINNET = "zksyncmainnet",
  OPSEPOLIA = "opsepolia",
  OPMAINNET = "opmainnet",
  BASESEPOLIA = "basesepolia",
  BASEMAINNET = "basemainnet",
  UNICHAINSEPOLIA = "unichainsepolia",
  UNICHAINMAINNET = "unichainmainnet",
  BERACHAINBARTIO = "berachainbartio",
  HARDHAT = "hardhat",
}

export const LZ_CHAINID: Record<SUPPORTED_NETWORKS, number> = {
  ethereum: 101,
  bscmainnet: 102,
  opbnbmainnet: 202,
  arbitrumone: 110,
  opmainnet: 111,
  basemainnet: 184,
  sepolia: 10161,
  bsctestnet: 10102,
  opbnbtestnet: 10202,
  arbitrumsepolia: 10231,
  zksyncsepolia: 10248,
  zksyncmainnet: 165,
  opsepolia: 10232,
  basesepolia: 10245,
  unichainsepolia: 10333,
  unichainmainnet: 320,
  berachainbartio: 30362,
  hardhat: 10102,
};

// eslint-disable-next-line @typescript-eslint/no-empty-function
export default () => {};
