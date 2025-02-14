// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.25;

import { Strings } from "@openzeppelin/contracts/utils/Strings.sol";
import { IRiskSteward } from "./IRiskSteward.sol";
import { IRiskOracle, RiskParameterUpdate } from "../interfaces/IRiskOracle.sol";
import { ICorePoolComptroller } from "../interfaces/ICorePoolComptroller.sol";
import { IIsolatedPoolsComptroller } from "../interfaces/IIsolatedPoolsComptroller.sol";
import { IRiskStewardReceiver, RiskParamConfig } from "./IRiskStewardReceiver.sol";
import { PausableUpgradeable } from "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import { AccessControlledV8 } from "../Governance/AccessControlledV8.sol";
import { ensureNonzeroAddress } from "@venusprotocol/solidity-utilities/contracts/validators.sol";

/**
 * @title RiskStewardReceiver
 * @author Venus
 * @notice Contract that can read updates from the Chaos Labs Risk Oracle, validate them, and push them to the correct RiskSteward.
 * @custom:security-contact https://github.com/VenusProtocol/governance-contracts#discussion
 */
contract RiskStewardReceiver is IRiskStewardReceiver, PausableUpgradeable, AccessControlledV8 {
    /**
     * @notice Mapping of supported risk configurations and their validation parameters
     */
    mapping(string updateType => RiskParamConfig) public riskParameterConfigs;

    /**
     * @notice Whitelisted oracle address to receive updates from
     */
    IRiskOracle public immutable RISK_ORACLE;

    /**
     * @notice Mapping of market and update type to last update timestamp. Used for debouncing updates.
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
    event RiskParameterConfigSet(
        string updateType,
        address indexed previousRiskSteward,
        address indexed riskSteward,
        uint256 previousDebounce,
        uint256 debounce,
        bool previousActive,
        bool active
    );

    /**
     * @notice Event emitted when a risk parameter config is toggled on or off
     */
    event ToggleConfigActive(string updateType, bool active);

    /**
     * @notice Event emitted when an update is successfully processed
     */
    event RiskParameterUpdated(uint256 indexed updateId);

    /**
     * @notice Thrown if a submitted update is not active and therefor cannot be processed
     */
    error ConfigNotActive();

    /**
     * @notice Thrown when an update was not applied within the required time frame
     */
    error UpdateIsExpired();

    /**
     * @notice Thrown when an update has already been processed
     */
    error ConfigAlreadyProcessed();

    /**
     * @notice Thrown when the debounce period hasn't passed for applying an update to a specific market / update type
     */
    error UpdateTooFrequent();

    /**
     * @notice Thrown when an update type that is not supported is operated on
     */
    error UnsupportedUpdateType();

    /**
     * @notice Thrown when a debounce value of 0 is set
     */
    error InvalidDebounce();

    /**
     * @dev Sets the immutable risk oracle address and disables initializers
     * @custom:error Throws ZeroAddressNotAllowed if the risk oracle address is zero
     * @custom:oz-upgrades-unsafe-allow constructor
     */
    constructor(address riskOracle_) {
        ensureNonzeroAddress(riskOracle_);
        RISK_ORACLE = IRiskOracle(riskOracle_);
        _disableInitializers();
    }

    /**
     * @notice Initializes the contract as ownable, pausable, and access controlled
     * @param accessControlManager_ The address of the access control manager
     */
    function initialize(address accessControlManager_) external initializer {
        __Pausable_init();
        __AccessControlled_init(accessControlManager_);
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
     * @param updateType The type of update to configure
     * @param riskSteward The address for the risk steward contract responsible for processing the update
     * @param debounce The debounce period for the update
     * @custom:access Controlled by AccessControlManager
     * @custom:event Emits RiskParameterConfigSet with the update type, previous risk steward, new risk steward, previous debounce, new debounce, previous active status, and new active status
     * @custom:error Throws UnsupportedUpdateType if the update type is an empty string
     * @custom:error Throws InvalidDebounce if the debounce is 0
     * @custom:error Throws ZeroAddressNotAllowed if the risk steward address is zero
     */
    function setRiskParameterConfig(string calldata updateType, address riskSteward, uint256 debounce) external {
        _checkAccessAllowed("setRiskParameterConfig(string,address,uint256)");
        if (Strings.equal(updateType, "")) {
            revert UnsupportedUpdateType();
        }
        if (debounce == 0 || debounce <= UPDATE_EXPIRATION_TIME) {
            revert InvalidDebounce();
        }
        ensureNonzeroAddress(riskSteward);
        RiskParamConfig memory previousConfig = riskParameterConfigs[updateType];
        riskParameterConfigs[updateType] = RiskParamConfig({
            active: true,
            riskSteward: riskSteward,
            debounce: debounce
        });
        emit RiskParameterConfigSet(
            updateType,
            previousConfig.riskSteward,
            riskSteward,
            previousConfig.debounce,
            debounce,
            previousConfig.active,
            true
        );
    }

    /**
     * @notice Toggles the active status of a risk parameter config
     * @param updateType The type of update to toggle on or off
     * @custom:access Controlled by AccessControlManager
     * @custom:event Emits ToggleConfigActive with the update type and the new active status
     * @custom:error Throws UnsupportedUpdateType if the update type is not supported
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
     * @notice Processes an update by its ID. Will validate that the update configuration is active, is not expired, unprocessed, and that the debounce period has passed.
     * Validated updates will be processed by the associated risk steward contract which will perform update specific validations and apply validated updates.
     * @param updateId The ID of the update to process
     * @custom:event Emits RiskParameterUpdated with the update ID
     * @custom:error Throws ConfigNotActive if the config is not active
     * @custom:error Throws UpdateIsExpired if the update is expired
     * @custom:error Throws ConfigAlreadyProcessed if the update has already been processed
     * @custom:error Throws UpdateTooFrequent if the update is too frequent
     */
    function processUpdateById(uint256 updateId) external whenNotPaused {
        RiskParameterUpdate memory update = RISK_ORACLE.getUpdateById(updateId);
        bytes memory marketUpdateTypeKey = _getMarketUpdateTypeKey(update.market, update.updateType);
        _validateUpdateStatus(update, marketUpdateTypeKey);
        _processUpdate(update, marketUpdateTypeKey);
    }

    /**
     * @notice Processes the latest update for a given parameter and market. Will validate that the update configuration is active, is not expired,
     * unprocessed, and that the debounce period has passed.
     * Validated updates will be processed by the associated risk steward contract which will perform update specific validations and apply validated updates.
     * @param updateType The type of update to process
     * @param market The market to process the update for
     * @custom:event Emits RiskParameterUpdated with the update ID
     * @custom:error Throws ConfigNotActive if the config is not active
     * @custom:error Throws UpdateIsExpired if the update is expired
     * @custom:error Throws ConfigAlreadyProcessed if the update has already been processed
     * @custom:error Throws UpdateTooFrequent if the update is too frequent
     */
    function processUpdateByParameterAndMarket(string memory updateType, address market) external whenNotPaused {
        RiskParameterUpdate memory update = RISK_ORACLE.getLatestUpdateByParameterAndMarket(updateType, market);
        bytes memory marketUpdateTypeKey = _getMarketUpdateTypeKey(update.market, update.updateType);
        _validateUpdateStatus(update, marketUpdateTypeKey);
        _processUpdate(update, marketUpdateTypeKey);
    }

    /**
     * @dev Internal function which calls the risk steward to apply the update. If successful, it records the last processed time for the update and
     *market and marks the update as processed.
     * @custom:event Emits RiskParameterUpdated with the update ID
     */
    function _processUpdate(RiskParameterUpdate memory update, bytes memory marketUpdateTypeKey) internal {
        IRiskSteward(riskParameterConfigs[update.updateType].riskSteward).processUpdate(update);
        lastProcessedTime[marketUpdateTypeKey] = block.timestamp;
        processedUpdates[update.updateId] = true;
        emit RiskParameterUpdated(update.updateId);
    }

    /**
     * @dev Encodes the market and update type into a bytes key to be used with the last processed time mapping
     */
    function _getMarketUpdateTypeKey(address market, string memory updateType) internal pure returns (bytes memory) {
        return abi.encodePacked(market, updateType);
    }

    /**
     * @dev Validates the status of an update. Will validate that the update configuration is active, is not expired, unprocessed, and that the debounce period has passed.
     * @custom:error Throws ConfigNotActive if the config is not active
     * @custom:error Throws UpdateIsExpired if the update is expired
     * @custom:error Throws ConfigAlreadyProcessed if the update has already been processed
     * @custom:error Throws UpdateTooFrequent if the update is too frequent
     */
    function _validateUpdateStatus(RiskParameterUpdate memory update, bytes memory marketUpdateTypeKey) internal view {
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

        if (block.timestamp - lastProcessedTime[marketUpdateTypeKey] < config.debounce) {
            revert UpdateTooFrequent();
        }
    }

    /**
     * @dev Disabling renounceOwnership function.
     */
    function renounceOwnership() public override {
        revert(" renounceOwnership() is not allowed");
    }
}
