// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.25;

import { RiskParameterUpdate } from "./Interfaces/IRiskOracle.sol";
import { IVToken } from "../interfaces/IVToken.sol";
import { ICorePoolComptroller } from "../interfaces/ICorePoolComptroller.sol";
import { IRiskStewardReceiver } from "./Interfaces/IRiskStewardReceiver.sol";
import { AccessControlledV8 } from "../Governance/AccessControlledV8.sol";
import { IRiskSteward } from "./Interfaces/IRiskSteward.sol";
import { ensureNonzeroAddress } from "@venusprotocol/solidity-utilities/contracts/validators.sol";

/**
 * @title MarketCapsRiskSteward
 * @author Venus
 * @notice Contract that can update supply and borrow caps received from RiskStewardReceiver.
 * @custom:security-contact https://github.com/VenusProtocol/governance-contracts#discussion
 */
contract MarketCapsRiskSteward is IRiskSteward, AccessControlledV8 {
    /// @dev Max basis points i.e., 100%
    uint256 private constant MAX_BPS = 10000;

    /**
     * @notice The safe delta threshold in basis points. Updates within this delta are considered safe and require no timelock.
     * Updates exceeding this delta require timelock.
     */
    uint256 public safeDeltaBps;

    /**
     * @notice Address of the RiskStewardReceiver used to validate incoming updates
     */
    IRiskStewardReceiver public immutable RISK_STEWARD_RECEIVER;

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
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[49] private __gap;

    /**
     * @notice Emitted when a supply cap is updated
     */
    event SupplyCapUpdated(address indexed market, uint256 indexed newSupplyCap);

    /**
     * @notice Emitted when a borrow cap is updated
     */
    event BorrowCapUpdated(address indexed market, uint256 indexed newBorrowCap);

    /**
     * @notice Emitted when the safe delta bps is updated
     */
    event SafeDeltaBpsUpdated(uint256 indexed oldSafeDeltaBps, uint256 indexed newSafeDeltaBps);

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
     * @notice Thrown when trying to renounce ownership
     */
    error RenounceOwnershipNotAllowed();

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
     * @notice Sets the safe delta bps
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
     * @notice Checks if an update is safe for direct execution (no timelock required)
     * @param update The update to check
     * @return True if update is safe for direct execution, false if timelock is required
     * @custom:error Throws UnsupportedUpdateType if the update type is not supported
     */
    function isSafeForDirectExecution(RiskParameterUpdate calldata update) external view returns (bool) {
        uint256 newValue = _decodeAbiEncodedUint256(update.newValue);
        ICorePoolComptroller comptroller = ICorePoolComptroller(IVToken(update.market).comptroller());
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
     * @notice Processes a market cap update from the RiskStewardReceiver.
     * Directly updates the market supply or borrow cap on the market's comptroller.
     * Delta validation is already performed by RiskStewardReceiver before execution.
     * @param update RiskParameterUpdate update to process
     * @custom:error Throws OnlyRiskStewardReceiver if the sender is not the RiskStewardReceiver
     * @custom:error Throws UnsupportedUpdateType if the update type is not supported
     * @custom:event Emits SupplyCapUpdated or BorrowCapUpdated depending on the update with the market and new cap
     * @custom:access Only callable by the RiskStewardReceiver
     */
    function processUpdate(RiskParameterUpdate calldata update) external {
        if (msg.sender != address(RISK_STEWARD_RECEIVER)) {
            revert OnlyRiskStewardReceiver();
        }
        uint256 newValue = _decodeAbiEncodedUint256(update.newValue);

        if (update.updateTypeKey == SUPPLY_CAP_KEY) {
            _updateSupplyCaps(update.market, newValue);
        } else if (update.updateTypeKey == BORROW_CAP_KEY) {
            _updateBorrowCaps(update.market, newValue);
        } else {
            revert UnsupportedUpdateType();
        }
    }

    /**
     * @notice Updates the supply cap for the given market.
     * @dev Core and isolated pools share the same `setMarketSupplyCaps` signature, so the isolated comptroller
     *      interface is used for both.
     * @param market The market to update the supply cap for
     * @param newValue The new supply cap value
     * @custom:event Emits SupplyCapUpdated with the market and new supply cap
     */
    function _updateSupplyCaps(address market, uint256 newValue) internal {
        address comptroller = IVToken(market).comptroller();
        address[] memory newSupplyCapMarkets = new address[](1);
        newSupplyCapMarkets[0] = market;
        uint256[] memory newSupplyCaps = new uint256[](1);
        newSupplyCaps[0] = newValue;

        ICorePoolComptroller(comptroller).setMarketSupplyCaps(newSupplyCapMarkets, newSupplyCaps);

        emit SupplyCapUpdated(market, newSupplyCaps[0]);
    }

    /**
     * @notice Updates the borrow cap for the given market.
     * @dev Core and isolated pools share the same `setMarketBorrowCaps` signature, so the isolated comptroller
     *      interface is used for both.
     * @param market The market to update the borrow cap for
     * @param newValue The new borrow cap value
     * @custom:event Emits BorrowCapUpdated with the market and new borrow cap
     */
    function _updateBorrowCaps(address market, uint256 newValue) internal {
        address comptroller = IVToken(market).comptroller();
        address[] memory newBorrowCapMarkets = new address[](1);
        newBorrowCapMarkets[0] = market;
        uint256[] memory newBorrowCaps = new uint256[](1);
        newBorrowCaps[0] = newValue;

        ICorePoolComptroller(comptroller).setMarketBorrowCaps(newBorrowCapMarkets, newBorrowCaps);

        emit BorrowCapUpdated(market, newBorrowCaps[0]);
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

    /**
     * @notice Disables renounceOwnership function
     * @custom:error Throws RenounceOwnershipNotAllowed
     */
    function renounceOwnership() public override {
        revert RenounceOwnershipNotAllowed();
    }
}
