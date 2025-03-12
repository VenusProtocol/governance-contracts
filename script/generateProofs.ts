import "dotenv/config";
import { BigNumber, utils } from "ethers";
import { hexStripZeros, hexZeroPad } from "ethers/lib/utils.js";
import * as fs from "fs";
import { network } from "hardhat";
import stringify from "json-stable-stringify";

import {
  formatToProofRLP,
  getExtendedBlock,
  getProof,
  getSolidityStorageSlotBytes,
  getSolidityTwoLevelStorageSlotHash,
  prepareBLockRLP,
} from "./utils.ts";

export type ProofData = {
  blockNumber?: number;
  blockHash?: string;
  accountStateProofRLP?: string;
  blockHeaderRLP?: string;
  xvsVault?: string;
  checkpointsSlot?: string;
  numCheckpointsSlot?: string;
  checkpointsSlotHash?: string;
  numCheckpointsSlotHash?: string;
  numCheckpoints?: number;
  xvsVaultNumCheckpointsStorageProofRlp?: string;
  checkpoint?: {
    fromBlockNumber?: string;
    votes?: string;
  };
  xvsVaultCheckpointsStorageProofRlp?: string;
  voter?: string;
};

const xvsVault = {
  sepolia: "0x1129f882eAa912aE6D4f6D445b2E2b1eCbA99fd5",
  ethereum: "0xA0882C2D5DF29233A092d2887A258C2b90e9b994",
  opbnbtestnet: "0xB14A0e72C5C202139F78963C9e89252c1ad16f01",
  opbnbmainnet: "0x7dc969122450749A8B0777c0e324522d67737988",
  arbitrumone: "0x8b79692AAB2822Be30a6382Eb04763A74752d5B4",
  arbitrumsepolia: "0x407507DC2809D3aa31D54EcA3BEde5C5c4C8A17F",
  zksyncsepolia: "0x825f9EE3b2b1C159a5444A111A70607f3918564e",
  zksyncmainnet: "0xbbB3C88192a5B0DB759229BeF49DcD1f168F326F",
  opsepolia: "0x4d344e48F02234E82D7D1dB84d0A4A18Aa43Dacc",
  opmainnet: "0x133120607C018c949E91AE333785519F6d947e01",
};

const SLOTS = {
  checkpoints: 16,
  numCheckpoint: 17,
};

const saveJson = (stringifiedJson: string) => {
  fs.writeFileSync(`./tests/Syncing-of-votes/${process.env.REMOTE_NETWORK}Proofs.json`, stringifiedJson);
};

export const getProofsJson = (): ProofData => {
  try {
    const file = fs.readFileSync(`./tests/Syncing-of-votes/syncingParameters/${process.env.REMOTE_NETWORK}Proofs.json`);
    return JSON.parse(file.toString());
  } catch (error) {
    return {};
  }
};

const generateRoots = async (xvsVault: string, numCheckpointSlotRaw: number, checkpointSlotRaw: number) => {
  const proofsJson = getProofsJson();

  if (!proofsJson["xvsVault"]) {
    proofsJson["xvsVault"] = xvsVault;
  }

  // calculate blockHeaderRLP
  const blockData = await getExtendedBlock(parseInt(process.env.BLOCK as string));
  const blockHeaderRLP = prepareBLockRLP(blockData);
  proofsJson.blockHash = blockData.hash;
  proofsJson.blockNumber = BigNumber.from(blockData.number).toNumber();
  proofsJson.blockHeaderRLP = blockHeaderRLP;

  // calculate slots
  const slots: string[] = [];

  const checkpointSlot = hexZeroPad(utils.hexlify(checkpointSlotRaw), 32);
  slots.push(checkpointSlot);
  proofsJson.checkpointsSlot = checkpointSlot;

  const numCheckpointSlot = hexZeroPad(utils.hexlify(numCheckpointSlotRaw), 32);
  slots.push(numCheckpointSlot);
  proofsJson.numCheckpointsSlot = numCheckpointSlot;

  // get account state proof rlp
  const rawAccountProofData = await getProof(xvsVault, slots, proofsJson.blockNumber);
  const accountStateProofRLP = formatToProofRLP(rawAccountProofData.accountProof);
  proofsJson.accountStateProofRLP = accountStateProofRLP;
  saveJson(stringify(proofsJson));
};

const generateProofsNumCheckpointsSlot = async (vault: string, rawSlot: number, voter: string) => {
  const proofsJson = getProofsJson();
  const hexSlot = utils.hexlify(rawSlot);
  const slot = getSolidityStorageSlotBytes(hexSlot, voter);
  if (!proofsJson.blockNumber) {
    throw new Error("blockNumber is not set");
  }

  const numCheckpointsHex = await network.provider.send("eth_getStorageAt", [
    vault,
    slot,
    hexStripZeros(utils.hexlify(proofsJson.blockNumber)),
  ]);

  const numCheckpoints = BigNumber.from(numCheckpointsHex).toNumber();

  const rawProofData = await getProof(vault, [slot], proofsJson.blockNumber);

  const storageProofRlp = formatToProofRLP(rawProofData.storageProof[0].proof);
  proofsJson.numCheckpointsSlotHash = slot;
  proofsJson.numCheckpoints = numCheckpoints;
  proofsJson.xvsVaultNumCheckpointsStorageProofRlp = storageProofRlp;
  proofsJson.voter = voter;
  
  saveJson(stringify(proofsJson));
};

const generateXvsVaultProofsByCheckpoint = async (vault: string, rawSlot: number, voter: string) => {
  const hexSlot = utils.hexlify(rawSlot);
  const proofsJson = getProofsJson();

  if (!proofsJson.numCheckpoints) {
    throw new Error("numCheckpoints is zero");
  }

  const slot = getSolidityTwoLevelStorageSlotHash(hexSlot, voter, proofsJson.numCheckpoints - 1);

  if (!proofsJson.blockNumber) {
    throw new Error("blockNumber is not set");
  }

  const checkpointData = await network.provider.send("eth_getStorageAt", [
    vault,
    slot,
    hexStripZeros(utils.hexlify(proofsJson.blockNumber)),
  ]);

  const fromBlockNumberHex = "0x" + checkpointData.slice(-8);
  const votesHex = checkpointData.slice(0, -8);
  const fromBlockNumber = BigNumber.from(fromBlockNumberHex).toString();
  const votes = BigNumber.from(votesHex).toString();

  const rawProofData = await getProof(vault, [slot], proofsJson.blockNumber);

  const storageProofRlp = formatToProofRLP(rawProofData.storageProof[0].proof);

  proofsJson.checkpointsSlotHash = slot;
  proofsJson.checkpoint = {
    fromBlockNumber,
    votes,
  };
  proofsJson.xvsVaultCheckpointsStorageProofRlp = storageProofRlp;
  saveJson(stringify(proofsJson));
};

const generateJson = async () => {
  const XVS_VAULT = xvsVault[process.env.REMOTE_NETWORK as string];

  await generateRoots(XVS_VAULT, SLOTS.checkpoints, SLOTS.numCheckpoint);

  await generateProofsNumCheckpointsSlot(XVS_VAULT, SLOTS.numCheckpoint, process.env.VOTER as string);

  await generateXvsVaultProofsByCheckpoint(XVS_VAULT, SLOTS.checkpoints, process.env.VOTER as string);
};

(async () => {
  await generateJson();
})();
