// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.25;

import { InterestRateModel } from "@venusprotocol/isolated-pools/contracts/InterestRateModel.sol";

interface IVToken {
    function comptroller() external view returns (address);
    function setInterestRateModel(InterestRateModel newInterestRateModel) external;
}
