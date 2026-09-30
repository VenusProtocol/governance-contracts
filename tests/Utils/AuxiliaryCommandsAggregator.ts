import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { SignerWithAddress } from "hardhat-deploy-ethers/signers";

import { AccessControlManager, AuxiliaryCommandsAggregator } from "../../typechain";

const { AddressZero, HashZero } = ethers.constants;
const { defaultAbiCoder, hexConcat, id } = ethers.utils;

const ADD_BATCH = "addBatch((address,string,bytes)[])";
const ADD_BATCH_AT = "addBatch((address,string,bytes)[],uint256)";
const ADD_RAW_BATCH = "addBatch((address,bytes)[])";
const ADD_RAW_BATCH_AT = "addBatch((address,bytes)[],uint256)";
const PERMISSION_SIG = "executeBatch(uint256)";

type Call = { target: string; signature: string; data: string };
type RawCall = { target: string; data: string };

describe("AuxiliaryCommandsAggregator", () => {
  let deployer: SignerWithAddress,
    governance: SignerWithAddress,
    batcher: SignerWithAddress,
    stranger: SignerWithAddress,
    acm: AccessControlManager,
    aggregator: AuxiliaryCommandsAggregator;

  const fixture = async () => {
    [deployer, governance, batcher, stranger] = await ethers.getSigners();

    acm = await (await ethers.getContractFactory("AccessControlManager")).deploy();
    aggregator = (await upgrades.deployProxy(
      await ethers.getContractFactory("AuxiliaryCommandsAggregator"),
      [acm.address],
      { initializer: "initialize" },
    )) as AuxiliaryCommandsAggregator;

    for (const sig of ["addAuthorizedBatchers(address[])", "removeAuthorizedBatchers(address[])", PERMISSION_SIG]) {
      await acm.giveCallPermission(aggregator.address, sig, governance.address);
    }
    await aggregator.connect(governance).addAuthorizedBatchers([batcher.address]);

    return { acm, aggregator };
  };

  // Succeeds only while the aggregator holds DEFAULT_ADMIN_ROLE on the ACM.
  const grantCall = (): Call => ({
    target: acm.address,
    signature: "giveCallPermission(address,string,address)",
    data: defaultAbiCoder.encode(
      ["address", "string", "address"],
      [aggregator.address, PERMISSION_SIG, stranger.address],
    ),
  });

  // No arguments: `data` is empty, so the call is the bare selector. ACM has no fallback, so a
  // wrong selector would revert.
  const zeroArgCall = (): Call => ({ target: acm.address, signature: "DEFAULT_ADMIN_ROLE()", data: "0x" });

  const toRaw = (c: Call): RawCall => ({ target: c.target, data: hexConcat([id(c.signature).slice(0, 10), c.data]) });

  const addBatch = (calls: Call[]) => aggregator.connect(batcher)[ADD_BATCH](calls);
  const addRawBatch = (calls: RawCall[]) => aggregator.connect(batcher)[ADD_RAW_BATCH](calls);

  const missingAdminRole = (account: string) =>
    hexConcat([
      "0x08c379a0",
      defaultAbiCoder.encode(
        ["string"],
        [`AccessControl: account ${account.toLowerCase()} is missing role ${HashZero}`],
      ),
    ]);

  beforeEach(async () => {
    ({ acm, aggregator } = await loadFixture(fixture));
  });

  describe("initialize", () => {
    it("sets the access control manager and owner", async () => {
      expect(await aggregator.accessControlManager()).to.equal(acm.address);
      expect(await aggregator.owner()).to.equal(deployer.address);
    });

    it("reverts if called twice", async () => {
      await expect(aggregator.initialize(acm.address)).to.be.revertedWith(
        "Initializable: contract is already initialized",
      );
    });
  });

  describe("addAuthorizedBatchers", () => {
    it("authorizes each account", async () => {
      await expect(aggregator.connect(governance).addAuthorizedBatchers([stranger.address]))
        .to.emit(aggregator, "AuthorizedBatcherUpdated")
        .withArgs(stranger.address, true);
      expect(await aggregator.authorizedBatchers(stranger.address)).to.equal(true);
    });

    it("reverts if the caller is not allowed", async () => {
      await expect(aggregator.connect(stranger).addAuthorizedBatchers([stranger.address]))
        .to.be.revertedWithCustomError(aggregator, "Unauthorized")
        .withArgs(stranger.address, aggregator.address, "addAuthorizedBatchers(address[])");
    });

    it("reverts if the list is empty", async () => {
      await expect(aggregator.connect(governance).addAuthorizedBatchers([])).to.be.revertedWithCustomError(
        aggregator,
        "InvalidArrayLength",
      );
    });
  });

  describe("removeAuthorizedBatchers", () => {
    it("revokes each account", async () => {
      await expect(aggregator.connect(governance).removeAuthorizedBatchers([batcher.address]))
        .to.emit(aggregator, "AuthorizedBatcherUpdated")
        .withArgs(batcher.address, false);
      expect(await aggregator.authorizedBatchers(batcher.address)).to.equal(false);
    });

    it("reverts if the caller is not allowed", async () => {
      await expect(aggregator.connect(stranger).removeAuthorizedBatchers([batcher.address]))
        .to.be.revertedWithCustomError(aggregator, "Unauthorized")
        .withArgs(stranger.address, aggregator.address, "removeAuthorizedBatchers(address[])");
    });
  });

  describe("addBatch", () => {
    it("stores the calls as given", async () => {
      const calls = [grantCall(), zeroArgCall()];
      expect(await aggregator.connect(batcher).callStatic[ADD_BATCH](calls)).to.equal(0);

      await expect(addBatch(calls)).to.emit(aggregator, "BatchAdded").withArgs(0);

      expect(await aggregator.batchCount()).to.equal(1);
      expect(await aggregator.batchExecuted(0)).to.equal(false);
      const stored = await aggregator.getBatch(0);
      expect(stored.map(c => ({ target: c.target, signature: c.signature, data: c.data }))).to.deep.equal(calls);
    });

    it("accepts the next index as the expected index", async () => {
      await addBatch([zeroArgCall()]);

      await expect(aggregator.connect(batcher)[ADD_BATCH_AT]([zeroArgCall()], 1))
        .to.emit(aggregator, "BatchAdded")
        .withArgs(1);
      expect(await aggregator.batchCount()).to.equal(2);
    });

    it("reverts if the expected index is not the next one", async () => {
      await expect(aggregator.connect(batcher)[ADD_BATCH_AT]([zeroArgCall()], 1))
        .to.be.revertedWithCustomError(aggregator, "InvalidBatchIndex")
        .withArgs(1, 0);
    });

    it("reverts if the caller is not an authorized batcher", async () => {
      await expect(aggregator.connect(stranger)[ADD_BATCH]([zeroArgCall()]))
        .to.be.revertedWithCustomError(aggregator, "NotAllowedToBatchCommands")
        .withArgs(stranger.address);
      await expect(aggregator.connect(stranger)[ADD_BATCH_AT]([zeroArgCall()], 0))
        .to.be.revertedWithCustomError(aggregator, "NotAllowedToBatchCommands")
        .withArgs(stranger.address);
      await expect(aggregator.connect(stranger)[ADD_RAW_BATCH]([toRaw(zeroArgCall())]))
        .to.be.revertedWithCustomError(aggregator, "NotAllowedToBatchCommands")
        .withArgs(stranger.address);
      await expect(aggregator.connect(stranger)[ADD_RAW_BATCH_AT]([toRaw(zeroArgCall())], 0))
        .to.be.revertedWithCustomError(aggregator, "NotAllowedToBatchCommands")
        .withArgs(stranger.address);
    });

    it("reverts if there are no calls", async () => {
      await expect(addBatch([])).to.be.revertedWithCustomError(aggregator, "EmptyCalls");
    });

    it("reverts if a call has an empty signature", async () => {
      await expect(addBatch([zeroArgCall(), { ...zeroArgCall(), signature: "" }]))
        .to.be.revertedWithCustomError(aggregator, "EmptySignature")
        .withArgs(1);
    });

    it("reverts if a call targets an account without code", async () => {
      await expect(addBatch([zeroArgCall(), { ...zeroArgCall(), target: stranger.address }]))
        .to.be.revertedWithCustomError(aggregator, "InvalidTarget")
        .withArgs(1, stranger.address);
    });

    it("reverts if a call targets the zero address", async () => {
      await expect(addBatch([{ ...zeroArgCall(), target: AddressZero }]))
        .to.be.revertedWithCustomError(aggregator, "InvalidTarget")
        .withArgs(0, AddressZero);
    });

    it("stores raw calls with an empty signature", async () => {
      const calls = [toRaw(grantCall()), toRaw(zeroArgCall())];
      expect(await aggregator.connect(batcher).callStatic[ADD_RAW_BATCH](calls)).to.equal(0);

      await expect(addRawBatch(calls)).to.emit(aggregator, "BatchAdded").withArgs(0);

      expect(await aggregator.batchCount()).to.equal(1);
      const stored = await aggregator.getBatch(0);
      expect(stored.map(c => ({ target: c.target, signature: c.signature, data: c.data }))).to.deep.equal(
        calls.map(c => ({ ...c, signature: "" })),
      );
    });

    it("accepts the next index as the expected index for raw calls", async () => {
      await addRawBatch([toRaw(zeroArgCall())]);

      await expect(aggregator.connect(batcher)[ADD_RAW_BATCH_AT]([toRaw(zeroArgCall())], 1))
        .to.emit(aggregator, "BatchAdded")
        .withArgs(1);
      expect(await aggregator.batchCount()).to.equal(2);
    });

    it("reverts if the expected index for raw calls is not the next one", async () => {
      await expect(aggregator.connect(batcher)[ADD_RAW_BATCH_AT]([toRaw(zeroArgCall())], 1))
        .to.be.revertedWithCustomError(aggregator, "InvalidBatchIndex")
        .withArgs(1, 0);
    });

    it("reverts if there are no raw calls", async () => {
      await expect(addRawBatch([])).to.be.revertedWithCustomError(aggregator, "EmptyCalls");
    });

    it("reverts if a raw call's calldata is shorter than a selector", async () => {
      await expect(addRawBatch([{ target: acm.address, data: "0x" }]))
        .to.be.revertedWithCustomError(aggregator, "MissingSelector")
        .withArgs(0);
      await expect(addRawBatch([toRaw(zeroArgCall()), { target: acm.address, data: "0xa217fd" }]))
        .to.be.revertedWithCustomError(aggregator, "MissingSelector")
        .withArgs(1);
    });

    it("reverts if a raw call targets an account without code or the zero address", async () => {
      await expect(addRawBatch([toRaw(zeroArgCall()), { ...toRaw(zeroArgCall()), target: stranger.address }]))
        .to.be.revertedWithCustomError(aggregator, "InvalidTarget")
        .withArgs(1, stranger.address);
      await expect(addRawBatch([{ ...toRaw(zeroArgCall()), target: AddressZero }]))
        .to.be.revertedWithCustomError(aggregator, "InvalidTarget")
        .withArgs(0, AddressZero);
    });
  });

  describe("executeBatch", () => {
    it("sends each raw call's calldata as is", async () => {
      await addRawBatch([toRaw(grantCall()), toRaw(zeroArgCall())]);
      await acm.grantRole(HashZero, aggregator.address);

      await expect(aggregator.connect(governance).executeBatch(0)).to.emit(aggregator, "BatchExecuted").withArgs(0);

      expect(await acm.hasPermission(stranger.address, aggregator.address, PERMISSION_SIG)).to.equal(true);
      expect(await aggregator.batchExecuted(0)).to.equal(true);
    });

    it("executes raw and signature batches side by side", async () => {
      await addRawBatch([toRaw(zeroArgCall())]);
      await addBatch([zeroArgCall()]);

      await expect(aggregator.connect(governance).executeBatch(0)).to.emit(aggregator, "BatchExecuted").withArgs(0);
      await expect(aggregator.connect(governance).executeBatch(1)).to.emit(aggregator, "BatchExecuted").withArgs(1);
    });

    it("reverts with the inner revert data if a raw call fails", async () => {
      await addRawBatch([toRaw(zeroArgCall()), toRaw(grantCall())]);

      await expect(aggregator.connect(governance).executeBatch(0))
        .to.be.revertedWithCustomError(aggregator, "CallFailed")
        .withArgs(0, 1, missingAdminRole(aggregator.address));
    });

    it("executes raw calls for less gas than the same calls with signatures", async () => {
      const calls = [grantCall(), zeroArgCall()];
      await addBatch(calls);
      await addRawBatch(calls.map(toRaw));
      await acm.grantRole(HashZero, aggregator.address);

      const withSignatures = await (await aggregator.connect(governance).executeBatch(0)).wait();
      await acm.revokeCallPermission(aggregator.address, PERMISSION_SIG, stranger.address);
      const raw = await (await aggregator.connect(governance).executeBatch(1)).wait();
      expect(raw.gasUsed).to.be.lt(withSignatures.gasUsed);
    });

    it("calls each target with the selector of its signature and its arguments", async () => {
      await addBatch([grantCall(), zeroArgCall()]);
      await acm.grantRole(HashZero, aggregator.address);

      await expect(aggregator.connect(governance).executeBatch(0)).to.emit(aggregator, "BatchExecuted").withArgs(0);

      expect(await acm.hasPermission(stranger.address, aggregator.address, PERMISSION_SIG)).to.equal(true);
      expect(await aggregator.batchExecuted(0)).to.equal(true);
    });

    it("reverts if the caller is not allowed", async () => {
      await addBatch([zeroArgCall()]);

      await expect(aggregator.connect(stranger).executeBatch(0))
        .to.be.revertedWithCustomError(aggregator, "Unauthorized")
        .withArgs(stranger.address, aggregator.address, PERMISSION_SIG);
    });

    it("reverts if the batch does not exist", async () => {
      await expect(aggregator.connect(governance).executeBatch(0))
        .to.be.revertedWithCustomError(aggregator, "BatchNotFound")
        .withArgs(0);
    });

    it("reverts if the batch was already executed", async () => {
      await addBatch([zeroArgCall()]);
      await aggregator.connect(governance).executeBatch(0);

      await expect(aggregator.connect(governance).executeBatch(0))
        .to.be.revertedWithCustomError(aggregator, "BatchAlreadyExecuted")
        .withArgs(0);
    });

    it("reverts with the inner revert data if a call fails", async () => {
      await addBatch([zeroArgCall(), grantCall()]);

      await expect(aggregator.connect(governance).executeBatch(0))
        .to.be.revertedWithCustomError(aggregator, "CallFailed")
        .withArgs(0, 1, missingAdminRole(aggregator.address));
    });

    it("resets the executed flag when a call reverts", async () => {
      await addBatch([grantCall()]);
      await expect(aggregator.connect(governance).executeBatch(0)).to.be.revertedWithCustomError(
        aggregator,
        "CallFailed",
      );
      expect(await aggregator.batchExecuted(0)).to.equal(false);

      await acm.grantRole(HashZero, aggregator.address);
      await aggregator.connect(governance).executeBatch(0);

      expect(await aggregator.batchExecuted(0)).to.equal(true);
      expect(await acm.hasPermission(stranger.address, aggregator.address, PERMISSION_SIG)).to.equal(true);
    });

    it("executes and reads only the batch at the given index", async () => {
      await addBatch([zeroArgCall()]);
      await addBatch([zeroArgCall(), grantCall()]);
      expect((await aggregator.getBatch(1)).map(c => c.signature)).to.deep.equal([
        zeroArgCall().signature,
        grantCall().signature,
      ]);

      await expect(aggregator.connect(governance).executeBatch(1))
        .to.be.revertedWithCustomError(aggregator, "CallFailed")
        .withArgs(1, 1, missingAdminRole(aggregator.address));

      await acm.grantRole(HashZero, aggregator.address);
      await expect(aggregator.connect(governance).executeBatch(1)).to.emit(aggregator, "BatchExecuted").withArgs(1);
      expect(await aggregator.batchExecuted(1)).to.equal(true);
      expect(await aggregator.batchExecuted(0)).to.equal(false);
    });

    it("blocks re-entry into the batch being executed", async () => {
      await acm.giveCallPermission(aggregator.address, PERMISSION_SIG, aggregator.address);
      await addBatch([
        { target: aggregator.address, signature: PERMISSION_SIG, data: defaultAbiCoder.encode(["uint256"], [0]) },
      ]);

      await expect(aggregator.connect(governance).executeBatch(0))
        .to.be.revertedWithCustomError(aggregator, "CallFailed")
        .withArgs(0, 0, aggregator.interface.encodeErrorResult("BatchAlreadyExecuted", [0]));
    });
  });

  describe("getBatch", () => {
    it("reverts if the batch does not exist", async () => {
      await expect(aggregator.getBatch(0)).to.be.revertedWithCustomError(aggregator, "BatchNotFound").withArgs(0);
    });
  });
});
