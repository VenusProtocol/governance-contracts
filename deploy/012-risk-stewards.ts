import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { LZ_V2_EID, SUPPORTED_NETWORKS } from "../helpers/deploy/constants";
import { getLzV2Endpoint } from "../helpers/deploy/deploymentUtils";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const networkName = hre.network.name as SUPPORTED_NETWORKS;
  const normalTimelockAddress = (await hre.ethers.getContract("NormalTimelock")).address;
  const accessControlManager = await hre.ethers.getContract("AccessControlManager");
  const corePoolComptroller = (await hre.ethers.getContractOrNull("Unitroller")) || {
    address: "0x0000000000000000000000000000000000000001",
  };

  // Explicitly mentioning Default Proxy Admin contract path to fetch it from hardhat-deploy instead of OpenZeppelin
  // as zksync doesnot compile OpenZeppelin contracts using zksolc. It is backward compatible for all networks as well.
  const defaultProxyAdmin = await hre.artifacts.readArtifact(
    "hardhat-deploy/solc_0.8/openzeppelin/proxy/transparent/ProxyAdmin.sol:ProxyAdmin",
  );

  // Deploy RiskOracle
  await deploy("RiskOracle", {
    from: deployer,
    log: true,
    args: [],
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
    skipIfAlreadyDeployed: true,
  });

  const riskOracle = await hre.ethers.getContract("RiskOracle");

  if ((await riskOracle.owner()) === deployer) {
    await riskOracle.transferOwnership(normalTimelockAddress);
  }

  // Deploy RiskStewardReceiver
  const lzEndpoint = await getLzV2Endpoint(networkName);
  const sourceChainId = LZ_V2_EID[networkName];

  await deploy("RiskStewardReceiver", {
    from: deployer,
    log: true,
    args: [riskOracle.address, lzEndpoint, sourceChainId],
    proxy: {
      owner: networkName === "hardhat" ? deployer : normalTimelockAddress,
      proxyContract: "OptimizedTransparentUpgradeableProxy",
      execute: {
        methodName: "initialize",
        args: [accessControlManager.address, normalTimelockAddress],
      },
      viaAdminContract: {
        name: "DefaultProxyAdmin",
        artifact: defaultProxyAdmin,
      },
    },
    skipIfAlreadyDeployed: true,
  });

  const riskStewardReceiver = await hre.ethers.getContract("RiskStewardReceiver");
  if ((await riskStewardReceiver.owner()) === deployer) {
    await riskStewardReceiver.transferOwnership(normalTimelockAddress);
  }

  // Deploy MarketCapsRiskSteward
  await deploy("MarketCapsRiskSteward", {
    from: deployer,
    log: true,
    args: [riskStewardReceiver.address],
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
    skipIfAlreadyDeployed: true,
  });

  const marketCapsSteward = await hre.ethers.getContract("MarketCapsRiskSteward");
  if ((await marketCapsSteward.owner()) === deployer) {
    await marketCapsSteward.transferOwnership(normalTimelockAddress);
  }

  // Deploy CollateralFactorsRiskSteward
  await deploy("CollateralFactorsRiskSteward", {
    from: deployer,
    log: true,
    args: [corePoolComptroller.address, riskStewardReceiver.address],
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
    skipIfAlreadyDeployed: true,
  });

  const collateralFactorsSteward = await hre.ethers.getContract("CollateralFactorsRiskSteward");
  if ((await collateralFactorsSteward.owner()) === deployer) {
    await collateralFactorsSteward.transferOwnership(normalTimelockAddress);
  }

  // Deploy IRMRiskSteward
  await deploy("IRMRiskSteward", {
    from: deployer,
    log: true,
    args: [corePoolComptroller.address, riskStewardReceiver.address],
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
    skipIfAlreadyDeployed: true,
  });

  const irmRiskSteward = await hre.ethers.getContract("IRMRiskSteward");
  if ((await irmRiskSteward.owner()) === deployer) {
    await irmRiskSteward.transferOwnership(normalTimelockAddress);
  }
};

func.tags = ["risk-stewards", "bsc"];

func.skip = async (hre: HardhatRuntimeEnvironment) =>
  !(hre.network.name === "bsctestnet" || hre.network.name === "bscmainnet" || hre.network.name == "hardhat");

export default func;
