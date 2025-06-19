// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.25;

import { Strings } from "@openzeppelin/contracts/utils/Strings.sol";
import { IVToken } from "../interfaces/IVToken.sol";
import { ICorePoolComptroller } from "../interfaces/ICorePoolComptroller.sol";
import { IIsolatedPoolsComptroller } from "../interfaces/IIsolatedPoolsComptroller.sol";
import { IRiskStewardReceiver } from "../interfaces/IRiskStewardReceiver.sol";
import { AccessControlledV8 } from "../Governance/AccessControlledV8.sol";
import { IRiskSteward } from "../interfaces/IRiskSteward.sol";
import { ensureNonzeroAddress } from "@venusprotocol/solidity-utilities/contracts/validators.sol";

/**
 * @title MarketCapsRiskSteward
 * @author Venus
 * @notice Contract that can update supply and borrow caps received from RiskStewardReceiver. Requires that the update is within the max delta.
 * Expects the new value to be an encoded uint256 value of un padded bytes.
 * @custom:security-contact https://github.com/VenusProtocol/governance-contracts#discussion
 */
contract MarketCapsRiskSteward is IRiskSteward, AccessControlledV8 {
    /// @dev Max basis points i.e., 100%
    uint256 private constant MAX_BPS = 10000;

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
     * @notice The update type for supply caps
     */
    string public constant SUPPLY_CAP = "supplyCap";

    /**
     * @notice The update type for borrow caps
     */
    string public constant BORROW_CAP = "borrowCap";

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
     * @notice Emitted when a supply cap is updated
     */
    event SupplyCapUpdated(address indexed market, uint256 indexed newSupplyCap);

    /**
     * @notice Emitted when a borrow cap is updated
     */
    event BorrowCapUpdated(address indexed market, uint256 indexed newBorrowCap);

    /**
     * @notice Emitted when the max delta bps is updated
     */
    event MaxDeltaBpsUpdated(uint256 oldMaxDeltaBps, uint256 indexed newMaxDeltaBps);

    /**
     * @notice Emitted when the debounce period is updated
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
     */
    error UnsupportedUpdateType(uint256 updateId);

    /**
     * @notice Thrown when the new value of an update is out of range
     */
    error UpdateNotInRange(uint256 updateId);

    /**
     * @notice Thrown when the debounce period hasn't passed for applying an update to a specific market/ update type
     */
    error UpdateTooFrequent();

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
     * @dev Initializes the contract as ownable, access controlled, and pausable. Sets the max delta bps initial value.
     * @param accessControlManager_ The address of the access control manager
     * @param maxDeltaBps_ The max detla bps
     * @param debouncePeriod_ The debounce period
     * @custom:error Throws InvalidMaxDeltaBps if the max delta bps is 0 or greater than MAX_BPS
     */
    function initialize(
        address accessControlManager_,
        uint256 maxDeltaBps_,
        uint256 debouncePeriod_
    ) external initializer {
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
     * @notice Processes a market cap update from the RiskStewardReceiver.
     * Validates that the update is within range and then directly update the market supply or borrow cap on the market's comptroller.
     * @param updateId The ID of the update
     * @param newValue The new supply cap value
     * @param updateType The type of update
     * @param market The market to update the supply cap for
     * @custom:error UnsupportedUpdateType Thrown if the update type is not supported
     * @custom:error UpdateNotInRange Thrown if the update is not within the allowed range
     * @custom:event Emits SupplyCapUpdated or BorrowCapUpdated depending on the update with the market and new cap
     * @custom:access Controlled by AccessControlManager
     */
    function processUpdate(uint256 updateId, bytes memory newValue, string memory updateType, address market) external {
        _checkAccessAllowed("processUpdate(uint256,bytes,string,address)");
        if (processedUpdates[updateId]) {
            revert("Update already processed");
        }
        processedUpdates[updateId] = true;
        if (Strings.equal(updateType, SUPPLY_CAP)) {
            _processSupplyCapUpdate(updateId, newValue, updateType, market);
        } else if (Strings.equal(updateType, BORROW_CAP)) {
            _processBorrowCapUpdate(updateId, newValue, updateType, market);
        } else {
            revert UnsupportedUpdateType(updateId);
        }
    }

    /**
     * @notice Updates the supply cap for the given market.
     * @param comptroller The comptroller to update the supply cap for
     * @param market The market to update the supply cap for
     * @param newValue The new supply cap value
     * @custom:event Emits SupplyCapUpdated with the market and new supply cap
     */
    function _updateSupplyCaps(address comptroller, address market, uint256 newValue) internal {
        address[] memory newSupplyCapMarkets = new address[](1);
        newSupplyCapMarkets[0] = market;
        uint256[] memory newSupplyCaps = new uint256[](1);
        newSupplyCaps[0] = newValue;

        if (comptroller == address(CORE_POOL_COMPTROLLER)) {
            ICorePoolComptroller(comptroller)._setMarketSupplyCaps(newSupplyCapMarkets, newSupplyCaps);
        } else {
            IIsolatedPoolsComptroller(comptroller).setMarketSupplyCaps(newSupplyCapMarkets, newSupplyCaps);
        }
        emit SupplyCapUpdated(market, newSupplyCaps[0]);
    }

    /**
     * @notice Updates the borrow cap for the given market.
     * @param comptroller The comptroller to update the borrow cap for
     * @param market The market to update the borrow cap for
     * @param newValue The new borrow cap value
     * @custom:event Emits BorrowCapUpdated with the market and new borrow cap
     */
    function _updateBorrowCaps(address comptroller, address market, uint256 newValue) internal {
        address[] memory newBorrowCapMarkets = new address[](1);
        newBorrowCapMarkets[0] = market;
        uint256[] memory newBorrowCaps = new uint256[](1);
        newBorrowCaps[0] = newValue;

        if (comptroller == address(CORE_POOL_COMPTROLLER)) {
            ICorePoolComptroller(comptroller)._setMarketBorrowCaps(newBorrowCapMarkets, newBorrowCaps);
        } else {
            IIsolatedPoolsComptroller(comptroller).setMarketBorrowCaps(newBorrowCapMarkets, newBorrowCaps);
        }
        emit BorrowCapUpdated(market, newBorrowCaps[0]);
    }

    /**
     * @notice Validates the new supply cap and if valid, updates the supply cap for the given market.
     * @param updateId The ID of the update
     * @param newValue The new supply cap value
     * @param updateType The type of update
     * @param market The market to update the supply cap for
     * @custom:event Emits SupplyCapUpdated with the market and new supply cap
     * @custom:error UpdateNotInRange if the update is not within the allowed range
     */
    function _processSupplyCapUpdate(
        uint256 updateId,
        bytes memory newValue,
        string memory updateType,
        address market
    ) internal {
        uint256 newCap = _decodeBytesToUint256(newValue);
        address comptroller = IVToken(market).comptroller();

        _validateSupplyCapUpdate(comptroller, market, updateId, newCap);

        _updateSupplyCaps(comptroller, market, newCap);

        lastProcessedTime[_getMarketUpdateTypeKey(market, updateType)] = block.timestamp;
    }

    /**
     * @notice Validates the new borrow cap and if valid, updates the borrow cap for the given market.
     * @param updateId The ID of the update
     * @param newValue The new borrow cap value
     * @param updateType The type of update
     * @param market The market to update the borrow cap for
     * @custom:event Emits BorrowCapUpdated with the market and new borrow cap
     * @custom:error UpdateNotInRange if the update is not within the allowed range
     */
    function _processBorrowCapUpdate(
        uint256 updateId,
        bytes memory newValue,
        string memory updateType,
        address market
    ) internal {
        uint256 newCap = _decodeBytesToUint256(newValue);
        address comptroller = IVToken(market).comptroller();
        _validateBorrowCapUpdate(comptroller, market, updateId, newCap);
        _updateBorrowCaps(comptroller, market, newCap);
        lastProcessedTime[_getMarketUpdateTypeKey(market, updateType)] = block.timestamp;
    }

    /**
     * @notice Decodes the additional data from the SupplyCap and BorrowCap RiskParameterUpdates
     * @param additionalData The additional data to decode
     * @return underlying The underlying asset address
     * @return destChainId The destination chain ID
     */
    function decodeAdditionalData(bytes calldata additionalData) external pure returns (address, uint32) {
        (address underlying, uint32 destChainId) = abi.decode(additionalData, (address, uint32));
        return (underlying, destChainId);
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
     * @notice Checks that the new supply cap is within the allowed range of the current supply cap.
     * @param comptroller The comptroller of the market
     * @param market The market whose supply cap is being updated
     * @param updateId The ID of the update
     * @param newCap The new market cap value to validate
     * @custom:error UpdateNotInRange if the update is not within the allowed range
     */
    function _validateSupplyCapUpdate(
        address comptroller,
        address market,
        uint256 updateId,
        uint256 newCap
    ) internal view {
        uint256 currentSupplyCap = IIsolatedPoolsComptroller(comptroller).supplyCaps(address(market));
        _verifyUpdate(market, updateId, SUPPLY_CAP, currentSupplyCap, newCap);
    }

    /**
     * @notice Checks that the new borrow cap is within the allowed range of the current borrow cap.
     * @param comptroller The comptroller of the market
     * @param market The market whose borrow cap is being updated
     * @param updateId The ID of the update
     * @param newCap The new market cap value to validate
     * @custom:error UpdateNotInRange if the update is not within the allowed range
     */
    function _validateBorrowCapUpdate(
        address comptroller,
        address market,
        uint256 updateId,
        uint256 newCap
    ) internal view {
        uint256 currentBorrowCap = IIsolatedPoolsComptroller(comptroller).borrowCaps(address(market));
        _verifyUpdate(market, updateId, BORROW_CAP, currentBorrowCap, newCap);
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
     */
    function _getMarketUpdateTypeKey(address market, string memory updateType) internal pure returns (bytes memory) {
        return abi.encodePacked(market, updateType);
    }

    /**
     * @dev Disabling renounceOwnership function.
     */
    function renounceOwnership() public pure override {
        revert("renounceOwnership() is not allowed");
    }
}
