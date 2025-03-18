// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

library SlotUtils {
    /**
     * @notice method to calculate the slot hash of the a mapping indexed by account
     * @param account address of the balance holder
     * @param balanceMappingPosition base position of the storage slot of the balance on a token contract
     * @return the slot hash
     */
    function getAccountSlotHash(address account, uint256 balanceMappingPosition) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(bytes32(uint256(uint160(account))), balanceMappingPosition));
    }

    /**
     * @notice method to calculate the slot hash of the a mapping indexed by voter and chainId
     * @param voter address of the voter
     * @param numCheckpoint id of the chain of the votingMachine
     * @param representativesMappingPosition base position of the storage slot of the representatives on governance contract
     * @return the slot hash
     * @dev mapping(address => mapping(uint256 => address))
     */
    function getCheckpointSlotHash(
        address voter,
        uint32 numCheckpoint,
        uint32 representativesMappingPosition
    ) internal pure returns (bytes32) {
        bytes memory firstLevelEncoded = abi.encode(bytes32(uint256(uint160(voter))), representativesMappingPosition);

        bytes memory secondLevelEncoded = abi.encode(numCheckpoint);

        return keccak256(abi.encodePacked(secondLevelEncoded, (keccak256(firstLevelEncoded))));
    }
}
