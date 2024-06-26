// SPDX-License-Identifier: BSD-3-Clause

pragma solidity 0.8.25;

import { Pausable } from "@openzeppelin/contracts/security/Pausable.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ensureNonzeroAddress } from "@venusprotocol/solidity-utilities/contracts/validators.sol";
import { IAccessControlManagerV8 } from "./../Governance/IAccessControlManagerV8.sol";

/**
 * @title BaseOmnichainControllerSrc
 * @dev This contract is the base for the Omnichain controller source contracts.
 * It provides functionality related to daily command limits and pausability.
 * @custom:security-contact https://github.com/VenusProtocol/governance-contracts#discussion
 */

contract BaseOmnichainControllerSrc is Ownable, Pausable {
    /**
     * @notice ACM (Access Control Manager) contract address
     */
    address public accessControlManager;

    /**
     * @notice Maximum daily limit for commands from the local chain
     */
    mapping(uint16 => uint256) public chainIdToMaxDailyLimit;

    /**
     * @notice Total commands transferred within the last 24-hour window from the local chain
     */
    mapping(uint16 => uint256) public chainIdToLast24HourCommandsSent;

    /**
     * @notice Timestamp when the last 24-hour window started from the local chain
     */
    mapping(uint16 => uint256) public chainIdToLast24HourWindowStart;
    /**
     * @notice Timestamp when the last proposal sent from the local chain to dest chain
     */
    mapping(uint16 => uint256) public chainIdToLastProposalSentTimestamp;

    /**
     * @notice Emitted when the maximum daily limit of commands from the local chain is modified
     */
    event SetMaxDailyLimit(uint16 indexed chainId, uint256 oldMaxLimit, uint256 newMaxLimit);
    /*
     * @notice Emitted when the address of ACM is updated
     */
    event NewAccessControlManager(address indexed oldAccessControlManager, address indexed newAccessControlManager);

    constructor(address accessControlManager_) {
        ensureNonzeroAddress(accessControlManager_);
        accessControlManager = accessControlManager_;
    }

    /**
     * @notice Sets the limit of daily (24 Hour) command amount
     * @param chainId_ Destination chain id
     * @param limit_ Number of commands
     * @custom:access Controlled by AccessControlManager
     * @custom:event Emits SetMaxDailyLimit with old and new limit and its corresponding chain id
     */
    function setMaxDailyLimit(uint16 chainId_, uint256 limit_) external {
        _ensureAllowed("setMaxDailyLimit(uint16,uint256)");
        emit SetMaxDailyLimit(chainId_, chainIdToMaxDailyLimit[chainId_], limit_);
        chainIdToMaxDailyLimit[chainId_] = limit_;
    }

    /**
     * @notice Triggers the paused state of the controller
     * @custom:access Controlled by AccessControlManager
     */
    function pause() external {
        _ensureAllowed("pause()");
        _pause();
    }

    /**
     * @notice Triggers the resume state of the controller
     * @custom:access Controlled by AccessControlManager
     */
    function unpause() external {
        _ensureAllowed("unpause()");
        _unpause();
    }

    /**
     * @notice Sets the address of Access Control Manager (ACM)
     * @param accessControlManager_ The new address of the Access Control Manager
     * @custom:access Only owner
     * @custom:event Emits NewAccessControlManager with old and new access control manager addresses
     */
    function setAccessControlManager(address accessControlManager_) external onlyOwner {
        ensureNonzeroAddress(accessControlManager_);
        emit NewAccessControlManager(accessControlManager, accessControlManager_);
        accessControlManager = accessControlManager_;
    }

    /**
     * @notice Empty implementation of renounce ownership to avoid any mishap
     */
    function renounceOwnership() public override {}

    /**
     * @notice Check eligibility to send commands
     * @param dstChainId_ Destination chain id
     * @param noOfCommands_ Number of commands to send
     */
    function _isEligibleToSend(uint16 dstChainId_, uint256 noOfCommands_) internal {
        // Load values for the 24-hour window checks
        uint256 currentBlockTimestamp = block.timestamp;
        uint256 lastDayWindowStart = chainIdToLast24HourWindowStart[dstChainId_];
        uint256 commandsSentInWindow = chainIdToLast24HourCommandsSent[dstChainId_];
        uint256 maxDailyLimit = chainIdToMaxDailyLimit[dstChainId_];
        uint256 lastProposalSentTimestamp = chainIdToLastProposalSentTimestamp[dstChainId_];

        // Check if the time window has changed (more than 24 hours have passed)
        if (currentBlockTimestamp - lastDayWindowStart > 1 days) {
            commandsSentInWindow = noOfCommands_;
            chainIdToLast24HourWindowStart[dstChainId_] = currentBlockTimestamp;
        } else {
            commandsSentInWindow += noOfCommands_;
        }

        // Revert if the amount exceeds the daily limit
        require(commandsSentInWindow <= maxDailyLimit, "Daily Transaction Limit Exceeded");
        // Revert if the last proposal is already sent in current block i.e multiple proposals cannot be sent within the same block.timestamp
        require(lastProposalSentTimestamp != currentBlockTimestamp, "Multiple bridging in a proposal");

        // Update the amount for the 24-hour window
        chainIdToLast24HourCommandsSent[dstChainId_] = commandsSentInWindow;
        // Update the last sent proposal timestamp
        chainIdToLastProposalSentTimestamp[dstChainId_] = currentBlockTimestamp;
    }

    /**
     * @notice Ensure that the caller has permission to execute a specific function
     * @param functionSig_ Function signature to be checked for permission
     */
    function _ensureAllowed(string memory functionSig_) internal view {
        require(
            IAccessControlManagerV8(accessControlManager).isAllowedToCall(msg.sender, functionSig_),
            "access denied"
        );
    }
}
