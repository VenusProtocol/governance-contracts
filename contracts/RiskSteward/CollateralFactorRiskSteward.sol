// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.25;

import { Strings } from "@openzeppelin/contracts/utils/Strings.sol";
import { IVToken } from "../interfaces/IVToken.sol";
import { ICorePoolComptroller } from "../interfaces/ICorePoolComptroller.sol";
import { IIsolatedPoolsComptroller } from "../interfaces/IIsolatedPoolsComptroller.sol";
import { CriticalParamRiskStewardBase } from "./CriticalParamRiskStewardBase.sol";

/**
 * @title CollateralFactorRiskSteward
 * @author Venus
 * @notice Contract that can update collateralFactor and liquidationThreshold received from RiskStewardReceiver. Requires that the update is within the max delta.
 * Expects the new value to be an encoded uint256 value of un padded bytes.
 * @custom:security-contact https://github.com/VenusProtocol/governance-contracts#discussion
 */
contract CollateralFactorRiskSteward is CriticalParamRiskStewardBase {
    /**
     * @notice The update type for collateralFactor
     */
    string public constant COLLATERAL_FACTOR = "collateralFactor";

    /**
     * @notice The update type for liquidation threshold
     */
    string public constant LIQUIDATION_THRESHOLD = "liquidationThreshold";

    /**
     * @notice Emitted when a collateralFactor is updated
     */
    event CollateralFactorUpdated(address indexed market, uint256 indexed newValue);

    /**
     * @notice Emitted when a liquidationThreshold is updated
     */
    event LiquidationThresholdUpdated(address indexed market, uint256 indexed newValue);

    /**
     * @dev Sets the immutable CorePoolComptroller and RiskStewardReceiver addresses and disables initializers
     * @param corePoolComptroller_ The address of the corePoolComptroller
     * @custom:error Throws ZeroAddressNotAllowed if the CorePoolComptroller or RiskStewardReceiver addresses are zero
     * @custom:oz-upgrades-unsafe-allow constructor
     */
    constructor(address corePoolComptroller_) CriticalParamRiskStewardBase(corePoolComptroller_) {}

    /**
     * @dev Initializes the contract as ownable, access controlled, and pausable. Sets the max delta bps initial value.
     * @param accessControlManager_ The address of the access control manager
     * @param riskStewardReceiver_ The address of the RiskStewardReceiver
     * @param maxDeltaBps_ The max detla bps
     * @param debouncePeriod_ The debounce period
     * @custom:error Throws InvalidMaxDeltaBps if the max delta bps is 0 or greater than MAX_BPS
     */
    function initialize(
        address accessControlManager_,
        address riskStewardReceiver_,
        uint256 maxDeltaBps_,
        uint256 debouncePeriod_
    ) external initializer {
        __CriticalParamRiskStewardBase_init(accessControlManager_, riskStewardReceiver_, maxDeltaBps_, debouncePeriod_);
    }

    /**
     * @notice Processes a market cap update from the RiskStewardReceiver.
     * Validates that the update is within range and then directly update the market collateralFactor or liquidationThreshold on the market's comptroller.
     * @param updateId The ID of the update
     * @param newValue The newCollateralFactor or newLiquidationThreshold value
     * @param updateType The type of update
     * @param market The market to update the newValue for
     * @custom:error UnsupportedUpdateType Thrown if the update type is not supported
     * @custom:error UpdateNotInRange Thrown if the update is not within the allowed range
     * @custom:event Emits CollateralFactorUpdated or LiquidationThresholdUpdated depending on the update with the market and new cap
     * @custom:access Controlled by AccessControlManager
     */
    function processUpdate(uint256 updateId, bytes memory newValue, string memory updateType, address market) external {
        _checkAccessAllowed("processUpdate(uint256,bytes,string,address)");
        if (processedUpdates[updateId]) {
            revert UpdateAlreadyProcessed(updateId);
        }
        processedUpdates[updateId] = true;
        if (Strings.equal(updateType, COLLATERAL_FACTOR)) {
            _processCollateralFactorUpdate(updateId, newValue, updateType, market);
        } else if (Strings.equal(updateType, LIQUIDATION_THRESHOLD)) {
            _processLiquidationThresholdUpdate(updateId, newValue, updateType, market);
        } else {
            revert UnsupportedUpdateType(updateId);
        }
    }

    /**
     * @notice Public view function to validate if a proposed collatertalFactor and reserveFactor update is within the allowed range and debounce period has been passed
     * @param updateId The ID of the update
     * @param newValue The new value for collateralFactor or LiquidationThreshold
     * @param updateType The type of update
     * @param market The market to update the new value for
     * @return isValid True if the update would succeed, false if it would revert
     */
    function validateUpdate(
        uint256 updateId,
        bytes memory newValue,
        string memory updateType,
        address market
    ) external view returns (bool isValid) {
        uint256 newThreshold = _decodeBytesToUint256(newValue);
        address comptroller = IVToken(market).comptroller();

        try this.validateUpdateByType(comptroller, market, updateId, newThreshold, updateType) {
            return true;
        } catch {
            return false;
        }
    }

    /**
     * @notice Checks that the new collatertalFactor or liquidationThreshold is within the allowed range of the current values and debounce period has been passed
     * @param comptroller The comptroller of the market
     * @param market The market whose new value is being updated
     * @param updateId The ID of the update
     * @param newThreshold The new value to validate
     * @custom:error UpdateTooFrequent if the update is too frequent
     * @custom:error UpdateNotInRange if the update is not within the allowed range
     */
    function validateUpdateByType(
        address comptroller,
        address market,
        uint256 updateId,
        uint256 newThreshold,
        string memory updateType
    ) public view {
        if (Strings.equal(updateType, COLLATERAL_FACTOR)) {
            _validateCollateralFactorUpdate(comptroller, market, updateId, newThreshold);
        } else if (Strings.equal(updateType, LIQUIDATION_THRESHOLD)) {
            _validateLiquidationThresholdUpdate(comptroller, market, updateId, newThreshold);
        } else {
            revert UnsupportedUpdateType(updateId);
        }
    }

    /**
     * @notice Validates the new collateralFactor and if valid, updates the collateralFactor for the given market.
     * @param updateId The ID of the update
     * @param newValue The new collateralFactor value
     * @param updateType The type of update
     * @param market The market to update the collateralFactor for
     * @custom:event Emits ParameterUpdated event
     * @custom:error UpdateNotInRange if the update is not within the allowed range
     */
    function _processCollateralFactorUpdate(
        uint256 updateId,
        bytes memory newValue,
        string memory updateType,
        address market
    ) internal {
        uint256 newFactor = _decodeBytesToUint256(newValue);
        address comptroller = IVToken(market).comptroller();
        _validateCollateralFactorUpdate(comptroller, market, updateId, newFactor);
        _updateCollateralFactor(comptroller, market, newFactor);
        lastProcessedTime[_getMarketUpdateTypeKey(market, updateType)] = block.timestamp;
    }

    /**
     * @notice Validates the new liquidationThreshold and if valid, updates the liquidationThreshold for the given market.
     * @param updateId The ID of the update
     * @param newValue The new liquidationThreshold value
     * @param updateType The type of update
     * @param market The market to update the liquidationThreshold for
     * @custom:event Emits ParameterUpdated event
     * @custom:error UpdateNotInRange if the update is not within the allowed range
     */
    function _processLiquidationThresholdUpdate(
        uint256 updateId,
        bytes memory newValue,
        string memory updateType,
        address market
    ) internal {
        uint256 newThreshold = _decodeBytesToUint256(newValue);
        address comptroller = IVToken(market).comptroller();
        _validateLiquidationThresholdUpdate(comptroller, market, updateId, newThreshold);
        _updateLiquidationThreshold(comptroller, market, newThreshold);
        lastProcessedTime[_getMarketUpdateTypeKey(market, updateType)] = block.timestamp;
    }

    /**
     * @notice Updates the collateralFactor for the given market.
     * @param comptroller The comptroller address
     * @param market The market to update the collateralFactor for
     * @param newValue The new collateralFactor value
     * @custom:event Emits ParameterUpdated with the updateType, market and new collateralFactor
     */
    function _updateCollateralFactor(address comptroller, address market, uint256 newValue) internal {
        if (comptroller == address(CORE_POOL_COMPTROLLER)) {
            ICorePoolComptroller(comptroller)._setCollateralFactor(market, newValue);
        } else {
            (, , uint256 liquidationThreshold) = IIsolatedPoolsComptroller(comptroller).markets(market);
            IIsolatedPoolsComptroller(comptroller).setCollateralFactor(market, newValue, liquidationThreshold);
        }
        emit CollateralFactorUpdated(market, newValue);
    }

    /**
     * @notice Updates the liquidationThreshold for the given market.
     * @param comptroller The comptroller address
     * @param market The market to update the liquidationThreshold for
     * @param newValue The new liquidationThreshold value
     * @custom:event Emits ParameterUpdated with the updateType, market and new liquidationThreshold
     */
    function _updateLiquidationThreshold(address comptroller, address market, uint256 newValue) internal {
        (, uint256 currentCollateralFactor, ) = IIsolatedPoolsComptroller(comptroller).markets(market);
        IIsolatedPoolsComptroller(comptroller).setCollateralFactor(market, currentCollateralFactor, newValue);

        emit LiquidationThresholdUpdated(market, newValue);
    }

    /**
     * @notice Checks that the new CollateralFactor is within the allowed range of the current CollateralFactor.
     * @param comptroller The comptroller of the market
     * @param market The market whose CollateralFactor is being updated
     * @param updateId The ID of the update
     * @param newFactor The new CollateralFactor value to validate
     * @custom:error UpdateNotInRange if the update is not within the allowed range
     */
    function _validateCollateralFactorUpdate(
        address comptroller,
        address market,
        uint256 updateId,
        uint256 newFactor
    ) internal view {
        uint256 currentCollateralFactor;
        if (comptroller == address(CORE_POOL_COMPTROLLER)) {
            (, currentCollateralFactor, ) = ICorePoolComptroller(comptroller).markets(market);
        } else {
            (, currentCollateralFactor, ) = IIsolatedPoolsComptroller(comptroller).markets(market);
        }
        _verifyUpdate(market, updateId, COLLATERAL_FACTOR, currentCollateralFactor, newFactor);
    }

    /**
     * @notice Checks that the new LiquidationThreshold is within the allowed range of the current LiquidationThreshold.
     * @param comptroller The comptroller of the market
     * @param market The market whose LiquidationThreshold is being updated
     * @param updateId The ID of the update
     * @param newThreshold The new LiquidationThreshold value to validate
     * @custom:error UpdateNotInRange if the update is not within the allowed range
     */
    function _validateLiquidationThresholdUpdate(
        address comptroller,
        address market,
        uint256 updateId,
        uint256 newThreshold
    ) internal view {
        uint256 currentLiquidationThreshold;

        // Liquidation Threshold is not present in core pool
        if (comptroller == address(CORE_POOL_COMPTROLLER)) {
            revert UnsupportedUpdateType(updateId);
        } else {
            (, , currentLiquidationThreshold) = IIsolatedPoolsComptroller(comptroller).markets(market);
        }
        _verifyUpdate(market, updateId, LIQUIDATION_THRESHOLD, currentLiquidationThreshold, newThreshold);
    }
}
