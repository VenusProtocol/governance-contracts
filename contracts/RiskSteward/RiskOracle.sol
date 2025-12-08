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
    /// @notice Array to store all update types
    string[] public allUpdateTypes;

    /// @notice Whitelist of valid update type identifiers
    mapping(string => bool) public activeUpdateTypes;

    /// @notice Mapping from unique update ID to the update details
    mapping(uint256 => RiskParameterUpdate) public updatesById;

    /// @notice Authorized accounts capable of proposing updates
    mapping(address => bool) public authorizedSenders;

    /// @notice Mapping to store the latest update ID for each combination of market and update type
    mapping(address => mapping(string => uint256)) public latestUpdateIdByMarketAndType;

    /// @notice Counter to keep track of the total number of updates
    uint256 public updateCounter;

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[44] private __gap;

    /// @notice Event emitted when a risk parameter update is published
    event UpdatePublished(
        string referenceId,
        uint256 indexed updateId,
        address indexed market,
        string indexed updateType,
        bytes newValue,
        bytes previousValue,
        uint256 timestamp,
        address publisher,
        bytes additionalData
    );

    /// @notice Event emitted when a new authorized sender is added
    event AuthorizedSenderAdded(address indexed sender);

    /// @notice Event emitted when an authorized sender is removed
    event AuthorizedSenderRemoved(address indexed sender);

    /// @notice Event emitted when a new update type is added
    event UpdateTypeAdded(string indexed updateType);

    /// @notice Event emitted when an update type's active status is changed
    event UpdateTypeActiveStatusSet(string indexed updateType, bool previousActive, bool indexed active);

    /// @notice Thrown when sender is not authorized
    error SenderNotAuthorized();

    /// @notice Thrown when sender is already authorized
    error SenderAlreadyAuthorized();

    /// @notice Thrown when update type string is invalid
    error InvalidUpdateTypeString();

    /// @notice Thrown when update type already exists
    error UpdateTypeAlreadyExists();

    /// @notice Thrown when update type doesn't exist
    error UpdateTypeNotFound();

    /// @notice Thrown when update type active status is already set to the desired value
    error UpdateTypeStatusAlreadySet();

    /// @notice Thrown when update type is unauthorized
    error UnauthorizedUpdateType();

    /// @notice Thrown when no update is found
    error NoUpdateFound();

    /// @notice Thrown when update ID is invalid
    error InvalidUpdateId();

    /// @notice Thrown when array lengths don't match in bulk operations
    error ArrayLengthMismatch();

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
     * @custom:error Throws SenderNotAuthorized if sender is not currently authorized
     * @custom:error Throws Unauthorized if caller is not allowed by AccessControlManager
     * @custom:event Emits AuthorizedSenderRemoved when sender is successfully removed
     */
    function removeAuthorizedSender(address sender) external {
        _checkAccessAllowed("removeAuthorizedSender(address)");
        if (!authorizedSenders[sender]) {
            revert SenderNotAuthorized();
        }
        authorizedSenders[sender] = false;
        emit AuthorizedSenderRemoved(sender);
    }

    /**
     * @notice Adds a new type of update to the list of authorized update types
     * @param newUpdateType New type of update to allow
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
        if (_updateTypeExists(newUpdateType)) {
            revert UpdateTypeAlreadyExists();
        }
        activeUpdateTypes[newUpdateType] = true;
        allUpdateTypes.push(newUpdateType);
        emit UpdateTypeAdded(newUpdateType);
    }

    /**
     * @notice Sets the active status of an existing update type
     * @param updateType The update type to set active status for
     * @param active True to activate, false to deactivate
     * @custom:error Throws UpdateTypeNotFound if update type doesn't exist
     * @custom:error Throws UpdateTypeStatusAlreadySet if status is already set to the desired value
     * @custom:error Throws Unauthorized if caller is not allowed by AccessControlManager
     * @custom:event Emits UpdateTypeActiveStatusSet when status is successfully changed
     */
    function setUpdateTypeActive(string memory updateType, bool active) external {
        _checkAccessAllowed("setUpdateTypeActive(string,bool)");

        if (!_updateTypeExists(updateType)) {
            revert UpdateTypeNotFound();
        }

        bool previousActive = activeUpdateTypes[updateType];
        if (previousActive == active) {
            revert UpdateTypeStatusAlreadySet();
        }

        activeUpdateTypes[updateType] = active;
        emit UpdateTypeActiveStatusSet(updateType, previousActive, active);
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
     * @custom:error Throws UnauthorizedUpdateType if update type is not active
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
    ) external {
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
     * @custom:error Throws UnauthorizedUpdateType if any update type is not active
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
    ) external {
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
    function getLatestUpdateByParameterAndMarket(
        string memory updateType,
        address market
    ) external view returns (RiskParameterUpdate memory) {
        uint256 updateId = latestUpdateIdByMarketAndType[market][updateType];
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
     * @custom:error Throws SenderNotAuthorized if caller is not an authorized sender
     * @custom:error Throws ZeroAddressNotAllowed if market is zero address
     * @custom:error Throws UnauthorizedUpdateType if update type is not active
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
    ) internal onlyAuthorized {
        ensureNonzeroAddress(market);
        if (!activeUpdateTypes[updateType]) {
            revert UnauthorizedUpdateType();
        }
        ++updateCounter;
        uint256 previousUpdateId = latestUpdateIdByMarketAndType[market][updateType];
        bytes memory previousValue = updatesById[previousUpdateId].newValue;

        bytes32 updateTypeKey = keccak256(bytes(updateType));

        RiskParameterUpdate memory newUpdate = RiskParameterUpdate({
            referenceId: referenceId,
            updateId: updateCounter,
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
        updatesById[updateCounter] = newUpdate;

        // Update the latest update ID for the market and updateType
        latestUpdateIdByMarketAndType[market][updateType] = updateCounter;

        emit UpdatePublished(
            referenceId,
            updateCounter,
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
     * @notice Checks if an update type exists in the allUpdateTypes array
     * @param updateType The update type to check
     * @return True if the update type exists, false otherwise
     */
    function _updateTypeExists(string memory updateType) internal view returns (bool) {
        for (uint256 i = 0; i < allUpdateTypes.length; ++i) {
            if (keccak256(bytes(allUpdateTypes[i])) == keccak256(bytes(updateType))) {
                return true;
            }
        }
        return false;
    }
}
