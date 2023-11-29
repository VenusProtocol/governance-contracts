import bscMainnetDeployments from "@venusprotocol/venus-protocol/networks/mainnet.json";
import bscTestnetDeployments from "@venusprotocol/venus-protocol/networks/testnet.json";
import { getNamedAccounts } from "hardhat";

import { SUPPORTED_NETWORKS } from "./constants";

export const getAcmAdminAccount = async (network: SUPPORTED_NETWORKS): string => {
  const { deployer } = await getNamedAccounts();
  return {
    bsctestnet: bscTestnetDeployments.Contracts.Timelock, // NORMAL TIMELOCK
    bscmainnet: bscMainnetDeployments.Contracts.Timelock, // NORMAL TIMELOCK
    sepolia: "0x94fa6078b6b8a26f0b6edffbe6501b22a10470fb", // SEPOLIA MULTISIG
    ethereum: "0x285960C5B22fD66A736C7136967A3eB15e93CC67", // ETHEREUM MULTISIG
    hardhat: deployer,
  }[network];
};

// eslint-disable-next-line @typescript-eslint/no-empty-function
export default () => {};
