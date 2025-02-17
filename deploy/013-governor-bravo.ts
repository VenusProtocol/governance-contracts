import xvsDeployment from '@venusprotocol/venus-protocol/dist/deploy/007-deploy-xvs';
import xvsVaultDeployment from '@venusprotocol/venus-protocol/dist/deploy/008-deploy-vaults';
import { ethers } from 'hardhat';
import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { onlyHardhat } from '../helpers/deploy/deploymentUtils';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  await xvsDeployment(hre);
  await xvsVaultDeployment(hre);
  const timelock = await ethers.getContract('NormalTimelock');
  const xvsVault = await ethers.getContract('XVSVaultProxy');

  const governorBravoDelegateV1Deployment = await deploy('GovernorBravoDelegateV1', {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  await deploy('GovernorBravoDelegateV2', {
    contract: 'GovernorBravoDelegate',
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  const governorBravoDelegate = await ethers.getContract('GovernorBravoDelegateV2');

  const minVotingDelay = await governorBravoDelegate.MIN_VOTING_DELAY();
  const minVotingPeriod = await governorBravoDelegate.MIN_VOTING_PERIOD();
  const minProposalThreshold = await governorBravoDelegate.MIN_PROPOSAL_THRESHOLD();

  await deploy('GovernorBravoDelegator', {
    from: deployer,
    args: [
      timelock.address,
      xvsVault.address,
      deployer,
      governorBravoDelegateV1Deployment.address,
      minVotingPeriod.toString(),
      minVotingDelay.toString(),
      minProposalThreshold.toString(),
      deployer,
    ],
    log: true,
    autoMine: true,
  });
};

func.tags = ['Governance'];
func.skip = onlyHardhat();

export default func;
