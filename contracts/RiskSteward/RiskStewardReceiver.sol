// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.25;

import { OwnableUpgradeable } from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import { Ownable2StepUpgradeable } from "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";
import { IRiskSteward } from "./Interfaces/IRiskSteward.sol";
import { IRiskOracle, RiskParameterUpdate } from "./Interfaces/IRiskOracle.sol";
import { IRiskStewardReceiver } from "./Interfaces/IRiskStewardReceiver.sol";
import { AccessControlledV8 } from "../Governance/AccessControlledV8.sol";
import { ensureNonzeroAddress } from "@venusprotocol/solidity-utilities/contracts/validators.sol";
import { IIsolatedPoolsComptroller } from "../interfaces/IIsolatedPoolsComptroller.sol";
import { IVToken } from "../interfaces/IVToken.sol";
import {
    OAppUpgradeable,
    MessagingFee,
    Origin
} from "@layerzerolabs/oapp-evm-upgradeable/contracts/oapp/OAppUpgradeable.sol";
import { OptionsBuilder } from "@layerzerolabs/oapp-evm/contracts/oapp/libs/OptionsBuilder.sol";

/**
 * @title RiskStewardReceiver
 * @author Venus
 * @notice Contract that reads updates from a Risk Oracle, validates them with timelock and debounce,
 *         and either executes them locally via the configured RiskSteward or forwards them cross‑chain.
 * @custom:security-contact https://github.com/VenusProtocol/governance-contracts#discussion
 */
contract RiskStewardReceiver is IRiskStewardReceiver, AccessControlledV8, OAppUpgradeable {
    using OptionsBuilder for bytes;

    /**
     * @notice Time before a submitted update is considered stale
     */
    uint256 public constant UPDATE_EXPIRATION_TIME = 1 days;

    /**
     * @notice Source chain id
     */
    uint32 public immutable LAYER_ZERO_CHAIN_ID;

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
     * @notice Track the current registerd update per (updateType, market) to avoid registering multiple updates
     */
    mapping(bytes32 => mapping(address market => uint256)) public registeredUpdates;

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
     * @notice Disables initializers and sets the Risk Oracle
     * @param riskOracle_ The address of the Risk Oracle contract
     * @custom:oz-upgrades-unsafe-allow constructor
     */
    constructor(address riskOracle_, address endpoint_, uint32 layerZeroChainId_) OAppUpgradeable(endpoint_) {
        _disableInitializers();
        ensureNonzeroAddress(riskOracle_);
        RISK_ORACLE = IRiskOracle(riskOracle_);
        LAYER_ZERO_CHAIN_ID = layerZeroChainId_;
    }

    /**
     * @notice Initializes the contract with the Access Control Manager.
     * @param accessControlManager_ The address of the access control manager
     */
    function initialize(address accessControlManager_, address owner_) external initializer {
        __AccessControlled_init(accessControlManager_);
        __OApp_init(owner_);
    }

    // TODO: validate Storage layout
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
     * @notice Returns the current status of an update, checking expiration and execution conditions.
     * @param updateId The oracle update ID to query
     * @return The current `UpdateStatus` for the given update ID (may differ from stored status if expired or executable)
     */
    function getUpdateStatus(uint256 updateId) external view returns (UpdateStatus) {
        return _getCurrentStatus(updateId);
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
        RiskParameterUpdate memory update = RISK_ORACLE.getUpdateById(updateId);
        bytes32 updateTypeKey = keccak256(bytes(update.updateType));
        RiskParamConfig memory config = riskParameterConfigs[updateTypeKey];

        if (update.destChainId != 0 && update.destChainId != LAYER_ZERO_CHAIN_ID) {
            // Here debounce is only for the bridge to avoid DOS, the main debounce is on the destination.
            _validateRegisterUpdate(update, config);
            _sendRemoteUpdate(update);
            return;
        }

        _ensureNoActiveUpdate(update);
        _validateRegisterUpdate(update, config);
        registeredUpdates[updateTypeKey][update.market] = updateId;

        // Check if update is within safe delta based on risk steward's validation
        IRiskSteward riskSteward = IRiskSteward(config.riskSteward);
        bool withinSafeDelta = riskSteward.isWithinSafeDelta(update);

        // If within safe delta, set unlockTime to current time (immediate execution)
        if (withinSafeDelta) {
            _executeImmediateUpdate(updateId, update, riskSteward, updateTypeKey);
            return;
        }

        // Otherwise, use the configured timelock period
        uint256 unlockTime = block.timestamp + config.timelock;
        updates[updateId] = RegisteredUpdate({
            updateId: updateId,
            unlockTime: unlockTime,
            status: UpdateStatus.Pending,
            approver: address(0),
            executedAt: 0
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
    function executeUpdate(uint256 updateId) external {
        RegisteredUpdate storage registeredUpdate = updates[updateId];
        RiskParameterUpdate memory update = RISK_ORACLE.getUpdateById(updateId);
        bytes32 updateTypeKey = keccak256(bytes(update.updateType));
        RiskParamConfig memory config = riskParameterConfigs[updateTypeKey];

        _validateExecuteUpdate(registeredUpdate, update, config);
        IRiskSteward(config.riskSteward).processUpdate(update);

        registeredUpdate.status = UpdateStatus.Executed;
        registeredUpdate.executedAt = block.timestamp;
        lastProcessedUpdate[updateTypeKey][update.market] = updateId;

        emit UpdateExecuted(updateId);
    }

    /**
     * @notice Approves an update for execution. Only updates with Pending status can be approved.
     * @param updateId The oracle update ID of the update to approve
     * @custom:access Only whitelisted approvers can approve updates
     * @custom:event Emits SetApproved with the oracle update ID and approver address
     * @custom:error Throws NotAnApprover if the caller is not a whitelisted approver
     * @custom:error Throws UpdateAlreadyResolved if the update status is not Pending (e.g., already executed, rejected, expired, or sent to destination)
     */
    function approveUpdate(uint256 updateId) external {
        if (!whitelistedApprovers[msg.sender]) {
            revert NotAnApprover();
        }

        UpdateStatus currentStatus = _getCurrentStatus(updateId);
        if (currentStatus != UpdateStatus.Pending) {
            revert UpdateAlreadyResolved();
        }

        RegisteredUpdate storage registeredUpdate = updates[updateId];
        registeredUpdate.approver = msg.sender;
        emit SetApproved(updateId, msg.sender);
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

        if (registeredUpdate.status != UpdateStatus.Pending) {
            revert UpdateAlreadyResolved();
        }

        registeredUpdate.status = UpdateStatus.Rejected;
        emit UpdateRejected(updateId);
    }

    /**
     * @notice Returns an array of update IDs for executable registered updates for a given update type and comptroller.
     * @param updateType The human‑readable identifier of the update type to filter by
     * @param comptroller The address of the Isolated Pools Comptroller that manages the markets
     * @return executableUpdates Array of update IDs that are ready to be executed
     */
    function getExecutableUpdates(
        string calldata updateType,
        address comptroller
    ) external view returns (uint256[] memory executableUpdates) {
        bytes32 updateTypeKey = keccak256(bytes(updateType));
        // TODO: Update the vToken interface for getAllMarkets
        IVToken[] memory markets = IIsolatedPoolsComptroller(comptroller).getAllMarkets();
        uint256 maxUpdates = markets.length;
        uint256[] memory tempArray = new uint256[](maxUpdates);
        uint256 count = 0;

        for (uint256 i = 0; i < maxUpdates; ++i) {
            address market = address(markets[i]);
            uint256 registeredUpdateId = registeredUpdates[updateTypeKey][market];

            if (_getCurrentStatus(registeredUpdateId) != UpdateStatus.Executable) continue;
            tempArray[count] = registeredUpdateId;
            count++;
        }

        // shrink array to real size
        executableUpdates = new uint256[](count);
        for (uint256 i = 0; i < count; ++i) {
            executableUpdates[i] = tempArray[i];
        }
    }

    /**
     * @notice Sends a `RiskParameterUpdate` to a destination chain via LayerZero.
     * @param dstEid Destination chain endpoint ID
     * @param update The risk parameter update payload to send
     * @param options LayerZero message options; if empty, a default executor option is used
     * @param fee Messaging fee structure returned by `quote`
     * @param refundAddress Address to receive any surplus fee refunds
     */
    function lzSend(
        uint32 dstEid,
        RiskParameterUpdate memory update,
        bytes memory options,
        MessagingFee memory fee,
        address refundAddress
    ) public payable {
        require(msg.sender == address(this), "Invalid caller");
        bytes memory payload = abi.encode(update);
        bytes memory options_ = options.length == 0
            ? OptionsBuilder.newOptions().addExecutorLzReceiveOption(1_000_000, 0)
            : options;
        _lzSend(dstEid, payload, options_, fee, refundAddress);
    }

    /**
     * @notice Quotes the gas fee needed to pay for the full omnichain transaction in native gas or ZRO token.
     * @param update The risk parameter update payload to be sent
     * @param options Message execution options (e.g., for sending gas to the destination)
     * @param payInLzToken Whether to return the fee in ZRO token instead of native gas
     * @return fee A `MessagingFee` struct containing the calculated gas fee
     */
    function quote(
        RiskParameterUpdate memory update,
        bytes memory options,
        bool payInLzToken
    ) public view returns (MessagingFee memory fee) {
        bytes memory payload = abi.encode(update);
        fee = _quote(update.destChainId, payload, options, payInLzToken);
    }

    /**
     * @notice Executes an update immediately without timelock when it's within the safe delta threshold.
     *         Processes the update via the risk steward, marks it as executed, and updates tracking mappings.
     * @param updateId The oracle update ID to execute
     * @param update The risk parameter update to process
     * @param steward The risk steward contract that will process the update
     * @param updateTypeKey The hashed update type identifier
     */
    function _executeImmediateUpdate(
        uint256 updateId,
        RiskParameterUpdate memory update,
        IRiskSteward steward,
        bytes32 updateTypeKey
    ) internal {
        uint256 timestamp = block.timestamp;
        steward.processUpdate(update);

        updates[updateId] = RegisteredUpdate({
            updateId: updateId,
            unlockTime: timestamp, // executes immediately
            status: UpdateStatus.Executed,
            approver: address(0),
            executedAt: timestamp
        });

        lastProcessedUpdate[updateTypeKey][update.market] = updateId;
        emit UpdateExecuted(updateId);
    }

    /**
     * @notice Sends a risk parameter update to a destination chain via LayerZero.
     *         Quotes the messaging fee, sends the update, and marks it as SENT_TO_DESTINATION.
     * @param update The risk parameter update to send to the destination chain
     */
    function _sendRemoteUpdate(RiskParameterUpdate memory update) internal {
        bytes32 updateTypeKey = keccak256(bytes(update.updateType));

        MessagingFee memory fee = quote(update, "0x", false);
        lzSend(update.destChainId, update, "0x", fee, address(this)); // TODO :transfer fee

        updates[update.updateId] = RegisteredUpdate({
            updateId: update.updateId,
            unlockTime: block.timestamp,
            status: UpdateStatus.SENT_TO_DESTINATION,
            approver: address(0),
            executedAt: block.timestamp
        });

        registeredUpdates[updateTypeKey][update.market] = update.updateId;
        lastProcessedUpdate[updateTypeKey][update.market] = update.updateId;

        emit UpdateSentToDestination(update.updateId, update.destChainId, update.updateType, update.market);
    }

    /**
     * @notice Ensures there is no other pending registered update of the same type for the same market.
     *         If a pending update exists and is expired, it is marked as expired; otherwise the call reverts.
     * @param update The risk parameter update being registered
     * @custom:error RegitredUpdateTypeExist if there is a non‑expired pending update of the same type for the market
     */
    function _ensureNoActiveUpdate(RiskParameterUpdate memory update) internal {
        bytes32 updateTypeKey = keccak256(bytes(update.updateType));
        uint256 registeredUpdateId = registeredUpdates[updateTypeKey][update.market];
        if (registeredUpdateId == 0) return; // no prior update of this type for this market

        RegisteredUpdate storage existing = updates[registeredUpdateId];
        RiskParameterUpdate memory existingUpdate = RISK_ORACLE.getUpdateById(registeredUpdateId);

        if (existing.status != UpdateStatus.Pending) return;

        // Check expiration
        bool expired = existingUpdate.timestamp + UPDATE_EXPIRATION_TIME < block.timestamp;

        if (expired) {
            existing.status = UpdateStatus.Expired;
            emit UpdateExpired(registeredUpdateId);
            return;
        }

        // If still pending & not expired reject
        revert RegitredUpdateTypeExist(registeredUpdateId);
    }

    /**
     * @notice Validates an oracle update before registration.
     * @param update The risk parameter update to validate
     * @param config The configuration for this update type
     * @custom:error UpdateAlreadyResolved if the update was already registered
     * @custom:error UpdateIsExpired if the update has expired or is not the latest for the given market and type
     * @custom:error ConfigNotActive if the configuration for the update type is not active
     * @custom:error UpdateTooFrequent if the debounce period has not passed for the given market and type
     */
    function _validateRegisterUpdate(RiskParameterUpdate memory update, RiskParamConfig memory config) internal view {
        // Check if this update was already registered
        if (updates[update.updateId].status != UpdateStatus.None) {
            revert UpdateAlreadyResolved();
        }

        // Check if config is active
        if (!config.active) {
            revert ConfigNotActive();
        }

        // Check if this is the latest update for this market and type
        RiskParameterUpdate memory latestForMarketAndType = RISK_ORACLE.getLatestUpdateByParameterAndMarket(
            update.updateType,
            update.market
        );

        if (latestForMarketAndType.updateId != update.updateId) {
            revert UpdateIsExpired();
        }

        // Check expiration
        if (update.timestamp + UPDATE_EXPIRATION_TIME < block.timestamp) {
            revert UpdateIsExpired();
        }

        bytes32 updateTypeKey = keccak256(bytes(update.updateType));
        uint256 lastProcessedId = lastProcessedUpdate[updateTypeKey][update.market];
        uint256 lastExecutionTime = updates[lastProcessedId].executedAt;

        // Check debounce
        if (lastExecutionTime != 0 && (block.timestamp - lastExecutionTime < config.debounce)) {
            revert UpdateTooFrequent();
        }
    }

    /**
     * @notice Validates a registered update before execution.
     * @param registeredUpdate The stored registered update metadata
     * @param update The risk parameter update fetched from the oracle
     * @param config The configuration for this update type
     * @custom:error UpdateAlreadyResolved if the update was already executed or rejected
     * @custom:error UpdateIsExpired if the update has expired
     * @custom:error ConfigNotActive if the configuration for the update type is not active
     * @custom:error UpdateNotUnlocked if the unlock time has not passed
     * @custom:error UpdateNotApproved if the update has not been approved
     */
    function _validateExecuteUpdate(
        RegisteredUpdate memory registeredUpdate,
        RiskParameterUpdate memory update,
        RiskParamConfig memory config
    ) internal view {
        if (registeredUpdate.status != UpdateStatus.Pending) {
            revert UpdateAlreadyResolved();
        }

        if (update.timestamp + UPDATE_EXPIRATION_TIME < block.timestamp) {
            revert UpdateIsExpired();
        }

        if (!config.active) {
            revert ConfigNotActive();
        }

        if (block.timestamp < registeredUpdate.unlockTime) {
            revert UpdateNotUnlocked();
        }

        if (registeredUpdate.approver == address(0)) {
            revert UpdateNotApproved();
        }
    }

    /**
     * @notice Computes the current status of an update, including expiration and executability checks.
     * @param updateId The oracle update ID to query
     * @return The current `UpdateStatus` for the given update ID
     */
    function _getCurrentStatus(uint256 updateId) internal view returns (UpdateStatus) {
        RegisteredUpdate memory registeredUpdate = updates[updateId];
        UpdateStatus storedStatus = registeredUpdate.status;

        // If update doesn't exist (status is None), return None
        if (storedStatus == UpdateStatus.None) {
            return UpdateStatus.None;
        }

        // For non-pending statuses, return stored status
        if (storedStatus != UpdateStatus.Pending) {
            return storedStatus;
        }

        RiskParameterUpdate memory update = RISK_ORACLE.getUpdateById(updateId);
        bytes32 updateTypeKey = keccak256(bytes(update.updateType));
        RiskParamConfig memory config = riskParameterConfigs[updateTypeKey];

        // Check if expired
        if (update.timestamp + UPDATE_EXPIRATION_TIME < block.timestamp) {
            return UpdateStatus.Expired;
        }

        // Check all execution conditions
        if (
            config.active && block.timestamp >= registeredUpdate.unlockTime && registeredUpdate.approver != address(0)
        ) {
            return UpdateStatus.Executable;
        }

        return UpdateStatus.Pending;
    }

    /**
     * @dev LayerZero message receive hook
     */
    function _lzReceive(
        Origin calldata origin,
        bytes32 guid,
        bytes calldata message,
        address executor,
        bytes calldata extraData
    ) internal virtual override {}

    /**
     * @notice Disables renounceOwnership function
     * @custom:error Throws RenounceOwnershipNotAllowed
     */
    function renounceOwnership() public override {
        revert RenounceOwnershipNotAllowed();
    }
}
