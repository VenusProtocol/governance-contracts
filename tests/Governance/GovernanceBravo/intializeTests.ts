import { FakeContract, MockContract, smock } from "@defi-wonderland/smock";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import chai from "chai";
import { Signer } from "ethers";
import { ethers } from "hardhat";

import {
  AccessControlManager,
  AccessControlManager__factory,
  GovernorBravoDelegate,
  GovernorBravoDelegate__factory,
  XVSVault,
} from "../../../typechain";

const { expect } = chai;
chai.use(smock.matchers);

let root: Signer;
let customer: Signer;
let accounts: Signer[];
let governorBravoDelegate: MockContract<GovernorBravoDelegate>;
let xvsVault: FakeContract<XVSVault>;
let accessControlManager: MockContract<AccessControlManager>;

type GovernorBravoDelegateFixture = {
  governorBravoDelegate: MockContract<GovernorBravoDelegate>;
  xvsVault: FakeContract<XVSVault>;
  accessControlManager: MockContract<AccessControlManager>;
};

async function governorBravoFixture(): Promise<GovernorBravoDelegateFixture> {
  const GovernorBravoDelegateFactory = await smock.mock<GovernorBravoDelegate__factory>("GovernorBravoDelegate");
  const governorBravoDelegate = await GovernorBravoDelegateFactory.deploy();
  const xvsVault = await smock.fake<XVSVault>("MockXVSVault");
  const accessControlFactory = await smock.mock<AccessControlManager__factory>("AccessControlManager");
  const accessControlManager = await accessControlFactory.deploy();
  return { governorBravoDelegate, xvsVault, accessControlManager };
}

describe("Governor Bravo Initializing Test", () => {
  beforeEach(async () => {
    [root, customer, ...accounts] = await ethers.getSigners();
    const contracts = await loadFixture(governorBravoFixture);
    ({ governorBravoDelegate, xvsVault, accessControlManager } = contracts);
    await governorBravoDelegate.setVariable("admin", await root.getAddress());
  });

  describe("initilizer", () => {
    it("should revert if not called by admin", async () => {
      await expect(
        governorBravoDelegate
          .connect(customer)
          .initialize(ethers.constants.AddressZero, [], [], ethers.constants.AddressZero, ethers.constants.AddressZero),
      ).to.be.rejectedWith("OnlyAdmin");
    });

    it("should revert if invalid xvs address", async () => {
      await expect(
        governorBravoDelegate.initialize(
          ethers.constants.AddressZero,
          [],
          [],
          ethers.constants.AddressZero,
          ethers.constants.AddressZero,
        ),
      ).to.be.rejectedWith("ZeroAddressNotAllowed");
    });

    it("should revert if invalid guardian address", async () => {
      await expect(
        governorBravoDelegate.initialize(
          xvsVault.address,
          [],
          [],
          ethers.constants.AddressZero,
          ethers.constants.AddressZero,
        ),
      ).to.be.rejectedWith("ZeroAddressNotAllowed");
    });

    it("should revert if invalid access control manager address", async () => {
      const guardianAddress = await accounts[0].getAddress();
      const minVotingDelay = await governorBravoDelegate.MIN_VOTING_DELAY();
      const minVotingPeriod = await governorBravoDelegate.MIN_VOTING_PERIOD();
      const minProposalThreshold = await governorBravoDelegate.MIN_PROPOSAL_THRESHOLD();
      const proposalConfigs = [
        {
          votingDelay: minVotingDelay.add(10),
          votingPeriod: minVotingPeriod.add(100),
          proposalThreshold: minProposalThreshold.add(100),
        },
        {
          votingDelay: minVotingDelay.add(10),
          votingPeriod: minVotingPeriod.add(100),
          proposalThreshold: minProposalThreshold.add(100),
        },
        {
          votingDelay: minVotingDelay.add(10),
          votingPeriod: minVotingPeriod.add(100),
          proposalThreshold: minProposalThreshold.add(100),
        },
      ];

      const timelocks = [accounts[0].getAddress(), accounts[1].getAddress(), accounts[2].getAddress()];
      await expect(
        governorBravoDelegate.initialize(
          xvsVault.address,
          proposalConfigs,
          timelocks,
          guardianAddress,
          ethers.constants.AddressZero,
        ),
      ).to.be.revertedWith("invalid acess control manager address");
    });

    it("should revert if timelock adress count differs from governance routes count", async () => {
      const guardianAddress = await accounts[0].getAddress();

      const timelocks = [accounts[0].getAddress(), accounts[1].getAddress()];
      await expect(
        governorBravoDelegate.initialize(
          xvsVault.address,
          [],
          timelocks,
          guardianAddress,
          accessControlManager.address,
        ),
      ).to.be.rejectedWith('ArityMismatch("timelocks")');
    });

    it("should revert if proposal config count differs from governance routes count", async () => {
      const guardianAddress = await accounts[0].getAddress();
      const proposalConfigs = [
        { votingDelay: 0, votingPeriod: 1, proposalThreshold: 2 },
        { votingDelay: 0, votingPeriod: 2, proposalThreshold: 3 },
        { votingDelay: 0, votingPeriod: 3, proposalThreshold: 4 },
        { votingDelay: 0, votingPeriod: 4, proposalThreshold: 5 },
      ];

      const timelocks = [accounts[0].getAddress(), accounts[1].getAddress(), accounts[2].getAddress()];
      await expect(
        governorBravoDelegate.initialize(
          xvsVault.address,
          proposalConfigs,
          timelocks,
          guardianAddress,
          accessControlManager.address,
        ),
      ).to.be.rejectedWith('ArityMismatch("proposalConfigs_")');
    });

    it("should revert if initialized twice", async () => {
      const guardianAddress = await accounts[0].getAddress();
      const minVotingDelay = await governorBravoDelegate.MIN_VOTING_DELAY();
      const minVotingPeriod = await governorBravoDelegate.MIN_VOTING_PERIOD();
      const minProposalThreshold = await governorBravoDelegate.MIN_PROPOSAL_THRESHOLD();
      const proposalConfigs = [
        {
          votingDelay: minVotingDelay.add(10),
          votingPeriod: minVotingPeriod.add(100),
          proposalThreshold: minProposalThreshold.add(100),
        },
        {
          votingDelay: minVotingDelay.add(10),
          votingPeriod: minVotingPeriod.add(100),
          proposalThreshold: minProposalThreshold.add(100),
        },
        {
          votingDelay: minVotingDelay.add(10),
          votingPeriod: minVotingPeriod.add(100),
          proposalThreshold: minProposalThreshold.add(100),
        },
      ];

      const timelocks = [accounts[0].getAddress(), accounts[1].getAddress(), accounts[2].getAddress()];
      await governorBravoDelegate.initialize(
        xvsVault.address,
        proposalConfigs,
        timelocks,
        guardianAddress,
        accessControlManager.address,
      );
      await expect(
        governorBravoDelegate.initialize(
          xvsVault.address,
          proposalConfigs,
          timelocks,
          guardianAddress,
          accessControlManager.address,
        ),
      ).to.be.rejectedWith("AlreadyInitialized");
    });

    //TODO: implement tests for min, max value validation of voting period, voting delay, proposal threshold
  });

  describe("Check setter functions", () => {
    beforeEach(async () => {
      [root, customer, ...accounts] = await ethers.getSigners();
      const contracts = await loadFixture(governorBravoFixture);
      ({ governorBravoDelegate, xvsVault, accessControlManager } = contracts);
      await governorBravoDelegate.setVariable("admin", await root.getAddress());
      const guardianAddress = await accounts[0].getAddress();
      const minVotingDelay = await governorBravoDelegate.MIN_VOTING_DELAY();
      const minVotingPeriod = await governorBravoDelegate.MIN_VOTING_PERIOD();
      const minProposalThreshold = await governorBravoDelegate.MIN_PROPOSAL_THRESHOLD();
      const timelocks = [accounts[0].getAddress(), accounts[1].getAddress(), accounts[2].getAddress()];
      const proposalConfigs = [
        {
          votingDelay: minVotingDelay.add(10),
          votingPeriod: minVotingPeriod.add(100),
          proposalThreshold: minProposalThreshold.add(100),
        },
        {
          votingDelay: minVotingDelay.add(10),
          votingPeriod: minVotingPeriod.add(100),
          proposalThreshold: minProposalThreshold.add(100),
        },
        {
          votingDelay: minVotingDelay.add(10),
          votingPeriod: minVotingPeriod.add(100),
          proposalThreshold: minProposalThreshold.add(100),
        },
      ];

      await governorBravoDelegate.initialize(
        xvsVault.address,
        proposalConfigs,
        timelocks,
        guardianAddress,
        accessControlManager.address,
      );
    });

    it("should revert if not called by admin", async () => {
      await expect(governorBravoDelegate.connect(customer)._setGuardian(accounts[0].getAddress())).to.be.rejectedWith(
        'Unauthorized("0x70997970C51812dc3A010C7d01b50e0d17dc79C8", "0xB0D4afd8879eD9F52b28595d31B441D079B2Ca07", "_setGuardian(address)")',
      );
    });

    it("should allow setting guardian with access permission", async () => {
      await expect(
        await accessControlManager
          .connect(root)
          .giveCallPermission(governorBravoDelegate.address, "_setGuardian(address)", await root.getAddress()),
      ).to.emit(accessControlManager, "PermissionGranted");

      await expect(governorBravoDelegate.connect(root)._setGuardian(await customer.getAddress()))
        .to.emit(governorBravoDelegate, "NewGuardian")
        .withArgs("0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", await customer.getAddress());
    });
  });
});
