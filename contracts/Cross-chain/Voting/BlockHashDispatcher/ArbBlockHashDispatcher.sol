// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "./BlockHashDispatcherBase.sol";

/**
 * @title IArbSys
 * @notice Interface for the ArbSys's preCompiled Contract for, `arbBlockHash()` function.
 */

interface ArbSys {
    function arbBlockHash(uint256) external view returns (bytes32);
}

/**
 * @title ArbBlockHashDispatcher
 * @notice Arbitrum-specific implementation of BlockHashDispatcherBase using ArbSys.
 */
contract ArbBlockHashDispatcher is BlockHashDispatcherBase {
    ArbSys public constant arbsys = ArbSys(address(100));

    constructor(
        address endpoint_,
        address owner_,
        uint32 bnbChainEId_,
        uint32 chainId_
    ) BlockHashDispatcherBase(endpoint_, owner_, bnbChainEId_, chainId_) {}

    function getBlockHash(uint256 blockNumber) public view override returns (bytes32 blockHash) {
        blockHash = blockNumToHash[blockNumber];
        if (blockHash == bytes32(0)) {
            blockHash = arbsys.arbBlockHash(blockNumber);
        }
    }
}
