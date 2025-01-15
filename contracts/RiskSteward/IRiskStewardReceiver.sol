// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.25;
import { IRiskOracle } from "../interfaces/IRiskOracle.sol";
import { ICorePoolComptroller } from "../interfaces/ICorePoolComptroller.sol";

struct RiskParamConfig {
    bool active;
    uint256 debounce;
    uint256 maxIncreaseBps;
    bool isRelative;
}

interface IRiskStewardReceiver {
    function RISK_ORACLE() external view returns (IRiskOracle);

    function CORE_POOL_COMPTROLLER() external view returns (ICorePoolComptroller);

    function initialize() external;

    function setRiskParameterConfig(
        string calldata updateType,
        uint256 debounce,
        uint256 maxIncreaseBps,
        bool isRelative
    ) external;

    function getRiskParameterConfig(string calldata updateType) external view returns (RiskParamConfig memory);

    function toggleConfigActive(string calldata updateType) external;

    function processUpdateById(uint256 updateId) external;

    function processUpdateByParameterAndMarket(string memory updateType, address market) external;
}
