// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.25;

import { Strings } from "@openzeppelin/contracts/utils/Strings.sol";
import { IRiskSteward } from "./IRiskSteward.sol";
import { IRiskOracle, RiskParameterUpdate } from "../interfaces/IRiskOracle.sol";
import { IRiskStewardReceiver, RiskParamConfig } from "./IRiskStewardReceiver.sol";
import { PausableUpgradeable } from "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import { AccessControlledV8 } from "../Governance/AccessControlledV8.sol";
import { ensureNonzeroAddress } from "@venusprotocol/solidity-utilities/contracts/validators.sol";
import { IGovernorBravoDelegate, GovernorBravoDelegateStorageV2 } from "../Governance/GovernorBravoInterfacesV8.sol";
import { IOmnichainProposalSender } from "../Cross-chain/interfaces/IOmnichainProposalSender.sol";

/**
 * @title RiskStewardReceiver
 * @author Venus
 * @notice Contract that can read updates from the Chaos Labs Risk Oracle, validate them, and push them to the correct RiskSteward.
 * @custom:security-contact https://github.com/VenusProtocol/governance-contracts#discussion
 */
contract RiskStewardReceiver is IRiskStewardReceiver, PausableUpgradeable, AccessControlledV8 {
    /**
     * @notice Mapping of supported risk configurations and their validation parameters
     */
    mapping(string updateType => RiskParamConfig) public riskParameterConfigs;

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
     * @notice Source chain id
     */
    uint16 public immutable LAYER_ZERO_CHAIN_ID;

    /**
     * @notice Time before a submitted update is considered stale
     */
    uint256 public constant UPDATE_EXPIRATION_TIME = 1 days;

    /**
     * @notice Mapping of processed updates. Used to prevent re-execution
     */
    mapping(uint256 updateId => UPDATE_STATUS) public processedUpdates;

    /**
     * @notice Mapping of supported risk configurations and their validation parameters
     */
    mapping(uint16 destChainId => address) public destinationChainRiskStewardRemoteReceiver;

    bytes32 private constant INDEX_CACHE_SLOT = keccak256(abi.encode("remote-index-cache"));

    bytes32 private constant COUNT_CACHE_SLOT = keccak256(abi.encode("remote-count-cache"));

    uint256[50] private __gap;

    enum UPDATE_STATUS {
        NONE,
        PROCESSED,
        PROPOSED,
        CONFIG_NOT_ACTIVE,
        EXPIRED,
        UPDATE_TOO_FREQUENT,
        FAILED
    }
    /**
     * @notice Event emitted when a risk parameter config is set
     */
    event RiskParameterConfigSet(
        string updateType,
        address indexed previousRiskSteward,
        address indexed riskSteward,
        uint256 previousDebounce,
        uint256 debounce,
        bool previousActive,
        bool active
    );

    /**
     * @notice Event emitted when a risk parameter config is toggled on or off
     */
    event ToggleConfigActive(string updateType, bool active);

    /**
     * @notice Event emitted when an update is successfully processed
     */
    event RiskParameterUpdateProcessed(uint256 indexed updateId);

    /**
     * @notice Event emitted when an update is proposed with proposal id and update id
     */
    event RiskParameterUpdateProposed(uint256 indexed proposalId, uint256[] indexed updateId);

    /**
     * @notice Event emitted when an update fails validation
     */
    event UpdateValidationFailed(uint256 indexed updateId, UPDATE_STATUS indexed error);

    /**
     * @notice Emitted when applying an update fails to execute
     */
    event UpdateFailed(uint256 indexed updateId);

    /**
     * @notice Thrown if a submitted update is not active and therefor cannot be processed
     */
    error ConfigNotActive(uint256 updateId);

    /**
     * @notice Thrown when an update was not applied within the required time frame
     */
    error UpdateIsExpired(uint256 updateId);

    /**
     * @notice Thrown when an update has already been processed
     */
    error ConfigAlreadyProcessed(uint256 updateId);

    /**
     * @notice Thrown when the debounce period hasn't passed for applying an update to a specific market / update type
     */
    error UpdateTooFrequent(uint256 updateId);

    /**
     * @notice Thrown when an update type that is not supported is operated on
     */
    error UnsupportedUpdateType();

    /**
     * @notice Thrown when a debounce value of 0 is set
     */
    error InvalidDebounce();

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
     * @notice Pauses processing of updates
     * @custom:access Controlled by AccessControlManager
     */
    function pause() external {
        _checkAccessAllowed("pause()");
        _pause();
    }

    /**
     * @notice Unpauses processing of updates
     * @custom:access Controlled by AccessControlManager
     */
    function unpause() external {
        _checkAccessAllowed("unpause()");
        _unpause();
    }

    /**
     * @notice Sets the risk parameter config for a given update type
     * @param updateType The type of update to configure
     * @param riskSteward The address for the risk steward contract responsible for processing the update
     * @param debounce The debounce period for the update
     * @custom:access Controlled by AccessControlManager
     * @custom:event Emits RiskParameterConfigSet with the update type, previous risk steward, new risk steward, previous debounce,
     *new debounce, previous active status, and new active status
     * @custom:error Throws UnsupportedUpdateType if the update type is an empty string
     * @custom:error Throws InvalidDebounce if the debounce is 0
     * @custom:error Throws ZeroAddressNotAllowed if the risk steward address is zero
     */
    function setRiskParameterConfig(string calldata updateType, address riskSteward, uint256 debounce) external {
        _checkAccessAllowed("setRiskParameterConfig(string,address,uint256)");
        if (Strings.equal(updateType, "")) {
            revert UnsupportedUpdateType();
        }
        if (debounce == 0 || debounce <= UPDATE_EXPIRATION_TIME) {
            revert InvalidDebounce();
        }
        ensureNonzeroAddress(riskSteward);
        RiskParamConfig memory previousConfig = riskParameterConfigs[updateType];
        riskParameterConfigs[updateType] = RiskParamConfig({
            active: true,
            riskSteward: IRiskSteward(riskSteward),
            debounce: debounce
        });
        emit RiskParameterConfigSet(
            updateType,
            address(previousConfig.riskSteward),
            riskSteward,
            previousConfig.debounce,
            debounce,
            previousConfig.active,
            true
        );
    }

    /**
     * @notice Toggles the active status of a risk parameter config
     * @param updateType The type of update to toggle on or off
     * @custom:access Controlled by AccessControlManager
     * @custom:event Emits ToggleConfigActive with the update type and the new active status
     * @custom:error Throws InvalidUpdateType if the update type is not supported
     */
    function toggleConfigActive(string calldata updateType) external {
        _checkAccessAllowed("toggleConfigActive(string)");

        if (address(riskParameterConfigs[updateType].riskSteward) == address(0)) {
            revert UnsupportedUpdateType();
        }

        riskParameterConfigs[updateType].active = !riskParameterConfigs[updateType].active;
        emit ToggleConfigActive(updateType, riskParameterConfigs[updateType].active);
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
        bytes memory marketUpdateTypeKey = _getMarketUpdateTypeKey(update.market, update.updateType);
        UPDATE_STATUS error = _validateUpdateStatus(update, marketUpdateTypeKey);
        if (error == UPDATE_STATUS.NONE) {
            _executeOrProposeRemoteProposal(update);
        } else {
            processedUpdates[update.updateId] = error;
            emit UpdateValidationFailed(update.updateId, error);
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
     * @custom:event Emits RiskParameterUpdateProposed with the proposal ID and the update ID
     * @custom:error Throws ConfigNotActive if the config is not active
     * @custom:error Throws UpdateIsExpired if the update is expired
     * @custom:error Throws ConfigAlreadyProcessed if the update has already been processed
     * @custom:error Throws UpdateTooFrequent if the update is too frequent
     */
    function processUpdateByParameterAndMarket(string memory updateType, address market) external whenNotPaused {
        // @TODO test handle proposal
        RiskParameterUpdate memory update = RISK_ORACLE.getLatestUpdateByParameterAndMarket(updateType, market);
        bytes memory marketUpdateTypeKey = _getMarketUpdateTypeKey(market, updateType);
        UPDATE_STATUS error = _validateUpdateStatus(update, marketUpdateTypeKey);
        if (error == UPDATE_STATUS.NONE) {
            _executeOrProposeRemoteProposal(update);
        } else {
            processedUpdates[update.updateId] = error;
            emit UpdateValidationFailed(update.updateId, error);
        }
    }

    /**
     * @notice Processes a list of updates by their IDs. First updates will be validated that they are active, not expired and unprocessed.
     * If the update passes validation, it will be executed if it is for BNB chain or else it will be proposed to governance as a fast track proposal.
     * @param updateIds The IDs of the updates to process
     * @custom:event Emits RiskParameterUpdated with the update ID
     @custom:event Emits RiskParameterUpdateProposed with the proposal ID and the update IDs
     * @custom:event Emits BatchedUpdateValidationFailed with the update ID and the error if validation fails for an update
     * @custom:error Throws ConfigNotActive if the config is not active
     * @custom:error Throws UpdateIsExpired if the update is expired
     * @custom:error Throws ConfigAlreadyProcessed if the update has already been processed
     * @custom:error Throws UpdateTooFrequent if the update is too frequent
     * @custom:error Throws UpdateNotInRange if the update is not in range
     * @custom:error Throws UnsupportedUpdateType if the update type is not supported
     */
    function processUpdatesByIds(uint256[] memory updateIds) external {
        uint256[] memory validatedUpdateIds = _validateUpdateStatuses(updateIds);
        _executeOrProposeRemoteProposals(validatedUpdateIds);
    }

    /**
     * @dev Internal function which calls the risk steward to apply the update. If successful, it records the last processed time for the update and
     *market and marks the update as processed.
     * @custom:event Emits RiskParameterUpdateProcessed with the update ID
     */
    function _processUpdate(RiskParameterUpdate memory update, bytes memory marketUpdateTypeKey) internal {
        IRiskSteward(riskParameterConfigs[update.updateType].riskSteward).processUpdate(update);
        processedUpdates[update.updateId] = UPDATE_STATUS.PROCESSED;
        emit RiskParameterUpdateProcessed(update.updateId);
    }

    /**
     * @notice Executes BNB updates and reduces remote updates into a single remote proposal.
     * @param updateIds The IDs of the updates to execute or propose remote proposals for
     * @custom:event Emits RiskParameterUpdated with the update ID
     * @custom:event Emits RiskParameterUpdateProposed with the proposal ID and the update IDs
     */
    function _executeOrProposeRemoteProposals(uint256[] memory updateIds) internal {
        (
            uint16[] memory destChainIds,
            uint16 destinationChainCount,
            RiskParameterUpdate[] memory updates
        ) = _organizeUpdateAndDestChainIds(updateIds);
        address[][] memory remoteTargets = new address[][](destinationChainCount);
        uint256[][] memory remoteValues = new uint256[][](destinationChainCount);
        string[][] memory remoteSignatures = new string[][](destinationChainCount);
        bytes[][] memory remoteDatas = new bytes[][](destinationChainCount);
        uint256[] memory updateIdsToPropose = new uint256[](destinationChainCount);

        for (uint256 i = 0; i < updates.length; i++) {
            RiskParameterUpdate memory update = updates[i];

            (
                uint16 destChainId,
                address target,
                uint256 value,
                string memory signature,
                bytes memory data
            ) = _executeOrPrepareParams(update);

            if (processedUpdates[update.updateId] != UPDATE_STATUS.PROCESSED) {
                uint256 index = readUint256Cache(INDEX_CACHE_SLOT, destChainId);
                remoteTargets[index][remoteTargets[index].length] = target;
                remoteValues[index][remoteValues[index].length] = 0;
                remoteSignatures[index][remoteSignatures[index].length] = signature;
                remoteDatas[index][remoteDatas[index].length] = data;
                updateIdsToPropose[index] = update.updateId;
            }
        }

        (
            address[] memory remoteProposalTargets,
            uint256[] memory remoteProposalValues,
            string[] memory remoteProposalSignatures,
            bytes[] memory remoteProposalDatas
        ) = _createRemoteProposals(destChainIds, remoteTargets, remoteValues, remoteSignatures, remoteDatas);
        uint256 proposalId = _proposeUpdate(
            remoteProposalTargets,
            remoteProposalValues,
            remoteProposalSignatures,
            remoteProposalDatas
        );
        emit RiskParameterUpdateProposed(proposalId, updateIdsToPropose);
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
            try riskSteward.processUpdate(update) {
                processedUpdates[update.updateId] = UPDATE_STATUS.PROCESSED;
            } catch {
                emit UpdateFailed(update.updateId);
                processedUpdates[update.updateId] = UPDATE_STATUS.FAILED;
            }
        } else {
            (address target_, uint256 value_, string memory signature_, bytes memory payload) = _createUpdateProposal(update);
            return (destChainId_, target_, value_, signature_, payload);
        }
    }

    /**
     * @dev Internal function used to execute or propose a single update.
     * If the update is on BNB it will be processed by the associated risk steward contract.
     * If the update is on a remote chain, it will be proposed to governance as a fast track proposal.
     * @param update The update to execute or propose a remote proposal for
     */
    function _executeOrProposeRemoteProposal(RiskParameterUpdate memory update) internal {
        IRiskSteward riskSteward = IRiskSteward(riskParameterConfigs[update.updateType].riskSteward);
        (address _underlying, uint16 destChainId) = riskSteward.decodeAdditionalData(update.additionalData);
        if (LAYER_ZERO_CHAIN_ID == destChainId) {
            try riskSteward.processUpdate(update) {
                processedUpdates[update.updateId] = UPDATE_STATUS.PROCESSED;
            } catch {
                emit UpdateFailed(update.updateId);
                processedUpdates[update.updateId] = UPDATE_STATUS.FAILED;
            }
        } else {
            _createUpdateRemoteProposal(update, destChainId);
            processedUpdates[update.updateId] = UPDATE_STATUS.PROPOSED;
        }
        emit RiskParameterUpdateProcessed(update.updateId);
    }

    function _createUpdateRemoteProposal(RiskParameterUpdate memory update, uint16 destChainId) internal {
        uint256 proposalId = OMNICHAIN_PROPOSAL_SENDER.proposalCount();
        (address target, uint256 value, string memory signature, bytes memory data) = _createUpdateProposal(update);
        address[] memory targets = new address[](1);
        uint256[] memory values = new uint256[](1);
        string[] memory signatures = new string[](1);
        bytes[] memory datas = new bytes[](1);
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

        _proposeUpdate(remoteProposalTargets, remoteProposalValues, remoteProposalSignatures, remoteProposalDatas);
    }

    /**
     * @notice Creates a remote proposal params for a given update.
     * @param update The update to create a remote proposal for
     * @return target The target of the update
     * @return value Hardcoded as zero since no value is required to process an update
     * @return signature Hardcoded as "processUpdate(string,bytes,bytes,string,address,bytes)" since this is the signature for the processUpdate function
     * @return data The data in bytes of the update
     */
    function _createUpdateProposal(
        RiskParameterUpdate memory update
    ) internal returns (address target, uint256 value, string memory signature, bytes memory data) {
        IRiskSteward riskSteward = riskParameterConfigs[update.updateType].riskSteward;
        (address _underlying, uint16 destChainId) = riskSteward.decodeAdditionalData(update.additionalData);

        address remoteReceiver = destinationChainRiskStewardRemoteReceiver[destChainId];

        bytes memory payload = abi.encode(
            update.referenceId,
            update.previousValue,
            update.newValue,
            update.updateType,
            update.market,
            update.additionalData
        );

        return (remoteReceiver, 0, "processUpdate(string,bytes,bytes,string,address,bytes)", payload);
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
        (address __, address remoteAddress) = abi.decode(
            OMNICHAIN_PROPOSAL_SENDER.trustedRemoteLookup(destChainId),
            (address, address)
        );
        bytes memory payloadWithId = abi.encode(payload, proposalId);
        uint256 fee = _getFee(destChainId, payloadWithId);
        return
            RemoteProposalParams({
                destChainId: destChainId,
                proposalId: proposalId,
                target: remoteAddress,
                value: fee,
                signature: "execute(uint16,bytes,bytes,address)",
                data: payloadWithId
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
            targets: new address[](destChainIds.length - 1),
            values: new uint256[](destChainIds.length - 1),
            signatures: new string[](destChainIds.length - 1),
            datas: new bytes[](destChainIds.length - 1)
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
    function _getFee(uint16 destChainId, bytes memory payloadWithId) internal returns (uint256 estimatedFee) {
        uint256 requiredGas = (500000 + 300000 * 1) * 6;
        bytes memory adapterParams = abi.encodePacked([1, requiredGas]);
        (uint256 fee, uint256 ___) = OMNICHAIN_PROPOSAL_SENDER.estimateFees(
            destChainId,
            payloadWithId,
            false,
            adapterParams
        );
        return fee;
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
        RiskParameterUpdate memory update,
        bytes memory marketUpdateTypeKey
    ) internal view returns (UPDATE_STATUS error) {
        RiskParamConfig memory config = riskParameterConfigs[update.updateType];

        if (!config.active) {
            return UPDATE_STATUS.CONFIG_NOT_ACTIVE;
        }

        if (update.timestamp + UPDATE_EXPIRATION_TIME < block.timestamp) {
            return UPDATE_STATUS.EXPIRED;
        }

        if (
            processedUpdates[update.updateId] == UPDATE_STATUS.PROCESSED ||
            processedUpdates[update.updateId] == UPDATE_STATUS.PROPOSED
        ) {
            return processedUpdates[update.updateId];
        }

        return UPDATE_STATUS.NONE;
    }

    /**
     * @notice Validates the status of a list of updates silently. Will validate that the update configuration is active, is not expired, unprocessed, and that the debounce period has passed.
     * Filters out updates that are not valid and emits an event for each invalid update.
     * @param updateIds The IDs of the updates to validate
     * @return validatedUpdateIds The IDs of the updates that are valid
     */
    function _validateUpdateStatuses(
        uint256[] memory updateIds
    ) internal returns (uint256[] memory validatedUpdateIds) {
        uint256[] memory validatedUpdateIdArray = new uint256[](updateIds.length);
        for (uint256 i = 0; i < updateIds.length; i++) {
            RiskParameterUpdate memory update = RISK_ORACLE.getUpdateById(updateIds[i]);
            bytes memory marketUpdateTypeKey = _getMarketUpdateTypeKey(update.market, update.updateType);
            UPDATE_STATUS error = _validateUpdateStatus(update, marketUpdateTypeKey);
            if (error == UPDATE_STATUS.NONE) {
                validatedUpdateIds[i] = updateIds[i];
            } else {
                emit UpdateValidationFailed(updateIds[i], error);
            }
        }
        return validatedUpdateIdArray;
    }

    function writeUint256Cache(bytes32 slot, uint16 key, uint256 value) internal {
        bytes32 slotKey = keccak256(abi.encode(slot, key));
        assembly ("memory-safe") {
            mstore(slotKey, value)
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
            value := mload(slotKey)
        }
    }

    /**
     * @notice Fetches updates and indexes them by their destination chain ID
     * @param updateIds The IDs of the updates to organize
     * @return destChainIds An array of destination chain IDs indexed by the order they should be reduced
     * @return destinationChainCount
     * @return updates The RiskParameterUpdate array of updates in order of the updateIds array argument
     */
    function _organizeUpdateAndDestChainIds(
        uint256[] memory updateIds
    ) internal returns (uint16[] memory destChainIds, uint16 destinationChainCount, RiskParameterUpdate[] memory updates) {
        updates = new RiskParameterUpdate[](updateIds.length - 1);
        uint16 baseOneIndex = 1;
        for (uint256 i = 0; i < updateIds.length; i++) {
            RiskParameterUpdate memory update = RISK_ORACLE.getUpdateById(updateIds[i]);
            (
                uint16 destChainId,
                address target,
                uint256 value,
                string memory signature,
                bytes memory data
            ) = _executeOrPrepareParams(update);

            uint256 index = readUint256Cache(INDEX_CACHE_SLOT, destChainId);
            uint256 count = readUint256Cache(COUNT_CACHE_SLOT, destChainId);
            if (index == 0) {
                index = baseOneIndex;
                writeUint256Cache(INDEX_CACHE_SLOT, destChainId, index);
                destChainIds[baseOneIndex - 1] = destChainId;
                baseOneIndex++;
            }
        }
        return (destChainIds, baseOneIndex - 1, updates);
    }

    /**
     * @dev Encodes the market and update type into a bytes key to be used with the last processed time mapping
     */
    function _getMarketUpdateTypeKey(address market, string memory updateType) internal pure returns (bytes memory) {
        return abi.encodePacked(market, updateType);
    }

    /**
     * @dev Disabling renounceOwnership function.
     */
    function renounceOwnership() public override {
        revert(" renounceOwnership() is not allowed");
    }
}
