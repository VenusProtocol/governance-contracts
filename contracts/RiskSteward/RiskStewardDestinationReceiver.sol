// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.25;

import { IRiskSteward } from "./IRiskSteward.sol";
import { IRiskOracle } from "../interfaces/IRiskOracle.sol";
import { RiskParamConfig } from "./IRiskStewardReceiver.sol";
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
    IRiskOracle public RISK_ORACLE;

    /**
     * @notice Time before a submitted update is considered stale
     */
    uint256 public constant REMOTE_UPDATE_EXPIRATION_TIME = 2 days;

    /**
     * @notice Mapping of processed updates. Used to prevent re-execution
     */
    mapping(uint256 updateId => UPDATE_STATUS) public processedUpdates;

    enum UPDATE_STATUS {
        NONE,
        RECEIVED,
        NOT_RECEIVED,
        PROCESSED,
        CONFIG_NOT_ACTIVE,
        EXPIRED,
        UPDATE_TOO_FREQUENT,
        FAILED
    }

    /**
     * @notice Emitted when applying an update fails to validate or execute
     */
    event RiskParameterUpdateFailed(uint256 indexed updateId, UPDATE_STATUS indexed error);

    constructor(
        address marketRiskSteward_,
        address riskOracle_,
        address endpoint_,
        address owner_
    ) OApp(endpoint_, owner_) {
        ensureNonzeroAddress(riskOracle_);
        ensureNonzeroAddress(marketRiskSteward_);
        RISK_ORACLE = IRiskOracle(riskOracle_);
    }

    /**
     * @notice Processes an update from the RiskStewardReceiver. First validates that the update has not be processed, the config is active, and is not expired.
     * If the update is valid then it is executed, otherwise an update failed error is emitted.
     * @param updateId The ID of the update
     * @param newValue The new value of the update
     * @param updateType The type of update
     * @param market The market of the update
     * @param timestamp The timestamp of the update
     * @custom:access This function should only be callable by timelocks that are trusted to receive cross chain messages
     */
    function processUpdate(
        uint256 updateId,
        bytes memory newValue,
        string memory updateType,
        address market,
        uint256 timestamp
    ) public whenNotPaused {
        UPDATE_STATUS error = _validateUpdateStatus(updateId, updateType, timestamp);
        if (error == UPDATE_STATUS.NONE) {
            _executeUpdate(updateId, newValue, updateType, market);
        } else {
            processedUpdates[updateId] = error;
            emit RiskParameterUpdateFailed(updateId, error);
        }
    }

    /**
     * @notice Validates the status of an update silently. Will validate that the update configuration is active, is not expired and unprocessed.
     * @param updateId The ID of the update
     * @param updateType The type of updatee
     * @param timestamp The timestamp of the update
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

        if (processedUpdates[updateId] != UPDATE_STATUS.RECEIVED) {
            return UPDATE_STATUS.NOT_RECEIVED;
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
        bytes32,
        bytes calldata payload,
        address,
        bytes calldata
    ) internal virtual override {
        (uint256 updateId, bytes memory newValue, string memory updateType, address market, , uint256 timestamp) = abi
            .decode(payload, (uint256, bytes, string, address, bytes, uint256));

        processedUpdates[updateId] = UPDATE_STATUS.RECEIVED;
        processUpdate(updateId, newValue, updateType, market, timestamp);
    }
}
