import { ethers } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const acm = await ethers.getContract("AccessControlManager");

  await deploy("ACMCommandsAggregator", {
    contract: "ACMCommandsAggregator",
    from: deployer,
    args: [acm.address],
    log: true,
    autoMine: true,
  });
};

func.tags = ["ACMCommandsAggregator", "ACMCommandsAggregatorTest"];

export default func;
