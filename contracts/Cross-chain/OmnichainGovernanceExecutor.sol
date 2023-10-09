// // SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@layerzerolabs/solidity-examples/contracts/lzApp/NonblockingLzApp.sol";
import { BaseOmnichainControllerDest } from "./BaseOmnichainControllerDest.sol";
import { TimelockInterface } from "./interfaces/TimelockInterface.sol";

/// @title Omnichain Governance Executor
/// @notice Executes the proposal transactions sent from the main chain
/// @dev The owner of this contract controls LayerZero configuration. When used in production the owner will be OmnichainExecutor
/// This implementation is non-blocking meaning the failed messages will not block the future messages from the source.
/// For the blocking behavior derive the contract from LzApp
contract OmnichainGovernanceExecutor is ReentrancyGuard, BaseOmnichainControllerDest {
    using BytesLib for bytes;
    using ExcessivelySafeCall for address;

    enum ProposalType {
        NORMAL,
        FASTTRACK,
        CRITICAL
    }
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
        /// @notice Flag marking whether the proposal has been canceled
        bool canceled;
        /// @notice Flag marking whether the proposal has been executed
        bool executed;
        /// @notice The type of the proposal
        uint8 proposalType;
    }

    /// @notice A privileged role that can cancel any proposal
    address public immutable guardian;

    /// @notice Timestamp on which proposal is received
    uint256 public proposalRecievedTimestamp;

    // @notice The official record of all proposals ever proposed
    mapping(uint256 => Proposal) public proposals;

    /// @notice mapping containing Timelock addresses for each proposal type
    mapping(uint256 => TimelockInterface) public proposalTimelocks;

    /// @notice Represents queue state of proposal
    mapping(uint256 => bool) public queued;

    /// @notice Emitted when proposal executed
    event ProposalExecuted(uint);

    /// @notice Emitted when proposal failed
    event ProposalFailed(uint16 _srcChainId, bytes _srcAddress, uint64 _nonce, bytes _reason);

    /// @notice Emmitted when proposal is queued
    event ProposalQueued(uint, uint);

    /// @notice Emitted on creation of proposal
    event ProposalCreated(uint, address, uint, address[], uint[], string[], bytes[], uint8);

    /// @notice Emitted when proposal cancelled
    event ProposalCanceled(uint);

    /// @notice Emitted while setting execution delay
    event SetExecuteDelay(uint, uint);

    constructor(
        address endpoint_,
        TimelockInterface[] memory timelocks,
        address guardian_
    ) BaseOmnichainControllerDest(endpoint_) {
        require(
            timelocks.length == uint8(ProposalType.CRITICAL) + 1,
            "OmnichainGovernanceExecutor::initialize:number of timelocks should match number of governance routes"
        );

        guardian = guardian_;

        uint256 arrLength = timelocks.length;
        for (uint256 i; i < arrLength; ++i) {
            require(
                address(timelocks[i]) != address(0),
                "OmnichainGovernanceExecutor::initialize:invalid timelock address"
            );
            proposalTimelocks[i] = timelocks[i];
        }
    }

    /// @notice Executes a queued proposal if eta has passed
    /// @param proposalId_ The id of the proposal to execute
    function execute(uint256 proposalId_) external {
        require(
            queued[proposalId_],
            "OmnichainGovernanceExecutor::execute: proposal can only be executed if it is queued"
        );

        Proposal storage proposal = proposals[proposalId_];

        for (uint256 i; i < proposal.targets.length; ++i) {
            proposalTimelocks[uint8(proposal.proposalType)].executeTransaction(
                proposal.targets[i],
                proposal.values[i],
                proposal.signatures[i],
                proposal.calldatas[i],
                proposal.eta
            );
        }
        proposal.executed = true;
        emit ProposalExecuted(proposalId_);
    }

    /// @notice Cancels a proposal only if sender is the proposer, or proposer delegates dropped below proposal threshold
    /// @param proposalId_ The id of the proposal to cancel

    function cancel(uint256 proposalId_) external {
        Proposal storage proposal = proposals[proposalId_];
        require(!proposal.executed, "OmnichainGovernanceExecutor::cancel: cannot cancel executed proposal");
        require(
            msg.sender == guardian || msg.sender == proposal.proposer,
            "OmnichainGovernanceExecutor::cancel: proposer above threshold"
        );

        proposal.canceled = true;
        for (uint256 i = 0; i < proposal.targets.length; i++) {
            proposalTimelocks[proposal.proposalType].cancelTransaction(
                proposal.targets[i],
                proposal.values[i],
                proposal.signatures[i],
                proposal.calldatas[i],
                proposal.eta
            );
        }

        emit ProposalCanceled(proposalId_);
    }

    // overriding the virtual function in LzReceiver
    function _blockingLzReceive(
        uint16 srcChainId_,
        bytes memory srcAddress_,
        uint64 nonce_,
        bytes memory payload_
    ) internal virtual override whenNotPaused {
        bytes32 hashedPayload = keccak256(payload_);
        uint256 gasToStoreAndEmit = 30000; // enough gas to ensure we can store the payload and emit the event

        (bool success, bytes memory reason) = address(this).excessivelySafeCall(
            gasleft() - gasToStoreAndEmit,
            150,
            abi.encodeWithSelector(this.nonblockingLzReceive.selector, srcChainId_, srcAddress_, nonce_, payload_)
        );
        // try-catch all errors/exceptions
        if (!success) {
            failedMessages[srcChainId_][srcAddress_][nonce_] = hashedPayload;
            emit ProposalFailed(srcChainId_, srcAddress_, nonce_, reason); // Retrieve payload from the src side tx if needed to clear
        }
        proposalRecievedTimestamp = block.timestamp;
    }

    /// @dev Called by LayerZero Endpoint when a message from the source is received
    function _nonblockingLzReceive(
        uint16 srcChainId_,
        bytes memory,
        uint64,
        bytes memory payload_
    ) internal virtual override {
        (
            address[] memory targets,
            uint[] memory values,
            string[] memory signatures,
            bytes[] memory calldatas,
            uint256 pId,
            uint8 pType
        ) = abi.decode(payload_, (address[], uint[], string[], bytes[], uint256, uint8));
        _isEligibleToReceive(srcChainId_, targets.length);
        Proposal memory newProposal = Proposal({
            id: pId,
            proposer: tx.origin,
            eta: 0,
            targets: targets,
            values: values,
            signatures: signatures,
            calldatas: calldatas,
            canceled: false,
            executed: false,
            proposalType: pType
        });

        proposals[newProposal.id] = newProposal;

        emit ProposalCreated(newProposal.id, tx.origin, 0, targets, values, signatures, calldatas, pType);
        _queue(pId);
    }

    /// @notice Queues a proposal of state succeeded
    /// @param proposalId_ The id of the proposal to queue

    function _queue(uint256 proposalId_) internal {
        Proposal storage proposal = proposals[proposalId_];
        uint256 eta = block.timestamp + proposalTimelocks[uint8(proposal.proposalType)].delay();
        for (uint256 i; i < proposal.targets.length; ++i) {
            _queueOrRevertInternal(
                proposal.targets[i],
                proposal.values[i],
                proposal.signatures[i],
                proposal.calldatas[i],
                eta,
                uint8(proposal.proposalType)
            );
        }
        proposal.eta = eta;
        queued[proposalId_] = true;
        emit ProposalQueued(proposalId_, eta);
    }

    function _queueOrRevertInternal(
        address target_,
        uint256 value_,
        string memory signature_,
        bytes memory data_,
        uint256 eta_,
        uint8 proposalType_
    ) internal {
        require(
            !proposalTimelocks[proposalType_].queuedTransactions(
                keccak256(abi.encode(target_, value_, signature_, data_, eta_))
            ),
            "OmnichainGovernanceExecutor::queueOrRevertInternal: identical proposal action already queued at eta"
        );
        proposalTimelocks[proposalType_].queueTransaction(target_, value_, signature_, data_, eta_);
    }
}
