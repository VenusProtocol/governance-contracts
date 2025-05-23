// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.25;

import { IRiskSteward } from "../interfaces/IRiskSteward.sol";
import { IRiskOracle, RiskParameterUpdate } from "../interfaces/IRiskOracle.sol";
import { RiskParamConfig } from "../interfaces/IRiskStewardReceiver.sol";
import { ensureNonzeroAddress } from "@venusprotocol/solidity-utilities/contracts/validators.sol";
import { RiskStewardReceiverBase } from "./RiskStewardReceiverBase.sol";
import { OApp, Origin } from "@layerzerolabs/oapp-evm/contracts/oapp/OApp.sol";

/**
 * @title RiskStewardReceiverDestination
 * @author Venus
 * @notice Contract that can read received updates from the RiskStewardReceiver and process them.
 * @custom:security-contact https://github.com/VenusProtocol/governance-contracts#discussion
 */
contract RiskStewardDestinationReceiver is OApp, RiskStewardReceiverBase {
    enum UPDATE_STATUS {
        NONE,
        RECEIVED,
        PROCESSED,
        CONFIG_NOT_ACTIVE,
        EXPIRED,
        CANCELLED,
        FAILED
    }
    /**
     * @notice Time before a submitted update is considered stale
     */
    uint256 public constant REMOTE_UPDATE_EXPIRATION_TIME = 2 days;

    /**
     * @notice Required delay before
     */

    uint256 public remoteDelay = 6 hours;

    /**
     * @notice Address of guardian, who can cancel the update, if required
     */
    address public guardian;

    /**
     * @notice Mapping of processed updates. Used to prevent re-execution
     */
    mapping(uint256 updateId => UPDATE_STATUS) public processedUpdates;

    /**
     * @notice Mapping of received timestamp of update correspond to update id
     */

    mapping(uint256 updateId => uint256 remoteTimestamp) public remoteUpdateTimestamps;

    /**
     * @notice update associated with its ID
     */
    mapping(uint256 updateId => RiskParameterUpdate) public update;

    /**
     * @notice Emitted when applying an update fails to validate or execute
     */
    event RiskParameterUpdateFailed(uint256 indexed updateId, UPDATE_STATUS indexed error);

    /**
     * @notice Emitted when the remote delay is updated
     */
    event SetRemoteDelay(uint256 indexed oldDelay, uint256 indexed newDelay);

    /**
     * @notice Emitted when a risk parameter update is canceled
     */

    event CancelUpdate(uint256 indexed updateId);

    /**
     * @notice Emitted when the guardian address updated
     */
    event SetGuardian(address prevGuardian, address newGuardian);

    /**
     * @notice Thrown when update not received from src chain
     */
    error UpdateNotReceived(uint256 updateId);

    /**
     * @notice Thrown when a caller tries to perform an action without the required permissions
     */
    error Unauthorized();

    constructor(address endpoint_, address owner_, address guardian_) OApp(endpoint_, owner_) {
        ensureNonzeroAddress(guardian_);
        guardian = guardian_;
    }

    /**
     * @notice Sets a new delay required before a remote update can be processed
     * @param newDelay The new delay duration in seconds Must be greater than zero
     * @custom:access Only owner
     * @custom:event Emitted SetRemoteDelay with previous and new delay
     */
    function setRemoteDelay(uint256 newDelay) external onlyOwner {
        require(newDelay > 0, "Delay must be greater than 0");
        emit SetRemoteDelay(remoteDelay, newDelay);
        remoteDelay = newDelay;
    }

    /**
     * @notice Cancels a pending risk parameter update
     * @param updateId The ID of the update to be canceled
     * @dev Can only be called by the guardian. The update must be in RECEIVED status
     * @custom:event Emitted CancelUpdate with updateId
     */
    function cancelUpdate(uint256 updateId) external {
        if (msg.sender != guardian) {
            revert Unauthorized();
        }
        require(processedUpdates[updateId] == UPDATE_STATUS.RECEIVED, "Status not compatible");
        emit CancelUpdate(updateId);
        processedUpdates[updateId] = UPDATE_STATUS.CANCELLED;
        delete update[updateId];
    }

    /**
     * @notice Updates the guardian address responsible for managing certain administrative functions
     * @dev Callable by the current owner or the current guardian New address must be non-zero
     * @param newGuardian The address of the new guardian
     * @custom:event Emitted SetGuardian with previous and new guardian
     */
    function setGuardian(address newGuardian) external {
        if (msg.sender != guardian && msg.sender != owner()) {
            revert Unauthorized();
        }

        ensureNonzeroAddress(newGuardian);
        emit SetGuardian(guardian, newGuardian);
        guardian = newGuardian;
    }

    /**
     * @notice Processes an update from the RiskStewardReceiver. First validates that the update has not be processed, the config is active, and is not expired.
     * If the update is valid then it is executed, otherwise an update failed error is emitted.
     * @param updateId The ID of the update
     */
    function processUpdate(uint256 updateId) public whenNotPaused {
        require(block.timestamp > remoteUpdateTimestamps[updateId] + remoteDelay, "Delay has to be surpassed");
        RiskParameterUpdate memory _update = update[updateId];
        UPDATE_STATUS error = _validateUpdateStatus(updateId, _update.updateType, remoteUpdateTimestamps[updateId]);
        if (error == UPDATE_STATUS.NONE) {
            _executeUpdate(updateId, _update.newValue, _update.updateType, _update.market);
        } else {
            processedUpdates[updateId] = error;
            emit RiskParameterUpdateFailed(updateId, error);
        }
    }

    /**
     * @notice Validates the status of an update silently. Will validate that the update configuration is active, is not expired and unprocessed.
     * @param updateId The ID of the update
     * @param updateType The type of update
     * @param timestamp Remote timestamp of the update
     * @return error The UPDATE_STATUS error code if the update is not valid or 0
     */
    function _validateUpdateStatus(
        uint256 updateId,
        string memory updateType,
        uint256 timestamp
    ) internal view returns (UPDATE_STATUS error) {
        RiskParamConfig memory config = riskParameterConfigs[updateType];

        if (!config.active) {
            return UPDATE_STATUS.CONFIG_NOT_ACTIVE;
        }

        if (timestamp + REMOTE_UPDATE_EXPIRATION_TIME < block.timestamp) {
            return UPDATE_STATUS.EXPIRED;
        }

        if (processedUpdates[updateId] == UPDATE_STATUS.PROCESSED) {
            return processedUpdates[updateId];
        }

        if (remoteUpdateTimestamps[updateId] == 0) {
            revert UpdateNotReceived(updateId);
        }

        return UPDATE_STATUS.NONE;
    }

    /**
     * @dev Attempts to execute a validated risk parameter update using the RiskSteward contract
     *      Updates the `processedUpdates` mapping and emits the appropriate event based on the outcome
     * @param updateId The unique identifier of the risk parameter update
     * @param newValue The new encoded value of the parameter to be applied
     * @param updateType The type of parameter being updated (e.g., "supplyCap", "borrowCap")
     * @param market The market address (e.g., vToken) associated with the update
     */

    function _executeUpdate(
        uint256 updateId,
        bytes memory newValue,
        string memory updateType,
        address market
    ) internal {
        try
            IRiskSteward(riskParameterConfigs[updateType].riskSteward).processUpdate(
                updateId,
                newValue,
                updateType,
                market
            )
        {
            processedUpdates[updateId] = UPDATE_STATUS.PROCESSED;
            emit RiskParameterUpdateProcessed(updateId);
        } catch {
            emit RiskParameterUpdateFailed(updateId, UPDATE_STATUS.FAILED);
            processedUpdates[updateId] = UPDATE_STATUS.FAILED;
        }
    }

    /**
     * @dev Handles incoming LayerZero messages containing risk parameter update data
     *      Decodes the payload and forwards the update for processing
     * @param payload The encoded message containing update details
     */
    function _lzReceive(
        Origin calldata,
        bytes32 /*_guid*/,
        bytes calldata payload,
        address /*_executor*/,
        bytes calldata /*_extraData*/
    ) internal override {
        (
            uint256 updateId,
            bytes memory newValue,
            string memory updateType,
            address market,
            bytes memory additionalData,
            uint256 timestamp
        ) = abi.decode(payload, (uint256, bytes, string, address, bytes, uint256));

        processedUpdates[updateId] = UPDATE_STATUS.RECEIVED;
        remoteUpdateTimestamps[updateId] = block.timestamp;

        update[updateId] = RiskParameterUpdate({
            timestamp: timestamp,
            newValue: newValue,
            referenceId: "",
            previousValue: "",
            updateType: updateType,
            updateId: updateId,
            market: market,
            additionalData: additionalData
        });
    }
}
