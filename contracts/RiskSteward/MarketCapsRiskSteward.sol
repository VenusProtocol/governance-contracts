// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.25;

import { Strings } from "@openzeppelin/contracts/utils/Strings.sol";
import { IVToken } from "../interfaces/IVToken.sol";
import { ICorePoolComptroller } from "../interfaces/ICorePoolComptroller.sol";
import { IIsolatedPoolsComptroller } from "../interfaces/IIsolatedPoolsComptroller.sol";
import { CriticalParamRiskStewardBase } from "./CriticalParamRiskStewardBase.sol";

/**
 * @title MarketCapsRiskSteward
 * @author Venus
 * @notice Contract that can update supply and borrow caps received from RiskStewardReceiver. Requires that the update is within the max delta.
 * Expects the new value to be an encoded uint256 value of un padded bytes.
 * @custom:security-contact https://github.com/VenusProtocol/governance-contracts#discussion
 */
contract MarketCapsRiskSteward is CriticalParamRiskStewardBase {
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
    event SupplyCapUpdated(address indexed market, uint256 indexed newSupplyCap);

    /**
     * @notice Emitted when a borrow cap is updated
     */
    event BorrowCapUpdated(address indexed market, uint256 indexed newBorrowCap);

    /**
     * @dev Sets the immutable CorePoolComptroller and RiskStewardReceiver addresses and disables initializers
     * @param riskStewardReceiver_ The address of the RiskStewardReceiver
     * @param corePoolComptroller_ The address of the corePoolComptroller
     * @custom:error Throws ZeroAddressNotAllowed if the CorePoolComptroller or RiskStewardReceiver addresses are zero
     * @custom:oz-upgrades-unsafe-allow constructor
     */
    constructor(
        address riskStewardReceiver_,
        address corePoolComptroller_
    ) CriticalParamRiskStewardBase(riskStewardReceiver_, corePoolComptroller_) {}

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
        __CriticalParamRiskStewardBase_init(accessControlManager_, maxDeltaBps_, debouncePeriod_);
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
            revert UpdateAlreadyProcessed(updateId);
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
}
