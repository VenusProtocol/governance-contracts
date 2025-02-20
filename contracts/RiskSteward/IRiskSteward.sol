// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.25;

import { RiskParameterUpdate } from "../interfaces/IRiskOracle.sol";
import { ICorePoolComptroller } from "../interfaces/ICorePoolComptroller.sol";

interface IRiskSteward {
    function CORE_POOL_COMPTROLLER() external view returns (ICorePoolComptroller);

    function initialize(address accessControlManager_, uint256 maxIncreaseBps_) external;

    function processUpdate(RiskParameterUpdate calldata update) external;
}
