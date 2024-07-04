//  SPDX-License-Identifier: BSD-3-Clause

pragma solidity 0.8.25;

import { NonblockingLzApp } from "@layerzerolabs/solidity-examples/contracts/lzApp/NonblockingLzApp.sol";
import { Pausable } from "@openzeppelin/contracts/security/Pausable.sol";
import { ensureNonzeroAddress } from "@venusprotocol/solidity-utilities/contracts/validators.sol";

/**
 * @title BaseOmnichainControllerDest
 * @author Venus
 * @dev This contract is the base for the Omnichain controller destination contract
 * It provides functionality related to daily command limits and pausability
 * @custom:security-contact https://github.com/VenusProtocol/governance-contracts#discussion
 */

abstract contract BaseOmnichainControllerDest is NonblockingLzApp, Pausable {
    /**
     * @notice Maximum daily limit for receiving commands from Binance chain
     */
    uint256 public maxDailyReceiveLimit;

    /**
     * @notice Total received commands within the last 24-hour window from Binance chain
     */
    uint256 public last24HourCommandsReceived;

    /**
     * @notice Timestamp when the last 24-hour window started from Binance chain
     */
    uint256 public last24HourReceiveWindowStart;

    /**
     * @notice Emitted when the maximum daily limit for receiving command from Binance chain is modified
     */
    event SetMaxDailyReceiveLimit(uint256 oldMaxLimit, uint256 newMaxLimit);

    constructor(address endpoint_) NonblockingLzApp(endpoint_) {
        ensureNonzeroAddress(endpoint_);
    }

    /**
     * @notice Sets the maximum daily limit for receiving commands
     * @param limit_ Number of commands
     * @custom:access Only Owner
     * @custom:event Emits SetMaxDailyReceiveLimit with old and new limit
     */
    function setMaxDailyReceiveLimit(uint256 limit_) external onlyOwner {
        emit SetMaxDailyReceiveLimit(maxDailyReceiveLimit, limit_);
        maxDailyReceiveLimit = limit_;
    }

    /**
     * @notice Triggers the paused state of the controller
     * @custom:access Only owner
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Triggers the resume state of the controller
     * @custom:access Only owner
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Empty implementation of renounce ownership to avoid any mishappening
     */
    function renounceOwnership() public override {}

    /**
     * @notice Check eligibility to receive commands
     * @param noOfCommands_ Number of commands to be received
     */
    function _isEligibleToReceive(uint256 noOfCommands_) internal {
        uint256 currentBlockTimestamp = block.timestamp;

        // Load values for the 24-hour window checks for receiving
        uint256 receivedInWindow = last24HourCommandsReceived;

        // Check if the time window has changed (more than 24 hours have passed)
        if (currentBlockTimestamp - last24HourReceiveWindowStart > 1 days) {
            receivedInWindow = noOfCommands_;
            last24HourReceiveWindowStart = currentBlockTimestamp;
        } else {
            receivedInWindow += noOfCommands_;
        }

        // Revert if the received amount exceeds the daily limit
        require(receivedInWindow <= maxDailyReceiveLimit, "Daily Transaction Limit Exceeded");

        // Update the received amount for the 24-hour window
        last24HourCommandsReceived = receivedInWindow;
    }
}
