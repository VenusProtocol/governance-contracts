import { ethers, providers, utils } from "ethers";
import { defaultAbiCoder, hexStripZeros, hexZeroPad, keccak256 } from "ethers/lib/utils.js";

const provider = new providers.StaticJsonRpcProvider(process.env[`ARCHIVE_NODE_${process.env.REMOTE_NETWORK}`]);

const RLP = require("rlp");

export function formatToProofRLP(rawData) {
  return ethers.utils.RLP.encode(rawData.map(d => ethers.utils.RLP.decode(d)));
}

export const getProof = async (address: string, storageKeys: string[], blockNumber: number) => {
  return await provider.send("eth_getProof", [address, storageKeys, hexStripZeros(utils.hexlify(blockNumber))]);
};

export const getExtendedBlock = async (blockNumber: number) => {
  const blockNumber_ = blockNumber ? hexStripZeros(utils.hexlify(blockNumber)) : "latest";
  return provider.send("eth_getBlockByNumber", [blockNumber_, false]);
};
export function prepareBLockRLP(rawBlock) {
  const blockHeader = [
    rawBlock.parentHash,
    rawBlock.sha3Uncles,
    rawBlock.miner,
    rawBlock.stateRoot,
    rawBlock.transactionsRoot,
    rawBlock.receiptsRoot,
    rawBlock.logsBloom,
    rawBlock.difficulty === "0x0" ? "0x" : rawBlock.difficulty,
    rawBlock.number,
    rawBlock.gasLimit === "0x0" ? "0x" : rawBlock.gasLimit,
    rawBlock.gasUsed === "0x0" ? "0x" : rawBlock.gasUsed,
    rawBlock.timestamp,
    rawBlock.extraData,
    rawBlock.mixHash,
    rawBlock.nonce,
  ];
  if (rawBlock.baseFeePerGas) {
    blockHeader.push(rawBlock.baseFeePerGas === "0x0" ? "0x" : rawBlock.baseFeePerGas);
  }
  if (rawBlock.withdrawalsRoot) {
    blockHeader.push(rawBlock.withdrawalsRoot);
  }
  if (rawBlock.blobGasUsed) {
    blockHeader.push(rawBlock.blobGasUsed === "0x0" ? "0x" : rawBlock.blobGasUsed);
  }
  if (rawBlock.excessBlobGas) {
    blockHeader.push(rawBlock.excessBlobGas === "0x0" ? "0x" : rawBlock.excessBlobGas);
  }
  if (rawBlock.parentBeaconBlockRoot) {
    blockHeader.push(rawBlock.parentBeaconBlockRoot);
  }
  const encodedHeader = RLP.encode(blockHeader);
  const encodedHeaderHex = "0x" + Buffer.from(encodedHeader).toString("hex");

  return encodedHeaderHex;
}

export function getSolidityStorageSlotBytes(
  mappingSlot, //: BytesLike,
  key, //: string
) {
  const slot = hexZeroPad(mappingSlot, 32);
  return hexStripZeros(keccak256(defaultAbiCoder.encode(["address", "uint256"], [key, slot])));
}

export function getSolidityTwoLevelStorageSlotHash(
  rawSlot, // number
  voter, // string
  numCheckpoints, // number
) {
  const abiCoder = new ethers.utils.AbiCoder();
  // ABI Encode the first level of the mapping
  // abi.encode(address(voter), uint256(MAPPING_SLOT))
  // The keccak256 of this value will be the "slot" of the inner mapping
  const firstLevelEncoded = abiCoder.encode(["address", "uint256"], [voter, ethers.BigNumber.from(rawSlot)]);

  // ABI Encode the second level of the mapping
  // abi.encode(uint256(numCheckpoints))
  const secondLevelEncoded = abiCoder.encode(["uint256"], [ethers.BigNumber.from(numCheckpoints)]);

  // Compute the storage slot of [address][uint256]
  // keccak256(abi.encode(uint256(numCheckpoints)) . abi.encode(address(voter), uint256(MAPPING_SLOT)))
  return ethers.utils.keccak256(ethers.utils.concat([secondLevelEncoded, ethers.utils.keccak256(firstLevelEncoded)]));
}
