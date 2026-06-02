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
 */
contract AuxiliaryCommandsAggregator is AccessControlledV8 {
    struct Call {
        address target;
        bytes data;
    }

    /// @notice 2-D array of pre-seeded call batches; index 0 is the first batch added.
    Call[][] public batches;

    /// @notice Addresses authorized to call addBatch.
    mapping(address => bool) public authorizedBatchers;

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     */
    uint256[49] private __gap;

    event BatchAdded(uint256 index);
    event BatchExecuted(uint256 index);
    event AuthorizedBatcherUpdated(address indexed account, bool authorized);

    error EmptyCalls();
    error InvalidArrayLength();
    error CallFailed(uint256 batchIndex, uint256 callIndex);
    error BatchNotFound(uint256 index);

    /// @notice Thrown when the caller-provided index does not match the index the batch would be stored at.
    error InvalidBatchIndex(uint256 expected, uint256 actual);

    /// @notice Thrown when an unauthorized account tries to add a batch.
    error NotAllowedToBatchCommands(address sender);

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
     * @param calls Non-empty array of (target, calldata) pairs to store.
     * @return index The storage index of the newly added batch.
     * @custom:access Restricted to authorized batchers
     */
    function addBatch(Call[] calldata calls) external onlyAuthorizedBatcher returns (uint256 index) {
        return _addBatch(calls);
    }

    /**
     * @notice Append a new batch of calls, asserting it is stored at `expectedIndex`.
     * @dev Reverts if another batch was added in the meantime, so the
     *      caller can rely on the returned index matching what it encoded into its proposal.
     * @param calls Non-empty array of (target, calldata) pairs to store.
     * @param expectedIndex The index the caller expects this batch to occupy.
     * @return index The storage index of the newly added batch (equals `expectedIndex`).
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
     * @param calls Non-empty array of (target, calldata) pairs to store.
     * @return index The storage index of the newly added batch.
     */
    function _addBatch(Call[] calldata calls) internal returns (uint256 index) {
        if (calls.length == 0) revert EmptyCalls();
        index = batches.length;
        batches.push();
        for (uint256 i; i < calls.length; ++i) {
            batches[index].push(calls[i]);
        }
        emit BatchAdded(index);
    }

    /**
     * @notice Execute every call in batch `index` sequentially.
     * @param index Index of the batch to execute.
     * @custom:access Controlled by AccessControlManager
     */
    function executeBatch(uint256 index) external {
        _checkAccessAllowed("executeBatch(uint256)");
        if (index >= batches.length) revert BatchNotFound(index);
        uint256 length = batches[index].length;
        for (uint256 i; i < length; ++i) {
            Call memory c = batches[index][i];
            (bool success, ) = c.target.call(c.data);
            if (!success) revert CallFailed(index, i);
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
     * @return calls The full array of (target, data) pairs.
     */
    function getBatch(uint256 index) external view returns (Call[] memory calls) {
        if (index >= batches.length) revert BatchNotFound(index);
        return batches[index];
    }
}
