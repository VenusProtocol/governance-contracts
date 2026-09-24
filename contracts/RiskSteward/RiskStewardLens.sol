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
 * @notice Read-only view of a risk parameter update: the value on the market today, the value the update would set,
 *         whether it is applied right away or timelocked, and when it unlocks, or whether it has expired or is held
 *         back by debounce, by another pending update, or by a newer update that replaced it.
 * @dev Reports facts rather than predicting the receiver's verdict. The steward's `isSafeForDirectExecution` and
 *      the receiver's `isUpdateExecutable` are called directly. Only a few receiver rules are restated here: the
 *      pause, config-active, expiry, timelock, debounce, pending-update and latest-update rules, one or two lines each.
 *      If the receiver changes one of them, the matching part here has to change too. `previewUpdate` does not check
 *      whether the oracle would accept the update. It holds no state, so it can be redeployed, e.g. to decode a new
 *      update type.
 * @custom:security-contact https://github.com/VenusProtocol/governance-contracts#discussion
 */
contract RiskStewardLens {
    /**
     * @notice Details of a risk parameter update
     * @param updateId The oracle update ID. For `previewUpdate`, the ID the update would get if published now
     * @param updateType The update type, e.g. `supplyCap`
     * @param market The market the update targets
     * @param status The update's status on the receiver; `None` means `processUpdate` has not run for it yet
     * @param isRemote Whether the update is sent to another chain instead of being applied on this one
     * @param isPaused Whether the receiver is paused. A pause stops only `processUpdate`, so it holds back an update
     *        not yet processed but not the execution of one already pending
     * @param isConfigActive Whether the receiver's config for the update type is active; a type never configured is
     *        inactive. While it is off, `processUpdate` and `executeRegisteredUpdate` both reject the update. It can be
     *        switched back on with its steward, timelock and debounce unchanged, so for an update not yet processed
     *        the other fields still show what would happen then; only `executableNow` stays false. A type never
     *        configured has no steward to ask, so those fields (`unlockTime`, `debounceEndsAt`, `blockingUpdateId`)
     *        are left at 0
     * @param executableNow Whether the next call would apply the change right away. For an update not yet processed,
     *        whether `processUpdate` would apply it in the same call: the receiver is not paused, the config is
     *        active, the steward's `isSafeForDirectExecution` passes, and neither debounce nor another pending update
     *        holds it back. For a pending update, whether `executeRegisteredUpdate` would accept it now, from the
     *        receiver's `isUpdateExecutable`. Always false for a remote update, which this chain only sends
     * @param unlockTime When the update becomes executable. For an update not yet processed, the unlock time
     *        `processUpdate` would set if called now. For a remote update, the time it is sent from this chain; the
     *        destination receiver then holds it for its own `remoteDelay` after arrival
     * @param expiresAt The last time the update's next step still accepts it; once it is in the past, the update can
     *        no longer take effect. For an update not yet processed, the last time `processUpdate` accepts it: its
     *        publish time plus `UPDATE_EXPIRATION_TIME`, minus the timelock, because the receiver rejects an update
     *        that would expire before its timelock ends, even one it would apply right away. Once that has passed, the
     *        fields that describe processing (`executableNow`, `unlockTime`, `debounceEndsAt`, `blockingUpdateId`)
     *        are left at 0. Debounce or a blocking update can hold it back past this time: it can never be processed
     *        if `debounceEndsAt` is later than `expiresAt`, and a blocker whose own `expiresAt` is not before this one
     *        frees it in time only if an executor executes or rejects the blocker. For a pending update, the last time
     *        `executeRegisteredUpdate` accepts it, and for a sent one the last time it can be resent: its publish time
     *        plus `UPDATE_EXPIRATION_TIME`. 0 for an update that is executed, rejected or expired on the receiver, or
     *        replaced, since there is nothing left for it to miss
     * @param debounceEndsAt The earliest time `processUpdate` accepts an update for this market and type, counted
     *        from the last one executed; it holds the update back only while it is in the future. 0 if none was
     *        executed. Not applied to remote updates on this chain. 0 once the update is processed, because only
     *        `processUpdate` checks debounce
     * @param blockingUpdateId Another update for the same market and type that is still pending and unexpired. While
     *        it exists, `processUpdate` rejects this one; 0 if there is none. Not applied to remote updates. 0 once
     *        the update is processed, because only `processUpdate` checks it
     * @param replacedByUpdateId A newer update published to the oracle for the same market and type. While it exists,
     *        `processUpdate` rejects this one with `UpdateIsExpired`; 0 if there is none. When it is set, the fields that
     *        describe processing (`executableNow`, `unlockTime`, `debounceEndsAt`, `blockingUpdateId`) are left at 0,
     *        because this update will never be processed. Always 0 for `previewUpdate` and for an update already
     *        processed
     * @param currentValues The market's value today, in the same layout as `proposedValues`. Empty for a remote
     *        update, because this lens cannot read a market on another chain, and for an update type it does not know
     * @param proposedValues The value the update would set: `[cap]` for caps, `[collateralFactor,
     *        liquidationThreshold]` for collateral factors, and `[uint160(interestRateModel)]` for an interest rate
     *        model. Empty for an update type this lens does not know, or a value of the wrong length
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
    }

    bytes32 internal constant SUPPLY_CAP_KEY = keccak256("supplyCap");
    bytes32 internal constant BORROW_CAP_KEY = keccak256("borrowCap");
    bytes32 internal constant COLLATERAL_FACTORS_KEY = keccak256("collateralFactors");
    bytes32 internal constant INTEREST_RATE_MODEL_KEY = keccak256("interestRateModel");

    /// @notice The receiver whose updates this lens describes
    RiskStewardReceiver public immutable RISK_STEWARD_RECEIVER;

    /// @notice The oracle the receiver reads updates from
    IRiskOracle public immutable RISK_ORACLE;

    /// @notice The core pool comptroller, needed because its `markets` getter has a different shape from isolated pools'
    address public immutable CORE_POOL_COMPTROLLER;

    /**
     * @param riskStewardReceiver_ The RiskStewardReceiver to describe
     * @param corePoolComptroller_ The core pool comptroller on this chain
     * @custom:error Throws ZeroAddressNotAllowed if either address is zero
     */
    constructor(RiskStewardReceiver riskStewardReceiver_, address corePoolComptroller_) {
        ensureNonzeroAddress(address(riskStewardReceiver_));
        ensureNonzeroAddress(corePoolComptroller_);

        RISK_STEWARD_RECEIVER = riskStewardReceiver_;
        RISK_ORACLE = riskStewardReceiver_.RISK_ORACLE();
        CORE_POOL_COMPTROLLER = corePoolComptroller_;
    }

    /**
     * @notice Returns the details of an update already published to the oracle, at any stage: not yet processed,
     *         registered and waiting on its timelock, or resolved
     * @param updateId The oracle update ID
     * @return details The update's details
     * @custom:error Throws InvalidUpdateId (from the oracle) if the update does not exist
     * @custom:error For an update not yet processed, throws the steward's error if it rejects the update
     * @custom:error Throws PoolDoesNotExist (from the core pool comptroller) for an eMode update whose pool does not
     *               exist; such an update can never be executed
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
                // `processUpdate` rejects a replaced update outright, so there is no processing to preview.
                details.replacedByUpdateId = latestId;
                return details;
            }
            _previewProcessUpdate(update, details);
        } else {
            _previewRegisteredUpdate(update, registeredUnlockTime, details);
        }
    }

    /**
     * @notice Previews an update before it is proposed, as if it were published to the oracle and processed now
     * @dev Takes exactly the arguments of `RiskOracle.publishRiskParameterUpdate`, so a proposal's calldata can be
     *      checked here by swapping the target and the selector.
     * @param referenceId An external reference ID associated with the update
     * @param newValue The encoded new value of the risk parameter
     * @param updateType Type of update performed
     * @param market Address for market of the parameter update
     * @param poolId Pool identifier for eMode-style collateral configuration (0 for regular markets)
     * @param dstEid Destination endpoint ID for cross-chain routing
     * @param additionalData Additional data for the update
     * @return details The update's details
     * @custom:error Throws the steward's error if it rejects the update, e.g. `RedundantValue` for a value the market
     *               already has
     * @custom:error Throws PoolDoesNotExist (from the core pool comptroller) for an eMode update whose pool does not
     *               exist; such an update can never be executed
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
     * @notice Builds the details that do not depend on the update's status on the receiver: identity and values.
     *         The caller fills in the rest.
     * @param update The update to build the details for
     * @return details The partly filled details
     */
    function _buildDetails(RiskParameterUpdate memory update) internal view returns (UpdateDetails memory details) {
        details.updateId = update.updateId;
        details.updateType = update.updateType;
        details.market = update.market;
        details.isRemote = update.destLzEid != 0 && update.destLzEid != RISK_STEWARD_RECEIVER.LAYER_ZERO_EID();
        details.isPaused = RISK_STEWARD_RECEIVER.paused();
        details.isConfigActive = RISK_STEWARD_RECEIVER.getRiskParameterConfig(update.updateType).active;
        details.proposedValues = _decodeProposedValues(update);

        // A remote market is on another chain, so its value cannot be read here and is left empty.
        if (!details.isRemote) details.currentValues = _readCurrentValues(update);
    }

    /**
     * @notice Fills in what `processUpdate` would do with an update that has not been processed yet: what holds it
     *         back, whether it is applied right away, and the unlock time it would set if called now.
     * @param update The update to preview
     * @param details The details being filled in
     */
    function _previewProcessUpdate(RiskParameterUpdate memory update, UpdateDetails memory details) internal view {
        IRiskStewardReceiver.RiskParamConfig memory config = RISK_STEWARD_RECEIVER.getRiskParameterConfig(
            update.updateType
        );

        // Covers both of the receiver's expiry rejections: already expired, and expiring before the timelock ends.
        // The receiver applies them to remote updates too, so this comes before the remote return. The subtraction
        // cannot underflow: the receiver keeps every timelock below `UPDATE_EXPIRATION_TIME`.
        details.expiresAt = _getExpirationTime(update) - config.timelock;
        if (details.expiresAt < block.timestamp) return;

        // A type never configured has no steward to ask. A switched-off type keeps its steward, so it is previewed
        // as if switched back on, and only `executableNow` reflects that it is off.
        if (config.riskSteward == address(0)) return;

        // Remote updates are sent right away and never timelocked on this chain. Debounce and pending updates are
        // enforced on the destination chain, not here.
        if (details.isRemote) {
            details.unlockTime = block.timestamp;
            return;
        }

        details.debounceEndsAt = _getDebounceEnd(update, config.debounce);
        details.blockingUpdateId = _getBlockingUpdate(update);

        // Not caught: every steward rejection is permanent for this update, and `processUpdate` would revert the same way.
        bool safe = IRiskSteward(config.riskSteward).isSafeForDirectExecution(update);
        details.unlockTime = safe ? block.timestamp : block.timestamp + config.timelock;
        // The receiver rejects the update while paused or switched off, while debounce runs (`debounceEndsAt > now`),
        // or while another update is pending.
        details.executableNow =
            safe &&
            config.active &&
            !details.isPaused &&
            details.debounceEndsAt <= block.timestamp &&
            details.blockingUpdateId == 0;
    }

    /**
     * @notice Fills in the unlock time and expiry of an update the receiver has already registered.
     * @dev The expiry no longer subtracts the timelock, as it does before registration, because the timelock is
     *      already set and only execution, or a resend for a remote update, is left.
     * @param update The update to fill in
     * @param registeredUnlockTime The unlock time stored on the receiver
     * @param details The details being filled in
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
     * @notice Returns when the debounce from the last executed update for this market and type ends.
     * @param update The update to check
     * @param debounce The debounce configured for the update's type
     * @return The debounce end time, or 0 if no update of this type was executed on this market
     */
    function _getDebounceEnd(RiskParameterUpdate memory update, uint256 debounce) internal view returns (uint256) {
        uint256 lastProcessedId = RISK_STEWARD_RECEIVER.lastProcessedUpdate(update.updateTypeKey, update.market);
        (, , , , uint256 lastExecutedAt) = RISK_STEWARD_RECEIVER.updates(lastProcessedId);
        if (lastExecutedAt == 0) return 0;

        return lastExecutedAt + debounce;
    }

    /**
     * @notice Returns another pending, unexpired update for the same market and type, which blocks this one.
     * @dev An expired pending update is left out, because `processUpdate` marks it expired and carries on.
     * @param update The update to check
     * @return The blocking update's ID, or 0 if there is none
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
     * @notice Returns when the update stops being executable: its publish time plus `UPDATE_EXPIRATION_TIME`.
     * @param update The update to check
     * @return The expiration time
     */
    function _getExpirationTime(RiskParameterUpdate memory update) internal view returns (uint256) {
        return update.timestamp + RISK_STEWARD_RECEIVER.UPDATE_EXPIRATION_TIME();
    }

    /**
     * @notice Reads the value the update would replace from the market's comptroller or vToken.
     * @param update The update whose current value is read
     * @return values The current value, in the same layout as `_decodeProposedValues`; empty for an unknown update type
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

        // Any type other than the two caps is unknown to this lens, so its value stays empty.
        if (key != SUPPLY_CAP_KEY && key != BORROW_CAP_KEY) return values;

        // Core and isolated pools share the cap getters' signatures.
        values = new uint256[](1);
        ICorePoolComptroller comptroller = ICorePoolComptroller(ICorePoolVToken(market).comptroller());
        values[0] = key == SUPPLY_CAP_KEY ? comptroller.supplyCaps(market) : comptroller.borrowCaps(market);
    }

    /**
     * @notice Reads a market's collateral factor and liquidation threshold, from its eMode pool when `poolId` is set.
     * @dev An isolated pool market has no eMode pools, so a non-zero `poolId` returns zeros there. Such an update is
     *      still registered, but the steward's `applyUpdate` reverts with `InvalidPool` when it is executed.
     * @param market The market to read
     * @param poolId The eMode pool to read from (0 for the market's regular collateral factors)
     * @return collateralFactor The current collateral factor
     * @return liquidationThreshold The current liquidation threshold
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
     * @notice Decodes the update's `newValue` into plain numbers.
     * @dev A value of the wrong length is returned empty instead of reverting the view; the steward rejects it anyway.
     *      An interest rate model is decoded as a plain `uint256`, not an address, so a malformed value shows up as a
     *      number above 160 bits instead of reverting the view.
     * @param update The update to decode
     * @return values The decoded value, or empty for an unknown update type or a malformed value
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
