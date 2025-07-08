import { BigNumberish } from "ethers";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { SUPPORTED_NETWORKS } from "../helpers/deploy/constants";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const networkName = hre.network.name as SUPPORTED_NETWORKS;

  const accessControlManager = await hre.ethers.getContract("AccessControlManager");

  // Explicitly mentioning Default Proxy Admin contract path to fetch it from hardhat-deploy instead of OpenZeppelin
  // as zksync doesnot compile OpenZeppelin contracts using zksolc. It is backward compatible for all networks as well.
  const defaultProxyAdmin = await hre.artifacts.readArtifact(
    "hardhat-deploy/solc_0.8/openzeppelin/proxy/transparent/ProxyAdmin.sol:ProxyAdmin",
  );

  const isBsc =
    hre.network.name === "bsctestnet" || hre.network.name === "bscmainnet" || hre.network.name === "hardhat";
  const normalTimelockAddress = (await hre.ethers.getContract("NormalTimelock")).address;
  const riskStewardReceiver = isBsc
    ? await hre.ethers.getContract("RiskStewardReceiver")
    : await hre.ethers.getContract("RiskStewardDestinationReceiver");

  await deploy("RiskStewardOwner", {
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

  const riskStewardOwner = await hre.ethers.getContract("RiskStewardOwner");

  if ((await riskStewardReceiver.owner()) === deployer) {
    await riskStewardReceiver.transferOwnership(riskStewardOwner.address);
  }

  const destOwnerFunctionRegistry = [
    "setRiskParameterConfig(string,address)",
    "toggleConfigActive(string)",
    "pause()",
    "unpause()",
    "setRemoteDelay(uint256)",
    "setGuardian(address)",
    "processUpdate(uint256,bytes,string,address,uint256)",
  ];

  const bscOwnerFunctionRegistry = [
    "setRiskParameterConfig(string,address)",
    "toggleConfigActive(string)",
    "setProposalType(uint8)",
    "pause()",
    "unpause()",
    "setDestChainIdMappings(uint32[],uint16[])",
  ];

  const ownerFunctionRegistry = isBsc ? bscOwnerFunctionRegistry : destOwnerFunctionRegistry;

  if ((await riskStewardOwner.owner()) === deployer) {
    const isAdded = new Array(ownerFunctionRegistry.length).fill(true);
    const tx = await riskStewardOwner.upsertSignature(ownerFunctionRegistry, isAdded);
    tx.wait();
    await riskStewardOwner.transferOwnership(normalTimelockAddress);
  }

  interface GovernanceCommand {
    contract: string;
    signature: string;
    argTypes: string[];
    parameters: any[];
    value: BigNumberish;
  }

  const configureAccessControls = async (
    methods: string[],
    accessControlManagerAddress: string,
    caller: string,
    target: string,
  ): Promise<GovernanceCommand[]> => {
    const commands = await Promise.all(
      methods.map(async method => {
        const callerAddress = caller;
        const targetAddress = target;
        return [
          {
            contract: accessControlManagerAddress,
            signature: "giveCallPermission(address,string,address)",
            argTypes: ["address", "string", "address"],
            parameters: [targetAddress, method, callerAddress],
            value: 0,
          },
        ];
      }),
    );
    return commands.flat();
  };

  const commands = [
    ...(await configureAccessControls(
      ownerFunctionRegistry,
      accessControlManager.address,
      normalTimelockAddress,
      riskStewardOwner.address,
    )),
    {
      contract: riskStewardOwner.address,
      signature: "acceptOwnership()",
      parameters: [],
      value: 0,
    },
  ];
  console.log("Please propose a VIP with the following commands:");
  console.log(
    JSON.stringify(
      commands.map(c => ({ target: c.contract, signature: c.signature, params: c.parameters, value: c.value })),
    ),
  );
};

func.tags = ["risk-steward-owner"];

export default func;
