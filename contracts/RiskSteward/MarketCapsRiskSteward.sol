// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.25;

import { Strings } from "@openzeppelin/contracts/utils/Strings.sol";
import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { Ownable2StepUpgradeable } from "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";
import { IRiskOracle, RiskParameterUpdate } from "../interfaces/IRiskOracle.sol";
import { IVToken } from "../interfaces/IVToken.sol";
import { ICorePoolComptroller } from "../interfaces/ICorePoolComptroller.sol";
import { IIsolatedPoolsComptroller } from "../interfaces/IIsolatedPoolsComptroller.sol";
import { IRiskStewardReceiver, RiskParamConfig } from "./IRiskStewardReceiver.sol";
import { PausableUpgradeable } from "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import { AccessControlledV8 } from "../Governance/AccessControlledV8.sol";
import { IRiskSteward } from "./IRiskSteward.sol";

/**
 * @title MarketCapsRiskSteward
 * @author Venus
 * @notice Contract that can update supply and borrow caps received from RiskStewardReceiver
 * @custom:security-contact https://github.com/VenusProtocol/governance-contracts#discussion
 */
contract MarketCapsRiskSteward is IRiskSteward, Initializable, Ownable2StepUpgradeable, AccessControlledV8 {
    /**
     * @notice The max increase bps for the update relative to the current value
     */
    uint256 public maxIncreaseBps;

    /**
     * @notice Address of the CorePool comptroller used for selecting the correct comptroller abi
     */
    ICorePoolComptroller public immutable CORE_POOL_COMPTROLLER;
    /**
     * @notice Emitted when a supply cap is updated
     */
    event SupplyCapUpdated(address market, uint256 newSupplyCap);

    /**
     * @notice Emitted when a borrow cap is updated
     */
    event BorrowCapUpdated(address market, uint256 newBorrowCap);

    /**
     * @notice Thrown when a maxIncreaseBps value of 0 is set
     */
    error InvalidMaxIncreaseBps();

    /**
     * @notice Thrown when an updateType that is not supported is operated on
     */
    error UnsupportedUpdateType();

    /**
     * @notice Thrown when the new value of an update is our of range
     */
    error UpdateNotInRange();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor(address corePoolComptroller_) {
        require(corePoolComptroller_ != address(0), "Core Pool Comptroller address must not be zero");
        CORE_POOL_COMPTROLLER = ICorePoolComptroller(corePoolComptroller_);
        _disableInitializers();
    }

    function initialize(address accessControlManager_, uint256 maxIncreaseBps_) external initializer {
        __Ownable2Step_init();
        __AccessControlled_init_unchained(accessControlManager_);
        if (maxIncreaseBps_ == 0) {
            revert InvalidMaxIncreaseBps();
        }
        maxIncreaseBps = maxIncreaseBps_;
    }

    function setMaxIncreaseBps(uint256 maxIncreaseBps_) external {
        _checkAccessAllowed("setMaxIncreaseBps(uint256)");
        if (maxIncreaseBps_ == 0) {
            revert InvalidMaxIncreaseBps();
        }
        maxIncreaseBps = maxIncreaseBps_;
    }

    /**
     * @notice
     * @param update
     */
    function processUpdate(RiskParameterUpdate calldata update) external {
        _checkAccessAllowed("processUpdate(RiskParameterUpdate)");
        if (Strings.equal(update.updateType, "MarketSupplyCap")) {
            _processSupplyCapUpdate(update);
        } else if (Strings.equal(update.updateType, "MarketBorrowCap")) {
            _processBorrowCapUpdate(update);
        } else {
            revert UnsupportedUpdateType();
        }
    }

    function _updateSupplyCaps(address market, bytes memory newValue) internal {
        address comptroller = IVToken(market).comptroller();
        address[] memory newSupplyCapMarkets = new address[](1);
        newSupplyCapMarkets[0] = market;
        uint256[] memory newSupplyCaps = new uint256[](1);

        newSupplyCaps[0] = uint256(bytes32(newValue));
        if (comptroller == address(CORE_POOL_COMPTROLLER)) {
            ICorePoolComptroller(comptroller)._setMarketSupplyCaps(newSupplyCapMarkets, newSupplyCaps);
        } else {
            IIsolatedPoolsComptroller(comptroller).setMarketSupplyCaps(newSupplyCapMarkets, newSupplyCaps);
        }
    }

    function _updateBorrowCaps(address market, bytes memory newValue) internal {
        address comptroller = IVToken(market).comptroller();
        address[] memory newBorrowCapMarkets = new address[](1);
        newBorrowCapMarkets[0] = market;
        uint256[] memory newBorrowCaps = new uint256[](1);
        newBorrowCaps[0] = uint256(bytes32(newValue));
        if (comptroller == address(CORE_POOL_COMPTROLLER)) {
            ICorePoolComptroller(comptroller)._setMarketBorrowCaps(newBorrowCapMarkets, newBorrowCaps);
        } else {
            IIsolatedPoolsComptroller(comptroller).setMarketBorrowCaps(newBorrowCapMarkets, newBorrowCaps);
        }
    }

    function _processSupplyCapUpdate(RiskParameterUpdate memory update) internal {
        _validateSupplyCapUpdate(update);
        _updateSupplyCaps(update.market, update.newValue);
    }

    function _processBorrowCapUpdate(RiskParameterUpdate memory update) internal {
        _validateBorrowCapUpdate(update);
        _updateBorrowCaps(update.market, update.newValue);
    }

    function _validateSupplyCapUpdate(RiskParameterUpdate memory update) internal view {
        ICorePoolComptroller comptroller = ICorePoolComptroller(IVToken(update.market).comptroller());
        uint256 currentSupplyCap = comptroller.supplyCaps(address(update.market));

        uint256 newValue = abi.decode(
            abi.encodePacked(new bytes(32 - update.newValue.length), update.newValue),
            (uint256)
        );
        _updateWithinAllowedRange(currentSupplyCap, newValue);
    }

    function _validateBorrowCapUpdate(RiskParameterUpdate memory update) internal view {
        ICorePoolComptroller comptroller = ICorePoolComptroller(IVToken(update.market).comptroller());
        uint256 currentBorrowCap = comptroller.borrowCaps(address(update.market));

        uint256 newValue = abi.decode(
            abi.encodePacked(new bytes(32 - update.newValue.length), update.newValue),
            (uint256)
        );
        _updateWithinAllowedRange(currentBorrowCap, newValue);
    }

    /**
     * @notice Ensures the risk param update is within the allowed range
     * @param previousValue current risk param value
     * @param newValue new updated risk param value
     * @return bool true, if difference is within the maxPercentChange
     */
    function _updateWithinAllowedRange(uint256 previousValue, uint256 newValue) internal view returns (bool) {
        if (newValue < previousValue) {
            revert UpdateNotInRange();
        }

        uint256 diff = newValue - previousValue;

        uint256 maxDiff = (maxIncreaseBps * previousValue) / 10000;

        if (diff > maxDiff) {
            revert UpdateNotInRange();
        }
    }
}
