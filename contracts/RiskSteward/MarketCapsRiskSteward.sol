// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.25;

import { Strings } from "@openzeppelin/contracts/utils/Strings.sol";
import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { Ownable2StepUpgradeable } from "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";
import { RiskParameterUpdate } from "../interfaces/IRiskOracle.sol";
import { IVToken } from "../interfaces/IVToken.sol";
import { ICorePoolComptroller } from "../interfaces/ICorePoolComptroller.sol";
import { IIsolatedPoolsComptroller } from "../interfaces/IIsolatedPoolsComptroller.sol";
import { IRiskStewardReceiver } from "./IRiskStewardReceiver.sol";
import { AccessControlledV8 } from "../Governance/AccessControlledV8.sol";
import { IRiskSteward } from "./IRiskSteward.sol";
import { ensureNonzeroAddress } from "@venusprotocol/solidity-utilities/contracts/validators.sol";

/**
 * @title MarketCapsRiskSteward
 * @author Venus
 * @notice Contract that can update supply and borrow caps received from RiskStewardReceiver. Requires that the update is within the max delta.
 * Expects the new value to be an encoded uint256 value of un padded bytes.
 * @custom:security-contact https://github.com/VenusProtocol/governance-contracts#discussion
 */
contract MarketCapsRiskSteward is IRiskSteward, Initializable, Ownable2StepUpgradeable, AccessControlledV8 {
    /**
     * @notice The max delta bps for the update relative to the current value
     */
    uint256 public maxDeltaBps;

    /**
     * @notice Address of the CorePoolComptroller used for selecting the correct comptroller abi
     */
    ICorePoolComptroller public immutable CORE_POOL_COMPTROLLER;

    /**
     * @notice Address of the RiskStewardReceiver used to validate incoming updates
     */
    IRiskStewardReceiver public immutable RISK_STEWARD_RECEIVER;

    /**
     * @notice The update type for supply caps
     */
    string public constant SUPPLY_CAP = "supplyCap";

    /**
     * @notice The update type for borrow caps
     */
    string public constant BORROW_CAP = "borrowCap";

    /**
     * @notice Emitted when a supply cap is updated
     */
    event SupplyCapUpdated(address market, uint256 newSupplyCap);

    /**
     * @notice Emitted when a borrow cap is updated
     */
    event BorrowCapUpdated(address market, uint256 newBorrowCap);

    /**
     * @notice Emitted when the max delta bps is updated
     */
    event MaxDeltaBpsUpdated(uint256 oldMaxDeltaBps, uint256 newMaxDeltaBps);

    /**
     * @notice Thrown when a maxDeltaBps value of 0 is set
     */
    error InvalidMaxDeltaBps();

    /**
     * @notice Thrown when an update type that is not supported is operated on
     */
    error UnsupportedUpdateType();

    /**
     * @notice Thrown when the new value of an update is out of range
     */
    error UpdateNotInRange();

    /**
     * @notice Thrown when the update is not coming from the RiskStewardReceiver
     */
    error OnlyRiskStewardReceiver();

    /**
     * @dev Sets the immutable CorePoolComptroller and RiskStewardReceiver addresses and disables initializers
     * @param corePoolComptroller_ The address of the CorePoolComptroller
     * @param riskStewardReceiver_ The address of the RiskStewardReceiver
     * @custom:error Throws ZeroAddressNotAllowed if the CorePoolComptroller or RiskStewardReceiver addresses are zero
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
     * @dev Initializes the contract as ownable, access controlled, and pausable. Sets the max delta bps initial value.
     * @param accessControlManager_ The address of the access control manager
     * @param maxDeltaBps_ The max detla bps
     * @custom:error Throws InvalidMaxDeltaBps if the max delta bps is 0
     */
    function initialize(address accessControlManager_, uint256 maxDeltaBps_) external initializer {
        __Ownable2Step_init();
        __AccessControlled_init_unchained(accessControlManager_);
        if (maxDeltaBps_ == 0) {
            revert InvalidMaxDeltaBps();
        }
        maxDeltaBps = maxDeltaBps_;
    }

    /**
     * @notice Sets the max delta bps
     * @param maxDeltaBps_ The new max delta bps
     * @custom:event Emits MaxDeltaBpsUpdated with the old and new max delta bps
     * @custom:error InvalidMaxDeltaBps if the max delta bps is 0
     * @custom:access Controlled by AccessControlManager
     */
    function setMaxDeltaBps(uint256 maxDeltaBps_) external {
        _checkAccessAllowed("setMaxDeltaBps(uint256)");
        if (maxDeltaBps_ == 0) {
            revert InvalidMaxDeltaBps();
        }
        emit MaxDeltaBpsUpdated(maxDeltaBps, maxDeltaBps_);
        maxDeltaBps = maxDeltaBps_;
    }

    /**
     * @notice Processes a market cap update from the RiskStewardReceiver.
     * Validates that the update is within range and then directly update the market supply or borrow cap on the market's comptroller.
     * @param update RiskParameterUpdate update to process.
     * @custom:error OnlyRiskStewardReceiver Thrown if the sender is not the RiskStewardReceiver
     * @custom:error UnsupportedUpdateType Thrown if the update type is not supported
     * @custom:error UpdateNotInRange Thrown if the update is not within the allowed range
     * @custom:event Emits SupplyCapUpdated or BorrowCapUpdated depending on the update with the market and new cap
     * @custom:access Only callable by the RiskStewardReceiver
     */
    function processUpdate(RiskParameterUpdate calldata update) external {
        if (msg.sender != address(RISK_STEWARD_RECEIVER)) {
            revert OnlyRiskStewardReceiver();
        }
        if (Strings.equal(update.updateType, SUPPLY_CAP)) {
            _processSupplyCapUpdate(update);
        } else if (Strings.equal(update.updateType, BORROW_CAP)) {
            _processBorrowCapUpdate(update);
        } else {
            revert UnsupportedUpdateType();
        }
    }

    /**
     * @notice Updates the supply cap for the given market.
     * @param market The market to update the supply cap for
     * @param newValue The new supply cap value
     * @custom:event Emits SupplyCapUpdated with the market and new supply cap
     */
    function _updateSupplyCaps(address market, bytes memory newValue) internal {
        address comptroller = IVToken(market).comptroller();
        address[] memory newSupplyCapMarkets = new address[](1);
        newSupplyCapMarkets[0] = market;
        uint256[] memory newSupplyCaps = new uint256[](1);
        newSupplyCaps[0] = _decodeBytesToUint256(newValue);
        if (comptroller == address(CORE_POOL_COMPTROLLER)) {
            ICorePoolComptroller(comptroller)._setMarketSupplyCaps(newSupplyCapMarkets, newSupplyCaps);
        } else {
            IIsolatedPoolsComptroller(comptroller).setMarketSupplyCaps(newSupplyCapMarkets, newSupplyCaps);
        }
        emit SupplyCapUpdated(market, newSupplyCaps[0]);
    }

    /**
     * @notice Updates the borrow cap for the given market.
     * @param market The market to update the borrow cap for
     * @param newValue The new borrow cap value
     * @custom:event Emits BorrowCapUpdated with the market and new borrow cap
     */
    function _updateBorrowCaps(address market, bytes memory newValue) internal {
        address comptroller = IVToken(market).comptroller();
        address[] memory newBorrowCapMarkets = new address[](1);
        newBorrowCapMarkets[0] = market;
        uint256[] memory newBorrowCaps = new uint256[](1);
        newBorrowCaps[0] = _decodeBytesToUint256(newValue);
        if (comptroller == address(CORE_POOL_COMPTROLLER)) {
            ICorePoolComptroller(comptroller)._setMarketBorrowCaps(newBorrowCapMarkets, newBorrowCaps);
        } else {
            IIsolatedPoolsComptroller(comptroller).setMarketBorrowCaps(newBorrowCapMarkets, newBorrowCaps);
        }
        emit BorrowCapUpdated(market, newBorrowCaps[0]);
    }

    /**
     * @notice Validates the new supply cap and if valid, updates the supply cap for the given market.
     * @param update RiskParameterUpdate update to process
     * @custom:event Emits SupplyCapUpdated with the market and new supply cap
     */
    function _processSupplyCapUpdate(RiskParameterUpdate memory update) internal {
        _validateSupplyCapUpdate(update);
        _updateSupplyCaps(update.market, update.newValue);
    }

    /**
     * @notice Validates the new borrow cap and if valid, updates the borrow cap for the given market.
     * @param update RiskParameterUpdate update to process
     * @custom:event Emits BorrowCapUpdated with the market and new borrow cap
     */
    function _processBorrowCapUpdate(RiskParameterUpdate memory update) internal {
        _validateBorrowCapUpdate(update);
        _updateBorrowCaps(update.market, update.newValue);
    }

    /**
     * @notice Checks that the new supply cap is within the allowed range of the current supply cap.
     * @param update RiskParameterUpdate update to validate
     * @custom:error UpdateNotInRange if the update is not within the allowed range
     */
    function _validateSupplyCapUpdate(RiskParameterUpdate memory update) internal view {
        ICorePoolComptroller comptroller = ICorePoolComptroller(IVToken(update.market).comptroller());
        uint256 currentSupplyCap = comptroller.supplyCaps(address(update.market));

        uint256 newValue = _decodeBytesToUint256(update.newValue);
        _updateWithinAllowedRange(currentSupplyCap, newValue);
    }

    /**
     * @notice Checks that the new borrow cap is within the allowed range of the current borrow cap.
     * @param update The update to validate
     * @custom:error UpdateNotInRange if the update is not within the allowed range
     */
    function _validateBorrowCapUpdate(RiskParameterUpdate memory update) internal view {
        ICorePoolComptroller comptroller = ICorePoolComptroller(IVToken(update.market).comptroller());
        uint256 currentBorrowCap = comptroller.borrowCaps(address(update.market));

        uint256 newValue = _decodeBytesToUint256(update.newValue);
        _updateWithinAllowedRange(currentBorrowCap, newValue);
    }

    /**
     * @notice Ensures the risk param update is within the allowed range
     * @param previousValue current risk param value
     * @param newValue new updated risk param value
     * @custom:error UpdateNotInRange if the update is not within the allowed range
     */
    function _updateWithinAllowedRange(uint256 previousValue, uint256 newValue) internal view {
        uint256 diff = newValue > previousValue ? newValue - previousValue : previousValue - newValue;

        uint256 maxDiff = (maxDeltaBps * previousValue) / 10000;

        if (diff > maxDiff) {
            revert UpdateNotInRange();
        }
    }

    /**
     * @notice Decodes un-padded bytes to a uint256
     * @param data The un-padded bytes to decode
     * @return uint256 The decoded uint256
     */
    function _decodeBytesToUint256(bytes memory data) internal pure returns (uint256) {
        return abi.decode(abi.encodePacked(new bytes(32 - data.length), data), (uint256));
    }
}
