import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { SUPPORTED_NETWORKS } from "../helpers/deploy/constants";
import { getLzV2Endpoint, getRiskOracle, guardian } from "../helpers/deploy/deploymentUtils";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, ethers, network, artifacts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const networkName = network.name as SUPPORTED_NETWORKS;

  const isBSCNetwork = ["bscmainnet", "bsctestnet", "hardhat"].includes(networkName);
  const receiverType = isBSCNetwork ? "source" : "destination";

  const accessControlManager = await ethers.getContract("AccessControlManager");
  const corePoolComptroller = (await ethers.getContract("Unitroller")).address;

  const maxDeltaBps = 5000; // 50%
  const debouncePeriod = 2 * 24 * 60 * 60 + 1; // 2 days + 1 sec

  const defaultProxyAdmin = await artifacts.readArtifact(
    "hardhat-deploy/solc_0.8/openzeppelin/proxy/transparent/ProxyAdmin.sol:ProxyAdmin",
  );

  const normalTimelockAddress = (await ethers.getContract("NormalTimelock")).address;

  let receiverAddress: string;

  if (receiverType === "source") {
    const governorBravo = (await ethers.getContract("GovernorBravoDelegator")).address;
    const omnichainProposalSender = (await ethers.getContract("OmnichainProposalSender")).address;

    await deploy("RiskStewardReceiver", {
      from: deployer,
      log: true,
      args: [
        await getRiskOracle(networkName),
        network.config.chainId ?? (networkName === "bscmainnet" ? 30102 : 40102),
        await getLzV2Endpoint(networkName),
        normalTimelockAddress,
        governorBravo,
        omnichainProposalSender,
      ],
      skipIfAlreadyDeployed: true,
    });

    receiverAddress = (await ethers.getContract("RiskStewardReceiver")).address;
  } else {
    await deploy("RiskStewardDestinationReceiver", {
      from: deployer,
      log: true,
      args: [await getLzV2Endpoint(networkName), normalTimelockAddress, await guardian(networkName)],
      skipIfAlreadyDeployed: true,
    });

    receiverAddress = (await ethers.getContract("RiskStewardDestinationReceiver")).address;
  }

  const stewardConfigs = [
    { name: "MarketCapsRiskSteward" },
    { name: "CollateralFactorRiskSteward" },
    { name: "ReserveFactorRiskSteward" },
  ];

  for (const { name } of stewardConfigs) {
    await deploy(name, {
      from: deployer,
      log: true,
      args: [receiverAddress, corePoolComptroller],
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

    const steward = await ethers.getContract(name);
    if ((await steward.owner()) === deployer) {
      const tx = await steward.transferOwnership(normalTimelockAddress);
      await tx.wait();
    }
  }
};

func.tags = ["risk-steward-receivers"];

export default func;
