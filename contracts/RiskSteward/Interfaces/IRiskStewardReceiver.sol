// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.25;

interface IRiskStewardReceiver {
    /**
     * @notice Status of an update
     */
    enum UpdateStatus {
        None,
        Pending,
        Executed,
        Rejected,
        Expired,
        SENT_TO_DESTINATION
    }

    /**
     * @notice Configuration for a risk parameter update type
     * @param active Whether this update type configuration is currently active
     * @param debounce Minimum delay between consecutive update executions for the same (updateType, market) pair
     * @param timelock Period that must pass after registration before an update can be executed
     * @param riskSteward Address of the risk steward contract responsible for processing this update type
     */
    struct RiskParamConfig {
        bool active;
        uint256 debounce;
        uint256 timelock;
        address riskSteward;
    }

    /**
     * @notice Registered update structure with timelock and execution information
     * @param updateId Update ID from the Risk Oracle
     * @param unlockTime Timestamp when this update can be executed (calculated as registration time + timelock)
     * @param status Current status of the update (Pending, Executed, Rejected, Expired, etc.)
     * @param executor Address of the executor who executed this update (address(0) if not executed yet)
     * @param executedAt Timestamp when this update was executed (0 if not executed yet)
     */
    struct RegisteredUpdate {
        uint256 updateId;
        uint256 unlockTime;
        UpdateStatus status;
        address executor;
        uint256 executedAt;
    }

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
    event ConfigActiveUpdated(bytes32 indexed updateTypeHash, string updateType, bool previousActive, bool active);

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
     * @notice Event emitted when an executor status is set
     */
    event ExecutorStatusUpdated(address indexed executor, bool previousApproved, bool approved);

    /**
     * @notice Event emitted when an update is registered
     */
    event UpdateRegistered(uint256 indexed updateId, uint256 unlockTime, string updateType, address indexed market);

    /**
     * @notice Event emitted when an update is sent to a destination chain
     */
    event UpdateSentToDestination(
        uint256 updateId,
        uint32 indexed destLzEid,
        string indexed updateType,
        address indexed market
    );

    /**
     * @notice Event emitted when an update is resent to a destination chain
     */
    event UpdateResentToDestination(
        uint256 updateId,
        uint32 indexed destLzEid,
        string indexed updateType,
        address indexed market
    );

    /**
     * @notice Emitted when leftover native tokens are swept by owner
     */
    event SweepNative(address indexed receiver, uint256 amount);

    /**
     * @notice Event emitted when the pause status changes
     * @param previousPaused Previous pause state
     * @param paused Current pause state
     */
    event PauseStatusUpdated(bool previousPaused, bool paused);

    /**
     * @custom:error TransferFailed
     */
    error TransferFailed();

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
     * @notice Thrown when an empty update type string is provided
     */
    error InvalidUpdateType();

    /**
     * @notice Thrown when a debounce value of 0 is set
     */
    error InvalidDebounce();

    /**
     * @notice Thrown when a timelock value is greater than or equal to the expiration time
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
     * @notice Thrown when an address is not an executor
     */
    error NotAnExecutor();

    /**
     * @notice Thrown when there is a non-expired pending update of the same type for the market
     */
    error RegisteredUpdateTypeExist(uint256);

    /**
     * @notice Thrown when trying to resend an update that is not in SENT_TO_DESTINATION status
     */
    error InvalidUpdateToResend();

    /**
     * @notice Thrown when trying to execute an update that was never registered
     */
    error InvalidRegisteredUpdate();

    /**
     * @notice Thrown when attempting to call lzSend from an address other than this contract
     */
    error InvalidLzSendCaller();

    /**
     * @notice Thrown when trying to renounce ownership
     */
    error RenounceOwnershipNotAllowed();

    /**
     * @notice Thrown when processUpdate is called while the contract is paused
     */
    error PausedError();

    /**
     * @notice Thrown when an invalid LayerZero endpoint ID is provided
     */
    error InvalidLayerZeroEid();

    /**
     * @notice Thrown when trying to set the same pause status
     */
    error PauseStatusUnchanged();

    /**
     * @notice Thrown when trying to set the same config active status
     */
    error ConfigStatusUnchanged();

    /**
     * @notice Thrown when trying to set the same executor whitelist status
     */
    error ExecutorStatusUnchanged();

    /**
     * @notice Thrown when an update will expire before its timelock unlocks
     */
    error UpdateWillExpireBeforeUnlock();

    function getRiskParameterConfig(string calldata updateType) external view returns (RiskParamConfig memory);

    function getLastProcessedUpdate(string calldata updateType, address market) external view returns (uint256);

    function getLastRegisteredUpdate(string calldata updateType, address market) external view returns (uint256);

    function setRiskParameterConfig(
        string calldata updateType,
        address riskSteward,
        uint256 debounce,
        uint256 timelock
    ) external;

    function setConfigActive(string calldata updateType, bool active) external;

    function setWhitelistedExecutor(address executor, bool approved) external;

    function processUpdate(uint256 updateId) external;

    function executeRegisteredUpdate(uint256 updateId) external;

    function rejectUpdate(uint256 updateId) external;

    function resendRemoteUpdate(uint256 updateId, bytes calldata options) external payable;

    function getExecutableUpdates(
        string calldata updateType,
        address comptroller
    ) external view returns (uint256[] memory executableUpdates);

    function isUpdateExecutable(uint256 updateId) external view returns (bool);
}
