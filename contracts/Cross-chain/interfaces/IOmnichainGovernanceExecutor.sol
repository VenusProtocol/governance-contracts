// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

interface IOmnichainGovernanceExecutor {
    /**
     * @notice Transfers ownership of the contract to the specified address
     * @param addr The address to which ownership will be transferred
     */
    function transferOwnership(address addr) external;
}
