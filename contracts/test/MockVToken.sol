// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.25;

import { InterestRateModel } from "@venusprotocol/isolated-pools/contracts/InterestRateModel.sol";
import { InterestRateModelV8 } from "@venusprotocol/venus-protocol/contracts/InterestRateModels/InterestRateModelV8.sol";

interface IVToken {
    function comptroller() external view returns (address);
}

contract MockVToken is IVToken {
    address public override comptroller;
    address public interestRateModel;

    constructor(address _comptroller) {
        comptroller = _comptroller;
    }

    function setInterestRateModel(InterestRateModel newInterestRateModel) external {
        interestRateModel = address(newInterestRateModel);
    }

    function _setInterestRateModel(InterestRateModelV8 newInterestRateModel) external returns (uint) {
        interestRateModel = address(newInterestRateModel);
        return 0;
    }
}
