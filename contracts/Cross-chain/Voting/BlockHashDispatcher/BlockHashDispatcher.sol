// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "./BlockHashDispatcherBase.sol";

/**
 * @title BlockHashDispatcher
 * @notice Common BlockHashDispatcherBase using blockhash().
 */
contract BlockHashDispatcher is BlockHashDispatcherBase {
    constructor(
        address endpoint_,
        address owner_,
        uint32 bnbChainEId_,
        uint32 chainId_
    ) BlockHashDispatcherBase(endpoint_, owner_, bnbChainEId_, chainId_) {}

    function getBlockHash(uint256 blockNumber) public view override returns (bytes32 blockHash) {
        blockHash = blockNumToHash[blockNumber];
        if (blockHash == bytes32(0)) {
            blockHash = blockhash(blockNumber);
        }
    }
}
