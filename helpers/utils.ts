import BigNumber from "bignumber.js";
import { ethers, network } from "hardhat";
import * as helpers from "@nomicfoundation/hardhat-network-helpers"

BigNumber.config({
  FORMAT: {
    decimalSeparator: ".",
    groupSize: 0,
    groupSeparator: "",
    secondaryGroupSize: 0,
    fractionGroupSeparator: "",
    fractionGroupSize: 0,
  },
  ROUNDING_MODE: BigNumber.ROUND_DOWN,
  EXPONENTIAL_AT: 1e9,
});

export const convertToUnit = (amount: string | number, decimals: number) => {
  return new BigNumber(amount).times(new BigNumber(10).pow(decimals)).toString();
};

export const convertToBigInt = (amount: string | number, decimals: number) => {
  return BigInt(convertToUnit(amount, decimals));
};

export const fundAccount = async (address: string, amount: string = "1.0") => {
  await helpers.setBalance(address, ethers.utils.parseEther(amount));
};

export const impersonateSigner = async (address: string) => {
  await network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [address],
  });
  const signer = await ethers.getSigner(address);
  return signer;
};

export const releaseImpersonation = async (address: string) => {
  await network.provider.request({
    method: "hardhat_stopImpersonatingAccount",
    params: [address],
  });
};

// Function to get argument types from method signature
export const getArgTypesFromSignature = (methodSignature: string): string[] => {
  const [, argumentString] = methodSignature.split("(")[1].split(")");
  return argumentString.split(",").map(arg => arg.trim());
};


export async function setForkBlock(blockNumber: number) {
  await network.provider.request({
    method: "hardhat_reset",
    params: [
      {
        forking: {
          jsonRpcUrl: process.env[`ARCHIVE_NODE_${process.env.FORKED_NETWORK || "bscmainnet"}`],
          blockNumber: blockNumber,
        },
      },
    ],
  });
}
