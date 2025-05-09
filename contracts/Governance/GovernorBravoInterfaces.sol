pragma solidity ^0.5.16;
pragma experimental ABIEncoderV2;

/**
 * @title GovernorBravoEvents
 * @author Venus
 * @notice Set of events emitted by the GovernorBravo contracts.
 */
contract GovernorBravoEvents {
    /// @notice An event emitted when a new proposal is created
    event ProposalCreated(
        uint id,
        address proposer,
        address[] targets,
        uint[] values,
        string[] signatures,
        bytes[] calldatas,
        uint startBlock,
        uint endBlock,
        string description,
        uint8 proposalType
    );

    /// @notice An event emitted when a vote has been cast on a proposal
    /// @param voter The address which casted a vote
    /// @param proposalId The proposal id which was voted on
    /// @param support Support value for the vote. 0=against, 1=for, 2=abstain
    /// @param votes Number of votes which were cast by the voter
    /// @param reason The reason given for the vote by the voter
    event VoteCast(address indexed voter, uint proposalId, uint8 support, uint votes, string reason);

    /// @notice An event emitted when a proposal has been canceled
    event ProposalCanceled(uint id);

    /// @notice An event emitted when a proposal has been queued in the Timelock
    event ProposalQueued(uint id, uint eta);

    /// @notice An event emitted when a proposal has been executed in the Timelock
    event ProposalExecuted(uint id);

    /// @notice An event emitted when the voting delay is set
    event VotingDelaySet(uint oldVotingDelay, uint newVotingDelay);

    /// @notice An event emitted when the voting period is set
    event VotingPeriodSet(uint oldVotingPeriod, uint newVotingPeriod);

    /// @notice Emitted when implementation is changed
    event NewImplementation(address oldImplementation, address newImplementation);

    /// @notice Emitted when proposal threshold is set
    event ProposalThresholdSet(uint oldProposalThreshold, uint newProposalThreshold);

    /// @notice Emitted when pendingAdmin is changed
    event NewPendingAdmin(address oldPendingAdmin, address newPendingAdmin);

    /// @notice Emitted when pendingAdmin is accepted, which means admin is updated
    event NewAdmin(address oldAdmin, address newAdmin);

    /// @notice Emitted when the new guardian address is set
    event NewGuardian(address oldGuardian, address newGuardian);

    /// @notice Emitted when the maximum number of operations in one proposal is updated
    event ProposalMaxOperationsUpdated(uint oldMaxOperations, uint newMaxOperations);

    /// @notice Emitted when the new validation params are set
    event SetValidationParams(
        uint256 oldMinVotingPeriod,
        uint256 newMinVotingPeriod,
        uint256 oldmaxVotingPeriod,
        uint256 newmaxVotingPeriod,
        uint256 oldminVotingDelay,
        uint256 newminVotingDelay,
        uint256 oldmaxVotingDelay,
        uint256 newmaxVotingDelay
    );

    /// @notice Emitted when new Proposal configs added
    event SetProposalConfigs(uint256 votingPeriod, uint256 votingDelay, uint256 proposalThreshold);
}

/**
 * @title GovernorBravoDelegatorStorage
 * @author Venus
 * @notice Storage layout of the `GovernorBravoDelegator` contract
 */
contract GovernorBravoDelegatorStorage {
    /// @notice Administrator for this contract
    address public admin;

    /// @notice Pending administrator for this contract
    address public pendingAdmin;

    /// @notice Active brains of Governor
    address public implementation;
}

/**
 * @title GovernorBravoDelegateStorageV1
 * @dev For future upgrades, do not change GovernorBravoDelegateStorageV1. Create a new
 * contract which implements GovernorBravoDelegateStorageV1 and following the naming convention
 * GovernorBravoDelegateStorageVX.
 */
contract GovernorBravoDelegateStorageV1 is GovernorBravoDelegatorStorage {
    /// @notice DEPRECATED The delay before voting on a proposal may take place, once proposed, in blocks
    uint public votingDelay;

    /// @notice DEPRECATED The duration of voting on a proposal, in blocks
    uint public votingPeriod;

    /// @notice DEPRECATED The number of votes required in order for a voter to become a proposer
    uint public proposalThreshold;

    /// @notice Initial proposal id set at become
    uint public initialProposalId;

    /// @notice The total number of proposals
    uint public proposalCount;

    /// @notice The address of the Venus Protocol Timelock
    TimelockInterface public timelock;

    /// @notice The address of the Venus governance token
    XvsVaultInterface public xvsVault;

    /// @notice The official record of all proposals ever proposed
    mapping(uint => Proposal) public proposals;

    /// @notice The latest proposal for each proposer
    mapping(address => uint) public latestProposalIds;

    struct Proposal {
        /// @notice Unique id for looking up a proposal
        uint id;
        /// @notice Creator of the proposal
        address proposer;
        /// @notice The timestamp that the proposal will be available for execution, set once the vote succeeds
        uint eta;
        /// @notice the ordered list of target addresses for calls to be made
        address[] targets;
        /// @notice The ordered list of values (i.e. msg.value) to be passed to the calls to be made
        uint[] values;
        /// @notice The ordered list of function signatures to be called
        string[] signatures;
        /// @notice The ordered list of calldata to be passed to each call
        bytes[] calldatas;
        /// @notice The block at which voting begins: holders must delegate their votes prior to this block
        uint startBlock;
        /// @notice The block at which voting ends: votes must be cast prior to this block
        uint endBlock;
        /// @notice Current number of votes in favor of this proposal
        uint forVotes;
        /// @notice Current number of votes in opposition to this proposal
        uint againstVotes;
        /// @notice Current number of votes for abstaining for this proposal
        uint abstainVotes;
        /// @notice Flag marking whether the proposal has been canceled
        bool canceled;
        /// @notice Flag marking whether the proposal has been executed
        bool executed;
        /// @notice Receipts of ballots for the entire set of voters
        mapping(address => Receipt) receipts;
        /// @notice The type of the proposal
        uint8 proposalType;
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
    uint public proposalMaxOperations;

    /// @notice A privileged role that can cancel any proposal
    address public guardian;
}

/**
 * @title GovernorBravoDelegateStorageV2
 * @dev For future upgrades, do not change GovernorBravoDelegateStorageV2. Create a new
 * contract which implements GovernorBravoDelegateStorageV2 and following the naming convention
 * GovernorBravoDelegateStorageVX.
 */
contract GovernorBravoDelegateStorageV2 is GovernorBravoDelegateStorageV1 {
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
    mapping(uint => ProposalConfig) public proposalConfigs;

    /// @notice mapping containing Timelock addresses for each proposal type
    mapping(uint => TimelockInterface) public proposalTimelocks;
}

/**
 * @title GovernorBravoDelegateStorageV3
 * @dev For future upgrades, do not change GovernorBravoDelegateStorageV3. Create a new
 * contract which implements GovernorBravoDelegateStorageV3 and following the naming convention
 * GovernorBravoDelegateStorageVX.
 */
contract GovernorBravoDelegateStorageV3 is GovernorBravoDelegateStorageV2 {
    struct ValidationParams {
        uint256 minVotingPeriod;
        uint256 maxVotingPeriod;
        uint256 minVotingDelay;
        uint256 maxVotingDelay;
    }
    /// @notice Stores the current minimum and maximum values of voting delay and voting period
    ValidationParams public validationParams;
}

/**
 * @title TimelockInterface
 * @author Venus
 * @notice Interface implemented by the Timelock contract.
 */
interface TimelockInterface {
    function delay() external view returns (uint);

    function GRACE_PERIOD() external view returns (uint);

    function acceptAdmin() external;

    function queuedTransactions(bytes32 hash) external view returns (bool);

    function queueTransaction(
        address target,
        uint value,
        string calldata signature,
        bytes calldata data,
        uint eta
    ) external returns (bytes32);

    function cancelTransaction(
        address target,
        uint value,
        string calldata signature,
        bytes calldata data,
        uint eta
    ) external;

    function executeTransaction(
        address target,
        uint value,
        string calldata signature,
        bytes calldata data,
        uint eta
    ) external payable returns (bytes memory);
}

interface XvsVaultInterface {
    function getPriorVotes(address account, uint blockNumber) external view returns (uint96);
}

interface GovernorAlphaInterface {
    /// @notice The total number of proposals
    function proposalCount() external returns (uint);
}
