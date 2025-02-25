import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { onlyHardhat } from "../helpers/deploy/deploymentUtils";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  await deploy("LZEndpointMock", {
    from: deployer,
    args: [10102],
    log: true,
    autoMine: true,
  });
};

func.tags = ["mocks"];

func.skip = onlyHardhat();

export default func;
