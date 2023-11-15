import { AddressConfig, SUPPORTED_NETWORKS } from "./constants";

export type Delay = { [key: string]: number };

export type DelayConfig = {
  [key: string]: Delay;
};

export const timelockDelays: DelayConfig = {
  hardhat: {
    NORMAL: 10800,
    FAST_TRACK: 7200,
    CRITICAL: 3600,
  },
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

export interface PreconfiguredAddresses {
  NormalTimelock: string;
  FastTrackTimelock: string;
  CriticalTimelock: string;
  AccessControlManager: string;
  GovernorDelegator?: string;
}

export type timelockNetworkConfig = {
  sepolia: DelayConfig;
  ethereum: DelayConfig;
};

export type AccessControlEntry = {
  caller: string;
  target: string;
  method: string;
};

export async function getConfig<N extends SUPPORTED_NETWORKS>(networkName: N): Promise<(typeof AddressConfig)[N]> {
  switch (networkName) {
    case "bscmainnet":
      return AddressConfig.bscmainnet;
    case "bsctestnet":
      return AddressConfig.bsctestnet;
    case "sepolia":
      return AddressConfig.sepolia;
    case "hardhat":
      return AddressConfig.hardhat;
    default:
      throw new Error(`config for network ${networkName} is not available.`);
  }
}

export const OmnichainProposalSenderMethods: string[] = [
  "setTrustedRemote(uint16,bytes)",
  "setTrustedRemoteAddress(uint16,bytes)",
  "updateValidChainId(uint16,bool)",
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
  "addTimelocks(ITimelock[])",
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
      { method: "setMinDstGas(uint16,uint16,uint256)", args: [10102, 0, 200000] },
      { method: "setMaxDailyReceiveLimit(uint16,uint256)", args: [10102, 100] },
    ],
  },
  hardhat: {
    methods: [
      { method: "setMinDstGas(uint16,uint16,uint256)", args: [10102, 0, 200000] },
      { method: "setMaxDailyReceiveLimit(uint16,uint256)", args: [10102, 100] },
    ],
  },
};
