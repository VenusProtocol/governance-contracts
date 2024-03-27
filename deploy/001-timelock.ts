import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { SUPPORTED_NETWORKS } from "../helpers/deploy/constants";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const networkName = hre.network.name as SUPPORTED_NETWORKS;
  const live = hre.network.live;

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
    opbnbtestnet: {
      normal: 600,
      fast: 300,
      critical: 100,
    },
    opbnbmainnet: { normal: 172800, fast: 21600, critical: 3600 },
    arbitrumsepolia: {
      normal: 600,
      fast: 300,
      critical: 100,
    },
    arbitrumone: {
      normal: 172800,
      fast: 21600,
      critical: 3600,
    },
  };

  await deploy("NormalTimelock", {
    contract: live ? "TimelockV8" : "TestTimelockV8",
    from: deployer,
    args: [deployer, delayConfig[networkName].normal],
    log: true,
    autoMine: true,
  });

  await deploy("FastTrackTimelock", {
    contract: live ? "TimelockV8" : "TestTimelockV8",
    from: deployer,
    args: [deployer, delayConfig[networkName].fast],
    log: true,
    autoMine: true,
  });

  await deploy("CriticalTimelock", {
    contract: live ? "TimelockV8" : "TestTimelockV8",
    from: deployer,
    args: [deployer, delayConfig[networkName].critical],
    log: true,
    autoMine: true,
  });
};

func.tags = ["Timelock"];

export default func;
