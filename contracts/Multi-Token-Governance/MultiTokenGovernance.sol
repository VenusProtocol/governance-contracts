// SPDX-License-Identifier: BSD-3-Clause

pragma solidity 0.8.25;

import { MultiTokenGovernanceInterface } from "./MultiTokenGovernanceInterface.sol";
import { ensureNonzeroAddress } from "@venusprotocol/solidity-utilities/contracts/validators.sol";
import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { AccessControlledV8 } from "../Governance/AccessControlledV8.sol";
import { ITimelock } from "./ITimelock.sol";
import { IVaultAggregator } from "./IVaultAggregator.sol";

/**
 * @title MultiTokenGovernance
 * @author Venus
 * @notice Multi-Token Governor Bravo Delegate is a governance contract akin to Governance Bravo Delegate, designed to facilitate governance across multiple tokens.
 *         Votes in this contract are aggregated through the vault aggregator.
 */
contract MultiTokenGovernance is MultiTokenGovernanceInterface, Initializable, AccessControlledV8 {
    /// @notice The name of this contract
    string public constant name = "Venus Multi Token Governor Bravo";

    /// @notice The minimum setable proposal threshold
    uint256 public constant MIN_PROPOSAL_THRESHOLD = 150000e18; // 150,000

    /// @notice The maximum setable proposal threshold
    uint256 public constant MAX_PROPOSAL_THRESHOLD = 300000e18; //300,000

    /// @notice The minimum setable voting period
    uint256 public constant MIN_VOTING_PERIOD = 12 * 60 * 3; // About 3 hours, 5 secs per block

    /// @notice The max setable voting period
    uint256 public constant MAX_VOTING_PERIOD = 12 * 60 * 24 * 14; // About 2 weeks, 5 secs per block

    /// @notice The min setable voting delay
    uint256 public constant MIN_VOTING_DELAY = 1;

    /// @notice The max setable voting delay
    uint256 public constant MAX_VOTING_DELAY = 12 * 60 * 24 * 7; // About 1 week, 5 secs per block

    /// @notice The number of votes in support of a proposal required in order for a quorum to be reached and for a vote to succeed
    uint256 public constant quorumVotes = 600000e18; // 600,000

    /// @notice The EIP-712 typehash for the contract's domain
    bytes32 public constant DOMAIN_TYPEHASH =
        keccak256("EIP712Domain(string name,uint256 chainId,address verifyingContract)");

    /// @notice The EIP-712 typehash for the ballot struct used by the contract
    bytes32 public constant BALLOT_TYPEHASH = keccak256("Ballot(uint256 proposalId,uint8 support)");

    /**
     * @notice Used to initialize the contract during delegator contructor
     * @param vaultAggregator_ The address of the VaultAggregator
     * @param proposalConfigs_ Governance configs for each governance route
     * @param timelocks_ Timelock addresses for each governance route
     */
    function initialize(
        address vaultAggregator_,
        ProposalConfig[] memory proposalConfigs_,
        ITimelock[] memory timelocks_,
        address guardian_,
        address accessControlManager_
    ) external initializer {
        ensureNonzeroAddress(vaultAggregator_);
        ensureNonzeroAddress(guardian_);
        ensureNonzeroAddress(accessControlManager_);

        uint8 length = uint8(type(ProposalType).max) + 1;

        if (timelocks_.length != length || proposalConfigs_.length != length) {
            revert InvalidLength();
        }
        require(
            timelocks_.length == length,
            "OmnichainGovernanceExecutor::initialize:number of timelocks should match the number of governance routes"
        );
        require(
            proposalConfigs_.length == length,
            "number of proposal configs should match number of governance routes"
        );

        vaultAggregator = IVaultAggregator(vaultAggregator_);
        proposalMaxOperations = 10;
        guardian = guardian_;

        // Set parameters for each Governance Route
        uint256 arrLength = proposalConfigs_.length;
        for (uint256 i; i < arrLength; ) {
            require(proposalConfigs_[i].votingPeriod >= MIN_VOTING_PERIOD, "invalid min voting period");
            require(proposalConfigs_[i].votingPeriod <= MAX_VOTING_PERIOD, "invalid max voting period");
            require(proposalConfigs_[i].votingDelay >= MIN_VOTING_DELAY, "invalid min voting delay");
            require(proposalConfigs_[i].votingDelay <= MAX_VOTING_DELAY, "invalid max voting delay");
            require(proposalConfigs_[i].proposalThreshold >= MIN_PROPOSAL_THRESHOLD, "invalid min proposal threshold");
            require(proposalConfigs_[i].proposalThreshold <= MAX_PROPOSAL_THRESHOLD, "invalid max proposal threshold");
            ensureNonzeroAddress(address(timelocks_[i]));

            proposalConfigs[i] = proposalConfigs_[i];
            proposalTimelocks[i] = timelocks_[i];
            unchecked {
                ++i;
            }
        }
        ++initialProposalId;
        __AccessControlled_init(accessControlManager_);
    }

    /**
     * @notice It updates Vault Aggregator
     * @param newVaultAggregator Address of new Vault Aggregator
     * @custom:access Controlled by Access Control Manager
     * @custom:event Emit UpdateVaultAggregator with old and new VaultAggregator
     */
    function updateVaultAggregator(IVaultAggregator newVaultAggregator) external {
        _checkAccessAllowed("updateVaultAggregator(address)");
        ensureNonzeroAddress(address(newVaultAggregator));
        emit UpdateVaultAggregator(address(vaultAggregator), address(newVaultAggregator));
        vaultAggregator = newVaultAggregator;
    }

    /**
     * @notice Function used to propose a new proposal. Sender must have delegates above the proposal threshold.
     * targets, values, signatures, and calldatas must be of equal length
     * @dev NOTE: Proposals with duplicate set of actions can not be queued for execution. If the proposals consists
     *  of duplicate actions, it's recommended to split those actions into separate proposals
     * @param targets Target addresses for proposal calls
     * @param values BNB values for proposal calls
     * @param signatures Function signatures for proposal calls
     * @param calldatas Calldatas for proposal calls
     * @param description String description of the proposal
     * @param proposalType the type of the proposal (e.g NORMAL, FASTTRACK, CRITICAL)
     * @param weights Specify token weights for voting
     * @return Proposal id of new proposal
     */
    function propose(
        address[] memory targets,
        uint256[] memory values,
        string[] memory signatures,
        bytes[] memory calldatas,
        string memory description,
        ProposalType proposalType,
        uint8[] memory weights
    ) external returns (uint256) {
        uint8[] memory proposalTokenWeight = new uint8[](1); // Token supported for proposal
        proposalTokenWeight[0] = 100; // 0th token will be supported proposal token
        if (
            vaultAggregator.getPriorVotes(msg.sender, (block.number - 1), proposalTokenWeight) <
            proposalConfigs[uint8(proposalType)].proposalThreshold
        ) {
            revert UnderThreshold();
        }

        require(
            targets.length == values.length &&
                targets.length == signatures.length &&
                targets.length == calldatas.length,
            "proposal function information arity mismatch"
        );
        require(targets.length != 0, "must provide actions");
        require(targets.length <= proposalMaxOperations, "too many actions");

        uint256 latestProposalId = latestProposalIds[msg.sender];
        if (latestProposalId != 0) {
            ProposalState proposersLatestProposalState = state(latestProposalId);
            require(
                proposersLatestProposalState != ProposalState.Active,
                "one live proposal per proposer, found an already active proposal"
            );
            require(
                proposersLatestProposalState != ProposalState.Pending,
                "one live proposal per proposer, found an already pending proposal"
            );
        }
        proposalCount++;
        _propose(proposalCount, targets, values, signatures, calldatas, description, uint8(proposalType), weights);
        return proposalCount;
    }

    /**
     * @notice Queues a proposal of state succeeded
     * @param proposalId The id of the proposal to queue
     */
    function queue(uint256 proposalId) external {
        require(state(proposalId) == ProposalState.Succeeded, "proposal can only be queued if it is succeeded");
        Proposal storage proposal = proposals[proposalId];
        uint256 eta = block.timestamp + proposalTimelocks[uint8(proposal.proposalType)].delay();
        for (uint256 i; i < proposal.targets.length; ) {
            queueOrRevertInternal(
                proposal.targets[i],
                proposal.values[i],
                proposal.signatures[i],
                proposal.calldatas[i],
                eta,
                uint8(proposal.proposalType)
            );
            unchecked {
                ++i;
            }
        }
        proposal.eta = eta;
        emit ProposalQueued(proposalId, eta);
    }

    /**
     * @notice Cast a vote for a proposal
     * @param proposalId The id of the proposal to vote on
     * @param support The support value for the vote. 0=against, 1=for, 2=abstain
     */
    function castVote(uint256 proposalId, uint8 support) external {
        emit VoteCast(msg.sender, proposalId, support, castVoteInternal(msg.sender, proposalId, support), "");
    }

    /**
     * @notice Cast a vote for a proposal with a reason
     * @param proposalId The id of the proposal to vote on
     * @param support The support value for the vote. 0=against, 1=for, 2=abstain
     * @param reason The reason given for the vote by the voter
     */
    function castVoteWithReason(uint256 proposalId, uint8 support, string calldata reason) external {
        emit VoteCast(msg.sender, proposalId, support, castVoteInternal(msg.sender, proposalId, support), reason);
    }

    /**
     * @notice Cast a vote for a proposal by signature
     * @dev External function that accepts EIP-712 signatures for voting on proposals.
     * @param proposalId The id of the proposal to vote on
     * @param support The support value for the vote. 0=against, 1=for, 2=abstain
     * @param v recovery id of ECDSA signature
     * @param r part of the ECDSA sig output
     * @param s part of the ECDSA sig output
     */
    function castVoteBySig(uint256 proposalId, uint8 support, uint8 v, bytes32 r, bytes32 s) external {
        bytes32 domainSeparator = keccak256(
            abi.encode(DOMAIN_TYPEHASH, keccak256(bytes(name)), block.chainid, address(this))
        );
        bytes32 structHash = keccak256(abi.encode(BALLOT_TYPEHASH, proposalId, support));
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", domainSeparator, structHash));
        address signatory = ecrecover(digest, v, r, s);
        require(signatory != address(0), "GovernorBravo::castVoteBySig: invalid signature");
        emit VoteCast(signatory, proposalId, support, castVoteInternal(signatory, proposalId, support), "");
    }

    /**
     * @notice Executes a queued proposal if eta has passed
     * @param proposalId The id of the proposal to execute
     */
    function execute(uint256 proposalId) external {
        require(state(proposalId) == ProposalState.Queued, "proposal can only be executed if it is queued");
        Proposal storage proposal = proposals[proposalId];
        proposal.executed = true;
        for (uint256 i; i < proposal.targets.length; ) {
            proposalTimelocks[uint8(proposal.proposalType)].executeTransaction(
                proposal.targets[i],
                proposal.values[i],
                proposal.signatures[i],
                proposal.calldatas[i],
                proposal.eta
            );
            unchecked {
                ++i;
            }
        }
        emit ProposalExecuted(proposalId);
    }

    /**
     * @notice Cancels a proposal only if sender is the proposer, or proposer delegates dropped below proposal threshold
     * @param proposalId The id of the proposal to cancel
     */
    function cancel(uint256 proposalId) external {
        require(state(proposalId) != ProposalState.Executed, "cannot cancel executed proposal");

        Proposal storage proposal = proposals[proposalId];
        require(
            msg.sender == guardian ||
                msg.sender == proposal.proposer ||
                vaultAggregator.getPriorVotes(proposal.proposer, (block.number - 1), proposal.weights) <
                proposalConfigs[proposal.proposalType].proposalThreshold,
            "proposer above threshold"
        );

        proposal.canceled = true;
        for (uint256 i = 0; i < proposal.targets.length; ) {
            proposalTimelocks[proposal.proposalType].cancelTransaction(
                proposal.targets[i],
                proposal.values[i],
                proposal.signatures[i],
                proposal.calldatas[i],
                proposal.eta
            );
            unchecked {
                ++i;
            }
        }

        emit ProposalCanceled(proposalId);
    }

    /**
     * @notice Sets the new governance guardian
     * @param newGuardian the address of the new guardian
     * @custom:event Emit NewGuardian with old and new guardian address
     * @custom:access Controlled by Access Control Manager
     *
     */
    function setGuardian(address newGuardian) external {
        _checkAccessAllowed("_setGuardian(address)");
        ensureNonzeroAddress(newGuardian);
        emit NewGuardian(guardian, newGuardian);
        guardian = newGuardian;
    }

    /**
     * @notice Set max proposal operations
     * @dev Admin only.
     * @param proposalMaxOperations_ Max proposal operations
     * @custom:event ProposalMaxOperationsUpdated with old and new proposal max operations
     * @custom:access Controlled by Access Control Manager
     */
    function setProposalMaxOperations(uint256 proposalMaxOperations_) external {
        _checkAccessAllowed("_setProposalMaxOperations(uint256)");
        emit ProposalMaxOperationsUpdated(proposalMaxOperations, proposalMaxOperations_);
        proposalMaxOperations = proposalMaxOperations_;
    }

    /**
     * @notice Gets actions of a proposal
     * @param proposalId the id of the proposal
     * @return targets Array of target addresses of the proposal actions
     * @return values Array of values (i.e., msg.value) to be passed to the calls
     * @return signatures Array of function signatures to be called
     * @return calldatas Array of calldata to be passed to each call
     */
    function getActions(
        uint256 proposalId
    )
        external
        view
        returns (address[] memory targets, uint[] memory values, string[] memory signatures, bytes[] memory calldatas)
    {
        Proposal storage p = proposals[proposalId];
        return (p.targets, p.values, p.signatures, p.calldatas);
    }

    /**
     * @notice Gets the receipt for a voter on a given proposal
     * @param proposalId the id of proposal
     * @param voter The address of the voter
     * @return The voting receipt
     */
    function getReceipt(uint256 proposalId, address voter) external view returns (Receipt memory) {
        return receipts[proposalId][voter];
    }

    /**
     * @notice Gets the state of a proposal
     * @param proposalId The id of the proposal
     * @return Proposal state
     */
    function state(uint256 proposalId) public view returns (ProposalState) {
        require(proposalCount >= proposalId && proposalId > initialProposalId, "invalid proposal id");
        Proposal storage proposal = proposals[proposalId];
        if (proposal.canceled) {
            return ProposalState.Canceled;
        } else if (block.number <= proposal.startBlock) {
            return ProposalState.Pending;
        } else if (block.number <= proposal.endBlock) {
            return ProposalState.Active;
        } else if (proposal.forVotes <= proposal.againstVotes || proposal.forVotes < quorumVotes) {
            return ProposalState.Defeated;
        } else if (proposal.eta == 0) {
            return ProposalState.Succeeded;
        } else if (proposal.executed) {
            return ProposalState.Executed;
        } else if (block.timestamp >= proposal.eta + proposalTimelocks[uint8(proposal.proposalType)].GRACE_PERIOD()) {
            return ProposalState.Expired;
        } else {
            return ProposalState.Queued;
        }
    }

    /**
     * @dev Internal function to carry out queue logic
     * @param target Target addresses for proposal calls
     * @param value BNB values for proposal calls
     * @param signature Function signatures for proposal calls
     * @param data Data for proposal calls
     * @param eta eta for an proposal
     * @param proposalType Proposal Type
     */
    function queueOrRevertInternal(
        address target,
        uint256 value,
        string memory signature,
        bytes memory data,
        uint256 eta,
        uint8 proposalType
    ) internal {
        if (
            proposalTimelocks[proposalType].queuedTransactions(
                keccak256(abi.encode(target, value, signature, data, eta))
            )
        ) {
            revert IdenticalTransaction();
        }

        proposalTimelocks[proposalType].queueTransaction(target, value, signature, data, eta);
    }

    /**
     * @dev Internal function that caries out voting logic
     * @param voter The voter that is casting their vote
     * @param proposalId The id of the proposal to vote on
     * @param support The support value for the vote. 0=against, 1=for, 2=abstain
     * @return The number of votes cast
     */
    function castVoteInternal(address voter, uint256 proposalId, uint8 support) internal returns (uint96) {
        require(state(proposalId) == ProposalState.Active, "voting is closed");
        require(support <= 2, "invalid vote type");
        Proposal storage proposal = proposals[proposalId];
        Receipt storage receipt = receipts[proposal.id][voter];
        require(receipt.hasVoted == false, "voter already voted");
        uint96 votes = vaultAggregator.getPriorVotes(voter, proposal.startBlock, proposal.weights);

        if (support == 0) {
            proposal.againstVotes = proposal.againstVotes + votes;
        } else if (support == 1) {
            proposal.forVotes = proposal.forVotes + votes;
        } else if (support == 2) {
            proposal.abstainVotes = proposal.abstainVotes + votes;
        }

        receipt.hasVoted = true;
        receipt.support = support;
        receipt.votes = votes;

        return votes;
    }

    /**
     * @dev Internal function that carries out propose function
     */
    function _propose(
        uint256 id,
        address[] memory targets,
        uint[] memory values,
        string[] memory signatures,
        bytes[] memory calldatas,
        string memory description,
        uint8 proposalType,
        uint8[] memory weights
    ) private {
        uint256 startBlock = block.number + proposalConfigs[uint8(proposalType)].votingDelay;
        uint256 endBlock = startBlock + proposalConfigs[uint8(proposalType)].votingPeriod;

        proposalCount++;
        Proposal memory newProposal = Proposal({
            id: proposalCount,
            proposer: msg.sender,
            eta: 0,
            targets: targets,
            values: values,
            signatures: signatures,
            calldatas: calldatas,
            startBlock: startBlock,
            endBlock: endBlock,
            forVotes: 0,
            againstVotes: 0,
            abstainVotes: 0,
            canceled: false,
            executed: false,
            proposalType: uint8(proposalType),
            weights: weights
        });

        proposals[newProposal.id] = newProposal;
        latestProposalIds[newProposal.proposer] = newProposal.id;

        emit ProposalCreated(
            id,
            msg.sender,
            targets,
            values,
            signatures,
            calldatas,
            startBlock,
            endBlock,
            description,
            uint8(proposalType),
            weights
        );
    }
}
