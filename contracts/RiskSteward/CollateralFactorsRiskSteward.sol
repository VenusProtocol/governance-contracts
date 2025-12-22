// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.25;

import { RiskParameterUpdate } from "./Interfaces/IRiskOracle.sol";
import { ICorePoolVToken } from "../interfaces/ICorePoolVToken.sol";
import { ICorePoolComptroller } from "../interfaces/ICorePoolComptroller.sol";
import { IIsolatedPoolsComptroller } from "../interfaces/IIsolatedPoolsComptroller.sol";
import { IRiskStewardReceiver } from "./Interfaces/IRiskStewardReceiver.sol";
import { BaseRiskSteward } from "./BaseRiskSteward.sol";
import { ensureNonzeroAddress } from "@venusprotocol/solidity-utilities/contracts/validators.sol";

/**
 * @title CollateralFactorsRiskSteward
 * @author Venus
 * @notice Contract that can update collateral factors and liquidation thresholds received from `RiskStewardReceiver`.
 * @custom:security-contact https://github.com/VenusProtocol/governance-contracts#discussion
 */
contract CollateralFactorsRiskSteward is BaseRiskSteward {
    /**
     * @notice The update type for collateral factor and liquidation threshold.
     */
    string public constant COLLATERAL_FACTORS = "collateralFactors";

    /**
     * @notice The update type key for collateral factors (keccak256 hash of COLLATERAL_FACTORS)
     */
    bytes32 public constant COLLATERAL_FACTORS_KEY = keccak256(bytes(COLLATERAL_FACTORS));

    /**
     * @notice Address of the BNB Core Pool Comptroller.
     * @dev This comptroller is specific to the BNB Core Pool, which uses a different ABI
     *      than isolated pools. It is used solely to detect and handle BNB Core Pool
     *      markets, and would not be used for remote-chain (isolated pool) deployments.
     */
    ICorePoolComptroller public immutable CORE_POOL_COMPTROLLER;

    /**
     * @notice Address of the `RiskStewardReceiver` used to validate and dispatch incoming updates.
     */
    IRiskStewardReceiver public immutable RISK_STEWARD_RECEIVER;

    /**
     * @dev Storage gap for upgradeability.
     */
    uint256[49] private __gap;

    /**
     * @notice Emitted when collateral factors are updated.
     */
    event CollateralFactorsUpdated(
        uint256 indexed updateId,
        address indexed market,
        uint256 newCollateralFactor,
        uint256 newLiquidationThreshold
    );

    /**
     * @notice Emitted when the safe delta bps is updated.
     */
    event SafeDeltaBpsUpdated(uint256 oldSafeDeltaBps, uint256 newSafeDeltaBps);

    /**
     * @notice Thrown when a `safeDeltaBps` value is greater than `MAX_BPS`.
     */
    error InvalidSafeDeltaBps();

    /**
     * @notice Thrown when Core Pool Comptroller.setCollateralFactor fails.
     */
    error SetCollateralFactorFailed(uint256 errorCode);

    /**
     * @notice Thrown when an update type that is not supported is operated on.
     */
    error UnsupportedUpdateType();

    /**
     * @notice Thrown when the update is not coming from the `RiskStewardReceiver`.
     */
    error OnlyRiskStewardReceiver();

    /**
     * @notice Thrown when the two uint256 data length is invalid
     */
    error InvalidTwoUintLength();

    /**
     * @notice Sets the immutable `CORE_POOL_COMPTROLLER` and `RISK_STEWARD_RECEIVER` addresses and disables initializers.
     * @param corePoolComptroller_ The address of the Core Pool Comptroller
     * @param riskStewardReceiver_ The address of the `RiskStewardReceiver`
     * @custom:error Throws ZeroAddressNotAllowed if any of the addresses are zero
     * @custom:oz-upgrades-unsafe-allow constructor
     */
    constructor(address corePoolComptroller_, address riskStewardReceiver_) {
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
     * @notice Sets the safe delta bps.
     * @param safeDeltaBps_ The new safe delta bps
     * @custom:access Controlled by AccessControlManager
     * @custom:event Emits SafeDeltaBpsUpdated with the old and new safe delta bps
     * @custom:error Throws InvalidSafeDeltaBps if the safe delta bps is greater than MAX_BPS
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
     * @notice Checks if an update is safe for direct execution (no timelock required).
     * @param update The update to check.
     * @return True if update is safe for direct execution, false if timelock is required
     * @custom:error Throws UnsupportedUpdateType if the update type is not supported
     */
    function isSafeForDirectExecution(RiskParameterUpdate calldata update) external view returns (bool) {
        // eMode-style updates always require timelock (not safe for direct execution)
        if (update.poolId != 0) return false;

        if (update.updateTypeKey == COLLATERAL_FACTORS_KEY) {
            address comptroller = ICorePoolVToken(update.market).comptroller();

            (uint256 newCF, uint256 newLT) = _decodeAbiEncodedTwoUint256(update.newValue);
            (uint256 currCF, uint256 currLT) = _getCurrentCollateralFactors(comptroller, update.market);

            // If current values are zero, update always requires timelock
            if (currCF == 0 || currLT == 0) return false;

            return _isWithinSafeDelta(newCF, currCF) && _isWithinSafeDelta(newLT, currLT);
        }

        revert UnsupportedUpdateType();
    }

    /**
     * @notice Applies a collateral parameter update from the `RiskStewardReceiver`.
     *         Delta validation and timelock checks are already performed by `RiskStewardReceiver` before execution.
     * @param update RiskParameterUpdate update to apply
     * @custom:access Only callable by the `RiskStewardReceiver`
     * @custom:event Emits CollateralFactorsUpdated with updateId
     * @custom:error Throws OnlyRiskStewardReceiver if the sender is not the `RiskStewardReceiver`
     * @custom:error Throws UnsupportedUpdateType if the update type is not supported
     */
    function applyUpdate(RiskParameterUpdate calldata update) external {
        if (msg.sender != address(RISK_STEWARD_RECEIVER)) {
            revert OnlyRiskStewardReceiver();
        }

        address comptroller = ICorePoolVToken(update.market).comptroller();
        uint96 poolId = update.poolId;

        if (update.updateTypeKey == COLLATERAL_FACTORS_KEY) {
            _updateCollateralFactors(update.updateId, comptroller, update.market, poolId, update.newValue);
        } else {
            revert UnsupportedUpdateType();
        }
    }

    /**
     * @notice Updates the collateral factors for the given market.
     * @dev Updates both collateral factor and liquidation threshold together (same setter).
     * @param updateId The update ID from the Risk Oracle
     * @param comptroller The comptroller address
     * @param market The market to update the collateral factors for
     * @param poolId The pool identifier for eMode updates (0 for regular market updates)
     * @param newValue Encoded new collateral factors: `abi.encode(uint256 newCollateralFactor, uint256 newLiquidationThreshold)`
     * @custom:event Emits CollateralFactorsUpdated with updateId
     */
    function _updateCollateralFactors(
        uint256 updateId,
        address comptroller,
        address market,
        uint96 poolId,
        bytes memory newValue
    ) internal {
        (uint256 newCollateralFactor, uint256 newLiquidationThreshold) = _decodeAbiEncodedTwoUint256(newValue);

        if (comptroller == address(CORE_POOL_COMPTROLLER)) {
            uint256 errorCode = ICorePoolComptroller(comptroller).setCollateralFactor(
                poolId,
                market,
                newCollateralFactor,
                newLiquidationThreshold
            );
            if (errorCode != 0) revert SetCollateralFactorFailed(errorCode);
        } else {
            if (poolId != 0) revert UnsupportedUpdateType();

            IIsolatedPoolsComptroller(comptroller).setCollateralFactor(
                market,
                newCollateralFactor,
                newLiquidationThreshold
            );
        }

        emit CollateralFactorsUpdated(updateId, market, newCollateralFactor, newLiquidationThreshold);
    }

    /**
     * @notice Returns the current collateral factors for a market on a given comptroller.
     * @dev Returns both collateral factor and liquidation threshold (updated together via the same setter).
     *      For core pool, uses eMode-specific getter which handles poolId == 0 as regular market.
     * @param comptroller The comptroller address
     * @param market The market whose collateral factors are being queried
     * @return currentCollateralFactor The current collateral factor
     * @return currentLiquidationThreshold The current liquidation threshold
     */
    function _getCurrentCollateralFactors(
        address comptroller,
        address market
    ) internal view returns (uint256 currentCollateralFactor, uint256 currentLiquidationThreshold) {
        if (comptroller == address(CORE_POOL_COMPTROLLER)) {
            (, currentCollateralFactor, , currentLiquidationThreshold, , , ) = ICorePoolComptroller(comptroller)
                .markets(market);
        } else {
            (, currentCollateralFactor, currentLiquidationThreshold) = IIsolatedPoolsComptroller(comptroller).markets(
                market
            );
        }
    }

    /**
     * @notice Decodes ABI-encoded bytes into two uint256 values.
     * @dev Expects exactly 64 bytes as produced by abi.encode(uint256,uint256).
     * @param data ABI-encoded (uint256, uint256) payload
     * @return a First uint256
     * @return b Second uint256
     */
    function _decodeAbiEncodedTwoUint256(bytes memory data) internal pure returns (uint256 a, uint256 b) {
        if (data.length != 64) {
            revert InvalidTwoUintLength();
        }

        (a, b) = abi.decode(data, (uint256, uint256));
    }
}
