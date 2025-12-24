// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.25;

import { RiskParameterUpdate } from "./IRiskOracle.sol";

interface IDestinationStewardReceiver {
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
     * @param executor Address of the executor who executed this update on the destination (address(0) not executed yet)
     * @dev Unlock time is derived as `arrivalTime + remoteDelay` instead of being stored separately.
     */
    struct DestinationUpdate {
        RiskParameterUpdate update;
        UpdateStatus status;
        uint256 arrivalTime;
        address executor;
    }

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

    function setRiskParameterConfig(string calldata updateType, address riskSteward, uint256 debounce) external;

    function setConfigActive(string calldata updateType, bool active) external;

    function setWhitelistedExecutor(address executor, bool approved) external;

    function setRemoteDelay(uint256 newRemoteDelay) external;

    function executeUpdate(uint256 updateId) external;

    function rejectUpdate(uint256 updateId) external;

    function getExecutableUpdates(
        string calldata updateType,
        address comptroller
    ) external view returns (uint256[] memory executableUpdates);

    function getRiskParameterConfig(string calldata updateType) external view returns (RiskParamConfig memory);

    function getRegisteredUpdate(
        string calldata updateType,
        address market
    ) external view returns (DestinationUpdate memory);

    function getLastExecutedAt(string calldata updateType, address market) external view returns (uint256);
}
