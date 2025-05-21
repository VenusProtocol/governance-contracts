// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.25;

interface IIsolatedPoolsComptroller {
    function borrowCaps(address) external view returns (uint256);

    function supplyCaps(address) external view returns (uint256);

    function setMarketSupplyCaps(address[] calldata, uint256[] calldata) external;

    function setMarketBorrowCaps(address[] calldata, uint256[] calldata) external;
}
