import { ethers } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { SUPPORTED_NETWORKS } from "../helpers/deploy/constants";
import { delayConfig } from "../helpers/deploy/deploymentConfig";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const networkName = hre.network.name as SUPPORTED_NETWORKS;
  const live = hre.network.live;

  const omnichainGovernanceExecutorAddress = (await ethers.getContract("OmnichainGovernanceExecutor")).address;

  await deploy("NormalTimelock", {
    contract: live ? "TimelockV8" : "TestTimelockV8",
    from: deployer,
    args: [omnichainGovernanceExecutorAddress, (delayConfig as any)[networkName].normal],
    log: true,
    autoMine: true,
  });

  await deploy("FastTrackTimelock", {
    contract: live ? "TimelockV8" : "TestTimelockV8",
    from: deployer,
    args: [omnichainGovernanceExecutorAddress, (delayConfig as any)[networkName].fast],
    log: true,
    autoMine: true,
  });

  await deploy("CriticalTimelock", {
    contract: live ? "TimelockV8" : "TestTimelockV8",
    from: deployer,
    args: [omnichainGovernanceExecutorAddress, (delayConfig as any)[networkName].critical],
    log: true,
    autoMine: true,
  });
};

func.tags = ["Timelock", "Remote"];
func.skip = async (hre: HardhatRuntimeEnvironment) =>
  hre.network.name === "bsctestnet" || hre.network.name === "bscmainnet" || hre.network.name === "hardhat";

export default func;
