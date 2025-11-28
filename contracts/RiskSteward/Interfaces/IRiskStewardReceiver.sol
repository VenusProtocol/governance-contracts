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
        SENT_TO_DESTINATION,
        Executable
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
     * @notice Event emitted when an update is sent to a destination chain
     */
    event UpdateSentToDestination(uint256 indexed updateId, uint32 indexed destChainId, string updateType, address indexed market);

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

    error RegitredUpdateTypeExist(uint256);

    /**
     * @notice Thrown when trying to renounce ownership
     */
    error RenounceOwnershipNotAllowed();

    function riskParameterConfigs(
        bytes32
    ) external view returns (bool active, uint256 debounce, uint256 timelock, address riskSteward);

    function updateTypeLabels(bytes32) external view returns (string memory);

    function lastProcessedUpdate(bytes32, address market) external view returns (uint256);

    function whitelistedApprovers(address) external view returns (bool);

    function setRiskParameterConfig(
        string calldata updateType,
        address riskSteward,
        uint256 debounce,
        uint256 timelock
    ) external;

    function setConfigActive(string calldata updateType, bool active) external;

    function setApprover(address approver, bool approved) external;

    function approveUpdate(uint256 updateId) external;

    function registerUpdate(uint256 updateId) external;

    function executeUpdate(uint256 updateId) external;

    function rejectUpdate(uint256 updateId) external;

    function getExecutableUpdates(
        string calldata updateType,
        address comptroller
    ) external view returns (uint256[] memory executableUpdates);

    /**
     * @notice Returns the current status of an update, checking expiration and execution conditions.
     * @param updateId The oracle update ID to query
     * @return The current `UpdateStatus` for the given update ID (may differ from stored status if expired or executable)
     */
    function getUpdateStatus(uint256 updateId) external view returns (UpdateStatus);
}
