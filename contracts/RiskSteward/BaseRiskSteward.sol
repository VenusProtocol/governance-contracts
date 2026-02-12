// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.25;

import { AccessControlledV8 } from "../Governance/AccessControlledV8.sol";
import { IRiskSteward } from "./Interfaces/IRiskSteward.sol";

/**
 * @title BaseRiskSteward
 * @author Venus
 * @notice Abstract base contract for Risk Steward contracts providing common functionality
 * @custom:security-contact https://github.com/VenusProtocol/governance-contracts#discussion
 */
abstract contract BaseRiskSteward is IRiskSteward, AccessControlledV8 {
    /// @dev Max basis points i.e., 100%
    uint256 internal constant MAX_BPS = 10000;

    /**
     * @notice The safe delta threshold in basis points.
     * @notice Updates within this delta are considered safe and require no timelock. Updates exceeding this delta require timelock.
     * @dev This is only used by contracts that implement safe delta checks (e.g., MarketCapsRiskSteward, CollateralFactorsRiskSteward)
     */
    uint256 public safeDeltaBps;

    /**
     * @notice Thrown when trying to renounce ownership
     */
    error RenounceOwnershipNotAllowed();

    /**
     * @notice Disables renounceOwnership function
     * @custom:error Throws RenounceOwnershipNotAllowed
     */
    function renounceOwnership() public pure override {
        revert RenounceOwnershipNotAllowed();
    }

    /**
     * @notice Checks if the difference between new and current values is within the safe delta threshold.
     * @param newValue The new value to check
     * @param currentValue The current value to compare against
     * @return True if the difference is within the safe delta, false otherwise
     */
    function _isWithinSafeDelta(uint256 newValue, uint256 currentValue) internal view returns (bool) {
        uint256 diff = newValue > currentValue ? newValue - currentValue : currentValue - newValue;
        uint256 maxDiff = (safeDeltaBps * currentValue) / MAX_BPS;
        return diff <= maxDiff;
    }
}
