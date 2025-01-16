// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.25;
import { IRiskOracle } from "../interfaces/IRiskOracle.sol";

struct RiskParamConfig {
    bool active;
    uint256 debounce;
    address riskSteward;
}

interface IRiskStewardReceiver {
    function RISK_ORACLE() external view returns (IRiskOracle);

    function initialize(address accessControlManager_) external;

    function setRiskParameterConfig(string calldata updateType, address riskSteward, uint256 debounce) external;

    function getRiskParameterConfig(string calldata updateType) external view returns (RiskParamConfig memory);

    function toggleConfigActive(string calldata updateType) external;

    function processUpdateById(uint256 updateId) external;

    function processUpdateByParameterAndMarket(string memory updateType, address market) external;
}
