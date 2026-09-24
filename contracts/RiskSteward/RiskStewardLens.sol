// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.25;

import { ensureNonzeroAddress } from "@venusprotocol/solidity-utilities/contracts/validators.sol";
import { IRiskOracle, RiskParameterUpdate } from "./Interfaces/IRiskOracle.sol";
import { IRiskSteward } from "./Interfaces/IRiskSteward.sol";
import { IRiskStewardReceiver } from "./Interfaces/IRiskStewardReceiver.sol";
import { RiskStewardReceiver } from "./RiskStewardReceiver.sol";
import { ICorePoolComptroller } from "../interfaces/ICorePoolComptroller.sol";
import { ICorePoolVToken } from "../interfaces/ICorePoolVToken.sol";
import { IIsolatedPoolsComptroller } from "../interfaces/IIsolatedPoolsComptroller.sol";

/**
 * @title RiskStewardLens
 * @author Venus
 * @notice Shows the current and proposed values of a risk update, plus when it can take effect.
 * @dev Uses the steward and receiver for execution checks, but mirrors some receiver rules to preview unprocessed
 *      updates. Keep those rules in sync with the receiver. `previewUpdate` does not validate oracle publication.
 * @custom:security-contact https://github.com/VenusProtocol/governance-contracts#discussion
 */
contract RiskStewardLens {
    /**
     * @notice Identity, values, and execution state of a risk update.
     * @param updateId Oracle ID, or the next expected ID for a preview
     * @param updateType Parameter name, such as `supplyCap`
     * @param market Target market
     * @param status Receiver status; `None` means the update has not been processed
     * @param isRemote Whether this chain forwards the update to another chain
     * @param isPaused Whether the receiver is paused; this blocks processing, not execution of pending updates
     * @param isConfigActive Whether the update type is enabled on the receiver
     * @param executableNow Whether processing would apply an unprocessed update now, or a pending update can execute
     *        now. Always false for remote updates. Caller permissions are not checked
     * @param unlockTime Unlock time stored for a processed update, or the time processing would set now. For remote
     *        updates, this is the send time on this chain, before the destination's delay
     * @param expiresAt Last time the next step accepts the update. Before processing, this is publication plus expiry
     *        period minus timelock. Once pending or sent, it is publication plus expiry period. Zero when resolved or
     *        replaced. Debounce or another pending update may block processing until after this time
     * @param debounceEndsAt When the last execution's debounce ends; zero if none. Only applies before local processing
     * @param blockingUpdateId Pending, unexpired update for this market and type; zero if none. Only applies before
     *        local processing
     * @param replacedByUpdateId Newer oracle update for this market and type; zero if none or already processed
     * @param currentValues Current market values; empty for remote or unknown update types
     * @param proposedValues Decoded values: `[cap]`, `[collateralFactor, liquidationThreshold]`, or
     *        `[uint160(interestRateModel)]`. Empty for unknown types or an unexpected value length
     * @param canProcessNow Whether an unprocessed update passes the receiver's processing checks now. False after
     *        processing; does not check whether publication or a remote send will succeed
     */
    struct UpdateDetails {
        uint256 updateId;
        string updateType;
        address market;
        IRiskStewardReceiver.UpdateStatus status;
        bool isRemote;
        bool isPaused;
        bool isConfigActive;
        bool executableNow;
        uint256 unlockTime;
        uint256 expiresAt;
        uint256 debounceEndsAt;
        uint256 blockingUpdateId;
        uint256 replacedByUpdateId;
        uint256[] currentValues;
        uint256[] proposedValues;
        bool canProcessNow;
    }

    bytes32 internal constant SUPPLY_CAP_KEY = keccak256("supplyCap");
    bytes32 internal constant BORROW_CAP_KEY = keccak256("borrowCap");
    bytes32 internal constant COLLATERAL_FACTORS_KEY = keccak256("collateralFactors");
    bytes32 internal constant INTEREST_RATE_MODEL_KEY = keccak256("interestRateModel");

    /// @notice Receiver queried by this lens.
    RiskStewardReceiver public immutable RISK_STEWARD_RECEIVER;

    /// @notice Oracle used by the receiver.
    IRiskOracle public immutable RISK_ORACLE;

    /// @notice Core pool comptroller, whose market data differs from isolated pools.
    address public immutable CORE_POOL_COMPTROLLER;

    /**
     * @param riskStewardReceiver_ Receiver to query
     * @param corePoolComptroller_ Core pool comptroller on this chain
     * @custom:error ZeroAddressNotAllowed if either address is zero
     */
    constructor(RiskStewardReceiver riskStewardReceiver_, address corePoolComptroller_) {
        ensureNonzeroAddress(address(riskStewardReceiver_));
        ensureNonzeroAddress(corePoolComptroller_);

        RISK_STEWARD_RECEIVER = riskStewardReceiver_;
        RISK_ORACLE = riskStewardReceiver_.RISK_ORACLE();
        CORE_POOL_COMPTROLLER = corePoolComptroller_;
    }

    /**
     * @notice Gets a published update's current values and execution state.
     * @param updateId Oracle update ID
     * @return details The update details
     * @custom:error InvalidUpdateId if the oracle has no update with this ID
     * @custom:error May forward a steward error for an unprocessed update, or PoolDoesNotExist for an unknown eMode pool
     */
    function getUpdateDetails(uint256 updateId) external view returns (UpdateDetails memory details) {
        RiskParameterUpdate memory update = RISK_ORACLE.getUpdateById(updateId);
        (, uint256 registeredUnlockTime, IRiskStewardReceiver.UpdateStatus status, , ) = RISK_STEWARD_RECEIVER.updates(
            updateId
        );

        details = _buildDetails(update);
        details.status = status;
        details.executableNow = RISK_STEWARD_RECEIVER.isUpdateExecutable(updateId);

        if (status == IRiskStewardReceiver.UpdateStatus.None) {
            uint256 latestId = RISK_ORACLE.getLatestUpdateIdByTypeAndMarket(update.updateType, update.market);
            if (latestId != updateId) {
                // A newer update prevents this one from being processed.
                details.replacedByUpdateId = latestId;
                return details;
            }
            _previewProcessUpdate(update, details);
        } else {
            _previewRegisteredUpdate(update, registeredUnlockTime, details);
        }
    }

    /**
     * @notice Previews an update as if it were published and processed now.
     * @dev Uses the same arguments as `RiskOracle.publishRiskParameterUpdate` for easy proposal checks.
     * @param referenceId External reference ID
     * @param newValue Encoded proposed value
     * @param updateType Parameter name
     * @param market Target market
     * @param poolId eMode pool ID, or zero for a regular market
     * @param dstEid Destination endpoint ID for a remote update
     * @param additionalData Extra data passed with the update
     * @return details The previewed details
     * @custom:error May forward a steward error or PoolDoesNotExist for an unknown eMode pool
     */
    function previewUpdate(
        string memory referenceId,
        bytes memory newValue,
        string memory updateType,
        address market,
        uint96 poolId,
        uint32 dstEid,
        bytes memory additionalData
    ) external view returns (UpdateDetails memory details) {
        RiskParameterUpdate memory update = RiskParameterUpdate({
            referenceId: referenceId,
            updateId: RISK_ORACLE.updateCounter() + 1,
            market: market,
            updateType: updateType,
            updateTypeKey: keccak256(bytes(updateType)),
            newValue: newValue,
            previousValue: "",
            timestamp: block.timestamp,
            publisher: msg.sender,
            poolId: poolId,
            destLzEid: dstEid,
            additionalData: additionalData
        });

        details = _buildDetails(update);
        _previewProcessUpdate(update, details);
    }

    /**
     * @notice Fills in the update's identity and values, regardless of receiver status.
     * @param update Update to inspect
     * @return details Partially filled details
     */
    function _buildDetails(RiskParameterUpdate memory update) internal view returns (UpdateDetails memory details) {
        details.updateId = update.updateId;
        details.updateType = update.updateType;
        details.market = update.market;
        details.isRemote = update.destLzEid != 0 && update.destLzEid != RISK_STEWARD_RECEIVER.LAYER_ZERO_EID();
        details.isPaused = RISK_STEWARD_RECEIVER.paused();
        details.isConfigActive = RISK_STEWARD_RECEIVER.getRiskParameterConfig(update.updateType).active;
        details.proposedValues = _decodeProposedValues(update);

        // The destination market's current value is unavailable on this chain.
        if (!details.isRemote) details.currentValues = _readCurrentValues(update);
    }

    /**
     * @notice Previews processing, including blockers and the expected unlock time.
     * @param update Unprocessed update
     * @param details Details to fill in
     */
    function _previewProcessUpdate(RiskParameterUpdate memory update, UpdateDetails memory details) internal view {
        IRiskStewardReceiver.RiskParamConfig memory config = RISK_STEWARD_RECEIVER.getRiskParameterConfig(
            update.updateType
        );

        // The receiver rejects updates that expire before their timelock ends, including remote updates.
        // Configured timelocks are shorter than the expiry period, so subtraction is safe.
        details.expiresAt = _getExpirationTime(update) - config.timelock;
        if (details.expiresAt < block.timestamp) return;

        // A disabled type can still be previewed; an unconfigured type has no steward to query.
        if (config.riskSteward == address(0)) return;

        details.canProcessNow = config.active && !details.isPaused;

        // Remote updates are sent now; the destination handles its own delay and blockers.
        if (details.isRemote) {
            details.unlockTime = block.timestamp;
            return;
        }

        details.debounceEndsAt = _getDebounceEnd(update, config.debounce);
        details.blockingUpdateId = _getBlockingUpdate(update);
        details.canProcessNow =
            details.canProcessNow &&
            details.debounceEndsAt <= block.timestamp &&
            details.blockingUpdateId == 0;

        // Surface steward errors, just as `processUpdate` does.
        bool safe = IRiskSteward(config.riskSteward).isSafeForDirectExecution(update);
        details.unlockTime = safe ? block.timestamp : block.timestamp + config.timelock;
        details.executableNow = safe && details.canProcessNow;
    }

    /**
     * @notice Adds the stored unlock time and any remaining expiry window.
     * @dev Registered updates expire at publication time plus the full expiry period.
     * @param update Registered update
     * @param registeredUnlockTime Unlock time stored by the receiver
     * @param details Details to fill in
     */
    function _previewRegisteredUpdate(
        RiskParameterUpdate memory update,
        uint256 registeredUnlockTime,
        UpdateDetails memory details
    ) internal view {
        details.unlockTime = registeredUnlockTime;
        if (
            details.status == IRiskStewardReceiver.UpdateStatus.Pending ||
            details.status == IRiskStewardReceiver.UpdateStatus.SENT_TO_DESTINATION
        ) details.expiresAt = _getExpirationTime(update);
    }

    /**
     * @notice Gets when debounce ends for this market and update type.
     * @param update Update to check
     * @param debounce Configured debounce period
     * @return End time, or zero if no matching update has executed
     */
    function _getDebounceEnd(RiskParameterUpdate memory update, uint256 debounce) internal view returns (uint256) {
        uint256 lastProcessedId = RISK_STEWARD_RECEIVER.lastProcessedUpdate(update.updateTypeKey, update.market);
        (, , , , uint256 lastExecutedAt) = RISK_STEWARD_RECEIVER.updates(lastProcessedId);
        if (lastExecutedAt == 0) return 0;

        return lastExecutedAt + debounce;
    }

    /**
     * @notice Finds a pending update that blocks this market and type.
     * @dev Expired pending updates do not block processing.
     * @param update Update to check
     * @return Blocking update ID, or zero
     */
    function _getBlockingUpdate(RiskParameterUpdate memory update) internal view returns (uint256) {
        uint256 registeredId = RISK_STEWARD_RECEIVER.lastRegisteredUpdate(update.updateTypeKey, update.market);
        if (registeredId == 0 || registeredId == update.updateId) return 0;

        (, , IRiskStewardReceiver.UpdateStatus status, , ) = RISK_STEWARD_RECEIVER.updates(registeredId);
        if (status != IRiskStewardReceiver.UpdateStatus.Pending) return 0;

        if (_getExpirationTime(RISK_ORACLE.getUpdateById(registeredId)) < block.timestamp) return 0;

        return registeredId;
    }

    /**
     * @notice Gets publication time plus the receiver's expiry period.
     * @param update Update to check
     * @return Expiration time
     */
    function _getExpirationTime(RiskParameterUpdate memory update) internal view returns (uint256) {
        return update.timestamp + RISK_STEWARD_RECEIVER.UPDATE_EXPIRATION_TIME();
    }

    /**
     * @notice Reads the current value from the market's comptroller or vToken.
     * @param update Update to inspect
     * @return values Current values in the proposed value's layout, or empty for an unknown type
     */
    function _readCurrentValues(RiskParameterUpdate memory update) internal view returns (uint256[] memory values) {
        bytes32 key = update.updateTypeKey;
        address market = update.market;

        if (key == COLLATERAL_FACTORS_KEY) {
            values = new uint256[](2);
            (values[0], values[1]) = _readCollateralFactors(market, update.poolId);
            return values;
        }

        if (key == INTEREST_RATE_MODEL_KEY) {
            values = new uint256[](1);
            values[0] = uint160(ICorePoolVToken(market).interestRateModel());
            return values;
        }

        // Unknown types have no value reader.
        if (key != SUPPLY_CAP_KEY && key != BORROW_CAP_KEY) return values;

        // Both pool types use the same cap getters.
        values = new uint256[](1);
        ICorePoolComptroller comptroller = ICorePoolComptroller(ICorePoolVToken(market).comptroller());
        values[0] = key == SUPPLY_CAP_KEY ? comptroller.supplyCaps(market) : comptroller.borrowCaps(market);
    }

    /**
     * @notice Reads a market's collateral factor and liquidation threshold.
     * @dev A nonzero eMode pool ID on an isolated market returns zeros; execution later reverts with `InvalidPool`.
     * @param market Market to read
     * @param poolId eMode pool ID, or zero for regular factors
     * @return collateralFactor Current collateral factor
     * @return liquidationThreshold Current liquidation threshold
     */
    function _readCollateralFactors(
        address market,
        uint96 poolId
    ) internal view returns (uint256 collateralFactor, uint256 liquidationThreshold) {
        address comptroller = ICorePoolVToken(market).comptroller();

        if (comptroller != CORE_POOL_COMPTROLLER) {
            if (poolId == 0) {
                (, collateralFactor, liquidationThreshold) = IIsolatedPoolsComptroller(comptroller).markets(market);
            }
        } else if (poolId == 0) {
            (, collateralFactor, , liquidationThreshold, , , ) = ICorePoolComptroller(comptroller).markets(market);
        } else {
            (, collateralFactor, , liquidationThreshold, , , ) = ICorePoolComptroller(comptroller).poolMarkets(
                poolId,
                market
            );
        }
    }

    /**
     * @notice Decodes the proposed value into numbers.
     * @dev Unexpected lengths return an empty array. Interest rate models remain `uint256`, so values above 160 bits
     *      are visible here even though the steward rejects them.
     * @param update Update to decode
     * @return values Decoded values, or empty for an unknown type or unexpected length
     */
    function _decodeProposedValues(RiskParameterUpdate memory update) internal pure returns (uint256[] memory values) {
        bytes32 key = update.updateTypeKey;
        uint256 length = update.newValue.length;

        if ((key == SUPPLY_CAP_KEY || key == BORROW_CAP_KEY || key == INTEREST_RATE_MODEL_KEY) && length == 32) {
            values = new uint256[](1);
            values[0] = abi.decode(update.newValue, (uint256));
        } else if (key == COLLATERAL_FACTORS_KEY && length == 64) {
            values = new uint256[](2);
            (values[0], values[1]) = abi.decode(update.newValue, (uint256, uint256));
        }
    }
}
