import { ethers } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const SUPPORTED_NETWORKS = [
  "ethereum",
  "sepolia",
  "arbitrumone",
  "arbitrumsepolia",
  "basemainnet",
  "basesepolia",
  "zksyncmainnet",
  "zksyncsepolia",
];

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const acm = await ethers.getContract("AccessControlManager");

  await deploy("AuxiliaryCommandsAggregator", {
    contract: "AuxiliaryCommandsAggregator",
    from: deployer,
    args: [acm.address],
    log: true,
    autoMine: true,
    skipIfAlreadyDeployed: true,
  });
};

func.tags = ["AuxiliaryCommandsAggregator"];

func.skip = async (hre: HardhatRuntimeEnvironment) => !SUPPORTED_NETWORKS.includes(hre.network.name);

export default func;
