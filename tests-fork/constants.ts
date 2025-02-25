import { network } from "hardhat";

const getForkBlock = () => {
  const networkName = process.env.FORKED_NETWORK || network.name;
  if (networkName === "bscmainnet") {
    return 46251866;
  }
  if (networkName === "bsctestnet") {
    return 47871776;
  }
  return 0;
};

export { getForkBlock };
