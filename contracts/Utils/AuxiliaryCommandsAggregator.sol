// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.25;

import { IAccessControlManagerV8 } from "../Governance/IAccessControlManagerV8.sol";
import { ensureNonzeroAddress } from "@venusprotocol/solidity-utilities/contracts/validators.sol";

/**
 * @title AuxiliaryCommandsAggregator
 * @author Venus
 * @notice Stores pre-seeded batches of generic on-chain calls and executes them in one go,
 *         reducing the calldata footprint of governance proposals that would otherwise exceed
 *         GovernorBravo's gas limit when encoding many large-array parameters.
 */
contract AuxiliaryCommandsAggregator {
    struct Call {
        address target;
        bytes data;
    }

    /// @notice Access control manager contract
    IAccessControlManagerV8 public immutable ACM;

    /// @notice 2-D array of pre-seeded call batches; index 0 is the first batch added.
    Call[][] public batches;

    event BatchAdded(uint256 index);
    event BatchExecuted(uint256 index);

    error EmptyCalls();
    error CallFailed(uint256 batchIndex, uint256 callIndex);
    error BatchNotFound(uint256 index);

    /// @notice Thrown when the caller is not permitted by the AccessControlManager.
    error Unauthorized(address sender, string methodSignature);

    /**
     * @notice Constructor to set the access control manager.
     * @param _acm Address of the access control manager.
     */
    constructor(IAccessControlManagerV8 _acm) {
        ensureNonzeroAddress(address(_acm));
        ACM = _acm;
    }

    /**
     * @notice Append a new batch of calls.
     * @param calls Non-empty array of (target, calldata) pairs to store.
     * @return index The storage index of the newly added batch.
     * @custom:access Controlled by AccessControlManager
     */
    function addBatch(Call[] calldata calls) external returns (uint256 index) {
        _checkAccessAllowed("addBatch(Call[])");
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

    /**
     * @notice Reverts if the call is not allowed by the AccessControlManager.
     * @param signature Method signature being guarded.
     */
    function _checkAccessAllowed(string memory signature) internal view {
        if (!ACM.isAllowedToCall(msg.sender, signature)) {
            revert Unauthorized(msg.sender, signature);
        }
    }
}
