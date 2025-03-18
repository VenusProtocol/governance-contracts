import { FakeContract, MockContract, smock } from "@defi-wonderland/smock";
import { Options } from "@layerzerolabs/lz-v2-utilities";
import { loadFixture, mine } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { Signer } from "ethers";
import { ethers } from "hardhat";
import { SignerWithAddress } from "hardhat-deploy-ethers/signers";

import { BlockHashDispatcher, BlockHashDispatcher__factory, ILayerZeroEndpointV2 } from "../../typechain";

const BSC_EID = 30102;
const ETH_EID = 30101;
const QUOTE_FEE = { nativeFee: 1, lzTokenFee: 0 };
const ZRO_TOKENS = 0;

let owner: SignerWithAddress;
let user: Signer;
let blockHashDispatcher: MockContract<BlockHashDispatcher>;
let endpoint: FakeContract<ILayerZeroEndpointV2>;
let pId: number;
let blockNumber: number;

async function blockHashDispatcherFixture() {
  [owner, user] = await ethers.getSigners();

  const BlockHashDispatcherFactory = await smock.mock<BlockHashDispatcher__factory>("BlockHashDispatcher");
  const endpoint = await smock.fake<ILayerZeroEndpointV2>("ILayerZeroEndpointV2");

  const blockHashDispatcher = await BlockHashDispatcherFactory.deploy(
    endpoint.address,
    owner.address,
    BSC_EID,
    ETH_EID,
  );

  const dummyPeer = ethers.utils.hexZeroPad("0x1234567890abcdef1234567890abcdef12345678", 32); // Random bytes32
  await blockHashDispatcher.setPeer(BSC_EID, dummyPeer);

  return { blockHashDispatcher, endpoint };
}

describe("BlockHashDispatcher", () => {
  beforeEach(async () => {
    ({ blockHashDispatcher, endpoint } = await loadFixture(blockHashDispatcherFixture));
    endpoint.send.returns();
    endpoint.quote.returns(QUOTE_FEE);
    pId = 1;
    blockNumber = await ethers.provider.getBlockNumber();
    await mine();
  });

  describe("Deployment", function () {
    it("should initialize with correct chain EIDs", async function () {
      expect(await blockHashDispatcher.BSC_CHAIN_ID()).to.equal(BSC_EID);
      expect(await blockHashDispatcher.chainId()).to.equal(ETH_EID);
    });

    it("should revert if endpoint is zero address", async function () {
      const BlockHashDispatcherFactory = await smock.mock<BlockHashDispatcher__factory>("BlockHashDispatcher");
      await expect(BlockHashDispatcherFactory.deploy(ethers.constants.AddressZero, owner.address, BSC_EID, ETH_EID)).to
        .be.reverted;
    });

    it("should revert if chain EIDs are zero", async function () {
      const BlockHashDispatcherFactory = await smock.mock<BlockHashDispatcher__factory>("BlockHashDispatcher");
      await expect(
        BlockHashDispatcherFactory.deploy(endpoint.address, owner.address, 0, 0),
      ).to.be.revertedWithCustomError(blockHashDispatcher, "InvalidChainEid");
    });
  });

  describe("Pause/Unpause", function () {
    it("should allow owner to pause and unpause", async function () {
      await blockHashDispatcher.pause();
      expect(await blockHashDispatcher.paused()).to.be.true;

      await blockHashDispatcher.unpause();
      expect(await blockHashDispatcher.paused()).to.be.false;
    });

    it("should revert if non-owner tries to pause", async function () {
      await expect(blockHashDispatcher.connect(user).pause()).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("should revert if non-owner tries to unpause", async function () {
      await blockHashDispatcher.pause();
      await expect(blockHashDispatcher.connect(user).unpause()).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("getPayload & quote", function () {
    it("should generate a valid payload", async function () {
      const payload = await blockHashDispatcher.getPayload(pId, blockNumber);
      const decoded = ethers.utils.defaultAbiCoder.decode(
        ["uint256", "uint256", "bytes32", "uint32"],
        ethers.utils.arrayify(payload),
      );
      expect(decoded[0]).to.equal(pId);
      expect(decoded[1]).to.equal(blockNumber);
      expect(decoded[3]).to.equal(ETH_EID);
    });

    it("should quote messaging fee correctly", async function () {
      const options = Options.newOptions().addExecutorLzReceiveOption(50000, 0).toBytes();
      const result = await blockHashDispatcher.quote(pId, blockNumber, options, false);
      expect(result.nativeFee).to.equal(QUOTE_FEE.nativeFee);
      expect(result.nativeFee).to.equal(QUOTE_FEE.nativeFee);
    });
  });

  describe("getHash", function () {
    it("should return block hash data", async function () {
      const [returnedPId, returnedBlockNum, blockHash, chainId] = await blockHashDispatcher.callStatic.getHash(
        blockNumber,
        pId,
      );
      const block = await ethers.provider.getBlock(blockNumber);
      expect(returnedPId).to.equal(pId);
      expect(returnedBlockNum).to.equal(blockNumber);
      expect(chainId).to.equal(ETH_EID);
      expect(blockHash).to.equal(block.hash);
    });

    it("should revert when paused", async function () {
      await blockHashDispatcher.pause();
      await expect(blockHashDispatcher.getHash(blockNumber, pId)).to.be.revertedWith("Pausable: paused");
    });
  });

  describe("dispatchHash", function () {
    const options = Options.newOptions().addExecutorLzReceiveOption(50000, 0).toBytes();

    it("should emit HashDispatched event", async function () {
      const payload = await blockHashDispatcher.getPayload(pId, blockNumber);

      const tx = await blockHashDispatcher.dispatchHash(pId, blockNumber, ZRO_TOKENS, options, {
        value: QUOTE_FEE.nativeFee,
      });
      await tx.wait();

      await expect(tx).to.emit(blockHashDispatcher, "HashDispatched").withArgs(pId, blockNumber, payload);
    });

    it("should store block hash to mapping", async function () {
      const initialBlock = await ethers.provider.getBlock(blockNumber);
      const expectedHash = initialBlock.hash;

      const tx = await blockHashDispatcher.dispatchHash(pId, blockNumber, ZRO_TOKENS, options, {
        value: QUOTE_FEE.nativeFee,
      });
      await tx.wait();

      // Verify the hash was stored
      const storedHash = await blockHashDispatcher.blockNumToHash(blockNumber);
      const blockHash = await blockHashDispatcher.getBlockHash(blockNumber);

      expect(storedHash).to.equal(expectedHash, "Block hash should be stored on dispatch");
      expect(blockHash).to.equal(expectedHash, "Block hash should be stored on dispatch");
    });

    it("should revert when paused", async function () {
      await blockHashDispatcher.pause();
      await expect(
        blockHashDispatcher.dispatchHash(pId, blockNumber, ZRO_TOKENS, options, { value: QUOTE_FEE.nativeFee }),
      ).to.be.revertedWith("Pausable: paused");
    });
  });
});
