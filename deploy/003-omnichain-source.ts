import { BigNumberish } from "ethers";
import { ethers } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { LZ_ENDPOINTS, SUPPORTED_NETWORKS } from "../helpers/deploy/constants";
import { OmnichainProposalSenderMethods, config } from "../helpers/deploy/deploymentConfig";
import { getArgTypesFromSignature } from "../helpers/utils";

interface GovernanceCommand {
  contract: string;
  signature: string;
  argTypes: string[];
  parameters: any[];
  value: BigNumberish;
}

const configureCommands = async (target: string, hre: HardhatRuntimeEnvironment): Promise<GovernanceCommand[]> => {
  const networkName = hre.network.name as SUPPORTED_NETWORKS;
  const commands = await Promise.all(
    config[networkName].methods.map(async (entry: { method: string; args: any[] }) => {
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
  callerAddress: string,
  targetAddress: string,
): Promise<GovernanceCommand[]> => {
  const commands = await Promise.all(
    methods.map(async method => {
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

  const acmAddress = (await ethers.getContract("AccessControlManager")).address;
  const normalTimelockAddress = (await ethers.getContract("NormalTimelock")).address;
  const fastTrackTimelockAddress = (await ethers.getContract("FastTrackTimelock")).address;
  const criticalTimelockAddress = (await ethers.getContract("CriticalTimelock")).address;

  const OmnichainProposalSender = await deploy("OmnichainProposalSender", {
    from: deployer,
    args: [LZ_ENDPOINTS[hre.network.name as keyof typeof LZ_ENDPOINTS], acmAddress],
    log: true,
    autoMine: true,
  });

  const omnichainProposalSender = await ethers.getContractAt(
    "OmnichainProposalSender",
    OmnichainProposalSender.address,
    ethers.provider.getSigner(deployer),
  );

  if ((await omnichainProposalSender.owner()) === deployer) {
    const tx = await omnichainProposalSender.transferOwnership(normalTimelockAddress);
    await tx.wait();
    console.log(`Omnichain Proposal Sender ${deployer} sucessfully changed to ${normalTimelockAddress}.`);
  }
  const commands = [
    ...(await configureAccessControls(
      OmnichainProposalSenderMethods,
      acmAddress,
      normalTimelockAddress,
      OmnichainProposalSender.address,
    )),
    ...(await configureAccessControls(
      OmnichainProposalSenderMethods,
      acmAddress,
      fastTrackTimelockAddress,
      OmnichainProposalSender.address,
    )),
    ...(await configureAccessControls(
      OmnichainProposalSenderMethods,
      acmAddress,
      criticalTimelockAddress,
      OmnichainProposalSender.address,
    )),
    ...(await configureCommands(OmnichainProposalSender.address, hre)),
  ];
  console.log("Please propose a VIP with the following commands:");
  console.log(
    JSON.stringify(
      commands.map(c => ({ target: c.contract, signature: c.signature, params: c.parameters, value: c.value })),
    ),
  );
};
func.tags = ["OmnichainProposalSender"];

func.skip = async (hre: HardhatRuntimeEnvironment) =>
  !(hre.network.name === "bsctestnet" || hre.network.name === "bscmainnet") && hre.network.name !== "hardhat";
export default func;
