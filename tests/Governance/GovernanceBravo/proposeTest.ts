import { FakeContract, MockContract, smock } from "@defi-wonderland/smock";
import { loadFixture, mine } from "@nomicfoundation/hardhat-network-helpers";
import chai from "chai";
import { BigNumber, Signer } from "ethers";
import { ethers } from "hardhat";

import { convertToUnit, fundAccount, impersonateSigner, releaseImpersonation } from "../../../helpers/utils";
import {
  AccessControlManager,
  AccessControlManager__factory,
  GovernorBravoDelegate,
  GovernorBravoDelegate__factory,
  TestTimelockV8,
  XVS,
  XVSStore,
  XVSVault,
} from "../../../typechain";
import { ProposalType } from "../util/Proposals";

const { expect } = chai;
chai.use(smock.matchers);

const { encodeParameters } = require("../util/BSC");

let root: Signer;
let voter: Signer;
let whiteListedProposer: Signer;
let nonWhiteListedProposer: Signer;
let accounts: Signer[];
let governorBravoDelegate: MockContract<GovernorBravoDelegate>;
let xvsVault: FakeContract<XVSVault>;
let xvsToken: FakeContract<XVS>;
let normalTimelock: FakeContract<TestTimelockV8>;
let accessControlManager: MockContract<AccessControlManager>;
type GovernorBravoDelegateFixture = {
  governorBravoDelegate: MockContract<GovernorBravoDelegate>;
  xvsVault: FakeContract<XVSVault>;
  xvsStore: FakeContract<XVSStore>;
  xvsToken: FakeContract<XVS>;
  normalTimelock: FakeContract<TestTimelockV8>;
  accessControlManager: MockContract<AccessControlManager>;
};

async function governorBravoFixture(): Promise<GovernorBravoDelegateFixture> {
  const GovernorBravoDelegateFactory = await smock.mock<GovernorBravoDelegate__factory>("GovernorBravoDelegate");
  const governorBravoDelegate = await GovernorBravoDelegateFactory.deploy();
  const xvsVault = await smock.fake<XVSVault>("MockXVSVault");
  const xvsStore = await smock.fake<XVSStore>("XVSStore");
  const xvsToken = await smock.fake<XVS>("XVS");
  const normalTimelock = await smock.fake<TestTimelockV8>("TestTimelockV8");
  const accessControlManagerFactory = await smock.mock<AccessControlManager__factory>("AccessControlManager");
  const accessControlManager = await accessControlManagerFactory.deploy();
  return { governorBravoDelegate, xvsVault, xvsStore, xvsToken, normalTimelock, accessControlManager };
}

const proposalConfigs = {
  // ProposalType.NORMAL
  0: {
    votingDelay: 1,
    votingPeriod: 4,
    proposalThreshold: convertToUnit("150000", 18),
  },
  // ProposalType.FASTTRACK
  1: {
    votingDelay: 1,
    votingPeriod: 8,
    proposalThreshold: convertToUnit("200000", 18),
  },
  // ProposalType.CRITICAL
  2: {
    votingDelay: 1,
    votingPeriod: 16,
    proposalThreshold: convertToUnit("250000", 18),
  },
};

let targets: any[], values: string | any[], signatures: string | any[], callDatas: string | any[];
describe("Governor Bravo Propose Tests", () => {
  let rootAddress: string;
  let proposalId: BigNumber;
  let trivialProposal: any;
  let proposalBlock: number;
  beforeEach(async () => {
    [root, voter, ...accounts] = await ethers.getSigners();
    rootAddress = await root.getAddress();
    whiteListedProposer = accounts[4];
    nonWhiteListedProposer = accounts[5];
    targets = [rootAddress];
    values = ["0"];
    signatures = ["getBalanceOf(address)"];
    callDatas = [encodeParameters(["address"], [rootAddress])];
    const contracts = await loadFixture(governorBravoFixture);
    ({ governorBravoDelegate, xvsVault, xvsToken, normalTimelock, accessControlManager } = contracts);
    await governorBravoDelegate.setVariable("admin", await root.getAddress());
    await governorBravoDelegate.setVariable("guardian", await root.getAddress());
    await governorBravoDelegate.setVariable("initialProposalId", 1);
    await governorBravoDelegate.setVariable("proposalCount", 1);
    await governorBravoDelegate.setVariable("xvsVault", xvsVault.address);
    await governorBravoDelegate.setVariable("proposalMaxOperations", 10);
    await governorBravoDelegate.setVariable("proposalTimelocks", {
      0: normalTimelock.address,
    });
    await governorBravoDelegate.setVariable("_accessControlManager", accessControlManager.address);
    xvsToken.balanceOf.returns(400001);
    xvsVault.getPriorVotes.returns(convertToUnit("300000", 18));
    await governorBravoDelegate.setVariable("proposalConfigs", proposalConfigs);
    await governorBravoDelegate.propose(targets, values, signatures, callDatas, "do nothing", ProposalType.CRITICAL);
    proposalBlock = (await ethers.provider.getBlock("latest")).number;
    proposalId = await governorBravoDelegate.latestProposalIds(rootAddress);
    trivialProposal = await governorBravoDelegate.proposals(proposalId);
  });
  describe("simple initialization", () => {
    it("ID is set to a globally unique identifier", async () => {
      expect(trivialProposal.id).to.equal(proposalId);
    });

    it("Proposer is set to the sender", async () => {
      expect(trivialProposal.proposer).to.equal(rootAddress);
    });

    it("Start block is set to the current block number plus vote delay", async () => {
      expect(trivialProposal.startBlock).to.equal(proposalBlock + 1 + "");
    });

    it("End block is set to the current block number plus the sum of vote delay and vote period", async () => {
      expect(trivialProposal.endBlock).to.equal(
        proposalBlock + proposalConfigs[2].votingDelay + proposalConfigs[2].votingPeriod,
      );
    });

    it("ForVotes and AgainstVotes are initialized to zero", async () => {
      expect(trivialProposal.forVotes).to.equal("0");
      expect(trivialProposal.againstVotes).to.equal("0");
    });

    it("Executed and Canceled flags are initialized to false", async () => {
      expect(trivialProposal.canceled).to.equal(false);
      expect(trivialProposal.executed).to.equal(false);
    });

    it("ETA is initialized to zero", async () => {
      expect(trivialProposal.eta).to.equal("0");
    });

    it("Targets, Values, Signatures, Calldatas are set according to parameters", async () => {
      const dynamicFields = await governorBravoDelegate.getActions(trivialProposal.id);
      expect(dynamicFields.targets).to.deep.equal([rootAddress]);
      // values cannot be get with .values since it is reserved word and returns function
      expect(dynamicFields[1]).to.deep.equal(values);
      expect(dynamicFields.signatures).to.deep.equal(signatures);
      expect(dynamicFields.calldatas).to.deep.equal(callDatas);
    });

    describe("This function must revert if", () => {
      it("the length of the values, signatures or calldatas arrays are not the same length", async () => {
        await expect(
          governorBravoDelegate.propose(
            targets.concat(rootAddress),
            values,
            signatures,
            callDatas,
            "do nothing",
            ProposalType.CRITICAL,
          ),
        ).to.be.rejectedWith('ArityMismatch("targets, values, signatures, calldatas")');

        await expect(
          governorBravoDelegate.propose(
            targets,
            values.concat(rootAddress.toString()),
            signatures,
            callDatas,
            "do nothing",
            ProposalType.CRITICAL,
          ),
        ).to.be.rejectedWith('ArityMismatch("targets, values, signatures, calldatas")');

        await expect(
          governorBravoDelegate.propose(
            targets,
            values,
            signatures.concat(rootAddress.toString()),
            callDatas,
            "do nothing",
            ProposalType.CRITICAL,
          ),
        ).to.be.rejectedWith('ArityMismatch("targets, values, signatures, calldatas")');

        await expect(
          governorBravoDelegate.propose(
            targets.concat(rootAddress.toString()),
            values,
            signatures,
            callDatas,
            "do nothing",
            ProposalType.CRITICAL,
          ),
        ).to.be.rejectedWith('ArityMismatch("targets, values, signatures, calldatas")');
      });

      it("or if that length is zero or greater than Max Operations", async () => {
        await expect(
          governorBravoDelegate.propose([], [], [], [], "do nothing", ProposalType.CRITICAL),
        ).to.be.rejectedWith("NoActionsProvided");
      });

      describe("Additionally, if there exists a pending or active proposal from the same proposer, we must revert.", () => {
        it("reverts with pending", async () => {
          await expect(
            governorBravoDelegate.propose(targets, values, signatures, callDatas, "do nothing", ProposalType.CRITICAL),
          ).to.be.rejectedWith("OneLiveProposalPerProposer");
        });
        it("reverts with active", async () => {
          await mine();
          await mine();

          await expect(
            governorBravoDelegate.propose(targets, values, signatures, callDatas, "do nothing", ProposalType.CRITICAL),
          ).to.be.rejectedWith("OneLiveProposalPerProposer");
        });
      });
    });

    it("This function returns the id of the newly created proposal. # proposalId(n) = succ(proposalId(n-1))", async () => {
      await mine();

      await governorBravoDelegate
        .connect(voter)
        .propose(targets, values, signatures, callDatas, "yoot", ProposalType.CRITICAL);

      const nextProposalId = await governorBravoDelegate.latestProposalIds(await voter.getAddress());
      expect(+nextProposalId).to.be.equal(+trivialProposal.id + 1);
    });

    it("emits log with id and description", async () => {
      await mine();
      await governorBravoDelegate
        .connect(accounts[3])
        .propose(targets, values, signatures, callDatas, "yoot", ProposalType.CRITICAL);

      const nextProposalId = await governorBravoDelegate.latestProposalIds(await voter.getAddress());

      const currentBlockNumber = (await ethers.provider.getBlock("latest")).number;
      const proposeStartBlock = currentBlockNumber + proposalConfigs[2].votingDelay;
      const proposeEndBlock = proposeStartBlock + proposalConfigs[2].votingPeriod;

      expect(
        await governorBravoDelegate
          .connect(voter)
          .propose(targets, values, signatures, callDatas, "second proposal", ProposalType.CRITICAL),
      )
        .to.emit(governorBravoDelegate, "ProposalCreated")
        .withArgs(
          nextProposalId,
          targets,
          values,
          signatures,
          callDatas,
          proposeStartBlock,
          proposeEndBlock,
          "second proposal",
          voter,
        );
    });
  });

  describe("whitelisted proposer", () => {
    describe("whitelist ACM", () => {
      it("should error if permission not granted", async () => {
        const normalTimelockSigner = await impersonateSigner(normalTimelock.address);
        await fundAccount(normalTimelock.address);
        await expect(
          governorBravoDelegate
            .connect(normalTimelockSigner)
            .whitelistProposer(await whiteListedProposer.getAddress(), ProposalType.NORMAL),
        ).to.be.rejectedWith("Unauthorized");
        await releaseImpersonation(normalTimelock.address);
      });

      it("should allow the guardian to remove from the whitelist without ACM permissions", async () => {
        await expect(
          governorBravoDelegate
            .connect(root)
            .removeWhitelistedProposer(await whiteListedProposer.getAddress(), ProposalType.NORMAL),
        )
          .to.emit(governorBravoDelegate, "WhitelistedProposerRemoved")
          .withArgs(await whiteListedProposer.getAddress(), ProposalType.NORMAL);
      });
    });

    describe("whitelisted proposer flow", () => {
      beforeEach(async () => {
        // Authorize timelock with ACM
        await expect(
          accessControlManager
            .connect(root)
            .giveCallPermission(
              governorBravoDelegate.address,
              "whitelistProposer(address,ProposalType)",
              normalTimelock.address,
            ),
        )
          .to.emit(accessControlManager, "PermissionGranted")
          .withArgs(normalTimelock.address, governorBravoDelegate.address, "whitelistProposer(address,ProposalType)");
        await expect(
          accessControlManager
            .connect(root)
            .giveCallPermission(
              governorBravoDelegate.address,
              "removeWhitelistedProposer(address,ProposalType)",
              normalTimelock.address,
            ),
        )
          .to.emit(accessControlManager, "PermissionGranted")
          .withArgs(
            normalTimelock.address,
            governorBravoDelegate.address,
            "removeWhitelistedProposer(address,ProposalType)",
          );
      });

      it("should be able to add to whitelist", async () => {
        const normalTimelockSigner = await impersonateSigner(normalTimelock.address);
        await fundAccount(normalTimelock.address);

        await expect(
          governorBravoDelegate
            .connect(normalTimelockSigner)
            .whitelistProposer(await whiteListedProposer.getAddress(), ProposalType.NORMAL),
        )
          .to.emit(governorBravoDelegate, "WhitelistedProposerAdded")
          .withArgs(await whiteListedProposer.getAddress(), ProposalType.NORMAL);
        await releaseImpersonation(normalTimelock.address);
        expect(
          await governorBravoDelegate.whitelistedProposers(await whiteListedProposer.getAddress(), ProposalType.NORMAL),
        ).to.equal(true);
      });

      it("should be able to remove from whitelist", async () => {
        const normalTimelockSigner = await impersonateSigner(normalTimelock.address);
        await fundAccount(normalTimelock.address);
        await expect(
          governorBravoDelegate
            .connect(normalTimelockSigner)
            .whitelistProposer(await nonWhiteListedProposer.getAddress(), ProposalType.NORMAL),
        )
          .to.emit(governorBravoDelegate, "WhitelistedProposerAdded")
          .withArgs(await nonWhiteListedProposer.getAddress(), ProposalType.NORMAL);
        await expect(
          governorBravoDelegate
            .connect(normalTimelockSigner)
            .removeWhitelistedProposer(await nonWhiteListedProposer.getAddress(), ProposalType.NORMAL),
        )
          .to.emit(governorBravoDelegate, "WhitelistedProposerRemoved")
          .withArgs(await nonWhiteListedProposer.getAddress(), ProposalType.NORMAL);
        await releaseImpersonation(normalTimelock.address);
      });

      it("should not be able to propose if not whitelisted with no voting power", async () => {
        xvsVault.getPriorVotes.returns("0");
        await expect(
          governorBravoDelegate
            .connect(nonWhiteListedProposer)
            .propose(targets, values, signatures, callDatas, "do nothing", ProposalType.CRITICAL),
        ).to.be.rejectedWith("InsufficientVotingPower");
      });

      it("should not be able to propose if whitelisted address proposes with wrong timelock", async () => {
        xvsVault.getPriorVotes.returns("0");
        const normalTimelockSigner = await impersonateSigner(normalTimelock.address);
        await fundAccount(normalTimelock.address);
        await governorBravoDelegate
          .connect(normalTimelockSigner)
          .whitelistProposer(await whiteListedProposer.getAddress(), ProposalType.NORMAL);
        expect(
          await governorBravoDelegate.whitelistedProposers(await whiteListedProposer.getAddress(), ProposalType.NORMAL),
        ).to.equal(true);
        await expect(
          governorBravoDelegate
            .connect(whiteListedProposer)
            .propose(targets, values, signatures, callDatas, "do nothing", ProposalType.CRITICAL),
        ).to.be.rejectedWith("InsufficientVotingPower");
        await releaseImpersonation(normalTimelock.address);
      });

      it("should be able to propose if whitelisted with no voting power", async () => {
        xvsVault.getPriorVotes.returns("0");
        const normalTimelockSigner = await impersonateSigner(normalTimelock.address);
        await fundAccount(normalTimelock.address);
        await governorBravoDelegate
          .connect(normalTimelockSigner)
          .whitelistProposer(await whiteListedProposer.getAddress(), ProposalType.NORMAL);
        expect(
          await governorBravoDelegate.whitelistedProposers(await whiteListedProposer.getAddress(), ProposalType.NORMAL),
        ).to.equal(true);
        await governorBravoDelegate
          .connect(whiteListedProposer)
          .propose(targets, values, signatures, callDatas, "do nothing", ProposalType.NORMAL);
        await releaseImpersonation(normalTimelock.address);
      });
    });
  });

  describe("whitelisted proposer flow", () => {
    beforeEach(async () => {
      // Authorize timelock with ACM
      await expect(
        accessControlManager
          .connect(root)
          .giveCallPermission(
            governorBravoDelegate.address,
            "whitelistProposer(address,ProposalType)",
            normalTimelock.address,
          ),
      )
        .to.emit(accessControlManager, "PermissionGranted")
        .withArgs(normalTimelock.address, governorBravoDelegate.address, "whitelistProposer(address,ProposalType)");
      await expect(
        accessControlManager
          .connect(root)
          .giveCallPermission(
            governorBravoDelegate.address,
            "removeWhitelistedProposer(address)",
            normalTimelock.address,
          ),
      )
        .to.emit(accessControlManager, "PermissionGranted")
        .withArgs(normalTimelock.address, governorBravoDelegate.address, "removeWhitelistedProposer(address)");
    });

    it("should not be able to propose if not whitelisted with no voting power", async () => {
      xvsVault.getPriorVotes.returns("0");
      await expect(
        governorBravoDelegate
          .connect(nonWhiteListedProposer)
          .propose(targets, values, signatures, callDatas, "do nothing", ProposalType.CRITICAL),
      ).to.be.rejectedWith("InsufficientVotingPower");
    });
  });
});
