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
type Config = {
  [key in SUPPORTED_NETWORKS]: {
    methods: { method: string; args: any[] }[];
  };
};

export const config: Config = {
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
  ethereum: {
    methods: [
      { method: "setMaxDailyLimit(uint16,uint256)", args: [101, 100] },
      { method: "updateValidChainId(uint16,bool)", args: [101, true] },
    ],
  },
  hardhat: {
    methods: [
      { method: "setMinDstGas(uint16,uint16,uint256)", args: [10102, 0, 200000] },
      { method: "setMaxDailyReceiveLimit(uint16,uint256)", args: [10102, 100] },
    ],
  },
};
