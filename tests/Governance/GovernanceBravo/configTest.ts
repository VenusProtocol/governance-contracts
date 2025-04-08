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
  minVotingPeriod: 3600, // 20 * 60 * 3;  About 3 hours, 3 secs per block
  maxVotingPeriod: 403200, // 20 * 60 * 24 * 14; About 2 weeks, 3 secs per block
  minVotingDelay: 1,
  maxVotingDelay: 203200, //20 * 60 * 24 * 7; About 1 week, 3 secs per block
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

const updatedValidationParams = {
  minVotingPeriod: 7200,  // 40 * 60 * 3;  About 3 hours, 1.5 secs per block
  maxVotingPeriod: 806400, // 40 * 60 * 24 * 14; About 2 weeks, 1.5 secs per block
  minVotingDelay: 1,
  maxVotingDelay: 403200, // 40 * 60 * 24 * 7; About 1 week, 1.5 secs per block
};

const updatedProposalConfigs = [
  {
    votingDelay: 1,
    votingPeriod: 57600,
    proposalThreshold: "300000000000000000000000",
  },
  {
    votingDelay: 1,
    votingPeriod: 57600,
    proposalThreshold: "300000000000000000000000",
  },
  {
    votingDelay: 1,
    votingPeriod: 14400,
    proposalThreshold: "300000000000000000000000",
  },
];

async function governorBravoFixture(): Promise<GovernorBravoDelegateFixture> {
  const GovernorBravoDelegateFactory = await smock.mock<GovernorBravoDelegate__factory>("GovernorBravoDelegate");
  const governorBravoDelegate = await GovernorBravoDelegateFactory.deploy();
  const xvsVault = await smock.fake<XVSVault>("MockXVSVault");
  return { governorBravoDelegate, xvsVault };
}

describe("Governor Bravo Configuration Setter Test", () => {
  beforeEach(async () => {
    [root, customer, ...accounts] = await ethers.getSigners();
    const contracts = await loadFixture(governorBravoFixture);
    ({ governorBravoDelegate, xvsVault } = contracts);
    await governorBravoDelegate.setVariable("admin", await root.getAddress());
    const guardianAddress = await accounts[0].getAddress();
    const timelocks = [accounts[0].getAddress(), accounts[1].getAddress(), accounts[2].getAddress()];
    await governorBravoDelegate.initialize(
      xvsVault.address,
      validationParams,
      proposalConfigs,
      timelocks,
      guardianAddress,
    );
  });

  describe("Setter", () => {
    it("should revert if not called by admin", async () => {
      await expect(
        governorBravoDelegate.connect(customer).setValidationParams(updatedValidationParams),
      ).to.be.revertedWith("GovernorBravo::setValidationParams: admin only");
      await expect(
        governorBravoDelegate.connect(customer).setProposalConfigs(updatedProposalConfigs),
      ).to.be.revertedWith("GovernorBravo::setProposalConfigs: admin only");
    });

    it("should revert if setValidationParams called with invalid validationParams", async () => {
      const validationParams = {
        maxVotingPeriod: 0,
        minVotingPeriod: 0,
        maxVotingDelay: 0,
        minVotingDelay: 0,
      };

      await expect(governorBravoDelegate.setValidationParams(validationParams)).to.be.revertedWith(
        "GovernorBravo::setValidationParams: invalid params",
      );
    });

    it("should revert if setProposalConfigs called with invalid proposalConfigs", async () => {
      const minProposalThreshold = await governorBravoDelegate.MIN_PROPOSAL_THRESHOLD();
      const maxProposalThreshold = await governorBravoDelegate.MAX_PROPOSAL_THRESHOLD();
      let testProposalConfigs = proposalConfigs.map(obj => ({ ...obj }));
      testProposalConfigs[0]["votingPeriod"] = validationParams.minVotingPeriod - 100;
      await expect(governorBravoDelegate.setProposalConfigs(testProposalConfigs)).to.be.revertedWith(
        "GovernorBravo::setProposalConfigs: invalid min voting period",
      );

      testProposalConfigs = proposalConfigs.map(obj => ({ ...obj }));
      testProposalConfigs[0]["votingPeriod"] = validationParams.maxVotingPeriod + 100;
      await expect(governorBravoDelegate.setProposalConfigs(testProposalConfigs)).to.be.revertedWith(
        "GovernorBravo::setProposalConfigs: invalid max voting period",
      );

      testProposalConfigs = proposalConfigs.map(obj => ({ ...obj }));
      testProposalConfigs[0]["votingDelay"] = validationParams.minVotingDelay - 1;
      await expect(governorBravoDelegate.setProposalConfigs(testProposalConfigs)).to.be.revertedWith(
        "GovernorBravo::setProposalConfigs: invalid min voting delay",
      );

      testProposalConfigs = proposalConfigs.map(obj => ({ ...obj }));
      testProposalConfigs[0]["votingDelay"] = validationParams.maxVotingDelay + 1;
      await expect(governorBravoDelegate.setProposalConfigs(testProposalConfigs)).to.be.revertedWith(
        "GovernorBravo::setProposalConfigs: invalid max voting delay",
      );

      testProposalConfigs = proposalConfigs.map(obj => ({ ...obj }));
      testProposalConfigs[0]["proposalThreshold"] = minProposalThreshold.sub(1).toString();
      await expect(governorBravoDelegate.setProposalConfigs(testProposalConfigs)).to.be.revertedWith(
        "GovernorBravo::setProposalConfigs: invalid min proposal threshold",
      );

      testProposalConfigs = proposalConfigs.map(obj => ({ ...obj }));
      testProposalConfigs[0]["proposalThreshold"] = maxProposalThreshold.add(1).toString();
      await expect(governorBravoDelegate.setProposalConfigs(testProposalConfigs)).to.be.revertedWith(
        "GovernorBravo::setProposalConfigs: invalid max proposal threshold",
      );
    });

    it("should set correct validationParams on calling setValidationParams", async () => {
      await governorBravoDelegate.setValidationParams(updatedValidationParams);
      const activeValidationParams = await governorBravoDelegate.validationParams();
      expect(activeValidationParams.maxVotingPeriod).to.equal(updatedValidationParams.maxVotingPeriod);
      expect(activeValidationParams.minVotingPeriod).to.equal(updatedValidationParams.minVotingPeriod);
      expect(activeValidationParams.maxVotingDelay).to.equal(updatedValidationParams.maxVotingDelay);
      expect(activeValidationParams.minVotingDelay).to.equal(updatedValidationParams.minVotingDelay);
    });

    it("should set correct proposalConfigs on calling setProposalConfigs", async () => {
      await governorBravoDelegate.setProposalConfigs(updatedProposalConfigs);

      const activeNormalProposalConfig = await governorBravoDelegate.proposalConfigs(0);
      expect(activeNormalProposalConfig.votingPeriod).to.be.equal(updatedProposalConfigs[0].votingPeriod);
      expect(activeNormalProposalConfig.votingDelay).to.be.equal(updatedProposalConfigs[0].votingDelay);
      expect(activeNormalProposalConfig.proposalThreshold).to.be.equal(updatedProposalConfigs[0].proposalThreshold);

      const activeFastrackProposalConfig = await governorBravoDelegate.proposalConfigs(1);
      expect(activeFastrackProposalConfig.votingPeriod).to.be.equal(updatedProposalConfigs[1].votingPeriod);
      expect(activeFastrackProposalConfig.votingDelay).to.be.equal(updatedProposalConfigs[1].votingDelay);
      expect(activeFastrackProposalConfig.proposalThreshold).to.be.equal(updatedProposalConfigs[1].proposalThreshold);

      const activeCriticalProposalConfig = await governorBravoDelegate.proposalConfigs(2);
      expect(activeCriticalProposalConfig.votingPeriod).to.be.equal(updatedProposalConfigs[2].votingPeriod);
      expect(activeCriticalProposalConfig.votingDelay).to.be.equal(updatedProposalConfigs[2].votingDelay);
      expect(activeCriticalProposalConfig.proposalThreshold).to.be.equal(updatedProposalConfigs[2].proposalThreshold);
    });
  });
});
