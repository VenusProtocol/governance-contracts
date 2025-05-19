// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.25;

import { Strings } from "@openzeppelin/contracts/utils/Strings.sol";
import { IRiskSteward } from "../interfaces/IRiskSteward.sol";
import { IRiskStewardReceiver, RiskParamConfig } from "../interfaces/IRiskStewardReceiver.sol";
import { Pausable } from "@openzeppelin/contracts/security/Pausable.sol";
import { ensureNonzeroAddress } from "@venusprotocol/solidity-utilities/contracts/validators.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title RiskStewardReceiver
 * @author Venus
 * @notice Contract that can read updates from the Chaos Labs Risk Oracle, validate them, and push them to the correct RiskSteward.
 * @custom:security-contact https://github.com/VenusProtocol/governance-contracts#discussion
 */
abstract contract RiskStewardReceiverBase is IRiskStewardReceiver, Pausable, Ownable {
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
     * @custom:access Only owner
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpauses processing of updates
     * @custom:access Only owner
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Sets the risk parameter config for a given update type
     * @param updateType The type of update to configure
     * @param riskSteward The address for the risk steward contract responsible for processing the update
     * @custom:access Only owner
     * @custom:event Emits RiskParameterConfigSet with the update type, previous risk steward, new risk steward,
     * previous active status, and new active status
     * @custom:error Throws UnsupportedUpdateType if the update type is an empty string
     * @custom:error Throws InvalidDebounce if the debounce is 0
     * @custom:error Throws ZeroAddressNotAllowed if the risk steward address is zero
     */
    function setRiskParameterConfig(string calldata updateType, address riskSteward) external onlyOwner {
        if (Strings.equal(updateType, "")) {
            revert UnsupportedUpdateType();
        }

        ensureNonzeroAddress(riskSteward);
        RiskParamConfig memory previousConfig = riskParameterConfigs[updateType];
        riskParameterConfigs[updateType] = RiskParamConfig({ active: true, riskSteward: IRiskSteward(riskSteward) });
        emit RiskParameterConfigSet(
            updateType,
            address(previousConfig.riskSteward),
            riskSteward,
            previousConfig.active,
            true
        );
    }

    /**
     * @notice Toggles the active status of a risk parameter config
     * @param updateType The type of update to toggle on or off
     * @custom:access Only owner
     * @custom:event Emits ToggleConfigActive with the update type and the new active status
     * @custom:error Throws InvalidUpdateType if the update type is not supported
     */
    function toggleConfigActive(string calldata updateType) external onlyOwner {
        if (address(riskParameterConfigs[updateType].riskSteward) == address(0)) {
            revert UnsupportedUpdateType();
        }

        riskParameterConfigs[updateType].active = !riskParameterConfigs[updateType].active;
        emit ToggleConfigActive(updateType, riskParameterConfigs[updateType].active);
    }
}
