import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { SUPPORTED_NETWORKS } from "../helpers/deploy/constants";
import { getRiskOracle } from "../helpers/deploy/deploymentUtils";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const networkName = hre.network.name as SUPPORTED_NETWORKS;

  const accessControlManager = await hre.ethers.getContract("AccessControlManager");
  const corePoolComptroller = (await hre.ethers.getContractOrNull("Unitroller")) || {
    address: "0x0000000000000000000000000000000000000001",
  };

  // Explicitly mentioning Default Proxy Admin contract path to fetch it from hardhat-deploy instead of OpenZeppelin
  // as zksync doesnot compile OpenZeppelin contracts using zksolc. It is backward compatible for all networks as well.
  const defaultProxyAdmin = await hre.artifacts.readArtifact(
    "hardhat-deploy/solc_0.8/openzeppelin/proxy/transparent/ProxyAdmin.sol:ProxyAdmin",
  );

  const normalTimelockAddress = (await hre.ethers.getContract("NormalTimelock")).address;
  await deploy("RiskStewardReceiver", {
    from: deployer,
    log: true,
    args: [await getRiskOracle(networkName)],
    proxy: {
      owner: networkName === "hardhat" ? deployer : normalTimelockAddress,
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

  const riskStewardReceiver = await hre.ethers.getContract("RiskStewardReceiver");

  if ((await riskStewardReceiver.owner()) === deployer) {
    await riskStewardReceiver.transferOwnership(normalTimelockAddress);
  }

  await deploy("MarketCapsRiskSteward", {
    from: deployer,
    log: true,
    args: [corePoolComptroller.address, riskStewardReceiver.address],
    proxy: {
      owner: networkName === "hardhat" ? deployer : normalTimelockAddress,
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

  const marketCapsRiskSteward = await hre.ethers.getContract("MarketCapsRiskSteward");
  if ((await marketCapsRiskSteward.owner()) === deployer) {
    await marketCapsRiskSteward.transferOwnership(normalTimelockAddress);
  }
};

func.tags = ["risk-stewards"];

export default func;
