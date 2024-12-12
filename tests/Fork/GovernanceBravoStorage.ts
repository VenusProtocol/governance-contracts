import { expect } from "chai";
import { BigNumber, Signer } from "ethers";
import { ethers } from "hardhat";

import {
  GovernorBravoDelegate,
  GovernorBravoDelegate__factory,
  GovernorBravoDelegator,
  GovernorBravoDelegator__factory,
} from "../../typechain";
import { forking, initMainnetUser } from "./utils";

const delegatorProxyAddress = "0x2d56dC077072B53571b8252008C60e945108c75a";
const guardianAddress = "0x1C2CAc6ec528c20800B2fe734820D87b581eAA6B";
let governorBravoDelegator: GovernorBravoDelegator;
let admin: string;
let votingDelay: BigNumber;
let pendingAdmin: string;
let implementation: string;
let impersonatedGuardian: Signer;
let governorBravoDelegate: GovernorBravoDelegate;
let votingPeriod: BigNumber;
let proposalThreshold: BigNumber;
let initialProposalId: BigNumber;
let xvsVault: string;
let proposalMaxOperations: BigNumber;
let guardian: string;

async function configureBravo() {
  impersonatedGuardian = await initMainnetUser(guardianAddress, ethers.utils.parseEther("2"));
  governorBravoDelegator = GovernorBravoDelegator__factory.connect(delegatorProxyAddress, impersonatedGuardian);
  governorBravoDelegate = GovernorBravoDelegate__factory.connect(delegatorProxyAddress, impersonatedGuardian);
}

const FORK_MAINNET = process.env.FORK == "true" && process.env.FORKED_NETWORK == "bscmainnet";
if (FORK_MAINNET) {
  const blockNumber = 35984931;
  forking(blockNumber, async () => {
    describe("Governor Bravo Storage Layout Test", async () => {
      before(async () => {
        await configureBravo();
        votingDelay = await governorBravoDelegate.votingDelay();
        pendingAdmin = await governorBravoDelegate.pendingAdmin();
        implementation = await governorBravoDelegate.implementation();
        admin = await governorBravoDelegate.admin();
        votingPeriod = await governorBravoDelegate.votingPeriod();
        proposalThreshold = await governorBravoDelegate.proposalThreshold();
        initialProposalId = await governorBravoDelegate.initialProposalId();
        xvsVault = await governorBravoDelegate.xvsVault();
        proposalMaxOperations = await governorBravoDelegate.proposalMaxOperations();
        guardian = await governorBravoDelegate.guardian();
      });
      it("Verify states after upgrade", async () => {
        const governorBravoDelegateFactory = await ethers.getContractFactory("GovernorBravoDelegate");
        const governorBravoDelegateNew = await governorBravoDelegateFactory.deploy();
        await governorBravoDelegateNew.deployed();
        await governorBravoDelegator.connect(impersonatedGuardian)._setImplementation(governorBravoDelegateNew.address);

        expect(votingDelay).equals(await governorBravoDelegate.votingDelay());
        expect(pendingAdmin).equals(await governorBravoDelegate.pendingAdmin());
        expect(implementation).not.equals(await governorBravoDelegate.implementation());
        expect(admin).equals(await governorBravoDelegate.admin());
        expect(votingPeriod).equals(await governorBravoDelegate.votingPeriod());
        expect(proposalThreshold).equals(await governorBravoDelegate.proposalThreshold());
        expect(initialProposalId).equals(await governorBravoDelegate.initialProposalId());
        expect(xvsVault).equals(await governorBravoDelegate.xvsVault());
        expect(proposalMaxOperations).equals(await governorBravoDelegate.proposalMaxOperations());
        expect(guardian).equals(await governorBravoDelegate.guardian());
      });
    });
  });
}
