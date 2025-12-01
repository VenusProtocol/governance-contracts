// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.25;

import { RiskParameterUpdate } from "./Interfaces/IRiskOracle.sol";
import { IVToken } from "../interfaces/IVToken.sol";
import { IVToken as IILVToken } from "../interfaces/IILVToken.sol";
import { InterestRateModel } from "@venusprotocol/isolated-pools/contracts/InterestRateModel.sol";
import { InterestRateModelV8 } from "@venusprotocol/venus-protocol/contracts/InterestRateModels/InterestRateModelV8.sol";
import { ICorePoolComptroller } from "../interfaces/ICorePoolComptroller.sol";
import { IRiskStewardReceiver } from "./Interfaces/IRiskStewardReceiver.sol";
import { AccessControlledV8 } from "../Governance/AccessControlledV8.sol";
import { IRiskSteward } from "./Interfaces/IRiskSteward.sol";
import { ensureNonzeroAddress } from "@venusprotocol/solidity-utilities/contracts/validators.sol";

/**
 * @title IRMRiskSteward
 * @author Venus
 * @notice Contract that can update interest rate models received from RiskStewardReceiver.
 * @custom:security-contact https://github.com/VenusProtocol/governance-contracts#discussion
 */
contract IRMRiskSteward is IRiskSteward, AccessControlledV8 {
    /// @dev Max basis points i.e., 100%
    uint256 private constant MAX_BPS = 10000;

    /**
     * @notice The update type for interest rate model
     */
    string public constant INTEREST_RATE_MODEL = "interestRateModel";

    /**
     * @notice The update type key for interest rate model (keccak256 hash of INTEREST_RATE_MODEL)
     */
    bytes32 public constant INTEREST_RATE_MODEL_KEY = keccak256(bytes(INTEREST_RATE_MODEL));

    /**
     * @notice Address of the Core Pool Comptroller used to distinguish between core and isolated pools.
     */
    ICorePoolComptroller public immutable CORE_POOL_COMPTROLLER;

    /**
     * @notice Address of the RiskStewardReceiver used to validate incoming updates
     */
    IRiskStewardReceiver public immutable RISK_STEWARD_RECEIVER;

    /**
     * @notice The safe delta threshold in basis points. Updates within this delta are considered safe and require no timelock.
     * Updates exceeding this delta require timelock.
     */
    uint256 public safeDeltaBps;

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[49] private __gap;

    /**
     * @notice Emitted when an interest rate model is updated
     */
    event InterestRateModelUpdated(address indexed market, address indexed newInterestRateModel);

    /**
     * @notice Emitted when the safe delta bps is updated
     */
    event SafeDeltaBpsUpdated(uint256 indexed oldSafeDeltaBps, uint256 indexed newSafeDeltaBps);

    /**
     * @notice Thrown when a safeDeltaBps value is greater than MAX_BPS
     */
    error InvalidSafeDeltaBps();

    /**
     * @notice Thrown when an update type that is not supported is operated on
     */
    error UnsupportedUpdateType();

    /**
     * @notice Thrown when the update is not coming from the RiskStewardReceiver
     */
    error OnlyRiskStewardReceiver();

    /**
     * @notice Thrown when trying to renounce ownership
     */
    error RenounceOwnershipNotAllowed();

    /**
     * @notice Thrown when the address length is invalid
     */
    error InvalidAddressLength();

    /**
     * @notice Sets the immutable CORE_POOL_COMPTROLLER and RISK_STEWARD_RECEIVER addresses and disables initializers
     * @param corePoolComptroller_ The address of the Core Pool Comptroller
     * @param riskStewardReceiver_ The address of the RiskStewardReceiver
     * @custom:error Throws ZeroAddressNotAllowed if any of the addresses are zero
     * @custom:oz-upgrades-unsafe-allow constructor
     */
    constructor(address corePoolComptroller_, address riskStewardReceiver_) {
        ensureNonzeroAddress(corePoolComptroller_);
        ensureNonzeroAddress(riskStewardReceiver_);
        CORE_POOL_COMPTROLLER = ICorePoolComptroller(corePoolComptroller_);
        RISK_STEWARD_RECEIVER = IRiskStewardReceiver(riskStewardReceiver_);
        _disableInitializers();
    }

    /**
     * @notice Initializes the contract as ownable and access controlled.
     * @param accessControlManager_ The address of the access control manager
     */
    function initialize(address accessControlManager_) external initializer {
        __AccessControlled_init(accessControlManager_);
    }

    /**
     * @notice Sets the safe delta bps
     * @param safeDeltaBps_ The new safe delta bps
     * @custom:event Emits SafeDeltaBpsUpdated with the old and new safe delta bps
     * @custom:error Throws InvalidSafeDeltaBps if the safe delta bps is greater than MAX_BPS
     * @custom:access Controlled by AccessControlManager
     */
    function setSafeDeltaBps(uint256 safeDeltaBps_) external {
        _checkAccessAllowed("setSafeDeltaBps(uint256)");
        if (safeDeltaBps_ > MAX_BPS) {
            revert InvalidSafeDeltaBps();
        }
        emit SafeDeltaBpsUpdated(safeDeltaBps, safeDeltaBps_);
        safeDeltaBps = safeDeltaBps_;
    }

    /**
     * @notice Processes an interest rate model update from the RiskStewardReceiver.
     * Directly updates the market interest rate model on the vToken.
     * Delta validation is already performed by RiskStewardReceiver before execution.
     * @param update RiskParameterUpdate update to process
     * @custom:error Throws OnlyRiskStewardReceiver if the sender is not the RiskStewardReceiver
     * @custom:error Throws UnsupportedUpdateType if the update type is not supported
     * @custom:event Emits InterestRateModelUpdated with the market and new IRM address
     * @custom:access Only callable by the RiskStewardReceiver
     */
    function processUpdate(RiskParameterUpdate calldata update) external {
        if (msg.sender != address(RISK_STEWARD_RECEIVER)) {
            revert OnlyRiskStewardReceiver();
        }

        if (update.updateTypeKey == INTEREST_RATE_MODEL_KEY) {
            address newIRM = _decodeAbiEncodedAddress(update.newValue);
            _updateIRM(update.market, newIRM);
        } else {
            revert UnsupportedUpdateType();
        }
    }

    /**
     * @notice Checks if an update is safe for direct execution (no timelock required)
     * @param update The update to check
     * @return True if update is safe for direct execution, false if timelock is required
     * @custom:error Throws UnsupportedUpdateType if the update type is not supported
     * @dev For IRM updates, always returns false as we cannot compare IRM values
     */
    function isSafeForDirectExecution(RiskParameterUpdate calldata update) external pure returns (bool) {
        if (update.updateTypeKey != INTEREST_RATE_MODEL_KEY) {
            revert UnsupportedUpdateType();
        }

        // always require timelock (not safe for direct execution)
        return false;
    }

    /**
     * @notice Updates the interest rate model for the given market.
     * @param market The market to update the interest rate model for
     * @param newIRM The new interest rate model address
     * @custom:event Emits InterestRateModelUpdated with the market and new IRM address
     */
    function _updateIRM(address market, address newIRM) internal {
        address comptroller = IVToken(market).comptroller();

        if (comptroller == address(CORE_POOL_COMPTROLLER)) {
            IVToken(market)._setInterestRateModel(InterestRateModelV8(newIRM));
        } else {
            IILVToken(market).setInterestRateModel(InterestRateModel(newIRM));
        }

        emit InterestRateModelUpdated(market, newIRM);
    }

    /**
     * @notice Decodes ABI-encoded bytes into an address.
     * @dev Expects exactly 32 bytes as produced by abi.encode(address).
     * @param data ABI-encoded address payload (32 bytes)
     * @return The decoded address
     * @custom:error Throws InvalidAddressLength if data length is not 32 bytes
     */
    function _decodeAbiEncodedAddress(bytes memory data) internal pure returns (address) {
        if (data.length != 32) revert InvalidAddressLength();
        return abi.decode(data, (address));
    }

    /**
     * @notice Disables renounceOwnership function
     * @custom:error Throws RenounceOwnershipNotAllowed
     */
    function renounceOwnership() public pure override {
        revert RenounceOwnershipNotAllowed();
    }
}
