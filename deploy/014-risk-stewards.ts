import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { LZ_CHAINID, SUPPORTED_NETWORKS } from "../helpers/deploy/constants";
import { getRiskOracle, getAcmAdminAccount, skipRemoteNetworks } from "../helpers/deploy/deploymentUtils";

const marketCapsRiskStewardNetworkConfigs = {
  hardhat: {
    maxDeltaBps: 5000,
    debouncePeriod: 5,
  },
  bsctestnet: {
    maxDeltaBps: 5000,
    debouncePeriod: 5,
  },
  bscmainnet: {
    maxDeltaBps: 5000,
    debouncePeriod: 5,
  },
};

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const networkName = hre.network.name as "bsctestnet" | "bscmainnet" | "hardhat";

  const marketCapsRiskStewardConfig = marketCapsRiskStewardNetworkConfigs[networkName];

  const accessControlManager = await hre.ethers.getContract("AccessControlManager");

  const governorBravo = await hre.ethers.getContract("GovernorBravoDelegator");
  const omnichainProposalSender = await hre.ethers.getContract("OmnichainProposalSender");
  const layerZeroChainId = LZ_CHAINID[networkName];
  // Explicitly mentioning Default Proxy Admin contract path to fetch it from hardhat-deploy instead of OpenZeppelin
  // as zksync doesnot compile OpenZeppelin contracts using zksolc. It is backward compatible for all networks as well.
  const defaultProxyAdmin = await hre.artifacts.readArtifact(
    "hardhat-deploy/solc_0.8/openzeppelin/proxy/transparent/ProxyAdmin.sol:ProxyAdmin",
  );

  await deploy("RiskStewardReceiver", {
    from: deployer,
    log: true,
    deterministicDeployment: false,
    args: [await getRiskOracle(networkName), governorBravo.address, omnichainProposalSender.address, layerZeroChainId],
    proxy: {
      owner: networkName === "hardhat" ? deployer : await getAcmAdminAccount(networkName as SUPPORTED_NETWORKS),
      proxyContract: "OptimizedTransparentUpgradeableProxy",
      execute: {
        methodName: "initialize",
        args: [accessControlManager.address],
      },
      viaAdminContract: {
        name: "DefaultProxyAdmin",
        artifact: defaultProxyAdmin,
      },
      upgradeIndex: 0,
    },
  });

  const riskStewardReceiver = await hre.ethers.getContract("RiskStewardReceiver");

  await deploy("MarketCapsRiskSteward", {
    from: deployer,
    log: true,
    deterministicDeployment: false,
    args: [riskStewardReceiver.address, layerZeroChainId],
    proxy: {
      owner: networkName === "hardhat" ? deployer : await getAcmAdminAccount(networkName as SUPPORTED_NETWORKS),
      proxyContract: "OptimizedTransparentUpgradeableProxy",
      execute: {
        methodName: "initialize",
        args: [
          accessControlManager.address,
          marketCapsRiskStewardConfig.maxDeltaBps,
          marketCapsRiskStewardConfig.debouncePeriod,
        ],
      },
      viaAdminContract: {
        name: "DefaultProxyAdmin",
        artifact: defaultProxyAdmin,
      },
      upgradeIndex: 0,
    },
  });
};

func.tags = ["risk-stewards"];

func.skip = skipRemoteNetworks();

export default func;
