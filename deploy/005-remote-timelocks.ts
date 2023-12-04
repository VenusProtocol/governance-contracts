import { ethers } from 'hardhat';
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { SUPPORTED_NETWORKS } from "../helpers/deploy/constants";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const networkName = hre.network.name as SUPPORTED_NETWORKS;

  const delayConfig = {
    hardhat: {
      normal: 600,
      fast: 300,
      critical: 100,
    },
    bscmainnet: {
      normal: 172800,
      fast: 21600,
      critical: 3600,
    },
    bsctestnet: {
      normal: 600,
      fast: 300,
      critical: 100,
    },
    sepolia: {
      normal: 600,
      fast: 300,
      critical: 100,
    },
    ethereum: {
      normal: 172800,
      fast: 21600,
      critical: 3600,
    },
  };
  const omnichainGovernanceExecutorAddress = (await ethers.getContract('OmnichainGovernanceExecutor')).address;

  await deploy("NormalTimelock", {
    contract: "Timelock",
    from: deployer,
    args: [omnichainGovernanceExecutorAddress, delayConfig[networkName].normal],
    log: true,
    autoMine: true,
  });

  await deploy("FastTrackTimelock", {
    contract: "Timelock",
    from: deployer,
    args: [omnichainGovernanceExecutorAddress, delayConfig[networkName].fast],
    log: true,
    autoMine: true,
  });

  await deploy("CriticalTimelock", {
    contract: "Timelock",
    from: deployer,
    args: [omnichainGovernanceExecutorAddress, delayConfig[networkName].critical],
    log: true,
    autoMine: true,
  });
};

func.tags = ["Timelock", "Remote"];

func.skip = async (hre: HardhatRuntimeEnvironment) =>
  !(hre.network.name === "sepolia" || hre.network.name === "ethereum") && hre.network.name !== "hardhat";
export default func;
