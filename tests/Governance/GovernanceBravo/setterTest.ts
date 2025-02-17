import { FakeContract, MockContract, smock } from "@defi-wonderland/smock";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import chai from "chai";
import { Signer } from "ethers";
import { ethers } from "hardhat";

import { GovernorBravoDelegate, GovernorBravoDelegate__factory, XVSVault } from "../../../typechain";

const { expect } = chai;
chai.use(smock.matchers);

let root: Signer;
let user: Signer;
let governorBravoDelegate: MockContract<GovernorBravoDelegate>;
let xvsVault: FakeContract<XVSVault>;

type GovernorBravoDelegateFixture = {
  governorBravoDelegate: MockContract<GovernorBravoDelegate>;
  xvsVault: FakeContract<XVSVault>;
};

async function governorBravoFixture(): Promise<GovernorBravoDelegateFixture> {
  const GovernorBravoDelegateFactory = await smock.mock<GovernorBravoDelegate__factory>("GovernorBravoDelegate");
  const governorBravoDelegate = await GovernorBravoDelegateFactory.deploy();
  const xvsVault = await smock.fake<XVSVault>("XVSVault");
  return { governorBravoDelegate, xvsVault };
}
describe("Governance Bravo Setter Test", async () => {
  beforeEach(async () => {
    [root, user] = await ethers.getSigners();
    const contracts = await loadFixture(governorBravoFixture);
    ({ governorBravoDelegate, xvsVault } = contracts);
    await governorBravoDelegate.setVariable("admin", await root.getAddress());
    await governorBravoDelegate.setVariable("xvsVault", xvsVault.address);
  });

  describe("XvsVault setter in Governance Bravo", async () => {
    it("Xvs vault address should be updated", async () => {
      const newXvsVault = await smock.fake<XVSVault>("XVSVault");
      expect(await governorBravoDelegate.xvsVault()).to.equal(xvsVault.address);
      await governorBravoDelegate._setXvsVault(newXvsVault.address);
      expect(await governorBravoDelegate.xvsVault()).to.equal(newXvsVault.address);
    });
    it("Revert on unauthorized access", async () => {
      const newXvsVault = await smock.fake<XVSVault>("XVSVault");
      await expect(governorBravoDelegate.connect(user)._setXvsVault(newXvsVault.address)).to.be.revertedWith(
        "GovernorBravo::_setXvsVault: admin only",
      );
    });
    it("Reverts on zero address", async () => {
      await expect(governorBravoDelegate._setXvsVault(ethers.constants.AddressZero)).to.be.revertedWith(
        "GovernorBravo::setXvsVault: invalid xvs address",
      );
    });
  });
});
