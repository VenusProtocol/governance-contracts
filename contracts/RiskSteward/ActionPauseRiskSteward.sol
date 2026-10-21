// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.25;

import { RiskParameterUpdate } from "./Interfaces/IRiskOracle.sol";
import { ICorePoolVToken } from "../interfaces/ICorePoolVToken.sol";
import { ICorePoolComptroller } from "../interfaces/ICorePoolComptroller.sol";
import { IRiskStewardReceiver } from "./Interfaces/IRiskStewardReceiver.sol";
import { BaseRiskSteward } from "./BaseRiskSteward.sol";
import { ensureNonzeroAddress } from "@venusprotocol/solidity-utilities/contracts/validators.sol";

/**
 * @title ActionPauseRiskSteward
 * @author Venus
 * @notice Pauses and unpauses market actions on updates from its receiver. On the source chain a pause applies at
 *         once and an unpause waits for the receiver's timelock; a destination chain delays every update.
 * @custom:security-contact https://github.com/VenusProtocol/governance-contracts#discussion
 */
contract ActionPauseRiskSteward is BaseRiskSteward {
    /**
     * @notice The update type for pausing actions
     */
    string public constant PAUSE_ACTIONS = "pauseActions";

    /**
     * @notice The update type key for pausing actions (keccak256 hash of PAUSE_ACTIONS)
     */
    bytes32 public constant PAUSE_ACTIONS_KEY = keccak256(bytes(PAUSE_ACTIONS));

    /**
     * @notice The update type for unpausing actions
     */
    string public constant UNPAUSE_ACTIONS = "unpauseActions";

    /**
     * @notice The update type key for unpausing actions (keccak256 hash of UNPAUSE_ACTIONS)
     */
    bytes32 public constant UNPAUSE_ACTIONS_KEY = keccak256(bytes(UNPAUSE_ACTIONS));

    /**
     * @notice The highest action ID, `EXIT_MARKET` in the comptrollers' `Action` enum
     */
    uint8 public constant MAX_ACTION = 8;

    /**
     * @notice The receiver, the only caller allowed to apply updates
     */
    IRiskStewardReceiver public immutable RISK_STEWARD_RECEIVER;

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[49] private __gap;

    /**
     * @notice Emitted when actions are paused or unpaused on a market
     */
    event ActionsPausedUpdated(uint256 indexed updateId, address indexed market, uint8[] actions, bool paused);

    /**
     * @notice Thrown when the update type is neither PAUSE_ACTIONS nor UNPAUSE_ACTIONS
     */
    error UnsupportedUpdateType();

    /**
     * @notice Thrown when `applyUpdate` is not called by the receiver
     */
    error OnlyRiskStewardReceiver();

    /**
     * @notice Thrown when every listed action is already in the requested state
     */
    error RedundantValue();

    /**
     * @notice Thrown when the update has a pool ID; an update applies to the whole market
     */
    error InvalidPool();

    /**
     * @notice Thrown when an update lists no actions
     */
    error EmptyActions();

    /**
     * @notice Thrown when an action ID is above `MAX_ACTION` or listed twice
     */
    error InvalidAction(uint8 action);

    /**
     * @notice Sets the receiver and disables initializers
     * @param riskStewardReceiver_ The receiver: RiskStewardReceiver, or DestinationStewardReceiver on remote chains
     * @custom:error Throws ZeroAddressNotAllowed if the receiver address is zero
     * @custom:oz-upgrades-unsafe-allow constructor
     */
    constructor(address riskStewardReceiver_) {
        ensureNonzeroAddress(riskStewardReceiver_);
        RISK_STEWARD_RECEIVER = IRiskStewardReceiver(riskStewardReceiver_);
        _disableInitializers();
    }

    /**
     * @notice Initializes the contract as ownable and access controlled
     * @param accessControlManager_ The address of the access control manager
     */
    function initialize(address accessControlManager_) external initializer {
        __AccessControlled_init(accessControlManager_);
    }

    /**
     * @notice Checks if an update is safe for direct execution (no timelock required)
     * @dev A pause is always safe; an unpause always needs the timelock
     * @param update The update to check
     * @return True if update is safe for direct execution, false if timelock is required
     * @custom:error Throws UnsupportedUpdateType if the update type is not supported
     * @custom:error Throws InvalidPool if the update has a pool ID
     * @custom:error Throws EmptyActions if the update lists no actions
     * @custom:error Throws InvalidAction if an action ID is above MAX_ACTION or listed twice
     * @custom:error Throws RedundantValue if every listed action is already in the requested state
     */
    function isSafeForDirectExecution(RiskParameterUpdate calldata update) external view returns (bool) {
        bool isPause = _isPauseKey(update.updateTypeKey);
        uint8[] memory actions = _decodeActions(update);
        ICorePoolComptroller comptroller = ICorePoolComptroller(ICorePoolVToken(update.market).comptroller());

        bool changesState;
        uint256 count = actions.length;
        for (uint256 i; i < count; ++i) {
            if (comptroller.actionPaused(update.market, actions[i]) != isPause) {
                changesState = true;
                break;
            }
        }
        if (!changesState) {
            revert RedundantValue();
        }

        return isPause;
    }

    /**
     * @notice Pauses or unpauses the update's actions on its market
     * @param update The update to apply
     * @custom:access Only the receiver
     * @custom:event Emits ActionsPausedUpdated with the updateId, market, actions and paused state
     * @custom:error Throws OnlyRiskStewardReceiver if the caller is not the receiver
     * @custom:error Throws UnsupportedUpdateType if the update type is not supported
     * @custom:error Throws InvalidPool if the update has a pool ID
     * @custom:error Throws EmptyActions if the update lists no actions
     * @custom:error Throws InvalidAction if an action ID is above MAX_ACTION or listed twice
     */
    function applyUpdate(RiskParameterUpdate calldata update) external {
        if (msg.sender != address(RISK_STEWARD_RECEIVER)) {
            revert OnlyRiskStewardReceiver();
        }
        bool isPause = _isPauseKey(update.updateTypeKey);
        uint8[] memory actions = _decodeActions(update);

        address[] memory markets = new address[](1);
        markets[0] = update.market;
        // Core, isolated and spoke pools share the same `setActionsPaused` signature.
        ICorePoolComptroller(ICorePoolVToken(update.market).comptroller()).setActionsPaused(markets, actions, isPause);
        emit ActionsPausedUpdated(update.updateId, update.market, actions, isPause);
    }

    /**
     * @notice Returns whether the update type is a pause or an unpause
     * @param updateTypeKey The update type key
     * @return True for a pause, false for an unpause
     * @custom:error Throws UnsupportedUpdateType if the update type is not supported
     */
    function _isPauseKey(bytes32 updateTypeKey) internal pure returns (bool) {
        if (updateTypeKey == PAUSE_ACTIONS_KEY) return true;
        if (updateTypeKey == UNPAUSE_ACTIONS_KEY) return false;
        revert UnsupportedUpdateType();
    }

    /**
     * @notice Checks the update has no pool ID, then decodes and checks its actions
     * @param update The update, whose `newValue` is `abi.encode(uint8[] actions)`
     * @return actions The action IDs
     * @custom:error Throws InvalidPool if the update has a pool ID
     * @custom:error Throws EmptyActions if the update lists no actions
     * @custom:error Throws InvalidAction if an action ID is above MAX_ACTION or listed twice
     */
    function _decodeActions(RiskParameterUpdate calldata update) internal pure returns (uint8[] memory actions) {
        if (update.poolId != 0) {
            revert InvalidPool();
        }
        actions = abi.decode(update.newValue, (uint8[]));
        uint256 count = actions.length;
        if (count == 0) {
            revert EmptyActions();
        }

        bool[] memory seen = new bool[](MAX_ACTION + 1);
        for (uint256 i; i < count; ++i) {
            uint8 action = actions[i];
            if (action > MAX_ACTION || seen[action]) {
                revert InvalidAction(action);
            }
            seen[action] = true;
        }
    }
}
