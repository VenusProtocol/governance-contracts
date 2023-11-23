import bscMainnetDeployments from "@venusprotocol/venus-protocol/networks/mainnet.json";
import bscTestnetDeployments from "@venusprotocol/venus-protocol/networks/testnet.json";

import { SUPPORTED_NETWORKS } from "./constants";

export const acmAdminAccount: Record<SUPPORTED_NETWORKS, string> = {
  bsctestnet: bscTestnetDeployments.Contracts.Timelock, // NORMAL TIMELOCK
  bscmainnet: bscMainnetDeployments.Contracts.Timelock, // NORMAL TIMELOCK
  sepolia: "0x94fa6078b6b8a26f0b6edffbe6501b22a10470fb", // SEPOLIA MULTISIG
  ethereum: "0x1C2CAc6ec528c20800B2fe734820D87b581eAA6B", // ETHEREUM MULTISIG
};

// eslint-disable-next-line @typescript-eslint/no-empty-function
export default () => {};
