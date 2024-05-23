import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { LZ_ENDPOINTS, SUPPORTED_NETWORKS } from "../helpers/deploy/constants";
import { getSourceChainId, guardian } from "../helpers/deploy/deploymentUtils";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const networkName = hre.network.name as SUPPORTED_NETWORKS;

  await deploy("OmnichainGovernanceExecutor", {
    from: deployer,
    args: [LZ_ENDPOINTS[networkName], await guardian(networkName), await getSourceChainId(networkName)],
    log: true,
    autoMine: true,
  });
};
func.tags = ["OmnichainGovernanceExecutor", "Remote"];

func.skip = async (hre: HardhatRuntimeEnvironment) =>
  hre.network.name === "bsctestnet" || hre.network.name === "bscmainnet";
export default func;
