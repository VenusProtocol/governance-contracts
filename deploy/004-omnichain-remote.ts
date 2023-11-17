import { BigNumberish } from "ethers";
import { ethers } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { LZ_ENDPOINTS } from "../helpers/deploy/constants";
import { OmnichainGovernanceExecutorMethods, bridgeConfig } from "../helpers/deploy/deploymentConfig";
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

  const normalTimelock = await ethers.getContract("NormalTimelock");

  const fastTrackTimelock = await ethers.getContract("FastTrackTimelock");
  const criticalTimelock = await ethers.getContract("CriticalTimelock");

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

  await executeBridgeCommands(bridge, hre, deployer);

  const removeArray = new Array(OmnichainGovernanceExecutorMethods.length).fill(false);
  const tx = await bridgeAdmin.upsertSignature(OmnichainGovernanceExecutorMethods, removeArray);
  await tx.wait();

  if ((await bridge.owner()) === deployer) {
    const tx = await bridge.transferOwnership(OmnichainExecutorOwner.address);
    await tx.wait();
  }

  if (bridgeAdmin.owner === deployer) {
    const tx = await bridgeAdmin.transferOwnership(normalTimelock.address);
    await tx.wait();
  }
  console.log(`Bridge Admin owner ${deployer} sucessfully changed to ${normalTimelock.address}.`);

  const commands = [
    ...(await configureAccessControls(
      OmnichainGovernanceExecutorMethods,
      acmAddress,
      normalTimelock.address,
      OmnichainExecutorOwner.address,
      hre,
    )),

    {
      contract: OmnichainExecutorOwner.address,
      signature: "addTimelocks(address[])",
      parameters: [normalTimelock.address, fastTrackTimelock.address, criticalTimelock.address],
      value: 0,
    },

    {
      contract: OmnichainExecutorOwner.address,
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
func.tags = ["OmnichainExecutor", "omnichainremote"];

func.skip = async (hre: HardhatRuntimeEnvironment) =>
  !(hre.network.name === "sepolia" || hre.network.name === "ethereum") && hre.network.name !== "hardhat";
export default func;
