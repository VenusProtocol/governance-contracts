import { ethers } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { acmAdminAccount } from "./helpers/deploymentUtils";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const acmDeployment = await deploy("AccessControlManager", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  const acm = await ethers.getContractAt("AccessControlManager", acmDeployment.address);

  const networkName: string = hre.network.name;
  const adminAccount: string = acmAdminAccount[networkName];

  console.log(`Granting DEDAULT_ADMIN_ROLE to ${adminAccount} for ${networkName} network`);
  await acm.grantRole(acm.DEFAULT_ADMIN_ROLE(), acmAdminAccount[hre.network.name]);

  console.log(`Renouncing DEDAULT_ADMIN_ROLE from deployer (${deployer}) for ${networkName} network`);
  await acm.renounceRole(acm.DEFAULT_ADMIN_ROLE(), deployer);
};

func.tags = ["AccessControl"];

export default func;
