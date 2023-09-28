// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.13;

import { Pausable } from "@openzeppelin/contracts/security/Pausable.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IAccessControlManagerV8 } from "./../Governance/IAccessControlManagerV8.sol";

contract OmnichainController is Ownable, Pausable {
    /// @notice ACM

    address public accessControlManager;

    /// @notice Maximum daily limit for commands from local chain.

    mapping(uint16 => uint256) public chainIdToMaxDailyLimit;

    /// @notice Total commands transferred within the last 24-hour window from local chain.

    mapping(uint16 => uint256) public chainIdToLast24HourCommandsSent;

    /// @notice Timestamp when the last 24-hour window started from local chain.

    mapping(uint16 => uint256) public chainIdToLast24HourWindowStart;

    /// @notice Maximum daily limit for receiving commands from remote chain.

    mapping(uint16 => uint256) public chainIdToMaxDailyReceiveLimit;

    /// @notice Total received commands within the last 24-hour window from remote chain.

    mapping(uint16 => uint256) public chainIdToLast24HourCommandsReceived;

    /// @notice Timestamp when the last 24-hour window started from remote chain.

    mapping(uint16 => uint256) public chainIdToLast24HourReceiveWindowStart;

    /// @notice Emitted when the maximum daily limit of commands from local chain is modified.

    event SetMaxDailyLimit(uint256 oldMaxLimit, uint256 newMaxLimit);

    /// @notice Emitted when the maximum daily limit for receiving command from remote chain is modified.

    event SetMaxDailyReceiveLimit(uint256 oldMaxLimit, uint256 newMaxLimit);
    event NewAccessControlManager(address indexed oldAccessControlManager, address indexed newAccessControlManager);

    constructor(address accessControlManager_) {
        accessControlManager = accessControlManager_;
    }

    /// @notice Sets the limit of daily (24 Hour) commands amount.
    /// @param chainId_ Destination chain id.
    /// @param limit_ Amount in USD.

    function setMaxDailyLimit(uint16 chainId_, uint256 limit_) external {
        _ensureAllowed("setMaxDailyLimit(uint16,uint256)");
        require(limit_ >= chainIdToMaxDailyLimit[chainId_], "Daily limit < single Command limit");
        emit SetMaxDailyLimit(chainIdToMaxDailyLimit[chainId_], limit_);
        chainIdToMaxDailyLimit[chainId_] = limit_;
    }

    /// @notice Sets the maximum daily limit for receiving Commands.
    /// @param chainId_ The destination chain ID.
    /// @param limit_ The new maximum daily limit in USD.

    function setMaxDailyReceiveLimit(uint16 chainId_, uint256 limit_) external {
        _ensureAllowed("setMaxDailyReceiveLimit(uint16,uint256)");
        emit SetMaxDailyReceiveLimit(chainIdToMaxDailyReceiveLimit[chainId_], limit_);
        chainIdToMaxDailyReceiveLimit[chainId_] = limit_;
    }

    /// @notice Triggers stopped state of the bridge.
    function pause() external onlyOwner {
        _pause();
    }

    /// @notice Triggers resume state of the bridge.

    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Internal function to set address of AccessControlManager
     * @param accessControlManager_ The new address of the AccessControlManager
     */
    function setAccessControlManager(address accessControlManager_) external onlyOwner {
        require(accessControlManager_ != address(0), "invalid acess control manager address");
        emit NewAccessControlManager(accessControlManager, accessControlManager_);
        accessControlManager = accessControlManager_;
    }

    /// @notice Empty implementation of renounce ownership to avoid any mishappening.

    function renounceOwnership() public virtual override {}

    /// @notice Verify the commands send in last 24 should not exceed limit
    /// @param dstChainId_  Destination chain id
    /// @param noOfCommands_ number of commands currently sending
    function _isEligibleToSend(uint16 dstChainId_, uint256 noOfCommands_) internal {
        // Load values for the 24-hour window checks
        uint256 currentBlockTimestamp = block.timestamp;
        uint256 lastDayWindowStart = chainIdToLast24HourWindowStart[dstChainId_];
        uint256 commandsSentInWindow = chainIdToLast24HourCommandsSent[dstChainId_];
        uint256 maxDailyLimit = chainIdToMaxDailyLimit[dstChainId_];

        // Check if the time window has changed (more than 24 hours have passed)
        if (currentBlockTimestamp - lastDayWindowStart > 1 days) {
            commandsSentInWindow = noOfCommands_;
            chainIdToLast24HourWindowStart[dstChainId_] = currentBlockTimestamp;
        } else {
            commandsSentInWindow += noOfCommands_;
        }

        // Revert if the amount exceeds the daily limit and the recipient is not whitelisted
        require(commandsSentInWindow <= maxDailyLimit, "Daily Transaction Limit Exceed");

        // Update the amount for the 24-hour window
        chainIdToLast24HourCommandsSent[dstChainId_] = commandsSentInWindow;
    }

    /// @notice Verify the commands receive in last 24 should not exceed limit
    /// @param srcChainId_  Source chain id
    /// @param noOfCommands_ number of commands currently received
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

        // Revert if the received amount exceeds the daily limit and the recipient is not whitelisted
        require(receivedInWindow <= maxDailyReceiveLimit, "Daily Transaction Limit Exceed");

        // Update the received amount for the 24-hour window
        chainIdToLast24HourCommandsReceived[srcChainId_] = receivedInWindow;
    }

    /// @dev Checks the caller is allowed to call the specified function
    function _ensureAllowed(string memory functionSig_) internal view {
        require(
            IAccessControlManagerV8(accessControlManager).isAllowedToCall(msg.sender, functionSig_),
            "access denied"
        );
    }
}
