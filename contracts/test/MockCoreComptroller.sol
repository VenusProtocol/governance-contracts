// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.25;

import { IVToken } from "../interfaces/IVToken.sol";

contract MockCoreComptroller {
    /// @notice Mapping of vToken addresses to their supply caps
    mapping(address => uint256) public supplyCaps;

    /// @notice Mapping of vToken addresses to their borrow caps
    mapping(address => uint256) public borrowCaps;

    /// @notice Mapping of vToken addresses to their collateral factors (poolId 0 = regular market)
    mapping(address => uint256) internal _collateralFactorMantissa;

    /// @notice Mapping of vToken addresses to their liquidation thresholds (poolId 0 = regular market)
    mapping(address => uint256) internal _liquidationThresholdMantissa;

    /// @notice Mapping of (poolId, vToken) to eMode collateral factors
    mapping(uint96 => mapping(address => uint256)) internal _eModeCollateralFactorMantissa;

    /// @notice Mapping of (poolId, vToken) to eMode liquidation thresholds
    mapping(uint96 => mapping(address => uint256)) internal _eModeLiquidationThresholdMantissa;

    /// @notice Array of all vTokens
    IVToken[] public allVTokens;

    /// @notice Mapping of vToken addresses to boolean indicating if they are listed
    mapping(address => bool) public vTokenListed;

    /**
     * @notice Add a new vToken to be tracked
     * @param vToken The vToken to add
     */
    function supportMarket(address vToken) external {
        require(!vTokenListed[vToken], "vToken already listed");
        vTokenListed[address(vToken)] = true;
        allVTokens.push(IVToken(vToken));
    }

    /**
     * @notice Set the supply cap for a vToken
     * @param vTokens The vToken addresses
     * @param newCaps The new supply caps
     */
    function setMarketSupplyCaps(address[] calldata vTokens, uint256[] calldata newCaps) external {
        uint256 numMarkets = vTokens.length;
        uint256 numSupplyCaps = newCaps.length;

        require(numMarkets != 0 && numMarkets == numSupplyCaps, "invalid input");

        for (uint256 i; i < numMarkets; ++i) {
            require(vTokenListed[vTokens[i]], "vToken not listed");
            supplyCaps[address(vTokens[i])] = newCaps[i];
        }
    }

    /**
     * @notice Set the borrow cap for a vToken
     * @param vTokens The vToken addresses
     * @param newCaps The new borrow caps
     */
    function setMarketBorrowCaps(address[] calldata vTokens, uint256[] calldata newCaps) external {
        uint256 numMarkets = vTokens.length;
        uint256 numBorrowCaps = newCaps.length;

        require(numMarkets != 0 && numMarkets == numBorrowCaps, "invalid input");

        for (uint256 i; i < numMarkets; ++i) {
            require(vTokenListed[vTokens[i]], "vToken not listed");
            borrowCaps[address(vTokens[i])] = newCaps[i];
        }
    }

    /**
     * @notice Set the collateral factor and liquidation threshold for a vToken
     * @param poolId The pool ID (0 for regular markets, >0 for eMode groups)
     * @param vToken The vToken address
     * @param newCollateralFactorMantissa The new collateral factor
     * @param newLiquidationThresholdMantissa The new liquidation threshold
     * @return Always returns 0
     */
    function setCollateralFactor(
        uint96 poolId,
        address vToken,
        uint256 newCollateralFactorMantissa,
        uint256 newLiquidationThresholdMantissa
    ) external returns (uint256) {
        require(vTokenListed[vToken], "vToken not listed");
        if (poolId == 0) {
            _collateralFactorMantissa[vToken] = newCollateralFactorMantissa;
            _liquidationThresholdMantissa[vToken] = newLiquidationThresholdMantissa;
        } else {
            _eModeCollateralFactorMantissa[poolId][vToken] = newCollateralFactorMantissa;
            _eModeLiquidationThresholdMantissa[poolId][vToken] = newLiquidationThresholdMantissa;
        }
        return 0;
    }

    /**
     * @notice Get market information (for compatibility with ICorePoolComptroller interface)
     * @param vToken The vToken address
     * @return isListed Whether the market is listed
     * @return collateralFactorMantissa The collateral factor
     * @return isVenus Whether it's a Venus market
     * @return liquidationThresholdMantissa The liquidation threshold
     * @return liquidationIncentiveMantissa The liquidation incentive
     * @return marketPoolId The pool ID
     * @return isBorrowAllowed Whether borrowing is allowed
     */
    function markets(
        address vToken
    )
        external
        view
        returns (
            bool isListed,
            uint256 collateralFactorMantissa,
            bool isVenus,
            uint256 liquidationThresholdMantissa,
            uint256 liquidationIncentiveMantissa,
            uint96 marketPoolId,
            bool isBorrowAllowed
        )
    {
        isListed = vTokenListed[vToken];
        collateralFactorMantissa = _collateralFactorMantissa[vToken];
        isVenus = false;
        liquidationThresholdMantissa = _liquidationThresholdMantissa[vToken];
        liquidationIncentiveMantissa = 0;
        marketPoolId = 0;
        isBorrowAllowed = true;
    }

    /**
     * @notice Get eMode pool market information (for compatibility with ICorePoolComptroller interface)
     * @param poolId The eMode pool ID
     * @param vToken The vToken address
     * @return isListed Whether the market is listed
     * @return collateralFactorMantissa The collateral factor
     * @return isVenus Whether it's a Venus market
     * @return liquidationThresholdMantissa The liquidation threshold
     * @return liquidationIncentiveMantissa The liquidation incentive
     * @return marketPoolId The pool ID
     * @return isBorrowAllowed Whether borrowing is allowed
     */
    function poolMarkets(
        uint96 poolId,
        address vToken
    )
        external
        view
        returns (
            bool isListed,
            uint256 collateralFactorMantissa,
            bool isVenus,
            uint256 liquidationThresholdMantissa,
            uint256 liquidationIncentiveMantissa,
            uint96 marketPoolId,
            bool isBorrowAllowed
        )
    {
        isListed = vTokenListed[vToken];
        collateralFactorMantissa = _eModeCollateralFactorMantissa[poolId][vToken];
        isVenus = false;
        liquidationThresholdMantissa = _eModeLiquidationThresholdMantissa[poolId][vToken];
        liquidationIncentiveMantissa = 0;
        marketPoolId = poolId;
        isBorrowAllowed = true;
    }

    /**
     * @notice Get all vTokens
     * @return Array of vToken addresses
     */
    function getAllMarkets() external view returns (IVToken[] memory) {
        return allVTokens;
    }
}
