export enum SUPPORTED_NETWORKS {
  BSCTESTNET = "bsctestnet",
  BSCMAINNET = "bscmainnet",
  SEPOLIA = "sepolia",
  ETHERUEM = "ethereum",
  HARDHAT = "hardhat",
}

export const LZ_ENDPOINTS: Record<SUPPORTED_NETWORKS, string> = {
  ethereum: "0x66A71Dcef29A0fFBDBE3c6a460a3B5BC225Cd675",
  bscmainnet: "0x3c2269811836af69497E5F486A85D7316753cf62",
  sepolia: "0xae92d5aD7583AD66E49A0c67BAd18F6ba52dDDc1",
  bsctestnet: "0x6Fcb97553D41516Cb228ac03FdC8B9a0a9df04A1",
  hardhat: "0x6Fcb97553D41516Cb228ac03FdC8B9a0a9df04A1",
};

// eslint-disable-next-line @typescript-eslint/no-empty-function
export default () => {};
