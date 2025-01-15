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

/**
 * @title RiskStewardReceiver
 * @author Venus
 * @notice Contract that can automatically adjust market caps based on risk oracle recommendations
 * @custom:security-contact https://github.com/VenusProtocol/governance-contracts#discussion
 */
contract RiskStewardReceiver is IRiskStewardReceiver, Initializable, Ownable2StepUpgradeable, PausableUpgradeable {
    /**
     * @notice Mapping of supported risk configurations and their validation parameters
     */
    mapping(string updateType => RiskParamConfig) private riskParameterConfigs;

    /**
     * @notice Whitelisted oracle address to receive updates from
     */
    IRiskOracle public immutable RISK_ORACLE;

    /**
     * @notice Address of the CorePool comptroller used for selecting the correct comptroller abi
     */
    ICorePoolComptroller public immutable CORE_POOL_COMPTROLLER;

    /**
     * @notice Mapping of market and update type to last update. Used for debouncing updates.
     */
    mapping(bytes marketUpdateType => uint256) public lastProcessedTime;

    /**
     * @notice Mapping of processed updates. Used to prevent re-execution
     */
    mapping(uint256 updateId => bool) public processedUpdates;

    /**
     * @notice Time before a submitted update is considered stale
     */
    uint256 public constant UPDATE_EXPIRATION_TIME = 1 days;

    /**
     * @notice Event emitted when a risk parameter config is set
     */
    event RiskParameterConfigSet(string updateType, uint256 debounce, uint256 maxIncreaseBps, bool isRelative);

    /**
     * @notice Event emitted when an update is successfully applied
     */
    event RiskParameterUpdated(uint256 updateId);

    /**
     * @notice Flag for if a risk parameter type can be updated by the steward
     */
    error ConfigNotActive();

    /**
     * @notice Error for when an update was not applied within the required timeframe
     */
    error UpdateIsExpired();

    /**
     * @notice Thrown when an update has already been processed
     */
    error ConfigAlreadyProcessed();

    /**
     * @notice Thrown when the debounce period hasn't passed for applying an update to a specific market/ update type
     */
    error UpdateTooFrequent();

    /**
     * @notice Thrown when the new value of an update is our of range
     */
    error UpdateNotInRange();

    /**
     * @notice Thrown when an updateType that is not supported is operated on
     */
    error UnsupportedUpdateType();

    /**
     * @notice Thrown when a debounce value of 0 is set
     */
    error InvalidDebounce();

    /**
     * @notice Thrown when a maxIncreaseBps value of 0 is set
     */
    error InvalidMaxIncreaseBps();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor(address riskOracle_, address corePoolComptroller_) {
        require(riskOracle_ != address(0), "Risk Oracle address must not be zero");
        require(corePoolComptroller_ != address(0), "Core Pool Comptroller address must not be zero");
        RISK_ORACLE = IRiskOracle(riskOracle_);
        CORE_POOL_COMPTROLLER = ICorePoolComptroller(corePoolComptroller_);
        _disableInitializers();
    }

    function initialize() external initializer {
        __Ownable2Step_init();
        __Pausable_init();
    }

    /**
     * @notice Pauses processing of updates
     * @custom:access Only owner
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice auses processing of updates
     * @custom:access Only owner
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Sets the risk parameter config for a given update type
     * @param updateType The type of update to set the config for
     * @param debounce The debounce period for the update
     * @param maxIncreaseBps The max increase bps for the update
     * @param isRelative Whether the max increase bps is relative or absolute
     */
    function setRiskParameterConfig(
        string calldata updateType,
        uint256 debounce,
        uint256 maxIncreaseBps,
        bool isRelative
    ) external onlyOwner {
        if (Strings.equal(updateType, "")) {
            revert UnsupportedUpdateType();
        }
        if (debounce == 0) {
            revert InvalidDebounce();
        }
        if (maxIncreaseBps == 0) {
            revert InvalidMaxIncreaseBps();
        }
        riskParameterConfigs[updateType] = RiskParamConfig({
            active: true,
            debounce: debounce,
            maxIncreaseBps: maxIncreaseBps,
            isRelative: isRelative
        });
        emit RiskParameterConfigSet(
            updateType,
            debounce,
            maxIncreaseBps,
            isRelative
        );
    }

    /**
     * @notice Gets the risk parameter config for a given update type
     * @param updateType The type of update to get the config for
     * @return The risk parameter config for the given update type
     */
    function getRiskParameterConfig(string calldata updateType) external view returns (RiskParamConfig memory) {
        return riskParameterConfigs[updateType];
    }

    /**
     * @notice Toggles the active status of a risk parameter config
     * @param updateType The type of update to toggle the config for
     */
    function toggleConfigActive(string calldata updateType) external onlyOwner {
        // Debounce can't be zero so we are trying to toggle an unsupported update type
        if (riskParameterConfigs[updateType].debounce == 0) {
            revert UnsupportedUpdateType();
        }
        riskParameterConfigs[updateType].active = !riskParameterConfigs[updateType].active;
    }

    /**
     * @notice Processes an update by its ID
     * @param updateId The ID of the update to process
     * @custom:event Emits RiskParameterUpdated with the update ID
     * @custom:error Throws ConfigNotActive if the config is not active
     * @custom:error Throws UpdateIsExpired if the update is expired
     * @custom:error Throws ConfigAlreadyProcessed if the update has already been processed
     * @custom:error Throws UpdateTooFrequent if the update is too frequent
     * @custom:error Throws UpdateNotInRange if the update is not in range
     * @custom:error Throws UnsupportedUpdateType if the update type is not supported
     */
    function processUpdateById(uint256 updateId) external whenNotPaused {
        RiskParameterUpdate memory update = RISK_ORACLE.getUpdateById(updateId);
        _validateUpdateStatus(update);
        _processUpdate(update);
    }

    /**
     * @notice Processes the latest update for a given parameter and market
     * @param updateType The type of update to process
     * @param market The market to process the update for
     */
    function processUpdateByParameterAndMarket(string memory updateType, address market) external whenNotPaused {
        RiskParameterUpdate memory update = RISK_ORACLE.getLatestUpdateByParameterAndMarket(updateType, market);
        _validateUpdateStatus(update);
        _processUpdate(update);
    }

    function _processUpdate(RiskParameterUpdate memory update) internal {
        if (Strings.equal(update.updateType, "MarketSupplyCaps")) {
            _processSupplyCapUpdate(update);
        } else if (Strings.equal(update.updateType, "MarketBorrowCaps")) {
            _processBorrowCapUpdate(update);
        } else {
            revert UnsupportedUpdateType();
        }
        lastProcessedTime[_getMarketUpdateTypeKey(update.market, update.updateType)] = block.timestamp;
        processedUpdates[update.updateId] = true;
        emit RiskParameterUpdated(update.updateId);
    }

    function _getMarketUpdateTypeKey(address market, string memory updateType) internal pure returns (bytes memory) {
        return abi.encodePacked(market, updateType);
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

    function _validateUpdateStatus(RiskParameterUpdate memory update) internal view {
        RiskParamConfig memory config = riskParameterConfigs[update.updateType];

        if (!config.active) {
            revert ConfigNotActive();
        }

        if (update.timestamp + UPDATE_EXPIRATION_TIME < block.timestamp) {
            revert UpdateIsExpired();
        }

        if (processedUpdates[update.updateId]) {
            revert ConfigAlreadyProcessed();
        }

        if (
            block.timestamp - lastProcessedTime[_getMarketUpdateTypeKey(update.market, update.updateType)] <
            config.debounce
        ) {
            revert UpdateTooFrequent();
        }
    }

    function _validateSupplyCapUpdate(RiskParameterUpdate memory update) internal view {
        RiskParamConfig memory config = riskParameterConfigs[update.updateType];

        ICorePoolComptroller comptroller = ICorePoolComptroller(IVToken(update.market).comptroller());
        uint256 currentSupplyCap = comptroller.supplyCaps(address(update.market));

        uint256 newValue = uint256(bytes32(update.newValue));
        _updateWithinAllowedRange(currentSupplyCap, newValue, config.maxIncreaseBps, config.isRelative);
    }

    function _validateBorrowCapUpdate(RiskParameterUpdate memory update) internal view {
        RiskParamConfig memory config = riskParameterConfigs[update.updateType];

        ICorePoolComptroller comptroller = ICorePoolComptroller(IVToken(update.market).comptroller());
        uint256 currentBorrowCap = comptroller.borrowCaps(address(update.market));

        uint256 newValue = uint256(bytes32(update.newValue));
        _updateWithinAllowedRange(currentBorrowCap, newValue, config.maxIncreaseBps, config.isRelative);
    }

    /**
     * @notice Ensures the risk param update is within the allowed range
     * @param previousValue current risk param value
     * @param newValue new updated risk param value
     * @param maxIncreaseBps the max bps change allowed
     * @param isRelative true, if maxPercentChange is relative in value, false if maxPercentChange
     *        is absolute in value.
     * @return bool true, if difference is within the maxPercentChange
     */
    function _updateWithinAllowedRange(
        uint256 previousValue,
        uint256 newValue,
        uint256 maxIncreaseBps,
        bool isRelative
    ) internal pure returns (bool) {
        if (newValue < previousValue) {
            revert UpdateNotInRange();
        }

        uint256 diff = newValue - previousValue;

        uint256 maxDiff = isRelative ? (maxIncreaseBps * previousValue) / 10000 : maxIncreaseBps;

        if (diff > maxDiff) {
            revert UpdateNotInRange();
        }
    }

    uint256[50] private __gap;
}
