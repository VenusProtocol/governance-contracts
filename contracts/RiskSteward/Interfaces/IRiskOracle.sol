// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

/**
 * @notice Struct representing a risk parameter update published by the Risk Oracle
 * @param referenceId External reference ID, potentially linking to a document or off-chain data
 * @param updateId Unique identifier for this specific update
 * @param market Address of the market for which the parameter update applies
 * @param updateType Classification of the update type for validation purposes
 * @param newValue Encoded new value of the risk parameter, flexible for various data types
 * @param previousValue Previous value of the parameter for historical comparison
 * @param timestamp Block timestamp when the update was published
 * @param publisher Address of the account that published this update
 * @param additionalData Additional metadata or data associated with the update
 */
struct RiskParameterUpdate {
    string referenceId;
    uint256 updateId;
    address market;
    string updateType;
    bytes newValue;
    bytes previousValue;
    uint256 timestamp;
    address publisher;
    bytes additionalData;
}

/**
 * @title IRiskOracle
 * @author Venus
 * @notice Interface for Risk Oracle contract that manages and publishes risk parameter updates
 */
interface IRiskOracle {
    /**
     * @notice Returns the update type string at the given index in the allUpdateTypes array
     * @param index The index in the allUpdateTypes array
     * @return The update type string at the specified index
     */
    function allUpdateTypes(uint256 index) external view returns (string memory);

    /**
     * @notice Checks if a given update type is currently active
     * @param updateType The update type string to check
     * @return True if the update type is active, false otherwise
     */
    function activeUpdateTypes(string memory updateType) external view returns (bool);

    /**
     * @notice Checks if an address is authorized to publish updates
     * @param sender The address to check for authorization
     * @return True if the address is authorized, false otherwise
     */
    function authorizedSenders(address sender) external view returns (bool);

    /**
     * @notice Gets the latest update ID for a specific market and update type combination
     * @param market The market address
     * @param updateType The update type string
     * @return The latest update ID for the given market and update type, or 0 if none exists
     */
    function latestUpdateIdByMarketAndType(address market, string memory updateType) external view returns (uint256);

    /**
     * @notice Returns the total number of updates that have been published
     * @return The current update counter value
     */
    function updateCounter() external view returns (uint256);

    /**
     * @notice Fetches the most recent update for a specific parameter type in a specific market
     * @param updateType The update type identifier
     * @param market The market address
     * @return The most recent RiskParameterUpdate for the specified parameter and market
     * @custom:error NoUpdateFound Thrown if no update exists for the specified parameter and market
     */
    function getLatestUpdateByParameterAndMarket(
        string memory updateType,
        address market
    ) external view returns (RiskParameterUpdate memory);

    /**
     * @notice Fetches the update for a provided update ID
     * @param updateId The unique update ID
     * @return The RiskParameterUpdate struct for the specified update ID
     * @custom:error InvalidUpdateId Thrown if updateId is 0 or greater than updateCounter
     */
    function getUpdateById(uint256 updateId) external view returns (RiskParameterUpdate memory);

    /**
     * @notice Adds a new address to the list of authorized senders who can publish updates
     * @param sender Address to be authorized
     * @custom:error ZeroAddressNotAllowed Thrown if sender is the zero address
     * @custom:error SenderAlreadyAuthorized Thrown if sender is already authorized
     * @custom:error Unauthorized Thrown if caller is not allowed by AccessControlManager
     * @custom:event AuthorizedSenderAdded Emitted when sender is successfully added
     */
    function addAuthorizedSender(address sender) external;

    /**
     * @notice Removes an address from the list of authorized senders
     * @param sender Address to be removed from authorization
     * @custom:error SenderNotAuthorized Thrown if sender is not currently authorized
     * @custom:error Unauthorized Thrown if caller is not allowed by AccessControlManager
     * @custom:event AuthorizedSenderRemoved Emitted when sender is successfully removed
     */
    function removeAuthorizedSender(address sender) external;

    /**
     * @notice Adds a new update type to the list of authorized update types
     * @param newUpdateType New update type string to allow (must be non-empty and <= 64 characters)
     * @custom:error InvalidUpdateTypeString Thrown if update type string is empty or exceeds 64 characters
     * @custom:error UpdateTypeAlreadyExists Thrown if update type already exists
     * @custom:error Unauthorized Thrown if caller is not allowed by AccessControlManager
     * @custom:event UpdateTypeAdded Emitted when update type is successfully added
     */
    function addUpdateType(string memory newUpdateType) external;

    /**
     * @notice Sets the active status of an existing update type
     * @param updateType The update type to set active status for
     * @param active True to activate the update type, false to deactivate it
     * @custom:error UpdateTypeNotFound Thrown if update type doesn't exist
     * @custom:error UpdateTypeStatusAlreadySet Thrown if status is already set to the desired value
     * @custom:error Unauthorized Thrown if caller is not allowed by AccessControlManager
     * @custom:event UpdateTypeActiveStatusSet Emitted when status is successfully changed
     */
    function setUpdateTypeActive(string memory updateType, bool active) external;

    /**
     * @notice Publishes a new risk parameter update
     * @param referenceId An external reference ID associated with the update
     * @param newValue The new value of the risk parameter being updated (encoded as bytes)
     * @param updateType Type of update performed, must be an active update type
     * @param market Address of the market for which the parameter update applies
     * @param additionalData Additional data or metadata for the update
     * @custom:error SenderNotAuthorized Thrown if caller is not an authorized sender
     * @custom:error UnauthorizedUpdateType Thrown if update type is not active
     * @custom:error ZeroAddressNotAllowed Thrown if market is the zero address
     * @custom:event ParameterUpdated Emitted when update is successfully published
     */
    function publishRiskParameterUpdate(
        string memory referenceId,
        bytes memory newValue,
        string memory updateType,
        address market,
        bytes memory additionalData
    ) external;

    /**
     * @notice Publishes multiple risk parameter updates in a single transaction
     * @param referenceIds Array of external reference IDs, one for each update
     * @param newValues Array of new values for each update (encoded as bytes)
     * @param updateTypes Array of update types, all must be active update types
     * @param markets Array of market addresses for each update
     * @param additionalData Array of additional data for each update
     * @custom:error SenderNotAuthorized Thrown if caller is not an authorized sender
     * @custom:error ArrayLengthMismatch Thrown if all arrays don't have the same length
     * @custom:error UnauthorizedUpdateType Thrown if any update type is not active
     * @custom:error ZeroAddressNotAllowed Thrown if any market is the zero address
     * @custom:event ParameterUpdated Emitted for each successfully published update
     */
    function publishBulkRiskParameterUpdates(
        string[] memory referenceIds,
        bytes[] memory newValues,
        string[] memory updateTypes,
        address[] memory markets,
        bytes[] memory additionalData
    ) external;
}
