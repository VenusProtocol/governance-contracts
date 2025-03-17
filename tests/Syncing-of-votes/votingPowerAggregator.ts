import { FakeContract, MockContract, smock } from "@defi-wonderland/smock";
import { loadFixture, mine, time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { BigNumber, Signer } from "ethers";
import { parseUnits } from "ethers/lib/utils";
import fs from "fs";
import { ethers, upgrades } from "hardhat";
import { SignerWithAddress } from "hardhat-deploy-ethers/signers";

import { fundAccount, impersonateSigner } from "../../helpers/utils";
import {
  AccessControlManager,
  DataWarehouse,
  DataWarehouse__factory,
  GovernorBravoDelegate,
  ILayerZeroEndpointV2,
  MockXVSVault,
  VotingPowerAggregator,
  VotingPowerAggregatorOwner,
  VotingPowerAggregatorOwner__factory,
  VotingPowerAggregator__factory,
} from "../../typechain";

type ProofData = {
  blockNumber?: number;
  blockHash?: string;
  accountStateProofRLP?: string;
  blockHeaderRLP?: string;
  xvsVault?: string;
  checkpointsSlot?: string;
  numCheckpointsSlot?: string;
  voterCheckpointsSlotHash?: string;
  voterNumCheckpointsSlotHash?: string;
  voterNumCheckpoints?: number;
  voterXvsVaultNumCheckpointsStorageProofRlp?: string;
  voterCheckpoint?: {
    fromBlockNumber?: string;
    votes?: string;
  };
  voter?: string;
  voterXvsVaultCheckpointsStorageProofRlp?: string;
  proposer?: string;
  proposerXvsVaultNumCheckpointsStorageProofRlp?: string;
  proposerCheckpoint?: {
    fromBlockNumber?: string;
    votes?: string;
  };
  proposerNumCheckpoints?: number;
  proposerXvsVaultCheckpointsStorageProofRlp?: string;
  proposerNumCheckpointsSlotHash?: string;
  proposerCheckpointsSlotHash?: string;
};

const OPSEPOLIA_EID = 40232;
const ARB_EID = 40231;
const BSC_CHAIN_ID = 5656;
const RANDOM_ADDRESS = "0x1111111111111111111111111111111111111111";
const readChannel = 123;

let deployer: SignerWithAddress;
let proposer: Signer;
let accounts: Signer[];
let votingPowerAggregator: MockContract<VotingPowerAggregator>;
let votingPowerAggregatorOwner: MockContract<VotingPowerAggregatorOwner>;
let dataWarehouse: MockContract<DataWarehouse>;
let governorBravoDelegate: FakeContract<GovernorBravoDelegate>;
let xvsVault: FakeContract<MockXVSVault>;
let endpoint: FakeContract<ILayerZeroEndpointV2>;
let arbSepoliaProofData: ProofData;
let opSepoliaProofData: ProofData;

type VotingPowerAggregatorFixture = {
  votingPowerAggregator: MockContract<VotingPowerAggregator>;
  dataWarehouse: MockContract<DataWarehouse>;
  governorBravoDelegate: FakeContract<GovernorBravoDelegate>;
  xvsVault: FakeContract<MockXVSVault>;
  endpoint: FakeContract<ILayerZeroEndpointV2>;
  votingPowerAggregatorOwner: MockContract<VotingPowerAggregatorOwner>;
};

const getProofsJson = (network: string): ProofData => {
  try {
    const file = fs.readFileSync(`${__dirname}/syncingParameters/${network}Proofs.json`);
    return JSON.parse(file.toString());
  } catch (error) {
    return {};
  }
};

async function updateFunctionRegistry(votingPowerAggregatorOwner: MockContract<VotingPowerAggregatorOwner>) {
  const functionregistry = [
    "setReadChannel(uint32,bool)",
    "setEndpointDelegate(addess)",
    "pause()",
    "unpause()",
    "updateNetworkConfig(uint32,address,address,bool)",
  ];
  const activeArray = new Array(functionregistry.length).fill(true);
  await votingPowerAggregatorOwner.upsertSignature(functionregistry, activeArray);
}

async function xvsVaultAggregatorFixture(): Promise<VotingPowerAggregatorFixture> {
  [deployer] = await ethers.getSigners();

  const VotingPowerAggregatorFactory = await smock.mock<VotingPowerAggregator__factory>("VotingPowerAggregator");
  const VotingPowerAggregatorOwnerFactory = await smock.mock<VotingPowerAggregatorOwner__factory>(
    "VotingPowerAggregatorOwner",
  );

  const DataWarehouseFactory = await smock.mock<DataWarehouse__factory>("DataWarehouse");
  dataWarehouse = await DataWarehouseFactory.deploy();
  xvsVault = await smock.fake<MockXVSVault>("MockXVSVault");
  const accessControlManager = await smock.fake<AccessControlManager>("AccessControlManager");
  const endpoint = await smock.fake<ILayerZeroEndpointV2>("ILayerZeroEndpointV2");

  const governorBravoDelegate = await smock.fake<GovernorBravoDelegate>("GovernorBravoDelegate");

  const votingPowerAggregator = await VotingPowerAggregatorFactory.deploy(
    endpoint.address,
    deployer.address,
    readChannel,
    dataWarehouse.address,
    governorBravoDelegate.address,
    xvsVault.address,
  );

  votingPowerAggregatorOwner = await upgrades.deployProxy(
    VotingPowerAggregatorOwnerFactory,
    [accessControlManager.address],
    {
      unsafeAllow: ["constructor", "internal-function-storage"],
      constructorArgs: [votingPowerAggregator.address],
    },
  );

  accessControlManager.isAllowedToCall.returns(true);
  await votingPowerAggregator.setEndpointDelegate(votingPowerAggregatorOwner.address);
  await updateFunctionRegistry(votingPowerAggregatorOwner);
  await votingPowerAggregator.transferOwnership(votingPowerAggregatorOwner.address);

  return {
    votingPowerAggregator,
    governorBravoDelegate,
    xvsVault,
    dataWarehouse,
    endpoint,
    votingPowerAggregatorOwner,
  };
}

describe("VotingPowerAggregator Start Voting Power Sync Test", () => {
  beforeEach(async () => {
    ({ votingPowerAggregator, dataWarehouse, governorBravoDelegate, xvsVault, endpoint } = await loadFixture(
      xvsVaultAggregatorFixture,
    ));
    [deployer, proposer, ...accounts] = await ethers.getSigners();
    arbSepoliaProofData = getProofsJson("arbitrumsepolia");
    opSepoliaProofData = getProofsJson("opsepolia");

    endpoint.send.returns();
    xvsVault.getPriorVotes.returns(parseUnits("100", 18));
  });

  it("should start the voting power sync", async () => {
    const proposalId = 1;
    const arbSyncingParameters = {
      remoteChainEid: ARB_EID,
      blockHash: arbSepoliaProofData.blockHash,
      remoteBlockHeaderRLP: arbSepoliaProofData.blockHeaderRLP,
      xvsVaultStateProofRLP: arbSepoliaProofData.accountStateProofRLP,
    };

    const arbProposerProofs = {
      remoteChainEid: ARB_EID,
      numCheckpointsProof: arbSepoliaProofData.proposerXvsVaultNumCheckpointsStorageProofRlp,
      checkpointsProof: arbSepoliaProofData.proposerXvsVaultCheckpointsStorageProofRlp,
    };

    const opSyncingParameters = {
      remoteChainEid: OPSEPOLIA_EID,
      blockHash: opSepoliaProofData.blockHash,
      remoteBlockHeaderRLP: opSepoliaProofData.blockHeaderRLP,
      xvsVaultStateProofRLP: opSepoliaProofData.accountStateProofRLP,
    };

    const opsepoliaProposerProofs = {
      remoteChainEid: OPSEPOLIA_EID,
      numCheckpointsProof: opSepoliaProofData.proposerXvsVaultNumCheckpointsStorageProofRlp,
      checkpointsProof: opSepoliaProofData.proposerXvsVaultCheckpointsStorageProofRlp,
    };

    let data = votingPowerAggregator.interface.encodeFunctionData("updateNetworkConfig", [
      ARB_EID,
      arbSepoliaProofData.xvsVault,
      RANDOM_ADDRESS, // block hash dispatcher
      true,
    ]);

    await expect(
      deployer.sendTransaction({
        to: votingPowerAggregatorOwner.address,
        data: data,
      }),
    ).to.emit(votingPowerAggregator, "UpdateNetworkConfig");

    data = votingPowerAggregator.interface.encodeFunctionData("updateNetworkConfig", [
      OPSEPOLIA_EID,
      opSepoliaProofData.xvsVault,
      RANDOM_ADDRESS, // block hash dispatcher
      true,
    ]);

    await expect(
      deployer.sendTransaction({
        to: votingPowerAggregatorOwner.address,
        data: data,
      }),
    ).to.emit(votingPowerAggregator, "UpdateNetworkConfig");

    // This time depends on the block number of the block details provided for remote chain.
    await time.setNextBlockTimestamp(1741872577);

    await mine();

    const governanceBravo = await impersonateSigner(governorBravoDelegate.address);
    await fundAccount(governorBravoDelegate.address);

    const tx = await votingPowerAggregator
      .connect(governanceBravo)
      .startVotingPowerSync(
        proposalId,
        arbSepoliaProofData.proposer,
        [arbSyncingParameters, opSyncingParameters],
        [arbProposerProofs, opsepoliaProposerProofs],
        BigNumber.from("50000000000000000000").sub(1),
        RANDOM_ADDRESS,
      );

    const receipt = await tx.wait();
    const blockDetailsPrevBlock = await ethers.provider.getBlock(receipt.blockNumber - 1);

    const arbProposalBlockDetails = await votingPowerAggregator.proposalBlockDetails(proposalId, ARB_EID);
    const opsepoliaProposalBlockDetails = await votingPowerAggregator.proposalBlockDetails(proposalId, OPSEPOLIA_EID);
    const proposalBlockDetailsBsc = await votingPowerAggregator.proposalBlockDetails(proposalId, BSC_CHAIN_ID);

    const arbProposalRemoteChainEid = await votingPowerAggregator.proposalRemoteChainEids(proposalId, 0);
    const opsepoliaProposalRemoteChainEid = await votingPowerAggregator.proposalRemoteChainEids(proposalId, 1);
    expect(arbProposalBlockDetails.blockNumber).to.be.eq(arbSepoliaProofData.blockNumber);
    expect(arbProposalBlockDetails.blockHash).to.be.eq(arbSepoliaProofData.blockHash);
    expect(opsepoliaProposalBlockDetails.blockNumber).to.be.eq(opSepoliaProofData.blockNumber);
    expect(opsepoliaProposalBlockDetails.blockHash).to.be.eq(opSepoliaProofData.blockHash);

    expect(arbProposalRemoteChainEid).to.be.eq(ARB_EID);
    expect(opsepoliaProposalRemoteChainEid).to.be.eq(OPSEPOLIA_EID);
    expect(proposalBlockDetailsBsc.blockNumber).to.be.eq(receipt.blockNumber - 1);
    expect(proposalBlockDetailsBsc.blockHash).to.be.eq(blockDetailsPrevBlock.hash);

    const proposerVotingPower = await votingPowerAggregator.getVotingPower(arbSepoliaProofData.proposer, proposalId, [
      arbProposerProofs,
      opsepoliaProposerProofs,
    ]);

    // Proposer total votes = arb votes + opsepolia votes + bnb votes
    expect(proposerVotingPower).eq(
      BigNumber.from(arbSepoliaProofData.proposerCheckpoint?.votes)
        .add(BigNumber.from(opSepoliaProofData.proposerCheckpoint?.votes))
        .add(parseUnits("100", 18)),
    );
  });
});
