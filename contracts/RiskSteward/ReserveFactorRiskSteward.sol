// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.25;

import { Strings } from "@openzeppelin/contracts/utils/Strings.sol";
import { IVToken } from "../interfaces/IVToken.sol";
import { ILVToken } from "../interfaces/ILVToken.sol";
import { CriticalParamRiskStewardBase } from "./CriticalParamRiskStewardBase.sol";

/**
 * @title ReserveFactorRiskSteward
 * @author Venus
 * @notice Contract that can update reserveFactor received from RiskStewardReceiver. Requires that the update is within the max delta.
 * Expects the new value to be an encoded uint256 value of un padded bytes.
 * @custom:security-contact https://github.com/VenusProtocol/governance-contracts#discussion
 */
contract ReserveFactorRiskSteward is CriticalParamRiskStewardBase {
    /**
     * @notice The update type for reserveFactor
     */
    string public constant RESERVE_FACTOR = "reserveFactor";

    /**
     * @notice Emitted when a reserveFactor is updated
     */
    event ReserveFactorUpdated(address indexed market, uint256 indexed newReserveFactor);

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
     * @notice Processes a reserveFactor update from the RiskStewardReceiver.
     * Validates that the update is within range and then directly update the market reserveFactor on the market's vToken.
     * @param updateId The ID of the update
     * @param newValue The new ReserveFactor value
     * @param updateType The type of update
     * @param market The market to update the reserveFactor for
     * @custom:error UnsupportedUpdateType Thrown if the update type is not supported
     * @custom:error UpdateNotInRange Thrown if the update is not within the allowed range
     * @custom:event Emits reserveFactorUpdated with the market and newFactor
     * @custom:access Controlled by AccessControlManager
     */
    function processUpdate(uint256 updateId, bytes memory newValue, string memory updateType, address market) external {
        _checkAccessAllowed("processUpdate(uint256,bytes,string,address)");
        if (processedUpdates[updateId]) {
            revert UpdateAlreadyProcessed(updateId);
        }
        processedUpdates[updateId] = true;
        if (Strings.equal(updateType, RESERVE_FACTOR)) {
            _processReserveFactorUpdate(updateId, newValue, updateType, market);
        } else {
            revert UnsupportedUpdateType(updateId);
        }
    }

    /**
     * @notice Public view function to validate if a proposed ReserveFactor update is within the allowed range and debounce period has been passed.
     * @param updateId The ID of the update
     * @param newValue The new ReserveFactor value
     * @param market The market to update the ReserveFactor for
     * @return isValid True if the update would succeed, false if it would revert
     */
    function validateUpdate(
        uint256 updateId,
        bytes memory newValue,
        string memory,
        address market
    ) external view returns (bool isValid) {
        uint256 newReserveFactor = _decodeBytesToUint256(newValue);

        try this.validateReserveFactorUpdate(market, updateId, newReserveFactor) {
            return true;
        } catch {
            return false;
        }
    }

    /**
     * @notice Checks that the new ReserveFactor is within the allowed range of the current ReserveFactor and has passed the debounce period
     * @param market The market whose ReserveFactor is being updated
     * @param updateId The ID of the update
     * @param newReserveFactor The new ReserveFactor value to validate
     * @custom:error UpdateTooFrequent if the update is too frequent
     * @custom:error UpdateNotInRange if the update is not within the allowed range
     */
    function validateReserveFactorUpdate(address market, uint256 updateId, uint256 newReserveFactor) public view {
        uint256 currentReserveFactor = IVToken(market).reserveFactorMantissa();
        _verifyUpdate(market, updateId, RESERVE_FACTOR, currentReserveFactor, newReserveFactor);
    }

    /**
     * @notice Validates the new reserveFactor and if valid, updates it for the given market.
     * @param updateId The ID of the update
     * @param newValue The new reserveFactor value
     * @param updateType The type of update
     * @param market The market to update the reserveFactor for
     * @custom:event Emits ReserveFactorUpdated with the market and new reserveFactor
     * @custom:error UpdateNotInRange if the update is not within the allowed range
     */
    function _processReserveFactorUpdate(
        uint256 updateId,
        bytes memory newValue,
        string memory updateType,
        address market
    ) internal {
        uint256 newReserveFactor = _decodeBytesToUint256(newValue);
        address comptroller = IVToken(market).comptroller();
        validateReserveFactorUpdate(market, updateId, newReserveFactor);
        _updateReserveFactor(comptroller, market, newReserveFactor);
        lastProcessedTime[_getMarketUpdateTypeKey(market, updateType)] = block.timestamp;
    }

    /**
     * @notice Updates the ReserveFactor for the given market.
     * @param comptroller The comptroller to update the ReserveFactor for
     * @param market The market to update the ReserveFactor for
     * @param newValue The new reserveFactor value
     * @custom:event Emits ReserveFactorUpdated with the market and new ReserveFactor
     */
    function _updateReserveFactor(address comptroller, address market, uint256 newValue) internal {
        if (comptroller == address(CORE_POOL_COMPTROLLER)) {
            IVToken(market)._setReserveFactor(newValue);
        } else {
            ILVToken(market).setReserveFactor(newValue);
        }
        emit ReserveFactorUpdated(market, newValue);
    }
}
