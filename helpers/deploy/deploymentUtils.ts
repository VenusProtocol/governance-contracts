import { ethers, getNamedAccounts } from "hardhat";

import bscMainnetGovernanceDeployments from "../../deployments/bscmainnet.json";
import bscTestnetGovernanceDeployments from "../../deployments/bsctestnet.json";
import { LZ_CHAINID, SUPPORTED_NETWORKS } from "./constants";

export const testnetNetworks = ["sepolia", "opbnbtestnet", "arbitrumsepolia", "hardhat"];
const mainnetNetworks = ["ethereum", "opbnbmainnet", "arbitrumone", "hardhat"];

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
    return "0xC46796a21a3A9FAB6546aF3434F2eBfFd0604207"; // OPBNBMAINNET MULTISIG
  } else if (network === "arbitrumsepolia") {
    return "0x1426A5Ae009c4443188DA8793751024E358A61C2"; // ARBITRUM SEPOLIA MULTISIG
  } else if (network === "arbitrumone") {
    return "0x14e0E151b33f9802b3e75b621c1457afc44DcAA0"; // ARBITRUM ONE MULTISIG
  } else if (network === "opsepolia") {
    return "0xd57365EE4E850e881229e2F8Aa405822f289e78d"; // OPSEPOLIA MULTISIG
  }

  const normalTimelock = await ethers.getContract("NormalTimelock");
  return normalTimelock.address;
};

export const guardian = async (network: SUPPORTED_NETWORKS): Promise<string> => {
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
    return "0xC46796a21a3A9FAB6546aF3434F2eBfFd0604207"; // OPBNBMAINNET MULTISIG
  } else if (network === "arbitrumsepolia") {
    return "0x1426A5Ae009c4443188DA8793751024E358A61C2"; //ARBITRUM SEPOLIA MULTISIG
  } else if (network === "arbitrumone") {
    return "0x14e0E151b33f9802b3e75b621c1457afc44DcAA0"; //ARBITRUM ONE MULTISIG
  } else if (network === "opsepolia") {
    return "0xd57365EE4E850e881229e2F8Aa405822f289e78d"; // OPSEPOLIA MULTISIG
  }

  return deployer;
};

export const getOmnichainProposalSender = async (network: SUPPORTED_NETWORKS) => {
  if (network === "hardhat") {
    const omnichainProposalSenderAddress = (await ethers.getContract("OmnichainProposalSender")).address;
    return omnichainProposalSenderAddress;
  } else if (testnetNetworks.includes(network as string)) {
    return bscTestnetGovernanceDeployments.contracts.OmnichainProposalSender.address;
  } else if (mainnetNetworks.includes(network as string)) {
    return bscMainnetGovernanceDeployments.contracts.OmnichainProposalSender.address;
  }
  return "0x0000000000000000000000000000000000000001";
};

export const getSourceChainId = async (network: SUPPORTED_NETWORKS) => {
  if (testnetNetworks.includes(network as string)) {
    return LZ_CHAINID.bsctestnet;
  } else if (mainnetNetworks.includes(network as string)) {
    return LZ_CHAINID.bscmainnet;
  }
  return 1;
};

// eslint-disable-next-line @typescript-eslint/no-empty-function
export default () => {};
