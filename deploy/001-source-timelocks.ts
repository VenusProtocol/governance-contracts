import { ethers } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { SUPPORTED_NETWORKS } from "../helpers/deploy/constants";
import { DelayConfig, delayConfig } from "../helpers/deploy/deploymentConfig";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const networkName = hre.network.name as SUPPORTED_NETWORKS;
  const live = hre.network.live;

  const getAdmin = async () => {
    return live ? (await ethers.getContract("GovernorBravoDelegator")).address : deployer;
  };

  await deploy("NormalTimelock", {
    contract: "Timelock",
    from: deployer,
    args: [await getAdmin(), (delayConfig as DelayConfig)[networkName].normal],
    log: true,
    autoMine: true,
  });

  await deploy("FastTrackTimelock", {
    contract: "Timelock",
    from: deployer,
    args: [await getAdmin(), (delayConfig as DelayConfig)[networkName].fast],
    log: true,
    autoMine: true,
  });

  await deploy("CriticalTimelock", {
    contract: "Timelock",
    from: deployer,
    args: [await getAdmin(), (delayConfig as DelayConfig)[networkName].critical],
    log: true,
    autoMine: true,
  });
};

func.tags = ["LocalTimelock"];

func.skip = async (hre: HardhatRuntimeEnvironment) =>
  !(hre.network.name === "bsctestnet" || hre.network.name === "bscmainnet") && hre.network.name !== "hardhat";

export default func;
