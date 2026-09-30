// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.25;

import { AccessControlledV8 } from "../Governance/AccessControlledV8.sol";
import { ensureNonzeroAddress } from "@venusprotocol/solidity-utilities/contracts/validators.sol";

/**
 * @title AuxiliaryCommandsAggregator
 * @author Venus
 * @notice Stores pre-seeded batches of generic on-chain calls and executes them in one go,
 *         reducing the calldata footprint of governance proposals that would otherwise exceed
 *         GovernorBravo's gas limit when encoding many large-array parameters.
 *         Each call is Timelock-style: a function signature plus ABI-encoded arguments. The selector
 *         is derived from the signature, so a stored batch reads back as signatures and arguments.
 */
contract AuxiliaryCommandsAggregator is AccessControlledV8 {
    /**
     * @notice A single call in a batch.
     * @dev `data` holds the ABI-encoded arguments only; the selector is derived from `signature`.
     */
    struct Call {
        address target;
        string signature;
        bytes data;
    }

    /// @dev Deprecated slot for the `(target, data)` batches array. Never reuse it.
    uint256 private __deprecatedBatches;

    /// @notice Addresses authorized to call addBatch.
    mapping(address => bool) public authorizedBatchers;

    /// @notice 2-D array of pre-seeded call batches; index 0 is the first batch added.
    Call[][] public batches;

    /// @notice Whether the batch at a given index has been executed.
    mapping(uint256 => bool) public batchExecuted;

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     */
    uint256[46] private __gap;

    event BatchAdded(uint256 index);
    event BatchExecuted(uint256 index);
    event AuthorizedBatcherUpdated(address indexed account, bool authorized);

    error EmptyCalls();
    error InvalidArrayLength();
    error BatchNotFound(uint256 index);

    /**
     * @notice Thrown when a call in a batch reverts.
     * @param batchIndex Index of the batch being executed.
     * @param callIndex Index of the failing call within the batch.
     * @param reason Revert data returned by the call.
     */
    error CallFailed(uint256 batchIndex, uint256 callIndex, bytes reason);

    /// @notice Thrown when the caller-provided index does not match the index the batch would be stored at.
    error InvalidBatchIndex(uint256 expected, uint256 actual);

    /// @notice Thrown when an unauthorized account tries to add a batch.
    error NotAllowedToBatchCommands(address sender);

    /**
     * @notice Thrown when a call in a new batch has an empty signature.
     * @param callIndex Index of the offending call within the batch.
     */
    error EmptySignature(uint256 callIndex);

    /**
     * @notice Thrown when a call in a new batch targets an address without code.
     * @param callIndex Index of the offending call within the batch.
     * @param target The target address.
     */
    error InvalidTarget(uint256 callIndex, address target);

    /**
     * @notice Thrown when executing a batch that has already been executed.
     * @param index Index of the batch.
     */
    error BatchAlreadyExecuted(uint256 index);

    /// @notice Restricts a function to addresses authorized to add batches.
    modifier onlyAuthorizedBatcher() {
        if (!authorizedBatchers[msg.sender]) revert NotAllowedToBatchCommands(msg.sender);
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initializes the contract with the AccessControlManager.
     * @param accessControlManager_ Address of the access control manager.
     */
    function initialize(address accessControlManager_) external initializer {
        __AccessControlled_init(accessControlManager_);
    }

    /**
     * @notice Authorize accounts to call addBatch.
     * @param accounts Non-empty array of addresses to authorize as batchers.
     * @custom:access Controlled by AccessControlManager
     */
    function addAuthorizedBatchers(address[] calldata accounts) external {
        _checkAccessAllowed("addAuthorizedBatchers(address[])");
        if (accounts.length == 0) revert InvalidArrayLength();
        for (uint256 i; i < accounts.length; ++i) {
            ensureNonzeroAddress(accounts[i]);
            authorizedBatchers[accounts[i]] = true;
            emit AuthorizedBatcherUpdated(accounts[i], true);
        }
    }

    /**
     * @notice Revoke accounts' authorization to call addBatch.
     * @param accounts Non-empty array of batcher addresses to revoke.
     * @custom:access Controlled by AccessControlManager
     */
    function removeAuthorizedBatchers(address[] calldata accounts) external {
        _checkAccessAllowed("removeAuthorizedBatchers(address[])");
        if (accounts.length == 0) revert InvalidArrayLength();
        for (uint256 i; i < accounts.length; ++i) {
            authorizedBatchers[accounts[i]] = false;
            emit AuthorizedBatcherUpdated(accounts[i], false);
        }
    }

    /**
     * @notice Append a new batch of calls.
     * @param calls Non-empty array of (target, signature, arguments) calls to store.
     * @return index The storage index of the newly added batch.
     * @custom:event Emits BatchAdded
     * @custom:error EmptyCalls if `calls` is empty
     * @custom:error EmptySignature if a call has an empty signature
     * @custom:error InvalidTarget if a call targets an address without code
     * @custom:error NotAllowedToBatchCommands if the caller is not an authorized batcher
     * @custom:access Restricted to authorized batchers
     */
    function addBatch(Call[] calldata calls) external onlyAuthorizedBatcher returns (uint256 index) {
        return _addBatch(calls);
    }

    /**
     * @notice Append a new batch of calls, asserting it is stored at `expectedIndex`.
     * @dev Reverts if another batch was added in the meantime, so the
     *      caller can rely on the returned index matching what it encoded into its proposal.
     * @param calls Non-empty array of (target, signature, arguments) calls to store.
     * @param expectedIndex The index the caller expects this batch to occupy.
     * @return index The storage index of the newly added batch (equals `expectedIndex`).
     * @custom:event Emits BatchAdded
     * @custom:error InvalidBatchIndex if `expectedIndex` is not the next batch index
     * @custom:error EmptyCalls if `calls` is empty
     * @custom:error EmptySignature if a call has an empty signature
     * @custom:error InvalidTarget if a call targets an address without code
     * @custom:error NotAllowedToBatchCommands if the caller is not an authorized batcher
     * @custom:access Restricted to authorized batchers
     */
    function addBatch(
        Call[] calldata calls,
        uint256 expectedIndex
    ) external onlyAuthorizedBatcher returns (uint256 index) {
        if (expectedIndex != batches.length) revert InvalidBatchIndex(expectedIndex, batches.length);
        return _addBatch(calls);
    }

    /**
     * @dev Shared logic for storing a batch of calls.
     * @param calls Non-empty array of (target, signature, arguments) calls to store.
     * @return index The storage index of the newly added batch.
     */
    function _addBatch(Call[] calldata calls) internal returns (uint256 index) {
        if (calls.length == 0) revert EmptyCalls();
        index = batches.length;
        Call[] storage batch = batches.push();
        for (uint256 i; i < calls.length; ++i) {
            Call calldata c = calls[i];
            if (bytes(c.signature).length == 0) revert EmptySignature(i);
            if (c.target.code.length == 0) revert InvalidTarget(i, c.target);
            batch.push(c);
        }
        emit BatchAdded(index);
    }

    /**
     * @notice Execute every call in batch `index` sequentially. A batch can be executed only once.
     * @param index Index of the batch to execute.
     * @custom:event Emits BatchExecuted
     * @custom:error BatchNotFound if no batch exists at `index`
     * @custom:error BatchAlreadyExecuted if the batch has already been executed
     * @custom:error CallFailed if any call reverts, with its revert data
     * @custom:access Controlled by AccessControlManager
     */
    function executeBatch(uint256 index) external {
        _checkAccessAllowed("executeBatch(uint256)");
        if (index >= batches.length) revert BatchNotFound(index);
        if (batchExecuted[index]) revert BatchAlreadyExecuted(index);
        batchExecuted[index] = true;

        Call[] storage batch = batches[index];
        uint256 length = batch.length;
        for (uint256 i; i < length; ++i) {
            Call storage c = batch[i];
            (bool success, bytes memory reason) = c.target.call(
                abi.encodePacked(bytes4(keccak256(bytes(c.signature))), c.data)
            );
            if (!success) revert CallFailed(index, i, reason);
        }
        emit BatchExecuted(index);
    }

    /// @notice Returns the number of batches stored; the next addBatch() call will use this as its index.
    function batchCount() external view returns (uint256) {
        return batches.length;
    }

    /**
     * @notice Return all calls stored in batch `index`.
     * @param index Index of the batch to retrieve.
     * @return calls The full array of (target, signature, arguments) calls.
     * @custom:error BatchNotFound if no batch exists at `index`
     */
    function getBatch(uint256 index) external view returns (Call[] memory calls) {
        if (index >= batches.length) revert BatchNotFound(index);
        return batches[index];
    }
}
