import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { SUPPORTED_NETWORKS } from "../helpers/deploy/constants";
import { getRiskOracle, guardian, skipRemoteNetworks } from "../helpers/deploy/deploymentUtils";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const networkName = hre.network.name as "bsctestnet" | "bscmainnet" | "hardhat";

  const accessControlManager = await hre.ethers.getContract("AccessControlManager");
  const corePoolComptroller = await hre.ethers.getContract("Unitroller");

  // Explicitly mentioning Default Proxy Admin contract path to fetch it from hardhat-deploy instead of OpenZeppelin
  // as zksync doesnot compile OpenZeppelin contracts using zksolc. It is backward compatible for all networks as well.
  const defaultProxyAdmin = await hre.artifacts.readArtifact(
    "hardhat-deploy/solc_0.8/openzeppelin/proxy/transparent/ProxyAdmin.sol:ProxyAdmin",
  );

  await deploy("RiskStewardReceiver", {
    from: deployer,
    log: true,
    deterministicDeployment: false,
    args: [await getRiskOracle(networkName)],
    proxy: {
      owner: networkName === "hardhat" ? deployer : await guardian(networkName as SUPPORTED_NETWORKS),
      proxyContract: "OptimizedTransparentUpgradeableProxy",
      execute: {
        methodName: "initialize",
        args: [accessControlManager.address],
      },
      viaAdminContract: {
        name: "DefaultProxyAdmin",
        artifact: defaultProxyAdmin,
      },
    },
  });

  await deploy("MarketCapsRiskSteward", {
    from: deployer,
    log: true,
    deterministicDeployment: false,
    args: [corePoolComptroller.address],
    proxy: {
      owner: networkName === "hardhat" ? deployer : await guardian(networkName as SUPPORTED_NETWORKS),
      proxyContract: "OptimizedTransparentUpgradeableProxy",
      execute: {
        methodName: "initialize",
        args: [accessControlManager.address, 5000],
      },
      viaAdminContract: {
        name: "DefaultProxyAdmin",
        artifact: defaultProxyAdmin,
      },
    },
  });
};

func.tags = ["risk-stewards"];

func.skip = skipRemoteNetworks();

export default func;
