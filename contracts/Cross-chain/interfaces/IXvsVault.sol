// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

interface IXvsVault {
    function getPriorVotes(address account, uint blockNumber) external view returns (uint96);
}
