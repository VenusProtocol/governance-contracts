// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.25;

import { Strings } from "@openzeppelin/contracts/utils/Strings.sol";
import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { Ownable2StepUpgradeable } from "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";
import { IRiskSteward } from "./IRiskSteward.sol";
import { IRiskOracle, RiskParameterUpdate } from "../interfaces/IRiskOracle.sol";
import { IVToken } from "../interfaces/IVToken.sol";
import { ICorePoolComptroller } from "../interfaces/ICorePoolComptroller.sol";
import { IIsolatedPoolsComptroller } from "../interfaces/IIsolatedPoolsComptroller.sol";
import { IRiskStewardReceiver, RiskParamConfig } from "./IRiskStewardReceiver.sol";
import { PausableUpgradeable } from "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import { AccessControlledV8 } from "../Governance/AccessControlledV8.sol";
import { ensureNonzeroAddress } from "@venusprotocol/solidity-utilities/contracts/validators.sol";

/**
 * @title RiskStewardReceiver
 * @author Venus
 * @notice Contract that can receive updates from the risk oracle and then validate and push them to the correct RiskSteward
 * @custom:security-contact https://github.com/VenusProtocol/governance-contracts#discussion
 */
contract RiskStewardReceiver is
    IRiskStewardReceiver,
    Initializable,
    Ownable2StepUpgradeable,
    PausableUpgradeable,
    AccessControlledV8
{
    /**
     * @notice Mapping of supported risk configurations and their validation parameters
     */
    mapping(string updateType => RiskParamConfig) public riskParameterConfigs;

    /**
     * @notice Whitelisted oracle address to receive updates from
     */
    IRiskOracle public immutable RISK_ORACLE;

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

    uint256[50] private __gap;

    /**
     * @notice Event emitted when a risk parameter config is set
     */
    event RiskParameterConfigSet(string indexed updateType, address indexed previousRiskSteward, address indexed riskSteward, uint256 previousDebounce, uint256 debounce, bool previousActive, bool active);

    /**
     * @notice Event emitted when a risk parameter config is toggled
     */
    event ToggleConfigActive(string indexed updateType, bool active);

    /**
     * @notice Event emitted when an update is successfully applied
     */
    event RiskParameterUpdated(uint256 indexed updateId);

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
     * @notice Thrown when an updateType that is not supported is operated on
     */
    error UnsupportedUpdateType();

    /**
     * @notice Thrown when a debounce value of 0 is set
     */
    error InvalidDebounce();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor(address riskOracle_) {
        ensureNonzeroAddress(riskOracle_);
        RISK_ORACLE = IRiskOracle(riskOracle_);
        _disableInitializers();
    }

    function initialize(address accessControlManager_) external initializer {
        __Ownable2Step_init();
        __Pausable_init();
        __AccessControlled_init_unchained(accessControlManager_);
    }

    /**
     * @notice Pauses processing of updates
     * @custom:access Controlled by AccessControlManager
     */
    function pause() external {
        _checkAccessAllowed("pause()");
        _pause();
    }

    /**
     * @notice Unpauses processing of updates
     * @custom:access Controlled by AccessControlManager
     */
    function unpause() external {
        _checkAccessAllowed("unpause()");
        _unpause();
    }

    /**
     * @notice Sets the risk parameter config for a given update type
     * @param updateType The type of update to set the config for
     * @param debounce The debounce period for the update
     * @custom:access Controlled by AccessControlManager
     */
    function setRiskParameterConfig(string calldata updateType, address riskSteward, uint256 debounce) external {
        _checkAccessAllowed("setRiskParameterConfig(string,address,uint256)");
        if (Strings.equal(updateType, "")) {
            revert UnsupportedUpdateType();
        }
        if (debounce == 0) {
            revert InvalidDebounce();
        }
        RiskParamConfig memory previousConfig = riskParameterConfigs[updateType];
        riskParameterConfigs[updateType] = RiskParamConfig({
            active: true,
            riskSteward: riskSteward,
            debounce: debounce
        });
        emit RiskParameterConfigSet(updateType, previousConfig.riskSteward, riskSteward, previousConfig.debounce, debounce, previousConfig.active, true);
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
    function toggleConfigActive(string calldata updateType) external {
        _checkAccessAllowed("toggleConfigActive(string)");

        if (riskParameterConfigs[updateType].riskSteward == address(0)) {
            revert UnsupportedUpdateType();
        }

        riskParameterConfigs[updateType].active = !riskParameterConfigs[updateType].active;
        emit ToggleConfigActive(updateType, riskParameterConfigs[updateType].active);
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
        IRiskSteward(riskParameterConfigs[update.updateType].riskSteward).processUpdate(update);
        lastProcessedTime[_getMarketUpdateTypeKey(update.market, update.updateType)] = block.timestamp;
        processedUpdates[update.updateId] = true;
        emit RiskParameterUpdated(update.updateId);
    }

    function _getMarketUpdateTypeKey(address market, string memory updateType) internal pure returns (bytes memory) {
        return abi.encodePacked(market, updateType);
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

    /**
     * @dev Disabling renounceOwnership function.
     */
    function renounceOwnership() public override {}
}
