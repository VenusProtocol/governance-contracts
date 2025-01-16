import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { onlyHardhat } from "../helpers/deploy/deploymentUtils";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  await deploy("MockRiskOracle", {
    from: deployer,
    args: ["Mock Risk Oracle", [deployer], ["MarketSupplyCaps", "MarketBorrowCaps"]],
    log: true,
    autoMine: true,
  });

  // Assume that this script runs after the protocol has been deployed we'll check if we can find the Unitroller.
  // If not we'll deploy a mock under that name for testing purposes.
  const corePoolComptroller = await hre.ethers.getContractOrNull("Unitroller");
  if (!corePoolComptroller) {
    await deploy("Unitroller", {
      contract: "MockCoreComptroller",
      from: deployer,
      args: [],
      log: true,
      autoMine: true,
    });
  }
};

func.tags = ["mocks"];

func.skip = onlyHardhat();

export default func;
