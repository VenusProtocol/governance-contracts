import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { loadFixture, mine } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { BigNumber } from "ethers";
import { parseUnits } from "ethers/lib/utils";
import { ethers, upgrades } from "hardhat";

import { convertToUnit } from "../../helpers/utils";
import { AccessControlManager, MockToken, Timelock, TokenVault, VaultAggregator } from "../../typechain";

enum ProposalType {
  NORMAL,
  FASTTRACK,
  CRITICAL,
}
describe("MultiTokenGovernance", async () => {
  let deployer: SignerWithAddress;
  let signer1: SignerWithAddress;
  let signer2: SignerWithAddress;
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
  let targets: any[];
  let values: any[];
  let signatures: any[];
  let callDatas: any[];
  let token1Weight: BigNumber;
  let token2Weight: BigNumber;

  const GovernanceFixture = async () => {
    [deployer, signer1, signer2] = await ethers.getSigners();
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
    const vaultAggregatorFactory = await ethers.getContractFactory("VaultAggregator");
    vaultAggregator = await upgrades.deployProxy(vaultAggregatorFactory, [accessControl.address]);

    const MultiTokenGovernorBravoDelegateFactory = await ethers.getContractFactory("MultiTokenGovernorBravoDelegate");
    governorBravoDelegate = await upgrades.deployProxy(MultiTokenGovernorBravoDelegateFactory, [
      vaultAggregator.address,
      [
        [1, 20 * 60 * 5, convertToUnit("150000", 18)],
        [1, 20 * 60 * 4, convertToUnit("200000", 18)],
        [1, 20 * 60 * 3, convertToUnit("250000", 18)],
      ],
      [normalTimelock.address, fasttrackTimelock.address, criticalTimelock.address],
      deployer.address,
      accessControl.address,
    ]);
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

    // Give permission
    let tx = await accessControl.giveCallPermission(
      vaultAggregator.address,
      "updateVault(address,bool)",
      deployer.address,
    );
    await tx.wait();

    tx = await accessControl.giveCallPermission(
      vaultAggregator.address,
      "updateDefaultWeights(uint8[])",
      deployer.address,
    );
    await tx.wait();

    expect(await vaultAggregator.updateVault(tokenVault1.address, true)).to.emit(vaultAggregator, "UpdateVault");
    expect(await vaultAggregator.updateVault(tokenVault2.address, true)).to.emit(vaultAggregator, "UpdateVault");

    await expect(vaultAggregator.updateDefaultWeights([100, 0, 0, 0, 0, 0, 0, 0])).to.emit(
      vaultAggregator,
      "DefaultWeightsUpdated",
    );

    targets = [deployer.address];
    values = ["0"];
    signatures = ["getBalanceOf(address)"];
    callDatas = [ethers.utils.defaultAbiCoder.encode(["address"], [deployer.address])];
    token1Weight = BigNumber.from(80);
    token2Weight = BigNumber.from(20);
  };
  beforeEach("Configure Vault", async () => {
    await loadFixture(GovernanceFixture);
  });
  it("Propose successfully", async () => {
    await expect(
      governorBravoDelegate.propose(targets, values, signatures, callDatas, "", ProposalType.NORMAL, [
        token1Weight,
        token2Weight,
      ]),
    ).to.emit(governorBravoDelegate, "ProposalCreated");
  });
  it("Revert if proposer does not have enough votes", async () => {
    await expect(
      governorBravoDelegate
        .connect(signer2)
        .propose(targets, values, signatures, callDatas, "", ProposalType.NORMAL, [token1Weight, token2Weight]),
    ).to.be.revertedWithCustomError(governorBravoDelegate, "UnderThreshold");
  });
  it("Vote successfully", async () => {
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
  it("No votes will count if given weights and default weights are zero", async () => {
    await expect(vaultAggregator.updateDefaultWeights([0, 0, 0, 0, 0, 0, 0, 0])).to.emit(
      vaultAggregator,
      "DefaultWeightsUpdated",
    );
    await expect(
      governorBravoDelegate.propose(targets, values, signatures, callDatas, "", ProposalType.NORMAL, []),
    ).to.emit(governorBravoDelegate, "ProposalCreated");
    const proposalId = await governorBravoDelegate.latestProposalIds(deployer.address);
    await mine();
    await expect(governorBravoDelegate.connect(signer1).castVote(proposalId, 1)).to.emit(
      governorBravoDelegate,
      "VoteCast",
    );
    const proposal = await governorBravoDelegate.proposals(proposalId);
    expect(proposal.forVotes).equals(0);
  });

  it("Default votes will be counted if weights are not given", async () => {
    await expect(
      governorBravoDelegate.propose(targets, values, signatures, callDatas, "", ProposalType.NORMAL, []),
    ).to.emit(governorBravoDelegate, "ProposalCreated");
    const proposalId = await governorBravoDelegate.latestProposalIds(deployer.address);
    await mine();
    await expect(governorBravoDelegate.connect(signer1).castVote(proposalId, 1)).to.emit(
      governorBravoDelegate,
      "VoteCast",
    );
    const expectedVotes = BigNumber.from(100).mul(token1Amount).div(100);

    const proposal = await governorBravoDelegate.proposals(proposalId);
    expect(proposal.forVotes).equals(expectedVotes);
  });
});
