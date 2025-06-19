// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.25;

interface ICorePoolComptroller {
    function borrowCaps(address) external view returns (uint256);

    function supplyCaps(address) external view returns (uint256);

    function _setMarketSupplyCaps(address[] calldata, uint256[] calldata) external;

    function _setMarketBorrowCaps(address[] calldata, uint256[] calldata) external;

    function _setCollateralFactor(address, uint256) external;

    function markets(address) external view returns (bool isListed, uint256 collateralFactorMantissa, bool isVenus);
}
