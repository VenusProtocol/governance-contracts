// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.25;

import "../interfaces/IVToken.sol";

contract MockCoreVToken is IVToken {
    address public override comptroller;
    uint256 public reserveFactorMantissa;

    constructor(address _comptroller) {
        comptroller = _comptroller;
    }
    function _setReserveFactor(uint256 newReserveFactorMantissa) external {
        reserveFactorMantissa = newReserveFactorMantissa;
    }
}
