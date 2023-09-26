import bscMainnetDeployments from "@venusprotocol/venus-protocol/networks/mainnet.json";
import bscTestnetDeployments from "@venusprotocol/venus-protocol/networks/testnet.json";

import { SUPPORTED_NETWORKS } from "./constants";

export const acmAdminAccount: Record<SUPPORTED_NETWORKS, string> = {
  bsctestnet: bscTestnetDeployments.Contracts.Timelock, // NORMAL TIMELOCK
  bscmainnet: bscMainnetDeployments.Contracts.Timelock, // NORMAL TIMELOCK
  sepolia: "0x94fa6078b6b8a26f0b6edffbe6501b22a10470fb", // SEPOLIA MULTISIG
  ethereum: "", // TODO: add Ethereum MULTISIG once it is deployed
};
