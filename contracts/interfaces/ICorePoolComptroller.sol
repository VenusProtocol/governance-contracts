// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.25;

interface ICorePoolComptroller {
    function borrowCaps(address) external view returns (uint256);

    function supplyCaps(address) external view returns (uint256);

    function _setMarketSupplyCaps(address[] calldata, uint256[] calldata) external;

    function _setMarketBorrowCaps(address[] calldata, uint256[] calldata) external;

    function setMarketSupplyCaps(address[] calldata, uint256[] calldata) external;

    function setMarketBorrowCaps(address[] calldata, uint256[] calldata) external;

    function getAllMarkets() external view returns (address[] memory);

    function setCollateralFactor(
        uint96 poolId,
        address vToken,
        uint256 newCollateralFactorMantissa,
        uint256 newLiquidizationThresholdMantissa
    ) external returns (uint256);

    function setCollateralFactor(
        address vToken,
        uint256 newCollateralFactorMantissa,
        uint256 newLiquidationThresholdMantissa
    ) external returns (uint256);

    function markets(
        address
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
        );

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
        );
}
