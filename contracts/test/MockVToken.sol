// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.25;

import "../interfaces/IVToken.sol";

contract MockVToken is IVToken {
    address public override comptroller;

    constructor(address _comptroller) {
        comptroller = _comptroller;
    }
}
