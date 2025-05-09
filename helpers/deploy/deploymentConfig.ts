import { LZ_CHAINID, SUPPORTED_NETWORKS } from "./constants";

export type AccessControlEntry = {
  caller: string;
  target: string;
  method: string;
};

export const OmnichainProposalSenderNormalMethods: string[] = [
  "setTrustedRemoteAddress(uint16,bytes)",
  "setMaxDailyLimit(uint16,uint256)",
  "execute(uint16,bytes,bytes,address)",
  "retryExecute(uint256,uint16,bytes,bytes,address,uint256)",
  "pause()",
  "unpause()",
  "setSendVersion(uint16)",
  "setConfig(uint16,uint16,uint256,bytes)",
];
export const OmnichainProposalSenderFasttrackMethods: string[] = [
  "setMaxDailyLimit(uint16,uint256)",
  "execute(uint16,bytes,bytes,address)",
  "retryExecute(uint256,uint16,bytes,bytes,address,uint256)",
  "pause()",
  "unpause()",
  "setSendVersion(uint16)",
  "setConfig(uint16,uint16,uint256,bytes)",
];
export const OmnichainProposalSenderCriticalMethods: string[] = [
  "setMaxDailyLimit(uint16,uint256)",
  "execute(uint16,bytes,bytes,address)",
  "retryExecute(uint256,uint16,bytes,bytes,address,uint256)",
  "pause()",
  "unpause()",
  "setSendVersion(uint16)",
  "setConfig(uint16,uint16,uint256,bytes)",
];
export const OmnichainProposalSenderGuardianMethods: string[] = [
  "setMaxDailyLimit(uint16,uint256)",
  "pause()",
  "unpause()",
  "retryExecute(uint256,uint16,bytes,bytes,address,uint256)",
];

export const OmnichainGovernanceExecutorNormalMethods: string[] = [
  "setSendVersion(uint16)",
  "setReceiveVersion(uint16)",
  "setMaxDailyReceiveLimit(uint256)",
  "pause()",
  "setTrustedRemoteAddress(uint16,bytes)",
  "setPrecrime(address)",
  "setMinDstGas(uint16,uint16,uint256)",
  "setPayloadSizeLimit(uint16,uint256)",
  "setConfig(uint16,uint16,uint256,bytes)",
  "addTimelocks(ITimelock[])",
  "setTimelockPendingAdmin(address,uint8)",
  "retryMessage(uint16,bytes,uint64,bytes)",
  "setGuardian(address)",
  "setSrcChainId(uint16)",
];
export const OmnichainGovernanceExecutorFasttrackMethods: string[] = [
  "setReceiveVersion(uint16)",
  "setMaxDailyReceiveLimit(uint256)",
  "pause()",
  "setConfig(uint16,uint16,uint256,bytes)",
  "addTimelocks(ITimelock[])",
  "retryMessage(uint16,bytes,uint64,bytes)",
];
export const OmnichainGovernanceExecutorCriticalMethods: string[] = [
  "setReceiveVersion(uint16)",
  "setMaxDailyReceiveLimit(uint256)",
  "pause()",
  "setConfig(uint16,uint16,uint256,bytes)",
  "addTimelocks(ITimelock[])",
  "retryMessage(uint16,bytes,uint64,bytes)",
];
export const OmnichainGovernanceExecutorMethodsForGuardian: string[] = [
  "forceResumeReceive(uint16,bytes)",
  "setMaxDailyReceiveLimit(uint256)",
  "pause()",
  "unpause()",
  "setTrustedRemoteAddress(uint16,bytes)",
  "addTimelocks(ITimelock[])",
  "setTimelockPendingAdmin(address,uint8)",
  "retryMessage(uint16,bytes,uint64,bytes)",
  "setSrcChainId(uint16)",
  "setReceiveVersion(uint16)",
  "setConfig(uint16,uint16,uint256,bytes)",
];
export const OmnichainGovernanceExecutorOwnerMethods: string[] = ["transferBridgeOwnership(address)"];

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
      { method: "setMaxDailyLimit(uint16,uint256)", args: [LZ_CHAINID["zksyncmainnet"], 100] },
      { method: "setMaxDailyLimit(uint16,uint256)", args: [LZ_CHAINID["opmainnet"], 100] },
      { method: "setMaxDailyLimit(uint16,uint256)", args: [LZ_CHAINID["basemainnet"], 100] },
    ],
  },
  bsctestnet: {
    methods: [
      { method: "setMaxDailyLimit(uint16,uint256)", args: [LZ_CHAINID["sepolia"], 100] },
      { method: "setMaxDailyLimit(uint16,uint256)", args: [LZ_CHAINID["opbnbtestnet"], 100] },
      { method: "setMaxDailyLimit(uint16,uint256)", args: [LZ_CHAINID["arbitrumsepolia"], 100] },
      { method: "setMaxDailyLimit(uint16,uint256)", args: [LZ_CHAINID["zksyncsepolia"], 100] },
      { method: "setMaxDailyLimit(uint16,uint256)", args: [LZ_CHAINID["opsepolia"], 100] },
      { method: "setMaxDailyLimit(uint16,uint256)", args: [LZ_CHAINID["basesepolia"], 100] },
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
  zksyncsepolia: {
    methods: [
      { method: "setMinDstGas(uint16,uint16,uint256)", args: [LZ_CHAINID["bsctestnet"], 0, 200000] },
      { method: "setMaxDailyReceiveLimit(uint256)", args: [100] },
    ],
  },
  zksyncmainnet: {
    methods: [
      { method: "setMinDstGas(uint16,uint16,uint256)", args: [LZ_CHAINID["bscmainnet"], 0, 200000] },
      { method: "setMaxDailyReceiveLimit(uint256)", args: [100] },
    ],
  },
  opmainnet: {
    methods: [
      { method: "setMinDstGas(uint16,uint16,uint256)", args: [LZ_CHAINID["bscmainnet"], 0, 200000] },
      { method: "setMaxDailyReceiveLimit(uint256)", args: [100] },
    ],
  },
  opsepolia: {
    methods: [
      { method: "setMinDstGas(uint16,uint16,uint256)", args: [LZ_CHAINID["bsctestnet"], 0, 200000] },
      { method: "setMaxDailyReceiveLimit(uint256)", args: [100] },
    ],
  },
  basesepolia: {
    methods: [
      { method: "setMinDstGas(uint16,uint16,uint256)", args: [LZ_CHAINID["bsctestnet"], 0, 200000] },
      { method: "setMaxDailyReceiveLimit(uint256)", args: [100] },
    ],
  },
  basemainnet: {
    methods: [
      { method: "setMinDstGas(uint16,uint16,uint256)", args: [LZ_CHAINID["bscmainnet"], 0, 200000] },
      { method: "setMaxDailyReceiveLimit(uint256)", args: [100] },
    ],
  },
  unichainsepolia: {
    methods: [
      { method: "setMinDstGas(uint16,uint16,uint256)", args: [LZ_CHAINID["bsctestnet"], 0, 200000] },
      { method: "setMaxDailyReceiveLimit(uint256)", args: [100] },
    ],
  },
  unichainmainnet: {
    methods: [
      { method: "setMinDstGas(uint16,uint16,uint256)", args: [LZ_CHAINID["bscmainnet"], 0, 200000] },
      { method: "setMaxDailyReceiveLimit(uint256)", args: [100] },
    ],
  },
  berachainbepolia: {
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
