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
 * @title SupplyPauseSteward
 * @author Venus
 * @notice Pauses supply to a market on updates from its receiver: pauses MINT and sets the collateral factor to 0,
 *         keeping the liquidation threshold. On the source chain every update applies at once; a destination chain
 *         delays every update. Lifting the pause is left to governance.
 * @custom:security-contact https://github.com/VenusProtocol/governance-contracts#discussion
 */
contract SupplyPauseSteward is BaseRiskSteward {
    /**
     * @notice The update type for pausing supply
     */
    string public constant SUPPLY_PAUSE = "supplyPause";

    /**
     * @notice The update type key for pausing supply (keccak256 hash of SUPPLY_PAUSE)
     */
    bytes32 public constant SUPPLY_PAUSE_KEY = keccak256(bytes(SUPPLY_PAUSE));

    /// @dev The MINT action ID in the comptrollers' `Action` enum
    uint8 internal constant MINT_ACTION = 0;

    /**
     * @notice The BNB Core Pool Comptroller, whose markets use a different ABI; unset on chains without it
     */
    ICorePoolComptroller public immutable CORE_POOL_COMPTROLLER;

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
     * @notice Emitted when supply is paused on a market
     */
    event SupplyPaused(uint256 indexed updateId, address indexed market, uint96 poolId);

    /**
     * @notice Thrown when the update type is not SUPPLY_PAUSE
     */
    error UnsupportedUpdateType();

    /**
     * @notice Thrown when `applyUpdate` is not called by the receiver
     */
    error OnlyRiskStewardReceiver();

    /**
     * @notice Thrown when MINT is already paused and the collateral factor is already 0
     */
    error RedundantValue();

    /**
     * @notice Thrown when an update for a market outside the Core Pool has a pool ID
     */
    error InvalidPool();

    /**
     * @notice Thrown when the Core Pool Comptroller's `setCollateralFactor` returns an error code
     */
    error SetCollateralFactorFailed(uint256 errorCode);

    /**
     * @notice Sets the Core Pool Comptroller and the receiver, and disables initializers
     * @param corePoolComptroller_ The Core Pool Comptroller, or zero on chains without it
     * @param riskStewardReceiver_ The receiver: RiskStewardReceiver, or DestinationStewardReceiver on remote chains
     * @custom:error Throws ZeroAddressNotAllowed if the receiver address is zero
     * @custom:oz-upgrades-unsafe-allow constructor
     */
    constructor(address corePoolComptroller_, address riskStewardReceiver_) {
        ensureNonzeroAddress(riskStewardReceiver_);
        CORE_POOL_COMPTROLLER = ICorePoolComptroller(corePoolComptroller_);
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
     * @notice Applies a supply pause from the receiver
     * @param update The update to apply; on the Core Pool its pool ID picks the pool whose collateral factor is set
     * @custom:access Only the receiver
     * @custom:event Emits SupplyPaused with the updateId, market and pool ID
     * @custom:error Throws OnlyRiskStewardReceiver if the caller is not the receiver
     * @custom:error Throws UnsupportedUpdateType if the update type is not supported
     * @custom:error Throws InvalidPool if an update for a market outside the Core Pool has a pool ID
     * @custom:error Throws SetCollateralFactorFailed if the Core Pool Comptroller returns an error code
     */
    function applyUpdate(RiskParameterUpdate calldata update) external {
        if (msg.sender != address(RISK_STEWARD_RECEIVER)) {
            revert OnlyRiskStewardReceiver();
        }
        if (update.updateTypeKey != SUPPLY_PAUSE_KEY) {
            revert UnsupportedUpdateType();
        }

        address comptroller = ICorePoolVToken(update.market).comptroller();
        _pauseSupply(update.updateId, comptroller, update.market, update.poolId);
    }

    /**
     * @notice Checks if an update is safe for direct execution (no timelock required)
     * @dev A supply pause is always safe
     * @param update The update to check
     * @return Always true
     * @custom:error Throws UnsupportedUpdateType if the update type is not supported
     * @custom:error Throws RedundantValue if MINT is already paused and the collateral factor is already 0
     */
    function isSafeForDirectExecution(RiskParameterUpdate calldata update) external view returns (bool) {
        if (update.updateTypeKey != SUPPLY_PAUSE_KEY) {
            revert UnsupportedUpdateType();
        }

        address comptroller = ICorePoolVToken(update.market).comptroller();
        (uint256 currCF, ) = _getCurrentCollateralFactors(comptroller, update.market, update.poolId);

        if (currCF == 0 && ICorePoolComptroller(comptroller).actionPaused(update.market, MINT_ACTION)) {
            revert RedundantValue();
        }

        return true;
    }

    /**
     * @notice Sets the market's collateral factor to 0, keeping its liquidation threshold, and pauses MINT on it
     * @param updateId The update ID from the Risk Oracle
     * @param comptroller The comptroller address
     * @param market The market to pause supply on
     * @param poolId The Core Pool's pool whose collateral factor is set (0 for other comptrollers)
     * @custom:event Emits SupplyPaused with the updateId, market and pool ID
     * @custom:error Throws SetCollateralFactorFailed if the Core Pool Comptroller returns an error code
     * @custom:error Throws InvalidPool if a non-Core comptroller is used together with a non-zero poolId
     */
    function _pauseSupply(uint256 updateId, address comptroller, address market, uint96 poolId) internal {
        (, uint256 liquidationThreshold) = _getCurrentCollateralFactors(comptroller, market, poolId);

        if (comptroller == address(CORE_POOL_COMPTROLLER)) {
            uint256 errorCode = ICorePoolComptroller(comptroller).setCollateralFactor(
                poolId,
                market,
                0,
                liquidationThreshold
            );
            if (errorCode != 0) revert SetCollateralFactorFailed(errorCode);
        } else {
            if (poolId != 0) revert InvalidPool();

            IIsolatedPoolsComptroller(comptroller).setCollateralFactor(market, 0, liquidationThreshold);
        }

        address[] memory markets = new address[](1);
        markets[0] = market;
        uint8[] memory actions = new uint8[](1);
        actions[0] = MINT_ACTION;
        // Core, isolated and spoke pools share the same `setActionsPaused` signature.
        ICorePoolComptroller(comptroller).setActionsPaused(markets, actions, true);

        emit SupplyPaused(updateId, market, poolId);
    }

    /**
     * @notice Returns the current collateral factors for a market on a given comptroller
     * @param comptroller The comptroller address
     * @param market The market whose collateral factors are being queried
     * @param poolId The Core Pool's pool to read (ignored by other comptrollers)
     * @return currentCollateralFactor The current collateral factor
     * @return currentLiquidationThreshold The current liquidation threshold
     */
    function _getCurrentCollateralFactors(
        address comptroller,
        address market,
        uint96 poolId
    ) internal view returns (uint256 currentCollateralFactor, uint256 currentLiquidationThreshold) {
        if (comptroller == address(CORE_POOL_COMPTROLLER)) {
            (, currentCollateralFactor, , currentLiquidationThreshold, , , ) = ICorePoolComptroller(comptroller)
                .poolMarkets(poolId, market);
        } else {
            (, currentCollateralFactor, currentLiquidationThreshold) = IIsolatedPoolsComptroller(comptroller).markets(
                market
            );
        }
    }
}
