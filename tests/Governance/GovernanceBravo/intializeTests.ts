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
  accessControlManager: AccessControlManager;
};

const validationParams = {
  maxVotingPeriod: 806400,
  minVotingPeriod: 7200,
  maxVotingDelay: 403200,
  minVotingDelay: 1,
};

const proposalConfigs = [
  {
    votingDelay: 1,
    votingPeriod: 28800,
    proposalThreshold: "300000000000000000000000",
  },
  {
    votingDelay: 1,
    votingPeriod: 28800,
    proposalThreshold: "300000000000000000000000",
  },
  {
    votingDelay: 1,
    votingPeriod: 7200,
    proposalThreshold: "300000000000000000000000",
  },
];

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
          .initialize(
            ethers.constants.AddressZero,
            [0, 0, 0, 0],
            [],
            [],
            ethers.constants.AddressZero,
            ethers.constants.AddressZero,
          ),
      ).to.be.rejectedWith("OnlyAdmin");
    });

    it("should revert if invalid xvs address", async () => {
      await expect(
        governorBravoDelegate.initialize(
          ethers.constants.AddressZero,
          [0, 0, 0, 0],
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
          [0, 0, 0, 0],

          [],
          [],
          ethers.constants.AddressZero,
          ethers.constants.AddressZero,
        ),
      ).to.be.rejectedWith("ZeroAddressNotAllowed");
    });

    it("should revert if invalid access control manager address", async () => {
      const guardianAddress = await accounts[0].getAddress();
      const minProposalThreshold = await governorBravoDelegate.MIN_PROPOSAL_THRESHOLD();
      const proposalConfigs = [
        {
          votingDelay: 10,
          votingPeriod: 100,
          proposalThreshold: minProposalThreshold.add(100),
        },
        {
          votingDelay: 10,
          votingPeriod: 100,
          proposalThreshold: minProposalThreshold.add(100),
        },
        {
          votingDelay: 10,
          votingPeriod: 100,
          proposalThreshold: minProposalThreshold.add(100),
        },
      ];

      const timelocks = [accounts[0].getAddress(), accounts[1].getAddress(), accounts[2].getAddress()];
      await expect(
        governorBravoDelegate.initialize(
          xvsVault.address,
          [0, 0, 0, 0],

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
          [0, 0, 0, 0],

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
          [0, 0, 0, 0],

          proposalConfigs,
          timelocks,
          guardianAddress,
          accessControlManager.address,
        ),
      ).to.be.rejectedWith('ArityMismatch("proposalConfigs_")');
    });

    it("should revert if initialized twice", async () => {
      const guardianAddress = await accounts[0].getAddress();
      const minProposalThreshold = await governorBravoDelegate.MIN_PROPOSAL_THRESHOLD();
      const proposalConfigs = [
        {
          votingDelay: 10,
          votingPeriod: 100,
          proposalThreshold: minProposalThreshold.add(100),
        },
        {
          votingDelay: 10,
          votingPeriod: 100,
          proposalThreshold: minProposalThreshold.add(100),
        },
        {
          votingDelay: 10,
          votingPeriod: 100,
          proposalThreshold: minProposalThreshold.add(100),
        },
      ];

      const timelocks = [accounts[0].getAddress(), accounts[1].getAddress(), accounts[2].getAddress()];
      await governorBravoDelegate.initialize(
        xvsVault.address,
        [1, 300, 1, 300],
        proposalConfigs,
        timelocks,
        guardianAddress,
        accessControlManager.address,
      );
      await expect(
        governorBravoDelegate.initialize(
          xvsVault.address,
          [10, 200, 500, 200],
          proposalConfigs,
          timelocks,
          guardianAddress,
          accessControlManager.address,
        ),
      ).to.be.rejectedWith("AlreadyInitialized");
    });
    it("Validates voting period", async () => {
      const guardianAddress = await accounts[0].getAddress();
      const minProposalThreshold = await governorBravoDelegate.MIN_PROPOSAL_THRESHOLD();
      const proposalConfigs = [
        {
          votingDelay: 10,
          votingPeriod: 100,
          proposalThreshold: minProposalThreshold.add(100),
        },
        {
          votingDelay: 10,
          votingPeriod: 100,
          proposalThreshold: minProposalThreshold.add(100),
        },
        {
          votingDelay: 10,
          votingPeriod: 100,
          proposalThreshold: minProposalThreshold.add(100),
        },
      ];

      const timelocks = [accounts[0].getAddress(), accounts[1].getAddress(), accounts[2].getAddress()];
      await expect(
        governorBravoDelegate.initialize(
          xvsVault.address,
          [1000, 20, 1, 200],
          proposalConfigs,
          timelocks,
          guardianAddress,
          accessControlManager.address,
        ),
      ).to.be.revertedWith("GovernorBravo::setValidationParams: invalid params");
      await expect(
        governorBravoDelegate.initialize(
          xvsVault.address,
          [10, 200, 500, 200],
          proposalConfigs,
          timelocks,
          guardianAddress,
          accessControlManager.address,
        ),
      ).to.be.revertedWith("GovernorBravo::setValidationParams: invalid params");
    });
  });

  describe("Check setter functions", () => {
    beforeEach(async () => {
      [root, customer, ...accounts] = await ethers.getSigners();
      const contracts = await loadFixture(governorBravoFixture);
      ({ governorBravoDelegate, xvsVault, accessControlManager } = contracts);
      await governorBravoDelegate.setVariable("admin", await root.getAddress());
      const guardianAddress = await accounts[0].getAddress();
      const timelocks = [accounts[0].getAddress(), accounts[1].getAddress(), accounts[2].getAddress()];

      await governorBravoDelegate.initialize(
        xvsVault.address,
       validationParams,
        proposalConfigs,
        timelocks,
        guardianAddress,
        accessControlManager.address,
      );
    });

    it("should revert if not called by admin", async () => {
      await expect(governorBravoDelegate.connect(customer)._setGuardian(accounts[0].getAddress())).to.be.rejectedWith(
        '("0x70997970C51812dc3A010C7d01b50e0d17dc79C8", "0x5FbDB2315678afecb367f032d93F642f64180aa3", "_setGuardian(address)")',
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
    it("should set correct validationParams and proposalConfig on initialization", async () => {
      const activeValidationParams = await governorBravoDelegate.validationParams();
      expect(activeValidationParams.maxVotingPeriod).to.equal(validationParams.maxVotingPeriod);
      expect(activeValidationParams.minVotingPeriod).to.equal(validationParams.minVotingPeriod);
      expect(activeValidationParams.maxVotingDelay).to.equal(validationParams.maxVotingDelay);
      expect(activeValidationParams.minVotingDelay).to.equal(validationParams.minVotingDelay);

      const activeNormalProposalConfig = await governorBravoDelegate.proposalConfigs(0);
      expect(activeNormalProposalConfig.votingPeriod).to.be.equal(proposalConfigs[0].votingPeriod);
      expect(activeNormalProposalConfig.votingDelay).to.be.equal(proposalConfigs[0].votingDelay);
      expect(activeNormalProposalConfig.proposalThreshold).to.be.equal(proposalConfigs[0].proposalThreshold);

      const activeFastrackProposalConfig = await governorBravoDelegate.proposalConfigs(1);
      expect(activeFastrackProposalConfig.votingPeriod).to.be.equal(proposalConfigs[1].votingPeriod);
      expect(activeFastrackProposalConfig.votingDelay).to.be.equal(proposalConfigs[1].votingDelay);
      expect(activeFastrackProposalConfig.proposalThreshold).to.be.equal(proposalConfigs[1].proposalThreshold);

      const activeCriticalProposalConfig = await governorBravoDelegate.proposalConfigs(2);
      expect(activeCriticalProposalConfig.votingPeriod).to.be.equal(proposalConfigs[2].votingPeriod);
      expect(activeCriticalProposalConfig.votingDelay).to.be.equal(proposalConfigs[2].votingDelay);
      expect(activeCriticalProposalConfig.proposalThreshold).to.be.equal(proposalConfigs[2].proposalThreshold);
    });
  });
});
