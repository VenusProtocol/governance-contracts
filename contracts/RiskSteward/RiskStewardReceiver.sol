// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.25;

import { Strings } from "@openzeppelin/contracts/utils/Strings.sol";
import { IRiskSteward } from "../interfaces/IRiskSteward.sol";
import { IRiskOracle, RiskParameterUpdate } from "../interfaces/IRiskOracle.sol";
import { RiskParamConfig } from "../interfaces/IRiskStewardReceiver.sol";
import { ensureNonzeroAddress } from "@venusprotocol/solidity-utilities/contracts/validators.sol";
import { IGovernorBravoDelegate, GovernorBravoDelegateStorageV2 } from "../Governance/IGovernorBravoV8.sol";
import { IOmnichainProposalSender } from "../Cross-chain/interfaces/IOmnichainProposalSender.sol";
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
        FAILED,
        PROPOSED,
        INVALID_DESTINATION_CHAIN
    }

    struct ProposalParams {
        uint32 destChainId;
        address target;
        uint256 value;
        string signature;
        bytes data;
    }
    struct RemoteProposalParams {
        uint32 destChainId;
        uint256 proposalId;
        address target;
        uint256 value;
        string signature;
        bytes data;
    }

    struct RemoteProposal {
        uint32 destChainId;
        uint256 proposalId;
        address[] targets;
        uint256[] values;
        string[] signatures;
        bytes[] datas;
    }

    bytes32 private constant INDEX_CACHE_SLOT = keccak256(abi.encode("remote-index-cache"));

    bytes32 private constant COUNT_CACHE_SLOT = keccak256(abi.encode("remote-count-cache"));

    /**
     * @notice Source chain id
     */
    uint32 public immutable LAYER_ZERO_CHAIN_ID;

    /**
     * @notice Whitelisted oracle address to receive updates from
     */
    IRiskOracle public immutable RISK_ORACLE;

    /**
     * @notice Address of the GovernorBravo used to propose VIPs
     */
    IGovernorBravoDelegate public immutable GOVERNANCE_BRAVO;

    /**
     * @notice Address of the OmnichainProposalSender used to propose VIPs
     */
    IOmnichainProposalSender public immutable OMNICHAIN_PROPOSAL_SENDER;

    /**
     * @notice Mapping from LayerZero V2 chain ID to V1 chain ID
     */
    mapping(uint32 => uint16) public lzV2ToV1ChainId;

    /**
     * @notice Mapping of processed updates. Used to prevent re-execution
     */
    mapping(uint256 updateId => UPDATE_STATUS) public processedUpdates;

    /**
     * @notice Mapping of supported risk configurations and their validation parameters
     */
    mapping(uint32 destChainId => address) public remoteRiskStewardReceiver;

    /// @notice Emitted when a V2 → V1 chain ID mapping is set or deleted
    event ChainIdMappingUpdated(uint32 indexed v2ChainId, uint16 v1ChainId);

    /**
     * @notice Event emitted when an update is send through LZ on dest chain with update id and LZ send receipt
     */
    event RiskParameterUpdateSend(uint32 destChainId, uint256 indexed updateId);

    /**
     * @notice Event emitted when an update is proposed with proposal id and update id
     */
    event RiskParameterUpdateProposed(uint256 indexed updateId);

    /**
     * @notice Emit when sets the remote receiver for a destination chain
     */
    event RemoteRiskStewardReceiverUpdated(
        uint32 indexed destChainId,
        address previousRemoteReceiver,
        address newRemoteReceiver
    );

    /**
     * @notice Emitted when applying an update fails to validate or execute
     */
    event RiskParameterUpdateFailed(uint256 indexed updateId, UPDATE_STATUS indexed error);

    /**
     *  @notice Emitted when processing a remote risk parameter update fails via LayerZero
     */
    event RemoteRiskParameterUpdateFailed(
        uint32 destChainId,
        bytes payload,
        bytes _options,
        MessagingFee fee,
        address sender,
        bytes reason
    );

    constructor(
        address riskOracle_,
        uint32 layerZeroChainId_,
        address endpoint_,
        address owner_,
        address governorBravo_,
        address omnichainProposalSender_
    ) OApp(endpoint_, owner_) {
        ensureNonzeroAddress(riskOracle_);
        RISK_ORACLE = IRiskOracle(riskOracle_);
        LAYER_ZERO_CHAIN_ID = layerZeroChainId_;
        GOVERNANCE_BRAVO = IGovernorBravoDelegate(governorBravo_);
        OMNICHAIN_PROPOSAL_SENDER = IOmnichainProposalSender(omnichainProposalSender_);
    }

    /**
     * @notice Sets the remote receiver for a destination chain
     * @param destChainId The destination chain ID
     * @param remoteReceiver The address of the remote receiver
     * @custom:access Controlled by AccessControlManager
     * @custom:event Emits RemoteRiskStewardReceiverUpdated with the destination chain ID and the remote receiver
     * @custom:error Throws ZeroAddressNotAllowed if the remote receiver address is zero
     */
    function setRemoteRiskStewardReceiver(uint32 destChainId, address remoteReceiver) external onlyOwner {
        ensureNonzeroAddress(remoteReceiver);
        emit RemoteRiskStewardReceiverUpdated(destChainId, remoteRiskStewardReceiver[destChainId], remoteReceiver);
        remoteRiskStewardReceiver[destChainId] = remoteReceiver;
    }

    /**
     * @notice Deletes the remote receiver for a destination chain
     * @param destChainId The destination chain ID
     * @custom:access Controlled by AccessControlManager
     * @custom:event Emits RemoteRiskStewardReceiverUpdated with the destination chain ID and the remote receiver
     * @custom:error Throws ZeroAddressNotAllowed if the remote receiver address is zero
     */
    function deleteRemoteRiskStewardReceiver(uint32 destChainId) external onlyOwner {
        ensureNonzeroAddress(remoteRiskStewardReceiver[destChainId]);

        emit RemoteRiskStewardReceiverUpdated(destChainId, remoteRiskStewardReceiver[destChainId], address(0));
        remoteRiskStewardReceiver[destChainId] = address(0);
    }

    /**
     * @notice Sets or deletes multiple V2 → V1 chain ID mappings in a single transaction.
     * @dev If an element of `v1ChainIds` is 0, the corresponding mapping is deleted.
     * @param v2ChainIds Array of LayerZero V2 chain IDs to set.
     * @param v1ChainIds Array of LayerZero V1 chain IDs (or 0 to delete).
     */
    function setDestChainIdMappings(uint32[] calldata v2ChainIds, uint16[] calldata v1ChainIds) external onlyOwner {
        uint256 len = v2ChainIds.length;
        require(len == v1ChainIds.length, "Array length mismatch");

        for (uint256 i; i < len; ++i) {
            uint32 v2 = v2ChainIds[i];
            uint16 v1 = v1ChainIds[i];

            uint16 v1ChainId = lzV2ToV1ChainId[v2];
            if (v1 == 0) {
                // Delete mapping if V1 is 0
                if (v1ChainId != 0) {
                    delete lzV2ToV1ChainId[v2];
                    emit ChainIdMappingUpdated(v2, 0);
                }
            } else {
                if (v1ChainId != v1) {
                    lzV2ToV1ChainId[v2] = v1;
                    emit ChainIdMappingUpdated(v2, v1);
                }
            }
        }
    }

    /**
     * @notice Processes an update by its ID. Validates that the update configuration is active, not expired, and unprocessed.
     * @dev Handles updates based on their type and destination chain:
     * - For MarketCap updates on the BNB chain, directly invokes the associated RiskSteward contract.
     * - For MarketCap updates on remote chains, constructs and sends a payload to the destination chain’s RiskStewardReceiver via the LayerZero bridge.
     * - For critical updates (e.g., reserve factor), creates a governance proposal on the Governor Bravo contract for execution.
     * @param updateId The ID of the update to process
     * @param options LayerZero call options (e.g., adapterParams) encoded as bytes.
     * @param ZROTokens Amount of ZRO tokens approved for fee payment (used in LayerZero).
     * @custom:event Emits RiskParameterUpdateFailed if the update is invalid.
     */
    function processUpdateById(
        uint256 updateId,
        bytes calldata options,
        uint256 ZROTokens
    ) external payable whenNotPaused {
        RiskParameterUpdate memory update = RISK_ORACLE.getUpdateById(updateId);
        (UPDATE_STATUS error, uint32 destChainId) = _validateUpdateStatus(update);

        if (error == UPDATE_STATUS.NONE) {
            _executeUpdateByType(update, destChainId, options, ZROTokens);
        } else {
            processedUpdates[update.updateId] = error;
            emit RiskParameterUpdateFailed(update.updateId, error);
        }
    }

    /**
     * @notice Processes the latest update for a given parameter and market. Validates that the update configuration is active, not expired, and unprocessed.
     * @dev Handles updates based on their type and destination chain:
     * - For MarketCap updates on the BNB chain, directly invokes the associated RiskSteward contract.
     * - For MarketCap updates on remote chains, constructs and sends a payload to the destination chain’s RiskStewardReceiver via the LayerZero bridge.
     * - For critical updates (e.g., reserve factor), creates a governance proposal on the Governor Bravo contract for execution.
     * @param updateType The type of update to process
     * @param market The market to process the update for
     * @param options LayerZero message options
     * @param ZROTokens Amount of ZRO tokens used for the message fee
     * @custom:event Emits RiskParameterUpdateFailed if the update is invalid.
     */
    function processUpdateByParameterAndMarket(
        string memory updateType,
        address market,
        bytes calldata options,
        uint256 ZROTokens
    ) external payable whenNotPaused {
        RiskParameterUpdate memory update = RISK_ORACLE.getLatestUpdateByParameterAndMarket(updateType, market);
        (UPDATE_STATUS error, uint32 destChainId) = _validateUpdateStatus(update);
        if (error == UPDATE_STATUS.NONE) {
            _executeUpdateByType(update, destChainId, options, ZROTokens);
        } else {
            processedUpdates[update.updateId] = error;
            emit RiskParameterUpdateFailed(update.updateId, error);
        }
    }

    /**
     * @notice Proposes a list of updates by their IDs. Supports all types of updates including market cap and critical parameters.
     * @dev Each update is validated to ensure it is active, not expired, and unprocessed.
     * - All updates on remote chains are grouped and reduced into a single remote proposal for efficiency.
     * - all updateTypes including MarketCap updates are proposed to governance via a fast track proposal.
     * @param updateIds The IDs of the updates to process
     * @custom:event Emits RiskParameterUpdated with the update ID
     * @custom:event Emits RiskParameterUpdateProposed with the update IDs
     * @custom:event Emits UpdateFailed with the update ID and the error if validation fails for an update
     * @custom:error Throws UpdateIsExpired if the update is expired
     */
    function proposeUpdatesByIds(uint256[] memory updateIds) external {
        (
            uint32 destinationChainCount,
            uint256 validProposalCount,
            RiskParameterUpdate[] memory updates
        ) = _validateProposeUpdateAndDestChainIds(updateIds);
        _sendProposals(destinationChainCount, validProposalCount, updates);
    }

    /**
     * @notice Sends a message via LayerZero.
     * @param destChainId Destination chain ID.
     * @param payload Encoded message payload.
     * @param options LayerZero message options.
     * @param fee Messaging fee structure.
     */

    function lzSend(
        uint32 destChainId,
        bytes calldata payload,
        bytes calldata options,
        MessagingFee calldata fee,
        address refundAddress
    ) external payable {
        require(msg.sender == address(this), "Invalid caller");
        _lzSend(destChainId, payload, options, fee, refundAddress);
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
     * @notice Executes the update based on its updateType.
     * @param update The risk parameter update to process
     * @param destChainId The LayerZero destination chain ID for the proposal
     * @param options Additional options for LayerZero messaging
     * @param ZROTokens The amount of ZRO tokens to be used for message fees
     */
    function _executeUpdateByType(
        RiskParameterUpdate memory update,
        uint32 destChainId,
        bytes calldata options,
        uint256 ZROTokens
    ) internal {
        if (isSupplyOrBorrowCapUpdate(update.updateType)) {
            _executeOrSendUpdatePayload(update, options, ZROTokens);
        } else {
            _sendProposal(update, destChainId);
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
        IRiskSteward riskSteward = riskParameterConfigs[update.updateType].riskSteward;
        (, uint32 destChainId) = riskSteward.decodeAdditionalData(update.additionalData);

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
            try
                this.lzSend{ value: msg.value }(
                    destChainId,
                    payload,
                    options,
                    MessagingFee(msg.value, ZROTokens),
                    msg.sender
                )
            {
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
     * @dev Internal function used to propose a single update.
     * @param update The update to propose a remote proposal for
     */
    function _sendProposal(RiskParameterUpdate memory update, uint32 destChainId) internal {
        if (LAYER_ZERO_CHAIN_ID == destChainId) {
            _sendBscProposal(update);
        } else {
            _sendRemoteProposal(update, destChainId);
        }
        processedUpdates[update.updateId] = UPDATE_STATUS.PROPOSED;
        emit RiskParameterUpdateProposed(update.updateId);
    }

    /**
     * @notice Creates and submits a governance proposal specifically for the BNB Chain (BSC)
     * @dev Wraps the given update into a standard proposal format.
     * It constructs the call data and delegates the proposal creation to `_proposeUpdate`.
     * @param update The risk parameter update to propose as a BSC-specific governance proposal
     * @return proposalId The ID of the proposal created through the governance contract
     */
    function _sendBscProposal(RiskParameterUpdate memory update) internal returns (uint256 proposalId) {
        (address target, uint256 value, string memory signature, bytes memory data) = _createBscProposal(update);
        address[] memory remoteProposalTargets = new address[](1);
        remoteProposalTargets[0] = target;
        uint256[] memory remoteProposalValues = new uint256[](1);
        remoteProposalValues[0] = value;
        string[] memory remoteProposalSignatures = new string[](1);
        remoteProposalSignatures[0] = signature;
        bytes[] memory remoteProposalDatas = new bytes[](1);
        remoteProposalDatas[0] = data;
        proposalId = _proposeUpdate(
            remoteProposalTargets,
            remoteProposalValues,
            remoteProposalSignatures,
            remoteProposalDatas
        );
    }

    /**
     * @notice Prepares and sends a remote proposal to a remote destination chain.
     * Constructs the proposal payload, wraps it with remote execution parameters, and submits it.
     * @param update The risk parameter update to propose on a remote chain
     * @param destChainId The LayerZero chain ID of the target remote chain
     * @return proposalId The ID of the newly submitted proposal
     */
    function _sendRemoteProposal(
        RiskParameterUpdate memory update,
        uint32 destChainId
    ) internal returns (uint256 proposalId) {
        proposalId = OMNICHAIN_PROPOSAL_SENDER.proposalCount();
        (address target, uint256 value, string memory signature, bytes memory data) = _generateRemotePayload(
            update,
            destChainId
        );
        address[] memory targets = new address[](1);
        uint256[] memory values = new uint256[](1);
        string[] memory signatures = new string[](1);
        bytes[] memory datas = new bytes[](1);
        targets[0] = target;
        values[0] = value;
        signatures[0] = signature;
        datas[0] = data;
        RemoteProposalParams memory remoteProposalParams = _createRemoteProposal(
            destChainId,
            proposalId,
            targets,
            values,
            signatures,
            datas
        );
        address[] memory remoteProposalTargets = new address[](1);
        remoteProposalTargets[0] = remoteProposalParams.target;
        uint256[] memory remoteProposalValues = new uint256[](1);
        remoteProposalValues[0] = remoteProposalParams.value;
        string[] memory remoteProposalSignatures = new string[](1);
        remoteProposalSignatures[0] = remoteProposalParams.signature;
        bytes[] memory remoteProposalDatas = new bytes[](1);
        remoteProposalDatas[0] = remoteProposalParams.data;

        proposalId = _proposeUpdate(
            remoteProposalTargets,
            remoteProposalValues,
            remoteProposalSignatures,
            remoteProposalDatas
        );
    }

    /**
     * @notice Batches remote and bnb updates into a single proposal.
     * @dev This function handles all valid updates. Updates targeting the BNB chain are added directly.
     * Remote updates are grouped by destination chain and batched into single actions per chain.
     * All updates—both BNB and remote—are proposed together in one fast-track governance proposal.
     * @param destinationChainCount Number of unique destination chains involved in the updates
     * @param validProposalCount Number of valid (non-expired, unprocessed) updates to be included
     * @param updates Array of `RiskParameterUpdate` structs representing each proposed parameter change
     * @custom:event Emits `RiskParameterUpdateProposed` for every successfully processed update
     */
    function _sendProposals(
        uint32 destinationChainCount,
        uint256 validProposalCount,
        RiskParameterUpdate[] memory updates
    ) internal {
        uint32[] memory destChainIds = new uint32[](destinationChainCount);
        address[][] memory remoteTargets = new address[][](destChainIds.length);
        uint256[][] memory remoteValues = new uint256[][](destChainIds.length);
        string[][] memory remoteSignatures = new string[][](destChainIds.length);
        bytes[][] memory remoteDatas = new bytes[][](destChainIds.length);
        address[] memory targets = new address[](validProposalCount);
        uint256[] memory values = new uint256[](validProposalCount);
        string[] memory signatures = new string[](validProposalCount);
        bytes[] memory datas = new bytes[](validProposalCount);
        uint256 ind = 0;

        for (uint256 i = 0; i < updates.length; i++) {
            RiskParameterUpdate memory update = updates[i];
            if (Strings.equal(update.updateType, "")) {
                // Skip indexes of invalid updates
                continue;
            }
            ProposalParams memory p = _prepareProposalParams(update);

            if (processedUpdates[update.updateId] == UPDATE_STATUS.NONE) {
                if (LAYER_ZERO_CHAIN_ID == p.destChainId) {
                    targets[ind] = p.target;
                    values[ind] = p.value;
                    signatures[ind] = p.signature;
                    datas[ind] = p.data;
                    ind++;
                    processedUpdates[update.updateId] = UPDATE_STATUS.PROPOSED;
                    emit RiskParameterUpdateProposed(update.updateId);
                    continue;
                }
                uint256 index = readUint256Cache(INDEX_CACHE_SLOT, p.destChainId) - 1;
                uint256 actionCount = getAndUpdateActionIndex(p.destChainId);
                if (remoteTargets[index].length == 0) {
                    destChainIds[index] = p.destChainId;
                    remoteTargets[index] = new address[](actionCount + 1);
                    remoteValues[index] = new uint256[](actionCount + 1);
                    remoteSignatures[index] = new string[](actionCount + 1);
                    remoteDatas[index] = new bytes[](actionCount + 1);
                }

                remoteTargets[index][actionCount] = p.target;
                remoteValues[index][actionCount] = p.value;
                remoteSignatures[index][actionCount] = p.signature;
                remoteDatas[index][actionCount] = p.data;
                processedUpdates[update.updateId] = UPDATE_STATUS.PROPOSED;
                emit RiskParameterUpdateProposed(update.updateId);
            }
        }

        (
            address[] memory remoteProposalTargets,
            uint256[] memory remoteProposalValues,
            string[] memory remoteProposalSignatures,
            bytes[] memory remoteProposalDatas
        ) = _createRemoteProposals(destChainIds, remoteTargets, remoteValues, remoteSignatures, remoteDatas);

        for (uint256 i = 0; i < destChainIds.length; i++) {
            targets[ind] = remoteProposalTargets[i];
            values[ind] = remoteProposalValues[i];
            signatures[ind] = remoteProposalSignatures[i];
            datas[ind] = remoteProposalDatas[i];
            ind++;
        }
        _proposeUpdate(targets, values, signatures, datas);
    }

    /**
     * @notice prepares parameters for a remote proposal or a BSC proposal.
     * @param update The RiskParameterUpdate to execute if on BSC chain or prepare parameters for if on a remote chain
     * @custom:event Emits BatchedUpdateFailed with the update ID if the update fails to execute
     * @return ProposalParams proposal parameters
     */
    function _prepareProposalParams(RiskParameterUpdate memory update) internal view returns (ProposalParams memory) {
        IRiskSteward riskSteward = riskParameterConfigs[update.updateType].riskSteward;
        (, uint32 destChainId_) = riskSteward.decodeAdditionalData(update.additionalData);
        if (LAYER_ZERO_CHAIN_ID == destChainId_) {
            (address target_, uint256 value_, string memory signature_, bytes memory payload) = _createBscProposal(
                update
            );
            return (ProposalParams(destChainId_, target_, value_, signature_, payload));
        } else {
            (address target_, uint256 value_, string memory signature_, bytes memory payload) = _generateRemotePayload(
                update,
                destChainId_
            );
            return (ProposalParams(destChainId_, target_, value_, signature_, payload));
        }
    }

    /**
     * @notice Reduces a collection or remote proposal parameters into a single command for execution on the remote chain
     * @param destChainIds The destination chain IDs of the updates
     * @param targets The targets of the updates
     * @param values The values of the updates
     * @param signatures The signatures of the updates
     * @param datas The data of the updates
     */
    function _createRemoteProposals(
        uint32[] memory destChainIds,
        address[][] memory targets,
        uint256[][] memory values,
        string[][] memory signatures,
        bytes[][] memory datas
    )
        internal
        returns (
            address[] memory remoteProposalTargets,
            uint256[] memory remoteProposalValues,
            string[] memory remoteProposalSignatures,
            bytes[] memory remoteProposalDatas
        )
    {
        RemoteProposal memory remoteProposal = RemoteProposal({
            destChainId: 0,
            proposalId: 0,
            targets: new address[](destChainIds.length),
            values: new uint256[](destChainIds.length),
            signatures: new string[](destChainIds.length),
            datas: new bytes[](destChainIds.length)
        });

        uint256 proposalId = OMNICHAIN_PROPOSAL_SENDER.proposalCount();
        for (uint256 i = 0; i < destChainIds.length; i++) {
            RemoteProposalParams memory remoteProposalParams = _createRemoteProposal(
                destChainIds[i],
                proposalId,
                targets[i],
                values[i],
                signatures[i],
                datas[i]
            );

            remoteProposal.destChainId = remoteProposalParams.destChainId;
            remoteProposal.proposalId = remoteProposalParams.proposalId;
            remoteProposal.targets[i] = remoteProposalParams.target;
            remoteProposal.values[i] = remoteProposalParams.value;
            remoteProposal.signatures[i] = remoteProposalParams.signature;
            remoteProposal.datas[i] = remoteProposalParams.data;
        }
        return (remoteProposal.targets, remoteProposal.values, remoteProposal.signatures, remoteProposal.datas);
    }

    /**
     * @notice Creates a fast-track governance proposal using the provided call data.
     * @dev This function wraps multiple on-chain or cross-chain actions into a single fast-track proposal
     * submitted to the Governor Bravo contract.
     * @param targets Array of target contract addresses for each call
     * @param values Array of ETH values (in wei) to send with each call
     * @param signatures Array of function signatures for each call
     * @param datas Array of encoded call data corresponding to each function
     * @return proposalId The ID of the newly created proposal
     */
    function _proposeUpdate(
        address[] memory targets,
        uint256[] memory values,
        string[] memory signatures,
        bytes[] memory datas
    ) internal returns (uint256 proposalId) {
        proposalId = GOVERNANCE_BRAVO.propose(
            targets,
            values,
            signatures,
            datas,
            "",
            GovernorBravoDelegateStorageV2.ProposalType.FASTTRACK
        );
        return proposalId;
    }

    /**
     * @notice Fetches updates and indexes them by their destination chain ID
     * @dev For each valid and unprocessed update:
     * - If it's destined for a remote chain, assigns it an index and counts actions for batching.
     * - If it's for the local chain, it will be processed directly.
     * Updates that are invalid (expired, already processed, etc.) will be skipped and emitted as failed.
     * @param updateIds The IDs of the updates to organize
     * @return destinationChainCount number of dstination chian on which proposal needs to be submited
     * @return validProposalCount number of total valid proposals which will be created
     * @return updates The RiskParameterUpdate array of updates in order of the updateIds array argument
     */
    function _validateProposeUpdateAndDestChainIds(
        uint256[] memory updateIds
    )
        internal
        returns (uint32 destinationChainCount, uint256 validProposalCount, RiskParameterUpdate[] memory updates)
    {
        updates = new RiskParameterUpdate[](updateIds.length);
        uint32 baseOneIndex = 1;
        validProposalCount = 0;

        for (uint256 i = 0; i < updateIds.length; i++) {
            RiskParameterUpdate memory update = RISK_ORACLE.getUpdateById(updateIds[i]);
            (UPDATE_STATUS error, uint32 destChainId) = _validateUpdateStatus(update);

            if (error == UPDATE_STATUS.NONE) {
                if (destChainId != LAYER_ZERO_CHAIN_ID) {
                    uint256 index = readUint256Cache(INDEX_CACHE_SLOT, destChainId);
                    uint256 actionCount = readUint256Cache(COUNT_CACHE_SLOT, destChainId);
                    if (index == 0) {
                        writeUint256Cache(INDEX_CACHE_SLOT, destChainId, baseOneIndex);
                        baseOneIndex++;
                        validProposalCount++;
                    }
                    writeUint256Cache(COUNT_CACHE_SLOT, destChainId, actionCount + 1);
                } else {
                    validProposalCount++;
                }
                updates[i] = update;
            } else {
                emit RiskParameterUpdateFailed(update.updateId, error);
            }
        }
        return (baseOneIndex - 1, validProposalCount, updates);
    }

    /**
     * @notice Creates a governance proposal payload for a market cap update on the BNB chain.
     * @dev Constructs the call data for invoking `processUpdate` on the associated RiskSteward contract.
     * The proposal is formed with the target RiskSteward, zero ETH value, the function signature, and encoded arguments.
     * @param update The RiskParameterUpdate object containing update details such as ID, value, type, and market
     * @return target The address of the RiskSteward contract that will execute the update
     * @return value The amount of ETH to send
     * @return signature The function signature to be called in the proposal ("processUpdate(uint256,bytes,string,address)")
     * @return data The ABI-encoded payload containing updateId, packed new value, update type, and market address
     */
    function _createBscProposal(
        RiskParameterUpdate memory update
    ) internal view returns (address target, uint256 value, string memory signature, bytes memory data) {
        IRiskSteward riskSteward = riskParameterConfigs[update.updateType].riskSteward;

        bytes memory payload = abi.encode(
            update.updateId,
            riskSteward.packNewValue(update.newValue),
            update.updateType,
            update.market
        );
        return (address(riskSteward), 0, "processUpdate(uint256,bytes,string,address)", payload);
    }

    /**
     * @notice Creates a proposal payload to be sent to the remote RiskStewardReceiver for a given update.
     * @param update The update to create a remote proposal for
     * @return target The target of the update
     * @return value Hardcoded as zero since no value is required to process an update
     * @return signature Hardcoded as "processUpdate(bytes,bytes,string,address,bytes)" since this is the signature for the processUpdate function
     * @return data The data in bytes of the update
     */
    function _generateRemotePayload(
        RiskParameterUpdate memory update,
        uint32 destChainId
    ) internal view returns (address target, uint256 value, string memory signature, bytes memory data) {
        IRiskSteward riskSteward = riskParameterConfigs[update.updateType].riskSteward;
        address remoteReceiver = remoteRiskStewardReceiver[destChainId];

        bytes memory payload = abi.encode(
            update.updateId,
            riskSteward.packNewValue(update.newValue),
            update.updateType,
            update.market,
            update.additionalData,
            update.timestamp
        );
        return (remoteReceiver, 0, "processUpdate(uint256,bytes,string,address,bytes,uint256)", payload);
    }

    /**
     * @notice Creates a remote proposal params for updates to be executed on a remote chain.
     * @param destChainId The destination chain ID of the update
     * @param proposalId The proposal ID of the update
     * @param targets The targets of the update
     * @param values The values of the update
     * @param signatures The signatures of the update
     * @param datas The data of the update
     * @return remoteProposalParams The remote proposal params
     */
    function _createRemoteProposal(
        uint32 destChainId,
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        string[] memory signatures,
        bytes[] memory datas
    ) internal view returns (RemoteProposalParams memory remoteProposalParams) {
        uint16 lzV1DestChainId = lzV2ToV1ChainId[destChainId];
        require(lzV1DestChainId != 0, "invalid lzV1DestChainId");

        bytes memory payload = abi.encode(
            targets,
            values,
            signatures,
            datas,
            GovernorBravoDelegateStorageV2.ProposalType.FASTTRACK
        );

        bytes memory payloadWithId = abi.encode(payload, proposalId);
        (uint256 fee, bytes memory remoteAdapterParam) = _getRemoteProposalFee(lzV1DestChainId, payloadWithId);
        return
            RemoteProposalParams({
                destChainId: lzV1DestChainId,
                proposalId: proposalId,
                target: address(OMNICHAIN_PROPOSAL_SENDER),
                value: fee,
                signature: "execute(uint16,bytes,bytes,address)",
                data: abi.encode(lzV1DestChainId, payloadWithId, remoteAdapterParam, address(0))
            });
    }

    /**
     * @notice Estimates the fee needed to receive and execute a proposal on a remote chain
     * @param destChainId The destination chain ID of the update
     * @param payloadWithId The payload with the proposal ID
     * @return estimatedFee The estimated fee
     */
    function _getRemoteProposalFee(
        uint32 destChainId,
        bytes memory payloadWithId
    ) internal view returns (uint256 estimatedFee, bytes memory adapterParams) {
        uint16 version = 1;
        uint256 requiredGas = 300000;
        bytes memory adapterParams_ = abi.encodePacked(version, requiredGas);
        (uint256 fee, ) = OMNICHAIN_PROPOSAL_SENDER.estimateFees(
            uint16(destChainId),
            payloadWithId,
            false,
            adapterParams_
        );
        return (fee, adapterParams_);
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
    ) internal view returns (UPDATE_STATUS error, uint32) {
        require(update.updateId != 0, "No update found");

        RiskParamConfig memory config = riskParameterConfigs[update.updateType];

        RiskParameterUpdate memory latestForMarketAndType = RISK_ORACLE.getLatestUpdateByParameterAndMarket(
            update.updateType,
            update.market
        );

        (, uint32 destChainId) = config.riskSteward.decodeAdditionalData(update.additionalData);

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
            processedUpdates[update.updateId] == UPDATE_STATUS.SEND_TO_DESTINATION_CHAIN ||
            processedUpdates[update.updateId] == UPDATE_STATUS.PROPOSED
        ) {
            return (processedUpdates[update.updateId], destChainId);
        }

        address remoteReceiver = remoteRiskStewardReceiver[destChainId];
        if (
            !isSupplyOrBorrowCapUpdate(update.updateType) &&
            remoteReceiver == address(0) &&
            destChainId != LAYER_ZERO_CHAIN_ID
        ) {
            return (UPDATE_STATUS.INVALID_DESTINATION_CHAIN, destChainId);
        }

        return (UPDATE_STATUS.NONE, destChainId);
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

    /**
     * @notice Fetches and decrements the cached action count for a given destination chain ID.
     * @param destChainId The destination chain ID whose action index is being updated
     * @return actionIndex The updated (decremented) action index
     */
    function getAndUpdateActionIndex(uint32 destChainId) internal returns (uint256) {
        uint256 actionIndex = readUint256Cache(COUNT_CACHE_SLOT, destChainId);
        if (actionIndex != 0) {
            actionIndex = actionIndex - 1;
        }
        writeUint256Cache(COUNT_CACHE_SLOT, destChainId, actionIndex);
        return actionIndex;
    }

    /**
     * @notice Writes a uint256 value to transient storage under a computed slot key.
     * @param slot The base slot identifier (e.g., COUNT_CACHE_SLOT or INDEX_CACHE_SLOT)
     * @param key The secondary key
     * @param value The uint256 value to be stored in the transient storage
     */
    function writeUint256Cache(bytes32 slot, uint32 key, uint256 value) internal {
        bytes32 slotKey = keccak256(abi.encode(slot, key));
        assembly ("memory-safe") {
            tstore(slotKey, value)
        }
    }

    /**
     * @notice Reads a cached uint256 value from transient storage using a computed slot key.
     * @param slot The base slot identifier used for organizing different cached data types
     * @param key A secondary identifier
     * @return value The uint256 value stored under the derived transient slot
     */
    function readUint256Cache(bytes32 slot, uint32 key) internal view returns (uint256 value) {
        bytes32 slotKey = keccak256(abi.encode(slot, key));
        assembly ("memory-safe") {
            value := tload(slotKey)
        }
    }
}
