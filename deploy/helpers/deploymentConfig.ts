import { ethers } from "hardhat";

const ANY_CONTRACT = ethers.constants.AddressZero;
const preconfiguredAddresses = {
  bsctestnet: {
    NormalTimelock: "0xce10739590001705F7FF231611ba4A48B2820327",
    FastTrackTimelock: "0x3CFf21b7AF8390fE68799D58727d3b4C25a83cb6",
    CriticalTimelock: "0x23B893a7C45a5Eb8c8C062b9F32d0D2e43eD286D",
    AccessControlManager: "0x45f8a08F534f34A97187626E05d4b6648Eeaa9AA",
  },
  bscmainnet: {
    NormalTimelock: "0x939bD8d64c0A9583A7Dcea9933f7b21697ab6396",
    FastTrackTimelock: "0x555ba73dB1b006F3f2C7dB7126d6e4343aDBce02",
    CriticalTimelock: "0x213c446ec11e45b15a6E29C1C1b402B8897f606d",
    AccessControlManager: "0x4788629ABc6cFCA10F9f969efdEAa1cF70c23555",
  },
  sepolia: {
    AccessControlManager: "0xbf705C00578d43B6147ab4eaE04DBBEd1ccCdc96",
  },
  ethereum: {
    // TODO
  },
};

export type Delay = { [key: string]: number };

export type DelayConfig = {
  [key: string]: Delay;
};

export const timelockDelays: DelayConfig = {
  sepolia: {
    NORMAL: 10800,
    FAST_TRACK: 7200,
    CRITICAL: 3600,
  },
  ethereum: {
    NORMAL: 172800,
    FAST_TRACK: 21600,
    CRITICAL: 3600,
  },
};

export type NetworkConfig = {
  bsctestnet: DeploymentConfig;
  bscmainnet: DeploymentConfig;
  sepolia: DeploymentConfig;
};

export type timelockNetworkConfig = {
  sepolia: DelayConfig;
  ethereum: DelayConfig;
};

export type AccessControlEntry = {
  caller: string;
  target: string;
  method: string;
};
export type PreconfiguredAddresses = { [contract: string]: string };

export type DeploymentConfig = {
  preconfiguredAddresses: PreconfiguredAddresses;
};

export const globalConfig: NetworkConfig = {
  bsctestnet: {
    preconfiguredAddresses: preconfiguredAddresses.bsctestnet,
  },
  bscmainnet: {
    preconfiguredAddresses: preconfiguredAddresses.bscmainnet,
  },
  sepolia: {
    preconfiguredAddresses: preconfiguredAddresses.sepolia,
  },
};

export async function getConfig(networkName: string): Promise<DeploymentConfig> {
  switch (networkName) {
    case "bscmainnet":
      return globalConfig.bscmainnet;
    case "bsctestnet":
      return globalConfig.bsctestnet;
    case "sepolia":
      return globalConfig.sepolia;
    case "development":
      return globalConfig.bsctestnet;
    default:
      throw new Error(`config for network ${networkName} is not available.`);
  }
}

export const OmnichainProposalSenderMethods: string[] = [
  "setTrustedRemote(uint16,bytes)",
  "setTrustedRemoteAddress(uint16,bytes)",
  "updateValidChainID(uint16,bool)",
  "setMaxDailyLimit(uint16,uint256)",
  "execute(uint16,bytes,bytes)",
  "pause()",
  "unpause()",
  "setSendVersion(uint16)",
  "setConfig(uint16,uint16,uint256,bytes)",
];

export const OmnichainGovernanceExecutorMethods: string[] = [
  "setSendVersion(uint16)",
  "setReceiveVersion(uint16)",
  "forceResumeReceive(uint16,bytes)",
  "setOracle(address)",
  "setMaxDailyReceiveLimit(uint16,uint256)",
  "pause()",
  "unpause()",
  "setTrustedRemote(uint16,bytes)",
  "setTrustedRemoteAddress(uint16,bytes)",
  "setPrecrime(address)",
  "setMinDstGas(uint16,uint16,uint256)",
  "setPayloadSizeLimit(uint16,uint256)",
  "setConfig(uint16,uint16,uint256,bytes)",
  "addTimelocks(TimelockInterface[])",
];

interface BridgeConfig {
  [networkName: string]: {
    methods: { method: string; args: any[] }[];
  };
}

export const bridgeConfig: BridgeConfig = {
  bsctestnet: {
    methods: [
      { method: "setMaxDailyLimit(uint16,uint256)", args: [10161, 100] },
      { method: "updateValidChainId(uint16,bool)", args: [10161, true] },
    ],
  },
  bscmainnet: {
    methods: [
      { method: "setMaxDailyLimit(uint16,uint256)", args: [101, 100] },
      { method: "updateValidChainId(uint16,bool)", args: [101, true] },
    ],
  },
  sepolia: {
    methods: [
      { method: "setTrustedRemote(uint16,bytes)", args: [10102, ANY_CONTRACT] },
      { method: "setMinDstGas(uint16,uint16,uint256)", args: [10102, 0, 200000] },
      { method: "setMaxDailyReceiveLimit(uint16,uint256)", args: [10102, 100] },
    ],
  },
};
