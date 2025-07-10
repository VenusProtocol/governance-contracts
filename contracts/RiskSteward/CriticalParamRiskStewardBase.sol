// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.25;

import { ICorePoolComptroller } from "../interfaces/ICorePoolComptroller.sol";
import { IRiskStewardReceiver } from "../interfaces/IRiskStewardReceiver.sol";
import { AccessControlledV8 } from "../Governance/AccessControlledV8.sol";
import { ensureNonzeroAddress } from "@venusprotocol/solidity-utilities/contracts/validators.sol";

/**
 * @title CriticalParamRiskStewardBase
 * @author Venus
 * @notice Abstract contract for shared logic between MarketCapsRiskSteward, CollateralFactorRiskSteward, and ReserveFactorRiskSteward.
 * @dev This contract contains all shared state, errors, and utility functions for risk stewards.
 * @custom:security-contact https://github.com/VenusProtocol/governance-contracts#discussion
 */
abstract contract CriticalParamRiskStewardBase is AccessControlledV8 {
    /// @dev Max basis points i.e., 100%
    uint256 internal constant MAX_BPS = 10000;

    /**
     * @notice Address of the CorePoolComptroller used for selecting the correct comptroller abi
     */
    ICorePoolComptroller public immutable CORE_POOL_COMPTROLLER;

    /**
     * @notice Address of the RiskStewardReceiver used to validate incoming updates
     */
    IRiskStewardReceiver public immutable RISK_STEWARD_RECEIVER;

    /**
     * @notice The max delta bps for the update relative to the current value
     */
    uint256 public maxDeltaBps;

    /**
     * @notice The debounce period for updates in seconds
     */
    uint256 public debouncePeriod;

    /**
     * @notice Mapping of market and update type to last update timestamp. Used for debouncing updates.
     */
    mapping(bytes marketUpdateType => uint256) public lastProcessedTime;

    /**
     * @notice Mapping of processed updates. Used to prevent re-execution
     */
    mapping(uint256 updateId => bool) public processedUpdates;

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[47] private __gap;

    /**
     * @notice Emitted when the max delta bps is updated
     * @param oldMaxDeltaBps The previous max delta bps
     * @param newMaxDeltaBps The new max delta bps
     */
    event MaxDeltaBpsUpdated(uint256 oldMaxDeltaBps, uint256 newMaxDeltaBps);

    /**
     * @notice Emitted when the debounce period is updated
     * @param oldDebouncePeriod The previous debounce period
     * @param newDebouncePeriod The new debounce period
     */
    event DebouncePeriodUpdated(uint256 oldDebouncePeriod, uint256 newDebouncePeriod);

    /**
     * @notice Thrown when a maxDeltaBps value of 0 is set
     */
    error InvalidMaxDeltaBps();

    /**
     * @notice Thrown when a debounce period of 0 is set
     */
    error InvalidDebouncePeriod();

    /**
     * @notice Thrown when an updateType that is not supported is operated on
     * @param updateId The ID of the update
     */
    error UnsupportedUpdateType(uint256 updateId);

    /**
     * @notice Thrown when the new value of an update is out of range
     * @param updateId The ID of the update
     */
    error UpdateNotInRange(uint256 updateId);

    /**
     * @notice Thrown when the debounce period hasn't passed for applying an update to a specific market/ update type
     */
    error UpdateTooFrequent();

    /**
     * @notice Thrown when update is already processed
     * @param updateId The ID of the update
     */
    error UpdateAlreadyProcessed(uint256 updateId);

    /**
     * @dev Sets the immutable CorePoolComptroller and RiskStewardReceiver addresses and disables initializers
     * @param riskStewardReceiver_ The address of the RiskStewardReceiver
     * @param corePoolComptroller_ The address of the corePoolComptroller
     * @custom:error Throws ZeroAddressNotAllowed if the CorePoolComptroller or RiskStewardReceiver addresses are zero
     * @custom:oz-upgrades-unsafe-allow constructor
     */
    constructor(address riskStewardReceiver_, address corePoolComptroller_) {
        ensureNonzeroAddress(riskStewardReceiver_);
        ensureNonzeroAddress(corePoolComptroller_);
        RISK_STEWARD_RECEIVER = IRiskStewardReceiver(riskStewardReceiver_);
        CORE_POOL_COMPTROLLER = ICorePoolComptroller(corePoolComptroller_);
        _disableInitializers();
    }

    /**
     * @notice Sets the max delta bps
     * @param maxDeltaBps_ The new max delta bps
     * @custom:event Emits MaxDeltaBpsUpdated with the old and new max delta bps
     * @custom:error InvalidMaxDeltaBps if the max delta bps is 0 or greater than MAX_BPS
     * @custom:access Controlled by AccessControlManager
     */
    function setMaxDeltaBps(uint256 maxDeltaBps_) external {
        _checkAccessAllowed("setMaxDeltaBps(uint256)");
        if (maxDeltaBps_ == 0 || maxDeltaBps_ > MAX_BPS) {
            revert InvalidMaxDeltaBps();
        }
        emit MaxDeltaBpsUpdated(maxDeltaBps, maxDeltaBps_);
        maxDeltaBps = maxDeltaBps_;
    }

    /**
     * @notice Sets the debounce period
     * @param debouncePeriod_ The new debounce period
     * @custom:event Emits DebouncePeriodUpdated with the old and new debounce period
     * @custom:error InvalidDebouncePeriod if the debounce period is 0 or less than the RiskStewardReceiver's UPDATE_EXPIRATION_TIME
     * @custom:access Controlled by AccessControlManager
     */
    function setDebouncePeriod(uint256 debouncePeriod_) external {
        _checkAccessAllowed("setDebouncePeriod(uint256)");
        if (debouncePeriod_ == 0 || debouncePeriod_ <= RISK_STEWARD_RECEIVER.UPDATE_EXPIRATION_TIME()) {
            revert InvalidDebouncePeriod();
        }
        emit DebouncePeriodUpdated(debouncePeriod, debouncePeriod_);
        debouncePeriod = debouncePeriod_;
    }

    /**
     * @dev Disabling renounceOwnership function.
     */
    function renounceOwnership() public pure override {
        revert("renounceOwnership() is not allowed");
    }

    /**
     * @notice Packs the new value into a bytes memory
     * @param data The un-padded bytes to decode
     * @return bytes memory The packed bytes
     */
    function packNewValue(bytes memory data) public pure returns (bytes memory) {
        return abi.encodePacked(new bytes(32 - data.length), data);
    }

    /**
     * @dev Initializes the contract as ownable, access controlled, and pausable. Sets the max delta bps initial value.
     * @param accessControlManager_ The address of the access control manager
     * @param maxDeltaBps_ The max delta bps
     * @param debouncePeriod_ The debounce period
     * @custom:error Throws InvalidMaxDeltaBps if the max delta bps is 0 or greater than MAX_BPS
     */
    function __CriticalParamRiskStewardBase_init(
        address accessControlManager_,
        uint256 maxDeltaBps_,
        uint256 debouncePeriod_
    ) internal onlyInitializing {
        __AccessControlled_init(accessControlManager_);
        if (maxDeltaBps_ == 0 || maxDeltaBps_ > MAX_BPS) {
            revert InvalidMaxDeltaBps();
        }
        maxDeltaBps = maxDeltaBps_;
        if (debouncePeriod_ == 0 || debouncePeriod_ <= RISK_STEWARD_RECEIVER.UPDATE_EXPIRATION_TIME()) {
            revert InvalidDebouncePeriod();
        }
        debouncePeriod = debouncePeriod_;
    }

    /**
     * @notice Verifies that the update is not too frequent and within the allowed range
     * @param market The market whose update is being verified
     * @param updateId The ID of the update
     * @param updateType The type of update being verified
     * @param previousValue The previous value of the update
     * @param newValue The new value of the update
     * @custom:error UpdateTooFrequent if the update is too frequent
     * @custom:error UpdateNotInRange if the update is not within the allowed range
     */
    function _verifyUpdate(
        address market,
        uint256 updateId,
        string memory updateType,
        uint256 previousValue,
        uint256 newValue
    ) internal view {
        if (block.timestamp - lastProcessedTime[_getMarketUpdateTypeKey(market, updateType)] < debouncePeriod) {
            revert UpdateTooFrequent();
        }
        _updateWithinAllowedRange(updateId, previousValue, newValue);
    }

    /**
     * @notice Ensures the risk param update is within the allowed range.
     * If the previous value is 0, this means the market is not yet supported or disabled and setting a new value is not allowed.
     * @param updateId The ID of the update
     * @param previousValue current risk param value
     * @param newValue new updated risk param value
     * @custom:error UpdateNotInRange if the update is not within the allowed range
     */
    function _updateWithinAllowedRange(uint256 updateId, uint256 previousValue, uint256 newValue) internal view {
        uint256 diff = newValue > previousValue ? newValue - previousValue : previousValue - newValue;
        uint256 maxDiff = (maxDeltaBps * previousValue) / MAX_BPS;
        if (diff > maxDiff) {
            revert UpdateNotInRange(updateId);
        }
    }

    /**
     * @notice Decodes un-padded bytes to a uint256
     * @param data The un-padded bytes to decode
     * @return uint256 The decoded uint256
     */
    function _decodeBytesToUint256(bytes memory data) internal pure returns (uint256) {
        return abi.decode(packNewValue(data), (uint256));
    }

    /**
     * @dev Encodes the market and update type into a bytes key to be used with the last processed time mapping
     * @param market The market address
     * @param updateType The update type string
     * @return bytes The encoded key
     */
    function _getMarketUpdateTypeKey(address market, string memory updateType) internal pure returns (bytes memory) {
        return abi.encodePacked(market, updateType);
    }
}
