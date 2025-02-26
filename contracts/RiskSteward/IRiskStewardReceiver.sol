// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.25;
import { IGovernorBravoDelegate } from "../Governance/GovernorBravoInterfacesV8.sol";
import { IOmnichainProposalSender } from "../Cross-chain/interfaces/IOmnichainProposalSender.sol";
import { IRiskOracle } from "../interfaces/IRiskOracle.sol";
import { IRiskSteward } from "./IRiskSteward.sol";

struct RiskParamConfig {
    bool active;
    uint256 debounce;
    IRiskSteward riskSteward;
}

interface IRiskStewardReceiver {
    function UPDATE_EXPIRATION_TIME() external returns (uint256);

    function initialize(address accessControlManager_) external;

    function setRiskParameterConfig(string calldata updateType, address riskSteward, uint256 debounce) external;

    function toggleConfigActive(string calldata updateType) external;
}

interface IRiskStewardSourceReceiver {
    function processUpdateById(uint256 updateId) external;

    function processUpdateByParameterAndMarket(string memory updateType, address market) external;
}

interface IRiskStewardDestinationReceiver {
    function processUpdate(uint256 updateId, bytes calldata newValue, string calldata updateType, address market, bytes calldata additionalData, uint256 timestamp) external;
}