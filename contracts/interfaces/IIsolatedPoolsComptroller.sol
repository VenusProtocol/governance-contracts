// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.25;

interface IIsolatedPoolsComptroller {
    function borrowCaps(address) external view returns (uint256);

    function supplyCaps(address) external view returns (uint256);

    function setMarketSupplyCaps(address[] calldata, uint256[] calldata) external;

    function setMarketBorrowCaps(address[] calldata, uint256[] calldata) external;

    function getAllMarkets() external view returns (address[] memory);

    function setCollateralFactor(
        address vToken,
        uint256 newCollateralFactorMantissa,
        uint256 newLiquidationThresholdMantissa
    ) external;

    function markets(
        address vToken
    ) external view returns (bool isListed, uint256 collateralFactorMantissa, uint256 liquidationThresholdMantissa);
}
