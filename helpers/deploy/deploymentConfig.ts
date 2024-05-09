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
  "setTimelockPendingAdmin(address,uint8)",
  "retryMessage(uint16,bytes,uint64,bytes)",
];
export const OmnichainGovernanceExecutorMethodsForGuardian: string[] = [
  "forceResumeReceive(uint16,bytes)",
  "setMaxDailyReceiveLimit(uint16,uint256)",
  "pause()",
  "unpause()",
  "setTrustedRemoteAddress(uint16,bytes)",
  "addTimelocks(ITimelock[])",
  "setTimelockPendingAdmin(address,uint8)",
  "retryMessage(uint16,bytes,uint64,bytes)",
];

type Config = {
  [key in SUPPORTED_NETWORKS]: {
    methods: { method: string; args: any[] }[];
  };
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
