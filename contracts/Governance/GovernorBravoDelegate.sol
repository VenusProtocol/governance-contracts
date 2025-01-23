// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.25;
pragma experimental ABIEncoderV2;

import "./GovernorBravoInterfacesV8.sol";
import { ensureNonzeroAddress } from "@venusprotocol/solidity-utilities/contracts/validators.sol";

/**
 * @title GovernorBravoDelegate
 * @notice Venus Governance latest on chain governance includes several new features including variable proposal routes and fine grained pause control.
 * Variable routes for proposals allows for governance paramaters such as voting threshold and timelocks to be customized based on the risk level and
 * impact of the proposal. Added granularity to the pause control mechanism allows governance to pause individual actions on specific markets,
 * which reduces impact on the protocol as a whole. This is particularly useful when applied to isolated pools.
 *
 * The goal of **Governance** is to increase governance efficiency, while mitigating and eliminating malicious or erroneous proposals.
 *
 * ## Details
 *
 * Governance has **3 main contracts**: **GovernanceBravoDelegate, XVSVault, XVS** token.
 *
 * - XVS token is the protocol token used for protocol users to cast their vote on submitted proposals.
 * - XVSVault is the main staking contract for XVS. Users first stake their XVS in the vault and receive voting power proportional to their staked
 * tokens that they can use to vote on proposals. Users also can choose to delegate their voting power to other users.
 *
 * # Governor Bravo
 *
 * `GovernanceBravoDelegate` is main Venus Governance contract. Users interact with it to:
 * - Submit new proposal
 * - Vote on a proposal
 * - Cancel a proposal
 * - Queue a proposal for execution with a timelock executor contract.
 * `GovernanceBravoDelegate` uses the XVSVault to get restrict certain actions based on a user's voting power. The governance rules it inforces are:
 * - A user's voting power must be greater than the `proposalThreshold` to submit a proposal
 * - If a user's voting power drops below certain amount, anyone can cancel the the proposal. The governance guardian and proposal creator can also
 * cancel a proposal at anytime before it is queued for execution.
 *
 * ## Venus Improvement Proposal
 *
 * Venus Governance allows for Venus Improvement Proposals (VIPs) to be categorized based on their impact and risk levels. This allows for optimizing proposals
 * execution to allow for things such as expediting interest rate changes and quickly updating risk parameters, while moving slower on other types of proposals
 * that can prevent a larger risk to the protocol and are not urgent. There are three different types of VIPs with different proposal paramters:
 *
 * - `NORMAL`
 * - `FASTTRACK`
 * - `CRITICAL`
 *
 * When initializing the `GovernorBravo` contract, the parameters for the three routes are set. The parameters are:
 *
 * - `votingDelay`: The delay in blocks between submitting a proposal and when voting begins
 * - `votingPeriod`: The number of blocks where voting will be open
 * - `proposalThreshold`: The number of votes required in order submit a proposal
 *
 * There is also a separate timelock executor contract for each route, which is used to dispatch the VIP for execution, giving even more control over the
 * flow of each type of VIP.
 *
 * ## Voting
 *
 * After a VIP is proposed, voting is opened after the `votingDelay` has passed. For example, if `votingDelay = 0`, then voting will begin in the next block
 * after the proposal has been submitted. After the delay, the proposal state is `ACTIVE` and users can cast their vote `for`, `against`, or `abstain`,
 * weighted by their total voting power (tokens + delegated voting power). Abstaining from a voting allows for a vote to be cast and optionally include a
 * comment, without the incrementing for or against vote count. The total voting power for the user is obtained by calling XVSVault's `getPriorVotes`.
 *
 * `GovernorBravoDelegate` also accepts [EIP-712](https://eips.ethereum.org/EIPS/eip-712) signatures for voting on proposals via the external function
 * `castVoteBySig`.
 *
 * ## Delegating
 *
 * A users voting power includes the amount of staked XVS the have staked as well as the votes delegate to them. Delegating is the process of a user loaning
 * their voting power to another, so that the latter has the combined voting power of both users. This is an important feature because it allows for a user
 * to let another user who they trust propose or vote in their place.
 *
 * The delegation of votes happens through the `XVSVault` contract by calling the `delegate` or `delegateBySig` functions. These same functions can revert
 * vote delegation by calling the same function with a value of `0`.
 */
contract GovernorBravoDelegate is GovernorBravoDelegateStorageV2, GovernorBravoEvents {
    /// @notice The name of this contract
    string public constant name = "Venus Governor Bravo";

    /// @notice The minimum setable proposal threshold
    uint256 public constant MIN_PROPOSAL_THRESHOLD = 150000e18; // 150,000 Xvs

    /// @notice The maximum setable proposal threshold
    uint256 public constant MAX_PROPOSAL_THRESHOLD = 300000e18; //300,000 Xvs

    /// @notice The minimum setable voting period
    uint256 public constant MIN_VOTING_PERIOD = 20 * 60 * 3; // About 3 hours, 3 secs per block

    /// @notice The max setable voting period
    uint256 public constant MAX_VOTING_PERIOD = 20 * 60 * 24 * 14; // About 2 weeks, 3 secs per block

    /// @notice The min setable voting delay
    uint256 public constant MIN_VOTING_DELAY = 1;

    /// @notice The max setable voting delay
    uint256 public constant MAX_VOTING_DELAY = 20 * 60 * 24 * 7; // About 1 week, 3 secs per block

    /// @notice The number of votes in support of a proposal required in order for a quorum to be reached and for a vote to succeed
    uint256 public constant quorumVotes = 600000e18; // 600,000 = 2% of Xvs

    /// @notice The EIP-712 typehash for the contract's domain
    bytes32 public constant DOMAIN_TYPEHASH =
        keccak256("EIP712Domain(string name,uint256 chainId,address verifyingContract)");

    /// @notice The EIP-712 typehash for the ballot struct used by the contract
    bytes32 public constant BALLOT_TYPEHASH = keccak256("Ballot(uint256 proposalId,uint8 support)");

    /// @notice Mapping to store whitelisted proposers and the timelock they are authorized to use
    mapping(address => address) public whitelistedProposers;

    /// @notice Error thrown when the caller is not the admin
    error OnlyAdmin();

    /// @notice Error thrown when the caller is not the admin or the guardian
    error OnlyAdminOrGuardian();

    /// @notice Error thrown when the contract is already initialized
    error AlreadyInitialized();

    /// @notice Error thrown when the arity of the proposal function parameters are not equal
    error ArityMismatch(string parameterName);

    /// @notice Error thrown when the min voting period is invalid
    error InvalidMinVotingPeriod();

    /// @notice Error thrown when the max voting period is invalid
    error InvalidMaxVotingPeriod();

    /// @notice Error thrown when the min voting delay is invalid
    error InvalidMinVotingDelay();

    /// @notice Error thrown when the max voting delay is invalid
    error InvalidMaxVotingDelay();

    /// @notice Error thrown when the min proposal threshold is invalid
    error InvalidMinProposalThreshold();

    /// @notice Error thrown when the max proposal threshold is invalid
    error InvalidMaxProposalThreshold();

    /// @notice Error thrown when the governor is not active
    error GovernorNotActive();

    /// @notice Error thrown when user has insufficient voting power to execute a command
    error InsufficientVotingPower();

    /// @notice Error thrown when no actions are provided
    error NoActionsProvided();

    /// @notice Error thrown when too many actions are provided
    error TooManyActions();

    /// @notice Error thrown when a proposer has an active or pending proposal
    error OneLiveProposalPerProposer();

    /// @notice Error thrown when a proposal is not active
    error ProposalNotActive();

    /// @notice Error thrown when a proposal has not succeeded
    error ProposalNotSucceeded();

    /// @notice Error thrown when a proposal has not been queued
    error ProposalNotQueued();

    /// @notice Error thrown when a proposal has already been executed
    error ProposalAlreadyExecuted();

    /// @notice Error thrown when a proposal tries to queue identical actions
    error DuplicateAction();

    /// @notice Error thrown when the proposal id is too high (doesn't exist)
    error InvalidProposalId();

    /// @notice Error thrown when the signature is invalid
    error InvalidSignature();

    /// @notice Error thrown when vote type is not correct
    error InvalidVoteType();

    /// @notice Error thrown when user has already voted
    error UserAlreadyVoted();

    /// @notice Error thrown when sender is not pending admin
    error SenderIsNotPendingAdmin();

    /// @notice Error thrown when the proposer is not whitelisted
    error TimelockNotWhitelistedForProposer();

    modifier onlyAdmin() {
        if (msg.sender != admin) {
            revert OnlyAdmin();
        }
        _;
    }

    modifier onlyGuardianOrAdmin() {
        if (msg.sender != guardian && msg.sender != admin) {
            revert OnlyAdminOrGuardian();
        }
        _;
    }

    /**
     * @notice Used to initialize the contract during delegator contructor
     * @param xvsVault_ The address of the XvsVault
     * @param proposalConfigs_ Governance configs for each governance route
     * @param timelocks Timelock addresses for each governance route
     * @param guardian_ The address of the guardian
     * @custom:access Only called by the admin
     */
    function initialize(
        address xvsVault_,
        ProposalConfig[] memory proposalConfigs_,
        TimelockInterface[] memory timelocks,
        address guardian_
    ) public onlyAdmin {
        if (address(proposalTimelocks[0]) != address(0)) {
            revert AlreadyInitialized();
        }
        ensureNonzeroAddress(xvsVault_);
        ensureNonzeroAddress(guardian_);
        if (timelocks.length != uint8(ProposalType.CRITICAL) + 1) {
            revert ArityMismatch("timelocks");
        }

        if (proposalConfigs_.length != uint8(ProposalType.CRITICAL) + 1) {
            revert ArityMismatch("proposalConfigs_");
        }

        xvsVault = XvsVaultInterface(xvsVault_);
        proposalMaxOperations = 10;
        guardian = guardian_;

        //Set parameters for each Governance Route
        uint256 arrLength = proposalConfigs_.length;
        for (uint256 i; i < arrLength; ++i) {
            if (proposalConfigs_[i].votingPeriod < MIN_VOTING_PERIOD) {
                revert InvalidMinVotingPeriod();
            }

            if (proposalConfigs_[i].votingPeriod > MAX_VOTING_PERIOD) {
                revert InvalidMaxVotingPeriod();
            }

            if (proposalConfigs_[i].votingDelay < MIN_VOTING_DELAY) {
                revert InvalidMinVotingDelay();
            }

            if (proposalConfigs_[i].votingDelay > MAX_VOTING_DELAY) {
                revert InvalidMaxVotingDelay();
            }

            if (proposalConfigs_[i].proposalThreshold < MIN_PROPOSAL_THRESHOLD) {
                revert InvalidMinProposalThreshold();
            }

            if (proposalConfigs_[i].proposalThreshold >= MAX_PROPOSAL_THRESHOLD) {
                revert InvalidMaxProposalThreshold();
            }
            ensureNonzeroAddress(address(timelocks[i]));

            proposalConfigs[i] = proposalConfigs_[i];
            proposalTimelocks[i] = timelocks[i];
        }
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
     * @return Proposal id of new proposal
     */
    function propose(
        address[] memory targets,
        uint256[] memory values,
        string[] memory signatures,
        bytes[] memory calldatas,
        string memory description,
        ProposalType proposalType
    ) public returns (uint256) {
        // Reject proposals before initiating as Governor
        if (initialProposalId == 0) {
            revert GovernorNotActive();
        }

        if (
            xvsVault.getPriorVotes(msg.sender, sub256(block.number, 1)) <
            proposalConfigs[uint8(proposalType)].proposalThreshold &&
            whitelistedProposers[msg.sender] == address(0)
        ) {
            revert InsufficientVotingPower();
        }

        if (whitelistedProposers[msg.sender] != address(0) && whitelistedProposers[msg.sender] != address(proposalTimelocks[uint8(proposalType)])) {
            revert TimelockNotWhitelistedForProposer();
        }

        if (
            targets.length != values.length || targets.length != signatures.length || targets.length != calldatas.length
        ) {
            revert ArityMismatch("targets, values, signatures, calldatas");
        }

        if (targets.length == 0) {
            revert NoActionsProvided();
        }
        if (targets.length > proposalMaxOperations) {
            revert TooManyActions();
        }

        uint256 latestProposalId = latestProposalIds[msg.sender];
        if (latestProposalId != 0) {
            ProposalState proposersLatestProposalState = state(latestProposalId);
            if (
                proposersLatestProposalState == ProposalState.Active ||
                proposersLatestProposalState == ProposalState.Pending
            ) {
                revert OneLiveProposalPerProposer();
            }
        }

        uint256 startBlock = add256(block.number, proposalConfigs[uint8(proposalType)].votingDelay);
        uint256 endBlock = add256(startBlock, proposalConfigs[uint8(proposalType)].votingPeriod);

        proposalCount++;

        Proposal storage proposal = proposals[proposalCount];
        proposal.id = proposalCount;
        proposal.proposer = msg.sender;
        proposal.targets = targets;
        proposal.values = values;
        proposal.signatures = signatures;
        proposal.calldatas = calldatas;
        proposal.startBlock = startBlock;
        proposal.endBlock = endBlock;
        proposal.proposalType = uint8(proposalType);

        latestProposalIds[msg.sender] = proposalCount;

        emit ProposalCreated(
            proposalCount,
            msg.sender,
            targets,
            values,
            signatures,
            calldatas,
            startBlock,
            endBlock,
            description,
            uint8(proposalType)
        );
        return proposalCount;
    }

    /**
     * @notice Queues a proposal of state succeeded
     * @param proposalId The id of the proposal to queue
     */
    function queue(uint256 proposalId) external {
        if (state(proposalId) != ProposalState.Succeeded) {
            revert ProposalNotSucceeded();
        }

        Proposal storage proposal = proposals[proposalId];
        uint256 eta = add256(block.timestamp, proposalTimelocks[uint8(proposal.proposalType)].delay());
        for (uint256 i; i < proposal.targets.length; ++i) {
            queueOrRevertInternal(
                proposal.targets[i],
                proposal.values[i],
                proposal.signatures[i],
                proposal.calldatas[i],
                eta,
                uint8(proposal.proposalType)
            );
        }
        proposal.eta = eta;
        emit ProposalQueued(proposalId, eta);
    }

    /**
     * @notice Whitelists a proposer
     * @param proposer The address of the proposer to whitelist
     */
    function whitelistProposer(address proposer) external {
        require(
            msg.sender == address(proposalTimelocks[uint8(ProposalType.NORMAL)]),
            "GovernorBravo::whitelistProposer: callable only from normal timelock only"
        );
        whitelistedProposers[proposer] = true;

        emit WhitelistedProposerAdded(proposer);
    }

    /**
     * @notice Removes a whitelisted proposer
     * @param proposer The address of the proposer to remove from whitelist
     */
    function removeWhitelistedProposer(address proposer) external {
        require(
            msg.sender == address(proposalTimelocks[uint8(ProposalType.NORMAL)]),
            "GovernorBravo::removeWhitelistedProposer: callable only from normal timelock only"
        );
        whitelistedProposers[proposer] = false;

        emit WhitelistedProposerRemoved(proposer);
    }

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
            revert DuplicateAction();
        }

        proposalTimelocks[proposalType].queueTransaction(target, value, signature, data, eta);
    }

    /**
     * @notice Executes a queued proposal if eta has passed
     * @param proposalId The id of the proposal to execute
     */
    function execute(uint256 proposalId) external {
        if (state(proposalId) != ProposalState.Queued) {
            revert ProposalNotQueued();
        }

        Proposal storage proposal = proposals[proposalId];
        proposal.executed = true;
        for (uint256 i; i < proposal.targets.length; ++i) {
            proposalTimelocks[uint8(proposal.proposalType)].executeTransaction(
                proposal.targets[i],
                proposal.values[i],
                proposal.signatures[i],
                proposal.calldatas[i],
                proposal.eta
            );
        }
        emit ProposalExecuted(proposalId);
    }

    /**
     * @notice Cancels a proposal only if sender is the proposer, or proposer delegates dropped below proposal threshold
     * @param proposalId The id of the proposal to cancel
     */
    function cancel(uint256 proposalId) external {
        if (state(proposalId) == ProposalState.Executed) {
            revert ProposalAlreadyExecuted();
        }
        Proposal storage proposal = proposals[proposalId];
        if (
            msg.sender != guardian &&
            msg.sender != proposal.proposer &&
            xvsVault.getPriorVotes(proposal.proposer, sub256(block.number, 1)) >=
            proposalConfigs[proposal.proposalType].proposalThreshold
        ) {
            revert InsufficientVotingPower();
        }

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

        emit ProposalCanceled(proposalId);
    }

    /**
     * @notice Gets actions of a proposal
     * @param proposalId the id of the proposal
     * @return targets Array of proposal targets,
     * @return values Array of proposal values
     * @return signatures Array of proposal signatures
     * @return calldatas Array of proposal calldatas
     */
    function getActions(
        uint256 proposalId
    )
        external
        view
        returns (
            address[] memory targets,
            uint256[] memory values,
            string[] memory signatures,
            bytes[] memory calldatas
        )
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
        return proposals[proposalId].receipts[voter];
    }

    /**
     * @notice Gets the state of a proposal
     * @param proposalId The id of the proposal
     * @return Proposal state
     */
    function state(uint256 proposalId) public view returns (ProposalState) {
        if (proposalCount < proposalId && proposalId > initialProposalId) {
            revert InvalidProposalId();
        }
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
        } else if (
            block.timestamp >= add256(proposal.eta, proposalTimelocks[uint8(proposal.proposalType)].GRACE_PERIOD())
        ) {
            return ProposalState.Expired;
        } else {
            return ProposalState.Queued;
        }
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
            abi.encode(DOMAIN_TYPEHASH, keccak256(bytes(name)), getChainIdInternal(), address(this))
        );
        bytes32 structHash = keccak256(abi.encode(BALLOT_TYPEHASH, proposalId, support));
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", domainSeparator, structHash));
        address signatory = ecrecover(digest, v, r, s);
        if (signatory == address(0)) {
            revert InvalidSignature();
        }
        emit VoteCast(signatory, proposalId, support, castVoteInternal(signatory, proposalId, support), "");
    }

    /**
     * @notice Internal function that caries out voting logic
     * @param voter The voter that is casting their vote
     * @param proposalId The id of the proposal to vote on
     * @param support The support value for the vote. 0=against, 1=for, 2=abstain
     * @return The number of votes cast
     */
    function castVoteInternal(address voter, uint256 proposalId, uint8 support) internal returns (uint96) {
        if (state(proposalId) != ProposalState.Active) {
            revert ProposalNotActive();
        }
        if (support > 2) {
            revert InvalidVoteType();
        }
        Proposal storage proposal = proposals[proposalId];
        Receipt storage receipt = proposal.receipts[voter];
        if (receipt.hasVoted == true) {
            revert UserAlreadyVoted();
        }
        uint96 votes = xvsVault.getPriorVotes(voter, proposal.startBlock);

        if (support == 0) {
            proposal.againstVotes = add256(proposal.againstVotes, votes);
        } else if (support == 1) {
            proposal.forVotes = add256(proposal.forVotes, votes);
        } else if (support == 2) {
            proposal.abstainVotes = add256(proposal.abstainVotes, votes);
        }

        receipt.hasVoted = true;
        receipt.support = support;
        receipt.votes = votes;

        return votes;
    }

    /**
     * @notice Sets the new governance guardian
     * @param newGuardian the address of the new guardian
     */
    function _setGuardian(address newGuardian) external onlyGuardianOrAdmin {
        ensureNonzeroAddress(newGuardian);
        address oldGuardian = guardian;
        guardian = newGuardian;

        emit NewGuardian(oldGuardian, newGuardian);
    }

    /**
     * @notice Initiate the GovernorBravo contract
     * @dev Admin only. Sets initial proposal id which initiates the contract, ensuring a continuous proposal id count
     * @param governorAlpha The address for the Governor to continue the proposal id count from
     */
    function _initiate(address governorAlpha) external onlyAdmin {
        if (initialProposalId != 0) {
            revert AlreadyInitialized();
        }
        proposalCount = GovernorAlphaInterface(governorAlpha).proposalCount();
        initialProposalId = proposalCount;
        for (uint256 i; i < uint8(ProposalType.CRITICAL) + 1; ++i) {
            proposalTimelocks[i].acceptAdmin();
        }
    }

    /**
     * @notice Set max proposal operations
     * @dev Admin only.
     * @param proposalMaxOperations_ Max proposal operations
     */
    function _setProposalMaxOperations(uint256 proposalMaxOperations_) external onlyAdmin {
        uint256 oldProposalMaxOperations = proposalMaxOperations;
        proposalMaxOperations = proposalMaxOperations_;

        emit ProposalMaxOperationsUpdated(oldProposalMaxOperations, proposalMaxOperations_);
    }

    /**
     * @notice Begins transfer of admin rights. The newPendingAdmin must call `_acceptAdmin` to finalize the transfer.
     * @dev Admin function to begin change of admin. The newPendingAdmin must call `_acceptAdmin` to finalize the transfer.
     * @param newPendingAdmin New pending admin.
     */
    function _setPendingAdmin(address newPendingAdmin) external onlyAdmin {
        ensureNonzeroAddress(newPendingAdmin);

        // Save current value, if any, for inclusion in log
        address oldPendingAdmin = pendingAdmin;

        // Store pendingAdmin with value newPendingAdmin
        pendingAdmin = newPendingAdmin;

        // Emit NewPendingAdmin(oldPendingAdmin, newPendingAdmin)
        emit NewPendingAdmin(oldPendingAdmin, newPendingAdmin);
    }

    /**
     * @notice Accepts transfer of admin rights. msg.sender must be pendingAdmin
     * @dev Admin function for pending admin to accept role and update admin
     */
    function _acceptAdmin() external {
        ensureNonzeroAddress(msg.sender);
        // Check caller is pendingAdmin and pendingAdmin ≠ address(0)
        if (msg.sender != pendingAdmin) {
            revert SenderIsNotPendingAdmin();
        }

        // Save current values for inclusion in log
        address oldAdmin = admin;
        address oldPendingAdmin = pendingAdmin;

        // Store admin with value pendingAdmin
        admin = pendingAdmin;

        // Clear the pending value
        pendingAdmin = address(0);

        emit NewAdmin(oldAdmin, admin);
        emit NewPendingAdmin(oldPendingAdmin, pendingAdmin);
    }

    function add256(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        require(c >= a, "addition overflow");
        return c;
    }

    function sub256(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b <= a, "subtraction underflow");
        return a - b;
    }

    function getChainIdInternal() internal view returns (uint256) {
        uint256 chainId;
        assembly {
            chainId := chainid()
        }
        return chainId;
    }
}
