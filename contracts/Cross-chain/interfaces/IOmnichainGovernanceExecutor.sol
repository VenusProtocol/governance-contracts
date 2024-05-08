// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

interface IOmnichainGovernanceExecutor {
    /**
     * @notice Transfers ownership of the contract to the specified address
     * @param addr The address to which ownership will be transferred
     */
    function transferOwnership(address addr) external;

    /**
     * @notice Sets the source message sender address
     * @param srcChainId_ The LayerZero id of a source chain
     * @param srcAddress_ The address of the contract on the source chain
     */
    function setTrustedRemoteAddress(uint16 srcChainId_, bytes calldata srcAddress_) external;
}
