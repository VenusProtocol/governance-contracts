// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.25;

interface IVToken {
    function comptroller() external view returns (address);
}
