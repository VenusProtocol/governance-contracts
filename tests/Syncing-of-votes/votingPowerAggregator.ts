import { FakeContract, MockContract, smock } from "@defi-wonderland/smock";
import { Options } from "@layerzerolabs/lz-v2-utilities";
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
const READ_CHANNEL = 123;
const PROPOSAL_ID = 1;
const PROPOSAL_THRESHOLD = BigNumber.from("50000000000000000000").sub(1);
const PRIOR_VOTES = parseUnits("100", 18);
const QUOTE_FEE = { nativeFee: 1, lzTokenFee: 0 };

let deployer: SignerWithAddress;
let proposer: Signer;
let accounts: Signer[];
let votingPowerAggregator: MockContract<VotingPowerAggregator>;
let votingPowerAggregatorOwner: MockContract<VotingPowerAggregatorOwner>;
let dataWarehouse: MockContract<DataWarehouse>;
let governorBravoDelegate: FakeContract<GovernorBravoDelegate>;
let xvsVault: FakeContract<MockXVSVault>;
let endpoint: FakeContract<ILayerZeroEndpointV2>;
let governanceBravo: any;

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

let arbSepoliaProofData = getProofsJson("arbitrumsepolia");
let opSepoliaProofData = getProofsJson("opsepolia");

let arbSyncingParameters = {
  remoteChainEid: ARB_EID,
  blockHash: arbSepoliaProofData.blockHash,
  remoteBlockHeaderRLP: arbSepoliaProofData.blockHeaderRLP,
  xvsVaultStateProofRLP: arbSepoliaProofData.accountStateProofRLP,
};

let arbProposerProofs = {
  remoteChainEid: ARB_EID,
  numCheckpointsProof: arbSepoliaProofData.proposerXvsVaultNumCheckpointsStorageProofRlp,
  checkpointsProof: arbSepoliaProofData.proposerXvsVaultCheckpointsStorageProofRlp,
};

let opSyncingParameters = {
  remoteChainEid: OPSEPOLIA_EID,
  blockHash: opSepoliaProofData.blockHash,
  remoteBlockHeaderRLP: opSepoliaProofData.blockHeaderRLP,
  xvsVaultStateProofRLP: opSepoliaProofData.accountStateProofRLP,
};

let opsepoliaProposerProofs = {
  remoteChainEid: OPSEPOLIA_EID,
  numCheckpointsProof: opSepoliaProofData.proposerXvsVaultNumCheckpointsStorageProofRlp,
  checkpointsProof: opSepoliaProofData.proposerXvsVaultCheckpointsStorageProofRlp,
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
    READ_CHANNEL,
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

describe("VotingPowerAggregator Tests", () => {
  beforeEach(async () => {
    ({ votingPowerAggregator, dataWarehouse, governorBravoDelegate, xvsVault, endpoint } = await loadFixture(
      xvsVaultAggregatorFixture,
    ));
    [deployer, proposer, ...accounts] = await ethers.getSigners();

    endpoint.send.returns();
    governorBravoDelegate.activateProposal.returns();
    xvsVault.getPriorVotes.returns(PRIOR_VOTES);

    governanceBravo = await impersonateSigner(governorBravoDelegate.address);
    await fundAccount(governorBravoDelegate.address);

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
  });

  describe("Pausable", () => {
    it("should allow owner to pause and unpause", async () => {
      let data = votingPowerAggregator.interface.encodeFunctionData("pause", []);
      await expect(
        deployer.sendTransaction({
          to: votingPowerAggregatorOwner.address,
          data: data,
        }),
      ).to.emit(votingPowerAggregator, "Paused");
      expect(await votingPowerAggregator.paused()).to.be.true;

      data = votingPowerAggregator.interface.encodeFunctionData("unpause", []);
      await expect(
        deployer.sendTransaction({
          to: votingPowerAggregatorOwner.address,
          data: data,
        }),
      ).to.emit(votingPowerAggregator, "Unpaused");
      expect(await votingPowerAggregator.paused()).to.be.false;
    });

    it("should revert if non-owner tries to pause/unpause", async () => {
      await expect(votingPowerAggregator.pause()).to.be.revertedWith("Ownable: caller is not the owner");

      let data = votingPowerAggregator.interface.encodeFunctionData("pause", []);
      await expect(
        deployer.sendTransaction({
          to: votingPowerAggregatorOwner.address,
          data: data,
        }),
      ).to.emit(votingPowerAggregator, "Paused");

      await expect(votingPowerAggregator.unpause()).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("startVotingPowerSync", () => {
    it("should start the voting power sync", async () => {
      const tx = await votingPowerAggregator
        .connect(governanceBravo)
        .startVotingPowerSync(
          PROPOSAL_ID,
          arbSepoliaProofData.proposer,
          [arbSyncingParameters, opSyncingParameters],
          [arbProposerProofs, opsepoliaProposerProofs],
          PROPOSAL_THRESHOLD,
          RANDOM_ADDRESS,
        );

      const receipt = await tx.wait();
      const blockDetailsPrevBlock = await ethers.provider.getBlock(receipt.blockNumber - 1);

      const arbProposalBlockDetails = await votingPowerAggregator.proposalBlockDetails(PROPOSAL_ID, ARB_EID);
      const opsepoliaProposalBlockDetails = await votingPowerAggregator.proposalBlockDetails(
        PROPOSAL_ID,
        OPSEPOLIA_EID,
      );
      const proposalBlockDetailsBsc = await votingPowerAggregator.proposalBlockDetails(PROPOSAL_ID, BSC_CHAIN_ID);

      const arbProposalRemoteChainEid = await votingPowerAggregator.proposalRemoteChainEids(PROPOSAL_ID, 0);
      const opsepoliaProposalRemoteChainEid = await votingPowerAggregator.proposalRemoteChainEids(PROPOSAL_ID, 1);
      expect(arbProposalBlockDetails.blockNumber).to.be.eq(arbSepoliaProofData.blockNumber);
      expect(arbProposalBlockDetails.blockHash).to.be.eq(arbSepoliaProofData.blockHash);
      expect(opsepoliaProposalBlockDetails.blockNumber).to.be.eq(opSepoliaProofData.blockNumber);
      expect(opsepoliaProposalBlockDetails.blockHash).to.be.eq(opSepoliaProofData.blockHash);

      expect(arbProposalRemoteChainEid).to.be.eq(ARB_EID);
      expect(opsepoliaProposalRemoteChainEid).to.be.eq(OPSEPOLIA_EID);
      expect(proposalBlockDetailsBsc.blockNumber).to.be.eq(receipt.blockNumber - 1);
      expect(proposalBlockDetailsBsc.blockHash).to.be.eq(blockDetailsPrevBlock.hash);

      const proposerVotingPower = await votingPowerAggregator.getVotingPower(
        arbSepoliaProofData.proposer,
        PROPOSAL_ID,
        [arbProposerProofs, opsepoliaProposerProofs],
      );

      // Proposer total votes = arb votes + opsepolia votes + bnb votes
      expect(proposerVotingPower).eq(
        BigNumber.from(arbSepoliaProofData.proposerCheckpoint?.votes)
          .add(BigNumber.from(opSepoliaProofData.proposerCheckpoint?.votes))
          .add(PRIOR_VOTES),
      );
    });

    it("should succeed with enough BSC votes and zero remote votes", async () => {
      await expect(
        await votingPowerAggregator.connect(governanceBravo).startVotingPowerSync(
          PROPOSAL_ID,
          arbSepoliaProofData.proposer,
          [], // no remote votes
          [],
          PROPOSAL_THRESHOLD,
          RANDOM_ADDRESS,
        ),
      ).to.be.not.revertedWithCustomError(votingPowerAggregator, "ProposalThresholdNotMet");
      // needs to be called explicity when no remote proofs are sent
      await expect(await votingPowerAggregator.isProposalSynced(PROPOSAL_ID)).to.be.true;
    });

    it("should revert early if voting power below threshold", async () => {
      const PRIOR_VOTES = parseUnits("10", 18);
      xvsVault.getPriorVotes.returns(PRIOR_VOTES);

      await expect(
        votingPowerAggregator
          .connect(governanceBravo)
          .startVotingPowerSync(
            PROPOSAL_ID,
            arbSepoliaProofData.proposer,
            [arbSyncingParameters],
            [arbProposerProofs],
            PROPOSAL_THRESHOLD,
            RANDOM_ADDRESS,
          ),
      ).to.be.revertedWithCustomError(votingPowerAggregator, "ProposalThresholdNotMet");
    });

    it("should revert if block timestamp is invalid", async () => {
      // Should revert if the block timestamp is set more than 600 seconds ahead of the provided proofs.
      await time.setNextBlockTimestamp(1741873577);
      await mine();

      await expect(
        votingPowerAggregator
          .connect(governanceBravo)
          .startVotingPowerSync(
            PROPOSAL_ID,
            arbSepoliaProofData.proposer,
            [arbSyncingParameters],
            [arbProposerProofs],
            PROPOSAL_THRESHOLD,
            RANDOM_ADDRESS,
          ),
      ).to.be.revertedWithCustomError(votingPowerAggregator, "InvalidBlockTimestamp");
    });

    it("should revert if caller is not governor", async () => {
      const nonGovernor = accounts[0];
      const proposerAdd = await proposer.getAddress();

      await expect(
        votingPowerAggregator
          .connect(nonGovernor)
          .startVotingPowerSync(
            PROPOSAL_ID,
            proposerAdd,
            [arbSyncingParameters],
            [arbProposerProofs],
            PROPOSAL_THRESHOLD,
            RANDOM_ADDRESS,
          ),
      ).to.be.revertedWithCustomError(votingPowerAggregator, "InvalidCaller");
    });

    it("should revert if proposerVotingProofs length exceeds syncingParameters length", async () => {
      const proposerAdd = await proposer.getAddress();

      await expect(
        votingPowerAggregator.connect(governanceBravo).startVotingPowerSync(
          PROPOSAL_ID,
          proposerAdd,
          [arbSyncingParameters], // 1 syncing parameter
          [arbProposerProofs, opsepoliaProposerProofs], // 2 proofs
          PROPOSAL_THRESHOLD,
          "0x",
        ),
      ).to.be.revertedWithCustomError(votingPowerAggregator, "LengthMismatch");
    });

    it("should revert if remote chain is not supported", async () => {
      const unsupportedChainEid = 9999; // unsupported chain ID
      const unsupportedSyncingParameters = {
        remoteChainEid: unsupportedChainEid,
        blockHash: arbSepoliaProofData.blockHash,
        remoteBlockHeaderRLP: arbSepoliaProofData.blockHeaderRLP,
        xvsVaultStateProofRLP: arbSepoliaProofData.accountStateProofRLP,
      };
      const unsupportedProposerProofs = {
        remoteChainEid: unsupportedChainEid,
        numCheckpointsProof: arbSepoliaProofData.proposerXvsVaultNumCheckpointsStorageProofRlp,
        checkpointsProof: arbSepoliaProofData.proposerXvsVaultCheckpointsStorageProofRlp,
      };
      const proposerAdd = await proposer.getAddress();

      await expect(
        votingPowerAggregator
          .connect(governanceBravo)
          .startVotingPowerSync(
            PROPOSAL_ID,
            proposerAdd,
            [unsupportedSyncingParameters],
            [unsupportedProposerProofs],
            PROPOSAL_THRESHOLD,
            RANDOM_ADDRESS,
          ),
      )
        .to.be.revertedWithCustomError(votingPowerAggregator, "RemoteChainNotSupported")
        .withArgs(unsupportedChainEid);
    });
  });

  describe("isProposalSynced", () => {
    it("should return false when all remote hash are not received", async () => {
      await votingPowerAggregator
        .connect(governanceBravo)
        .startVotingPowerSync(
          PROPOSAL_ID,
          arbSepoliaProofData.proposer,
          [arbSyncingParameters, opSyncingParameters],
          [arbProposerProofs, opsepoliaProposerProofs],
          PROPOSAL_THRESHOLD,
          RANDOM_ADDRESS,
        );

      expect(await votingPowerAggregator.isProposalSynced(PROPOSAL_ID)).to.be.false;
    });

    it("should return true when all remote hash are received", async () => {
      await votingPowerAggregator
        .connect(governanceBravo)
        .startVotingPowerSync(
          PROPOSAL_ID,
          arbSepoliaProofData.proposer,
          [arbSyncingParameters],
          [arbProposerProofs],
          PROPOSAL_THRESHOLD,
          RANDOM_ADDRESS,
        );
      const origin = {
        srcEid: READ_CHANNEL,
        sender: ethers.utils.hexZeroPad(votingPowerAggregator.address, 32),
        nonce: 1,
      };
      const payload = ethers.utils.defaultAbiCoder.encode(
        ["uint256", "uint256", "bytes32", "uint32"],
        [PROPOSAL_ID, arbSepoliaProofData.blockNumber, arbSepoliaProofData.blockHash, ARB_EID],
      );
      const endpointAdd = await impersonateSigner(endpoint.address);
      await fundAccount(endpoint.address);

      let data = votingPowerAggregator.interface.encodeFunctionData("setReadChannel", [READ_CHANNEL, true]);
      await deployer.sendTransaction({
        to: votingPowerAggregatorOwner.address,
        data: data,
      }),
        await votingPowerAggregator
          .connect(endpointAdd)
          .lzReceive(
            origin,
            ethers.utils.hexZeroPad("0x", 32),
            payload,
            "0x1111111111111111111111111111111111111111",
            "0x",
          );

      expect(await votingPowerAggregator.isProposalSynced(PROPOSAL_ID)).to.be.true;
    });
  });

  describe("getVotingPower", () => {
    it("should return correct voting power from voting proofs", async () => {
      const PRIOR_VOTES = parseUnits("30", 18);
      xvsVault.getPriorVotes.returns(PRIOR_VOTES);

      await votingPowerAggregator
        .connect(governanceBravo)
        .startVotingPowerSync(
          PROPOSAL_ID,
          arbSepoliaProofData.proposer,
          [arbSyncingParameters],
          [arbProposerProofs],
          PROPOSAL_THRESHOLD,
          RANDOM_ADDRESS,
        );

      const votesFromProof = BigNumber.from(arbSepoliaProofData.proposerCheckpoint?.votes || "0");
      const votes = await votingPowerAggregator.getVotingPower(arbSepoliaProofData.proposer, PROPOSAL_ID, [
        arbProposerProofs,
      ]);
      expect(votes).to.equal(votesFromProof.add(PRIOR_VOTES));
    });

    it("should return voting power of BSC only when no remote proofs provided", async () => {
      await votingPowerAggregator
        .connect(governanceBravo)
        .startVotingPowerSync(PROPOSAL_ID, arbSepoliaProofData.proposer, [], [], PROPOSAL_THRESHOLD, RANDOM_ADDRESS);

        const votes = await votingPowerAggregator.getVotingPower(arbSepoliaProofData.proposer, PROPOSAL_ID, []);
      expect(votes).to.equal(PRIOR_VOTES);
    });
  });

  describe("quoteRemoteBlockHash", function () {
    it("should quote messaging fee correctly", async function () {
      endpoint.quote.returns(QUOTE_FEE);
      const options = Options.newOptions().addExecutorLzReceiveOption(50000, 0).toBytes();
      const blockNumber = 132006869;
      const result = await votingPowerAggregator.quoteRemoteBlockHash(
        PROPOSAL_ID,
        [ARB_EID],
        [blockNumber],
        options,
        false,
      );
      expect(result.nativeFee).to.equal(QUOTE_FEE.nativeFee);
      expect(result.nativeFee).to.equal(QUOTE_FEE.nativeFee);
    });
  });
});
