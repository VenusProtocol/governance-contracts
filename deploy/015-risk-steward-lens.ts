import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const riskStewardReceiver = await hre.ethers.getContract("RiskStewardReceiver");
  // Read from the steward so the lens tells core pool markets apart exactly the way the steward does.
  const collateralFactorsSteward = await hre.ethers.getContract("CollateralFactorsRiskSteward");
  const corePoolComptroller = await collateralFactorsSteward.CORE_POOL_COMPTROLLER();

  // Stateless and not upgradeable: a new version is simply redeployed.
  await deploy("RiskStewardLens", {
    from: deployer,
    log: true,
    args: [riskStewardReceiver.address, corePoolComptroller],
  });
};

func.tags = ["risk-steward-lens", "bsc"];
func.dependencies = ["risk-stewards"];

func.skip = async (hre: HardhatRuntimeEnvironment) =>
  !(hre.network.name === "bsctestnet" || hre.network.name === "bscmainnet" || hre.network.name === "hardhat");

export default func;
