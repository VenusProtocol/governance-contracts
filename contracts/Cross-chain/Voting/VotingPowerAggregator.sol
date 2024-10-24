// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;
import { IDataWarehouse } from "../interfaces/IDataWarehouse.sol";
import { SlotUtils } from "../../Utils/SlotUtils.sol";
import { StateProofVerifier } from "../libs/StateProofVerifier.sol";
import { ExcessivelySafeCall } from "@layerzerolabs/solidity-examples/contracts/libraries/ExcessivelySafeCall.sol";

import { NonblockingLzApp } from "@layerzerolabs/solidity-examples/contracts/lzApp/NonblockingLzApp.sol";
import { ensureNonzeroAddress } from "@venusprotocol/solidity-utilities/contracts/validators.sol";

import { Pausable } from "@openzeppelin/contracts/security/Pausable.sol";

contract VotingPowerAggregator is NonblockingLzApp, Pausable {
    using ExcessivelySafeCall for address;

    uint8 public constant CHECKPOINTS_SLOT = 16;
    uint8 public constant NUM_CHECKPOINTS_SLOT = 17;
    IDataWarehouse public warehouse;

    // Array of remote chain ids for iteration on mapping
    uint16[] public remoteChainIds;

    // remote identifier => chainId => blockHash
    mapping(uint256 => mapping(uint16 => bytes32)) public remoteBlockHash;

    // List of supported remote chain Id
    mapping(uint16 => bool) public isSupportedRemote;

    // Address of XVS vault wrt to chain Id
    mapping(uint16 => address) public  xvsVault;

    /**
     * @notice Emitted when proposal failed
     */
    event ReceivePayloadFailed(uint16 indexed remoteChainId, bytes indexed remoteAddress, uint64 nonce, bytes reason);

    /**
     * @notice Emitted when block hash of remote chain is received
     */
    event HashReceived(uint256 remoteIdentifier, uint16 remoteChainId, bytes blockHash);

    /**
     *  @notice Emitted when remote configurations are updated
     */
    event UpdateRemoteConfigurations(uint16 remoteChainId, address xvsVault, bool isSupported);

    constructor(address endpoint, address warehouseAddress) NonblockingLzApp(endpoint) {
        ensureNonzeroAddress(warehouseAddress);
        warehouse = IDataWarehouse(warehouseAddress);
    }

    /**
     * @notice Updates the configuration of remote chain ids, marking them as supported or unsupported and setting the corresponding XVS vault addresses
     * @param remoteChainId An array of remote chain ids to update
     * @param isSupported An array indicating whether each remote chain id is supported or not
     * @param xvsVaultAddress An array of XVS vault addresses corresponding to each remote chain id
     * @custom:access Only owner
     * @custom:emit UpdateRemoteConfigurations Emitted when the configuration of a remote chain id is updated, along with its vault address and support status
     */
    function updateRemoteConfigurations(
        uint16[] calldata remoteChainId,
        bool[] calldata isSupported,
        address[] calldata xvsVaultAddress
    ) external onlyOwner {
        for (uint16 i; i < remoteChainId.length; ++i) {
            ensureNonzeroAddress(xvsVaultAddress[i]);
            require(remoteChainId[i] != 0, "Invalid chain id");
            isSupportedRemote[remoteChainId[i]] = isSupported[i];
            if (isSupported[i]) {
                remoteChainIds.push(remoteChainId[i]);
                xvsVault[remoteChainId[i]] = xvsVaultAddress[i];
            } else {
                delete remoteChainIds[remoteChainId[i]];
                delete xvsVault[remoteChainId[i]];
            }

            emit UpdateRemoteConfigurations(remoteChainId[i], xvsVaultAddress[i], isSupported[i]);
        }
    }

    /**
     * @notice Calculates the total voting power of a voter across multiple remote chains
     * @param voter The address of the voter for whom to calculate the voting power
     * @param remoteIdentifier The identifier that links to remote chain-specific data
     * @param numCheckpointsProof The proof data needed to verify the number of checkpoints
     * @param checkpointsProof The proof data needed to verify the actual voting power from the checkpoints
     * @return power The total voting power of the voter across all supported remote chains
     */
    function getVotingPower(
        address voter,
        uint256 remoteIdentifier,
        bytes calldata numCheckpointsProof,
        bytes calldata checkpointsProof
    ) external view returns (uint96 power) {
        uint96 totalVotingPower;
        for (uint16 i; i < remoteChainIds.length; ++i) {
            totalVotingPower += _getVotingPower(
                remoteChainIds[i],
                remoteIdentifier,
                numCheckpointsProof,
                checkpointsProof,
                voter
            );
        }

        return totalVotingPower;
    }

    /**
     * @dev Calculates the total voting power of a voter for a remote chain
     * @param voter The address of the voter for whom to calculate the voting power
     * @param remoteIdentifier The identifier that links to remote chain-specific data
     * @param numCheckpointsProof The proof data needed to verify the number of checkpoints
     * @param checkpointsProof The proof data needed to verify the actual voting power from the checkpoints
     * @return power The total voting power of supported remote chains
     */
    function _getVotingPower(
        uint16 remoteChainId,
        uint256 remoteIdentifier,
        bytes calldata numCheckpointsProof,
        bytes calldata checkpointsProof,
        address voter
    ) internal view returns (uint96) {
        bytes32 blockHash = remoteBlockHash[remoteIdentifier][remoteChainId];
        address vault = xvsVault[remoteChainId];

        StateProofVerifier.SlotValue memory latestCheckpoint = warehouse.getStorage(
            vault,
            blockHash,
            SlotUtils.getAccountSlotHash(voter, NUM_CHECKPOINTS_SLOT),
            numCheckpointsProof
        );

        if (latestCheckpoint.exists) {
            StateProofVerifier.SlotValue memory votingPower = warehouse.getStorage(
                vault,
                blockHash,
                SlotUtils.getCheckpointSlotHash(voter, uint32(latestCheckpoint.value - 1), uint32(CHECKPOINTS_SLOT)),
                checkpointsProof
            );
            if (votingPower.exists) {
                return votingPower.value >> 32;
            }
            return 0;
        }
        return 0;
    }

    /**
     * @notice Process blocking LayerZero receive request
     * @param remoteChainId Remote chain Id
     * @param remoteAddress Remote address from which payload is received
     * @param nonce Nonce associated with the payload to prevent replay attacks
     * @param payload Encoded payload containing block hash and remote identifier of remote chains
     * @custom:event Emit ReceivePayloadFailed if call fails
     */
    function _blockingLzReceive(
        uint16 remoteChainId,
        bytes memory remoteAddress,
        uint64 nonce,
        bytes memory payload
    ) internal override {
        // remoteChainId should belongs to supported chainIds
        require(isSupportedRemote[remoteChainId], "source chain id not supported");
        bytes32 hashedPayload = keccak256(payload);
        bytes memory callData = abi.encodeCall(
            this.nonblockingLzReceive,
            (remoteChainId, remoteAddress, nonce, payload)
        );

        (bool success, bytes memory reason) = address(this).excessivelySafeCall(gasleft() - 30000, 150, callData);
        // try-catch all errors/exceptions
        if (!success) {
            failedMessages[remoteChainId][remoteAddress][nonce] = hashedPayload;
            emit ReceivePayloadFailed(remoteChainId, remoteAddress, nonce, reason); // Retrieve payload from the remote chain if needed to clear
        }
    }

    /**
     * @notice Process non blocking LayerZero receive request
     * @param payload Encoded payload containing block hash and remote identifier of remote chains
     * @custom:event Emit ProposalReceived
     */
    function _nonblockingLzReceive(
        uint16 remoteChainId,
        bytes memory,
        uint64,
        bytes memory payload
    ) internal override whenNotPaused {
        // remoteIdentifier is unique identifier generated at the time of createProposal
        (uint256 remoteIdentifier, bytes memory blockHash) = abi.decode(payload, (uint256, bytes));

        // Prevent Overriding hash
        require(remoteBlockHash[remoteIdentifier][remoteChainId] == bytes32(0), "block hash already exists");

        emit HashReceived(remoteIdentifier, remoteChainId, blockHash);
    }

    /**
     * @dev Removes a specified remote chain id from the list of supported remote chain ids.
     * @param remoteChainId The chain id to be removed from the list of supported remote chains.
     */
    function _removeRemoteChainId(uint16 remoteChainId) internal {
        uint256 length = remoteChainIds.length;
        for (uint256 i = 0; i < length; i++) {
            if (remoteChainIds[i] == remoteChainId) {
                remoteChainIds[i] = remoteChainIds[length - 1];
                remoteChainIds.pop();
                break;
            }
        }
    }
}
