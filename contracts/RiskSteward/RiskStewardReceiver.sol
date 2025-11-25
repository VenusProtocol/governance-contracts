// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.25;

import { IRiskSteward } from "./Interfaces/IRiskSteward.sol";
import { IRiskOracle, RiskParameterUpdate } from "./Interfaces/IRiskOracle.sol";
import { IRiskStewardReceiver } from "./Interfaces/IRiskStewardReceiver.sol";
import { PausableUpgradeable } from "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import { AccessControlledV8 } from "../Governance/AccessControlledV8.sol";
import { ensureNonzeroAddress } from "@venusprotocol/solidity-utilities/contracts/validators.sol";

/**
 * @title RiskStewardReceiver
 * @author Venus
 * @notice Contract that can read updates from multiple Risk Oracles, validate them with timelock, and push them to the correct RiskSteward.
 * @custom:security-contact https://github.com/VenusProtocol/governance-contracts#discussion
 */
contract RiskStewardReceiver is IRiskStewardReceiver, PausableUpgradeable, AccessControlledV8 {
    /**
     * @notice Status of an update
     */
    enum UpdateStatus {
        None,
        Pending,
        Executed,
        Rejected,
        Expired
    }

    struct RiskParamConfig {
        bool active;
        uint256 debounce; // delay between updates exicutions
        uint256 timelock; // Timelock period before update can be executed
        address riskSteward;
    }

    /**
     * @notice Registered update structure with timelock and approval information
     */
    struct RegisteredUpdate {
        uint256 updateId; // Update ID from the oracle
        uint256 unlockTime; // Timestamp when this update can be executed
        UpdateStatus status; // Current status of the update
        address approver; // Address of the approver who approved this update (address(0) if not approved)
        uint256 executedAt; // Timestamp when this update was executed (0 if not executed yet)
        RiskParameterUpdate update; // The actual update data
    }

    /**
     * @notice Time before a submitted update is considered stale
     */
    uint256 public constant UPDATE_EXPIRATION_TIME = 1 days;

    /**
     * @notice The Risk Oracle contract address (set once in constructor)
     */
    IRiskOracle public immutable RISK_ORACLE;

    /**
     * @notice Mapping of supported risk configurations and their validation parameters (keyed by hashed updateType)
     */
    mapping(bytes32 => RiskParamConfig) public riskParameterConfigs;

    /**
     * @notice Mapping from hashed updateType to original human-readable string label
     */
    mapping(bytes32 => string) public updateTypeLabels;

    /**
     * @notice Master storage of all updates by update ID
     */
    mapping(uint256 updateId => RegisteredUpdate) public updates;

    /**
     * @notice Track last processed update ID per (updateType, market) (keyed by hashed updateType)
     */
    mapping(bytes32 => mapping(address market => uint256)) public lastProcessedUpdate;

    /**
     * @notice Resolved boundary - all update IDs <= resolvedBoundary are guaranteed resolved
     */
    uint256 public resolvedBoundary;

    /**
     * @notice Mapping from approver address to whitelist status
     */
    mapping(address => bool) public whitelistedApprovers;

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[47] private __gap;

    /**
     * @notice Event emitted when a risk parameter config is set
     */
    event RiskParameterConfigUpdated(
        bytes32 indexed updateTypeHash,
        string updateType,
        address indexed previousRiskSteward,
        address indexed riskSteward,
        uint256 previousDebounce,
        uint256 debounce,
        uint256 previousTimelock,
        uint256 timelock,
        bool previousActive,
        bool active
    );

    /**
     * @notice Event emitted when a risk parameter config active status is set
     */
    event ConfigActiveUpdated(
        bytes32 indexed updateTypeHash,
        string updateType,
        bool previousActive,
        bool indexed active
    );

    /**
     * @notice Event emitted when an update is successfully executed
     */
    event UpdateExecuted(uint256 indexed updateId);

    /**
     * @notice Event emitted when an update is rejected
     */
    event UpdateRejected(uint256 indexed updateId);

    /**
     * @notice Event emitted when an update is marked as expired
     */
    event UpdateExpired(uint256 indexed updateId);

    /**
     * @notice Event emitted when an approver status is set
     */
    event ApproverStatusUpdated(address indexed approver, bool previousApproved, bool indexed approved);

    /**
     * @notice Event emitted when an update is approved
     */
    event SetApproved(uint256 indexed updateId, address indexed approver);

    /**
     * @notice Event emitted when an update is registered
     */
    event UpdateRegistered(uint256 indexed updateId, uint256 unlockTime, string updateType, address indexed market);

    /**
     * @notice Event emitted when resolved boundary is advanced
     * @param newResolvedBoundary The new resolved boundary value
     */
    event UpdateResolvedBoundary(uint256 indexed newResolvedBoundary);

    /**
     * @notice Thrown if a submitted update is not active and therefore cannot be processed
     */
    error ConfigNotActive();

    /**
     * @notice Thrown when an update was not applied within the required time frame
     */
    error UpdateIsExpired();

    /**
     * @notice Thrown when an update has already been processed
     */
    error UpdateAlreadyResolved();

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
     * @notice Thrown when a timelock value of 0 is set
     */
    error InvalidTimelock();

    /**
     * @notice Thrown when update unlock time has not been reached
     */
    error UpdateNotUnlocked();

    /**
     * @notice Thrown when trying to resolve an update that doesn't exist
     */
    error UpdateNotFound();

    /**
     * @notice Thrown when an address is not an approver
     */
    error NotAnApprover();

    /**
     * @notice Thrown when an update has not been approved
     */
    error UpdateNotApproved();

    /**
     * @notice Thrown when trying to renounce ownership
     */
    error RenounceOwnershipNotAllowed();

    /**
     * @notice Disables initializers and sets the Risk Oracle
     * @param riskOracle_ The address of the Risk Oracle contract
     * @custom:oz-upgrades-unsafe-allow constructor
     */
    constructor(address riskOracle_) {
        _disableInitializers();
        ensureNonzeroAddress(riskOracle_);
        RISK_ORACLE = IRiskOracle(riskOracle_);
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
     * @param timelock The timelock period before the update can be executed
     * @custom:access Controlled by AccessControlManager
     * @custom:event Emits RiskParameterConfigUpdated with the update type hash, update type, previous risk steward, new risk steward, previous debounce,
     * new debounce, previous timelock, new timelock, previous active status, and new active status
     * @custom:error Throws UnsupportedUpdateType if the update type is an empty string
     * @custom:error Throws InvalidDebounce if the debounce is 0
     * @custom:error Throws InvalidTimelock if the timelock is 0
     * @custom:error Throws ZeroAddressNotAllowed if the risk steward address is zero
     */
    function setRiskParameterConfig(
        string calldata updateType,
        address riskSteward,
        uint256 debounce,
        uint256 timelock
    ) external {
        _checkAccessAllowed("setRiskParameterConfig(string,address,uint256,uint256)");
        ensureNonzeroAddress(riskSteward);

        if (bytes(updateType).length == 0) {
            revert UnsupportedUpdateType();
        }
        if (debounce == 0) {
            revert InvalidDebounce();
        }

        bytes32 key = keccak256(bytes(updateType));
        RiskParamConfig memory previousConfig = riskParameterConfigs[key];

        // Add the label if not already stored
        if (bytes(updateTypeLabels[key]).length == 0) {
            updateTypeLabels[key] = updateType;
        }

        riskParameterConfigs[key] = RiskParamConfig({
            active: true,
            riskSteward: riskSteward,
            debounce: debounce,
            timelock: timelock
        });

        emit RiskParameterConfigUpdated(
            key,
            updateType,
            previousConfig.riskSteward,
            riskSteward,
            previousConfig.debounce,
            debounce,
            previousConfig.timelock,
            timelock,
            previousConfig.active,
            true
        );
    }

    /**
     * @notice Sets the active status of a risk parameter config
     * @param updateType The type of update to configure
     * @param active The active status to set
     * @custom:access Controlled by AccessControlManager
     * @custom:event Emits ConfigActiveUpdated with the update type hash, update type, previous active status, and the active status
     * @custom:error Throws UnsupportedUpdateType if the update type is not supported
     */
    function setConfigActive(string calldata updateType, bool active) external {
        _checkAccessAllowed("setConfigActive(string,bool)");
        bytes32 key = keccak256(bytes(updateType));

        if (riskParameterConfigs[key].riskSteward == address(0)) {
            revert UnsupportedUpdateType();
        }

        bool previousActive = riskParameterConfigs[key].active;
        if (previousActive == active) {
            return;
        }

        riskParameterConfigs[key].active = active;
        emit ConfigActiveUpdated(key, updateType, previousActive, active);
    }

    /**
     * @notice Sets the whitelist status of an approver
     * @param approver The address of the approver
     * @param approved The whitelist status to set (true to whitelist, false to remove)
     * @custom:access Controlled by AccessControlManager
     * @custom:event Emits ApproverStatusUpdated with the approver address, previous approval status, and approval status
     * @custom:error Throws ZeroAddressNotAllowed if the approver address is zero
     */
    function setApprover(address approver, bool approved) external {
        _checkAccessAllowed("setApprover(address,bool)");
        ensureNonzeroAddress(approver);

        bool previousApproved = whitelistedApprovers[approver];
        if (previousApproved == approved) {
            return;
        }

        whitelistedApprovers[approver] = approved;
        emit ApproverStatusUpdated(approver, previousApproved, approved);
    }

    /**
     * @notice Approves an update for execution
     * @param updateId The oracle update ID of the update to approve
     * @custom:access Only whitelisted approvers can approve updates
     * @custom:event Emits SetApproved with the oracle update ID and approver address
     * @custom:error Throws NotAnApprover if the caller is not a whitelisted approver
     * @custom:error Throws UpdateNotFound if the update doesn't exist
     * @custom:error Throws UpdateAlreadyResolved if the update was already executed, rejected, or expired
     */
    function approveUpdate(uint256 updateId) external {
        if (!whitelistedApprovers[msg.sender]) {
            revert NotAnApprover();
        }

        RegisteredUpdate storage registeredUpdate = updates[updateId];
        if (registeredUpdate.updateId == 0) {
            revert UpdateNotFound();
        }
        if (registeredUpdate.status != UpdateStatus.Pending) {
            revert UpdateAlreadyResolved();
        }

        // Validate the update is not expired
        if (registeredUpdate.update.timestamp + UPDATE_EXPIRATION_TIME < block.timestamp) {
            revert UpdateIsExpired();
        }

        registeredUpdate.approver = msg.sender;
        emit SetApproved(updateId, msg.sender);
    }

    /**
     * @notice Registers an update from the Risk Oracle with a timelock.
     * This function should be called when the oracle publishes an update.
     * The unlock time is calculated from the update type's configured timelock period.
     * @param updateId The update ID from the oracle's perspective
     * @custom:access Anyone can register updates
     * @custom:event Emits UpdateRegistered with the oracle update ID, unlock time, update type, and market
     * @custom:error Throws UpdateAlreadyResolved if the update was already registered
     * @custom:error Throws UpdateIsExpired if the update has expired
     * @custom:error Throws UnsupportedUpdateType if the update type is not configured
     */
    function registerUpdate(uint256 updateId) external {
        // Check if this oracle update was already registered
        if (updates[updateId].status != UpdateStatus.None) {
            revert UpdateAlreadyResolved();
        }

        RiskParameterUpdate memory update = RISK_ORACLE.getUpdateById(updateId);

        // Check if this is the latest update for this market and type
        RiskParameterUpdate memory latestForMarketAndType = RISK_ORACLE.getLatestUpdateByParameterAndMarket(
            update.updateType,
            update.market
        );
        if (latestForMarketAndType.updateId != updateId) {
            revert UpdateIsExpired();
        }

        // Validate update configuration, expiration, active status, and debounce
        (, RiskParamConfig memory config) = _validateUpdateConfig(update);

        // Check if update is within safe delta based on risk steward's validation
        IRiskSteward riskSteward = IRiskSteward(config.riskSteward);
        bool withinSafeDelta = riskSteward.isWithinSafeDelta(update);

        // Calculate unlock time: if within safe delta, set to current time (immediate execution)
        // Otherwise, use the configured timelock period
        uint256 unlockTime = withinSafeDelta ? block.timestamp : block.timestamp + config.timelock;

        updates[updateId] = RegisteredUpdate({
            updateId: updateId,
            unlockTime: unlockTime,
            status: UpdateStatus.Pending,
            approver: address(0),
            executedAt: 0,
            update: update
        });

        emit UpdateRegistered(updateId, unlockTime, update.updateType, update.market);
    }

    /**
     * @notice Executes a registered update after its unlock time has passed and it has been approved
     * @param updateId The oracle update ID of the update to execute
     * @custom:access Anyone can execute unlocked and approved updates
     * @custom:event Emits UpdateExecuted with the oracle update ID
     * @custom:error Throws UpdateNotFound if the update doesn't exist
     * @custom:error Throws UpdateNotUnlocked if the unlock time hasn't passed
     * @custom:error Throws UpdateNotApproved if the update has not been approved
     * @custom:error Throws UpdateAlreadyResolved if the update was already executed or rejected
     * @custom:error Throws ConfigNotActive if the config is not active
     * @custom:error Throws UpdateTooFrequent if the debounce period hasn't passed
     */
    function executeUpdate(uint256 updateId) external whenNotPaused {
        RegisteredUpdate storage registeredUpdate = updates[updateId];

        if (registeredUpdate.status != UpdateStatus.Pending) {
            revert UpdateAlreadyResolved();
        }

        RiskParameterUpdate memory update = registeredUpdate.update;

        // Validate update configuration, expiration, active status, and debounce
        (bytes32 updateTypeKey, RiskParamConfig memory config) = _validateUpdateConfig(update);

        if (block.timestamp < registeredUpdate.unlockTime) {
            revert UpdateNotUnlocked();
        }

        if (registeredUpdate.approver == address(0)) {
            revert UpdateNotApproved();
        }

        IRiskSteward(config.riskSteward).processUpdate(update);

        registeredUpdate.status = UpdateStatus.Executed;
        registeredUpdate.executedAt = block.timestamp;
        lastProcessedUpdate[updateTypeKey][update.market] = updateId;

        emit UpdateExecuted(updateId);

        // Update resolved boundary
        _updateResolvedBoundary();
    }

    /**
     * @notice Rejects a registered update
     * @param updateId The oracle update ID of the update to reject
     * @custom:access Controlled by AccessControlManager
     * @custom:event Emits UpdateRejected with the oracle update ID
     * @custom:error Throws UpdateNotFound if the update doesn't exist
     * @custom:error Throws UpdateAlreadyResolved if the update was already executed or rejected
     */
    function rejectUpdate(uint256 updateId) external {
        _checkAccessAllowed("rejectUpdate(uint256)");
        RegisteredUpdate storage registeredUpdate = updates[updateId];

        if (registeredUpdate.updateId == 0) {
            revert UpdateNotFound();
        }
        if (registeredUpdate.status != UpdateStatus.Pending) {
            revert UpdateAlreadyResolved();
        }

        registeredUpdate.status = UpdateStatus.Rejected;
        emit UpdateRejected(updateId);

        // Update resolved boundary
        _updateResolvedBoundary();
    }

    /**
     * @notice Marks an update as expired if it has passed the expiration time
     * @param updateId The oracle update ID of the update to check and mark as expired
     * @custom:error Throws UpdateNotFound if the update doesn't exist
     * @custom:event Emits UpdateExpired if the update was marked as expired
     */
    function markUpdateExpired(uint256 updateId) external {
        RegisteredUpdate storage registeredUpdate = updates[updateId];

        if (!_isUpdateExpired(registeredUpdate)) {
            return;
        }

        registeredUpdate.status = UpdateStatus.Expired;
        emit UpdateExpired(updateId);

        // Update resolved boundary
        _updateResolvedBoundary();
    }

    /**
     * @notice Executes all executable registered updates in a batch
     * @return executedCount The number of updates that were executed
     * @custom:access Anyone can execute unlocked and approved updates
     */
    function executeAllExecutableUpdates() external whenNotPaused returns (uint256 executedCount) {
        uint256[] memory executableUpdates = getExecutableUpdates();
        for (uint256 i = 0; i < executableUpdates.length; ++i) {
            RegisteredUpdate storage registeredUpdate = updates[executableUpdates[i]];
            registeredUpdate.status = UpdateStatus.Executed;
            ++executedCount;
        }
        // Update resolved boundary
        _updateResolvedBoundary();
    }

    /**
     * @notice Marks all expired registered updates as expired in a batch
     * @return markedCount The number of updates that were marked as expired
     * @custom:access Anyone can mark expired updates
     */
    function markAllExpiredUpdates() external returns (uint256 markedCount) {
        uint256[] memory expiredUpdates = getExpiredUpdates();
        for (uint256 i = 0; i < expiredUpdates.length; ++i) {
            RegisteredUpdate storage registeredUpdate = updates[expiredUpdates[i]];
            registeredUpdate.status = UpdateStatus.Expired;
            emit UpdateExpired(expiredUpdates[i]);
            ++markedCount;
        }
        // Update resolved boundary
        _updateResolvedBoundary();
    }

    /**
     * @notice Returns an array of update IDs for all executable registered updates
     * @return executableUpdates Array of update IDs that are ready to be executed
     */
    function getExecutableUpdates() public view returns (uint256[] memory executableUpdates) {
        uint256 maxUpdateId = RISK_ORACLE.updateCounter();
        uint256[] memory tempArray = new uint256[](maxUpdateId);
        uint256 count = 0;

        // Iterate through all possible update IDs from 1 to maxUpdateId
        for (uint256 i = 1; i <= maxUpdateId; ++i) {
            if (_isUpdateExecutable(i)) {
                tempArray[count] = i;
                ++count;
            }
        }

        // Resize array to actual count
        executableUpdates = new uint256[](count);
        for (uint256 i = 0; i < count; ++i) {
            executableUpdates[i] = tempArray[i];
        }
    }

    /**
     * @notice Returns an array of update IDs for all expired registered updates that need to be marked as expired
     * @return expiredUpdates Array of update IDs that are expired and need to be marked
     */
    function getExpiredUpdates() public view returns (uint256[] memory expiredUpdates) {
        uint256 maxUpdateId = RISK_ORACLE.updateCounter();
        uint256[] memory tempArray = new uint256[](maxUpdateId);
        uint256 count = 0;

        // Iterate through all possible update IDs from 1 to maxUpdateId
        for (uint256 i = 1; i <= maxUpdateId; ++i) {
            RegisteredUpdate storage registeredUpdate = updates[i];

            if (_isUpdateExpired(registeredUpdate)) {
                tempArray[count] = i;
                ++count;
            }
        }

        // Resize array to actual count
        expiredUpdates = new uint256[](count);
        for (uint256 i = 0; i < count; ++i) {
            expiredUpdates[i] = tempArray[i];
        }
    }

    /**
     * @notice Validates an update's configuration, expiration, active status, and debounce period
     * @param update The risk parameter update to validate
     * @return updateTypeKey The hashed update type key
     * @return config The risk parameter configuration for this update type
     * @custom:error Throws UpdateIsExpired if the update has expired
     * @custom:error Throws ConfigNotActive if the config is not active
     * @custom:error Throws UpdateTooFrequent if the debounce period hasn't passed
     */
    function _validateUpdateConfig(
        RiskParameterUpdate memory update
    ) internal view returns (bytes32 updateTypeKey, RiskParamConfig memory config) {
        // Validate the update is not expired
        if (update.timestamp + UPDATE_EXPIRATION_TIME < block.timestamp) {
            revert UpdateIsExpired();
        }

        // Get the config for this update type
        updateTypeKey = keccak256(bytes(update.updateType));
        config = riskParameterConfigs[updateTypeKey];

        // Check if config is active
        if (!config.active) {
            revert ConfigNotActive();
        }

        // Check debounce period
        if (!_isDebouncePeriodPassed(updateTypeKey, update.market, config.debounce)) {
            revert UpdateTooFrequent();
        }
    }

    /**
     * @notice Checks if the debounce period has passed since the last processed update
     * Uses executedAt timestamp for debounce calculation (time since execution, not publication)
     * @param updateTypeKey The hashed update type key
     * @param market The market address
     * @param debounce The debounce period in seconds
     * @return True if the debounce period has passed or if there's no previous update, false otherwise
     */
    function _isDebouncePeriodPassed(
        bytes32 updateTypeKey,
        address market,
        uint256 debounce
    ) internal view returns (bool) {
        uint256 lastProcessedId = lastProcessedUpdate[updateTypeKey][market];
        if (lastProcessedId != 0) {
            RegisteredUpdate storage lastUpdate = updates[lastProcessedId];

            uint256 lastExecutionTime = lastUpdate.executedAt;
            if (lastExecutionTime == 0) return true;

            uint256 timeSinceLastExecution = block.timestamp - lastExecutionTime;
            return timeSinceLastExecution >= debounce;
        }
        return true;
    }

    /**
     * @notice Advances the resolved boundary pointer as far as possible where consecutive IDs are resolved
     * Queries the RiskOracle to get the maximum update ID and checks sequentially
     */
    function _updateResolvedBoundary() internal {
        uint256 currentBoundary = resolvedBoundary;
        uint256 newBoundary = currentBoundary;

        // Get the maximum update ID from the oracle
        uint256 maxUpdateId = RISK_ORACLE.updateCounter();

        // Start checking from boundary + 1
        for (uint256 i = currentBoundary + 1; i <= maxUpdateId; ++i) {
            RegisteredUpdate storage update = updates[i];
            // If update doesn't exist, we've reached the end
            if (update.updateId == 0) {
                break;
            }
            // Only advance if the update is resolved (Executed, Rejected, or Expired)
            if (
                update.status == UpdateStatus.Executed ||
                update.status == UpdateStatus.Rejected ||
                update.status == UpdateStatus.Expired
            ) {
                newBoundary = i;
            } else {
                break;
            }
        }

        if (newBoundary > currentBoundary) {
            resolvedBoundary = newBoundary;
            emit UpdateResolvedBoundary(newBoundary);
        }
    }

    /**
     * @notice Checks if an update is expired
     * @param registeredUpdate The registered update to check
     * @return True if the update is expired, false otherwise
     */
    function _isUpdateExpired(RegisteredUpdate storage registeredUpdate) internal view returns (bool) {
        if (registeredUpdate.updateId == 0 || registeredUpdate.status != UpdateStatus.Pending) {
            return false;
        }

        RiskParameterUpdate memory update = registeredUpdate.update;
        return update.timestamp + UPDATE_EXPIRATION_TIME <= block.timestamp;
    }

    /**
     * @notice Checks if an update is executable (meets all requirements for execution)
     * @param updateId The oracle update ID of the update to check
     * @return True if the update is executable, false otherwise
     */
    function _isUpdateExecutable(uint256 updateId) internal view returns (bool) {
        RegisteredUpdate storage registeredUpdate = updates[updateId];

        // Skip if update doesn't exist or is not pending
        if (registeredUpdate.updateId == 0 || registeredUpdate.status != UpdateStatus.Pending) {
            return false;
        }

        if (_isUpdateExpired(registeredUpdate)) {
            return false;
        }

        if (block.timestamp < registeredUpdate.unlockTime) {
            return false;
        }

        if (registeredUpdate.approver == address(0)) {
            return false;
        }

        RiskParameterUpdate memory update = registeredUpdate.update;
        bytes32 updateTypeKey = keccak256(bytes(update.updateType));
        RiskParamConfig memory config = riskParameterConfigs[updateTypeKey];

        if (!config.active) {
            return false;
        }

        return _isDebouncePeriodPassed(updateTypeKey, update.market, config.debounce);
    }

    /**
     * @notice Disables renounceOwnership function
     * @custom:error Throws RenounceOwnershipNotAllowed
     */
    function renounceOwnership() public override {
        revert RenounceOwnershipNotAllowed();
    }
}
