import { ethers } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const SUPPORTED_NETWORKS = [
  "bscmainnet",
  "ethereum",
  "sepolia",
  "arbitrumone",
  "arbitrumsepolia",
  "basemainnet",
  "basesepolia",
  "zksyncmainnet",
  "zksyncsepolia",
];

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const acm = await ethers.getContract("AccessControlManager");
  const normalTimelockAddress = (await ethers.getContract("NormalTimelock")).address;
  const proxyOwnerAddress = hre.network.name === "hardhat" ? deployer : normalTimelockAddress;

  const defaultProxyAdmin = await hre.artifacts.readArtifact(
    "hardhat-deploy/solc_0.8/openzeppelin/proxy/transparent/ProxyAdmin.sol:ProxyAdmin",
  );

  await deploy("AuxiliaryCommandsAggregator", {
    contract: "AuxiliaryCommandsAggregator",
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
    proxy: {
      owner: proxyOwnerAddress,
      proxyContract: "OptimizedTransparentUpgradeableProxy",
      execute: {
        methodName: "initialize",
        args: [acm.address],
      },
      viaAdminContract: {
        name: "DefaultProxyAdmin",
        artifact: defaultProxyAdmin,
      },
    },
    skipIfAlreadyDeployed: true,
  });

  const aggregator = await ethers.getContract("AuxiliaryCommandsAggregator");
  if ((await aggregator.owner()) === deployer) {
    const tx = await aggregator.transferOwnership(normalTimelockAddress);
    await tx.wait();
    console.log(`AuxiliaryCommandsAggregator ownership transfer to ${normalTimelockAddress} initiated`);
  }
};

func.tags = ["AuxiliaryCommandsAggregator"];

func.skip = async (hre: HardhatRuntimeEnvironment) => !SUPPORTED_NETWORKS.includes(hre.network.name);

export default func;
