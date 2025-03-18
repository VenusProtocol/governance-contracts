// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

interface IBlockHashDispatcher {
    function getHash(uint256 blockNumber, uint256 pId) external view returns (uint256, uint256, bytes32);
}
