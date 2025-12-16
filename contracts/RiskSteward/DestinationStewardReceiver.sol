// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.25;

import { OwnableUpgradeable } from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import { Ownable2StepUpgradeable } from "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";
import { RiskParameterUpdate } from "./Interfaces/IRiskOracle.sol";
import { IRiskSteward } from "./Interfaces/IRiskSteward.sol";
import { ensureNonzeroAddress } from "@venusprotocol/solidity-utilities/contracts/validators.sol";
import { AccessControlledV8 } from "../Governance/AccessControlledV8.sol";
import { IIsolatedPoolsComptroller } from "../interfaces/IIsolatedPoolsComptroller.sol";
import { OAppUpgradeable, Origin } from "@layerzerolabs/oapp-evm-upgradeable/contracts/oapp/OAppUpgradeable.sol";

/**
 * @title DestinationStewardReceiver
 * @author Venus
 * @notice Destination‑chain contract that receives bridged updates from `RiskStewardReceiver` via LayerZero,
 *         enforces a fixed remote delay, and then executes the updates on the configured `IRiskSteward` contracts.
 * @custom:security-contact https://github.com/VenusProtocol/governance-contracts#discussion
 */
contract DestinationStewardReceiver is AccessControlledV8, OAppUpgradeable {
    /**
     * @notice Local status of an update on the destination chain
     */
    enum UpdateStatus {
        None,
        Pending,
        Executed,
        Rejected
    }

    /**
     * @notice Configuration for a risk parameter update type on the destination chain.
     * @param active Whether this update type configuration is currently active
     * @param debounce Minimum delay between consecutive executions for the same (updateType, market) pair
     * @param riskSteward Address of the risk steward contract responsible for processing this update type
     */
    struct RiskParamConfig {
        bool active;
        uint256 debounce;
        address riskSteward;
    }

    /**
     * @notice Destination-side storage for a bridged risk parameter update.
     * @param update The full risk parameter update payload received from the source chain
     * @param status Current local status of the bridged update (Pending, Executed, Rejected)
     * @param arrivalTime Timestamp when the update was received on this chain
     * @param executor Address of the executor who executed this update on the destination (address(0) if (expirationTime == 0 || expirationTime <= remoteDelay)not executed yet)
     * @dev Unlock time is derived as `arrivalTime + remoteDelay` instead of being stored separately.
     */
    struct DestinationUpdate {
        RiskParameterUpdate update;
        UpdateStatus status;
        uint256 arrivalTime;
        address executor;
    }

    /**
     * @notice Time before a bridged update is considered stale on the destination chain
     */
    uint256 public constant REMOTE_UPDATE_EXPIRATION_TIME = 2 days;

    /**
     * @notice Source chain LayerZero endpoint ID
     */
    uint32 public immutable LAYER_ZERO_EID;

    /**
     * @notice Delay before a bridged update can be executed on the destination chain
     */
    uint256 public remoteDelay;

    /**
     * @notice Mapping of supported risk configurations per update type (hashed updateType string)
     */
    mapping(bytes32 => RiskParamConfig) public riskParameterConfigs;

    /**
     * @notice Master storage of all bridged updates by update ID
     */
    mapping(uint256 updateId => DestinationUpdate) public updates;

    /**
     * @notice Mapping from (updateType, market) to currently registered remote update ID
     */
    mapping(bytes32 => mapping(address market => uint256)) public lastRegisteredUpdate;

    /**
     * @notice Track last executed update timestamp per (updateType, market)
     */
    mapping(bytes32 => mapping(address market => uint256)) public lastExecutedAt;

    /**
     * @notice Mapping from executor address to whitelist status
     */
    mapping(address => bool) public whitelistedExecutors;

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[44] private __gap;

    /**
     * @notice Emitted when a risk parameter config is updated for an update type
     */
    event RiskParameterConfigUpdated(
        bytes32 indexed updateTypeHash,
        string updateType,
        address indexed previousRiskSteward,
        address indexed riskSteward,
        uint256 previousDebounce,
        uint256 debounce,
        bool previousActive,
        bool active
    );

    /**
     * @notice Emitted when a bridged update is registered on the destination
     */
    event RemoteUpdateRegistered(
        uint256 indexed updateId,
        uint256 arrivalTime,
        string indexed updateType,
        address indexed market
    );

    /**
     * @notice Emitted when a new bridged update arrives but a pending update is already registered for the same (updateType, market).
     */
    event RegisteredPendingUpdateExist(
        uint256 indexed updateId,
        uint256 arrivalTime,
        string indexed updateType,
        address indexed market
    );

    /**
     * @notice Emitted when a duplicate bridged update (same updateId) is received.
     */
    event DuplicateUpdateReceived(
        uint256 indexed updateId,
        uint256 arrivalTime,
        string indexed updateType,
        address indexed market
    );

    /**
     * @notice Emitted when a bridged update is executed on the destination
     */
    event RemoteUpdateExecuted(uint256 indexed updateId);

    /**
     * @notice Emitted when an executor status is set on the destination
     */
    event ExecutorStatusUpdated(address indexed executor, bool previousApproved, bool approved);

    /**
     * @notice Emitted when a risk parameter config active status is updated
     */
    event ConfigActiveUpdated(
        bytes32 indexed updateTypeHash,
        string updateType,
        bool previousActive,
        bool indexed active
    );

    /**
     * @notice Emitted when an update is rejected on the destination
     */
    event UpdateRejected(uint256 indexed updateId);

    /**
     * @notice Emitted when the remote delay is set in the constructor
     */
    event RemoteDelaySet(uint256 remoteDelay);

    /**
     * @notice Thrown when trying to operate on an update that was never registered
     */
    error UpdateNotFound();

    /**
     * @notice Thrown when trying to execute an update before its unlock time
     */
    error UpdateNotUnlocked();

    /**
     * @notice Thrown when config for an update type is not active or not configured
     */
    error ConfigNotActive();

    /**
     * @notice Thrown when a bridged update has expired on the destination
     */
    error UpdateIsExpired();

    /**
     * @notice Thrown when the debounce period hasn't passed for applying an update to a specific market / update type
     */
    error UpdateTooFrequent();

    /**
     * @notice Thrown when an empty update type string is provided
     */
    error InvalidUpdateType();

    /**
     * @notice Thrown when an update type is not supported
     */
    error UnsupportedUpdateType();

    /**
     * @notice Thrown when a debounce value of 0 is set
     */
    error InvalidDebounce();

    /**
     * @notice Thrown when an address is not a whitelisted executor
     */
    error NotAnExecutor();

    /**
     * @notice Thrown when an invalid LayerZero endpoint ID is provided
     */
    error InvalidLayerZeroEid();

    /**
     * @notice Thrown when an invalid remote delay is provided
     */
    error InvalidRemoteDelay();

    /**
     * @notice Thrown when trying to set the same remote delay value
     */
    error RemoteDelayUnchanged();

    /**
     * @notice Thrown when trying to renounce ownership
     */
    error RenounceOwnershipNotAllowed();

    /**
     * @notice Thrown when trying to set the same config active status
     */
    error ConfigStatusUnchanged();

    /**
     * @notice Thrown when trying to set the same executor whitelist status
     */
    error ExecutorStatusUnchanged();

    /**
     * @notice Modifier that ensures only whitelisted executors can call the function
     * @custom:error NotAnExecutor if the caller is not a whitelisted executor
     */
    modifier onlyWhitelistedExecutors() {
        if (!whitelistedExecutors[msg.sender]) {
            revert NotAnExecutor();
        }
        _;
    }

    /**
     * @notice Disables initializers and sets immutable values.
     * @param endpoint_ Local LayerZero endpoint on this chain
     * @param layerZeroEid_ LayerZero endpoint ID for this destination chain
     * @custom:oz-upgrades-unsafe-allow constructor
     */
    constructor(address endpoint_, uint32 layerZeroEid_) OAppUpgradeable(endpoint_) {
        _disableInitializers();
        ensureNonzeroAddress(endpoint_);
        if (layerZeroEid_ == 0) revert InvalidLayerZeroEid();

        LAYER_ZERO_EID = layerZeroEid_;
    }

    /**
     * @notice Initializes the contract with the Access Control Manager and owner.
     * @param accessControlManager_ The address of the access control manager
     * @param delegate_ The owner (and LayerZero delegate) of this contract
     */
    function initialize(address accessControlManager_, address delegate_) external initializer {
        __AccessControlled_init(accessControlManager_);
        __OApp_init(delegate_);
        remoteDelay = 6 hours; // Default value
        emit RemoteDelaySet(remoteDelay);
    }

    /**
     * @notice Sets the risk parameter config for a given update type on the destination chain.
     * @param updateType The type of update to configure (e.g., "supplyCap", "borrowCap")
     * @param riskSteward The address for the risk steward contract responsible for processing the update
     * @param debounce The debounce period for updates of this type on the destination (anti‑DoS)
     * @custom:access Controlled by AccessControlManager
     * @custom:event Emits RiskParameterConfigUpdated (with previousTimelock and timelock always emitted as 0)
     * @custom:error InvalidUpdateType if the update type string is empty
     * @custom:error InvalidDebounce if the debounce is 0
     */
    function setRiskParameterConfig(string calldata updateType, address riskSteward, uint256 debounce) external {
        _checkAccessAllowed("setRiskParameterConfig(string,address,uint256)");
        ensureNonzeroAddress(riskSteward);

        if (bytes(updateType).length == 0) {
            revert InvalidUpdateType();
        }

        if (debounce == 0) {
            revert InvalidDebounce();
        }

        bytes32 key = keccak256(bytes(updateType));
        RiskParamConfig storage previousConfig = riskParameterConfigs[key];

        riskParameterConfigs[key] = RiskParamConfig({ active: true, debounce: debounce, riskSteward: riskSteward });

        emit RiskParameterConfigUpdated(
            key,
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
     * @notice Sets the active status of a risk parameter config
     * @param updateType The type of update to configure
     * @param active The active status to set
     * @custom:access Controlled by AccessControlManager
     * @custom:event Emits ConfigActiveUpdated with the update type hash, update type, previous active status, and the active status
     * @custom:error Throws UnsupportedUpdateType if the update type is not supported
     * @custom:error Throws ConfigStatusUnchanged if the active status is already set to the desired value
     */
    function setConfigActive(string calldata updateType, bool active) external {
        _checkAccessAllowed("setConfigActive(string,bool)");
        bytes32 key = keccak256(bytes(updateType));

        if (riskParameterConfigs[key].riskSteward == address(0)) {
            revert UnsupportedUpdateType();
        }

        bool previousActive = riskParameterConfigs[key].active;
        if (previousActive == active) {
            revert ConfigStatusUnchanged();
        }

        riskParameterConfigs[key].active = active;
        emit ConfigActiveUpdated(key, updateType, previousActive, active);
    }

    /**
     * @notice Sets the remote delay before bridged updates can be executed on the destination chain.
     * @param newRemoteDelay The new remote delay in seconds
     * @custom:access Controlled by AccessControlManager
     * @custom:event Emits RemoteDelaySet with the new remote delay value
     * @custom:error InvalidRemoteDelay if the delay is 0 or greater than or equal to the remote update expiration time
     * @custom:error RemoteDelayUnchanged if the new delay is equal to the current delay
     */
    function setRemoteDelay(uint256 newRemoteDelay) external {
        _checkAccessAllowed("setRemoteDelay(uint256)");

        if (newRemoteDelay == 0 || newRemoteDelay >= REMOTE_UPDATE_EXPIRATION_TIME) {
            revert InvalidRemoteDelay();
        }

        uint256 previousDelay = remoteDelay;
        if (previousDelay == newRemoteDelay) {
            revert RemoteDelayUnchanged();
        }

        remoteDelay = newRemoteDelay;
        emit RemoteDelaySet(newRemoteDelay);
    }

    /**
     * @notice Sets the whitelist status of an executor on the destination chain.
     * @param executor The address of the executor
     * @param approved The whitelist status to set (true to whitelist, false to remove)
     * @custom:access Controlled by AccessControlManager
     * @custom:event Emits ExecutorStatusUpdated with the executor address, previous approval status, and new approval status
     * @custom:error Throws ZeroAddressNotAllowed if the executor address is zero
     * @custom:error Throws ExecutorStatusUnchanged if the executor whitelist status is already set to the desired value
     */
    function setWhitelistedExecutor(address executor, bool approved) external {
        _checkAccessAllowed("setWhitelistedExecutor(address,bool)");
        ensureNonzeroAddress(executor);
        bool previousApproved = whitelistedExecutors[executor];
        if (previousApproved == approved) {
            revert ExecutorStatusUnchanged();
        }

        whitelistedExecutors[executor] = approved;
        emit ExecutorStatusUpdated(executor, previousApproved, approved);
    }

    /**
     * @notice Executes a bridged update after its remote delay has passed.
     * @param updateId The bridged update ID to execute
     * @custom:access Only whitelisted executors can execute updates
     * @custom:event Emits RemoteUpdateExecuted with the executed update ID
     * @custom:error NotAnExecutor if the caller is not a whitelisted executor
     * @custom:error ConfigNotActive if the configuration for the update type is not active
     * @custom:error UpdateNotFound if the update is not pending for the given (updateType, market)
     * @custom:error UpdateNotUnlocked if the remote delay has not elapsed
     * @custom:error UpdateIsExpired if the bridged update has expired on the destination
     * @custom:error UpdateTooFrequent if the debounce period has not passed since the last execution
     */
    function executeUpdate(uint256 updateId) external onlyWhitelistedExecutors {
        DestinationUpdate storage destUpdate = updates[updateId];
        RiskParameterUpdate memory update = destUpdate.update;
        bytes32 updateTypeKey = update.updateTypeKey;
        RiskParamConfig storage config = riskParameterConfigs[updateTypeKey];
        uint256 currentTime = block.timestamp;

        if (!config.active) {
            revert ConfigNotActive();
        }

        if (destUpdate.status != UpdateStatus.Pending) {
            revert UpdateNotFound();
        }

        if (currentTime < destUpdate.arrivalTime + remoteDelay) {
            revert UpdateNotUnlocked();
        }

        if (update.timestamp + REMOTE_UPDATE_EXPIRATION_TIME < currentTime) {
            revert UpdateIsExpired();
        }

        // Destination-side debounce based on last execution for this (updateType, market)
        uint256 lastExecutionTime = lastExecutedAt[updateTypeKey][update.market];
        if (lastExecutionTime != 0 && (lastExecutionTime + config.debounce > currentTime)) {
            revert UpdateTooFrequent();
        }

        lastExecutedAt[updateTypeKey][update.market] = currentTime;
        destUpdate.status = UpdateStatus.Executed;
        destUpdate.executor = msg.sender;

        IRiskSteward(config.riskSteward).applyUpdate(update);

        emit RemoteUpdateExecuted(updateId);
    }

    /**
     * @notice Rejects a registered remote update on the destination chain.
     * @param updateId The oracle update ID of the update to reject
     * @custom:access Only whitelisted executors can reject updates
     * @custom:event Emits UpdateRejected with the rejected update ID
     * @custom:error NotAnExecutor if the caller is not a whitelisted executor
     * @custom:error UpdateNotFound if there is no pending update with the given ID
     */
    function rejectUpdate(uint256 updateId) external onlyWhitelistedExecutors {
        DestinationUpdate storage destUpdate = updates[updateId];

        if (destUpdate.status != UpdateStatus.Pending) {
            revert UpdateNotFound();
        }

        destUpdate.status = UpdateStatus.Rejected;
        emit UpdateRejected(updateId);
    }

    /**
     * @notice Returns executable updates for a given update type and comptroller.
     * @param updateType The human‑readable identifier of the update type to filter by
     * @param comptroller The address of the Isolated Pools Comptroller that manages the markets
     * @return executableUpdates Array of update IDs that are ready to be executed
     */
    function getExecutableUpdates(
        string calldata updateType,
        address comptroller
    ) external view returns (uint256[] memory executableUpdates) {
        bytes32 updateTypeKey = keccak256(bytes(updateType));
        address[] memory markets = IIsolatedPoolsComptroller(comptroller).getAllMarkets();
        uint256 maxUpdates = markets.length;
        uint256[] memory tempArray = new uint256[](maxUpdates);
        uint256 count = 0;
        RiskParamConfig storage config = riskParameterConfigs[updateTypeKey];

        if (!config.active) return new uint256[](0);

        for (uint256 i = 0; i < maxUpdates; ++i) {
            address market = markets[i];
            uint256 registeredUpdateId = lastRegisteredUpdate[updateTypeKey][market];
            DestinationUpdate storage destUpdate = updates[registeredUpdateId];

            if (!_checkPendingUpdate(registeredUpdateId)) continue;

            // Validate Remote Delay
            if (block.timestamp < destUpdate.arrivalTime + remoteDelay) continue;

            // Debounce: skip if last execution for this (updateType, market) is too recent
            uint256 lastExecutionTime = lastExecutedAt[updateTypeKey][market];
            if (lastExecutionTime != 0 && (lastExecutionTime + config.debounce > block.timestamp)) continue;

            tempArray[count] = registeredUpdateId;
            count++;
        }

        executableUpdates = new uint256[](count);
        for (uint256 i = 0; i < count; ++i) {
            executableUpdates[i] = tempArray[i];
        }
    }

    /**
     * @notice Returns the risk parameter configuration for a given update type
     * @param updateType The human-readable identifier of the update type
     * @return The risk parameter configuration
     */
    function getRiskParameterConfig(string calldata updateType) external view returns (RiskParamConfig memory) {
        bytes32 key = keccak256(bytes(updateType));
        return riskParameterConfigs[key];
    }

    /**
     * @notice Returns the registered update for a given update type and market
     * @param updateType The human-readable identifier of the update type
     * @param market The address of the market
     * @return The registered update
     */
    function getRegisteredUpdate(
        string calldata updateType,
        address market
    ) external view returns (DestinationUpdate memory) {
        bytes32 key = keccak256(bytes(updateType));
        uint256 updateId = lastRegisteredUpdate[key][market];
        return updates[updateId];
    }

    /**
     * @notice Returns the last executed timestamp for a given update type and market
     * @param updateType The human-readable identifier of the update type
     * @param market The address of the market
     * @return The last executed timestamp
     */
    function getLastExecutedAt(string calldata updateType, address market) external view returns (uint256) {
        bytes32 key = keccak256(bytes(updateType));
        return lastExecutedAt[key][market];
    }

    /**
     * @dev Overrides OwnableUpgradeable and Ownable2StepUpgradeable to resolve
     *      the multiple inheritance ownership transfer conflict.
     */
    function transferOwnership(
        address newOwner
    ) public override(OwnableUpgradeable, Ownable2StepUpgradeable) onlyOwner {
        Ownable2StepUpgradeable.transferOwnership(newOwner);
    }

    /**
     * @dev Internal hook to finalize ownership transfer, resolving the
     *      OwnableUpgradeable and Ownable2StepUpgradeable inheritance conflict.
     */
    function _transferOwnership(address newOwner) internal override(OwnableUpgradeable, Ownable2StepUpgradeable) {
        Ownable2StepUpgradeable._transferOwnership(newOwner);
    }

    /**
     * @notice Internal LayerZero receive hook that handles bridged updates from the source-chain `RiskStewardReceiver`.
     * @dev Emits `DuplicateUpdateReceived`, `RegisteredPendingUpdateExist`, or `RemoteUpdateRegistered`
     *      depending on whether the update ID was already seen or a non‑expired pending update exists.
     * @param payload Encoded `RiskParameterUpdate` sent from the source chain
     */
    function _lzReceive(Origin calldata, bytes32, bytes calldata payload, address, bytes calldata) internal override {
        RiskParameterUpdate memory update = abi.decode(payload, (RiskParameterUpdate));
        uint256 newId = update.updateId;
        uint256 arrivalTime = block.timestamp;

        // If this update ID was already stored, treat as a duplicate and do not overwrite
        if (updates[newId].status != UpdateStatus.None) {
            emit DuplicateUpdateReceived(newId, arrivalTime, update.updateType, update.market);
            return;
        }

        // If already an update in Process do not override the registered update
        uint256 currentRegisteredId = lastRegisteredUpdate[update.updateTypeKey][update.market];
        if (_checkPendingUpdate(currentRegisteredId)) {
            emit RegisteredPendingUpdateExist(currentRegisteredId, arrivalTime, update.updateType, update.market);
            return;
        }

        DestinationUpdate storage destUpdate = updates[newId];
        destUpdate.update = update;
        destUpdate.status = UpdateStatus.Pending;
        destUpdate.arrivalTime = arrivalTime;
        lastRegisteredUpdate[update.updateTypeKey][update.market] = newId;
        emit RemoteUpdateRegistered(newId, arrivalTime, update.updateType, update.market);
    }

    /**
     * @notice Checks if there is a pending, non‑expired registered update for the same (updateType, market).
     * @param currentRegisteredId The currently registered update ID for the same (updateType, market)
     * @return True if there is a pending, non‑expired registered update for the same (updateType, market), false otherwise
     */
    function _checkPendingUpdate(uint256 currentRegisteredId) internal view returns (bool) {
        if (currentRegisteredId == 0) return false; // no registered update

        DestinationUpdate storage current = updates[currentRegisteredId];

        if (current.status != UpdateStatus.Pending) return false;

        // Check expiration
        return current.update.timestamp + REMOTE_UPDATE_EXPIRATION_TIME > block.timestamp;
    }

    /**
     * @notice Disables renounceOwnership function
     * @custom:error Throws RenounceOwnershipNotAllowed
     */
    function renounceOwnership() public pure override {
        revert RenounceOwnershipNotAllowed();
    }
}
