import { ethers } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

type DelayTypes = {
  normal: number;
  fast: number;
  critical: number;
};
export type DelayConfig = {
  hardhat: DelayTypes;
  bscmainnet: DelayTypes;
  bsctestnet: DelayTypes;
};

export const delayConfig: DelayConfig = {
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
};
const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const networkName = (hre.network.name as "hardhat") || "bsctestnet" || "bscmainnet";
  const live = hre.network.live;

  const getAdmin = async () => {
    return live ? (await ethers.getContract("GovernorBravoDelegator")).address : deployer;
  };

  await deploy("NormalTimelock", {
    contract: live ? "Timelock" : "TestTimelockV8",
    from: deployer,
    args: [await getAdmin(), delayConfig[networkName].normal],
    log: true,
    autoMine: true,
  });

  await deploy("FastTrackTimelock", {
    contract: live ? "Timelock" : "TestTimelockV8",
    from: deployer,
    args: [await getAdmin(), delayConfig[networkName].fast],
    log: true,
    autoMine: true,
  });

  await deploy("CriticalTimelock", {
    contract: live ? "Timelock" : "TestTimelockV8",
    from: deployer,
    args: [await getAdmin(), delayConfig[networkName].critical],
    log: true,
    autoMine: true,
  });
};

func.tags = ["LocalTimelock"];

func.skip = async (hre: HardhatRuntimeEnvironment) =>
  !(hre.network.name === "bsctestnet" || hre.network.name === "bscmainnet") && hre.network.name !== "hardhat";

export default func;
