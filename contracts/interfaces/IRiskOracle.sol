// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

struct RiskParameterUpdate {
    uint256 timestamp; // Timestamp of the update
    bytes newValue; // Encoded parameters, flexible for various data types
    string referenceId; // External reference, potentially linking to a document or off-chain data
    bytes previousValue; // Previous value of the parameter for historical comparison
    string updateType; // Classification of the update for validation purposes
    uint256 updateId; // Unique identifier for this specific update
    address market; // Address for market of the parameter update
    bytes additionalData; // Additional data for the update
}

interface IRiskOracle {
    function addAuthorizedSender(address sender) external;

    function removeAuthorizedSender(address sender) external;

    function addUpdateType(string memory newUpdateType) external;

    function publishRiskParameterUpdate(
        string memory referenceId,
        bytes memory newValue,
        string memory updateType,
        address market,
        bytes memory additionalData
    ) external;

    function publishBulkRiskParameterUpdates(
        string[] memory referenceIds,
        bytes[] memory newValues,
        string[] memory updateTypes,
        address[] memory markets,
        bytes[] memory additionalData
    ) external;

    function getAllUpdateTypes() external view returns (string[] memory);

    function getLatestUpdateByParameterAndMarket(
        string memory updateType,
        address market
    ) external view returns (RiskParameterUpdate memory);

    function getUpdateById(uint256 updateId) external view returns (RiskParameterUpdate memory);

    function isAuthorized(address sender) external view returns (bool);
}
