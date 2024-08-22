import "module-alias/register";

import "@matterlabs/hardhat-zksync";
import "@matterlabs/hardhat-zksync-solc";
import "@matterlabs/hardhat-zksync-verify";
import "@nomicfoundation/hardhat-chai-matchers";
import "hardhat-dependency-compiler";
import "hardhat-deploy";
import { HardhatUserConfig, task } from "hardhat/config";

require("dotenv").config();

const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;

task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  zksolc: {
    version: "1.5.1",
    compilerSource: "binary",
    settings: {
      metadata: {
        // do not include the metadata hash, since this is machine dependent
        // and we want all generated code to be deterministic
        // https://docs.soliditylang.org/en/v0.7.6/metadata.html
        bytecodeHash: "none",
      },
    },
  },
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
    zksyncsepolia: {
      url: process.env.ARCHIVE_NODE_zksyncsepolia || "https://sepolia.era.zksync.dev",
      ethNetwork: "sepolia",
      verifyURL: "https://explorer.sepolia.era.zksync.dev/contract_verification",
      accounts: DEPLOYER_PRIVATE_KEY ? [`0x${DEPLOYER_PRIVATE_KEY}`] : [],
      zksync: true,
      live: true,
    },
    zksyncmainnet: {
      url: process.env.ARCHIVE_NODE_zksync || "https://mainnet.era.zksync.io",
      ethNetwork: "mainnet",
      verifyURL: "https://zksync2-mainnet-explorer.zksync.io/contract_verification",
      accounts: DEPLOYER_PRIVATE_KEY ? [`0x${DEPLOYER_PRIVATE_KEY}`] : [],
      zksync: true,
      live: true,
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./tests",
    cache: "./cache-zk",
    artifacts: "./artifacts-zk",
  },
  mocha: {
    timeout: 200000000,
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
    ],
  },
};

function isFork() {
  return process.env.FORK === "true"
    ? {
        allowUnlimitedContractSize: false,
        loggingEnabled: false,
        forking: {
          url: process.env[`ARCHIVE_NODE_${process.env.FORKED_NETWORK}`] || "https://sepolia.era.zksync.dev",
          blockNumber: 21068448, // TODO: change this
        },
        accounts: {
          accountsBalance: "1000000000000000000",
        },
        live: false,
        zksync: true,
      }
    : {
        allowUnlimitedContractSize: true,
        loggingEnabled: false,
        live: false,
        zksync: true,
      };
}

export default config;
