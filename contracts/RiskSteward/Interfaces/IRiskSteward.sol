// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.25;

import { RiskParameterUpdate } from "./IRiskOracle.sol";
import { IRiskStewardReceiver } from "./IRiskStewardReceiver.sol";

/**
 * @title IRiskSteward
 * @author Venus
 * @notice Interface for risk stewards that validate and apply risk parameter updates
 */
interface IRiskSteward {
    /**
     * @notice Returns the safe delta threshold in basis points.
     * @return The safe delta threshold in basis points
     */
    function safeDeltaBps() external view returns (uint256);

    /**
     * @notice Returns the `IRiskStewardReceiver` associated with this steward.
     * @return The risk steward receiver contract
     */
    function RISK_STEWARD_RECEIVER() external view returns (IRiskStewardReceiver);

    /**
     * @notice Returns the canonical update type identifier for supply caps.
     * @return The `supplyCap` update type string
     */
    function SUPPLY_CAP() external view returns (string memory);

    /**
     * @notice Returns the canonical update type identifier for borrow caps.
     * @return The `borrowCap` update type string
     */
    function BORROW_CAP() external view returns (string memory);

    /**
     * @notice Initializes the steward with access control and initial safe delta.
     * @param accessControlManager_ The address of the access control manager
     * @param safeDeltaBps_ The initial safe delta threshold in basis points
     */
    function initialize(address accessControlManager_, uint256 safeDeltaBps_) external;

    /**
     * @notice Updates the safe delta threshold in basis points.
     * @param safeDeltaBps_ The new safe delta threshold in basis points
     */
    function setSafeDeltaBps(uint256 safeDeltaBps_) external;

    /**
     * @notice Checks whether a given update is within the configured safe delta.
     * @param update The risk parameter update to evaluate
     * @return True if the update is within the safe delta, otherwise false
     */
    function isWithinSafeDelta(RiskParameterUpdate calldata update) external view returns (bool);

    /**
     * @notice Processes and applies a validated risk parameter update.
     * @param update The risk parameter update to process
     */
    function processUpdate(RiskParameterUpdate calldata update) external;
}
