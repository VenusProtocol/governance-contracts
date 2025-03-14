// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.25;
import { IRiskOracle } from "../interfaces/IRiskOracle.sol";
import { IRiskSteward } from "./IRiskSteward.sol";

struct RiskParamConfig {
    bool active;
    uint256 debounce;
    IRiskSteward riskSteward;
}

interface IRiskStewardRemoteReceiver {
    function initialize(address accessControlManager_) external;

    function processUpdateById(uint256 updateId) external;

    function processUpdateByParameterAndMarket(string memory updateType, address market) external;
}
