interface AdminAccounts {
  [key: string]: string;
}

export const acmAdminAccount: AdminAccounts = {
  bsctestnet: "0xce10739590001705F7FF231611ba4A48B2820327", // NORMAL TIMELOCK
  bscmainnet: "0x939bD8d64c0A9583A7Dcea9933f7b21697ab6396", // NORMAL TIMELOCK
  sepolia: "0x94fa6078b6b8a26f0b6edffbe6501b22a10470fb", // SEPOLIA MULTISIG
  ethereum: "", // TODO: add Ethereum MULTISIG once it is deployed
};
