// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.25;

import { Strings } from "@openzeppelin/contracts/utils/Strings.sol";
import { IRiskSteward } from "../interfaces/IRiskSteward.sol";
import { IRiskOracle, RiskParameterUpdate } from "../interfaces/IRiskOracle.sol";
import { RiskParamConfig } from "../interfaces/IRiskStewardReceiver.sol";
import { ensureNonzeroAddress } from "@venusprotocol/solidity-utilities/contracts/validators.sol";
import { RiskStewardReceiverBase } from "./RiskStewardReceiverBase.sol";
import { OApp, MessagingFee, Origin } from "@layerzerolabs/oapp-evm/contracts/oapp/OApp.sol";

/**
 * @title RiskStewardReceiver
 * @author Venus
 * @notice Contract that can read updates from the Chaos Labs Risk Oracle, validate them, and push them to the correct RiskSteward.
 * @custom:security-contact https://github.com/VenusProtocol/governance-contracts#discussion
 */
contract RiskStewardReceiver is OApp, RiskStewardReceiverBase {
    enum UPDATE_STATUS {
        NONE,
        PROCESSED,
        SEND_TO_DESTINATION_CHAIN,
        CONFIG_NOT_ACTIVE,
        EXPIRED,
        FAILED
    }
    /**
     * @notice Whitelisted oracle address to receive updates from
     */
    IRiskOracle public immutable RISK_ORACLE;

    /**
     * @notice Mapping of processed updates. Used to prevent re-execution
     */
    mapping(uint256 updateId => UPDATE_STATUS) public processedUpdates;

    /**
     * @notice Source chain id
     */
    uint16 public immutable LAYER_ZERO_CHAIN_ID;

    /**
     * @notice Event emitted when an update is send through LZ on dest chain with update id and LZ send receipt
     */
    event RiskParameterUpdateSend(uint16 destChainId, uint256 indexed updateId);

    /**
     * @notice Emitted when applying an update fails to validate or execute
     */
    event RiskParameterUpdateFailed(uint256 indexed updateId, UPDATE_STATUS indexed error);

    /**
     *  @notice Emitted when processing a remote risk parameter update fails via LayerZero
     */

    event RemoteRiskParameterUpdateFailed(
        uint16 destChainId,
        bytes payload,
        bytes _options,
        MessagingFee fee,
        address sender,
        bytes reason
    );

    /**
     * @notice Emitted when a stored risk parameter update is cleared.
     */
    event ClearRiskParameterUpdate(uint256 updateId, bytes hash);

    /**
     * @notice Thrown if a submitted update is not active and therefore cannot be processed
     */
    error ConfigNotActive(uint256 updateId);

    constructor(
        address riskOracle_,
        uint16 layerZeroChainId_,
        address endpoint_,
        address owner_
    ) OApp(endpoint_, owner_) {
        ensureNonzeroAddress(riskOracle_);
        RISK_ORACLE = IRiskOracle(riskOracle_);
        LAYER_ZERO_CHAIN_ID = layerZeroChainId_;
    }

    /**
     * @notice Processes an update by its ID. Will validate that the update configuration is active, is not expired, unprocessed, and that the debounce period has passed
     * If the update is to be applied on BNB chain and valid, it will be processed by the associated risk steward contract which will perform update specific validations
     * and apply validated updates.
     * If the update is to be applied on a remote chain, it will be submitted to governance as a fast track proposal.
     * @param updateId The ID of the update to process
     * @custom:event Emits RiskParameterUpdateProcessed with the update ID
     * @custom:error Throws ConfigNotActive if the config is not active
     * @custom:error Throws UpdateIsExpired if the update is expired
     * @custom:error Throws ConfigAlreadyProcessed if the update has already been processed
     */
    function processUpdateById(
        uint256 updateId,
        bytes calldata options,
        uint256 ZROTokens
    ) public payable whenNotPaused {
        RiskParameterUpdate memory update = RISK_ORACLE.getUpdateById(updateId);

        (UPDATE_STATUS error, ) = _validateUpdateStatus(update);
        if (error == UPDATE_STATUS.NONE) {
            _executeOrSendUpdatePayload(update, options, ZROTokens);
        } else {
            processedUpdates[update.updateId] = error;
            emit RiskParameterUpdateFailed(update.updateId, error);
        }
    }

    /**
     * @notice Processes the latest update for a given parameter and market. Will validate that the update configuration is active, is not expired,
     * unprocessed, and that the debounce period has passed.
     * If the update is to be applied on BNB chain and valid, it will be processed by the associated risk steward contract which will perform update
     * specific validations and apply validated updates.
     * If the update is to be applied on a remote chain, it will be submitted to governance as a fast track proposal.
     * @param updateType The type of update to process
     * @param market The market to process the update for
     * @param options LayerZero message options
     * @param ZROTokens Amount of ZRO tokens used for the message fee
     * @custom:event Emits RiskParameterUpdated with the update ID
     * @custom:event Emits RiskParameterUpdateProposed with the the update ID
     * @custom:error Throws ConfigNotActive if the config is not active
     * @custom:error Throws UpdateIsExpired if the update is expired
     * @custom:error Throws ConfigAlreadyProcessed if the update has already been processed
     */
    function processUpdateByParameterAndMarket(
        string memory updateType,
        address market,
        bytes calldata options,
        uint256 ZROTokens
    ) external payable whenNotPaused {
        RiskParameterUpdate memory update = RISK_ORACLE.getLatestUpdateByParameterAndMarket(updateType, market);
        (UPDATE_STATUS error, ) = _validateUpdateStatus(update);
        if (error == UPDATE_STATUS.NONE) {
            _executeOrSendUpdatePayload(update, options, ZROTokens);
        } else {
            processedUpdates[update.updateId] = error;
            emit RiskParameterUpdateFailed(update.updateId, error);
        }
    }

    /**
     * @notice Processes a list of updates by their IDs. First updates will be validated that they are active, not expired and unprocessed.
     * If the update passes validation, it will be executed if it is for BNB chain or else it will be proposed to governance as a fast track proposal.
     * @param updateIds The IDs of the updates to process
     * @param options LayerZero message options
     * @param ZROTokens Amount of ZRO tokens used for the message fee
     * @custom:event Emits RiskParameterUpdated with the update ID
     * @custom:event Emits RiskParameterUpdateProposed with the update IDs
     * @custom:event Emits UpdateFailed with the update ID and the error if validation fails for an update
     * @custom:error Throws ConfigNotActive if the config is not active
     * @custom:error Throws UpdateIsExpired if the update is expired
     * @custom:error Throws ConfigAlreadyProcessed if the update has already been processed
     * @custom:error Throws UpdateNotInRange if the update is not in range
     * @custom:error Throws UnsupportedUpdateType if the update type is not supported
     */
    function processUpdatesByIds(
        uint256[] memory updateIds,
        bytes calldata options,
        uint256 ZROTokens
    ) external payable {
        RiskParameterUpdate[] memory updates = _validateUpdateAndDestChainIds(updateIds);
        _executeOrSendUpdatePayloads(updates, options, ZROTokens);
    }

    /**
     * @notice Sends a message via LayerZero.
     * @param destChainId Destination chain ID.
     * @param payload Encoded message payload.
     * @param options LayerZero message options.
     * @param fee Messaging fee structure.
     */

    function lzSend(
        uint16 destChainId,
        bytes calldata payload,
        bytes calldata options,
        MessagingFee calldata fee
    ) external {
        require(msg.sender == address(this));
        _lzSend(destChainId, payload, options, fee, payable(msg.sender));
    }

    /**
     * @notice Quotes the gas needed to pay for the full omnichain transaction in native gas or ZRO token.
     * @param dstEid Destination chain's endpoint ID.
     * @param message The message.
     * @param options Message execution options (e.g., for sending gas to destination).
     * @param payInLzToken Whether to return fee in ZRO token.
     * @return fee A `MessagingFee` struct containing the calculated gas fee in either the native token or ZRO token.
     */
    function quote(
        uint32 dstEid,
        string memory message,
        bytes memory options,
        bool payInLzToken
    ) public view returns (MessagingFee memory fee) {
        bytes memory payload = abi.encode(message);
        fee = _quote(dstEid, payload, options, payInLzToken);
    }

    /**
     *  @notice Empty implementation of renounce ownership to avoid any mishappening
     */
    function renounceOwnership() public override {}

    /**
     * @dev Internal function which calls the risk steward to apply the update. If successful, it records the last processed time for the update and
     * market and marks the update as processed.
     * @custom:event Emits RiskParameterUpdateProcessed with the update ID
     */
    function _processUpdate(RiskParameterUpdate memory update) internal {
        IRiskSteward(riskParameterConfigs[update.updateType].riskSteward).processUpdate(
            update.updateId,
            update.newValue,
            update.updateType,
            update.market
        );
        processedUpdates[update.updateId] = UPDATE_STATUS.PROCESSED;
        emit RiskParameterUpdateProcessed(update.updateId);
    }

    /**
     * @dev Executes BNB updates and reduces remote updates into a single remote proposal.
     * @param updates The updates to execute or propose remote proposals for
     * @custom:event Emits RiskParameterUpdated with the update ID
     * @custom:event Emits RiskParameterUpdateProposed with the update IDs
     */
    function _executeOrSendUpdatePayloads(
        RiskParameterUpdate[] memory updates,
        bytes calldata options,
        uint256 ZROTokens
    ) internal {
        for (uint256 i = 0; i < updates.length; i++) {
            RiskParameterUpdate memory update = updates[i];
            _executeOrSendUpdatePayload(update, options, ZROTokens);
        }
    }

    /**
     * @dev Executes a single update locally or forwards it to the remote chain
     * @param update The RiskParameterUpdate to execute if on BNB chain or prepare parameters for if on a remote chain
     * @param options LayerZero options for the message
     * @param ZROTokens Amount of ZRO tokens used for the message fee
     */
    function _executeOrSendUpdatePayload(
        RiskParameterUpdate memory update,
        bytes calldata options,
        uint256 ZROTokens
    ) internal {
        if (!isSupplyOrBorrowCapUpdate(update.updateType)) {
            revert UnsupportedUpdateType();
        }
        IRiskSteward riskSteward = riskParameterConfigs[update.updateType].riskSteward;
        (, uint16 destChainId) = riskSteward.decodeAdditionalData(update.additionalData);

        if (LAYER_ZERO_CHAIN_ID == destChainId) {
            try riskSteward.processUpdate(update.updateId, update.newValue, update.updateType, update.market) {
                processedUpdates[update.updateId] = UPDATE_STATUS.PROCESSED;
                emit RiskParameterUpdateProcessed(update.updateId);
            } catch {
                emit RiskParameterUpdateFailed(update.updateId, UPDATE_STATUS.FAILED);
                processedUpdates[update.updateId] = UPDATE_STATUS.FAILED;
            }
        } else {
            bytes memory payload = _createRemotePayload(update);
            // Send layer zero message directly
            try this.lzSend(destChainId, payload, options, MessagingFee(msg.value, ZROTokens)) {
                emit RiskParameterUpdateSend(destChainId, update.updateId);
                processedUpdates[update.updateId] = UPDATE_STATUS.SEND_TO_DESTINATION_CHAIN;
            } catch (bytes memory reason) {
                emit RemoteRiskParameterUpdateFailed(
                    destChainId,
                    payload,
                    options,
                    MessagingFee(msg.value, ZROTokens),
                    msg.sender,
                    reason
                );
                processedUpdates[update.updateId] = UPDATE_STATUS.FAILED;
            }
        }
    }

    /**
     * @dev Creates a remote proposal params for a given update.
     * @param update The update to create a remote proposal for
     * @return data The data in bytes of the update
     */
    function _createRemotePayload(RiskParameterUpdate memory update) internal view returns (bytes memory data) {
        IRiskSteward riskSteward = riskParameterConfigs[update.updateType].riskSteward;

        bytes memory payload = abi.encode(
            update.updateId,
            riskSteward.packNewValue(update.newValue),
            update.updateType,
            update.market,
            update.additionalData,
            update.timestamp
        );

        return payload;
    }

    /**
     * @dev Validates the status of an update silently. Will validate that the update configuration is active, is not expired, and unprocessed
     * @return error The UPDATE_STATUS error code if the update is not valid or 0 and destination chain id
     */
    function _validateUpdateStatus(
        RiskParameterUpdate memory update
    ) internal view returns (UPDATE_STATUS error, uint16) {
        RiskParamConfig memory config = riskParameterConfigs[update.updateType];

        RiskParameterUpdate memory latestForMarketAndType = RISK_ORACLE.getLatestUpdateByParameterAndMarket(
            update.updateType,
            update.market
        );
        (, uint16 destChainId) = config.riskSteward.decodeAdditionalData(update.additionalData);

        if (latestForMarketAndType.updateId != update.updateId) {
            return (UPDATE_STATUS.EXPIRED, destChainId);
        }

        if (!config.active) {
            return (UPDATE_STATUS.CONFIG_NOT_ACTIVE, destChainId);
        }

        if (update.timestamp + UPDATE_EXPIRATION_TIME < block.timestamp) {
            return (UPDATE_STATUS.EXPIRED, destChainId);
        }

        if (
            processedUpdates[update.updateId] == UPDATE_STATUS.PROCESSED ||
            processedUpdates[update.updateId] == UPDATE_STATUS.SEND_TO_DESTINATION_CHAIN
        ) {
            return (processedUpdates[update.updateId], destChainId);
        }

        return (UPDATE_STATUS.NONE, destChainId);
    }

    /**
     * @notice Fetches updates and indexes them by their destination chain ID
     * @param updateIds The IDs of the updates to organize
     * @return updates Array of valid RiskParameterUpdate objects.
     */
    function _validateUpdateAndDestChainIds(
        uint256[] memory updateIds
    ) internal returns (RiskParameterUpdate[] memory updates) {
        updates = new RiskParameterUpdate[](updateIds.length);

        for (uint256 i = 0; i < updateIds.length; i++) {
            RiskParameterUpdate memory update = RISK_ORACLE.getUpdateById(updateIds[i]);
            (UPDATE_STATUS error, ) = _validateUpdateStatus(update);
            if (error == UPDATE_STATUS.NONE) {
                updates[i] = update;
            } else {
                emit RiskParameterUpdateFailed(update.updateId, error);
            }
        }
        return (updates);
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
     * @dev Checks if the update type is a supplyCap or borrowCap update
     * @param updateType The string name of the update type
     * @return Whether the update type is supported
     */
    function isSupplyOrBorrowCapUpdate(string memory updateType) internal pure returns (bool) {
        if (Strings.equal(updateType, "supplyCap") || Strings.equal(updateType, "borrowCap")) {
            return true;
        }
        return false;
    }
}
