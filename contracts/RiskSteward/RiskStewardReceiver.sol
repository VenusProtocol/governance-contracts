// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.25;

import { OwnableUpgradeable } from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import { Ownable2StepUpgradeable } from "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";
import { IRiskSteward } from "./Interfaces/IRiskSteward.sol";
import { IRiskOracle, RiskParameterUpdate } from "./Interfaces/IRiskOracle.sol";
import { IRiskStewardReceiver } from "./Interfaces/IRiskStewardReceiver.sol";
import { AccessControlledV8 } from "../Governance/AccessControlledV8.sol";
import { ensureNonzeroAddress } from "@venusprotocol/solidity-utilities/contracts/validators.sol";
import { ICorePoolComptroller } from "../interfaces/ICorePoolComptroller.sol";
import { OAppUpgradeable, MessagingFee, Origin } from "@layerzerolabs/oapp-evm-upgradeable/contracts/oapp/OAppUpgradeable.sol";
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
     * @notice Period after which a proposed update becomes expired and can no longer be applied
     */
    uint256 public constant UPDATE_EXPIRATION_TIME = 1 days;

    /**
     * @notice Source chain LayerZero endpoint ID
     */
    uint32 public immutable LAYER_ZERO_EID;

    /**
     * @notice The Risk Oracle contract address
     */
    IRiskOracle public immutable RISK_ORACLE;

    /**
     * @notice Mapping of supported risk configurations and their validation parameters (keyed by hashed updateType)
     */
    mapping(bytes32 => RiskParamConfig) public riskParameterConfigs;

    /**
     * @notice Master storage of all updates by update ID
     */
    mapping(uint256 updateId => RegisteredUpdate) public updates;

    /**
     * @notice Track last processed update ID per (updateTypeKey, market)
     */
    mapping(bytes32 => mapping(address market => uint256)) public lastProcessedUpdate;

    /**
     * @notice Track the current registered update per (updateType, market) to avoid registering multiple updates
     */
    mapping(bytes32 => mapping(address market => uint256)) public lastRegisteredUpdate;

    /**
     * @notice Mapping from executor address to whitelist status
     */
    mapping(address => bool) public whitelistedExecutors;

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
    constructor(address riskOracle_, address endpoint_, uint32 layerZeroLzEid_) OAppUpgradeable(endpoint_) {
        _disableInitializers();
        ensureNonzeroAddress(riskOracle_);
        RISK_ORACLE = IRiskOracle(riskOracle_);
        LAYER_ZERO_EID = layerZeroLzEid_;
    }

    /**
     * @notice Initializes the contract with the Access Control Manager.
     * @param accessControlManager_ The address of the access control manager
     */
    function initialize(address accessControlManager_, address owner_) external initializer {
        __AccessControlled_init(accessControlManager_);
        __OApp_init(owner_);
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
     * @notice Sets the risk parameter config for a given update type
     * @param updateType The type of update to configure
     * @param riskSteward The address for the risk steward contract responsible for processing the update
     * @param debounce The debounce period for the update
     * @param timelock The timelock period before the update can be executed
     * @custom:access Controlled by AccessControlManager
     * @custom:event Emits RiskParameterConfigUpdated
     * @custom:error Throws UnsupportedUpdateType if the update type is an empty string
     * @custom:error Throws InvalidDebounce if the debounce is 0
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
     * @notice Sets the whitelist executor
     * @param executor The address of the executor
     * @param approved The whitelist status to set (true to whitelist, false to remove)
     * @custom:access Controlled by AccessControlManager
     * @custom:event Emits ExecutorStatusUpdated with the executor address, previous approval status, and approval status
     * @custom:error Throws ZeroAddressNotAllowed if the executor address is zero
     */
    function setWhitelistedExecutor(address executor, bool approved) external {
        _checkAccessAllowed("setWhitelistedExecutor(address,bool)");
        ensureNonzeroAddress(executor);

        bool previousApproved = whitelistedExecutors[executor];
        if (previousApproved == approved) {
            return;
        }

        whitelistedExecutors[executor] = approved;
        emit ExecutorStatusUpdated(executor, previousApproved, approved);
    }

    /**
     * @notice Processes an update from the Risk Oracle. Validates and either executes immediately,
     * registers with timelock, or forwards cross-chain.
     * @param updateId The update ID from the oracle's perspective
     * @custom:access Anyone can process updates
     * @custom:event Emits UpdateRegistered, UpdateExecuted, or UpdateSentToDestination depending on the update type
     * @custom:error Throws UpdateAlreadyResolved if the update was already processed
     * @custom:error Throws UpdateIsExpired if the update has expired
     * @custom:error Throws ConfigNotActive if the config is not active
     * @custom:error Throws UpdateTooFrequent if the debounce period has not passed
     * @custom:error Throws RegisteredUpdateTypeExist if there is a non-expired pending update of the same type
     */
    function processUpdate(uint256 updateId) external {
        RiskParameterUpdate memory update = RISK_ORACLE.getUpdateById(updateId);
        RiskParamConfig memory config = riskParameterConfigs[update.updateTypeKey];
        _ensureNoActiveUpdate(update);
        _validateRegisterUpdate(update, config);

        // Check Remote Update
        if (update.destLzEid != 0 && update.destLzEid != LAYER_ZERO_EID) {
            _sendRemoteUpdate(update);
            return;
        }
        _registerOrExecuteUpdate(update, config);
    }

    /**
     * @notice Executes a registered update. Only whitelisted executors can call this function.
     *         This function can be used for updates that are in Executable status.
     * @param updateId The oracle update ID of the update to execute
     * @custom:access Only whitelisted executors can call this function
     * @custom:event Emits UpdateExecuted with the oracle update ID
     * @custom:error Throws NotAnExecutor if the caller is not a whitelisted executor
     * @custom:error Throws UpdateAlreadyResolved if the update was already executed or rejected
     * @custom:error Throws UpdateIsExpired if the update has expired
     * @custom:error Throws ConfigNotActive if the config is not active
     * @custom:error Throws UpdateNotUnlocked if the unlock time has not passed
     */
    function executeRegisteredUpdate(uint256 updateId) external {
        if (!whitelistedExecutors[msg.sender]) {
            revert NotAnExecutor();
        }

        RegisteredUpdate storage registeredUpdate = updates[updateId];
        RiskParameterUpdate memory update = RISK_ORACLE.getUpdateById(updateId);
        RiskParamConfig memory config = riskParameterConfigs[update.updateTypeKey];

        _validateExecuteUpdate(registeredUpdate, update, config);
        _executeUpdate(update, IRiskSteward(config.riskSteward));
    }

    /**
     * @notice Rejects a registered update
     * @param updateId The oracle update ID of the update to reject
     * @custom:access Controlled by AccessControlManager
     * @custom:event Emits UpdateRejected with the oracle update ID
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
     * @notice Resends a remote update to the destination chain. Only whitelisted executors can call this function.
     *         This function is useful in case of bridge failures.
     * @dev Duplicate update rejection is handled in the destination contract itself, so resending
     *      the same update multiple times is safe and will be deduplicated on the destination side.
     * @param updateId The oracle update ID to resend
     * @custom:access Only whitelisted executors can call this function
     * @custom:event Emits UpdateResentToDestination with the update ID, destination chain ID, update type, and market
     * @custom:error Throws NotAnExecutor if the caller is not a whitelisted executor
     * @custom:error Throws InvalidUpdateToResend if the update status is not SENT_TO_DESTINATION
     * @custom:error Throws UpdateIsExpired if the update has expired
     */
    function resendRemoteUpdate(uint256 updateId) external {
        if (!whitelistedExecutors[msg.sender]) {
            revert NotAnExecutor();
        }

        RegisteredUpdate storage registeredUpdate = updates[updateId];
        if (registeredUpdate.status != UpdateStatus.SENT_TO_DESTINATION) {
            revert InvalidUpdateToResend();
        }

        RiskParameterUpdate memory update = RISK_ORACLE.getUpdateById(updateId);

        // Check if update is expired
        if (update.timestamp + UPDATE_EXPIRATION_TIME < block.timestamp) {
            revert UpdateIsExpired();
        }

        _sendRemoteUpdate(update);
        emit UpdateResentToDestination(update.updateId, update.destLzEid, update.updateType, update.market);
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
        address[] memory markets = ICorePoolComptroller(comptroller).getAllMarkets();
        uint256 maxUpdates = markets.length;
        uint256[] memory tempArray = new uint256[](maxUpdates);
        uint256 count = 0;

        for (uint256 i = 0; i < maxUpdates; ++i) {
            uint256 registeredUpdateId = lastRegisteredUpdate[updateTypeKey][markets[i]];
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
     * @notice Returns the current status of an update, checking expiration and execution conditions.
     * @param updateId The oracle update ID to query
     * @return The current `UpdateStatus` for the given update ID (may differ from stored status if expired or executable)
     */
    function getUpdateStatus(uint256 updateId) external view returns (UpdateStatus) {
        return _getCurrentStatus(updateId);
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
     * @notice Returns the last processed update ID for a given update type and market
     * @param updateType The human-readable identifier of the update type
     * @param market The address of the market
     * @return The last processed update ID
     */
    function getLastProcessedUpdate(string calldata updateType, address market) external view returns (uint256) {
        bytes32 key = keccak256(bytes(updateType));
        return lastProcessedUpdate[key][market];
    }

    /**
     * @notice Returns the last registered update ID for a given update type and market
     * @param updateType The human-readable identifier of the update type
     * @param market The address of the market
     * @return The last registered update ID
     */
    function getLastRegisteredUpdate(string calldata updateType, address market) external view returns (uint256) {
        bytes32 key = keccak256(bytes(updateType));
        return lastRegisteredUpdate[key][market];
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
        fee = _quote(update.destLzEid, payload, options, payInLzToken);
    }

    /**
     * @notice Sends a `RiskParameterUpdate` to a destination chain via LayerZero.
     * @param dstEid Destination chain endpoint ID
     * @param update The risk parameter update payload to send
     * @param options LayerZero message options; if empty, a default executor option is used
     * @param fee Messaging fee structure returned by `quote`
     * @param refundAddress Address to receive any surplus fee refunds
     * @custom:error InvalidLzSendCaller if called by any address other than this contract
     */
    function lzSend(
        uint32 dstEid,
        RiskParameterUpdate memory update,
        bytes memory options,
        MessagingFee memory fee,
        address refundAddress
    ) public payable {
        if (msg.sender != address(this)) {
            revert InvalidLzSendCaller();
        }

        bytes memory payload = abi.encode(update);
        bytes memory options_ = options.length == 0
            ? OptionsBuilder.newOptions().addExecutorLzReceiveOption(1_000_000, 0)
            : options;
        _lzSend(dstEid, payload, options_, fee, refundAddress);
    }

    /**
     * @notice Registers an update from the Risk Oracle with a timelock, or executes it immediately if safe.
     * @param update The risk parameter update from the Risk Oracle to register or execute
     * @param config The risk parameter configuration for this update type containing timelock and risk steward address
     * @custom:event Emits UpdateRegistered with the oracle update ID, unlock time (or current timestamp if executed immediately), update type, and market
     * @custom:event Emits UpdateExecuted if the update is safe for direct execution and is executed immediately
     */
    function _registerOrExecuteUpdate(RiskParameterUpdate memory update, RiskParamConfig memory config) internal {
        uint256 updateId = update.updateId;
        lastRegisteredUpdate[update.updateTypeKey][update.market] = update.updateId;

        IRiskSteward riskSteward = IRiskSteward(config.riskSteward);
        bool safeForDirectExecution = riskSteward.isSafeForDirectExecution(update);

        // If safe for direct execution, execute immediately
        if (safeForDirectExecution) {
            emit UpdateRegistered(updateId, block.timestamp, update.updateType, update.market);
            _executeUpdate(update, riskSteward);
            return;
        }

        // Otherwise, use the configured timelock period to register the update
        uint256 unlockTime = block.timestamp + config.timelock;
        updates[updateId] = RegisteredUpdate({
            updateId: updateId,
            unlockTime: unlockTime,
            status: UpdateStatus.Pending,
            executor: address(0),
            executedAt: 0
        });
        emit UpdateRegistered(updateId, unlockTime, update.updateType, update.market);
    }

    /**
     * @notice Executes a validated update via the risk steward and records its execution metadata.
     *         Updates the registered update storage, last processed tracking, and emits the execution event.
     * @param update The risk parameter update to execute
     * @param steward The risk steward contract that will process the update
     * @custom:event Emits UpdateExecuted with the oracle update ID
     */
    function _executeUpdate(RiskParameterUpdate memory update, IRiskSteward steward) internal {
        uint256 updateId = update.updateId;
        uint256 timestamp = block.timestamp;
        steward.processUpdate(update);

        updates[updateId] = RegisteredUpdate({
            updateId: updateId,
            unlockTime: timestamp, // executes immediately
            status: UpdateStatus.Executed,
            executor: address(msg.sender),
            executedAt: timestamp
        });

        lastProcessedUpdate[update.updateTypeKey][update.market] = updateId;
        emit UpdateExecuted(updateId);
    }

    /**
     * @notice Sends a risk parameter update to a destination chain via LayerZero and records it as sent.
     *         Quotes the messaging fee, sends the encoded update payload, updates tracking mappings, and emits the send event.
     * @param update The risk parameter update to send to the destination chain
     * @custom:event Emits UpdateSentToDestination with the update ID, destination endpoint ID, update type, and market
     */
    function _sendRemoteUpdate(RiskParameterUpdate memory update) internal {
        MessagingFee memory fee = quote(update, "0x", false);
        lzSend(update.destLzEid, update, "0x", fee, address(this)); // TODO :transfer fee

        updates[update.updateId] = RegisteredUpdate({
            updateId: update.updateId,
            unlockTime: block.timestamp,
            status: UpdateStatus.SENT_TO_DESTINATION,
            executor: address(msg.sender),
            executedAt: block.timestamp
        });

        bytes32 updateTypeKey = update.updateTypeKey;
        lastRegisteredUpdate[updateTypeKey][update.market] = update.updateId;
        lastProcessedUpdate[updateTypeKey][update.market] = update.updateId;

        emit UpdateSentToDestination(update.updateId, update.destLzEid, update.updateType, update.market);
    }

    /**
     * @notice Ensures there is no other pending registered update of the same type for the same market.
     *         If a pending update exists and is expired, it is marked as expired and a new update can proceed.
     *         If a pending update exists and is not expired, the call reverts to prevent overlapping updates.
     * @param update The risk parameter update being registered
     * @custom:event Emits UpdateExpired with the ID of the previously pending update if it is found to be expired
     * @custom:error RegisteredUpdateTypeExist if there is a non‑expired pending update of the same type for the market
     */
    function _ensureNoActiveUpdate(RiskParameterUpdate memory update) internal {
        uint256 registeredUpdateId = lastRegisteredUpdate[update.updateTypeKey][update.market];
        if (registeredUpdateId == 0) return; // no prior update of this type for this market

        RegisteredUpdate storage existing = updates[registeredUpdateId];
        if (existing.status != UpdateStatus.Pending) return;

        // Check expiration
        RiskParameterUpdate memory existingUpdate = RISK_ORACLE.getUpdateById(registeredUpdateId);
        bool expired = existingUpdate.timestamp + UPDATE_EXPIRATION_TIME < block.timestamp;

        if (expired) {
            existing.status = UpdateStatus.Expired;
            emit UpdateExpired(registeredUpdateId);
            return;
        }

        // If still pending & not expired reject new update
        revert RegisteredUpdateTypeExist(registeredUpdateId);
    }

    /**
     * @notice Validates an oracle update before registration.
     * @param update The risk parameter update to validate
     * @param config The configuration for this update type
     * @custom:error UpdateAlreadyResolved if the update was already registered
     * @custom:error ConfigNotActive if the configuration for the update type is not active
     * @custom:error UpdateIsExpired if the update has expired or is not the latest for the given market and type
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

        // Check debounce
        uint256 lastProcessedId = lastProcessedUpdate[update.updateTypeKey][update.market];
        uint256 lastExecutionTime = updates[lastProcessedId].executedAt;
        if (lastExecutionTime != 0 && (lastExecutionTime + config.debounce > block.timestamp)) {
            revert UpdateTooFrequent();
        }
    }

    /**
     * @notice Validates a registered update before execution.
     * @param registeredUpdate The stored registered update metadata
     * @param update The risk parameter update fetched from the oracle
     * @param config The configuration for this update type
     * @custom:error ConfigNotActive if the configuration for the update type is not active
     * @custom:error UpdateAlreadyResolved if the update was already executed or rejected
     * @custom:error UpdateIsExpired if the update has expired
     * @custom:error UpdateNotUnlocked if the unlock time has not passed
     */
    function _validateExecuteUpdate(
        RegisteredUpdate memory registeredUpdate,
        RiskParameterUpdate memory update,
        RiskParamConfig memory config
    ) internal view {
        if (!config.active) {
            revert ConfigNotActive();
        }

        if (registeredUpdate.status != UpdateStatus.Pending) {
            revert UpdateAlreadyResolved();
        }

        if (update.timestamp + UPDATE_EXPIRATION_TIME < block.timestamp) {
            revert UpdateIsExpired();
        }

        if (block.timestamp < registeredUpdate.unlockTime) {
            revert UpdateNotUnlocked();
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

        // For non-pending status, return stored status
        if (storedStatus != UpdateStatus.Pending) {
            return storedStatus;
        }

        RiskParameterUpdate memory update = RISK_ORACLE.getUpdateById(updateId);
        RiskParamConfig memory config = riskParameterConfigs[update.updateTypeKey];

        // Check if expired
        if (update.timestamp + UPDATE_EXPIRATION_TIME < block.timestamp) {
            return UpdateStatus.Expired;
        }

        // Check execution conditions
        if (config.active && block.timestamp >= registeredUpdate.unlockTime) {
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
    function renounceOwnership() public pure override {
        revert RenounceOwnershipNotAllowed();
    }
}
