import { ethers } from "ethers";
import * as fs from "fs";
import * as path from "path";

import { Network } from "./types";

export const TOOL_DIR = __dirname;
export const REGISTRY_DIR = path.join(TOOL_DIR, "registry");
export const SNAPSHOTS_DIR = path.join(TOOL_DIR, "snapshots");
export const snapshotDir = (n: Network) => path.join(SNAPSHOTS_DIR, n);
export const WILDCARD = "0x0000000000000000000000000000000000000000";
export const DEFAULT_ADMIN_ROLE = "0x" + "0".repeat(64);
export const TIMELOCK_NAMES = ["NormalTimelock", "FastTrackTimelock", "CriticalTimelock"];
export const isLegacyAcm = (n: Network) => n === "bscmainnet";

// Copied from the deleted scripts/ACMPermissions/config.ts (git history) — ACM deployment blocks.
export const STARTING_BLOCKS: Record<Network, number> = {
  bscmainnet: 21968139,
  bsctestnet: 26711168,
  ethereum: 18641314,
  sepolia: 4204345,
  opbnbmainnet: 10895878,
  opbnbtestnet: 14542763,
  arbitrumone: 201597544,
  arbitrumsepolia: 25350320,
  zksyncmainnet: 42301367,
  zksyncsepolia: 3452622,
  opmainnet: 125490540,
  opsepolia: 14150254,
  basemainnet: 23212004,
  basesepolia: 16737042,
  unichainsepolia: 3358050,
  unichainmainnet: 8106529,
};

// Public fallbacks copied verbatim from hardhat.config.ts / hardhat.config.zksync.ts network `url` defaults.
const PUBLIC_RPC: Record<Network, string> = {
  bscmainnet: "https://bsc-dataseed.binance.org/",
  bsctestnet: "https://data-seed-prebsc-1-s1.binance.org:8545",
  ethereum: "https://ethereum.blockpi.network/v1/rpc/public",
  sepolia: "https://ethereum-sepolia.blockpi.network/v1/rpc/public",
  opbnbmainnet: "https://opbnb-mainnet-rpc.bnbchain.org",
  opbnbtestnet: "https://opbnb-testnet-rpc.bnbchain.org",
  arbitrumone: "https://arb1.arbitrum.io/rpc",
  arbitrumsepolia: "https://sepolia-rollup.arbitrum.io/rpc",
  zksyncmainnet: "https://mainnet.era.zksync.io",
  zksyncsepolia: "https://sepolia.era.zksync.dev",
  opmainnet: "https://mainnet.optimism.io",
  opsepolia: "https://sepolia.optimism.io",
  basemainnet: "https://mainnet.base.org",
  basesepolia: "https://sepolia.base.org",
  unichainmainnet: "https://mainnet.unichain.org",
  unichainsepolia: "https://sepolia.unichain.org",
};
export const rpcUrl = (n: Network): string => process.env[`ARCHIVE_NODE_${n}`] || PUBLIC_RPC[n];

// Guardian multisigs, copied from helpers/deploy/deploymentUtils.ts `guardian()` plus
// (bscmainnet's three, bsctestnet's one) from the deleted old config.ts addressMap.
// All literals checksummed via ethers.utils.getAddress.
export const GUARDIANS: Record<Network, string[]> = {
  bscmainnet: [
    "0x7B1AE5Ea599bC56734624b95589e7E8E64C351c9",
    "0x1C2CAc6ec528c20800B2fe734820D87b581eAA6B",
    "0x3a3284dC0FaFfb0b5F0d074c4C704D14326C98cF",
  ],
  bsctestnet: ["0x2Ce1d0ffD7E869D9DF33e28552b12DdDed326706"],
  ethereum: ["0x285960C5B22fD66A736C7136967A3eB15e93CC67"],
  sepolia: ["0x94fa6078b6b8a26F0B6EDFFBE6501B22A10470fB"],
  opbnbmainnet: ["0xC46796a21a3A9FAB6546aF3434F2eBfFd0604207"],
  opbnbtestnet: ["0xb15f6EfEbC276A3b9805df81b5FB3D50C2A62BDf"],
  arbitrumone: ["0x14e0E151b33f9802b3e75b621c1457afc44DcAA0"],
  arbitrumsepolia: ["0x1426A5Ae009c4443188DA8793751024E358A61C2"],
  zksyncmainnet: ["0x751Aa759cfBB6CE71A43b48e40e1cCcFC66Ba4aa"],
  zksyncsepolia: ["0xa2f83de95E9F28eD443132C331B6a9C9B7a9F866"],
  opmainnet: ["0x2e94dd14E81999CdBF5deDE31938beD7308354b3"],
  opsepolia: ["0xd57365EE4E850e881229e2F8Aa405822f289e78d"],
  basemainnet: ["0x1803Cf1D3495b43cC628aa1d8638A981F8CD341C"],
  basesepolia: ["0xdf3b635d2b535f906BB02abb22AED71346E36a00"],
  unichainmainnet: ["0x1803Cf1D3495b43cC628aa1d8638A981F8CD341C"],
  unichainsepolia: ["0x9831D3A641E8c7F082EEA75b8249c99be9D09a34"],
};

export function acmAddress(n: Network): string {
  const file = path.join(TOOL_DIR, "..", "..", "deployments", `${n}_addresses.json`);
  const { addresses } = JSON.parse(fs.readFileSync(file, "utf8"));
  if (!addresses?.AccessControlManager) throw new Error(`No AccessControlManager in deployments for ${n}`);
  return ethers.utils.getAddress(addresses.AccessControlManager);
}
