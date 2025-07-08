import xvsDeployment from "@venusprotocol/venus-protocol/dist/deploy/007-deploy-xvs";
import xvsVaultDeployment from "@venusprotocol/venus-protocol/dist/deploy/008-deploy-vaults";
import { parseUnits } from "ethers/lib/utils";
import { ethers } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { onlyHardhat } from "../helpers/deploy/deploymentUtils";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  await xvsDeployment(hre);
  await xvsVaultDeployment(hre);
  const normalTimelock = await ethers.getContract("NormalTimelock");
  const xvsVault = await ethers.getContract("XVSVaultProxy");
  const acm = await hre.ethers.getContract("AccessControlManager");

  const MIN_PROPOSAL_THRESHOLD = parseUnits("150000", 18);

  const MIN_VOTING_PERIOD = 20 * 60 * 3 + 1;
  const MAX_VOTING_PERIOD = 400;
  const MIN_VOTING_DELAY = 1;
  const MAX_VOTING_DELAY = 403200;

  const NT_VOTING_PERIOD = 300;
  const NT_VOTING_DELAY = 300;
  const NT_PROPOSAL_THRESHOLD = parseUnits("150000", 18);

  const FT_VOTING_PERIOD = 200;
  const FT_VOTING_DELAY = 200;
  const FT_PROPOSAL_THRESHOLD = parseUnits("200000", 18);

  const CT_VOTING_PERIOD = 100;
  const CT_VOTING_DELAY = 100;
  const CT_PROPOSAL_THRESHOLD = parseUnits("250000", 18);
  const PROPOSAL_CONFIGS = [
    [NT_VOTING_DELAY, NT_VOTING_PERIOD, NT_PROPOSAL_THRESHOLD],
    [FT_VOTING_DELAY, FT_VOTING_PERIOD, FT_PROPOSAL_THRESHOLD],
    [CT_VOTING_DELAY, CT_VOTING_PERIOD, CT_PROPOSAL_THRESHOLD],
  ];

  const governorBravoDelegateV1Deployment = await deploy("GovernorBravoDelegateV1", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  await deploy("GovernorBravoDelegator", {
    from: deployer,
    args: [
      normalTimelock.address,
      xvsVault.address,
      deployer,
      governorBravoDelegateV1Deployment.address,
      MIN_VOTING_PERIOD.toString(),
      MIN_VOTING_DELAY.toString(),
      MIN_PROPOSAL_THRESHOLD.toString(),
      deployer,
    ],
    log: true,
    autoMine: true,
    skipIfAlreadyDeployed: true,
  });
  const GovernorBravoDelegator = await ethers.getContract("GovernorBravoDelegator");

  await deploy("GovernorBravoDelegateV4", {
    contract: "GovernorBravoDelegate",
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });
  const GovernorBravoDelegate = await ethers.getContract("GovernorBravoDelegateV4");

  console.log("deployer", deployer);
  let tx = await GovernorBravoDelegator._setImplementation(GovernorBravoDelegate.address);
  await tx.wait();

  const governorBravo = await ethers.getContractAt("GovernorBravoDelegate", GovernorBravoDelegator.address);

  tx = await governorBravo.setValidationParams([1, MAX_VOTING_PERIOD, MIN_VOTING_DELAY, MAX_VOTING_DELAY]);
  await tx.wait();

  tx = await governorBravo.setProposalConfigs(PROPOSAL_CONFIGS);
  await tx.wait();

  tx = await governorBravo.initAccessControlManager(acm.address);
  await tx.wait();
};

func.tags = ["bravo-delegator"];
func.skip = onlyHardhat();

export default func;
