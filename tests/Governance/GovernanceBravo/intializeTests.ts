import { FakeContract, MockContract, smock } from "@defi-wonderland/smock";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import chai from "chai";
import { Signer } from "ethers";
import { ethers } from "hardhat";

import { GovernorBravoDelegate, GovernorBravoDelegate__factory, XVSVault } from "../../../typechain";

const { expect } = chai;
chai.use(smock.matchers);

let root: Signer;
let customer: Signer;
let accounts: Signer[];
let governorBravoDelegate: MockContract<GovernorBravoDelegate>;
let xvsVault: FakeContract<XVSVault>;

type GovernorBravoDelegateFixture = {
  governorBravoDelegate: MockContract<GovernorBravoDelegate>;
  xvsVault: FakeContract<XVSVault>;
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
  return { governorBravoDelegate, xvsVault };
}

describe("Governor Bravo Initializing Test", () => {
  beforeEach(async () => {
    [root, customer, ...accounts] = await ethers.getSigners();
    const contracts = await loadFixture(governorBravoFixture);
    ({ governorBravoDelegate, xvsVault } = contracts);
    await governorBravoDelegate.setVariable("admin", await root.getAddress());
  });

  describe("initilizer", () => {
    it("should revert if not called by admin", async () => {
      await expect(
        governorBravoDelegate
          .connect(customer)
          .initialize(ethers.constants.AddressZero, validationParams, [], [], ethers.constants.AddressZero),
      ).to.be.revertedWith("GovernorBravo::initialize: admin only");
    });

    it("should revert if invalid xvs vault address", async () => {
      await expect(
        governorBravoDelegate.initialize(
          ethers.constants.AddressZero,
          validationParams,
          [],
          [],
          ethers.constants.AddressZero,
        ),
      ).to.be.revertedWith("GovernorBravo::initialize: invalid xvs vault address");
    });

    it("should revert if invalid guardian address", async () => {
      await expect(
        governorBravoDelegate.initialize(xvsVault.address, validationParams, [], [], ethers.constants.AddressZero),
      ).to.be.revertedWith("GovernorBravo::initialize: invalid guardian");
    });

    it("should revert if timelock adress count differs from governance routes count", async () => {
      const guardianAddress = await accounts[0].getAddress();

      const timelocks = [accounts[0].getAddress(), accounts[1].getAddress()];
      await expect(
        governorBravoDelegate.initialize(xvsVault.address, validationParams, [], timelocks, guardianAddress),
      ).to.be.revertedWith("GovernorBravo::initialize:number of timelocks should match number of governance routes");
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
          validationParams,
          proposalConfigs,
          timelocks,
          guardianAddress,
        ),
      ).to.be.revertedWith(
        "GovernorBravo::initialize:number of proposal configs should match number of governance routes",
      );
    });

    it("should revert if initialized twice", async () => {
      const guardianAddress = await accounts[0].getAddress();
      const timelocks = [accounts[0].getAddress(), accounts[1].getAddress(), accounts[2].getAddress()];

      await governorBravoDelegate.initialize(
        xvsVault.address,
        validationParams,
        proposalConfigs,
        timelocks,
        guardianAddress,
      );

      await expect(
        governorBravoDelegate.initialize(
          xvsVault.address,
          validationParams,
          proposalConfigs,
          timelocks,
          guardianAddress,
        ),
      ).to.be.revertedWith("GovernorBravo::initialize: cannot initialize twice");
    });

    it("should revert if initialized with invalid validationParams", async () => {
      const guardianAddress = await accounts[0].getAddress();
      const validationParams = {
        maxVotingPeriod: 0,
        minVotingPeriod: 0,
        maxVotingDelay: 0,
        minVotingDelay: 0,
      };
      const timelocks = [accounts[0].getAddress(), accounts[1].getAddress(), accounts[2].getAddress()];

      await expect(
        governorBravoDelegate.initialize(
          xvsVault.address,
          validationParams,
          proposalConfigs,
          timelocks,
          guardianAddress,
        ),
      ).to.be.revertedWith("GovernorBravo::setValidationParams: invalid params");
    });

    it("should revert if initialized with invalid proposalConfigs", async () => {
      const guardianAddress = await accounts[0].getAddress();
      const timelocks = [accounts[0].getAddress(), accounts[1].getAddress(), accounts[2].getAddress()];
      const proposalConfigs = [
        {
          votingDelay: 1,
          votingPeriod: 7100, // lesser than the minVotingPeriod 7200
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

      await expect(
        governorBravoDelegate.initialize(
          xvsVault.address,
          validationParams,
          proposalConfigs,
          timelocks,
          guardianAddress,
        ),
      ).to.be.revertedWith("GovernorBravo::setProposalConfigs: invalid min voting period");
    });

    it("should set correct validationParams and proposalConfig on initialization", async () => {
      const guardianAddress = await accounts[0].getAddress();
      const timelocks = [accounts[0].getAddress(), accounts[1].getAddress(), accounts[2].getAddress()];

      await governorBravoDelegate.initialize(
        xvsVault.address,
        validationParams,
        proposalConfigs,
        timelocks,
        guardianAddress,
      );
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
