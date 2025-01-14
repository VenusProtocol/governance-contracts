export const Tokens = {
  XVS_VAULT: "0x051100480289e704d20e9DB4804837068f3f9204"
};
export const CONFIG = {
  ETH_TESTNET_BLOCK: 43076711,
  PROPOSAL_CREATOR: "0x6D603081563784dB3f83ef1F65Cc389D94365Ac9",
  VOTER: "0xc444949e0054a23c44fc45789738bdf64aed2391",
  slots: {
    [Tokens.STK_AAVE_TOKEN]: {
      balance: 0,
      exchangeRate: 81,
    },
    [Tokens.A_AAVE_TOKEN]: {
      balance: 52,
      delegation: 64,
    },
    [Tokens.AAVE_TOKEN]: {
      balance: 0,
    },
    [Tokens.GOVERNANCE_REPRESENTATIVE]: {
      representatives: 9,
    },
    [Tokens.XVS_VAULT]: {
      checkpoints: 16,
      numCheckpoints: 17,
    },
  },
};
