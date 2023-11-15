import bscMainnetDeployments from "@venusprotocol/venus-protocol/networks/mainnet.json";
import bscTestnetDeployments from "@venusprotocol/venus-protocol/networks/testnet.json";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { SUPPORTED_NETWORKS } from "./constants";

export const acmAdminAccount: Record<SUPPORTED_NETWORKS, string> = {
  bsctestnet: bscTestnetDeployments.Contracts.Timelock, // NORMAL TIMELOCK
  bscmainnet: bscMainnetDeployments.Contracts.Timelock, // NORMAL TIMELOCK
  sepolia: "0x94fa6078b6b8a26f0b6edffbe6501b22a10470fb", // SEPOLIA MULTISIG
  ethereum: "", // TODO: add Ethereum MULTISIG once it is deployed
  hardhat: "",
};

export const toAddress = async (addressOrAlias: string, hre: HardhatRuntimeEnvironment): Promise<string> => {
  const { getNamedAccounts } = hre;
  const { deployments } = hre;
  if (addressOrAlias.startsWith("0x")) {
    return addressOrAlias;
  }
  if (addressOrAlias.startsWith("account:")) {
    const namedAccounts = await getNamedAccounts();
    return namedAccounts[addressOrAlias.slice("account:".length)];
  }
  const deployment = await deployments.get(addressOrAlias);
  return deployment.address;
};
