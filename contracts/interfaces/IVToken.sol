// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.25;

import { InterestRateModelV8 } from "@venusprotocol/venus-protocol/contracts/InterestRateModels/InterestRateModelV8.sol";

interface IVToken {
    function comptroller() external view returns (address);
    function _setInterestRateModel(InterestRateModelV8 newInterestRateModel) external returns (uint);
}
