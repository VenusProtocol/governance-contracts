import { ethers } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { SUPPORTED_NETWORKS } from "./helpers/constants";
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

  if (hre.network.live) {
    const networkName = hre.network.name as SUPPORTED_NETWORKS;
    const adminAccount = acmAdminAccount[networkName];
    console.log(`Granting DEFAULT_ADMIN_ROLE to ${adminAccount} for ${networkName} network`);
    await acm.grantRole(acm.DEFAULT_ADMIN_ROLE(), acmAdminAccount[networkName]);

    console.log(`Renouncing DEFAULT_ADMIN_ROLE from deployer (${deployer}) for ${hre.network.name} network`);
    await acm.renounceRole(acm.DEFAULT_ADMIN_ROLE(), deployer);
  } else {
    const timelockAddress = (await deployments.get("Timelock")).address;
    const timelock = await ethers.getContractAt("Timelock", timelockAddress);
    await acm.grantRole(acm.DEFAULT_ADMIN_ROLE(), timelock.address);
  }
};

func.tags = ["AccessControl"];

export default func;
