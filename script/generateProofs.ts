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
  voterCheckpointsSlotHash?: string;
  voterNumCheckpointsSlotHash?: string;
  voterNumCheckpoints?: number;
  voterXvsVaultNumCheckpointsStorageProofRlp?: string;
  voterCheckpoint?: {
    fromBlockNumber?: string;
    votes?: string;
  };
  voter?: string;
  voterXvsVaultCheckpointsStorageProofRlp?: string;
  proposer?: string
  proposerXvsVaultNumCheckpointsStorageProofRlp?: string;
  proposerCheckpoint?: {
    fromBlockNumber?: string;
    votes?: string;
  };
  proposerNumCheckpoints?: number;
  proposerXvsVaultCheckpointsStorageProofRlp?:string
  proposerNumCheckpointsSlotHash?:string,
  proposerCheckpointsSlotHash?:string;


};

const xvsVault = {
  sepolia: "0x1129f882eAa912aE6D4f6D445b2E2b1eCbA99fd5",
  ethereum: "0xA0882C2D5DF29233A092d2887A258C2b90e9b994",
  opbnbtestnet: "0xB14A0e72C5C202139F78963C9e89252c1ad16f01",
  opbnbmainnet: "0x7dc969122450749A8B0777c0e324522d67737988",
  arbitrumone: "0x8b79692AAB2822Be30a6382Eb04763A74752d5B4",
  arbitrumsepolia: "0x481eb7A1c319d24CE4bE36EF0F4D445CfeE610A5",
  zksyncsepolia: "0x825f9EE3b2b1C159a5444A111A70607f3918564e",
  zksyncmainnet: "0xbbB3C88192a5B0DB759229BeF49DcD1f168F326F",
  opsepolia: "0x18bc9D1A06e6DE53ba89af0242EDF02670786Fc4",
  opmainnet: "0x133120607C018c949E91AE333785519F6d947e01",
  basesepolia: "0xfe6711fC5737143Cd2eFfB0898B4a83e519fa504",
};

const SLOTS = {
  checkpoints: 16,
  numCheckpoint: 17,
};

const directory = `./tests/Syncing-of-votes/syncingParameters/`;
const saveJson = (stringifiedJson: string) => {

  fs.writeFileSync(`${directory}${process.env.REMOTE_NETWORK}Proofs.json`, stringifiedJson);
};

export const getProofsJson = (): ProofData => {
  try {
    const file = fs.readFileSync(`${directory}${process.env.REMOTE_NETWORK}Proofs.json`);
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
  proofsJson.voter = process.env.VOTER;
  proofsJson.proposer = process.env.PROPOSER;

  saveJson(stringify(proofsJson));
};

const generateProofsNumCheckpointsSlot = async (vault: string, rawSlot: number, voter: string, proposer:string) => {
  const proofsJson = getProofsJson();
  const hexSlot = utils.hexlify(rawSlot);
  const voterSlot = getSolidityStorageSlotBytes(hexSlot, voter);
  const proposerSlot = getSolidityStorageSlotBytes(hexSlot, proposer);
  if (!proofsJson.blockNumber) {
    throw new Error("blockNumber is not set");
  }

  const voterNumCheckpointsHex = await network.provider.send("eth_getStorageAt", [
    vault,
    voterSlot,
    hexStripZeros(utils.hexlify(proofsJson.blockNumber)),
  ]);

  const proposerNumCheckpointsHex = await network.provider.send("eth_getStorageAt", [
    vault,
    proposerSlot,
    hexStripZeros(utils.hexlify(proofsJson.blockNumber)),
  ]);

  const voterNumCheckpoints = BigNumber.from(voterNumCheckpointsHex).toNumber();
  const proposerNumCheckpoints = BigNumber.from(proposerNumCheckpointsHex).toNumber();

  const voterRawProofData = await getProof(vault, [voterSlot], proofsJson.blockNumber);
  const proposerRawProofData = await getProof(vault, [proposerSlot], proofsJson.blockNumber);

  const voterStorageProofRlp = formatToProofRLP(voterRawProofData.storageProof[0].proof);
  const proposerStorageProofRlp = formatToProofRLP(proposerRawProofData.storageProof[0].proof);

  proofsJson.voterNumCheckpointsSlotHash = voterSlot;
  proofsJson.proposerNumCheckpointsSlotHash = proposerSlot;

  proofsJson.voterNumCheckpoints = voterNumCheckpoints;
  proofsJson.proposerNumCheckpoints = proposerNumCheckpoints;

  proofsJson.voterXvsVaultNumCheckpointsStorageProofRlp = voterStorageProofRlp;
  proofsJson.voter = voter;

  proofsJson.proposerXvsVaultNumCheckpointsStorageProofRlp = proposerStorageProofRlp;
  proofsJson.proposer = proposer;
  
  saveJson(stringify(proofsJson));
};

const generateXvsVaultProofsByCheckpoint = async (vault: string, rawSlot: number, voter: string, proposer:string) => {
  const hexSlot = utils.hexlify(rawSlot);
  const proofsJson = getProofsJson();

  if (!proofsJson.voterNumCheckpoints && !proofsJson.proposerNumCheckpoints ) {
    throw new Error("NumCheckpoints is zero");
  }

  const voterSlot = getSolidityTwoLevelStorageSlotHash(hexSlot, voter, proofsJson.voterNumCheckpoints - 1);
  const proposerSlot = getSolidityTwoLevelStorageSlotHash(hexSlot, proposer, proofsJson.proposerNumCheckpoints - 1);

  if (!proofsJson.blockNumber) {
    throw new Error("blockNumber is not set");
  }

  const voterCheckpointData = await network.provider.send("eth_getStorageAt", [
    vault,
    voterSlot,
    hexStripZeros(utils.hexlify(proofsJson.blockNumber)),
  ]);
  const proposerCheckpointData = await network.provider.send("eth_getStorageAt", [
    vault,
    proposerSlot,
    hexStripZeros(utils.hexlify(proofsJson.blockNumber)),
  ]);

  const voterFromBlockNumberHex = "0x" + voterCheckpointData.slice(-8);
  const proposerFromBlockNumberHex = "0x" + proposerCheckpointData.slice(-8);
  const voterVotesHex = voterCheckpointData.slice(0, -8);
  const proposerVotesHex = proposerCheckpointData.slice(0, -8);
  const voterFromBlockNumber = BigNumber.from(voterFromBlockNumberHex).toString();
  const proposerFromBlockNumber = BigNumber.from(proposerFromBlockNumberHex).toString();
  const voterVotes = BigNumber.from(voterVotesHex).toString();
  const proposerVotes = BigNumber.from(proposerVotesHex).toString();

  const voterRawProofData = await getProof(vault, [voterSlot], proofsJson.blockNumber);
  const proposerRawProofData = await getProof(vault, [proposerSlot], proofsJson.blockNumber);

  const voterStorageProofRlp = formatToProofRLP(voterRawProofData.storageProof[0].proof);
  const proposerStorageProofRlp = formatToProofRLP(proposerRawProofData.storageProof[0].proof);

  proofsJson.voterCheckpointsSlotHash = voterSlot;
  proofsJson.voterCheckpoint = {
    fromBlockNumber: voterFromBlockNumber,
    votes: voterVotes,
  };
  
  proofsJson.proposerCheckpointsSlotHash = proposerSlot;
  proofsJson.proposerCheckpoint = {
    fromBlockNumber: proposerFromBlockNumber,
    votes: proposerVotes,
  };
  proofsJson.voterXvsVaultCheckpointsStorageProofRlp = voterStorageProofRlp;
  proofsJson.proposerXvsVaultCheckpointsStorageProofRlp = proposerStorageProofRlp;
  saveJson(stringify(proofsJson));
};

const generateJson = async () => {
  const XVS_VAULT = xvsVault[process.env.REMOTE_NETWORK as string];

  await generateRoots(XVS_VAULT, SLOTS.checkpoints, SLOTS.numCheckpoint);
  

  await generateProofsNumCheckpointsSlot(XVS_VAULT, SLOTS.numCheckpoint, process.env.VOTER as string, process.env.PROPOSER as string);

  await generateXvsVaultProofsByCheckpoint(XVS_VAULT, SLOTS.checkpoints, process.env.VOTER as string, process.env.PROPOSER as string);
};

(async () => {
  await generateJson();
})();
