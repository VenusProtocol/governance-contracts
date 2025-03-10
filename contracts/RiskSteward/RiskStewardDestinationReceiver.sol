// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.25;

import { Strings } from "@openzeppelin/contracts/utils/Strings.sol";
import { IRiskSteward } from "./IRiskSteward.sol";
import { IRiskOracle, RiskParameterUpdate } from "../interfaces/IRiskOracle.sol";
import { IRiskStewardDestinationReceiver, RiskParamConfig } from "./IRiskStewardReceiver.sol";
import { PausableUpgradeable } from "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import { AccessControlledV8 } from "../Governance/AccessControlledV8.sol";
import { ensureNonzeroAddress } from "@venusprotocol/solidity-utilities/contracts/validators.sol";
import { IGovernorBravoDelegate, GovernorBravoDelegateStorageV2 } from "../Governance/GovernorBravoInterfacesV8.sol";
import { IOmnichainProposalSender } from "../Cross-chain/interfaces/IOmnichainProposalSender.sol";
import { RiskStewardReceiverBase } from "./RiskStewardReceiverBase.sol";

/**
 * @title RiskStewardReceiverDestination
 * @author Venus
 * @notice Contract that can read received updates from the RiskStewardReceiver and process them.
 * @custom:security-contact https://github.com/VenusProtocol/governance-contracts#discussion
 */
contract RiskStewardDestinationReceiver is IRiskStewardDestinationReceiver, RiskStewardReceiverBase {
    /**
     * @notice Time before a submitted update is considered stale
     */
    uint256 public constant REMOTE_UPDATE_EXPIRATION_TIME = 2 days;

    /**
     * @notice Mapping of processed updates. Used to prevent re-execution
     */
    mapping(uint256 updateId => UPDATE_STATUS) public processedUpdates;
    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[49] private __gap;

    enum UPDATE_STATUS {
        NONE,
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

    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initializes the contract as ownable, pausable, and access controlled
     * @param accessControlManager_ The address of the access control manager
     */
    function initialize(address accessControlManager_) external virtual initializer {
        __Pausable_init();
        __AccessControlled_init(accessControlManager_);
    }

    function processUpdate(
        uint256 updateId,
        bytes calldata newValue,
        string calldata updateType,
        address market,
        bytes calldata additionalData,
        uint256 timestamp
    ) external {
        _checkAccessAllowed("processUpdate(bytes,string,address,bytes)");
        UPDATE_STATUS error = _validateUpdateStatus(newValue, updateType, market, additionalData, timestamp);
        if (error == UPDATE_STATUS.NONE) {
            _executeUpdate(updateId, newValue, updateType, market, additionalData);
        } else {
            processedUpdates[updateId] = error;
            emit RiskParameterUpdateFailed(updateId, error);
        }
    }

    /**
     * @notice Validates the status of an update silently. Will validate that the update configuration is active, is not expired, unprocessed, and that the debounce period has passed.
     * @return error The UPDATE_STATUS error code if the update is not valid or 0
     */
    function _validateUpdateStatus(
        bytes calldata newValue,
        string calldata updateType,
        address market,
        bytes calldata additionalData,
        uint256 timestamp
    ) internal view returns (UPDATE_STATUS error) {
        RiskParamConfig memory config = riskParameterConfigs[updateType];

        if (!config.active) {
            return UPDATE_STATUS.CONFIG_NOT_ACTIVE;
        }

        if (timestamp + REMOTE_UPDATE_EXPIRATION_TIME < block.timestamp) {
            return UPDATE_STATUS.EXPIRED;
        }

        return UPDATE_STATUS.NONE;
    }

    function _executeUpdate(
        uint256 updateId,
        bytes calldata newValue,
        string calldata updateType,
        address market,
        bytes calldata additionalData
    ) internal {
        IRiskSteward riskSteward = IRiskSteward(riskParameterConfigs[updateType].riskSteward);
        riskSteward.processUpdate(updateId, newValue, updateType, market, additionalData);
        processedUpdates[updateId] = UPDATE_STATUS.PROCESSED;
    }
}
