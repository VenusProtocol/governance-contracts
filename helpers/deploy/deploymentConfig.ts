import { LZ_CHAINID, SUPPORTED_NETWORKS } from "./constants";

export type AccessControlEntry = {
  caller: string;
  target: string;
  method: string;
};

export const OmnichainProposalSenderMethods: string[] = [
  "setTrustedRemoteAddress(uint16,bytes)",
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
  "setTrustedRemoteAddress(uint16,bytes)",
  "setPrecrime(address)",
  "setMinDstGas(uint16,uint16,uint256)",
  "setPayloadSizeLimit(uint16,uint256)",
  "setConfig(uint16,uint16,uint256,bytes)",
  "addTimelocks(ITimelock[])",
];
export const OmnichainGovernanceExecutorMethodsForGuardian: string[] = [
  "forceResumeReceive(uint16,bytes)",
  "setMaxDailyReceiveLimit(uint16,uint256)",
  "pause()",
  "unpause()",
  "setTrustedRemoteAddress(uint16,bytes)",
  "addTimelocks(ITimelock[])",
];

type Config = {
  [key in SUPPORTED_NETWORKS]: {
    methods: { method: string; args: any[] }[];
  };
};

type DelayTypes = {
  normal: number;
  fast: number;
  critical: number;
};
export type DelayConfig = {
  [key in SUPPORTED_NETWORKS]: DelayTypes;
};

export const delayConfig: DelayConfig = {
  hardhat: {
    normal: 600,
    fast: 300,
    critical: 100,
  },
  bscmainnet: {
    normal: 172800,
    fast: 21600,
    critical: 3600,
  },
  bsctestnet: {
    normal: 600,
    fast: 300,
    critical: 100,
  },
  sepolia: {
    normal: 600,
    fast: 300,
    critical: 100,
  },
  ethereum: {
    normal: 172800,
    fast: 21600,
    critical: 3600,
  },
  opbnbtestnet: {
    normal: 600,
    fast: 300,
    critical: 100,
  },
  opbnbmainnet: {
    normal: 172800,
    fast: 21600,
    critical: 3600,
  },
  arbitrumsepolia: {
    normal: 600,
    fast: 300,
    critical: 100,
  },
  arbitrumone: {
    normal: 172800,
    fast: 21600,
    critical: 3600,
  },
};
export const config: Config = {
  bscmainnet: {
    methods: [
      { method: "setMaxDailyLimit(uint16,uint256)", args: [LZ_CHAINID["ethereum"], 100] },
      { method: "setMaxDailyLimit(uint16,uint256)", args: [LZ_CHAINID["opbnbmainnet"], 100] },
      { method: "setMaxDailyLimit(uint16,uint256)", args: [LZ_CHAINID["arbitrumone"], 100] },
    ],
  },
  bsctestnet: {
    methods: [
      { method: "setMaxDailyLimit(uint16,uint256)", args: [LZ_CHAINID["sepolia"], 100] },
      { method: "setMaxDailyLimit(uint16,uint256)", args: [LZ_CHAINID["opbnbtestnet"], 100] },
      { method: "setMaxDailyLimit(uint16,uint256)", args: [LZ_CHAINID["arbitrumsepolia"], 100] },
    ],
  },

  ethereum: {
    methods: [
      { method: "setMinDstGas(uint16,uint16,uint256)", args: [LZ_CHAINID["bscmainnet"], 0, 200000] },
      { method: "setMaxDailyReceiveLimit(uint256)", args: [100] },
    ],
  },
  sepolia: {
    methods: [
      { method: "setMinDstGas(uint16,uint16,uint256)", args: [LZ_CHAINID["bsctestnet"], 0, 200000] },
      { method: "setMaxDailyReceiveLimit(uint256)", args: [100] },
    ],
  },
  opbnbmainnet: {
    methods: [
      { method: "setMinDstGas(uint16,uint16,uint256)", args: [LZ_CHAINID["bscmainnet"], 0, 200000] },
      { method: "setMaxDailyReceiveLimit(uint256)", args: [100] },
    ],
  },
  opbnbtestnet: {
    methods: [
      { method: "setMinDstGas(uint16,uint16,uint256)", args: [LZ_CHAINID["bsctestnet"], 0, 200000] },
      { method: "setMaxDailyReceiveLimit(uint256)", args: [100] },
    ],
  },
  arbitrumone: {
    methods: [
      { method: "setMinDstGas(uint16,uint16,uint256)", args: [LZ_CHAINID["bscmainnet"], 0, 200000] },
      { method: "setMaxDailyReceiveLimit(uint256)", args: [100] },
    ],
  },
  arbitrumsepolia: {
    methods: [
      { method: "setMinDstGas(uint16,uint16,uint256)", args: [LZ_CHAINID["bsctestnet"], 0, 200000] },
      { method: "setMaxDailyReceiveLimit(uint256)", args: [100] },
    ],
  },
  hardhat: {
    methods: [
      { method: "setMinDstGas(uint16,uint16,uint256)", args: [LZ_CHAINID["bsctestnet"], 0, 200000] },
      { method: "setMaxDailyReceiveLimit(uint256)", args: [100] },
    ],
  },
};
