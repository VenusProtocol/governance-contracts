import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { SUPPORTED_NETWORKS } from "../helpers/deploy/constants";
import { getLzV2Endpoint, guardian } from "../helpers/deploy/deploymentUtils";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const networkName = hre.network.name as SUPPORTED_NETWORKS;

  const accessControlManager = await hre.ethers.getContract("AccessControlManager");
  const corePoolComptroller = (await hre.ethers.getContract("Unitroller"))?.address;

  const maxDeltaBps = 5000; // 50%
  const debouncePeriod = 2 * 24 * 60 * 60 + 1; // 2 days + 1 seconds

  // Explicitly mentioning Default Proxy Admin contract path to fetch it from hardhat-deploy instead of OpenZeppelin
  // as zksync doesnot compile OpenZeppelin contracts using zksolc. It is backward compatible for all networks as well.
  const defaultProxyAdmin = await hre.artifacts.readArtifact(
    "hardhat-deploy/solc_0.8/openzeppelin/proxy/transparent/ProxyAdmin.sol:ProxyAdmin",
  );

  const normalTimelockAddress = (await hre.ethers.getContract("NormalTimelock")).address;
  await deploy("RiskStewardDestinationReceiver", {
    from: deployer,
    log: true,
    args: [
      await getLzV2Endpoint(networkName as SUPPORTED_NETWORKS),
      normalTimelockAddress,
      await guardian(networkName as SUPPORTED_NETWORKS),
    ],
    skipIfAlreadyDeployed: true,
  });

  const riskStewardDestinationReceiver = await hre.ethers.getContract("RiskStewardDestinationReceiver");

  await deploy("MarketCapsRiskSteward", {
    from: deployer,
    log: true,
    args: [riskStewardDestinationReceiver.address, corePoolComptroller],
    proxy: {
      owner: networkName === "hardhat" ? deployer : normalTimelockAddress,
      proxyContract: "OptimizedTransparentUpgradeableProxy",
      execute: {
        methodName: "initialize",
        args: [accessControlManager.address, maxDeltaBps, debouncePeriod],
      },
      viaAdminContract: {
        name: "DefaultProxyAdmin",
        artifact: defaultProxyAdmin,
      },
    },
    skipIfAlreadyDeployed: true,
  });

  await deploy("CriticalParamsRiskSteward", {
    from: deployer,
    log: true,
    args: [riskStewardDestinationReceiver.address, corePoolComptroller],
    proxy: {
      owner: networkName === "hardhat" ? deployer : normalTimelockAddress,
      proxyContract: "OptimizedTransparentUpgradeableProxy",
      execute: {
        methodName: "initialize",
        args: [accessControlManager.address, maxDeltaBps, debouncePeriod],
      },
      viaAdminContract: {
        name: "DefaultProxyAdmin",
        artifact: defaultProxyAdmin,
      },
    },
    skipIfAlreadyDeployed: true,
  });

  const marketCapsRiskSteward = await hre.ethers.getContract("MarketCapsRiskSteward");
  if ((await marketCapsRiskSteward.owner()) === deployer) {
    await marketCapsRiskSteward.transferOwnership(normalTimelockAddress);
  }

  const criticalParamsRiskSteward = await hre.ethers.getContract("CriticalParamsRiskSteward");
  if ((await criticalParamsRiskSteward.owner()) === deployer) {
    await criticalParamsRiskSteward.transferOwnership(normalTimelockAddress);
  }
};

func.tags = ["risk-stewards-dest"];
func.skip = async (hre: HardhatRuntimeEnvironment) =>
  hre.network.name === "bsctestnet" || hre.network.name === "bscmainnet";

export default func;
