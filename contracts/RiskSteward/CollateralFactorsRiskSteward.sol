// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.25;

import { Strings } from "@openzeppelin/contracts/utils/Strings.sol";
import { RiskParameterUpdate } from "./Interfaces/IRiskOracle.sol";
import { IVToken } from "../interfaces/IVToken.sol";
import { ICorePoolComptroller } from "../interfaces/ICorePoolComptroller.sol";
import { IIsolatedPoolsComptroller } from "../interfaces/IIsolatedPoolsComptroller.sol";
import { IRiskStewardReceiver } from "./Interfaces/IRiskStewardReceiver.sol";
import { AccessControlledV8 } from "../Governance/AccessControlledV8.sol";
import { ensureNonzeroAddress } from "@venusprotocol/solidity-utilities/contracts/validators.sol";
import { IRiskSteward } from "./Interfaces/IRiskSteward.sol";

/**
 * @title CollateralFactorsRiskSteward
 * @author Venus
 * @notice Contract that can update collateral factors and liquidation thresholds received from `RiskStewardReceiver`.
 *         Expects the new value to be an encoded uint256 value of un-padded bytes.
 *         Uses a "safe delta" threshold similar to `MarketCapsRiskSteward`, where small changes require no timelock
 *         and larger changes are timelocked and validated by `RiskStewardReceiver`.
 * @custom:security-contact https://github.com/VenusProtocol/governance-contracts#discussion
 */
contract CollateralFactorsRiskSteward is IRiskSteward, AccessControlledV8 {
    /// @dev Max basis points i.e., 100%
    uint256 private constant MAX_BPS = 10000;

    /**
     * @notice The safe delta threshold in basis points. Updates within this delta are considered safe and
     *         can be executed without a timelock. Updates exceeding this delta require a timelock.
     */
    uint256 public safeDeltaBps;

    /**
     * @notice Address of the Core Pool Comptroller used to distinguish between core and isolated pools.
     */
    ICorePoolComptroller public immutable CORE_POOL_COMPTROLLER;

    /**
     * @notice Address of the `RiskStewardReceiver` used to validate and dispatch incoming updates.
     */
    IRiskStewardReceiver public immutable RISK_STEWARD_RECEIVER;

    /**
     * @notice The update type for collateral factor and liquidation threshold.
     *         Both parameters share the same setter on the comptroller.
     */
    string public constant COLLATERAL_FACTORS = "collateralFactors";

    /**
     * @notice The update type for liquidation incentive.
     */
    string public constant LIQUIDATION_INCENTIVE = "liquidationIncentive";

    /**
     * @dev Storage gap for upgradeability.
     */
    uint256[49] private __gap;

    /**
     * @notice Emitted when collateral factors are updated.
     * @dev Includes both collateral factor and liquidation threshold (updated together via the same setter).
     */
    event CollateralFactorsUpdated(
        address indexed market,
        uint256 indexed newCollateralFactor,
        uint256 indexed newLiquidationThreshold
    );

    /**
     * @notice Emitted when a liquidation incentive is updated.
     */
    event LiquidationIncentiveUpdated(address indexed market, uint256 indexed newValue);

    /**
     * @notice Emitted when the safe delta bps is updated.
     */
    event SafeDeltaBpsUpdated(uint256 indexed oldSafeDeltaBps, uint256 indexed newSafeDeltaBps);

    /**
     * @notice Thrown when a `safeDeltaBps` value is greater than `MAX_BPS`.
     */
    error InvalidSafeDeltaBps();

    /**
     * @notice Thrown when an update type that is not supported is operated on.
     */
    error UnsupportedUpdateType();

    /**
     * @notice Thrown when the update is not coming from the `RiskStewardReceiver`.
     */
    error OnlyRiskStewardReceiver();

    /**
     * @notice Thrown when trying to renounce ownership.
     */
    error RenounceOwnershipNotAllowed();

    /**
     * @notice Sets the immutable `CORE_POOL_COMPTROLLER` and `RISK_STEWARD_RECEIVER` addresses and disables initializers.
     * @param corePoolComptroller_ The address of the Core Pool Comptroller
     * @param riskStewardReceiver_ The address of the `RiskStewardReceiver`
     * @custom:error Throws ZeroAddressNotAllowed if any of the addresses are zero
     * @custom:oz-upgrades-unsafe-allow constructor
     */
    constructor(address corePoolComptroller_, address riskStewardReceiver_) {
        ensureNonzeroAddress(corePoolComptroller_);
        ensureNonzeroAddress(riskStewardReceiver_);

        CORE_POOL_COMPTROLLER = ICorePoolComptroller(corePoolComptroller_);
        RISK_STEWARD_RECEIVER = IRiskStewardReceiver(riskStewardReceiver_);

        _disableInitializers();
    }

    /**
     * @notice Initializes the contract as ownable and access controlled. Sets the safe delta bps initial value.
     * @param accessControlManager_ The address of the access control manager
     * @param safeDeltaBps_ The safe delta threshold in basis points (0 to MAX_BPS). Updates within this delta require no timelock.
     * @custom:error Throws InvalidSafeDeltaBps if the safe delta bps is greater than MAX_BPS
     */
    function initialize(address accessControlManager_, uint256 safeDeltaBps_) external initializer {
        __AccessControlled_init(accessControlManager_);
        if (safeDeltaBps_ > MAX_BPS) {
            revert InvalidSafeDeltaBps();
        }
        safeDeltaBps = safeDeltaBps_;
    }

    /**
     * @notice Sets the safe delta bps.
     * @param safeDeltaBps_ The new safe delta bps
     * @custom:event Emits SafeDeltaBpsUpdated with the old and new safe delta bps
     * @custom:error Throws InvalidSafeDeltaBps if the safe delta bps is greater than MAX_BPS
     * @custom:access Controlled by AccessControlManager
     */
    function setSafeDeltaBps(uint256 safeDeltaBps_) external {
        _checkAccessAllowed("setSafeDeltaBps(uint256)");
        if (safeDeltaBps_ > MAX_BPS) {
            revert InvalidSafeDeltaBps();
        }
        emit SafeDeltaBpsUpdated(safeDeltaBps, safeDeltaBps_);
        safeDeltaBps = safeDeltaBps_;
    }

    /**
     * @notice Checks if an update is within the safe delta threshold.
     * @param update The update to check.
     * @return isWithinSafeDelta_ True if the update is within the safe delta (no timelock needed), false if exceeds delta (timelock required)
     * @custom:error Throws UnsupportedUpdateType if the update type is not supported
     */
    function isWithinSafeDelta(RiskParameterUpdate calldata update) external view returns (bool isWithinSafeDelta_) {
        address comptroller = IVToken(update.market).comptroller();
        uint96 poolId = update.poolId;
        // eMode-style updates (poolId != 0) are always considered risky and require timelock
        if (poolId != 0) {
            return false;
        }

        if (Strings.equal(update.updateType, COLLATERAL_FACTORS)) {
            (uint256 newCollateralFactor, uint256 newLiquidationThreshold) = abi.decode(
                update.newValue,
                (uint256, uint256)
            );

            uint256 currentCollateralFactor;
            uint256 currentLiquidationThreshold;

            (currentCollateralFactor, currentLiquidationThreshold) = _getCurrentCollateralFactors(
                comptroller,
                update.market,
                poolId
            );

            // If current values are 0, always require timelock (not within safe delta)
            if (currentCollateralFactor == 0 || currentLiquidationThreshold == 0) {
                return false;
            }

            // Both CF and LT must be within their respective safe deltas
            return
                _isWithinSafeDelta(newCollateralFactor, currentCollateralFactor) &&
                _isWithinSafeDelta(newLiquidationThreshold, currentLiquidationThreshold);
        } else if (Strings.equal(update.updateType, LIQUIDATION_INCENTIVE)) {
            (uint256 newLiquidationIncentive) = abi.decode(update.newValue, (uint256));
            uint256 currentLiquidationIncentive = _getCurrentLiquidationIncentive(comptroller, update.market, poolId);

            // If current value is 0, always require timelock (not within safe delta)
            if (currentLiquidationIncentive == 0) {
                return false;
            }

            return _isWithinSafeDelta(newLiquidationIncentive, currentLiquidationIncentive);
        } else {
            revert UnsupportedUpdateType();
        }
    }

    /**
     * @notice Processes a collateral parameter update from the `RiskStewardReceiver`.
     *         Delta validation and timelock checks are already performed by `RiskStewardReceiver` before execution.
     * @param update RiskParameterUpdate update to process
     * @custom:error Throws OnlyRiskStewardReceiver if the sender is not the `RiskStewardReceiver`
     * @custom:error Throws UnsupportedUpdateType if the update type is not supported
     * @custom:event Emits CollateralFactorsUpdated or LiquidationIncentiveUpdated
     * @custom:access Only callable by the `RiskStewardReceiver`
     */
    function processUpdate(RiskParameterUpdate calldata update) external {
        if (msg.sender != address(RISK_STEWARD_RECEIVER)) {
            revert OnlyRiskStewardReceiver();
        }

        address comptroller = IVToken(update.market).comptroller();
        uint96 poolId = update.poolId;

        if (Strings.equal(update.updateType, COLLATERAL_FACTORS)) {
            _updateCollateralParams(comptroller, update.market, poolId, update.newValue);
        } else if (Strings.equal(update.updateType, LIQUIDATION_INCENTIVE)) {
            _updateLiquidationIncentive(comptroller, update.market, poolId, update.newValue);
        } else {
            revert UnsupportedUpdateType();
        }
    }

    /**
     * @notice Updates the collateral factors for the given market.
     * @param comptroller The comptroller address
     * @param market The market to update the collateral factors for
     * @param poolId The pool identifier for eMode updates (0 for regular market updates)
     * @param newValue Encoded new collateral factors: `abi.encode(uint256 newCollateralFactor, uint256 newLiquidationThreshold)`
     * @custom:event Emits CollateralFactorsUpdated
     * @dev Updates both collateral factor and liquidation threshold together (same setter).
     */
    function _updateCollateralParams(
        address comptroller,
        address market,
        uint96 poolId,
        bytes memory newValue
    ) internal {
        (uint256 newCollateralFactor, uint256 newLiquidationThreshold) = abi.decode(newValue, (uint256, uint256));

        if (comptroller == address(CORE_POOL_COMPTROLLER)) {
            ICorePoolComptroller(comptroller).setCollateralFactor(
                poolId,
                market,
                newCollateralFactor,
                newLiquidationThreshold
            );
        } else {
            if (poolId != 0) {
                revert UnsupportedUpdateType();
            }
            IIsolatedPoolsComptroller(comptroller).setCollateralFactor(
                market,
                newCollateralFactor,
                newLiquidationThreshold
            );
        }

        emit CollateralFactorsUpdated(market, newCollateralFactor, newLiquidationThreshold);
    }

    /**
     * @notice Updates the liquidation incentive for the given market.
     * @param comptroller The comptroller address
     * @param market The market to update the liquidation incentive for
     * @param poolId The pool identifier for eMode updates (0 for regular market updates)
     * @param newValue Encoded new liquidation incentive: `abi.encode(uint256 newLiquidationIncentive)`
     * @custom:event Emits LiquidationIncentiveUpdated
     */
    function _updateLiquidationIncentive(
        address comptroller,
        address market,
        uint96 poolId,
        bytes memory newValue
    ) internal {
        (uint256 newLiquidationIncentive) = abi.decode(newValue, (uint256));
        if (comptroller == address(CORE_POOL_COMPTROLLER)) {
            ICorePoolComptroller(comptroller).setLiquidationIncentive(poolId, market, newLiquidationIncentive);
        } else {
            if (poolId != 0) {
                revert UnsupportedUpdateType();
            }
            // Isolated pools: liquidation incentive is global (not per-market).
            IIsolatedPoolsComptroller(comptroller).setLiquidationIncentive(newLiquidationIncentive);
        }

        emit LiquidationIncentiveUpdated(market, newLiquidationIncentive);
    }

    /**
     * @notice Returns the current collateral factors for a market on a given comptroller.
     * @param comptroller The comptroller address
     * @param market The market whose collateral factors are being queried
     * @param poolId The pool identifier for eMode updates (0 for regular market updates)
     * @return currentCollateralFactor The current collateral factor
     * @return currentLiquidationThreshold The current liquidation threshold
     * @dev Returns both collateral factor and liquidation threshold (updated together via the same setter).
     *      For core pool, uses eMode-specific getter which handles poolId == 0 as regular market.
     */
    function _getCurrentCollateralFactors(
        address comptroller,
        address market,
        uint96 poolId
    ) internal view returns (uint256 currentCollateralFactor, uint256 currentLiquidationThreshold) {
        if (comptroller == address(CORE_POOL_COMPTROLLER)) {
            (, currentCollateralFactor, , currentLiquidationThreshold, , , ) = ICorePoolComptroller(comptroller)
                .poolMarkets(poolId, market);
        } else {
            // Isolated pools: eMode not supported
            if (poolId != 0) {
                revert UnsupportedUpdateType();
            }
            (, currentCollateralFactor, currentLiquidationThreshold) = IIsolatedPoolsComptroller(comptroller).markets(
                market
            );
        }
    }

    /**
     * @notice Returns the current liquidation incentive for a given comptroller.
     * @dev
     *  - Core pool: uses eMode-specific getter which handles poolId == 0 as regular market.
     *  - Isolated pools: liquidation incentive is global, read from `liquidationIncentiveMantissa()`.
     * @param comptroller The comptroller address
     * @param market The market used for core pool context (ignored for isolated pools)
     * @param poolId The pool identifier for eMode updates (0 for regular market updates)
     * @return currentLiquidationIncentive The current liquidation incentive mantissa
     */
    function _getCurrentLiquidationIncentive(
        address comptroller,
        address market,
        uint96 poolId
    ) internal view returns (uint256 currentLiquidationIncentive) {
        if (comptroller == address(CORE_POOL_COMPTROLLER)) {
            (, , , , currentLiquidationIncentive, , ) = ICorePoolComptroller(comptroller).poolMarkets(poolId, market);
        } else {
            if (poolId != 0) {
                revert UnsupportedUpdateType();
            }
            // Isolated pools: No per market LI
            currentLiquidationIncentive = IIsolatedPoolsComptroller(comptroller).liquidationIncentiveMantissa();
        }
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

    /**
     * @notice Disables `renounceOwnership` function.
     * @custom:error Throws RenounceOwnershipNotAllowed
     */
    function renounceOwnership() public override {
        revert RenounceOwnershipNotAllowed();
    }
}
