// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.25;

import { RiskParameterUpdate } from "./IRiskOracle.sol";
import { IRiskStewardReceiver } from "./IRiskStewardReceiver.sol";

interface IRiskSteward {
    // View functions
    function safeDeltaBps() external view returns (uint256);

    function RISK_STEWARD_RECEIVER() external view returns (IRiskStewardReceiver);

    function SUPPLY_CAP() external view returns (string memory);

    function BORROW_CAP() external view returns (string memory);

    // State-changing functions
    function initialize(address accessControlManager_, uint256 safeDeltaBps_) external;

    function setSafeDeltaBps(uint256 safeDeltaBps_) external;

    function isWithinSafeDelta(RiskParameterUpdate calldata update) external view returns (bool);

    function processUpdate(RiskParameterUpdate calldata update) external;
}
