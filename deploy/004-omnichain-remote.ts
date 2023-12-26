import { BigNumberish } from "ethers";
import { ethers } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { LZ_ENDPOINTS, SUPPORTED_NETWORKS } from "../helpers/deploy/constants";
import { OmnichainGovernanceExecutorMethods, config } from "../helpers/deploy/deploymentConfig";
import { getOmnichainProposalSender } from "../helpers/deploy/deploymentUtils";
import { OmnichainGovernanceExecutor } from "../typechain";

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

const executeCommands = async (
  target: OmnichainGovernanceExecutor,
  hre: HardhatRuntimeEnvironment,
  deployer: string,
  omnichainProposalSenderAddress: string,
  chainId: number,
  normalTimelockAddress: string,
  fastTrackTimelockAddress: string,
  criticalTimelockAddress: string,
) => {
  const signer = await ethers.getSigner(deployer);
  const networkName = hre.network.name as SUPPORTED_NETWORKS;
  console.log("Executing commands");
  const methods = config[networkName].methods;

  for (let i = 0; i < methods.length; i++) {
    const entry = methods[i];
    const { method, args } = entry;
    // @ts-expect-error interface type doesn't match
    const data = target.interface.encodeFunctionData(method, args);
    await signer.sendTransaction({
      to: target.address,
      data: data,
    });
  }
  let tx = await target.connect(signer).setTrustedRemoteAddress(chainId, omnichainProposalSenderAddress);
  await tx.wait();

  tx = await target
    .connect(signer)
    .addTimelocks([normalTimelockAddress, fastTrackTimelockAddress, criticalTimelockAddress]);
  await tx.wait();
};

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const networkName = hre.network.name as SUPPORTED_NETWORKS;

  const acmAddress = (await ethers.getContract("AccessControlManager")).address;
  const normalTimelockAddress = (await ethers.getContract("NormalTimelock")).address;
  const fastTrackTimelockAddress = (await ethers.getContract("FastTrackTimelock")).address;
  const criticalTimelockAddress = (await ethers.getContract("CriticalTimelock")).address;

  const OmnichainGovernanceExecutor = await deploy("OmnichainGovernanceExecutor", {
    from: deployer,
    args: [LZ_ENDPOINTS[networkName], deployer],
    log: true,
    autoMine: true,
  });

  const omnichainGovernanceExecutor = (await ethers.getContractAt(
    "OmnichainGovernanceExecutor",
    OmnichainGovernanceExecutor.address,
    ethers.provider.getSigner(deployer),
  )) as OmnichainGovernanceExecutor;

  const OmnichainExecutorOwner = await deploy("OmnichainExecutorOwner", {
    from: deployer,
    args: [OmnichainGovernanceExecutor.address],
    contract: "OmnichainExecutorOwner",
    proxy: {
      owner: normalTimelockAddress,
      proxyContract: "OpenZeppelinTransparentProxy",
      execute: {
        methodName: "initialize",
        args: [acmAddress],
      },
      upgradeIndex: 0,
    },
    log: true,
    autoMine: true,
  });

  const omnichainExecutorOwner = await ethers.getContractAt(
    "OmnichainExecutorOwner",
    OmnichainExecutorOwner.address,
    ethers.provider.getSigner(deployer),
  );

  if ((await omnichainGovernanceExecutor.owner()) === deployer) {
    const omnichainProposalSenderAddress = await getOmnichainProposalSender(networkName);
    await executeCommands(
      omnichainGovernanceExecutor,
      hre,
      deployer,
      omnichainProposalSenderAddress,
      10102,
      normalTimelockAddress,
      fastTrackTimelockAddress,
      criticalTimelockAddress,
    );
    const tx = await omnichainGovernanceExecutor.transferOwnership(OmnichainExecutorOwner.address);
    await tx.wait();
  }

  if ((await omnichainExecutorOwner.owner()) === deployer) {
    const isAdded = new Array(OmnichainGovernanceExecutorMethods.length).fill(true);
    let tx = await omnichainExecutorOwner.upsertSignature(OmnichainGovernanceExecutorMethods, isAdded);
    await tx.wait();
    tx = await omnichainExecutorOwner.transferOwnership(normalTimelockAddress);
    await tx.wait();
    console.log(`Omnichain Executor Owner ${deployer} successfully changed to ${normalTimelockAddress}.`);
  }

  const commands = [
    ...(await configureAccessControls(
      OmnichainGovernanceExecutorMethods,
      acmAddress,
      normalTimelockAddress,
      OmnichainExecutorOwner.address,
    )),
  ];
  console.log("Please propose a VIP with the following commands:");
  console.log(
    JSON.stringify(
      commands.map(c => ({ target: c.contract, signature: c.signature, params: c.parameters, value: c.value })),
    ),
  );
};
func.tags = ["OmnichainExecutor", "omnichainremote"];

func.skip = async (hre: HardhatRuntimeEnvironment) =>
  !(hre.network.name === "sepolia" || hre.network.name === "ethereum") && hre.network.name !== "hardhat";
export default func;