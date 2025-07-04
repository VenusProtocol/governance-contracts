// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.25;

interface ILVToken {
    function comptroller() external view returns (address);
    function setReserveFactor(uint256) external;
    function reserveFactorMantissa() external view returns (uint256);
}
