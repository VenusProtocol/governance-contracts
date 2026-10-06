import { expect } from "chai";
import { parseEther } from "ethers/lib/utils";
import { ethers } from "hardhat";

import {
  AccessControlManager,
  AccessControlManager__factory,
  AuxiliaryCommandsAggregator,
  AuxiliaryCommandsAggregator__factory,
} from "../../typechain";
import { forking, initMainnetUser } from "./utils";

const FORK_MAINNET = process.env.FORK === "true" && process.env.FORKED_NETWORK === "bscmainnet";

const AGGREGATOR = "0x528A428748dfE73DFcc844176B401475D1831057";
const PROXY_ADMIN = "0x6beb6D2695B67FEb73ad4f172E8E2975497187e4";
const ACM = "0x4788629ABc6cFCA10F9f969efdEAa1cF70c23555";
const NORMAL_TIMELOCK = "0x939bD8d64c0A9583A7Dcea9933f7b21697ab6396";
const BATCHER = "0x9b0A3EAE7f174937d31745B710BbeA68e9D1BEf7";

// Slot of the retired `(target, data)` batches; it holds their count, 5, all executed before this block.
const RETIRED_BATCHES_SLOT = 201;
const RETIRED_BATCH_COUNT = 5;
const PERMISSION_SIG = "executeBatch(uint256)";

if (FORK_MAINNET) {
  forking(124_880_000, () => {
    describe("AuxiliaryCommandsAggregator upgrade", () => {
      let aggregator: AuxiliaryCommandsAggregator;
      let acm: AccessControlManager;
      let ownerBefore: string, pendingOwnerBefore: string, acmBefore: string;

      const retiredSlot = () => ethers.provider.getStorageAt(AGGREGATOR, RETIRED_BATCHES_SLOT);

      before(async () => {
        // Deployed first because it mines a block: Hardhat has no BSC hardfork history, so calls at the
        // fork block itself fail.
        const implementation = await (await ethers.getContractFactory("AuxiliaryCommandsAggregator")).deploy();
        const timelock = await initMainnetUser(NORMAL_TIMELOCK, parseEther("1"));
        aggregator = AuxiliaryCommandsAggregator__factory.connect(AGGREGATOR, timelock);
        acm = AccessControlManager__factory.connect(ACM, timelock);

        ownerBefore = await aggregator.owner();
        pendingOwnerBefore = await aggregator.pendingOwner();
        acmBefore = await aggregator.accessControlManager();
        expect(await aggregator.authorizedBatchers(BATCHER)).to.equal(true);
        expect(await retiredSlot()).to.equal(ethers.utils.hexZeroPad(ethers.utils.hexlify(RETIRED_BATCH_COUNT), 32));

        const proxyAdmin = new ethers.Contract(PROXY_ADMIN, ["function upgrade(address,address)"], timelock);
        await proxyAdmin.upgrade(AGGREGATOR, implementation.address);
      });

      it("keeps the existing state and starts from an empty batch list", async () => {
        expect(await aggregator.owner()).to.equal(ownerBefore);
        expect(await aggregator.pendingOwner()).to.equal(pendingOwnerBefore);
        expect(await aggregator.accessControlManager()).to.equal(acmBefore);
        expect(await aggregator.authorizedBatchers(BATCHER)).to.equal(true);
        expect(await retiredSlot()).to.equal(ethers.utils.hexZeroPad(ethers.utils.hexlify(RETIRED_BATCH_COUNT), 32));
        expect(await aggregator.getBatchCount()).to.equal(0);
      });

      it("executes an ACM grant batch while lent the admin role", async () => {
        const [grantee] = await ethers.getSigners();
        const batcher = await initMainnetUser(BATCHER, parseEther("1"));
        await aggregator.connect(batcher)["addBatch((address,string,bytes)[],uint256)"](
          [
            {
              target: ACM,
              signature: "giveCallPermission(address,string,address)",
              data: ethers.utils.defaultAbiCoder.encode(
                ["address", "string", "address"],
                [AGGREGATOR, PERMISSION_SIG, grantee.address],
              ),
            },
          ],
          0,
        );
        expect(await aggregator.batchExecuted(0)).to.equal(false);

        const adminRole = await acm.DEFAULT_ADMIN_ROLE();
        await acm.grantRole(adminRole, AGGREGATOR);
        await aggregator.executeBatch(0);
        await acm.revokeRole(adminRole, AGGREGATOR);

        // The bscmainnet ACM predates hasPermission, so check the role it derives from (contract, signature).
        const permissionRole = ethers.utils.solidityKeccak256(["address", "string"], [AGGREGATOR, PERMISSION_SIG]);
        expect(await acm.hasRole(permissionRole, grantee.address)).to.equal(true);
        expect(await acm.hasRole(adminRole, AGGREGATOR)).to.equal(false);
        expect(await aggregator.batchExecuted(0)).to.equal(true);
      });

      it("executes a raw batch added with an empty signature", async () => {
        const batcher = await initMainnetUser(BATCHER, parseEther("1"));
        const index = await aggregator.getBatchCount();
        await aggregator
          .connect(batcher)
          ["addBatch((address,string,bytes)[],uint256)"](
            [{ target: ACM, signature: "", data: acm.interface.getSighash("DEFAULT_ADMIN_ROLE") }],
            index,
          );

        expect((await aggregator.getBatch(index))[0].signature).to.equal("");
        await expect(aggregator.executeBatch(index)).to.emit(aggregator, "BatchExecuted").withArgs(index);
      });

      // The upgrade drops the pre-upgrade (target, data) ABI; callers must move to (target, signature, data).
      it("no longer exposes the original addBatch((address,bytes)[]) and batchCount()", async () => {
        const batcher = await initMainnetUser(BATCHER, parseEther("1"));
        const legacy = new ethers.Contract(
          AGGREGATOR,
          [
            "function addBatch((address target, bytes data)[] calls, uint256 expectedIndex) returns (uint256)",
            "function batchCount() view returns (uint256)",
          ],
          batcher,
        );
        const call = { target: ACM, data: acm.interface.getSighash("DEFAULT_ADMIN_ROLE") };

        await expect(legacy.addBatch([call], await aggregator.getBatchCount())).to.be.reverted;
        await expect(legacy.batchCount()).to.be.reverted;
      });
    });
  });
}
