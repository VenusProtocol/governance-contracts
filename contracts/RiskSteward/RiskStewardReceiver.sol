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
     * @notice Mapping of processed updates. Used to prevent re-execution
     */
    mapping(uint256 updateId => UPDATE_STATUS) public processedUpdates;

    /**
     * @notice Mapping of supported risk configurations and their validation parameters
     */
    mapping(uint32 destChainId => address) public remoteRiskStewardReceiver;

    /**
     * @notice Source chain id
     */
    uint32 public immutable LAYER_ZERO_CHAIN_ID;

    bytes32 private constant INDEX_CACHE_SLOT = keccak256(abi.encode("remote-index-cache"));

    bytes32 private constant COUNT_CACHE_SLOT = keccak256(abi.encode("remote-count-cache"));

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
     * @notice Processes an update by its ID. Will validate that the update configuration is active, is not expired, and unprocessed.
     * If the update is to be applied on BNB chain and valid, it will be processed by the associated risk steward contract which will perform update specific validations
     * and apply validated updates.
     * If the update is to be applied on a remote chain, it will send as a payload to remote chain using LZ bridge.
     * @param updateId The ID of the update to process
     * @custom:event Emits RiskParameterUpdateProcessed with the update ID
     */
    function processUpdateById(
        uint256 updateId,
        bytes calldata options,
        uint256 ZROTokens
    ) public payable whenNotPaused {
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
     * @notice Executes the update based on its type.
     * If the update is a supply or borrow cap change, it executes the update directly
     * Otherwise, it sends a proposal to the specified destination chain.
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
     * @notice Propose a list of updates by their IDs this function can propose any type of update. First updates will be validated that they are active, not expired and unprocessed.
     * If the update passes validation, it will be proposed to governance as a fast track proposal.
     * @param updateIds The IDs of the updates to process
     * @custom:event Emits RiskParameterUpdated with the update ID
     * @custom:event Emits RiskParameterUpdateProposed with the update IDs
     * @custom:event Emits UpdateFailed with the update ID and the error if validation fails for an update
     * @custom:error Throws UpdateIsExpired if the update is expired
     * @custom:error Throws ConfigAlreadyProcessed if the update has already been processed
     */
    function proposeUpdatesByIds(uint256[] memory updateIds) external {
        (
            uint32 destinationChainCount,
            uint256 validRemoteUpdateCount,
            uint256 validUpdateCount,
            RiskParameterUpdate[] memory updates
        ) = _validateProposeUpdateAndDestChainIds(updateIds);
        _sendProposals(destinationChainCount, validUpdateCount, updates);
    }

    /**
     * @notice prepares parameters for a remote proposal or a BSC proposal.
     * @param update The RiskParameterUpdate to execute if on BNB chain or prepare parameters for if on a remote chain
     * @custom:event Emits BatchedUpdateFailed with the update ID if the update fails to execute
     * @return ProposalParams proposal parameters
     */
    function _prepareProposalParams(RiskParameterUpdate memory update) internal view returns (ProposalParams memory) {
        IRiskSteward riskSteward = riskParameterConfigs[update.updateType].riskSteward;
        (address _underlying, uint32 destChainId_) = riskSteward.decodeAdditionalData(update.additionalData);
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
        emit RiskParameterUpdateProcessed(update.updateId);
    }

    /**
     * @notice Creates and sends a proposal specifically for the BSC
     * This wraps the given update into a remote proposal format and submits it
     * @param update The risk parameter update to process
     * @return proposalId The ID of the newly created proposal
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
     * @notice Prepares and sends a remote proposal to a non-BSC (non-local) destination chain.
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
     * @notice Creates a update proposal to call on destination Remote Receiver params for a given update.
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
        bytes memory payload = abi.encode(
            targets,
            values,
            signatures,
            datas,
            GovernorBravoDelegateStorageV2.ProposalType.FASTTRACK
        );

        bytes memory payloadWithId = abi.encode(payload, proposalId);
        (uint256 fee, bytes memory remoteAdapterParam) = _getRemoteProposalFee(destChainId, payloadWithId);
        return
            RemoteProposalParams({
                destChainId: destChainId,
                proposalId: proposalId,
                target: address(OMNICHAIN_PROPOSAL_SENDER),
                value: fee,
                signature: "execute(uint32,bytes,bytes,address)",
                data: abi.encode(destChainId, payloadWithId, remoteAdapterParam, address(0))
            });
    }

    /**
     * @notice Executes BNB updates and reduces remote updates into a single remote proposal.
     * @param destinationChainCount The number of destination chains
     * @param updates The updates to execute or propose remote proposals for
     * @custom:event Emits RiskParameterUpdated with the update ID
     * @custom:event Emits RiskParameterUpdateProposed with the update IDs
     */
    function _sendProposals(
        uint32 destinationChainCount,
        uint256 validUpdateCount,
        RiskParameterUpdate[] memory updates
    ) internal {
        uint32[] memory destChainIds = new uint32[](destinationChainCount);
        address[][] memory remoteTargets = new address[][](destChainIds.length);
        uint256[][] memory remoteValues = new uint256[][](destChainIds.length);
        string[][] memory remoteSignatures = new string[][](destChainIds.length);
        bytes[][] memory remoteDatas = new bytes[][](destChainIds.length);
        address[] memory targets = new address[](validUpdateCount);
        uint256[] memory values = new uint256[](validUpdateCount);
        string[] memory signatures = new string[](validUpdateCount);
        bytes[] memory datas = new bytes[](validUpdateCount);
        uint256 ind = 0;

        for (uint256 i = 0; i < updates.length; i++) {
            RiskParameterUpdate memory update = updates[i];
            ProposalParams memory p = _prepareProposalParams(update);

            if (processedUpdates[update.updateId] == UPDATE_STATUS.NONE) {
                if (LAYER_ZERO_CHAIN_ID == p.destChainId) {
                    targets[ind] = p.target;
                    values[ind] = p.value;
                    signatures[ind] = p.signature;
                    datas[ind] = p.data;
                    ind++;
                    processedUpdates[update.updateId] = UPDATE_STATUS.PROPOSED;
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
     * @notice Estimates the fee needed to receive and execute a proposal on a remote chain
     * @param destChainId The destination chain ID of the update
     * @param payloadWithId The payload with the proposal ID
     * @return estimatedFee The estimated fee
     */
    function _getRemoteProposalFee(
        uint32 destChainId,
        bytes memory payloadWithId
    ) internal view returns (uint256 estimatedFee, bytes memory adapterParams) {
        uint32 version = 1;
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
     * @notice Fetches updates and indexes them by their destination chain ID
     * @param updateIds The IDs of the updates to organize
     * @return destinationChainCount number of dstination chian on which proposal needs to be submited
     * @return validRemoteUpdateCount number of total valid remote upates
     * @return validUpdateCount number of total valid upates
     * @return updates The RiskParameterUpdate array of updates in order of the updateIds array argument
     */
    function _validateProposeUpdateAndDestChainIds(
        uint256[] memory updateIds
    )
        internal
        returns (
            uint32 destinationChainCount,
            uint256 validRemoteUpdateCount,
            uint256 validUpdateCount,
            RiskParameterUpdate[] memory updates
        )
    {
        updates = new RiskParameterUpdate[](updateIds.length);
        uint32 baseOneIndex = 1;
        validRemoteUpdateCount = 0;
        validUpdateCount = 0;

        for (uint256 i = 0; i < updateIds.length; i++) {
            RiskParameterUpdate memory update = RISK_ORACLE.getUpdateById(updateIds[i]);
            (UPDATE_STATUS error, uint32 destChainId) = _validateUpdateStatus(update);
            if (Strings.equal(update.updateType, "")) {
                // Skip indexes of invalid updates
                continue;
            }
            if (error == UPDATE_STATUS.NONE) {
                if (destChainId != LAYER_ZERO_CHAIN_ID) {
                    uint256 index = readUint256Cache(INDEX_CACHE_SLOT, destChainId);
                    uint256 actionCount = readUint256Cache(COUNT_CACHE_SLOT, destChainId);
                    if (index == 0) {
                        writeUint256Cache(INDEX_CACHE_SLOT, destChainId, baseOneIndex);
                        baseOneIndex++;
                    }
                    writeUint256Cache(COUNT_CACHE_SLOT, destChainId, actionCount + 1);
                    validRemoteUpdateCount++;
                }
                updates[i] = update;
                validUpdateCount++;
            } else {
                emit RiskParameterUpdateFailed(update.updateId, error);
            }
        }
        return (baseOneIndex - 1, validRemoteUpdateCount, validUpdateCount, updates);
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
     *  @notice Empty implementation of renounce ownership to avoid any mishappening
     */
    function renounceOwnership() public override {}

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

    function writeUint256Cache(bytes32 slot, uint32 key, uint256 value) internal {
        bytes32 slotKey = keccak256(abi.encode(slot, key));
        assembly ("memory-safe") {
            tstore(slotKey, value)
        }
    }

    /**
     * @notice Read cached price from transient storage
     * @param key address of the asset
     * @return value cached asset price
     */
    function readUint256Cache(bytes32 slot, uint32 key) internal view returns (uint256 value) {
        bytes32 slotKey = keccak256(abi.encode(slot, key));
        assembly ("memory-safe") {
            value := tload(slotKey)
        }
    }

    function getAndUpdateActionIndex(uint32 destChainId) internal returns (uint256) {
        uint256 actionIndex = readUint256Cache(COUNT_CACHE_SLOT, destChainId);
        if (actionIndex != 0) {
            actionIndex = actionIndex - 1;
        }
        writeUint256Cache(COUNT_CACHE_SLOT, destChainId, actionIndex);
        return actionIndex;
    }
}
