// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import { ReentrancyGuard } from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@layerzerolabs/solidity-examples/contracts/lzApp/NonblockingLzApp.sol";
import { BaseOmnichainControllerDest } from "./BaseOmnichainControllerDest.sol";
import { ITimelock } from "./interfaces/ITimelock.sol";

/**
 * @title OmnichainGovernanceExecutor
 * @notice Executes the proposal transactions sent from the main chain
 * @dev The owner of this contract controls LayerZero configuration. When used in production the owner will be OmnichainExecutor
 * This implementation is non-blocking, meaning the failed messages will not block the future messages from the source.
 * For the blocking behavior, derive the contract from LzApp.
 */
contract OmnichainGovernanceExecutor is ReentrancyGuard, BaseOmnichainControllerDest {
    using BytesLib for bytes;
    using ExcessivelySafeCall for address;

    enum ProposalType {
        NORMAL,
        FASTTRACK,
        CRITICAL
    }

    struct Proposal {
        /** Unique id for looking up a proposal */
        uint256 id;
        /** The timestamp that the proposal will be available for execution, set once the vote succeeds */
        uint256 eta;
        /** The ordered list of target addresses for calls to be made */
        address[] targets;
        /** The ordered list of values (i.e. msg.value) to be passed to the calls to be made */
        uint256[] values;
        /** The ordered list of function signatures to be called */
        string[] signatures;
        /** The ordered list of calldata to be passed to each call */
        bytes[] calldatas;
        /** Flag marking whether the proposal has been cancelled */
        bool cancelled;
        /** Flag marking whether the proposal has been executed */
        bool executed;
        /** The type of the proposal */
        uint8 proposalType;
    }

    /**
     * @notice A privileged role that can cancel any proposal.
     */
    address public immutable guardian;

    /**
     * @notice Timestamp on which proposal is received.
     */
    uint256 public proposalRecievedTimestamp;

    /**
     * @notice The official record of all proposals ever proposed.
     */
    mapping(uint256 => Proposal) public proposals;

    /**
     * @notice Mapping containing Timelock addresses for each proposal type.
     */
    mapping(uint256 => TimelockInterface) public proposalTimelocks;

    /**
     * @notice Represents queue state of proposal.
     */
    mapping(uint256 => bool) public queued;

    /**
     * @notice Emitted when proposal is received.
     */
    event ProposalReceived(uint256, uint256, address[], uint256[], string[], bytes[], uint8);

    /**
     * @notice Emitted when proposal is queued.
     */
    event ProposalQueued(uint256, uint256);

    /**
     * Emitted when proposal executed.
     */
    event ProposalExecuted(uint256);

    /**
     * @notice Emitted when proposal failed.
     */
    event ProposalFailed(uint16 srcChainId, bytes srcAddress, uint64 nonce, bytes reason);

    /**
     * @notice Emitted when proposal is cancelled.
     */
    event ProposalCancelled(uint256);

    /**
     * @notice Emitted while setting execution delay.
     */
    event SetExecuteDelay(uint256, uint256);

    /**
     * @notice Emitted when all timelocks are added.
     */
    event TimelockAdded(address indexed timelock);

    constructor(address endpoint_, address guardian_) BaseOmnichainControllerDest(endpoint_) {
        guardian = guardian_;
    }

    /**
     * @notice Add timelocks to the ProposalTimelocks mapping.
     * @param timelocks_ Array of addresses of all 3 timelocks.
     * @custom:access Only owner.
     * @custom:event Emits TimelockAdded with all 3 timelocks.
     */
    function addTimelocks(TimelockInterface[] memory timelocks_) external onlyOwner {
        require(
            timelocks_.length == uint8(ProposalType.CRITICAL) + 1,
            "OmnichainGovernanceExecutor::initialize:number of timelocks _should match the number of governance routes"
        );
        for (uint256 i; i < uint8(ProposalType.CRITICAL) + 1; ++i) {
            require(
                address(timelocks_[i]) != address(0),
                "OmnichainGovernanceExecutor::initialize:invalid timelock address"
            );
            proposalTimelocks[i] = timelocks_[i];
            emit TimelockAdded(address(proposalTimelocks[i]));
        }
    }

    /**
     * @notice Executes a queued proposal if eta has passed.
     * @param proposalId_ Id of proposal that is to be executed.
     * @custom:event Emits ProposalExecuted with proposal id of executed proposal.
     */
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

    /**
     * @notice Cancels a proposal only if sender is the guardian and proposal is not executed.
     * @param proposalId_ Id of proposal that is to be cancelled.
     * @custom:access Sender must be the guardian.
     * @custom:event Emits ProposalCancelled with proposal id of the cancelled proposal.
     */
    function cancel(uint256 proposalId_) external {
        Proposal storage proposal = proposals[proposalId_];
        require(!proposal.executed, "OmnichainGovernanceExecutor::cancel: cannot cancel executed proposal");
        require(msg.sender == guardian, "OmnichainGovernanceExecutor::cancel: sender must be guardian");

        proposal.cancelled = true;
        for (uint256 i = 0; i < proposal.targets.length; i++) {
            proposalTimelocks[proposal.proposalType].cancelTransaction(
                proposal.targets[i],
                proposal.values[i],
                proposal.signatures[i],
                proposal.calldatas[i],
                proposal.eta
            );
        }

        emit ProposalCancelled(proposalId_);
    }

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

    function _nonblockingLzReceive(
        uint16 srcChainId_,
        bytes memory,
        uint64,
        bytes memory payload_
    ) internal virtual override {
        (bytes memory payload, uint256 pId) = abi.decode(payload_, (bytes, uint256));
        (
            address[] memory targets,
            uint256[] memory values,
            string[] memory signatures,
            bytes[] memory calldatas,
            uint8 pType
        ) = abi.decode(payload, (address[], uint256[], string[], bytes[], uint8));

        _isEligibleToReceive(srcChainId_, targets.length);

        Proposal memory newProposal = Proposal({
            id: pId,
            eta: 0,
            targets: targets,
            values: values,
            signatures: signatures,
            calldatas: calldatas,
            cancelled: false,
            executed: false,
            proposalType: pType
        });

        proposals[newProposal.id] = newProposal;
        emit ProposalReceived(newProposal.id, 0, targets, values, signatures, calldatas, pType);
        _queue(pId);
    }

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