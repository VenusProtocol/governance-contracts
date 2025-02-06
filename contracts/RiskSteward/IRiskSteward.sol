// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.25;

import { RiskParameterUpdate } from "../interfaces/IRiskOracle.sol";

interface IRiskSteward {

    function decodeAdditionalData(bytes calldata additionalData) external pure returns (address underlying, uint16 destChainId);

    function processUpdate(RiskParameterUpdate calldata update) external;

    function packNewValue(bytes memory data) external pure returns (bytes memory);
}
