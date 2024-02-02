// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import { ReentrancyGuard } from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import { BytesLib } from "@layerzerolabs/solidity-examples/contracts/libraries/BytesLib.sol";
import { ExcessivelySafeCall } from "@layerzerolabs/solidity-examples/contracts/libraries/ExcessivelySafeCall.sol";
import { ensureNonzeroAddress } from "@venusprotocol/solidity-utilities/contracts/validators.sol";
import { BaseOmnichainControllerDest } from "./BaseOmnichainControllerDest.sol";
import { ITimelock } from "./interfaces/ITimelock.sol";

/**
 * @title OmnichainGovernanceExecutor
 * @notice Executes the proposal transactions sent from the main chain
 * @dev The owner of this contract controls LayerZero configuration. When used in production the owner will be OmnichainExecutor
 * This implementation is non-blocking, meaning the failed messages will not block the future messages from the source.
 * For the blocking behavior, derive the contract from LzApp.
 * @custom:security-contact https://github.com/VenusProtocol/governance-contracts#discussion
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
        /** Flag marking whether the proposal has been canceled */
        bool canceled;
        /** Flag marking whether the proposal has been executed */
        bool executed;
        /** The type of the proposal */
        uint8 proposalType;
    }
    /*
     * @notice Possible states that a proposal may be in
     */
    enum ProposalState {
        Canceled,
        Queued,
        Executed
    }

    /**
     * @notice A privileged role that can cancel any proposal.
     */
    address public immutable GUARDIAN;

    /**
     * @notice Last proposal count received
     */
    uint256 public lastProposalReceived;

    /**
     * @notice The official record of all proposals ever proposed.
     */
    mapping(uint256 => Proposal) public proposals;

    /**
     * @notice Mapping containing Timelock addresses for each proposal type.
     */
    mapping(uint256 => ITimelock) public proposalTimelocks;

    /**
     * @notice Represents queue state of proposal.
     */
    mapping(uint256 => bool) public queued;

    /**
     * @notice Emitted when proposal is received.
     */
    event ProposalReceived(
        uint256 indexed proposalId,
        address[] targets,
        uint256[] values,
        string[] signatures,
        bytes[] calldatas,
        uint8 proposalType
    );

    /**
     * @notice Emitted when proposal is queued.
     */
    event ProposalQueued(uint256 indexed id, uint256 eta);

    /**
     * Emitted when proposal executed.
     */
    event ProposalExecuted(uint256 indexed id);

    /**
     * @notice Emitted when proposal failed.
     */
    event ReceivePayloadFailed(uint16 indexed srcChainId, bytes indexed srcAddress, uint64 nonce, bytes reason);

    /**
     * @notice Emitted when proposal is canceled.
     */
    event ProposalCanceled(uint256 indexed id);

    /**
     * @notice Emitted when timelock added.
     */
    event TimelockAdded(uint8 routeType, address indexed oldTimelock, address indexed newTimelock);

    constructor(address endpoint_, address guardian_) BaseOmnichainControllerDest(endpoint_) {
        ensureNonzeroAddress(guardian_);
        GUARDIAN = guardian_;
    }

    /**
     * @notice Add timelocks to the ProposalTimelocks mapping.
     * @param timelocks_ Array of addresses of all 3 timelocks.
     * @custom:access Only owner.
     * @custom:event Emits TimelockAdded with old and new timelock and route type.
     */
    function addTimelocks(ITimelock[] memory timelocks_) external onlyOwner {
        require(
            timelocks_.length == uint8(ProposalType.CRITICAL) + 1,
            "OmnichainGovernanceExecutor::initialize:number of timelocks _should match the number of governance routes"
        );
        for (uint8 i; i < uint8(ProposalType.CRITICAL) + 1; ) {
            ensureNonzeroAddress(address(timelocks_[i]));
            if (i > 0) {
                require(
                    timelocks_[i] != timelocks_[i - 1],
                    "OmnichainGovernanceExecutor::initialize:duplicate timelock"
                );
            }
            emit TimelockAdded(i, address(proposalTimelocks[i]), address(timelocks_[i]));
            proposalTimelocks[i] = timelocks_[i];
            unchecked {
                ++i;
            }
        }
    }

    /**
     * @notice Executes a queued proposal if eta has passed.
     * @param proposalId_ Id of proposal that is to be executed.
     * @custom:event Emits ProposalExecuted with proposal id of executed proposal.
     */
    function execute(uint256 proposalId_) external nonReentrant {
        require(
            state(proposalId_) == ProposalState.Queued,
            "OmnichainGovernanceExecutor::execute: proposal can only be executed if it is queued"
        );

        Proposal storage proposal = proposals[proposalId_];
        proposal.executed = true;
        ITimelock timelock = proposalTimelocks[proposal.proposalType];
        uint256 eta = proposal.eta;
        uint256 length = proposal.targets.length;

        for (uint256 i; i < length; ) {
            timelock.executeTransaction(
                proposal.targets[i],
                proposal.values[i],
                proposal.signatures[i],
                proposal.calldatas[i],
                eta
            );
            unchecked {
                ++i;
            }
        }
        emit ProposalExecuted(proposalId_);
    }

    /**
     * @notice Cancels a proposal only if sender is the guardian and proposal is not executed.
     * @param proposalId_ Id of proposal that is to be canceled.
     * @custom:access Sender must be the guardian.
     * @custom:event Emits ProposalCanceled with proposal id of the canceled proposal.
     */
    function cancel(uint256 proposalId_) external {
        require(
            state(proposalId_) == ProposalState.Queued,
            "OmnichainGovernanceExecutor::cancel: proposal should be queued and not executed"
        );
        Proposal storage proposal = proposals[proposalId_];
        require(msg.sender == GUARDIAN, "OmnichainGovernanceExecutor::cancel: sender must be guardian");

        proposal.canceled = true;
        ITimelock timelock = proposalTimelocks[proposal.proposalType];
        uint256 eta = proposal.eta;
        uint256 length = proposal.targets.length;

        for (uint256 i; i < length; ) {
            timelock.cancelTransaction(
                proposal.targets[i],
                proposal.values[i],
                proposal.signatures[i],
                proposal.calldatas[i],
                eta
            );
            unchecked {
                ++i;
            }
        }

        emit ProposalCanceled(proposalId_);
    }

    /**
     * @notice Gets the state of a proposal
     * @param proposalId_ The id of the proposal
     * @return Proposal state
     */
    function state(uint proposalId_) public view returns (ProposalState) {
        Proposal storage proposal = proposals[proposalId_];
        if (proposal.canceled) {
            return ProposalState.Canceled;
        } else if (proposal.executed) {
            return ProposalState.Executed;
        } else if (queued[proposalId_]) {
            // queued only when proposal is received
            return ProposalState.Queued;
        }
    }

    /**
     * @notice Process blocking LayerZero receive request.
     * @param srcChainId_ Source chain Id.
     * @param srcAddress_ Source address from which payload is received.
     * @param nonce_ Nonce associated with the payload to prevent replay attacks.
     * @param payload_ Encoded payload containing proposal information.
     * @custom:event Emit ReceivePayloadFailed if call fails.
     */
    function _blockingLzReceive(
        uint16 srcChainId_,
        bytes memory srcAddress_,
        uint64 nonce_,
        bytes memory payload_
    ) internal virtual override whenNotPaused {
        uint256 gasToStoreAndEmit = 30000; // enough gas to ensure we can store the payload and emit the event

        (bool success, bytes memory reason) = address(this).excessivelySafeCall(
            gasleft() - gasToStoreAndEmit,
            150,
            abi.encodeCall(this.nonblockingLzReceive, (srcChainId_, srcAddress_, nonce_, payload_))
        );
        // try-catch all errors/exceptions
        if (!success) {
            bytes32 hashedPayload = keccak256(payload_);
            failedMessages[srcChainId_][srcAddress_][nonce_] = hashedPayload;
            emit ReceivePayloadFailed(srcChainId_, srcAddress_, nonce_, reason); // Retrieve payload from the src side tx if needed to clear
        }
    }

    /**
     * @notice Process non blocking LayerZero receive request.
     * @param srcChainId_ Source chain Id.
     * @param payload_ Encoded payload containing proposal information.
     * @custom:event Emit ProposalReceived
     */
    function _nonblockingLzReceive(
        uint16 srcChainId_,
        bytes memory,
        uint64,
        bytes memory payload_
    ) internal virtual override {
        (bytes memory payload, uint64 pId) = abi.decode(payload_, (bytes, uint64));
        (
            address[] memory targets,
            uint256[] memory values,
            string[] memory signatures,
            bytes[] memory calldatas,
            uint8 pType
        ) = abi.decode(payload, (address[], uint256[], string[], bytes[], uint8));
        require(
            targets.length == values.length &&
                targets.length == signatures.length &&
                targets.length == calldatas.length,
            "OmnichainGovernanceExecutor::_nonblockingLzReceive: proposal function information arity mismatch"
        );
        _isEligibleToReceive(srcChainId_, targets.length);

        Proposal memory newProposal = Proposal({
            id: pId,
            eta: 0,
            targets: targets,
            values: values,
            signatures: signatures,
            calldatas: calldatas,
            canceled: false,
            executed: false,
            proposalType: pType
        });

        proposals[pId] = newProposal;
        lastProposalReceived = pId;

        emit ProposalReceived(newProposal.id, targets, values, signatures, calldatas, pType);
        _queue(pId);
    }

    /**
     * @notice Queue proposal for execution.
     * @param proposalId_ Proposal to be queued.
     * @custom:event Emit ProposalQueued with proposal id and eta.
     */
    function _queue(uint256 proposalId_) internal {
        Proposal storage proposal = proposals[proposalId_];
        uint256 eta = block.timestamp + proposalTimelocks[proposal.proposalType].delay();

        proposal.eta = eta;
        queued[proposalId_] = true;
        uint8 proposalType = proposal.proposalType;
        uint256 length = proposal.targets.length;

        for (uint256 i; i < length; ) {
            _queueOrRevertInternal(
                proposal.targets[i],
                proposal.values[i],
                proposal.signatures[i],
                proposal.calldatas[i],
                eta,
                proposalType
            );
            unchecked {
                ++i;
            }
        }

        emit ProposalQueued(proposalId_, eta);
    }

    /**
     * @notice Check for unique proposal.
     * @param target_ Address of the contract with the method to be called.
     * @param value_ Native token amount sent with the transaction.
     * @param signature_ Signature of the function to be called.
     * @param data_ Arguments to be passed to the function when called.
     * @param eta_ Timestamp after which the transaction can be executed.
     * @param proposalType_ Type of proposal.
     */
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
