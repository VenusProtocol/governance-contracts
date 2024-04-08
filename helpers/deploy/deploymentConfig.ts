import { SUPPORTED_NETWORKS } from "./constants";

export type AccessControlEntry = {
  caller: string;
  target: string;
  method: string;
};

export const OmnichainProposalSenderMethods: string[] = [
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
export const delayConfig = {
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
};
export const config: Config = {
  bsctestnet: {
    methods: [
      { method: "setMaxDailyLimit(uint16,uint256)", args: [10161, 100] },
      { method: "updateValidChainId(uint16,bool)", args: [10161, true] },
      { method: "setTrustedRemoteAddress(uint16,bytes)", args: ["dstChainId", "dstAppAddress"] },
    ],
  },
  bscmainnet: {
    methods: [
      { method: "setMaxDailyLimit(uint16,uint256)", args: [101, 100] },
      { method: "updateValidChainId(uint16,bool)", args: [101, true] },
      { method: "setTrustedRemoteAddress(uint16,bytes)", args: ["dstChainId", "dstAppAddress"] },
    ],
  },
  sepolia: {
    methods: [
      { method: "setMinDstGas(uint16,uint16,uint256)", args: [10102, 0, 200000] },
      { method: "setMaxDailyReceiveLimit(uint256)", args: [100] },
      { method: "setTrustedRemoteAddress(uint16,bytes)", args: ["dstChainId", "dstAppAddress"] },
    ],
  },
  ethereum: {
    methods: [
      { method: "setMaxDailyLimit(uint16,uint256)", args: [101, 100] },
      { method: "updateValidChainId(uint16,bool)", args: [101, true] },
      { method: "setTrustedRemoteAddress(uint16,bytes)", args: ["dstChainId", "dstAppAddress"] },
    ],
  },
  opbnbtestnet: {
    methods: [
      { method: "setMinDstGas(uint16,uint16,uint256)", args: [10102, 0, 200000] },
      { method: "setMaxDailyReceiveLimit(uint256)", args: [100] },
      { method: "setTrustedRemoteAddress(uint16,bytes)", args: ["dstChainId", "dstAppAddress"] },
    ],
  },
  opbnbmainnet: {
    methods: [
      { method: "setMinDstGas(uint16,uint16,uint256)", args: [101, 0, 200000] },
      { method: "setMaxDailyReceiveLimit(uint256)", args: [100] },
      { method: "setTrustedRemoteAddress(uint16,bytes)", args: ["dstChainId", "dstAppAddress"] },
    ],
  },
  hardhat: {
    methods: [
      { method: "setMinDstGas(uint16,uint16,uint256)", args: [10102, 0, 200000] },
      { method: "setMaxDailyReceiveLimit(uint256)", args: [100] },
      { method: "setTrustedRemoteAddress(uint16,bytes)", args: ["dstChainId", "dstAppAddress"] },
    ],
  },
};
