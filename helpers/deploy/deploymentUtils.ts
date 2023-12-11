import { ethers, getNamedAccounts } from "hardhat";

import bscMainnetGovernanceDeployments from "../../deployments/bscmainnet.json";
import bscTestnetGovernanceDeployments from "../../deployments/bsctestnet.json";
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
  }

  const normalTimelock = await ethers.getContract("NormalTimeLock");
  return normalTimelock.address;
};

export const getOmnichainProposalSender = async (network: Omit<SUPPORTED_NETWORKS, "ethereum" | "sepolia">) => {
  if (network === "hardhat") {
    const omnichainProposalSenderAddress = (await ethers.getContract("OmnichainProposalSender")).address;
    return omnichainProposalSenderAddress;
  } else if (network === "sepolia") {
    return bscTestnetGovernanceDeployments.contracts.OmnichainProposalSender.address;
  }
  return bscMainnetGovernanceDeployments.contracts.OmnichainProposalSender.address;
};

// eslint-disable-next-line @typescript-eslint/no-empty-function
export default () => {};
