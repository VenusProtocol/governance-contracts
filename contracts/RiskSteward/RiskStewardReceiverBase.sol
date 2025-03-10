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
abstract contract RiskStewardReceiverBase is IRiskStewardReceiver, PausableUpgradeable, AccessControlledV8 {
    /**
     * @notice Time before a submitted update is considered stale
     */
    uint256 public constant UPDATE_EXPIRATION_TIME = 1 days;

    /**
     * @notice Mapping of supported risk configurations and their validation parameters
     */
    mapping(string updateType => RiskParamConfig) public riskParameterConfigs;

    /**
     * @notice Event emitted when a risk parameter config is toggled on or off
     */
    event ToggleConfigActive(string updateType, bool active);

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
     * @notice Event emitted when an update is successfully processed
     */
    event RiskParameterUpdateProcessed(uint256 indexed updateId);

    /**
     * @notice Thrown when an update type that is not supported is operated on
     */
    error UnsupportedUpdateType();

    /**
     * @notice Thrown when a debounce value of 0 is set
     */
    error InvalidDebounce();

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
     * @dev Disabling renounceOwnership function.
     */
    function renounceOwnership() public override {
        revert(" renounceOwnership() is not allowed");
    }
}
