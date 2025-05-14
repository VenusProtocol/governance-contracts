// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.25;
import { IRiskSteward } from "./IRiskSteward.sol";

struct RiskParamConfig {
    bool active;
    uint256 debounce;
    IRiskSteward riskSteward;
}

interface IRiskStewardReceiver {
    function UPDATE_EXPIRATION_TIME() external returns (uint256);

    function setRiskParameterConfig(string calldata updateType, address riskSteward, uint256 debounce) external;

    function toggleConfigActive(string calldata updateType) external;
}

interface IRiskStewardDestinationReceiver {
    function processUpdate(
        uint256 updateId,
        bytes calldata newValue,
        string calldata updateType,
        address market,
        bytes calldata additionalData,
        uint256 timestamp
    ) external;
}
