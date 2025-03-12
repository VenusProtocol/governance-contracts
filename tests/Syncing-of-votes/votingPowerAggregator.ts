import fs from "fs";
import { FakeContract, MockContract, smock } from "@defi-wonderland/smock";
import { loadFixture, mine, time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { BigNumber, Signer } from "ethers";
import { ethers } from "hardhat";
import { 
  DataWarehouse__factory,
  GovernorBravoDelegate,
  VotingPowerAggregator__factory,
  MockXVSVault,
  VotingPowerAggregator,
  DataWarehouse,
  ILayerZeroEndpointV2 
} from "../../typechain";
import { fundAccount, impersonateSigner } from "../../helpers/utils";

type ProofData = {
  blockNumber?: number;
  blockHash?: string;
  accountStateProofRLP?: string;
  blockHeaderRLP?: string;
  xvsVaultAddress?: string;
  checkpointsSlot?: string;
  numCheckpointsSlot?: string;
  checkpointsSlotHash?: string;
  numCheckpointsSlotHash?: string;
  numCheckpoints?: number;
  xvsVaultNumCheckpointsStorageProofRlp?: string;
  checkpoint?: {
    fromBlockNumber?: string;
    votes?: string;
  };
  xvsVaultCheckpointsStorageProofRlp?: string;
  voter?: string;
  xvsVault?: string;
};

const BASE_EID = 40245;
const ARB_EID = 40231;
const BSC_CHAIN_ID = 5656;
const RANDOM_ADDRESS = "0x1111111111111111111111111111111111111111"

let root: Signer;
let proposer: Signer;
let accounts: Signer[];
let votingPowerAggregator: MockContract<VotingPowerAggregator>;
let dataWarehouse: MockContract<DataWarehouse>;
let governorBravoDelegate: FakeContract<GovernorBravoDelegate>;
let xvsVault: FakeContract<MockXVSVault>;
let endpoint: FakeContract<ILayerZeroEndpointV2>;
let arbSepoliaProofData: ProofData;
let baseSepoliaProofData: ProofData;

type VotingPowerAggregatorFixture = {
  votingPowerAggregator: MockContract<VotingPowerAggregator>;
  dataWarehouse: MockContract<DataWarehouse>;
  governorBravoDelegate: FakeContract<GovernorBravoDelegate>;
  xvsVault: FakeContract<MockXVSVault>;
  endpoint: FakeContract<ILayerZeroEndpointV2>;
};

const getProofsJson = (network: string): ProofData => {
  try {
    const file = fs.readFileSync(`${__dirname}/syncingParameters/${network}Proofs.json`);
    return JSON.parse(file.toString());
  } catch (error) {
    return {};
  }
};

async function xvsVaultAggregatorFixture(): Promise<VotingPowerAggregatorFixture> {
  const VotingPowerAggregatorFactory = await smock.mock<VotingPowerAggregator__factory>("VotingPowerAggregator");
  const DataWarehouseFactory = await smock.mock<DataWarehouse__factory>("DataWarehouse");
  const dataWarehouse = await DataWarehouseFactory.deploy();
  const xvsVault = await smock.fake<MockXVSVault>("MockXVSVault");
  const endpoint = await smock.fake<ILayerZeroEndpointV2>("ILayerZeroEndpointV2");
  
  const governorBravoDelegate = await smock.fake<GovernorBravoDelegate>("GovernorBravoDelegate");
  const votingPowerAggregator = await VotingPowerAggregatorFactory.deploy(
    endpoint.address,
    123,
    dataWarehouse.address,
    governorBravoDelegate.address,
    RANDOM_ADDRESS,
    xvsVault.address
  );
  
  return { votingPowerAggregator, governorBravoDelegate, xvsVault, dataWarehouse, endpoint };
}

describe("VotingPowerAggregator Start Voting Power Sync Test", () => {
  beforeEach(async () => {
    ({ votingPowerAggregator, dataWarehouse, governorBravoDelegate, xvsVault, endpoint } = await loadFixture(xvsVaultAggregatorFixture));
    [root, proposer, ...accounts] = await ethers.getSigners();
    arbSepoliaProofData = getProofsJson("arbitrumsepolia");
    baseSepoliaProofData = getProofsJson("basesepolia");

    // mock lzRead based functions
    endpoint.setDelegate.returns();
    endpoint.send.returns();
  });

  it("should start the voting power sync", async () => {
    const proposalId = 1;
    const arbSyncingParameters = {
      remoteChainEid: ARB_EID,
      blockHash: arbSepoliaProofData.blockHash,
      remoteBlockHeaderRLP: arbSepoliaProofData.blockHeaderRLP,
      xvsVaultStateProofRLP: arbSepoliaProofData.accountStateProofRLP
    };

    const arbProposerProofs = {
      remoteChainEid: ARB_EID,
      numCheckpointsProof: arbSepoliaProofData.xvsVaultNumCheckpointsStorageProofRlp,
      checkpointsProof: arbSepoliaProofData.xvsVaultCheckpointsStorageProofRlp,
    };

    await votingPowerAggregator.updateNetworkConfig(
      ARB_EID,
      arbSepoliaProofData.xvsVault,
      RANDOM_ADDRESS, // block hash dispatcher
      true
    )

    // This time depends on the block number of the block details provided for remote chain.
    await time.setNextBlockTimestamp(1741671300);
    await mine();

    const governanceBravo = await impersonateSigner(governorBravoDelegate.address)
    await fundAccount(governorBravoDelegate.address)

    const tx = await votingPowerAggregator.connect(governanceBravo).startVotingPowerSync(
      proposalId,
      arbSepoliaProofData.voter,
      [arbSyncingParameters],
      [arbProposerProofs],
      BigNumber.from("50000000000000000000").sub(1),
      RANDOM_ADDRESS
    );

    const receipt = await tx.wait();
    const blockDetailsPrevBlock = await ethers.provider.getBlock(receipt.blockNumber - 1);

    const proposalBlockDetails = await votingPowerAggregator.proposalBlockDetails(proposalId, ARB_EID);
    const proposalBlockDetailsBsc = await votingPowerAggregator.proposalBlockDetails(proposalId, BSC_CHAIN_ID);
    
    const proposalRemoteChainEid = await votingPowerAggregator.proposalRemoteChainEids(proposalId, 0);
    expect(proposalBlockDetails.blockNumber).to.be.eq(arbSepoliaProofData.blockNumber);
    expect(proposalBlockDetails.blockHash).to.be.eq(arbSepoliaProofData.blockHash);
    expect(proposalRemoteChainEid).to.be.eq(ARB_EID);
    expect(proposalBlockDetailsBsc.blockNumber).to.be.eq(receipt.blockNumber - 1);
    expect(proposalBlockDetailsBsc.blockHash).to.be.eq(blockDetailsPrevBlock.hash);

    // check for lzRead calls and params as well
  });
})