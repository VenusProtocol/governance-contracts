import { BigNumberish } from "ethers";
import { ethers } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import Sepolia_OmnichainProposalSender from "../deployments/bsctestnet/OmnichainProposalSender.json";
import { LZ_ENDPOINTS } from "../helpers/deploy/constants";
import { OmnichainGovernanceExecutorMethods, bridgeConfig } from "../helpers/deploy/deploymentConfig";
import { timelockDelays } from "../helpers/deploy/deploymentConfig";
import { toAddress } from "../helpers/deploy/deploymentUtils";
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

const executeBridgeCommands = async (
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
  console.log("Executing Bridge commands");
  const methods = bridgeConfig[hre.network.name].methods;

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

  const acmAddress = (await ethers.getContract("AccessControlManager")).address;

  const OmnichainGovernanceExecutor = await deploy("OmnichainGovernanceExecutor", {
    from: deployer,
    args: [LZ_ENDPOINTS[hre.network.name as keyof typeof LZ_ENDPOINTS], deployer],
    log: true,
    autoMine: true,
  });

  const bridge = (await ethers.getContractAt(
    "OmnichainGovernanceExecutor",
    OmnichainGovernanceExecutor.address,
    ethers.provider.getSigner(deployer),
  )) as OmnichainGovernanceExecutor;

  const normalTimelock = await deploy("Timelock_Normal", {
    contract: "Timelock",
    from: deployer,
    args: [bridge.address, timelockDelays[hre.network.name].NORMAL],
    log: true,
    autoMine: true,
  });

  const fasttrackTimelock = await deploy("Timelock_FastTrack", {
    contract: "Timelock",
    from: deployer,
    args: [bridge.address, timelockDelays[hre.network.name].FAST_TRACK],
    log: true,
    autoMine: true,
  });

  const criticalTimelock = await deploy("Timelock_Critical", {
    contract: "Timelock",
    from: deployer,
    args: [bridge.address, timelockDelays[hre.network.name].CRITICAL],
    log: true,
    autoMine: true,
  });

  const OmnichainExecutorOwner = await deploy("OmnichainExecutorOwner", {
    from: deployer,
    args: [OmnichainGovernanceExecutor.address],
    contract: "OmnichainExecutorOwner",
    proxy: {
      owner: normalTimelock.address,
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

  const bridgeAdmin = await ethers.getContractAt(
    "OmnichainExecutorOwner",
    OmnichainExecutorOwner.address,
    ethers.provider.getSigner(deployer),
  );

  if ((await bridge.owner()) === deployer) {
    await executeBridgeCommands(
      bridge,
      hre,
      deployer,
      Sepolia_OmnichainProposalSender.address,
      10102,
      normalTimelock.address,
      fasttrackTimelock.address,
      criticalTimelock.address,
    );
    const tx = await bridge.transferOwnership(OmnichainExecutorOwner.address);
    await tx.wait();
  }

  if ((await bridgeAdmin.owner()) === deployer) {
    const isAdded = new Array(OmnichainGovernanceExecutorMethods.length).fill(true);
    let tx = await bridgeAdmin.upsertSignature(OmnichainGovernanceExecutorMethods, isAdded);
    await tx.wait();
    tx = await bridgeAdmin.transferOwnership(normalTimelock.address);
    await tx.wait();
    console.log(`Bridge Admin owner ${deployer} sucessfully changed to ${normalTimelock.address}.`);
  }

  const commands = [
    ...(await configureAccessControls(
      OmnichainGovernanceExecutorMethods,
      acmAddress,
      normalTimelock.address,
      OmnichainExecutorOwner.address,
      hre,
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
