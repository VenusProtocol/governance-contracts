// SPDX-License-Identifier: BSD-3-Clause
pragma solidity ^0.8.25;

/**
 * @title IVaultAggregator
 * @author Venus
 * @dev Interface for Vault Aggregator contract
 */
interface IVaultAggregator {
    /**
     * @notice Return accumulated votes of account
     * @param account Address of user
     * @param blockNumberOrTimestamp Block number or timestamp
     * @param weights Weights of supported tokens
     * @return Aggregated votes of user
     */
    function getPriorVotes(
        address account,
        uint256 blockNumberOrTimestamp,
        uint8[] calldata weights
    ) external view returns (uint96);
}
