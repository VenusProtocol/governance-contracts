// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

interface IVotingPowerAggregator {
   
/**
     * @notice Transfers ownership of the contract to the specified address
     * @param addr The address to which ownership will be transferred
     */
    function transferOwnership(address addr) external;

    /**
     * @notice Sets the destination contract address
     * @param destChainId The LayerZero id of a source chain
     * @param destAddress The address of the contract on the source chain
     */
    function setPeer(uint16 destChainId, bytes32 destAddress) external;

}
