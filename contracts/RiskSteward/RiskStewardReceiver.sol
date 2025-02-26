// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.25;

import { Strings } from "@openzeppelin/contracts/utils/Strings.sol";
import { IRiskSteward } from "./IRiskSteward.sol";
import { IRiskOracle, RiskParameterUpdate } from "../interfaces/IRiskOracle.sol";
import { IRiskStewardSourceReceiver, RiskParamConfig } from "./IRiskStewardReceiver.sol";
import { PausableUpgradeable } from "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import { AccessControlledV8 } from "../Governance/AccessControlledV8.sol";
import { ensureNonzeroAddress } from "@venusprotocol/solidity-utilities/contracts/validators.sol";
import { IGovernorBravoDelegate, GovernorBravoDelegateStorageV2 } from "../Governance/GovernorBravoInterfacesV8.sol";
import { IOmnichainProposalSender } from "../Cross-chain/interfaces/IOmnichainProposalSender.sol";
import { RiskStewardReceiverBase } from "./RiskStewardReceiverBase.sol";

/**
 * @title RiskStewardReceiver
 * @author Venus
 * @notice Contract that can read updates from the Chaos Labs Risk Oracle, validate them, and push them to the correct RiskSteward.
 * @custom:security-contact https://github.com/VenusProtocol/governance-contracts#discussion
 */
contract RiskStewardReceiver is IRiskStewardSourceReceiver, RiskStewardReceiverBase {
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
    mapping(uint16 destChainId => address) public destinationChainRiskStewardRemoteReceiver;

    /**
     * @notice Source chain id
     */
    uint16 public immutable LAYER_ZERO_CHAIN_ID;

    bytes32 private constant INDEX_CACHE_SLOT = keccak256(abi.encode("remote-index-cache"));

    bytes32 private constant COUNT_CACHE_SLOT = keccak256(abi.encode("remote-count-cache"));

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[46] private __gap;

    enum UPDATE_STATUS {
        NONE,
        PROCESSED,
        PROPOSED,
        CONFIG_NOT_ACTIVE,
        EXPIRED,
        UPDATE_TOO_FREQUENT,
        FAILED,
        INVALID_DESTINATION_CHAIN
    }

    /**
     * @notice Event emitted when an update is proposed with proposal id and update id
     */
    event RiskParameterUpdateProposed(uint256 indexed updateId);


    /**
     * @notice Emitted when applying an update fails to validate or execute
     */
    event RiskParameterUpdateFailed(uint256 indexed updateId, UPDATE_STATUS indexed error);

    event DestinationChainRiskStewardRemoteReceiverUpdated(
        uint16 indexed destChainId,
        address indexed previousRemoteReceiver,
        address indexed newRemoteReceiver
    );

    /**
     * @notice Thrown if a submitted update is not active and therefor cannot be processed
     */
    error ConfigNotActive(uint256 updateId);

    struct RemoteProposalParams {
        uint16 destChainId;
        uint256 proposalId;
        address target;
        uint256 value;
        string signature;
        bytes data;
    }

    struct RemoteProposal {
        uint16 destChainId;
        uint256 proposalId;
        address[] targets;
        uint256[] values;
        string[] signatures;
        bytes[] datas;
    }

    /**
     * @dev Sets the immutable values and disables initializers. Address parameters must be nonzero.
     * @param riskOracle_ The address of the risk oracle
     * @param governorBravo_ The address of the governor bravo
     * @param omnichainProposalSender_ The address of the omnichain proposal sender
     * @param layerZeroChainId The chain id of the layer zero
     * @custom:error Throws ZeroAddressNotAllowed if the risk oracle address is zero
     * @custom:oz-upgrades-unsafe-allow constructor
     */
    constructor(
        address riskOracle_,
        address governorBravo_,
        address omnichainProposalSender_,
        uint16 layerZeroChainId
    ) {
        ensureNonzeroAddress(riskOracle_);
        ensureNonzeroAddress(governorBravo_);
        ensureNonzeroAddress(omnichainProposalSender_);
        RISK_ORACLE = IRiskOracle(riskOracle_);
        GOVERNANCE_BRAVO = IGovernorBravoDelegate(governorBravo_);
        OMNICHAIN_PROPOSAL_SENDER = IOmnichainProposalSender(omnichainProposalSender_);
        LAYER_ZERO_CHAIN_ID = layerZeroChainId;
        _disableInitializers();
    }

    /**
     * @notice Initializes the contract as ownable, pausable, and access controlled
     * @param accessControlManager_ The address of the access control manager
     */
    function initialize(address accessControlManager_) external initializer {
        __Pausable_init();
        __AccessControlled_init(accessControlManager_);
    }

    /**
     * @notice Sets the remote receiver for a destination chain
     * @param destChainId The destination chain ID
     * @param remoteReceiver The address of the remote receiver
     * @custom:access Controlled by AccessControlManager
     * @custom:event Emits DestinationChainRiskStewardRemoteReceiverSet with the destination chain ID and the remote receiver
     * @custom:error Throws ZeroAddressNotAllowed if the remote receiver address is zero
     */
    function setDestinationChainRiskStewardRemoteReceiver(uint16 destChainId, address remoteReceiver) external {
        _checkAccessAllowed("setDestinationChainRiskStewardRemoteReceiver(uint16,address)");
        ensureNonzeroAddress(remoteReceiver);
        emit DestinationChainRiskStewardRemoteReceiverUpdated(
            destChainId,
            destinationChainRiskStewardRemoteReceiver[destChainId],
            remoteReceiver
        );
        destinationChainRiskStewardRemoteReceiver[destChainId] = remoteReceiver;
    }

    function deleteDestinationChainRiskStewardRemoteReceiver(uint16 destChainId) external {
        _checkAccessAllowed("deleteDestinationChainRiskStewardRemoteReceiver(uint16)");
        ensureNonzeroAddress(destinationChainRiskStewardRemoteReceiver[destChainId]);

        emit DestinationChainRiskStewardRemoteReceiverUpdated(
            destChainId,
            destinationChainRiskStewardRemoteReceiver[destChainId],
            address(0)
        );
        destinationChainRiskStewardRemoteReceiver[destChainId] = address(0);
    }

    /**
     * @notice Processes an update by its ID. Will validate that the update configuration is active, is not expired, unprocessed, and that the debounce period has passed.
     * If the update is to be applied on BNB chain and valid, it will be processed by the associated risk steward contract which will perform update specific validations and apply validated updates.
     * If the update is to be applied on a remote chain, it will be submitted to governance as a fast track proposal.
     * @param updateId The ID of the update to process
     * @custom:event Emits RiskParameterUpdateProcessed with the update ID
     * @custom:error Throws ConfigNotActive if the config is not active
     * @custom:error Throws UpdateIsExpired if the update is expired
     * @custom:error Throws ConfigAlreadyProcessed if the update has already been processed
     * @custom:error Throws UpdateTooFrequent if the update is too frequent
     */
    function processUpdateById(uint256 updateId) external whenNotPaused {
        RiskParameterUpdate memory update = RISK_ORACLE.getUpdateById(updateId);

        (UPDATE_STATUS error, uint16 destChainId) = _validateUpdateStatus(update);
        if (error == UPDATE_STATUS.NONE) {
            _executeOrProposeRemoteProposal(update, destChainId);
        } else {
            processedUpdates[update.updateId] = error;
            emit RiskParameterUpdateFailed(update.updateId, error);
        }
    }

    /**
     * @notice Processes the latest update for a given parameter and market. Will validate that the update configuration is active, is not expired,
     * unprocessed, and that the debounce period has passed.
     * If the update is to be applied on BNB chain and valid, it will be processed by the associated risk steward contract which will perform update specific validations and apply validated updates.
     * If the update is to be applied on a remote chain, it will be submitted to governance as a fast track proposal.
     * @param updateType The type of update to process
     * @param market The market to process the update for
     * @custom:event Emits RiskParameterUpdated with the update ID
     * @custom:event Emits RiskParameterUpdateProposed with the the update ID
     * @custom:error Throws ConfigNotActive if the config is not active
     * @custom:error Throws UpdateIsExpired if the update is expired
     * @custom:error Throws ConfigAlreadyProcessed if the update has already been processed
     * @custom:error Throws UpdateTooFrequent if the update is too frequent
     */
    function processUpdateByParameterAndMarket(string memory updateType, address market) external whenNotPaused {
        RiskParameterUpdate memory update = RISK_ORACLE.getLatestUpdateByParameterAndMarket(updateType, market);
        (UPDATE_STATUS error, uint16 destChainId) = _validateUpdateStatus(update);
        if (error == UPDATE_STATUS.NONE) {
            _executeOrProposeRemoteProposal(update, destChainId);
        } else {
            processedUpdates[update.updateId] = error;
            emit RiskParameterUpdateFailed(update.updateId, error);
        }
    }

    /**
     * @notice Processes a list of updates by their IDs. First updates will be validated that they are active, not expired and unprocessed.
     * If the update passes validation, it will be executed if it is for BNB chain or else it will be proposed to governance as a fast track proposal.
     * @param updateIds The IDs of the updates to process
     * @custom:event Emits RiskParameterUpdated with the update ID
     @custom:event Emits RiskParameterUpdateProposed with the update IDs
     * @custom:event Emits UpdateFailed with the update ID and the error if validation fails for an update
     * @custom:error Throws ConfigNotActive if the config is not active
     * @custom:error Throws UpdateIsExpired if the update is expired
     * @custom:error Throws ConfigAlreadyProcessed if the update has already been processed
     * @custom:error Throws UpdateTooFrequent if the update is too frequent
     * @custom:error Throws UpdateNotInRange if the update is not in range
     * @custom:error Throws UnsupportedUpdateType if the update type is not supported
     */
    function processUpdatesByIds(uint256[] memory updateIds) external {
        (
            uint16 destinationChainCount,
            uint256 validRemoteUpdateCount,
            RiskParameterUpdate[] memory updates
        ) = _validateUpdateAndDestChainIds(updateIds);
        _executeOrProposeRemoteProposals(destinationChainCount, validRemoteUpdateCount, updates);
    }

    /**
     * @dev Internal function which calls the risk steward to apply the update. If successful, it records the last processed time for the update and
     *market and marks the update as processed.
     * @custom:event Emits RiskParameterUpdateProcessed with the update ID
     */
    function _processUpdate(RiskParameterUpdate memory update) internal {
        IRiskSteward(riskParameterConfigs[update.updateType].riskSteward).processUpdate(update.updateId, update.newValue, update.updateType, update.market, update.additionalData);
        processedUpdates[update.updateId] = UPDATE_STATUS.PROCESSED;
        emit RiskParameterUpdateProcessed(update.updateId);
    }

    /**
     * @notice Executes BNB updates and reduces remote updates into a single remote proposal.
     * @param destinationChainCount The number of destination chains
     * @param updates The updates to execute or propose remote proposals for
     * @custom:event Emits RiskParameterUpdated with the update ID
     * @custom:event Emits RiskParameterUpdateProposed with the update IDs
     */
    function _executeOrProposeRemoteProposals(
        uint16 destinationChainCount,
        uint256 validRemoteUpdateCount,
        RiskParameterUpdate[] memory updates
    ) internal {
        uint16[] memory destChainIds = new uint16[](destinationChainCount);
        address[][] memory remoteTargets = new address[][](destChainIds.length);
        uint256[][] memory remoteValues = new uint256[][](destChainIds.length);
        string[][] memory remoteSignatures = new string[][](destChainIds.length);
        bytes[][] memory remoteDatas = new bytes[][](destChainIds.length);

        for (uint256 i = 0; i < updates.length; i++) {
            RiskParameterUpdate memory update = updates[i];
            if (Strings.equal(update.updateType, "")) {
                // Skip indexes of invalid updates
                continue;
            }

            (
                uint16 destChainId,
                address target,
                uint256 value,
                string memory signature,
                bytes memory data
            ) = _executeOrPrepareParams(update);

            if (processedUpdates[update.updateId] == UPDATE_STATUS.NONE) {
                uint256 index = readUint256Cache(INDEX_CACHE_SLOT, destChainId) - 1;
                uint256 actionCount = getAndUpdateActionIndex(destChainId);
                if (remoteTargets[index].length == 0) {
                    destChainIds[index] = destChainId;
                    remoteTargets[index] = new address[](actionCount + 1);
                    remoteValues[index] = new uint256[](actionCount + 1);
                    remoteSignatures[index] = new string[](actionCount + 1);
                    remoteDatas[index] = new bytes[](actionCount + 1);
                }

                remoteTargets[index][actionCount] = target;
                remoteValues[index][actionCount] = value;
                remoteSignatures[index][actionCount] = signature;
                remoteDatas[index][actionCount] = data;
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
        _proposeUpdate(remoteProposalTargets, remoteProposalValues, remoteProposalSignatures, remoteProposalDatas);
    }

    function getAndUpdateActionIndex(uint16 destChainId) internal returns (uint256) {
        uint256 actionIndex = readUint256Cache(COUNT_CACHE_SLOT, destChainId);
        if (actionIndex != 0) {
            actionIndex = actionIndex - 1;
        }
        writeUint256Cache(COUNT_CACHE_SLOT, destChainId, actionIndex);
        return actionIndex;
    }

    /**
     * @notice Executes or prepares parameters for a remote proposal. If the BNB update fails an event is emitted and processing continues.
     * @param update The RiskParameterUpdate to execute if on BNB chain or prepare parameters for if on a remote chain
     * @custom:event Emits BatchedUpdateFailed with the update ID if the update fails to execute
     * @return destChainId The destination chain ID of the update
     * @return target The target of the update
     * @return value The value of the update
     * @return signature The signature of the update
     * @return data The data of the update
     */
    function _executeOrPrepareParams(
        RiskParameterUpdate memory update
    ) internal returns (uint16 destChainId, address target, uint256 value, string memory signature, bytes memory data) {
        IRiskSteward riskSteward = riskParameterConfigs[update.updateType].riskSteward;
        (address _underlying, uint16 destChainId_) = riskSteward.decodeAdditionalData(update.additionalData);
        if (LAYER_ZERO_CHAIN_ID == destChainId_) {
            try riskSteward.processUpdate(update.updateId, update.newValue, update.updateType, update.market, update.additionalData) {
                processedUpdates[update.updateId] = UPDATE_STATUS.PROCESSED;
                emit RiskParameterUpdateProcessed(update.updateId);
            } catch {
                emit RiskParameterUpdateFailed(update.updateId, UPDATE_STATUS.FAILED);
                processedUpdates[update.updateId] = UPDATE_STATUS.FAILED;
            }
        } else {
            (address target_, uint256 value_, string memory signature_, bytes memory payload) = _createUpdateProposal(
                update,
                destChainId_
            );
            return (destChainId_, target_, value_, signature_, payload);
        }
    }

    /**
     * @dev Internal function used to execute or propose a single update.
     * If the update is on BNB it will be processed by the associated risk steward contract.
     * If the update is on a remote chain, it will be proposed to governance as a fast track proposal.
     * @param update The update to execute or propose a remote proposal for
     */
    function _executeOrProposeRemoteProposal(RiskParameterUpdate memory update, uint16 destChainId) internal {
        IRiskSteward riskSteward = IRiskSteward(riskParameterConfigs[update.updateType].riskSteward);
        if (LAYER_ZERO_CHAIN_ID == destChainId) {
            try riskSteward.processUpdate(update.updateId, update.newValue, update.updateType, update.market, update.additionalData) {
                processedUpdates[update.updateId] = UPDATE_STATUS.PROCESSED;
            } catch {
                emit RiskParameterUpdateFailed(update.updateId, UPDATE_STATUS.FAILED);
                processedUpdates[update.updateId] = UPDATE_STATUS.FAILED;
            }
        } else {
            uint256 proposalId = _createUpdateRemoteProposal(update, destChainId);
            processedUpdates[update.updateId] = UPDATE_STATUS.PROPOSED;
            emit RiskParameterUpdateProposed(update.updateId);
        }
        emit RiskParameterUpdateProcessed(update.updateId);
    }

    function _createUpdateRemoteProposal(
        RiskParameterUpdate memory update,
        uint16 destChainId
    ) internal returns (uint256 proposalId) {
        uint256 proposalId = OMNICHAIN_PROPOSAL_SENDER.proposalCount();
        (address target, uint256 value, string memory signature, bytes memory data) = _createUpdateProposal(
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

        return
            _proposeUpdate(remoteProposalTargets, remoteProposalValues, remoteProposalSignatures, remoteProposalDatas);
    }

    /**
     * @notice Creates a remote proposal params for a given update.
     * @param update The update to create a remote proposal for
     * @return target The target of the update
     * @return value Hardcoded as zero since no value is required to process an update
     * @return signature Hardcoded as "processUpdate(bytes,bytes,string,address,bytes)" since this is the signature for the processUpdate function
     * @return data The data in bytes of the update
     */
    function _createUpdateProposal(
        RiskParameterUpdate memory update,
        uint16 destChainId
    ) internal returns (address target, uint256 value, string memory signature, bytes memory data) {
        IRiskSteward riskSteward = riskParameterConfigs[update.updateType].riskSteward;

        address remoteReceiver = destinationChainRiskStewardRemoteReceiver[destChainId];

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
        uint16 destChainId,
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        string[] memory signatures,
        bytes[] memory datas
    ) internal returns (RemoteProposalParams memory remoteProposalParams) {
        bytes memory payload = abi.encode(
            targets,
            values,
            signatures,
            datas,
            GovernorBravoDelegateStorageV2.ProposalType.FASTTRACK
        );

        bytes memory payloadWithId = abi.encode(payload, proposalId);
        (uint256 fee, bytes memory remoteAdapterParam) = _getFee(destChainId, payloadWithId);
        return
            RemoteProposalParams({
                destChainId: destChainId,
                proposalId: proposalId,
                target: address(OMNICHAIN_PROPOSAL_SENDER),
                value: fee,
                signature: "execute(uint16,bytes,bytes,address)",
                data: abi.encode(destChainId, payloadWithId, remoteAdapterParam, address(0))
            });
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
        uint16[] memory destChainIds,
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
    function _getFee(
        uint16 destChainId,
        bytes memory payloadWithId
    ) internal returns (uint256 estimatedFee, bytes memory adapterParams) {
        uint16 version = 1;
        uint256 requiredGas = 300000;
        bytes memory adapterParams_ = abi.encodePacked(version, requiredGas);
        (uint256 fee, uint256 ___) = OMNICHAIN_PROPOSAL_SENDER.estimateFees(
            destChainId,
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
     * @notice Validates the status of an update silently. Will validate that the update configuration is active, is not expired, unprocessed, and that the debounce period has passed.
     * @return error The UPDATE_STATUS error code if the update is not valid or 0
     */
    function _validateUpdateStatus(
        RiskParameterUpdate memory update
    ) internal view returns (UPDATE_STATUS error, uint16 destChainId) {
        RiskParamConfig memory config = riskParameterConfigs[update.updateType];

        RiskParameterUpdate memory latestForMarketAndType = RISK_ORACLE.getLatestUpdateByParameterAndMarket(
            update.updateType,
            update.market
        );

        if (latestForMarketAndType.updateId != update.updateId) {
            return (UPDATE_STATUS.EXPIRED, destChainId);
        }

        if (!config.active) {
            return (UPDATE_STATUS.CONFIG_NOT_ACTIVE, destChainId);
        }

        (address _underlying, uint16 destChainId) = config.riskSteward.decodeAdditionalData(update.additionalData);

        address remoteReceiver = destinationChainRiskStewardRemoteReceiver[destChainId];
        if (remoteReceiver == address(0) && destChainId != LAYER_ZERO_CHAIN_ID) {
            return (UPDATE_STATUS.INVALID_DESTINATION_CHAIN, destChainId);
        }

        if (update.timestamp + UPDATE_EXPIRATION_TIME < block.timestamp) {
            return (UPDATE_STATUS.EXPIRED, destChainId);
        }

        if (
            processedUpdates[update.updateId] == UPDATE_STATUS.PROCESSED ||
            processedUpdates[update.updateId] == UPDATE_STATUS.PROPOSED
        ) {
            return (processedUpdates[update.updateId], destChainId);
        }

        return (UPDATE_STATUS.NONE, destChainId);
    }

    function writeUint256Cache(bytes32 slot, uint16 key, uint256 value) internal {
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
    function readUint256Cache(bytes32 slot, uint16 key) internal view returns (uint256 value) {
        bytes32 slotKey = keccak256(abi.encode(slot, key));
        assembly ("memory-safe") {
            value := tload(slotKey)
        }
    }

    /**
     * @notice Fetches updates and indexes them by their destination chain ID
     * @param updateIds The IDs of the updates to organize
     * @return destinationChainCount
     * @return validUpdateCount
     * @return updates The RiskParameterUpdate array of updates in order of the updateIds array argument
     */
    function _validateUpdateAndDestChainIds(
        uint256[] memory updateIds
    ) internal returns (uint16 destinationChainCount, uint256 validUpdateCount, RiskParameterUpdate[] memory updates) {
        updates = new RiskParameterUpdate[](updateIds.length);
        uint16 baseOneIndex = 1;
        uint256 validRemoteUpdateCount = 0;

        for (uint256 i = 0; i < updateIds.length; i++) {
            RiskParameterUpdate memory update = RISK_ORACLE.getUpdateById(updateIds[i]);
            (UPDATE_STATUS error, uint16 destChainId) = _validateUpdateStatus(update);
            if (error == UPDATE_STATUS.NONE) {
                IRiskSteward riskSteward = riskParameterConfigs[update.updateType].riskSteward;
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
            } else {
                emit RiskParameterUpdateFailed(update.updateId, error);
            }
        }
        return (baseOneIndex - 1, validRemoteUpdateCount, updates);
    }
}
