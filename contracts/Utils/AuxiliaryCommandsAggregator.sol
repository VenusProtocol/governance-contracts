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
 *         A batch is added in one of two formats. Signature calls are Timelock-style: a function signature
 *         plus ABI-encoded arguments, with the selector derived from the signature, so the batch reads back
 *         as signatures and arguments. Raw calls carry the full calldata, selector included; they skip
 *         storing and hashing signatures, so they cost less gas to add and execute.
 */
contract AuxiliaryCommandsAggregator is AccessControlledV8 {
    /**
     * @notice A single call in a batch.
     * @dev `data` holds the ABI-encoded arguments only; the selector is derived from `signature`.
     *      A raw call is stored as a `Call` with an empty `signature` and its full calldata in `data`.
     * @param target Contract to call.
     * @param signature Function signature, e.g. `transfer(address,uint256)`; empty for a raw call.
     * @param data ABI-encoded arguments, or the full calldata for a raw call.
     */
    struct Call {
        address target;
        string signature;
        bytes data;
    }

    /**
     * @notice A single raw call in a batch.
     * @param target Contract to call.
     * @param data Full calldata, 4-byte selector included.
     */
    struct RawCall {
        address target;
        bytes data;
    }

    /// @dev Deprecated slot for the `(target, data)` batches array. Never reuse it.
    uint256 private __deprecatedBatches;

    /// @notice Addresses authorized to add batches.
    mapping(address => bool) public authorizedBatchers;

    /**
     * @notice 2-D array of pre-seeded call batches; index 0 is the first batch added.
     *         Raw calls have an empty signature.
     */
    Call[][] public batches;

    /// @notice Whether the batch at a given index has been executed.
    mapping(uint256 => bool) public batchExecuted;

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     */
    uint256[46] private __gap;

    /**
     * @notice Emitted when a batch is added.
     * @param index Index of the batch.
     */
    event BatchAdded(uint256 index);

    /**
     * @notice Emitted when every call in a batch has been executed.
     * @param index Index of the batch.
     */
    event BatchExecuted(uint256 index);

    /**
     * @notice Emitted when an account is authorized as a batcher or has its authorization revoked.
     * @param account The batcher account.
     * @param authorized Whether the account is now authorized.
     */
    event AuthorizedBatcherUpdated(address indexed account, bool authorized);

    /// @notice Thrown when adding a batch with no calls.
    error EmptyCalls();

    /// @notice Thrown when an account list is empty.
    error InvalidArrayLength();

    /**
     * @notice Thrown when no batch exists at an index.
     * @param index The requested batch index.
     */
    error BatchNotFound(uint256 index);

    /**
     * @notice Thrown when a call in a batch reverts.
     * @param batchIndex Index of the batch being executed.
     * @param callIndex Index of the failing call within the batch.
     * @param reason Revert data returned by the call.
     */
    error CallFailed(uint256 batchIndex, uint256 callIndex, bytes reason);

    /**
     * @notice Thrown when the caller-provided index does not match the index the batch would be stored at.
     * @param expected The index the caller expected.
     * @param actual The index the batch would be stored at.
     */
    error InvalidBatchIndex(uint256 expected, uint256 actual);

    /**
     * @notice Thrown when an unauthorized account tries to add a batch.
     * @param sender The caller.
     */
    error NotAllowedToBatchCommands(address sender);

    /**
     * @notice Thrown when a call in a new batch has an empty signature.
     * @param callIndex Index of the offending call within the batch.
     */
    error EmptySignature(uint256 callIndex);

    /**
     * @notice Thrown when a raw call in a new batch has calldata shorter than a function selector.
     * @param callIndex Index of the offending call within the batch.
     */
    error MissingSelector(uint256 callIndex);

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

    /**
     * @notice Restricts a function to addresses authorized to add batches.
     * @custom:error NotAllowedToBatchCommands if the caller is not an authorized batcher
     */
    modifier onlyAuthorizedBatcher() {
        if (!authorizedBatchers[msg.sender]) revert NotAllowedToBatchCommands(msg.sender);
        _;
    }

    /**
     * @notice Disables initializers so the implementation contract cannot be initialized.
     * @custom:event Emits Initialized
     * @custom:oz-upgrades-unsafe-allow constructor
     */
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initializes the contract with the AccessControlManager and sets the caller as owner.
     * @dev Reverts if already initialized or if `accessControlManager_` is the zero address.
     * @param accessControlManager_ Address of the access control manager.
     * @custom:event Emits Initialized, OwnershipTransferred and NewAccessControlManager
     * @custom:access Callable only once, through the proxy
     */
    function initialize(address accessControlManager_) external initializer {
        __AccessControlled_init(accessControlManager_);
    }

    /**
     * @notice Authorize accounts to add batches.
     * @param accounts Non-empty array of addresses to authorize as batchers.
     * @custom:event Emits AuthorizedBatcherUpdated for each account
     * @custom:error Unauthorized if the caller is not allowed by the AccessControlManager
     * @custom:error InvalidArrayLength if `accounts` is empty
     * @custom:error ZeroAddressNotAllowed if an account is the zero address
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
     * @notice Revoke accounts' authorization to add batches.
     * @param accounts Non-empty array of batcher addresses to revoke.
     * @custom:event Emits AuthorizedBatcherUpdated for each account
     * @custom:error Unauthorized if the caller is not allowed by the AccessControlManager
     * @custom:error InvalidArrayLength if `accounts` is empty
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
     * @custom:error NotAllowedToBatchCommands if the caller is not an authorized batcher
     * @custom:error EmptyCalls if `calls` is empty
     * @custom:error EmptySignature if a call has an empty signature
     * @custom:error InvalidTarget if a call targets an address without code
     * @custom:access Restricted to authorized batchers
     */
    function addBatch(Call[] calldata calls) external onlyAuthorizedBatcher returns (uint256 index) {
        return _addBatch(calls);
    }

    /**
     * @notice Append a new batch of raw calls.
     * @param calls Non-empty array of (target, calldata) calls to store.
     * @return index The storage index of the newly added batch.
     * @custom:event Emits BatchAdded
     * @custom:error NotAllowedToBatchCommands if the caller is not an authorized batcher
     * @custom:error EmptyCalls if `calls` is empty
     * @custom:error MissingSelector if a call's calldata is shorter than 4 bytes
     * @custom:error InvalidTarget if a call targets an address without code
     * @custom:access Restricted to authorized batchers
     */
    function addBatch(RawCall[] calldata calls) external onlyAuthorizedBatcher returns (uint256 index) {
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
     * @custom:error NotAllowedToBatchCommands if the caller is not an authorized batcher
     * @custom:error InvalidBatchIndex if `expectedIndex` is not the next batch index
     * @custom:error EmptyCalls if `calls` is empty
     * @custom:error EmptySignature if a call has an empty signature
     * @custom:error InvalidTarget if a call targets an address without code
     * @custom:access Restricted to authorized batchers
     */
    function addBatch(
        Call[] calldata calls,
        uint256 expectedIndex
    ) external onlyAuthorizedBatcher returns (uint256 index) {
        _checkBatchIndex(expectedIndex);
        return _addBatch(calls);
    }

    /**
     * @notice Append a new batch of raw calls, asserting it is stored at `expectedIndex`.
     * @dev Reverts if another batch was added in the meantime, so the
     *      caller can rely on the returned index matching what it encoded into its proposal.
     * @param calls Non-empty array of (target, calldata) calls to store.
     * @param expectedIndex The index the caller expects this batch to occupy.
     * @return index The storage index of the newly added batch (equals `expectedIndex`).
     * @custom:event Emits BatchAdded
     * @custom:error NotAllowedToBatchCommands if the caller is not an authorized batcher
     * @custom:error InvalidBatchIndex if `expectedIndex` is not the next batch index
     * @custom:error EmptyCalls if `calls` is empty
     * @custom:error MissingSelector if a call's calldata is shorter than 4 bytes
     * @custom:error InvalidTarget if a call targets an address without code
     * @custom:access Restricted to authorized batchers
     */
    function addBatch(
        RawCall[] calldata calls,
        uint256 expectedIndex
    ) external onlyAuthorizedBatcher returns (uint256 index) {
        _checkBatchIndex(expectedIndex);
        return _addBatch(calls);
    }

    /**
     * @notice Execute every call in batch `index` sequentially. A batch can be executed only once.
     * @dev A batch is raw when its first call has an empty signature: signature batches reject empty
     *      signatures and raw batches never set one, so a single read covers the whole batch. A raw call is
     *      sent as stored; a signature call is sent as its signature's selector followed by its arguments.
     * @param index Index of the batch to execute.
     * @custom:event Emits BatchExecuted
     * @custom:error Unauthorized if the caller is not allowed by the AccessControlManager
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
        bool raw = bytes(batch[0].signature).length == 0;
        uint256 length = batch.length;
        for (uint256 i; i < length; ++i) {
            Call storage c = batch[i];
            bool success;
            bytes memory reason;
            if (raw) {
                (success, reason) = c.target.call(c.data);
            } else {
                (success, reason) = c.target.call(abi.encodePacked(bytes4(keccak256(bytes(c.signature))), c.data));
            }
            if (!success) revert CallFailed(index, i, reason);
        }
        emit BatchExecuted(index);
    }

    /**
     * @notice Returns the number of batches stored; the next batch added uses this as its index.
     * @return The number of batches stored.
     */
    function batchCount() external view returns (uint256) {
        return batches.length;
    }

    /**
     * @notice Return all calls stored in batch `index`.
     * @param index Index of the batch to retrieve.
     * @return calls The full array of (target, signature, arguments) calls. In a raw batch each call has an
     *         empty signature and its full calldata in `data`.
     * @custom:error BatchNotFound if no batch exists at `index`
     */
    function getBatch(uint256 index) external view returns (Call[] memory calls) {
        if (index >= batches.length) revert BatchNotFound(index);
        return batches[index];
    }

    /**
     * @dev Stores a batch of signature calls. Empty signatures are rejected because an empty signature
     *      marks a raw batch at execution.
     * @param calls Non-empty array of (target, signature, arguments) calls to store.
     * @return index The storage index of the newly added batch.
     * @custom:event Emits BatchAdded
     * @custom:error EmptyCalls if `calls` is empty
     * @custom:error EmptySignature if a call has an empty signature
     * @custom:error InvalidTarget if a call targets an address without code
     */
    function _addBatch(Call[] calldata calls) internal returns (uint256 index) {
        Call[] storage batch;
        (index, batch) = _pushBatch(calls.length);
        for (uint256 i; i < calls.length; ++i) {
            Call calldata c = calls[i];
            if (bytes(c.signature).length == 0) revert EmptySignature(i);
            _checkTarget(i, c.target);
            batch.push(c);
        }
    }

    /**
     * @dev Stores a batch of raw calls. Each call is stored as a `Call` whose signature is never written,
     *      so it reads back empty.
     * @param calls Non-empty array of (target, calldata) calls to store.
     * @return index The storage index of the newly added batch.
     * @custom:event Emits BatchAdded
     * @custom:error EmptyCalls if `calls` is empty
     * @custom:error MissingSelector if a call's calldata is shorter than 4 bytes
     * @custom:error InvalidTarget if a call targets an address without code
     */
    function _addBatch(RawCall[] calldata calls) internal returns (uint256 index) {
        Call[] storage batch;
        (index, batch) = _pushBatch(calls.length);
        for (uint256 i; i < calls.length; ++i) {
            RawCall calldata c = calls[i];
            if (c.data.length < 4) revert MissingSelector(i);
            _checkTarget(i, c.target);
            Call storage stored = batch.push();
            stored.target = c.target;
            stored.data = c.data;
        }
    }

    /**
     * @dev Appends an empty batch for the caller to fill.
     * @param length Number of calls the batch will hold.
     * @return index The storage index of the new batch.
     * @return batch The new batch.
     * @custom:event Emits BatchAdded
     * @custom:error EmptyCalls if `length` is zero
     */
    function _pushBatch(uint256 length) internal returns (uint256 index, Call[] storage batch) {
        if (length == 0) revert EmptyCalls();
        index = batches.length;
        batch = batches.push();
        emit BatchAdded(index);
    }

    /**
     * @dev Reverts unless `expectedIndex` is the index the next batch will be stored at.
     * @param expectedIndex The index the caller expects the next batch to occupy.
     * @custom:error InvalidBatchIndex if `expectedIndex` is not the next batch index
     */
    function _checkBatchIndex(uint256 expectedIndex) internal view {
        if (expectedIndex != batches.length) revert InvalidBatchIndex(expectedIndex, batches.length);
    }

    /**
     * @dev Reverts if `target` has no code, which catches mistyped and zero addresses.
     * @param callIndex Index of the call within its batch.
     * @param target The call's target.
     * @custom:error InvalidTarget if `target` has no code
     */
    function _checkTarget(uint256 callIndex, address target) internal view {
        if (target.code.length == 0) revert InvalidTarget(callIndex, target);
    }
}
