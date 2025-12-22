// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import { AccessControlledV8 } from "../Governance/AccessControlledV8.sol";
import { ensureNonzeroAddress } from "@venusprotocol/solidity-utilities/contracts/validators.sol";
import { IRiskOracle, RiskParameterUpdate } from "./Interfaces/IRiskOracle.sol";

/**
 * @title Risk Oracle
 * @author Venus
 * @notice Contract for managing and publishing risk parameter updates for Risk-Steward Updates
 */
contract RiskOracle is IRiskOracle, AccessControlledV8 {
    /// @notice Counter to keep track of the total number of updates
    uint256 public updateCounter;

    /// @notice Array to store all update types
    string[] public allUpdateTypes;

    /// @notice Whitelist of valid update type identifiers, keyed by updateType hash
    mapping(bytes32 => bool) public activeUpdateTypes;

    /// @notice Mapping from unique update ID to the update details
    mapping(uint256 => RiskParameterUpdate) public updatesById;

    /// @notice Authorized accounts capable of proposing updates
    mapping(address => bool) public authorizedSenders;

    /// @notice Mapping to store the latest update ID for each combination of update type key and market
    mapping(bytes32 => mapping(address => uint256)) public latestUpdateIdByMarketAndType;

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[44] private __gap;

    /**
     * @notice Modifier that restricts function access to authorized senders only
     */
    modifier onlyAuthorized() {
        if (!authorizedSenders[msg.sender]) {
            revert SenderNotAuthorized();
        }
        _;
    }

    /**
     * @notice Disables initializers
     * @custom:oz-upgrades-unsafe-allow constructor
     */
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initializes the contract with access control manager
     * @param accessControlManager_ Address of the access control manager
     * @custom:error Throws ZeroAddressNotAllowed if accessControlManager_ is zero address
     */
    function initialize(address accessControlManager_) external initializer {
        __AccessControlled_init(accessControlManager_);
    }

    /**
     * @notice Adds a new sender to the list of addresses authorized to perform updates
     * @param sender Address to be authorized
     * @custom:access Controlled by AccessControlManager
     * @custom:error Throws ZeroAddressNotAllowed if sender is zero address
     * @custom:error Throws SenderAlreadyAuthorized if sender is already authorized
     * @custom:error Throws Unauthorized if caller is not allowed by AccessControlManager
     * @custom:event Emits AuthorizedSenderAdded when sender is successfully added
     */
    function addAuthorizedSender(address sender) external {
        _checkAccessAllowed("addAuthorizedSender(address)");
        ensureNonzeroAddress(sender);
        if (authorizedSenders[sender]) {
            revert SenderAlreadyAuthorized();
        }
        authorizedSenders[sender] = true;
        emit AuthorizedSenderAdded(sender);
    }

    /**
     * @notice Removes an address from the list of authorized senders
     * @param sender Address to be unauthorized
     * @custom:access Controlled by AccessControlManager
     * @custom:error Throws SenderNotAuthorized if sender is not currently authorized
     * @custom:error Throws Unauthorized if caller is not allowed by AccessControlManager
     * @custom:event Emits AuthorizedSenderRemoved when sender is successfully removed
     */
    function removeAuthorizedSender(address sender) external {
        _checkAccessAllowed("removeAuthorizedSender(address)");
        if (!authorizedSenders[sender]) {
            revert SenderNotAuthorized();
        }
        delete authorizedSenders[sender];
        emit AuthorizedSenderRemoved(sender);
    }

    /**
     * @notice Adds a new type of update to the list of authorized update types
     * @param newUpdateType New type of update to allow
     * @custom:access Controlled by AccessControlManager
     * @custom:error Throws InvalidUpdateTypeString if update type string is empty or exceeds 64 characters
     * @custom:error Throws UpdateTypeAlreadyExists if update type already exists
     * @custom:error Throws Unauthorized if caller is not allowed by AccessControlManager
     * @custom:event Emits UpdateTypeAdded when update type is successfully added
     */
    function addUpdateType(string memory newUpdateType) external {
        _checkAccessAllowed("addUpdateType(string)");
        if (bytes(newUpdateType).length == 0 || bytes(newUpdateType).length > 64) {
            revert InvalidUpdateTypeString();
        }
        bytes32 key = keccak256(bytes(newUpdateType));

        if (_updateTypeExists(key)) {
            revert UpdateTypeAlreadyExists();
        }

        activeUpdateTypes[key] = true;
        allUpdateTypes.push(newUpdateType);
        emit UpdateTypeAdded(newUpdateType);
    }

    /**
     * @notice Sets the active status of an existing update type
     * @param updateType The update type to set active status for
     * @param active True to activate, false to deactivate
     * @custom:access Controlled by AccessControlManager
     * @custom:error Throws UpdateTypeNotFound if update type doesn't exist
     * @custom:error Throws UpdateTypeStatusUnchanged if status is already set to the desired value
     * @custom:error Throws Unauthorized if caller is not allowed by AccessControlManager
     * @custom:event Emits UpdateTypeActiveStatusChanged when status is successfully changed
     */
    function setUpdateTypeActive(string memory updateType, bool active) external {
        _checkAccessAllowed("setUpdateTypeActive(string,bool)");
        bytes32 key = keccak256(bytes(updateType));

        if (!_updateTypeExists(key)) {
            revert UpdateTypeNotFound();
        }

        bool previousActive = activeUpdateTypes[key];
        if (previousActive == active) {
            revert UpdateTypeStatusUnchanged();
        }

        activeUpdateTypes[key] = active;
        emit UpdateTypeActiveStatusChanged(updateType, previousActive, active);
    }

    /**
     * @notice Publishes a new risk parameter update
     * @param referenceId An external reference ID associated with the update
     * @param newValue The new value of the risk parameter being updated
     * @param updateType Type of update performed, must be previously authorized
     * @param market Address for market of the parameter update
     * @param poolId Pool identifier for eMode-style collateral configuration (0 for regular markets)
     * @param dstEid Destination endpoint ID for cross-chain routing
     * @param additionalData Additional data for the update
     * @custom:error Throws SenderNotAuthorized if caller is not an authorized sender
     * @custom:error Throws UpdateTypeNotActive if update type is not active
     * @custom:event Emits UpdatePublished when update is successfully published
     */
    function publishRiskParameterUpdate(
        string memory referenceId,
        bytes memory newValue,
        string memory updateType,
        address market,
        uint96 poolId,
        uint32 dstEid,
        bytes memory additionalData
    ) external onlyAuthorized {
        _publishUpdate(referenceId, newValue, updateType, market, poolId, dstEid, additionalData);
    }

    /**
     * @notice Publishes multiple risk parameter updates in a single transaction
     * @param referenceIds Array of external reference IDs
     * @param newValues Array of new values for each update
     * @param updateTypes Array of types for each update, all must be authorized
     * @param markets Array of addresses for markets of the parameter updates
     * @param poolIds Array of pool identifiers for eMode-style collateral configuration (0 for regular markets)
     * @param dstEid Array of destination endpoint IDs for cross-chain routing
     * @param additionalData Array of additional data for the updates
     * @custom:error Throws SenderNotAuthorized if caller is not an authorized sender
     * @custom:error Throws UpdateTypeNotActive if any update type is not active
     * @custom:event Emits UpdatePublished for each successfully published update
     */
    function publishBulkRiskParameterUpdates(
        string[] memory referenceIds,
        bytes[] memory newValues,
        string[] memory updateTypes,
        address[] memory markets,
        uint96[] memory poolIds,
        uint32[] memory dstEid,
        bytes[] memory additionalData
    ) external onlyAuthorized {
        uint256 length = referenceIds.length;
        if (
            length == 0 ||
            length != newValues.length ||
            length != updateTypes.length ||
            length != markets.length ||
            length != poolIds.length ||
            length != dstEid.length ||
            length != additionalData.length
        ) {
            revert ArrayLengthMismatch();
        }
        for (uint256 i = 0; i < length; ++i) {
            _publishUpdate(
                referenceIds[i],
                newValues[i],
                updateTypes[i],
                markets[i],
                poolIds[i],
                dstEid[i],
                additionalData[i]
            );
        }
    }

    /**
     * @notice Fetches the most recent update for a specific parameter in a specific market
     * @param updateType The identifier for the parameter
     * @param market The market identifier
     * @return The most recent RiskParameterUpdate for the specified parameter and market
     * @custom:error Throws NoUpdateFound if no update exists for the specified parameter and market
     */
    function getLatestUpdateByMarketAndType(
        string memory updateType,
        address market
    ) external view returns (RiskParameterUpdate memory) {
        bytes32 updateTypeKey = keccak256(bytes(updateType));
        uint256 updateId = latestUpdateIdByMarketAndType[updateTypeKey][market];
        if (updateId == 0) {
            revert NoUpdateFound();
        }
        return updatesById[updateId];
    }

    /**
     * @notice Fetches the update for a provided updateId
     * @param updateId Update ID
     * @return The RiskParameterUpdate for the specified id
     * @custom:error Throws InvalidUpdateId if updateId is 0 or greater than updateCounter
     */
    function getUpdateById(uint256 updateId) external view returns (RiskParameterUpdate memory) {
        if (updateId == 0 || updateId > updateCounter) {
            revert InvalidUpdateId();
        }
        return updatesById[updateId];
    }

    /**
     * @notice Publishes a new risk parameter update internally
     * @param referenceId An external reference ID associated with the update
     * @param newValue The new value of the risk parameter being updated
     * @param updateType Type of update performed, must be previously authorized
     * @param market Address for market of the parameter update
     * @param poolId Pool identifier for eMode-style collateral configuration (0 for regular markets)
     * @param dstEid Destination endpoint ID for cross-chain routing
     * @param additionalData Additional data for the update
     * @custom:error Throws ZeroAddressNotAllowed if market is zero address
     * @custom:error Throws UpdateTypeNotActive if update type is not active
     * @custom:event Emits UpdatePublished when update is successfully published
     */
    function _publishUpdate(
        string memory referenceId,
        bytes memory newValue,
        string memory updateType,
        address market,
        uint96 poolId,
        uint32 dstEid,
        bytes memory additionalData
    ) internal {
        ensureNonzeroAddress(market);
        bytes32 updateTypeKey = keccak256(bytes(updateType));
        if (!activeUpdateTypes[updateTypeKey]) {
            revert UpdateTypeNotActive();
        }
        uint256 newUpdateCounter = ++updateCounter;
        uint256 previousUpdateId = latestUpdateIdByMarketAndType[updateTypeKey][market];
        bytes memory previousValue = updatesById[previousUpdateId].newValue;

        RiskParameterUpdate memory newUpdate = RiskParameterUpdate({
            referenceId: referenceId,
            updateId: newUpdateCounter,
            market: market,
            updateType: updateType,
            updateTypeKey: updateTypeKey,
            newValue: newValue,
            previousValue: previousValue,
            timestamp: block.timestamp,
            publisher: msg.sender,
            poolId: poolId,
            destLzEid: dstEid,
            additionalData: additionalData
        });
        updatesById[newUpdateCounter] = newUpdate;

        // Update the latest update ID for the (updateTypeKey, market) pair
        latestUpdateIdByMarketAndType[updateTypeKey][market] = newUpdateCounter;

        emit UpdatePublished(
            referenceId,
            newUpdateCounter,
            market,
            updateType,
            newValue,
            previousValue,
            block.timestamp,
            msg.sender,
            additionalData
        );
    }

    /**
     * @notice Returns the total number of update types in the allUpdateTypes array
     * @return The length of the allUpdateTypes array
     */
    function allUpdateTypesLength() external view returns (uint256) {
        return allUpdateTypes.length;
    }

    /**
     * @notice Gets the latest update ID for a specific market and update type (string) combination
     * @param updateType The update type string
     * @param market The market address
     * @return The latest update ID for the given market and update type, or 0 if none exists
     */
    function getLatestUpdateIdByMarketAndType(
        string memory updateType,
        address market
    ) external view returns (uint256) {
        bytes32 updateTypeKey = keccak256(bytes(updateType));
        return latestUpdateIdByMarketAndType[updateTypeKey][market];
    }

    /**
     * @notice Checks if a given update type is currently active.
     * @param updateType The update type string to check
     * @return True if the update type is active, false otherwise
     */
    function getActiveUpdateTypes(string memory updateType) external view returns (bool) {
        bytes32 key = keccak256(bytes(updateType));
        return activeUpdateTypes[key];
    }

    /**
     * @notice Returns all update types in the allUpdateTypes array
     * @return An array of all update type strings
     */
    function getAllUpdateTypes() external view returns (string[] memory) {
        return allUpdateTypes;
    }

    /**
     * @notice Checks if an update type exists in the allUpdateTypes array
     * @param updateTypeKey The keccak256 hash of the update type string
     * @return True if the update type exists, false otherwise
     */
    function _updateTypeExists(bytes32 updateTypeKey) internal view returns (bool) {
        for (uint256 i = 0; i < allUpdateTypes.length; ++i) {
            if (keccak256(bytes(allUpdateTypes[i])) == updateTypeKey) {
                return true;
            }
        }
        return false;
    }
}
