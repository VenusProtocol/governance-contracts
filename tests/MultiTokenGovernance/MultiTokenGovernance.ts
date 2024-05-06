import { smock } from "@defi-wonderland/smock";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { loadFixture, mine } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { BigNumber } from "ethers";
import { parseUnits } from "ethers/lib/utils";
import { ethers, upgrades } from "hardhat";

import { convertToUnit } from "../../helpers/utils";
import {
  AccessControlManager,
  MockToken,
  MultiTokenGovernorBravoDelegate__factory,
  Timelock,
  TokenVault,
  VaultAggregator,
} from "../../typechain";

enum ProposalType {
  NORMAL,
  FASTTRACK,
  CRITICAL,
}
describe("MultiTokenGovernance", async () => {
  let deployer: SignerWithAddress;
  let signer1: SignerWithAddress;
  let accessControl: AccessControlManager;
  let vaultAggregator: VaultAggregator;
  let governorBravoDelegate;
  let tokenVault1: TokenVault;
  let tokenVault2: TokenVault;
  let token1: MockToken;
  let token2: MockToken;
  let normalTimelock: Timelock;
  let criticalTimelock: Timelock;
  let fasttrackTimelock: Timelock;
  let token1Amount: BigNumber;
  let token2Amount: BigNumber;

  const GovernanceFixture = async () => {
    [deployer, signer1] = await ethers.getSigners();
    const TimelockFactory = await ethers.getContractFactory("Timelock");
    normalTimelock = await TimelockFactory.deploy(deployer.address, 10800);
    fasttrackTimelock = await TimelockFactory.deploy(deployer.address, 7200);
    criticalTimelock = await TimelockFactory.deploy(deployer.address, 3600);

    const accessControlManagerFactory = await ethers.getContractFactory("AccessControlManager");
    accessControl = await accessControlManagerFactory.deploy();

    const tokenFactory = await ethers.getContractFactory("MockToken");
    token1 = await tokenFactory.deploy("MockToken1", "MT1", 18);
    token2 = await tokenFactory.deploy("MockToken2", "MT2", 18);
    const tokenVaultFactory = await ethers.getContractFactory("TokenVault");
    tokenVault1 = await upgrades.deployProxy(tokenVaultFactory, [accessControl.address], {
      constructorArgs: [token1.address, false, 10512000],
      initializer: "initialize",
      unsafeAllow: ["constructor"],
    });
    tokenVault2 = await upgrades.deployProxy(tokenVaultFactory, [accessControl.address], {
      constructorArgs: [token2.address, false, 10512000],
      initializer: "initialize",
      unsafeAllow: ["constructor"],
    });
    const proposeAmount = parseUnits("150000", 18);
    token1Amount = parseUnits("50000", 18);
    token2Amount = parseUnits("20000", 18);
    token1.faucet(proposeAmount);
    token1.connect(signer1).faucet(token1Amount);
    token2.connect(signer1).faucet(token2Amount);
    await token1.approve(tokenVault1.address, proposeAmount);
    await token1.connect(signer1).approve(tokenVault1.address, token1Amount);
    await token2.connect(signer1).approve(tokenVault2.address, token2Amount);

    await expect(tokenVault1.deposit(proposeAmount)).to.emit(tokenVault1, "Deposit");
    await expect(tokenVault1.delegate(deployer.address)).to.emit(tokenVault1, "DelegateChangedV2");

    await expect(tokenVault1.connect(signer1).deposit(token1Amount)).to.emit(tokenVault1, "Deposit");
    await expect(tokenVault1.connect(signer1).delegate(signer1.address)).to.emit(tokenVault1, "DelegateChangedV2");

    await expect(tokenVault2.connect(signer1).deposit(token2Amount)).to.emit(tokenVault2, "Deposit");
    await expect(tokenVault2.connect(signer1).delegate(signer1.address)).to.emit(tokenVault2, "DelegateChangedV2");

    const MultiTokenGovernorBravoDelegateFactory = await smock.mock<MultiTokenGovernorBravoDelegate__factory>(
      "MultiTokenGovernorBravoDelegate",
    );
    governorBravoDelegate = await MultiTokenGovernorBravoDelegateFactory.deploy();
    const vaultAggregatorFactory = await ethers.getContractFactory("VaultAggregator");
    vaultAggregator = await upgrades.deployProxy(vaultAggregatorFactory, [accessControl.address]);

    // Give permission
    const tx = await accessControl.giveCallPermission(
      vaultAggregator.address,
      "updateVault(address,bool)",
      deployer.address,
    );
    await tx.wait();

    expect(await vaultAggregator.updateVault(tokenVault1.address, true)).to.emit(vaultAggregator, "UpdateVault");
    expect(await vaultAggregator.updateVault(tokenVault2.address, true)).to.emit(vaultAggregator, "UpdateVault");

    await governorBravoDelegate.setVariable("admin", await deployer.getAddress());
    await governorBravoDelegate.initialize(
      vaultAggregator.address,
      [
        [1, 20 * 60 * 5, convertToUnit("150000", 18)],
        [1, 20 * 60 * 4, convertToUnit("200000", 18)],
        [1, 20 * 60 * 3, convertToUnit("250000", 18)],
      ],
      [normalTimelock.address, fasttrackTimelock.address, criticalTimelock.address],
      deployer.address,
    );
  };
  beforeEach("Configure Vault", async () => {
    await loadFixture(GovernanceFixture);
  });
  it("Propose & Voting", async () => {
    const targets = [deployer.address];
    const values = ["0"];
    const signatures = ["getBalanceOf(address)"];
    const callDatas = [ethers.utils.defaultAbiCoder.encode(["address"], [deployer.address])];
    const token1Weight = BigNumber.from(80);
    const token2Weight = BigNumber.from(20);
    await expect(
      governorBravoDelegate.propose(targets, values, signatures, callDatas, "", ProposalType.NORMAL, [
        token1Weight,
        token2Weight,
      ]),
    ).to.emit(governorBravoDelegate, "ProposalCreated");
    const proposalId = await governorBravoDelegate.latestProposalIds(deployer.address);
    await mine();
    await expect(governorBravoDelegate.connect(signer1).castVote(proposalId, 1)).to.emit(
      governorBravoDelegate,
      "VoteCast",
    );
    const expectedVotes = token1Weight
      .mul(token1Amount)
      .add(token2Weight.mul(token2Amount))
      .div(token1Weight.add(token2Weight));

    const proposal = await governorBravoDelegate.proposals(proposalId);
    expect(proposal.forVotes).equals(expectedVotes);
  });
});
