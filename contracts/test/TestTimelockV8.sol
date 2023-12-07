// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.13;
import { TimelockV8 } from "../Governance/TimelockV8.sol";

contract TestTimelockV8 is TimelockV8 {
    constructor(address admin_, uint256 delay_) public TimelockV8(admin_, delay_) {}

    function GRACE_PERIOD() public view override returns (uint256) {
        return 1;
    }

    function MINIMUM_DELAY() public view override returns (uint256) {
        return 1;
    }

    function MAXIMUM_DELAY() public view override returns (uint256) {
        return 1 hours;
    }
}
