// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.25;

import { ICorePoolVToken } from "../interfaces/ICorePoolVToken.sol";

contract MockComptroller {
    /// @notice Mapping of vToken addresses to their supply caps
    mapping(address => uint256) public supplyCaps;

    /// @notice Mapping of vToken addresses to their borrow caps
    mapping(address => uint256) public borrowCaps;

    /// @notice Array of all vTokens
    ICorePoolVToken[] public allVTokens;

    /// @notice Mapping of vToken addresses to boolean indicating if they are listed
    mapping(address => bool) public vTokenListed;

    /// @notice Mapping of vToken addresses to their collateral factors
    mapping(address => uint256) internal _collateralFactorMantissa;

    /// @notice Mapping of vToken addresses to their liquidation thresholds
    mapping(address => uint256) internal _liquidationThresholdMantissa;

    /**
     * @notice Add a new vToken to be tracked
     * @param vToken The vToken to add
     */
    function supportMarket(address vToken) external {
        require(!vTokenListed[vToken], "vToken already listed");
        vTokenListed[address(vToken)] = true;
        allVTokens.push(ICorePoolVToken(vToken));
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
     * @notice Get all vTokens
     * @return Array of vToken addresses
     */
    function getAllMarkets() external view returns (address[] memory) {
        address[] memory markets = new address[](allVTokens.length);
        for (uint256 i = 0; i < allVTokens.length; i++) {
            markets[i] = address(allVTokens[i]);
        }
        return markets;
    }

    /**
     * @notice Set the collateral factor and liquidation threshold for a vToken
     * @param vToken The vToken address
     * @param newCollateralFactorMantissa The new collateral factor mantissa
     * @param newLiquidationThresholdMantissa The new liquidation threshold mantissa
     */
    function setCollateralFactor(
        address vToken,
        uint256 newCollateralFactorMantissa,
        uint256 newLiquidationThresholdMantissa
    ) external {
        require(vTokenListed[vToken], "vToken not listed");
        _collateralFactorMantissa[vToken] = newCollateralFactorMantissa;
        _liquidationThresholdMantissa[vToken] = newLiquidationThresholdMantissa;
    }

    /**
     * @notice Get market information for a vToken
     * @param vToken The vToken address
     * @return isListed Whether the vToken is listed
     * @return collateralFactorMantissa The collateral factor mantissa
     * @return liquidationThresholdMantissa The liquidation threshold mantissa
     */
    function markets(
        address vToken
    ) external view returns (bool isListed, uint256 collateralFactorMantissa, uint256 liquidationThresholdMantissa) {
        isListed = vTokenListed[vToken];
        collateralFactorMantissa = _collateralFactorMantissa[vToken];
        liquidationThresholdMantissa = _liquidationThresholdMantissa[vToken];
    }
}
