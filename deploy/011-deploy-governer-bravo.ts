import { ethers } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  await deploy("GovernorBravoDelegate", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
    skipIfAlreadyDeployed: true,
  });

  const GovernorBravoDelegate = await ethers.getContract("GovernorBravoDelegate");

  const GovernorBravoDelegator = await ethers.getContract("GovernorBravoDelegator");
  if (GovernorBravoDelegator.admin() == deployer) {
    const tx = await GovernorBravoDelegator._setImplementation(GovernorBravoDelegate.address);
    await tx.wait();
  }
};

func.skip = async (hre: HardhatRuntimeEnvironment) =>
  !(hre.network.name === "bsctestnet" || hre.network.name === "bscmainnet");

func.tags = ["governor-bravo"];

export default func;
