// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.25;

import { RiskParameterUpdate } from "./Interfaces/IRiskOracle.sol";
import { ICorePoolVToken } from "../interfaces/ICorePoolVToken.sol";
import { ICorePoolComptroller } from "../interfaces/ICorePoolComptroller.sol";
import { IRiskStewardReceiver } from "./Interfaces/IRiskStewardReceiver.sol";
import { BaseRiskSteward } from "./BaseRiskSteward.sol";
import { ensureNonzeroAddress } from "@venusprotocol/solidity-utilities/contracts/validators.sol";

/**
 * @title MarketCapsRiskSteward
 * @author Venus
 * @notice Contract that can update supply and borrow caps updates received from RiskStewardReceiver.
 * @custom:security-contact https://github.com/VenusProtocol/governance-contracts#discussion
 */
contract MarketCapsRiskSteward is BaseRiskSteward {
    /**
     * @notice The update type for supply caps
     */
    string public constant SUPPLY_CAP = "supplyCap";

    /**
     * @notice The update type key for supply caps (keccak256 hash of SUPPLY_CAP)
     */
    bytes32 public constant SUPPLY_CAP_KEY = keccak256(bytes(SUPPLY_CAP));

    /**
     * @notice The update type for borrow caps
     */
    string public constant BORROW_CAP = "borrowCap";

    /**
     * @notice The update type key for borrow caps (keccak256 hash of BORROW_CAP)
     */
    bytes32 public constant BORROW_CAP_KEY = keccak256(bytes(BORROW_CAP));

    /**
     * @notice Address of the RiskStewardReceiver used to validate incoming updates
     */
    IRiskStewardReceiver public immutable RISK_STEWARD_RECEIVER;

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[49] private __gap;

    /**
     * @notice Emitted when a supply cap is updated
     */
    event SupplyCapUpdated(uint256 indexed updateId, address indexed market, uint256 newSupplyCap);

    /**
     * @notice Emitted when a borrow cap is updated
     */
    event BorrowCapUpdated(uint256 indexed updateId, address indexed market, uint256 newBorrowCap);

    /**
     * @notice Emitted when the safe delta bps is updated
     */
    event SafeDeltaBpsUpdated(uint256 oldSafeDeltaBps, uint256 newSafeDeltaBps);

    /**
     * @notice Thrown when a safeDeltaBps value is greater than MAX_BPS
     */
    error InvalidSafeDeltaBps();

    /**
     * @notice Thrown when an update type that is not supported is operated on
     */
    error UnsupportedUpdateType();

    /**
     * @notice Thrown when the update is not coming from the RiskStewardReceiver
     */
    error OnlyRiskStewardReceiver();

    /**
     * @notice Thrown when the uint256 data length is invalid
     */
    error InvalidUintLength();

    /**
     * @notice Sets the immutable RiskStewardReceiver address and disables initializers
     * @param riskStewardReceiver_ The address of the RiskStewardReceiver
     * @custom:error Throws ZeroAddressNotAllowed if the RiskStewardReceiver address is zero
     * @custom:oz-upgrades-unsafe-allow constructor
     */
    constructor(address riskStewardReceiver_) {
        ensureNonzeroAddress(riskStewardReceiver_);
        RISK_STEWARD_RECEIVER = IRiskStewardReceiver(riskStewardReceiver_);
        _disableInitializers();
    }

    /**
     * @notice Initializes the contract as ownable and access controlled.
     * @param accessControlManager_ The address of the access control manager
     */
    function initialize(address accessControlManager_) external initializer {
        __AccessControlled_init(accessControlManager_);
    }

    /**
     * @notice Sets the safe delta bps
     * @param safeDeltaBps_ The new safe delta bps
     * @custom:access Controlled by AccessControlManager
     * @custom:event Emits SafeDeltaBpsUpdated with the old and new safe delta bps
     * @custom:error Throws InvalidSafeDeltaBps if the safe delta bps is greater than MAX_BPS
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
     * @notice Checks if an update is safe for direct execution (no timelock required)
     * @param update The update to check
     * @return True if update is safe for direct execution, false if timelock is required
     * @custom:error Throws UnsupportedUpdateType if the update type is not supported
     */
    function isSafeForDirectExecution(RiskParameterUpdate calldata update) external view returns (bool) {
        uint256 newValue = _decodeAbiEncodedUint256(update.newValue);
        ICorePoolComptroller comptroller = ICorePoolComptroller(ICorePoolVToken(update.market).comptroller());
        uint256 currentValue;

        if (update.updateTypeKey == SUPPLY_CAP_KEY) {
            currentValue = comptroller.supplyCaps(update.market);
        } else if (update.updateTypeKey == BORROW_CAP_KEY) {
            currentValue = comptroller.borrowCaps(update.market);
        } else {
            revert UnsupportedUpdateType();
        }

        // If current value is 0, always require timelock (not safe for direct execution)
        if (currentValue == 0) {
            return false;
        }

        // Return true if difference is within safe delta (safe for direct execution)
        return _isWithinSafeDelta(newValue, currentValue);
    }

    /**
     * @notice Applies a market cap update from the RiskStewardReceiver.
     * Directly updates the market supply or borrow cap on the market's comptroller.
     * @custom:access Only callable by the RiskStewardReceiver
     * @param update RiskParameterUpdate update to apply
     * @custom:event Emits SupplyCapUpdated or BorrowCapUpdated depending on the update with the updateId, market and new cap
     * @custom:error Throws OnlyRiskStewardReceiver if the sender is not the RiskStewardReceiver
     * @custom:error Throws UnsupportedUpdateType if the update type is not supported
     */
    function applyUpdate(RiskParameterUpdate calldata update) external {
        if (msg.sender != address(RISK_STEWARD_RECEIVER)) {
            revert OnlyRiskStewardReceiver();
        }
        uint256 newValue = _decodeAbiEncodedUint256(update.newValue);

        if (update.updateTypeKey == SUPPLY_CAP_KEY) {
            _updateSupplyCaps(update.updateId, update.market, newValue);
        } else if (update.updateTypeKey == BORROW_CAP_KEY) {
            _updateBorrowCaps(update.updateId, update.market, newValue);
        } else {
            revert UnsupportedUpdateType();
        }
    }

    /**
     * @notice Updates the supply cap for the given market.
     * @param updateId The update ID from the Risk Oracle
     * @param market The market to update the supply cap for
     * @param newValue The new supply cap value
     * @custom:event Emits SupplyCapUpdated with the updateId, market and new supply cap
     */
    function _updateSupplyCaps(uint256 updateId, address market, uint256 newValue) internal {
        address comptroller = ICorePoolVToken(market).comptroller();
        address[] memory newSupplyCapMarkets = new address[](1);
        newSupplyCapMarkets[0] = market;
        uint256[] memory newSupplyCaps = new uint256[](1);
        newSupplyCaps[0] = newValue;

        // Core and isolated pools share the same `setMarketSupplyCaps` signature.
        ICorePoolComptroller(comptroller).setMarketSupplyCaps(newSupplyCapMarkets, newSupplyCaps);
        emit SupplyCapUpdated(updateId, market, newSupplyCaps[0]);
    }

    /**
     * @notice Updates the borrow cap for the given market.
     * @param updateId The update ID from the Risk Oracle
     * @param market The market to update the borrow cap for
     * @param newValue The new borrow cap value
     * @custom:event Emits BorrowCapUpdated with the updateId, market and new borrow cap
     */
    function _updateBorrowCaps(uint256 updateId, address market, uint256 newValue) internal {
        address comptroller = ICorePoolVToken(market).comptroller();
        address[] memory newBorrowCapMarkets = new address[](1);
        newBorrowCapMarkets[0] = market;
        uint256[] memory newBorrowCaps = new uint256[](1);
        newBorrowCaps[0] = newValue;

        //Core and isolated pools share the same `setMarketBorrowCaps` signature,
        ICorePoolComptroller(comptroller).setMarketBorrowCaps(newBorrowCapMarkets, newBorrowCaps);
        emit BorrowCapUpdated(updateId, market, newBorrowCaps[0]);
    }

    /**
     * @notice Decodes ABI-encoded bytes into a uint256.
     * @dev Expects exactly 32 bytes as produced by abi.encode(uint256).
     * @param data ABI-encoded uint256 payload (32 bytes)
     * @return value Decoded uint256
     */
    function _decodeAbiEncodedUint256(bytes memory data) internal pure returns (uint256 value) {
        if (data.length != 32) {
            revert InvalidUintLength();
        }

        value = abi.decode(data, (uint256));
    }
}
