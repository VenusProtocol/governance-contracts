// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.25;

import { OwnableUpgradeable } from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import { Ownable2StepUpgradeable } from "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";
import { RiskParameterUpdate } from "./Interfaces/IRiskOracle.sol";
import { IRiskSteward } from "./Interfaces/IRiskSteward.sol";
import { ensureNonzeroAddress } from "@venusprotocol/solidity-utilities/contracts/validators.sol";
import { AccessControlledV8 } from "../Governance/AccessControlledV8.sol";
import { IIsolatedPoolsComptroller } from "../interfaces/IIsolatedPoolsComptroller.sol";
import { IVToken } from "../interfaces/IVToken.sol";
import { OAppUpgradeable, Origin } from "@layerzerolabs/oapp-evm-upgradeable/contracts/oapp/OAppUpgradeable.sol";

/**
 * @title DestinationStewardReceiver
 * @author Venus
 * @notice Destination‑chain contract that receives bridged updates from `RiskStewardReceiver` (source chain)
 *         via LayerZero, enforces a fixed remote delay, and then executes the updates on the configured
 *         `IRiskSteward` contracts.
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

    struct RiskParamConfig {
        bool active;
        uint256 debounce; 
        address riskSteward;
    }

    /**
     * @notice Struct tracking the registered update for a given (updateType, market) pair
     * @dev `arrivalTime` is when the update was received on this chain; unlock time is derived as
     *      `arrivalTime + REMOTE_DELAY` instead of being stored separately.
     */
    struct RegisteredUpdate {
        uint256 updateId;
        UpdateStatus status;
        uint256 arrivalTime;
        address approver;
    }

    /**
     * @notice Time before a bridged update is considered stale on the destination chain
     */
    uint256 public constant REMOTE_UPDATE_EXPIRATION_TIME = 2 days;

    /**
     * @notice Fixed delay before a bridged update can be executed on the destination chain
     */
    uint256 public constant REMOTE_DELAY = 6 hours;

    /**
     * @notice Source chain id
     */
    uint32 public immutable LAYER_ZERO_CHAIN_ID;

    /**
     * @notice Mapping of supported risk configurations per update type (hashed updateType string)
     */
    mapping(bytes32 => RiskParamConfig) public riskParameterConfigs;

    /**
     * @notice Mapping from hashed updateType to original human-readable string label
     */
    mapping(bytes32 => string) public updateTypeLabels;

    /**
     * @notice Master storage of all bridged updates by update ID
     */
    mapping(uint256 updateId => RiskParameterUpdate) public updates;

    /**
     * @notice Mapping from (updateType, market) to currently registered remote update metadata
     */
    mapping(bytes32 => mapping(address market => RegisteredUpdate)) public registeredUpdates;

    /**
     * @notice Track last executed update timestamp per (updateType, market)
     */
    mapping(bytes32 => mapping(address market => uint256)) public lastExecutedAt;

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
        uint256 previousTimelock,
        uint256 timelock,
        bool previousActive,
        bool active
    );

    /**
     * @notice Emitted when a bridged update is registered on the destination
     */
    event RemoteUpdateRegistered(
        uint256 indexed updateId,
        uint256 arrivalTime,
        string updateType,
        address indexed market
    );

    /**
     * @notice Emitted when a bridged update is executed on the destination
     */
    event RemoteUpdateExecuted(uint256 indexed updateId);

    /**
     * @notice Emitted when an approver status is set on the destination
     */
    event ApproverStatusUpdated(address indexed approver, bool previousApproved, bool indexed approved);

    /**
     * @notice Emitted when an update is approved on the destination
     */
    event SetApproved(uint256 indexed updateId, address indexed approver);

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
     * @notice Thrown when trying to execute an already executed update
     */
    error UpdateAlreadyExecuted();

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
     * @notice Thrown when an address is not an approver
     */
    error NotAnApprover();
    /**
     * @notice Thrown when an update has not been approved
     */
    error UpdateNotApproved();

    /**
     * @notice Disables initializers and sets immutable values.
     * @param endpoint_ Local LayerZero endpoint on this chain
     * @param layerZeroChainId_ LayerZero endpoint ID for this destination chain
     * @custom:oz-upgrades-unsafe-allow constructor
     */
    constructor(address endpoint_, uint32 layerZeroChainId_) OAppUpgradeable(endpoint_) {
        _disableInitializers();
        ensureNonzeroAddress(endpoint_);
        LAYER_ZERO_CHAIN_ID = layerZeroChainId_;
        emit RemoteDelaySet(REMOTE_DELAY);
    }

    /**
     * @notice Initializes the contract with the Access Control Manager and owner.
     * @param accessControlManager_ The address of the access control manager
     * @param owner_ The owner (and LayerZero delegate) of this contract
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
     * @notice Sets the risk parameter config for a given update type on the destination chain
     * @param updateType The type of update to configure (e.g., "supplyCap", "borrowCap")
     * @param riskSteward The address for the risk steward contract responsible for processing the update
     * @param debounce The debounce period for updates of this type on the destination (anti‑DoS)
     * @param timelock Unused on destination but kept for struct compatibility
     * @custom:access Only owner
     * @custom:event Emits RiskParameterConfigUpdated
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
            revert();
        }

        if (debounce == 0) {
            revert();
        }

        bytes32 key = keccak256(bytes(updateType));
        RiskParamConfig memory previousConfig = riskParameterConfigs[key];

        // Add the label if not already stored
        if (bytes(updateTypeLabels[key]).length == 0) {
            updateTypeLabels[key] = updateType;
        }

        riskParameterConfigs[key] = RiskParamConfig({
            active: true,
            debounce: debounce,
            riskSteward: riskSteward
        });

        emit RiskParameterConfigUpdated(
            key,
            updateType,
            previousConfig.riskSteward,
            riskSteward,
            previousConfig.debounce,
            debounce,
            0,
            timelock,
            previousConfig.active,
            true
        );
    }

    /**
     * @notice Mapping from approver address to whitelist status
     */
    mapping(address => bool) public whitelistedApprovers;

    /**
     * @notice Sets the whitelist status of an approver on the destination chain
     * @param approver The address of the approver
     * @param approved The whitelist status to set (true to whitelist, false to remove)
     * @custom:access Controlled by AccessControlManager
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
     * @notice Approves a remote update for execution on the destination chain
     * @param updateId The oracle update ID of the update to approve
     * @custom:access Only whitelisted approvers can approve updates
     */
    function approveUpdate(uint256 updateId) external {
        if (!whitelistedApprovers[msg.sender]) {
            revert NotAnApprover();
        }

        RiskParameterUpdate memory update = updates[updateId];
        if (update.updateId == 0) {
            revert UpdateNotFound();
        }

        bytes32 updateTypeKey = keccak256(bytes(update.updateType));
        RegisteredUpdate storage reg = registeredUpdates[updateTypeKey][update.market];

        if (reg.updateId != updateId || reg.status != UpdateStatus.Pending) {
            revert UpdateNotFound();
        }

        if (update.timestamp + REMOTE_UPDATE_EXPIRATION_TIME < block.timestamp) {
            revert UpdateIsExpired();
        }

        reg.approver = msg.sender;
        emit SetApproved(updateId, msg.sender);
    }

    /**
     * @notice Rejects a registered remote update on the destination chain
     * @param updateId The oracle update ID of the update to reject
     * @custom:access Controlled by AccessControlManager
     */
    function rejectUpdate(uint256 updateId) external {
        _checkAccessAllowed("rejectUpdate(uint256)");

        RiskParameterUpdate memory update = updates[updateId];
        if (update.updateId == 0) {
            revert UpdateNotFound();
        }

        bytes32 updateTypeKey = keccak256(bytes(update.updateType));
        RegisteredUpdate storage reg = registeredUpdates[updateTypeKey][update.market];

        if (reg.updateId != updateId || reg.status != UpdateStatus.Pending) {
            revert UpdateNotFound();
        }

        reg.status = UpdateStatus.Rejected;
        emit UpdateRejected(updateId);
    }

    /**
     * @notice Executes a bridged update after its remote delay has passed
     * @param updateId The bridged update ID to execute
     * @custom:access Anyone can execute unlocked updates
     */
    function executeUpdate(uint256 updateId) external {
        RiskParameterUpdate memory update = updates[updateId];
        bytes32 updateTypeKey = keccak256(bytes(update.updateType));
        RiskParamConfig memory config = riskParameterConfigs[updateTypeKey];

        if (!config.active) {
            revert ConfigNotActive();
        }

        // Destination-side debounce based on last execution for this (updateType, market)
        uint256 lastExecutionTime = lastExecutedAt[updateTypeKey][update.market];
        if (lastExecutionTime != 0 && (block.timestamp - lastExecutionTime < config.debounce)) {
            revert UpdateTooFrequent();
        }

        RegisteredUpdate storage reg = registeredUpdates[updateTypeKey][update.market];

        if (reg.updateId != updateId || reg.status != UpdateStatus.Pending) {
            revert UpdateNotFound();
        }

        if (block.timestamp < reg.arrivalTime + REMOTE_DELAY) {
            revert UpdateNotUnlocked();
        }

        if (update.timestamp + REMOTE_UPDATE_EXPIRATION_TIME < block.timestamp) {
            revert UpdateIsExpired();
        }

        if (reg.approver == address(0)) {
            revert UpdateNotApproved();
        }

        IRiskSteward(config.riskSteward).processUpdate(update);

        lastExecutedAt[updateTypeKey][update.market] = block.timestamp;

        reg.status = UpdateStatus.Executed;

        emit RemoteUpdateExecuted(updateId);
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
        IVToken[] memory markets = IIsolatedPoolsComptroller(comptroller).getAllMarkets();
        uint256 maxUpdates = markets.length;
        uint256[] memory tempArray = new uint256[](maxUpdates);
        uint256 count = 0;

        for (uint256 i = 0; i < maxUpdates; ++i) {
            address market = address(markets[i]);

            RegisteredUpdate memory reg = registeredUpdates[updateTypeKey][market];
            uint256 registeredUpdateId = reg.updateId;
            if (registeredUpdateId == 0) continue;
            if (reg.status != UpdateStatus.Pending) continue;

            RiskParameterUpdate memory update = updates[registeredUpdateId];
            RiskParamConfig memory config = riskParameterConfigs[updateTypeKey];
            if (!config.active) continue;

            // Debounce: skip if last execution for this (updateType, market) is too recent
            uint256 lastExecutionTime = lastExecutedAt[updateTypeKey][market];
            if (lastExecutionTime != 0 && (block.timestamp - lastExecutionTime < config.debounce)) continue;

            if (block.timestamp < reg.arrivalTime + REMOTE_DELAY) continue;
            if (reg.approver == address(0)) continue;
            if (update.timestamp + REMOTE_UPDATE_EXPIRATION_TIME < block.timestamp) continue;

            tempArray[count] = registeredUpdateId;
            count++;
        }

        executableUpdates = new uint256[](count);
        for (uint256 i = 0; i < count; ++i) {
            executableUpdates[i] = tempArray[i];
        }
    }

    /**
     * @dev Handles incoming LayerZero messages containing a full `RiskParameterUpdate`
     *      sent by the source‑chain `RiskStewardReceiver`.
     */
    function _lzReceive(Origin calldata, bytes32, bytes calldata payload, address, bytes calldata) internal override {
        RiskParameterUpdate memory update = abi.decode(payload, (RiskParameterUpdate));
        bytes32 updateTypeKey = keccak256(bytes(update.updateType));

        RegisteredUpdate storage reg = registeredUpdates[updateTypeKey][update.market];
        uint256 newId = update.updateId;

        // Always store the update itself
        updates[newId] = update;
        uint256 arrivalTime = block.timestamp;

        // Check if there is an existing registered pending & non-expired update
        if (reg.updateId != 0 && reg.status == UpdateStatus.Pending) {
            RiskParameterUpdate storage cur = updates[reg.updateId];

            // If still valid (not expired), do NOT override the registry
            if (cur.timestamp + REMOTE_UPDATE_EXPIRATION_TIME >= block.timestamp) {
                emit RemoteUpdateRegistered(newId, arrivalTime, update.updateType, update.market);
                return;
            }
        }

        // Otherwise, write new pending entry
        reg.updateId = newId;
        reg.status = UpdateStatus.Pending;
        reg.arrivalTime = arrivalTime;
        reg.approver = address(0);

        emit RemoteUpdateRegistered(newId, arrivalTime, update.updateType, update.market);
    }
}
