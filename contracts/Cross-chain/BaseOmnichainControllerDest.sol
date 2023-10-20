//  SPDX-License-Identifier: BSD-3-Clause

pragma solidity 0.8.13;

import "@layerzerolabs/solidity-examples/contracts/lzApp/NonblockingLzApp.sol";
import { Pausable } from "@openzeppelin/contracts/security/Pausable.sol";
import { ensureNonzeroAddress } from "../lib/validators.sol";

/**
 * @title BaseOmnichainControllerDest
 * @author Venus
 * @dev This contract is the base for the Omnichain controller destination contract.
 * It provides functionality related to daily command limits and pausability.
 */

abstract contract BaseOmnichainControllerDest is NonblockingLzApp, Pausable {
    /**
     * @notice Maximum daily limit for receiving commands from remote chain.
     */
    mapping(uint16 => uint256) public chainIdToMaxDailyReceiveLimit;

    /**
     * @notice Total received commands within the last 24-hour window from remote chain.
     */
    mapping(uint16 => uint256) public chainIdToLast24HourCommandsReceived;

    /**
     * @notice Timestamp when the last 24-hour window started from remote chain.
     */
    mapping(uint16 => uint256) public chainIdToLast24HourReceiveWindowStart;

    /**
     * @notice Emitted when the maximum daily limit for receiving command from remote chain is modified.
     */
    event SetMaxDailyReceiveLimit(uint256 oldMaxLimit, uint256 newMaxLimit);

    constructor(address endpoint_) NonblockingLzApp(endpoint_) {
        ensureNonzeroAddress(endpoint_);
    }

    /**
     * @notice Sets the maximum daily limit for receiving commands.
     * @param chainId_ The destination chain ID.
     * @param limit_ The new maximum daily limit in USD(scaled with 18 decimals).
     * @custom:access Only Owner.
     * @custom:event Emits SetMaxDailyReceiveLimit with new limit and its associated chain id
     */
    function setMaxDailyReceiveLimit(uint16 chainId_, uint256 limit_) external onlyOwner {
        emit SetMaxDailyReceiveLimit(chainIdToMaxDailyReceiveLimit[chainId_], limit_);
        chainIdToMaxDailyReceiveLimit[chainId_] = limit_;
    }

    /**
     * @notice Triggers the paused state of the bridge.
     * @custom:access Only owner.
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Triggers the resume state of the bridge.
     * @custom:access Only owner.
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Empty implementation of renounce ownership to avoid any mishappening.
     */
    function renounceOwnership() public override {}

    function _isEligibleToReceive(uint16 srcChainId_, uint256 noOfCommands_) internal {
        uint256 currentBlockTimestamp = block.timestamp;

        // Load values for the 24-hour window checks for receiving
        uint256 lastDayReceiveWindowStart = chainIdToLast24HourReceiveWindowStart[srcChainId_];
        uint256 receivedInWindow = chainIdToLast24HourCommandsReceived[srcChainId_];
        uint256 maxDailyReceiveLimit = chainIdToMaxDailyReceiveLimit[srcChainId_];

        // Check if the time window has changed (more than 24 hours have passed)
        if (currentBlockTimestamp - lastDayReceiveWindowStart > 1 days) {
            receivedInWindow = noOfCommands_;
            chainIdToLast24HourReceiveWindowStart[srcChainId_] = currentBlockTimestamp;
        } else {
            receivedInWindow += noOfCommands_;
        }

        // Revert if the received amount exceeds the daily limit
        require(receivedInWindow <= maxDailyReceiveLimit, "Daily Transaction Limit Exceeded");

        // Update the received amount for the 24-hour window
        chainIdToLast24HourCommandsReceived[srcChainId_] = receivedInWindow;
    }
}
