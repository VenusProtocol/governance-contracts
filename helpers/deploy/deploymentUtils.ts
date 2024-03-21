import { ethers, getNamedAccounts } from "hardhat";

import { SUPPORTED_NETWORKS } from "./constants";

export const getAcmAdminAccount = async (network: SUPPORTED_NETWORKS): Promise<string> => {
  const { deployer } = await getNamedAccounts();
  if (network === "hardhat") {
    return deployer;
  } else if (network === "sepolia") {
    return "0x94fa6078b6b8a26f0b6edffbe6501b22a10470fb"; // SEPOLIA MULTISIG
  } else if (network === "ethereum") {
    return "0x285960C5B22fD66A736C7136967A3eB15e93CC67"; // ETHEREUM MULTISIG
  } else if (network === "opbnbtestnet") {
    return "0xb15f6EfEbC276A3b9805df81b5FB3D50C2A62BDf"; // OPBNBTESTNET MULTISIG
  } else if (network === "opbnbmainnet") {
    return "0xC46796a21a3A9FAB6546aF3434F2eBfFd0604207"; //OPBNBMAINNET MULTISIG
  } else if (network === "arbitrumSepolia") {
    return "0x1426A5Ae009c4443188DA8793751024E358A61C2"; //ARBITRUM SEPOLIA MULTISIG
  } else if (network === "arbitrumOne") {
    return ""; //ARBITRUM ONE MULTISIG
  }

  const normalTimelock = await ethers.getContract("NormalTimeLock");
  return normalTimelock.address;
};

// eslint-disable-next-line @typescript-eslint/no-empty-function
export default () => {};
