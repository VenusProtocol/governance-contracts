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
     * @notice Returns the `IRiskStewardReceiver` associated with this steward.
     * @return The risk steward receiver contract
     */
    function RISK_STEWARD_RECEIVER() external view returns (IRiskStewardReceiver);

    /**
     * @notice Checks whether an update is safe for direct execution (no timelock required).
     * @param update The risk parameter update to evaluate
     * @return True if update is safe for direct execution, false if timelock is required
     */
    function isSafeForDirectExecution(RiskParameterUpdate calldata update) external view returns (bool);

    /**
     * @notice Applies a validated risk parameter update.
     * @param update The risk parameter update to apply
     */
    function applyUpdate(RiskParameterUpdate calldata update) external;
}
