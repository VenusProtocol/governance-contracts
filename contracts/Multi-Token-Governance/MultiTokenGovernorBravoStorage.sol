// SPDX-License-Identifier: BSD-3-Clause

pragma solidity 0.8.25;

import { ITimelock } from "./ITimelock.sol";
import { IVaultAggregator } from "./IVaultAggregator.sol";

/**
 * @title MultiTokenGovernorBravoEvents
 * @author Venus
 * @notice Set of events emitted by the MultiTokenGovernorBravo contracts.
 */
contract MultiTokenGovernorBravoEvents {
    /// @notice An event emitted when a new proposal is created
    event ProposalCreated(
        uint256 id,
        address proposer,
        address[] targets,
        uint[] values,
        string[] signatures,
        bytes[] calldatas,
        uint256 startBlock,
        uint256 endBlock,
        string description,
        uint8 proposalType,
        uint8[] weights
    );

    /// @notice An event emitted when a vote has been cast on a proposal
    /// @param voter The address which casted a vote
    /// @param proposalId The proposal id which was voted on
    /// @param support Support value for the vote. 0=against, 1=for, 2=abstain
    /// @param votes Number of votes which were cast by the voter
    /// @param reason The reason given for the vote by the voter
    event VoteCast(address indexed voter, uint256 proposalId, uint8 support, uint256 votes, string reason);

    /// @notice An event emitted when a proposal has been canceled
    event ProposalCanceled(uint256 indexed id);

    /// @notice An event emitted when a proposal has been queued in the Timelock
    event ProposalQueued(uint256 indexed id, uint256 eta);

    /// @notice An event emitted when a proposal has been executed in the Timelock
    event ProposalExecuted(uint256 indexed id);

    /// @notice An event emitted when the voting delay is set
    event VotingDelaySet(uint256 oldVotingDelay, uint256 newVotingDelay);

    /// @notice An event emitted when the voting period is set
    event VotingPeriodSet(uint256 oldVotingPeriod, uint256 newVotingPeriod);

    /// @notice Emitted when implementation is changed
    event NewImplementation(address oldImplementation, address newImplementation);

    /// @notice Emitted when proposal threshold is set
    event ProposalThresholdSet(uint256 oldProposalThreshold, uint256 newProposalThreshold);

    /// @notice Emitted when the new guardian address is set
    event NewGuardian(address oldGuardian, address newGuardian);

    /// @notice Emitted when the maximum number of operations in one proposal is updated
    event ProposalMaxOperationsUpdated(uint256 oldMaxOperations, uint256 newMaxOperations);

    /// @notice Emitted when Vault Aggregator address updated
    event UpdateVaultAggregator(address indexed oldVaultAggregator, address indexed newVaultAggregator);
}

/**
 * @title MultiTokenGovernanceErrors
 * @author Venus
 * @notice This contract contains custom error definitions for Multi-Token Governance.
 */
contract MultiTokenGovernanceErrors {
    /// @notice Thrown when length mismatches
    error InvalidLength();

    /// @notice Thrown when votes are under threshold
    error UnderThreshold();

    /// @notice Thrown if identical transaction come twice
    error IdenticalTransaction();
}

/**
 * @title MultiTokenGovernorBravoDelegateStorageV1
 * @dev For future upgrades, do not change MultiTokenGovernorBravoDelegateStorageV1. Create a new
 * contract which implements MultiTokenGovernorBravoDelegateStorageV1 and following the naming convention
 * GovernorBravoDelegateStorageVX.
 */
contract MultiTokenGovernorBravoDelegateStorageV1 {
    /// @notice DEPRECATED The delay before voting on a proposal may take place, once proposed, in blocks
    uint256 public votingDelay;

    /// @notice DEPRECATED The duration of voting on a proposal, in blocks
    uint256 public votingPeriod;

    /// @notice DEPRECATED The number of votes required in order for a voter to become a proposer
    uint256 public proposalThreshold;

    /// @notice Initial proposal id set at become
    uint256 public initialProposalId;

    /// @notice The total number of proposals
    uint256 public proposalCount;

    /// @notice The address of the Venus Protocol Timelock
    ITimelock public timelock;

    /// @notice The address of the VaultAggregator
    IVaultAggregator public vaultAggregator;

    /// @notice The official record of all proposals ever proposed
    mapping(uint256 => Proposal) public proposals;

    /// @notice The latest proposal for each proposer
    mapping(address => uint) public latestProposalIds;

    /// @notice The receipt of each voter based on proposal id
    mapping(uint256 => mapping(address => Receipt)) public receipts;

    struct Proposal {
        /// @notice Unique id for looking up a proposal
        uint256 id;
        /// @notice Creator of the proposal
        address proposer;
        /// @notice The timestamp that the proposal will be available for execution, set once the vote succeeds
        uint256 eta;
        /// @notice the ordered list of target addresses for calls to be made
        address[] targets;
        /// @notice The ordered list of values (i.e. msg.value) to be passed to the calls to be made
        uint[] values;
        /// @notice The ordered list of function signatures to be called
        string[] signatures;
        /// @notice The ordered list of calldata to be passed to each call
        bytes[] calldatas;
        /// @notice The block at which voting begins: holders must delegate their votes prior to this block
        uint256 startBlock;
        /// @notice The block at which voting ends: votes must be cast prior to this block
        uint256 endBlock;
        /// @notice Current number of votes in favor of this proposal
        uint256 forVotes;
        /// @notice Current number of votes in opposition to this proposal
        uint256 againstVotes;
        /// @notice Current number of votes for abstaining for this proposal
        uint256 abstainVotes;
        /// @notice Flag marking whether the proposal has been canceled
        bool canceled;
        /// @notice Flag marking whether the proposal has been executed
        bool executed;
        /// @notice The type of the proposal
        uint8 proposalType;
        ///@notice Weights of each supported tokens, it can be zero
        uint8[] weights;
    }

    /// @notice Ballot receipt record for a voter
    struct Receipt {
        /// @notice Whether or not a vote has been cast
        bool hasVoted;
        /// @notice Whether or not the voter supports the proposal or abstains
        uint8 support;
        /// @notice The number of votes the voter had, which were cast
        uint96 votes;
    }

    /// @notice Possible states that a proposal may be in
    enum ProposalState {
        Pending,
        Active,
        Canceled,
        Defeated,
        Succeeded,
        Queued,
        Expired,
        Executed
    }

    /// @notice The maximum number of actions that can be included in a proposal
    uint256 public proposalMaxOperations;

    /// @notice A privileged role that can cancel any proposal
    address public guardian;
}

/**
 * @title MultiTokenGovernorBravoDelegateStorageV2
 * @dev For future upgrades, do not change MultiTokenGovernorBravoDelegateStorageV1. Create a new
 * contract which implements MultiTokenGovernorBravoDelegateStorageV2 and following the naming convention
 * GovernorBravoDelegateStorageVX.
 */
contract MultiTokenGovernorBravoDelegateStorageV2 is MultiTokenGovernorBravoDelegateStorageV1 {
    enum ProposalType {
        NORMAL,
        FASTTRACK,
        CRITICAL
    }

    struct ProposalConfig {
        /// @notice The delay before voting on a proposal may take place, once proposed, in blocks
        uint256 votingDelay;
        /// @notice The duration of voting on a proposal, in blocks
        uint256 votingPeriod;
        /// @notice The number of votes required in order for a voter to become a proposer
        uint256 proposalThreshold;
    }

    /// @notice mapping containing configuration for each proposal type
    mapping(uint256 => ProposalConfig) public proposalConfigs;

    /// @notice mapping containing Timelock addresses for each proposal type
    mapping(uint256 => ITimelock) public proposalTimelocks;
}
