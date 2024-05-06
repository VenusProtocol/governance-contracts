// SPDX-License-Identifier: BSD-3-Clause

pragma solidity ^0.8.25;

interface IVault {
    /**
     * @notice Determine the token stake balance for an account
     * @param account The address of the account to check
     * @param blockNumberOrSecond The block number or second to get the vote balance at
     */
    function getPriorVotes(address account, uint256 blockNumberOrSecond) external view returns (uint96);
}
