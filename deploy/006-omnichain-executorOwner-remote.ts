import { BigNumberish } from "ethers";
import { ethers } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { LZ_CHAINID, SUPPORTED_NETWORKS } from "../helpers/deploy/constants";
import {
  OmnichainGovernanceExecutorCriticalMethods,
  OmnichainGovernanceExecutorFasttrackMethods,
  OmnichainGovernanceExecutorMethodsForGuardian,
  OmnichainGovernanceExecutorNormalMethods,
  config,
} from "../helpers/deploy/deploymentConfig";
import { getOmnichainProposalSender, guardian, testnetNetworks } from "../helpers/deploy/deploymentUtils";
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
  const srcChainId = testnetNetworks.includes(hre.network.name) ? LZ_CHAINID["bsctestnet"] : LZ_CHAINID["bscmainnet"];
  const Guardian = await guardian(hre.network.name as SUPPORTED_NETWORKS);

  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const networkName = hre.network.name as SUPPORTED_NETWORKS;

  const acmAddress = (await ethers.getContract("AccessControlManager")).address;
  const normalTimelockAddress = (await ethers.getContract("NormalTimelock")).address;
  const fastTrackTimelockAddress = (await ethers.getContract("FastTrackTimelock")).address;
  const criticalTimelockAddress = (await ethers.getContract("CriticalTimelock")).address;

  const omnichainGovernanceExecutorAddress = (await ethers.getContract("OmnichainGovernanceExecutor")).address;
  const OmnichainExecutorOwner = await deploy("OmnichainExecutorOwner", {
    from: deployer,
    args: [omnichainGovernanceExecutorAddress],
    contract: "OmnichainExecutorOwner",
    proxy: {
      owner: hre.network.live ? Guardian : deployer, // Guardian will be replaced by normalTimelock once ownership of DefaultProxyAdmin is transferred to normalTimelock.
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
  const omnichainGovernanceExecutor = await ethers.getContractAt<OmnichainGovernanceExecutor>(
    "OmnichainGovernanceExecutor",
    omnichainGovernanceExecutorAddress,
    ethers.provider.getSigner(deployer),
  );

  if ((await omnichainGovernanceExecutor.owner()) === deployer) {
    const omnichainProposalSenderAddress = await getOmnichainProposalSender(networkName);
    await executeCommands(
      omnichainGovernanceExecutor,
      hre,
      deployer,
      omnichainProposalSenderAddress,
      srcChainId,
      normalTimelockAddress,
      fastTrackTimelockAddress,
      criticalTimelockAddress,
    );
    const tx = await omnichainGovernanceExecutor.transferOwnership(OmnichainExecutorOwner.address);
    await tx.wait();
  }

  if ((await omnichainExecutorOwner.owner()) === deployer) {
    let isAdded = new Array(OmnichainGovernanceExecutorNormalMethods.length).fill(true);
    let tx = await omnichainExecutorOwner.upsertSignature(OmnichainGovernanceExecutorNormalMethods, isAdded);
    isAdded = new Array(OmnichainGovernanceExecutorMethodsForGuardian.length).fill(true);
    tx = await omnichainExecutorOwner.upsertSignature(OmnichainGovernanceExecutorMethodsForGuardian, isAdded);

    await tx.wait();
    tx = await omnichainExecutorOwner.transferOwnership(normalTimelockAddress);
    await tx.wait();
    console.log(`Omnichain Executor Owner ${deployer} successfully changed to ${normalTimelockAddress}.`);
  }

  const commands = [
    ...(await configureAccessControls(
      OmnichainGovernanceExecutorNormalMethods,
      acmAddress,
      normalTimelockAddress,
      OmnichainExecutorOwner.address,
    )),
    ...(await configureAccessControls(
      OmnichainGovernanceExecutorFasttrackMethods,
      acmAddress,
      fastTrackTimelockAddress,
      OmnichainExecutorOwner.address,
    )),
    ...(await configureAccessControls(
      OmnichainGovernanceExecutorCriticalMethods,
      acmAddress,
      criticalTimelockAddress,
      OmnichainExecutorOwner.address,
    )),
    ...(await configureAccessControls(
      OmnichainGovernanceExecutorMethodsForGuardian,
      acmAddress,
      Guardian,
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
func.tags = ["OmnichainExecutorOwner", "Remote"];

func.skip = async (hre: HardhatRuntimeEnvironment) =>
  hre.network.name === "bsctestnet" || hre.network.name === "bscmainnet";
export default func;
