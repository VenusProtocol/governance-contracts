import { ethers } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { SUPPORTED_NETWORKS } from "../helpers/deploy/constants";
import { getAcmAdminAccount } from "../helpers/deploy/deploymentUtils";

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
    const adminAccount = await getAcmAdminAccount(networkName);
    console.log(`Granting DEFAULT_ADMIN_ROLE to ${adminAccount} for ${networkName} network`);
    await acm.grantRole(acm.DEFAULT_ADMIN_ROLE(), adminAccount);

    console.log(`Renouncing DEFAULT_ADMIN_ROLE from deployer (${deployer}) for ${hre.network.name} network`);
    await acm.renounceRole(acm.DEFAULT_ADMIN_ROLE(), deployer);
  } else {
    const timelockAddress = (await ethers.getContract("NormalTimelock")).address;

    await acm.grantRole(acm.DEFAULT_ADMIN_ROLE(), timelockAddress);
  }
};

func.tags = ["AccessControl"];

export default func;
