import { BigNumberish } from "ethers";
import { ethers } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { LZ_ENDPOINTS, SUPPORTED_NETWORKS } from "../helpers/deploy/constants";
import { OmnichainProposalSenderMethods, bridgeConfig, getConfig } from "../helpers/deploy/deploymentConfig";
import { toAddress } from "../helpers/deploy/deploymentUtils";
import { getArgTypesFromSignature } from "../helpers/utils";

interface GovernanceCommand {
  contract: string;
  signature: string;
  argTypes: string[];
  parameters: any[];
  value: BigNumberish;
}

const configureBridgeCommands = async (
  target: string,
  hre: HardhatRuntimeEnvironment,
): Promise<GovernanceCommand[]> => {
  const commands = await Promise.all(
    bridgeConfig[hre.network.name].methods.map(async (entry: { method: string; args: any[] }) => {
      const { method, args } = entry;
      return {
        contract: target,
        signature: method,
        argTypes: getArgTypesFromSignature(method),
        parameters: args,
        value: 0,
      };
    }),
  );
  return commands.flat();
};

const configureAccessControls = async (
  methods: string[],
  accessControlManagerAddress: string,
  caller: string,
  target: string,
  hre: HardhatRuntimeEnvironment,
): Promise<GovernanceCommand[]> => {
  const commands = await Promise.all(
    methods.map(async method => {
      const callerAddress = await toAddress(caller, hre);
      const targetAddress = await toAddress(target, hre);
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

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const deploymentConfig = await getConfig(hre.network.name as SUPPORTED_NETWORKS.BSCMAINNET);

  const OmnichainProposalSender = await deploy("OmnichainProposalSender", {
    from: deployer,
    args: [
      LZ_ENDPOINTS[hre.network.name as keyof typeof LZ_ENDPOINTS],
      deploymentConfig.AccessControlManager,
      deploymentConfig.GovernorDelegator,
    ],
    log: true,
    autoMine: true,
  });

  const bridge = await ethers.getContractAt(
    "OmnichainProposalSender",
    OmnichainProposalSender.address,
    ethers.provider.getSigner(deployer),
  );

  if ((await bridge.owner()) === deployer) {
    const tx = await bridge.transferOwnership(deploymentConfig.NormalTimelock);
    await tx.wait();
    console.log(`Bridge owner ${deployer} sucessfully changed to ${deploymentConfig.NormalTimelock}.`);
  }
  const commands = [
    ...(await configureAccessControls(
      OmnichainProposalSenderMethods,
      deploymentConfig.AccessControlManager,
      deploymentConfig.NormalTimelock,
      OmnichainProposalSender.address,
      hre,
    )),
    ...(await configureAccessControls(
      OmnichainProposalSenderMethods,
      deploymentConfig.AccessControlManager,
      deploymentConfig.FastTrackTimelock,
      OmnichainProposalSender.address,
      hre,
    )),
    ...(await configureAccessControls(
      OmnichainProposalSenderMethods,
      deploymentConfig.AccessControlManager,
      deploymentConfig.CriticalTimelock,
      OmnichainProposalSender.address,
      hre,
    )),
    ...(await configureBridgeCommands(OmnichainProposalSender.address, hre)),

    {
      contract: OmnichainProposalSender.address,
      signature: "setTrustedRemote(uint16,bytes)",
      parameters: ["dstChainId", "0xDestAddressSrcAddress"],
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
func.tags = ["OmnichainProposalSender", "omnichainlocal"];

func.skip = async (hre: HardhatRuntimeEnvironment) =>
  !(hre.network.name === "bsctestnet" || hre.network.name === "bscmainnet") && hre.network.name !== "hardhat";
export default func;
