import "module-alias/register";

import "@nomicfoundation/hardhat-chai-matchers";
import "@nomiclabs/hardhat-etherscan";
import "@openzeppelin/hardhat-upgrades";
import "@typechain/hardhat";
import "hardhat-dependency-compiler";
import "hardhat-deploy";
import { HardhatUserConfig, extendConfig, task } from "hardhat/config";
import { HardhatConfig } from "hardhat/types";
import "solidity-coverage";
import "solidity-docgen";

require("dotenv").config();

const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;

extendConfig((config: HardhatConfig) => {
  if (process.env.EXPORT !== "true") {
    config.external = {
      ...config.external,
      deployments: {
        bsctestnet: [
          "node_modules/@venusprotocol/governance-contracts/deployments/bsctestnet",
          "node_modules/@venusprotocol/venus-protocol/deployments/bsctestnet",
        ],
        bscmainnet: [
          "node_modules/@venusprotocol/governance-contracts/deployments/bscmainnet",
          "node_modules/@venusprotocol/venus-protocol/deployments/bscmainnet",
        ],
        sepolia: ["node_modules/@venusprotocol/governance-contracts/deployments/sepolia"],
        ethereum: ["node_modules/@venusprotocol/governance-contracts/deployments/ethereum"],
      },
    };
  }
});

task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  solidity: {
    compilers: [
      {
        version: "0.5.16",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
          outputSelection: {
            "*": {
              "*": ["storageLayout"],
            },
          },
        },
      },
      {
        version: "0.8.25",
        settings: {
          optimizer: {
            enabled: true,
            runs: 10000,
          },
          evmVersion: "paris",
          outputSelection: {
            "*": {
              "*": ["storageLayout"],
            },
          },
        },
      },
    ],
  },
  networks: {
    hardhat: isFork(),
    bsctestnet: {
      url: process.env.ARCHIVE_NODE_bsctestnet || "https://data-seed-prebsc-1-s1.binance.org:8545",
      chainId: 97,
      accounts: DEPLOYER_PRIVATE_KEY ? [`0x${DEPLOYER_PRIVATE_KEY}`] : [],
      gasPrice: 10000000000, // 10 gwei
      gasMultiplier: 10,
      timeout: 12000000,
    },
    bscmainnet: {
      url: process.env.ARCHIVE_NODE_bscmainnet || "https://bsc-dataseed.binance.org/",
      accounts: DEPLOYER_PRIVATE_KEY ? [`0x${DEPLOYER_PRIVATE_KEY}`] : [],
    },
    sepolia: {
      url: process.env.ARCHIVE_NODE_sepolia || "https://ethereum-sepolia.blockpi.network/v1/rpc/public",
      chainId: 11155111,
      live: true,
      gasPrice: 20000000000, // 20 gwei
      accounts: DEPLOYER_PRIVATE_KEY ? [`0x${DEPLOYER_PRIVATE_KEY}`] : [],
    },
    ethereum: {
      url: process.env.ARCHIVE_NODE_ethereum || "https://ethereum.blockpi.network/v1/rpc/public",
      chainId: 1,
      live: true,
      timeout: 1200000, // 20 minutes
      accounts: DEPLOYER_PRIVATE_KEY ? [`0x${DEPLOYER_PRIVATE_KEY}`] : [],
    },
    opbnbtestnet: {
      url: process.env.ARCHIVE_NODE_opbnbtestnet || "https://opbnb-testnet-rpc.bnbchain.org",
      chainId: 5611,
      live: true,
      accounts: DEPLOYER_PRIVATE_KEY ? [`0x${DEPLOYER_PRIVATE_KEY}`] : [],
    },
    opbnbmainnet: {
      url: process.env.ARCHIVE_NODE_opbnbmainnet || "https://opbnb-mainnet-rpc.bnbchain.org",
      chainId: 204,
      live: true,
      gasPrice: 10000000000, // 10 gwei
      accounts: DEPLOYER_PRIVATE_KEY ? [`0x${DEPLOYER_PRIVATE_KEY}`] : [],
    },
    arbitrumsepolia: {
      url: process.env.ARCHIVE_NODE_arbitrumsepolia || "https://sepolia-rollup.arbitrum.io/rpc",
      chainId: 421614,
      live: true,
      accounts: DEPLOYER_PRIVATE_KEY ? [`0x${DEPLOYER_PRIVATE_KEY}`] : [],
    },
    arbitrumone: {
      url: process.env.ARCHIVE_NODE_arbitrumone || "https://arb1.arbitrum.io/rpc",
      chainId: 42161,
      live: true,
      accounts: DEPLOYER_PRIVATE_KEY ? [`0x${DEPLOYER_PRIVATE_KEY}`] : [],
    },
    opsepolia: {
      url: process.env.ARCHIVE_NODE_opsepolia || "https://sepolia.optimism.io",
      chainId: 11155420,
      live: true,
      accounts: DEPLOYER_PRIVATE_KEY ? [`0x${DEPLOYER_PRIVATE_KEY}`] : [],
    },
    opmainnet: {
      url: process.env.ARCHIVE_NODE_opmainnet || "https://mainnet.optimism.io",
      chainId: 10,
      live: true,
      accounts: DEPLOYER_PRIVATE_KEY ? [`0x${DEPLOYER_PRIVATE_KEY}`] : [],
    },
    basesepolia: {
      url: process.env.ARCHIVE_NODE_basesepolia || "https://sepolia.base.org",
      chainId: 84532,
      live: true,
      accounts: DEPLOYER_PRIVATE_KEY ? [`0x${DEPLOYER_PRIVATE_KEY}`] : [],
    },
    basemainnet: {
      url: process.env.ARCHIVE_NODE_basemainnet || "https://mainnet.base.org",
      chainId: 8453,
      live: true,
      accounts: DEPLOYER_PRIVATE_KEY ? [`0x${DEPLOYER_PRIVATE_KEY}`] : [],
    },
    unichainsepolia: {
      url: process.env.ARCHIVE_NODE_unichainsepolia || "https://sepolia.unichain.org",
      chainId: 1301,
      live: true,
      accounts: DEPLOYER_PRIVATE_KEY ? [`0x${DEPLOYER_PRIVATE_KEY}`] : [],
    },
    unichainmainnet: {
      url: process.env.ARCHIVE_NODE_unichainmainnet || "https://mainnet.unichain.org",
      chainId: 130,
      live: true,
      accounts: DEPLOYER_PRIVATE_KEY ? [`0x${DEPLOYER_PRIVATE_KEY}`] : [],
    },
  },
  etherscan: {
    apiKey: {
      bscmainnet: process.env.ETHERSCAN_API_KEY || "ETHERSCAN_API_KEY",
      bsctestnet: process.env.ETHERSCAN_API_KEY || "ETHERSCAN_API_KEY",
      sepolia: process.env.ETHERSCAN_API_KEY || "ETHERSCAN_API_KEY",
      ethereum: process.env.ETHERSCAN_API_KEY || "ETHERSCAN_API_KEY",
      opbnbtestnet: process.env.ETHERSCAN_API_KEY || "ETHERSCAN_API_KEY",
      opbnbmainnet: process.env.ETHERSCAN_API_KEY || "ETHERSCAN_API_KEY",
      arbitrumsepolia: process.env.ETHERSCAN_API_KEY || "ETHERSCAN_API_KEY",
      arbitrumone: process.env.ETHERSCAN_API_KEY || "ETHERSCAN_API_KEY",
      opsepolia: process.env.ETHERSCAN_API_KEY || "ETHERSCAN_API_KEY",
      opmainnet: process.env.ETHERSCAN_API_KEY || "ETHERSCAN_API_KEY",
      basesepolia: process.env.ETHERSCAN_API_KEY || "ETHERSCAN_API_KEY",
      basemainnet: process.env.ETHERSCAN_API_KEY || "ETHERSCAN_API_KEY",
      unichainsepolia: process.env.ETHERSCAN_API_KEY || "ETHERSCAN_API_KEY",
      unichainmainnet: process.env.ETHERSCAN_API_KEY || "ETHERSCAN_API_KEY",
    },
    customChains: [
      {
        network: "bscmainnet",
        chainId: 56,
        urls: {
          apiURL: "https://api.bscscan.com/api",
          browserURL: "https://bscscan.com",
        },
      },
      {
        network: "bsctestnet",
        chainId: 97,
        urls: {
          apiURL: "https://api-testnet.bscscan.com/api",
          browserURL: "https://testnet.bscscan.com",
        },
      },
      {
        network: "sepolia",
        chainId: 11155111,
        urls: {
          apiURL: "https://api-sepolia.etherscan.io/api",
          browserURL: "https://sepolia.etherscan.io",
        },
      },
      {
        network: "ethereum",
        chainId: 1,
        urls: {
          apiURL: "https://api.etherscan.io/api",
          browserURL: "https://etherscan.io",
        },
      },
      {
        network: "opbnbtestnet",
        chainId: 5611,
        urls: {
          apiURL: `https://open-platform.nodereal.io/${process.env.ETHERSCAN_API_KEY}/op-bnb-testnet/contract/`,
          browserURL: "https://testnet.opbnbscan.com/",
        },
      },
      {
        network: "opbnbmainnet",
        chainId: 204,
        urls: {
          apiURL: `https://open-platform.nodereal.io/${process.env.ETHERSCAN_API_KEY}/op-bnb-mainnet/contract/`,
          browserURL: "https://opbnbscan.com/",
        },
      },
      {
        network: "arbitrumsepolia",
        chainId: 421614,
        urls: {
          apiURL: `https://api-sepolia.arbiscan.io/api`,
          browserURL: "https://sepolia.arbiscan.io/",
        },
      },
      {
        network: "arbitrumone",
        chainId: 42161,
        urls: {
          apiURL: `https://api.arbiscan.io/api/`,
          browserURL: "https://arbiscan.io/",
        },
      },
      {
        network: "opsepolia",
        chainId: 11155420,
        urls: {
          apiURL: "https://api-sepolia-optimistic.etherscan.io/api/",
          browserURL: "https://sepolia-optimistic.etherscan.io/",
        },
      },
      {
        network: "opmainnet",
        chainId: 10,
        urls: {
          apiURL: "https://api-optimistic.etherscan.io/api",
          browserURL: "https://optimistic.etherscan.io/",
        },
      },
      {
        network: "basesepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org/",
        },
      },
      {
        network: "basemainnet",
        chainId: 8453,
        urls: {
          apiURL: "https://api.basescan.org/api",
          browserURL: "https://basescan.org/",
        },
      },
      {
        network: "unichainsepolia",
        chainId: 1301,
        urls: {
          apiURL: "https://api-sepolia.uniscan.xyz/api/",
          browserURL: "https://sepolia.uniscan.xyz/",
        },
      },
      {
        network: "unichainmainnet",
        chainId: 130,
        urls: {
          apiURL: "https://api.uniscan.xyz/api/",
          browserURL: "https://uniscan.xyz/",
        },
      },
    ],
  },
  paths: {
    sources: "./contracts",
    tests: "./tests",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  mocha: {
    timeout: 200000000,
  },
  typechain: {
    outDir: "typechain",
    target: "ethers-v5",
  },
  // Hardhat deploy
  namedAccounts: {
    deployer: {
      default: 0, // here this will by default take the first account as deployer
    },
  },
  dependencyCompiler: {
    paths: [
      "@venusprotocol/venus-protocol/contracts/XVSVault/XVSStore.sol",
      "@venusprotocol/venus-protocol/contracts/XVSVault/XVSVaultErrorReporter.sol",
      "@venusprotocol/venus-protocol/contracts/XVSVault/XVSVaultProxy.sol",
      "@venusprotocol/venus-protocol/contracts/XVSVault/XVSVaultStorage.sol",
      "@venusprotocol/venus-protocol/contracts/Tokens/XVS/XVS.sol",
      "hardhat-deploy/solc_0.8/proxy/OptimizedTransparentUpgradeableProxy.sol",
      "hardhat-deploy/solc_0.8/openzeppelin/proxy/transparent/ProxyAdmin.sol",
    ],
  },
  external: {
    contracts: [
      {
        artifacts: "./node_modules/@venusprotocol/venus-protocol/artifacts",
      },
    ],
    deployments: {},
  },
  docgen: {
    outputDir: "./docs",
    pages: "files",
    templates: "docgen-templates",
  },
};

function isFork() {
  return process.env.FORK === "true"
    ? {
        allowUnlimitedContractSize: false,
        loggingEnabled: false,
        forking: {
          url:
            process.env[`ARCHIVE_NODE_${process.env.FORKED_NETWORK}`] ||
            "https://data-seed-prebsc-1-s1.binance.org:8545",
          blockNumber: 21068448,
        },
        accounts: {
          accountsBalance: "1000000000000000000",
        },
        live: false,
      }
    : {
        allowUnlimitedContractSize: true,
        loggingEnabled: false,
        live: false,
      };
}

export default config;
