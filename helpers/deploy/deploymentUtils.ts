import { ethers, getNamedAccounts } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import bscMainnetGovernanceDeployments from "../../deployments/bscmainnet.json";
import bscTestnetGovernanceDeployments from "../../deployments/bsctestnet.json";
import { LZ_CHAINID, SUPPORTED_NETWORKS } from "./constants";

export const testnetNetworks = ["sepolia", "opbnbtestnet", "arbitrumsepolia", "zksyncsepolia", "hardhat"];
const mainnetNetworks = ["ethereum", "opbnbmainnet", "arbitrumone", "zksyncmainnet", "hardhat"];

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
  } else if (network === "zksyncsepolia") {
    return "0xa2f83de95E9F28eD443132C331B6a9C9B7a9F866"; // ZKSYNC SEPOLIA MULTISIG
  } else if (network === "zksyncmainnet") {
    return "0x751Aa759cfBB6CE71A43b48e40e1cCcFC66Ba4aa"; // ZKSYNC MAINNET MULTISIG
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
    return "0x1426A5Ae009c4443188DA8793751024E358A61C2"; // ARBITRUM SEPOLIA MULTISIG
  } else if (network === "arbitrumone") {
    return "0x14e0E151b33f9802b3e75b621c1457afc44DcAA0"; // ARBITRUM ONE MULTISIG
  } else if (network === "zksyncsepolia") {
    return "0xa2f83de95E9F28eD443132C331B6a9C9B7a9F866"; // ZKSYNC SEPOLIA MULTISIG
  } else if (network === "zksyncmainnet") {
    return "0x751Aa759cfBB6CE71A43b48e40e1cCcFC66Ba4aa"; // ZKSYNC MAINNET MULTISIG
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

export const getLzEndpoint = async (networkName: SUPPORTED_NETWORKS): Promise<string> => {
  const lzEndpointMock = await ethers.getContractOrNull("LZEndpointMock");
  return {
    ethereum: "0x66A71Dcef29A0fFBDBE3c6a460a3B5BC225Cd675",
    bscmainnet: "0x3c2269811836af69497E5F486A85D7316753cf62",
    opbnbmainnet: "0xb6319cC6c8c27A8F5dAF0dD3DF91EA35C4720dd7",
    arbitrumone: "0x3c2269811836af69497E5F486A85D7316753cf62",
    sepolia: "0xae92d5aD7583AD66E49A0c67BAd18F6ba52dDDc1",
    bsctestnet: "0x6Fcb97553D41516Cb228ac03FdC8B9a0a9df04A1",
    opbnbtestnet: "0x83c73Da98cf733B03315aFa8758834b36a195b87",
    arbitrumsepolia: "0x6098e96a28E02f27B1e6BD381f870F1C8Bd169d3",
    zksyncsepolia: "0x99b6359ce8E0eBdC27eBeDb76FE28F29303E78fF",
    zksyncmainnet: "0x9b896c0e23220469C7AE69cb4BbAE391eAa4C8da",
    opmainnet: "0x3c2269811836af69497E5F486A85D7316753cf62",
    opsepolia: "0x55370E0fBB5f5b8dAeD978BA1c075a499eB107B8",
    hardhat: lzEndpointMock?.address || "",
  }[networkName];
};

export const getSourceChainId = async (network: SUPPORTED_NETWORKS) => {
  if (testnetNetworks.includes(network as string)) {
    return LZ_CHAINID.bsctestnet;
  } else if (mainnetNetworks.includes(network as string)) {
    return LZ_CHAINID.bscmainnet;
  }
  return 1;
};

export const onlyHardhat = () => async (hre: HardhatRuntimeEnvironment) => {
  return hre.network.name !== "hardhat";
};

// eslint-disable-next-line @typescript-eslint/no-empty-function
export default () => {};
