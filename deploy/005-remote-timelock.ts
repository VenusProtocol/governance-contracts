import { ethers } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

export enum REMOTE_NETWORKS {
  ETHERUEM = "ethereum",
  OPBNBMAINNET = "opbnbmainnet",
  ARBITRUM_ONE = "arbitrumone",
  SEPOLIA = "sepolia",
  OPBNBTESTNET = "opbnbtestnet",
  ARBITRUM_SEPOLIA = "arbitrumsepolia",
  ZKSYNCSEPOLIA = "zksyncsepolia",
  ZKSYNCMAINNET = "zksyncmainnet",
  HARDHAT = "hardhat",
}
type DelayTypes = {
  normal: number;
  fast: number;
  critical: number;
};
export type DelayConfig = {
  [key in REMOTE_NETWORKS]: DelayTypes;
};

export const delayConfig: DelayConfig = {
  hardhat: {
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
  opbnbmainnet: {
    normal: 172800,
    fast: 21600,
    critical: 3600,
  },
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
  zksyncsepolia: {
    normal: 600,
    fast: 300,
    critical: 100,
  },
  zksyncmainnet: {
    normal: 172800,
    fast: 21600,
    critical: 3600,
  },
};
const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const networkName = hre.network.name as REMOTE_NETWORKS;
  const live = hre.network.live;

  const omnichainGovernanceExecutorAddress = (await ethers.getContract("OmnichainGovernanceExecutor")).address;

  await deploy(live ? "NormalTimelock" : "NormalTimelockRemote", {
    contract: live ? "TimelockV8" : "TestTimelockV8",
    from: deployer,
    args: [omnichainGovernanceExecutorAddress, delayConfig[networkName].normal],
    log: true,
    autoMine: true,
  });

  await deploy(live ? "FastTrackTimelock" : "FastTrackTimelockRemote", {
    contract: live ? "TimelockV8" : "TestTimelockV8",
    from: deployer,
    args: [omnichainGovernanceExecutorAddress, delayConfig[networkName].fast],
    log: true,
    autoMine: true,
  });

  await deploy(live ? "CriticalTimelock" : "CriticalTimelockRemote", {
    contract: live ? "TimelockV8" : "TestTimelockV8",
    from: deployer,
    args: [omnichainGovernanceExecutorAddress, delayConfig[networkName].critical],
    log: true,
    autoMine: true,
  });
};

func.tags = ["RemoteTimelock", "Remote"];
func.skip = async (hre: HardhatRuntimeEnvironment) =>
  hre.network.name === "bsctestnet" || hre.network.name === "bscmainnet";

export default func;
