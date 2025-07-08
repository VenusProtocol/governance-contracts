// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.25;

interface IRiskSteward {
    function decodeAdditionalData(
        bytes calldata additionalData
    ) external pure returns (address underlying, uint32 destChainId);

    function processUpdate(uint256 updateId, bytes memory newValue, string memory updateType, address market) external;

    function validateUpdate(
        uint256 updateId,
        bytes memory newValue,
        string memory updateType,
        address market
    ) external view returns (bool);

    function packNewValue(bytes memory data) external pure returns (bytes memory);
}
