// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.25;

import { IVToken } from "../interfaces/IVToken.sol";
import { ICorePoolComptroller } from "../interfaces/ICorePoolComptroller.sol";
import { IIsolatedPoolsComptroller } from "../interfaces/IIsolatedPoolsComptroller.sol";
import { IRiskStewardReceiver } from "../interfaces/IRiskStewardReceiver.sol";
import { AccessControlledV8 } from "../Governance/AccessControlledV8.sol";
import { IRiskSteward } from "../interfaces/IRiskSteward.sol";
import { ensureNonzeroAddress } from "@venusprotocol/solidity-utilities/contracts/validators.sol";

/**
 * @title CriticalParamsRiskSteward
 * @author Venus
 * @notice Contract that can update reserveFactor and collateralFactor received from RiskStewardReceiver. Requires that the update is within the max delta.
 * Expects the new value to be an encoded uint256 value of un padded bytes.
 * @custom:security-contact https://github.com/VenusProtocol/governance-contracts#discussion
 */
contract CriticalParamsRiskSteward is IRiskSteward, AccessControlledV8 {
    /// @notice Enum representing the kind of Comptroller
    enum ComptrollerType {
        CoreComptroller,
        IsolatedComptroller
    }

    /// @notice Metadata for applying a risk parameter update dynamically
    struct UpdateParameterConfig {
        /// @notice Selector for the setter function
        bytes4 setterSelector;
        /// @notice Selector for the getter function
        bytes4 getterSelector;
        /// @notice True if the update applies to the comptroller; false for vToken
        bool isComptroller;
    }

    /// @dev Max basis points i.e., 100%
    uint256 private constant MAX_BPS = 10000;

    /**
     * @notice Address of the CorePoolComptroller used for selecting the correct comptroller abi
     */
    ICorePoolComptroller public immutable CORE_POOL_COMPTROLLER;

    /**
     * @notice Address of the RiskStewardReceiver used to validate incoming updates
     */
    IRiskStewardReceiver public immutable RISK_STEWARD_RECEIVER;

    /**
     * @notice The max delta bps for the update relative to the current value
     */
    uint256 public maxDeltaBps;

    /**
     * @notice Source chain id
     */
    uint16 public immutable LAYER_ZERO_CHAIN_ID;

    /**
     * @notice The debounce period for updates in seconds
     */
    uint256 public debouncePeriod;

    /**
     * @notice Maps a updateType to its config
     */
    mapping(string updateType => mapping(ComptrollerType => UpdateParameterConfig)) public updateParameterConfigs;

    /**
     * @notice Mapping of market and update type to last update timestamp. Used for debouncing updates.
     */
    mapping(bytes marketUpdateType => uint256) public lastProcessedTime;

    /**
     * @notice Mapping of processed updates. Used to prevent re-execution
     */
    mapping(uint256 updateId => bool) public processedUpdates;

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[47] private __gap;

    /**
     * @notice Emitted when an update type is registered
     * @param updateType The string name of the update type (e.g., "reserveFactor")
     * @param setterSelector The function selector used to set the new value
     * @param getterSelector The function selector used to get the current value
     * @param isComptroller Whether the target of the update is a comptroller contract
     */
    event UpdateTypeRegistered(
        string updateType,
        ComptrollerType comptrollerType,
        bytes4 setterSelector,
        bytes4 getterSelector,
        bool isComptroller
    );

    /**
     * @notice Emitted when a parameter is updated dynamically
     * @param updateType The string identifier for the update (e.g., "reserveFactor")
     * @param market The market address associated with the update (0x0 if not applicable)
     * @param newValue The new value applied
     */
    event ParameterUpdated(string updateType, address indexed market, uint256 indexed newValue);

    /**
     * @notice Emitted when the max delta bps is updated
     */
    event MaxDeltaBpsUpdated(uint256 oldMaxDeltaBps, uint256 indexed newMaxDeltaBps);

    /**
     * @notice Emitted when the debounce period is updated
     */
    event DebouncePeriodUpdated(uint256 oldDebouncePeriod, uint256 newDebouncePeriod);

    /**
     * @notice Thrown when a maxDeltaBps value of 0 is set
     */
    error InvalidMaxDeltaBps();

    /**
     * @notice Thrown when a debounce period of 0 is set
     */
    error InvalidDebouncePeriod();

    /**
     * @notice Thrown when an updateType that is not supported is operated on
     */
    error UnsupportedUpdateType(uint256 updateId);

    /**
     * @notice Thrown when the new value of an update is out of range
     */
    error UpdateNotInRange(uint256 updateId);

    /**
     * @notice Thrown when the update is not coming from the RiskStewardReceiver
     */
    error OnlyRiskStewardReceiver();

    /**
     * @notice Thrown when the debounce period hasn't passed for applying an update to a specific market/ update type
     */
    error UpdateTooFrequent();

    modifier onlyRiskStewardReceiver() {
        if (msg.sender != address(RISK_STEWARD_RECEIVER)) {
            revert OnlyRiskStewardReceiver();
        }
        _;
    }

    /**
     * @dev Sets the immutable CorePoolComptroller and RiskStewardReceiver addresses and disables initializers
     * @param riskStewardReceiver_ The address of the RiskStewardReceiver
     * @custom:error Throws ZeroAddressNotAllowed if the CorePoolComptroller or RiskStewardReceiver addresses are zero
     * @custom:oz-upgrades-unsafe-allow constructor
     */
    constructor(address riskStewardReceiver_, address corePoolComptroller_, uint16 layerZeroChainId) {
        ensureNonzeroAddress(riskStewardReceiver_);
        ensureNonzeroAddress(corePoolComptroller_);
        RISK_STEWARD_RECEIVER = IRiskStewardReceiver(riskStewardReceiver_);
        CORE_POOL_COMPTROLLER = ICorePoolComptroller(corePoolComptroller_);
        LAYER_ZERO_CHAIN_ID = layerZeroChainId;
        _disableInitializers();
    }

    /**
     * @dev Initializes the contract as ownable, access controlled, and pausable. Sets the max delta bps initial value.
     * @param accessControlManager_ The address of the access control manager
     * @param maxDeltaBps_ The max detla bps
     * @custom:error Throws InvalidMaxDeltaBps if the max delta bps is 0 or greater than MAX_BPS
     */
    function initialize(
        address accessControlManager_,
        uint256 maxDeltaBps_,
        uint256 debouncePeriod_
    ) external initializer {
        __AccessControlled_init(accessControlManager_);
        if (maxDeltaBps_ == 0 || maxDeltaBps_ > MAX_BPS) {
            revert InvalidMaxDeltaBps();
        }
        maxDeltaBps = maxDeltaBps_;

        if (debouncePeriod_ == 0 || debouncePeriod_ <= RISK_STEWARD_RECEIVER.UPDATE_EXPIRATION_TIME()) {
            revert InvalidDebouncePeriod();
        }
        debouncePeriod = debouncePeriod_;
    }

    /**
     * @notice Sets the max delta bps
     * @param maxDeltaBps_ The new max delta bps
     * @custom:event Emits MaxDeltaBpsUpdated with the old and new max delta bps
     * @custom:error InvalidMaxDeltaBps if the max delta bps is 0 or greater than MAX_BPS
     * @custom:access Controlled by AccessControlManager
     */
    function setMaxDeltaBps(uint256 maxDeltaBps_) external {
        _checkAccessAllowed("setMaxDeltaBps(uint256)");
        if (maxDeltaBps_ == 0 || maxDeltaBps_ > MAX_BPS) {
            revert InvalidMaxDeltaBps();
        }
        emit MaxDeltaBpsUpdated(maxDeltaBps, maxDeltaBps_);
        maxDeltaBps = maxDeltaBps_;
    }

    /**
     * @notice Sets the debounce period
     * @param debouncePeriod_ The new debounce period
     * @custom:event Emits DebouncePeriodUpdated with the old and new debounce period
     * @custom:error InvalidDebouncePeriod if the debounce period is 0 or less than the RiskStewardReceiver's UPDATE_EXPIRATION_TIME
     * @custom:access Controlled by AccessControlManager
     */
    function setDebouncePeriod(uint256 debouncePeriod_) external {
        _checkAccessAllowed("setDebouncePeriod(uint256)");
        if (debouncePeriod_ == 0 || debouncePeriod_ <= RISK_STEWARD_RECEIVER.UPDATE_EXPIRATION_TIME()) {
            revert InvalidDebouncePeriod();
        }
        emit DebouncePeriodUpdated(debouncePeriod, debouncePeriod_);
        debouncePeriod = debouncePeriod_;
    }

    function registerUpdateType(
        string calldata updateType,
        ComptrollerType comptrollerType,
        bytes4 setterSelector,
        bytes4 getterSelector,
        bool isComptroller
    ) external {
        _checkAccessAllowed("registerUpdateType(string,bytes4,bytes4,bool)");

        updateParameterConfigs[updateType][comptrollerType] = UpdateParameterConfig({
            setterSelector: setterSelector,
            getterSelector: getterSelector,
            isComptroller: isComptroller
        });

        emit UpdateTypeRegistered(updateType, comptrollerType, setterSelector, getterSelector, isComptroller);
    }

    /// @notice Processes a dynamic risk parameter update
    /// @param updateId ID of the update (used in validation)
    /// @param newValue Encoded new value (e.g., abi.encodePacked(uint256))
    /// @param updateType Name of the update type (e.g., "reserveFactor")
    /// @param market Address of the vToken market being updated
    function processUpdate(
        uint256 updateId,
        bytes memory newValue,
        string memory updateType,
        address market
    ) external onlyRiskStewardReceiver {
        address comptroller = IVToken(market).comptroller();
        UpdateParameterConfig memory config;

        if (comptroller == address(CORE_POOL_COMPTROLLER)) {
            config = updateParameterConfigs[updateType][ComptrollerType.CoreComptroller];
        } else {
            config = updateParameterConfigs[updateType][ComptrollerType.IsolatedComptroller];
        }

        require(config.setterSelector != bytes4(0), "Unknown update type");

        address target = config.isComptroller ? comptroller : market;
        uint256 decodedValue = _decodeBytesToUint256(newValue);

        // Read current value and validate
        if (config.getterSelector != bytes4(0)) {
            (bool ok, bytes memory result) = target.staticcall(abi.encodeWithSelector(config.getterSelector));
            require(ok, "Failed to read current value");

            uint256 currentValue = abi.decode(result, (uint256));
            _verifyUpdate(market, updateId, updateType, currentValue, decodedValue);
        }

        // Apply update
        bytes memory callData;

        if (config.isComptroller) {
            // For comptroller calls, we assume function takes (address market, uint256 newValue)
            callData = abi.encodeWithSelector(config.setterSelector, market, decodedValue);
        } else {
            // For vToken calls, we assume function takes (uint256 newValue)
            callData = abi.encodeWithSelector(config.setterSelector, decodedValue);
        }

        (bool success, ) = target.call(callData);
        require(success, "Setter call failed");

        lastProcessedTime[_getMarketUpdateTypeKey(market, updateType)] = block.timestamp;

        emit ParameterUpdated(updateType, market, decodedValue);
    }

    /**
     * @notice Decodes the additional data from the ReserveFactor and CollateralFactor RiskParameterUpdates
     * @param additionalData The additional data to decode
     * @return underlying The underlying asset address
     * @return destChainId The destination chain ID
     */
    function decodeAdditionalData(bytes calldata additionalData) external pure returns (address, uint32) {
        (address underlying, uint32 destChainId) = abi.decode(additionalData, (address, uint32));
        return (underlying, destChainId);
    }

    /**
     * @notice Packs the new value into a bytes memory
     * @param data The un-padded bytes to decode
     * @return bytes memory The packed bytes
     */
    function packNewValue(bytes memory data) public pure returns (bytes memory) {
        return abi.encodePacked(new bytes(32 - data.length), data);
    }

    /**
     * @notice Verifies that the update is not too frequent and within the allowed range
     * @param market The market whose update is being verified
     * @param updateId The ID of the update
     * @param updateType The type of update being verified
     * @param previousValue The previous value of the update
     * @param newValue The new value of the update
     * @custom:error UpdateTooFrequent if the update is too frequent
     * @custom:error UpdateNotInRange if the update is not within the allowed range
     */
    function _verifyUpdate(
        address market,
        uint256 updateId,
        string memory updateType,
        uint256 previousValue,
        uint256 newValue
    ) internal view {
        if (block.timestamp - lastProcessedTime[_getMarketUpdateTypeKey(market, updateType)] < debouncePeriod) {
            revert UpdateTooFrequent();
        }
        _updateWithinAllowedRange(updateId, previousValue, newValue);
    }

    /**
     * @notice Ensures the risk param update is within the allowed range.
     * If the previous value is 0, this means the market is not yet supported or disabled and setting a new value is not allowed.
     * @param previousValue current risk param value
     * @param newValue new updated risk param value
     * @custom:error UpdateNotInRange if the update is not within the allowed range
     */
    function _updateWithinAllowedRange(uint256 updateId, uint256 previousValue, uint256 newValue) internal view {
        uint256 diff = newValue > previousValue ? newValue - previousValue : previousValue - newValue;

        uint256 maxDiff = (maxDeltaBps * previousValue) / MAX_BPS;

        if (diff > maxDiff) {
            revert UpdateNotInRange(updateId);
        }
    }

    /**
     * @notice Decodes un-padded bytes to a uint256
     * @param data The un-padded bytes to decode
     * @return uint256 The decoded uint256
     */
    function _decodeBytesToUint256(bytes memory data) internal pure returns (uint256) {
        return abi.decode(packNewValue(data), (uint256));
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
    function renounceOwnership() public pure override {
        revert("renounceOwnership() is not allowed");
    }
}
